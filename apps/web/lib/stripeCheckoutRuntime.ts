import { buildStripeCheckoutRouteRuntimeReadinessPlan } from "@inkroute/payments";

export type StripeCheckoutRuntimeStatus =
  | "wired"
  | "sdk-gated"
  | "auth-gated"
  | "persistence-gated"
  | "audit-gated"
  | "webhook-gated"
  | "provider-gated"
  | "ci-gated";

export interface StripeCheckoutRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: StripeCheckoutRuntimeStatus;
}

export const stripeCheckoutRuntimeCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm test:unit -- apps/web/tests/payment-routes.test.ts",
  "stripe checkout session create test-mode smoke",
  "stripe trigger checkout.session.completed",
] as const;

export const stripeCheckoutArtifactPaths = [
  "coverage/stripe-checkout-runtime.json",
  "coverage/stripe-checkout-payments-typecheck.txt",
  "coverage/stripe-checkout-payments-test.txt",
  "coverage/stripe-checkout-web-typecheck.txt",
  "coverage/stripe-checkout-route-tests.json",
  "coverage/stripe-checkout-sdk-config-redacted.json",
  "coverage/stripe-checkout-secret-store-redacted.json",
  "coverage/stripe-checkout-api-version.json",
  "coverage/stripe-checkout-signed-token-auth.json",
  "coverage/stripe-checkout-idempotency-before-provider.json",
  "coverage/stripe-checkout-provider-session-persistence.json",
  "coverage/stripe-checkout-payment-audit-log.json",
  "coverage/stripe-checkout-tenant-transaction.json",
  "coverage/stripe-checkout-redirect-allowlist.json",
  "coverage/stripe-checkout-safe-browser-response.json",
  "coverage/stripe-checkout-invalid-expired-token.json",
  "coverage/stripe-checkout-webhook-reconciliation.json",
  "coverage/stripe-checkout-test-mode-provider-redacted.json",
  "coverage/stripe-checkout-secret-safe-artifacts.json",
  "test-results/stripe-checkout-runtime",
] as const;

export const stripeCheckoutRuntimeMatrix = [
  {
    id: "payments-typecheck",
    command: "pnpm --filter @inkroute/payments typecheck",
    artifact: "coverage/stripe-checkout-payments-typecheck.txt",
    status: "wired",
  },
  {
    id: "payments-tests",
    command: "pnpm --filter @inkroute/payments test",
    artifact: "coverage/stripe-checkout-payments-test.txt",
    status: "wired",
  },
  {
    id: "web-typecheck",
    command: "pnpm --filter @inkroute/web typecheck",
    artifact: "coverage/stripe-checkout-web-typecheck.txt",
    status: "ci-gated",
  },
  {
    id: "payment-route-tests",
    command: "pnpm test:unit -- apps/web/tests/payment-routes.test.ts",
    artifact: "coverage/stripe-checkout-route-tests.json",
    status: "ci-gated",
  },
  {
    id: "stripe-sdk-config",
    command: "install Stripe SDK server-side and pin API version",
    artifact: "coverage/stripe-checkout-sdk-config-redacted.json",
    status: "sdk-gated",
  },
  {
    id: "secret-store-config",
    command: "configure STRIPE_SECRET_KEY in secret store",
    artifact: "coverage/stripe-checkout-secret-store-redacted.json",
    status: "sdk-gated",
  },
  {
    id: "signed-token-auth",
    command: "enforce accepted booking or short-lived signed deposit token",
    artifact: "coverage/stripe-checkout-signed-token-auth.json",
    status: "auth-gated",
  },
  {
    id: "idempotency-before-provider",
    command: "persist idempotency key before calling Stripe Checkout",
    artifact: "coverage/stripe-checkout-idempotency-before-provider.json",
    status: "persistence-gated",
  },
  {
    id: "provider-session-persistence",
    command: "persist Stripe Checkout session id and redirect URL after provider creation",
    artifact: "coverage/stripe-checkout-provider-session-persistence.json",
    status: "persistence-gated",
  },
  {
    id: "payment-audit-log",
    command: "persist PaymentAuditLog for Checkout attempts and outcomes",
    artifact: "coverage/stripe-checkout-payment-audit-log.json",
    status: "audit-gated",
  },
  {
    id: "tenant-transaction",
    command: "wrap Deposit, Payment, PaymentAuditLog, and IdempotencyKey writes in one tenant-scoped transaction",
    artifact: "coverage/stripe-checkout-tenant-transaction.json",
    status: "persistence-gated",
  },
  {
    id: "redirect-allowlist",
    command: "enforce success/cancel redirect host allowlist at route boundary",
    artifact: "coverage/stripe-checkout-redirect-allowlist.json",
    status: "wired",
  },
  {
    id: "safe-browser-response",
    command: "return only Stripe-hosted redirect URL and redacted local ids to browser",
    artifact: "coverage/stripe-checkout-safe-browser-response.json",
    status: "wired",
  },
  {
    id: "invalid-expired-token-tests",
    command: "test invalid and expired signed deposit token rejection",
    artifact: "coverage/stripe-checkout-invalid-expired-token.json",
    status: "auth-gated",
  },
  {
    id: "webhook-reconciliation",
    command: "stripe trigger checkout.session.completed",
    artifact: "coverage/stripe-checkout-webhook-reconciliation.json",
    status: "webhook-gated",
  },
  {
    id: "test-mode-provider-smoke",
    command: "stripe checkout session create test-mode smoke",
    artifact: "coverage/stripe-checkout-test-mode-provider-redacted.json",
    status: "provider-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions Stripe Checkout evidence job",
    artifact: "coverage/stripe-checkout-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly StripeCheckoutRuntimeMatrixEntry[];

export const stripeCheckoutRuntimeReadiness = buildStripeCheckoutRouteRuntimeReadinessPlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  paymentsTestsPassed: false,
  paymentsTypecheckPassed: false,
  webPaymentRouteTestsPassed: false,
  webTypecheckPassed: false,
  stripeSdkInstalled: false,
  stripeSecretConfigured: false,
  stripeApiVersionPinned: false,
  checkoutRouteUsesStripeClient: false,
  acceptedBookingOrSignedTokenEnforced: true,
  idempotencyKeyPersistedBeforeProviderCall: false,
  providerSessionPersisted: false,
  paymentAuditLogPersisted: false,
  tenantScopedTransactionConfigured: false,
  allowedRedirectHostsEnforced: true,
  safeBrowserResponseVerified: true,
  invalidTokenRejectedTested: false,
  expiredTokenRejectedTested: false,
  webhookReconciliationVerified: false,
  stripeTestModeCheckoutVerified: false,
});
