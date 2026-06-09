import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  paymentOperationsArtifactPaths,
  paymentOperationsRuntimeCommands,
  paymentOperationsRuntimeMatrix,
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
    expect(operationsSource).toContain("persistProviderOperationResult");
    expect(operationsStaticTest).toContain("covers refund, no-show, dispute, receipt, and export actions");
    expect(dashboardPage).toContain("Payment operation write contract");
  });

  it("keeps provider, receipt, tax, auth, E2E, idempotency, and audit blockers explicit", () => {
    expect(paymentOperationsRuntimeReadiness.status).toBe("blocked");
    expect(paymentOperationsRuntimeReadiness.missingScripts).toEqual([]);
    expect(paymentOperationsRuntimeReadiness.requiredCommands).toEqual([...paymentOperationsRuntimeCommands]);
    expect(paymentOperationsRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "authorized dashboard/server actions with cross-tenant denial tests",
      "Stripe test-mode refund transcript and persisted Refund/PaymentAuditLog records",
      "no-show forfeiture action evidence with BookingStateEvent and PaymentAuditLog rows",
      "dispute evidence files and Stripe test-mode dispute sync transcript",
      "generated and delivered receipt evidence with redacted client/payment data",
      "accounting export file, redaction proof, and tax/accounting review approval",
      "idempotency, audit-log, and dashboard E2E evidence for all payment operations",
    ]));
    expect(paymentOperationsRuntimeReadiness.blockers).toContain("Stripe test-mode refund execution must be verified.");
    expect(paymentOperationsRuntimeReadiness.blockers).toContain("Receipt delivery provider must be configured before sending receipts.");
    expect(paymentOperationsRuntimeReadiness.blockers).toContain("Dashboard E2E evidence must cover refund, no-show, dispute, receipt, and export flows.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider/E2E readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 7 payment operations runtime contracts");
    expect(ciWorkflow).toContain("payment-operations-runtime-static.test.ts");
    expect(ciWorkflow).toContain("payment-operations-runtime-artifacts");
    expect(unitManifest).toContain("unit-payment-operations-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/paymentOperationsRuntime.ts");
    expect(gapTracker).toContain("GAP-052 is payment-operations-runtime-matrix wired");
    expect(paymentOperationsArtifactPaths).toContain("coverage/payment-operations-secret-safe-artifacts.json");
  });
});
