import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildPaymentAutomationArtifactReview,
  buildPaymentAutomationEvidenceDecision,
  buildPaymentAutomationExecutionPlan,
  buildRedactedPaymentAutomationArtifact,
  paymentAutomationDecisionRequiredEvidence,
  paymentAutomationExternalCommands,
  paymentAutomationExecutionPolicy,
  paymentAutomationArtifactPaths,
  paymentAutomationLocalCommands,
  paymentAutomationRequiredExternalEvidence,
  paymentAutomationRuntimeCommands,
  paymentAutomationRuntimeMatrix,
  paymentAutomationRuntimeProofFiles,
  paymentAutomationRuntimeReadiness,
} from "../lib/paymentAutomatedTestsRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("payment automated test runtime contract", () => {
  const paymentsPackageJson = readWorkspaceFile("packages/payments/package.json");
  const pnpmLock = readWorkspaceFile("pnpm-lock.yaml");
  const paymentsSource = readWorkspaceFile("packages/payments/src/index.ts");
  const paymentsTests = readWorkspaceFile("packages/payments/tests/deposit-policy.test.ts");
  const automationSource = readWorkspaceFile("apps/web/lib/paymentAutomatedTests.ts");
  const automationStaticTest = readWorkspaceFile("apps/web/tests/payment-automation-static.test.ts");
  const webhookSource = readWorkspaceFile("apps/web/lib/stripeWebhook.ts");
  const webhookStaticTest = readWorkspaceFile("apps/web/tests/stripe-webhook-static.test.ts");
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

  it("pins current payment automation proof files for GAP-054", () => {
    expect(paymentAutomationRuntimeProofFiles).toEqual(expect.arrayContaining([
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
    ]));
    for (const file of paymentAutomationRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps package helper, existing automation contract, routes, and static payment tests wired", () => {
    expect(paymentsPackageJson).toContain('"typecheck"');
    expect(paymentsPackageJson).toContain('"test"');
    expect(paymentsPackageJson).toContain('"stripe"');
    expect(pnpmLock).toContain("stripe:");
    expect(pnpmLock).toContain("specifier: ^22.2.1");
    expect(paymentsSource).toContain("buildPaymentAutomatedTestReadinessPlan");
    expect(paymentsTests).toContain("buildPaymentAutomatedTestReadinessPlan");
    expect(automationSource).toContain("paymentAutomatedTestSuites");
    expect(automationSource).toContain("stripe-cli-lifecycle");
    expect(automationSource).toContain("payment-db-reconciliation");
    expect(automationStaticTest).toContain("enumerates the full Phase 7 payment lifecycle test matrix");
    expect(paymentRoutesTest).toContain("deposit");
    expect(checkoutRoute).toContain("deposit");
    expect(checkoutRoute).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(paymentRoutesTest).toContain('response.headers.get("Cache-Control")).toBe("no-store")');
    expect(webhookRoute).toContain("webhookContract");
    expect(webhookRoute).toContain("Stripe-Signature");
    expect(webhookSource).toContain("constructStripeWebhookEventWithRawBody");
    expect(webhookStaticTest).toContain("verifyStripeWebhookMoneyMatch");
  });

  it("keeps Stripe CLI, DB reconciliation, E2E, tenant isolation, replay, CI, and artifact blockers explicit", () => {
    expect(paymentAutomationRuntimeReadiness.status).toBe("blocked");
    expect(paymentAutomationRuntimeReadiness.missingScripts).toEqual([]);
    expect(paymentAutomationRuntimeReadiness.requiredCommands).toBe(paymentAutomationRuntimeCommands);
    expect(paymentAutomationRuntimeReadiness.requiredEvidence).toBe(paymentAutomationDecisionRequiredEvidence);
    expect(paymentAutomationRuntimeReadiness.blockers).not.toContain("Stripe SDK signature verification tests must pass.");
    expect(paymentAutomationRuntimeReadiness.blockers).toContain("Stripe CLI lifecycle tests must cover checkout completed, failed payment, expired checkout, refund, dispute, invalid signature, and replay.");
    expect(paymentAutomationRuntimeReadiness.blockers).toContain("DB reconciliation tests must prove Deposit, Payment, Refund, BookingStateEvent, PaymentAuditLog, and IdempotencyKey writes.");
    expect(paymentAutomationRuntimeReadiness.blockers).toContain("Payment test artifacts must capture Stripe CLI logs, DB reconciliation output, and E2E screenshots/traces.");
  });

  it("classifies real payment automation evidence before GAP-054 can close", () => {
    const blockedDecision = buildPaymentAutomationEvidenceDecision({
      paymentsTypecheckPassed: true,
      paymentsUnitTestsPassed: true,
      routeBoundaryTestsPassed: true,
      stripeSignatureTestsPassed: true,
      stripeCliLifecycleTranscriptCaptured: false,
      dbReconciliationTestsPassed: false,
      bookingToPaidE2ePassed: false,
      refundNoShowDisputeTestsPassed: false,
      receiptExportTestsPassed: false,
      crossTenantPaymentTestsPassed: false,
      replayIdempotencyTestsPassed: false,
      ciPaymentJobEvidenceCaptured: false,
      artifactRetentionVerified: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/payment-automation-runtime.json",
        "coverage/payment-automation-payments-typecheck.txt",
        "coverage/payment-automation-payments-test.txt",
        "coverage/payment-automation-route-boundary.json",
        "coverage/payment-automation-stripe-signature.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain(
      "Stripe CLI lifecycle transcript must cover checkout success/failure/expiration/refund/dispute/replay.",
    );
    expect(blockedDecision.blockers).toContain(
      "Seeded DB reconciliation tests must prove payment lifecycle persistence.",
    );
    expect(blockedDecision.blockers).toContain("Secret-safe payment artifact review evidence is missing.");
    expect(blockedDecision.missingArtifacts).toContain("coverage/payment-automation-db-reconciliation.json");
    expect(blockedDecision.missingArtifacts).toContain("coverage/payment-automation-secret-safe-artifacts.json");
    expect(blockedDecision.requiredCommands).toBe(paymentAutomationRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toBe(paymentAutomationDecisionRequiredEvidence);
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 5,
      requiredArtifactCount: paymentAutomationArtifactPaths.length,
    });

    const completeDecision = buildPaymentAutomationEvidenceDecision({
      paymentsTypecheckPassed: true,
      paymentsUnitTestsPassed: true,
      routeBoundaryTestsPassed: true,
      stripeSignatureTestsPassed: true,
      stripeCliLifecycleTranscriptCaptured: true,
      dbReconciliationTestsPassed: true,
      bookingToPaidE2ePassed: true,
      refundNoShowDisputeTestsPassed: true,
      receiptExportTestsPassed: true,
      crossTenantPaymentTestsPassed: true,
      replayIdempotencyTestsPassed: true,
      ciPaymentJobEvidenceCaptured: true,
      artifactRetentionVerified: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: paymentAutomationArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
  });

  it("keeps GAP-054 execution policy non-executing and external evidence explicit", () => {
    const plan = buildPaymentAutomationExecutionPlan();

    expect(plan.policy).toBe(paymentAutomationExecutionPolicy);
    expect(plan.policy.codexMayClassifyStaticPaymentAutomationReadiness).toBe(true);
    expect(plan.policy.helperRouteCommandsRequiredForClosure).toBe(true);
    expect(plan.policy.stripeCliLifecycleRequiredForClosure).toBe(true);
    expect(plan.policy.dbReconciliationRequiredForClosure).toBe(true);
    expect(plan.policy.playwrightE2eRequiredForClosure).toBe(true);
    expect(plan.policy.artifactRetentionRequiredForClosure).toBe(true);
    expect(plan.policy.secretSafeArtifactsRequiredForClosure).toBe(true);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.stripeCliExecutionAllowed).toBe(false);
    expect(plan.databaseExecutionAllowed).toBe(false);
    expect(plan.playwrightExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.artifactReviewExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(paymentAutomationLocalCommands);
    expect(plan.externalCommands).toBe(paymentAutomationExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(paymentAutomationRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("secret-safe payment automation artifact review");
  });

  it("redacts GAP-054 payment automation artifacts before secret-safe review", () => {
    const artifact = {
      stripeCliTranscriptUrl: "https://private/stripe.log",
      playwrightTraceUrl: "https://private/trace.zip",
      paymentCustomerEmail: "client@example.test",
      databaseSnapshot: "postgres_private",
      nested: {
        checkoutSessionId: "cs_private",
        publicSummary: "payment automation evidence captured",
      },
    };

    const redacted = buildRedactedPaymentAutomationArtifact(artifact);
    expect(redacted.redactedPaths).toEqual([
      "stripeCliTranscriptUrl",
      "playwrightTraceUrl",
      "paymentCustomerEmail",
      "databaseSnapshot",
      "nested.checkoutSessionId",
    ]);
    expect(redacted.redactedArtifact).toMatchObject({
      stripeCliTranscriptUrl: "[REDACTED]",
      playwrightTraceUrl: "[REDACTED]",
      paymentCustomerEmail: "[REDACTED]",
      databaseSnapshot: "[REDACTED]",
      nested: {
        checkoutSessionId: "[REDACTED]",
        publicSummary: "payment automation evidence captured",
      },
    });

    const review = buildPaymentAutomationArtifactReview({
      publicSummary: "safe payment automation evidence",
      e2eScreenshotUrl: "https://private/screenshot.png",
    });
    expect(review.secretSafe).toBe(true);
    expect(review.redactedPaths).toEqual(["e2eScreenshotUrl"]);
    expect(review.requiredExternalEvidence).toBe(paymentAutomationRequiredExternalEvidence);
    expect(review.requiredExternalEvidence).toContain("artifact retention proof");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming Stripe/DB/E2E evidence", () => {
    expect(ciWorkflow).toContain("Run Phase 7 payment automation runtime contracts");
    expect(ciWorkflow).toContain("payment-automation-runtime-static.test.ts");
    expect(ciWorkflow).toContain("payment-automation-runtime-artifacts");
    expect(unitManifest).toContain("unit-payment-automation-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/paymentAutomatedTestsRuntime.ts");
    expect(gapTracker).toContain("executable-evidence classifier");
    expect(gapTracker).toContain("GAP-054 is payment-automation-runtime-matrix wired with executable-evidence classifier");
    expect(gapTracker).toContain("paymentAutomationDecisionRequiredEvidence");
    expect(gapTracker).toContain("buildPaymentAutomationExecutionPlan");
    expect(gapTracker).toContain("paymentAutomationExecutionPolicy");
    expect(gapTracker).toContain("paymentAutomationRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedPaymentAutomationArtifact");
    expect(gapTracker).toContain("buildPaymentAutomationArtifactReview");
    expect(paymentAutomationArtifactPaths).toContain("coverage/payment-automation-secret-safe-artifacts.json");
  });
});

