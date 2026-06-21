# InkRoute routing contract

Use this as Serena's short operating card. The goal is one useful semantic jump, then repo evidence and patching.

## Default route

| Task shape | Serena | Obsidian | Next action |
| --- | --- | --- | --- |
| Exact file, route, gap row, or static assertion known | Skip | Skip | Read smallest target slice and patch. |
| Failing check names the exact missing dependency, file, row, or assertion | Skip | Skip | Patch the named seam and update the matching local contract. |
| Owner unknown | One owner lookup | Skip | Inspect located owner before editing. |
| Shared exported contract changes | One references lookup | Skip unless prior API decision matters | Patch compatible behavior and direct call sites. |
| Prior accepted decision changes the edit | Optional, only if code impact is unclear | Read one specific InkRoute note | Decide from repo evidence. |
| Review/handoff | Lookup changed exported symbols only if needed | Append one concise note after durable result; no vault browsing first | Codex reviews before acceptance. |
| Workflow/tooling change | Usually skip | Usually skip | Patch `.serena/project.yml`, this card, `docs/ai/SERENA_OBSIDIAN_WORKFLOW.md`, the router script, or the Obsidian bootstrap. |

Hard stop: after one failed, credential-gated, ambiguous, or noisy lookup, use scoped RTK search.

Default bias: exact known target beats tool use. Do not ask Serena or Obsidian for current branch, diff, test, tracker, or file contents; use RTK-scoped repo commands for those.

Serena admission rule: use it only if the answer changes the next file to open, the exported symbol to protect, or the direct call sites to patch. If not, skip it.

Fastest path: if `GAP_TRACKER.md` already names the runtime/test/doc files, do not perform a semantic lookup. Read the row, read the smallest exact source/test slice, patch the local seam, and leave provider/legal/production/CI/device/browser proof as explicit external gates.

## Tool route optimizer

| Signal | Optimized route |
| --- | --- |
| Concrete file/helper/route/gap/assertion named | RTK exact slice; no Serena or Obsidian. |
| CI log names dependency, lockfile drift, fixture, package script, file, or assertion | Patch that named seam first. |
| Unknown owner or route boundary | One Serena owner lookup, then RTK-read the owner. |
| Exported symbol changes and call sites are unclear | One Serena references lookup. |
| Prior accepted architecture/API decision changes implementation | One targeted Obsidian note, then repo evidence. |
| Durable decision, Codex review, or DeepSeek handoff is complete | Use repo evidence first, then append one concise Obsidian note; no raw logs, diffs, secrets, or current-state claims. |
| Tool lookup is noisy, unavailable, credential-gated, or still ambiguous | Stop lookup; scoped RTK search. |

Do not allow a skipped tool to look like a missing step. In this repo, skipping Serena and Obsidian is often the optimized path.
Treat bare `workflow` as current repo/CI/package-script context unless it is paired with Serena, Obsidian, RTK, routing, router, tool admission, vault, bootstrap, one-shot, or explicit workflow optimization.
Treat bare `Serena` or `Obsidian` the same way: classify by concrete intent unless the task is about configuring, optimizing, routing, bootstrapping, or maintaining the tool workflow itself.

## Zero-tool triggers

Skip Serena and Obsidian entirely when any of these are true:

- A GAP row names the runtime and static test.
- A failing check names a missing package, lockfile mismatch, file, fixture, script, or assertion.
- The user names a concrete file, helper, route, package, command surface, or tracker row.
- The user says `workflow` in the CI/package-script sense without naming Serena, Obsidian, RTK, routing, router, tool admission, vault, bootstrap, or one-shot workflow tooling.
- The next edit is restricted to workflow docs, Serena config, local Obsidian bootstrap, or task briefs.
- The next edit is restricted to workflow scripts or route-classifier behavior.

Use RTK for the exact slice and patch directly. A skipped lookup is the optimized path, not a missing step.

## Batch gap closure accelerator

For repeated runtime-static closure work:

Friction phrases such as `stop collecting evidence`, `actually close the gaps`, `finish the gaps`, `aggressively`, or `stop hallucinating blockers` force this lane when a local seam exists. The next action is source/test/tracker movement, not another semantic or memory lookup.

1. Read the GAP row and known runtime/static test slices.
2. Export named command, control, evidence, execution-policy, or external-evidence helpers when inline contracts need identity.
3. Type plans, readiness objects, and artifact reviews to those helper identities when TypeScript can enforce it.
4. Assert `toBe(...)` identity in static tests before value-shape assertions.
5. Update only the matching GAP row with exact helper names.
6. Keep provider, legal, production, credential, device, browser, and CI proof as explicit external gates.

Do not re-open Obsidian between similar rows unless a prior accepted architecture/API decision changes the pattern.

## Anti-drag checklist

- Do not ask Serena for a repo summary.
- Do not ask Serena for tracker truth, current diffs, CI logs, generated artifacts, or lockfile state.
- Do not open Obsidian before local gap closure unless an accepted prior decision changes the edit.
- Do not store branch names, raw logs, raw diffs, test output, provider IDs, production URLs, secrets, customer data, PII, or `.env` values in Obsidian.
- Do not let a failed or noisy tool lookup create a new blocker; fall back to scoped RTK search and keep moving.

## Gap work

1. `GAP_TRACKER.md` row.
2. Owner runtime/readiness source.
3. Matrix, command list, artifact helper, or fail-closed guard.
4. Static assertions.
5. Package mirror if present.
6. Tracker wording.

Aggressive closure rule: local software seams should be implemented when credentials are not required. Provider, legal, production, device, live-browser, credential, and CI evidence remains explicit external gating.

Friction override: when the user explicitly rejects more evidence collection or blocker-writing, Serena and Obsidian budgets are zero unless owner/references are truly unknown. Patch the next local seam or name one precise external gate.

## Query pack

- Owner: `Find the symbol or file that owns <route/function/gap-runtime-name>. Return only likely owner files and exported symbols.`
- References: `Find direct references to <exported-symbol>. Return call sites/tests that would break if the contract changes.`
- Route trace: `Trace <route-path> from handler to service/database boundary. Return handler, validator, auth/tenant checks, and persistence names.`
- Review: `Inspect changed exported symbols in <files>. Return only correctness/security/API risks and direct call sites.`

## Command pack

- Gap row fields from Codex or outer PowerShell: `rtk proxy powershell -NoProfile -Command "`$line=(Select-String -LiteralPath 'GAP_TRACKER.md' -Pattern '^\| GAP-000 ' | Select-Object -First 1).Line; `$cells=`$line -split '\|'; 0..([Math]::Min(`$cells.Count-1,12)) | ForEach-Object { '[' + `$_ + '] ' + `$cells[`$_].Trim() }"`
- Known slice: `rtk proxy powershell -NoProfile -Command "Get-Content -LiteralPath '<file>' | Select-Object -Skip <n> -First <n>"`
- Known symbol: `rtk proxy powershell -NoProfile -Command "Select-String -LiteralPath '<file>' -Pattern '<symbol>'"`
- Scoped filename discovery: `rtk proxy powershell -NoProfile -Command "rg --files '<scope>' | rg '<needle>'"`
- Package command: `rtk pnpm --filter <package> <script>`
- Compact route packet: `rtk pnpm workflow:route:packet -- "<task text>"`

## Obsidian

- Use only for accepted InkRoute decisions, Codex reviews, and DeepSeek handoffs.
- Start from `Projects/InkRoute/Command-Center.md` when opening the local vault manually.
- Read at most one project note before coding, and only when prior history changes the decision.
- Append at most one concise note after implementation/review/handoff, and only after repo evidence is known.
- Skip Obsidian entirely during normal local gap closure unless a prior accepted architecture/API decision is the deciding input.
- Never use Obsidian as current repo state, test evidence, diff evidence, or gap tracker truth.
- Never store secrets, provider IDs, raw logs, PII, customer data, production URLs, or `.env` values.

## RTK

Use RTK for repo shell commands. Use `rtk proxy powershell -NoProfile -Command "<scoped command>"` for PowerShell builtins, pipelines, and exact shell behavior. Do not put RTK requirements into package scripts, CI workflows, provider commands, or production automation without explicit approval.
