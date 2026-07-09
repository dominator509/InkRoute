import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildPaymentOperationsArtifactReview,
  buildPaymentOperationsEvidenceDecision,
  buildPaymentOperationsExecutionPlan,
  buildRedactedPaymentOperationsArtifact,
  paymentOperationsArtifactPaths,
  paymentOperationsEvidenceFlags,
  paymentOperationsExternalCommands,
  paymentOperationsLocalCommands,
  paymentOperationsRequiredExternalEvidence,
  paymentOperationsRuntimeCommands,
  paymentOperationsRuntimeMatrix,
  paymentOperationsRuntimeProofFiles,
  paymentOperationsRuntimeReadiness,
} from "../lib/paymentOperationsRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("payment operations runtime contract", () => {
  const paymentsPackageJson = readWorkspaceFile("packages/payments/package.json");
  const paymentsSource = readWorkspaceFile("packages/payments/src/index.ts");
  const paymentsTests = readWorkspaceFile("packages/payments/tests/deposit-policy.test.ts");
  const operationsSource = readWorkspaceFile("apps/dashboard/lib/paymentOperations.ts");
  const operationsStaticTest = readWorkspaceFile("apps/dashboard/tests/payment-operations-static.test.ts");
  const dashboardPage = readWorkspaceFile("apps/dashboard/app/payments/page.tsx");
  const paymentActionPanel = readWorkspaceFile("apps/dashboard/components/PaymentActionPanel.tsx");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-052 commands, matrix rows, and artifacts", () => {
    expect(paymentOperationsRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/payments typecheck",
      "pnpm --filter @inkroute/payments test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm test:unit -- apps/dashboard tests for payment operations",
      "stripe refunds.create test-mode smoke",
      "dashboard payment operations E2E smoke",
    ]);
    expect(paymentOperationsRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "payments-typecheck",
      "payments-tests",
      "dashboard-typecheck",
      "dashboard-operation-tests",
      "authorized-actions",
      "stripe-refund-smoke",
      "refund-persistence",
      "no-show-audit",
      "dispute-evidence",
      "dispute-provider-sync",
      "receipt-generation",
      "receipt-delivery",
      "accounting-export",
      "tax-accounting-review",
      "operation-idempotency",
      "operation-audit-log",
      "tenant-authorization",
      "dashboard-e2e",
      "ci-secret-safe-evidence",
    ]);
    expect(paymentOperationsArtifactPaths).toContain("coverage/payment-operations-runtime.json");
    expect(paymentOperationsArtifactPaths).toContain("test-results/payment-operations-runtime");
  });

  it("pins current payment operations proof files for GAP-052", () => {
    expect(paymentOperationsRuntimeProofFiles).toEqual(expect.arrayContaining([
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
    ]));
    for (const file of paymentOperationsRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps package helper, operation contract, mutation controls, and dashboard surfacing wired", () => {
    expect(paymentsPackageJson).toContain('"typecheck"');
    expect(paymentsPackageJson).toContain('"test"');
    expect(paymentsSource).toContain("buildPaymentOperationsWorkflowPlan");
    expect(paymentsSource).toContain("buildPaymentOperationsRuntimeReadinessPlan");
    expect(paymentsSource).toContain("generateReceiptNumber");
    expect(paymentsSource).toContain("createReceiptExportRow");
    expect(paymentsTests).toContain("buildPaymentOperationsRuntimeReadinessPlan");
    expect(operationsSource).toContain("PaymentOperationsRepository");
    expect(operationsSource).toContain("executePaymentOperationMutation");
    expect(operationsSource).toContain("buildPaymentOperationPreflightDecision");
    expect(operationsSource).toContain("authorizePaymentOperationTenant");
    expect(operationsSource).toContain("Payment operation tenant scope does not match payment tenant.");
    expect(operationsSource.indexOf("authorizePaymentOperationTenant")).toBeLessThan(operationsSource.indexOf("claimIdempotencyKey"));
    expect(operationsSource.indexOf("authorizePaymentOperationTenant")).toBeLessThan(operationsSource.indexOf("executeProviderCall"));
    expect(operationsSource).toContain("buildRedactedPaymentOperationProviderResult");
    expect(operationsSource).toContain("sanitizePaymentOperationProviderResult");
    expect(operationsSource).toContain("buildRedactedReceiptDeliveryPayload");
    expect(operationsSource).toContain("buildRedactedAccountingExportPayload");
    expect(operationsSource).toContain("accountingExportPrivateKeys");
    expect(operationsSource).toContain("paymentOperationProviderPrivateKeys");
    expect(operationsSource.indexOf("sanitizePaymentOperationProviderResult")).toBeLessThan(
      operationsSource.indexOf("persistProviderOperationResult"),
    );
    expect(operationsSource).toContain("PaymentOperationPreflightDecision");
    expect(operationsSource).toContain("requiresProviderCall");
    expect(operationsSource).toContain("requiresReceiptDelivery");
    expect(operationsSource).toContain("requiresExportReview");
    expect(operationsSource).toContain("persistProviderOperationResult");
    expect(operationsStaticTest).toContain("covers refund, no-show, dispute, receipt, and export actions");
    expect(operationsStaticTest).toContain("denies cross-tenant, anonymous, and unauthorized payment operations");
    expect(operationsStaticTest).toContain("redacts provider operation payload secrets and client-private fields");
    expect(operationsStaticTest).toContain("re-sanitizes provider callback results before persistence");
    expect(operationsStaticTest).toContain("builds receipt delivery payloads without raw recipient or client-private data");
    expect(operationsStaticTest).toContain("builds accounting export payloads with client and provider-private fields redacted");
    expect(operationsStaticTest).toContain("executes operation mutation through auth, idempotency, sanitized provider persistence, and redacted return data");
    expect(operationsStaticTest).toContain("Stripe refund execution must be enabled");
    expect(dashboardPage).toContain("Payment operation write contract");
    expect(dashboardPage).toContain("PaymentActionPanel");
    expect(paymentActionPanel).toContain("create_deposit_session");
    expect(paymentActionPanel).toContain("does not call Stripe");
    expect(paymentActionPanel).toContain("webhook reconciliation remain evidence-gated");
  });

  it("keeps provider, receipt, tax, auth, E2E, idempotency, and audit blockers explicit", () => {
    expect(paymentOperationsRuntimeReadiness.status).toBe("blocked");
    expect(paymentOperationsRuntimeReadiness.missingScripts).toEqual([]);
    expect(paymentOperationsRuntimeReadiness.requiredCommands).toBe(paymentOperationsRuntimeCommands);
    expect(paymentOperationsRuntimeReadiness.requiredEvidence).toBe(paymentOperationsEvidenceFlags);
    expect(paymentOperationsRuntimeReadiness.blockers).toContain("Dashboard/server payment operation action evidence must be captured before payment operations readiness.");
    expect(paymentOperationsRuntimeReadiness.blockers).toContain("Stripe test-mode refund execution must be verified.");
    expect(paymentOperationsRuntimeReadiness.blockers).toContain("No-show forfeiture action evidence must be captured before payment operations readiness.");
    expect(paymentOperationsRuntimeReadiness.blockers).toContain("Accounting export workflow evidence must be captured before payment operations readiness.");
    expect(paymentOperationsRuntimeReadiness.blockers).not.toContain("Dashboard/server payment operation actions must be implemented.");
    expect(paymentOperationsRuntimeReadiness.blockers).not.toContain("No-show forfeiture action must be implemented.");
    expect(paymentOperationsRuntimeReadiness.blockers).not.toContain("Accounting export workflow must be implemented.");
    expect(paymentOperationsRuntimeReadiness.blockers).toContain("Receipt delivery provider must be configured before sending receipts.");
    expect(paymentOperationsRuntimeReadiness.blockers).not.toContain("Tenant authorization tests must deny cross-tenant payment operations.");
    expect(paymentOperationsRuntimeReadiness.blockers).toContain("Dashboard E2E evidence must cover refund, no-show, dispute, receipt, and export flows.");
  });

  it("classifies GAP-052 as blocked until payment operations evidence is complete", () => {
    const decision = buildPaymentOperationsEvidenceDecision({
      commands: ["pnpm --filter @inkroute/payments typecheck"],
      artifacts: ["coverage/payment-operations-runtime.json"],
      evidence: { paymentsTypecheckPassed: true },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("dashboard payment operations E2E smoke");
    expect(decision.missingArtifacts).toContain("coverage/payment-operations-secret-safe-artifacts.json");
    expect(decision.missingEvidence).toContain("secretSafeArtifactsCaptured");
    expect(decision.blockers).toContain("Pinned payment operations commands must be run and captured.");
  });

  it("classifies GAP-052 as complete when all payment operations commands, artifacts, and evidence are present", () => {
    const decision = buildPaymentOperationsEvidenceDecision({
      commands: paymentOperationsRuntimeCommands,
      artifacts: paymentOperationsArtifactPaths,
      evidence: Object.fromEntries(paymentOperationsEvidenceFlags.map((flag) => [flag, true])),
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("keeps GAP-052 execution policy non-executing and external evidence explicit", () => {
    const plan = buildPaymentOperationsExecutionPlan();

    expect(plan.policy.codexMayClassifyStaticPaymentOperationsReadiness).toBe(true);
    expect(plan.policy.stripeRefundRequiredForClosure).toBe(true);
    expect(plan.policy.receiptProviderRequiredForClosure).toBe(true);
    expect(plan.policy.disputeProviderSyncRequiredForClosure).toBe(true);
    expect(plan.policy.accountingExportRequiredForClosure).toBe(true);
    expect(plan.policy.taxAccountingReviewRequiredForClosure).toBe(true);
    expect(plan.policy.dashboardE2eRequiredForClosure).toBe(true);
    expect(plan.policy.secretSafeArtifactsRequiredForClosure).toBe(true);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.stripeRefundExecutionAllowed).toBe(false);
    expect(plan.receiptProviderExecutionAllowed).toBe(false);
    expect(plan.disputeProviderExecutionAllowed).toBe(false);
    expect(plan.accountingExportExecutionAllowed).toBe(false);
    expect(plan.taxAccountingReviewExecutionAllowed).toBe(false);
    expect(plan.dashboardE2eExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(paymentOperationsLocalCommands);
    expect(plan.externalCommands).toBe(paymentOperationsExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(paymentOperationsRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("secret-safe payment operations artifact review");
  });

  it("redacts GAP-052 payment operation artifacts before secret-safe review", () => {
    const artifact = {
      stripeRefundId: "re_private",
      receiptRecipientEmail: "client@example.test",
      accountingExportUrl: "https://private/export.csv",
      taxAdvisorToken: "tax_private",
      nested: {
        disputeProviderPayload: "provider_private",
        publicSummary: "payment operations evidence captured",
      },
      safeNote:
        "evidence_payment_operations_01HZYXZYXZYXZYXZYXZYXZYXZ wrote artifacts/payment-operations/private-proof.json",
      safeRefundPath: "test-results/payment-operations-runtime/private-refund.json",
      safeStripeRun: "stripe_run_01HZYXZYXZYXZYXZYXZYXZYXZ",
    };

    const redacted = buildRedactedPaymentOperationsArtifact(artifact);
    expect(redacted.redactedPaths).toEqual([
      "stripeRefundId",
      "receiptRecipientEmail",
      "accountingExportUrl",
      "taxAdvisorToken",
      "nested.disputeProviderPayload",
      "safeNote",
      "safeRefundPath",
      "safeStripeRun",
    ]);
    expect(redacted.redactedArtifact).toMatchObject({
      stripeRefundId: "[REDACTED]",
      receiptRecipientEmail: "[REDACTED]",
      accountingExportUrl: "[REDACTED]",
      taxAdvisorToken: "[REDACTED]",
      nested: {
        disputeProviderPayload: "[REDACTED]",
        publicSummary: "payment operations evidence captured",
      },
      safeRefundPath: "[REDACTED]",
      safeStripeRun: "[REDACTED]",
    });
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "evidence_payment_operations_01HZYXZYXZYXZYXZYXZYXZYXZ",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "artifacts/payment-operations/private-proof.json",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "test-results/payment-operations-runtime/private-refund.json",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "stripe_run_01HZYXZYXZYXZYXZYXZYXZYXZ",
    );

    const review = buildPaymentOperationsArtifactReview({
      publicSummary: "safe payment operations evidence",
      paymentAuditLog: "audit_private",
    });
    expect(review.secretSafe).toBe(true);
    expect(review.redactedPaths).toEqual(["paymentAuditLog"]);
    expect(review.requiredExternalEvidence).toBe(paymentOperationsRequiredExternalEvidence);
    expect(review.requiredExternalEvidence).toContain("dashboard payment operations E2E artifacts");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider/E2E readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 7 payment operations runtime contracts");
    expect(ciWorkflow).toContain("payment-operations-runtime-static.test.ts");
    expect(ciWorkflow).toContain("payment-operations-runtime-artifacts");
    expect(unitManifest).toContain("unit-payment-operations-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/paymentOperationsRuntime.ts");
    expect(gapTracker).toContain("GAP-052 is payment-operations-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildPaymentOperationsExecutionPlan");
    expect(gapTracker).toContain("paymentOperationsExecutionPolicy");
    expect(gapTracker).toContain("paymentOperationsRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedPaymentOperationsArtifact");
    expect(gapTracker).toContain("buildPaymentOperationsArtifactReview");
    expect(paymentOperationsArtifactPaths).toContain("coverage/payment-operations-secret-safe-artifacts.json");
  });
});


