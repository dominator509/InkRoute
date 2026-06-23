#!/usr/bin/env python3
"""Detect imports from quarantine-style paths in app and package source."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SCAN_ROOTS = [ROOT / "apps", ROOT / "packages"]
IMPORT_PATTERN = re.compile(r"from\s+['\"]([^'\"]*(?:quarantine|shadow-corrupt)[^'\"]*)['\"]")


def main() -> int:
    findings: list[str] = []
    for scan_root in SCAN_ROOTS:
        if not scan_root.exists():
            continue
        for path in scan_root.rglob("*"):
            if path.suffix not in {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}:
                continue
            text = path.read_text(encoding="utf-8", errors="ignore")
            for match in IMPORT_PATTERN.finditer(text):
                findings.append(f"{path.relative_to(ROOT)} imports {match.group(1)}")

    if findings:
        print("Quarantine import lint failed:")
        for finding in findings:
            print(f"- {finding}")
        return 1

    print("Quarantine import lint passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
