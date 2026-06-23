# API Contracts

## Current status

API contracts are documented and multiple public/dashboard boundaries now have tenant-scoped DB persistence, audit metadata, fail-closed production guards, or local-runtime fallback behavior. Provider execution, live replay proof, full integration tests, and some production workflows remain evidence-gated. Phase 2 expanded the Prisma domain model and validators that future API handlers should use. Phase 3 public pages still read static demo config. All future API endpoints must validate inputs with `@inkroute/validators`, enforce auth where required, scope tenant-owned data, and return a predictable response envelope.

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
| `GET` | `api/public/:tenantSlug/portfolio` | Public portfolio items | `publicReadQuerySchema` bounded `limit` | No | DB-oriented tenant-scoped read with validated bounded query limit and non-production demo fallback; production disables local fallback. |
| `GET` | `api/public/:tenantSlug/travel` | Public travel schedule/city availability | `publicReadQuerySchema` bounded `limit` | No | DB-oriented tenant-scoped read with validated bounded query limit and non-production demo fallback; production disables local fallback. |
| `POST` | `/api/public/:tenantSlug/booking-requests` | Create booking request | `bookingRequestInputSchema` | No, DB path requires bot proof + queue handoff readiness | Tenant-scoped validation, local + DB persistence path, anti-bot proof enforcement for DB writes, encryption-policy/rotation metadata, and signed reference-upload handoff contract in response. |
| `POST` | `api/public/:tenantSlug/waitlists` | City waitlist signup | `waitlistSignupInputSchema` | No, rate-limited | DB-oriented Client/MessageThread/Message/Notification/NotificationDelivery/NotificationProviderHandoff/IdempotencyKey/AuditLog intent persistence with hashed destination metadata and non-production local redacted-message fallback; production disables local fallback and live provider sends remain gated. |
| `GET` | `api/public/:tenantSlug/seo/cities/:citySlug` | City SEO page data | `seoCityPageInputSchema` for admin writes | No | DB-oriented published city-page read with non-production demo fallback; production disables local fallback. |
| `GET` | `api/public/:tenantSlug/seo/styles/:styleSlug` | Style SEO page data | `seoStylePageInputSchema` for admin writes | No | DB-oriented published style-page read with non-production demo fallback; production disables local fallback. |
| `GET` | `api/public/:tenantSlug/reviews` | Approved public testimonials | `publicReadQuerySchema` bounded `limit` | No | DB-oriented tenant-scoped approved-review read with validated bounded query limit and non-production demo fallback; production disables local fallback. |
| `GET` | `api/public/:tenantSlug/faq` | Public FAQ content bundle | `publicReadQuerySchema` bounded `limit` | No | Tenant-safe public bundle route with validated bounded query limit; durable FAQ CMS persistence remains under SEO/public-content gaps. |
| `GET` | `/api/public/:tenantSlug/notification-previews` | Static notification/template delivery-plan previews | Static Phase 9 helper output | No | Scaffolded preview route; no send/queue |
| `POST` | `/api/public/:tenantSlug/messages` | Public client message/contact thread draft | `publicMessageInputSchema` | No, DB path requires existing booking/client context | DB-first public message persistence for tenant-scoped booking replies; validates public subject/body/booking context, writes MessageThread/Message/Notification/Delivery/Handoff/IdempotencyKey/AuditLog rows when booking context exists, otherwise local fallback stays non-production only. Provider worker execution remains evidence-gated. |
| `POST` | `/api/public/:tenantSlug/contact` | Public contact form intake | `publicContactInputSchema` | No, rate-limited | DB-first contact intake: validates public name/email/subject/message, resolves tenant scope, upserts Client by email, writes MessageThread/Message/Notification/Delivery/Handoff/IdempotencyKey/AuditLog rows with hashed destination metadata, and keeps local runtime fallback non-production only. Provider delivery, seeded DB isolation, browser/API E2E, and CI evidence remain gated. |
| `POST` | `/api/public/:tenantSlug/analytics` | Public SEO analytics attribution event | `AnalyticsEventName` allowlist | No, tenant-scoped and redacted | DB-first public analytics ingestion: resolves tenant scope, normalizes/redacts UTM/portfolio/booking attribution, persists AnalyticsEvent/Campaign rows with idempotency key, and disables production local preview fallback. SearchConsoleImportedRow/SearchConsoleOperationRun schema and migration coverage are present for import durability, while credentialed Search Console jobs, click-through proof, booking attribution integration, and CI evidence remain gated. |
| `POST` | `/api/public/:tenantSlug/preferences` | Public notification preference mutation | Preference center contract | No, signed-token proof required before launch | DB-first preference mutation: resolves tenant scope, persists hash-only NotificationChannelPreference/NotificationSuppression/IdempotencyKey/AuditLog rows, and keeps local contract fallback non-production only. Token crypto, legal copy, List-Unsubscribe provider proof, integration tests, and CI evidence remain gated. |
| `POST` | `/api/public/:tenantSlug/unsubscribe` | One-click email unsubscribe | Preference center contract | No, token hash required for production proof | DB-first one-click unsubscribe: persists hash-only email opt-out, suppression, idempotency, and audit rows when DB tenant scope is available, never stores raw tokens, and keeps local contract fallback non-production only. Provider List-Unsubscribe proof remains gated. |
| `POST` | `/api/public/:tenantSlug/error-reports` | Public fallback client error-report draft | `errorReportInputSchema` | No, rate-limited and bot-protected | DB-backed redacted ErrorReport + AbuseEvent + AuditLog ingest with production local fallback disabled; provider forwarding remains evidence-gated. |

## Dashboard endpoints planned

| Method | Route | Purpose | Permission | Validator | Status |
| --- | --- | --- | --- | --- | --- |
| `GET` | `api/metrics` | Tenant overview metrics | `analytics:read` | `dashboardMetricsQuerySchema` optional `tenantId`; unknown query keys rejected | DB-backed aggregate route with dashboard auth/RBAC, tenant-scope enforcement, no-store responses, AuditLog write, and non-production demo fallback; production fallback disabled. |
| `GET` | `/api/bookings` | Booking inbox | `booking:read` | `dashboardListQuerySchema` optional `tenantId`, bounded `limit` | DB-backed route exists: tenant-scoped BookingRequest list read, redacted dashboard projection, no-store response, AuditLog write, production local fallback fail-closed. Seeded DB/RBAC/redaction tests remain evidence-gated. |
| `GET` | `/api/bookings/:bookingId` | Booking detail with timeline | `booking:read` | Path `bookingId`; `dashboardTenantQuerySchema` optional `tenantId` | DB-backed route exists: tenant-scoped BookingRequest detail read with latest state events, redacted dashboard projection, no-store response, AuditLog write, production local fallback fail-closed. Seeded DB/RBAC/redaction tests remain evidence-gated. |
| `PATCH` | `/api/bookings/:bookingId/state` | Accept/decline/reschedule state changes | `booking:write` | `bookingStatusUpdateSchema` plus action/idempotency metadata | DB-backed route exists: validates supported lifecycle action, enforces tenant scope, replays completed IdempotencyKey results without duplicate writes, persists BookingRequest status + IdempotencyKey + BookingStateEvent + AuditLog in one transaction, emits dashboard mutation plan evidence, and disables production local fallback. Provider rollback and seeded integration tests remain evidence-gated. |
| `POST` | `api/appointments` | Create appointment from booking | `booking:write` | `appointmentInputSchema` | DB-backed route added: validates booking/artist/client/travel/studio tenant scope, claims/replays IdempotencyKey results, persists Appointment + BookingStateEvent + AuditLog in one transaction, advances scheduling state through the booking transition plan, and returns deferred deposit/notification/calendar lifecycle intents. Production local fallback fails closed; provider execution and tenant-isolated integration tests remain evidence-gated. |
| `POST/PATCH` | `api/seo` | Create/update/publish/archive SEO city/style pages and redirects | `seo:write` | `buildSeoPublicationMutationPlan` plus idempotency/revalidation/association metadata | DB-backed route exists: enforces tenant/RBAC scope, runs the package publication planner before commits, upserts SeoCityPage/SeoStylePage/SeoRedirect records, persists IdempotencyKey + AuditLog + SeoPublicationRevalidationJob + SeoPublicationAssociation rows in one transaction, returns no-store response-level idempotency/revalidation proof, and keeps local fallback dry-run only. Prisma migration/client generation, seeded tenant-isolated integration tests, dashboard browser flows, CI evidence, and secret-safe artifacts remain gated under `GAP-071`. |
| `GET` | `/api/clients/:clientId` | Client profile/timeline | `client:read` | Path `clientId`; `dashboardTenantQuerySchema` optional `tenantId` | DB-backed route exists: tenant-scoped Client detail read with recent bookings/payment summary, redacted dashboard projection, no-store response, AuditLog write, and production local fallback fail-closed. Seeded DB/RBAC/redaction tests remain evidence-gated. |
| `POST` | `/api/clients` | Create client profile | `client:write` | `clientInputSchema` | DB-backed route added: validates client payload, normalizes tenant-scoped email uniqueness, claims/replays IdempotencyKey results, persists Client + AuditLog in one transaction, returns no-store response with idempotency proof metadata, and disables production local fallback. Tenant-isolated mutation/RBAC/redaction tests remain evidence-gated. |
| `PATCH` | `/api/clients/:clientId` | Update private client note metadata | `client:write` | `clientPrivateNoteInputSchema` plus `dashboardTenantQuerySchema` optional `tenantId` | DB-backed private-note route exists: validates tenant/RBAC scope, claims/replays IdempotencyKey results with a hash-only note fingerprint and request-hash conflict denial, persists ClientProfile + AuditLog in one transaction, returns idempotency proof metadata, never echoes the raw note, and disables production local fallback. Export/delete/retention/legal workflow tests remain evidence-gated under privacy gaps. |
| `POST` | `/api/portfolio` | Create portfolio item | `portfolio:write` | `portfolioItemInputSchema` | DB-backed metadata route added: validates artist/style tenant scope, enforces tenant slug uniqueness, claims/replays IdempotencyKey results, persists PortfolioItem + style links + primary PortfolioImage URL metadata + AuditLog in one transaction, and disables production local fallback. Signed upload/object-storage/image-processing handoff and tenant-isolated mutation tests remain evidence-gated. |
| `POST` | `api/portfolio/:id/images` | Attach portfolio image metadata | `portfolio:write` | `portfolioImageInputSchema` | DB-backed metadata route added at `/api/portfolio/[portfolioId]/images`: validates path/body match, verifies PortfolioItem/FileAsset tenant scope, claims/replays IdempotencyKey results, persists PortfolioImage + AuditLog, and disables production local fallback. Signed upload, malware scan, derivatives, EXIF stripping, CDN proof, and performance evidence remain gated. |
| `POST` | `api/files/signed-upload` | Create signed upload request | Permission varies by file kind | `fileAssetInputSchema` boundary | DB-backed signed-upload intent route added: validates file metadata, maps permission by file kind, claims/replays IdempotencyKey results, persists FileAsset + SignedUrlGrant + AuditLog rows, returns no-store response with `providerUrlMinted: false`, and disables production local fallback. Provider signed URL minting, malware scan, metadata stripping, bucket ACL proof, and cross-tenant provider denial remain gated. |
| `POST` | `api/travel/cities` | Create managed travel city | `travel:write` | `travelCityInputSchema` | DB-backed route added: validates city payload, enforces tenant slug uniqueness, claims/replays IdempotencyKey results, persists TravelCity + AuditLog in one transaction, and disables production local fallback. Public SEO/cache revalidation and tenant-isolated mutation tests remain evidence-gated. |
| `POST` | `api/travel/schedules` | Create travel schedule/guest spot | `travel:write` | `travelScheduleInputSchema` | DB-backed route added: validates schedule payload, verifies artist/city/studio tenant scope, claims/replays IdempotencyKey results, persists TravelSchedule + AuditLog in one transaction, and disables production local fallback. Public cache/SEO/notification fanout and tenant-isolated mutation tests remain evidence-gated. |
| `POST` | `api/travel/publish` | Publish/update/unpublish travel stop | `travel:write` | Travel publish mutation plan | DB-first route added: validates publish/update/unpublish/rollback plans, verifies artist tenant scope, upserts TravelCity, persists/updates TravelSchedule, records AuditLog and IdempotencyKey result metadata with request-hash conflict denial and response-level idempotency proof, and keeps repository-required fallback non-production only. Cache revalidation, notification provider queues, sync transports, rollback provider tests, and dashboard-to-public E2E proof remain evidence-gated under `GAP-060`. |
| `POST` | `api/availability` | Create availability window | `travel:write` | `availabilityWindowInputSchema` | DB-backed route added: validates availability payload, verifies artist/city/schedule tenant scope, claims/replays IdempotencyKey results, persists AvailabilityWindow + AuditLog in one transaction, and disables production local fallback. Persisted conflict checks, concurrent hold protection, and seeded integration tests remain evidence-gated under `GAP-056`. |
| `POST` | `api/calendar/holds` | Create dashboard slot hold | `calendar:write` | Availability hold plan | DB-first route added: validates hold plan, verifies artist tenant scope, claims/replays IdempotencyKey results with request-hash conflict denial before conflict checks, rejects overlapping open/waitlist/full windows for new holds, persists `AvailabilityWindow` admin holds with `AuditLog`, returns idempotency proof metadata, and disables production local fallback. Seeded race-condition, cross-tenant, and repository integration proof remain evidence-gated under `GAP-056`. |
| `POST` | `api/payments/deposit-session` | Create Stripe deposit session | `payment:write` | `depositInputSchema` | DB-backed deposit draft route added: validates booking/appointment tenant scope, claims/replays IdempotencyKey results, persists Deposit + PaymentAuditLog, returns no-store response with `stripeCheckoutCreated: false`, and disables production local fallback. Stripe checkout creation, webhook reconciliation, rollback, and sandbox proof remain provider-gated. |
| `POST` | `api/refunds` | Create/refund payment record | `payment:write` | `refundInputSchema` | DB-backed local refund-record route added: validates tenant-scoped Payment match, amount/currency/scope constraints, claims/replays IdempotencyKey results, persists Refund + PaymentAuditLog, and disables production local fallback. Stripe refund execution, webhook reconciliation, rollback, and settlement proof remain provider-gated. |
| `POST` | `api/intake/forms` | Create intake form | `settings:write` | `intakeFormInputSchema` | DB-backed route added: validates form shell, enforces tenant key/version uniqueness, claims/replays IdempotencyKey results, persists IntakeForm + AuditLog in one transaction, and disables production local fallback. Question authoring, response persistence, privacy review, and integration tests remain evidence-gated. |
| `POST` | `api/consent/forms` | Create consent form | `settings:write` | `consentFormInputSchema` | DB-backed route added: validates consent form shell/body, enforces tenant key/version uniqueness, claims/replays IdempotencyKey results, persists ConsentForm + AuditLog in one transaction, and disables production local fallback. Legal approval, signature/file workflows, medical acknowledgments, and integration tests remain evidence-gated. |
| `PATCH` | `api/forms/:formId` | Archive form metadata | `form:write` | `archive_form_version` action contract | DB-backed metadata-only archive route: validates tenant/RBAC scope, updates IntakeForm or ConsentForm status to archived, persists IdempotencyKey + AuditLog result metadata, returns no-store response, and disables production local fallback. Legal copy changes, signature requests, raw answers, medical payloads, private upload retention, and integration tests remain evidence-gated. |
| `GET` | `/api/error-reports` | Error/crash reports | `error:read` | `errorReportFilterSchema` optional `tenantId`/`status`/`source`, bounded `limit` | DB-backed route exists: tenant-scoped, RBAC-gated, no-store, audit-logged, metadata-redacted error report reads; production local fallback fails closed. Alert routing/provider escalation remains evidence-gated. |
| `POST` | `/api/error-reports` | Authenticated dashboard error-report ingest boundary | `error:write` | `errorReportInputSchema` | DB-backed route exists: authenticated tenant-scoped error ingest, no-store response, local fallback disabled in production, persisted ErrorReport + AuditLog on DB paths, and provider alert routing remains evidence-gated. |
| `POST` | `/api/observability/release-incidents` | Link release regressions to incident plans | `release:write` | Release incident linkage plan | DB-backed route exists: reads tenant-scoped ErrorReport/ReleaseRecord evidence, builds sanitized linkage plans, persists ReleaseIncidentLink/AuditLog/ErrorReport metadata on allowed DB paths, and returns no-store responses. Production provider-evidence failures now fail closed before AuditLog/ReleaseIncidentLink writes; live Sentry/source-map, provider incident, dashboard smoke, tenant isolation, and CI proof remain evidence-gated under `GAP-093`. |
| `POST` | `/api/releases` | Create release note | `release:write` | `releaseCreateInputSchema`; GET uses `releaseTenantQuerySchema` | DB-backed route exists: tenant/membership-gated release creation with idempotency-backed persistence and audit metadata; deployment automation remains external/evidence-gated. |
| `PATCH` | `/api/releases` | Request rollback intent | `release:write` | `releaseRollbackInputSchema` | DB-backed route exists: tenant/membership-gated rollback intent creation with idempotency-backed AuditLog metadata, no-store responses, and response-level proof that provider rollback/deployment execution did not run; protected-environment rollback remains external/evidence-gated. |
| `PATCH` | `/api/feature-flags` | Toggle tenant feature flag | `settings:write` | `featureFlagPatchInputSchema`; GET uses `featureFlagReadQuerySchema` | Implemented as route-backed feature flag writes via `POST /api/feature-flags`: tenant/membership-gated, idempotency-backed DB override persistence with request-hash conflict denial and completed replay proof, no-store response, audit metadata, and provider-credential gates for live provider flags. Contract path should be normalized in consumers; CI/RBAC evidence remains gated. |
| `PATCH` | `/api/settings` | Update safe tenant settings metadata | `settings:write` | `tenantSettingsMutationSchema` plus `dashboardTenantQuerySchema` for GET | DB-backed settings write exists: validates tenant/RBAC scope, allows only public site name/locale/timezone metadata, persists Tenant update + IdempotencyKey request-hash conflict denial + completed replay result + AuditLog result metadata, returns no-store response with idempotency proof, and disables production local fallback. Provider secrets, credentials, legal policy copy, member invites, custom roles, and integration proof remain gated. |
| `GET` | `/api/messages` | Tenant message threads and delivery logs | `message:read` | `dashboardListQuerySchema` optional `tenantId`, bounded `limit` | DB-backed route exists: tenant-scoped message thread list reads with body/provider redaction, no-store response, and AuditLog write; production local fallback fails closed. Provider delivery evidence remains gated. |
| `POST` | `/api/messages/:threadId` | Reply to client thread | `client:write` | `messageInputSchema` plus message route metadata | Implemented through dashboard message write route: claims IdempotencyKey, creates tenant-scoped MessageThread/Message/Notification/Delivery/ReadState/Handoff/AuditLog transactionally, and keeps provider dispatch evidence-gated. |
| `POST` | `api/notifications/preview` | Preview template delivery plan | `settings:write` | `notificationPreviewInputSchema` | Implemented as no-persistence delivery-plan preview: validates template context/consent, returns consent-aware candidates, no-store response, and keeps provider dispatch/sandbox evidence gated. |
| `POST` | `api/notifications/queue` | Queue consent-aware notification | `settings:write` or domain permission | `notificationInputSchema` plus delivery plan | DB-backed route added: validates notification input, enriches consent from tenant-scoped client records, claims/replays IdempotencyKey results with request-hash conflict denial, persists Notification + NotificationDelivery + NotificationProviderHandoff + AuditLog rows, and disables production local fallback. Provider workers/sends, retries, dead letters, and sandbox/device evidence remain gated. |
| `POST` | `api/notifications/scheduler` | Persist notification schedule-sequence jobs | `message:write` | Scheduler action plan | DB-backed `schedule_sequence` route added: validates scheduler plan, verifies related booking/appointment tenant scope, claims/replays IdempotencyKey results with request-hash conflict denial, persists Notification + NotificationDelivery + NotificationProviderHandoff + AuditLog rows with provider dispatch disabled, and disables production local fallback. Process/retry/dead-letter worker execution, queue concurrency, provider dispatch, and integration evidence remain gated under `GAP-065`/`GAP-066`. |
| `PATCH` | `api/notification-preferences/:clientId` | Update preferences/suppression state | `client:write` | `notificationConsentInputSchema` | DB-backed route added: validates client path/body match, claims/replays IdempotencyKey results, updates Client opt-in flags, upserts NotificationChannelPreference and NotificationSuppression rows with hashed destinations, writes AuditLog, and disables production local fallback. Provider webhook replay, live STOP enforcement, and integration evidence remain gated. |

## Mobile API use

The mobile app should consume tenant-scoped dashboard APIs. A thin mobile BFF can be added only if app-specific payload shapes become meaningfully different. Mobile endpoints must use the same auth/RBAC rules and should never receive private data beyond the signed-in artist's tenant scope.

## Webhook endpoints planned

| Method | Route | Purpose | Auth | Status |
| --- | --- | --- | --- | --- |
| `POST` | `/api/webhooks/stripe` | Stripe payment/deposit status | Stripe signature | DB-first reconciliation boundary exists: requires Stripe signature header, requires `STRIPE_WEBHOOK_SECRET` before production processing, verifies HMAC when configured, resolves tenant metadata, persists redacted `ProviderWebhookDelivery` replay rows and `PaymentAuditLog`, and updates matching Payment/Deposit status only when tenant-scoped metadata/provider IDs and money checks allow it. Local runtime fallback remains non-production only; Stripe CLI/provider proof remains evidence-gated. |
| `POST` | `/api/webhooks/sentry` | Optional issue sync and provider issue reconciliation | Sentry signature/secret header | DB-backed reconciliation boundary exists: requires Sentry signature header, verifies HMAC when `SENTRY_WEBHOOK_SECRET` is configured, records provider delivery/idempotency, reconciles matching `ErrorReport` status, writes `AuditLog`, and fails closed in production when durable tenant ownership/persistence is unavailable. Live Sentry replay/no-PII/provider proof remains evidence-gated. |
| `POST` | `/api/webhooks/calendar` | Google calendar updates | Provider verification | Local boundary route added: validates Google push headers, builds an incremental-sync plan with provider execution blocked, returns no-store local receipt outside production, and fails closed in production until OAuth credentials, encrypted token persistence, verified channel tokens, sync worker execution, idempotency persistence, and CalendarAuditLog proof exist. |
| `POST` | `/api/webhooks/email` | Email delivery status | Provider signature | Local boundary requires signature-like header, validates JSON, computes readiness/reconciliation plans, attempts redacted `ProviderEvent` + `IdempotencyKey` + `AuditLog` persistence on DB-available non-production paths, upserts `NotificationSuppression` for bounce/complaint/unsubscribe payloads that include a destination, and persists interpreted local runtime state. Production fails closed before durable writes until cryptographic provider signature verification, live replay, suppression reconciliation, and integration evidence exist. |
| `POST` | `/api/webhooks/sms` | SMS delivery/inbound messages and STOP preview | Provider signature | Local boundary requires Twilio signature-like header, supports JSON/form payloads, computes readiness/reconciliation plans, attempts redacted `ProviderEvent` + `IdempotencyKey` + `AuditLog` persistence on DB-available non-production paths, upserts `NotificationSuppression` for STOP payloads with a sender, and returns an explicit inbound-thread boundary when no tenant client can be resolved. Production fails closed before durable writes until Twilio signature verification, live replay, STOP/inbound reconciliation, and integration evidence exist. |

## State transition rules

Booking state changes must create a `BookingStateEvent`. Payment and deposit changes must create `PaymentAuditLog`. Sensitive changes should also create an `AuditLog` row.

Examples:

- `submitted -> accepted` requires `booking:write`.
- `accepted -> deposit_pending` requires a deposit record.
- `deposit_pending -> deposit_paid` should be driven by verified Stripe webhook in production (gated/proof pending).
- `deposit_paid -> scheduled` requires an appointment record.
- `scheduled -> completed` should trigger aftercare notification scheduling.
- `scheduled -> no_show` should preserve no-show audit metadata.

## Phase 2 implementation note

The schema and validators are expanded, and booking request handling is now production-oriented with DB persistence, anti-bot controls, encryption gates, and workflow handoff contracts. Other public handlers are mixed: several are DB-first with production local-fallback guards, while provider-backed execution and tenant-isolated integration evidence remain tracked under their owning GAP rows.


## Phase 3 implementation note

The public website now has static demo city/style routes plus DB-oriented public content API handlers for portfolio, travel, approved reviews, published city SEO pages, and published style SEO pages. A public FAQ bundle route is also wired for tenant-safe public content, while durable FAQ CMS persistence remains tracked under SEO/public-content gaps. These handlers resolve tenant scope, expose only public/redacted fields, and use non-production demo fallback only when DB content is unavailable. Capture API JSON/rendered HTML redaction, cache, route smoke, browser, and CI evidence before production closure.


## Phase 4 implementation note
`apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts` now includes production-oriented persistence behavior in the DB path:

- Parses JSON.
- Validates against `bookingRequestInputSchema`.
- Resolves tenant by slug, then applies fallback behavior when DB is unavailable.
- Applies local rate limit and enforces anti-bot proof (`x-inkroute-bot-proof`) for DB-backed writes; DB persistence is denied with `BOT_PROTECTION_REQUIRED` when proof is absent/invalid.
- Persists `BookingRequest`, `BookingStateEvent`, and `AuditLog` rows to Postgres when DB is available.
- Enforces key-policy checks for sensitive persistence and emits encryption readiness, rotation-state/action, round-trip proof, key-cache refresh evidence, and provider-token readiness in response metadata + audit payloads.
- Produces scope-aware post-persist workflow contracts (`notification`, `deposit`, `calendar`, `reference-upload`) with signed reference-upload handoff contract fields for downstream queue/worker handoff.
- Captures provider-token-intake detection metadata and blocks DB persistence when encryption readiness is invalid for token-bearing payloads.
- Falls back to local runtime draft persistence when DB is unavailable, with matching DB/local workflow plan shapes.

Do not expose this as a complete production booking endpoint until `GAP-031`, `GAP-032`, `GAP-033`, `GAP-034`, `GAP-061`, and tenant-isolated integration tests are completed; `GAP-021` key-policy/encryption controls are locally closed, while provider-token operational hardening remains tracked under the provider handoff gaps.


## Phase 5 implementation note

`apps/dashboard` now contains tenant-scoped API handlers for the core dashboard read/mutation surface listed above, with shared validators, RBAC guards, no-store responses, redaction, idempotency, and audit metadata where implemented. Remaining production work is evidence-gated around provider-backed auth/session proof, seeded tenant-isolation/RBAC tests, provider execution, dashboard build/typecheck, CI artifacts, and secret-safe evidence capture. Future dashboard endpoints must continue replacing static demo data from `apps/dashboard/lib/demo.ts` with authenticated, tenant-scoped API/server loaders and mutation handlers.

Do not treat the Phase 5 dashboard UI as production-ready until `GAP-036`, `GAP-037`, `GAP-038`, `GAP-039`, `GAP-040`, and `GAP-041` are resolved.

## Phase 6 mobile implementation note

`apps/mobile` now consumes static demo data and shared helper packages only. No mobile API client, authenticated session, refresh token handling, push token registration, offline sync endpoint, or mobile-specific BFF exists. Mobile should initially reuse dashboard tenant-scoped APIs for bookings, appointments, clients, travel, portfolio, notifications, errors, and releases. Add a mobile BFF only if payload shape, offline sync, or bandwidth constraints justify it.

Mobile production endpoints must enforce the same handler pipeline documented above: auth, tenant membership, RBAC, Zod validation, tenant-scoped Prisma queries, audit logging, and PII/medical redaction.

## Phase 7 payment route boundaries

### `POST /api/public/[tenantSlug]/deposit-sessions`

Status: **DB-first deposit/payment draft implemented; production SDK flow remains credential-gated**.

Purpose:
- Calculate a deposit policy preview for an accepted booking or signed deposit handoff.
- Return a Stripe Checkout session draft with reconciliation metadata.
Avoid live payment collection until auth/signed-token, Stripe credentials, provider checkout creation, and webhook proof are wired (gated/proof pending).

Current implementation:
- Parses JSON manually in `apps/web/app/api/public/[tenantSlug]/deposit-sessions/route.ts`.
- Requires `bookingRequestId`, `successUrl`, and `cancelUrl`.
- Resolves the tenant/booking from the database first, rate-limits by tenant/client IP, verifies client email when supplied, and persists `Deposit`, pending `Payment`, `PaymentAuditLog`, `BookingStateEvent`, and `IdempotencyKey` in one transaction before returning a provider-disabled checkout draft.
- Falls back to local runtime preview only outside production when database persistence is unavailable, with `GAP-004`, `GAP-049`, and `GAP-050` listed as provider/evidence blockers.

Production requirements:
1. Require authenticated dashboard action or a signed short-lived deposit token generated only after artist acceptance.
2. Keep tenant and booking resolution database-backed; production local fallback is disabled.
3. Verify amount/currency against persisted `Deposit.policySnapshot`.
4. Create Stripe Checkout Session or PaymentIntent using test/live credentials (staged environment only, evidence pending).
5. Persist provider session ID and provider idempotency result before returning redirect URL.
6. Rate-limit and monitor abuse.

### `POST /api/webhooks/stripe`

Status: **DB-first replay/audit reconciliation boundary with non-production local fallback; live Stripe proof remains evidence-gated**.

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

Implemented as a DB-first read-only JSON preview route with non-production static demo fallback. It resolves tenant scope from Postgres when available, reads open/waitlist `AvailabilityWindow` rows, returns public-safe generated slots, and explicitly reports that holds, conflict writes, provider sync, and reservations are not executed. Production static fallback remains disabled. Transactional hold persistence, overlapping/race rejection, audit logs, tenant isolation tests, Google provider sync, and CI evidence remain tracked in `GAP-056` and `GAP-059`.

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

Status: **DB-first booking-context persistence with non-production local fallback; provider execution remains evidence-gated.**

Purpose:
- Accept public-safe client message/contact submissions.
- Validate minimal subject/body shape and return a redacted draft preview.
- Persist `MessageThread`, inbound `Message`, `Notification`, `NotificationDelivery`, `NotificationProviderHandoff`, `IdempotencyKey`, and `AuditLog` rows when a tenant-scoped `bookingRequestId` resolves to an existing client.
- Keep anonymous/contact-only local runtime fallback outside production until authenticated client reply tokens or another tenant-safe identity boundary exists.

Production requirements:
1. Resolve tenant safely by domain or slug.
2. Rate-limit, spam-protect, and optionally CAPTCHA public submissions.
3. Require an existing booking/client context, authenticated client identity, or short-lived reply token before DB persistence.
4. Route notifications to the artist/team through consent-aware queueing.
5. Execute provider workers and webhook replay/suppression proof only after credentials and provider sandboxes are available.
6. Redact medical/payment/private URL content from logs and error responses.

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

Observability endpoints are partially production-oriented. They build sanitized drafts through `@inkroute/observability`, apply rate limiting and tenant resolution, persist redacted `ErrorReport` rows on DB-available paths, and fall back to local runtime only where explicitly allowed outside production. Dashboard error-report read/write APIs are present with tenant/RBAC guards, redaction, no-store responses, and AuditLog writes; provider signature verification, alert/escalation provider configuration, live incident integrations, and CI evidence remain pending.

Error-report responses must never include raw stack traces, client PII, medical notes, consent signatures, payment data, cookies, authorization headers, or provider tokens. Future persistent records should store redacted metadata only, plus `stackHash`, `fingerprint`, severity, source, route, release, runtime, and environment.

## Phase 12 release/feature-flag route boundaries

### `GET /api/releases`

Dashboard-only route returning tenant-scoped release candidates, rollback drafts, and feature-flag decision context.

Current status: authenticated (`release:read`) and tenant-scoped reads with DB-backed persistence and fallback behavior when DB is unavailable.

Required production pipeline:

1. authenticate dashboard user
2. resolve tenant membership and role
3. authorize release-read permission
4. fetch `ReleaseRecord`, `FeatureFlag`, and deployment evidence from Postgres
5. redact provider secrets and internal incident details
6. return tenant-scoped release control-plane payload

### `POST /api/releases`

Current status: validates request schema, persists idempotency-backed `ReleaseRecord` and `AuditLog` metadata on DB-available paths, and falls back to local response without durable writes when DB is unavailable outside production.

Future production behavior:

- create draft `ReleaseRecord`
- attach release notes, commit SHA, artifact metadata, and migration plan
- evaluate release gates
- write audit log
- optionally trigger preview CI/CD workflow
- never deploy production without protected-environment approval

### `PATCH /api/releases`

Current status: validates rollback intent schema, enforces `release:write` tenant membership, records idempotency-backed `AuditLog` metadata on DB-available paths, and returns a rollback plan with `providerRollbackExecuted=false`, `deploymentJobTriggered=false`, and `protectedEnvironmentTouched=false`.

Future production behavior: execute protected-environment provider rollback only after CI/deployment credentials, approval evidence, rollback job transcripts, and post-rollback release-health proof are attached.

### `GET /api/feature-flags`

Current status: resolves persisted global + tenant flag records from DB and evaluates tenant-scoped decisions before returning safe decision snapshots.

Future production behavior:

- resolve flags from persisted tenant/global/environment records
- return only safe flag fields to clients
- keep provider kill switches server-side
- include cache/invalidation metadata

### `POST /api/feature-flags`

Current status: validates mutation payloads, persists feature-flag updates with audit metadata on DB-available paths, and blocks provider-credentialed enables when required credentials are missing.

Future production behavior:

- require owner/admin RBAC
- validate flag key/scope/environment
- apply optimistic concurrency or versioning
- write audit log
- invalidate flag caches
- prevent enabling credential-gated providers without verification evidence

### `GET /api/public/[tenantSlug]/release-health`

Current status: returns release health from tenant-scoped persisted `ReleaseRecord` and `FeatureFlag` rows when DB is available, with a safe fallback snapshot otherwise.

Future production behavior:

- expose only public-safe app version/channel and broad status
- never leak internal deployment URLs, incident details, flag rollout notes, provider secrets, tenant counts, or stack traces
- use cache headers appropriate for public status metadata


## Phase 13 security/privacy/trust route boundaries

### `GET /api/public/[tenantSlug]/upload-policy`

Status: **Scaffolded read-only preview**.

Returns tenant slug, upload policy drafts, public rate-limit drafts, security header drafts, and gap IDs. This route does not create signed upload URLs, authenticate users, scan files, or persist `FileAsset` rows.

### `POST /api/public/[tenantSlug]/secure-upload-intents`

Status: **DB-first booking-context upload intent persistence with non-production local fallback; provider URL minting remains gated**.

Expected JSON fields: `kind`, `filename`, `mimeType`, `sizeBytes`, optional `bookingRequestId`, and optional `declaredByAuthenticatedUser`. The route validates metadata with `@inkroute/security`, applies local rate limiting, resolves tenant scope from the database when available, and persists `FileAsset`, `SignedUrlGrant`, optional `ReferenceImage`, and redacted `AuditLog` rows when a tenant-scoped booking/client plus issuer context exists. Local runtime mock intent fallback remains available only outside production when DB context is unavailable. Production still must require an authenticated user or short-lived booking upload token for anonymous uploads, mint provider-signed URLs, verify magic bytes, strip metadata, scan/quarantine files, prove private bucket ACLs and cross-tenant denial, run integration tests, and capture CI/provider evidence.

### `POST /api/public/[tenantSlug]/privacy-requests`

Status: **DB-first public privacy intake with local fallback outside production**.

Expected JSON fields: `type`, `email`, optional `requesterName`, and optional `details`. The route rate-limits by tenant/client, resolves tenant scope from the database when available, persists `IdempotencyKey`, `PrivacyRequest`, and redacted `AuditLog` rows on DB-backed paths, stores only redacted requester metadata/result evidence, returns a redacted submission and privacy request draft, and uses local runtime fallback only outside production when the DB is unavailable. Production still requires identity verification, attorney-reviewed deadlines and language, export/delete/rectification workers, legal retention holds, notifications, integration tests, and CI evidence before GAP-098 can close.

### `GET /api/security/trust-status`

Status: **Dashboard shared-auth read-only trust boundary with production provider-session fail-close**.

Returns security posture summary, controls, tenant isolation fixtures, upload policies, rate-limit rules, CSRF plans, and header drafts through the shared dashboard actor/RBAC guard plus a trust-specific operator-role allowlist. Production still fails closed until provider-backed session, persisted tenant membership, audit-ready route evidence, and current security runtime artifacts exist.

### `POST /api/security/privacy-requests`

Status: **DB-backed dashboard intake route added for authenticated tenant actors**.

Validates dashboard privacy request intake, enforces tenant write permission, rate-limits by tenant/actor/IP, verifies optional client scope, persists `PrivacyRequest` plus redacted `AuditLog`, returns no-store workflow evidence, and disables local in-memory fallback for production. Export/delete/rectification workers, private file deletion, retention tombstone execution, sanitized log/error capture, attorney/product approval, dashboard build/typecheck, route tests, and CI evidence remain required before GAP-040 can close.

## Phase 15 deployment/readiness routes

### `GET /api/deployment/readiness`

**Status:** Auth-guarded and tenant-scoped readiness endpoint with DB fallback behavior.

Returns a deployment readiness preview built from `@inkroute/deployment` helpers:

- environment readiness summary
- deployment plan
- launch checklist
- handoff tasks
- production blocked marker

The route must not expose secret values. It is not production-safe until dashboard auth, tenant/admin RBAC, rate limiting, audit logging, and secret redaction are verified.

### `POST /api/deployment/readiness`

**Status:** Request validation and audit-ready persistence behavior is in place; deployment execution (migration jobs, provider publishes, approvals, rollbacks) is intentionally out-of-band until CI/CD environments and credentials are provisioned.
