import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("feature flag runtime surface wiring", () => {
  it("keeps dashboard release preview wired to production flag decisions and provider gates", () => {
    const demo = readWorkspaceFile("apps/dashboard/lib/releaseDemo.ts");
    const page = readWorkspaceFile("apps/dashboard/app/releases/page.tsx");

    expect(demo).toContain("productionFlagPreview");
    expect(demo).toContain("buildProviderRuntimeGates");
    expect(demo).toContain("providerRuntimeGatePreview");
    expect(page).toContain("Feature flag decisions");
    expect(page).toContain("Production:");
    expect(page).toContain("kill switch");
  });

  it("keeps mobile runtime preview wired to feature decisions and provider kill-switch gates", () => {
    const demo = readWorkspaceFile("apps/mobile/src/lib/mobileDemo.ts");
    const screen = readWorkspaceFile("apps/mobile/src/screens/SystemStatusScreen.tsx");

    expect(demo).toContain("mobileFeatureFlagDecisions");
    expect(demo).toContain("buildProviderRuntimeGates");
    expect(demo).toContain("mobileProviderRuntimeGates");
    expect(screen).toContain("Feature flag snapshot");
    expect(screen).toContain("mobileFeatureFlagDecisions");
  });

  it("keeps public release-health route returning safe tenant-scoped feature decisions", () => {
    const route = readWorkspaceFile("apps/web/app/api/public/[tenantSlug]/release-health/route.ts");

    expect(route).toContain("evaluateFeatureFlags");
    expect(route).toContain("previewDecisionContext");
    expect(route).toContain("productionDecisionContext");
    expect(route).toContain("tenantId: tenantResolution.tenantId");
    expect(route).toContain("publicFeatureSnapshot");
    expect(route).toContain("decisions:");
  });
});
