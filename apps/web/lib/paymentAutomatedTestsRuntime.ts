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

export const paymentAutomationLocalCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "pnpm vitest run apps/web/tests/payment-routes.test.ts",
  "static payment lifecycle automation contract review",
] as const;

export const paymentAutomationExternalCommands = [
  "payment DB reconciliation integration tests",
  "Stripe CLI payment lifecycle tests",
  "Playwright booking-to-paid payment E2E flow",
  "refund/no-show/dispute/receipt/export E2E artifacts",
  "GitHub Actions payment automation evidence job",
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

export const paymentAutomationRuntimeProofFiles = [
  "packages/payments/package.json",
  "pnpm-lock.yaml",
  "packages/payments/src/index.ts",
  "packages/payments/tests/deposit-policy.test.ts",
  "apps/web/lib/paymentAutomatedTests.ts",
  "apps/web/lib/paymentAutomatedTestsRuntime.ts",
  "apps/web/tests/payment-automation-static.test.ts",
  "apps/web/tests/payment-automation-runtime-static.test.ts",
  "apps/web/tests/payment-routes.test.ts",
  "apps/web/app/api/public/[tenantSlug]/deposit-sessions/route.ts",
  "apps/web/app/api/webhooks/stripe/route.ts",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export type PaymentAutomationEvidenceArtifact = (typeof paymentAutomationArtifactPaths)[number];

export interface PaymentAutomationExecutionPolicy {
  readonly codexMayClassifyStaticPaymentAutomationReadiness: true;
  readonly helperRouteCommandsRequiredForClosure: true;
  readonly stripeCliLifecycleRequiredForClosure: true;
  readonly dbReconciliationRequiredForClosure: true;
  readonly playwrightE2eRequiredForClosure: true;
  readonly artifactRetentionRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface PaymentAutomationExecutionPlan {
  readonly policy: typeof paymentAutomationExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly stripeCliExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly playwrightExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly artifactReviewExecutionAllowed: false;
  readonly localCommands: typeof paymentAutomationLocalCommands;
  readonly externalCommands: typeof paymentAutomationExternalCommands;
  readonly requiredExternalEvidence: typeof paymentAutomationRequiredExternalEvidence;
}

export interface PaymentAutomationArtifactReview {
  readonly artifact: unknown;
  readonly redactedArtifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: boolean;
  readonly requiredExternalEvidence: typeof paymentAutomationRequiredExternalEvidence;
}

export interface PaymentAutomationEvidenceInput {
  readonly paymentsTypecheckPassed: boolean;
  readonly paymentsUnitTestsPassed: boolean;
  readonly routeBoundaryTestsPassed: boolean;
  readonly stripeSignatureTestsPassed: boolean;
  readonly stripeCliLifecycleTranscriptCaptured: boolean;
  readonly dbReconciliationTestsPassed: boolean;
  readonly bookingToPaidE2ePassed: boolean;
  readonly refundNoShowDisputeTestsPassed: boolean;
  readonly receiptExportTestsPassed: boolean;
  readonly crossTenantPaymentTestsPassed: boolean;
  readonly replayIdempotencyTestsPassed: boolean;
  readonly ciPaymentJobEvidenceCaptured: boolean;
  readonly artifactRetentionVerified: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly PaymentAutomationEvidenceArtifact[];
}

export interface PaymentAutomationEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly PaymentAutomationEvidenceArtifact[];
  readonly requiredCommands: typeof paymentAutomationRuntimeCommands;
  readonly requiredEvidence: typeof paymentAutomationDecisionRequiredEvidence;
  readonly redactedSummary: {
    readonly capturedArtifactCount: number;
    readonly requiredArtifactCount: number;
  };
}

export const paymentAutomationDecisionRequiredEvidence = [
  "payment helper, route-boundary, and Stripe signature test output",
  "Stripe CLI lifecycle transcript for checkout success/failure/expiration/refund/dispute/replay",
  "seeded DB reconciliation, tenant isolation, and idempotent replay test output",
  "Playwright/dashboard E2E evidence for booking-to-paid, refund/no-show/dispute, receipt, and export flows",
  "CI payment test job configuration and retained artifacts",
  "secret-safe review of all retained payment artifacts",
] as const;

export const paymentAutomationExecutionPolicy = {
  codexMayClassifyStaticPaymentAutomationReadiness: true,
  helperRouteCommandsRequiredForClosure: true,
  stripeCliLifecycleRequiredForClosure: true,
  dbReconciliationRequiredForClosure: true,
  playwrightE2eRequiredForClosure: true,
  artifactRetentionRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies PaymentAutomationExecutionPolicy;

export const paymentAutomationRequiredExternalEvidence = [
  "payment helper and route boundary command output",
  "Stripe CLI lifecycle transcript",
  "seeded DB reconciliation evidence",
  "Playwright booking-to-paid payment E2E evidence",
  "refund/no-show/dispute/receipt/export E2E artifacts",
  "cross-tenant payment isolation evidence",
  "replay/idempotency evidence",
  "CI payment automation evidence",
  "artifact retention proof",
  "secret-safe payment automation artifact review",
] as const;

const sensitivePaymentAutomationArtifactKey = /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|stripe|payment|checkout|refund|dispute|receipt|export|artifact|trace|screenshot|playwright|cli|email|phone|medical|card|customer)/i;

const redactPaymentAutomationArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactPaymentAutomationArtifactValue(entry, `${path}.${index}`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitivePaymentAutomationArtifactKey.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, redactPaymentAutomationArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  return value;
};

export const buildPaymentAutomationExecutionPlan = (): PaymentAutomationExecutionPlan => ({
  policy: paymentAutomationExecutionPolicy,
  commandExecutionAllowed: false,
  stripeCliExecutionAllowed: false,
  databaseExecutionAllowed: false,
  playwrightExecutionAllowed: false,
  ciExecutionAllowed: false,
  artifactReviewExecutionAllowed: false,
  localCommands: paymentAutomationLocalCommands,
  externalCommands: paymentAutomationExternalCommands,
  requiredExternalEvidence: paymentAutomationRequiredExternalEvidence,
});

export const buildRedactedPaymentAutomationArtifact = (artifact: unknown): Pick<PaymentAutomationArtifactReview, "redactedArtifact" | "redactedPaths"> => {
  const redactedPaths: string[] = [];
  return {
    redactedArtifact: redactPaymentAutomationArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
  };
};

export const buildPaymentAutomationArtifactReview = (artifact: unknown): PaymentAutomationArtifactReview => {
  const redacted = buildRedactedPaymentAutomationArtifact(artifact);
  return {
    artifact,
    redactedArtifact: redacted.redactedArtifact,
    redactedPaths: redacted.redactedPaths,
    secretSafe: redacted.redactedPaths.length > 0,
    requiredExternalEvidence: paymentAutomationRequiredExternalEvidence,
  };
};

export const buildPaymentAutomationEvidenceDecision = (
  input: PaymentAutomationEvidenceInput,
): PaymentAutomationEvidenceDecision => {
  const captured = new Set(input.capturedArtifacts);
  const missingArtifacts = paymentAutomationArtifactPaths.filter((artifact) => !captured.has(artifact));
  const blockers = [
    ...(!input.paymentsTypecheckPassed ? ["Payments package typecheck evidence is missing."] : []),
    ...(!input.paymentsUnitTestsPassed ? ["Payments package unit test evidence is missing."] : []),
    ...(!input.routeBoundaryTestsPassed ? ["Payment route-boundary test evidence is missing."] : []),
    ...(!input.stripeSignatureTestsPassed ? ["Stripe webhook signature test evidence is missing."] : []),
    ...(!input.stripeCliLifecycleTranscriptCaptured
      ? ["Stripe CLI lifecycle transcript must cover checkout success/failure/expiration/refund/dispute/replay."]
      : []),
    ...(!input.dbReconciliationTestsPassed
      ? ["Seeded DB reconciliation tests must prove payment lifecycle persistence."]
      : []),
    ...(!input.bookingToPaidE2ePassed ? ["Booking-to-paid Playwright E2E evidence is missing."] : []),
    ...(!input.refundNoShowDisputeTestsPassed
      ? ["Refund, no-show, and dispute workflow test evidence is missing."]
      : []),
    ...(!input.receiptExportTestsPassed ? ["Receipt and accounting export test evidence is missing."] : []),
    ...(!input.crossTenantPaymentTestsPassed ? ["Cross-tenant payment isolation test evidence is missing."] : []),
    ...(!input.replayIdempotencyTestsPassed ? ["Replay and idempotency test evidence is missing."] : []),
    ...(!input.ciPaymentJobEvidenceCaptured ? ["CI payment job evidence is missing."] : []),
    ...(!input.artifactRetentionVerified ? ["Payment automation artifact retention evidence is missing."] : []),
    ...(!input.secretSafeArtifactReviewPassed ? ["Secret-safe payment artifact review evidence is missing."] : []),
    ...(missingArtifacts.length > 0 ? ["All payment automation artifacts must be captured."] : []),
  ];

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: paymentAutomationRuntimeCommands,
    requiredEvidence: paymentAutomationDecisionRequiredEvidence,
    redactedSummary: {
      capturedArtifactCount: captured.size,
      requiredArtifactCount: paymentAutomationArtifactPaths.length,
    },
  };
};

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
});


