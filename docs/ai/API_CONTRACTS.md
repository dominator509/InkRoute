# API Contracts

Truth-pass date: 2026-07-01. Stable contracts for frontend/backend agents. The root `API_CONTRACTS.md` remains the fuller ledger.

## Response Envelope

```ts
type ApiSuccess<T> = { ok: true; data: T };
type ApiError = { ok: false; error: { code: string; message: string; requestId?: string } };
```

## Required Handler Pipeline

1. Parse input with Zod from `@inkroute/validators`.
2. Authenticate if private.
3. Resolve tenant by domain, slug, or authenticated membership.
4. Verify tenant membership for dashboard/mobile endpoints.
5. Check RBAC/custom-role permission.
6. Execute tenant-scoped Prisma query or explicit local fallback.
7. Return the standard response envelope.
8. Write audit/state/event rows for sensitive state changes.
9. Redact PII, medical, payment, token, and private file data from logs/errors.

## Public API Routes

| Method | Route | Status | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/public/[tenantSlug]/booking-requests` | DB-first production boundary | Zod validation, tenant resolution, rate limit, anti-bot proof for DB writes, encrypted medical-note handling, audit/state event, idempotency/no-echo receipt, workflow handoff intents. Provider queue execution and tenant-isolated integration evidence remain gated. |
| `POST` | `/api/public/[tenantSlug]/deposit-sessions` | DB-first draft, provider-gated | Persists Deposit/Payment/PaymentAuditLog/BookingStateEvent/IdempotencyKey draft rows with no raw key/customer/provider/session/internal-ID echoes. Live Stripe Checkout/webhook/E2E evidence remains gated. |
| `POST` | `/api/public/[tenantSlug]/secure-upload-intents` | DB-first upload intent, provider-gated | Validates upload metadata and persists FileAsset/SignedUrlGrant/ReferenceImage/AuditLog when tenant-scoped booking/client context exists; local fallback is non-production only. Provider signed URLs/storage/scanning remain open. |
| `POST` | `/api/public/[tenantSlug]/messages` | DB-first message draft, provider-gated | Validates tenant/booking context, persists MessageThread/Message/Notification/Delivery/Handoff/IdempotencyKey/AuditLog when available, and returns no raw contact/body/destination/idempotency/internal IDs. Provider queue execution remains gated. |
| `POST` | `/api/public/[tenantSlug]/error-reports` | DB-first redacted ingest | Validates/sanitizes error reports, rate limits, persists redacted DB rows when available, and disables unaudited production fallback. Provider observability remains open. |
| `POST` | `/api/public/[tenantSlug]/privacy-requests` | DB-first privacy intake | Persists IdempotencyKey/PrivacyRequest/redacted AuditLog on DB-backed paths with safe receipt projection; local fallback remains non-production only. Identity verification, legal workflow, and workers remain open. |
| `GET` | `/api/public/[tenantSlug]/release-health` | DB-first read with safe fallback | Tenant-scoped release/flag DB reads when available, safe fallback otherwise. |
| `GET` | `/api/public/[tenantSlug]/calendar/[artistSlug]/travel.ics` | Static demo | Demo ICS feed; production needs signed/revocable feeds. |
| `GET` | `/api/public/[tenantSlug]/availability-preview` | Static demo | Demo availability preview; no transactional holds. |
| `GET` | `/api/public/[tenantSlug]/notification-previews` | Static preview | Demo templates/delivery plans only. |
| `GET` | `/api/public/[tenantSlug]/seo-preview` | Static preview | SEO helper output only. |
| `GET` | `/api/public/[tenantSlug]/sitemap-preview` | Static preview | Sitemap-plan JSON only. |
| `GET` | `/api/public/[tenantSlug]/upload-policy` | Static preview | Security/upload policy drafts only. |

## Dashboard API Routes

Dashboard APIs currently use `apps/dashboard/app/api/dashboardAuth.ts` for a header-based actor/RBAC shim. This is not a real session provider.

| Method | Route | Status |
| --- | --- | --- |
| `GET` | `/api/releases` | Auth-shim guarded, tenant-scoped DB reads with fallback |
| `POST` | `/api/releases` | Validated persistence with audit metadata where DB is available |
| `PATCH` | `/api/releases` | Validated rollback intent with idempotency/audit metadata; provider rollback execution remains gated |
| `GET` | `/api/feature-flags` | Auth-shim guarded, persisted global/tenant flag reads with fallback |
| `POST` | `/api/feature-flags` | Validated persistence and credential-gate checks |
| `GET` | `/api/deployment/readiness` | Auth-shim guarded readiness preview with DB audit proof |
| `POST` | `/api/deployment/readiness` | Validated/audit-ready persistence with raw request/workflow IDs not echoed or treated as verified provider evidence; deployment execution out-of-band |
| `GET` | `/api/error-reports` | Auth-shim guarded DB/local read path for redacted error reports |
| `POST` | `/api/error-reports` | Auth-shim guarded DB/local ingest path for sanitized error reports |
| `GET` | `/api/security/trust-status` | Static trust/security posture preview; production auth/RBAC still required |
| `POST` | `/api/security/privacy-requests` | Dashboard auth/RBAC guarded privacy intake; DB-backed `PrivacyRequest` + redacted `AuditLog` write when available, rate-limited by tenant/actor/IP, production local fallback fail-closed; export/delete workers and legal/provider proof remain gated |

## Webhook Routes

| Method | Route | Status |
| --- | --- | --- |
| `POST` | `/api/webhooks/stripe` | DB-first reconciliation boundary with raw-body signature check when configured, production secret fail-closed guard, ProviderWebhookDelivery/PaymentAuditLog replay proof, and no raw provider/internal-ID response echoes; live Stripe CLI/provider evidence remains gated |
| `POST` | `/api/webhooks/email` | Local provider-event/reconciliation persistence boundary with signature-like header requirement and production fail-closed guard until cryptographic provider signature/live replay evidence exists |
| `POST` | `/api/webhooks/sms` | Local provider-event/reconciliation and STOP boundary with signature-like header requirement and production fail-closed guard until Twilio signature/live replay evidence exists |
| `POST` | `/api/webhooks/sentry` | Sentry (sandbox) signature-required webhook boundary; verifies `SENTRY_WEBHOOK_SECRET`, persists provider delivery/idempotency + audit reconciliation when tenant ownership is available, and fails closed in production without durable persistence/provider proof |

## Booking State Rules

```text
submitted -> needs_info / accepted / declined
accepted -> deposit_pending
deposit_pending -> deposit_paid
deposit_paid -> scheduled
scheduled -> completed / no_show
cancelled may apply before final completion depending on policy
```

- Booking status changes must create `BookingStateEvent`.
- Payment/deposit changes must create `PaymentAuditLog`.
- Sensitive mutations should also create `AuditLog`.
- Public booking DB writes require `x-inkroute-bot-proof` and encryption readiness for sensitive fields.

## Auth Requirements by Surface

| Surface | Auth requirement |
| --- | --- |
| Public pages | No auth; public-safe data only |
| Public mutations | Rate limit and abuse controls; DB booking writes require bot proof |
| Deposit session creation | Future signed token or authenticated dashboard action |
| Dashboard UI/API | Real session provider still required; current API shim is not production auth |
| Mobile API | Must reuse dashboard-grade auth/RBAC or a justified mobile BFF |
| Webhooks | Provider signature verification and replay/idempotency controls |

## Key Validators

| File | Main schemas |
| --- | --- |
| `booking.ts` | `bookingRequestInputSchema`, status/appointment schemas |
| `tenancy.ts` | Tenant/domain/slug inputs |
| `payments.ts` | Deposit/refund/payment schemas |
| `portfolio.ts` | Portfolio item/image/file metadata schemas |
| `travel.ts` | Travel city/schedule/availability schemas |
| `people.ts` | Client/person inputs |
| `forms.ts` | Intake and consent form inputs |
| `messaging.ts` | Message, notification, consent, preview inputs |
| `seo.ts` | SEO city/style schemas |
| `release.ts` | Release and feature-flag schemas |
| `observability.ts` | Error report/filter schemas |

## Frontend Expectations

- Always handle `ok: true` and `ok: false`.
- Do not parse private/provider data from public responses.
- Treat local fallback responses as non-production evidence, not durable provider integration.
- Never display raw stack traces, medical notes, payment data, token fragments, secret values, or private file URLs.
- Non-JSON responses must be explicit, such as `text/calendar` for ICS feeds.
