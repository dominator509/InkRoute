# Phase 16 — Agent Execution Readiness and Gap Audit Hardening

## Status

Implemented/scaffolded as a post-roadmap hardening pass. This phase was added after the original Phase 0–15 roadmap because all defined phases now have repository artifacts, while live runtime/provider/deployment work remains external to this ChatGPT environment.

This phase does **not** make InkRoute Suite production-ready. It makes the external handoff safer by adding machine-readable agent tasks, gap-audit scripts, phase-doc verification, and explicit gap-closure protocol documentation.

## Source review performed before coding

Before coding this phase, the Phase 15 ZIP was unpacked and all 47 markdown source files were enumerated and reviewed for current roadmap, architecture, deployment, testing, security, gap, and handoff context.

Key reviewed inputs:

- `README.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `GAP_TRACKER.md`
- `DEPLOYMENT.md`
- `TESTING_PLAN.md`
- `SECURITY.md`
- `ENVIRONMENT_VARIABLES.md`
- `HANDOFF_TO_CODEX.md`
- `HANDOFF_TO_JULES.md`
- `HANDOFF_TO_CLAUDE_CODE.md`
- `docs/phases/PHASE_15_DEPLOYMENT_HANDOFF.md`
- all phase closeout documents under `docs/phases/`
- all deployment runbooks under `deployment/`

## Implemented in this phase

### `@inkroute/handoff`

Added a dependency-light handoff package with:

- Markdown gap-row extraction helpers.
- Gap audit summary helpers.
- Agent execution queue types.
- Codex/Jules/Claude/local task records.
- Agent-specific task filtering.
- Prompt rendering helpers.
- Unit-test scaffold.

### Handoff scripts

Added dependency-free scripts:

- `scripts/handoff/verify-phase-docs.mjs`
- `scripts/handoff/audit-gap-tracker.mjs`
- `scripts/handoff/print-next-agent-tasks.mjs`

Added root scripts:

- `handoff:verify-docs`
- `handoff:audit`
- `handoff:next`
- `handoff:all`

### Handoff docs and manifests

Added:

- `docs/handoff/AGENT_EXECUTION_QUEUE.md`
- `docs/handoff/GAP_CLOSURE_PROTOCOL.md`
- `docs/handoff/CODEX_FIRST_RUN_PROMPT.md`
- `docs/handoff/JULES_INFRA_PROMPT.md`
- `docs/handoff/CLAUDE_PROVIDER_PROMPT.md`
- `docs/handoff/manifests/agent-execution-queue.json`
- generated `docs/handoff/manifests/gap-audit-report.json`
- generated `docs/handoff/manifests/phase-documentation-audit.json`

### GitHub collaboration templates

Added:

- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/gap_closure.md`

These templates are scaffolded. Branch protection and GitHub Issues/Projects automation are not configured in this environment.

### CI and docs

Updated:

- `.github/workflows/ci.yml`
- `package.json`
- `tsconfig.base.json`
- `README.md`
- `ROADMAP.md`
- `FILE_TREE.md`
- `AGENTS.md`
- `TESTING_PLAN.md`
- `DEPLOYMENT.md`
- `HANDOFF_TO_CODEX.md`
- `HANDOFF_TO_JULES.md`
- `HANDOFF_TO_CLAUDE_CODE.md`
- `GAP_TRACKER.md`

## Implemented

- Machine-readable handoff queue exists.
- Gap audit script parses all gap rows and emits a JSON report.
- Phase documentation audit script verifies required root docs and phase docs exist.
- Agent prompts now exist as copy-ready markdown files.
- Pull request and gap-closure issue templates exist.
- Dependency-light package typecheck passes.
- Dependency-free handoff scripts pass in this sandbox.

## Scaffolded only

- External agent execution remains unrun.
- GitHub Issues/Projects automation is not wired.
- Branch protection is not configured.
- CI workflow has not run.
- Gap evidence attachments are still a manual process.
- Runtime dependency install/build/test remains blocked outside this environment.

## Verification performed in this environment

Passed/executed in this sandbox:

```bash
tsc --noEmit -p packages/handoff/tsconfig.json
node scripts/handoff/verify-phase-docs.mjs
node scripts/handoff/audit-gap-tracker.mjs
node scripts/handoff/print-next-agent-tasks.mjs
```

`audit-gap-tracker.mjs` completed with a warning status because existing gap rows use qualified values such as `Yes for launch` rather than only `Yes` or `No`. The script exits successfully and records the warning in `docs/handoff/manifests/gap-audit-report.json`; this is intentional evidence for future cleanup, not a production blocker closure.

Also verified:

- Dependency-light package typechecks continue to pass.
- All JSON files parse.
- No unresolved task-marker comments were introduced.
- Repo ZIP rebuilt successfully.

## Still blocked or unverified

- `pnpm install`
- lockfile generation
- CI execution
- Vitest execution for `@inkroute/handoff`
- app builds
- external agent task execution
- provider provisioning
- GitHub branch protection and issue automation
- evidence-backed gap closure

## New or updated gaps

Updated:

- `GAP-119` now reflects Phase 16 handoff queue hardening, while external agent execution remains open.

Added:

- `GAP-121` handoff scripts not verified in installed monorepo/CI.
- `GAP-122` gap closure evidence is not enforced by automation.
- `GAP-123` agent task queue is not synced to GitHub Issues/Projects.
- `GAP-124` phase documentation audit is structural, not semantic.
- `GAP-125` branch protection and PR enforcement are not configured.

## Recommended next action

Run the Codex first-run prompt in a real runtime. The highest value next action remains dependency installation, lockfile generation, and exact runtime evidence capture. Do not start provider work or production deployment before that first verification pass succeeds or produces evidence-backed gaps.
