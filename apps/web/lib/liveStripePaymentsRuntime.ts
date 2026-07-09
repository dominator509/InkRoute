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
  "capture installed Stripe SDK/API-version source contract and redacted Stripe secret/webhook evidence",
  "create real Stripe Checkout sessions in provider-backed mode",
  "Stripe CLI checkout/payment/refund/dispute/replay lifecycle tests",
  "payment DB reconciliation integration tests",
  "authorized refund execution and dispute workflow tests",
  "Playwright booking-to-paid E2E flow",
  "GitHub Actions payment evidence job",
  "capture redacted payment artifacts without Stripe secrets or client-private data",
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

export const liveStripePaymentsRuntimeProofFiles = [
  "packages/payments/package.json",
  "pnpm-lock.yaml",
  "packages/payments/src/index.ts",
  "packages/payments/tests/deposit-policy.test.ts",
  "apps/web/lib/stripeCheckout.ts",
  "apps/web/lib/liveStripePaymentsRuntime.ts",
  "apps/web/tests/live-stripe-payments-runtime-static.test.ts",
  "apps/web/tests/payment-routes.test.ts",
  "apps/web/app/api/webhooks/stripe/route.ts",
  "apps/dashboard/lib/paymentOperations.ts",
  "apps/dashboard/tests/payment-operations-static.test.ts",
  "apps/dashboard/tests/payment-read-route-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609032800_add_live_stripe_payments_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export type LiveStripePaymentsRuntimeCommand = (typeof liveStripePaymentsRuntimeCommands)[number];
export type LiveStripePaymentsReadinessArea = (typeof liveStripePaymentsReadinessAreas)[number];
export type LiveStripePaymentsArtifact = (typeof liveStripePaymentsArtifactPaths)[number];

export const liveStripePaymentsRuntimeLocalArtifacts = [
  "coverage/live-stripe-payments-runtime.json",
  "coverage/live-stripe-payments-typecheck.txt",
  "coverage/live-stripe-payments-test.txt",
  "coverage/live-stripe-payment-routes-test.txt",
] as const satisfies readonly LiveStripePaymentsArtifact[];

export const liveStripePaymentsRuntimeExternalArtifacts = [
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
] as const satisfies readonly LiveStripePaymentsArtifact[];

export interface LiveStripePaymentsEvidenceInput {
  readonly paymentsPackageTypecheckPassed: boolean;
  readonly paymentsPackageTestsPassed: boolean;
  readonly paymentRoutesTestsPassed: boolean;
  readonly stripeSdkInstalled: boolean;
  readonly stripeSecretConfigured: boolean;
  readonly stripeWebhookSecretConfigured: boolean;
  readonly stripeApiVersionPinned: boolean;
  readonly checkoutProviderCallImplemented: boolean;
  readonly paymentIntentLifecycleHandled: boolean;
  readonly providerIdempotencyStoreBackedByDb: boolean;
  readonly checkoutSessionPersisted: boolean;
  readonly webhookRawBodyVerificationConfigured: boolean;
  readonly webhookReplayProtectionPersisted: boolean;
  readonly dbReconciliationTransactional: boolean;
  readonly refundExecutionImplemented: boolean;
  readonly disputeWorkflowImplemented: boolean;
  readonly stripeCliLifecycleVerified: boolean;
  readonly bookingToPaidE2eVerified: boolean;
  readonly crossTenantPaymentIsolationVerified: boolean;
  readonly ciPaymentEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly liveStripePaymentsRunPersisted: boolean;
  readonly coveredReadinessAreas: readonly LiveStripePaymentsReadinessArea[];
  readonly capturedArtifacts: readonly LiveStripePaymentsArtifact[];
  readonly completedCommands: readonly LiveStripePaymentsRuntimeCommand[];
}

export interface LiveStripePaymentsRunRecordInput extends LiveStripePaymentsEvidenceInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha?: string | null;
  readonly status: "complete" | "blocked";
  readonly stripeConfigurationManifest?: readonly string[];
  readonly lifecycleEvidenceManifest?: readonly string[];
  readonly paymentsTypecheckArtifactPath?: string | null;
  readonly paymentsTestArtifactPath?: string | null;
  readonly paymentRoutesTestArtifactPath?: string | null;
  readonly stripeSdkConfigArtifactPath?: string | null;
  readonly checkoutProviderCallArtifactPath?: string | null;
  readonly webhookLifecycleArtifactPath?: string | null;
  readonly dbReconciliationArtifactPath?: string | null;
  readonly refundDisputeArtifactPath?: string | null;
  readonly stripeCliLifecycleArtifactPath?: string | null;
  readonly bookingToPaidE2eArtifactPath?: string | null;
  readonly ciPaymentEvidenceArtifactPath?: string | null;
  readonly secretSafeArtifactsPath?: string | null;
  readonly ciRunUrl?: string | null;
}

export interface LiveStripePaymentsRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string | null;
  readonly status: string;
  readonly commandMatrix: readonly LiveStripePaymentsRuntimeMatrixEntry[];
  readonly readinessAreaManifest: readonly LiveStripePaymentsReadinessArea[];
  readonly artifactManifest: readonly LiveStripePaymentsArtifact[];
  readonly stripeConfigurationManifest: readonly string[];
  readonly lifecycleEvidenceManifest: readonly string[];
  readonly paymentsPackageTypecheckPassed: boolean;
  readonly paymentsPackageTestsPassed: boolean;
  readonly paymentRoutesTestsPassed: boolean;
  readonly stripeSdkInstalled: boolean;
  readonly stripeSecretConfigured: boolean;
  readonly stripeWebhookSecretConfigured: boolean;
  readonly stripeApiVersionPinned: boolean;
  readonly checkoutProviderCallImplemented: boolean;
  readonly paymentIntentLifecycleHandled: boolean;
  readonly providerIdempotencyStoreBackedByDb: boolean;
  readonly checkoutSessionPersisted: boolean;
  readonly webhookRawBodyVerificationConfigured: boolean;
  readonly webhookReplayProtectionPersisted: boolean;
  readonly dbReconciliationTransactional: boolean;
  readonly refundExecutionImplemented: boolean;
  readonly disputeWorkflowImplemented: boolean;
  readonly stripeCliLifecycleVerified: boolean;
  readonly bookingToPaidE2eVerified: boolean;
  readonly crossTenantPaymentIsolationVerified: boolean;
  readonly ciPaymentEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly paymentsTypecheckArtifactPath: string | null;
  readonly paymentsTestArtifactPath: string | null;
  readonly paymentRoutesTestArtifactPath: string | null;
  readonly stripeSdkConfigArtifactPath: string | null;
  readonly checkoutProviderCallArtifactPath: string | null;
  readonly webhookLifecycleArtifactPath: string | null;
  readonly dbReconciliationArtifactPath: string | null;
  readonly refundDisputeArtifactPath: string | null;
  readonly stripeCliLifecycleArtifactPath: string | null;
  readonly bookingToPaidE2eArtifactPath: string | null;
  readonly ciPaymentEvidenceArtifactPath: string | null;
  readonly secretSafeArtifactsPath: string | null;
  readonly ciRunUrl: string | null;
}

export interface LiveStripePaymentsRunRepository {
  readonly liveStripePaymentsRun: {
    upsert(input: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: LiveStripePaymentsRunData;
      readonly update: Omit<LiveStripePaymentsRunData, "tenantId" | "runId">;
    }): Promise<unknown>;
  };
}

export interface LiveStripePaymentsEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingReadinessAreas: readonly LiveStripePaymentsReadinessArea[];
  readonly missingArtifacts: readonly LiveStripePaymentsArtifact[];
  readonly missingCommands: readonly LiveStripePaymentsRuntimeCommand[];
  readonly requiredReadinessAreas: readonly LiveStripePaymentsReadinessArea[];
  readonly requiredArtifacts: typeof liveStripePaymentsArtifactPaths;
  readonly requiredCommands: typeof liveStripePaymentsRuntimeCommands;
  readonly requiredEvidence: typeof liveStripePaymentsRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface LiveStripePaymentsRuntimeExecutionPlan {
  readonly localCommands: typeof liveStripePaymentsRuntimeLocalCommands;
  readonly externalCommands: typeof liveStripePaymentsRuntimeExternalCommands;
  readonly localArtifacts: typeof liveStripePaymentsRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof liveStripePaymentsRuntimeExternalArtifacts;
  readonly paymentsPackageTypecheckExecutionAllowed: false;
  readonly paymentsPackageTestExecutionAllowed: false;
  readonly paymentRoutesTestExecutionAllowed: false;
  readonly stripeConfigCaptureAllowed: false;
  readonly checkoutProviderCallAllowed: false;
  readonly stripeCliLifecycleExecutionAllowed: false;
  readonly dbReconciliationExecutionAllowed: false;
  readonly refundDisputeExecutionAllowed: false;
  readonly bookingToPaidE2eExecutionAllowed: false;
  readonly ciPaymentEvidenceExecutionAllowed: false;
  readonly secretSafeArtifactCaptureAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly executionPolicy: typeof liveStripePaymentsExecutionPolicy;
  readonly requiredExternalEvidence: typeof liveStripePaymentsRequiredExternalEvidence;
}

export interface LiveStripePaymentsRuntimeArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof liveStripePaymentsRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export const liveStripePaymentsRuntimeLocalCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "pnpm vitest run apps/web/tests/payment-routes.test.ts",
] as const satisfies readonly LiveStripePaymentsRuntimeCommand[];

export const liveStripePaymentsRuntimeExternalCommands = [
  "capture installed Stripe SDK/API-version source contract and redacted Stripe secret/webhook evidence",
  "create real Stripe Checkout sessions in provider-backed mode",
  "Stripe CLI checkout/payment/refund/dispute/replay lifecycle tests",
  "payment DB reconciliation integration tests",
  "authorized refund execution and dispute workflow tests",
  "Playwright booking-to-paid E2E flow",
  "GitHub Actions payment evidence job",
  "capture redacted payment artifacts without Stripe secrets or client-private data",
] as const satisfies readonly LiveStripePaymentsRuntimeCommand[];

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
    command: "capture installed Stripe SDK/API-version source contract and redacted Stripe secret/webhook evidence",
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
  stripeSdkInstalled: true,
  stripeSecretConfigured: false,
  stripeWebhookSecretConfigured: false,
  stripeApiVersionPinned: true,
  checkoutProviderCallImplemented: true,
  paymentIntentLifecycleHandled: false,
  providerIdempotencyStoreBackedByDb: false,
  checkoutSessionPersisted: false,
  webhookRawBodyVerificationConfigured: true,
  webhookReplayProtectionPersisted: false,
  dbReconciliationTransactional: false,
  refundExecutionImplemented: true,
  disputeWorkflowImplemented: true,
  stripeCliLifecycleVerified: false,
  bookingToPaidE2eVerified: false,
  crossTenantPaymentIsolationVerified: false,
  ciPaymentEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});

export function buildLiveStripePaymentsDecisionRequiredEvidence(
  readinessEvidence: typeof liveStripePaymentsRuntimeReadiness.requiredEvidence,
): LiveStripePaymentsRequiredEvidence {
  return [
    ...readinessEvidence,
    "LiveStripePaymentsRun row with command, readiness area, artifact, Stripe configuration, and lifecycle evidence matrices.",
    "Artifact bundle proving payments package checks, payment routes, Stripe config, real Checkout writes, webhook lifecycle, DB reconciliation, refunds/disputes, Stripe CLI, booking-to-paid E2E, CI evidence, and secret-safe artifacts.",
  ];
}

export type LiveStripePaymentsRequiredEvidence = readonly [
  ...typeof liveStripePaymentsRuntimeReadiness.requiredEvidence,
  "LiveStripePaymentsRun row with command, readiness area, artifact, Stripe configuration, and lifecycle evidence matrices.",
  "Artifact bundle proving payments package checks, payment routes, Stripe config, real Checkout writes, webhook lifecycle, DB reconciliation, refunds/disputes, Stripe CLI, booking-to-paid E2E, CI evidence, and secret-safe artifacts.",
];

export const liveStripePaymentsRequiredEvidence = buildLiveStripePaymentsDecisionRequiredEvidence(
  liveStripePaymentsRuntimeReadiness.requiredEvidence,
);

export function buildLiveStripePaymentsEvidenceDecision(
  input: LiveStripePaymentsEvidenceInput,
): LiveStripePaymentsEvidenceDecision {
  const coveredReadinessAreas = new Set(input.coveredReadinessAreas);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingReadinessAreas = liveStripePaymentsReadinessAreas.filter((area) => !coveredReadinessAreas.has(area));
  const missingArtifacts = liveStripePaymentsArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = liveStripePaymentsRuntimeCommands.filter((command) => !completedCommands.has(command));
  const readinessPlan = buildLiveStripePaymentsReadinessPlan({
    packageScripts: {
      typecheck: "tsc --noEmit",
      test: "vitest run --passWithNoTests",
    },
    stripeSdkInstalled: input.stripeSdkInstalled,
    stripeSecretConfigured: input.stripeSecretConfigured,
    stripeWebhookSecretConfigured: input.stripeWebhookSecretConfigured,
    stripeApiVersionPinned: input.stripeApiVersionPinned,
    checkoutProviderCallImplemented: input.checkoutProviderCallImplemented,
    paymentIntentLifecycleHandled: input.paymentIntentLifecycleHandled,
    providerIdempotencyStoreBackedByDb: input.providerIdempotencyStoreBackedByDb,
    checkoutSessionPersisted: input.checkoutSessionPersisted,
    webhookRawBodyVerificationConfigured: input.webhookRawBodyVerificationConfigured,
    webhookReplayProtectionPersisted: input.webhookReplayProtectionPersisted,
    dbReconciliationTransactional: input.dbReconciliationTransactional,
    refundExecutionImplemented: input.refundExecutionImplemented,
    disputeWorkflowImplemented: input.disputeWorkflowImplemented,
    stripeCliLifecycleVerified: input.stripeCliLifecycleVerified,
    bookingToPaidE2eVerified: input.bookingToPaidE2eVerified,
    crossTenantPaymentIsolationVerified: input.crossTenantPaymentIsolationVerified,
    ciPaymentEvidenceCaptured: input.ciPaymentEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
  });
  const blockers = [...readinessPlan.blockers];

  if (!input.paymentsPackageTypecheckPassed) {
    blockers.push("@inkroute/payments typecheck must pass.");
  }
  if (!input.paymentsPackageTestsPassed) {
    blockers.push("@inkroute/payments tests must pass.");
  }
  if (!input.paymentRoutesTestsPassed) {
    blockers.push("Payment route tests must pass.");
  }
  if (!input.liveStripePaymentsRunPersisted) {
    blockers.push("LiveStripePaymentsRun persistence row must be captured for durable auditability.");
  }
  if (missingReadinessAreas.length > 0) {
    blockers.push("Every required live Stripe readiness area must be covered.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required live Stripe payment artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required live Stripe payment command must be completed.");
  }

  return {
    status:
      blockers.length === 0 && missingReadinessAreas.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0
        ? "complete"
        : "blocked",
    missingReadinessAreas,
    missingArtifacts,
    missingCommands,
    requiredReadinessAreas: liveStripePaymentsReadinessAreas,
    requiredArtifacts: liveStripePaymentsArtifactPaths,
    requiredCommands: liveStripePaymentsRuntimeCommands,
    requiredEvidence: liveStripePaymentsRequiredEvidence,
    blockers,
  };
}

export function buildLiveStripePaymentsRunData(input: LiveStripePaymentsRunRecordInput): LiveStripePaymentsRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha ?? null,
    status: input.status,
    commandMatrix: liveStripePaymentsRuntimeMatrix,
    readinessAreaManifest: input.coveredReadinessAreas,
    artifactManifest: input.capturedArtifacts,
    stripeConfigurationManifest: input.stripeConfigurationManifest ?? [
      "Stripe SDK, secret, webhook secret, and API-version evidence must stay redacted.",
    ],
    lifecycleEvidenceManifest: input.lifecycleEvidenceManifest ?? [
      "Live Stripe lifecycle evidence requires provider-backed test mode artifacts.",
    ],
    paymentsPackageTypecheckPassed: input.paymentsPackageTypecheckPassed,
    paymentsPackageTestsPassed: input.paymentsPackageTestsPassed,
    paymentRoutesTestsPassed: input.paymentRoutesTestsPassed,
    stripeSdkInstalled: input.stripeSdkInstalled,
    stripeSecretConfigured: input.stripeSecretConfigured,
    stripeWebhookSecretConfigured: input.stripeWebhookSecretConfigured,
    stripeApiVersionPinned: input.stripeApiVersionPinned,
    checkoutProviderCallImplemented: input.checkoutProviderCallImplemented,
    paymentIntentLifecycleHandled: input.paymentIntentLifecycleHandled,
    providerIdempotencyStoreBackedByDb: input.providerIdempotencyStoreBackedByDb,
    checkoutSessionPersisted: input.checkoutSessionPersisted,
    webhookRawBodyVerificationConfigured: input.webhookRawBodyVerificationConfigured,
    webhookReplayProtectionPersisted: input.webhookReplayProtectionPersisted,
    dbReconciliationTransactional: input.dbReconciliationTransactional,
    refundExecutionImplemented: input.refundExecutionImplemented,
    disputeWorkflowImplemented: input.disputeWorkflowImplemented,
    stripeCliLifecycleVerified: input.stripeCliLifecycleVerified,
    bookingToPaidE2eVerified: input.bookingToPaidE2eVerified,
    crossTenantPaymentIsolationVerified: input.crossTenantPaymentIsolationVerified,
    ciPaymentEvidenceCaptured: input.ciPaymentEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    paymentsTypecheckArtifactPath: input.paymentsTypecheckArtifactPath ?? null,
    paymentsTestArtifactPath: input.paymentsTestArtifactPath ?? null,
    paymentRoutesTestArtifactPath: input.paymentRoutesTestArtifactPath ?? null,
    stripeSdkConfigArtifactPath: input.stripeSdkConfigArtifactPath ?? null,
    checkoutProviderCallArtifactPath: input.checkoutProviderCallArtifactPath ?? null,
    webhookLifecycleArtifactPath: input.webhookLifecycleArtifactPath ?? null,
    dbReconciliationArtifactPath: input.dbReconciliationArtifactPath ?? null,
    refundDisputeArtifactPath: input.refundDisputeArtifactPath ?? null,
    stripeCliLifecycleArtifactPath: input.stripeCliLifecycleArtifactPath ?? null,
    bookingToPaidE2eArtifactPath: input.bookingToPaidE2eArtifactPath ?? null,
    ciPaymentEvidenceArtifactPath: input.ciPaymentEvidenceArtifactPath ?? null,
    secretSafeArtifactsPath: input.secretSafeArtifactsPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export async function persistLiveStripePaymentsRun(
  repository: LiveStripePaymentsRunRepository,
  input: LiveStripePaymentsRunRecordInput,
): Promise<unknown> {
  const data = buildLiveStripePaymentsRunData(input);
  const update = {
    commitSha: data.commitSha,
    status: data.status,
    commandMatrix: data.commandMatrix,
    readinessAreaManifest: data.readinessAreaManifest,
    artifactManifest: data.artifactManifest,
    stripeConfigurationManifest: data.stripeConfigurationManifest,
    lifecycleEvidenceManifest: data.lifecycleEvidenceManifest,
    paymentsPackageTypecheckPassed: data.paymentsPackageTypecheckPassed,
    paymentsPackageTestsPassed: data.paymentsPackageTestsPassed,
    paymentRoutesTestsPassed: data.paymentRoutesTestsPassed,
    stripeSdkInstalled: data.stripeSdkInstalled,
    stripeSecretConfigured: data.stripeSecretConfigured,
    stripeWebhookSecretConfigured: data.stripeWebhookSecretConfigured,
    stripeApiVersionPinned: data.stripeApiVersionPinned,
    checkoutProviderCallImplemented: data.checkoutProviderCallImplemented,
    paymentIntentLifecycleHandled: data.paymentIntentLifecycleHandled,
    providerIdempotencyStoreBackedByDb: data.providerIdempotencyStoreBackedByDb,
    checkoutSessionPersisted: data.checkoutSessionPersisted,
    webhookRawBodyVerificationConfigured: data.webhookRawBodyVerificationConfigured,
    webhookReplayProtectionPersisted: data.webhookReplayProtectionPersisted,
    dbReconciliationTransactional: data.dbReconciliationTransactional,
    refundExecutionImplemented: data.refundExecutionImplemented,
    disputeWorkflowImplemented: data.disputeWorkflowImplemented,
    stripeCliLifecycleVerified: data.stripeCliLifecycleVerified,
    bookingToPaidE2eVerified: data.bookingToPaidE2eVerified,
    crossTenantPaymentIsolationVerified: data.crossTenantPaymentIsolationVerified,
    ciPaymentEvidenceCaptured: data.ciPaymentEvidenceCaptured,
    secretSafeArtifactsCaptured: data.secretSafeArtifactsCaptured,
    paymentsTypecheckArtifactPath: data.paymentsTypecheckArtifactPath,
    paymentsTestArtifactPath: data.paymentsTestArtifactPath,
    paymentRoutesTestArtifactPath: data.paymentRoutesTestArtifactPath,
    stripeSdkConfigArtifactPath: data.stripeSdkConfigArtifactPath,
    checkoutProviderCallArtifactPath: data.checkoutProviderCallArtifactPath,
    webhookLifecycleArtifactPath: data.webhookLifecycleArtifactPath,
    dbReconciliationArtifactPath: data.dbReconciliationArtifactPath,
    refundDisputeArtifactPath: data.refundDisputeArtifactPath,
    stripeCliLifecycleArtifactPath: data.stripeCliLifecycleArtifactPath,
    bookingToPaidE2eArtifactPath: data.bookingToPaidE2eArtifactPath,
    ciPaymentEvidenceArtifactPath: data.ciPaymentEvidenceArtifactPath,
    secretSafeArtifactsPath: data.secretSafeArtifactsPath,
    ciRunUrl: data.ciRunUrl,
  };

  return repository.liveStripePaymentsRun.upsert({
    where: { tenantId_runId: { tenantId: input.tenantId, runId: input.runId } },
    create: data,
    update,
  });
}

const sensitiveLiveStripePaymentsKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|tenant|user|account|database|url|uri|dsn|key|id|stripe|payment|client|customer|card|intent|checkout|session|webhook|provider|request|response|payload|body|signature|raw|reconciliation|idempotency|replay|refund|dispute|receipt|audit|artifact|path|command|typecheck|build|test|output|stdout|stderr|log|ci|workflow|run|commit|repository|repo|branch|pullRequest|pr|reviewer|codeowner)$/iu;
const sensitiveLiveStripePaymentsValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|repo:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|branch:[A-Za-z0-9_./-]+|pr[_:#-]?[A-Za-z0-9_.-]+|reviewer[_:@-]?[A-Za-z0-9_.-]+|CODEOWNER:[A-Za-z0-9_.@/-]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:sk|pk|whsec|pi|cs|ch|evt|cus|acct|pm|tok|seti|src|refund|re|du)_[A-Za-z0-9_]+|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|stripe-signature[:=][^"'\s]+|(?:tenant|client|customer|booking|deposit|payment|refund|dispute|checkout|intent|webhook|audit|idempotency|replay|reconciliation|artifact|workflow|ci|run|commit)[-_:/]?[A-Za-z0-9_.-]{6,}|[A-Za-z0-9_-]{24,})/giu;

const redactLiveStripePaymentsString = (value: string): string =>
  value.replace(sensitiveLiveStripePaymentsValuePattern, "[REDACTED]");

export const liveStripePaymentsExecutionPolicy = {
  codexMayClassifyStaticStripeReadiness: true,
  stripeProviderEvidenceRequiredForClosure: true,
  secretStoreConfigurationRequiredForClosure: true,
  providerBackedPersistenceRequiredForClosure: true,
  bookingToPaidE2eRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const;

export const liveStripePaymentsRequiredExternalEvidence = [
  "Redacted Stripe secret, webhook secret, SDK version, and API-version configuration evidence.",
  "Provider-backed Checkout session, PaymentIntent lifecycle, idempotency, persistence, reconciliation, refund, and dispute evidence.",
  "Stripe CLI webhook lifecycle evidence for success, failure, expiration, refund, dispute, and replay protection.",
  "Booking-to-paid E2E evidence captured against Stripe test mode.",
  "GitHub Actions payment evidence job URL and conclusion.",
  "Provider-backed LiveStripePaymentsRun persistence row captured from the target database.",
  "Secret-safe artifact bundle with no Stripe secrets, client-private data, payment card data, or raw provider identifiers.",
] as const;

const buildRedactedLiveStripePaymentsValue = (
  value: unknown,
  path: string,
  redactions: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item, index) => buildRedactedLiveStripePaymentsValue(item, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveLiveStripePaymentsKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedLiveStripePaymentsValue(nestedValue, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redactedValue = redactLiveStripePaymentsString(value);
    if (redactedValue !== value) {
      redactions.push(path || "value");
    }
    return redactedValue;
  }

  return value;
};

export function buildLiveStripePaymentsRuntimeExecutionPlan(): LiveStripePaymentsRuntimeExecutionPlan {
  return {
    localCommands: liveStripePaymentsRuntimeLocalCommands,
    externalCommands: liveStripePaymentsRuntimeExternalCommands,
    localArtifacts: liveStripePaymentsRuntimeLocalArtifacts,
    externalArtifacts: liveStripePaymentsRuntimeExternalArtifacts,
    paymentsPackageTypecheckExecutionAllowed: false,
    paymentsPackageTestExecutionAllowed: false,
    paymentRoutesTestExecutionAllowed: false,
    stripeConfigCaptureAllowed: false,
    checkoutProviderCallAllowed: false,
    stripeCliLifecycleExecutionAllowed: false,
    dbReconciliationExecutionAllowed: false,
    refundDisputeExecutionAllowed: false,
    bookingToPaidE2eExecutionAllowed: false,
    ciPaymentEvidenceExecutionAllowed: false,
    secretSafeArtifactCaptureAllowed: false,
    persistenceExecutionAllowed: false,
    executionPolicy: liveStripePaymentsExecutionPolicy,
    requiredExternalEvidence: liveStripePaymentsRequiredExternalEvidence,
  };
}

export function buildRedactedLiveStripePaymentsArtifact(artifact: unknown): unknown {
  return buildRedactedLiveStripePaymentsValue(artifact, "", []);
}

export function buildLiveStripePaymentsRuntimeArtifactReview(
  artifact: unknown,
): LiveStripePaymentsRuntimeArtifactReview {
  const redactions: string[] = [];

  return {
    artifact: buildRedactedLiveStripePaymentsValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: liveStripePaymentsRequiredExternalEvidence,
    safeForTracker: true,
  };
}

