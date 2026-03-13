import json
import sqlite3
from collections import defaultdict
from pathlib import Path
from statistics import median

from .models import Timetable

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
    destination TEXT
);

CREATE TABLE IF NOT EXISTS stops (
    id            INTEGER PRIMARY KEY,
    train_id      INTEGER NOT NULL REFERENCES trains(id),
    station_id    INTEGER NOT NULL REFERENCES stations(id),
    departure     INTEGER NOT NULL,
    stop_sequence INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stops_station       ON stops(station_id);
CREATE INDEX IF NOT EXISTS idx_stops_train         ON stops(train_id);
CREATE INDEX IF NOT EXISTS idx_stops_departure     ON stops(departure);
CREATE INDEX IF NOT EXISTS idx_stops_train_station ON stops(train_id, station_id, stop_sequence);
CREATE INDEX IF NOT EXISTS idx_trains_number       ON trains(number);
"""


def export(
    db_path: str | Path,
    timetables: list[Timetable],
    *,
    operator_name: str,
    operator_short: str,
    line_name: str,
    line_short: str,
    line_type: str,
) -> None:
    """Write one or more timetables for a single line into a SQLite database.

    Safe to call multiple times — operators, lines, and stations use
    INSERT OR IGNORE so existing data isn't duplicated. Trains and stops
    are always appended fresh, so don't call this twice for the same
    timetable or you'll get duplicates.

    Args:
        db_path:        Path to the SQLite file (created if it doesn't exist).
        timetables:     Parsed timetables, typically one per direction.
        operator_name:  e.g. "Central Railway"
        operator_short: e.g. "CR"
        line_name:      e.g. "Main Line"
        line_short:     e.g. "CR-ML"
        line_type:      One of "suburban_rail", "metro", "bus"
    """
    conn = sqlite3.connect(Path(db_path))
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(_SCHEMA)

    # Operator
    conn.execute(
        "INSERT OR IGNORE INTO operators (name, short_name) VALUES (?, ?)",
        (operator_name, operator_short),
    )
    (operator_id,) = conn.execute(
        "SELECT id FROM operators WHERE short_name = ?", (operator_short,)
    ).fetchone()

    # Line
    conn.execute(
        "INSERT OR IGNORE INTO lines (operator_id, name, short_name, type) VALUES (?, ?, ?, ?)",
        (operator_id, line_name, line_short, line_type),
    )
    (line_id,) = conn.execute(
        "SELECT id FROM lines WHERE short_name = ?", (line_short,)
    ).fetchone()

    # Stations — collect all unique names across every timetable
    all_stations: set[str] = {
        stop.station
        for timetable in timetables
        for train in timetable.trains
        for stop in train.stops
    }
    for name in all_stations:
        conn.execute("INSERT OR IGNORE INTO stations (name) VALUES (?)", (name,))

    station_id: dict[str, int] = {
        row[0]: row[1]
        for row in conn.execute("SELECT name, id FROM stations WHERE name IN (%s)"
                                % ",".join("?" * len(all_stations)), list(all_stations))
    }

    # line_stations sequence — median position of each station across all down
    # trains. A station that consistently appears as stop #0 (CSMT) gets
    # sequence 0; one that appears late in every journey (Kasara) gets a high
    # value. Branches end up sequenced relative to when trains pass through them.
    seq_samples: dict[str, list[int]] = defaultdict(list)
    for timetable in timetables:
        if timetable.direction != "down":
            continue
        for train in timetable.trains:
            for i, stop in enumerate(train.stops):
                seq_samples[stop.station].append(i)

    # Fall back to up direction (reversed) if no down timetable was provided
    if not seq_samples:
        for timetable in timetables:
            for train in timetable.trains:
                n = len(train.stops)
                for i, stop in enumerate(train.stops):
                    seq_samples[stop.station].append(n - i)

    station_order = sorted(all_stations, key=lambda s: median(seq_samples.get(s, [9999])))
    for seq, name in enumerate(station_order):
        conn.execute(
            "INSERT OR IGNORE INTO line_stations (line_id, station_id, sequence) VALUES (?, ?, ?)",
            (line_id, station_id[name], seq),
        )

    # Trains and stops
    for timetable in timetables:
        for train in timetable.trains:
            origin = train.stops[0].station if train.stops else None
            destination = train.stops[-1].station if train.stops else None
            cur = conn.execute(
                "INSERT INTO trains (line_id, number, code, is_ac, is_fast, direction, origin, destination)"
                " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (line_id, train.number, train.code, int(train.is_ac), int(train.is_fast),
                 timetable.direction, origin, destination),
            )
            train_db_id = cur.lastrowid
            for seq, stop in enumerate(train.stops):
                conn.execute(
                    "INSERT INTO stops (train_id, station_id, departure, stop_sequence) "
                    "VALUES (?, ?, ?, ?)",
                    (train_db_id, station_id[stop.station], stop.departure, seq),
                )

    # Populate station shorthand codes from bundled JSON
    codes_path = Path(__file__).resolve().parent.parent.parent / "data" / "station_codes.json"
    if codes_path.exists():
        with open(codes_path) as f:
            station_codes: dict[str, str] = json.load(f)
        for row in conn.execute("SELECT id, name FROM stations"):
            sid, name = row
            code = station_codes.get(name.upper())
            if code:
                conn.execute("UPDATE stations SET code=? WHERE id=?", (code, sid))

    conn.commit()
    conn.close()
