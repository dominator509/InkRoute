#!/usr/bin/env python3
"""Lint the GAP tracker table shape without executing provider checks."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
TRACKER = ROOT / "GAP_TRACKER.md"
GAP_ROW = re.compile(r"^\| GAP-\d+ ")


def main() -> int:
    if not TRACKER.is_file():
        print("GAP_TRACKER.md is missing.")
        return 1

    findings: list[str] = []
    rows = 0
    for line_number, line in enumerate(TRACKER.read_text(encoding="utf-8").splitlines(), start=1):
        if not GAP_ROW.match(line):
            continue
        rows += 1
        cells = [cell.strip() for cell in line.split("|")]
        if len(cells) < 13:
            findings.append(f"line {line_number}: expected at least 12 table cells, found {len(cells) - 2}")
        if not line.rstrip().endswith("|"):
            findings.append(f"line {line_number}: GAP row should end with a table pipe")

    if findings:
        print("GAP tracker lint failed:")
        for finding in findings:
            print(f"- {finding}")
        return 1

    print(f"GAP tracker lint passed for {rows} GAP row(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
