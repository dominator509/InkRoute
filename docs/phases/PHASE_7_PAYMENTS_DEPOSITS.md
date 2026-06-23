# Phase 7 — Payments, Deposits, and No-Show Protection

## Status

Partially implemented as a dependency-light policy engine, Stripe Checkout/webhook route boundaries, static dashboard payment controls, and a public deposit-preview page. No live money movement, Stripe SDK call, webhook signature verification, database persistence, refund execution, receipt delivery, tax export, or legal-reviewed policy language exists.

## Source review performed before coding

All markdown files in the extracted Phase 6 ZIP were enumerated and reviewed before implementation:

- 32 markdown files were present before this Phase 7 closeout file was added.
- Key reviewed files included `README.md`, `PRODUCT_REQUIREMENTS.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `API_CONTRACTS.md`, `DATABASE_SCHEMA.md`, `ENVIRONMENT_VARIABLES.md`, `SECURITY.md`, `TESTING_PLAN.md`, `GAP_TRACKER.md`, all three root handoff files, and all prior phase closeout files under `docs/phases`.
- The reviewed roadmap and Phase 6 closeout identified Phase 7 payments/deposits/no-show protection as the next best codeable task in this ChatGPT environment.

## Implemented in this phase

- Expanded `@inkroute/payments` from a minimal deposit helper into a dependency-light payment policy package with:
  - deposit policy rules and policy versioning
  - risk scoring
  - city demand, travel/guest-spot, large-scale, flash, late-cancellation, and no-show premiums
  - Stripe Checkout session draft builder
  - refund eligibility evaluator
  - no-show/deposit-forfeiture evaluator
  - Stripe webhook event interpretation helper
  - receipt number/export row helpers
  - credential-gated `createDepositSession` boundary
- Added validation schemas under `packages/validators/src/payments.ts` for:
  - deposit policy preview
  - refund policy preview
  - no-show policy preview
  - Stripe webhook event preview
- Added public web route boundary:
  - `POST /api/public/[tenantSlug]/deposit-sessions`
  - validates minimal JSON shape manually
  - calculates policy and returns a Checkout session draft
  - persists a tenant-scoped draft deposit/payment/idempotency/audit contract where the DB path is available and fails closed for production local fallback
- Added Stripe webhook route boundary:
  - `POST /api/webhooks/stripe`
  - reads raw request text and detects `Stripe-Signature` header
  - interprets event type for planning
  - requires `STRIPE_WEBHOOK_SECRET` before production processing, records replay/audit rows when durable tenant/payment context is available, and keeps Stripe CLI/provider proof gated
- Added public static page:
  - `/booking/deposit-preview`
  - shows deposit policy, refund, no-show, and Checkout handoff data without collecting payment
- Upgraded dashboard payment view with:
  - deposit exposure metrics
  - risk scores
  - decision labels
  - refund/no-show preview decisions
  - receipt numbers
  - Checkout client reference and idempotency keys
  - webhook interpretation preview
  - explicit production payment boundary card
- Updated `apps/web/package.json` to include `@inkroute/payments`.
- Updated docs, roadmap, gap tracker, testing plan, security notes, API contracts, and handoff files.

## Implemented

- Dependency-light payment policy code that can be typechecked without Stripe SDK.
- Safe session-draft generation that avoids live Stripe calls.
- Public and webhook API boundary files that now enforce guarded local DB/idempotency/audit contracts while still failing closed until live Stripe/provider proof exists.
- Dashboard and public UI surfaces that expose payment/no-show/refund concepts without pretending to process payments.

## Scaffolded only

- Stripe Checkout Session creation.
- Stripe Payment Intents alternative path.
- Stripe SDK installation and API version pinning.
- Webhook signature verification with `constructEvent`.
- Database persistence for Deposit/Payment/Refund/PaymentAuditLog lifecycle changes.
- Idempotency storage and replay protection.
- Refund execution.
- Dispute handling.
- Receipt generation/delivery.
- Tax/reporting export.
- No-show forfeiture enforcement.
- Signed deposit token strategy.
- Customer-facing legal language.

## Verification run here

Passed:

```bash
tsc --noEmit -p packages/payments/tsconfig.json
tsc --noEmit -p packages/types/tsconfig.json
tsc --noEmit -p packages/config/tsconfig.json
```

Also verified:

- All JSON files parse.
- No unresolved task-marker comments were introduced.
- Repo ZIP rebuilt successfully.

## Blocked or unverified in this environment

- `pnpm install` and lockfile generation.
- Stripe SDK installation.
- Stripe test-mode account configuration.
- Stripe CLI webhook forwarding.
- Web/dashboard Next.js typecheck/build/runtime.
- API route execution.
- Prisma persistence and migration validation.
- Payment webhook reconciliation.
- Refund/no-show/tax/legal policy review.
- End-to-end booking → accepted → deposit requested → paid → scheduled test.

## Files changed

- `packages/payments/src/index.ts`
- `packages/validators/src/payments.ts`
- `apps/web/package.json`
- `apps/web/app/api/public/[tenantSlug]/deposit-sessions/route.ts`
- `apps/web/app/api/webhooks/stripe/route.ts`
- `apps/web/app/booking/deposit-preview/page.tsx`
- `apps/web/app/sitemap.ts`
- `apps/web/app/globals.css`
- `apps/dashboard/lib/demo.ts`
- `apps/dashboard/app/payments/page.tsx`
- `README.md`
- `ROADMAP.md`
- `API_CONTRACTS.md`
- `ENVIRONMENT_VARIABLES.md`
- `SECURITY.md`
- `TESTING_PLAN.md`
- `DEPLOYMENT.md`
- `GAP_TRACKER.md`
- `HANDOFF_TO_CODEX.md`
- `HANDOFF_TO_JULES.md`
- `HANDOFF_TO_CLAUDE_CODE.md`
- `FILE_TREE.md`

## Next phase

Phase 8 should expand calendar/location/travel scheduling: internal availability rules, buffer/conflict helpers, Google Calendar/ICS boundaries, timezone handling, dashboard travel-to-calendar controls, and public real-time update architecture. Codex/Jules should first verify Phase 7 with dependency installation, Next builds, and Stripe test-mode route execution.
