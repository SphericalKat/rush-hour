# rush hour

A transit app for Mumbai's suburban rail network (Central Railway). Lets commuters see upcoming departures from any station and report real-time delays and crowd levels to help others plan their commute.

## What it does

- Look up departures from any station on the Main Line
- See live delay reports submitted by other commuters
- Report delays and crowd levels on trains you're on
- Timetable data sourced from official CR PDFs

## Structure

```
parser/     Python library that parses CR timetable PDFs into structured data (SQLite)
backend/    Go API server, serves timetable data and handles live reports via WebSocket
mobile/     React Native (Expo) app
```

### parser

Reads the official CR timetable PDFs (dense grid tables, ~25 trains per page) and extracts all train numbers, stops, and departure times into a SQLite database. Used as a one-time or periodic data pipeline step.

### backend

Chi router, pure-Go SQLite (`modernc.org/sqlite`), Redis for live state. Exposes REST endpoints for lines, stations, departures, and timetable version. WebSocket endpoint streams live delay/crowd reports to connected clients. Uses HyperLogLog in Redis to deduplicate reports by device.

### mobile

Expo/React Native app. Queries the backend for departures and streams the WebSocket for live updates. Lets users submit delay and crowd reports.

## Data flow

```
CR PDF -> parser -> timetable.db -> backend -> mobile app
                                         ↕ WebSocket (live reports)
```

## Running locally

Each component has its own setup. See the README in `parser/` for timetable generation. The backend reads `timetable.db` from a configurable path and connects to Redis.

Backend env vars: `ADDR`, `TIMETABLE_DB_PATH`, `REDIS_URL`, `TIMETABLE_UPDATE_INTERVAL`

TODO: Add more info here