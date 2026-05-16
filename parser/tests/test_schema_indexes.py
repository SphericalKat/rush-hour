import sqlite3
import unittest

from rush_hour_parser import apk_export


EXPECTED_INDEXES = {
    "idx_lines_operator",
    "idx_line_stations_station_line",
    "idx_trains_line",
}


def schema_indexes(schema: str) -> set[str]:
    conn = sqlite3.connect(":memory:")
    try:
        conn.executescript(schema)
        return {
            row[1]
            for table in ("lines", "line_stations", "trains")
            for row in conn.execute(f"PRAGMA index_list('{table}')")
        }
    finally:
        conn.close()


class SchemaIndexTest(unittest.TestCase):
    def test_apk_export_schema_creates_fk_lookup_indexes(self) -> None:
        self.assertTrue(EXPECTED_INDEXES <= schema_indexes(apk_export._SCHEMA))


if __name__ == "__main__":
    unittest.main()
