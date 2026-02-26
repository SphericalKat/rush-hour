from pathlib import Path

import pdfplumber

from .models import Stop, Timetable, Train

# Cells with these values mean the train does not stop here
_NO_STOP = {"", "…", "..."}

# Canonical station names. Keys are lowercase for case-insensitive lookup.
_CANONICAL: dict[str, str] = {
    "bhivpuri road": "Bhivpuri Road",
    "currey road": "Currey Road",
    "diwa": "Diva",
    "kanjur marg": "Kanjur Marg",
    "sandhurst road": "Sandhurst Road",
    "ulhas nagar": "Ulhas Nagar",
    "umbermalli": "Umbermali",
}


def _normalize_station(name: str) -> str:
    return _CANONICAL.get(name.lower(), name)


def _parse_train_header(cell: str) -> list[tuple[str, str, bool]]:
    """Parse a column header cell into a list of (number, code, is_ac) tuples.

    Usually returns one entry, but occasionally the PDF merges two trains into
    one column, e.g. '95802 97202\nDL 4 DL 2\n15 C\nX'. In that case we return
    two entries so the caller can expand the column into two trains.

    'X' or 'AC' anywhere after the first two lines indicates an AC service.
    """
    parts = [p.strip() for p in cell.split("\n") if p.strip()]
    numbers = parts[0].split()
    codes = parts[1].split() if len(parts) > 1 else []
    is_ac = any(p in ("X", "AC") for p in parts[2:])

    if len(numbers) == 2 and len(codes) >= 2:
        # Paired codes like "DL 4 DL 2" — split them as pairs of tokens
        mid = len(codes) // 2
        code_a = " ".join(codes[:mid])
        code_b = " ".join(codes[mid:])
        return [(numbers[0], code_a, is_ac), (numbers[1], code_b, is_ac)]

    number = numbers[0]
    code = " ".join(codes) if codes else ""
    return [(number, code, is_ac)]


def _parse_time(cell: str) -> int | None:
    """Parse 'HH:MM' or 'H:MM' to minutes from midnight. Returns None for no-stop."""
    if not cell or cell.strip() in _NO_STOP:
        return None
    try:
        h, m = cell.strip().split(":")
        return int(h) * 60 + int(m)
    except ValueError:
        return None


def _fix_midnight(stops: list[tuple[str, int]]) -> list[tuple[str, int]]:
    """Ensure departure times are monotonically increasing across midnight.

    When a train crosses midnight the PDF still uses HH:MM from 00:00, so
    a departure of e.g. 00:25 following 23:58 would appear to go backwards.
    We detect this and add 1440 (one day in minutes) to subsequent times.
    """
    result = []
    offset = 0
    prev = -1
    for station, minutes in stops:
        t = minutes + offset
        # A backward jump of more than 60 minutes means we crossed midnight
        if prev >= 0 and t < prev - 60:
            offset += 1440
            t += 1440
        result.append((station, t))
        prev = t
    return result


def _split_merged_cell(cell: str) -> list[str]:
    """Split a data cell that may contain times for two merged train columns.

    A merged cell looks like '06:14 05:56' or '… 06:00' or '... 06:24'.
    Returns a list of exactly two values, one per train.
    """
    parts = cell.strip().split()
    if len(parts) == 2:
        return parts
    # Single value — same for both (handles '…' alone, or a single time)
    return [cell.strip(), cell.strip()]


def _parse_page(table: list[list[str | None]]) -> list[Train]:
    """Extract trains from a single page's table.

    Table layout:
      row 0: route header (merged, ignore)
      row 1: 'STATION' | train-header-cells...
      row 2+: station-name | time-or-empty...
    """
    header_row = table[1]

    # Build the list of trains and track which source column maps to each.
    # col_map[i] = (col_idx, sub_idx) where sub_idx is 0 or 1 for merged cols.
    trains: list[Train] = []
    col_map: list[tuple[int, int]] = []  # (source col index, 0 or 1)

    for col_idx, col_cell in enumerate(header_row[1:], start=1):
        if not col_cell:
            continue
        entries = _parse_train_header(col_cell)
        for sub_idx, (number, code, is_ac) in enumerate(entries):
            trains.append(Train(number=number, code=code, is_ac=is_ac))
            col_map.append((col_idx, sub_idx))

    # Collect (station, time) pairs per train, then fix midnight wraparound
    raw_stops: list[list[tuple[str, int]]] = [[] for _ in trains]

    for row in table[2:]:
        if not row or not row[0]:
            continue
        station = _normalize_station(row[0].strip())
        if not station:
            continue
        for train_idx, (col_idx, sub_idx) in enumerate(col_map):
            raw_cell = row[col_idx] if col_idx < len(row) else None
            if not raw_cell:
                continue
            # If this column is a merged pair, extract the correct half
            if sub_idx == 1:
                cell = _split_merged_cell(raw_cell)[1]
            elif len(_parse_train_header(header_row[col_idx])) == 2:
                cell = _split_merged_cell(raw_cell)[0]
            else:
                cell = raw_cell
            minutes = _parse_time(cell)
            if minutes is not None:
                raw_stops[train_idx].append((station, minutes))

    for i, train in enumerate(trains):
        fixed = _fix_midnight(raw_stops[i])
        train.stops = [Stop(station=s, departure=t) for s, t in fixed]

    return trains


def parse(pdf_path: str | Path, direction: str) -> Timetable:
    """Parse a Mumbai suburban railway timetable PDF.

    Args:
        pdf_path: Path to the timetable PDF.
        direction: 'up' or 'down' — purely informational, stored on the result.

    Returns:
        A Timetable with all trains across all pages of the PDF.
    """
    pdf_path = Path(pdf_path)
    all_trains: list[Train] = []
    route = ""

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            if not tables:
                continue
            table = tables[0]

            # Route name lives in the first cell of row 0
            if not route and table[0] and table[0][0]:
                route = table[0][0].strip()

            all_trains.extend(_parse_page(table))

    return Timetable(route=route, direction=direction, trains=all_trains)
