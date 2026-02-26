import json
import sys
from dataclasses import asdict
from pathlib import Path

from .parser import parse


def main() -> None:
    if len(sys.argv) != 3:
        print("Usage: python -m rush_hour_parser <pdf_path> <up|down>", file=sys.stderr)
        sys.exit(1)

    pdf_path = Path(sys.argv[1])
    direction = sys.argv[2]

    if direction not in ("up", "down"):
        print("direction must be 'up' or 'down'", file=sys.stderr)
        sys.exit(1)

    timetable = parse(pdf_path, direction)
    print(json.dumps(asdict(timetable), indent=2))


if __name__ == "__main__":
    main()
