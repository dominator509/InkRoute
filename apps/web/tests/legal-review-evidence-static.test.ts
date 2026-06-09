import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildLegalVersionAcceptancePersistenceContract,
  legalDocumentRuntimeContract,
  legalReviewArtifactPaths,
  legalReviewCommands,
  legalReviewEvidencePreview,
  legalVersionAcceptancePersistencePreview,
  paymentPolicyLegalRuntimeContract,
} from "../lib/legalReviewEvidence";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("GAP-100 legal review evidence contract", () => {
  it("builds a versioned legal review packet contract without claiming attorney approval", () => {
    const source = readWorkspaceFile("apps/web/lib/legalReviewEvidence.ts");

    expect(source).toContain("buildLegalReviewPacketPlan");
    expect(source).toContain("buildLegalDocumentProductionReadinessPlan");
    expect(source).toContain("buildPaymentPolicyLegalReviewRuntimeReadinessPlan");
    expect(source).toContain("collect-attorney-approval-metadata");
    expect(source).toContain("record-jurisdiction-policy-version");
    expect(source).toContain("record-consent-document-version");
    expect(source).toContain("persist-versioned-acceptance-audit");
    expect(source).toContain("document-legal-copy-rollback");
    expect(source).toContain("capture-payment-policy-approval");
    expect(legalReviewEvidencePreview.packet.status).toBe("blocked");
    expect(legalReviewEvidencePreview.packet.pageProtections.noindexRequired).toBe(true);
    expect(legalReviewEvidencePreview.requiredTopics).toEqual(
      expect.arrayContaining(["privacy_policy", "terms_of_service", "tattoo_consent", "sms_opt_in_stop_help", "deposits_no_shows_refunds"]),
    );
  });

  it("pins durable legal document versions, acceptance audits, approval gates, and redacted audit writes", () => {
    const schema = readWorkspaceFile("packages/db/prisma/schema.prisma");
    const contract = buildLegalVersionAcceptancePersistenceContract({
      document: {
        tenantId: "tenant_demo",
        documentType: "terms_of_service",
        jurisdiction: "US-STATE-BY-STATE",
        version: "legal-draft-2026-06",
        reviewedCopyHash: "sha256:pending-attorney-review",
        noindexUntilApproved: true,
        rollbackFromVersion: "placeholder-2026-05",
        evidenceObjectKey: "legal/tenant_demo/terms/redacted-review.json",
      },
      acceptance: {
        tenantId: "tenant_demo",
        legalDocumentVersionId: "legal_document_version_demo",
        acceptedByUserId: "user_demo",
        subjectEmailHash: "sha256:redacted",
        acceptanceContext: "booking_request",
        acceptedVersion: "legal-draft-2026-06",
        ipHash: "sha256:redacted",
        userAgentHash: "sha256:redacted",
      },
    });

    expect(schema).toContain("model LegalDocumentVersion");
    expect(schema).toContain("model LegalAcceptanceAudit");
    expect(schema).toContain("noindexUntilApproved");
    expect(schema).toContain("@@unique([tenantId, documentType, version])");
    expect(contract.transactionWrites).toEqual(["LegalDocumentVersion", "LegalAcceptanceAudit", "AuditLog"]);
    expect(contract.approvalGate).toBe("noindex_until_approved_at_and_reviewed_copy_hash");
    expect(contract.redactedFields).toContain("subjectEmailHash");
    expect(contract.tenantIsolationKey).toBe("tenantId");
    expect(legalVersionAcceptancePersistencePreview.documentModelName).toBe("LegalDocumentVersion");
  });

  it("keeps public legal placeholders and legal handoff packet explicitly blocked before reviewed copy lands", () => {
    const packet = readWorkspaceFile("docs/legal/LEGAL_REVIEW_PACKET.md");
    const privacyPage = readWorkspaceFile("apps/web/app/privacy/page.tsx");
    const trustPage = readWorkspaceFile("apps/web/app/trust/page.tsx");
    const dashboardTrustPage = readWorkspaceFile("apps/dashboard/app/trust/page.tsx");

    expect(packet).toContain("not legal advice and not attorney approval");
    expect(packet).toContain("Tattoo consent forms and consent signature retention");
    expect(packet).toContain("SMS consent, STOP/HELP, quiet-hour, and notification language");
    expect(privacyPage).toContain("not legal advice, not attorney-reviewed");
    expect(trustPage).toContain("Legal review");
    expect(dashboardTrustPage).toContain("attorney-reviewed legal documents");
  });

  it("blocks legal document and payment policy readiness until approvals, versions, audits, route smokes, and rollback exist", () => {
    expect(legalDocumentRuntimeContract.status).toBe("blocked");
    expect(legalDocumentRuntimeContract.blockers).toEqual(
      expect.arrayContaining([
        "Qualified attorney approval metadata must be recorded for every production legal document.",
        "Every required legal review topic must have reviewer, approval date, jurisdiction, and version metadata.",
        "Reviewed privacy, terms, consent, safety, SMS, aftercare, deposit, tax, liability, and SaaS copy must be committed.",
        "Consent acceptance route tests must prove versioned persistence and audit-log writes.",
        "Rollback plan must document how to restore prior approved legal copy and acceptance versions.",
      ]),
    );
    expect(paymentPolicyLegalRuntimeContract.status).toBe("blocked");
    expect(paymentPolicyLegalRuntimeContract.blockers).toEqual(
      expect.arrayContaining([
        "Attorney approval must be recorded for payment, cancellation, no-show, refund, SMS, receipt, and liability language.",
        "Tax/accounting approval must be recorded for deposits, refunds, tax disclosures, and reporting copy.",
        "Reviewed SMS consent, STOP, HELP, and quiet-hours copy must be committed.",
        "Terms, privacy, consent, and studio policy documents must be updated with reviewed payment policy language.",
      ]),
    );
  });

  it("pins commands, artifacts, CI, manifest, and tracker references for GAP-100", () => {
    const ci = readWorkspaceFile(".github/workflows/ci.yml");
    const manifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
    const tracker = readWorkspaceFile("GAP_TRACKER.md");

    expect(legalReviewCommands).toContain("legal page route smoke tests");
    expect(legalReviewCommands).toContain("consent acceptance audit persistence tests");
    expect(legalReviewCommands).toContain("payment policy reviewed-copy E2E smoke");
    expect(legalReviewArtifactPaths).toContain("coverage/legal-payment-policy-review-redacted.json");
    expect(manifest).toContain("LegalDocumentVersion and LegalAcceptanceAudit Prisma models and app row contracts are wired");
    expect(ci).toContain("Run Phase 13 legal review evidence contracts");
    expect(ci).toContain("apps/web/tests/legal-review-evidence-static.test.ts");
    expect(ci).toContain("legal-review-evidence-artifacts");
    expect(manifest).toContain("unit-web-legal-review-evidence-static");
    expect(tracker).toContain("apps/web/lib/legalReviewEvidence.ts");
    expect(tracker).toContain("attorney approval and reviewed-copy proof remain open");
  });
});
