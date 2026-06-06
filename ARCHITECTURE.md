# Architecture

## Architectural posture

InkRoute Suite uses a TypeScript-first monorepo so the public site, dashboard, mobile app, and backend-adjacent packages share domain types, validation, tenant/RBAC rules, SEO helpers, payment contracts, notification templates, and calendar abstractions.

## Repository tree

```text
apps/
  web/          Public website and booking entry point
  dashboard/    Artist/admin SaaS dashboard
  mobile/       Expo React Native artist app
packages/
  analytics/    Attribution and analytics event contracts
  auth/         RBAC and tenant access primitives
  calendar/     ICS and calendar provider boundary
  config/       Demo data, env descriptors, navigation
  booking/      Booking flow, readiness score, and lifecycle helpers
  db/           Prisma/Postgres schema and client boundary
  notifications/ Message template contracts
  payments/     Deposit policy and Stripe boundary
  seo/          Structured data and metadata helpers
  testing/      Testing manifests, QA gates, and route smoke records
  types/        Shared domain types
  ui/           Shared UI primitives
  validators/   Zod validation schemas
docs/
  phases/       Phase-specific notes
  handoff/      Agent handoff mirrors
.github/
  workflows/    CI scaffold
```

## Frontend apps

### Public website: `apps/web`

Role:
- SEO-optimized artist website
- Portfolio-driven conversion
- Travel schedule visibility
- Booking entry point
- Static city/style landing pages now; database-backed SEO engine later

Status:
- Phase 3 static public website is partially implemented with demo content, public components, city/style landing pages, sitemap, robots rules, and JSON-LD rendering.
- Phase 4 adds a client-side `/booking` intake preview, `/booking/confirmation` preview, and a validation-only public booking route that intentionally returns `501` until persistence/provider work is implemented.
- No backend database persistence exists yet for public content or booking requests.
- Build, browser, accessibility, and performance verification remain blocked by dependency installation.

### Dashboard: `apps/dashboard`

Role:
- Tenant-scoped artist/admin workspace
- Booking inbox, portfolio, travel, payments, SEO, errors, release settings

Status:
- Scaffolded shell with demo metrics.
- Auth is not wired.

### Mobile: `apps/mobile`

Role:
- Artist travel command center
- Booking review, city update, portfolio upload, notifications, offline notes later

Status:
- Expo scaffold only.
- No native build or push notification wiring.

## Shared packages

Packages should remain small, agent-editable, and app-agnostic.

- `types`: shared enums/interfaces used by all apps.
- `validators`: Modular Zod schemas for tenancy, people, booking, portfolio, travel, payments, forms, messaging, notifications, reviews, and SEO.
- `booking`: Dependency-light Phase 4 helper package for booking steps, readiness score, travel booking CTA copy, and lifecycle transitions.
- `auth`: role and permission helpers; no session provider yet.
- `db`: Expanded Phase 2 Prisma schema and seed script; migrations not generated or run.
- `seo`: schema.org JSON-LD helpers, expanded in Phase 3 with tattoo service, local tattoo business, and review schema boundaries.
- `payments`: deposit policy contracts; Stripe not called yet.
- `calendar`: ICS helpers and future provider interface.
- `notifications`: Phase 9 template catalog, consent-aware delivery plans, automation sequences, delivery-log drafts, provider boundaries, and webhook interpretation helpers.
- `observability`: Phase 11 redaction, severity, fingerprint, alert, and agentic bug-fix helper contracts.
- `releases`: Phase 12 release candidates, feature flag evaluation, migration compatibility, rollback, and OTA helper contracts.
- `security`: Phase 13 redaction, upload validation, tenant isolation fixture, rate-limit, CSRF, privacy request, legal placeholder, header, and trust checklist contracts.
- `analytics`: event names and attribution payloads.
- `config`: demo data and navigation constants.
- `ui`: shared UI primitives for web/dashboard; mobile gets native components separately unless a cross-platform UI strategy is selected.

## Data strategy

- Primary database: PostgreSQL.
- ORM: Prisma for schema readability and migration tooling.
- Phase 2 schema inventory: 44 models and 36 enums covering the full planned tattoo SaaS domain.
- Tenancy: every tenant-owned table must include `tenantId`.
- Authorization: app layer must enforce tenant scope and roles; database row-level security can be added when choosing Supabase or custom Postgres policy strategy.
- Auditing: all sensitive state transitions should write audit logs.

## Auth strategy

Phase 1 recommends Auth.js/NextAuth, Clerk, or Supabase Auth depending on deployment choice.

Initial posture:
- Single code-level RBAC matrix in `@inkroute/auth`.
- Future server-side session middleware checks tenant membership.
- Dashboard and API routes must be protected before production.
- Mobile should use secure token storage once auth provider is selected.

## Storage strategy

- Portfolio/reference/consent files require private object storage.
- Recommended options: Supabase Storage for integrated auth/RLS, or S3-compatible storage for portability.
- Public optimized derivatives should be separated from private originals.
- Reference images and consent signatures must not be publicly addressable.

## Payment strategy

- Use Stripe Checkout first for lowest PCI burden.
- Store payment intent/session IDs, status, amount, currency, refund status, and audit events.
- Webhooks are the source of truth for successful deposits.
- Never store card data.

## Calendar strategy

- Internal appointment data remains source of truth.
- Google Calendar sync is credential-gated.
- ICS export can be provided before two-way sync.
- Time zones must be explicit per travel city and appointment.

## SEO strategy

- Next.js App Router metadata, sitemap, and robots file conventions are used in `apps/web`.
- Static demo city/style pages were added in Phase 3 from shared config.
- Production dynamic city/style pages should be generated from tenant SEO configuration in Phase 10.
- Structured data helpers live in `@inkroute/seo`.

## Observability strategy

- Sentry recommended for web, dashboard, API, and mobile.
- OpenTelemetry-compatible logs should be introduced when API/server runtime is implemented.
- Error reports can be stored internally for self-hosted fallback.

## Deployment strategy

Recommended first deployment:
- Web/dashboard: Vercel projects connected to the monorepo.
- Database: Neon or Supabase Postgres.
- Storage: Supabase Storage or S3-compatible bucket.
- Mobile: Expo EAS Build, with optional EAS Update after runtime policy setup.

## Multi-tenant boundaries

- Tenant is the top-level ownership boundary.
- A studio can belong to one tenant.
- Artists belong to a tenant and optionally a studio.
- Users access tenants through membership roles.
- Public pages resolve tenant by hostname or slug in later phases.

## Runtime boundaries

This scaffold includes one non-persistent Phase 4 public booking API boundary, but it is not a deployed production endpoint. Server actions/API handlers should be added only with auth where needed, public form rate limiting, tenant scoping, and safe redaction. Phase 2 added the database shape those APIs should target, but runtime database access is still unverified.


## Phase 5 dashboard architecture note

The Phase 5 dashboard is intentionally static and demo-data based. Production implementation should preserve the route/component boundaries but replace `apps/dashboard/lib/demo.ts` with server-side tenant loaders and service calls that enforce RBAC, write audit logs, redact sensitive fields, and handle provider failures safely.

## Phase 6 mobile architecture note

`apps/mobile` now contains a static Expo artist app scaffold with local tab switching and demo screens for secure-login posture, command center, booking review, appointments, clients, Nomad Mode travel updates, portfolio metadata upload, notifications, offline queue, and system/crash/update status. `packages/mobile` exposes `@inkroute/mobile-support`, a dependency-light package for mobile screen definitions, integration boundaries, health checks, and offline queue summarization.

The mobile app deliberately does not implement auth, biometric unlock, API persistence, push notifications, secure file uploads, encrypted offline storage, crash SDK capture, or EAS Update channels. Production mobile data must flow through tenant-scoped APIs shared with the dashboard, guarded by the same auth/RBAC and audit-log rules. Offline mode must encrypt sensitive queued notes and handle conflict resolution before launch.

## Phase 8 calendar/travel architecture note

Phase 8 keeps the internal appointment and availability model as the source of truth. `@inkroute/calendar` now exposes dependency-light scheduling helpers for buffers, conflicts, generated availability slots, ICS feed output, Google event/freebusy draft payloads, and travel publish-plan metadata. The web and dashboard apps consume those helpers through static demo data only.

Production architecture still needs a tenant-scoped calendar service layer with Postgres-backed `AvailabilityWindow`, `Appointment`, `CalendarConnection`, and `CalendarEvent` records; encrypted Google OAuth refresh tokens; provider sync workers; signed ICS feeds; cache/revalidation hooks for public travel pages; consent-gated waitlist notification queues; and timezone/DST/recurrence tests. Calendar provider actions must be idempotent and must write audit logs for every appointment, travel, sync, and conflict-resolution mutation.


## Phase 9 notification/messaging architecture

`packages/notifications` is now the shared source for notification template keys, rendered email/SMS/push/in-app copy, consent routing, automation sequences, delivery-log drafts, provider boundary records, message thread drafts, and provider webhook interpretation. The package is dependency-light so it can be typechecked in this sandbox without Resend, Twilio, Expo, queue, or database dependencies.

Production delivery architecture should be:

1. App mutation persists the domain event, such as booking accepted or appointment completed.
2. A tenant-scoped notification service builds delivery plans from template, recipient, consent, preference, and channel settings.
3. A queue worker writes `Notification` and `NotificationDelivery` records and calls provider adapters.
4. Provider webhooks verify signatures and reconcile delivery status idempotently.
5. STOP/unsubscribe/preference changes update suppression records before any future delivery.
6. Messages and delivery logs redact destinations, bodies, medical notes, private file URLs, and payment metadata from logs and crash reports.

Dashboard `/templates` and `/messages`, mobile notification previews, and public route boundaries are static/demo only until `GAP-061` through `GAP-069` are resolved.


## Phase 10 SEO architecture

`@inkroute/seo` now owns dependency-light SEO domain helpers: route records, canonical metadata drafts, sitemap plans, audit heuristics, content briefs, image SEO fields, JSON-LD graph composition, internal-link planning, Search Console setup drafts, and revalidation plans. `apps/web/lib/seoEngine.ts` adapts demo config into public SEO route records, while `apps/dashboard/lib/seoDemo.ts` powers the static SEO manager.

Production architecture still needs tenant-domain resolution, database-backed SEO publishing, redirect/noindex enforcement, Search Console import/submission, analytics ingestion, real image optimization, and browser/crawler validation before the SEO engine can be treated as production-ready.

## Phase 11 observability architecture

The observability layer now centers on `packages/observability`, which is dependency-light so redaction, severity classification, fingerprinting, alert route drafts, sanitized GitHub issue drafts, and agentic bug-fix workflow helpers can be shared by web, dashboard, mobile, API, and future workers.

Current data flow is scaffolded only:

```text
Global error boundary or API/webhook failure
  -> `@inkroute/observability` redacted report draft
  -> static dashboard/mobile preview or `501` route boundary
```

Production data flow remains externally dependent:

```text
Sentry / fallback reporter / OpenTelemetry
  -> verified redaction and sampling
  -> tenant-scoped `ErrorReport` persistence
  -> dashboard triage
  -> alert provider
  -> approved GitHub issue / agent handoff
```

Live SDK capture, provider credentials, source-map upload, OTLP export, alert routing, issue automation, persistence, and runtime verification are not implemented in this environment.

## Phase 12 release and auto-update architecture

Phase 12 introduces a release control-plane scaffold centered on `@inkroute/releases`.

Current implemented boundaries:

- Release domain logic is dependency-light and lives in `packages/releases`.
- Dashboard release operations are previewed at `apps/dashboard/app/releases/page.tsx` with demo data from `apps/dashboard/lib/releaseDemo.ts`.
- Dashboard release and feature flag API routes exist but are read-only or return `501` for mutations.
- A public limited release-health route exists for future status/version checks, but it must remain safe for anonymous access.
- Mobile system status shows release candidate, OTA compatibility, release health checks, and feature flag snapshots.
- `.github/workflows/release-governance.yml` is a manual dry-run scaffold; deployment jobs are intentionally disabled.

Intended production flow:

1. A release candidate is created from a commit SHA, build artifacts, surfaces changed, migration plan, and release notes.
2. `@inkroute/releases` evaluates gates and risk.
3. A protected dashboard action persists a `ReleaseRecord` and audit row.
4. GitHub Actions runs preview/staging checks and writes status back to the release record.
5. Production requires protected-environment approval.
6. Vercel deploys web/dashboard, Prisma migration deploy runs with gates, Sentry release artifacts are uploaded, and optional EAS Update publishes only when runtime compatibility is proven.
7. Rollback uses previous Vercel deploys, feature flag kill switches, EAS republish for compatible mobile runtimes, and forward-fix/restore decisions for database changes.

No production deployment path is live yet. All provider-dependent pieces remain gap-tracked in `GAP-087` through `GAP-094`.


## Phase 13 security/privacy/trust architecture

Phase 13 introduces a dependency-light security/privacy scaffold centered on `@inkroute/security`. The package is intentionally provider-free so Codex/Jules can test policy logic before wiring live services.

Current architecture:

- `packages/security/src/index.ts` defines sensitive field policies, upload validation contracts, rate-limit rules, CSRF plans, tenant isolation fixtures, privacy request drafts, legal placeholders, security header drafts, and trust summaries.
- Dashboard `/trust` reads static demo outputs from `apps/dashboard/lib/securityDemo.ts` and makes all production blockers visible.
- Public `/trust`, `/privacy`, `/terms`, and `/consent-disclaimer` pages are `noindex` placeholders that must not be treated as final legal content.
- Public API route boundaries validate upload/privacy request shape but return `501` for non-implemented signed upload and privacy workflows.
- Mobile system status previews security blockers for artists but does not enable secure storage, biometric enforcement, uploads, or privacy actions.

Required production architecture:

1. Auth/session layer resolves actor, tenant, role, and field-level permissions before any private read or mutation.
2. All tenant-owned queries include tenant filters and are covered by integration tests.
3. Sensitive fields use application-level encryption or provider/KMS-managed encrypted storage where appropriate.
4. Uploads flow through signed private object storage, file signature validation, metadata stripping, scanning/quarantine, derivative approval, FileAsset persistence, and audit logging.
5. Public forms and fallback endpoints are rate-limited and bot-protected. Cookie-authenticated mutations use CSRF defenses.
6. Legal/privacy documents are versioned, attorney-reviewed, and tied to acceptance/audit records.
7. Privacy request workers implement verified export/delete/rectification with retention/legal-hold rules.


## Phase 14 testing/QA architecture

Phase 14 introduces a dependency-light testing scaffold centered on `@inkroute/testing` and manifest-driven QA records. The package is provider-free so test inventory, quality gates, route smoke expectations, and manual QA evidence requirements can be reviewed before dependency installation.

Current architecture:

- `packages/testing/src/index.ts` defines test suites, test cases, QA checklist records, route smoke records, CI quality gates, and summary helpers.
- Root `vitest.workspace.ts` scopes package and mobile static tests.
- Root `playwright.config.ts` scopes web and dashboard smoke tests with separate base URLs and device profiles.
- `testing/manifests/*.json` stores unit, E2E, accessibility, security, mobile device, provider, and manual QA plans.
- `testing/scripts/*.mjs` provides dependency-free manifest/static checks that can run before `pnpm install`.
- `.github/workflows/ci.yml` is wired for install, manifest checks, typecheck, lint, unit tests, Playwright browser install, and E2E smoke tests, but has not executed successfully yet.

Required production architecture:

1. A committed lockfile and verified CI install.
2. Passing package unit tests with coverage reports.
3. Passing Next.js app builds and Playwright smoke tests.
4. Postgres-backed tenant isolation and integration tests.
5. Expo device/simulator QA for auth, push, offline, crash, and OTA flows.
6. Provider contract tests for Stripe, Google Calendar, storage, notifications, Sentry, auth, and rate limiting.
7. Accessibility, performance, visual regression, and security test evidence attached to release gates.

All unverified test execution is tracked in `GAP-105` through `GAP-112`.

## Phase 15 deployment and handoff architecture

Phase 15 introduces a provider-free deployment planning layer centered on `@inkroute/deployment`.

Current architecture additions:

- Environment requirement contracts for production readiness checks.
- Provider matrix for web, dashboard, database, storage, payments, mobile, observability, and CI/CD.
- Deployment-step and launch-checklist builders that keep production blockers explicit.
- Handoff task builders that translate remaining gaps into Codex/Jules/Claude Code work packages.
- Dashboard `/deployment` preview for launch readiness visibility.
- Read-only dashboard API route at `/api/deployment/readiness`.
- Dependency-free scripts in `deployment/scripts` so basic readiness checks can run before packages are installed.

No production deploy path is live. Provider credentials, runtime verification, protected environments, RBAC, audit logs, rollback automation, and launch evidence remain gap-tracked in `GAP-113` through `GAP-120` plus earlier provider/runtime gaps.
