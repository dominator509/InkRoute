import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildRedactedReleaseRuntimeVerificationArtifact,
  buildReleaseRuntimeVerificationArtifactReview,
  buildReleaseRuntimeVerificationEvidenceDecision,
  buildReleaseRuntimeVerificationContract,
  buildReleaseRuntimeVerificationExecutionPlan,
  releaseRuntimeVerificationArtifactPaths,
  releaseRuntimeVerificationCommands,
  releaseRuntimeVerificationDecisionRequiredEvidence,
  releaseRuntimeVerificationExecutionPolicy,
  releaseRuntimeVerificationMatrix,
  releaseRuntimeVerificationProofFiles,
  releaseRuntimeVerificationRequiredExternalEvidence,
} from "../lib/releaseRuntimeVerification";

const root = join(__dirname, "..", "..");
const releaseHealthRoute = readFileSync(join(root, "apps/web/app/api/public/[tenantSlug]/release-health/route.ts"), "utf8");
const dashboardReleaseRoute = readFileSync(join(root, "apps/dashboard/app/api/releases/route.ts"), "utf8");
const dashboardFlagRoute = readFileSync(join(root, "apps/dashboard/app/api/feature-flags/route.ts"), "utf8");
const workflowSource = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const releaseGovernanceWorkflow = readFileSync(join(root, ".github/workflows/release-governance.yml"), "utf8");
const trackerSource = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");

describe("release runtime verification contract", () => {
  it("tracks package, release-health, dashboard route, build, and workflow targets", () => {
    expect(releaseRuntimeVerificationCommands).toEqual(
      expect.arrayContaining([
        "pnpm --filter @inkroute/releases typecheck",
        "pnpm --filter @inkroute/releases test",
        "pnpm --filter @inkroute/web build",
        "pnpm --filter @inkroute/dashboard build",
        "pnpm --filter @inkroute/mobile typecheck",
        "release-governance workflow dry run",
      ]),
    );
    expect(releaseRuntimeVerificationMatrix.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "release-package-contracts",
        "public-release-health-route",
        "dashboard-release-route-smoke",
        "dashboard-feature-flag-route-smoke",
        "web-dashboard-mobile-builds",
        "release-governance-workflow",
      ]),
    );
  });

  it("pins release-health and dashboard route smoke surfaces", () => {
    expect(releaseHealthRoute).toContain("ReleaseRecord");
    expect(releaseHealthRoute).toContain("featureFlags");
    expect(releaseHealthRoute).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(releaseHealthRoute).toContain("{ headers: noStoreHeaders }");
    expect(releaseHealthRoute).toContain("tenantIdEchoed: false");
    expect(releaseHealthRoute).toContain("releaseRecordIdEchoed: false");
    expect(releaseHealthRoute).toContain("releaseCandidateIdEchoed: false");
    expect(releaseHealthRoute).toContain("commitShaEchoed: false");
    expect(releaseHealthRoute).toContain("runtimeContextTenantIdEchoed: false");
    expect(releaseHealthRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(releaseHealthRoute).not.toContain("tenantId: tenantResolution.tenantId,\n        source");
    expect(releaseHealthRoute).not.toContain("tenantId: productionDecisionContext.tenantId");
    expect(releaseHealthRoute).not.toContain("id: entry.id,\n          version");
    expect(dashboardReleaseRoute).toContain("Cache-Control");
    expect(dashboardReleaseRoute).toContain("release:read");
    expect(dashboardFlagRoute).toContain("feature_flag:read:list");
    expect(dashboardFlagRoute).toContain("Cache-Control");
  });

  it("keeps GitHub Actions workflow proof gated and artifact-backed", () => {
    expect(releaseGovernanceWorkflow).toContain("workflow_dispatch");
    expect(releaseGovernanceWorkflow).toContain("migration");
    expect(releaseRuntimeVerificationArtifactPaths).toContain("coverage/release-governance-workflow-dry-run-redacted.json");
    expect(releaseRuntimeVerificationArtifactPaths).toContain("test-results/release-governance");
  });

  it("pins current release runtime verification proof files for GAP-087", () => {
    expect(releaseRuntimeVerificationProofFiles).toEqual(
      expect.arrayContaining([
      "apps/dashboard/package.json",
      "apps/mobile/package.json",
      "apps/web/package.json",
        "packages/releases/package.json",
        "packages/releases/src/index.ts",
        "packages/releases/tests/feature-flags.test.ts",
        "apps/web/lib/releaseRuntimeVerification.ts",
        "apps/web/tests/release-runtime-verification-static.test.ts",
        "apps/web/app/api/public/[tenantSlug]/release-health/route.ts",
        "apps/web/tests/release-health-route.test.ts",
        "apps/dashboard/app/releases/page.tsx",
        "apps/dashboard/components/ReleaseActionPanel.tsx",
        "apps/dashboard/app/api/releases/route.ts",
        "apps/dashboard/app/api/feature-flags/route.ts",
        "apps/dashboard/tests/release-route-static.test.ts",
        "apps/dashboard/tests/feature-flag-route-static.test.ts",
        ".github/workflows/release-governance.yml",
        ".github/workflows/ci.yml",
        "packages/mobile/package.json",
        "apps/mobile/src/screens/SystemStatusScreen.tsx",
        "testing/manifests/unit-test-manifest.json",
      ]),
    );
    for (const file of releaseRuntimeVerificationProofFiles) {
      expect(readFileSync(join(root, file), "utf8").length).toBeGreaterThan(0);
    }
  });

  it("uses the release package readiness planner without claiming unrun builds", () => {
    const contract = buildReleaseRuntimeVerificationContract();

    expect(contract.status).toBe("blocked");
    expect(contract.blockers).toEqual(
      expect.arrayContaining([
        "@inkroute/releases tests must pass before release runtime verification.",
        "Web app build must pass under release runtime dependencies.",
        "Dashboard app build must pass under release runtime dependencies.",
        "Release-governance GitHub Actions workflow dry-run or dispatch proof is required.",
      ]),
    );
    expect(contract.requiredEvidence).toBe(releaseRuntimeVerificationRequiredEvidence);
  });

  it("builds a local release execution plan without build, GitHub Actions, or mobile typecheck execution", () => {
    const plan = buildReleaseRuntimeVerificationExecutionPlan();

    expect(plan.id).toBe("gap-087-release-runtime-verification");
    expect(plan.buildExecutionAllowed).toBe(false);
    expect(plan.githubActionsExecutionAllowed).toBe(false);
    expect(plan.mobileTypecheckExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(releaseRuntimeVerificationExecutionPolicy);
    expect(plan.policy).toEqual({
      executeWebBuild: false,
      executeDashboardBuild: false,
      executeMobileTypecheck: false,
      executeDashboardRouteSmokes: false,
      executeReleaseGovernanceWorkflow: false,
      executeCi: false,
    });
    expect(plan.requiredCommands).toBe(releaseRuntimeVerificationCommands);
    expect(plan.requiredArtifacts).toBe(releaseRuntimeVerificationArtifactPaths);
    expect(plan.localRouteArtifacts).toEqual(
      expect.arrayContaining(["coverage/release-health-route-smoke.json", "coverage/release-feature-flag-route-smoke.json"]),
    );
    expect(plan.buildArtifacts).toEqual(
      expect.arrayContaining(["coverage/release-web-build.log", "coverage/release-dashboard-build.log", "coverage/release-mobile-typecheck.log"]),
    );
    expect(plan.workflowArtifacts).toEqual(["coverage/release-governance-workflow-dry-run-redacted.json"]);
    expect(plan.externalEvidenceRequired).toBe(releaseRuntimeVerificationRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toEqual([
      "web typecheck and build",
      "dashboard build",
      "mobile typecheck",
      "dashboard release and feature-flag runtime route smokes",
      "release-governance workflow dry run and GitHub Actions proof",
      "CI artifact attachment",
    ]);
  });

  it("redacts release workflow and build artifacts before persistence", () => {
    const rawArtifact = {
      workflow: {
        actorEmail: "release-owner@example.com",
        githubToken: "ghp_releaseWorkflowToken",
        command: "release-governance workflow dry run",
      },
      buildLog: "Build failed with token sk_live_secret and phone +1 555 010 2222",
      routeSmokeUrl: "https://preview.example.com/api/public/demo/release-health?run=workflow_run_123",
      rawRoutePayload: { tenantId: "tenant_release_123", releaseRecordId: "release_record_123" },
      ciArtifactPath: "coverage/release-runtime/raw-workflow-log.json",
      commitSha: "commit_abcdef123456",
      stackTrace: "Error: release runtime verification leaked workflow_run_123",
    };

    const redacted = buildRedactedReleaseRuntimeVerificationArtifact(rawArtifact);
    const review = buildReleaseRuntimeVerificationArtifactReview("release-governance-workflow-dry-run", rawArtifact);
    const serialized = JSON.stringify(review.redactedArtifact);

    expect(JSON.stringify(redacted)).not.toContain("release-owner@example.com");
    expect(serialized).not.toContain("ghp_releaseWorkflowToken");
    expect(serialized).not.toContain("sk_live_secret");
    expect(serialized).not.toContain("+1 555 010 2222");
    expect(serialized).not.toContain("preview.example.com");
    expect(serialized).not.toContain("workflow_run_123");
    expect(serialized).not.toContain("tenant_release_123");
    expect(serialized).not.toContain("release_record_123");
    expect(serialized).not.toContain("raw-workflow-log.json");
    expect(serialized).not.toContain("commit_abcdef123456");
    expect(serialized).not.toContain("release runtime verification leaked");
    expect(review.safeToPersist).toBe(true);
    expect(review.unsafeFindings).toEqual([]);
    expect(review.requiredArtifactPath).toBe("coverage/release-governance-workflow-dry-run-redacted.json");
  });

  it("classifies GAP-087 release runtime evidence as blocked until every build, route, and workflow artifact is captured", () => {
    const blocked = buildReleaseRuntimeVerificationEvidenceDecision({
      releasesTypecheckPassed: true,
      releasesTestsPassed: true,
      releaseHealthRouteSmokePassed: true,
      dashboardReleaseRouteSmokePassed: false,
      dashboardFeatureFlagRouteSmokePassed: false,
      webTypecheckPassed: true,
      webBuildPassed: false,
      dashboardBuildPassed: false,
      mobileTypecheckPassed: false,
      releaseGovernanceWorkflowDryRunPassed: false,
      githubActionsWorkflowEvidenceCaptured: false,
      ciArtifactsAttached: false,
      capturedArtifacts: ["coverage/release-runtime-verification.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Dashboard release route smoke evidence is required.",
        "Web build evidence is required.",
        "Dashboard build evidence is required.",
        "Release-governance workflow dry-run evidence is required.",
        "GitHub Actions workflow evidence is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/release-dashboard-route-smoke.json");
    expect(blocked.requiredCommands).toBe(releaseRuntimeVerificationCommands);
    expect(blocked.requiredEvidence).toBe(releaseRuntimeVerificationDecisionRequiredEvidence);

    const complete = buildReleaseRuntimeVerificationEvidenceDecision({
      releasesTypecheckPassed: true,
      releasesTestsPassed: true,
      releaseHealthRouteSmokePassed: true,
      dashboardReleaseRouteSmokePassed: true,
      dashboardFeatureFlagRouteSmokePassed: true,
      webTypecheckPassed: true,
      webBuildPassed: true,
      dashboardBuildPassed: true,
      mobileTypecheckPassed: true,
      releaseGovernanceWorkflowDryRunPassed: true,
      githubActionsWorkflowEvidenceCaptured: true,
      ciArtifactsAttached: true,
      capturedArtifacts: releaseRuntimeVerificationArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.redactedSummary).toContain("CI-safe artifacts captured");
  });

  it("is wired into CI and GAP-087 tracker evidence", () => {
    expect(workflowSource).toContain("Run Phase 12 release runtime verification contracts");
    expect(workflowSource).toContain("apps/web/tests/release-runtime-verification-static.test.ts");
    expect(workflowSource).toContain("release-runtime-verification-artifacts");
    expect(trackerSource).toContain("GAP-087");
    expect(trackerSource).toContain("apps/web/lib/releaseRuntimeVerification.ts");
    expect(trackerSource).toContain("Release runtime evidence classifier wired and execution-gated");
    expect(trackerSource).toContain("releaseRuntimeVerificationDecisionRequiredEvidence");
    expect(trackerSource).toContain("GitHub Actions workflow proof");
  });
});


