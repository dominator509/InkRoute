# Handoff to Codex

## Context

InkRoute Suite is now scaffolded through Phase 18. The repository contains public web, dashboard, mobile, shared packages, database schema, booking flow, dashboard surfaces, mobile screens, payment/calendar/notification/SEO/observability/release/security/testing/deployment helper packages, and handoff, quality, and workspace audit tooling.

This repo is not production-ready. Most live integrations are scaffolded, credential-gated, deployment-gated, or untested.

## Required read order

1. `README.md`
2. `PRODUCT_REQUIREMENTS.md`
3. `ARCHITECTURE.md`
4. `ROADMAP.md`
5. `GAP_TRACKER.md`
6. `DEPLOYMENT.md`
7. `deployment/LOCAL_SETUP.md`
8. `deployment/PRODUCTION_LAUNCH_CHECKLIST.md`
9. `TESTING_PLAN.md`
10. `ENVIRONMENT_VARIABLES.md`
11. `docs/handoff/AGENT_EXECUTION_QUEUE.md`
12. `docs/handoff/GAP_CLOSURE_PROTOCOL.md`
13. `docs/handoff/CODEX_FIRST_RUN_PROMPT.md`

## Current Phase 16 state

Implemented/scaffolded:

- `@inkroute/handoff`
- machine-readable agent execution queue
- gap tracker audit script
- phase documentation audit script
- copy-ready Codex/Jules/Claude prompts
- PR template and gap-closure issue template
- CI scaffold updated with handoff manifest checks
- final gap tracker expanded through `GAP-125`

Still blocked:

- dependency install and lockfile
- app builds
- real database/auth/storage/payments/calendar/notifications/observability providers
- provider projects/secrets
- strict env checks
- real CI execution
- branch protection and GitHub Issues/Projects automation
- legal review
- launch evidence

## Best first Codex task

Install and verify the repository in a real runtime.

```bash
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
```

Commit `pnpm-lock.yaml`. Fix real dependency/build/type/test issues without removing scaffolded architecture. Update `GAP_TRACKER.md` with exact command output and remaining blockers.

## High-priority gaps

- `GAP-001` dependencies/lockfile
- `GAP-002` database migrations
- `GAP-003` auth/RBAC
- `GAP-004` Stripe deposits/webhooks
- `GAP-005` private storage/uploads
- `GAP-014` deployment pipeline
- `GAP-105` test runner execution
- `GAP-113` deployment scaffold runtime verification
- `GAP-114` provider projects
- `GAP-115` secret management
- `GAP-121` handoff scripts not verified in installed monorepo/CI
- `GAP-122` gap evidence enforcement not automated

## Codex prompt

Implement the first real-runtime verification pass for InkRoute Suite. Read the required docs, install dependencies, commit the lockfile, run handoff audit scripts, deployment scripts, typecheck, unit tests, manifests, and web/dashboard builds. Fix only real dependency/runtime/build issues. Do not mark production-ready. Update `GAP_TRACKER.md`, `TESTING_PLAN.md`, and `docs/phases/PHASE_16_AGENT_EXECUTION_READINESS.md` with exact commands, results, files changed, and remaining blockers.

## Phase 17 quality gate update

Phase 17 added `@inkroute/quality`, dependency-free quality scripts, generated quality manifests, and CI scaffold hooks. Before closing or downgrading any gap, run:

```bash
node scripts/quality/audit-doc-links.mjs
node scripts/quality/audit-gap-evidence.mjs
node scripts/quality/print-quality-gates.mjs
```

After dependency installation, run:

```bash
pnpm quality:all
```

Do not close a gap only because the audit warns or passes. A closed production-blocking gap still requires exact command/provider evidence in `GAP_TRACKER.md`.

## Phase 18 workspace runtime update

Phase 18 added `@inkroute/workspace`, static workspace import auditing, package script contract auditing, runtime readiness reporting, and generated manifests under `docs/workspace/manifests/`.

Before installing or touching providers, run:

```bash
node scripts/workspace/audit-workspace-imports.mjs
node scripts/workspace/audit-package-scripts.mjs
node scripts/workspace/print-runtime-readiness.mjs
```

After dependency installation, run:

```bash
pnpm workspace:all
```

The current static audit result is expected to be:

- workspace import audit: pass
- package script audit: pass
- runtime readiness: blocked/fail report because `pnpm-lock.yaml` is absent and production gaps remain open

Do not treat the blocked readiness report as a script failure by itself. Treat it as evidence that the repo still needs external runtime work. Update `GAP-130` through `GAP-133` with exact command output after running this in a real installed repo.
