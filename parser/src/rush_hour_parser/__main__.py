import argparse
import json
import sys
from dataclasses import asdict

from .apk_export import export_apk
from .mindicator import extract as mindicator_extract
from .parser import parse


def cmd_parse(args: argparse.Namespace) -> None:
    timetable = parse(args.pdf, args.direction)
    print(json.dumps(asdict(timetable), indent=2))


def cmd_apk_export(args: argparse.Namespace) -> None:
    print(f"Building timetable DB from {args.apk}...", file=sys.stderr)
    export_apk(args.apk, args.db)
    print(f"Done. Database written to {args.db}", file=sys.stderr)


def cmd_mindicator(args: argparse.Namespace) -> None:
    print(f"Extracting platform data from {args.apk}...", file=sys.stderr)
    count = mindicator_extract(args.apk, args.output)
    print(f"Wrote {count} records to {args.output}", file=sys.stderr)


def build_parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(prog="python -m rush_hour_parser")
    sub = root.add_subparsers(dest="command", required=True)

    # parse subcommand
    p = sub.add_parser("parse", help="parse a timetable PDF and print JSON")
    p.add_argument("pdf", help="path to the timetable PDF")
    p.add_argument("direction", choices=["up", "down"])

    # apk-export subcommand
    a = sub.add_parser("apk-export", help="build timetable DB from an m-indicator APK")
    a.add_argument("apk", help="path to the m-indicator APK file")
    a.add_argument("db", help="output SQLite database path")

    # mindicator subcommand
    m = sub.add_parser("mindicator", help="extract platform data from an m-indicator APK")
    m.add_argument("apk", help="path to the m-indicator APK file")
    m.add_argument("output", help="output CSV path")

    return root


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    {"parse": cmd_parse, "apk-export": cmd_apk_export, "mindicator": cmd_mindicator}[args.command](args)


if __name__ == "__main__":
    main()
