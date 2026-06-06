# Codex First Run Prompt

Use this prompt after opening the Phase 16 repo in Codex or another real coding runtime.

```text
Read README.md, ROADMAP.md, ARCHITECTURE.md, GAP_TRACKER.md, DEPLOYMENT.md, TESTING_PLAN.md, ENVIRONMENT_VARIABLES.md, docs/handoff/AGENT_EXECUTION_QUEUE.md, and docs/handoff/GAP_CLOSURE_PROTOCOL.md.

Your first task is not feature work. Verify that the monorepo installs and builds enough to expose real errors.

Run:
corepack enable
pnpm install
pnpm handoff:verify-docs
pnpm handoff:audit
pnpm handoff:next
pnpm deploy:check-env
pnpm deploy:checklist
pnpm deploy:gaps
pnpm typecheck
pnpm test:unit
pnpm test:manifest
pnpm --filter @inkroute/web build
pnpm --filter @inkroute/dashboard build

Commit pnpm-lock.yaml. Fix real dependency, TypeScript, import, package, or build failures only. Do not remove architecture, docs, gap rows, 501 boundaries, or status labels to make commands pass. Update GAP_TRACKER.md and docs/phases/PHASE_16_AGENT_EXECUTION_READINESS.md with exact command output, changed files, and remaining blockers. Do not claim production-ready.
```

## Phase 17 addition

Before changing any gap status, run the quality gates:

```bash
pnpm quality:all
```

If dependency installation is still failing, run the dependency-free equivalents:

```bash
node scripts/quality/audit-doc-links.mjs
node scripts/quality/audit-gap-evidence.mjs
node scripts/quality/print-quality-gates.mjs
```

Update `GAP_TRACKER.md` with exact evidence; do not close or downgrade gaps from scaffolded command output alone.

## Phase 18 workspace pre-check

Before the main verification chain, run:

```bash
node scripts/workspace/audit-workspace-imports.mjs
node scripts/workspace/audit-package-scripts.mjs
node scripts/workspace/print-runtime-readiness.mjs
```

After `pnpm install`, run `pnpm workspace:all`. Keep the blocked readiness report if lockfile, production gaps, app builds, or provider evidence remain missing.
