import argparse
import json
import sys
from dataclasses import asdict

from .apk_export import export_apk
from .mindicator import extract as mindicator_extract
from .parser import parse
from .sqlite_export import export


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


def cmd_export(args: argparse.Namespace) -> None:
    timetables = []

    if args.down:
        print(f"Parsing {args.down} (down)...", file=sys.stderr)
        timetables.append(parse(args.down, "down"))
    if args.up:
        print(f"Parsing {args.up} (up)...", file=sys.stderr)
        timetables.append(parse(args.up, "up"))

    if not timetables:
        print("error: provide at least one of --down or --up", file=sys.stderr)
        sys.exit(1)

    print(f"Exporting to {args.db}...", file=sys.stderr)
    export(
        args.db,
        timetables,
        operator_name=args.operator,
        operator_short=args.operator_short,
        line_name=args.line,
        line_short=args.line_short,
        line_type=args.line_type,
    )
    print("Done.", file=sys.stderr)


def build_parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(prog="python -m rush_hour_parser")
    sub = root.add_subparsers(dest="command", required=True)

    # parse subcommand
    p = sub.add_parser("parse", help="parse a timetable PDF and print JSON")
    p.add_argument("pdf", help="path to the timetable PDF")
    p.add_argument("direction", choices=["up", "down"])

    # export subcommand
    e = sub.add_parser("export", help="parse PDF(s) and write to a SQLite database")
    e.add_argument("db", help="path to the SQLite database (created if absent)")
    e.add_argument("--down", metavar="PDF", help="PDF for the down direction")
    e.add_argument("--up", metavar="PDF", help="PDF for the up direction")
    e.add_argument("--operator", required=True, metavar="NAME", help='e.g. "Central Railway"')
    e.add_argument("--operator-short", required=True, metavar="CODE", help='e.g. "CR"')
    e.add_argument("--line", required=True, metavar="NAME", help='e.g. "Central Line"')
    e.add_argument("--line-short", required=True, metavar="CODE", help='e.g. "CR-ML"')
    e.add_argument(
        "--line-type",
        default="suburban_rail",
        choices=["suburban_rail", "metro", "bus"],
        help="default: suburban_rail",
    )

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
    {"parse": cmd_parse, "export": cmd_export, "apk-export": cmd_apk_export, "mindicator": cmd_mindicator}[args.command](args)


if __name__ == "__main__":
    main()
