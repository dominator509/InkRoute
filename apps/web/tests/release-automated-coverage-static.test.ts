import { describe, expect, it } from "vitest";
import {
  buildRedactedReleaseAutomatedCoverageArtifact,
  buildReleaseAutomatedCoverageEvidenceDecision,
  buildReleaseAutomatedCoverageArtifactReview,
  buildReleaseAutomatedCoverageExecutionPlan,
  buildProviderBackedReleaseRouteIntegrationPlan,
  providerBackedReleaseRouteIntegrationPlan,
  releaseAutomatedCoverageArtifactPaths,
  releaseAutomatedCoverageCommands,
  releaseAutomatedCoverageContract,
  releaseAutomatedCoverageDecisionRequiredEvidence,
  releaseAutomatedCoverageExternalCommands,
  releaseAutomatedCoverageExternalArtifacts,
  releaseAutomatedCoverageExecutionPolicy,
  releaseAutomatedCoverageLocalArtifacts,
  releaseAutomatedCoverageLocalCommands,
  releaseAutomatedCoverageMatrix,
  releaseAutomatedCoverageProofFiles,
  releaseAutomatedCoverageRequiredExternalEvidence,
} from "../lib/releaseAutomatedCoverage";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("GAP-094 release automated coverage contracts", () => {
  it("wires a Playwright dashboard release smoke target for release page and no-store API reads", () => {
    const spec = readWorkspaceFile("apps/dashboard/tests/e2e/release-dashboard.spec.ts");

    expect(spec).toContain("dashboard release automation smoke");
    expect(spec).toContain("/releases");
    expect(spec).toContain("Release gates");
    expect(spec).toContain("Feature flag decisions");
    expect(spec).toContain("CI/CD guardrail plan");
    expect(spec).toContain("/api/releases?tenantId=inkroute-demo");
    expect(spec).toContain("/api/feature-flags?tenantId=inkroute-demo");
    expect(spec).toContain("cache-control");
  });

  it("keeps existing route, mobile, and workflow static release automation evidence in scope", () => {
    const releaseStatic = readWorkspaceFile("apps/web/tests/release-automation-static.test.ts");
    const mobileStatic = readWorkspaceFile("apps/mobile/tests/mobile-static.test.ts");
    const governanceWorkflow = readWorkspaceFile(".github/workflows/release-governance.yml");

    expect(releaseStatic).toContain("releaseCreateInputSchema.safeParse");
    expect(mobileStatic).toContain("mobileOtaUpdatePlan");
    expect(governanceWorkflow).toContain("workflow_dispatch:");
  });

  it("tracks provider, Expo, GitHub Actions, real-secret, and CI artifact proof as explicit gates", () => {
    const providerPlan = buildProviderBackedReleaseRouteIntegrationPlan({
      tenantId: "tenant_1",
      releaseRoute: "/api/releases?tenantId=tenant_1",
      featureFlagRoute: "/api/feature-flags?tenantId=tenant_1",
    });

    expect(releaseAutomatedCoverageCommands).toContain("pnpm exec playwright test apps/dashboard/tests/e2e/release-dashboard.spec.ts");
    expect(releaseAutomatedCoverageCommands).toContain("provider-backed release route integration tests");
    expect(releaseAutomatedCoverageCommands).toContain("Expo release status render/device tests");
    expect(releaseAutomatedCoverageCommands).toContain("GitHub Actions release-governance workflow execution");
    expect(releaseAutomatedCoverageMatrix.map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        "dashboard-release-playwright-smoke",
        "provider-backed-route-integrations",
        "expo-render-device-tests",
        "github-actions-workflow-execution",
      ]),
    );
    expect(releaseAutomatedCoverageArtifactPaths).toContain("coverage/release-github-actions-execution-redacted.json");
    expect(providerPlan.routes.map((route) => route.id)).toEqual(expect.arrayContaining(["release-route-db-backed-read", "feature-flag-route-db-backed-read"]));
    expect(providerPlan.assertions).toEqual(expect.arrayContaining(["tenant mismatch denial", "server-side TenantMember permission lookup"]));
    expect(providerBackedReleaseRouteIntegrationPlan.artifact).toBe("coverage/release-provider-backed-route-integration.json");
    expect(releaseAutomatedCoverageContract.status).toBe("blocked");
    expect(releaseAutomatedCoverageContract.blockers).toEqual(
      expect.arrayContaining([
        "Provider-backed release and feature-flag route integration tests must pass.",
        "Expo/mobile device release and OTA tests must pass.",
        "GitHub Actions release-governance workflow execution evidence must be captured.",
        "Real CI secrets and protected environments must be configured for production-like workflow tests.",
      ]),
    );
  });

  it("pins current release automated coverage proof files for GAP-094", () => {
    expect(releaseAutomatedCoverageProofFiles).toEqual(
      expect.arrayContaining([
      "apps/dashboard/package.json",
        "packages/releases/package.json",
        "packages/releases/src/index.ts",
        "packages/releases/tests/feature-flags.test.ts",
        "packages/releases/tests/release-governance-workflow.test.ts",
        "apps/web/lib/releaseAutomatedCoverage.ts",
        "apps/web/tests/release-health-route.test.ts",
        "apps/web/tests/release-automation-static.test.ts",
        "apps/web/tests/release-automated-coverage-static.test.ts",
        "apps/dashboard/tests/e2e/release-dashboard.spec.ts",
        "apps/mobile/tests/mobile-static.test.ts",
        "apps/dashboard/app/releases/page.tsx",
        "apps/dashboard/components/ReleaseActionPanel.tsx",
        "apps/dashboard/app/api/releases/route.ts",
        "apps/dashboard/app/api/feature-flags/route.ts",
        "apps/dashboard/tests/release-route-static.test.ts",
        "apps/dashboard/tests/feature-flag-route-static.test.ts",
        ".github/workflows/release-governance.yml",
        ".github/workflows/ci.yml",
        "testing/manifests/unit-test-manifest.json",
      ]),
    );
    for (const file of releaseAutomatedCoverageProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("classifies GAP-094 release automated coverage evidence as blocked until Playwright, provider, Expo, workflow, and secret proof is captured", () => {
    const blocked = buildReleaseAutomatedCoverageEvidenceDecision({
      releasePackageTestsPassed: true,
      releaseWorkflowTestsPassed: true,
      releaseHealthRouteTestsPassed: true,
      releaseAutomationStaticTestsPassed: true,
      mobileStaticTestsPassed: true,
      dashboardTypecheckPassed: false,
      playwrightDashboardReleaseSmokePassed: false,
      providerBackedRouteIntegrationTestsPassed: false,
      expoRenderTestsPassed: false,
      expoDeviceTestsPassed: false,
      githubActionsWorkflowExecutionEvidenceCaptured: false,
      realSecretsAndEnvironmentsConfigured: false,
      ciArtifactsCaptured: false,
      capturedArtifacts: ["coverage/release-automated-coverage.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Playwright dashboard release smoke evidence is required.",
        "Provider-backed release/feature-flag route integration evidence is required.",
        "Expo device/OTA proof evidence is required.",
        "GitHub Actions release-governance workflow execution evidence is required.",
        "Real CI secret/protected environment evidence is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/release-dashboard-playwright-smoke.json");
    expect(blocked.requiredCommands).toBe(releaseAutomatedCoverageCommands);
    expect(blocked.requiredEvidence).toBe(releaseAutomatedCoverageDecisionRequiredEvidence);

    const complete = buildReleaseAutomatedCoverageEvidenceDecision({
      releasePackageTestsPassed: true,
      releaseWorkflowTestsPassed: true,
      releaseHealthRouteTestsPassed: true,
      releaseAutomationStaticTestsPassed: true,
      mobileStaticTestsPassed: true,
      dashboardTypecheckPassed: true,
      playwrightDashboardReleaseSmokePassed: true,
      providerBackedRouteIntegrationTestsPassed: true,
      expoRenderTestsPassed: true,
      expoDeviceTestsPassed: true,
      githubActionsWorkflowExecutionEvidenceCaptured: true,
      realSecretsAndEnvironmentsConfigured: true,
      ciArtifactsCaptured: true,
      capturedArtifacts: releaseAutomatedCoverageArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.redactedSummary).toContain("CI-safe redacted artifacts captured");
  });

  it("pins CI and tracker references for the release automated coverage seam", () => {
    const ci = readWorkspaceFile(".github/workflows/ci.yml");
    const tracker = readWorkspaceFile("GAP_TRACKER.md");

    expect(ci).toContain("Run Phase 12 release automated coverage contracts");
    expect(ci).toContain("apps/web/tests/release-automated-coverage-static.test.ts");
    expect(ci).toContain("release-automated-coverage-artifacts");
    expect(tracker).toContain("GAP-094");
    expect(tracker).toContain("apps/web/lib/releaseAutomatedCoverage.ts");
    expect(tracker).toContain("Release automated coverage evidence classifier wired and execution-gated");
    expect(tracker).toContain("releaseAutomatedCoverageDecisionRequiredEvidence");
    expect(tracker).toContain("releaseAutomatedCoverageLocalArtifacts");
    expect(tracker).toContain("releaseAutomatedCoverageExternalArtifacts");
    expect(tracker).toContain("Playwright/Expo/provider workflow proof");
  });

  it("keeps GAP-094 live execution disabled locally while publishing the release coverage plan", () => {
    const plan = buildReleaseAutomatedCoverageExecutionPlan();

    expect(plan.playwrightExecutionAllowed).toBe(false);
    expect(plan.expoExecutionAllowed).toBe(false);
    expect(plan.providerBackedRouteExecutionAllowed).toBe(false);
    expect(plan.githubActionsExecutionAllowed).toBe(false);
    expect(plan.secretEnvironmentExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(releaseAutomatedCoverageExecutionPolicy);
    expect(plan.policy).toEqual({
      executePlaywright: false,
      executeExpo: false,
      executeProviderBackedRoutes: false,
      executeGithubActions: false,
      useRealSecretsOrProtectedEnvironments: false,
      executeCi: false,
    });
    expect(plan.localCommands).toBe(releaseAutomatedCoverageLocalCommands);
    expect(plan.externalCommands).toBe(releaseAutomatedCoverageExternalCommands);
    expect(plan.localArtifacts).toBe(releaseAutomatedCoverageLocalArtifacts);
    expect(plan.externalArtifacts).toBe(releaseAutomatedCoverageExternalArtifacts);
    expect(plan.localArtifacts).toEqual([
      "coverage/release-automated-coverage.json",
      "test-results/release-automated",
    ]);
    expect(plan.externalArtifacts).toEqual(expect.arrayContaining([
      "coverage/release-dashboard-playwright-smoke.json",
      "coverage/release-provider-backed-route-integration.json",
      "coverage/release-expo-device-ota-proof-redacted.json",
      "coverage/release-github-actions-execution-redacted.json",
      "coverage/release-real-secrets-environments-redacted.json",
    ]));
    expect(plan.requiredExternalEvidence).toBe(releaseAutomatedCoverageRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toEqual([
      "Playwright dashboard release smoke artifact",
      "Provider-backed release/feature-flag route integration artifact",
      "Expo render and physical-device release/OTA proof",
      "GitHub Actions release-governance workflow execution proof",
      "Real secret/protected environment proof and CI artifact capture",
    ]);
    expect(plan.disabledReasons.join(" ")).toContain("Real secret/protected environment proof cannot be generated without credentials.");
  });

  it("redacts GAP-094 release automated coverage artifacts before review", () => {
    const rawArtifact = {
      githubToken: "ghp_1234567890abcdef",
      expo_token: "expo-secret-token",
      providerPayload: { rawBody: "{\"email\":\"artist@example.com\",\"phone\":\"+1 555 222 1010\"}" },
      nested: ["Authorization: Bearer secret-release-token", "contact artist@example.com at +1 (555) 333-4444"],
      stack: "Error: provider failed",
    };

    const redacted = buildRedactedReleaseAutomatedCoverageArtifact(rawArtifact);
    const review = buildReleaseAutomatedCoverageArtifactReview(rawArtifact);
    const serialized = JSON.stringify({ redacted, review });

    expect(serialized).not.toContain("ghp_1234567890abcdef");
    expect(serialized).not.toContain("expo-secret-token");
    expect(serialized).not.toContain("artist@example.com");
    expect(serialized).not.toContain("+1 555 222 1010");
    expect(serialized).not.toContain("secret-release-token");
    expect(serialized).toContain("[REDACTED]");
    expect(review.requiredArtifacts).toBe(releaseAutomatedCoverageArtifactPaths);
    expect(review.retainedExternalGates).toEqual(expect.arrayContaining([
      "Playwright dashboard release smoke artifact",
      "Provider-backed release/feature-flag route integration artifact",
      "GitHub Actions release-governance execution artifact",
    ]));
  });
});
