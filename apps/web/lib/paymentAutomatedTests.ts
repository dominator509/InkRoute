import {
  buildPaymentAutomatedTestReadinessPlan,
  type PaymentAutomatedTestReadinessPlan,
} from "@inkroute/payments";

export type PaymentAutomatedTestSuiteId =
  | "payment-helper-unit"
  | "payment-route-boundary"
  | "stripe-signature"
  | "stripe-cli-lifecycle"
  | "payment-db-reconciliation"
  | "booking-to-paid-e2e"
  | "refund-no-show-dispute"
  | "receipt-export"
  | "cross-tenant-payment"
  | "replay-idempotency";

export interface PaymentAutomatedTestSuite {
  id: PaymentAutomatedTestSuiteId;
  command: string;
  requiredArtifact: string;
  secretPolicy: "redacted-only";
}

export interface PaymentAutomatedTestContract {
  suites: readonly PaymentAutomatedTestSuite[];
  ciArtifactPaths: readonly string[];
  readiness: PaymentAutomatedTestReadinessPlan;
}

export const paymentAutomatedTestSuites = [
  {
    id: "payment-helper-unit",
    command: "pnpm --filter @inkroute/payments test",
    requiredArtifact: "coverage/payment-helper-unit.json",
    secretPolicy: "redacted-only",
  },
  {
    id: "payment-route-boundary",
    command: "pnpm vitest run apps/web/tests/payment-routes.test.ts",
    requiredArtifact: "coverage/payment-route-boundary.json",
    secretPolicy: "redacted-only",
  },
  {
    id: "stripe-signature",
    command: "pnpm vitest run apps/web/tests/stripe-webhook-static.test.ts",
    requiredArtifact: "coverage/stripe-signature.json",
    secretPolicy: "redacted-only",
  },
  {
    id: "stripe-cli-lifecycle",
    command: "stripe trigger checkout.session.completed payment_intent.payment_failed checkout.session.expired charge.refunded charge.dispute.created",
    requiredArtifact: "coverage/stripe-cli-lifecycle-redacted.log",
    secretPolicy: "redacted-only",
  },
  {
    id: "payment-db-reconciliation",
    command: "pnpm vitest run apps/web/tests/payment-db-reconciliation.test.ts",
    requiredArtifact: "coverage/payment-db-reconciliation.json",
    secretPolicy: "redacted-only",
  },
  {
    id: "booking-to-paid-e2e",
    command: "pnpm test:e2e -- --grep @payments",
    requiredArtifact: "coverage/playwright-payment-results.json",
    secretPolicy: "redacted-only",
  },
  {
    id: "refund-no-show-dispute",
    command: "pnpm vitest run apps/dashboard/tests/payment-operations-static.test.ts",
    requiredArtifact: "coverage/refund-no-show-dispute.json",
    secretPolicy: "redacted-only",
  },
  {
    id: "receipt-export",
    command: "pnpm vitest run apps/dashboard/tests/payment-operations-static.test.ts",
    requiredArtifact: "coverage/receipt-export.json",
    secretPolicy: "redacted-only",
  },
  {
    id: "cross-tenant-payment",
    command: "pnpm vitest run apps/dashboard/tests/payment-read-route-static.test.ts",
    requiredArtifact: "coverage/cross-tenant-payment.json",
    secretPolicy: "redacted-only",
  },
  {
    id: "replay-idempotency",
    command: "pnpm vitest run apps/web/tests/stripe-webhook-static.test.ts",
    requiredArtifact: "coverage/replay-idempotency.json",
    secretPolicy: "redacted-only",
  },
] as const satisfies readonly PaymentAutomatedTestSuite[];

export const paymentCiArtifactPaths = [
  "coverage/payment-*.json",
  "coverage/stripe-*-redacted.log",
  "coverage/playwright-payment-results.json",
  "test-results/payments",
] as const;

export function buildPaymentAutomatedTestContract(): PaymentAutomatedTestContract {
  return {
    suites: paymentAutomatedTestSuites,
    ciArtifactPaths: paymentCiArtifactPaths,
    readiness: buildPaymentAutomatedTestReadinessPlan({
      packageScripts: {
        test: "vitest run",
        typecheck: "tsc --noEmit",
      },
      paymentsUnitTestsPassed: false,
      paymentRouteTestsPassed: false,
      stripeSdkSignatureTestsPassed: true,
      stripeCliLifecycleTestsPassed: false,
      dbReconciliationTestsPassed: false,
      bookingToPaidE2ePassed: false,
      refundNoShowDisputeTestsPassed: false,
      receiptExportTestsPassed: false,
      crossTenantPaymentTestsPassed: false,
      replayIdempotencyTestsPassed: false,
      ciPaymentTestJobConfigured: true,
      artifactsCaptured: false,
    }),
  };
}

export const paymentAutomatedTestContract = buildPaymentAutomatedTestContract();
