import { describe, expect, it } from "vitest";
import { assessMigrationCompatibility, buildMobileUpdatePlan, createReleaseCandidate, evaluateFeatureFlag, type FeatureFlagDefinition } from "../src/index";

const flag: FeatureFlagDefinition = {
  key: "nomad-mode-live-publish",
  description: "Enable live Nomad Mode publishing",
  scope: "tenant",
  defaultEnabled: false,
  owner: "release-lead",
  environments: ["preview", "production"],
  tenantAllowlist: ["tenant_allowed"],
  auditNote: "Must be paired with cache revalidation and notification tests."
};

describe("release and feature flag governance", () => {
  it("uses tenant allowlists before default flag values", () => {
    const decision = evaluateFeatureFlag(flag, { tenantId: "tenant_allowed", role: "owner", environment: "production", stableIdentifier: "tenant_allowed" });

    expect(decision.enabled).toBe(true);
    expect(decision.reason).toBe("tenant_allowlist");
  });

  it("blocks destructive migration plans", () => {
    const gate = assessMigrationCompatibility([{ id: "drop-booking-column", description: "Drop a booking column", risk: "destructive", backwardCompatible: false, requiresBackup: true, requiresManualApproval: true }]);

    expect(gate.status).toBe("block");
    expect(gate.blocksProduction).toBe(true);
  });

  it("classifies mobile updates that require store builds", () => {
    const plan = buildMobileUpdatePlan({
      channel: "production",
      runtimeVersion: "1.0.0",
      nativeRuntimeVersion: "1.0.0",
      changes: ["Added native camera permission"],
      nativeCapabilitiesChanged: true,
      permissionsChanged: true,
      expoProjectConfigured: true
    });

    expect(plan.compatibility).toBe("requires_store_build");
  });

  it("creates release candidates with blocking gates", () => {
    const candidate = createReleaseCandidate({
      version: "0.14.0-phase14",
      channel: "preview",
      surfaces: ["web", "dashboard"],
      artifacts: [{ name: "web", version: "0.14.0", commitSha: "abc123", surface: "web" }],
      migrations: [],
      commitSha: "abc123",
      releaseNotes: ["Testing scaffold added"],
      createdBy: "phase14-test",
      createdAt: "2026-06-03T00:00:00.000Z",
      gates: [{ id: "unit", label: "Unit tests", status: "block", blocksProduction: true, evidence: "Not run", nextAction: "Run pnpm test:unit" }]
    });

    expect(candidate.status).toBe("blocked");
    expect(candidate.risk).toBe("high");
  });
});
