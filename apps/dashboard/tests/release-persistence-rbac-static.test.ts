import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildOptimisticConcurrencyMetadata,
  buildReleasePersistenceRbacContract,
  buildReleaseWorkflowOrchestrationMetadata,
  buildTenantMembershipLookupMetadata,
  releasePersistenceRbacArtifactPaths,
  resolveReleaseApprovalState,
} from "../lib/releaseControlPlane";

const root = join(__dirname, "..", "..");
const releaseRoute = readFileSync(join(root, "apps/dashboard/app/api/releases/route.ts"), "utf8");
const flagRoute = readFileSync(join(root, "apps/dashboard/app/api/feature-flags/route.ts"), "utf8");
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
      requiresProtectedEnvironment: true,
    });
  });

  it("adds optimistic concurrency and tenant membership metadata helpers", () => {
    expect(buildOptimisticConcurrencyMetadata({ expectedVersion: "v1", currentVersion: "v2", recordId: "rec_1" })).toMatchObject({
      conflict: true,
      strategy: "client-supplied expected version compared before orchestration",
    });
    expect(buildTenantMembershipLookupMetadata({ actorSource: "header", actorRole: "owner", tenantId: "tenant_1" })).toMatchObject({
      source: "local-fallback",
      requiredNextStep: null,
    });
    expect(buildTenantMembershipLookupMetadata({ actorSource: "database-tenant-member", actorRole: "owner", tenantId: "tenant_1", actorUserId: "user_1", membershipId: "member_1", status: "active" })).toMatchObject({
      source: "database-tenant-member",
      actorUserId: "user_1",
      membershipId: "member_1",
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
    expect(releaseRoute).toContain("buildReleaseWorkflowOrchestrationMetadata");
    expect(releaseRoute).toContain("releasePersistenceRbacArtifactPaths");
  });

  it("wires concurrency, approval audit metadata, and invalidation hooks into feature-flag writes", () => {
    expect(flagRoute).toContain("assertPermissionWithTenantMembership");
    expect(flagRoute).toContain("x-feature-flag-expected-version");
    expect(flagRoute).toContain("FEATURE_FLAG_CONCURRENCY_CONFLICT");
    expect(flagRoute).toContain("settings-write-approved");
    expect(flagRoute).toContain("feature-flag-runtime-invalidation-pending");
    expect(flagRoute).toContain("previousEnabled");
    expect(flagRoute).toContain("previousScope");
    expect(flagRoute).toContain("releasePersistenceRbacArtifactPaths");
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

  it("is wired into CI and GAP-088 tracker evidence", () => {
    expect(workflow).toContain("Run Phase 12 release persistence RBAC contracts");
    expect(workflow).toContain("apps/dashboard/tests/release-persistence-rbac-static.test.ts");
    expect(workflow).toContain("release-persistence-rbac-artifacts");
    expect(tracker).toContain("GAP-088");
    expect(tracker).toContain("apps/dashboard/lib/releaseControlPlane.ts");
    expect(tracker).toContain("server-side TenantMember lookup is wired");
    expect(tracker).toContain("DB-backed runtime proof remains open");
  });
});
