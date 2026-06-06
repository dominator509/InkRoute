# Phase 9 — Notifications and Messaging

## Status

**Partially implemented / scaffolded / untested in app runtime.**

Phase 9 expanded the notification and messaging architecture into dependency-light shared helpers, static dashboard/mobile previews, and route/webhook boundaries. It does not send email, SMS, or push notifications; it does not persist message threads or delivery logs; and it does not verify provider webhook signatures.

## Source review performed before coding

Before implementation, all markdown source files in the Phase 8 artifact were enumerated and reviewed for roadmap, architecture, gap, and handoff context. Phase 9 was selected because `ROADMAP.md`, `ARCHITECTURE.md`, `GAP_TRACKER.md`, and the Phase 8 closeout identified notifications and messaging as the next best codeable phase.

## Implemented in this phase

### `@inkroute/notifications`

Expanded `packages/notifications/src/index.ts` with:

- Full tattoo-business notification template catalog.
- Booking, needs-info, accepted, declined, deposit, payment receipt/failure, appointment confirmed, prep, reschedule, cancellation, aftercare, healed-photo, waitlist, flash-drop, and review templates.
- Rendered template objects for email, SMS, push, and in-app channels.
- Backward-safe `renderTemplateText` helper for plain body previews.
- Client consent snapshot model.
- Consent-aware channel evaluation.
- Delivery plan generation by template and client consent.
- Provider boundary matrix for Resend, Twilio, Expo Push, and in-app delivery.
- Delivery-log draft generation with masked/hashed destinations.
- Booking, appointment, aftercare, travel, and review automation sequence builders.
- Disabled provider-send draft previews.
- Email, SMS, and push webhook interpretation helpers.
- Message thread draft helper with PII redaction notes.

### Validators

Expanded `packages/validators/src/messaging.ts` with schemas for:

- Notification template keys.
- Notification consent inputs.
- Notification preview inputs.
- Provider webhook preview inputs.
- Existing message thread, message, notification, and notification delivery inputs.

These validators remain unverified until `zod` is installed in a real runtime.

### Web app API boundaries

Added static/demo public and webhook routes:

- `GET /api/public/[tenantSlug]/notification-previews`
  - Returns static rendered notification templates and consent-aware delivery plans.
  - Does not queue or send notifications.
- `POST /api/public/[tenantSlug]/messages`
  - Validates minimal subject/body shape.
  - Builds a message-thread draft.
  - Intentionally returns `501 MESSAGE_PERSISTENCE_NOT_IMPLEMENTED`.
- `POST /api/webhooks/email`
  - Requires an email provider signature-like header.
  - Inspects event type and intentionally returns `501 EMAIL_WEBHOOK_NOT_IMPLEMENTED`.
- `POST /api/webhooks/sms`
  - Requires `x-twilio-signature`.
  - Handles JSON or form-encoded callback shapes.
  - Detects inbound STOP preview and intentionally returns `501 SMS_WEBHOOK_NOT_IMPLEMENTED`.

### Dashboard

Expanded notification/messaging surfaces:

- `/templates` now shows templates, consent routing, automation sequences, provider send drafts, and provider boundary matrix.
- Added `/messages` for message thread drafts, redacted delivery-log drafts, and webhook interpretation previews.
- Added message center navigation.
- Expanded `apps/dashboard/lib/demo.ts` with Phase 9 demo consent, delivery plans, automation sequence, provider boundary matrix, send drafts, delivery log drafts, webhook previews, and message thread drafts.

### Mobile

Expanded the Expo notification screen:

- Shows template previews.
- Shows consent delivery plans.
- Shows first automation sequence steps.
- Keeps Expo push, email, SMS, provider delivery logs, token registration, and opt-out controls marked provider-gated.

### Docs and gap tracker

Updated roadmap, README, architecture, API contracts, environment variables, security notes, testing plan, gap tracker, and all root handoff files.

## Scaffolded only

- Resend email provider send worker.
- Email domain verification and webhooks.
- Twilio SMS send worker, STOP/HELP handling, quiet hours, and messaging-service setup.
- Expo push token registration, receipts, deep links, and tap routing.
- Tenant-scoped message thread persistence.
- Notification and delivery log persistence.
- Queue worker/retry/dead-letter handling.
- Preference center and unsubscribe pages.
- Legal review of SMS consent, STOP language, aftercare text, and marketing copy.
- Provider route runtime tests, Playwright flows, and device push QA.

## Verification run here

Passed:

```bash
npx tsc --noEmit -p packages/types/tsconfig.json
npx tsc --noEmit -p packages/config/tsconfig.json
npx tsc --noEmit -p packages/booking/tsconfig.json
npx tsc --noEmit -p packages/payments/tsconfig.json
npx tsc --noEmit -p packages/calendar/tsconfig.json
npx tsc --noEmit -p packages/notifications/tsconfig.json
npx tsc --noEmit -p packages/mobile/tsconfig.json
```

Also verified:

- All JSON files parse.
- No unresolved task-marker comments were introduced.
- Phase 9 ZIP artifact was rebuilt successfully.

## Blocked or unverified in this environment

The following remain blocked because dependencies, app runtime, live credentials, provider accounts, and Postgres are unavailable here:

- `pnpm install`.
- Next.js web/dashboard builds.
- Expo runtime/device testing.
- Email sandbox tests.
- SMS sandbox tests.
- Expo push token/device tests.
- Provider webhook signature verification.
- Queue worker execution.
- Message/notification/delivery-log persistence.
- Tenant/RBAC enforcement for private messaging APIs.
- Preference center and unsubscribe testing.
- Legal review of SMS/aftercare/marketing language.

## Gaps added or updated

Updated:

- `GAP-010` — notification package, template dashboard, message center, mobile previews, and route/webhook boundaries now exist, but providers/persistence are still missing.
- `GAP-044` — mobile notification screen now shows Phase 9 consent plans and automation previews, but push implementation is still missing.

Added:

- `GAP-061` — email provider implementation missing.
- `GAP-062` — SMS provider and compliance implementation missing.
- `GAP-063` — Expo push implementation missing.
- `GAP-064` — message/notification persistence missing.
- `GAP-065` — notification queue and scheduler missing.
- `GAP-066` — provider webhook verification/reconciliation missing.
- `GAP-067` — preference center and unsubscribe/STOP controls missing.
- `GAP-068` — messaging privacy/redaction/retention controls missing.
- `GAP-069` — notification/messaging automated tests missing.
- `GAP-070` — Phase 9 app build/runtime verification missing.

## Next best task

The next codeable task inside this environment is **Phase 10 — SEO Engine scaffold**: database-backed SEO route contracts, city/style page manager helpers, sitemap/canonical metadata utilities, internal-link plans, schema orchestration, SEO analytics events, and dashboard/public SEO previews. Live CMS/database reads and search-console analytics will remain externally dependent.
