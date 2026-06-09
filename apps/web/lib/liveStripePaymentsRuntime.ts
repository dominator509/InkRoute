import { buildLiveStripePaymentsReadinessPlan } from "@inkroute/payments";

export type LiveStripePaymentsRuntimeStatus =
  | "wired"
  | "provider-gated"
  | "persistence-gated"
  | "webhook-gated"
  | "e2e-gated"
  | "ci-gated";

export interface LiveStripePaymentsRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: LiveStripePaymentsRuntimeStatus;
}

export interface LiveStripePaymentsRunPersistenceContract {
  readonly model: "LiveStripePaymentsRun";
  readonly tenantRelation: "liveStripePaymentsRuns";
  readonly migration: "20260609032800_add_live_stripe_payments_runs";
  readonly jsonFields: readonly [
    "commandMatrix",
    "readinessAreaManifest",
    "artifactManifest",
    "stripeConfigurationManifest",
    "lifecycleEvidenceManifest",
  ];
  readonly evidenceBooleans: readonly [
    "paymentsPackageTypecheckPassed",
    "paymentsPackageTestsPassed",
    "paymentRoutesTestsPassed",
    "stripeSdkInstalled",
    "stripeSecretConfigured",
    "stripeWebhookSecretConfigured",
    "stripeApiVersionPinned",
    "checkoutProviderCallImplemented",
    "paymentIntentLifecycleHandled",
    "providerIdempotencyStoreBackedByDb",
    "checkoutSessionPersisted",
    "webhookRawBodyVerificationConfigured",
    "webhookReplayProtectionPersisted",
    "dbReconciliationTransactional",
    "refundExecutionImplemented",
    "disputeWorkflowImplemented",
    "stripeCliLifecycleVerified",
    "bookingToPaidE2eVerified",
    "crossTenantPaymentIsolationVerified",
    "ciPaymentEvidenceCaptured",
    "secretSafeArtifactsCaptured",
  ];
  readonly artifactFields: readonly [
    "paymentsTypecheckArtifactPath",
    "paymentsTestArtifactPath",
    "paymentRoutesTestArtifactPath",
    "stripeSdkConfigArtifactPath",
    "checkoutProviderCallArtifactPath",
    "webhookLifecycleArtifactPath",
    "dbReconciliationArtifactPath",
    "refundDisputeArtifactPath",
    "stripeCliLifecycleArtifactPath",
    "bookingToPaidE2eArtifactPath",
    "ciPaymentEvidenceArtifactPath",
    "secretSafeArtifactsPath",
    "ciRunUrl",
  ];
}

export const liveStripePaymentsRunPersistenceContract: LiveStripePaymentsRunPersistenceContract = {
  model: "LiveStripePaymentsRun",
  tenantRelation: "liveStripePaymentsRuns",
  migration: "20260609032800_add_live_stripe_payments_runs",
  jsonFields: [
    "commandMatrix",
    "readinessAreaManifest",
    "artifactManifest",
    "stripeConfigurationManifest",
    "lifecycleEvidenceManifest",
  ],
  evidenceBooleans: [
    "paymentsPackageTypecheckPassed",
    "paymentsPackageTestsPassed",
    "paymentRoutesTestsPassed",
    "stripeSdkInstalled",
    "stripeSecretConfigured",
    "stripeWebhookSecretConfigured",
    "stripeApiVersionPinned",
    "checkoutProviderCallImplemented",
    "paymentIntentLifecycleHandled",
    "providerIdempotencyStoreBackedByDb",
    "checkoutSessionPersisted",
    "webhookRawBodyVerificationConfigured",
    "webhookReplayProtectionPersisted",
    "dbReconciliationTransactional",
    "refundExecutionImplemented",
    "disputeWorkflowImplemented",
    "stripeCliLifecycleVerified",
    "bookingToPaidE2eVerified",
    "crossTenantPaymentIsolationVerified",
    "ciPaymentEvidenceCaptured",
    "secretSafeArtifactsCaptured",
  ],
  artifactFields: [
    "paymentsTypecheckArtifactPath",
    "paymentsTestArtifactPath",
    "paymentRoutesTestArtifactPath",
    "stripeSdkConfigArtifactPath",
    "checkoutProviderCallArtifactPath",
    "webhookLifecycleArtifactPath",
    "dbReconciliationArtifactPath",
    "refundDisputeArtifactPath",
    "stripeCliLifecycleArtifactPath",
    "bookingToPaidE2eArtifactPath",
    "ciPaymentEvidenceArtifactPath",
    "secretSafeArtifactsPath",
    "ciRunUrl",
  ],
};

export const liveStripePaymentsRuntimeCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "pnpm vitest run apps/web/tests/payment-routes.test.ts",
  "Stripe CLI checkout/payment/refund/dispute/replay lifecycle tests",
  "payment DB reconciliation integration tests",
  "Playwright booking-to-paid E2E flow",
  "GitHub Actions payment evidence job",
] as const;

export const liveStripePaymentsReadinessAreas = [
  "stripe-sdk-pin",
  "stripe-secret-store",
  "stripe-webhook-secret-store",
  "stripe-api-version-pin",
  "real-checkout-session-create",
  "payment-intent-lifecycle",
  "provider-idempotency-db-store",
  "checkout-payment-deposit-audit-persistence",
  "raw-body-webhook-signature-verification",
  "webhook-replay-protection",
  "tenant-scoped-db-reconciliation",
  "refund-execution",
  "dispute-workflow",
  "stripe-cli-lifecycle",
  "booking-to-paid-e2e",
  "cross-tenant-payment-isolation",
  "ci-payment-evidence",
  "secret-safe-artifacts",
] as const;

export const liveStripePaymentsArtifactPaths = [
  "coverage/live-stripe-payments-runtime.json",
  "coverage/live-stripe-payments-typecheck.txt",
  "coverage/live-stripe-payments-test.txt",
  "coverage/live-stripe-payment-routes-test.txt",
  "coverage/live-stripe-sdk-config-redacted.json",
  "coverage/live-stripe-checkout-provider-call.json",
  "coverage/live-stripe-webhook-lifecycle.json",
  "coverage/live-stripe-db-reconciliation.json",
  "coverage/live-stripe-refund-dispute-workflows.json",
  "coverage/live-stripe-cli-lifecycle.json",
  "coverage/live-stripe-booking-to-paid-e2e.json",
  "coverage/live-stripe-ci-payment-evidence.json",
  "coverage/live-stripe-secret-safe-artifacts.json",
  "test-results/live-stripe-payments-runtime",
] as const;

export const liveStripePaymentsRuntimeMatrix = [
  {
    id: "payments-package-typecheck",
    command: "pnpm --filter @inkroute/payments typecheck",
    artifact: "coverage/live-stripe-payments-typecheck.txt",
    status: "wired",
  },
  {
    id: "payments-package-tests",
    command: "pnpm --filter @inkroute/payments test",
    artifact: "coverage/live-stripe-payments-test.txt",
    status: "wired",
  },
  {
    id: "payment-routes-tests",
    command: "pnpm vitest run apps/web/tests/payment-routes.test.ts",
    artifact: "coverage/live-stripe-payment-routes-test.txt",
    status: "wired",
  },
  {
    id: "stripe-sdk-secret-api-version",
    command: "pin Stripe SDK and configure redacted Stripe secret/webhook/API-version evidence",
    artifact: "coverage/live-stripe-sdk-config-redacted.json",
    status: "provider-gated",
  },
  {
    id: "checkout-provider-call",
    command: "create real Stripe Checkout sessions in provider-backed mode",
    artifact: "coverage/live-stripe-checkout-provider-call.json",
    status: "provider-gated",
  },
  {
    id: "webhook-lifecycle-replay",
    command: "Stripe CLI checkout/payment/refund/dispute/replay lifecycle tests",
    artifact: "coverage/live-stripe-webhook-lifecycle.json",
    status: "webhook-gated",
  },
  {
    id: "db-reconciliation-idempotency",
    command: "payment DB reconciliation integration tests",
    artifact: "coverage/live-stripe-db-reconciliation.json",
    status: "persistence-gated",
  },
  {
    id: "refund-dispute-workflows",
    command: "authorized refund execution and dispute workflow tests",
    artifact: "coverage/live-stripe-refund-dispute-workflows.json",
    status: "provider-gated",
  },
  {
    id: "booking-to-paid-e2e",
    command: "Playwright booking-to-paid E2E flow",
    artifact: "coverage/live-stripe-booking-to-paid-e2e.json",
    status: "e2e-gated",
  },
  {
    id: "ci-payment-evidence",
    command: "GitHub Actions payment evidence job",
    artifact: "coverage/live-stripe-ci-payment-evidence.json",
    status: "ci-gated",
  },
  {
    id: "secret-safe-artifacts",
    command: "capture redacted payment artifacts without Stripe secrets or client-private data",
    artifact: "coverage/live-stripe-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly LiveStripePaymentsRuntimeMatrixEntry[];

export const liveStripePaymentsRuntimeReadiness = buildLiveStripePaymentsReadinessPlan({
  packageScripts: {
    typecheck: "tsc --noEmit",
    test: "vitest run --passWithNoTests",
  },
  stripeSdkInstalled: false,
  stripeSecretConfigured: false,
  stripeWebhookSecretConfigured: false,
  stripeApiVersionPinned: false,
  checkoutProviderCallImplemented: false,
  paymentIntentLifecycleHandled: false,
  providerIdempotencyStoreBackedByDb: false,
  checkoutSessionPersisted: false,
  webhookRawBodyVerificationConfigured: true,
  webhookReplayProtectionPersisted: false,
  dbReconciliationTransactional: false,
  refundExecutionImplemented: false,
  disputeWorkflowImplemented: false,
  stripeCliLifecycleVerified: false,
  bookingToPaidE2eVerified: false,
  crossTenantPaymentIsolationVerified: false,
  ciPaymentEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});
