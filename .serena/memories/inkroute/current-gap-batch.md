# InkRoute current gap batch

Use this for the active source/test/tracker closure loop. It exists to prevent tool drag.

## Admission rule

- Exact runtime, static test, helper, package, assertion, or `GAP-*` row known: skip Serena and Obsidian.
- Owner unknown after reading the row: one Serena owner lookup, then stop.
- Exported helper changes and direct callers are unclear: one Serena references lookup, then stop.
- Prior accepted API/architecture decision changes the edit: read one specific InkRoute Obsidian note, then stop.

## Batch loop

1. Read the exact `GAP_TRACKER.md` row.
2. Read the smallest owning source/test slices.
3. Export named command, control, evidence, execution-policy, or external-evidence helpers when inline contracts need identity.
4. Type plans/readiness objects to those helper identities when TypeScript can enforce it.
5. Replace weak `toContain(...)` assertions with identity assertions such as `toBe(helper)` when the contract should expose the exact helper.
6. Update only the matching tracker row with the new helper name.
7. Preserve provider, credential, legal, production, mobile-device, browser, and CI proof as external gates.

## Evidence ceiling

Default ceiling: one tracker row, one source slice, one test slice. If that reveals the helper/contract seam, patch immediately. Do not collect confirming evidence just to feel safer.

Done shape: helper/contract exported or typed, static assertion tightened, exact tracker row updated with the helper/builder name, and external gates preserved.

## Helper-identity lane

Use this lane for the current repeated runtime/static-contract work.

1. Locate only the next inline contract or weak assertion in the current scope.
2. Alias package-level required evidence, command, control, or suite helpers when they already exist.
3. Add a local `build*DecisionRequiredEvidence(...)`, `build*DecisionRequiredCommands(...)`, or equivalent builder only when decision evidence extends readiness evidence.
4. Assert identity with `toBe(helper)` for readiness contracts that should expose the same helper array.
5. Assert decision arrays by calling the exported builder instead of duplicating literals.
6. Update the exact `GAP_TRACKER.md` row with the helper or builder names.

Do not use broad scans that dump the whole repo. Prefer one scoped queue command, one exact row read, and one source/test read pair.

## Stop conditions

- Do not open Obsidian between rows in a repeated pattern.
- Do not ask Serena to confirm files already named by the row, failing check, or static assertion.
- Do not run validation unless the user asks.
- If tool output is noisy, credential-gated, unavailable, or ambiguous after one follow-up, use scoped RTK search and keep moving.
- If a compacted summary or handoff names the current runtime, static test, tracker row, or next target, use `continuation-handoff.md`; do not reopen Serena or Obsidian just to rebuild context.

## RTK reminder

Use `rtk proxy powershell -NoProfile -Command "<scoped command>"` for PowerShell builtins and pipelines. Escape `$` as backtick-dollar inside proxied command strings launched from Codex or another PowerShell.
