import { describe, expect, it } from "vitest";
import {
  releaseRuntimeVerificationRequiredCommands,
  releaseRuntimeVerificationRequiredEvidence,
  releasePersistenceRbacReadinessRequiredCommands,
  releasePersistenceRbacReadinessRequiredEvidence,
  releaseLaunchControlEvidenceRequiredCommands,
  releaseLaunchControlEvidenceRequiredEvidence,
  releaseControlPlaneReadinessRequiredCommands,
  releaseControlPlaneReadinessRequiredEvidence,
  releaseAutomatedTestReadinessRequiredCommands,
  releaseAutomatedTestReadinessRequiredEvidence,
  mobileOtaProductionEnablementRequiredCommands,
  mobileOtaProductionEnablementRequiredEvidence,
  migrationRuntimeDryRunReadinessRequiredCommands,
  migrationRuntimeDryRunReadinessRequiredEvidence,
  featureFlagRuntimeIntegrationReadinessRequiredCommands,
  featureFlagRuntimeIntegrationReadinessRequiredEvidence,
  easOtaReadinessRequiredCommands,
  expoEasRuntimeEvidenceRequiredCommands,
  expoEasRuntimeEvidenceRequiredEvidence,
  assessMigrationCompatibility,
  buildExpoEasRuntimeEvidencePlan,
  buildFeatureFlagRuntimeIntegrationReadinessPlan,
  buildGithubReleaseWorkflowPlan,
  buildEasOtaReadinessPlan,
  buildMigrationCompatibilityEnforcementPlan,
  buildMigrationCompatibilityRequiredCommands,
  buildMigrationRuntimeDryRunReadinessPlan,
  buildMobileUpdatePlan,
  buildMobileOtaProductionEnablementPlan,
  buildProviderRuntimeGates,
  buildReleaseAutomatedTestReadinessPlan,
  buildReleaseHealthChecks,
  buildReleaseLaunchControlEvidencePlan,
  buildReleaseControlPlaneReadinessPlan,
  buildReleasePersistenceRbacReadinessPlan,
  buildReleaseRuntimeVerificationPlan,
  classifyMobileUpdate,
  createReleaseCandidate,
  createReleaseNotes,
  createRollbackPlan,
  defaultFeatureFlags,
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

  it("derives provider runtime gates from evaluated feature flag decisions", () => {
    const decisions = evaluateFeatureFlags(defaultFeatureFlags, {
      tenantId: "tenant_demo_nomad",
      role: "owner",
      environment: "production",
      stableIdentifier: "tenant_demo_nomad:owner",
    });
    const gates = buildProviderRuntimeGates(decisions);

    expect(gates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ provider: "payments", flagKey: "booking.deposit_required", action: "allow", decisionReason: "tenant_allowlist" }),
        expect.objectContaining({ provider: "sms", flagKey: "sms_notifications.enabled", action: "block" }),
        expect.objectContaining({ provider: "mobile-ota", flagKey: "mobile.ota_updates.enabled", action: "block" }),
        expect.objectContaining({ provider: "ai-assistants", flagKey: "ai_assistants.enabled", action: "block" }),
      ]),
    );
    expect(gates.find((gate) => gate.provider === "sms")?.runtimeBoundary).toContain("STOP/HELP");
    expect(gates.find((gate) => gate.provider === "mobile-ota")?.runtimeBoundary).toContain("rollback drill");
  });

  it("plans ready feature flag runtime integration across persisted evaluation, cached resolvers, provider kill switches, and rollout proof", () => {
    const plan = buildFeatureFlagRuntimeIntegrationReadinessPlan({
      packageScripts: ["test", "typecheck"],
      releasesTestsPassed: true,
      releasesTypecheckPassed: true,
      featureFlagStaticTestsPassed: true,
      dashboardTypecheckPassed: true,
      mobileTypecheckPassed: true,
      dbBackedEvaluationConfigured: true,
      dashboardRuntimeSurfaceWired: true,
      mobileRuntimeSurfaceWired: true,
      publicReleaseHealthPayloadWired: true,
      cachedServerResolversConfigured: true,
      realAuthContextDerivationConfigured: true,
      providerWorkerKillSwitchEnforced: true,
      invalidationRevalidationConfigured: true,
      rolloutBucketTestsPassed: true,
      tenantSafePublicPayloadVerified: true,
      liveRolloutProofCaptured: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
    expect(plan.requiredCommands).toBe(featureFlagRuntimeIntegrationReadinessRequiredCommands);
    
  });

  it("blocks feature flag runtime integration until cached resolvers, real auth context, worker kill switches, invalidation, rollout buckets, and live proof exist", () => {
    const plan = buildFeatureFlagRuntimeIntegrationReadinessPlan({
      packageScripts: ["test"],
      releasesTestsPassed: true,
      releasesTypecheckPassed: false,
      featureFlagStaticTestsPassed: true,
      dashboardTypecheckPassed: true,
      mobileTypecheckPassed: true,
      dbBackedEvaluationConfigured: true,
      dashboardRuntimeSurfaceWired: true,
      mobileRuntimeSurfaceWired: true,
      publicReleaseHealthPayloadWired: true,
      cachedServerResolversConfigured: false,
      realAuthContextDerivationConfigured: false,
      providerWorkerKillSwitchEnforced: false,
      invalidationRevalidationConfigured: false,
      rolloutBucketTestsPassed: false,
      tenantSafePublicPayloadVerified: false,
      liveRolloutProofCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      featureFlagRuntimeIntegrationReadinessRequiredEvidence[0],
      featureFlagRuntimeIntegrationReadinessRequiredEvidence[2],
      featureFlagRuntimeIntegrationReadinessRequiredEvidence[3],
    ]);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Missing @inkroute/releases typecheck script.",
        "@inkroute/releases typecheck must pass before feature-flag runtime integration readiness.",
        "Cached server-side feature flag resolvers must be configured.",
        "Tenant/user/role flag context must derive from real auth, not trusted demo inputs.",
        "Provider workers must enforce feature-flag kill switches before SMS/payments/mobile OTA/AI side effects.",
        "Feature flag invalidation and revalidation must be configured after writes.",
        "Live rollout and kill-switch proof is required before closing GAP-090.",
      ]),
    );
  });

  it("blocks destructive migration plans", () => {
    const gate = assessMigrationCompatibility([{ id: "drop-booking-column", description: "Drop a booking column", risk: "destructive", backwardCompatible: false, requiresBackup: true, requiresManualApproval: true }]);

    expect(gate.status).toBe("block");
    expect(gate.blocksProduction).toBe(true);
  });

  it("enforces Prisma migration dry-run, backup, approval, and forward-fix evidence", () => {
    const plan = buildMigrationCompatibilityEnforcementPlan({
      migrations: [
        {
          id: "drop-client-birthdate",
          description: "Drop encrypted client birthdate",
          risk: "destructive",
          backwardCompatible: false,
          requiresBackup: true,
          requiresManualApproval: true,
        },
      ],
      prismaSchemaPath: "packages/db/prisma/schema.prisma",
      migrationDirectory: "packages/db/prisma/migrations",
      stagingDatabaseDryRun: false,
      backupSnapshotAttached: false,
      destructiveApprovalAttached: false,
      expandContractPlanAttached: false,
      forwardFixPlanAttached: false,
    });

    expect(plan.classification).toBe("destructive");
    expect(plan.productionBlocked).toBe(true);
    expect(plan.gates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "staging-database-dry-run", status: "block" }),
        expect.objectContaining({ id: "destructive-change-approval", status: "block" }),
        expect.objectContaining({ id: "expand-contract-plan", status: "block" }),
        expect.objectContaining({ id: "database-forward-fix-plan", status: "block" }),
      ]),
    );
    expect(plan.requiredCommands).toEqual(
      buildMigrationCompatibilityRequiredCommands({ prismaSchemaPath: "packages/db/prisma/schema.prisma" }),
    );
    expect(plan.policy.join(" ")).toContain("forward-fix");
  });

  it("allows expand-only migrations after staging dry-run and recovery evidence is attached", () => {
    const plan = buildMigrationCompatibilityEnforcementPlan({
      migrations: [{ id: "add-release-index", description: "Add release index", risk: "expand_only", backwardCompatible: true }],
      prismaSchemaPath: "packages/db/prisma/schema.prisma",
      migrationDirectory: "packages/db/prisma/migrations",
      stagingDatabaseDryRun: true,
      backupSnapshotAttached: false,
      destructiveApprovalAttached: false,
      expandContractPlanAttached: false,
      forwardFixPlanAttached: true,
    });

    expect(plan.classification).toBe("expand_only");
    expect(plan.productionBlocked).toBe(false);
    expect(plan.gates.every((gate) => gate.status === "pass")).toBe(true);
  });

  it("plans ready migration runtime dry-run enforcement with staging database, artifacts, approvals, and forward-fix evidence", () => {
    const plan = buildMigrationRuntimeDryRunReadinessPlan({
      packageScripts: ["test", "typecheck"],
      releasesTestsPassed: true,
      releasesTypecheckPassed: true,
      workflowSourceTestsPassed: true,
      prismaSchemaPresent: true,
      prismaMigrationsGenerated: true,
      stagingDatabaseUrlConfigured: true,
      prismaValidatePassed: true,
      prismaDiffDryRunPassed: true,
      prismaMigrateDeployDryRunPassed: true,
      destructiveSqlScanPassed: true,
      backupSnapshotAttached: true,
      destructiveApprovalAttached: true,
      expandContractPlanAttached: true,
      forwardFixPlanAttached: true,
      rollbackEvidenceRecorded: true,
      githubActionsDryRunPassed: true,
      ciArtifactCaptured: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
    expect(plan.requiredCommands).toBe(migrationRuntimeDryRunReadinessRequiredCommands);
    
  });

  it("blocks migration runtime dry-run enforcement until staging database, committed migrations, approvals, rollback evidence, and CI artifacts exist", () => {
    const plan = buildMigrationRuntimeDryRunReadinessPlan({
      packageScripts: ["test"],
      releasesTestsPassed: true,
      releasesTypecheckPassed: false,
      workflowSourceTestsPassed: true,
      prismaSchemaPresent: true,
      prismaMigrationsGenerated: false,
      stagingDatabaseUrlConfigured: false,
      prismaValidatePassed: false,
      prismaDiffDryRunPassed: false,
      prismaMigrateDeployDryRunPassed: false,
      destructiveSqlScanPassed: false,
      backupSnapshotAttached: false,
      destructiveApprovalAttached: false,
      expandContractPlanAttached: false,
      forwardFixPlanAttached: false,
      rollbackEvidenceRecorded: false,
      githubActionsDryRunPassed: false,
      ciArtifactCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(migrationRuntimeDryRunReadinessRequiredCommands);
    expect(plan.requiredEvidence).toBe(migrationRuntimeDryRunReadinessRequiredEvidence);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Missing @inkroute/releases typecheck script.",
        "@inkroute/releases typecheck must pass before migration runtime dry-run readiness.",
        "Real Prisma migrations must be generated and committed before dry-run proof.",
        "Staging DATABASE_URL must be provisioned in GitHub Actions secrets.",
        "Prisma migrate diff dry-run must pass against staging DATABASE_URL.",
        "Forward-fix/restore policy must be attached to the release record.",
        "GitHub Actions release-governance migration dry-run must pass with staging DATABASE_URL.",
      ]),
    );
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
    expect(plan.requiredCommands).toBe(easOtaReadinessRequiredCommands);
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

  it("blocks Expo/EAS runtime readiness until config, builds, device receipt, rollback, and monitoring evidence exist", () => {
    const plan = buildExpoEasRuntimeEvidencePlan({
      packageScripts: ["test"],
      releasesTestsPassed: true,
      releasesTypecheckPassed: false,
      mobileTypecheckPassed: false,
      appJsonProjectIdMatches: false,
      easJsonChannelsMatch: false,
      credentialsConfigured: false,
      easProjectIdConfigured: false,
      updateUrlConfigured: false,
      runtimeVersionPolicyConfigured: false,
      previewChannelConfigured: true,
      productionChannelConfigured: false,
      previewNativeBuildPassed: false,
      productionNativeBuildPassed: false,
      previewOtaPublishVerified: false,
      deviceReceivedPreviewUpdate: false,
      rollbackRepublishVerified: false,
      compatibilityCheckPassed: false,
      adoptionMonitoringVerified: false,
      releaseHealthMonitoringConfigured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(expoEasRuntimeEvidenceRequiredCommands);
    expect(plan.gates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "app-json-project-id-match", status: "block" }),
        expect.objectContaining({ id: "eas-json-channels-match", status: "block" }),
        expect.objectContaining({ id: "preview-native-build", status: "block" }),
        expect.objectContaining({ id: "device-received-preview-update", status: "block" }),
        expect.objectContaining({ id: "rollback-republish", status: "block" }),
        expect.objectContaining({ id: "release-health-monitoring", status: "block" }),
      ]),
    );
    expect(plan.requiredEvidence).toBe(expoEasRuntimeEvidenceRequiredEvidence);
    expect(plan.requiredEvidence.join(" ")).toContain("Rollback republish drill");
    expect(plan.blockers).toContain("Run pnpm --filter @inkroute/mobile typecheck.");
  });

  it("plans ready mobile OTA production enablement with real Expo metadata, builds, preview update, device adoption, monitoring, and rollback proof", () => {
    const plan = buildMobileOtaProductionEnablementPlan({
      packageScripts: ["test", "typecheck"],
      releasesTestsPassed: true,
      releasesTypecheckPassed: true,
      mobileStaticTestsPassed: true,
      mobileTypecheckPassed: true,
      realExpoProjectIdConfigured: true,
      realUpdateUrlConfigured: true,
      expoUpdatesConfigured: true,
      runtimeVersionPolicyAppVersion: true,
      previewChannelConfigured: true,
      productionChannelConfigured: true,
      previewNativeBuildPassed: true,
      productionNativeBuildPassed: true,
      previewUpdatePublished: true,
      previewUpdateIdRecorded: true,
      deviceAdoptionVerified: true,
      adoptionMonitoringConfigured: true,
      rollbackRepublishDrillPassed: true,
      releaseHealthLinked: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
    expect(plan.requiredCommands).toBe(mobileOtaProductionEnablementRequiredCommands);
    
  });

  it("blocks mobile OTA production enablement until real config, native builds, preview update, device adoption, monitoring, and rollback proof exist", () => {
    const plan = buildMobileOtaProductionEnablementPlan({
      packageScripts: ["test"],
      releasesTestsPassed: true,
      releasesTypecheckPassed: false,
      mobileStaticTestsPassed: true,
      mobileTypecheckPassed: false,
      realExpoProjectIdConfigured: false,
      realUpdateUrlConfigured: false,
      expoUpdatesConfigured: false,
      runtimeVersionPolicyAppVersion: true,
      previewChannelConfigured: true,
      productionChannelConfigured: false,
      previewNativeBuildPassed: false,
      productionNativeBuildPassed: false,
      previewUpdatePublished: false,
      previewUpdateIdRecorded: false,
      deviceAdoptionVerified: false,
      adoptionMonitoringConfigured: false,
      rollbackRepublishDrillPassed: false,
      releaseHealthLinked: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(mobileOtaProductionEnablementRequiredCommands);
    expect(plan.requiredEvidence).toBe(mobileOtaProductionEnablementRequiredEvidence);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Missing @inkroute/releases typecheck script.",
        "@inkroute/releases typecheck must pass before mobile OTA production enablement.",
        "@inkroute/mobile typecheck must pass with SystemStatus EAS readiness wiring.",
        "Real non-secret Expo project ID must be configured.",
        "Production native build with expo-updates must pass.",
        "A device running the preview binary must receive the preview OTA update.",
        "Rollback republish drill must restore the previous compatible update.",
      ]),
    );
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
    expect(healthChecks.find((check) => check.id === "production-gates")?.detail).toBe("No release-control gate blocks production.");
    expect(healthChecks.find((check) => check.id === "production-gates")?.detail).not.toBe("No scaffolded gate blocks production.");
  });

  it("keeps demo release candidate metadata on release-contract wording", async () => {
    const { demoReleaseCandidate } = await import("../src/index");

    expect(demoReleaseCandidate.createdBy).toBe("codex-phase12-release-contract");
    expect(demoReleaseCandidate.createdBy).not.toBe("chatgpt-phase12-scaffold");
  });

  it("documents required workflow gates for release governance", () => {
    const plan = buildGithubReleaseWorkflowPlan();

    expect(plan.workflowName).toBe("Release Governance");
    expect(plan.requiredSecrets).toContain("DATABASE_URL");
    expect(plan.deploymentGatedSteps).toContain("Prisma migrate deploy");
    expect(plan.environments).toEqual(["preview", "staging", "production"]);
  });

  it("summarizes release control-plane readiness across persistence, RBAC, protected environments, rollout, and rollback evidence", () => {
    const plan = buildReleaseControlPlaneReadinessPlan({
      packageScripts: ["test"],
      packageTestsPassed: true,
      packageTypecheckPassed: false,
      releaseRecordPersistenceConfigured: true,
      featureFlagPersistenceConfigured: false,
      rbacEnforced: true,
      tenantScopedReadsVerified: true,
      tenantScopedMutationsVerified: false,
      auditLogPersistenceConfigured: false,
      optimisticConcurrencyConfigured: false,
      protectedGithubEnvironmentsConfigured: false,
      signedDeploymentJobsConfigured: false,
      ciRequiredChecksConfigured: true,
      previewDeploymentJobConfigured: false,
      productionDeploymentJobConfigured: false,
      migrationGatesConfigured: true,
      rollbackWorkflowRehearsed: false,
      incidentLinkageConfigured: false,
      easUpdateGovernanceConfigured: false,
      rolloutControlsConfigured: false,
      killSwitchesVerified: false,
      releaseHealthRouteVerified: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(releaseControlPlaneReadinessRequiredCommands);
    expect(plan.requiredEvidence).toBe(releaseControlPlaneReadinessRequiredEvidence);
    expect(plan.blockers).toContain("FeatureFlag persistence must be configured with tenant/environment scopes.");
    expect(plan.blockers).toContain("GitHub preview/production protected environments must be configured.");
    expect(plan.blockers).toContain("Rollback workflow must be rehearsed for web, dashboard, mobile OTA, database forward-fix, and feature flags.");
  });

  it("plans ready release runtime verification across package, route, app build, dashboard smoke, and workflow evidence", () => {
    const plan = buildReleaseRuntimeVerificationPlan({
      packageScripts: ["test", "typecheck"],
      releasesTestsPassed: true,
      releasesTypecheckPassed: true,
      webTypecheckPassed: true,
      releaseHealthRouteTestsPassed: true,
      webBuildPassed: true,
      dashboardBuildPassed: true,
      mobileBuildOrTypecheckPassed: true,
      dashboardReleaseRouteSmokePassed: true,
      dashboardFeatureFlagRouteSmokePassed: true,
      releaseGovernanceWorkflowDryRunPassed: true,
      githubActionsWorkflowEvidenceCaptured: true,
      ciArtifactsAttached: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
    expect(plan.requiredCommands).toBe(releaseRuntimeVerificationRequiredCommands);
    
  });

  it("blocks release runtime verification until builds, dashboard route smokes, workflow proof, and CI artifacts exist", () => {
    const plan = buildReleaseRuntimeVerificationPlan({
      packageScripts: ["test"],
      releasesTestsPassed: true,
      releasesTypecheckPassed: false,
      webTypecheckPassed: true,
      releaseHealthRouteTestsPassed: true,
      webBuildPassed: false,
      dashboardBuildPassed: false,
      mobileBuildOrTypecheckPassed: false,
      dashboardReleaseRouteSmokePassed: false,
      dashboardFeatureFlagRouteSmokePassed: false,
      releaseGovernanceWorkflowDryRunPassed: false,
      githubActionsWorkflowEvidenceCaptured: false,
      ciArtifactsAttached: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toBe(releaseRuntimeVerificationRequiredEvidence);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Missing @inkroute/releases typecheck script.",
        "@inkroute/releases typecheck must pass before release runtime verification.",
        "Web app build must pass under release runtime dependencies.",
        "Dashboard app build must pass under release runtime dependencies.",
        "Dashboard release route smoke tests must cover release envelopes.",
        "Release-governance GitHub Actions workflow dry-run or dispatch proof is required.",
        "CI artifacts must be attached for package tests, route tests, app builds, and workflow execution.",
      ]),
    );
  });

  it("plans ready release persistence and RBAC with approval, concurrency, membership, and orchestration gates", () => {
    const plan = buildReleasePersistenceRbacReadinessPlan({
      packageScripts: ["test", "typecheck"],
      dashboardStaticRouteTestsPassed: true,
      dashboardTypecheckPassed: true,
      releaseRecordPersistenceConfigured: true,
      featureFlagPersistenceConfigured: true,
      tenantScopedRbacConfigured: true,
      tenantMismatchRejectionVerified: true,
      dbTransactionsConfigured: true,
      auditLoggingConfigured: true,
      providerCredentialGatesConfigured: true,
      previousStateMetadataConfigured: true,
      approvalStateMachineConfigured: true,
      optimisticConcurrencyConfigured: true,
      membershipLookupConfigured: true,
      renderedDashboardWorkflowTestsPassed: true,
      releaseWorkflowOrchestrationHooksConfigured: true,
      dbBackedRuntimeRouteTestsPassed: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
    expect(plan.requiredCommands).toBe(releasePersistenceRbacReadinessRequiredCommands);
    
  });

  it("blocks release persistence and RBAC until approval workflows, concurrency, membership lookup, rendered flows, and DB route proof exist", () => {
    const plan = buildReleasePersistenceRbacReadinessPlan({
      packageScripts: ["test"],
      dashboardStaticRouteTestsPassed: true,
      dashboardTypecheckPassed: false,
      releaseRecordPersistenceConfigured: true,
      featureFlagPersistenceConfigured: true,
      tenantScopedRbacConfigured: true,
      tenantMismatchRejectionVerified: true,
      dbTransactionsConfigured: true,
      auditLoggingConfigured: true,
      providerCredentialGatesConfigured: true,
      previousStateMetadataConfigured: true,
      approvalStateMachineConfigured: false,
      optimisticConcurrencyConfigured: false,
      membershipLookupConfigured: false,
      renderedDashboardWorkflowTestsPassed: false,
      releaseWorkflowOrchestrationHooksConfigured: false,
      dbBackedRuntimeRouteTestsPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toBe(releasePersistenceRbacReadinessRequiredEvidence);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Missing @inkroute/releases typecheck script.",
        "@inkroute/dashboard typecheck must pass with release and feature-flag route contracts.",
        "Release approval state machine must be configured before production orchestration.",
        "Release and feature-flag writes must enforce optimistic concurrency/version checks.",
        "Tenant membership lookups must replace trusted-header-only authorization.",
        "Rendered dashboard release and feature-flag workflow tests must pass.",
        "DB-backed runtime route tests must verify persisted release/flag behavior with tenant isolation.",
      ]),
    );
  });

  it("plans ready Phase 12 release automated coverage across helpers, routes, dashboard, mobile, providers, Expo, and workflow execution", () => {
    const plan = buildReleaseAutomatedTestReadinessPlan({
      packageScripts: ["test", "typecheck"],
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
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
    expect(plan.requiredCommands).toBe(releaseAutomatedTestReadinessRequiredCommands);
    
  });

  it("blocks Phase 12 release automated coverage until Playwright, provider-backed, Expo/device, workflow, secrets, and CI artifact proof exist", () => {
    const plan = buildReleaseAutomatedTestReadinessPlan({
      packageScripts: ["test"],
      releasePackageTestsPassed: true,
      releaseWorkflowTestsPassed: true,
      releaseHealthRouteTestsPassed: true,
      releaseAutomationStaticTestsPassed: true,
      mobileStaticTestsPassed: true,
      dashboardTypecheckPassed: true,
      playwrightDashboardReleaseSmokePassed: false,
      providerBackedRouteIntegrationTestsPassed: false,
      expoRenderTestsPassed: false,
      expoDeviceTestsPassed: false,
      githubActionsWorkflowExecutionEvidenceCaptured: false,
      realSecretsAndEnvironmentsConfigured: false,
      ciArtifactsCaptured: false,
    });
    const allMissingEvidencePlan = buildReleaseAutomatedTestReadinessPlan({
      packageScripts: [],
      releasePackageTestsPassed: false,
      releaseWorkflowTestsPassed: false,
      releaseHealthRouteTestsPassed: false,
      releaseAutomationStaticTestsPassed: false,
      mobileStaticTestsPassed: false,
      dashboardTypecheckPassed: false,
      playwrightDashboardReleaseSmokePassed: false,
      providerBackedRouteIntegrationTestsPassed: false,
      expoRenderTestsPassed: false,
      expoDeviceTestsPassed: false,
      githubActionsWorkflowExecutionEvidenceCaptured: false,
      realSecretsAndEnvironmentsConfigured: false,
      ciArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(releaseAutomatedTestReadinessRequiredCommands);
    expect(plan.requiredEvidence).toEqual([
      releaseAutomatedTestReadinessRequiredEvidence[1],
      releaseAutomatedTestReadinessRequiredEvidence[2],
      releaseAutomatedTestReadinessRequiredEvidence[3],
    ]);
    expect(allMissingEvidencePlan.requiredEvidence).toBe(releaseAutomatedTestReadinessRequiredEvidence);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Missing @inkroute/releases typecheck script.",
        "True Playwright dashboard release smoke must pass.",
        "Provider-backed release and feature-flag route integration tests must pass.",
        "Expo/mobile device release and OTA tests must pass.",
        "GitHub Actions release-governance workflow execution evidence must be captured.",
        "Real CI secrets and protected environments must be configured for production-like workflow tests.",
        "CI artifacts must be captured for package, route, Playwright, Expo/device, provider, and workflow tests.",
      ]), 
    );
  });

  it("summarizes release launch-control evidence across persistence, RBAC, protected environments, signed jobs, migrations, rollback, EAS, rollout controls, CI, and artifacts", () => {
    const plan = buildReleaseLaunchControlEvidencePlan({
      packageScripts: ["test", "typecheck"],
      releasesTestsPassed: true,
      releasesTypecheckPassed: true,
      releaseRecordPersistenceVerified: true,
      featureFlagPersistenceVerified: true,
      rbacTenantScopeVerified: true,
      optimisticConcurrencyVerified: true,
      auditRowsPersisted: true,
      protectedGithubEnvironmentsConfigured: true,
      signedDeploymentJobsConfigured: true,
      ciRequiredChecksPassed: true,
      previewDeployJobPassed: true,
      productionDeployApprovalDryRunPassed: true,
      migrationGateDryRunPassed: true,
      incidentLinkedRollbackDrillPassed: true,
      easUpdateGovernanceVerified: true,
      rolloutControlsVerified: true,
      killSwitchDrillPassed: true,
      releaseHealthEnvelopeVerified: true,
      providerBackedRouteTestsPassed: true,
      ciArtifactsCaptured: true,
      secretSafeArtifactsCaptured: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredCommands).toBe(releaseLaunchControlEvidenceRequiredCommands);

  });

  it("blocks release launch-control evidence until persisted controls, protected environments, signed jobs, migration gates, rollback, EAS, rollout, provider, CI, and secret-safe evidence exist", () => {
    const plan = buildReleaseLaunchControlEvidencePlan({
      packageScripts: ["test"],
      releasesTestsPassed: true,
      releasesTypecheckPassed: false,
      releaseRecordPersistenceVerified: false,
      featureFlagPersistenceVerified: false,
      rbacTenantScopeVerified: false,
      optimisticConcurrencyVerified: false,
      auditRowsPersisted: false,
      protectedGithubEnvironmentsConfigured: false,
      signedDeploymentJobsConfigured: false,
      ciRequiredChecksPassed: false,
      previewDeployJobPassed: false,
      productionDeployApprovalDryRunPassed: false,
      migrationGateDryRunPassed: false,
      incidentLinkedRollbackDrillPassed: false,
      easUpdateGovernanceVerified: false,
      rolloutControlsVerified: false,
      killSwitchDrillPassed: false,
      releaseHealthEnvelopeVerified: false,
      providerBackedRouteTestsPassed: false,
      ciArtifactsCaptured: false,
      secretSafeArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toBe(releaseLaunchControlEvidenceRequiredEvidence);
    expect(plan.blockers).toContain("GitHub preview, staging, and production protected environments must be configured.");
    expect(plan.blockers).toContain("Incident-linked rollback drill must pass for web, dashboard, mobile OTA, database, and flags.");
    expect(plan.blockers).toContain("Feature-flag kill-switch drill must pass.");
    expect(plan.blockers).toContain("Release launch artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.");
  });
  });
