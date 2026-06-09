import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  paymentAutomationArtifactPaths,
  paymentAutomationRuntimeCommands,
  paymentAutomationRuntimeMatrix,
  paymentAutomationRuntimeReadiness,
} from "../lib/paymentAutomatedTestsRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("payment automated test runtime contract", () => {
  const paymentsPackageJson = readWorkspaceFile("packages/payments/package.json");
  const paymentsSource = readWorkspaceFile("packages/payments/src/index.ts");
  const paymentsTests = readWorkspaceFile("packages/payments/tests/deposit-policy.test.ts");
  const automationSource = readWorkspaceFile("apps/web/lib/paymentAutomatedTests.ts");
  const automationStaticTest = readWorkspaceFile("apps/web/tests/payment-automation-static.test.ts");
  const paymentRoutesTest = readWorkspaceFile("apps/web/tests/payment-routes.test.ts");
  const checkoutRoute = readWorkspaceFile("apps/web/app/api/public/[tenantSlug]/deposit-sessions/route.ts");
  const webhookRoute = readWorkspaceFile("apps/web/app/api/webhooks/stripe/route.ts");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-054 commands, matrix rows, and artifacts", () => {
    expect(paymentAutomationRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/payments typecheck",
      "pnpm --filter @inkroute/payments test",
      "pnpm vitest run apps/web/tests/payment-routes.test.ts",
      "payment DB reconciliation integration tests",
      "Stripe CLI payment lifecycle tests",
      "Playwright booking-to-paid payment E2E flow",
    ]);
    expect(paymentAutomationRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "payments-typecheck",
      "payments-unit-tests",
      "payment-route-boundary",
      "stripe-signature-tests",
      "stripe-cli-lifecycle",
      "db-reconciliation",
      "booking-to-paid-e2e",
      "refund-no-show-dispute",
      "receipt-export",
      "cross-tenant-payment",
      "replay-idempotency",
      "ci-payment-job",
      "artifact-retention",
      "secret-safe-artifacts",
    ]);
    expect(paymentAutomationArtifactPaths).toContain("coverage/payment-automation-runtime.json");
    expect(paymentAutomationArtifactPaths).toContain("test-results/payment-automation-runtime");
  });

  it("keeps package helper, existing automation contract, routes, and static payment tests wired", () => {
    expect(paymentsPackageJson).toContain('"typecheck"');
    expect(paymentsPackageJson).toContain('"test"');
    expect(paymentsSource).toContain("buildPaymentAutomatedTestReadinessPlan");
    expect(paymentsTests).toContain("buildPaymentAutomatedTestReadinessPlan");
    expect(automationSource).toContain("paymentAutomatedTestSuites");
    expect(automationSource).toContain("stripe-cli-lifecycle");
    expect(automationSource).toContain("payment-db-reconciliation");
    expect(automationStaticTest).toContain("enumerates the full Phase 7 payment lifecycle test matrix");
    expect(paymentRoutesTest).toContain("deposit");
    expect(checkoutRoute).toContain("deposit");
    expect(webhookRoute).toContain("webhookContract");
  });

  it("keeps Stripe CLI, DB reconciliation, E2E, tenant isolation, replay, CI, and artifact blockers explicit", () => {
    expect(paymentAutomationRuntimeReadiness.status).toBe("blocked");
    expect(paymentAutomationRuntimeReadiness.missingScripts).toEqual([]);
    expect(paymentAutomationRuntimeReadiness.requiredCommands).toEqual([...paymentAutomationRuntimeCommands]);
    expect(paymentAutomationRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "payment helper, route-boundary, and Stripe signature test output",
      "Stripe CLI lifecycle transcript for checkout success/failure/expiration/refund/dispute/replay",
      "seeded DB reconciliation, tenant isolation, and idempotent replay test output",
      "Playwright/dashboard E2E evidence for booking-to-paid, refund/no-show/dispute, receipt, and export flows",
      "CI payment test job configuration and retained artifacts",
    ]));
    expect(paymentAutomationRuntimeReadiness.blockers).toContain("Stripe CLI lifecycle tests must cover checkout completed, failed payment, expired checkout, refund, dispute, invalid signature, and replay.");
    expect(paymentAutomationRuntimeReadiness.blockers).toContain("DB reconciliation tests must prove Deposit, Payment, Refund, BookingStateEvent, PaymentAuditLog, and IdempotencyKey writes.");
    expect(paymentAutomationRuntimeReadiness.blockers).toContain("Payment test artifacts must capture Stripe CLI logs, DB reconciliation output, and E2E screenshots/traces.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming Stripe/DB/E2E evidence", () => {
    expect(ciWorkflow).toContain("Run Phase 7 payment automation runtime contracts");
    expect(ciWorkflow).toContain("payment-automation-runtime-static.test.ts");
    expect(ciWorkflow).toContain("payment-automation-runtime-artifacts");
    expect(unitManifest).toContain("unit-payment-automation-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/paymentAutomatedTestsRuntime.ts");
    expect(gapTracker).toContain("GAP-054 is payment-automation-runtime-matrix wired");
    expect(paymentAutomationArtifactPaths).toContain("coverage/payment-automation-secret-safe-artifacts.json");
  });
});
