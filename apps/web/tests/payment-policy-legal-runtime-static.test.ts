import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  paymentPolicyLegalArtifactPaths,
  paymentPolicyLegalCopyAreas,
  paymentPolicyLegalRuntimeCommands,
  paymentPolicyLegalRuntimeMatrix,
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

  it("keeps security helper, tests, and payment surfaces wired", () => {
    expect(securityPackageJson).toContain('"typecheck"');
    expect(securityPackageJson).toContain('"test"');
    expect(securitySource).toContain("buildPaymentPolicyLegalReviewRuntimeReadinessPlan");
    expect(securityTests).toContain("buildPaymentPolicyLegalReviewRuntimeReadinessPlan");
    expect(depositPreview).toContain("deposit");
    expect(dashboardPayments).toContain("payment");
  });

  it("keeps legal/tax approval and reviewed copy blockers explicit", () => {
    expect(paymentPolicyLegalRuntimeReadiness.status).toBe("blocked");
    expect(paymentPolicyLegalRuntimeReadiness.missingScripts).toEqual([]);
    expect(paymentPolicyLegalRuntimeReadiness.requiredCommands).toEqual([...paymentPolicyLegalRuntimeCommands]);
    expect(paymentPolicyLegalRuntimeReadiness.requiredEvidence).toContain(
      "signed attorney and tax/accounting approval records for payment policy language",
    );
    expect(paymentPolicyLegalRuntimeReadiness.requiredEvidence).toContain(
      "committed reviewed copy for deposits, cancellation, no-show, refund, SMS, receipts, and tax disclosures",
    );
    expect(paymentPolicyLegalRuntimeReadiness.blockers).toContain(
      "Attorney approval must be recorded for payment, cancellation, no-show, refund, SMS, receipt, and liability language.",
    );
    expect(paymentPolicyLegalRuntimeReadiness.blockers).toContain(
      "Tax/accounting approval must be recorded for receipt and accounting export language.",
    );
  });

  it("wires CI, manifest, tracker, and artifacts without claiming legal/tax approval exists", () => {
    expect(ciWorkflow).toContain("Run Phase 7 payment policy legal runtime contracts");
    expect(ciWorkflow).toContain("payment-policy-legal-runtime-static.test.ts");
    expect(ciWorkflow).toContain("payment-policy-legal-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-payment-policy-legal-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/paymentPolicyLegalRuntime.ts");
    expect(gapTracker).toContain("live legal/tax approval, reviewed production copy, acceptance/versioning, E2E approved-language proof, and rollback-plan proof remain open");
  });
});
