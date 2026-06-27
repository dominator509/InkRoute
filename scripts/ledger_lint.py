#!/usr/bin/env python3
"""Validate handoff ledger JSON files are readable and structurally simple."""

from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
LEDGERS = [
    ROOT / "docs" / "handoff" / "manifests" / "agent-execution-ledger.json",
    ROOT / "docs" / "handoff" / "manifests" / "agent-execution-queue.json",
]


def main() -> int:
    findings: list[str] = []
    for path in LEDGERS:
        if not path.is_file():
            findings.append(f"{path.relative_to(ROOT)} is missing")
            continue
        try:
            parsed = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            findings.append(f"{path.relative_to(ROOT)} is invalid JSON: {exc}")
            continue
        if not isinstance(parsed, (dict, list)):
            findings.append(f"{path.relative_to(ROOT)} must contain a JSON object or array")

    if findings:
        print("Ledger lint failed:")
        for finding in findings:
            print(f"- {finding}")
        return 1

    print("Ledger lint passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
