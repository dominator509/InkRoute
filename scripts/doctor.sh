#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

python "${ROOT}/scripts/verify_markers.py"
python "${ROOT}/scripts/gap_lint.py"
python "${ROOT}/scripts/ledger_lint.py"
python "${ROOT}/scripts/quarantine_import_lint.py"
