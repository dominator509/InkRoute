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
  "capture Stripe SDK raw-body constructEvent adapter and redacted STRIPE_WEBHOOK_SECRET evidence",
  "reject invalid and stale Stripe signatures before trusted parsing",
  "persist Stripe provider event ids for replay protection",
  "cover checkout completed/expired, payment succeeded/failed, refund, and dispute events",
  "fetch or verify Stripe provider objects before reconciliation",
  "resolve tenant from trusted provider metadata or persisted provider ids",
  "reconcile Deposit, Payment, and Refund records",
  "persist PaymentAuditLog for accepted and rejected Stripe events",
  "persist BookingStateEvent for payment lifecycle changes",
  "run webhook reconciliation writes in one tenant-scoped transaction",
  "reject amount and currency mismatches before reconciliation",
  "stripe listen --forward-to localhost:3000/api/webhooks/stripe",
  "stripe trigger checkout.session.completed",
  "stripe trigger payment_intent.payment_failed",
  "stripe trigger charge.refunded",
  "Stripe CLI replay for supported events, invalid signature, and replay denial",
  "GitHub Actions Stripe webhook evidence job",
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

export const stripeWebhookRuntimeProofFiles = [
  "apps/web/package.json",
  "apps/web/app/api/webhooks/stripe/route.ts",
  "apps/web/lib/stripeWebhook.ts",
  "apps/web/lib/stripeWebhookRuntime.ts",
  "apps/web/tests/payment-routes.test.ts",
  "apps/web/tests/stripe-webhook-static.test.ts",
  "apps/web/tests/stripe-webhook-runtime-static.test.ts",
  "packages/payments/package.json",
  "pnpm-lock.yaml",
  "packages/payments/src/index.ts",
  "packages/payments/tests/deposit-policy.test.ts",
  "packages/db/prisma/schema.prisma",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export const stripeWebhookEvidenceFlags = [
  "paymentsTypecheckPassed",
  "paymentsTestsPassed",
  "webTypecheckPassed",
  "webhookRouteTestsPassed",
  "constructEventRawBodyVerified",
  "webhookSecretConfigured",
  "invalidStaleSignatureRejected",
  "replayProtectionPersisted",
  "supportedEventsCovered",
  "providerObjectFetchVerified",
  "tenantResolutionVerified",
  "paymentPersistenceVerified",
  "paymentAuditLogPersisted",
  "bookingStateEventPersisted",
  "tenantTransactionVerified",
  "amountCurrencyMismatchRejected",
  "stripeCliReplayVerified",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type StripeWebhookEvidenceFlag = (typeof stripeWebhookEvidenceFlags)[number];

export interface StripeWebhookExecutionPolicy {
  readonly codexMayClassifyStaticStripeWebhookReadiness: true;
  readonly webhookSecretRequiredForClosure: true;
  readonly replayPersistenceRequiredForClosure: true;
  readonly providerObjectVerificationRequiredForClosure: true;
  readonly dbReconciliationRequiredForClosure: true;
  readonly stripeCliReplayRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface StripeWebhookExecutionPlan {
  readonly policy: typeof stripeWebhookExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly webhookSecretExecutionAllowed: false;
  readonly replayStoreExecutionAllowed: false;
  readonly providerObjectExecutionAllowed: false;
  readonly databaseReconciliationExecutionAllowed: false;
  readonly stripeCliExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly localCommands: typeof stripeWebhookLocalCommands;
  readonly externalCommands: typeof stripeWebhookExternalCommands;
  readonly requiredExternalEvidence: typeof stripeWebhookRequiredExternalEvidence;
}

export interface StripeWebhookArtifactReview {
  readonly artifact: unknown;
  readonly redactedArtifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: boolean;
  readonly requiredExternalEvidence: typeof stripeWebhookRequiredExternalEvidence;
}

export interface StripeWebhookEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly evidence?: Partial<Record<StripeWebhookEvidenceFlag, boolean>>;
}

export interface StripeWebhookEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly requiredCommands: typeof stripeWebhookRuntimeCommands;
  readonly missingCommands: readonly string[];
  readonly requiredArtifacts: typeof stripeWebhookArtifactPaths;
  readonly missingArtifacts: readonly string[];
  readonly requiredEvidence: typeof stripeWebhookEvidenceFlags;
  readonly missingEvidence: readonly StripeWebhookEvidenceFlag[];
  readonly blockers: readonly string[];
}

export const stripeWebhookExecutionPolicy = {
  codexMayClassifyStaticStripeWebhookReadiness: true,
  webhookSecretRequiredForClosure: true,
  replayPersistenceRequiredForClosure: true,
  providerObjectVerificationRequiredForClosure: true,
  dbReconciliationRequiredForClosure: true,
  stripeCliReplayRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies StripeWebhookExecutionPolicy;

export const stripeWebhookRequiredExternalEvidence = [
  "STRIPE_WEBHOOK_SECRET secret-store evidence",
  "provider-backed replay persistence proof",
  "provider object fetch/verification proof",
  "Deposit/Payment/Refund/BookingStateEvent/PaymentAuditLog DB reconciliation proof",
  "provider-object-backed reconciliation proof",
  "Stripe CLI replay transcript",
  "web typecheck output",
  "CI Stripe webhook evidence",
  "secret-safe Stripe webhook artifact review",
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
    command: "capture Stripe SDK raw-body constructEvent adapter and redacted STRIPE_WEBHOOK_SECRET evidence",
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

const stripeWebhookPackageReadiness = buildStripeWebhookRuntimeReadinessPlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  paymentsTestsPassed: false,
  paymentsTypecheckPassed: false,
  webWebhookRouteTestsPassed: false,
  webTypecheckPassed: false,
  stripeSdkInstalled: true,
  constructEventUsesRawBody: true,
  webhookSecretConfigured: false,
  invalidSignatureRejected: true,
  timestampToleranceEnforced: true,
  replayProtectionPersisted: true,
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
  tenantScopedTransactionConfigured: true,
  amountCurrencyMismatchRejected: true,
  unknownEventsLoggedAndIgnored: true,
  stripeCliReplayVerified: false,
});



export const stripeWebhookRuntimeReadiness = {
  ...stripeWebhookPackageReadiness,
  requiredCommands: stripeWebhookRuntimeCommands,
} as const;

export const stripeWebhookRuntimeRequiredEvidence =
  stripeWebhookRuntimeReadiness.requiredEvidence;

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) => {
  const actualSet = new Set(actual ?? []);
  return required.filter((entry) => !actualSet.has(entry));
};

const sensitiveStripeWebhookArtifactKey = /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|stripe|webhook|signature|event|replay|checkout|payment|deposit|refund|dispute|audit|transaction|payload|email|phone|medical|payment|card|customer)/i;

const redactStripeWebhookArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactStripeWebhookArtifactValue(entry, `${path}.${index}`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveStripeWebhookArtifactKey.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, redactStripeWebhookArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  return value;
};

export const stripeWebhookLocalCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "static Stripe webhook raw-body adapter review",
  "static webhook amount/currency mismatch rejection review",
] as const;

export const stripeWebhookExternalCommands = [
  "pnpm --filter @inkroute/web typecheck",
  "pnpm test:unit -- apps/web/tests/payment-routes.test.ts",
  "configure STRIPE_WEBHOOK_SECRET in secret store",
  "provider-backed replay persistence proof",
  "provider object fetch/verification proof",
  "DB reconciliation evidence for supported Stripe events",
  "stripe listen --forward-to localhost:3000/api/webhooks/stripe",
  "stripe trigger checkout.session.completed",
  "stripe trigger payment_intent.payment_failed",
  "stripe trigger charge.refunded",
  "GitHub Actions Stripe webhook evidence job",
] as const;

export const buildStripeWebhookExecutionPlan = (): StripeWebhookExecutionPlan => ({
  policy: stripeWebhookExecutionPolicy,
  commandExecutionAllowed: false,
  webhookSecretExecutionAllowed: false,
  replayStoreExecutionAllowed: false,
  providerObjectExecutionAllowed: false,
  databaseReconciliationExecutionAllowed: false,
  stripeCliExecutionAllowed: false,
  ciExecutionAllowed: false,
  localCommands: stripeWebhookLocalCommands,
  externalCommands: stripeWebhookExternalCommands,
  requiredExternalEvidence: stripeWebhookRequiredExternalEvidence,
});

export const buildRedactedStripeWebhookArtifact = (artifact: unknown): Pick<StripeWebhookArtifactReview, "redactedArtifact" | "redactedPaths"> => {
  const redactedPaths: string[] = [];
  return {
    redactedArtifact: redactStripeWebhookArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
  };
};

export const buildStripeWebhookArtifactReview = (artifact: unknown): StripeWebhookArtifactReview => {
  const redacted = buildRedactedStripeWebhookArtifact(artifact);
  return {
    artifact,
    redactedArtifact: redacted.redactedArtifact,
    redactedPaths: redacted.redactedPaths,
    secretSafe: redacted.redactedPaths.length > 0,
    requiredExternalEvidence: stripeWebhookRequiredExternalEvidence,
  };
};

export const buildStripeWebhookEvidenceDecision = (
  input: StripeWebhookEvidenceInput = {},
): StripeWebhookEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, stripeWebhookRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, stripeWebhookArtifactPaths);
  const missingEvidence = stripeWebhookEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = [
    missingCommands.length > 0 ? "Pinned Stripe webhook commands must be run and captured." : "",
    missingArtifacts.length > 0
      ? "Stripe webhook artifacts must be retained with raw-body, secret, replay, reconciliation, CLI, CI, and secret-safe evidence."
      : "",
    missingEvidence.length > 0
      ? "Stripe constructEvent, replay protection, provider verification, DB reconciliation, audit, transaction, mismatch, CLI, CI, and secret-safe evidence must pass."
      : "",
  ].filter(Boolean);

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    requiredCommands: stripeWebhookRuntimeCommands,
    missingCommands,
    requiredArtifacts: stripeWebhookArtifactPaths,
    missingArtifacts,
    requiredEvidence: stripeWebhookEvidenceFlags,
    missingEvidence,
    blockers,
  };
};



