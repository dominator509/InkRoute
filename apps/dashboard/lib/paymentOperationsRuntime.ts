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
  tenantAuthorizationTestsPassed: false,
  dashboardE2eEvidenceAttached: false,
});
