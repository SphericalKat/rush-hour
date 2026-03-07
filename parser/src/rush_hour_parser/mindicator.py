"""Extract platform data from an m-indicator APK.

Usage:
    python -m rush_hour_parser mindicator <apk_path> <output_csv>

Extracts per-station, per-train platform numbers from the binary assets
bundled in the m-indicator APK. Outputs a CSV with columns:
    line, station, train_number, departure, platform, side
"""

import csv
import struct
import sys
import tempfile
import zipfile
from dataclasses import dataclass
from pathlib import Path


@dataclass
class _Train:
    origin: str
    dest: str
    direction: int
    name: str
    extra: str


def _read_int(data: bytes, pos: int) -> int:
    return struct.unpack(">i", data[pos : pos + 4])[0]


def _read_short(data: bytes, pos: int) -> int:
    return struct.unpack(">h", data[pos : pos + 2])[0]


def _parse_index(data: bytes) -> dict:
    """Parse a line's index file into stations, trains, overrides, and train numbers."""
    pos = 0

    # Station list
    stn_len = _read_int(data, pos)
    pos += 4
    stations = data[pos : pos + stn_len].decode().split(",")
    pos += stn_len

    # Direction names
    dn_len = data[pos]
    pos += 1 + dn_len
    up_len = data[pos]
    pos += 1 + up_len

    # Train metadata records
    train_section_len = _read_int(data, pos)
    pos += 4
    train_end = pos + train_section_len
    trains: list[_Train] = []
    while pos < train_end:
        origin_idx = _read_short(data, pos)
        dest_idx = _read_short(data, pos + 2)
        direction = data[pos + 4]
        name_len = data[pos + 5]
        name = data[pos + 6 : pos + 6 + name_len].decode()
        p2 = pos + 6 + name_len
        extra_len = data[p2]
        extra = data[p2 + 1 : p2 + 1 + extra_len].decode()
        pos = p2 + 1 + extra_len
        trains.append(_Train(stations[origin_idx], stations[dest_idx], direction, name, extra))

    # Platform override table: comma-separated triplets (hex_key, pf_num, pf_side)
    pf_section_len = _read_int(data, pos)
    pos += 4
    pf_str = data[pos : pos + pf_section_len].decode()
    pos += pf_section_len
    overrides: dict[str, tuple[str, str]] = {}
    parts = pf_str.split(",") if pf_str else []
    for i in range(0, len(parts) - 2, 3):
        overrides[parts[i]] = (parts[i + 1], parts[i + 2])

    # Train number mapping: newline-separated "idx,number"
    num_section_len = _read_int(data, pos)
    pos += 4
    num_str = data[pos : pos + num_section_len].decode().strip()
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


_SIDE_MAP = {"0": "", "1": "L", "2": "R", "3": "B"}


def _parse_station_file(
    station_data: bytes,
    index: dict,
) -> list[dict]:
    """Parse a station's binary departure file and return platform records."""
    overrides = index["overrides"]
    train_numbers = index["train_numbers"]
    records = []

    for i in range(len(station_data) // 4):
        b = station_data[i * 4 : (i + 1) * 4]
        time_mins = (b[0] << 4) | ((b[1] & 0xF0) >> 4)
        train_idx = ((b[1] & 0x0F) << 8) | b[2]
        pf_byte = b[3]
        has_override = (pf_byte & 4) == 4

        train_num = train_numbers.get(train_idx, "")
        if not train_num:
            continue

        if has_override:
            key = b[0:3].hex().upper().zfill(6)
            if key in overrides:
                pf_num, pf_side = overrides[key]
                side = _SIDE_MAP.get(pf_side, pf_side)
            else:
                continue
        else:
            pf_num_int = (pf_byte >> 3) & 31
            if pf_num_int == 0:
                continue
            pf_num = str(pf_num_int)
            side = _SIDE_MAP.get(str(pf_byte & 3), "")

        records.append(
            {
                "train_number": train_num,
                "departure": time_mins,
                "platform": pf_num,
                "side": side,
            }
        )

    return records


# Line code -> human-readable name
_LINE_NAMES = {
    "C": "Central",
    "W": "Western",
    "H": "Harbour",
    "T": "Trans-Harbour",
    "U": "Uran",
    "P": "Port",
    "NM": "Navi Mumbai Metro",
    "DPR": "DPR",
    "DVP": "DVP",
}


def extract(apk_path: str | Path, output_path: str | Path) -> int:
    """Extract platform data from an m-indicator APK to CSV.

    Returns the number of records written.
    """
    apk_path = Path(apk_path)
    output_path = Path(output_path)
    total = 0

    with zipfile.ZipFile(apk_path) as zf, open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["line", "station", "train_number", "departure", "platform", "side"])
        writer.writeheader()

        # Find all line directories under assets/mumbai/local/
        entries = [n for n in zf.namelist() if n.startswith("assets/mumbai/local/")]
        line_codes = sorted({n.split("/")[3] for n in entries if len(n.split("/")) > 4})

        for line_code in line_codes:
            index_path = f"assets/mumbai/local/{line_code}/index"
            if index_path not in entries:
                continue

            index = _parse_index(zf.read(index_path))
            station_names = index["stations"]
            line_name = _LINE_NAMES.get(line_code, line_code)

            # Each station has a binary file named after it
            prefix = f"assets/mumbai/local/{line_code}/"
            station_files = [
                n for n in entries if n.startswith(prefix) and not n.endswith("/index") and n.count("/") == 4
            ]

            for stn_file in station_files:
                stn_name = stn_file.split("/")[-1]
                stn_data = zf.read(stn_file)
                records = _parse_station_file(stn_data, index)
                for r in records:
                    r["line"] = line_name
                    r["station"] = stn_name
                    writer.writerow(r)
                    total += 1

            print(f"  {line_name} ({line_code}): {len(station_files)} stations", file=sys.stderr)

    return total
