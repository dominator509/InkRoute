import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPrivacyRequestWorkflowContract,
  privacyWorkflowArtifactPaths,
  privacyWorkflowCommands,
  privacyWorkflowPreview,
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
    expect(dashboardRoute).toContain("Persist PrivacyRequest row + case notes");
    expect(publicTest).toContain("persists demo-scope privacy requests");
    expect(dashboardTest).toContain("ROLE_NOT_AUTHORIZED");
    expect(dashboardStatic).toContain("audit persistence");
  });

  it("blocks runtime readiness until Postgres, storage, legal hold, notification, audit, and cross-tenant proofs exist", () => {
    expect(privacyWorkflowRuntimeContract.status).toBe("blocked");
    expect(privacyWorkflowRuntimeContract.blockers).toEqual(
      expect.arrayContaining([
        "PrivacyRequest case persistence must store requester, tenant, type, status, identity proof, due dates, and fulfillment metadata.",
        "Requester identity proofing must be configured before export/delete/rectification execution.",
        "Tenant relationship proofing must prevent cross-tenant privacy request execution.",
        "Storage export/delete workflow must handle private reference, consent, healed-photo, document, and public derivative objects.",
        "Legal hold handling must retain protected consent, payment, tax, and audit data while explaining partial denial.",
        "AuditLog persistence must cover intake, identity proofing, worker execution, export delivery, deletion/anonymization, legal hold, and closure.",
      ]),
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
    expect(ci).toContain("Run Phase 13 privacy request workflow contracts");
    expect(ci).toContain("apps/web/tests/privacy-request-workflow-static.test.ts");
    expect(ci).toContain("privacy-request-workflow-artifacts");
    expect(manifest).toContain("unit-web-privacy-request-workflow-static");
    expect(tracker).toContain("apps/web/lib/privacyRequestWorkflow.ts");
    expect(tracker).toContain("production privacy worker proof remains open");
  });
});
