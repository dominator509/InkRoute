import { describe, expect, it } from "vitest";
import {
  releaseAutomatedCoverageArtifactPaths,
  releaseAutomatedCoverageCommands,
  releaseAutomatedCoverageContract,
  releaseAutomatedCoverageMatrix,
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

  it("pins CI and tracker references for the release automated coverage seam", () => {
    const ci = readWorkspaceFile(".github/workflows/ci.yml");
    const tracker = readWorkspaceFile("GAP_TRACKER.md");

    expect(ci).toContain("Run Phase 12 release automated coverage contracts");
    expect(ci).toContain("apps/web/tests/release-automated-coverage-static.test.ts");
    expect(ci).toContain("release-automated-coverage-artifacts");
    expect(tracker).toContain("GAP-094");
    expect(tracker).toContain("apps/web/lib/releaseAutomatedCoverage.ts");
    expect(tracker).toContain("Playwright/Expo/provider workflow proof remains open");
  });
});
