import { buildPaymentPersistenceRuntimeReadinessPlan } from "@inkroute/payments";

export type PaymentPersistenceRuntimeStatus =
  | "wired"
  | "db-gated"
  | "transaction-gated"
  | "idempotency-gated"
  | "audit-gated"
  | "isolation-gated"
  | "integration-gated"
  | "ci-gated";

export interface PaymentPersistenceRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: PaymentPersistenceRuntimeStatus;
}

export const paymentPersistenceRuntimeCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "pnpm --filter @inkroute/db prisma validate",
  "payment persistence seeded Postgres integration tests",
  "dashboard payment repository route/action tests",
] as const;

export const paymentPersistenceArtifactPaths = [
  "coverage/payment-persistence-runtime.json",
  "coverage/payment-persistence-payments-typecheck.txt",
  "coverage/payment-persistence-payments-test.txt",
  "coverage/payment-persistence-prisma-validate.txt",
  "coverage/payment-persistence-repository-contract.json",
  "coverage/payment-persistence-tenant-scope.json",
  "coverage/payment-persistence-transactions.json",
  "coverage/payment-persistence-idempotency.json",
  "coverage/payment-persistence-deposit-create.json",
  "coverage/payment-persistence-provider-session.json",
  "coverage/payment-persistence-paid-failed-transitions.json",
  "coverage/payment-persistence-refund-dispute-transitions.json",
  "coverage/payment-persistence-audit-log.json",
  "coverage/payment-persistence-booking-state-event.json",
  "coverage/payment-persistence-cross-tenant-denial.json",
  "coverage/payment-persistence-replay-idempotency.json",
  "coverage/payment-persistence-seeded-postgres.json",
  "coverage/payment-persistence-dashboard-repository-reads.json",
  "coverage/payment-persistence-secret-safe-artifacts.json",
  "test-results/payment-persistence-runtime",
] as const;

export const paymentPersistenceRuntimeProofFiles = [
  "packages/db/package.json",
  "packages/db/prisma/schema.prisma",
  "packages/payments/package.json",
  "packages/payments/src/index.ts",
  "packages/payments/tests/deposit-policy.test.ts",
  "apps/dashboard/lib/paymentPersistence.ts",
  "apps/dashboard/lib/paymentPersistenceRuntime.ts",
  "apps/dashboard/tests/payment-persistence-static.test.ts",
  "apps/dashboard/tests/payment-persistence-runtime-static.test.ts",
  "apps/dashboard/app/payments/page.tsx",
  "apps/dashboard/components/PaymentActionPanel.tsx",
  "apps/dashboard/app/api/payments/route.ts",
  "apps/dashboard/app/api/payments/[paymentId]/route.ts",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export const paymentPersistenceEvidenceFlags = [
  "paymentsTypecheckPassed",
  "paymentsTestsPassed",
  "prismaValidatePassed",
  "repositoryContractImplemented",
  "tenantScopeVerified",
  "transactionalMutationsVerified",
  "idempotencyStoreVerified",
  "depositCreatePersisted",
  "providerSessionPersisted",
  "paidFailedTransitionsPersisted",
  "refundDisputeTransitionsPersisted",
  "paymentAuditLogPersisted",
  "bookingStateEventPersisted",
  "crossTenantDenialTested",
  "replayIdempotencyTested",
  "seededPostgresIntegrationPassed",
  "dashboardRepositoryReadsVerified",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type PaymentPersistenceEvidenceFlag = (typeof paymentPersistenceEvidenceFlags)[number];

export interface PaymentPersistenceExecutionPolicy {
  readonly codexMayClassifyStaticPaymentPersistenceReadiness: true;
  readonly prismaTransactionRequiredForClosure: true;
  readonly dbBackedIdempotencyRequiredForClosure: true;
  readonly lifecyclePersistenceRequiredForClosure: true;
  readonly auditPersistenceRequiredForClosure: true;
  readonly seededPostgresRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface PaymentPersistenceExecutionPlan {
  readonly policy: typeof paymentPersistenceExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly prismaExecutionAllowed: false;
  readonly databaseTransactionExecutionAllowed: false;
  readonly seededPostgresExecutionAllowed: false;
  readonly crossTenantMutationExecutionAllowed: false;
  readonly dashboardRouteExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly localCommands: typeof paymentPersistenceLocalCommands;
  readonly externalCommands: typeof paymentPersistenceExternalCommands;
  readonly requiredExternalEvidence: typeof paymentPersistenceRequiredExternalEvidence;
}

export interface PaymentPersistenceArtifactReview {
  readonly artifact: unknown;
  readonly redactedArtifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: boolean;
  readonly requiredExternalEvidence: typeof paymentPersistenceRequiredExternalEvidence;
}

export interface PaymentPersistenceEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly evidence?: Partial<Record<PaymentPersistenceEvidenceFlag, boolean>>;
}

export interface PaymentPersistenceEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly requiredCommands: typeof paymentPersistenceRuntimeCommands;
  readonly missingCommands: readonly string[];
  readonly requiredArtifacts: typeof paymentPersistenceArtifactPaths;
  readonly missingArtifacts: readonly string[];
  readonly requiredEvidence: typeof paymentPersistenceEvidenceFlags;
  readonly missingEvidence: readonly PaymentPersistenceEvidenceFlag[];
  readonly blockers: readonly string[];
}

export const paymentPersistenceExecutionPolicy = {
  codexMayClassifyStaticPaymentPersistenceReadiness: true,
  prismaTransactionRequiredForClosure: true,
  dbBackedIdempotencyRequiredForClosure: true,
  lifecyclePersistenceRequiredForClosure: true,
  auditPersistenceRequiredForClosure: true,
  seededPostgresRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies PaymentPersistenceExecutionPolicy;

export const paymentPersistenceRequiredExternalEvidence = [
  "real Prisma transaction execution proof",
  "DB-backed idempotency persistence proof",
  "deposit/session/paid/failed/refund/dispute persistence proof",
  "PaymentAuditLog persistence proof",
  "BookingStateEvent write proof",
  "cross-tenant mutation denial tests",
  "DB-backed replay idempotency tests",
  "seeded Postgres integration tests",
  "dashboard repository read proof",
  "CI payment persistence evidence",
  "secret-safe payment persistence artifact review",
] as const;

export const paymentPersistenceRuntimeMatrix = [
  {
    id: "payments-typecheck",
    command: "pnpm --filter @inkroute/payments typecheck",
    artifact: "coverage/payment-persistence-payments-typecheck.txt",
    status: "wired",
  },
  {
    id: "payments-tests",
    command: "pnpm --filter @inkroute/payments test",
    artifact: "coverage/payment-persistence-payments-test.txt",
    status: "wired",
  },
  {
    id: "prisma-validate",
    command: "pnpm --filter @inkroute/db prisma validate",
    artifact: "coverage/payment-persistence-prisma-validate.txt",
    status: "db-gated",
  },
  {
    id: "repository-contract",
    command: "implement TenantPaymentRepository with Prisma-backed methods",
    artifact: "coverage/payment-persistence-repository-contract.json",
    status: "wired",
  },
  {
    id: "tenant-scope",
    command: "assert tenant scope before every payment read/write",
    artifact: "coverage/payment-persistence-tenant-scope.json",
    status: "wired",
  },
  {
    id: "lifecycle-transactions",
    command: "run Deposit, Payment, Refund, PaymentAuditLog, BookingStateEvent, and IdempotencyKey writes in database transactions",
    artifact: "coverage/payment-persistence-transactions.json",
    status: "transaction-gated",
  },
  {
    id: "idempotency-store",
    command: "persist idempotency keys for provider sessions, webhooks, refunds, and retries",
    artifact: "coverage/payment-persistence-idempotency.json",
    status: "idempotency-gated",
  },
  {
    id: "deposit-create",
    command: "persist Deposit and initial PaymentAuditLog records",
    artifact: "coverage/payment-persistence-deposit-create.json",
    status: "db-gated",
  },
  {
    id: "provider-session",
    command: "persist provider Checkout session ids and redirect URLs after Stripe creation",
    artifact: "coverage/payment-persistence-provider-session.json",
    status: "db-gated",
  },
  {
    id: "paid-failed-transitions",
    command: "persist paid and failed payment transitions",
    artifact: "coverage/payment-persistence-paid-failed-transitions.json",
    status: "db-gated",
  },
  {
    id: "refund-dispute-transitions",
    command: "persist refund and dispute lifecycle transitions",
    artifact: "coverage/payment-persistence-refund-dispute-transitions.json",
    status: "db-gated",
  },
  {
    id: "payment-audit-log",
    command: "persist PaymentAuditLog for every lifecycle mutation",
    artifact: "coverage/payment-persistence-audit-log.json",
    status: "audit-gated",
  },
  {
    id: "booking-state-event",
    command: "persist BookingStateEvent rows for booking-affecting payment lifecycle changes",
    artifact: "coverage/payment-persistence-booking-state-event.json",
    status: "audit-gated",
  },
  {
    id: "cross-tenant-denial",
    command: "seeded Postgres cross-tenant payment repository denial tests",
    artifact: "coverage/payment-persistence-cross-tenant-denial.json",
    status: "isolation-gated",
  },
  {
    id: "replay-idempotency",
    command: "seeded Postgres idempotent replay tests",
    artifact: "coverage/payment-persistence-replay-idempotency.json",
    status: "idempotency-gated",
  },
  {
    id: "seeded-postgres",
    command: "payment persistence seeded Postgres integration tests",
    artifact: "coverage/payment-persistence-seeded-postgres.json",
    status: "integration-gated",
  },
  {
    id: "dashboard-repository-reads",
    command: "dashboard payment repository route/action tests",
    artifact: "coverage/payment-persistence-dashboard-repository-reads.json",
    status: "ci-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions payment persistence evidence job",
    artifact: "coverage/payment-persistence-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly PaymentPersistenceRuntimeMatrixEntry[];

export const paymentPersistenceRuntimeReadiness = buildPaymentPersistenceRuntimeReadinessPlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  paymentsTestsPassed: false,
  paymentsTypecheckPassed: false,
  dbSchemaIncludesPaymentModels: true,
  repositoriesImplemented: true,
  tenantScopedQueriesEnforced: true,
  transactionalMutationsImplemented: true,
  idempotencyStoreImplemented: true,
  depositCreationPersisted: true,
  providerSessionPersisted: true,
  paidTransitionPersisted: true,
  failedTransitionPersisted: true,
  refundTransitionPersisted: true,
  disputeTransitionPersisted: true,
  paymentAuditLogPersistedForEveryMutation: true,
  bookingStateEventPersistedForLifecycleChanges: true,
  crossTenantIsolationTestsPassed: false,
  replayIdempotencyTestsPassed: true,
  seededPostgresIntegrationTestsPassed: false,
  dashboardPaymentReadsUseRepository: true,
});

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) => {
  const actualSet = new Set(actual ?? []);
  return required.filter((entry) => !actualSet.has(entry));
};

const sensitivePaymentPersistenceArtifactKey = /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|payment|deposit|refund|dispute|audit|booking|idempotency|transaction|postgres|prisma|email|phone|medical|card|customer)/i;

const redactPaymentPersistenceArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactPaymentPersistenceArtifactValue(entry, `${path}.${index}`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitivePaymentPersistenceArtifactKey.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, redactPaymentPersistenceArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  return value;
};

export const paymentPersistenceLocalCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "static TenantPaymentRepository contract review",
  "static payment lifecycle transition/idempotency review",
] as const;

export const paymentPersistenceExternalCommands = [
  "pnpm --filter @inkroute/db prisma validate",
  "payment persistence seeded Postgres integration tests",
  "dashboard payment repository route/action tests",
  "cross-tenant payment mutation denial tests",
  "DB-backed replay-safe mutation proof",
  "GitHub Actions payment persistence evidence job",
] as const;

export const buildPaymentPersistenceExecutionPlan = (): PaymentPersistenceExecutionPlan => ({
  policy: paymentPersistenceExecutionPolicy,
  commandExecutionAllowed: false,
  prismaExecutionAllowed: false,
  databaseTransactionExecutionAllowed: false,
  seededPostgresExecutionAllowed: false,
  crossTenantMutationExecutionAllowed: false,
  dashboardRouteExecutionAllowed: false,
  ciExecutionAllowed: false,
  localCommands: paymentPersistenceLocalCommands,
  externalCommands: paymentPersistenceExternalCommands,
  requiredExternalEvidence: paymentPersistenceRequiredExternalEvidence,
});

export const buildRedactedPaymentPersistenceArtifact = (artifact: unknown): Pick<PaymentPersistenceArtifactReview, "redactedArtifact" | "redactedPaths"> => {
  const redactedPaths: string[] = [];
  return {
    redactedArtifact: redactPaymentPersistenceArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
  };
};

export const buildPaymentPersistenceArtifactReview = (artifact: unknown): PaymentPersistenceArtifactReview => {
  const redacted = buildRedactedPaymentPersistenceArtifact(artifact);
  return {
    artifact,
    redactedArtifact: redacted.redactedArtifact,
    redactedPaths: redacted.redactedPaths,
    secretSafe: redacted.redactedPaths.length > 0,
    requiredExternalEvidence: paymentPersistenceRequiredExternalEvidence,
  };
};

export const buildPaymentPersistenceEvidenceDecision = (
  input: PaymentPersistenceEvidenceInput = {},
): PaymentPersistenceEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, paymentPersistenceRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, paymentPersistenceArtifactPaths);
  const missingEvidence = paymentPersistenceEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = [
    missingCommands.length > 0 ? "Pinned payment persistence commands must be run and captured." : "",
    missingArtifacts.length > 0
      ? "Payment persistence artifacts must be retained with Prisma, transaction, lifecycle, audit, isolation, integration, CI, and secret-safe evidence."
      : "",
    missingEvidence.length > 0
      ? "Prisma validation, transaction/idempotency, lifecycle persistence, audit, tenant isolation, seeded Postgres, dashboard reads, CI, and secret-safe evidence must pass."
      : "",
  ].filter(Boolean);

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    requiredCommands: paymentPersistenceRuntimeCommands,
    missingCommands,
    requiredArtifacts: paymentPersistenceArtifactPaths,
    missingArtifacts,
    requiredEvidence: paymentPersistenceEvidenceFlags,
    missingEvidence,
    blockers,
  };
};



