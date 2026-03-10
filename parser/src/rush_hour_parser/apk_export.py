"""Build a timetable SQLite database from an m-indicator APK.

Replaces the PDF parsing pipeline entirely. The APK bundles pre-processed
binary timetable data for all Mumbai suburban lines with platform info.
"""

import json
import sqlite3
import struct
import sys
import zipfile
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from statistics import median


_SCHEMA = """
CREATE TABLE IF NOT EXISTS operators (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    short_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS lines (
    id          INTEGER PRIMARY KEY,
    operator_id INTEGER NOT NULL REFERENCES operators(id),
    name        TEXT NOT NULL,
    short_name  TEXT NOT NULL UNIQUE,
    type        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stations (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    lat  REAL,
    lng  REAL
);

CREATE TABLE IF NOT EXISTS line_stations (
    line_id    INTEGER NOT NULL REFERENCES lines(id),
    station_id INTEGER NOT NULL REFERENCES stations(id),
    sequence   INTEGER NOT NULL,
    PRIMARY KEY (line_id, station_id)
);

CREATE TABLE IF NOT EXISTS trains (
    id          INTEGER PRIMARY KEY,
    line_id     INTEGER NOT NULL REFERENCES lines(id),
    number      TEXT NOT NULL,
    code        TEXT,
    is_ac       INTEGER NOT NULL DEFAULT 0,
    is_fast     INTEGER NOT NULL DEFAULT 0,
    direction   TEXT NOT NULL,
    origin      TEXT,
    destination TEXT,
    runs_on     TEXT NOT NULL DEFAULT 'daily',
    note        TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS stops (
    id            INTEGER PRIMARY KEY,
    train_id      INTEGER NOT NULL REFERENCES trains(id),
    station_id    INTEGER NOT NULL REFERENCES stations(id),
    departure     INTEGER NOT NULL,
    stop_sequence INTEGER NOT NULL,
    platform      TEXT,
    side          TEXT
);

CREATE INDEX IF NOT EXISTS idx_stops_station       ON stops(station_id);
CREATE INDEX IF NOT EXISTS idx_stops_train         ON stops(train_id);
CREATE INDEX IF NOT EXISTS idx_stops_departure     ON stops(departure);
CREATE INDEX IF NOT EXISTS idx_stops_train_station ON stops(train_id, station_id, stop_sequence);
CREATE INDEX IF NOT EXISTS idx_trains_number       ON trains(number);
"""

# Canonical station name overrides. The m-indicator APK uses inconsistent
# spellings across lines — normalize to a single canonical name.
_STATION_ALIASES: dict[str, str] = {
    "AMBERNATH": "AMBARNATH",
    "BHAYANDER": "BHAYANDAR",
    "SEAWOOD DARAVE": "SEAWOOD DARAVE KARAVE",
    "KELVA ROAD": "KELVE ROAD",
    "DIGHA": "DIGHA GAON",
    "NHAVA SHEVA": "NAVA SHEVA",
}


# m-indicator line code -> (operator_name, operator_short, line_name, line_short, line_type)
_LINE_META: dict[str, tuple[str, str, str, str, str]] = {
    "C":  ("Central Railway", "CR", "Central Line", "CR-ML", "suburban_rail"),
    "H":  ("Central Railway", "CR", "Harbour Line", "CR-HB", "suburban_rail"),
    "T":  ("Central Railway", "CR", "Trans-Harbour Line", "CR-TH", "suburban_rail"),
    "U":  ("Central Railway", "CR", "Uran Line", "CR-UR", "suburban_rail"),
    "P":  ("Central Railway", "CR", "Port Line", "CR-PL", "suburban_rail"),
    "W":  ("Western Railway", "WR", "Western Line", "WR-ML", "suburban_rail"),
}

_SIDE_MAP = {0: "", 1: "L", 2: "R", 3: "B"}


def _read_int(data: bytes, pos: int) -> int:
    return struct.unpack(">i", data[pos:pos + 4])[0]


def _read_short(data: bytes, pos: int) -> int:
    return struct.unpack(">h", data[pos:pos + 2])[0]


@dataclass
class _Train:
    origin: str
    dest: str
    direction: int  # 1=up, 2=down
    name: str       # "S", "F", "F-Mulund", etc.
    extra: str


@dataclass
class _Stop:
    station: str
    departure: int  # minutes from midnight
    platform: str   # e.g. "3|4" or "1" or ""
    side: str       # "L", "R", "B", ""


@dataclass
class _ParsedTrain:
    number: str
    origin: str
    dest: str
    direction: str  # "up" or "down"
    is_fast: bool
    is_ac: bool
    runs_on: str    # "daily", "not_sunday", "sunday_only", "weekdays_only", etc.
    note: str       # freeform schedule note, e.g. "General on Sat & Sun"
    stops: list[_Stop] = field(default_factory=list)


def _parse_schedule(extra: str) -> tuple[str, str]:
    """Parse the extra field into (runs_on, note)."""
    lower = extra.lower()

    # Check for specific schedule patterns
    if "sunday only" in lower:
        return "sunday_only", ""
    if "not on saturday and sunday" in lower:
        return "weekdays_only", ""
    if "not on friday & saturday" in lower or "not on friday and saturday" in lower:
        return "not_fri_sat", ""
    if "not on thursday & friday" in lower or "not on thursday and friday" in lower:
        return "not_thu_fri", ""
    if "not on saturday" in lower and "sunday" not in lower:
        return "not_saturday", ""
    if "not on sunday" in lower:
        return "not_sunday", ""

    # Notes that don't affect runs_on but are useful
    notes = []
    if "general on saturday and sunday" in lower:
        notes.append("General on Sat & Sun")
    if "general on sunday" in lower and "saturday" not in lower:
        notes.append("General on Sun")
    if "ladies" in lower:
        notes.append("Ladies Special")

    return "daily", ", ".join(notes)


def _parse_index(data: bytes) -> dict:
    pos = 0

    stn_len = _read_int(data, pos); pos += 4
    stations = [_STATION_ALIASES.get(s, s) for s in data[pos:pos + stn_len].decode().split(",")]
    pos += stn_len

    dn_len = data[pos]; pos += 1 + dn_len
    up_len = data[pos]; pos += 1 + up_len

    # Train metadata
    train_section_len = _read_int(data, pos); pos += 4
    train_end = pos + train_section_len
    trains: list[_Train] = []
    while pos < train_end:
        origin_idx = _read_short(data, pos)
        dest_idx = _read_short(data, pos + 2)
        direction = data[pos + 4]
        name_len = data[pos + 5]
        name = data[pos + 6:pos + 6 + name_len].decode()
        p2 = pos + 6 + name_len
        extra_len = data[p2]
        extra = data[p2 + 1:p2 + 1 + extra_len].decode()
        pos = p2 + 1 + extra_len
        trains.append(_Train(stations[origin_idx], stations[dest_idx], direction, name, extra))

    # Platform overrides
    pf_section_len = _read_int(data, pos); pos += 4
    pf_str = data[pos:pos + pf_section_len].decode()
    pos += pf_section_len
    overrides: dict[str, tuple[str, str]] = {}
    parts = pf_str.split(",") if pf_str else []
    for i in range(0, len(parts) - 2, 3):
        overrides[parts[i]] = (parts[i + 1], parts[i + 2])

    # Train number mapping
    num_section_len = _read_int(data, pos); pos += 4
    num_str = data[pos:pos + num_section_len].decode().strip()
    pos += num_section_len
    train_numbers: dict[int, str] = {}
    for line in num_str.split("\n"):
        cols = line.strip().split(",")
        if len(cols) >= 2 and cols[0]:
            train_numbers[int(cols[0])] = cols[1]

    return {
        "stations": stations,
        "trains": trains,
        "overrides": overrides,
        "train_numbers": train_numbers,
    }


def _decode_platform(raw: bytes, overrides: dict[str, tuple[str, str]]) -> tuple[str, str]:
    """Decode platform info from the 4th byte of a station record.

    Returns (platform, side) where platform may be "" if unknown.
    """
    pf_byte = raw[3]
    has_override = (pf_byte & 4) == 4

    if has_override:
        key = raw[0:3].hex().upper().zfill(6)
        if key in overrides:
            pf_num, pf_side = overrides[key]
            return pf_num, _SIDE_MAP.get(int(pf_side) if pf_side.isdigit() else 0, pf_side)

    pf_num = (pf_byte >> 3) & 31
    pf_side = pf_byte & 3
    if pf_num > 0:
        return str(pf_num), _SIDE_MAP.get(pf_side, "")
    return "", ""


def _build_trains_from_line(zf: zipfile.ZipFile, line_code: str) -> list[_ParsedTrain]:
    """Parse a line's index + station files into a list of trains with stops."""
    index_path = f"assets/mumbai/local/{line_code}/index"
    index = _parse_index(zf.read(index_path))
    meta_trains = index["trains"]
    train_numbers = index["train_numbers"]
    overrides = index["overrides"]
    stations_in_index = index["stations"]

    # Collect departures per train from each station file
    # Key: train_idx -> list of (station, departure, platform, side)
    train_stops: dict[int, list[_Stop]] = defaultdict(list)

    prefix = f"assets/mumbai/local/{line_code}/"
    station_files = [
        n for n in zf.namelist()
        if n.startswith(prefix) and not n.endswith("/index") and n.count("/") == 4
    ]

    for stn_file in station_files:
        stn_name = _STATION_ALIASES.get(stn_file.split("/")[-1], stn_file.split("/")[-1])
        stn_data = zf.read(stn_file)
        for i in range(len(stn_data) // 4):
            raw = stn_data[i * 4:(i + 1) * 4]
            time_mins = (raw[0] << 4) | ((raw[1] & 0xF0) >> 4)
            train_idx = ((raw[1] & 0x0F) << 8) | raw[2]

            if train_idx not in train_numbers:
                continue

            platform, side = _decode_platform(raw, overrides)
            train_stops[train_idx].append(_Stop(stn_name, time_mins, platform, side))

    # Build train objects
    result: list[_ParsedTrain] = []
    for train_idx, stops in train_stops.items():
        if train_idx < 1 or train_idx > len(meta_trains):
            continue
        meta = meta_trains[train_idx - 1]
        number = train_numbers[train_idx]
        direction = "up" if meta.direction == 1 else "down"
        is_fast = meta.name.startswith("F") or meta.name.startswith("SF")
        is_ac = "AC" in meta.extra
        runs_on, note = _parse_schedule(meta.extra)

        # Sort stops by departure time, handling midnight wraparound
        stops.sort(key=lambda s: s.departure)

        # Fix midnight wraparound: if times go backwards, add 1440
        fixed: list[_Stop] = []
        prev = -1
        offset = 0
        for s in stops:
            t = s.departure + offset
            if prev >= 0 and t < prev - 60:
                offset += 1440
                t += 1440
            fixed.append(_Stop(s.station, t, s.platform, s.side))
            prev = t

        # Truncate at the declared destination. The per-station binary
        # files often include stops beyond the terminus (yard movements,
        # etc.) that m-indicator filters out using origin/dest from the
        # index. Do the same here.
        origin_idx = next((i for i, s in enumerate(fixed) if s.station == meta.origin), None)
        dest_idx = next((i for i, s in enumerate(fixed) if s.station == meta.dest), None)
        if origin_idx is not None and dest_idx is not None and origin_idx < dest_idx:
            fixed = fixed[origin_idx:dest_idx + 1]
        elif dest_idx is not None:
            fixed = fixed[:dest_idx + 1]

        result.append(_ParsedTrain(
            number=number,
            origin=meta.origin,
            dest=meta.dest,
            direction=direction,
            is_fast=is_fast,
            is_ac=is_ac,
            runs_on=runs_on,
            note=note,
            stops=fixed,
        ))

    return result


def export_apk(apk_path: str | Path, db_path: str | Path) -> None:
    """Extract timetable data from an m-indicator APK into a SQLite database."""
    apk_path = Path(apk_path)
    db_path = Path(db_path)

    # Remove existing DB to start fresh
    db_path.unlink(missing_ok=True)

    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(_SCHEMA)

    with zipfile.ZipFile(apk_path) as zf:
        # Read config to get available line codes
        config = json.loads(zf.read("assets/mumbai/config.json"))
        available_lines = config.get("local", [])

        for line_code in available_lines:
            if line_code not in _LINE_META:
                print(f"  skipping {line_code} (no metadata configured)", file=sys.stderr)
                continue

            op_name, op_short, line_name, line_short, line_type = _LINE_META[line_code]

            # Operator
            conn.execute(
                "INSERT OR IGNORE INTO operators (name, short_name) VALUES (?, ?)",
                (op_name, op_short),
            )
            (operator_id,) = conn.execute(
                "SELECT id FROM operators WHERE short_name = ?", (op_short,)
            ).fetchone()

            # Line
            conn.execute(
                "INSERT OR IGNORE INTO lines (operator_id, name, short_name, type) VALUES (?, ?, ?, ?)",
                (operator_id, line_name, line_short, line_type),
            )
            (line_id,) = conn.execute(
                "SELECT id FROM lines WHERE short_name = ?", (line_short,)
            ).fetchone()

            # Parse all trains for this line
            trains = _build_trains_from_line(zf, line_code)
            print(f"  {line_name} ({line_code}): {len(trains)} trains", file=sys.stderr)

            # Collect all station names
            all_stations: set[str] = set()
            for t in trains:
                for s in t.stops:
                    all_stations.add(s.station)

            for name in all_stations:
                conn.execute("INSERT OR IGNORE INTO stations (name) VALUES (?)", (name,))

            station_ids: dict[str, int] = {
                row[0]: row[1]
                for row in conn.execute(
                    "SELECT name, id FROM stations WHERE name IN (%s)"
                    % ",".join("?" * len(all_stations)),
                    list(all_stations),
                )
            }

            # line_stations: use median stop position across down trains
            seq_samples: dict[str, list[int]] = defaultdict(list)
            for t in trains:
                if t.direction != "down":
                    continue
                for i, s in enumerate(t.stops):
                    seq_samples[s.station].append(i)
            if not seq_samples:
                for t in trains:
                    n = len(t.stops)
                    for i, s in enumerate(t.stops):
                        seq_samples[s.station].append(n - i)

            station_order = sorted(all_stations, key=lambda s: median(seq_samples.get(s, [9999])))
            for seq, name in enumerate(station_order):
                conn.execute(
                    "INSERT OR IGNORE INTO line_stations (line_id, station_id, sequence) VALUES (?, ?, ?)",
                    (line_id, station_ids[name], seq),
                )

            # Insert trains and stops
            for t in trains:
                cur = conn.execute(
                    "INSERT INTO trains (line_id, number, code, is_ac, is_fast, direction, origin, destination, runs_on, note)"
                    " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (line_id, t.number, "", int(t.is_ac), int(t.is_fast), t.direction, t.origin, t.dest, t.runs_on, t.note),
                )
                train_db_id = cur.lastrowid
                for seq, s in enumerate(t.stops):
                    sid = station_ids.get(s.station)
                    if sid is None:
                        continue
                    conn.execute(
                        "INSERT INTO stops (train_id, station_id, departure, stop_sequence, platform, side)"
                        " VALUES (?, ?, ?, ?, ?, ?)",
                        (train_db_id, sid, s.departure, seq, s.platform or None, s.side or None),
                    )

        # Populate station coordinates from bundled CSV
        try:
            csv_data = zf.read("assets/mumbai/local/all_stations_lat_lon.csv").decode()
            coords: dict[str, tuple[float, float]] = {}
            for line in csv_data.strip().split("\n"):
                parts = line.strip().split(",")
                if len(parts) == 3:
                    coords[parts[0].strip().upper()] = (float(parts[1]), float(parts[2]))

            # Name variants: our DB may use slightly different spellings
            aliases = {
                "AMBERNATH": "AMBARNATH",
                "BHAYANDER": "BHAYANDAR",
                "DIGHA": "DIGHA GAON",
                "KELVA ROAD": "KELVE ROAD",
                "SEAWOOD DARAVE": "SEAWOOD DARAVE KARAVE",
            }

            for row in conn.execute("SELECT id, name FROM stations"):
                sid, name = row
                key = name.upper()
                csv_key = aliases.get(key, key)
                if csv_key in coords:
                    lat, lng = coords[csv_key]
                    conn.execute("UPDATE stations SET lat=?, lng=? WHERE id=?", (lat, lng, sid))
        except KeyError:
            print("  warning: all_stations_lat_lon.csv not found in APK", file=sys.stderr)

    conn.commit()
    conn.close()
