#!/usr/bin/env python3
"""Summarize open high-severity GAP rows for handoff escalation."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
TRACKER = ROOT / "GAP_TRACKER.md"
GAP_ROW = re.compile(r"^\| GAP-\d+ ")
ESCALATION_SEVERITIES = {"Critical", "High", "P0"}


def main() -> int:
    if not TRACKER.is_file():
        print("GAP_TRACKER.md is missing.")
        return 1

    escalations: list[tuple[str, str, str]] = []
    for line in TRACKER.read_text(encoding="utf-8").splitlines():
        if not GAP_ROW.match(line):
            continue
        cells = [cell.strip() for cell in line.split("|")]
        if len(cells) <= 7:
            continue
        gap_id = cells[1]
        area = cells[3] if len(cells) > 3 else "Unknown"
        priority = cells[5] if len(cells) > 5 else ""
        status = cells[7]
        if status == "Open" and priority in ESCALATION_SEVERITIES:
            escalations.append((gap_id, priority, area))

    print(f"Open high-severity GAP rows: {len(escalations)}")
    for gap_id, priority, area in escalations:
        print(f"- {gap_id} [{priority}] {area}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
