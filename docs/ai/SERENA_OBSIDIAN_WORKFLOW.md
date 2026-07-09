# Serena and Obsidian Workflow

Use Serena and Obsidian to reduce context drag, not to add a research phase. Repo code, tests, `GAP_TRACKER.md`, committed docs, and `spec/*` remain authoritative.

## Global defaults

- RTK wraps repo shell commands; use `rtk proxy powershell -NoProfile -Command "<scoped command>"` for PowerShell builtins, pipelines, and exact raw shell behavior.
- Serena is a semantic jump and memory tool, not a repo summarizer or source-edit surface.
- Obsidian is project memory, not evidence.
- If a target file, route, gap row, test, or static assertion is already known, skip both tools and patch directly from repo evidence.
- If a tool blocks, asks for credentials, returns noisy results, or remains ambiguous after one follow-up, state the fallback once and use scoped RTK search.
- Every route must end in a concrete done shape: patched exact seam, direct call sites protected, targeted decision applied, or one precise blocker/question. Do not collect more evidence after the done shape is reachable.

## Routing contract

Classification priority is strict: bare live Serena activation first, Serena semantic lookup second when activation/use is paired with symbol, owner, reference, call-site, or route/service-boundary discovery, explicit workflow/tooling optimization third, exact repo seams fourth, repeated gap-batch signals fifth, then owner/reference/memory-read/memory-append lookups. Treat `workflow` as a tooling signal only when it is paired with Serena, Obsidian, RTK, routing, router, tool admission, vault, bootstrap, or one-shot language. A bare mention of Serena or Obsidian is not enough to enter tooling mode; route by the concrete intent unless the request is about configuring, optimizing, routing, bootstrapping, or maintaining the tool workflow itself. Plain `activate`, `activation`, or `Serena activation` wording is not maintenance by itself; only `fix`, `diagnose`, `configure`, `optimize`, `index`, `LSP`, `.serena`, or `.serena/project.yml` wording converts Serena activation into maintenance. If the user says to activate or use Serena and then asks to find symbols, owners, references, call sites, or a route/service boundary, classify it as Serena semantic lookup instead of Serena-maintenance. Do not let generic words such as `script`, `.md`, or bare `workflow` trigger a semantic lookup when the task already identifies a CI workflow, package workflow, owning workflow surface, or exact repo seam.

| Task shape | Serena | Obsidian | Action |
| --- | --- | --- | --- |
| Bare request to activate Serena/current project | One activation call | Skip | Activate the absolute project root `C:\dev\InkRoute`, read only `.serena/memories/inkroute/activation.md`, then stop unless another concrete task remains. |
| Exact file, route, gap row, or static assertion is known | Skip | Skip | Read the smallest current slice and patch. |
| Failing check names the exact missing dependency, file, row, or assertion | Skip | Skip | Patch the named seam and update the local source/test/tracker contract. |
| Owner route, service, model, or symbol is unknown | One owner lookup | Skip | Inspect the located file slice before editing. |
| Exported/shared contract changes | One references lookup | Skip unless a prior API decision matters | Patch compatible source/tests and direct call sites only. |
| Serena activation/use plus symbol, owner, reference, call-site, or route/service-boundary discovery | One semantic lookup after activation if needed | Skip | Read only `.serena/memories/inkroute/activation.md`, run one focused owner/reference lookup, then inspect located repo slices. |
| Prior accepted architecture/API decision changes the edit | Optional one lookup if code impact is unclear | Read one specific InkRoute note | Decide from repo evidence, not memory. |
| DeepSeek-Claude handoff or Codex review | Lookup changed exported symbols only if impact is unclear | Append one concise note only after review if durable; do not browse the vault first | Codex owns final acceptance. |
| Tooling workflow | Usually skip because files are known | Skip; bootstrap owns local notes | Patch `.serena/project.yml`, `.serena/memories/inkroute/*`, this doc, or `scripts/bootstrap-obsidian-vault.ps1`. Use `.serena/memories/inkroute/serena-health.md` for activation/health fallback rules. |

Hard budget: one Serena lookup, one optional follow-up only if ambiguous, one targeted Obsidian read only when history changes the decision. If either tool is unavailable, credential-gated, noisy, or still ambiguous, say the fallback once and use scoped RTK search.

Fastest safe default: when `GAP_TRACKER.md` names the owning runtime, test, package, or route files, skip Serena and Obsidian entirely. Read the row, read the smallest exact file slice, patch the local source/test/tracker seam, and keep provider, legal, production, credential, live-browser, device, and CI proof as external evidence gates.

Current-session accelerator: when a compacted summary, active goal, or handoff names a current target such as a runtime/static helper-identity seam, artifact-identity seam, source/test/tracker loop, package loop, or next file, route directly to `gap-batch`. Treat that summary as the task brief only; verify the exact current repo slices, patch, and do not open Obsidian for current-state reconstruction.

## Zero-tool triggers

These are optimized paths, not exceptions:

- A `GAP_TRACKER.md` row names the runtime and static test.
- A failing check names a missing package, lockfile mismatch, fixture, file, script, or assertion.
- The user names a concrete file, helper, route, package, command surface, or tracker row.
- The user says to activate or use Serena and also asks for symbols, references, call sites, owners, or route/service boundaries; admit one live Serena lookup rather than treating activation as workflow maintenance.
- The user says `workflow` in the CI/package-script sense without naming Serena, Obsidian, RTK, routing, router, tool admission, vault, bootstrap, or one-shot workflow tooling.
- The next edit is limited to workflow docs, Serena config, local Obsidian bootstrap, task briefs, or tracker wording.
- The current change repeats an already-established runtime-static gap closure pattern.
- A compacted summary or handoff names the current runtime, static test, tracker row, next target, or package loop.

For these, do not ask Serena or Obsidian for confirmation. Use RTK to read the exact repo slice and patch.

## Continuation and handoff lane

Use this when a resumed Codex context, compacted summary, delegated handoff, or previous-agent note already names the current source/test/tracker seam.

- Treat the handoff as the task brief, not as current-state evidence.
- If the handoff names an active goal, current target, runtime/static seam, artifact-identity seam, or package loop, classify it as `gap-batch` unless the user explicitly asks for workflow/tooling changes.
- Skip Obsidian; it is not needed to reconstruct current source, tests, tracker state, branch state, or diff state.
- Skip Serena when the handoff names the owner runtime, static test, tracker row, helper, assertion, package, or next target.
- Use one Serena owner/reference lookup only when the handoff names behavior but not ownership, or when changing an exported/shared contract and direct callers are unclear.
- Read only the exact current repo slices before patching: one tracker row, one source slice, one static-test slice, and a package mirror only if the seam requires it.
- If the handoff is stale or conflicts with repo truth, trust the repo slice and continue from the smallest current seam.

Done shape: resumed source/test/tracker seam patched, exact tracker row updated, external evidence gates preserved, and validation reported as `not run` unless explicitly requested.

## Workflow/tooling lane

When the task is to fix or optimize Serena, Obsidian, RTK routing, local vault cards, or this workflow itself, do not use Serena or Obsidian as a ceremony step. The owning seams are already known:

- `.serena/project.yml` for Serena indexing scope, ignore rules, initial prompt, and memory-card pointers.
- `.serena/project.local.yml` for private local overrides only; keep it ignored and do not put shared routing rules there.
- `.serena/memories/inkroute/*` for one-card routing, gap-batch, exact-seam, RTK, Serena health, and tool-admission presets.
- `.serena/memories/inkroute/serena-health.md` for activation, health, noisy-output fallback, and unavailable-tool behavior.
- `docs/ai/SERENA_OBSIDIAN_WORKFLOW.md` for the canonical repo contract.
- `scripts/workflow/route-serena-obsidian.mjs` for the executable route classifier.
- `scripts/workflow/check-serena-config.mjs` for repo-side Serena config/card/gitignore health checks.
- `scripts/bootstrap-obsidian-vault.ps1` for repo-owned Obsidian notes, templates, bookmarks, and workspace defaults.
- `package.json` workflow scripts for user-facing shortcuts.

Codex sessions can have Serena configured in the repo while exposing no callable Serena MCP tools. Treat that as tool unavailability, not as application failure: say it once, use `rtk pnpm workflow:codex -- "<task text>"` for local routing if a concrete task remains, and only edit Serena workflow surfaces when the user asked for Serena maintenance.

Repo-side health and live-tool mounting are separate. `rtk pnpm workflow:serena:check` can prove that `.serena/project.yml`, required Serena cards, memory-write mode, gitignore hygiene, compact answer budgets, and route-classifier behavior are coherent. It does not prove that the current Codex session has mounted live Serena MCP tools; if the repo check is healthy and live tools are still absent, the remaining action is outside this repository.
When activating live Serena, always target the absolute project root `C:\dev\InkRoute`; do not activate a parent directory, symlink, temp checkout, generated bundle, or `docs/ai/repomix-summary.xml` context.
When repo-side health is coherent but Codex still exposes no callable Serena tools, stop repo churn and repair the host integration instead: attach or restart the Serena MCP server for this project and retry activation. On this Windows workstation, prefer the absolute host launcher `C:\Users\domin\.local\bin\serena.exe` with explicit startup/tool timeouts instead of a bare PATH-dependent `serena` command.

Keep `.serena/project.local.yml` local-only. It is for developer overrides, should stay gitignored, and should not be used for shared InkRoute routing rules.

Operator shortcut for this exact lane: classifier first, health check second, mirror third, bootstrap fourth. Patch `scripts/workflow/route-serena-obsidian.mjs` when wording or priority changes; use `scripts/workflow/check-serena-config.mjs` for repo-side Serena config hygiene; mirror the rule into this doc, `.serena/memories/inkroute/*`, and `.serena/memories/inkroute/serena-health.md` when health/fallback behavior changes; update `scripts/bootstrap-obsidian-vault.ps1` only when repo-owned Obsidian notes/templates need the same wording.

Optimization order:

1. Tighten the executable router first when a repeated routing mistake can be classified by text; explicit workflow/tooling optimization must outrank generic exact-seam words, but bare `workflow`, `Serena`, or `Obsidian` must not outrank CI/package-script/exact-seam context unless paired with configuring, optimizing, routing, router, tool admission, vault, bootstrap, or one-shot language. Serena activation followed by symbol/reference/call-site/owner lookup is the semantic-lookup lane, not workflow maintenance.
2. Mirror the rule into the canonical doc and Serena memory cards.
3. Update the Obsidian bootstrap text so `workflow:obsidian:refresh` regenerates matching vault notes.
4. Do not read or write live Obsidian notes unless the user asks to refresh/bootstrap the local vault.
5. Do not troubleshoot Serena or Obsidian connectors during gap closure unless the requested deliverable is the tooling integration itself.

Default output for this lane: changed workflow surfaces, whether the local vault was refreshed, validation status, and any remaining manual step.

## Batch gap closure accelerator

Use this for repeated local software-gap closure:

User-friction phrases such as `stop collecting evidence`, `actually close the gaps`, `aggressively`, or `stop hallucinating blockers` are routing signals. Treat them as a hard push into this lane when a local source/test/tracker seam is available. Do not answer by adding Serena, Obsidian, or a new planning/evidence pass.

1. Read the GAP row and the named runtime/static test slice.
2. Export named `*ExecutionPolicy` and `*RequiredExternalEvidence` helpers when the contract is inline.
3. Type execution plans and artifact reviews to those helper identities.
4. Assert helper identity in static tests with `toBe(...)` before value-shape assertions.
5. Update `GAP_TRACKER.md` with exact helper names.
6. Keep provider, legal, production, credential, device, browser, and CI proof as explicit external evidence gates.

Do not reopen Obsidian between similar rows unless a prior accepted architecture/API decision changes the pattern.
For package-wide identity seams, finish the local source/test/tracker loop by package before switching context:

1. Count only the package-scoped inline `requiredCommands: [` / `requiredControls: [` returns and weak `toContain(...)` assertions.
2. Pair each inline contract with the existing readiness builder and static test.
3. Export a named helper, type the plan field as `typeof helper`, and return the helper identity.
4. Replace weak command/control `toContain(...)` assertions with `toBe(helper)` when the plan should expose the exact helper.
5. Update only the matching `GAP_TRACKER.md` row with the helper name and preserve external proof gates.

Serena is rejected during this package loop once the owner source and test file are known. Obsidian is rejected during this package loop unless a prior accepted API/architecture decision changes whether the helper should exist.

## Workflow lanes

Use the lane before choosing tools:

| Lane | Trigger | Tool route | Completion shape |
| --- | --- | --- | --- |
| Gap closure | `GAP_TRACKER.md` row names owner/test files | Skip Serena and Obsidian | Source/test/tracker seam patched; external evidence gates explicit. |
| CI quality fix | Check log names dependency, file, assertion, lockfile, or package script | Skip Serena and Obsidian | Patch exact failing seam; do not invent wider blockers. |
| Owner discovery | Route/service/model/helper owner unknown | One Serena owner lookup | Read located slice and patch. |
| Shared contract | Exported symbol/API behavior changes | One Serena references lookup | Patch source/tests/direct call sites. |
| Serena semantic lookup | Activation/use plus symbols, owners, references, call sites, or route/service-boundary discovery | One Serena owner/reference lookup after activation if needed | Return likely files, exported symbols, direct call-site risks, then inspect repo slices. |
| Handoff review | DeepSeek-Claude or delegated output needs acceptance | Serena only for changed exported symbols if impact unclear; Obsidian append only after review | Findings first, then accepted decision/handoff note if durable. |
| Workflow/tooling | Serena/Obsidian/RTK workflow itself changes | Usually skip both because files are known | Patch `.serena/project.yml`, `.serena/memories/inkroute/serena-health.md`, this doc, bootstrap script, or repo-local vault templates. |

If a lane is exact-file or exact-error, move directly to the patch. Serena is not a ceremony tax.

## Admission checklist

Before using Serena, answer these:

- Will the lookup change the next edited file?
- Will the lookup protect an exported/shared contract?
- Will the lookup identify direct call sites that must be patched?

If all answers are no, skip Serena. Use scoped RTK search or an exact file slice instead.

Use the shorter scorecard when the route is still fuzzy:

| Tool | Admit only when | Reject when |
| --- | --- | --- |
| Serena (gated) | Owner, exported references, or direct call-site blast radius is unknown. | The file, route, gap row, helper, assertion, package script, or CI seam is already named. |
| Obsidian | A prior accepted InkRoute decision changes the implementation or review. | The question is current source, test, tracker, diff, branch, CI, provider, or runtime state. |
| RTK | Current repo evidence is needed. | The action would mutate secrets, providers, production infra, or run validation without approval. |
| DeepSeek-Claude | Substantial backend implementation needs delegation and Codex can review it. | Frontend/aesthetic work, secrets, provider settings, production infra, or unbounded research is involved. |

Before using Obsidian, answer these:

- Does a prior accepted InkRoute decision change this implementation or review?
- Is the note one of the project notes listed below?
- Is the content durable enough to help a future agent avoid repeated reasoning?

If all answers are no, skip Obsidian. Do not let memory lookup delay credential-free implementation.

## Ninety-second loop

1. Classify the task: exact-file, owner-unknown, shared-contract, memory-read, memory-append, review/handoff, validation, or tooling.
2. If exact-file or exact gap row is known, skip both tools.
3. If the owner is unknown, use one Serena owner lookup and then read the target slice.
4. If a shared export changes, use one Serena references lookup before patching.
5. If a prior decision changes the edit, read one specific InkRoute Obsidian note.
6. Patch from repo evidence.
7. Append one Obsidian note only after a durable decision, review, or handoff exists.

## Evidence budgets

These budgets are ceilings, not targets. Stop early when the patch seam is clear.

| Route | Evidence ceiling | Done shape |
| --- | --- | --- |
| Exact seam | Named file/row/test slice only | Patch the named source/test/tracker/docs seam and preserve external gates. |
| Gap batch | One tracker row, one source slice, one test slice | Export/type/assert helper identity and update the exact tracker row. |
| Owner unknown | One Serena owner answer plus the located file slice | Owner identified and patched, or one precise fallback search used. |
| Shared contract | One Serena references answer plus direct call-site slices | Exported contract and direct callers/tests remain compatible. |
| Obsidian decision read | One named project note plus current repo evidence | Prior decision applied or rejected against repo truth. |
| Obsidian durable append | Current repo evidence only, then one concise append | Decision, reviewed handoff, or review outcome retained without raw logs/diffs/secrets/current-state claims. |
| Workflow/tooling | Router/doc/config/bootstrap surfaces only | Workflow contract aligned without live Serena/Obsidian ceremony. |
| Validation | Requested command output only | Result summarized and next failing seam named. |

If the next edit is already obvious, the budget for Serena and Obsidian is zero. The local optimization is movement: exact slice, patch, honest status.

## Quickstart entrypoints

Use these repo-local entrypoints instead of rebuilding the workflow from memory:

| Surface | Entrypoint | Purpose |
| --- | --- | --- |
| Serena | `.serena/memories/inkroute/quickstart.md` | One-card routing rule, query shapes, and stop rule. |
| Serena | `.serena/memories/inkroute/current-gap-batch.md` | Active source/test/tracker gap-batch accelerator. |
| Serena | `.serena/memories/inkroute/continuation-handoff.md` | Resume from compacted summaries or handoffs without rebuilding context. |
| Serena | `.serena/memories/inkroute/workflow-optimizer.md` | Zero-ceremony workflow/tooling optimizer for Serena, Obsidian, RTK, router, and vault changes. |
| Serena | `.serena/memories/inkroute/serena-health.md` | Activation/health fallback for Serena setup, unavailable tools, and noisy semantic output. |
| Obsidian | `Projects/InkRoute/Quickstart.md` | Vault-side mirror of the same routing rule. |
| Repo docs | `docs/ai/SERENA_OBSIDIAN_WORKFLOW.md` | Canonical full workflow contract. |
| Shell | `pnpm workflow:admit -- "<task text>"` | Print the micro stoplight before spending Serena or Obsidian budget. |
| Shell | `pnpm workflow:intake -- "<task text>"` | Print the strict compact intake packet for fuzzy, resumed, delegated, or evidence-prone tasks. |
| Shell | `pnpm workflow:route -- "<task text>"` | Print the Serena/Obsidian/RTK route before spending tool budget. |
| Shell | `pnpm workflow:route:brief -- "<task text>"` | Print the lowest-noise local route: classification, start, tool ceilings, minimum files, next action, and done shape. |
| Shell | `pnpm workflow:route:hot -- "<task text>"` | Print the hot-path route with live and conditional tool ceilings plus the stop rule, without the longer packet prose. |
| Shell | `pnpm workflow:hotstart -- "<task text>"` | Alias for the hot-path route when resumed or fuzzy work needs one-screen tool ceilings. |
| Shell | `pnpm workflow:codex -- "<task text>"` | Codex-facing alias for the hot-path route; use this before fuzzy, resumed, or evidence-prone work. |
| Shell | `pnpm workflow:route:micro -- "<task text>"` | Print the smallest stoplight: classification, live tool ceilings, minimum files, next action, and done shape. |
| Shell | `pnpm workflow:micro -- "<task text>"` | Alias for the micro stoplight when the only useful answer is admit or reject Serena/Obsidian. |
| Shell | `pnpm workflow:stoplight -- "<task text>"` | Operator alias for the micro stoplight; use this when deciding only whether Serena or Obsidian is admitted. |
| Shell | `pnpm workflow:route:packet -- "<task text>"` | Print the smallest executable route packet for humans or delegated agents. |
| Shell | `pnpm workflow:route:json -- "<task text>"` | Print stable JSON for delegated agents and scripts. |
| Shell | `pnpm workflow:route:strict -- "<task text>"` | Print the compact packet plus guarded conditional budgets for hot contexts. |
| Shell | `pnpm workflow:serena:check` | Check repo-side Serena config/cards/gitignore hygiene without activating live Serena or installing anything. |
| Shell | `pnpm workflow:obsidian` | Bootstrap the local vault without opening it. |
| Shell | `pnpm workflow:obsidian:open` | Bootstrap and open the local vault. |
| Shell | `pnpm workflow:obsidian:daily` | Bootstrap the local vault and ensure today's local scratch note exists. |
| Shell | `pnpm workflow:obsidian:daily:open` | Bootstrap, ensure today's local scratch note exists, and open the local vault. |
| Shell | `pnpm workflow:obsidian:refresh` | Refresh repo-owned vault notes/templates without overwriting app config. |
| Shell | `pnpm workflow:obsidian:force-config` | Refresh local Obsidian app/workspace/bookmark settings without overwriting repo-owned notes/templates. |
| Shell | `pnpm workflow:obsidian:refresh-all` | Refresh both repo-owned vault notes/templates and local Obsidian app/workspace/bookmark settings. |

Codex shell usage should still wrap these through RTK, for example `rtk pnpm workflow:route -- "GAP-010 static test"` or `rtk pnpm workflow:obsidian:open`. The package scripts themselves intentionally do not require RTK so local users and CI are not forced to have RTK.

Use `rtk pnpm workflow:admit -- "<task text>"` as the lowest-friction preflight when the only question is whether Serena or Obsidian should be admitted. It prints classification, start, live tool ceilings, minimum files, next action, and done shape without the longer packet prose.

For a workflow optimization request such as `Optimize workflow with Serena and Obsidian`, the expected packet is workflow-tooling with `Serena: 0` and `Obsidian: 0 live reads`. The work is repo-file alignment, not live tool use.

## Executable router

Use the local router when the route is fuzzy but not worth a research pass:

```powershell
rtk pnpm workflow:intake -- "GAP-010 static test helper identity"
```

`workflow:intake` is the preferred operator entrypoint. It is equivalent to strict packet mode and should be the first move for resumed contexts, delegated prompts, aggressive gap closure, or any task where the failure mode is collecting more evidence instead of moving.

```powershell
rtk pnpm workflow:route -- "GAP-010 static test helper identity"
```

For delegated agents or scripts that need a stable parser target, request JSON output:

```powershell
rtk pnpm workflow:route:json -- "GAP-010 static test helper identity"
```

Shortcut form:

```powershell
rtk pnpm workflow:route:json -- "GAP-010 static test helper identity"
```

Strict packet form:

```powershell
rtk pnpm workflow:route:strict -- "GAP-010 static test helper identity"
```

Use strict packet mode when a context is resumed, the next seam is hot, or the user is explicitly pushing against evidence collection. It prints immediate live-tool budgets plus conditional budgets. Conditional Serena or Obsidian budget is not permission to browse; it is a guarded fallback only if the named owner/reference/prior-decision condition still exists after the first repo slice.

The router is deliberately heuristic. It does not inspect repo state and it is not evidence. It exists to enforce the same admission policy every time:

- exact seam named means RTK exact-slice first
- unknown owner means one Serena owner lookup
- shared exported contract means one Serena references lookup
- prior accepted decision or reviewed handoff means one targeted Obsidian note
- validation belongs to explicit RTK-wrapped commands, not Serena or Obsidian

The router now prints an explicit tool budget. Treat that budget as the default ceiling unless new information changes the classification:

- `Serena: 0` means do not use Serena as ceremony.
- `Serena: 1` means one owner/reference lookup, plus one follow-up only if ambiguous.
- `Obsidian: 0` means do not read or write live notes.
- `Obsidian: 1` means one targeted InkRoute note, only when a prior accepted decision changes the edit or review.
- `Entrypoints:` names the repo, Serena-card, or Obsidian-note surfaces to use for that lane. It is a shortcut, not another evidence requirement.
- `Evidence:` is the maximum context to gather before editing.
- `Done:` is the shape of the expected result.

Route-packet rule: for fuzzy tasks, prefer one router call and then execute the packet. The packet consists of `classification`, `Start`, `Budget`, `Evidence`, `Done`, and the stop rule. `Start` is the first useful entrypoint, not permission to browse every listed file. If `Done` is reachable from the current repo slice, patch immediately and do not spend the remaining budget.

Minimum-file rule: the router packet now prints `minimumFiles`. Treat that list as the maximum coherent file set for the first pass. Do not read every entrypoint when `minimumFiles` names the actual owner surfaces. For workflow/tooling, the default first-pass set is the router plus this canonical doc, with `.serena/project.yml`, `.serena/memories/inkroute/*`, `.serena/memories/inkroute/serena-health.md`, and `scripts/bootstrap-obsidian-vault.ps1` added only when the changed rule or health contract must be mirrored there.

If the router says to skip a tool, skip it unless new information changes the classification.

## Execution defaults

Use these defaults before any tool call:

| Situation | Default action | Why |
| --- | --- | --- |
| User names a concrete file, route, helper, gap ID, package, command, or assertion | Skip Serena and Obsidian; use RTK on the exact slice | The owner is already known. |
| GitHub Actions or local quality output names a missing package, lockfile drift, fixture, script, file, or assertion | Patch the named seam first | The error already contains the routing answer. |
| A repeated runtime/static gap pattern is in progress | Continue the source -> static test -> tracker row loop | Reopening tools adds drag without changing the next file. |
| A shared exported symbol is being changed and direct users are unclear | Use one Serena references lookup | References can prevent API or call-site regressions. |
| A prior accepted architecture/API decision changes the edit | Read one specific InkRoute Obsidian note | Memory is useful only when it changes the implementation or review. |
| A tool is unavailable, noisy, credential-gated, or ambiguous after one follow-up | Fall back to scoped RTK search | Tool friction is not a blocker. |

Default failure mode: keep moving from repo evidence. Do not convert tool unavailability into a new gap or blocker unless the user's requested deliverable is the tool integration itself.

For delegated agents, prefer the JSON router output before any live Serena or Obsidian access when the prompt is fuzzy. The JSON fields are intentionally small:

| Field | Meaning |
| --- | --- |
| `classification` | Stable machine-readable lane such as `workflow-tooling`, `exact-seam`, `gap-batch`, `owner-unknown`, `obsidian-decision`, or `obsidian-append`. |
| `route` | The selected Serena/Obsidian/RTK lane. |
| `reason` | Why that lane won. |
| `next` | The next repo action. |
| `budget` | Maximum Serena and Obsidian calls, including numeric `serenaLookups`, `obsidianNotes`, `obsidianReads`, `obsidianWrites`, and conditional fallback fields. |
| `routePacket` | Compact packet for delegated agents: classification, first entrypoint, live-tool budget, next action, evidence ceiling, done shape, and stop rule. |
| `entrypoints` | Repo docs, Serena cards, or Obsidian notes that are most relevant for the selected lane. |
| `minimumFileSet` | The smallest coherent first-pass file set for the lane; this overrides any temptation to read all entrypoints. |
| `budget.conditionalSerenaLookups` | Extra Serena lookup allowed only if a real unknown owner/reference condition remains after classification. |
| `budget.conditionalObsidianReads` | Extra Obsidian read allowed only if a prior accepted decision is named and changes the edit or review. |
| `budget.conditionalObsidianWrites` | Extra Obsidian append allowed only after a durable result exists and the route explicitly calls for retained memory. |
| `commands` | Stable RTK command hints for rerouting, JSON output, and vault refresh. |
| `evidence` | Maximum context to collect before patching. |
| `done` | Concrete completion shape. |
| `stopRule` | Fallback when tools are noisy or unavailable. |

For human handoffs, prefer the compact packet:

```powershell
rtk pnpm workflow:route:packet -- "<task text>"
```

Use brief mode for hot local tasks where the next action is enough:

```powershell
rtk pnpm workflow:admit -- "<task text>"
```

Equivalent long-form brief command:

```powershell
rtk pnpm workflow:route:brief -- "<task text>"
```

Use hot mode when the task is resumed, fuzzy, or evidence-prone but does not need the full packet:

```powershell
rtk pnpm workflow:route:hot -- "<task text>"
```

Equivalent operator alias:

```powershell
rtk pnpm workflow:hotstart -- "<task text>"
```

Codex-facing alias:

```powershell
rtk pnpm workflow:codex -- "<task text>"
```

Hot mode prints `classification`, `start`, live and conditional tool ceilings, `minimumFiles`, `next`, `done`, and `stopRule`. It is the preferred quick route when deciding whether Serena or Obsidian should be admitted.

Use micro mode when even hot mode is too much ceremony:

```powershell
rtk pnpm workflow:micro -- "<task text>"
```

Operator stoplight alias:

```powershell
rtk pnpm workflow:stoplight -- "<task text>"
```

Micro mode prints only `classification`, live Serena/Obsidian ceilings, `minimumFiles`, `next`, and `done`. It is the fastest route for exact seams, resumed gap batches, and workflow-tooling asks where the expected answer is usually zero live Serena and zero live Obsidian.

Packet mode prints only `classification`, `start`, live Serena/Obsidian ceilings, `minimumFiles`, `next`, `evidence`, `done`, and `stopRule`. Execute that packet first; do not expand into all entrypoints unless the `next` line requires it.

Strict packet mode adds conditional budgets and the strict rule: name `minimumFiles`, read only that coherent set, patch once, and do not spend conditional Serena or Obsidian budget unless the named condition still exists after the first repo slice.

Budget mode is deterministic. Numeric JSON budget fields come from the route classification, not from parsing the human-readable `Budget:` sentence. Treat `serenaLookups`, `obsidianReads`, and `obsidianWrites` as immediately admitted calls. Treat `conditionalSerenaLookups`, `conditionalObsidianReads`, and `conditionalObsidianWrites` as guarded fallbacks only when the current task still satisfies the named condition after the first repo slice.

Packet mode also prints `minimumFiles`. Use that line to name the first-pass file set before editing. If the next edit is already obvious inside that set, patch immediately and leave validation as `not run` unless explicitly requested.

## One-shot protocol

Use this when work starts to sprawl:

1. Name the smallest coherent file set before editing.
2. Read each required file once.
3. Patch in one pass.
4. Do not re-read changed files just to inspect your own work.
5. Do not run validation unless the user asks.
6. If validation would normally be next, report `not run` and offer to run it.

## Serena optimization

Serena should answer narrow routing questions and write onboarding/maintenance memories only. Do not use Serena source-editing tools in this repo; source edits should happen through Codex patching tools or RTK-scoped repo commands.

- owner file and exported symbol for an unknown route, service, model, helper, or runtime seam
- direct references for a changed exported contract
- route-to-service-to-persistence boundary names for unfamiliar backend flow
- changed exported-symbol review when call-site impact is unclear

On Serena project activation, read `.serena/memories/inkroute/activation.md` first, use `.serena/memories/inkroute/quickstart.md` only if route admission remains unclear, and use `.serena/memories/inkroute/routing-contract.md` only after that. Do not list, summarize, or open every InkRoute memory card as startup context. A bare activation request is a live-tool operation, not config maintenance; if live Serena tools are unavailable, including when Codex exposes no callable Serena MCP tools, state that once and fall back only if another concrete repo task remains.

Serena setup, activation, indexing, LSP, health, memory-card, and project-config requests are workflow/tooling tasks. Patch `.serena/project.yml`, `.serena/memories/inkroute/*`, `.serena/memories/inkroute/serena-health.md`, this doc, `scripts/workflow/route-serena-obsidian.mjs`, or `scripts/workflow/check-serena-config.mjs` directly instead of calling live Serena as ceremony.

When optimizing Serena, do not blur repo repair with external tool mounting. If the repo-side check is healthy but live Serena calls remain unavailable, report that boundary instead of adding more cards, ignores, or router rules.

Use Serena only when the answer changes the next file you will open or the call sites you must protect. If the next file is already known from `GAP_TRACKER.md`, a failing static assertion, a route path, or a named helper, skip Serena and spend the tool budget on the exact repo slice.

Do not use Serena for current tracker state, current diff state, CI logs, generated artifacts, package-manager lockfiles, or broad repo summaries. If `GAP_TRACKER.md` already names the source and test files, Serena is skipped by default.

Preferred Serena result shape:

- likely owner file
- exported symbol or route boundary
- direct references or call sites, only when requested
- one risk sentence if changing the symbol could break callers

Rejected Serena result shape:

- broad repo summaries
- copied file contents
- tracker status
- generic architecture descriptions that do not identify the next file to edit

Use this shape for best results:

```text
Find the owner of <symbol-or-route>. Return only likely files, exported symbols, and direct call-site risks.
```

Stop after one useful answer. If the answer is noisy or ambiguous after one follow-up, fall back to scoped RTK search.

## Command recipes

Use these instead of ad hoc broad scans:

```powershell
rtk proxy powershell -NoProfile -Command "Select-String -LiteralPath 'GAP_TRACKER.md' -Pattern '^\| GAP-010 ' -Context 0,0"
```

For large tracker rows, split into fields instead of dumping the whole row:

```powershell
rtk proxy powershell -NoProfile -Command "`$line=(Select-String -LiteralPath 'GAP_TRACKER.md' -Pattern '^\| GAP-010 ' | Select-Object -First 1).Line; `$cells=`$line -split '\|'; 0..([Math]::Min(`$cells.Count-1,12)) | ForEach-Object { '[' + `$_ + '] ' + `$cells[`$_].Trim() }"
```

When launching RTK-proxied PowerShell commands from Codex or an outer PowerShell prompt, escape `$` as backtick-dollar inside the command string. Otherwise the outer shell can expand variables before RTK starts the inner shell.

```powershell
rtk proxy powershell -NoProfile -Command "Get-Content -LiteralPath '<known-file>' | Select-Object -Skip <n> -First <n>"
```

```powershell
rtk proxy powershell -NoProfile -Command "Select-String -LiteralPath '<known-file>' -Pattern '<symbol-or-helper>'"
```

For file-name discovery only, use scoped `rg` through RTK:

```powershell
rtk proxy powershell -NoProfile -Command "rg --files '<scope>' | rg '<needle>'"
```

## Gap-closure preset

Use this chain for `GAP_TRACKER.md` work:

1. `GAP_TRACKER.md` row.
2. Owning runtime/readiness source.
3. Runtime matrix, command list, or artifact helper.
4. Static assertions.
5. Package mirror if present.
6. Tracker wording.

Aggressive closure rule: if a requirement can be represented as a fail-closed guard, command label, matrix row, artifact assertion, static test, or local readiness contract without credentials, implement it instead of writing a new blocker. Keep provider, legal, production, credential, live-browser, device, and CI gates as explicit external evidence requirements.

Friction override: if the user says to stop collecting evidence, stop inventing blockers, finish gaps, or close gaps aggressively, the next step must be a local patch or one precise non-local blocker. Serena and Obsidian budgets collapse to zero unless the owner or direct references are genuinely unknown.

Default for gap work: zero Obsidian calls and either zero or one Serena lookup.

## Current gap-batch accelerator

Use `.serena/memories/inkroute/current-gap-batch.md` for active repeated helper-identity or static-contract closure. This is the fastest route when the current row, runtime, static test, or package is already known.

1. Read the exact tracker row.
2. Read the smallest source/test slices.
3. Export named command, control, evidence, execution-policy, or external-evidence helpers when inline contracts need identity.
4. Type plans, readiness objects, and artifact reviews to helper identities when TypeScript can enforce it.
5. Replace weak `toContain(...)` assertions with `toBe(helper)` when the exposed contract should be the exact helper.
6. Update only the matching tracker row with the helper name.
7. Preserve provider, credential, legal, production, device, browser, and CI proof as external gates.

Helper-identity lane:

1. Locate only the next inline contract or weak assertion in the current scope.
2. Alias package-level required evidence, command, control, or suite helpers when they already exist.
3. Add a local decision builder only when decision evidence extends readiness evidence.
4. Assert readiness identity with `toBe(helper)` and decision arrays through the exported builder.
5. Update the exact `GAP_TRACKER.md` row with helper or builder names.

Do not ask Serena to reconfirm files already named by the row, failing check, or static assertion. Do not open Obsidian between rows in the same repeated pattern. Do not run validation unless the user asks.

## Backend change preset

1. Identify the route, validator, service, persistence, and audit/event boundary.
2. Use one Serena references lookup only if changing an exported/shared contract.
3. Patch tenant/auth/RBAC checks before persistence changes.
4. Add or update the narrowest test/static assertion that locks the behavior.
5. Keep frontend styling, provider settings, production infrastructure, secrets, and pending legal copy untouched unless explicitly approved.

## Query pack

Use short, answerable Serena prompts:

```text
Find the symbol or file that owns <route/function/gap-runtime-name>. Return only likely owner files and exported symbols.
```

```text
Find direct references to <exported-symbol>. Return call sites/tests that would break if the contract changes.
```

```text
Trace <route-path> from handler to service/database boundary. Return handler, validator, auth/tenant checks, and persistence names.
```

```text
Inspect changed exported symbols in <files>. Return only correctness/security/API risks and direct call sites.
```

Stop after one useful result. If the first answer is unavailable, noisy, or ambiguous after one follow-up, fall back to scoped RTK search.

## Obsidian rules

Use Obsidian as targeted project memory only.

Allowed durable project notes:

- `Projects/InkRoute/Repo-Brief.md`
- `Projects/InkRoute/Architecture.md`
- `Projects/InkRoute/API-Contracts.md`
- `Projects/InkRoute/Codex-Reviews.md`
- `Projects/InkRoute/DeepSeek-Handoffs.md`
- `Projects/InkRoute/Decisions.md`

Allowed scratch/router project notes:

- `Projects/InkRoute/Command-Center.md`
- `Projects/InkRoute/Current-Work.md`
- `Projects/InkRoute/Workflow-Routing.md`
- `Projects/InkRoute/RTK-Command-Recipes.md`
- `Projects/InkRoute/Vault-Safety.md`
- `Projects/InkRoute/Serena-Obsidian-Loop.md`
- `Projects/InkRoute/Gap-Closure-Dashboard.md`

Read one note only when a prior accepted decision changes implementation or review. For durable retention requests, do not browse first: use repo evidence, then append one concise note after a decision, Codex review, or DeepSeek handoff is known.

Do not open Obsidian during normal gap closure unless the gap depends on a prior accepted architecture/API decision that is not already represented in repo docs. The default gap path is repo evidence first: tracker row, owner file, test/static assertion, package mirror if present, then tracker wording.

Never store secrets, tokens, provider IDs, raw logs, customer data, PII, production URLs, database URLs, `.env` values, or credentials in Obsidian. Never use Obsidian as current repo state, test state, diff state, or gap tracker evidence.

## Obsidian write policy

Append memory only when it will help a future agent avoid repeating reasoning:

- accepted architecture/API decisions
- Codex review outcomes with repo paths and residual risks
- DeepSeek-Claude handoff summaries after Codex review
- durable gap-closure notes that preserve local/external evidence boundaries

Do not append routine command output, current diffs, temporary blockers, copied tracker rows, generated logs, or provider/runtime evidence. Those belong in repo files, test artifacts, or external systems.
For gap batches, prefer no Obsidian write. Write only when the batch establishes a durable repo convention that is not already captured in this file, .serena/memories/inkroute/*, GAP_TRACKER.md, source, or tests.

## Obsidian optimization

Open `Projects/InkRoute/Command-Center.md` first. Treat it as the vault-side router into the local workflow.

Use the vault like this:

- `Command-Center.md` for the route into the workflow.
- `Exact-Seam-Protocol.md` when the task already names a file, helper, row, assertion, package, or CI seam.
- `Tool-Admission.md` for the one-page Serena/Obsidian/RTK/DeepSeek decision gate.
- `Current-Work.md` for temporary local scratch only.
- `Workflow-Routing.md` for tool-admission decisions.
- `One-Shot-Protocol.md` for limiting reads and avoiding verification creep.
- `CI-Fix-Intake.md` for GitHub Actions failures that already name the failing seam.
- `Agent-Handoff-Intake.md` for delegated backend result intake.
- `Decisions.md` for accepted architecture/API decisions.
- `Codex-Reviews.md` for retained review outcomes.
- `DeepSeek-Handoffs.md` for reviewed backend-worker handoffs.
- `Gap-Closure-Dashboard.md` for scratch notes that still point back to `GAP_TRACKER.md`.

Keep Obsidian deliberately thin. Prefer repo file paths over copied content, and never store branch state, raw diffs, raw logs, current test output, secrets, provider IDs, production URLs, customer data, PII, or `.env` values.

For resumed gap batches and exact CI/package-script failures, do not open the vault at all. Obsidian should make durable decisions easier to find later, not make present-tense patching slower.

Obsidian write threshold:

- Write when the outcome is an accepted decision, reviewed handoff, durable API/architecture note, or review result a future agent should know. The append should contain repo paths, status, tests run or `not run`, residual risk, and no raw logs/diffs/secrets/current-state claims.
- Do not write when the outcome is routine gap progress, a transient blocker, current branch state, current failing output, a command transcript, or anything already represented in `GAP_TRACKER.md`, `spec/*`, source, or tests.

## Local Obsidian bootstrap

The repo-local vault is ignored under `.obsidian/InkRoute`.

Open `Projects/InkRoute/Command-Center.md` first. It is the vault-side router for the workflow notes, safety notes, gap dashboard, review templates, and durable decision logs.

Preferred package shortcuts:

```powershell
rtk pnpm workflow:obsidian
```

```powershell
rtk pnpm workflow:obsidian:open
```

```powershell
rtk pnpm workflow:obsidian:daily
```

```powershell
rtk pnpm workflow:obsidian:daily:open
```

```powershell
rtk pnpm workflow:obsidian:refresh
```

Direct script form:

```powershell
rtk proxy powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bootstrap-obsidian-vault.ps1
```

Open it immediately:

```powershell
rtk proxy powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bootstrap-obsidian-vault.ps1 -OpenNow
```

Create today's local scratch note:

```powershell
rtk proxy powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bootstrap-obsidian-vault.ps1 -WithDailyNote
```

Refresh local Obsidian workspace/app settings intentionally:

```powershell
rtk proxy powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bootstrap-obsidian-vault.ps1 -ForceConfig
```

Without `-ForceConfig`, the bootstrap preserves existing local Obsidian app, workspace, bookmark, hotkey, appearance, and plugin settings.

Refresh repo-owned InkRoute routing notes and templates intentionally:

```powershell
rtk proxy powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bootstrap-obsidian-vault.ps1 -ForceNotes
```

Without `-ForceNotes`, the bootstrap preserves existing workflow notes/templates. Use it after this repo changes the canonical Serena/Obsidian routing contract; do not use it for personal notes, current gap state, raw logs, branch state, or provider evidence.

Refresh both repo-owned notes/templates and local Obsidian app settings intentionally:

```powershell
rtk proxy powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bootstrap-obsidian-vault.ps1 -ForceNotes -ForceConfig
```

Package shortcuts mirror these modes:

```powershell
rtk pnpm workflow:obsidian:refresh
```

```powershell
rtk pnpm workflow:obsidian:force-config
```

```powershell
rtk pnpm workflow:obsidian:refresh-all
```

## RTK discipline

Use RTK for repo shell commands. For PowerShell builtins, pipelines, and exact raw command behavior, use:

```powershell
rtk proxy powershell -NoProfile -Command "<scoped command>"
```

Escape `$` as backtick-dollar in RTK-proxied PowerShell command strings launched from Codex or an outer PowerShell prompt.

Do not require RTK inside checked-in package scripts, CI workflows, provider commands, or production automation unless explicitly approved.

## Delegated-agent snippet

```text
Use RTK for every repo shell command. Use Serena only for one owner/reference lookup when the owner or call sites are unknown; do not summarize the repo. Skip Serena when the exact file, route, gap row, or static assertion is known. Use Obsidian only for one targeted InkRoute decision note when prior history changes the implementation, and append at most one concise note after a durable decision/review/handoff. Repo code, tests, GAP_TRACKER.md, and docs are authoritative. Do not touch secrets, .env files, provider resources, production infrastructure, legal copy, or unrelated UI styling. Return summary, files changed, tests run, remaining gaps, risks, and review checklist.
```

## Anti-patterns

- Broad Serena exploration before an exact known file edit.
- Reading Obsidian to determine current gap status.
- Copying raw CI/provider logs into Obsidian.
- Troubleshooting Serena or Obsidian during credential-free implementation work.
- Treating a memory note as fresher than repo code, tests, `GAP_TRACKER.md`, or `spec/*`.



