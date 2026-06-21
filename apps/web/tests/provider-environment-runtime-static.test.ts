import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildProviderEnvironmentRuntimeArtifactReview,
  buildProviderEnvironmentRunData,
  buildProviderEnvironmentRuntimeEvidenceDecision,
  buildProviderEnvironmentRuntimeExecutionPlan,
  buildRedactedProviderEnvironmentArtifact,
  persistProviderEnvironmentRun,
  providerEnvironmentRuntimeArtifactPaths,
  providerEnvironmentRuntimeCommands,
  providerEnvironmentRuntimeExternalArtifacts,
  providerEnvironmentRuntimeExternalCommands,
  providerEnvironmentRuntimeExecutionPolicy,
  providerEnvironmentRuntimeLocalArtifacts,
  providerEnvironmentRuntimeLocalCommands,
  providerEnvironmentRuntimeMatrix,
  providerEnvironmentRuntimeProofFiles,
  providerEnvironmentRuntimeReadiness,
  providerEnvironmentRuntimeRequiredExternalEvidence,
  providerEnvironmentRuntimeSurfaces,
  providerEnvironmentRunPersistenceContract
} from "../lib/providerEnvironmentRuntime";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const providerManifest = read("deployment/manifests/provider-environment-evidence.json");
const providerVerifier = read("deployment/scripts/verify-provider-envs.mjs");
const deploymentTests = read("packages/deployment/tests/deployment-readiness.test.ts");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");
const prismaSchema = read("packages/db/prisma/schema.prisma");
const prismaMigration = read(
  "packages/db/prisma/migrations/20260609017000_add_provider_environment_runs/migration.sql"
);

describe("GAP-114 provider environment runtime wiring", () => {
  it("pins provider environment commands, surfaces, matrix entries, and artifacts", () => {
    expect(providerEnvironmentRuntimeSurfaces).toEqual([
      "web",
      "dashboard",
      "database",
      "storage",
      "mobile",
      "observability",
      "ci_cd"
    ]);
    expect(providerEnvironmentRuntimeCommands).toEqual([
      "pnpm deploy:verify-provider-envs",
      "pnpm deploy:check-env:strict",
      "provider web/dashboard route smoke",
      "provider database migration dry-run",
      "provider storage private ACL smoke",
      "eas build --profile preview",
      "sentry release/source-map smoke",
      "github environment protection audit",
      "verify provider secret-store destinations",
      "record redacted provider evidence labels",
      "capture provider environment CI artifacts"
    ]);
    expect(providerEnvironmentRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "manifest-verifier",
      "strict-env-secret-store",
      "web-dashboard-smoke",
      "database-migration-dry-run",
      "storage-private-acl-smoke",
      "mobile-eas-preview-build",
      "observability-source-map-smoke",
      "github-environment-protections",
      "secret-store-destinations",
      "redacted-evidence-labels",
      "ci-provider-environment-artifacts"
    ]);
    expect(providerEnvironmentRuntimeArtifactPaths).toContain("coverage/provider-secret-store-destinations-redacted.json");
    expect(providerEnvironmentRuntimeArtifactPaths).toContain("coverage/provider-strict-env-check-redacted.json");
    expect(providerEnvironmentRuntimeArtifactPaths).toContain("test-results/provider-environment-runtime");
  });

  it("keeps redacted provider evidence manifest and verifier coverage wired", () => {
    for (const environment of ["preview", "staging", "production"]) {
      expect(providerManifest).toContain(`"name": "${environment}"`);
    }
    for (const surface of providerEnvironmentRuntimeSurfaces) {
      expect(providerManifest).toContain(`"surface": "${surface}"`);
    }
    expect(providerManifest).toContain("forbiddenInGit");
    expect(providerManifest).toContain("provider project ids");
    expect(providerManifest).toContain("secret-store destination name");
    expect(providerVerifier).toContain("provider-environment-evidence.json");
    expect(providerVerifier).toContain("verified_redacted");
    expect(deploymentTests).toContain("buildProviderEnvironmentRuntimeReadinessPlan");
  });

  it("keeps readiness blocked until provider surfaces are verified redacted and smoke/protection evidence exists", () => {
    expect(providerEnvironmentRuntimeReadiness.status).toBe("blocked");
    expect(providerEnvironmentRuntimeReadiness.missingEnvironmentSurfacePairs).toEqual(
      expect.arrayContaining(["preview/web", "staging/database", "production/ci_cd"])
    );
    expect(providerEnvironmentRuntimeReadiness.requiredCommands).toBe(providerEnvironmentRuntimeCommands);
    expect(providerEnvironmentRuntimeReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "Redacted preview, staging, and production web/dashboard URL labels with smoke output.",
        "Managed Postgres branch/project label, migration dry-run log, and backup/restore proof.",
        "Private storage bucket ACL proof and signed upload/download smoke evidence.",
        "EAS project/channel labels, preview build artifact, and device QA proof.",
        "Sentry project label, sample issue label, and source-map upload artifact.",
        "GitHub Actions environment protection, required checks, secret-store destination, and artifact-retention proof."
      ])
    );
    expect(providerEnvironmentRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Provider evidence manifest must cover preview, staging, and production for every required surface.",
        "pnpm deploy:verify-provider-envs must pass.",
        "Provider smoke checks must pass for web, dashboard, database, storage, mobile, observability, and CI/CD.",
        "GitHub preview, staging, and production environment protections must be configured."
      ])
    );
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 15 provider environment runtime contracts");
    expect(ciWorkflow).toContain("apps/web/tests/provider-environment-runtime-static.test.ts");
    expect(ciWorkflow).toContain("provider-environment-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/provider-environment-runtime.json");
    expect(ciWorkflow).toContain("coverage/provider-strict-env-check-redacted.json");
    expect(ciWorkflow).toContain("test-results/provider-environment-runtime");
    expect(unitManifest).toContain("unit-web-provider-environment-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/providerEnvironmentRuntime.ts");
    expect(gapTracker).toContain("Provider environment evidence classifier wired and provisioning proof gated");
    expect(gapTracker).toContain("GAP-114 is provider-environment-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("providerEnvironmentRuntimeLocalArtifacts");
    expect(gapTracker).toContain("providerEnvironmentRuntimeExternalArtifacts");
  });

  it("pins current provider environment runtime proof files for GAP-114", () => {
    expect(providerEnvironmentRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "apps/dashboard/app/api/deployment/readiness/route.ts",
      "apps/dashboard/tests/deployment-readiness-route-static.test.ts",
      "deployment/CI_CD_RUNBOOK.md",
      "deployment/DATABASE_MIGRATION_GUIDE.md",
      "deployment/MOBILE_BUILD_GUIDE.md",
      "deployment/PROVIDER_OPTIONS.md",
      "packages/deployment/src/index.ts",
        "apps/web/lib/providerEnvironmentRuntime.ts",
        "apps/web/tests/provider-environment-runtime-static.test.ts",
        "deployment/manifests/provider-environment-evidence.json",
        "deployment/scripts/verify-provider-envs.mjs",
        "packages/db/prisma/migrations/20260609017000_add_provider_environment_runs/migration.sql",
        ".github/workflows/ci.yml",
      ]),
    );
    for (const file of providerEnvironmentRuntimeProofFiles) {
      expect(read(file).length).toBeGreaterThan(0);
    }
  });

  it("pins durable ProviderEnvironmentRun persistence before provider provisioning proof is captured", () => {
    const runData = buildProviderEnvironmentRunData({
      tenantId: "tenant_static",
      runId: "provider_environment_static",
      commitSha: "abc123",
      status: "blocked",
      environmentMatrix: [{ environment: "preview", status: "configured_redacted" }],
      surfaceMatrix: [{ surface: "web", environment: "preview", status: "smoke_pending" }],
      artifactManifest: ["coverage/provider-environment-runtime.json"],
      verifierPassed: true,
      strictEnvCheckPassed: false,
      previewProvisioned: true,
      stagingProvisioned: false,
      productionProvisioned: false,
      webDashboardSmokePassed: false,
      databaseMigrationDryRunPassed: false,
      storagePrivateAclSmokePassed: false,
      mobilePreviewBuildPassed: false,
      observabilitySourceMapSmokePassed: false,
      githubEnvironmentProtectionsConfigured: false,
      secretStoreDestinationsConfigured: false,
      redactedEvidenceLabelsRecorded: true,
      ciProviderEnvironmentArtifactsCaptured: false,
      requiredCommandsRun: ["pnpm deploy:verify-provider-envs"],
      capturedArtifacts: ["coverage/provider-environment-runtime.json"],
      redactedHandoffArtifactPath: "coverage/provider-redacted-handoff-labels.json",
      ciRunUrl: "https://github.example/redacted/provider-environment",
    });

    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "provider_environment_static",
      status: "blocked",
      previewProvisioned: true,
      redactedEvidenceLabelsRecorded: true,
      redactedHandoffArtifactPath: "coverage/provider-redacted-handoff-labels.json",
    });
    expect(persistProviderEnvironmentRun).toBeTypeOf("function");
    expect(String(persistProviderEnvironmentRun)).toContain("repository.providerEnvironmentRun.upsert");
    expect(providerEnvironmentRunPersistenceContract.prismaModel).toBe("ProviderEnvironmentRun");
    expect(providerEnvironmentRunPersistenceContract.tenantRelation).toBe("providerEnvironmentRuns");
    expect(providerEnvironmentRunPersistenceContract.uniqueKey).toEqual(["tenantId", "runId"]);
    expect(providerEnvironmentRunPersistenceContract.jsonFields).toEqual([
      "environmentMatrix",
      "surfaceMatrix",
      "artifactManifest"
    ]);
    expect(providerEnvironmentRunPersistenceContract.requiredBooleanProofs).toEqual(
      expect.arrayContaining([
        "previewProvisioned",
        "stagingProvisioned",
        "productionProvisioned",
        "secretStoreDestinationsConfigured",
        "redactedEvidenceLabelsRecorded",
        "ciProviderEnvironmentArtifactsCaptured"
      ])
    );
    expect(prismaSchema).toContain("providerEnvironmentRuns ProviderEnvironmentRun[]");
    expect(prismaSchema).toContain("model ProviderEnvironmentRun");
    expect(prismaSchema).toContain("environmentMatrix                       Json");
    expect(prismaSchema).toContain("githubEnvironmentProtectionsConfigured  Boolean  @default(false)");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(prismaMigration).toContain('CREATE TABLE "ProviderEnvironmentRun"');
    expect(prismaMigration).toContain('"redactedHandoffArtifactPath" TEXT');
    expect(unitManifest).toContain("ProviderEnvironmentRun Prisma model and app row contract");
    expect(gapTracker).toContain("packages/db/prisma/migrations/20260609017000_add_provider_environment_runs/migration.sql");
    expect(gapTracker).toContain("persistProviderEnvironmentRun upsert seam");
  });

  it("classifies GAP-114 evidence as blocked until redacted provider provisioning proof is captured", () => {
    const blockedDecision = buildProviderEnvironmentRuntimeEvidenceDecision({
      verifierPassed: true,
      strictEnvCheckPassed: false,
      previewProvisioned: true,
      stagingProvisioned: false,
      productionProvisioned: false,
      webDashboardSmokePassed: false,
      databaseMigrationDryRunPassed: false,
      storagePrivateAclSmokePassed: false,
      mobilePreviewBuildPassed: false,
      observabilitySourceMapSmokePassed: false,
      githubEnvironmentProtectionsConfigured: false,
      secretStoreDestinationsConfigured: false,
      redactedEvidenceLabelsRecorded: true,
      ciProviderEnvironmentArtifactsCaptured: false,
      requiredCommandsRun: providerEnvironmentRuntimeCommands.filter(
        (command) =>
          command !== "pnpm deploy:check-env:strict" &&
          command !== "provider database migration dry-run" &&
          command !== "github environment protection audit" &&
          command !== "verify provider secret-store destinations" &&
          command !== "capture provider environment CI artifacts",
      ),
      capturedArtifacts: [
        "coverage/provider-environment-runtime.json",
        "coverage/provider-environment-verifier.json",
        "coverage/provider-strict-env-check-redacted.json",
        "coverage/provider-redacted-handoff-labels.json",
        "test-results/provider-environment-runtime"
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Run strict provider environment checks.",
        "Capture staging provider provisioning proof.",
        "Capture production provider provisioning proof.",
        "Capture web/dashboard provider smoke proof.",
        "Capture provider database migration dry-run proof.",
        "Capture GitHub environment protection audit proof.",
        "Capture secret-store destination proof.",
        "Capture CI provider-environment artifacts.",
        "Required command not recorded: pnpm deploy:check-env:strict",
        "Required command not recorded: provider database migration dry-run",
        "Required command not recorded: github environment protection audit",
        "Required command not recorded: verify provider secret-store destinations",
        "Required command not recorded: capture provider environment CI artifacts",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/provider-web-dashboard-smoke-redacted.json",
        "coverage/provider-database-migration-dry-run-redacted.json",
        "coverage/provider-storage-private-acl-redacted.json",
        "coverage/provider-github-environment-protection-redacted.json",
        "coverage/provider-secret-store-destinations-redacted.json",
        "coverage/provider-environment-ci-run-redacted.json",
      ]),
    );
    expect(blockedDecision.providerEnvironmentPolicy).toEqual({
      rawProjectIdsForbiddenInGit: true,
      secretStoreDestinationsRequired: true,
      redactedEvidenceLabelsRequired: true,
    });

    const completeDecision = buildProviderEnvironmentRuntimeEvidenceDecision({
      verifierPassed: true,
      strictEnvCheckPassed: true,
      previewProvisioned: true,
      stagingProvisioned: true,
      productionProvisioned: true,
      webDashboardSmokePassed: true,
      databaseMigrationDryRunPassed: true,
      storagePrivateAclSmokePassed: true,
      mobilePreviewBuildPassed: true,
      observabilitySourceMapSmokePassed: true,
      githubEnvironmentProtectionsConfigured: true,
      secretStoreDestinationsConfigured: true,
      redactedEvidenceLabelsRecorded: true,
      ciProviderEnvironmentArtifactsCaptured: true,
      requiredCommandsRun: providerEnvironmentRuntimeCommands,
      capturedArtifacts: providerEnvironmentRuntimeArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(providerEnvironmentRuntimeCommands);
    expect(completeDecision.requiredEvidence).toBe(providerEnvironmentRuntimeArtifactPaths);
  });

  it("keeps provider provisioning execution disabled while splitting local labels from external proof", () => {
    const plan = buildProviderEnvironmentRuntimeExecutionPlan();

    expect(plan.localCommands).toBe(providerEnvironmentRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(providerEnvironmentRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(providerEnvironmentRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(providerEnvironmentRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/provider-environment-runtime.json",
        "coverage/provider-environment-verifier.json",
        "coverage/provider-redacted-handoff-labels.json",
        "test-results/provider-environment-runtime",
      ]),
    );
    expect(plan.externalArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/provider-strict-env-check-redacted.json",
        "coverage/provider-web-dashboard-smoke-redacted.json",
        "coverage/provider-database-migration-dry-run-redacted.json",
        "coverage/provider-storage-private-acl-redacted.json",
        "coverage/provider-mobile-eas-preview-redacted.json",
        "coverage/provider-sentry-release-smoke-redacted.json",
        "coverage/provider-github-environment-protection-redacted.json",
        "coverage/provider-secret-store-destinations-redacted.json",
        "coverage/provider-environment-ci-run-redacted.json",
      ]),
    );
    expect(plan.manifestVerifierExecutionAllowed).toBe(false);
    expect(plan.strictEnvExecutionAllowed).toBe(false);
    expect(plan.providerProvisioningExecutionAllowed).toBe(false);
    expect(plan.webDashboardSmokeExecutionAllowed).toBe(false);
    expect(plan.databaseDryRunExecutionAllowed).toBe(false);
    expect(plan.storageAclExecutionAllowed).toBe(false);
    expect(plan.mobileEasExecutionAllowed).toBe(false);
    expect(plan.observabilitySourceMapExecutionAllowed).toBe(false);
    expect(plan.githubProtectionAuditExecutionAllowed).toBe(false);
    expect(plan.secretStoreDestinationExecutionAllowed).toBe(false);
    expect(plan.ciArtifactExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.executionPolicy).toBe(providerEnvironmentRuntimeExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyRedactedLabels: true,
      rawProjectIdsForbiddenInGit: true,
      providerConsoleRequiredForProvisioning: true,
      secretStoreAccessRequiresApprovedOperator: true,
      ciProviderRequiredForEnvironmentArtifacts: true,
      providerDatabaseRequiredForPersistence: true,
    });
  });

  it("redacts provider environment artifacts before handoff or persistence review", () => {
    const rawArtifact = {
      projectId: "project_live_abc123",
      providerResourceId: "provider_prod_456",
      productionUrl: "https://inkroute.example.com?tenant=tenant_demo",
      databaseUrl: "postgres://tenant_demo:secret@db.example.com/inkroute",
      secretStoreDestination: "render_secret_store_prod",
      sentryProject: "sentry_project_789",
      easBuildUrl: "https://expo.dev/accounts/inkroute/projects/mobile/builds/eas_123",
      githubEnvironment: { url: "https://github.com/dominator509/InkRoute/settings/environments/production" },
      contactEmail: "owner@example.com",
      phone: "+1 555 111 9999",
      nested: {
        authorization: "Bearer provider-secret-token",
        tenantId: "tenant_demo",
      },
    };
    const redacted = buildRedactedProviderEnvironmentArtifact(rawArtifact);
    const review = buildProviderEnvironmentRuntimeArtifactReview("coverage/provider-environment-ci-run-redacted.json", rawArtifact);
    const serialized = JSON.stringify(review);

    expect(JSON.stringify(redacted)).not.toContain("project_live_abc123");
    expect(serialized).not.toContain("postgres://");
    expect(serialized).not.toContain("inkroute.example.com");
    expect(serialized).not.toContain("github.com/dominator509");
    expect(serialized).not.toContain("expo.dev");
    expect(serialized).not.toContain("owner@example.com");
    expect(serialized).not.toContain("+1 555 111 9999");
    expect(serialized).not.toContain("Bearer provider-secret-token");
    expect(serialized).not.toContain("tenant_demo");
    expect(review.containsUnredactedSensitiveValues).toBe(false);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "authorization",
        "databaseUrl",
        "easBuildUrl",
        "githubEnvironment",
        "phone",
        "productionUrl",
        "projectId",
        "providerResourceId",
        "secretStoreDestination",
        "sentryProject",
      ]),
    );
    expect(review.externalEvidenceRequired).toBe(providerEnvironmentRuntimeRequiredExternalEvidence);
    expect(review.externalEvidenceRequired).toEqual(
      expect.arrayContaining([
        "Preview, staging, and production provider project proof must be captured outside Codex with raw project IDs redacted.",
        "Secret-store destination evidence must include labels only and never committed secret values or provider resource IDs.",
        "Database, storage, EAS, Sentry, and GitHub protection artifacts must redact URLs, tokens, bucket names, project IDs, and user data.",
        "ProviderEnvironmentRun persistence must execute only against an approved provider-backed database.",
      ]),
    );
  });
});

