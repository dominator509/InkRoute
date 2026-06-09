import { buildPaymentAutomatedTestReadinessPlan } from "@inkroute/payments";

export type PaymentAutomationRuntimeStatus =
  | "wired"
  | "route-gated"
  | "stripe-gated"
  | "db-gated"
  | "e2e-gated"
  | "operations-gated"
  | "isolation-gated"
  | "artifact-gated"
  | "ci-gated";

export interface PaymentAutomationRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: PaymentAutomationRuntimeStatus;
}

export const paymentAutomationRuntimeCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "pnpm vitest run apps/web/tests/payment-routes.test.ts",
  "payment DB reconciliation integration tests",
  "Stripe CLI payment lifecycle tests",
  "Playwright booking-to-paid payment E2E flow",
] as const;

export const paymentAutomationArtifactPaths = [
  "coverage/payment-automation-runtime.json",
  "coverage/payment-automation-payments-typecheck.txt",
  "coverage/payment-automation-payments-test.txt",
  "coverage/payment-automation-route-boundary.json",
  "coverage/payment-automation-stripe-signature.json",
  "coverage/payment-automation-stripe-cli-lifecycle-redacted.log",
  "coverage/payment-automation-db-reconciliation.json",
  "coverage/payment-automation-booking-to-paid-e2e-redacted.json",
  "coverage/payment-automation-refund-no-show-dispute.json",
  "coverage/payment-automation-receipt-export.json",
  "coverage/payment-automation-cross-tenant.json",
  "coverage/payment-automation-replay-idempotency.json",
  "coverage/payment-automation-ci-job.json",
  "coverage/payment-automation-artifact-retention.json",
  "coverage/payment-automation-secret-safe-artifacts.json",
  "test-results/payment-automation-runtime",
] as const;

export const paymentAutomationRuntimeMatrix = [
  {
    id: "payments-typecheck",
    command: "pnpm --filter @inkroute/payments typecheck",
    artifact: "coverage/payment-automation-payments-typecheck.txt",
    status: "wired",
  },
  {
    id: "payments-unit-tests",
    command: "pnpm --filter @inkroute/payments test",
    artifact: "coverage/payment-automation-payments-test.txt",
    status: "wired",
  },
  {
    id: "payment-route-boundary",
    command: "pnpm vitest run apps/web/tests/payment-routes.test.ts",
    artifact: "coverage/payment-automation-route-boundary.json",
    status: "route-gated",
  },
  {
    id: "stripe-signature-tests",
    command: "pnpm vitest run apps/web/tests/stripe-webhook-static.test.ts",
    artifact: "coverage/payment-automation-stripe-signature.json",
    status: "stripe-gated",
  },
  {
    id: "stripe-cli-lifecycle",
    command: "Stripe CLI payment lifecycle tests",
    artifact: "coverage/payment-automation-stripe-cli-lifecycle-redacted.log",
    status: "stripe-gated",
  },
  {
    id: "db-reconciliation",
    command: "payment DB reconciliation integration tests",
    artifact: "coverage/payment-automation-db-reconciliation.json",
    status: "db-gated",
  },
  {
    id: "booking-to-paid-e2e",
    command: "Playwright booking-to-paid payment E2E flow",
    artifact: "coverage/payment-automation-booking-to-paid-e2e-redacted.json",
    status: "e2e-gated",
  },
  {
    id: "refund-no-show-dispute",
    command: "dashboard refund/no-show/dispute workflow tests",
    artifact: "coverage/payment-automation-refund-no-show-dispute.json",
    status: "operations-gated",
  },
  {
    id: "receipt-export",
    command: "receipt generation/delivery and accounting export tests",
    artifact: "coverage/payment-automation-receipt-export.json",
    status: "operations-gated",
  },
  {
    id: "cross-tenant-payment",
    command: "cross-tenant payment access and mutation denial tests",
    artifact: "coverage/payment-automation-cross-tenant.json",
    status: "isolation-gated",
  },
  {
    id: "replay-idempotency",
    command: "replay/idempotency tests for provider events and operation retries",
    artifact: "coverage/payment-automation-replay-idempotency.json",
    status: "isolation-gated",
  },
  {
    id: "ci-payment-job",
    command: "GitHub Actions payment lifecycle test job",
    artifact: "coverage/payment-automation-ci-job.json",
    status: "ci-gated",
  },
  {
    id: "artifact-retention",
    command: "retain Stripe CLI logs, DB reconciliation output, and E2E screenshots/traces",
    artifact: "coverage/payment-automation-artifact-retention.json",
    status: "artifact-gated",
  },
  {
    id: "secret-safe-artifacts",
    command: "review payment automation artifacts for Stripe secrets and client-private data",
    artifact: "coverage/payment-automation-secret-safe-artifacts.json",
    status: "artifact-gated",
  },
] as const satisfies readonly PaymentAutomationRuntimeMatrixEntry[];

export const paymentAutomationRuntimeReadiness = buildPaymentAutomatedTestReadinessPlan({
  packageScripts: {
    test: "vitest run",
    typecheck: "tsc --noEmit",
  },
  paymentsUnitTestsPassed: false,
  paymentRouteTestsPassed: false,
  stripeSdkSignatureTestsPassed: false,
  stripeCliLifecycleTestsPassed: false,
  dbReconciliationTestsPassed: false,
  bookingToPaidE2ePassed: false,
  refundNoShowDisputeTestsPassed: false,
  receiptExportTestsPassed: false,
  crossTenantPaymentTestsPassed: false,
  replayIdempotencyTestsPassed: false,
  ciPaymentTestJobConfigured: true,
  artifactsCaptured: false,
});
