import { buildPaymentOperationsRuntimeReadinessPlan } from "@inkroute/payments";

export type PaymentOperationsRuntimeStatus =
  | "wired"
  | "provider-gated"
  | "persistence-gated"
  | "receipt-gated"
  | "export-gated"
  | "review-gated"
  | "auth-gated"
  | "e2e-gated"
  | "ci-gated";

export interface PaymentOperationsRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: PaymentOperationsRuntimeStatus;
}

export const paymentOperationsRuntimeCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm test:unit -- apps/dashboard tests for payment operations",
  "stripe refunds.create test-mode smoke",
  "dashboard payment operations E2E smoke",
] as const;

export const paymentOperationsArtifactPaths = [
  "coverage/payment-operations-runtime.json",
  "coverage/payment-operations-payments-typecheck.txt",
  "coverage/payment-operations-payments-test.txt",
  "coverage/payment-operations-dashboard-typecheck.txt",
  "coverage/payment-operations-dashboard-unit-tests.json",
  "coverage/payment-operations-authorized-actions.json",
  "coverage/payment-operations-stripe-refund-redacted.json",
  "coverage/payment-operations-refund-persistence.json",
  "coverage/payment-operations-no-show-audit.json",
  "coverage/payment-operations-dispute-evidence-redacted.json",
  "coverage/payment-operations-dispute-provider-sync-redacted.json",
  "coverage/payment-operations-receipt-generation.json",
  "coverage/payment-operations-receipt-delivery-redacted.json",
  "coverage/payment-operations-accounting-export-redacted.json",
  "coverage/payment-operations-tax-accounting-approval-redacted.json",
  "coverage/payment-operations-idempotency.json",
  "coverage/payment-operations-audit-log.json",
  "coverage/payment-operations-tenant-authorization.json",
  "coverage/payment-operations-dashboard-e2e-redacted.json",
  "coverage/payment-operations-secret-safe-artifacts.json",
  "test-results/payment-operations-runtime",
] as const;

export const paymentOperationsRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "packages/payments/package.json",
  "packages/payments/src/index.ts",
  "packages/payments/tests/deposit-policy.test.ts",
  "apps/dashboard/lib/paymentOperations.ts",
  "apps/dashboard/lib/paymentOperationsRuntime.ts",
  "apps/dashboard/tests/payment-operations-static.test.ts",
  "apps/dashboard/tests/payment-operations-runtime-static.test.ts",
  "apps/dashboard/app/payments/page.tsx",
  "apps/dashboard/components/PaymentActionPanel.tsx",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export const paymentOperationsEvidenceFlags = [
  "paymentsTypecheckPassed",
  "paymentsTestsPassed",
  "dashboardTypecheckPassed",
  "dashboardOperationTestsPassed",
  "authorizedActionsVerified",
  "stripeRefundSmokePassed",
  "refundPersistenceVerified",
  "noShowAuditPersisted",
  "disputeEvidencePersisted",
  "disputeProviderSyncVerified",
  "receiptGenerationVerified",
  "receiptDeliveryVerified",
  "accountingExportRedactionVerified",
  "taxAccountingReviewApproved",
  "operationIdempotencyVerified",
  "operationAuditLogPersisted",
  "tenantAuthorizationTested",
  "dashboardE2eEvidenceCaptured",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type PaymentOperationsEvidenceFlag = (typeof paymentOperationsEvidenceFlags)[number];

export interface PaymentOperationsExecutionPolicy {
  readonly codexMayClassifyStaticPaymentOperationsReadiness: true;
  readonly stripeRefundRequiredForClosure: true;
  readonly receiptProviderRequiredForClosure: true;
  readonly disputeProviderSyncRequiredForClosure: true;
  readonly accountingExportRequiredForClosure: true;
  readonly taxAccountingReviewRequiredForClosure: true;
  readonly dashboardE2eRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface PaymentOperationsExecutionPlan {
  readonly policy: typeof paymentOperationsExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly stripeRefundExecutionAllowed: false;
  readonly receiptProviderExecutionAllowed: false;
  readonly disputeProviderExecutionAllowed: false;
  readonly accountingExportExecutionAllowed: false;
  readonly taxAccountingReviewExecutionAllowed: false;
  readonly dashboardE2eExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly localCommands: typeof paymentOperationsLocalCommands;
  readonly externalCommands: typeof paymentOperationsExternalCommands;
  readonly requiredExternalEvidence: typeof paymentOperationsRequiredExternalEvidence;
}

export interface PaymentOperationsArtifactReview {
  readonly artifact: unknown;
  readonly redactedArtifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: boolean;
  readonly requiredExternalEvidence: typeof paymentOperationsRequiredExternalEvidence;
}

export interface PaymentOperationsEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly evidence?: Partial<Record<PaymentOperationsEvidenceFlag, boolean>>;
}

export interface PaymentOperationsEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly requiredCommands: typeof paymentOperationsRuntimeCommands;
  readonly missingCommands: readonly string[];
  readonly requiredArtifacts: typeof paymentOperationsArtifactPaths;
  readonly missingArtifacts: readonly string[];
  readonly requiredEvidence: typeof paymentOperationsEvidenceFlags;
  readonly missingEvidence: readonly PaymentOperationsEvidenceFlag[];
  readonly blockers: readonly string[];
}

export const paymentOperationsExecutionPolicy = {
  codexMayClassifyStaticPaymentOperationsReadiness: true,
  stripeRefundRequiredForClosure: true,
  receiptProviderRequiredForClosure: true,
  disputeProviderSyncRequiredForClosure: true,
  accountingExportRequiredForClosure: true,
  taxAccountingReviewRequiredForClosure: true,
  dashboardE2eRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies PaymentOperationsExecutionPolicy;

export const paymentOperationsRequiredExternalEvidence = [
  "Stripe test-mode refund execution proof",
  "no-show audit persistence proof",
  "dispute evidence provider sync proof",
  "receipt provider delivery proof",
  "CSV/accounting export delivery proof after local redaction",
  "executed tax/accounting approval evidence",
  "dashboard payment operations E2E artifacts",
  "dashboard typecheck/test output",
  "CI payment operations evidence",
  "secret-safe payment operations artifact review",
] as const;

export const paymentOperationsRuntimeMatrix = [
  {
    id: "payments-typecheck",
    command: "pnpm --filter @inkroute/payments typecheck",
    artifact: "coverage/payment-operations-payments-typecheck.txt",
    status: "wired",
  },
  {
    id: "payments-tests",
    command: "pnpm --filter @inkroute/payments test",
    artifact: "coverage/payment-operations-payments-test.txt",
    status: "wired",
  },
  {
    id: "dashboard-typecheck",
    command: "pnpm --filter @inkroute/dashboard typecheck",
    artifact: "coverage/payment-operations-dashboard-typecheck.txt",
    status: "ci-gated",
  },
  {
    id: "dashboard-operation-tests",
    command: "pnpm test:unit -- apps/dashboard tests for payment operations",
    artifact: "coverage/payment-operations-dashboard-unit-tests.json",
    status: "ci-gated",
  },
  {
    id: "authorized-actions",
    command: "implement authorized dashboard/server actions for refund, no-show, dispute, receipt, and export workflows",
    artifact: "coverage/payment-operations-authorized-actions.json",
    status: "wired",
  },
  {
    id: "stripe-refund-smoke",
    command: "stripe refunds.create test-mode smoke",
    artifact: "coverage/payment-operations-stripe-refund-redacted.json",
    status: "provider-gated",
  },
  {
    id: "refund-persistence",
    command: "persist Refund, Payment, PaymentAuditLog, and IdempotencyKey writes for refund execution",
    artifact: "coverage/payment-operations-refund-persistence.json",
    status: "persistence-gated",
  },
  {
    id: "no-show-audit",
    command: "persist BookingStateEvent and PaymentAuditLog for no-show forfeiture",
    artifact: "coverage/payment-operations-no-show-audit.json",
    status: "persistence-gated",
  },
  {
    id: "dispute-evidence",
    command: "collect and persist dispute evidence files",
    artifact: "coverage/payment-operations-dispute-evidence-redacted.json",
    status: "wired",
  },
  {
    id: "dispute-provider-sync",
    command: "verify Stripe dispute evidence sync in test mode",
    artifact: "coverage/payment-operations-dispute-provider-sync-redacted.json",
    status: "provider-gated",
  },
  {
    id: "receipt-generation",
    command: "generate stable receipt numbers and receipt rows",
    artifact: "coverage/payment-operations-receipt-generation.json",
    status: "wired",
  },
  {
    id: "receipt-delivery",
    command: "deliver receipt with redacted client/payment data",
    artifact: "coverage/payment-operations-receipt-delivery-redacted.json",
    status: "receipt-gated",
  },
  {
    id: "accounting-export",
    command: "create accounting export with non-accounting PII, medical notes, and provider secrets redacted",
    artifact: "coverage/payment-operations-accounting-export-redacted.json",
    status: "export-gated",
  },
  {
    id: "tax-accounting-review",
    command: "obtain tax/accounting review approval for export fields and retention policy",
    artifact: "coverage/payment-operations-tax-accounting-approval-redacted.json",
    status: "review-gated",
  },
  {
    id: "operation-idempotency",
    command: "claim idempotency keys for refund, no-show, dispute, receipt, and export operations",
    artifact: "coverage/payment-operations-idempotency.json",
    status: "wired",
  },
  {
    id: "operation-audit-log",
    command: "persist PaymentAuditLog evidence for every operation",
    artifact: "coverage/payment-operations-audit-log.json",
    status: "wired",
  },
  {
    id: "tenant-authorization",
    command: "tenant authorization tests deny cross-tenant payment operations",
    artifact: "coverage/payment-operations-tenant-authorization.json",
    status: "auth-gated",
  },
  {
    id: "dashboard-e2e",
    command: "dashboard payment operations E2E smoke",
    artifact: "coverage/payment-operations-dashboard-e2e-redacted.json",
    status: "e2e-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions payment operations evidence job",
    artifact: "coverage/payment-operations-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly PaymentOperationsRuntimeMatrixEntry[];

export const paymentOperationsRuntimeReadiness = buildPaymentOperationsRuntimeReadinessPlan({
  packageScripts: {
    test: "vitest run",
    typecheck: "tsc --noEmit",
  },
  paymentsTestsPassed: false,
  paymentsTypecheckPassed: false,
  dashboardPaymentActionsImplemented: true,
  refundActionAuthorized: true,
  stripeRefundsTestModeVerified: false,
  refundPersistenceConfigured: true,
  noShowForfeitureActionImplemented: true,
  noShowAuditPersistenceConfigured: true,
  disputeEvidenceWorkflowImplemented: true,
  disputeProviderSyncVerified: false,
  receiptGenerationImplemented: true,
  receiptDeliveryProviderConfigured: false,
  receiptDeliveryTested: false,
  accountingExportImplemented: true,
  exportRedactionVerified: true,
  taxAccountingReviewApproved: false,
  idempotencyConfiguredForOperations: true,
  paymentAuditLogPersistedForOperations: true,
  tenantAuthorizationTestsPassed: true,
  dashboardE2eEvidenceAttached: false,
});

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) => {
  const actualSet = new Set(actual ?? []);
  return required.filter((entry) => !actualSet.has(entry));
};

const sensitivePaymentOperationsArtifactKey = /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|stripe|refund|dispute|receipt|export|accounting|tax|audit|payment|deposit|idempotency|email|phone|medical|card|customer)/i;

const redactPaymentOperationsArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactPaymentOperationsArtifactValue(entry, `${path}.${index}`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitivePaymentOperationsArtifactKey.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, redactPaymentOperationsArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  return value;
};

export const paymentOperationsLocalCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "static payment operation preflight/authorization review",
  "static provider-result, receipt, and accounting export redaction review",
] as const;

export const paymentOperationsExternalCommands = [
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm test:unit -- apps/dashboard tests for payment operations",
  "stripe refunds.create test-mode smoke",
  "dashboard payment operations E2E smoke",
  "receipt provider delivery smoke",
  "dispute provider sync evidence",
  "accounting/tax advisor sign-off",
  "GitHub Actions payment operations evidence job",
] as const;

export const buildPaymentOperationsExecutionPlan = (): PaymentOperationsExecutionPlan => ({
  policy: paymentOperationsExecutionPolicy,
  commandExecutionAllowed: false,
  stripeRefundExecutionAllowed: false,
  receiptProviderExecutionAllowed: false,
  disputeProviderExecutionAllowed: false,
  accountingExportExecutionAllowed: false,
  taxAccountingReviewExecutionAllowed: false,
  dashboardE2eExecutionAllowed: false,
  ciExecutionAllowed: false,
  localCommands: paymentOperationsLocalCommands,
  externalCommands: paymentOperationsExternalCommands,
  requiredExternalEvidence: paymentOperationsRequiredExternalEvidence,
});

export const buildRedactedPaymentOperationsArtifact = (artifact: unknown): Pick<PaymentOperationsArtifactReview, "redactedArtifact" | "redactedPaths"> => {
  const redactedPaths: string[] = [];
  return {
    redactedArtifact: redactPaymentOperationsArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
  };
};

export const buildPaymentOperationsArtifactReview = (artifact: unknown): PaymentOperationsArtifactReview => {
  const redacted = buildRedactedPaymentOperationsArtifact(artifact);
  return {
    artifact,
    redactedArtifact: redacted.redactedArtifact,
    redactedPaths: redacted.redactedPaths,
    secretSafe: redacted.redactedPaths.length > 0,
    requiredExternalEvidence: paymentOperationsRequiredExternalEvidence,
  };
};

export const buildPaymentOperationsEvidenceDecision = (
  input: PaymentOperationsEvidenceInput = {},
): PaymentOperationsEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, paymentOperationsRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, paymentOperationsArtifactPaths);
  const missingEvidence = paymentOperationsEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = [
    missingCommands.length > 0 ? "Pinned payment operations commands must be run and captured." : "",
    missingArtifacts.length > 0
      ? "Payment operations artifacts must be retained with provider, receipt, export, review, auth, E2E, CI, and secret-safe evidence."
      : "",
    missingEvidence.length > 0
      ? "Refund, no-show, dispute, receipt, export, tax review, idempotency, audit, tenant authorization, E2E, CI, and secret-safe evidence must pass."
      : "",
  ].filter(Boolean);

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    requiredCommands: paymentOperationsRuntimeCommands,
    missingCommands,
    requiredArtifacts: paymentOperationsArtifactPaths,
    missingArtifacts,
    requiredEvidence: paymentOperationsEvidenceFlags,
    missingEvidence,
    blockers,
  };
};



