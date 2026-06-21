import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPaymentPolicyLegalArtifactReview,
  buildPaymentPolicyLegalEvidenceDecision,
  buildPaymentPolicyLegalExecutionPlan,
  buildPaymentPolicyLegalApprovalPacketDecision,
  buildRedactedPaymentPolicyLegalArtifact,
  paymentPolicyLegalApprovalPacketRequiredEvidence,
  paymentPolicyLegalExternalCommands,
  paymentPolicyLegalExecutionPolicy,
  paymentPolicyLegalArtifactPaths,
  paymentPolicyLegalCopyAreas,
  paymentPolicyLegalEvidenceFlags,
  paymentPolicyLegalLocalCommands,
  paymentPolicyLegalRequiredExternalEvidence,
  paymentPolicyLegalRuntimeCommands,
  paymentPolicyLegalRuntimeMatrix,
  paymentPolicyLegalRuntimeProofFiles,
  paymentPolicyLegalRuntimeReadiness,
} from "../lib/paymentPolicyLegalRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("payment policy legal runtime contract", () => {
  const securityPackageJson = readRepoFile("packages/security/package.json");
  const securitySource = readRepoFile("packages/security/src/index.ts");
  const securityTests = readRepoFile("packages/security/tests/upload-policy.test.ts");
  const depositPreview = readRepoFile("apps/web/app/booking/deposit-preview/page.tsx");
  const dashboardPayments = readRepoFile("apps/dashboard/app/payments/page.tsx");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins payment policy commands, copy areas, matrix rows, and artifacts", () => {
    expect(paymentPolicyLegalRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/dashboard typecheck",
      "payment policy approved-copy E2E sweep",
      "legal/tax approval packet review",
    ]);
    expect(paymentPolicyLegalCopyAreas).toContain("sms-consent-stop-help-quiet-hours");
    expect(paymentPolicyLegalCopyAreas).toContain("policy-versioning");
    expect(paymentPolicyLegalRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "security-typecheck",
      "security-legal-tests",
      "web-approved-copy-typecheck",
      "dashboard-approved-copy-typecheck",
      "attorney-approval",
      "tax-accounting-approval",
      "approved-copy-committed",
      "acceptance-audit-versioning",
      "approved-language-e2e",
      "rollback-plan",
    ]);
    expect(paymentPolicyLegalArtifactPaths).toContain("coverage/payment-policy-legal-runtime.json");
    expect(paymentPolicyLegalArtifactPaths).toContain("test-results/payment-policy-legal-runtime");
  });

  it("pins current payment policy legal proof files for GAP-053", () => {
    expect(paymentPolicyLegalRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/dashboard/package.json",
      "apps/web/package.json",
      "packages/security/package.json",
      "packages/security/src/index.ts",
      "packages/security/tests/upload-policy.test.ts",
      "apps/web/lib/paymentPolicyLegalRuntime.ts",
      "apps/web/tests/payment-policy-legal-runtime-static.test.ts",
      "apps/web/app/booking/deposit-preview/page.tsx",
      "apps/dashboard/app/payments/page.tsx",
      "testing/manifests/unit-test-manifest.json",
      ".github/workflows/ci.yml",
    ]));
    for (const file of paymentPolicyLegalRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps security helper, tests, and payment surfaces wired", () => {
    expect(securityPackageJson).toContain('"typecheck"');
    expect(securityPackageJson).toContain('"test"');
    expect(securitySource).toContain("buildPaymentPolicyLegalReviewRuntimeReadinessPlan");
    expect(securityTests).toContain("buildPaymentPolicyLegalReviewRuntimeReadinessPlan");
    expect(depositPreview).toContain("Stripe Checkout readiness contract");
    expect(depositPreview).toContain("live money movement disabled");
    expect(depositPreview).not.toContain("payment engine scaffold");
    expect(dashboardPayments).toContain("payment");
  });

  it("keeps legal/tax approval and reviewed copy blockers explicit", () => {
    expect(paymentPolicyLegalRuntimeReadiness.status).toBe("blocked");
    expect(paymentPolicyLegalRuntimeReadiness.missingScripts).toEqual([]);
    expect(paymentPolicyLegalRuntimeReadiness.requiredCommands).toBe(paymentPolicyLegalRuntimeCommands);
    expect(paymentPolicyLegalRuntimeReadiness.requiredEvidence).toBe(paymentPolicyLegalEvidenceFlags);
    expect(paymentPolicyLegalRuntimeReadiness.blockers).toContain(
      "Attorney approval must be recorded for payment, cancellation, no-show, refund, SMS, receipt, and liability language.",
    );
    expect(paymentPolicyLegalRuntimeReadiness.blockers).toContain(
      "Tax/accounting approval must be recorded for receipt and accounting export language.",
    );
  });

  it("blocks payment policy release until the approval packet is complete", () => {
    const blockedDecision = buildPaymentPolicyLegalApprovalPacketDecision({
      attorneyApprovalRecorded: false,
      taxAccountingApprovalRecorded: false,
      productionCopyReviewed: false,
      acceptanceAuditConfigured: false,
      policyVersioningConfigured: false,
      e2eApprovedLanguageVerified: false,
      rollbackCopyPlanDocumented: false,
      policyVersion: "",
      reviewedAreas: ["deposit-payment", "refund"],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain(
      "Attorney approval must be recorded before payment policy copy is treated as approved.",
    );
    expect(blockedDecision.blockers).toContain(
      "Tax/accounting approval must be recorded before receipt or tax disclosure copy is treated as approved.",
    );
    expect(blockedDecision.blockers).toContain("All payment policy copy areas must be reviewed.");
    expect(blockedDecision.missingReviewedAreas).toContain("sms-consent-stop-help-quiet-hours");
    expect(blockedDecision.missingReviewedAreas).toContain("rollback-correction-plan");
    expect(blockedDecision.requiredEvidence).toBe(paymentPolicyLegalApprovalPacketRequiredEvidence);
    expect(blockedDecision.redactedSummary).toEqual({
      policyVersion: "",
      reviewedAreaCount: 2,
      requiredAreaCount: paymentPolicyLegalCopyAreas.length,
    });

    const approvedDecision = buildPaymentPolicyLegalApprovalPacketDecision({
      attorneyApprovalRecorded: true,
      taxAccountingApprovalRecorded: true,
      productionCopyReviewed: true,
      acceptanceAuditConfigured: true,
      policyVersioningConfigured: true,
      e2eApprovedLanguageVerified: true,
      rollbackCopyPlanDocumented: true,
      policyVersion: "payment-policy-2026-06-12",
      reviewedAreas: paymentPolicyLegalCopyAreas,
    });

    expect(approvedDecision.status).toBe("approved");
    expect(approvedDecision.blockers).toEqual([]);
    expect(approvedDecision.missingReviewedAreas).toEqual([]);
    expect(approvedDecision.redactedSummary.policyVersion).toBe("payment-policy-2026-06-12");
  });

  it("classifies GAP-053 as blocked until legal policy evidence is complete", () => {
    const decision = buildPaymentPolicyLegalEvidenceDecision({
      commands: ["pnpm --filter @inkroute/security typecheck"],
      artifacts: ["coverage/payment-policy-legal-runtime.json"],
      reviewedAreas: ["deposit-payment"],
      evidence: { securityTypecheckPassed: true },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("legal/tax approval packet review");
    expect(decision.missingArtifacts).toContain("coverage/payment-policy-rollback-plan.json");
    expect(decision.missingReviewedAreas).toContain("rollback-correction-plan");
    expect(decision.missingEvidence).toContain("secretSafeArtifactsCaptured");
    expect(decision.blockers).toContain("Every payment policy copy area must be reviewed.");
  });

  it("classifies GAP-053 as complete when all legal policy commands, artifacts, reviewed areas, and evidence are present", () => {
    const decision = buildPaymentPolicyLegalEvidenceDecision({
      commands: paymentPolicyLegalRuntimeCommands,
      artifacts: paymentPolicyLegalArtifactPaths,
      reviewedAreas: paymentPolicyLegalCopyAreas,
      evidence: Object.fromEntries(paymentPolicyLegalEvidenceFlags.map((flag) => [flag, true])),
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingReviewedAreas).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("keeps GAP-053 execution policy non-executing and external evidence explicit", () => {
    const plan = buildPaymentPolicyLegalExecutionPlan();

    expect(plan.policy).toBe(paymentPolicyLegalExecutionPolicy);
    expect(plan.policy.codexMayClassifyStaticPaymentPolicyLegalReadiness).toBe(true);
    expect(plan.policy.attorneyApprovalRequiredForClosure).toBe(true);
    expect(plan.policy.taxAccountingApprovalRequiredForClosure).toBe(true);
    expect(plan.policy.reviewedProductionCopyRequiredForClosure).toBe(true);
    expect(plan.policy.acceptanceVersioningRequiredForClosure).toBe(true);
    expect(plan.policy.approvedLanguageE2eRequiredForClosure).toBe(true);
    expect(plan.policy.rollbackPlanRequiredForClosure).toBe(true);
    expect(plan.policy.secretSafeArtifactsRequiredForClosure).toBe(true);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.legalApprovalExecutionAllowed).toBe(false);
    expect(plan.taxAccountingExecutionAllowed).toBe(false);
    expect(plan.productionCopyExecutionAllowed).toBe(false);
    expect(plan.acceptanceVersioningExecutionAllowed).toBe(false);
    expect(plan.e2eExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(paymentPolicyLegalLocalCommands);
    expect(plan.externalCommands).toBe(paymentPolicyLegalExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(paymentPolicyLegalRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("secret-safe payment policy legal artifact review");
  });

  it("redacts GAP-053 payment policy legal artifacts before secret-safe review", () => {
    const artifact = {
      attorneyApprovalSignature: "signature_private",
      taxAccountingReviewerEmail: "tax@example.test",
      clientRefundPolicyExample: "client_private",
      paymentConsentUrl: "https://private/consent",
      nested: {
        smsReceiptPhone: "555-0100",
        publicSummary: "payment policy legal evidence captured",
      },
    };

    const redacted = buildRedactedPaymentPolicyLegalArtifact(artifact);
    expect(redacted.redactedPaths).toEqual([
      "attorneyApprovalSignature",
      "taxAccountingReviewerEmail",
      "clientRefundPolicyExample",
      "paymentConsentUrl",
      "nested.smsReceiptPhone",
    ]);
    expect(redacted.redactedArtifact).toMatchObject({
      attorneyApprovalSignature: "[REDACTED]",
      taxAccountingReviewerEmail: "[REDACTED]",
      clientRefundPolicyExample: "[REDACTED]",
      paymentConsentUrl: "[REDACTED]",
      nested: {
        smsReceiptPhone: "[REDACTED]",
        publicSummary: "payment policy legal evidence captured",
      },
    });

    const review = buildPaymentPolicyLegalArtifactReview({
      publicSummary: "safe payment policy legal evidence",
      legalApprovalToken: "legal_private",
    });
    expect(review.secretSafe).toBe(true);
    expect(review.redactedPaths).toEqual(["legalApprovalToken"]);
    expect(review.requiredExternalEvidence).toBe(paymentPolicyLegalRequiredExternalEvidence);
    expect(review.requiredExternalEvidence).toContain("rollback/correction plan proof");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming legal/tax approval exists", () => {
    expect(ciWorkflow).toContain("Run Phase 7 payment policy legal runtime contracts");
    expect(ciWorkflow).toContain("payment-policy-legal-runtime-static.test.ts");
    expect(ciWorkflow).toContain("payment-policy-legal-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-payment-policy-legal-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/paymentPolicyLegalRuntime.ts");
    expect(gapTracker).toContain("GAP-053 is payment-policy-legal-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("approval-packet decision seam");
    expect(gapTracker).toContain("paymentPolicyLegalApprovalPacketRequiredEvidence");
    expect(gapTracker).toContain("buildPaymentPolicyLegalExecutionPlan");
    expect(gapTracker).toContain("paymentPolicyLegalExecutionPolicy");
    expect(gapTracker).toContain("paymentPolicyLegalRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedPaymentPolicyLegalArtifact");
    expect(gapTracker).toContain("buildPaymentPolicyLegalArtifactReview");
    expect(gapTracker).toContain("live legal/tax approval, reviewed production copy, acceptance/versioning, E2E approved-language proof, and rollback-plan proof remain open");
  });
});

