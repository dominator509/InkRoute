# Phase 17 — Quality Gate and Evidence Automation

## Status

Implemented as scaffolded, dependency-light repository quality gates. This phase does not close production blockers and does not verify runtime app builds or live providers.

## Source review performed before coding

Before coding, the Phase 16 ZIP was unpacked into a clean working tree and all 55 Markdown files were enumerated and read. The review confirmed:

- Phases 0 through 16 already exist as scaffolded or implemented artifacts.
- The roadmap has moved beyond the original Phase 15 deployment/handoff track.
- `GAP-122` still notes that evidence requirements are documented but not automated.
- `GAP-124` still notes that documentation audits are structural and not link/path-aware.
- `GAP-125` still notes that branch protection and required checks are not configured.
- The best codeable in-sandbox task is quality gate hardening rather than live deployment.

## Implemented in this phase

### `@inkroute/quality`

Added `packages/quality` with dependency-light TypeScript helpers for:

- Markdown link extraction and relative-link audit summaries.
- Gap tracker evidence row parsing.
- Gap evidence audit summaries.
- Quality gate definitions and summaries.
- Unit-test scaffold for future Vitest execution.

### Quality scripts

Added dependency-free scripts:

```bash
node scripts/quality/audit-doc-links.mjs
node scripts/quality/audit-gap-evidence.mjs
node scripts/quality/print-quality-gates.mjs
```

Added package scripts:

```bash
pnpm quality:docs
pnpm quality:gaps
pnpm quality:gates
pnpm quality:all
```

Updated `pnpm handoff:all` to include `pnpm quality:all` after dependency installation is available.

### Quality docs and manifests

Added:

- `docs/quality/README.md`
- `docs/quality/QUALITY_GATE_PROTOCOL.md`
- `docs/quality/CODEX_QUALITY_GATE_PROMPT.md`
- `docs/quality/manifests/markdown-link-audit.json`
- `docs/quality/manifests/gap-evidence-audit.json`
- `docs/quality/manifests/quality-gates.json`

### CI scaffold

Updated `.github/workflows/ci.yml` to include Phase 17 quality gates after handoff checks and before typecheck/test/build jobs.

### Docs and handoff

Updated:

- `README.md`
- `ROADMAP.md`
- `FILE_TREE.md`
- `GAP_TRACKER.md`
- `HANDOFF_TO_CODEX.md`
- `HANDOFF_TO_JULES.md`
- `HANDOFF_TO_CLAUDE_CODE.md`
- `docs/handoff/AGENT_EXECUTION_QUEUE.md`
- `docs/handoff/CODEX_FIRST_RUN_PROMPT.md`
- `docs/handoff/GAP_CLOSURE_PROTOCOL.md`
- `docs/handoff/manifests/agent-execution-queue.json`

## Implemented

- Dependency-free Markdown link audit script.
- Dependency-free gap evidence audit script.
- Dependency-free quality gate catalog printer.
- Machine-readable quality manifests.
- TypeScript helper package for future agent/tool reuse.
- CI scaffold hook for quality gate commands.
- Handoff docs updated with quality-first execution.

## Scaffolded only

- PR diff-aware gap evidence enforcement.
- GitHub branch-protection required checks.
- CODEOWNERS and repository rulesets.
- GitHub Issues/Projects sync for quality findings.
- Semantic documentation truth checking.
- Installed-monorepo Vitest execution for `@inkroute/quality`.

## Verification performed in this environment

Passed:

```bash
node scripts/quality/audit-doc-links.mjs
node scripts/quality/audit-gap-evidence.mjs
node scripts/quality/print-quality-gates.mjs
tsc --noEmit -p packages/quality/tsconfig.json
```

Also reran dependency-light typechecks for existing helper packages.

## Verification notes

- `audit-doc-links.mjs` passed. The current docs contain no Markdown links requiring relative target verification, but the script now protects future Markdown links.
- `audit-gap-evidence.mjs` completed with `warn` status, not `fail`. Warnings are expected because the current gap tracker intentionally contains qualified blocker values and scaffold-era wording. These warnings should guide future cleanup and PR review; they do not close any production gap.
- `print-quality-gates.mjs` generated the quality gate catalog successfully.

## Blocked or unverified in this environment

- `pnpm install`
- `pnpm quality:all`
- Vitest execution for `@inkroute/quality`
- GitHub Actions execution
- PR diff validation against a base branch
- Branch protection and required status checks
- CODEOWNERS enforcement
- GitHub Issues/Projects sync
- Secret scanning/repository settings

## New or updated gaps

Updated:

- `GAP-122` — now partially implemented with a dependency-free gap evidence audit script, but not PR-diff or branch-protection enforced.
- `GAP-124` — now partially implemented with Markdown relative-link auditing, but not semantic truth checking.
- `GAP-125` — now references Phase 17 CI scaffold hooks, but repository settings are still external.

Added:

- `GAP-126` — Phase 17 quality scripts not verified in installed monorepo/CI.
- `GAP-127` — PR diff-aware gap closure enforcement missing.
- `GAP-128` — semantic documentation/code consistency audit missing.
- `GAP-129` — quality gates not required by branch protection.

## Next best task

Move the Phase 17 repo into Codex/local terminal, install dependencies, run `pnpm quality:all`, execute the full CI command set, and configure branch protection/required checks in GitHub. Do not close production gaps until evidence is captured in `GAP_TRACKER.md`.
