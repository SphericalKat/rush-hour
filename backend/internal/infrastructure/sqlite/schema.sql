CREATE TABLE operators (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    short_name TEXT NOT NULL UNIQUE
);

CREATE TABLE lines (
    id          INTEGER PRIMARY KEY,
    operator_id INTEGER NOT NULL REFERENCES operators(id),
    name        TEXT NOT NULL,
    short_name  TEXT NOT NULL UNIQUE,
    type        TEXT NOT NULL
);

CREATE TABLE stations (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    lat  REAL,
    lng  REAL
);

CREATE TABLE line_stations (
    line_id    INTEGER NOT NULL REFERENCES lines(id),
    station_id INTEGER NOT NULL REFERENCES stations(id),
    sequence   INTEGER NOT NULL,
    PRIMARY KEY (line_id, station_id)
);

CREATE TABLE trains (
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

CREATE TABLE stops (
    id            INTEGER PRIMARY KEY,
    train_id      INTEGER NOT NULL REFERENCES trains(id),
    station_id    INTEGER NOT NULL REFERENCES stations(id),
    departure     INTEGER NOT NULL,
    stop_sequence INTEGER NOT NULL,
    platform      TEXT,
    side          TEXT
);

CREATE INDEX idx_stops_station       ON stops(station_id);
CREATE INDEX idx_stops_train         ON stops(train_id);
CREATE INDEX idx_stops_departure     ON stops(departure);
CREATE INDEX idx_stops_train_station ON stops(train_id, station_id, stop_sequence);
CREATE INDEX idx_trains_number       ON trains(number);