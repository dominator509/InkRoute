#!/usr/bin/env python3
"""Verify stable repository marker files exist.

This is intentionally read-only and dependency-free so it can be used during
handoffs without requiring provider credentials or package installs.
"""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_MARKERS = [
    "AGENTS.md",
    "GAP_TRACKER.md",
    "ROADMAP.md",
    "DATABASE_SCHEMA.md",
]


def main() -> int:
    missing = [path for path in REQUIRED_MARKERS if not (ROOT / path).is_file()]
    if missing:
        print("Missing repository marker file(s):")
        for path in missing:
            print(f"- {path}")
        return 1

    print("Repository marker files present:")
    for path in REQUIRED_MARKERS:
        print(f"- {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
