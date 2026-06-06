# Handoff to Jules

## Context

InkRoute Suite is scaffolded through Phase 18. The strongest Jules task is infrastructure foundation: database/auth/storage provisioning and tenant isolation hardening after Codex verifies install/build basics.

## Required read order

1. `README.md`
2. `ARCHITECTURE.md`
3. `DATABASE_SCHEMA.md`
4. `SECURITY.md`
5. `DEPLOYMENT.md`
6. `ENVIRONMENT_VARIABLES.md`
7. `GAP_TRACKER.md`
8. `deployment/DATABASE_MIGRATION_GUIDE.md`
9. `deployment/PROVIDER_OPTIONS.md`
10. `docs/handoff/AGENT_EXECUTION_QUEUE.md`
11. `docs/handoff/GAP_CLOSURE_PROTOCOL.md`
12. `docs/handoff/JULES_INFRA_PROMPT.md`

## Phase 16 summary

Added:

- handoff/gap-audit helper package
- agent execution queue manifest
- gap closure protocol
- phase documentation audit
- PR and issue templates for evidence-backed closure
- external-agent prompt files

## Good Jules task

Provision non-production database/auth/storage foundations and verify tenant safety.

Focus files:

- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/seed.ts`
- `packages/auth/src/index.ts`
- `packages/security/src/index.ts`
- `DEPLOYMENT.md`
- `deployment/DATABASE_MIGRATION_GUIDE.md`
- `GAP_TRACKER.md`

## Jules prompt

Using the Phase 15 and Phase 16 runbooks, provision a non-production Postgres environment, validate/generate Prisma client, create/review migrations, run seed data, select/authenticate an auth provider, and implement the first tenant-scoped protected dashboard/API access pattern. Add tests proving cross-tenant reads fail. Keep storage private; add signed upload proof if storage is selected. Update `GAP_TRACKER.md` with exact commands, provider evidence, and remaining production blockers.

## Verification target

- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`
- tenant isolation tests
- dashboard auth smoke test
- private storage access test if storage is configured
- updated gap audit output after gap evidence changes

## Phase 17 quality gate update

Phase 17 adds quality-gate scripts and manifests. When performing infrastructure/provider work, run these before and after changing `GAP_TRACKER.md`:

```bash
node scripts/quality/audit-doc-links.mjs
node scripts/quality/audit-gap-evidence.mjs
node scripts/quality/print-quality-gates.mjs
```

Provider setup must still include redacted provider-console evidence. The quality scripts do not replace live database, storage, auth, CI, or deployment verification.

## Phase 18 workspace/runtime readiness note

Phase 18 added pre-install workspace audit tooling. Run `node scripts/workspace/audit-workspace-imports.mjs`, `node scripts/workspace/audit-package-scripts.mjs`, and `node scripts/workspace/print-runtime-readiness.mjs` before infrastructure work. After dependencies install, run `pnpm workspace:all`. The readiness report currently remains blocked because no lockfile or production evidence exists.
