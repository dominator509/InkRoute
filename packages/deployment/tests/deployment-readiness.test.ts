import { describe, expect, it } from "vitest";
import {
  buildDeploymentPlan,
  buildDatabaseOperationsRuntimeReadinessPlan,
  buildDeploymentPipelineReadinessPlan,
  buildLaunchOperationsRuntimeReadinessPlan,
  buildMobileDeploymentRuntimeReadinessPlan,
  buildProductionLaunchEvidenceRuntimeReadinessPlan,
  buildProviderEnvironmentRuntimeReadinessPlan,
  buildSecretManagementRuntimeReadinessPlan,
  buildDeploymentToolingRuntimeVerificationPlan,
  buildDeploymentSteps,
  buildHandoffTasks,
  buildProductionLaunchChecklist,
  evaluateEnvironmentReadiness,
  maskEnvValue,
  providerOptions,
  summarizeLaunchChecklist,
} from "../src/index";

describe("deployment readiness helpers", () => {
  it("masks secret values without hiding public values", () => {
    expect(maskEnvValue("AUTH_SECRET", "super-secret-value")).toBe("su***ue");
    expect(maskEnvValue("AUTH_SECRET", "short")).toBe("******");
    expect(maskEnvValue("NEXT_PUBLIC_APP_URL", "https://artist.example.com")).toBe("https://artist.example.com");
    expect(maskEnvValue("DATABASE_URL", undefined)).toBe("<missing>");
  });

  it("blocks production when required secrets are placeholders", () => {
    const report = evaluateEnvironmentReadiness(
      {
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://artist.example.com",
        DATABASE_URL: "postgresql://USER:PASSWORD@HOST:5432/inkroute",
      },
      "production",
      "2026-06-03T00:00:00.000Z",
    );

    expect(report.productionBlocked).toBe(true);
    expect(report.missingRequiredNames).toContain("DATABASE_URL");
    expect(report.missingRequiredNames).toContain("AUTH_SECRET");
  });

  it("blocks preview when preview-scoped required secrets are missing", () => {
    const report = evaluateEnvironmentReadiness(
      {
        NODE_ENV: "preview",
        NEXT_PUBLIC_APP_URL: "https://preview.artist.example.com",
        DATABASE_URL: "postgresql://real-user:real-password@db.internal:5432/inkroute",
      },
      "preview",
      "2026-06-03T00:00:00.000Z",
    );

    expect(report.productionBlocked).toBe(true);
    expect(report.missingRequiredNames).toContain("AUTH_SECRET");
    expect(report.results.find((result) => result.name === "DATABASE_URL")).toMatchObject({
      status: "pass",
      hasNonPlaceholderValue: true,
    });
  });

  it("summarizes production launch blockers", () => {
    const checklist = buildProductionLaunchChecklist();
    const summary = summarizeLaunchChecklist(checklist);

    expect(summary.itemCount).toBeGreaterThan(0);
    expect(summary.productionBlockingCount).toBeGreaterThan(0);
    expect(summary.blockerIds).toContain("launch-foundation-install");
    expect(summary.byStatus.blocked).toBeGreaterThan(0);
    expect(summary.byStatus.deployment_gated).toBeGreaterThan(0);
    expect(summary.byStatus.manual).toBeGreaterThan(0);
  });

  it("creates handoff tasks with verification commands", () => {
    const tasks = buildHandoffTasks();
    const codexTask = tasks.find((task) => task.target === "Codex");

    expect(codexTask?.verification).toContain("pnpm install");
    expect(codexTask?.gapIds).toContain("GAP-001");
  });

  it("builds a production-blocked deployment plan while providers are not configured", () => {
    const plan = buildDeploymentPlan("production");

    expect(plan.productionBlockers.length).toBeGreaterThan(0);
    expect(plan.summary).toContain("production-blocking");
    expect(plan.providers).toBe(providerOptions);
    expect(plan.steps.map((step) => step.id)).toContain("install-lockfile");
  });

  it("keeps deployment steps attached to evidence requirements and gap ids", () => {
    const steps = buildDeploymentSteps("production");

    expect(steps.every((step) => step.evidenceRequired.length > 0)).toBe(true);
    expect(steps.every((step) => step.gapIds.length > 0)).toBe(true);
    expect(steps.find((step) => step.id === "mobile-eas-build")).toMatchObject({
      surface: "mobile",
      status: "deployment_gated",
      blocksProduction: true,
    });
  });

  it("keeps provider options tied to setup evidence and gaps", () => {
    expect(providerOptions.every((provider) => provider.setupEvidenceRequired.length > 0)).toBe(true);
    expect(providerOptions.every((provider) => provider.gapIds.length > 0)).toBe(true);
    expect(providerOptions.map((provider) => provider.id)).toContain("github_actions");
  });

  it("summarizes deployment pipeline readiness across providers, secrets, previews, mobile, rollback, and launch evidence", () => {
    const plan = buildDeploymentPipelineReadinessPlan({
      providerProjectsConfigured: true,
      githubEnvironmentsConfigured: true,
      githubSecretsConfigured: false,
      vercelWebProjectConfigured: true,
      vercelDashboardProjectConfigured: false,
      previewDeploySucceeded: false,
      productionDryRunSucceeded: false,
      productionApprovalGateConfigured: false,
      databaseProviderConfigured: false,
      migrationDryRunSucceeded: false,
      backupRestoreDrillCompleted: false,
      storageProviderConfigured: false,
      mobileEasProjectConfigured: false,
      easPreviewBuildSucceeded: false,
      easNativeCredentialsConfigured: false,
      otaRollbackDrillCompleted: false,
      ciQualityGatesRequired: false,
      sentryReleaseUploadConfigured: false,
      environmentStrictCheckPassed: false,
      rollbackRunbookReviewed: false,
      launchEvidenceCollected: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.requiredCommands).toContain("pnpm deploy:check-env:strict");
    expect(plan.requiredCommands).toContain("eas build --profile preview");
    expect(plan.requiredEvidence).toContain("Preview web and dashboard deployment URLs with route smoke output.");
    expect(plan.approvalGates).toContain("Production GitHub environment requires human approval.");
    expect(plan.blockers).toContain("GitHub environment secrets must be configured without placeholder values.");
    expect(plan.blockers).toContain("EAS preview build must succeed for mobile.");
    expect(plan.blockers).toContain("Launch evidence packet must include URLs, command logs, provider screenshots, redacted secrets proof, and rollback evidence.");
  });
  it("blocks deployment tooling runtime verification until scripts, route smoke, and CI evidence all pass", () => {
    const plan = buildDeploymentToolingRuntimeVerificationPlan({
      packageScripts: { test: "vitest run" },
      rootScripts: ["deploy:check-env", "deploy:checklist"],
      dependenciesInstalled: false,
      deploymentPackageTestsPassed: true,
      deploymentPackageTypecheckPassed: false,
      deploymentScriptsExecuted: false,
      deployCheckEnvPassed: true,
      deployChecklistPassed: false,
      deployGapsPassed: false,
      routeContractTestsPassed: false,
      dashboardBuildPassed: false,
      dashboardDeploymentPageSmokePassed: false,
      dashboardReadinessApiSmokePassed: false,
      rollbackPreflightVerified: false,
      productionApprovalBoundaryVerified: false,
      ciDeploymentReportsCaptured: false,
      blockersDocumented: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingPackageScripts).toEqual(["typecheck"]);
    expect(plan.missingRootScripts).toEqual(["deploy:gaps", "test:unit"]);
    expect(plan.requiredCommands).toContain("pnpm deploy:gaps");
    expect(plan.requiredCommands).toContain("pnpm --filter @inkroute/dashboard build");
    expect(plan.requiredEvidence).toEqual(
      expect.arrayContaining([
        "Dependency install output plus @inkroute/deployment typecheck and test output.",
        "Dashboard build output plus deployment page and readiness API smoke output.",
        "CI deployment report artifacts and documented blocker owner list.",
      ]),
    );
    expect(plan.blockers).toContain("Dashboard deployment readiness route contract tests must pass.");
    expect(plan.blockers).toContain("Dashboard build must pass before route smoke is meaningful.");
    expect(plan.blockers).toContain("CI must capture deployment reports/artifacts.");
    expect(plan.blockers).toContain("Any remaining deployment blockers must be documented with owners.");
  });

  it("marks deployment tooling runtime verification ready when package, dashboard, rollback, and CI evidence are present", () => {
    const plan = buildDeploymentToolingRuntimeVerificationPlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      rootScripts: ["deploy:check-env", "deploy:checklist", "deploy:gaps", "test:unit"],
      dependenciesInstalled: true,
      deploymentPackageTestsPassed: true,
      deploymentPackageTypecheckPassed: true,
      deploymentScriptsExecuted: true,
      deployCheckEnvPassed: true,
      deployChecklistPassed: true,
      deployGapsPassed: true,
      routeContractTestsPassed: true,
      dashboardBuildPassed: true,
      dashboardDeploymentPageSmokePassed: true,
      dashboardReadinessApiSmokePassed: true,
      rollbackPreflightVerified: true,
      productionApprovalBoundaryVerified: true,
      ciDeploymentReportsCaptured: true,
      blockersDocumented: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingPackageScripts).toEqual([]);
    expect(plan.missingRootScripts).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });

  it("blocks provider environment readiness until every surface has safe verified evidence", () => {
    const plan = buildProviderEnvironmentRuntimeReadinessPlan({
      environments: [
        {
          name: "preview",
          requiredBeforeProduction: true,
          surfaces: [
            {
              surface: "web",
              provider: "vercel",
              status: "not_provisioned",
              secretStore: "postgresql://user:password@db.example/inkroute",
              requiredEvidence: ["redacted preview URL"],
            },
          ],
        },
      ],
      verifierPassed: false,
      providerSmokeChecksPassed: false,
      githubEnvironmentProtectionsConfigured: false,
      secretStoreDestinationsConfigured: false,
      redactedEvidenceLabelsRecorded: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingEnvironmentSurfacePairs).toContain("preview/dashboard");
    expect(plan.missingEnvironmentSurfacePairs).toContain("staging/web");
    expect(plan.unverifiedEnvironmentSurfacePairs).toContain("preview/web");
    expect(plan.unverifiedEnvironmentSurfacePairs).toContain("preview/web:requiredEvidence");
    expect(plan.unsafeEvidenceFields).toContain("preview/web:1");
    expect(plan.requiredCommands).toContain("pnpm deploy:verify-provider-envs");
    expect(plan.requiredEvidence).toContain("GitHub Actions environment protection, required checks, secret-store destination, and artifact-retention proof.");
    expect(plan.blockers).toContain("Provider environment evidence must not include raw secrets, project ids, tokens, or connection strings.");
    expect(plan.blockers).toContain("pnpm deploy:verify-provider-envs must pass.");
  });

  it("marks provider environment readiness ready when all environments and surfaces are verified with redacted evidence", () => {
    const surfaces = ["web", "dashboard", "database", "storage", "mobile", "observability", "ci_cd"] as const;
    const environments = (["preview", "staging", "production"] as const).map((name) => ({
      name,
      requiredBeforeProduction: true,
      surfaces: surfaces.map((surface) => ({
        surface,
        provider: surface === "ci_cd" ? "github_actions" : `${surface}_provider`,
        status: "verified_redacted" as const,
        secretStore: `${name} ${surface} secret-store destination label`,
        requiredEvidence: [`${name} ${surface} evidence label`, `${name} ${surface} smoke artifact label`],
      })),
    }));

    const plan = buildProviderEnvironmentRuntimeReadinessPlan({
      environments,
      verifierPassed: true,
      providerSmokeChecksPassed: true,
      githubEnvironmentProtectionsConfigured: true,
      secretStoreDestinationsConfigured: true,
      redactedEvidenceLabelsRecorded: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingEnvironmentSurfacePairs).toEqual([]);
    expect(plan.unverifiedEnvironmentSurfacePairs).toEqual([]);
    expect(plan.unsafeEvidenceFields).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });

  it("blocks secret management readiness until production secrets are configured with safe redacted evidence", () => {
    const plan = buildSecretManagementRuntimeReadinessPlan({
      requiredProductionSecretNames: ["DATABASE_URL", "AUTH_SECRET", "VERCEL_TOKEN"],
      auditItems: [
        {
          name: "DATABASE_URL",
          group: "database",
          requiredForProduction: true,
          destinations: ["postgresql://user:password@db.example/inkroute"],
          rotationCadenceDays: 400,
          status: "not_configured",
          requiredEvidence: ["secret-store reference"],
        },
        {
          name: "AUTH_SECRET",
          group: "auth",
          requiredForProduction: true,
          destinations: ["Vercel server environment"],
          rotationCadenceDays: 90,
          status: "configured_redacted",
          requiredEvidence: ["secret-store reference", "masked env check log"],
        },
      ],
      rotationPolicy: {
        defaultCadenceDays: 0,
        incidentRotationHours: 48,
        requiresDualControlForProduction: false,
        requiresMaskedCiLogProof: false,
        requiresProviderAuditLogReference: false,
      },
      verifierPassed: false,
      strictEnvironmentCheckPassed: false,
      providerSecretStoresConfigured: false,
      maskedCiLogsCaptured: false,
      providerAuditLogsCaptured: false,
      committedSecretScanPassed: false,
      incidentRotationProcessDocumented: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingProductionSecrets).toEqual(["VERCEL_TOKEN"]);
    expect(plan.unconfiguredProductionSecrets).toEqual(
      expect.arrayContaining(["DATABASE_URL", "DATABASE_URL:requiredEvidence", "DATABASE_URL:rotationCadenceDays"]),
    );
    expect(plan.unsafeEvidenceFields).toContain("DATABASE_URL:2");
    expect(plan.requiredCommands).toContain("pnpm deploy:verify-secrets");
    expect(plan.requiredEvidence).toContain("Masked CI log artifacts proving secrets are not printed.");
    expect(plan.blockers).toContain("Every production secret from the environment contract must be represented in the secret-management audit.");
    expect(plan.blockers).toContain("Secret-management evidence must not contain raw secret values, tokens, connection strings, or private keys.");
    expect(plan.blockers).toContain("pnpm deploy:check-env:strict must pass against a real secret-backed environment.");
  });

  it("marks secret management readiness ready when all production secrets have redacted rotation and audit proof", () => {
    const plan = buildSecretManagementRuntimeReadinessPlan({
      requiredProductionSecretNames: ["DATABASE_URL", "AUTH_SECRET"],
      auditItems: [
        {
          name: "DATABASE_URL",
          group: "database",
          requiredForProduction: true,
          destinations: ["GitHub Actions production database secret label"],
          rotationCadenceDays: 90,
          status: "rotated_redacted",
          requiredEvidence: ["secret-store reference label", "masked env check artifact"],
        },
        {
          name: "AUTH_SECRET",
          group: "auth",
          requiredForProduction: true,
          destinations: ["Vercel dashboard server secret label"],
          rotationCadenceDays: 90,
          status: "configured_redacted",
          requiredEvidence: ["session rotation ticket label", "masked CI log artifact"],
        },
      ],
      rotationPolicy: {
        defaultCadenceDays: 90,
        incidentRotationHours: 4,
        requiresDualControlForProduction: true,
        requiresMaskedCiLogProof: true,
        requiresProviderAuditLogReference: true,
      },
      verifierPassed: true,
      strictEnvironmentCheckPassed: true,
      providerSecretStoresConfigured: true,
      maskedCiLogsCaptured: true,
      providerAuditLogsCaptured: true,
      committedSecretScanPassed: true,
      incidentRotationProcessDocumented: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingProductionSecrets).toEqual([]);
    expect(plan.unconfiguredProductionSecrets).toEqual([]);
    expect(plan.unsafeEvidenceFields).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });

  it("blocks mobile deployment readiness until builds, QA, push, crash, OTA, and store evidence are verified", () => {
    const plan = buildMobileDeploymentRuntimeReadinessPlan({
      buildProfiles: [
        {
          profile: "preview",
          distribution: "internal",
          channel: "preview",
          required: true,
          status: "not_built",
          platforms: [
            {
              platform: "ios",
              status: "not_built",
              evidenceRequired: ["redacted EAS build label"],
            },
          ],
        },
      ],
      qaEvidence: [
        {
          id: "device-qa",
          status: "not_run",
          requiredEvidence: ["iOS checklist artifact"],
        },
      ],
      runtimePolicy: {
        expoRuntimeVersionPolicy: "sdkVersion",
        requiresStoreBuildWhen: ["native dependencies change"],
        otaAllowedWhen: ["runtime versions match"],
      },
      appRuntimeVersionPolicy: "appVersion",
      easChannelsConfigured: false,
      nativeCredentialsConfigured: false,
      pushCredentialsConfigured: false,
      sentryMobileConfigured: false,
      verifierPassed: false,
      redactedBuildArtifactsRecorded: false,
      storeReadinessReviewed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingProfiles).toEqual(["development", "production"]);
    expect(plan.incompleteProfiles).toEqual(expect.arrayContaining(["preview", "preview:platforms", "preview/ios", "preview/ios:evidenceRequired"]));
    expect(plan.missingQaEvidence).toEqual(["push-token", "crash-capture", "ota-rollback", "store-readiness"]);
    expect(plan.incompleteQaEvidence).toEqual(expect.arrayContaining(["device-qa", "device-qa:requiredEvidence"]));
    expect(plan.requiredCommands).toContain("pnpm deploy:verify-mobile");
    expect(plan.requiredEvidence).toContain("OTA publish and rollback rehearsal evidence on preview channel.");
    expect(plan.blockers).toContain("Mobile app runtimeVersion policy must match deployment runtime policy.");
    expect(plan.blockers).toContain("Mobile push credentials and token registration proof must be configured.");
    expect(plan.blockers).toContain("App Store and Google Play readiness must be reviewed before production mobile launch.");
  });

  it("marks mobile deployment readiness ready when all EAS profiles and runtime evidence are verified", () => {
    const platformEvidence = [
      {
        platform: "ios" as const,
        status: "verified_redacted" as const,
        evidenceRequired: ["iOS build label", "iOS device QA label"],
      },
      {
        platform: "android" as const,
        status: "verified_redacted" as const,
        evidenceRequired: ["Android build label", "Android device QA label"],
      },
    ];

    const plan = buildMobileDeploymentRuntimeReadinessPlan({
      buildProfiles: [
        {
          profile: "development",
          distribution: "internal",
          channel: "development",
          required: true,
          status: "built_redacted",
          evidenceRequired: ["development client build label", "device smoke label"],
        },
        {
          profile: "preview",
          distribution: "internal",
          channel: "preview",
          required: true,
          status: "verified_redacted",
          platforms: platformEvidence,
        },
        {
          profile: "production",
          distribution: "store",
          channel: "production",
          required: true,
          status: "verified_redacted",
          platforms: platformEvidence,
        },
      ],
      qaEvidence: [
        { id: "device-qa", status: "verified_redacted", requiredEvidence: ["iOS checklist", "Android checklist"] },
        { id: "push-token", status: "verified_redacted", requiredEvidence: ["token registration", "receipt"] },
        { id: "crash-capture", status: "verified_redacted", requiredEvidence: ["Sentry issue", "source-map proof"] },
        { id: "ota-rollback", status: "verified_redacted", requiredEvidence: ["preview update", "rollback update"] },
        { id: "store-readiness", status: "verified_redacted", requiredEvidence: ["App Store review", "Google Play review"] },
      ],
      runtimePolicy: {
        expoRuntimeVersionPolicy: "appVersion",
        requiresStoreBuildWhen: [
          "native dependencies change",
          "permissions change",
          "runtime version changes",
          "app config changes affect native capabilities",
        ],
        otaAllowedWhen: [
          "preview binary is installed",
          "runtime versions match",
          "no native capability or permission changed",
          "rollback update has been rehearsed on preview channel",
        ],
      },
      appRuntimeVersionPolicy: "appVersion",
      easChannelsConfigured: true,
      nativeCredentialsConfigured: true,
      pushCredentialsConfigured: true,
      sentryMobileConfigured: true,
      verifierPassed: true,
      redactedBuildArtifactsRecorded: true,
      storeReadinessReviewed: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingProfiles).toEqual([]);
    expect(plan.incompleteProfiles).toEqual([]);
    expect(plan.missingQaEvidence).toEqual([]);
    expect(plan.incompleteQaEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });

  it("blocks database operations readiness until migrations, backup/restore, tenant smoke, and promotion evidence pass", () => {
    const plan = buildDatabaseOperationsRuntimeReadinessPlan({
      providerStatus: "not_provisioned",
      requiredCommands: ["pnpm db:generate"],
      dbPackageScripts: {
        "db:generate": "prisma generate",
        "db:migrate": "prisma migrate dev",
      },
      operationChecks: [
        {
          id: "destructive-change-scan",
          status: "not_run",
          requiredBeforeProduction: true,
          blockedSqlPatterns: ["DROP TABLE"],
          evidenceRequired: ["SQL scan artifact"],
        },
      ],
      verifierPassed: false,
      prismaGeneratePassed: true,
      prismaValidatePassed: false,
      migrationDryRunPassed: false,
      stagingMigrationApplied: false,
      backupRestoreDrillPassed: false,
      tenantIsolationSmokePassed: false,
      branchPromotionApproved: false,
      productionDataSafetyReviewed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingCommands).toContain("pnpm --filter @inkroute/db db:validate");
    expect(plan.missingScripts).toEqual(["db:validate", "db:seed"]);
    expect(plan.missingChecks).toContain("staging-branch-provisioned");
    expect(plan.incompleteChecks).toEqual(
      expect.arrayContaining([
        "destructive-change-scan",
        "destructive-change-scan:evidenceRequired",
        "destructive-change-scan:DROP COLUMN",
        "destructive-change-scan:ALTER TABLE DROP",
        "destructive-change-scan:TRUNCATE",
      ]),
    );
    expect(plan.requiredCommands).toContain("pnpm deploy:verify-database-ops");
    expect(plan.requiredEvidence).toContain("Backup snapshot, restore drill log, and RTO/RPO note.");
    expect(plan.blockers).toContain("Database provider branch/project must be provisioned and verified with redacted evidence.");
    expect(plan.blockers).toContain("Production data safety, seed policy, and destructive SQL gates must be reviewed.");
  });

  it("marks database operations readiness ready when all provider, migration, restore, isolation, and promotion evidence passes", () => {
    const operationChecks = [
      "staging-branch-provisioned",
      "migration-dry-run",
      "destructive-change-scan",
      "staging-migration-apply",
      "seed-policy",
      "backup-restore-drill",
      "tenant-isolation-smoke",
      "branch-promotion",
    ].map((id) => ({
      id: id as
        | "staging-branch-provisioned"
        | "migration-dry-run"
        | "destructive-change-scan"
        | "staging-migration-apply"
        | "seed-policy"
        | "backup-restore-drill"
        | "tenant-isolation-smoke"
        | "branch-promotion",
      status: "passed_redacted" as const,
      requiredBeforeProduction: true,
      evidenceRequired: [`${id} artifact`, `${id} approval label`],
      blockedSqlPatterns: id === "destructive-change-scan"
        ? ["DROP TABLE", "DROP COLUMN", "ALTER TABLE DROP", "TRUNCATE"]
        : undefined,
    }));

    const plan = buildDatabaseOperationsRuntimeReadinessPlan({
      providerStatus: "verified_redacted",
      requiredCommands: [
        "pnpm db:generate",
        "pnpm --filter @inkroute/db db:validate",
        "pnpm db:migrate",
        "pnpm db:seed",
      ],
      dbPackageScripts: {
        "db:validate": "prisma validate",
        "db:generate": "prisma generate",
        "db:migrate": "prisma migrate dev",
        "db:seed": "tsx prisma/seed.ts",
      },
      operationChecks,
      verifierPassed: true,
      prismaGeneratePassed: true,
      prismaValidatePassed: true,
      migrationDryRunPassed: true,
      stagingMigrationApplied: true,
      backupRestoreDrillPassed: true,
      tenantIsolationSmokePassed: true,
      branchPromotionApproved: true,
      productionDataSafetyReviewed: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingCommands).toEqual([]);
    expect(plan.missingScripts).toEqual([]);
    expect(plan.missingChecks).toEqual([]);
    expect(plan.incompleteChecks).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });

  it("blocks production launch evidence readiness while bundles are missing, partial, unsafe, or prematurely approved", () => {
    const plan = buildProductionLaunchEvidenceRuntimeReadinessPlan({
      approvalStatus: "approved_redacted",
      productionChecklistBlockerCount: 3,
      requiredBundles: [
        {
          id: "ci-build-test",
          area: "tooling",
          status: "partial_redacted",
          requiredEvidence: ["pnpm install", "postgresql://user:password@db.example/inkroute"],
          sourceArtifacts: [],
          gapIds: [],
        },
      ],
      verifierPassed: false,
      ciBuildTestEvidenceVerified: false,
      providerEvidenceVerified: false,
      legalApprovalVerified: false,
      rollbackEvidenceVerified: false,
      explicitProductionApprovalCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingBundles).toContain("database-ops");
    expect(plan.incompleteBundles).toEqual(
      expect.arrayContaining(["ci-build-test", "ci-build-test:requiredEvidence", "ci-build-test:sourceArtifacts", "ci-build-test:gapIds"]),
    );
    expect(plan.unsafeEvidenceFields).toContain("ci-build-test:2");
    expect(plan.requiredCommands).toContain("pnpm deploy:verify-launch-evidence");
    expect(plan.requiredEvidence).toContain("Explicit redacted production approval record after every bundle is verified.");
    expect(plan.blockers).toContain("Production launch approval must remain blocked until every evidence bundle is verified.");
    expect(plan.blockers).toContain("Production launch checklist must retain all production-blocking launch categories.");
    expect(plan.blockers).toContain("Legal approval evidence must be verified before production approval.");
  });

  it("marks production launch evidence readiness ready when every bundle is verified and approval is captured", () => {
    const requiredBundleIds = [
      "ci-build-test",
      "database-ops",
      "provider-and-secret-readiness",
      "security-privacy-trust",
      "accessibility-seo-performance",
      "mobile-release",
      "legal-approval",
      "rollback-and-operations",
    ] as const;
    const bundles = requiredBundleIds.map((id) => ({
      id,
      area: id,
      status: "verified_redacted" as const,
      requiredEvidence: [`${id} command output`, `${id} artifact label`, `${id} approval label`],
      sourceArtifacts: [`deployment/manifests/${id}.json`],
      gapIds: ["GAP-118"],
    }));

    const plan = buildProductionLaunchEvidenceRuntimeReadinessPlan({
      approvalStatus: "approved_redacted",
      productionChecklistBlockerCount: 8,
      requiredBundles: bundles,
      verifierPassed: true,
      ciBuildTestEvidenceVerified: true,
      providerEvidenceVerified: true,
      legalApprovalVerified: true,
      rollbackEvidenceVerified: true,
      explicitProductionApprovalCaptured: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingBundles).toEqual([]);
    expect(plan.incompleteBundles).toEqual([]);
    expect(plan.unsafeEvidenceFields).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });

  it("blocks launch operations readiness while owners, drills, monitoring, and safe evidence are missing", () => {
    const plan = buildLaunchOperationsRuntimeReadinessPlan({
      approvalStatus: "approved_redacted",
      ownerModel: {
        incidentCommander: "unassigned",
        privacyOwner: "privacy@example.com",
        supportOwner: "unassigned",
        releaseOwner: "release-team",
        securityOwner: "",
        requiresNamedPrimaryAndBackup: false,
      },
      operationChecks: [
        {
          id: "alert-routing",
          area: "monitoring",
          status: "not_configured",
          requiredBeforeProduction: true,
          sla: "short",
          requiredEvidence: ["https://hooks.slack.com/services/T000/B000/secret"],
        },
      ],
      verifierPassed: false,
      alertTestPassed: false,
      incidentDrillPassed: false,
      rollbackDrillPassed: false,
      privacyRequestDrillPassed: false,
      supportEscalationDrillPassed: false,
      monitoringDashboardVerified: false,
      communicationsTemplatesApproved: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingChecks).toContain("on-call-coverage");
    expect(plan.incompleteChecks).toEqual(expect.arrayContaining(["alert-routing", "alert-routing:sla", "alert-routing:requiredEvidence"]));
    expect(plan.unassignedOwnerFields).toEqual(["incidentCommander", "supportOwner", "securityOwner"]);
    expect(plan.unsafeEvidenceFields).toEqual(expect.arrayContaining(["alert-routing:2", "ownerModel:1"]));
    expect(plan.requiredCommands).toContain("pnpm deploy:verify-ops");
    expect(plan.requiredEvidence).toContain("Privacy request export/delete drill with identity verification and audit log labels.");
    expect(plan.blockers).toContain("Launch operations approval must remain blocked until all checks and owners are ready.");
    expect(plan.blockers).toContain("Production monitoring dashboard, uptime, Sentry, and release-health evidence must be verified.");
  });

  it("marks launch operations readiness ready when owners, drills, monitoring, templates, and approval are verified", () => {
    const operationChecks = [
      "on-call-coverage",
      "alert-routing",
      "support-escalation",
      "privacy-request-drill",
      "incident-drill",
      "rollback-drill",
      "production-monitoring",
      "communications-templates",
    ].map((id) => ({
      id: id as
        | "on-call-coverage"
        | "alert-routing"
        | "support-escalation"
        | "privacy-request-drill"
        | "incident-drill"
        | "rollback-drill"
        | "production-monitoring"
        | "communications-templates",
      area: "operations",
      status: "passed_redacted" as const,
      requiredBeforeProduction: true,
      sla: `${id} SLA evidence captured`,
      requiredEvidence: [`${id} artifact`, `${id} owner label`],
    }));

    const plan = buildLaunchOperationsRuntimeReadinessPlan({
      approvalStatus: "approved_redacted",
      ownerModel: {
        incidentCommander: "incident-primary/incident-backup",
        privacyOwner: "privacy-primary/privacy-backup",
        supportOwner: "support-primary/support-backup",
        releaseOwner: "release-primary/release-backup",
        securityOwner: "security-primary/security-backup",
        requiresNamedPrimaryAndBackup: true,
      },
      operationChecks,
      verifierPassed: true,
      alertTestPassed: true,
      incidentDrillPassed: true,
      rollbackDrillPassed: true,
      privacyRequestDrillPassed: true,
      supportEscalationDrillPassed: true,
      monitoringDashboardVerified: true,
      communicationsTemplatesApproved: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingChecks).toEqual([]);
    expect(plan.incompleteChecks).toEqual([]);
    expect(plan.unassignedOwnerFields).toEqual([]);
    expect(plan.unsafeEvidenceFields).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });
});
