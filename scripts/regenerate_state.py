#!/usr/bin/env python3
"""Generate a lightweight local state summary when explicitly requested.

Default mode is dry-run so this remains safe for Codex handoffs. Pass --write to
write docs/quality/manifests/local-state-summary.json.
"""

from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "quality" / "manifests" / "local-state-summary.json"
TRACKER = ROOT / "GAP_TRACKER.md"
GAP_ROW = re.compile(r"^\| GAP-\d+ ")


def build_summary() -> dict[str, object]:
    status_counts: dict[str, int] = {}
    if TRACKER.is_file():
        for line in TRACKER.read_text(encoding="utf-8").splitlines():
            if not GAP_ROW.match(line):
                continue
            cells = [cell.strip() for cell in line.split("|")]
            status = cells[7] if len(cells) > 7 else "Unknown"
            status_counts[status] = status_counts.get(status, 0) + 1
    return {
        "source": "scripts/regenerate_state.py",
        "writesProductionState": False,
        "statusCounts": status_counts,
    }


def main() -> int:
    summary = build_summary()
    if "--write" in sys.argv[1:]:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        print(f"Wrote {OUT.relative_to(ROOT)}")
    else:
        print(json.dumps(summary, indent=2, sort_keys=True))
        print("Dry run only. Pass --write to update the local state summary artifact.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
