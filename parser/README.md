# rush-hour-parser

Parses Mumbai Central Railway suburban timetable PDFs into structured data. Part of a larger open-source project to build a transit app for Mumbai.

The PDFs are the official CR timetables — one for each direction on the Main Line. They're dense grid tables with ~25 trains per page across 18–29 pages. This library extracts all of that into something you can actually work with.

## Installation

```bash
uv add rush-hour-parser
```

## Usage

### As a library

```python
from rush_hour_parser import parse

timetable = parse("data/dn.pdf", "down")

print(timetable.route)        # CSMT- KALYAN - KHOPOLI- KASARA
print(len(timetable.trains))  # 453

train = timetable.trains[0]
print(train.number)   # 96301
print(train.code)     # A 1
print(train.is_ac)    # False

for stop in train.stops:
    h, m = divmod(stop.departure, 60)
    print(f"{stop.station}: {h:02d}:{m:02d}")
```

### As a CLI

```bash
python -m rush_hour_parser data/dn.pdf down > dn.json
```

Outputs JSON via `dataclasses.asdict`.

## Data model

```python
@dataclass
class Timetable:
    route: str        # as printed in the PDF
    direction: str    # whatever you passed in — "up" or "down"
    trains: list[Train]

@dataclass
class Train:
    number: str   # 5-digit train number, e.g. "96301"
    code: str     # type/destination code from the timetable, e.g. "A 1"
    is_ac: bool
    stops: list[Stop]

@dataclass
class Stop:
    station: str
    departure: int  # minutes from midnight
```

### Note on departure times

Times are stored as minutes from midnight. A train departing at 06:30 is `390`. Trains that cross midnight continue counting up — 00:15 after 23:50 becomes `1455` (24×60 + 15), not `15`. This keeps stop sequences monotonically increasing, which makes range queries and duration calculations straightforward.

## PDFs

Put your PDFs anywhere and pass the path to `parse`. The `data/` directory in this repo holds the 2024 Main Line timetables:

- `data/*DN*.pdf` — CSMT → Kasara / Khopoli (down)
- `data/*UP*.pdf` — Kasara / Khopoli → CSMT (up)

Station names are normalized to canonical CR spellings on parse, so they match across both directions.

## Dependencies

- [pdfplumber](https://github.com/jsvine/pdfplumber) for PDF table extraction
