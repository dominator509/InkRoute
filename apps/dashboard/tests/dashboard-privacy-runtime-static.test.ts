import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDashboardPrivacyArtifactReview,
  buildDashboardPrivacyEvidenceDecision,
  buildDashboardPrivacyExecutionPlan,
  buildRedactedDashboardPrivacyArtifact,
  dashboardPrivacyArtifactPaths,
  dashboardPrivacyEvidenceFlags,
  dashboardPrivacyExternalCommands,
  dashboardPrivacyExecutionPolicy,
  dashboardPrivacyLocalCommands,
  dashboardPrivacyRequiredExternalEvidence,
  dashboardPrivacyRuntimeCommands,
  dashboardPrivacyRuntimeMatrix,
  dashboardPrivacyRuntimeProofFiles,
  dashboardPrivacyRuntimeReadiness,
  dashboardPrivacySurfaces,
} from "../lib/dashboardPrivacyRuntime";
import { dashboardPrivacyWorkflowEvidenceRequiredEvidence } from "@inkroute/security";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("dashboard privacy runtime contract", () => {
  const securityPackageJson = readRepoFile("packages/security/package.json");
  const securitySource = readRepoFile("packages/security/src/index.ts");
  const securityTests = readRepoFile("packages/security/tests/upload-policy.test.ts");
  const privacyRoute = readRepoFile("apps/dashboard/app/api/security/privacy-requests/route.ts");
  const trustRoute = readRepoFile("apps/dashboard/app/api/security/trust-status/route.ts");
  const clientDetailRoute = readRepoFile("apps/dashboard/app/api/clients/[clientId]/route.ts");
  const clientDetailActionPanel = readRepoFile("apps/dashboard/components/ClientDetailActionPanel.tsx");
  const clientReadRouteTest = readRepoFile("apps/dashboard/tests/client-read-route-static.test.ts");
  const formDetailRoute = readRepoFile("apps/dashboard/app/api/forms/[formId]/route.ts");
  const formActionPanel = readRepoFile("apps/dashboard/components/FormActionPanel.tsx");
  const formReadRouteTest = readRepoFile("apps/dashboard/tests/form-read-route-static.test.ts");
  const privacyRouteTest = readRepoFile("apps/dashboard/tests/security-privacy-route-static.test.ts");
  const trustRouteTest = readRepoFile("apps/dashboard/tests/security-trust-route-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-040 surfaces, commands, matrix rows, and artifacts", () => {
    expect(dashboardPrivacySurfaces).toEqual([
      "client_profile",
      "booking_request",
      "consent_form",
      "payment",
      "message",
      "file_asset",
    ]);
    expect(dashboardPrivacyRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "dashboard privacy route/API tests",
      "persisted dashboard export workflow tests",
      "persisted dashboard delete/anonymize workflow tests",
      "private file deletion integration tests",
      "dashboard privacy AuditLog persistence tests",
      "dashboard sanitized log/error evidence sweep",
      "legal/product dashboard privacy approval review",
      "GitHub Actions dashboard privacy evidence job",
    ]);
    expect(dashboardPrivacyRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "security-typecheck",
      "security-tests",
      "dashboard-typecheck-build",
      "route-projection-matrix",
      "privacy-trust-route-tests",
      "persisted-request-store",
      "export-delete-anonymize",
      "private-file-deletion",
      "auditlog-sanitized-logs-errors",
      "legal-product-approval",
      "ci-secret-safe-evidence",
    ]);
    expect(dashboardPrivacyArtifactPaths).toContain("coverage/dashboard-privacy-runtime.json");
    expect(dashboardPrivacyArtifactPaths).toContain("test-results/dashboard-privacy-runtime");
  });

  it("pins current GAP-040 proof files", () => {
    expect(dashboardPrivacyRuntimeProofFiles).toContain("packages/security/package.json");
    expect(dashboardPrivacyRuntimeProofFiles).toContain("apps/dashboard/package.json");
    expect(dashboardPrivacyRuntimeProofFiles).toContain("apps/dashboard/tests/dashboard-privacy-runtime-static.test.ts");
    for (const file of dashboardPrivacyRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps helper, route projections, trust boundaries, and route tests wired", () => {
    expect(securityPackageJson).toContain('"typecheck"');
    expect(securityPackageJson).toContain('"test"');
    expect(securitySource).toContain("buildDashboardPrivacyWorkflowEvidencePlan");
    expect(securityTests).toContain("buildDashboardPrivacyWorkflowEvidencePlan");
    expect(privacyRoute).toContain("buildDashboardPrivacyWorkflowEvidencePlan");
    expect(privacyRoute).toContain("dashboardPrivacyWorkflowEvidencePlan");
    expect(privacyRoute).toContain("redactRecord");
    expect(privacyRoute).toContain("DASHBOARD_PRIVACY_REQUEST_PERSISTENCE_NOT_CONFIGURED");
    expect(privacyRoute).toContain("inMemoryPrivacyRequestPersistenceDisabled");
    expect(privacyRoute).toContain('"Cache-Control": "no-store"');
    expect(trustRoute).toContain("buildTrustCenterChecklist");
    expect(trustRoute).toContain("DASHBOARD_TRUST_STATUS_PROVIDER_AUTH_NOT_CONFIGURED");
    expect(trustRoute).toContain("headerOnlyTrustPreviewDisabled");
    expect(trustRoute).toContain('"Cache-Control": "no-store"');
    expect(clientDetailRoute).toContain("export async function PATCH");
    expect(clientDetailRoute).toContain('assertPermission(actor, "client:write")');
    expect(clientDetailRoute).toContain("clientPrivateNoteInputSchema.safeParse");
    expect(clientDetailRoute).toContain("rawNoteReturned: false");
    expect(clientDetailRoute).toContain("PROVIDER_CLIENT_WRITE_PERSISTENCE_NOT_CONFIGURED");
    expect(clientDetailActionPanel).toContain("Save private note");
    expect(clientDetailActionPanel).toContain("exports, deletes, and provider sends remain evidence-gated");
    expect(clientReadRouteTest).toContain("wires a gated private-note client write seam");
    expect(formDetailRoute).toContain("export async function PATCH");
    expect(formDetailRoute).toContain("legalCopyChanged: false");
    expect(formDetailRoute).toContain("signatureRequestSent: false");
    expect(formDetailRoute).toContain("rawAnswersTouched: false");
    expect(formActionPanel).toContain("Archive form draft");
    expect(formActionPanel).toContain("private upload retention, and attorney-reviewed copy remain evidence-gated");
    expect(formReadRouteTest).toContain("archive-only form metadata write seam");
    expect(privacyRouteTest).toContain("DASHBOARD_PRIVACY_REQUEST_PERSISTENCE_NOT_CONFIGURED");
    expect(privacyRouteTest).toContain("Persist PrivacyRequest row + case notes");
    expect(trustRouteTest).toContain("tenant and role gates");
  });

  it("keeps workflow blockers explicit until persisted privacy, deletion, audit, legal, CI, and artifact proof exists", () => {
    expect(dashboardPrivacyRuntimeReadiness.status).toBe("blocked");
    expect(dashboardPrivacyRuntimeReadiness.missingScripts).toEqual([]);
    expect(dashboardPrivacyRuntimeReadiness.missingProjectionSurfaces).toEqual([]);
    expect(dashboardPrivacyRuntimeReadiness.missingRouteTestSurfaces).toEqual([]);
    expect(dashboardPrivacyRuntimeReadiness.requiredCommands).toBe(dashboardPrivacyRuntimeCommands);
    expect(dashboardPrivacyRuntimeReadiness.requiredEvidence).toBe(dashboardPrivacyWorkflowEvidenceRequiredEvidence);
    expect(dashboardPrivacyRuntimeReadiness.blockers).not.toContain("Persisted privacy request/case store must back dashboard export/delete workflows.");
    expect(dashboardPrivacyRuntimeReadiness.blockers).toContain("Attorney/product approval must be captured for dashboard privacy behavior.");
  });

  it("blocks dashboard privacy completion when workflows, storage, audit, legal, CI, or safe evidence is missing", () => {
    const decision = buildDashboardPrivacyEvidenceDecision({
      commands: ["pnpm --filter @inkroute/security typecheck"],
      artifacts: ["coverage/dashboard-privacy-security-typecheck.txt"],
      projectionSurfaces: ["client_profile"],
      routeTestSurfaces: ["client_profile"],
      evidence: {
        securityTypecheckPassed: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("legal/product dashboard privacy approval review");
    expect(decision.missingArtifacts).toContain("coverage/dashboard-privacy-secret-safe-artifacts.json");
    expect(decision.missingProjectionSurfaces).toContain("payment");
    expect(decision.missingRouteTestSurfaces).toContain("file_asset");
    expect(decision.missingEvidence).toContain("persistedPrivacyRequestStoreConfigured");
    expect(decision.missingEvidence).toContain("legalApprovalCaptured");
    expect(decision.blockers).toContain(
      "Persisted privacy request/case store must back dashboard export/delete workflows.",
    );
    expect(decision.blockers).toContain("Attorney/product approval must be captured for dashboard privacy behavior.");
  });

  it("completes dashboard privacy readiness only when every command, artifact, surface, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(dashboardPrivacyEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildDashboardPrivacyEvidenceDecision({
      commands: dashboardPrivacyRuntimeCommands,
      artifacts: dashboardPrivacyArtifactPaths,
      projectionSurfaces: dashboardPrivacySurfaces,
      routeTestSurfaces: dashboardPrivacySurfaces,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingProjectionSurfaces).toEqual([]);
    expect(decision.missingRouteTestSurfaces).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toEqual(dashboardPrivacyEvidenceFlags);
  });

  it("separates static dashboard privacy review from workflow execution and redacts private artifacts", () => {
    const executionPlan = buildDashboardPrivacyExecutionPlan();
    const artifactReview = buildDashboardPrivacyArtifactReview({
      tenantDomain: "tenant.example.com",
      clientEmail: "client@example.com",
      medicalNotes: "medical: sensitivity",
      consentSignatureFileUrl: "https://files.example.com/private-file/consent-signature.png",
      nested: {
        smsMessageBody: "sms: private appointment reminder",
        publicSummary: "dashboard privacy evidence captured",
      },
      safeNote:
        "evidence_dashboard_privacy_01HZYXZYXZYXZYXZYXZYXZYXZ wrote artifacts/dashboard-privacy/private-proof.json",
      safeWorkflowPath: "test-results/dashboard-privacy-runtime/private-workflow.json",
      safeLegalApproval: "legal_approval_01HZYXZYXZYXZYXZYXZYXZYXZ",
    });
    const directRedaction = buildRedactedDashboardPrivacyArtifact({
      publicSummary: "safe dashboard privacy evidence",
      deleteWorkflowLog: "private delete payload",
    });

    expect(executionPlan.localCommands).toBe(dashboardPrivacyLocalCommands);
    expect(executionPlan.localCommands).toEqual([
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "static dashboard privacy route projection review",
      "static trust/privacy no-store route guard review",
    ]);
    expect(executionPlan.externalCommands).toBe(dashboardPrivacyExternalCommands);
    expect(executionPlan.externalCommands).toEqual([
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "dashboard privacy route/API tests",
      "persisted dashboard export workflow tests",
      "persisted dashboard delete/anonymize workflow tests",
      "private file deletion integration tests",
      "dashboard privacy AuditLog persistence tests",
      "dashboard sanitized log/error evidence sweep",
      "legal/product dashboard privacy approval review",
      "GitHub Actions dashboard privacy evidence job",
    ]);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.storageExecutionAllowed).toBe(false);
    expect(executionPlan.auditExecutionAllowed).toBe(false);
    expect(executionPlan.legalApprovalExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(dashboardPrivacyExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticPrivacyReadiness: true,
      persistedPrivacyWorkflowRequiredForClosure: true,
      privateFileDeletionRequiredForClosure: true,
      auditLogAndSanitizedRuntimeEvidenceRequiredForClosure: true,
      legalProductApprovalRequiredForClosure: true,
      dashboardTypecheckBuildRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(dashboardPrivacyRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain("persisted privacy request and case store evidence");
    expect(executionPlan.requiredExternalEvidence).toContain("attorney and product approval for privacy consent medical deposit payment SMS message copy");
    expect(executionPlan.requiredExternalEvidence).toContain("secret-safe dashboard privacy artifact review");
    expect(artifactReview.requiredExternalEvidence).toBe(dashboardPrivacyRequiredExternalEvidence);
    expect(artifactReview.redactions).toEqual([
      "tenantDomain",
      "clientEmail",
      "medicalNotes",
      "consentSignatureFileUrl",
      "nested.smsMessageBody",
      "safeNote",
      "safeWorkflowPath",
      "safeLegalApproval",
    ]);
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("tenant.example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("client@example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("medical:");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("consent-signature");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain(
      "evidence_dashboard_privacy_01HZYXZYXZYXZYXZYXZYXZYXZ",
    );
    expect(JSON.stringify(artifactReview.artifact)).not.toContain(
      "artifacts/dashboard-privacy/private-proof.json",
    );
    expect(JSON.stringify(artifactReview.artifact)).not.toContain(
      "test-results/dashboard-privacy-runtime/private-workflow.json",
    );
    expect(JSON.stringify(artifactReview.artifact)).not.toContain(
      "legal_approval_01HZYXZYXZYXZYXZYXZYXZYXZ",
    );
    expect(JSON.stringify(artifactReview.artifact)).toContain("dashboard privacy evidence captured");
    expect(artifactReview.secretSafe).toBe(true);
    expect(directRedaction.redactions).toEqual(["deleteWorkflowLog"]);
    expect(JSON.stringify(directRedaction.artifact)).toContain("safe dashboard privacy evidence");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming legal/runtime privacy readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 5 dashboard privacy runtime contracts");
    expect(ciWorkflow).toContain("dashboard-privacy-runtime-static.test.ts");
    expect(ciWorkflow).toContain("dashboard-privacy-runtime-artifacts");
    expect(unitManifest).toContain("unit-dashboard-privacy-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/dashboardPrivacyRuntime.ts");
    expect(gapTracker).toContain("buildDashboardPrivacyExecutionPlan");
    expect(gapTracker).toContain("dashboardPrivacyLocalCommands/dashboardPrivacyExternalCommands");
    expect(gapTracker).toContain("buildRedactedDashboardPrivacyArtifact");
    expect(gapTracker).toContain("buildDashboardPrivacyArtifactReview");
    expect(gapTracker).toContain("dashboardPrivacyExecutionPolicy");
    expect(gapTracker).toContain("dashboardPrivacyRequiredExternalEvidence");
    expect(gapTracker).toContain("GAP-040 is dashboard-privacy-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("GAP-040 is privacy-route-evidence wired");
    expect(dashboardPrivacyArtifactPaths).toContain("coverage/dashboard-privacy-secret-safe-artifacts.json");
  });
});



