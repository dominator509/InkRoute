import { describe, expect, it } from "vitest";
import {
  assessMigrationCompatibility,
  buildGithubReleaseWorkflowPlan,
  buildEasOtaReadinessPlan,
  buildMobileUpdatePlan,
  buildReleaseHealthChecks,
  classifyMobileUpdate,
  createReleaseCandidate,
  createReleaseNotes,
  createRollbackPlan,
  evaluateFeatureFlag,
  evaluateFeatureFlags,
  type FeatureFlagDefinition,
} from "../src/index";

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

  it("applies environment disables and kill switches before rollout decisions", () => {
    expect(evaluateFeatureFlag(flag, { tenantId: "tenant_allowed", role: "owner", environment: "development", stableIdentifier: "tenant_allowed" })).toMatchObject({
      enabled: false,
      reason: "environment_disabled",
    });

    expect(
      evaluateFeatureFlag(
        { ...flag, killSwitch: true, defaultEnabled: true },
        { tenantId: "tenant_allowed", role: "owner", environment: "production", stableIdentifier: "tenant_allowed" },
      ),
    ).toMatchObject({
      enabled: false,
      reason: "kill_switch",
    });
  });

  it("evaluates feature flag collections consistently", () => {
    const decisions = evaluateFeatureFlags(
      [
        flag,
        { ...flag, key: "dashboard.release_panel.enabled", defaultEnabled: true, tenantAllowlist: undefined },
      ],
      { tenantId: "tenant_unlisted", role: "assistant", environment: "production", stableIdentifier: "tenant_unlisted" },
    );

    expect(decisions).toHaveLength(2);
    expect(decisions.map((decision) => decision.reason)).toEqual(["default_value", "default_value"]);
    expect(decisions.map((decision) => decision.enabled)).toEqual([false, true]);
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

  it("classifies safe, blocked, and manual-review mobile updates", () => {
    expect(
      classifyMobileUpdate({
        channel: "preview",
        runtimeVersion: "1.0.0",
        nativeRuntimeVersion: "1.0.0",
        changes: ["Copy-only update"],
        expoProjectConfigured: true,
      }),
    ).toBe("safe");

    expect(
      classifyMobileUpdate({
        channel: "preview",
        runtimeVersion: "1.0.1",
        nativeRuntimeVersion: "1.0.0",
        changes: ["Runtime changed"],
        expoProjectConfigured: true,
      }),
    ).toBe("requires_manual_review");

    expect(
      buildMobileUpdatePlan({
        channel: "preview",
        runtimeVersion: "1.0.0",
        nativeRuntimeVersion: "1.0.0",
        changes: ["Copy-only update"],
        expoProjectConfigured: false,
      }),
    ).toMatchObject({
      compatibility: "blocked",
      gates: expect.arrayContaining([expect.objectContaining({ id: "eas-project-configured", status: "block" })]),
    });
  });

  it("blocks EAS OTA readiness when project, channels, builds, update, or rollback evidence is missing", () => {
    const plan = buildEasOtaReadinessPlan({
      updateUrl: "https://u.expo.dev/placeholder",
      runtimeVersionPolicy: "unknown",
      adoptionMonitoringConfigured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.productionReady).toBe(false);
    expect(plan.gates.filter((gate) => gate.status === "block").map((gate) => gate.id)).toEqual([
      "eas-project-id",
      "eas-update-url",
      "eas-channels",
      "runtime-version-policy",
      "preview-native-build",
      "production-native-build",
      "preview-update-published",
      "rollback-drill",
      "adoption-monitoring",
    ]);
    expect(plan.requiredCommands).toContain("eas build --profile preview");
  });

  it("distinguishes preview OTA readiness from production launch readiness", () => {
    const plan = buildEasOtaReadinessPlan({
      expoProjectId: "expo-project-001",
      updateUrl: "https://u.expo.dev/project-001",
      previewChannel: "preview",
      productionChannel: "production",
      runtimeVersionPolicy: "appVersion",
      previewBuildUrl: "https://expo.dev/accounts/inkroute/builds/preview",
      previewUpdateId: "update-preview-001",
      adoptionMonitoringConfigured: false,
    });

    expect(plan.status).toBe("ready_for_preview");
    expect(plan.productionReady).toBe(false);
    expect(plan.gates.find((gate) => gate.id === "preview-update-published")?.status).toBe("pass");
    expect(plan.gates.find((gate) => gate.id === "production-native-build")?.status).toBe("block");
    expect(plan.gates.find((gate) => gate.id === "rollback-drill")?.status).toBe("block");
    expect(plan.rollbackRequirement).toContain("previous compatible EAS update");
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

  it("creates release notes, health checks, and rollback plans from candidates", () => {
    const candidate = createReleaseCandidate({
      version: "0.15.0-phase15",
      channel: "production",
      surfaces: ["web", "dashboard", "mobile", "provider"],
      artifacts: [{ name: "web", version: "0.15.0", commitSha: "abc123", surface: "web" }],
      migrations: [{ id: "add-release-index", description: "Add release index", risk: "expand_only", backwardCompatible: true }],
      commitSha: "abc123",
      releaseNotes: ["Release control plane hardening"],
      createdBy: "release-test",
      createdAt: "2026-06-03T00:00:00.000Z",
    });

    const notes = createReleaseNotes(candidate);
    const rollback = createRollbackPlan(candidate, "0.14.0");
    const healthChecks = buildReleaseHealthChecks(candidate);

    expect(notes).toContain("# 0.15.0-phase15");
    expect(notes).toContain("Release control plane hardening");
    expect(rollback.web).toContain("0.14.0");
    expect(rollback.mobile).toContain("EAS update");
    expect(rollback.featureFlags).toContain("Disable provider sends");
    expect(healthChecks.map((check) => check.id)).toEqual(["dependencies-installed", "production-gates", "rollback-plan"]);
  });

  it("documents required workflow gates for release governance", () => {
    const plan = buildGithubReleaseWorkflowPlan();

    expect(plan.workflowName).toBe("Release Governance");
    expect(plan.requiredSecrets).toContain("DATABASE_URL");
    expect(plan.deploymentGatedSteps).toContain("Prisma migrate deploy");
    expect(plan.environments).toEqual(["preview", "staging", "production"]);
  });
});
