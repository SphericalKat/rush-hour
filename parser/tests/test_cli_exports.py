import unittest

import rush_hour_parser
from rush_hour_parser.__main__ import build_parser


class CliExportsTest(unittest.TestCase):
    def test_cli_does_not_expose_pdf_sqlite_export(self) -> None:
        parser = build_parser()
        subparsers_action = next(
            action for action in parser._actions if action.dest == "command"
        )

        self.assertNotIn("export", subparsers_action.choices)

    def test_package_does_not_export_pdf_sqlite_export(self) -> None:
        self.assertNotIn("export", rush_hour_parser.__all__)
        self.assertFalse(hasattr(rush_hour_parser, "export"))


if __name__ == "__main__":
    unittest.main()
