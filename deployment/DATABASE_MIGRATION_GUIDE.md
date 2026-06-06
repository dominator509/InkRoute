# Database Migration Guide

## Status

Scaffolded only. Phase 2 added a broad Prisma schema and seed script, but no migration has been generated or applied in this sandbox.

## Non-production migration sequence

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

## Production migration rules

- Prefer expand-only migrations.
- Review generated SQL before applying.
- Back up production before schema changes.
- Run migration in staging against production-like data.
- Verify application compatibility before and after migration.
- Record migration id in release notes and release record.
- Do not run destructive changes without manual approval and restore plan.

## Evidence required

- Prisma validate/generate output.
- Migration SQL review note.
- Staging migration log.
- Seed or fixture load result.
- Rollback/restore plan.
- Tenant isolation tests after migration.
