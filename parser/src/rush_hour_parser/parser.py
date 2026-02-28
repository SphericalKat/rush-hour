import re
from pathlib import Path

import pdfplumber

from .models import Stop, Timetable, Train

# Cells with these values mean the train does not stop here
_NO_STOP = {"", "…", "..."}

# Canonical station names. Keys are lowercase for case-insensitive lookup.
# Covers three kinds of problems:
#   1. Spelling variants across PDFs (e.g. "Santacruz" vs "Santa Cruz")
#   2. All-caps names from Harbour/THL/Port/WR PDFs that have Title-Case
#      equivalents in CR Main Line PDFs (case duplicates)
#   3. Abbreviation expansion or suffix normalisation (e.g. "BELAPUR" → "Belapur CBD")
# The general all-caps fallback in _normalize_station handles simple
# cases not listed here; add explicit entries only when the fallback
# would produce a wrong result.
_CANONICAL: dict[str, str] = {
    # --- CR Main Line spelling corrections ---
    "bhivpuri road": "Bhivpuri Road",
    "currey road": "Currey Road",
    "diwa": "Diva",
    "kanjur marg": "Kanjur Marg",
    "sandhurst road": "Sandhurst Road",
    "ulhas nagar": "Ulhas Nagar",
    "umbermalli": "Umbermali",

    # --- WR: spelling variants between DN and UP PDFs ---
    "m'bai central (l)": "Mumbai Central (L)",
    "m'bai central(l)": "Mumbai Central (L)",
    "kandivli": "Kandivali",
    "bhayandar": "Bhayandar",
    "vasai road": "Vasai Road",
    "nalla sopara": "Nalla Sopara",
    "mahim jn.": "Mahim Jn.",
    "mahim jn": "Mahim Jn.",

    # --- Harbour Line PDF spelling variants ---
    "santacruz": "Santa Cruz",
    "vileparle": "Vile Parle",
    "seawood darave": "Seawoods Darave",   # HB PDFs drop the 's'
    "mumbai csmt": "CSMT",                 # HB PDFs use full name

    # --- THL/Port Line: all-caps spelling variants ---
    "seawoods darawe": "Seawoods Darave",          # THL typo
    "seawoods darave karave": "Seawoods Darave",   # Port Line extra word
    "nhave sheva": "Nhava Sheva",                  # Port Line typo
    "belapur": "Belapur CBD",                      # THL/Port use bare "BELAPUR"

    # --- Acronyms: preserve all-caps, override the isupper() fallback ---
    "csmt": "CSMT",
}


def _normalize_station(name: str) -> str:
    canonical = _CANONICAL.get(name.lower())
    if canonical:
        return canonical
    # All-caps names (Harbour Line / THL / Port Line / WR PDFs) → Title Case.
    # str.title() mis-capitalises after apostrophes ("King'S Circle") so fix that.
    if name.isupper():
        return re.sub(r"(?<=')S(?=\s|$)", "s", name.title())
    return name


def _fix_doubled(s: str) -> str:
    """Fix cells where every character is doubled due to PDF encoding issues.

    e.g. 'GGHHAANNSSOOLLII' → 'GHANSOLI', '0000::1199' → '00:19'
    Safe to call on any string — returns it unchanged if not doubled.
    """
    if len(s) % 2 != 0:
        return s
    if all(s[i] == s[i + 1] for i in range(0, len(s), 2)):
        return s[::2]
    return s


def _is_station_cell(cell: str | None) -> bool:
    """True if cell contains a usable station name (not a time, number, or padding)."""
    if not cell:
        return False
    s = cell.strip()
    if not s or s == "0":
        return False
    # Looks like a time (HH:MM) or a pure number
    if re.match(r"^\d{1,2}:\d{2}$", s) or re.match(r"^\d+$", s):
        return False
    return True


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
    if not cell:
        return None
    cell = _fix_doubled(cell.strip())
    if cell in _NO_STOP:
        return None
    try:
        h, m = cell.split(":")
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


def _expand_merged_data_cells(row: list[str | None]) -> list[str | None]:
    """Expand cells that contain two space-separated times into adjacent cells.

    When two consecutive trains run so close together that pdfplumber merges
    their departure times into one cell (e.g. '23:14 23:32') with the next
    cell being None, split the value across both columns.
    """
    result = list(row)
    _time_re = re.compile(r"^\d{1,2}:\d{2}$")
    for i, cell in enumerate(result):
        if not cell:
            continue
        parts = cell.strip().split()
        if (
            len(parts) == 2
            and all(_time_re.match(p) or p in _NO_STOP for p in parts)
            and i + 1 < len(result)
            and not result[i + 1]
        ):
            result[i] = parts[0]
            result[i + 1] = parts[1]
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


def _station_list_from_table(table: list[list[str | None]]) -> list[str]:
    """Extract the ordered station list from a well-formed table.

    Skips the two header rows and padding rows, returns only real station names.
    """
    stations = []
    for row in table[2:]:
        if row and _is_station_cell(row[0]):
            stations.append(_normalize_station(row[0].strip()))
    return stations


def _parse_page(
    table: list[list[str | None]],
    station_list: list[str] | None = None,
    header_row_idx: int = 1,
) -> list[Train]:
    """Extract trains from a single page's table.

    Table layout (default):
      row 0: route header (merged, ignore)
      row 1: 'STATION' | train-header-cells...
      row 2+: station-name | time-or-empty...

    Args:
        table:          Extracted table rows.
        station_list:   Canonical ordered station list used as a fallback when
                        a row's station cell is missing or unreadable.
        header_row_idx: Which row contains the train number headers (default 1).
    """
    header_row = table[header_row_idx]

    trains: list[Train] = []
    col_map: list[tuple[int, int]] = []

    for col_idx, col_cell in enumerate(header_row[1:], start=1):
        if not col_cell:
            continue
        # Skip cells that aren't train headers (e.g. a second 'Stations' label
        # on wide pages that contain two timetable blocks side-by-side)
        if not re.match(r"^\d{5}", col_cell.strip()):
            continue
        entries = _parse_train_header(col_cell)
        for sub_idx, (number, code, is_ac) in enumerate(entries):
            trains.append(Train(number=number, code=code, is_ac=is_ac))
            col_map.append((col_idx, sub_idx))

    raw_stops: list[list[tuple[str, int]]] = [[] for _ in trains]

    station_idx = 0
    for raw_row in table[header_row_idx + 1 :]:
        row = _expand_merged_data_cells(raw_row)
        if not row:
            continue

        # Determine the station name for this row
        if _is_station_cell(row[0]):
            station = _normalize_station(_fix_doubled(row[0].strip()))
            # Advance the fallback index to stay in sync
            if station_list and station_idx < len(station_list) and station_list[station_idx] == station:
                station_idx += 1
        elif station_list and station_idx < len(station_list):
            # No usable name in col 0 — use the canonical list by position.
            # Skip padding rows (all time cells are '0' or empty).
            time_cells = [row[c] for c, _ in col_map if c < len(row)]
            if all(c in (None, "", "0") for c in time_cells):
                continue  # padding row
            station = station_list[station_idx]
            station_idx += 1
        else:
            continue

        for train_idx, (col_idx, sub_idx) in enumerate(col_map):
            raw_cell = row[col_idx] if col_idx < len(row) else None
            if not raw_cell:
                continue
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


def _parse_split_page(
    page: pdfplumber.page.Page,
    station_list: list[str],
) -> list[Train]:
    """Handle pages where two timetable blocks are printed side-by-side.

    The 'Stations' label in the middle of the page marks the start of the
    right-hand block. We crop each half and parse them independently, using
    station_list as a fallback for any rows without a readable station name.
    """
    words = page.extract_words()
    stations_word = next((w for w in words if w["text"] == "Stations"), None)
    split_x = stations_word["x0"] if stations_word else page.width / 2

    trains = []
    for crop_box in [(0, 0, split_x, page.height), (split_x, 0, page.width, page.height)]:
        half = page.crop(crop_box)
        tables = half.extract_tables()
        if not tables:
            continue
        t = tables[0]
        if len(t) < 2:
            continue
        trains.extend(_parse_page(t, station_list=station_list))

    return trains


def _is_transposed_header(table: list[list[str | None]]) -> bool:
    """True for PDFs where row 0 contains train headers (no separate route row).

    Detected by 'Train No.' appearing in the first cell of row 0.
    """
    return bool(table and table[0] and table[0][0] and "Train No." in table[0][0])


def _is_bad_split(table: list[list[str | None]]) -> bool:
    """True when the table's train-header row is in row 0 or row 1 col 0 looks
    like a train number rather than a station label."""
    if len(table) < 2:
        return False
    cell = table[1][0] or ""
    return bool(re.match(r"^\d{5}", cell.strip()))


def _has_stations_word(page: pdfplumber.page.Page) -> bool:
    return any(w["text"] == "Stations" for w in page.extract_words())


def _is_wr_table(table: list[list[str | None]]) -> bool:
    """True for Western Railway PDFs where pdfplumber merges all station/time data.

    Detected by 'STATIONS' appearing at the start of the first cell in either
    of the top two rows (the exact row varies by page layout).
    """
    for row in table[:2]:
        if row and row[0] and row[0].startswith("STATIONS"):
            return True
    return False


def _port_line_split_idx(table: list[list[str | None]]) -> int | None:
    """Return the row index of the Port Line UP sub-header, or None."""
    for i in range(2, len(table) - 1):
        cell = table[i][0] or ""
        if "UP LINE" in cell:
            return i
    return None


def _merge_station_name(words: list) -> str:
    """Reconstruct a station name from a list of pdfplumber word dicts.

    Usually just joins word texts with spaces, but handles the case where
    individual characters are each their own word object in the PDF (e.g.
    'N','a','l','l','a','S','o','p','a','r','a'). In that case, x-gaps
    between character objects are used to detect word boundaries.
    """
    if not words:
        return ""
    # If no single-char alphabetic words, simple join
    if not any(len(w["text"]) == 1 and w["text"].isalpha() for w in words):
        return " ".join(w["text"] for w in words)
    # Reconstruct word boundaries from x-gaps between character objects
    tokens = []
    current = words[0]["text"]
    for i in range(1, len(words)):
        gap = words[i]["x0"] - words[i - 1]["x1"]
        if gap >= 2.0:
            tokens.append(current)
            current = words[i]["text"]
        else:
            current += words[i]["text"]
    tokens.append(current)
    return " ".join(tokens)


def _reassemble_spaced_times(row_words: list) -> list:
    """Merge adjacent single-character digit/colon sequences into time strings.

    Some WR PDFs have individual characters spaced apart that pdfplumber
    can't merge, e.g. '0','4',':','5','1' → '04:51'.
    """
    _digit_colon = set("0123456789:")
    result = []
    i = 0
    while i < len(row_words):
        w = row_words[i]
        if len(w["text"]) == 1 and w["text"] in _digit_colon:
            run = [w]
            j = i + 1
            while j < len(row_words):
                nw = row_words[j]
                if (len(nw["text"]) == 1 and nw["text"] in _digit_colon
                        and nw["x0"] - run[-1]["x1"] < 10):
                    run.append(nw)
                    j += 1
                else:
                    break
            combined = "".join(rw["text"] for rw in run)
            if re.match(r"^\d{1,2}:\d{2}$", combined):
                result.append({**run[0], "text": combined, "x1": run[-1]["x1"]})
                i = j
            else:
                result.extend(run)
                i = j
        else:
            result.append(w)
            i += 1
    return result


def _parse_wr_page(page: pdfplumber.page.Page) -> list[Train]:
    """Extract trains from a WR page using word positions.

    WR PDFs pack all station names and times into merged cells so table
    extraction is unusable. Instead we group raw words by y-position:
    each station occupies exactly one y-row, and each train one x-column.
    """
    words = page.extract_words()

    by_y: dict[int, list] = {}
    for w in words:
        by_y.setdefault(round(w["top"]), []).append(w)
    ys = sorted(by_y.keys())

    # Locate the train number row: first y with ≥2 five/six-character numbers
    _num_re = re.compile(r"^\d{5}[A-Z]?$")
    train_row_y: int | None = None
    for y in ys:
        if sum(1 for w in by_y[y] if _num_re.match(w["text"])) >= 2:
            train_row_y = y
            break
    if train_row_y is None:
        return []

    number_words = sorted(
        [w for w in by_y[train_row_y] if _num_re.match(w["text"])],
        key=lambda w: w["x0"],
    )
    col_xs = [w["x0"] for w in number_words]
    # Station names always appear left of the first train column
    station_threshold = col_xs[0] - 10

    # Destination codes appear in the row(s) just above the train number row
    dest_words = []
    for y in ys:
        if train_row_y - 25 < y < train_row_y:
            for w in by_y[y]:
                if w["x0"] > station_threshold and len(w["text"]) <= 4 and w["text"].isalpha():
                    dest_words.append(w)

    # AC markers appear between the train number row and the first data row
    ac_xs: set[int] = set()
    for y in ys:
        if train_row_y < y < train_row_y + 38:
            for w in by_y[y]:
                if w["text"] == "AC":
                    ac_xs.add(round(w["x0"]))

    trains: list[Train] = []
    for nw in number_words:
        x = nw["x0"]
        code = ""
        if dest_words:
            nearest = min(dest_words, key=lambda w: abs(w["x0"] - x))
            if abs(nearest["x0"] - x) < 20:
                code = nearest["text"]
        is_ac = any(abs(ax - x) < 15 for ax in ac_xs)
        trains.append(Train(number=nw["text"], code=code, is_ac=is_ac))

    raw_stops: list[list[tuple[str, int]]] = [[] for _ in trains]
    _time_re = re.compile(r"^\d{1,2}:\d{2}$")
    _skip_words = {"STATIONS", "DN", "UP", "TRAINS", "CAR", "W.E.F."}

    for y in ys:
        if y <= train_row_y + 25:
            continue
        row = _reassemble_spaced_times(sorted(by_y[y], key=lambda w: w["x0"]))
        station_word_objs = [
            w for w in row
            if w["x0"] < station_threshold
            and w["text"] not in _skip_words
            and not re.match(r"^\d+$", w["text"])
        ]
        if not station_word_objs:
            continue
        station = _normalize_station(_fix_doubled(_merge_station_name(station_word_objs)))

        for w in row:
            if w["x0"] < station_threshold or not _time_re.match(w["text"]):
                continue
            nearest_idx = min(range(len(col_xs)), key=lambda i: abs(col_xs[i] - w["x0"]))
            minutes = _parse_time(w["text"])
            if minutes is not None:
                raw_stops[nearest_idx].append((station, minutes))

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
    station_list: list[str] = []

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            if not tables:
                continue
            table = tables[0]

            if _is_wr_table(table):
                all_trains.extend(_parse_wr_page(page))
                continue

            if not route and table[0] and table[0][0]:
                route = table[0][0].strip()

            split_idx = _port_line_split_idx(table)
            if split_idx is not None:
                # Port Line: both directions share one table — serve only the
                # requested direction so each parse() call returns one Timetable.
                if direction == "down":
                    sub = table[:split_idx]
                    route = table[0][0].split("\n")[-1].strip() if table[0][0] else route
                else:
                    sub = table[split_idx:]
                    route = (table[split_idx][0] or "").strip()
                trains = _parse_page(sub, station_list=station_list)
                all_trains.extend(trains)
                if not station_list:
                    station_list = _station_list_from_table(sub)
            elif _is_transposed_header(table):
                # Train headers are in row 0, station rows start at row 1
                trains = _parse_page(table, station_list=station_list, header_row_idx=0)
                all_trains.extend(trains)
                if not station_list:
                    station_list = _station_list_from_table(table)
            elif _is_bad_split(table):
                if _has_stations_word(page):
                    # Two blocks side-by-side — crop and parse each half
                    all_trains.extend(_parse_split_page(page, station_list))
                else:
                    # No station names anywhere on this page — use row index fallback
                    all_trains.extend(_parse_page(table, station_list=station_list))
            else:
                trains = _parse_page(table, station_list=station_list)
                all_trains.extend(trains)
                # Build/update the canonical station list from well-formed pages
                if not station_list:
                    station_list = _station_list_from_table(table)

    return Timetable(route=route, direction=direction, trains=all_trains)
