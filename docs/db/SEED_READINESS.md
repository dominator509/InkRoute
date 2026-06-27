# Seed Readiness

The Prisma seed script creates fake InkRoute demo data for development and integration testing. It is not production content and it must not be run against production databases.

## Static safety contract

`packages/db/prisma/seed-readiness.json` defines the static seed-readiness checks:

- root and package seed scripts exist
- fake/demo markers are present
- legal placeholder language remains explicit
- expected domain models are written
- obvious production emails, provider keys, and provider URLs are absent

Run:

```bash
pnpm db:verify-seed
```

## Runtime evidence still required

Static readiness does not prove Prisma Client generation or database execution. Before closing seed/data gaps, capture redacted output for:

- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`
- app/API smoke reading seeded tenant data

Do not paste production database URLs, real client data, provider credentials, or privileged legal text into seed evidence.
