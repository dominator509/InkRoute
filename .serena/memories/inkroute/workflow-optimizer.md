# InkRoute workflow optimizer

Use this when the task names Serena, Obsidian, RTK, workflow routing, local vault cards, or tool admission.

For the phrase `Optimize workflow with Serena and Obsidian`, route here immediately. This lane optimizes the repo-owned tool workflow; it does not spend live Serena or Obsidian calls.

## Optimized route

1. Do not call live Serena or Obsidian as ceremony for their own configuration.
2. Patch the executable router first when classification priority or wording changes.
3. Mirror the rule into the canonical doc and Serena cards.
4. Update Obsidian bootstrap notes/templates only when the vault-side text must mirror the new contract.
5. Refresh the local vault only when repo-owned note templates must mirror the new contract.
6. Do not run validation unless explicitly requested.

## Evidence and done contract

- Workflow/tooling reads are limited to router, canonical doc, Serena cards, Obsidian bootstrap, and package workflow scripts.
- The expected done shape is aligned workflow surfaces, not broad source exploration.
- When the router emits `Evidence:` and `Done:`, treat those lines as the ceiling and output contract.
- If the next edit is obvious, patch it without live Serena or Obsidian confirmation.

## Classification priority

1. Explicit workflow/tooling optimization first: Serena, Obsidian, RTK, router, routing, local vault, tool admission, one-shot, or workflow optimization only when the task is about configuring, optimizing, routing, bootstrapping, or maintaining those tool surfaces.
2. Exact repo seams second: concrete file path, `GAP-*` row, helper, assertion, dependency, lockfile, CI seam, or git seam.
3. Repeated gap-batch signals third: source/test/tracker helper-identity loops.
4. Owner/reference/memory lookups last.

Treat `workflow` as workflow/tooling only when it is paired with Serena, Obsidian, RTK, routing, router, tool admission, vault, bootstrap, one-shot, or explicit workflow optimization. Do not let generic words such as `script`, `.md`, or bare `workflow` trigger Serena when the task already identifies a CI workflow, package workflow, owning workflow surface, or exact repo seam.
Treat bare `Serena` or `Obsidian` the same way; tool names alone do not override an exact repo seam, owner lookup, or current gap-batch loop.

## Known workflow surfaces

- `docs/ai/SERENA_OBSIDIAN_WORKFLOW.md`
- `.serena/project.yml`
- `.serena/memories/inkroute/*`
- `scripts/workflow/route-serena-obsidian.mjs`
- `scripts/bootstrap-obsidian-vault.ps1`
- `package.json` workflow scripts

## Obsidian refresh modes

- `workflow:obsidian` creates missing local vault files and preserves existing notes/app settings.
- `workflow:obsidian:daily` creates today's local scratch note and preserves existing notes/app settings.
- `workflow:obsidian:daily:open` creates today's local scratch note and opens the local vault.
- `workflow:obsidian:refresh` refreshes repo-owned notes/templates and preserves app settings.
- `workflow:obsidian:force-config` refreshes app/workspace/bookmark settings and preserves notes/templates.
- `workflow:obsidian:refresh-all` refreshes both repo-owned notes/templates and app/workspace/bookmark settings.

Use refresh modes intentionally. Do not refresh live Obsidian notes during ordinary gap closure or CI fixes.

## Optimization target

Default to zero-tool work when the seam is named:

- exact file, route, helper, gap row, assertion, package script, dependency, lockfile, or CI seam
- repeated source/test/tracker gap-batch work
- compacted-summary or active-goal continuations that name the runtime/static seam, artifact-identity seam, package loop, or next target
- workflow/tooling changes to Serena, Obsidian, RTK, or the local vault itself
- user-friction directives such as stop collecting evidence, stop inventing blockers, close gaps aggressively, or actually finish gaps

Admit Serena only for one owner/reference lookup when the owner or direct callers are unknown. Admit Obsidian only for one targeted project note when a prior accepted decision changes implementation or review.

## Router check

Use this only when the route is fuzzy:

```powershell
rtk pnpm workflow:admit -- "<task text>"
```

Use `workflow:admit` when the only decision is whether Serena or Obsidian should be admitted. It prints the quickest classification, live tool ceilings, minimum files, next action, and done shape.

Use strict intake for resumed, delegated, hot, or evidence-prone tasks:

```powershell
rtk pnpm workflow:intake -- "<task text>"
```

Use `workflow:intake` as the default operator entrypoint for resumed, delegated, hot, or evidence-prone tasks. It prints strict packet mode without making the caller remember the longer command name.

Use the longer router forms when you need a specific output shape:

```powershell
rtk pnpm workflow:route -- "<task text>"
```

Use this for delegated agents and scripts:

```powershell
rtk pnpm workflow:route:json -- "<task text>"
```

Use this for the smallest human-readable route packet:

```powershell
rtk pnpm workflow:route:packet -- "<task text>"
```

Use this for the smallest live-tool stoplight:

```powershell
rtk pnpm workflow:micro -- "<task text>"
```

Micro mode prints only classification, live Serena/Obsidian ceilings, minimum files, next action, and done shape. Use it when the only useful question is whether Serena or Obsidian should be admitted.

Operator alias:

```powershell
rtk pnpm workflow:stoplight -- "<task text>"
```

Use this for hot local work where the next action is all that matters:

```powershell
rtk pnpm workflow:route:brief -- "<task text>"
```

Use this for resumed, fuzzy, or evidence-prone work when you need live and conditional Serena/Obsidian ceilings plus the stop rule without the full packet prose:

```powershell
rtk pnpm workflow:route:hot -- "<task text>"
```

Equivalent operator alias:

```powershell
rtk pnpm workflow:hotstart -- "<task text>"
```

Codex-facing hot path:

```powershell
rtk pnpm workflow:codex -- "<task text>"
```

Use this for hot resumed contexts, aggressive gap closure, or delegated-agent prompts where conditional budgets must be visible:

```powershell
rtk pnpm workflow:route:strict -- "<task text>"
```

The router is a classifier, not evidence. Repo files, tests, `GAP_TRACKER.md`, and `spec/*` remain authoritative.
Its `Budget:` line caps tool use, its `Evidence:` line caps context gathering, and its `Done:` line names the result to produce before collecting anything else.
Its `Start:` line names the first useful entrypoint. Its `Entrypoints:` line names the shortest useful repo, Serena-card, or Obsidian-note surfaces for the lane; it is not permission for broad reading.
Its `minimumFiles` line names the first-pass file set; read only that coherent set before patching.
In JSON mode, `classification`, `routePacket`, `minimumFileSet`, `entrypoints`, `budget.serenaLookups`, `budget.obsidianNotes`, `budget.obsidianReads`, and `budget.obsidianWrites` are stable parser targets. Conditional fields such as `budget.conditionalSerenaLookups`, `budget.conditionalObsidianReads`, and `budget.conditionalObsidianWrites` are guarded fallbacks, not extra work to spend by default.
For delegated agents, pass the `routePacket` or `workflow:route:packet` output through unchanged so the agent can execute one compact route instead of reopening the full workflow.
For strict packets, pass conditional budgets through unchanged but treat them as guarded fallbacks only after the first repo slice proves the owner, direct references, or prior accepted decision is still genuinely unknown.
