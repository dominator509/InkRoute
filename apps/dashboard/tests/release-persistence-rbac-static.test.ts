import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildOptimisticConcurrencyMetadata,
  buildRedactedReleasePersistenceRbacArtifact,
  buildReleasePersistenceRbacArtifactReview,
  buildReleasePersistenceRbacEvidenceDecision,
  buildReleasePersistenceRbacContract,
  buildReleasePersistenceRbacExecutionPlan,
  buildReleaseWorkflowOrchestrationMetadata,
  buildTenantMembershipLookupMetadata,
  releasePersistenceRbacArtifactPaths,
  releasePersistenceRbacCommands,
  releasePersistenceRbacDecisionRequiredEvidence,
  releasePersistenceRbacExecutionPolicy,
  releasePersistenceRbacProofFiles,
  releasePersistenceRbacRequiredExternalEvidence,
  resolveReleaseApprovalState,
} from "../lib/releaseControlPlane";

const root = join(__dirname, "..", "..");
const releaseRoute = readFileSync(join(root, "apps/dashboard/app/api/releases/route.ts"), "utf8");
const flagRoute = readFileSync(join(root, "apps/dashboard/app/api/feature-flags/route.ts"), "utf8");
const dashboardAuthMembership = readFileSync(join(root, "apps/dashboard/app/api/dashboardAuthMembership.ts"), "utf8");
const workflow = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const tracker = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");

describe("release persistence RBAC runtime seam", () => {
  it("models approval states and workflow orchestration hooks", () => {
    expect(resolveReleaseApprovalState({ channel: "production", requestedState: null, productionBlocked: false, actorRole: "owner" })).toBe("pending_approval");
    expect(resolveReleaseApprovalState({ channel: "production", requestedState: "approved", productionBlocked: false, actorRole: "owner" })).toBe("approved");
    expect(resolveReleaseApprovalState({ channel: "production", requestedState: "approved", productionBlocked: true, actorRole: "owner" })).toBe("blocked");
    expect(buildReleaseWorkflowOrchestrationMetadata({ approvalState: "approved", channel: "production", recordId: "rel_1" })).toMatchObject({
      state: "ready_for_release_governance",
      hook: ".github/workflows/release-governance.yml",
      recordMatched: true,
      recordIdEchoed: false,
      requiresProtectedEnvironment: true,
    });
    expect(buildReleaseWorkflowOrchestrationMetadata({ approvalState: "approved", channel: "production", recordId: "rel_1" })).not.toHaveProperty("recordId");
  });

  it("adds optimistic concurrency and tenant membership metadata helpers", () => {
    expect(buildOptimisticConcurrencyMetadata({ expectedVersion: "v1", currentVersion: "v2", recordId: "rec_1" })).toMatchObject({
      conflict: true,
      recordMatched: true,
      recordIdEchoed: false,
      strategy: "client-supplied expected version compared before orchestration",
    });
    expect(buildOptimisticConcurrencyMetadata({ expectedVersion: "v1", currentVersion: "v2", recordId: "rec_1" })).not.toHaveProperty("recordId");
    expect(buildTenantMembershipLookupMetadata({ actorSource: "header", actorRole: "owner", tenantId: "tenant_1" })).toMatchObject({
      source: "local-fallback",
      requiredNextStep: null,
    });
    expect(buildTenantMembershipLookupMetadata({ actorSource: "database-tenant-member", actorRole: "owner", tenantId: "tenant_1", actorUserId: "user_1", membershipId: "member_1", status: "active" })).toMatchObject({
      source: "database-tenant-member",
      actorUserIdEchoed: false,
      tenantIdEchoed: false,
      membershipVerified: true,
      membershipIdEchoed: false,
      customRoleIdEchoed: false,
      status: "active",
      requiredNextStep: null,
    });
  });

  it("wires approval, concurrency, membership, and orchestration into release writes", () => {
    expect(releaseRoute).toContain("assertPermissionWithTenantMembership");
    expect(releaseRoute).toContain("x-release-expected-version");
    expect(releaseRoute).toContain("x-release-approval-state");
    expect(releaseRoute).toContain("resolveReleaseApprovalState");
    expect(releaseRoute).toContain("RELEASE_CONCURRENCY_CONFLICT");
    expect(releaseRoute).toContain("membershipLookup");
    expect(releaseRoute).toContain("tx.idempotencyKey.upsert");
    expect(releaseRoute).toContain("tx.idempotencyKey.update");
    expect(releaseRoute).toContain("idempotencyKeyId");
    expect(releaseRoute).toContain("buildReleaseWorkflowOrchestrationMetadata");
    expect(releaseRoute).toContain("releasePersistenceRbacArtifactPaths");
    expect(releaseRoute).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(releaseRoute).toContain("{ status: 201, headers: noStoreHeaders }");
  });

  it("fail-closes local dashboard membership fallback in production", () => {
    expect(dashboardAuthMembership).toContain('if (context.source === "local-fallback")');
    expect(dashboardAuthMembership).toContain('process.env.NODE_ENV === "production"');
    expect(dashboardAuthMembership).toContain('throw new Error("AUTH_REQUIRED")');
    expect(dashboardAuthMembership).toContain("production requires provider-backed session plus persisted TenantMember lookup");
  });

  it("wires concurrency, approval audit metadata, and invalidation hooks into feature-flag writes", () => {
    expect(flagRoute).toContain("assertPermissionWithTenantMembership");
    expect(flagRoute).toContain("x-feature-flag-expected-version");
    expect(flagRoute).toContain("FEATURE_FLAG_CONCURRENCY_CONFLICT");
    expect(flagRoute).toContain("tx.idempotencyKey.upsert");
    expect(flagRoute).toContain("tx.idempotencyKey.update");
    expect(flagRoute).toContain("idempotencyKeyId");
    expect(flagRoute).toContain("settings-write-approved");
    expect(flagRoute).toContain("feature-flag-runtime-invalidation-applied");
    expect(flagRoute).toContain("previousEnabled");
    expect(flagRoute).toContain("previousScope");
    expect(flagRoute).toContain("releasePersistenceRbacArtifactPaths");
    expect(flagRoute).toContain("PROVIDER_FEATURE_FLAG_PERSISTENCE_NOT_CONFIGURED");
    expect(flagRoute).toContain("localFeatureFlagFallbackDisabled");
    expect(flagRoute).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(flagRoute).toContain("{ status: 201, headers: noStoreHeaders }");
  });

  it("keeps remaining runtime evidence explicit through the package readiness planner", () => {
    const contract = buildReleasePersistenceRbacContract();

    expect(contract.status).toBe("blocked");
    expect(contract.blockers).toEqual(
      expect.arrayContaining([
        "Rendered dashboard release and feature-flag workflow tests must pass.",
        "DB-backed runtime route tests must verify persisted release/flag behavior with tenant isolation.",
      ]),
    );
    expect(contract.blockers).not.toContain("Tenant membership lookups must replace trusted-header-only authorization.");
    expect(releasePersistenceRbacArtifactPaths).toContain("coverage/release-db-backed-route-proof.json");
  });

  it("builds a local execution plan without rendered workflow, DB-backed runtime, or protected environment execution", () => {
    const plan = buildReleasePersistenceRbacExecutionPlan();

    expect(plan.id).toBe("gap-088-release-persistence-rbac");
    expect(plan.renderedWorkflowExecutionAllowed).toBe(false);
    expect(plan.dbBackedRuntimeExecutionAllowed).toBe(false);
    expect(plan.protectedEnvironmentExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(releasePersistenceRbacExecutionPolicy);
    expect(plan.policy).toEqual({
      executeRenderedWorkflow: false,
      executeDbBackedRuntime: false,
      executeProtectedEnvironmentOrchestration: false,
      executeDashboardTypecheck: false,
      executeCi: false,
    });
    expect(plan.requiredCommands).toBe(releasePersistenceRbacCommands);
    expect(plan.requiredArtifacts).toBe(releasePersistenceRbacArtifactPaths);
    expect(plan.localControlPlaneArtifacts).toEqual(
      expect.arrayContaining(["coverage/release-approval-state-machine.json", "coverage/release-optimistic-concurrency.json"]),
    );
    expect(plan.renderedWorkflowArtifacts).toEqual(["coverage/release-rendered-workflow-smoke.json"]);
    expect(plan.dbBackedArtifacts).toEqual(["coverage/release-db-backed-route-proof.json"]);
    expect(plan.orchestrationArtifacts).toEqual(["coverage/release-orchestration-hook.json"]);
    expect(plan.externalEvidenceRequired).toBe(releasePersistenceRbacRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toEqual([
      "rendered dashboard release and feature-flag workflow smoke",
      "DB-backed release/feature-flag route concurrency and tenant-isolation integration tests",
      "release-governance protected-environment orchestration proof",
      "dashboard typecheck evidence and CI artifact attachment",
    ]);
  });

  it("redacts release persistence and RBAC artifacts before persistence", () => {
    const rawArtifact = {
      database: {
        authorization: "Bearer release-db-token",
        tenantId: "tenant_release_control_private",
        actorUserId: "user_release_admin_private",
        membershipId: "tenant_member_release_private",
        customRoleId: "custom_role_release_private",
        releaseRecordId: "release_record_private",
        featureFlagId: "feature_flag_private",
        auditId: "audit_release_private",
        idempotencyKey: "idem_release_private",
        actorEmail: "release-admin@example.com",
        phone: "+1 555 010 3333",
      },
      workflow: {
        workflowRunId: "workflow_run_release_private",
        workflowRunUrl: "https://ci.example.invalid/workflow/private",
        commitSha: "0123456789abcdef0123456789abcdef01234567",
        secret: "github_pat_release_secret",
        state: "ready_for_release_governance",
      },
    };

    const redacted = buildRedactedReleasePersistenceRbacArtifact(rawArtifact);
    const review = buildReleasePersistenceRbacArtifactReview("release-db-backed-route-proof", rawArtifact);
    const serialized = JSON.stringify(review.redactedArtifact);

    expect(JSON.stringify(redacted)).not.toContain("release-db-token");
    expect(serialized).not.toContain("tenant_release_control_private");
    expect(serialized).not.toContain("user_release_admin_private");
    expect(serialized).not.toContain("tenant_member_release_private");
    expect(serialized).not.toContain("custom_role_release_private");
    expect(serialized).not.toContain("release_record_private");
    expect(serialized).not.toContain("feature_flag_private");
    expect(serialized).not.toContain("audit_release_private");
    expect(serialized).not.toContain("idem_release_private");
    expect(serialized).not.toContain("workflow_run_release_private");
    expect(serialized).not.toContain("https://ci.example.invalid/workflow/private");
    expect(serialized).not.toContain("0123456789abcdef0123456789abcdef01234567");
    expect(serialized).not.toContain("release-admin@example.com");
    expect(serialized).not.toContain("+1 555 010 3333");
    expect(serialized).not.toContain("github_pat_release_secret");
    expect(serialized).toContain("ready_for_release_governance");
    expect(review.safeToPersist).toBe(true);
    expect(review.unsafeFindings).toEqual([]);
    expect(review.requiredArtifactPath).toBe("coverage/release-db-backed-route-proof.json");
  });

  it("pins current release persistence/RBAC proof files for GAP-088", () => {
    expect(releasePersistenceRbacProofFiles).toEqual(
      expect.arrayContaining([
      "apps/dashboard/package.json",
      "packages/releases/package.json",
        "packages/releases/src/index.ts",
        "packages/releases/tests/feature-flags.test.ts",
        "apps/dashboard/lib/releaseControlPlane.ts",
        "apps/dashboard/app/api/releases/route.ts",
        "apps/dashboard/app/api/feature-flags/route.ts",
        "apps/dashboard/app/api/dashboardAuth.ts",
        "apps/web/tests/dashboard-release-rbac-static.test.ts",
        "apps/dashboard/tests/release-route-static.test.ts",
        "apps/dashboard/tests/feature-flag-route-static.test.ts",
        "apps/dashboard/tests/release-persistence-rbac-static.test.ts",
        "packages/db/prisma/schema.prisma",
        "apps/dashboard/app/releases/page.tsx",
        "apps/dashboard/components/ReleaseActionPanel.tsx",
        ".github/workflows/release-governance.yml",
        ".github/workflows/ci.yml",
        "testing/manifests/unit-test-manifest.json",
      ]),
    );
    for (const file of releasePersistenceRbacProofFiles) {
      expect(readFileSync(join(root, file), "utf8").length).toBeGreaterThan(0);
    }
  });

  it("classifies GAP-088 release persistence/RBAC evidence as blocked until rendered, DB-backed, and orchestration proof is captured", () => {
    const blocked = buildReleasePersistenceRbacEvidenceDecision({
      releasesTypecheckPassed: true,
      releasesTestsPassed: true,
      dashboardStaticRouteTestsPassed: true,
      dashboardTypecheckPassed: true,
      approvalStateMachineVerified: true,
      optimisticConcurrencyVerified: true,
      tenantMembershipLookupVerified: true,
      renderedDashboardWorkflowPassed: false,
      releaseOrchestrationProofCaptured: false,
      dbBackedRuntimeRouteTestsPassed: false,
      ciArtifactsAttached: false,
      capturedArtifacts: ["coverage/release-persistence-rbac.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Rendered dashboard release/feature-flag workflow evidence is required.",
        "Protected release-governance orchestration proof is required.",
        "DB-backed release/feature-flag runtime route proof is required.",
        "Release persistence RBAC CI artifact evidence is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/release-rendered-workflow-smoke.json");
    expect(blocked.requiredCommands).toBe(releasePersistenceRbacCommands);
    expect(blocked.requiredEvidence).toBe(releasePersistenceRbacDecisionRequiredEvidence);

    const complete = buildReleasePersistenceRbacEvidenceDecision({
      releasesTypecheckPassed: true,
      releasesTestsPassed: true,
      dashboardStaticRouteTestsPassed: true,
      dashboardTypecheckPassed: true,
      approvalStateMachineVerified: true,
      optimisticConcurrencyVerified: true,
      tenantMembershipLookupVerified: true,
      renderedDashboardWorkflowPassed: true,
      releaseOrchestrationProofCaptured: true,
      dbBackedRuntimeRouteTestsPassed: true,
      ciArtifactsAttached: true,
      capturedArtifacts: releasePersistenceRbacArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.requiredEvidence).toBe(releasePersistenceRbacDecisionRequiredEvidence);
    expect(complete.redactedSummary).toContain("CI-safe artifacts captured");
  });

  it("is wired into CI and GAP-088 tracker evidence", () => {
    expect(workflow).toContain("Run Phase 12 release persistence RBAC contracts");
    expect(workflow).toContain("apps/dashboard/tests/release-persistence-rbac-static.test.ts");
    expect(workflow).toContain("release-persistence-rbac-artifacts");
    expect(tracker).toContain("GAP-088");
    expect(tracker).toContain("apps/dashboard/lib/releaseControlPlane.ts");
    expect(tracker).toContain("server-side TenantMember lookup metadata");
    expect(tracker).toContain("Release persistence/RBAC is DB-proof gated");
    expect(tracker).toContain("release persistence/RBAC evidence classifier");
    expect(tracker).toContain("releasePersistenceRbacDecisionRequiredEvidence");
    expect(tracker).toContain("DB-backed runtime proof");
  });
});
