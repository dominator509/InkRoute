import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPrivacyRequestPersistenceContract,
  buildPrivacyWorkflowArtifactReview,
  buildPrivacyWorkflowEvidenceDecision,
  buildPrivacyWorkflowExecutionPlan,
  buildPrivacyRequestWorkflowContract,
  buildRedactedPrivacyWorkflowArtifact,
  privacyRequestPersistencePreview,
  privacyWorkflowArtifactPaths,
  privacyWorkflowCommands,
  privacyWorkflowExternalArtifacts,
  privacyWorkflowExternalCommands,
  privacyWorkflowExecutionPolicy,
  privacyWorkflowLocalArtifacts,
  privacyWorkflowLocalCommands,
  privacyWorkflowProofFiles,
  privacyWorkflowPreview,
  privacyWorkflowRequiredExternalEvidence,
  privacyWorkflowRuntimeContract,
} from "../lib/privacyRequestWorkflow";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("GAP-098 privacy request workflow contract", () => {
  it("builds a case workflow over identity proofing, tenant proofing, workers, status transitions, notifications, and audits", () => {
    const source = readWorkspaceFile("apps/web/lib/privacyRequestWorkflow.ts");

    expect(source).toContain("buildPrivacyCaseWorkflowPlan");
    expect(source).toContain("buildPrivacyRequestRuntimeReadinessPlan");
    expect(source).toContain("persist-privacy-request-case");
    expect(source).toContain("verify-requester-identity");
    expect(source).toContain("prove-tenant-relationship");
    expect(source).toContain("deny-requester-mismatch");
    expect(source).toContain("assemble-export-artifact");
    expect(source).toContain("delete-or-anonymize-postgres-records");
    expect(source).toContain("delete-or-export-private-storage-objects");
    expect(source).toContain("enforce-legal-hold");
    expect(source).toContain("persist-status-transition");
    expect(source).toContain("write-privacy-audit-log");
    expect(privacyWorkflowPreview.workflow.status).toBe("blocked");
    expect(privacyWorkflowPreview.requiredWorkers).toEqual(
      expect.arrayContaining(["identity-verification", "privacy-export", "privacy-delete-or-anonymize", "privacy-notification", "audit-log"]),
    );
    expect(privacyWorkflowPreview.auditEvents).toContain("privacy.case_closed");
  });

  it("pins durable PrivacyRequest rows, status transitions, tenant isolation, and redacted audit writes", () => {
    const schema = readWorkspaceFile("packages/db/prisma/schema.prisma");
    const contract = buildPrivacyRequestPersistenceContract({
      tenantId: "tenant_demo",
      requesterUserId: "user_demo",
      clientId: "client_demo",
      requestType: "deletion",
      status: "legal_hold",
      requesterEmail: "client@example.test",
      requesterName: "Redacted Client",
      identityProofStatus: "verified",
      tenantRelationshipStatus: "verified",
      dueAt: "2026-07-09T00:00:00.000Z",
      legalHold: true,
      legalHoldReason: "payment_and_consent_retention",
      deletionTombstoneObjectKey: "privacy/tenant_demo/case_demo/tombstone.json",
    });

    expect(schema).toContain("model PrivacyRequest");
    expect(schema).toContain("identityProofStatus");
    expect(schema).toContain("tenantRelationshipStatus");
    expect(schema).toContain("exportArtifactObjectKey");
    expect(schema).toContain("@@index([tenantId, dueAt])");
    expect(contract.transactionWrites).toEqual(["PrivacyRequest", "AuditLog"]);
    expect(contract.statusTransitions).toContain("legal_hold");
    expect(contract.auditActions).toContain("privacy.worker.executed");
    expect(contract.redactedFields).toContain("requesterEmail");
    expect(contract.tenantIsolationKey).toBe("tenantId");
    expect(privacyRequestPersistencePreview.modelName).toBe("PrivacyRequest");
  });

  it("keeps public and dashboard intake routes wired to tenant-scoped redacted submissions", () => {
    const publicRoute = readWorkspaceFile("apps/web/app/api/public/[tenantSlug]/privacy-requests/route.ts");
    const dashboardRoute = readWorkspaceFile("apps/dashboard/app/api/security/privacy-requests/route.ts");
    const publicTest = readWorkspaceFile("apps/web/tests/privacy-requests-public-route.test.ts");
    const dashboardTest = readWorkspaceFile("apps/web/tests/privacy-requests-dashboard-route.test.ts");
    const dashboardStatic = readWorkspaceFile("apps/dashboard/tests/security-privacy-route-static.test.ts");

    expect(publicRoute).toContain("persistPrivacyRequest");
    expect(publicRoute).toContain("buildPrivacyRequestDraft");
    expect(publicRoute).toContain("redactRecord");
    expect(dashboardRoute).toContain("resolveDashboardActor");
    expect(dashboardRoute).toContain("checkDashboardMutationRateLimit");
    expect(dashboardRoute).toContain("DASHBOARD_PRIVACY_REQUEST_PERSISTENCE_NOT_CONFIGURED");
    expect(dashboardRoute).toContain("inMemoryPrivacyRequestPersistenceDisabled");
    expect(dashboardRoute).toContain("Persist PrivacyRequest row + case notes");
    expect(publicTest).toContain("persists demo-scope privacy requests");
    expect(dashboardTest).toContain("fail-closes production dashboard privacy requests before in-memory demo persistence");
    expect(dashboardTest).toContain("ROLE_NOT_AUTHORIZED");
    expect(dashboardStatic).toContain("audit persistence");
  });

  it("blocks runtime readiness until identity, workers, storage, legal hold, notification, and cross-tenant proofs exist", () => {
    expect(privacyWorkflowRuntimeContract.status).toBe("blocked");
    expect(privacyWorkflowRuntimeContract.blockers).toEqual(
      expect.arrayContaining([
        "Requester identity proofing must be configured before export/delete/rectification execution.",
        "Tenant relationship proofing must prevent cross-tenant privacy request execution.",
        "Storage export/delete workflow must handle private reference, consent, healed-photo, document, and public derivative objects.",
        "Legal hold handling must retain protected consent, payment, tax, and audit data while explaining partial denial.",
      ]),
    );
    expect(privacyWorkflowRuntimeContract.blockers).not.toContain(
      "PrivacyRequest case persistence must store requester, tenant, type, status, identity proof, due dates, and fulfillment metadata.",
    );
    expect(privacyWorkflowRuntimeContract.blockers).not.toContain(
      "AuditLog persistence must cover intake, identity proofing, worker execution, export delivery, deletion/anonymization, legal hold, and closure.",
    );

    const readyShape = buildPrivacyRequestWorkflowContract({
      requestType: "export",
      categories: ["client_profile", "reference_file", "message", "payment_record"],
      requesterVerified: true,
      tenantMembershipVerified: true,
      caseStoreConfigured: true,
      exportWorkerConfigured: true,
      deletionWorkerConfigured: true,
      notificationProviderConfigured: true,
      auditLogConfigured: true,
      legalReviewApproved: true,
    });

    expect(readyShape.workflow.caseStatus).toBe("ready_for_execution");
    expect(readyShape.actions).toContain("redact-third-party-data");
    expect(readyShape.actions).toContain("send-versioned-notification");
  });

  it("pins commands, artifact paths, CI, manifest, and tracker references for GAP-098", () => {
    const ci = readWorkspaceFile(".github/workflows/ci.yml");
    const manifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
    const tracker = readWorkspaceFile("GAP_TRACKER.md");

    expect(privacyWorkflowCommands).toContain("PrivacyRequest Postgres persistence integration test");
    expect(privacyWorkflowCommands).toContain("object-storage privacy export/delete integration test");
    expect(privacyWorkflowCommands).toContain("cross-tenant privacy requester mismatch denial test");
    expect(privacyWorkflowArtifactPaths).toContain("coverage/privacy-audit-log-persistence.json");
    expect(manifest).toContain("PrivacyRequest Prisma model and app row contract are wired");
    expect(ci).toContain("Run Phase 13 privacy request workflow contracts");
    expect(ci).toContain("apps/web/tests/privacy-request-workflow-static.test.ts");
    expect(ci).toContain("privacy-request-workflow-artifacts");
    expect(manifest).toContain("unit-web-privacy-request-workflow-static");
    expect(tracker).toContain("apps/web/lib/privacyRequestWorkflow.ts");
    expect(tracker).toContain("Privacy request workflow evidence classifier wired and worker proof gated");
    expect(tracker).toContain("privacyWorkflowLocalArtifacts");
    expect(tracker).toContain("privacyWorkflowExternalArtifacts");
  });

  it("pins current privacy request workflow proof files for GAP-098", () => {
    expect(privacyWorkflowProofFiles).toEqual(
      expect.arrayContaining([
      "packages/security/package.json",
        "packages/security/src/index.ts",
        "packages/security/tests/upload-policy.test.ts",
        "apps/web/lib/privacyRequestWorkflow.ts",
        "apps/web/tests/privacy-request-workflow-static.test.ts",
        "apps/web/app/api/public/[tenantSlug]/privacy-requests/route.ts",
        "apps/dashboard/app/api/security/privacy-requests/route.ts",
        "apps/dashboard/components/PrivacyRequestActionPanel.tsx",
        "apps/web/tests/privacy-requests-public-route.test.ts",
        "apps/web/tests/privacy-requests-dashboard-route.test.ts",
        "apps/dashboard/tests/security-privacy-route-static.test.ts",
        "packages/db/prisma/schema.prisma",
        "packages/db/prisma/migrations/20260609001000_add_privacy_requests/migration.sql",
        ".github/workflows/ci.yml",
        "testing/manifests/unit-test-manifest.json",
      ]),
    );
    for (const file of privacyWorkflowProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
    expect(readWorkspaceFile("apps/dashboard/components/PrivacyRequestActionPanel.tsx")).toContain('fetch("/api/security/privacy-requests"');
    expect(readWorkspaceFile("apps/dashboard/components/PrivacyRequestActionPanel.tsx")).toContain("Submit privacy access draft");
  });

  it("classifies GAP-098 evidence as blocked until production privacy worker proof is captured", () => {
    const blockedDecision = buildPrivacyWorkflowEvidenceDecision({
      intakeRoutesPassed: true,
      identityProofCaptured: false,
      tenantRelationshipProofCaptured: false,
      statusPersistenceCaptured: true,
      exportWorkerCaptured: false,
      deleteAnonymizeWorkerCaptured: false,
      storageExportDeleteCaptured: false,
      thirdPartyRedactionCaptured: true,
      legalHoldCaptured: false,
      notificationCaptured: false,
      auditLogPersistenceCaptured: false,
      requesterMismatchDenialCaptured: false,
      requiredCommandsRun: privacyWorkflowCommands.filter(
        (command) =>
          command !== "privacy export worker integration test" &&
          command !== "object-storage privacy export/delete integration test" &&
          command !== "cross-tenant privacy requester mismatch denial test",
      ),
      capturedArtifacts: [
        "coverage/privacy-request-workflow-plan.json",
        "coverage/privacy-status-transition-persistence.json",
        "coverage/privacy-third-party-redaction.json",
        "test-results/privacy-request-workflow",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Capture requester identity proofing evidence.",
        "Capture tenant relationship proofing evidence.",
        "Capture privacy export worker evidence.",
        "Capture object-storage export/delete evidence.",
        "Capture privacy AuditLog persistence evidence.",
        "Capture cross-tenant requester mismatch denial evidence.",
        "Required command not recorded: privacy export worker integration test",
        "Required command not recorded: object-storage privacy export/delete integration test",
        "Required command not recorded: cross-tenant privacy requester mismatch denial test",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/privacy-identity-proof-redacted.json",
        "coverage/privacy-tenant-relationship-proof.json",
        "coverage/privacy-export-artifact-redacted.json",
        "coverage/privacy-storage-export-delete.json",
        "coverage/privacy-audit-log-persistence.json",
      ]),
    );
    expect(blockedDecision.redactionPolicy).toEqual({
      requesterPiiRedacted: true,
      exportObjectKeysRedacted: true,
      thirdPartyDataRedacted: true,
    });

    const completeDecision = buildPrivacyWorkflowEvidenceDecision({
      intakeRoutesPassed: true,
      identityProofCaptured: true,
      tenantRelationshipProofCaptured: true,
      statusPersistenceCaptured: true,
      exportWorkerCaptured: true,
      deleteAnonymizeWorkerCaptured: true,
      storageExportDeleteCaptured: true,
      thirdPartyRedactionCaptured: true,
      legalHoldCaptured: true,
      notificationCaptured: true,
      auditLogPersistenceCaptured: true,
      requesterMismatchDenialCaptured: true,
      requiredCommandsRun: privacyWorkflowCommands,
      capturedArtifacts: privacyWorkflowArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(privacyWorkflowCommands);
    expect(completeDecision.requiredEvidence).toBe(privacyWorkflowArtifactPaths);
  });

  it("keeps GAP-098 privacy worker execution disabled in the local plan", () => {
    const plan = buildPrivacyWorkflowExecutionPlan();

    expect(plan.identityProofingExecutionAllowed).toBe(false);
    expect(plan.postgresWorkerExecutionAllowed).toBe(false);
    expect(plan.storageExportDeleteExecutionAllowed).toBe(false);
    expect(plan.notificationExecutionAllowed).toBe(false);
    expect(plan.legalHoldExecutionAllowed).toBe(false);
    expect(plan.crossTenantExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(privacyWorkflowExecutionPolicy);
    expect(plan.policy).toEqual({
      identityProofingExecutionAllowed: false,
      postgresWorkerExecutionAllowed: false,
      storageExportDeleteExecutionAllowed: false,
      notificationExecutionAllowed: false,
      legalHoldExecutionAllowed: false,
      crossTenantExecutionAllowed: false,
      thirdPartyRedactionExecutionAllowed: false,
    });
    expect(plan.localCommands).toBe(privacyWorkflowLocalCommands);
    expect(plan.externalCommands).toBe(privacyWorkflowExternalCommands);
    expect(plan.localArtifacts).toBe(privacyWorkflowLocalArtifacts);
    expect(plan.externalArtifacts).toBe(privacyWorkflowExternalArtifacts);
    expect(plan.externalArtifacts).toEqual(expect.arrayContaining([
      "coverage/privacy-identity-proof-redacted.json",
      "coverage/privacy-export-artifact-redacted.json",
      "coverage/privacy-storage-export-delete.json",
      "coverage/privacy-notification-version-redacted.json",
      "coverage/privacy-audit-log-persistence.json",
    ]));
    expect(plan.requiredExternalEvidence).toBe(privacyWorkflowRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toEqual([
      "requester identity proofing evidence",
      "tenant relationship proofing evidence",
      "PrivacyRequest Postgres persistence and worker execution proof",
      "object-storage privacy export/delete evidence",
      "privacy notification and AuditLog persistence evidence",
      "cross-tenant requester mismatch denial proof",
    ]);
    expect(plan.disabledReasons.join(" ")).toContain("Requester identity proofing requires production identity verification evidence.");
  });

  it("redacts GAP-098 requester, third-party, export, and notification artifacts before review", () => {
    const rawArtifact = {
      requesterEmail: "client@example.com",
      requesterName: "Client Name",
      exportArtifactObjectKey: "privacy/tenant_demo/case_demo/export.zip",
      deletionTombstoneObjectKey: "privacy/tenant_demo/case_demo/tombstone.json",
      notificationBody: "Your export is ready for client@example.com",
      thirdPartyData: { artistEmail: "artist@example.com", phone: "+1 555 444 3333" },
      workerPayload: ["Authorization: Bearer privacy-secret-token", "contact +1 555 222 1111"],
      stack: "Error: privacy worker failed",
    };

    const redacted = buildRedactedPrivacyWorkflowArtifact(rawArtifact);
    const review = buildPrivacyWorkflowArtifactReview(rawArtifact);
    const serialized = JSON.stringify({ redacted, review });

    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("Client Name");
    expect(serialized).not.toContain("privacy/tenant_demo/case_demo/export.zip");
    expect(serialized).not.toContain("privacy/tenant_demo/case_demo/tombstone.json");
    expect(serialized).not.toContain("artist@example.com");
    expect(serialized).not.toContain("+1 555 444 3333");
    expect(serialized).not.toContain("privacy-secret-token");
    expect(serialized).toContain("[REDACTED]");
    expect(review.requiredArtifacts).toBe(privacyWorkflowArtifactPaths);
    expect(review.retainedExternalGates).toEqual(expect.arrayContaining([
      "Requester identity proofing evidence",
      "Object-storage privacy export/delete evidence",
      "Cross-tenant requester mismatch denial evidence",
    ]));
  });
});

