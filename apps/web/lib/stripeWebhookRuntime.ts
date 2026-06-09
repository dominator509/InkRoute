import { buildStripeWebhookRuntimeReadinessPlan } from "@inkroute/payments";

export type StripeWebhookRuntimeStatus =
  | "wired"
  | "sdk-gated"
  | "replay-gated"
  | "reconciliation-gated"
  | "audit-gated"
  | "transaction-gated"
  | "cli-gated"
  | "ci-gated";

export interface StripeWebhookRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: StripeWebhookRuntimeStatus;
}

export const stripeWebhookRuntimeCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm test:unit -- apps/web/tests/payment-routes.test.ts",
  "stripe listen --forward-to localhost:3000/api/webhooks/stripe",
  "stripe trigger checkout.session.completed",
  "stripe trigger payment_intent.payment_failed",
  "stripe trigger charge.refunded",
] as const;

export const stripeWebhookArtifactPaths = [
  "coverage/stripe-webhook-runtime.json",
  "coverage/stripe-webhook-payments-typecheck.txt",
  "coverage/stripe-webhook-payments-test.txt",
  "coverage/stripe-webhook-web-typecheck.txt",
  "coverage/stripe-webhook-route-tests.json",
  "coverage/stripe-webhook-construct-event-raw-body-redacted.json",
  "coverage/stripe-webhook-secret-redacted.json",
  "coverage/stripe-webhook-invalid-stale-signatures.json",
  "coverage/stripe-webhook-replay-protection.json",
  "coverage/stripe-webhook-supported-events.json",
  "coverage/stripe-webhook-provider-object-fetch.json",
  "coverage/stripe-webhook-tenant-resolution.json",
  "coverage/stripe-webhook-payment-persistence.json",
  "coverage/stripe-webhook-audit-log.json",
  "coverage/stripe-webhook-booking-state-event.json",
  "coverage/stripe-webhook-tenant-transaction.json",
  "coverage/stripe-webhook-amount-currency-mismatch.json",
  "coverage/stripe-webhook-cli-replay-redacted.json",
  "coverage/stripe-webhook-secret-safe-artifacts.json",
  "test-results/stripe-webhook-runtime",
] as const;

export const stripeWebhookRuntimeMatrix = [
  {
    id: "payments-typecheck",
    command: "pnpm --filter @inkroute/payments typecheck",
    artifact: "coverage/stripe-webhook-payments-typecheck.txt",
    status: "wired",
  },
  {
    id: "payments-tests",
    command: "pnpm --filter @inkroute/payments test",
    artifact: "coverage/stripe-webhook-payments-test.txt",
    status: "wired",
  },
  {
    id: "web-typecheck",
    command: "pnpm --filter @inkroute/web typecheck",
    artifact: "coverage/stripe-webhook-web-typecheck.txt",
    status: "ci-gated",
  },
  {
    id: "webhook-route-tests",
    command: "pnpm test:unit -- apps/web/tests/payment-routes.test.ts",
    artifact: "coverage/stripe-webhook-route-tests.json",
    status: "ci-gated",
  },
  {
    id: "construct-event-raw-body",
    command: "use Stripe SDK constructEvent with raw request body and STRIPE_WEBHOOK_SECRET",
    artifact: "coverage/stripe-webhook-construct-event-raw-body-redacted.json",
    status: "sdk-gated",
  },
  {
    id: "invalid-stale-signatures",
    command: "reject invalid and stale Stripe signatures before trusted parsing",
    artifact: "coverage/stripe-webhook-invalid-stale-signatures.json",
    status: "wired",
  },
  {
    id: "replay-protection",
    command: "persist Stripe provider event ids for replay protection",
    artifact: "coverage/stripe-webhook-replay-protection.json",
    status: "replay-gated",
  },
  {
    id: "supported-events",
    command: "cover checkout completed/expired, payment succeeded/failed, refund, and dispute events",
    artifact: "coverage/stripe-webhook-supported-events.json",
    status: "wired",
  },
  {
    id: "provider-object-fetch",
    command: "fetch or verify Stripe provider objects before reconciliation",
    artifact: "coverage/stripe-webhook-provider-object-fetch.json",
    status: "sdk-gated",
  },
  {
    id: "trusted-tenant-resolution",
    command: "resolve tenant from trusted provider metadata or persisted provider ids",
    artifact: "coverage/stripe-webhook-tenant-resolution.json",
    status: "wired",
  },
  {
    id: "payment-persistence",
    command: "reconcile Deposit, Payment, and Refund records",
    artifact: "coverage/stripe-webhook-payment-persistence.json",
    status: "reconciliation-gated",
  },
  {
    id: "payment-audit-log",
    command: "persist PaymentAuditLog for accepted and rejected Stripe events",
    artifact: "coverage/stripe-webhook-audit-log.json",
    status: "audit-gated",
  },
  {
    id: "booking-state-event",
    command: "persist BookingStateEvent for payment lifecycle changes",
    artifact: "coverage/stripe-webhook-booking-state-event.json",
    status: "reconciliation-gated",
  },
  {
    id: "tenant-transaction",
    command: "run webhook reconciliation writes in one tenant-scoped transaction",
    artifact: "coverage/stripe-webhook-tenant-transaction.json",
    status: "transaction-gated",
  },
  {
    id: "amount-currency-mismatch",
    command: "reject amount and currency mismatches before reconciliation",
    artifact: "coverage/stripe-webhook-amount-currency-mismatch.json",
    status: "reconciliation-gated",
  },
  {
    id: "stripe-cli-replay",
    command: "Stripe CLI replay for supported events, invalid signature, and replay denial",
    artifact: "coverage/stripe-webhook-cli-replay-redacted.json",
    status: "cli-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions Stripe webhook evidence job",
    artifact: "coverage/stripe-webhook-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly StripeWebhookRuntimeMatrixEntry[];

export const stripeWebhookRuntimeReadiness = buildStripeWebhookRuntimeReadinessPlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  paymentsTestsPassed: false,
  paymentsTypecheckPassed: false,
  webWebhookRouteTestsPassed: false,
  webTypecheckPassed: false,
  stripeSdkInstalled: false,
  constructEventUsesRawBody: false,
  webhookSecretConfigured: false,
  invalidSignatureRejected: true,
  timestampToleranceEnforced: true,
  replayProtectionPersisted: false,
  supportedEventsCovered: [
    "checkout.session.completed",
    "checkout.session.expired",
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "charge.refunded",
    "charge.dispute.created",
  ],
  providerObjectFetchConfigured: false,
  tenantResolutionFromTrustedMetadata: true,
  depositPaymentRefundPersistenceConfigured: false,
  paymentAuditLogPersistenceConfigured: false,
  bookingStateEventPersistenceConfigured: false,
  tenantScopedTransactionConfigured: false,
  amountCurrencyMismatchRejected: false,
  unknownEventsLoggedAndIgnored: true,
  stripeCliReplayVerified: false,
});
