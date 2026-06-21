# InkRoute tool admission

Use this card before spending time on Serena, Obsidian, DeepSeek-Claude, browser, provider, or validation tools.

## Default

RTK-scoped repo evidence wins by default. Serena and Obsidian are optimization tools, not required ceremonies.

When the route is fuzzy but not worth a tool lookup, run the local classifier:

```powershell
rtk pnpm workflow:admit -- "<task text>"
```

Use `workflow:admit` for the lowest-friction answer to "should Serena or Obsidian be used?"

For longer explanatory route output, use:

```powershell
rtk pnpm workflow:route -- "<task text>"
```

For delegated agents or automation, use the stable JSON shortcut:

```powershell
rtk pnpm workflow:route:json -- "<task text>"
```

For the smallest human-readable route packet, use:

```powershell
rtk pnpm workflow:route:packet -- "<task text>"
```

For the smallest live-tool stoplight, use:

```powershell
rtk pnpm workflow:micro -- "<task text>"
```

Operator alias:

```powershell
rtk pnpm workflow:stoplight -- "<task text>"
```

It prints only classification, live Serena/Obsidian ceilings, minimum files, next action, and done shape.

For the lowest-noise local route, use:

```powershell
rtk pnpm workflow:route:brief -- "<task text>"
```

For hot resumed, fuzzy, or evidence-prone work that needs the stop rule and conditional tool ceilings, use:

```powershell
rtk pnpm workflow:route:hot -- "<task text>"
```

Operator alias:

```powershell
rtk pnpm workflow:hotstart -- "<task text>"
```

Codex-facing hot path:

```powershell
rtk pnpm workflow:codex -- "<task text>"
```

The classifier is not evidence and does not inspect repo state. It only applies this admission card consistently.

Package workflow shortcuts:

- `workflow:admit` prints the quickest live Serena/Obsidian admission ceiling.
- `workflow:codex` prints the hot route for fuzzy, resumed, delegated, or evidence-prone Codex work.
- `workflow:stoplight` prints the micro admit/reject stoplight for Serena and Obsidian.
- `workflow:obsidian` bootstraps missing local vault files only.
- `workflow:obsidian:daily` bootstraps missing local vault files and creates today's local scratch note.
- `workflow:obsidian:daily:open` creates today's local scratch note and opens the local vault.
- `workflow:obsidian:refresh` refreshes repo-owned notes/templates.
- `workflow:obsidian:force-config` refreshes Obsidian app/workspace/bookmark settings.
- `workflow:obsidian:refresh-all` refreshes both notes/templates and app/workspace config.

Read its output as a contract:

- `Budget:` is the maximum live Serena/Obsidian/validation/tool use.
- `Start:` is the first useful entrypoint for the lane.
- `Entrypoints:` is the shortest lane-specific doc/card/note list.
- `minimumFiles:` is the first-pass file ceiling; brief mode prints it without the longer evidence prose.
- `Evidence:` is the maximum context to gather before editing.
- `Done:` is the shape of the result to produce.
- Stop early when the done shape is already reachable.
In JSON mode, `routePacket` is the one-object handoff for delegated agents and scripts.
In packet mode, execute the printed `next` line directly and stop at the printed `done` shape. The printed `minimumFiles` line is the maximum first-pass file set; do not expand into every entrypoint unless that line or `next` requires it.
Numeric JSON budget fields are deterministic route-classification output, not prose parsing. Use `serenaLookups`, `obsidianReads`, and `obsidianWrites` as immediately admitted ceilings. Use `conditionalSerenaLookups`, `conditionalObsidianReads`, and `conditionalObsidianWrites` only when the named unknown-owner, prior-decision, or durable-append condition still exists after the first repo slice.

Classifier priority is fixed:

1. Explicit workflow/tooling changes to Serena, Obsidian, RTK, router, local vault, tool admission, one-shot, or workflow optimization.
2. Exact repo seams, including concrete paths, `GAP-*` rows, helpers, assertions, dependencies, lockfiles, CI seams, or git seams.
3. Repeated source/test/tracker gap-batch work.
4. Owner/reference/memory lookups.

Generic words such as `script`, `.md`, `workflow`, `Serena`, or `Obsidian` do not justify live Serena or Obsidian use by themselves. Route by concrete intent unless the task is about configuring, optimizing, routing, bootstrapping, or maintaining the tool workflow itself.

## Workflow/tooling lane

If the task is to optimize Serena, Obsidian, RTK routing, local vault cards, or this workflow itself, the owner is already known. Patch the repo workflow surfaces directly:

- `docs/ai/SERENA_OBSIDIAN_WORKFLOW.md`
- `.serena/project.yml`
- `.serena/memories/inkroute/*`
- `scripts/workflow/route-serena-obsidian.mjs`
- `scripts/bootstrap-obsidian-vault.ps1`
- `package.json` workflow scripts

Do not use live Serena or Obsidian lookups as a ceremony step for their own configuration. Prefer this order: router script, canonical doc, Serena cards, Obsidian bootstrap text, then optional vault refresh. Refresh the local vault only when explicitly useful or when repo-owned note templates must mirror the new contract.

## Admit Serena only when

- The owning file, route boundary, service, model, helper, or exported symbol is unknown.
- A shared exported contract is changing and direct references must be protected.
- A backend flow needs one route-to-service-to-persistence trace before editing.
- A delegated backend diff changed exported symbols and call-site risk is unclear.

Reject Serena when the user, failing check, `GAP_TRACKER.md`, static assertion, package script, helper name, route, or file path already names the seam.

## Admit Obsidian only when

- A prior accepted InkRoute architecture/API decision changes the implementation or review.
- A Codex review outcome, accepted decision, or reviewed DeepSeek handoff is durable enough to retain after repo evidence is known.
- One specific `Projects/InkRoute/*` note is enough.

Reject Obsidian for current source truth, current gap state, current tests, current diffs, current branch, current CI logs, provider state, runtime evidence, secrets, or production facts.

## Admit DeepSeek-Claude only when

- The task is substantial backend implementation.
- Codex can give a bounded backend-only brief.
- Codex will review correctness, security, auth, tenant isolation, data integrity, transactions, errors, logging, API compatibility, missing tests, and scope creep.

Reject DeepSeek-Claude for frontend/aesthetic ownership, secrets, provider settings, production infrastructure, legal copy, unbounded research, or exact one-file edits.

## Admit browser, provider, device, or deployment tools only when

- The user explicitly asks for live evidence.
- The local software seam is already closed and the remaining question is external proof.
- The action does not touch secrets, production data, irreversible provider settings, or infrastructure without explicit approval.

## Admit validation only when

- The user explicitly asks to run it.
- The command is non-provider-safe and scoped to the changed seam.
- The expected cost and side effects are clear.

Otherwise report `not run` and offer the next scoped command.

## Ninety-second gate

1. If an exact seam is named, skip Serena and Obsidian.
2. If owner or references are unknown, use one Serena lookup.
3. If a prior accepted decision changes the edit, read one Obsidian note.
4. If a local code/test/tracker seam can close without credentials, patch it.
5. If external proof remains, keep it as an explicit gate instead of inventing a blocker.

Friction override: phrases like `stop collecting evidence`, `stop hallucinating blockers`, `actually close the gaps`, `finish gaps`, or `aggressively` are admission denials for Serena and Obsidian. Use the exact seam or current gap-batch loop unless a real unknown owner/reference is blocking the patch.

## Evidence ceilings

| Route | Ceiling | Done shape |
| --- | --- | --- |
| Exact seam | Named file/row/test slice only | Patch paired source/test/tracker/docs seam. |
| Gap batch | One tracker row, one source slice, one test slice | Helper/contract identity exported, asserted, and named in tracker. |
| Owner unknown | One Serena owner answer plus located file slice | Owner identified and patched, or one precise fallback search used. |
| Shared contract | One Serena references answer plus direct call-site slices | Contract and direct callers/tests stay compatible. |
| Obsidian decision read | One named project note plus repo evidence | Prior decision applied or rejected against repo truth. |
| Obsidian durable append | Current repo evidence only, then one concise append | Decision, reviewed handoff, or review outcome retained without raw logs/diffs/secrets/current-state claims. |
| Workflow/tooling | Router/doc/config/bootstrap surfaces only | Workflow contract aligned without live-tool ceremony. |

## Current gap-batch shortcut

When a repeated helper-identity or static-contract gap batch is already in motion, use `.serena/memories/inkroute/current-gap-batch.md`.

- Do not use Serena to confirm rows, files, helpers, or tests already named by `GAP_TRACKER.md` or the failing assertion.
- Do not use Obsidian between rows in the same repeated pattern.
- Do not promote provider, CI, browser, device, legal, production, or credential evidence into a new local blocker.
- Patch source, static tests, package mirrors if present, and the exact tracker row together.

## RTK-first optimizer

- Current repo state belongs to RTK-scoped reads, not Serena or Obsidian.
- Exact file, route, helper, gap row, package script, failing assertion, or lockfile seam means zero Serena and zero Obsidian.
- Compacted summaries and handoffs are task briefs, not current-state evidence. If they name the seam, use zero Serena and zero Obsidian, then read the exact repo slices before patching.
- Use `rtk proxy powershell -NoProfile -Command "<scoped command>"` for PowerShell builtins, pipelines, and exact shell behavior.
- Escape `$` as backtick-dollar inside RTK-proxied PowerShell command strings when launched from Codex or an outer PowerShell.
- Do not add RTK to package scripts, CI workflows, provider automation, or production commands.
- If validation was not explicitly requested, do not run it; report `not run` and offer the next scoped command.

## Output contract

Serena should return likely owner files, exported symbols, route boundaries, and direct references only. Obsidian should retain accepted decisions, reviewed handoffs, and durable review outcomes only. Everything else should stay in repo files, trackers, tests, or targeted RTK command output.
