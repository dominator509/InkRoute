# API Contracts

## Current status

API contracts are documented and multiple public boundaries now run local-runtime behavior, but production persistence and provider wiring are not implemented. Phase 2 expanded the Prisma domain model and validators that future API handlers should use. Phase 3 public pages still read static demo config. All future API endpoints must validate inputs with `@inkroute/validators`, enforce auth where required, scope tenant-owned data, and return a predictable response envelope.

## Response envelope

Recommended success shape:

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
};
```

Recommended error shape:

```ts
type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
};
```

## Required handler pipeline

All route handlers must:

1. Parse input with Zod.
2. Authenticate if private.
3. Resolve tenant by domain, tenant slug, or authenticated membership.
4. Verify tenant membership for dashboard/mobile endpoints.
5. Check role/custom-role permission.
6. Execute tenant-scoped Prisma query.
7. Return response envelope.
8. Write audit log for sensitive state changes.
9. Redact PII/medical data from logs and errors.

## Public endpoints planned

| Method | Route | Purpose | Validator | Auth | Status |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/public/:tenantSlug/portfolio` | Public portfolio items | Query validator pending | No | Planned |
| `GET` | `/api/public/:tenantSlug/travel` | Public travel schedule/city availability | Query validator pending | No | Planned |
| `POST` | `/api/public/:tenantSlug/booking-requests` | Create booking request | `bookingRequestInputSchema` | No, must be rate-limited before production | Local runtime validation + draft persistence (not production DB) |
| `POST` | `/api/public/:tenantSlug/waitlists` | City waitlist signup | Planned | No, rate-limited | Planned |
| `GET` | `/api/public/:tenantSlug/seo/cities/:citySlug` | City SEO page data | `seoCityPageInputSchema` for admin writes | No | Planned |
| `GET` | `/api/public/:tenantSlug/seo/styles/:styleSlug` | Style SEO page data | `seoStylePageInputSchema` for admin writes | No | Planned |
| `GET` | `/api/public/:tenantSlug/reviews` | Approved public testimonials | Query validator pending | No | Planned |
| `GET` | `/api/public/:tenantSlug/notification-previews` | Static notification/template delivery-plan previews | Static Phase 9 helper output | No | Scaffolded preview route; no send/queue |
| `POST` | `/api/public/:tenantSlug/messages` | Public client message/contact thread draft | Manual minimal shape in Phase 9; future `messageInputSchema` | No, must be rate-limited before production | Local runtime draft persistence and routing draft returned |
| `POST` | `/api/public/:tenantSlug/error-reports` | Public fallback client error-report draft | Manual minimal Phase 11 shape; future observability validator | No, must be rate-limited/bot-protected before production | Local runtime redacted draft persistence and preview response |

## Dashboard endpoints planned

| Method | Route | Purpose | Permission | Validator | Status |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/dashboard/metrics` | Tenant overview metrics | `analytics:read` | Query validator pending | Planned |
| `GET` | `/api/dashboard/bookings` | Booking inbox | `booking:read` | Query validator pending | Planned |
| `GET` | `/api/dashboard/bookings/:id` | Booking detail with timeline | `booking:read` | Params validator pending | Planned |
| `PATCH` | `/api/dashboard/bookings/:id/status` | Accept/decline/reschedule state changes | `booking:write` | `bookingStatusUpdateSchema` | Planned |
| `POST` | `/api/dashboard/appointments` | Create appointment from booking | `booking:write` | `appointmentInputSchema` | Planned |
| `GET` | `/api/dashboard/clients/:id` | Client profile/timeline | `client:read` | Params validator pending | Planned |
| `POST` | `/api/dashboard/clients` | Create client profile | `client:write` | `clientInputSchema` | Planned |
| `POST` | `/api/dashboard/portfolio` | Create portfolio item | `portfolio:write` | `portfolioItemInputSchema` | Planned |
| `POST` | `/api/dashboard/portfolio/:id/images` | Attach portfolio image metadata | `portfolio:write` | `portfolioImageInputSchema` | Planned |
| `POST` | `/api/dashboard/files/signed-upload` | Create signed upload request | Permission varies by file kind | `fileAssetInputSchema` boundary | Planned |
| `POST` | `/api/dashboard/travel/cities` | Create managed travel city | `travel:write` | `travelCityInputSchema` | Planned |
| `POST` | `/api/dashboard/travel/schedules` | Create travel schedule/guest spot | `travel:write` | `travelScheduleInputSchema` | Planned |
| `POST` | `/api/dashboard/availability` | Create availability window | `travel:write` | `availabilityWindowInputSchema` | Planned |
| `POST` | `/api/dashboard/payments/deposit-session` | Create Stripe deposit session | `payment:write` | `depositInputSchema` | Planned |
| `POST` | `/api/dashboard/refunds` | Create/refund payment record | `payment:write` | `refundInputSchema` | Planned |
| `POST` | `/api/dashboard/intake/forms` | Create intake form | `settings:write` | `intakeFormInputSchema` | Planned |
| `POST` | `/api/dashboard/consent/forms` | Create consent form | `settings:write` | `consentFormInputSchema` | Planned |
| `GET` | `/api/dashboard/errors` | Error/crash reports | `error:read` | Query validator pending | Planned |
| `GET` | `/api/error-reports` | Tenant-scoped error report API boundary | `error:read` | Query validator pending | Scaffolded route returns `501`; auth/Prisma missing |
| `POST` | `/api/error-reports` | Authenticated dashboard error-report ingest boundary | `error:write` | Phase 11 draft shape; future validator | Scaffolded route returns `501`; auth/Prisma missing |
| `POST` | `/api/dashboard/releases` | Create release note | `release:write` | Release validator pending | Planned |
| `PATCH` | `/api/dashboard/feature-flags/:key` | Toggle tenant feature flag | `settings:write` | Feature flag validator pending | Planned |
| `GET` | `/api/dashboard/messages` | Tenant message threads and delivery logs | `client:read` | Query validator pending | Planned |
| `POST` | `/api/dashboard/messages/:threadId/replies` | Reply to client thread | `client:write` | `messageInputSchema` | Planned |
| `POST` | `/api/dashboard/notifications/preview` | Preview template delivery plan | `settings:write` | `notificationPreviewInputSchema` | Planned |
| `POST` | `/api/dashboard/notifications/queue` | Queue consent-aware notification | `settings:write` or domain permission | `notificationInputSchema` plus delivery plan | Planned |
| `PATCH` | `/api/dashboard/notification-preferences/:clientId` | Update preferences/suppression state | `client:write` | `notificationConsentInputSchema` | Planned |

## Mobile API use

The mobile app should consume tenant-scoped dashboard APIs. A thin mobile BFF can be added only if app-specific payload shapes become meaningfully different. Mobile endpoints must use the same auth/RBAC rules and should never receive private data beyond the signed-in artist's tenant scope.

## Webhook endpoints planned

| Method | Route | Purpose | Auth | Status |
| --- | --- | --- | --- | --- |
| `POST` | `/api/webhooks/stripe` | Stripe payment/deposit status | Stripe signature | Planned |
| `POST` | `/api/webhooks/sentry` | Optional issue sync and provider issue reconciliation | Sentry signature/secret header | Scaffolded boundary returns `501`; signature verification/persistence missing |
| `POST` | `/api/webhooks/calendar` | Google calendar updates | Provider verification | Planned |
| `POST` | `/api/webhooks/email` | Email delivery status | Provider signature | Scaffolded boundary persists interpreted local webhook state in-memory; production signature verification/persistence still required |
| `POST` | `/api/webhooks/sms` | SMS delivery/inbound messages and STOP preview | Provider signature | Scaffolded boundary persists interpreted local webhook state in-memory; production signature verification/persistence still required |

## State transition rules

Booking state changes must create a `BookingStateEvent`. Payment and deposit changes must create `PaymentAuditLog`. Sensitive changes should also create an `AuditLog` row.

Examples:

- `submitted -> accepted` requires `booking:write`.
- `accepted -> deposit_pending` requires a deposit record.
- `deposit_pending -> deposit_paid` should be driven by verified Stripe webhook in production.
- `deposit_paid -> scheduled` requires an appointment record.
- `scheduled -> completed` should trigger aftercare notification scheduling.
- `scheduled -> no_show` should preserve no-show audit metadata.

## Phase 2 implementation note

The schema and validators are expanded, but the API handlers themselves are still not implemented. This remains tracked under `GAP-017`.


## Phase 3 implementation note

The public website now has static demo city/style routes and disabled booking/contact form previews. No public API handlers were added. Future handlers should source portfolio, travel, reviews, FAQ, city pages, and style pages from tenant-scoped database records and preserve the same public/private data separation.


## Phase 4 implementation note

`apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts` now exists as a non-persistent API boundary. It:

- Parses JSON.
- Validates against `bookingRequestInputSchema`.
- Returns `400` with flattened Zod issues for invalid input.
- Returns local runtime draft persistence and readiness metadata for now; tenant resolution, Prisma writes, full reference upload handoff, notifications, deposits, and calendar holds remain non-production.

Do not expose this as a production booking endpoint until `GAP-032`, `GAP-033`, and `GAP-034` are resolved.


## Phase 5 implementation note

`apps/dashboard` now contains static demo routes for the planned dashboard surface area, but no private dashboard API handlers were implemented in Phase 5. The planned endpoints listed above are still the production target. When implementing them, replace static demo data from `apps/dashboard/lib/demo.ts` with authenticated, tenant-scoped API/server loaders and mutation handlers. Every dashboard mutation must validate input, enforce RBAC, write audit logs for sensitive state changes, and preserve redaction rules for client PII, medical/safety notes, consent signatures, files, and payment metadata.

Do not treat the Phase 5 dashboard UI as production-ready until `GAP-036`, `GAP-037`, `GAP-038`, `GAP-039`, `GAP-040`, and `GAP-041` are resolved.

## Phase 6 mobile implementation note

`apps/mobile` now consumes static demo data and shared helper packages only. No mobile API client, authenticated session, refresh token handling, push token registration, offline sync endpoint, or mobile-specific BFF exists. Mobile should initially reuse dashboard tenant-scoped APIs for bookings, appointments, clients, travel, portfolio, notifications, errors, and releases. Add a mobile BFF only if payload shape, offline sync, or bandwidth constraints justify it.

Mobile production endpoints must enforce the same handler pipeline documented above: auth, tenant membership, RBAC, Zod validation, tenant-scoped Prisma queries, audit logging, and PII/medical redaction.

## Phase 7 payment route boundaries

### `POST /api/public/[tenantSlug]/deposit-sessions`

Status: **Local-runtime draft implemented; production SDK flow remains credential-gated**.

Purpose:
- Calculate a deposit policy preview for an accepted booking or signed deposit handoff.
- Return a Stripe Checkout session draft with reconciliation metadata.
- Avoid live payment collection until auth/signed-token, Stripe credentials, persistence, and webhooks are wired.

Current implementation:
- Parses JSON manually in `apps/web/app/api/public/[tenantSlug]/deposit-sessions/route.ts`.
- Requires `bookingRequestId`, `successUrl`, and `cancelUrl`.
- Calls `calculateDepositPolicy` and `buildStripeCheckoutSessionDraft` from `@inkroute/payments`.
- Returns local-session payloads and local records with `GAP-004`, `GAP-049`, and `GAP-050` listed as production blockers.

Production requirements:
1. Require authenticated dashboard action or a signed short-lived deposit token generated only after artist acceptance.
2. Resolve tenant and booking from database.
3. Verify amount/currency against persisted `Deposit.policySnapshot`.
4. Create Stripe Checkout Session or PaymentIntent using test/live credentials.
5. Persist provider session ID, idempotency key, and payment audit log before returning redirect URL.
6. Rate-limit and monitor abuse.

### `POST /api/webhooks/stripe`

Status: **Local runtime parses and stores interpreted Stripe webhook events; production signature verification/reconciliation is still pending**.

Purpose:
- Reserve the webhook endpoint boundary.
- Ensure the raw body is read before future signature verification.
- Interpret event type through `interpretStripeWebhook` for reconciliation planning.

Current implementation:
- Reads `request.text()`.
- Requires the `Stripe-Signature` header.
- Parses JSON only to inspect event type.
- Returns `200` with interpreted stripe event metadata and persisted local webhook intake.

Production requirements:
1. Use the Stripe SDK webhook helper with raw request body, signature header, and `STRIPE_WEBHOOK_SECRET`.
2. Reject invalid signatures before any reconciliation.
3. Fetch/verify Stripe objects when needed.
4. Enforce idempotency by event ID and provider object ID.
5. Reconcile `Deposit`, `Payment`, `Refund`, `BookingStateEvent`, and `PaymentAuditLog` records tenant-scoped.
6. Redact provider metadata and never log card data or full client notes.

### Payment response guidance

Payment route responses must keep the standard API envelope. Production routes must never return secret keys, webhook secrets, raw provider objects containing sensitive data, private file URLs, or medical/intake notes.

## Phase 8 calendar/travel route boundaries

### `GET /api/public/[tenantSlug]/calendar/[artistSlug]/travel.ics`

Implemented as a static demo route. It returns `text/calendar` for the demo artist travel schedule and includes headers that mark the feed as `static-demo-not-signed`. Production must replace this with signed tenant/artist-scoped feed tokens, revocation, access logging, private/public field filtering, and cache controls. Tracked in `GAP-009` and `GAP-055`.

### `GET /api/public/[tenantSlug]/availability-preview`

Implemented as a static JSON preview route. It returns a demo availability window, generated slots, and conflict preview data. It does not persist holds, reserve appointments, enforce concurrency, or read tenant data from Postgres. Production must add authenticated/authorized dashboard mutations, public-safe availability views, transactional conflict checks, audit logs, and tenant isolation tests. Tracked in `GAP-056` and `GAP-059`.

### Future Google Calendar provider routes

Planned but not implemented: OAuth connect/callback/disconnect, FreeBusy checks, appointment event insert/update/delete, full sync, incremental sync-token refresh, push channel renewal, and provider reconciliation workers. These require Google Cloud credentials and encrypted token storage. Tracked in `GAP-057` and `GAP-058`.


## Phase 9 notification/messaging route boundaries

### `GET /api/public/[tenantSlug]/notification-previews`

Status: **Scaffolded static preview route**.

Purpose:
- Return rendered demo templates and consent-aware delivery plans from `@inkroute/notifications`.
- Demonstrate email, SMS, push, and in-app routing decisions without sending anything.

Production requirements:
1. Replace static demo context with tenant-specific template settings.
2. Protect admin-only preview features behind dashboard auth.
3. Never expose private client destinations or provider secrets.
4. Preserve audit/redaction rules for previews.

### `POST /api/public/[tenantSlug]/messages`

Status: **Local runtime returns message-thread draft persistence and queue hint; production persistence is still required.**

Purpose:
- Reserve a future public-safe client message/contact boundary.
- Validate minimal subject/body shape and return a redacted draft preview.

Production requirements:
1. Resolve tenant safely by domain or slug.
2. Rate-limit, spam-protect, and optionally CAPTCHA public submissions.
3. Persist `MessageThread` and `Message` rows tenant-scoped.
4. Route notifications to the artist/team through consent-aware queueing.
5. Redact medical/payment/private URL content from logs and error responses.

### `POST /api/webhooks/email` and `POST /api/webhooks/sms`

Status: **Local runtime interpretation and persistence implemented; provider verification and delivery-log persistence remain production work**.

Purpose:
- Reserve provider callback URLs.
- Parse event types and preview normalized delivery states.
- Demonstrate inbound SMS STOP handling boundary.

Production requirements:
1. Verify provider signatures before trusting payloads.
2. Enforce replay protection and idempotent event handling.
3. Persist delivery status updates to `NotificationDelivery`.
4. Apply suppression changes immediately for bounces, complaints, unsubscribes, and SMS STOP.
5. Route inbound SMS/email into tenant-scoped message threads only after validation and redaction.

Tracked in `GAP-061` through `GAP-069`.


## Phase 10 SEO route boundaries

### `GET /api/public/[tenantSlug]/seo-preview`

Status: **Scaffolded static preview route**.

Returns static Phase 10 SEO engine output: route inventory, sitemap plan, audit results, content briefs, internal-link suggestions, Search Console setup draft, image SEO fields, and revalidation plan. It does not read tenant content from Postgres, enforce RBAC, mutate SEO records, submit sitemaps, or verify Search Console ownership. Tracked in `GAP-071` through `GAP-078`.

### `GET /api/public/[tenantSlug]/sitemap-preview`

Status: **Scaffolded static preview route**.

Returns static sitemap-plan JSON for inspection. Production sitemap generation must use tenant-domain canonical resolution, SeoCityPage/SeoStylePage/SeoRedirect records, draft/archive/noindex filtering, cache revalidation, and tests. Tracked in `GAP-072`, `GAP-076`, and `GAP-078`.

## Phase 11 observability contract notes

Observability endpoints are intentionally non-production. They build sanitized drafts through `@inkroute/observability`, then return `501` until the following exist: rate limiting, tenant resolver, auth/RBAC for dashboard routes, Prisma persistence, provider signature verification, alert provider configuration, and automated tests.

Error-report responses must never include raw stack traces, client PII, medical notes, consent signatures, payment data, cookies, authorization headers, or provider tokens. Future persistent records should store redacted metadata only, plus `stackHash`, `fingerprint`, severity, source, route, release, runtime, and environment.

## Phase 12 release/feature-flag route boundaries

### `GET /api/releases`

Dashboard-only scaffolded route returning a demo release candidate, rollback draft, and feature flag decisions.

Current status: scaffolded, read-only, not authenticated, not production-safe.

Required production pipeline:

1. authenticate dashboard user
2. resolve tenant membership and role
3. authorize release-read permission
4. fetch `ReleaseRecord`, `FeatureFlag`, and deployment evidence from Postgres
5. redact provider secrets and internal incident details
6. return tenant-scoped release control-plane payload

### `POST /api/releases`

Current status: returns `501 RELEASE_PERSISTENCE_NOT_IMPLEMENTED` after creating a draft release candidate from basic request shape.

Future production behavior:

- create draft `ReleaseRecord`
- attach release notes, commit SHA, artifact metadata, and migration plan
- evaluate release gates
- write audit log
- optionally trigger preview CI/CD workflow
- never deploy production without protected-environment approval

### `GET /api/feature-flags`

Current status: returns static `@inkroute/releases` flag definitions and preview/production decisions.

Future production behavior:

- resolve flags from persisted tenant/global/environment records
- return only safe flag fields to clients
- keep provider kill switches server-side
- include cache/invalidation metadata

### `POST /api/feature-flags`

Current status: returns `501 FEATURE_FLAG_MUTATION_NOT_IMPLEMENTED`.

Future production behavior:

- require owner/admin RBAC
- validate flag key/scope/environment
- apply optimistic concurrency or versioning
- write audit log
- invalidate flag caches
- prevent enabling credential-gated providers without verification evidence

### `GET /api/public/[tenantSlug]/release-health`

Current status: returns limited static-demo release health data.

Future production behavior:

- expose only public-safe app version/channel and broad status
- never leak internal deployment URLs, incident details, flag rollout notes, provider secrets, tenant counts, or stack traces
- use cache headers appropriate for public status metadata


## Phase 13 security/privacy/trust route boundaries

### `GET /api/public/[tenantSlug]/upload-policy`

Status: **Scaffolded read-only preview**.

Returns tenant slug, upload policy drafts, public rate-limit drafts, security header drafts, and gap IDs. This route does not create signed upload URLs, authenticate users, scan files, or persist `FileAsset` rows.

### `POST /api/public/[tenantSlug]/secure-upload-intents`

Status: **Local runtime validation + mock intent persistence implemented**.

Expected JSON fields: `kind`, `filename`, `mimeType`, `sizeBytes`, and optional `declaredByAuthenticatedUser`. The route validates metadata with `@inkroute/security`, applies local rate limiting, and persists mock intent data in local runtime state. Production must resolve tenant by trusted domain/slug, require an authenticated user or short-lived booking upload token, generate server-side object keys, create signed private uploads, verify magic bytes, strip metadata, scan/quarantine files, persist `FileAsset`, and write audit logs.

### `POST /api/public/[tenantSlug]/privacy-requests`

Status: **Local draft intake now persists redacted privacy request payloads in local runtime**.

Expected JSON fields: `type` and `email`. The route returns a redacted submission and privacy request draft. Production requires identity verification, persistence, attorney-reviewed deadlines and language, export/delete/rectification workers, legal retention holds, and audit logs.

### `GET /api/security/trust-status`

Status: **Dashboard read-only scaffold**.

Returns security posture summary, controls, tenant isolation fixtures, upload policies, rate-limit rules, CSRF plans, and header drafts. Production requires dashboard auth, RBAC, tenant visibility rules, and no public exposure of internal security details.

### `POST /api/security/privacy-requests`

Status: **Dashboard scaffold, intentionally returns 501**.

Builds a privacy request draft for internal review only. Production requires owner/studio manager RBAC, tenant-scoped persistence, worker execution, retention/legal hold logic, and audit logs.

## Phase 15 deployment/readiness routes

### `GET /api/deployment/readiness`

**Status:** Scaffolded / unprotected / preview-only.

Returns a deployment readiness preview built from `@inkroute/deployment` helpers:

- environment readiness summary
- deployment plan
- launch checklist
- handoff tasks
- production blocked marker

The route must not expose secret values. It is not production-safe until dashboard auth, tenant/admin RBAC, rate limiting, audit logging, and secret redaction are verified.

### `POST /api/deployment/readiness`

**Status:** Not implemented.

Returns `501 DEPLOYMENT_MUTATION_NOT_IMPLEMENTED`. Deployment approvals, migrations, provider publishes, and rollbacks require protected CI/CD, RBAC, audit logs, provider credentials, and release records.
