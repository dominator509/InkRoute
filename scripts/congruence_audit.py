#!/usr/bin/env python3
"""Print a lightweight GAP tracker congruence summary."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
TRACKER = ROOT / "GAP_TRACKER.md"
GAP_ROW = re.compile(r"^\| (GAP-\d+) ")


def main() -> int:
    if not TRACKER.is_file():
        print("GAP_TRACKER.md is missing.")
        return 1

    counts: dict[str, int] = {}
    duplicate_ids: set[str] = set()
    seen_ids: set[str] = set()
    for line in TRACKER.read_text(encoding="utf-8").splitlines():
        match = GAP_ROW.match(line)
        if not match:
            continue
        gap_id = match.group(1)
        if gap_id in seen_ids:
            duplicate_ids.add(gap_id)
        seen_ids.add(gap_id)
        cells = [cell.strip() for cell in line.split("|")]
        status = cells[7] if len(cells) > 7 else "Unknown"
        counts[status] = counts.get(status, 0) + 1

    print("GAP tracker congruence summary:")
    for status, count in sorted(counts.items()):
        print(f"- {status}: {count}")
    if duplicate_ids:
        print("Duplicate GAP ids detected:")
        for gap_id in sorted(duplicate_ids):
            print(f"- {gap_id}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
