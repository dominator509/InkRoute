# InkRoute CI fix intake

Use this for GitHub Actions or local quality failures.

## Fast route

1. Capture the exact failing check and error seam.
2. If the log names a dependency, file, assertion, package script, or lockfile mismatch, patch that seam first.
3. Skip Serena and Obsidian unless the owner is genuinely unknown.
4. Do not invent new blockers when the failure is already actionable.
5. Do not run validation unless the user asks; record `not run` if skipped.

## Common seams

- `pnpm-lock.yaml` out of sync with `package.json`.
- Static test import/assertion drift.
- Package script naming drift.
- Manifest or tracker row mismatch.
- Docs/source-text gate mismatch.

## Result shape

- Check:
- Exact error seam:
- Files patched:
- Tests/commands:
- Remaining external gate:
- Risk:
