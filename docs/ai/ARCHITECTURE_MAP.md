# Architecture Map

Truth-pass date: 2026-06-08. Stable architectural summary for agents.

## System Overview

```text
apps/web
  Public Next.js site and public API route boundaries.
  Pages are mostly static/demo. Selected API routes have partial DB/local fallback behavior.

apps/dashboard
  Next.js dashboard workspace.
  UI is mostly static/demo. Selected API routes use a header-based actor/RBAC shim.

apps/mobile
  Expo React Native scaffold.
  Uses shared demo/support packages; no real mobile auth/API/push runtime yet.

packages/*
  Shared TypeScript packages for types, validators, auth, db, booking, payments,
  calendar, seo, notifications, security, observability, releases, deployment,
  testing, handoff, quality, workspace, config, ui, analytics, and mobile support.

Planned providers
  PostgreSQL, Stripe, Sentry/OpenTelemetry, Google Calendar, object storage,
  email/SMS/push providers, GitHub Actions, Vercel/Render/EAS-style deployment.
```

## Dependency Direction

```text
apps/* -> packages/*

packages/types is the lowest shared layer.
packages/validators, auth, booking, payments, calendar, seo, notifications,
security, observability, releases, deployment, testing, handoff, quality,
workspace, config, and mobile mostly depend on shared types.
packages/db owns Prisma schema/client exports.
packages/ui owns React UI primitives.
```

Avoid duplicating business contracts inside app folders when a shared `packages/*` boundary exists.

## Navigation and Memory Policy

Use `docs/ai/SERENA_OBSIDIAN_WORKFLOW.md` for repo navigation discipline.

- Serena should identify owning symbols, exported contracts, references, and route-to-service flow before broad reads.
- Scoped RTK search is the fallback when Serena is unavailable, ambiguous, or when searching non-code text.
- Obsidian should only retrieve or append targeted InkRoute project memory that changes a decision, review, or handoff.
- Current source, tests, trackers, and committed docs override Obsidian notes.

## Data Flow

Current broad state:

- Public/dashboard/mobile screens mostly render demo/static data.
- Several API routes now validate input, resolve tenant context, and use DB/local fallback behavior.
- Durable provider work is not complete until provider credentials, migrations, workers, and tests exist.

Production target:

```text
UI or webhook
  -> API route / server action
  -> Zod validation
  -> auth/session if private
  -> tenant resolution and RBAC
  -> tenant-scoped Prisma query/service
  -> audit/state/event rows for sensitive mutations
  -> provider queue/workers where needed
  -> standard response envelope
```

## API Boundaries

- Public web routes live under `apps/web/app/api/public/[tenantSlug]`.
- Webhooks live under `apps/web/app/api/webhooks`.
- Dashboard API routes live under `apps/dashboard/app/api`.
- Shared validators live in `packages/validators/src`.
- Shared auth/RBAC helpers live in `packages/auth/src`.
- DB access should stay tenant-scoped and should not expose private client/tenant data in public routes.

See `docs/ai/API_CONTRACTS.md` for compact route status and the root `API_CONTRACTS.md` for the fuller contract ledger.

## Auth / Authorization

- `packages/auth/src/index.ts` defines roles and permissions for `owner`, `studio_manager`, `artist`, `assistant`, and `admin`.
- Dashboard route helper `apps/dashboard/app/api/dashboardAuth.ts` currently resolves a `DashboardActorContext` from headers and falls back locally outside production.
- This is not a real session provider. Production still needs Auth.js, Clerk, Supabase Auth, or another provider, plus middleware/session lookup and tenant membership resolution.
- `CustomRole` exists in the Prisma schema but is not fully wired into runtime permission resolution.

## Database / Persistence

- Prisma schema lives at `packages/db/prisma/schema.prisma`.
- Key domains include tenants, users/memberships, artists/studios, clients, bookings, appointments, payments/refunds, travel/calendar, portfolio/files, forms/consent/medical safety, messages/notifications, reviews, SEO records, audit logs, error reports, release records, feature flags, and custom roles.
- Tenant-owned models should include `tenantId`.
- Prisma schema validation has been tracked as passing in the gap ledger, but migrations/database/seed/provider evidence remain incomplete.

## Storage Strategy

Planned storage separation:

- Public portfolio derivatives may be CDN/public.
- Portfolio originals, reference images, consent signatures, medical/safety artifacts, and private documents must remain private.
- Production upload flow needs signed URLs, server-generated object keys, MIME and magic-byte checks, metadata stripping, malware scanning/quarantine, tenant-scoped `FileAsset` rows, and audit logs.

## Risk Areas

| Risk | Status |
| --- | --- |
| Real auth/session provider | Open |
| Tenant isolation tests | Open |
| Production database/migrations | Open |
| Dependency install/lockfile | Open |
| Stripe/payment provider wiring | Open |
| Object storage/signed uploads | Open |
| Encryption/key rotation evidence | Partially implemented, verification open |
| Notifications and queue workers | Open |
| Google Calendar OAuth/sync | Open |
| Observability provider wiring | Open |
| CI/build/test evidence | Open |
| Legal/privacy/compliance review | Open |
| Deployment/provider projects | Open |

Use `GAP_TRACKER.md` as the source of truth for gap IDs, blocker language, and evidence requirements.
