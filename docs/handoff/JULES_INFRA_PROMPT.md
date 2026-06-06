# Jules Infrastructure Prompt

```text
Read README.md, ARCHITECTURE.md, DATABASE_SCHEMA.md, SECURITY.md, DEPLOYMENT.md, ENVIRONMENT_VARIABLES.md, GAP_TRACKER.md, deployment/DATABASE_MIGRATION_GUIDE.md, deployment/PROVIDER_OPTIONS.md, and docs/handoff/GAP_CLOSURE_PROTOCOL.md.

Provision a non-production infrastructure foundation for InkRoute Suite after Codex has verified dependency install.

Focus on:
- Postgres provider selection or local Postgres.
- Prisma validate/generate/migrate.
- Seed execution.
- Auth provider selection and first protected dashboard/API pattern.
- Tenant isolation tests proving cross-tenant reads fail.
- Private storage bucket and signed upload proof if storage is selected.

Run the relevant commands and update GAP_TRACKER.md with redacted evidence. Do not use production credentials. Do not mark production-ready.
```

## Phase 17 quality gate reminder

Before and after infrastructure changes, run `node scripts/quality/audit-gap-evidence.mjs` and disclose warnings. Do not mark any infrastructure gap closed without provider or command evidence.
