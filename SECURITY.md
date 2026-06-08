# Security, Privacy, Compliance, and Trust

## Current status

Security architecture is documented and partially scaffolded through RBAC primitives, Phase 11 redaction helpers, and Phase 13 security/privacy/trust helper contracts. It is not complete or production-ready.

## Threat model priorities

Sensitive data in this product includes:
- Client names, contact info, and messages.
- Tattoo placement and body area details.
- Medical/safety notes and acknowledgments.
- Reference images.
- Consent signatures.
- Payment and refund records.
- Artist private schedule and revenue data.

## Baseline security requirements

### Authentication
- Dashboard and mobile must require authenticated sessions before launch.
- Public site should only expose intended public content.
- Session tokens must be secure, HTTP-only on web, and securely stored on mobile.

### Authorization
- All tenant data access must check tenant membership and role permissions.
- Roles: owner, artist, assistant, studio manager, admin.
- Permission matrix starts in `packages/auth/src/index.ts`.

### Tenant isolation
- Every tenant-owned table must include `tenantId`.
- Queries must filter by tenant.
- Tenant isolation tests block production launch.

### Upload security
- Reference images and consent signatures must be private.
- Portfolio images may have public optimized derivatives.
- Uploads need MIME validation, file size limits, metadata stripping, and malware scanning plan.

### Payment security
- Stripe-hosted checkout is preferred first to reduce PCI scope.
- Never store card data.
- Verify webhook signatures.
- Persist payment audit logs.

### Input validation
- Public forms must use shared Zod schemas.
- Server-side validation is mandatory even if client validates.
- Rate limit public booking/contact endpoints.

### XSS/CSRF
- Use framework defaults where possible.
- Sanitize rich text fields before rendering.
- Use CSRF protection for state-changing cookie-authenticated requests.

### Logging and observability
- Logs must redact PII, medical details, payment identifiers beyond provider references, and private file URLs.
- Crash reports must include tenant/user/session context only when safe.


## Phase 2 schema security note

The Phase 2 Prisma schema includes fields named `birthdateEncrypted`, `emergencyContactEncrypted`, `medicalNotesEncrypted`, `allergiesEncrypted`, `skinConcernsEncrypted`, `encryptedAccessToken`, and `encryptedRefreshToken`. These names are architectural intent only until an encryption service, key management process, and tests are implemented. This is tracked as a production blocker in `GAP_TRACKER.md`.

## Legal review required

The following must be reviewed by a qualified attorney before production:
- Consent forms.
- Medical/safety acknowledgments.
- Deposit, cancellation, no-show, refund language.
- Privacy policy.
- Terms of service.
- SMS consent and opt-out language.

This is tracked as `GAP-013`.

## Backup/recovery plan

Before launch:
- Enable managed Postgres backups.
- Test restore into staging.
- Version object storage.
- Document incident response steps.

## Trust features

- Clear artist policies.
- Secure deposit handling through Stripe.
- Consent acknowledgment audit trail.
- Visible aftercare instructions.
- Accessibility review.
- Privacy-first client messaging.

## Phase 4 booking security note

The Phase 4 booking flow intentionally keeps all client data in browser state and does not persist it. The local reference image selector records metadata for preview only and does not upload bytes. The validation-only booking API route returns `501` for valid input because the following security controls must exist before production submission is enabled:

- Public tenant/domain resolution that cannot be spoofed.
- Rate limiting and bot/spam protection for public booking requests.
- Server-side validation through shared schemas.
- Transactional tenant-scoped writes for booking and audit records.
- Redaction of medical/safety notes from logs and error responses.
- Application-level encryption for sensitive notes once stored.
- Signed private upload flow for reference images.
- Provider failure handling for notifications, Stripe deposits, and calendar holds.

These are tracked in `GAP-031` through `GAP-034`.


## Phase 5 dashboard security note

The Phase 5 dashboard intentionally uses demo-safe static data and a mocked owner context. Production dashboard work must add route protection, tenant membership checks, field-level access controls for client PII/medical/consent/payment/file data, mutation audit logs, provider secret handling, rate limiting where needed, and export/delete/retention workflows. This is tracked in `GAP-036`, `GAP-037`, `GAP-038`, `GAP-040`, and `GAP-041`.

## Phase 6 mobile security note

The Expo app now shows mobile auth, client, offline, upload, notification, and crash/update surfaces with explicit scaffold labels. Production mobile work must add real auth, secure refresh-token storage, biometric unlock where feasible, tenant membership checks, field-level access, encrypted offline storage, secure upload policies, push opt-out controls, and crash-log redaction before handling real client data.

## Phase 7 payment security notes

Current status: **scaffolded and credential-gated**.

Payment data handling rules:
- Keep card entry inside Stripe-hosted Checkout or another Stripe-maintained UI to reduce PCI scope.
- Do not store card numbers, CVC, bank data, or raw payment method payloads.
- Persist only provider IDs, amount, currency, status, receipt URL, redacted metadata, and audit events.
- Deposit session creation must require either authenticated dashboard permission or a signed, short-lived deposit token generated after artist acceptance.
- Webhook reconciliation must verify Stripe signatures using the raw request body before parsing or trusting event data.
- Every payment status mutation must write a tenant-scoped `PaymentAuditLog` record.
- Refund, dispute, and no-show forfeiture actions must require role permission and explicit audit metadata.
- Customer-facing deposit, cancellation, no-show, refund, tax, consent, and SMS language requires attorney review before production use.

Open production blockers are tracked in `GAP-004`, `GAP-049`, `GAP-050`, `GAP-051`, `GAP-052`, and `GAP-053`.

## Phase 8 calendar/travel security note

Calendar integration introduces private appointment, client, provider-token, and location data risks. Production work must encrypt Google refresh tokens, redact client PII in provider descriptions unless explicitly allowed, sign and revoke private ICS feeds, filter public travel feeds to public-only fields, validate tenant membership on every dashboard/mobile mutation, and audit every appointment/travel/sync change. Open blockers are tracked in `GAP-009` and `GAP-055` through `GAP-060`.


## Phase 9 notification and messaging security note

Phase 9 notification and messaging code is demo-safe and dependency-light. Production delivery must add verified provider webhooks, suppression/preference enforcement, rate limiting, spam controls, tenant-scoped message authorization, delivery-log redaction, and safe retention/deletion policies. SMS requires explicit consent capture, STOP/HELP handling, quiet-hour decisions, and attorney-reviewed language before use. Aftercare and medical-adjacent messages must not diagnose or replace medical advice, and must be reviewed before automation.

Provider callbacks should never be trusted until signatures are verified. Delivery logs must store masked or hashed destinations, provider IDs, statuses, and audit metadata only. Do not log full message bodies when they may include medical notes, tattoo placement details, private reference URLs, payment links, or consent information.


## Phase 10 SEO security note

SEO publishing must be tenant-scoped and RBAC-protected. Draft/noindex/private client or studio content must never leak into public routes, JSON-LD, sitemaps, preview APIs, or Search Console submissions. Production must validate canonical host ownership per tenant, audit every publish/archive/redirect action, and prevent cross-tenant canonical or redirect injection.

## Phase 11 observability security notes

Phase 11 adds redaction helpers and error-report boundaries, but it does not make observability production-safe. Before enabling live capture:

- Verify SDK/event-processor redaction against synthetic emails, phone numbers, medical notes, consent payloads, payment fields, cookies, authorization headers, provider signatures, and tokens.
- Store only redacted metadata in `ErrorReport.metadata`; never store raw provider payloads.
- Rate-limit and bot-protect public fallback error-report endpoints.
- Require dashboard auth, tenant membership, and `error:read` / `error:write` permissions for private observability endpoints.
- Verify Sentry webhook signatures before trusting issue state.
- Keep `SENTRY_AUTH_TOKEN`, webhook secrets, OTLP headers, alert webhooks, and GitHub tokens in server/CI secrets only.
- Do not create GitHub issues automatically without a privacy-safe review step.

## Phase 12 release security notes

Release and feature flag control planes are high-risk because they can enable payments, notifications, public publishing, and mobile updates.

Production requirements before enabling mutations:

- owner/admin RBAC for release creation, approval, rollback, and feature flag changes
- tenant isolation for tenant-scoped flags and release visibility
- server-side kill switches for SMS, email, Stripe, EAS Update, AI assistants, and other provider actions
- audit logs for every release and flag mutation
- protected GitHub production environment approvals
- least-privilege deployment secrets
- no public exposure of internal deployment URLs, incident context, rollout percentages, or provider status details
- signed/verified CI write-back to release records
- rollback plans and incident communications that do not expose PII, medical notes, payment data, or reference images

The Phase 12 scaffold does not implement these controls. They are tracked in `GAP-087` through `GAP-094`.


## Phase 13 security/privacy/trust notes

Current status: **scaffolded only**. Phase 13 adds `@inkroute/security`, dashboard/public/mobile trust previews, legal placeholders, upload validation drafts, rate-limit and CSRF plans, security header drafts, privacy request drafts, and tenant isolation fixtures. These are implementation contracts, not active security controls.

Production requirements before handling real client data:

- Implement real dashboard/mobile authentication, session revocation, secure cookies, mobile token storage, and tenant membership checks.
- Enforce RBAC and tenant filters in every loader, mutation, API route, provider worker, and background job.
- Add field-level access for medical notes, consent signatures, reference images, private messages, payments, provider tokens, and audit logs.
- Implement application-level encryption and key rotation for medical/safety fields, provider OAuth tokens, emergency contact data, consent signatures, and other private assets.
- Wire signed S3/Supabase uploads, server-generated object keys, MIME and file-signature validation, EXIF/GPS stripping, malware scanning/quarantine, private ACLs, and public derivative approval.
- Add distributed rate limiting, bot/spam controls, CSRF/session protection, and security headers in the web/dashboard runtime.
- Implement privacy request persistence, identity verification, export/delete/rectification workers, retention/legal holds, and audit logs.
- Complete attorney review for privacy policy, terms, consent, medical acknowledgments, SMS opt-in/STOP/HELP, aftercare, deposit, cancellation, no-show, refund, tax, and SaaS terms language.
- Add automated tenant-isolation, authorization, upload, privacy, redaction, header, and abuse-control tests.

Open production blockers are tracked in `GAP-095` through `GAP-104`, in addition to earlier auth, storage, legal, payment, notification, observability, release, and deployment gaps.

## Phase 15 launch security gates

Phase 15 adds deployment and launch runbooks, but no production security control is live. Before launch, security evidence must include:

- strict environment checks against real secrets without log exposure;
- auth/session/RBAC enforcement for dashboard and admin APIs;
- tenant isolation tests with cross-tenant fixtures;
- signed upload/private storage proof;
- CSRF/security header/runtime rate-limit proof;
- Sentry/redaction/alert proof;
- legal review of all public policy, consent, medical, SMS, and payment language;
- incident/privacy/support runbook drills.

These remain tracked in the gap tracker, especially `GAP-095` through `GAP-104` and `GAP-113` through `GAP-120`.

Launch operations evidence is tracked in `deployment/manifests/launch-operations-evidence.json` and verified with `pnpm deploy:verify-ops`. This must remain blocked until incident, privacy, support, monitoring, on-call, communication, and rollback drills have redacted proof.
