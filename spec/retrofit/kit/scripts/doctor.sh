#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AUDIT_DIR="${ROOT}/audit"
PROVISIONING="${ROOT}/PROVISIONING.md"
mkdir -p "${AUDIT_DIR}"
if [[ ! -f "${PROVISIONING}" ]]; then exit 2; fi
PLAN_JSON="$(python3 "${ROOT}/scripts/parse_provisioning.py" "${PROVISIONING}")"
FAIL=0
while IFS= read -r row; do
    CMD="$(echo "$row" | jq -r '.verify')"
    REQUIRED="$(echo "$row" | jq -r '.required')"
    if ! bash -c "$CMD" >/dev/null 2>&1; then
        [[ "$REQUIRED" == "YES" ]] && FAIL=1
    fi
done < <(echo "$PLAN_JSON" | jq -c '.[]')
if [[ $FAIL -ne 0 ]]; then
    python3 "${ROOT}/scripts/emit_run_blockers.py" "${AUDIT_DIR}/RUN_BLOCKERS.md"
    echo "HARD BLOCK — see RUN_BLOCKERS.md" >&2
    exit 1
fi
exit 0
