# InkRoute Serena and Obsidian quickstart

Use this first. The optimized workflow is to avoid both tools when the seam is already named.

## Fastest route

Classification priority: explicit workflow/tooling optimization first, exact repo seam second, repeated gap-batch third, owner/reference/memory-read/memory-append lookup last. Generic words like `script`, `.md`, `workflow`, `Serena`, or `Obsidian` are not enough to justify live Serena or Obsidian unless the request is about configuring, optimizing, routing, bootstrapping, or maintaining the tool workflow itself.

Every route needs a concrete done shape before more evidence is gathered: patch the named seam, protect direct call sites, apply or reject one prior decision against repo truth, align workflow surfaces, or return one precise blocker.

| Signal | Action |
| --- | --- |
| File, helper, route, package, assertion, gap row, script, dependency, or lockfile seam is named | Skip Serena and Obsidian; use RTK on the exact slice. |
| Serena, Obsidian, RTK, local vault, workflow scripts, or workflow routing itself is explicitly the task | Patch known workflow surfaces directly; do not call Serena or Obsidian as ceremony. |
| User says to stop collecting evidence, stop inventing blockers, finish gaps, close gaps, or move aggressively | Collapse to exact-seam or current-gap-batch mode; patch the next local source/test/tracker seam or return one precise non-local blocker. |
| A compacted summary, active goal, handoff, or resumed context names the current runtime, static test, tracker row, artifact-identity seam, helper-identity seam, package loop, or next target | Classify as gap-batch; use `continuation-handoff.md`; treat the handoff as task brief, then verify only the exact repo slices before patching. |
| Repeated source/test/tracker gap-batch seam is in progress | Use `current-gap-batch.md`; do not reopen tools between rows. |
| The task is starting to sprawl | Use `one-shot-protocol.md`; name the file set, read once, patch once. |
| CI or local quality output names an exact error seam | Use `ci-fix-intake.md`; patch the named seam before owner lookup. |
| Owner or route boundary is unknown | Use one Serena owner lookup, then RTK-read the located file. |
| Exported/shared contract changes and call sites are unclear | Use one Serena references lookup, then patch source/tests/direct callers. |
| Prior accepted architecture/API decision changes the implementation or review | Read one specific InkRoute Obsidian note, then decide from repo evidence. |
| Durable decision, Codex review, or DeepSeek handoff is complete | Do not browse the vault first; append one concise Obsidian note after the result is known. |

## Serena query shapes

```text
Find the symbol or file that owns <route/function/gap-runtime-name>. Return only likely owner files and exported symbols.
```

```text
Find direct references to <exported-symbol>. Return call sites/tests that would break if the contract changes.
```

```text
Trace <route-path> from handler to service/database boundary. Return handler, validator, auth/tenant checks, and persistence names.
```

## Obsidian route

Open `Projects/InkRoute/Command-Center.md` first. Use `Projects/InkRoute/Tool-Admission.md` only when the tool route is unclear, and `Projects/InkRoute/Exact-Seam-Protocol.md` when the seam is already named.

Do not use Obsidian for current source, current tests, current tracker state, current diff, CI logs, provider state, secrets, raw logs, production URLs, PII, customer data, or `.env` values.

## Workflow/tooling route

Known workflow surfaces are `docs/ai/SERENA_OBSIDIAN_WORKFLOW.md`, `.serena/project.yml`, `.serena/memories/inkroute/*`, `scripts/workflow/route-serena-obsidian.mjs`, `scripts/bootstrap-obsidian-vault.ps1`, and `package.json` workflow scripts. Patch these directly from repo evidence; refresh the local vault only when requested or when repo-owned vault notes must mirror the new contract.

Obsidian shortcut meanings:

- `workflow:obsidian` bootstraps the local vault while preserving existing app settings and notes.
- `workflow:obsidian:daily` bootstraps the local vault and creates today's local scratch note while preserving existing app settings and notes.
- `workflow:obsidian:daily:open` creates today's local scratch note and opens the local vault.
- `workflow:obsidian:refresh` refreshes repo-owned notes/templates only.
- `workflow:obsidian:force-config` refreshes Obsidian app/workspace/bookmark settings only.
- `workflow:obsidian:refresh-all` refreshes both repo-owned notes/templates and app/workspace config.

## RTK commands

Route a fuzzy task before spending semantic or memory tool budget:

```powershell
rtk pnpm workflow:admit -- "<task text>"
```

Use this when the question is only whether Serena or Obsidian should be admitted.

For longer explanatory route output:

```powershell
rtk pnpm workflow:route -- "<task text>"
```

Use the router output strictly:

- `Budget:` is the live-tool ceiling.
- `Start:` is the first useful entrypoint, not a mandate to read all entrypoints.
- `Entrypoints:` is the shortest lane-specific doc/card/note list.
- `Evidence:` is the repo/context ceiling.
- `Done:` is the expected result shape.
- If the next patch is obvious before the ceiling is reached, patch it.

Continuation shortcut: if a summary already names the active source/test/tracker seam, do not route through Obsidian to reconstruct state and do not ask Serena to reconfirm ownership. Read the exact current row/source/test slices and patch.

Stable JSON shortcut for delegated agents:

```powershell
rtk pnpm workflow:route:json -- "<task text>"
```

Use `classification`, `minimumFileSet`, `entrypoints`, `budget.serenaLookups`, `budget.obsidianReads`, `budget.obsidianWrites`, `budget.conditionalSerenaLookups`, `budget.conditionalObsidianReads`, and `budget.conditionalObsidianWrites` as ceilings, not requirements.
Use `routePacket` for delegated agents that need the whole route in one object. Conditional budget fields are guarded fallbacks only when the named owner/reference/prior-decision condition still exists after the first repo slice.

Smallest human-readable packet:

```powershell
rtk pnpm workflow:route:packet -- "<task text>"
```

Smallest live-tool stoplight:

```powershell
rtk pnpm workflow:micro -- "<task text>"
```

Operator alias:

```powershell
rtk pnpm workflow:stoplight -- "<task text>"
```

Use this when the only question is whether Serena or Obsidian should be admitted. It prints only classification, live tool ceilings, minimum files, next action, and done shape.

Hot route with conditional ceilings and stop rule:

```powershell
rtk pnpm workflow:route:hot -- "<task text>"
```

Codex-facing hot path:

```powershell
rtk pnpm workflow:codex -- "<task text>"
```

Read only `classification`, `start`, live-tool ceilings, `minimumFiles`, `next`, `evidence`, `done`, and `stopRule`; do not expand into every entrypoint unless the packet tells you to. `minimumFiles` is the first-pass file set: name it, read it once, patch it, and stop when the done shape is reachable.

Strict packet for hot contexts:

```powershell
rtk pnpm workflow:route:strict -- "<task text>"
```

Use strict packets when a context is resumed, a gap seam is already hot, or a delegated agent needs conditional budgets exposed. Conditional budgets are guarded fallbacks, not permission to browse.

```powershell
rtk proxy powershell -NoProfile -Command "Get-Content -LiteralPath '<known-file>' | Select-Object -Skip <n> -First <n>"
```

```powershell
rtk proxy powershell -NoProfile -Command "Select-String -LiteralPath '<known-file>' -Pattern '<symbol>'"
```

```powershell
rtk proxy powershell -NoProfile -Command "rg --files '<scope>' | rg '<needle>'"
```

When a command string contains PowerShell variables, escape `$` as backtick-dollar before sending it through RTK proxy from Codex or outer PowerShell. See `rtk-powershell.md`.

## Stop rule

If Serena or Obsidian is unavailable, noisy, credential-gated, or ambiguous after one follow-up, stop and use scoped RTK search. Tool friction is not a blocker.

If the user's wording is pushing against evidence collection, do not route that into more tool discovery. The optimized answer is movement: exact slice, patch, honest external gate.
