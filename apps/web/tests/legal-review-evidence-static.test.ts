import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedLegalReviewArtifact,
  buildLegalReviewArtifactReview,
  buildLegalReviewEvidenceDecision,
  buildLegalReviewExecutionPlan,
  buildLegalVersionAcceptancePersistenceContract,
  legalDocumentRuntimeContract,
  legalReviewArtifactPaths,
  legalReviewCommands,
  legalReviewEvidencePreview,
  legalReviewExternalArtifacts,
  legalReviewExternalCommands,
  legalReviewExecutionPolicy,
  legalReviewLocalArtifacts,
  legalReviewLocalCommands,
  legalReviewProofFiles,
  legalReviewRequiredExternalEvidence,
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
    expect(legalDocumentRuntimeContract.blockers).not.toContain(
      "LegalDocumentVersion persistence must be configured for consent and studio policy versions.",
    );
    expect(legalDocumentRuntimeContract.blockers).not.toContain(
      "LegalAcceptanceAudit persistence must be configured before production acceptance collection.",
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
    expect(paymentPolicyLegalRuntimeContract.blockers).not.toContain(
      "Acceptance audit persistence must be configured for reviewed payment policy acknowledgements.",
    );
    expect(paymentPolicyLegalRuntimeContract.blockers).not.toContain(
      "Policy versioning must be configured before payment policy copy can be claimed production-ready.",
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
    expect(tracker).toContain("Legal review evidence classifier wired and attorney reviewed-copy proof gated");
    expect(tracker).toContain("legalReviewLocalArtifacts");
    expect(tracker).toContain("legalReviewExternalArtifacts");
  });

  it("pins current legal review proof files for GAP-100", () => {
    expect(legalReviewProofFiles).toEqual(
      expect.arrayContaining([
      "packages/security/package.json",
        "apps/web/lib/legalReviewEvidence.ts",
        "apps/web/tests/legal-review-evidence-static.test.ts",
        "apps/web/app/privacy/page.tsx",
        "apps/web/app/terms/page.tsx",
        "apps/web/app/consent-disclaimer/page.tsx",
        "apps/web/app/trust/page.tsx",
        "apps/dashboard/app/trust/page.tsx",
        "docs/legal/LEGAL_REVIEW_PACKET.md",
        "packages/db/prisma/schema.prisma",
        "packages/db/prisma/migrations/20260609003000_add_legal_document_acceptance/migration.sql",
        "packages/security/src/index.ts",
        "packages/security/tests/upload-policy.test.ts",
        "SECURITY.md",
        "PRODUCT_REQUIREMENTS.md",
        ".github/workflows/ci.yml",
        "testing/manifests/unit-test-manifest.json",
      ]),
    );
    for (const file of legalReviewProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("classifies GAP-100 evidence as blocked until attorney approval and reviewed-copy proof is captured", () => {
    const blockedDecision = buildLegalReviewEvidenceDecision({
      packetScaffoldCaptured: true,
      attorneyApprovalsCaptured: false,
      jurisdictionPolicyVersionsCaptured: false,
      consentVersionPersistenceCaptured: true,
      reviewedPublicPageSmokeCaptured: false,
      noindexRemovedAfterApprovalCaptured: false,
      acceptanceAuditPersistenceCaptured: true,
      dashboardAcceptanceUiCaptured: true,
      paymentPolicyReviewCaptured: false,
      rollbackPlanCaptured: true,
      requiredCommandsRun: legalReviewCommands.filter(
        (command) =>
          command !== "legal page route smoke tests" &&
          command !== "payment policy reviewed-copy E2E smoke" &&
          command !== "legal copy rollback drill",
      ),
      capturedArtifacts: [
        "coverage/legal-review-packet.json",
        "coverage/legal-consent-version-persistence.json",
        "coverage/legal-acceptance-audit-persistence.json",
        "coverage/legal-dashboard-acceptance-ui.json",
        "coverage/legal-copy-rollback-plan.md",
        "test-results/legal-review",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Capture qualified attorney approval metadata evidence.",
        "Capture jurisdiction-specific studio policy version evidence.",
        "Capture reviewed public legal page smoke evidence.",
        "Capture noindex removal after approval evidence.",
        "Capture payment policy legal and tax review evidence.",
        "Required command not recorded: legal page route smoke tests",
        "Required command not recorded: payment policy reviewed-copy E2E smoke",
        "Required command not recorded: legal copy rollback drill",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/legal-attorney-approvals-redacted.json",
        "coverage/legal-jurisdiction-policy-versions.json",
        "coverage/legal-public-page-smoke.json",
        "coverage/legal-noindex-removal-after-approval.json",
        "coverage/legal-payment-policy-review-redacted.json",
      ]),
    );
    expect(blockedDecision.publicationPolicy).toEqual({
      noindexRemovedOnlyAfterApproval: true,
      placeholderCopyRemovedOnlyAfterReview: true,
      acceptanceAuditsUseRedactedHashes: true,
    });

    const completeDecision = buildLegalReviewEvidenceDecision({
      packetScaffoldCaptured: true,
      attorneyApprovalsCaptured: true,
      jurisdictionPolicyVersionsCaptured: true,
      consentVersionPersistenceCaptured: true,
      reviewedPublicPageSmokeCaptured: true,
      noindexRemovedAfterApprovalCaptured: true,
      acceptanceAuditPersistenceCaptured: true,
      dashboardAcceptanceUiCaptured: true,
      paymentPolicyReviewCaptured: true,
      rollbackPlanCaptured: true,
      requiredCommandsRun: legalReviewCommands,
      capturedArtifacts: legalReviewArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(legalReviewCommands);
    expect(completeDecision.requiredEvidence).toBe(legalReviewArtifactPaths);
  });

  it("keeps GAP-100 attorney approval and publication execution disabled in the local plan", () => {
    const plan = buildLegalReviewExecutionPlan();

    expect(plan.attorneyApprovalExecutionAllowed).toBe(false);
    expect(plan.reviewedCopyPublicationAllowed).toBe(false);
    expect(plan.noindexRemovalAllowed).toBe(false);
    expect(plan.acceptancePersistenceExecutionAllowed).toBe(false);
    expect(plan.paymentPolicyReviewExecutionAllowed).toBe(false);
    expect(plan.rollbackDrillExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(legalReviewExecutionPolicy);
    expect(plan.externalEvidenceRequired).toBe(legalReviewRequiredExternalEvidence);
    expect(legalReviewExecutionPolicy.externalEvidenceRequired).toBe(legalReviewRequiredExternalEvidence);
    expect(legalReviewRequiredExternalEvidence).toEqual(expect.arrayContaining([
      "Qualified attorney approval metadata evidence",
      "Jurisdiction-specific studio policy version evidence",
      "Reviewed public legal page smoke evidence",
      "Payment policy legal and tax review evidence",
      "Legal copy rollback drill evidence",
    ]));
    expect(plan.localCommands).toBe(legalReviewLocalCommands);
    expect(plan.externalCommands).toBe(legalReviewExternalCommands);
    expect(plan.localArtifacts).toBe(legalReviewLocalArtifacts);
    expect(plan.externalArtifacts).toBe(legalReviewExternalArtifacts);
    expect(plan.externalArtifacts).toEqual(expect.arrayContaining([
      "coverage/legal-attorney-approvals-redacted.json",
      "coverage/legal-jurisdiction-policy-versions.json",
      "coverage/legal-public-page-smoke.json",
      "coverage/legal-noindex-removal-after-approval.json",
      "coverage/legal-payment-policy-review-redacted.json",
    ]));
    expect(plan.disabledReasons.join(" ")).toContain("Qualified attorney approval cannot be generated by local code.");
  });

  it("redacts GAP-100 attorney, acceptance, and legal evidence artifacts before review", () => {
    const rawArtifact = {
      reviewerName: "Attorney Name",
      reviewerFirm: "Law Firm PLLC",
      reviewedCopyHash: "sha256:private-reviewed-copy",
      subjectEmailHash: "sha256:subject-email",
      ipHash: "sha256:ip-address",
      userAgentHash: "sha256:user-agent",
      evidenceObjectKey: "legal/tenant_demo/terms/private-review.json",
      contact: "lawyer@example.com +1 555 999 1212",
      headers: ["Authorization: Bearer legal-secret-token"],
      stack: "Error: legal review evidence failed",
    };

    const redacted = buildRedactedLegalReviewArtifact(rawArtifact);
    const review = buildLegalReviewArtifactReview(rawArtifact);
    const serialized = JSON.stringify({ redacted, review });

    expect(serialized).not.toContain("Attorney Name");
    expect(serialized).not.toContain("Law Firm PLLC");
    expect(serialized).not.toContain("sha256:private-reviewed-copy");
    expect(serialized).not.toContain("sha256:subject-email");
    expect(serialized).not.toContain("sha256:ip-address");
    expect(serialized).not.toContain("legal/tenant_demo/terms/private-review.json");
    expect(serialized).not.toContain("lawyer@example.com");
    expect(serialized).not.toContain("+1 555 999 1212");
    expect(serialized).not.toContain("legal-secret-token");
    expect(serialized).toContain("[REDACTED]");
    expect(review.requiredArtifacts).toBe(legalReviewArtifactPaths);
    expect(review.retainedExternalGates).toEqual(expect.arrayContaining([
      "Qualified attorney approval metadata evidence",
      "Payment policy legal and tax review evidence",
      "Legal copy rollback drill evidence",
    ]));
  });
});

