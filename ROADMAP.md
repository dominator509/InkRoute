# Roadmap

## Phase 0 — Product Definition and Competitive Feature Model

**Status:** Implemented as documentation.

Deliverables:
- Target user definitions
- Product positioning
- MVP/v1/v2 scope
- Feature matrix
- Personas and conversion funnel
- SaaS pricing hypotheses
- Risks and assumptions

## Phase 1 — Monorepo Architecture

**Status:** Scaffolded in this repository.

Deliverables:
- `apps/web`, `apps/dashboard`, `apps/mobile`
- Shared TypeScript packages
- Root workspace config
- Initial CI scaffold
- Environment variable guide
- Architecture/security/deployment/testing docs
- Gap tracker

## Phase 2 — Database and Domain Model

**Status:** Scaffolded in code; runtime verification externally blocked.

Implemented/scaffolded deliverables:
- Expanded Prisma schema for tenants, domains, artists, studios, users, tenant members, custom roles, clients, profiles, portfolio, images, tattoo styles, booking requests, booking state events, appointments, travel cities, travel schedules, availability windows, calendar connections/events, deposits, payments, refunds, intake forms/responses, consent forms/signatures, medical acknowledgments, file assets, reference images, messages, notifications, reviews, SEO pages, redirects, audit logs, error reports, releases, and feature flags
- Seed script at `packages/db/prisma/seed.ts`
- Modular Zod validators across `packages/validators/src/*`
- Expanded shared domain types

Still required:
- Dependency install
- Prisma CLI validation
- Migration generation
- Postgres provisioning
- Seed execution
- Tenant isolation tests

## Phase 3 — Public Website

**Status:** Partially implemented as static demo UI; runtime verification externally blocked.

Implemented/scaffolded deliverables:
- Premium mobile-first homepage with conversion CTA, trust signals, portfolio, Nomad Mode travel, Tattoo Readiness Score preview, testimonials, FAQ, and CTA band
- `/about`, `/portfolio`, `/travel`, `/aftercare`, `/faq`, `/contact`, and static `/booking` preview pages
- Static city landing pages at `/cities/[citySlug]`
- Static style landing pages at `/styles/[styleSlug]`
- Public content API reads for `/api/public/[tenantSlug]/portfolio`, `/travel`, `/reviews`, `/faq`, `/seo/cities/[citySlug]`, and `/seo/styles/[styleSlug]` with tenant-scoped DB paths where schema exists, redacted public projections, non-production demo fallback, and production fallback disabled
- Public waitlist signup API at `/api/public/[tenantSlug]/waitlists` with shared validation, local rate limiting, DB-backed client/message/notification-intent persistence, redacted non-production fallback, and production fallback disabled
- Expanded public demo content in `@inkroute/config`
- Reusable public web components under `apps/web/components`
- Expanded structured data helper boundaries in `@inkroute/seo`
- Sitemap and robots updates for public routes

Still required:
- Dependency installation and `next build` verification
- Browser, accessibility, Lighthouse, Core Web Vitals, and SEO crawl audits
- Runtime proof for database/API-backed public content, including seeded database route smoke, API JSON and rendered HTML redaction, cache revalidation, browser, accessibility, Lighthouse, Core Web Vitals, and SEO crawl audits
- Real image assets, storage, optimized derivatives, and `next/image` implementation
- Live booking/contact submissions
- Tenant/domain resolution

## Phase 4 — Booking Flow

**Status:** Partially implemented as a DB-oriented booking/contact flow with local contracts wired; provider/runtime verification externally blocked.

Implemented/scaffolded deliverables:
- Client-side multi-step booking flow at `/booking`
- Static confirmation preview at `/booking/confirmation`
- Dependency-light `@inkroute/booking` package with booking steps, Tattoo Readiness Score, travel CTA helper, and lifecycle transitions
- Local-only reference image metadata capture with explicit signed-upload/storage boundary
- Policy, age, privacy, and deposit boundary acknowledgements using demo copy only
- `POST /api/public/[tenantSlug]/booking-requests` route with shared validation, tenant resolution, anti-bot proof, DB-first `BookingRequest`/`BookingStateEvent`/`AuditLog` writes, encryption-policy metadata for sensitive fields, and non-production local fallback
- Demo config for booking styles, placements, budget ranges, date windows, and provider boundaries

Still required:
- Dependency installation and Next.js build/runtime verification
- Live runtime/build verification and provider-backed persistence evidence
- Production public-form abuse controls beyond the local anti-bot/rate-limit contract
- Seeded tenant-isolation and route integration proof for booking/contact DB transactions
- Signed reference image uploads and private storage enforcement
- Stripe deposit session handoff after artist acceptance or policy rule match
- Email/SMS/push notification queueing and delivery logs
- Calendar hold/appointment creation after artist review
- Playwright booking E2E tests and unit tests for `@inkroute/booking`

## Phase 5 — Dashboard

**Status:** Partially implemented as static demo dashboard UI; runtime verification externally blocked.

Implemented/scaffolded deliverables:
- Static dashboard routes for overview, booking inbox/detail, appointment calendar, travel manager, portfolio manager, client CRM/detail, payments/deposits, form builder, SEO manager, notification templates, error reports, release/feature flags, and tenant settings
- Dashboard appointment creation API route now validates tenant-scoped booking/artist/client/travel/studio records, persists Appointment + BookingStateEvent + AuditLog in one transaction, and exposes deferred deposit/notification/calendar lifecycle intents; provider execution and integration-test evidence remain gated.
- Dashboard metrics API route at `/api/metrics` with tenant-scoped aggregate DB reads, dashboard auth/RBAC, no-store responses, AuditLog metadata, non-production demo fallback, and production fallback disabled
- Reusable dashboard components and demo data under `apps/dashboard`
- Disabled action panels that label auth/API/database/provider boundaries

Still required:
- Auth/session/tenant guard
- Tenant-scoped Prisma loaders and API/server actions beyond the currently wired read/aggregate route contracts
- Real mutations, audit logs, provider integrations, privacy controls, tests, and Next.js build verification

## Phase 6 — Mobile App

**Status:** Partially implemented as a static Expo artist app scaffold; runtime verification externally blocked.

Implemented/scaffolded deliverables:
- Multi-screen Expo app with local tab switching
- Secure login posture screen
- Artist home command center
- Booking request review queue
- Appointment calendar preview
- Client profile/timeline preview
- Nomad Mode travel update tool
- Portfolio upload/manage metadata flow
- Notification template previews
- Offline-first queue preview
- Crash/release/update system status screen
- Dependency-light `@inkroute/mobile-support` package with mobile screen registry, boundary records, health checks, and offline queue summary helper
- `apps/mobile/eas.json` and EAS Update placeholders marked deployment-gated

Still required:
- Dependency installation and Expo runtime/device verification
- Real auth, biometric unlock, session refresh, and tenant membership checks
- Tenant-scoped API client and mobile data sync
- Push notification permissions/token persistence/delivery logs
- Encrypted offline persistence, conflict resolution, and retry worker
- Secure uploads from mobile
- Sentry/mobile crash reporting
- EAS project configuration, preview/production builds, OTA rollout, and rollback tests
- Mobile unit/component/device QA

## Phase 7 — Payments, Deposits, and No-Show Protection

**Status:** Partially implemented as dependency-light policy engine plus DB-first local payment/webhook boundaries; live Stripe processing externally blocked.

Implemented/scaffolded deliverables:
- Expanded `@inkroute/payments` with policy versioning, deposit risk scoring, city/travel/no-show/late-cancel premiums, refund eligibility, no-show forfeiture evaluation, webhook interpretation, receipt/export helpers, and Stripe Checkout session draft generation
- Added public deposit preview page at `/booking/deposit-preview`
- Added DB-first `POST /api/public/[tenantSlug]/deposit-sessions` draft boundary with production local-fallback fail-closed behavior
- Added `POST /api/webhooks/stripe` boundary that requires `Stripe-Signature`, verifies `STRIPE_WEBHOOK_SECRET` when configured, writes replay/audit rows when durable tenant/payment context is available, and keeps provider proof gated
- Upgraded dashboard payments view with policy/risk/refund/no-show/receipt/webhook previews
- Expanded payment validators and handoff docs

Still required:
- Dependency installation and Next.js route/runtime verification
- Stripe SDK installation, API version pinning, and test/live credential configuration
- Signed deposit token or authenticated dashboard-only session creation
- Stripe Checkout/PaymentIntent creation
- Webhook signature verification with raw request body and endpoint secret
- Prisma persistence for Deposit, Payment, Refund, and PaymentAuditLog lifecycle changes
- Idempotency/replay protection
- Refund execution, dispute handling, receipts, tax/reporting export, and legal-reviewed policy language

## Phase 8 — Calendar and Location/Travel Schedule

**Status:** Partially implemented as static/helper scaffold.

Implemented in Phase 8:
- Dependency-light availability slot generation.
- Buffer-aware conflict detection.
- Calendar block helpers for appointments and travel stops.
- Improved ICS export helper and static demo `.ics` route.
- Google Calendar event/freebusy draft payloads.
- Calendar sync-plan metadata for internal, ICS, and Google providers.
- Dashboard calendar/travel previews for slots, conflicts, sync boundaries, and Nomad Mode publish plans.
- Public travel page demo ICS feed link.

Still planned / externally dependent:
- Google Calendar OAuth and sync.
- Encrypted provider token storage.
- Incremental sync-token handling and push channels.
- Persisted availability holds and appointment conflict guard.
- Signed private ICS feeds with revocation.
- Robust timezone/DST/recurrence handling.
- Real-time public revalidation and city waitlist notifications.

## Phase 9 — Notifications and Messaging

**Status:** Partially implemented as dependency-light helper package, dashboard/mobile previews, and route/webhook boundaries. Live providers, persistence, queue workers, opt-out/preference controls, legal review, and tests remain open.

Implemented in Phase 9:
- Expanded tattoo-specific notification template catalog.
- Consent-aware delivery plan helpers.
- Booking, deposit, prep, reschedule, aftercare, healed-photo, waitlist, flash-drop, and review automation sequence previews.
- Delivery-log drafts with destination masking/hashing.
- Provider boundary matrix for Resend, Twilio, Expo Push, and in-app delivery.
- Email/SMS webhook interpretation helpers.
- Dashboard `/templates` and `/messages` previews.
- Mobile notification plan previews.
- Static public notification preview, public message, email webhook, and SMS webhook route boundaries.

Still required:
- Email provider integration.
- SMS provider integration and compliance review.
- Expo push token registration and device QA.
- Notification queue/scheduler and delivery-log persistence.
- Preference center, unsubscribe, STOP/HELP, and suppression controls.
- Client messaging persistence and inbound routing.

## Phase 10 — SEO Engine

**Status:** Partially implemented as a static, dependency-light SEO engine scaffold. Runtime/app verification and live SEO provider integrations remain externally gated.

Implemented in Phase 10:
- SEO route record and publication/index state helpers.
- Canonical URL and metadata draft helpers.
- Sitemap planning from route inventory.
- City and style content brief helpers.
- Internal-link recommendation helpers.
- Portfolio image SEO field helpers.
- JSON-LD graph, Website, WebPage, and Breadcrumb helpers.
- Static public SEO preview and sitemap preview routes.
- Dashboard SEO command center for route inventory, audits, briefs, links, metadata, image SEO, revalidation, and Search Console boundary.

Still planned/external:
- Database-backed dynamic city and style landing pages.
- Authenticated SEO CMS publishing with audit logs.
- Search Console verification, sitemap submission, and query/page imports.
- Crawl, schema, Lighthouse, accessibility, and Core Web Vitals evidence.
- SEO analytics ingestion and portfolio-to-booking attribution persistence.

## Phase 11 — Bug/Crash Reporting System

**Status:** Partially implemented as dependency-light observability helpers, static dashboard triage UI, error-boundary fallbacks, and route/webhook boundaries. Live SDK capture, persistence, alerts, and issue automation remain credential/runtime gated.

Implemented in Phase 11:
- `@inkroute/observability` package with redaction helpers, severity classification, fingerprinting, alert-route drafts, Sentry/OpenTelemetry/GitHub boundary records, sanitized issue drafts, and agentic bug-fix workflow helpers.
- Public fallback error-report route with validation, redaction, request correlation, local rate-limit/bot metadata, DB-first `ErrorReport`/`AbuseEvent`/`AuditLog` persistence where available, and production local-fallback fail-closed behavior.
- Dashboard error-report API with shared auth/RBAC guard, redacted DB/local read/write paths, no-store responses, and production fallback guard.
- Sentry webhook boundary that requires a provider signature, verifies `SENTRY_WEBHOOK_SECRET` when configured, records provider delivery/idempotency and audit reconciliation when tenant ownership is available, and fails closed in production without durable persistence.
- Web and dashboard `global-error.tsx` fallback components.
- Expanded dashboard observability command center and mobile crash-reporting preview.

Still planned/external:
- Install/configure Sentry SDKs for Next.js and React Native.
- Upload source maps/debug symbols through CI/EAS.
- Persist redacted `ErrorReport` rows and provider event IDs.
- Add rate limiting, bot protection, and tenant-scoped auth for ingest/query surfaces.
- Configure alerts, OpenTelemetry exporter, and GitHub issue automation.
- Runtime verification with forced web/dashboard/mobile/API/webhook errors.

## Phase 12 — Auto-Update and Release System

**Status:** Partially implemented/scaffolded in ChatGPT environment.

Implemented/scaffolded deliverables:
- Dependency-light `@inkroute/releases` package for release candidates, release gates, migration compatibility, feature flag evaluation, release notes, rollback drafts, health checks, and mobile OTA compatibility.
- Dashboard `/releases` control-plane preview with release gates, feature flags, EAS Update plan, rollback draft, CI/CD guardrail plan, release notes, and audit drafts.
- Dashboard API boundaries for release and feature flag reads/mutations with auth shim, validation, IdempotencyKey-backed persistence/audit contracts, and local fallback where allowed; protected-environment, provenance, provider route tests, and CI proof remain gated.
- Public limited release-health preview route.
- Mobile system status release/OTA preview.
- Manual dry-run `.github/workflows/release-governance.yml` scaffold with deployment-gated jobs intentionally disabled.

Still external/blocking:
- Provider-backed ReleaseRecord/FeatureFlag persistence proof, RBAC proof, and CI route evidence.
- GitHub Actions deployment jobs, protected environments, and secrets.
- Vercel deployments.
- Prisma migration dry-run/deploy gates.
- Real EAS project/channel/update/rollback verification.
- Sentry release/source-map upload and release-linked incident workflows.
- Automated release tests and workflow execution.

## Phase 13 — Security, Privacy, Compliance, and Trust

**Status:** Partially implemented/scaffolded in code.

Implemented/scaffolded deliverables:
- Dependency-light `@inkroute/security` package for sensitive-field classification, redaction, upload validation drafts, tenant isolation fixtures, rate-limit rules, CSRF plans, security header drafts, privacy request drafts, legal placeholders, and trust checklist summaries.
- Dashboard `/trust` control-plane preview for security controls, upload validation, tenant isolation fixtures, rate limits, CSRF, headers, privacy requests, redaction, and legal placeholders.
- Public `/trust`, `/privacy`, `/terms`, and `/consent-disclaimer` placeholder pages marked `noindex` and not final legal content.
- Public API boundaries for upload policy, secure upload intents, and privacy requests with validation, local contracts, DB-first persistence where wired, and production local-fallback fail-closed behavior for sensitive workflows.
- Dashboard API boundaries for trust status and privacy request intake; dashboard privacy requests now enforce auth/RBAC, rate limits, DB-backed `PrivacyRequest` + redacted `AuditLog` writes where available, and production local-fallback fail-closed behavior.
- Mobile system status trust/security preview.

Still external/blocking:
- Real auth/session provider and tenant-scoped route/data guards.
- Key management/application-level encryption local contracts for medical notes and provider-token intake are wired with readiness/rotation metadata; runtime KMS/key lifecycle proof and broader provider-token operational hardening remain gated.
- Signed S3/Supabase uploads, malware scanning, EXIF/GPS stripping, public derivative pipeline, and private ACL verification.
- Distributed rate-limit store, bot/spam controls, CSRF/session enforcement, and security header runtime deployment.
- Privacy request persistence/workers and verified export/delete/retention workflows.
- Attorney review for privacy, terms, consent, medical, SMS, aftercare, deposit/no-show, and refund language.
- Automated security, tenant isolation, upload, privacy, and legal-placeholder tests.

## Phase 14 — Testing and QA

**Status:** Partially implemented as scaffolded testing/QA infrastructure.

Implemented/scaffolded deliverables:
- `@inkroute/testing` dependency-light package for test cases, QA checklists, route smoke records, CI gates, and suite summaries.
- Vitest unit-test skeletons for booking, payments, calendar, notifications, SEO, observability, releases, security, and testing manifests.
- Playwright E2E smoke-test skeletons for public booking and dashboard admin surfaces.
- Mobile static test scaffold for the Expo screen registry and integration boundaries.
- Manifest-driven accessibility, security, mobile device, provider, manual QA, unit, and E2E plans.
- Root `vitest.workspace.ts`, `playwright.config.ts`, test scripts, and CI workflow updates.

Still external/runtime-gated:
- Dependency installation and lockfile generation.
- Actual Vitest/Playwright execution.
- Next.js and Expo runtime tests.
- Postgres integration tests.
- Provider sandbox tests for Stripe, Google Calendar, storage, notifications, Sentry, auth, and rate limiting.
- Accessibility, performance, visual regression, and security test evidence.

## Phase 15 — Deployment and Handoff

**Status:** Partially implemented as scaffolded deployment/handoff infrastructure.

Implemented/scaffolded deliverables:
- `@inkroute/deployment` package for environment readiness, deployment plans, provider options, launch checklists, and handoff tasks.
- Dependency-free deployment scripts: `deploy:check-env`, `deploy:check-env:strict`, `deploy:checklist`, and `deploy:gaps`.
- Deployment manifests for env contract, provider matrix, production launch checklist, and handoff task queue.
- Provider/local setup/CI/CD/mobile/database/production launch runbooks under `deployment/`.
- Dashboard `/deployment` control-room preview.
- Dashboard `/api/deployment/readiness` preview-only route boundary.
- Updated CI scaffold to include Phase 15 manifest checks.
- Finalized handoff files and expanded final gap tracker to `GAP-120`.

Still external/blocking:
- `pnpm install` and lockfile generation.
- Next.js/Expo app builds and runtime smoke tests.
- GitHub Actions execution.
- Vercel/Neon/Supabase/S3/Stripe/Google/Resend/Twilio/Expo/Sentry provider provisioning.
- Prisma migration validation against a real database.
- Strict environment checks against real secrets.
- Legal review and launch operations.
- Preview/staging/production deployment evidence and rollback drills.

## Phase 16 — Agent Execution Readiness and Gap Audit Hardening

**Status:** Partially implemented as post-roadmap handoff hardening.

Implemented/scaffolded deliverables:

- `@inkroute/handoff` dependency-light package for gap row extraction, gap audit summaries, agent task queues, and prompt rendering.
- Dependency-free handoff scripts: `handoff:verify-docs`, `handoff:audit`, `handoff:next`, and `handoff:all`.
- Machine-readable agent execution queue at `docs/handoff/manifests/agent-execution-queue.json`.
- Generated gap audit and phase-doc audit JSON reports.
- Human-readable Codex/Jules/Claude/local terminal execution docs under `docs/handoff/`.
- Pull request and gap-closure issue templates to keep future gap updates evidence-backed.
- CI scaffold updated to include Phase 16 handoff manifest checks.

Still external/blocking:

- Dependency installation and lockfile generation.
- Actual CI execution.
- External Codex/Jules/Claude Code execution.
- GitHub branch protection, issue automation, and project-board sync.
- Runtime build/test/provider evidence.
- Evidence-backed closure of production-blocking gaps.

Recommended next external action:

- Run the Codex first-run prompt from `docs/handoff/CODEX_FIRST_RUN_PROMPT.md` in a real runtime and write results back into `GAP_TRACKER.md`.

## Phase 17 — Quality Gate and Evidence Automation

**Status:** Partially implemented as post-roadmap quality/handoff hardening.

Implemented/scaffolded deliverables:

- `@inkroute/quality` dependency-light package for Markdown link records, gap evidence records, quality gate definitions, and audit summaries.
- Dependency-free quality scripts: `quality:docs`, `quality:gaps`, `quality:gates`, and `quality:all`.
- Generated manifests under `docs/quality/manifests/` for Markdown link audit, gap evidence audit, and quality gate catalog.
- Quality protocol and Codex quality-gate prompt under `docs/quality/`.
- CI scaffold updated to run Phase 17 quality gates after Phase 16 handoff checks.
- Handoff docs updated to route Codex/local terminal through quality gates before any gap closure claims.

Still external/blocking:

- `pnpm install` and installed-monorepo execution of `pnpm quality:all`.
- GitHub Actions execution.
- PR diff-aware validation that detects `GAP_TRACKER.md` changes and blocks evidence-free closure.
- Branch protection and required quality checks.
- CODEOWNERS and repository governance configuration.
- Semantic documentation truth checks against runtime build/provider evidence.

## Phase 18 — Workspace Runtime Readiness and Pre-Install Audit

**Status:** Partially implemented as post-roadmap workspace/runtime hardening.

Implemented/scaffolded deliverables:

- `@inkroute/workspace` dependency-light package for workspace import audits, package script audits, and runtime readiness summaries.
- Dependency-free workspace scripts: `workspace:imports`, `workspace:scripts`, `workspace:readiness`, and `workspace:all`.
- Generated manifests under `docs/workspace/manifests/`.
- Workspace audit protocol and Codex workspace prompt under `docs/workspace/`.
- CI scaffold step to capture workspace readiness reports.
- Fixed discovered dashboard workspace dependency declarations and replaced the placeholder `@inkroute/booking` lint script with `tsc --noEmit`.

Still external/blocking:

- `pnpm install` and lockfile generation.
- Installed-monorepo execution of `pnpm workspace:all`.
- Vitest execution for `@inkroute/workspace`.
- GitHub Actions execution.
- Branch protection and required workspace checks.
- Real package resolution, peer dependency compatibility, app builds, and provider/runtime evidence.
