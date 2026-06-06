# Database Schema Plan

## Current status

Phase 2 database/domain modeling is **scaffolded in code**. `packages/db/prisma/schema.prisma` now contains a broad tattoo-SaaS Prisma/Postgres model covering tenancy, artists, studios, clients, portfolio, booking lifecycle, appointments, travel cities, availability, calendar connections/events, deposits/payments/refunds, intake and consent forms, medical safety acknowledgments, file assets, reference images, messages, notifications, reviews, SEO pages, audit logs, error reports, release records, and feature flags.

This is not production-ready because the schema has not been validated by Prisma CLI, migrated against Postgres, or exercised through application queries in this environment.

## Implemented Phase 2 schema inventory

| Domain | Models in Prisma schema | Status |
| --- | --- | --- |
| Tenancy | Tenant, TenantDomain, FeatureFlag | Scaffolded, migration unverified |
| Users/RBAC | User, TenantMember, CustomRole | Scaffolded, auth/session integration pending |
| Artist/studio | Artist, Studio | Scaffolded |
| Client CRM | Client, ClientProfile | Scaffolded; encryption service pending |
| Portfolio | TattooStyle, PortfolioItem, PortfolioImage, FileAsset | Scaffolded; storage integration pending |
| Travel/Nomad Mode | TravelCity, TravelSchedule, AvailabilityWindow | Scaffolded; conflict/timezone tests pending |
| Calendar | CalendarConnection, CalendarEvent | Scaffolded; provider OAuth/sync pending |
| Booking | BookingRequest, BookingStateEvent, Appointment | Scaffolded; API/state machine tests pending |
| Payments | Deposit, Payment, Refund, PaymentAuditLog | Scaffolded; Stripe/webhook integration pending |
| Intake/consent/safety | IntakeForm, IntakeQuestion, IntakeResponse, ConsentForm, ConsentSignature, MedicalSafetyAcknowledgment | Scaffolded; legal review and encryption pending |
| Files/uploads | FileAsset, ReferenceImage | Scaffolded; object storage/signed URL flow pending |
| Messaging/notifications | MessageThread, Message, Notification, NotificationDelivery | Scaffolded; email/SMS/push providers pending |
| Reputation | Review | Scaffolded |
| SEO | SeoCityPage, SeoStylePage, SeoRedirect | Scaffolded; dynamic page routes pending |
| Audit/errors/releases | AuditLog, ErrorReport, ReleaseRecord | Scaffolded; observability wiring pending |

## Enum/state machine inventory

The schema now defines enums for tenant/user/member status, booking events, appointment status, payment/refund status, travel availability, calendar provider state, file visibility, forms, consent signature state, medical review state, messages, notifications, reviews, SEO page status, error severity/status, release channels, and feature flag scope.

## Tenant isolation pattern

Every tenant-owned model added in Phase 2 includes `tenantId`. Application queries must still enforce tenant scope, because schema presence alone does not prevent an unsafe query.

Required query shape:

```ts
await prisma.bookingRequest.findMany({
  where: {
    tenantId: session.tenantId,
  },
});
```

Never trust a client-submitted `tenantId` without validating the authenticated user's tenant membership.

## Sensitive data posture

The schema intentionally stores sensitive fields as encrypted string placeholders, including client birthdate, emergency contact, medical notes, allergies, skin concerns, provider tokens, and consent metadata. The encryption service is not implemented yet and is tracked in `GAP_TRACKER.md` as a production blocker.

Sensitive objects:
- Client PII and phone/email.
- Medical/safety notes and acknowledgments.
- Consent signatures and IP/user-agent metadata.
- Reference images.
- Provider access/refresh tokens.
- Payment provider identifiers.

## Seed data plan and current file

A seed script now exists at `packages/db/prisma/seed.ts`. It creates a fake nomadic artist tenant with:

- Tenant/domain/user/member/custom role.
- Studio and artist profile.
- Tattoo styles.
- Portfolio item and file asset.
- Travel city, travel schedule, and availability window.
- Client/profile.
- Booking request, state event, appointment, deposit, payment, payment audit record.
- Intake form/question/response.
- Consent form/signature and medical acknowledgment.
- Private reference image record.
- Message thread/message.
- Notification/delivery.
- Review/testimonial.
- SEO city/style pages.
- Feature flag and release record.

The seed file is **untested** because dependencies and Prisma Client generation are not available in this sandbox.

## Migration strategy

Required next steps in a local/dev environment:

```bash
corepack enable
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Recommended migration name:

```bash
pnpm --filter @inkroute/db prisma migrate dev --schema prisma/schema.prisma --name phase_2_domain_model
```

## Verification required before closing Phase 2 database gaps

- `prisma validate` passes.
- `prisma migrate dev` generates and applies a migration against Postgres.
- `prisma db seed` or `pnpm db:seed` populates demo data.
- Tenant-scoped query smoke tests pass.
- Sensitive file/reference/consent data is never exposed through public routes.
- Prisma relations and indexes are reviewed after generated SQL is produced.

## Phase 7 payment persistence note

The Prisma schema already includes `Deposit`, `Payment`, `Refund`, and `PaymentAuditLog` models. Phase 7 added payment policy/session/webhook helper code, but it did not add migrations, repositories, or transactional persistence. Production payment work must store `policySnapshot`, provider session/payment/refund IDs, amount/currency/status, paid/failed timestamps, and tenant-scoped audit logs idempotently. Stripe metadata must reference internal IDs only and must not contain medical notes, consent text, private messages, or reference-image URLs.

## Phase 8 calendar persistence note

The Phase 8 calendar package now computes availability slots and conflicts from in-memory data, but the schema-backed service layer remains missing. Production work must persist availability holds, appointment state changes, provider calendar IDs, sync tokens, sync cursors, signed ICS feed tokens, and audit rows transactionally. `CalendarConnection` provider tokens must be encrypted before storage, and conflict checks must run inside the same transaction that reserves a hold or schedules an appointment.

## Phase 11 ErrorReport usage note

The Phase 2 schema already includes `ErrorReport` with tenant linkage, severity, status, source, message, stack hash, release, route, user agent, metadata, created/resolved timestamps, and indexes. Phase 11 does not change the Prisma schema. Future implementation must persist only redacted Phase 11 observability drafts into this table, enforce tenant scoping, and avoid storing raw provider payloads, medical notes, payment data, authorization headers, cookies, or secrets.

## Phase 12 release persistence note

The Phase 2 schema already includes `ReleaseRecord` and `FeatureFlag` models, and Phase 12 adds `@inkroute/releases` helper logic plus dashboard/API previews. No Prisma repository currently writes release candidates, release approvals, feature flag changes, rollout state, CI result links, migration evidence, or rollback records. Implementing this persistence is tracked in `GAP-088` and must include tenant isolation, RBAC, audit logs, optimistic concurrency/versioning, and integration tests.
