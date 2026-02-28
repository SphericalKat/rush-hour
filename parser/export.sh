#!/usr/bin/env bash
# Re-exports all lines into data/timetable.db from scratch.
# Run from the parser/ directory: bash export.sh
set -e

DB=data/timetable.db

rm -f "$DB"
echo "Building $DB..."

# CR Main Line (2024)
uv run python -m rush_hour_parser export "$DB" \
  --down "data/1728294831372-SUB PTT DN ML'24.pdf" \
  --up   "data/1728294891897-SUB PTT UP ML'24.pdf" \
  --operator "Central Railway" --operator-short CR \
  --line "Main Line" --line-short CR-ML

# CR Harbour Line (Oct 2024)
uv run python -m rush_hour_parser export "$DB" \
  --down "data/1728295099358-HB PTT 05102024-DN.pdf" \
  --up   "data/1728295133534-HB PTT 05102024-UP.pdf" \
  --operator "Central Railway" --operator-short CR \
  --line "Harbour Line" --line-short CR-HL

# CR Trans-Harbour Line (Jan 2024) — single PDF contains all trains
uv run python -m rush_hour_parser export "$DB" \
  --down "data/1707135434187-TRANS HB PTT WEF 13 JAN 2024.pdf" \
  --operator "Central Railway" --operator-short CR \
  --line "Trans-Harbour Line" --line-short CR-THL

# CR Port Line (Dec 2025) — single PDF contains both directions
uv run python -m rush_hour_parser export "$DB" \
  --down "data/1770378300167-PORT LINE PTT WEF 15.12.2025.pdf" \
  --up   "data/1770378300167-PORT LINE PTT WEF 15.12.2025.pdf" \
  --operator "Central Railway" --operator-short CR \
  --line "Port Line" --line-short CR-PL

# WR Western Line (Feb 2026)
uv run python -m rush_hour_parser export "$DB" \
  --down "data/1772027210607-DN PTT W.E.F 19.02.2026.pdf" \
  --up   "data/1772027329822-UP PTT W.E.F 19.02.2026.pdf" \
  --operator "Western Railway" --operator-short WR \
  --line "Western Line" --line-short WR-WL

echo "Done. Verifying..."
sqlite3 "$DB" "
SELECT l.short_name, t.direction, COUNT(*) AS trains
FROM trains t JOIN lines l ON l.id = t.line_id
GROUP BY l.short_name, t.direction
ORDER BY l.short_name, t.direction;"

echo ""
echo "Station count: $(sqlite3 "$DB" 'SELECT COUNT(*) FROM stations;')"
echo "Duplicate check (should be empty):"
sqlite3 "$DB" "
SELECT LOWER(name), COUNT(*), GROUP_CONCAT(name, ' | ')
FROM stations
GROUP BY LOWER(name)
HAVING COUNT(*) > 1;"
