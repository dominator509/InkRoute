import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedReleaseLaunchControlArtifact,
  buildReleaseLaunchControlArtifactReview,
  buildReleaseLaunchControlRunData,
  buildReleaseLaunchControlEvidenceDecision,
  buildReleaseLaunchControlExecutionPlan,
  persistReleaseLaunchControlRun,
  releaseLaunchControlEvidenceFlags,
  releaseLaunchControlExternalArtifacts,
  releaseLaunchControlExternalCommands,
  releaseLaunchControlExecutionPolicy,
  releaseLaunchControlArtifactPaths,
  releaseLaunchControlLocalArtifacts,
  releaseLaunchControlLocalCommands,
  releaseLaunchControlRuntimeCommands,
  releaseLaunchControlRuntimeMatrix,
  releaseLaunchControlRuntimeProofFiles,
  releaseLaunchControlRuntimeReadiness,
  releaseLaunchControlRequiredExternalEvidence,
  releaseLaunchControlRunPersistenceContract,
} from "../lib/releaseLaunchControlRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("release launch control runtime contract", () => {
  const releasePackageJson = readRepoFile("packages/releases/package.json");
  const releaseSource = readRepoFile("packages/releases/src/index.ts");
  const releaseTests = readRepoFile("packages/releases/tests/feature-flags.test.ts");
  const releaseRoute = readRepoFile("apps/dashboard/app/api/releases/route.ts");
  const featureFlagRoute = readRepoFile("apps/dashboard/app/api/feature-flags/route.ts");
  const releaseRouteTest = readRepoFile("apps/dashboard/tests/release-route-static.test.ts");
  const featureFlagRouteTest = readRepoFile("apps/dashboard/tests/feature-flag-route-static.test.ts");
  const releaseHealthRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/release-health/route.ts");
  const releaseGovernanceWorkflow = readRepoFile(".github/workflows/release-governance.yml");
  const releasePlan = readRepoFile("RELEASE_AND_AUTO_UPDATE_PLAN.md");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const rootPackageJson = readRepoFile("package.json");
  const evidenceWriterSource = readRepoFile("scripts/releases/write-release-launch-control-evidence.mjs");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const releaseLaunchControlRunMigration = readRepoFile("packages/db/prisma/migrations/20260609033900_add_release_launch_control_runs/migration.sql");

  it("pins release launch commands, matrix rows, and redacted artifact paths", () => {
    expect(releaseLaunchControlRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/releases typecheck",
      "pnpm --filter @inkroute/releases test",
      "pnpm release:launch-control-evidence",
      "provider-backed release/feature-flag route integration tests",
      "release-governance GitHub Actions workflow execution",
      "CI required checks release gate",
      "preview deploy job smoke",
      "protected environment approval dry run",
      "signed deployment provenance check",
      "migration gate dry run",
      "incident-linked rollback drill",
      "EAS update governance drill",
      "tenant rollout controls drill",
      "feature-flag kill-switch drill",
      "release-health envelope smoke",
      "capture release launch CI artifacts",
      "secret-safe release launch artifact review",
    ]);
    expect(releaseLaunchControlRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "release-package-gates",
      "local-evidence-writer",
      "persistence-rbac-concurrency-audit",
      "protected-environments-signed-jobs-ci",
      "preview-production-approval-dry-run",
      "migration-gate-dry-run",
      "incident-linked-rollback",
      "eas-update-governance",
      "rollout-kill-switch-health",
      "ci-secret-safe-artifacts",
    ]);
    expect(releaseLaunchControlArtifactPaths).toContain("coverage/release-launch-control-runtime.json");
    expect(releaseLaunchControlArtifactPaths).toContain("coverage/release-secret-safe-artifacts.json");
    expect(releaseLaunchControlArtifactPaths).toContain("test-results/release-launch-control-runtime");
  });

  it("keeps release helpers, hardened routes, workflow, and plan wired", () => {
    expect(releasePackageJson).toContain('"typecheck"');
    expect(releasePackageJson).toContain('"test"');
    expect(releaseSource).toContain("buildReleaseLaunchControlEvidencePlan");
    expect(releaseTests).toContain("buildReleaseLaunchControlEvidencePlan");
    expect(releaseRoute).toContain("release:read:list");
    expect(releaseRoute).toContain("no-store");
    expect(featureFlagRoute).toContain("feature_flag:read:list");
    expect(featureFlagRoute).toContain("no-store");
    expect(releaseRouteTest).toContain("tenant-scoped release envelope");
    expect(featureFlagRouteTest).toContain("FeatureFlag/default definition loader");
    expect(releaseHealthRoute).toContain("release");
    expect(rootPackageJson).toContain("release:launch-control-evidence");
    expect(evidenceWriterSource).toContain("providerBackedRouteTestsPassed: false");
    expect(evidenceWriterSource).toContain("protected GitHub environments");
    expect(evidenceWriterSource).toContain("release-record-persistence-redacted.json");
    expect(evidenceWriterSource).toContain("release-feature-flag-persistence-redacted.json");
    expect(evidenceWriterSource).toContain("release-rbac-tenant-scope-redacted.json");
    expect(evidenceWriterSource).toContain("release-protected-environments-redacted.json");
    expect(evidenceWriterSource).toContain("release-signed-provenance-redacted.json");
    expect(evidenceWriterSource).toContain("release-migration-gate-dry-run-redacted.json");
    expect(evidenceWriterSource).toContain("release-incident-linked-rollback-redacted.json");
    expect(evidenceWriterSource).toContain("release-eas-update-governance-redacted.json");
    expect(evidenceWriterSource).toContain("release-provider-route-tests-redacted.json");
    expect(evidenceWriterSource).toContain("release-ci-artifacts-redacted.json");
    expect(evidenceWriterSource).toContain("release-health-envelope.json");
    expect(releaseGovernanceWorkflow).toContain("workflow_dispatch");
    expect(releasePlan).toContain("Release");
  });

  it("keeps launch control blocked until persisted controls, protected environments, rollback, EAS, provider, CI, and safe artifacts exist", () => {
    expect(releaseLaunchControlRuntimeReadiness.status).toBe("blocked");
    expect(releaseLaunchControlRuntimeReadiness.missingScripts).toEqual([]);
    expect(releaseLaunchControlRuntimeReadiness.requiredCommands).toBe(releaseLaunchControlRuntimeCommands);
    expect(releaseLaunchControlRuntimeReadiness.requiredEvidence).toBe(releaseLaunchControlEvidenceFlags);
    expect(releaseLaunchControlRuntimeReadiness.blockers).toContain(
      "GitHub preview, staging, and production protected environments must be configured.",
    );
    expect(releaseLaunchControlRuntimeReadiness.blockers).toContain(
      "Incident-linked rollback drill must pass for web, dashboard, mobile OTA, database, and flags.",
    );
    expect(releaseLaunchControlRuntimeReadiness.blockers).not.toContain("Tenant-scoped rollout controls must be verified.");
    expect(releaseLaunchControlRuntimeReadiness.blockers).not.toContain("Feature-flag kill-switch drill must pass.");
    expect(releaseLaunchControlRuntimeReadiness.blockers).not.toContain("Release-health envelope must report tenant-safe release, flag, deployment, and rollback state.");
    expect(releaseLaunchControlRuntimeReadiness.blockers).not.toContain("Release launch artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.");
  });

  it("pins the ReleaseLaunchControlRun persistence model and migration", () => {
    const runData = buildReleaseLaunchControlRunData({
      tenantId: "tenant_static",
      runId: "release_static",
      commitSha: "abc123",
      status: "partial",
      evidence: {
        rolloutControlsVerified: true,
        killSwitchDrillPassed: true,
        releaseHealthEnvelopeVerified: true,
        secretSafeArtifactsCaptured: true,
      },
      releaseHealthEnvelopePath: "coverage/release-health-envelope.json",
      rollbackDrillArtifactPath: "coverage/release-incident-linked-rollback-redacted.json",
    });

    expect(releaseLaunchControlRunPersistenceContract).toEqual({
      prismaModel: "ReleaseLaunchControlRun",
      tenantRelation: "releaseLaunchControlRuns",
      migration: "20260609033900_add_release_launch_control_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesReadinessStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesPersistenceEvidence: true,
      storesGovernanceEvidence: true,
      storesMigrationGateEvidence: true,
      storesRollbackEvidence: true,
      storesMobileGovernanceEvidence: true,
      storesCiArtifactEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(prismaSchema).toContain("model ReleaseLaunchControlRun");
    expect(prismaSchema).toContain("releaseLaunchControlRuns ReleaseLaunchControlRun[]");
    expect(prismaSchema).toContain("persistenceEvidenceCaptured");
    expect(prismaSchema).toContain("mobileGovernanceEvidenceCaptured");
    expect(prismaSchema).toContain("secretSafeArtifactsCaptured");
    expect(releaseLaunchControlRunMigration).toContain('CREATE TABLE "ReleaseLaunchControlRun"');
    expect(releaseLaunchControlRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(releaseLaunchControlRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(releaseLaunchControlRunMigration).toContain('"ReleaseLaunchControlRun_tenantId_runId_key"');
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "release_static",
      commitSha: "abc123",
      status: "partial",
      rollbackEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
      releaseHealthEnvelopePath: "coverage/release-health-envelope.json",
      rollbackDrillArtifactPath: "coverage/release-incident-linked-rollback-redacted.json",
    });
    expect(runData.persistenceEvidenceCaptured).toBe(false);
    expect(runData.governanceEvidenceCaptured).toBe(false);
    expect(runData.mobileGovernanceEvidenceCaptured).toBe(false);
    expect(String(persistReleaseLaunchControlRun)).toContain("repository.releaseLaunchControlRun.upsert");
  });

  it("blocks release launch control completion when provider, governance, rollback, or artifact evidence is missing", () => {
    const decision = buildReleaseLaunchControlEvidenceDecision({
      commands: ["pnpm --filter @inkroute/releases typecheck"],
      artifacts: ["coverage/release-package-typecheck.txt"],
      evidence: {
        releasesTypecheckPassed: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("protected environment approval dry run");
    expect(decision.missingArtifacts).toContain("coverage/release-secret-safe-artifacts.json");
    expect(decision.missingEvidence).toContain("releaseRecordPersistenceVerified");
    expect(decision.missingEvidence).toContain("incidentLinkedRollbackDrillPassed");
    expect(decision.blockers).toContain("ReleaseRecord provider-backed persistence must be verified.");
    expect(decision.blockers).toContain(
      "Incident-linked rollback drill must pass for web, dashboard, mobile OTA, database, and flags.",
    );
  });

  it("completes release launch control only when every command, artifact, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(releaseLaunchControlEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildReleaseLaunchControlEvidenceDecision({
      commands: releaseLaunchControlRuntimeCommands,
      artifacts: releaseLaunchControlArtifactPaths,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(releaseLaunchControlEvidenceFlags);
  });

  it("keeps release launch control execution classified, redacted, and provider-gated", () => {
    const executionPlan = buildReleaseLaunchControlExecutionPlan();
    expect(executionPlan.localCommands).toBe(releaseLaunchControlLocalCommands);
    expect(executionPlan.externalCommands).toBe(releaseLaunchControlExternalCommands);
    expect(executionPlan.localArtifacts).toBe(releaseLaunchControlLocalArtifacts);
    expect(executionPlan.externalArtifacts).toBe(releaseLaunchControlExternalArtifacts);
    expect(executionPlan.localCommands).toContain("pnpm release:launch-control-evidence");
    expect(executionPlan.localCommands).toContain("feature-flag kill-switch drill");
    expect(executionPlan.externalCommands).toContain("provider-backed release/feature-flag route integration tests");
    expect(executionPlan.externalCommands).toContain("release-governance GitHub Actions workflow execution");
    expect(executionPlan.localArtifacts).toContain("coverage/release-secret-safe-artifacts.json");
    expect(executionPlan.externalArtifacts).toContain("coverage/release-protected-environments-redacted.json");
    expect(executionPlan.externalArtifacts).toContain("test-results/release-launch-control-runtime");
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.providerExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.productionExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.mobileProviderExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(releaseLaunchControlExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticReleaseLaunchReadiness: true,
      providerPersistenceRequiredForClosure: true,
      protectedEnvironmentEvidenceRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(releaseLaunchControlRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Provider-backed ReleaseLaunchControlRun persistence row captured through persistReleaseLaunchControlRun.",
    );

    const artifact = {
      githubToken: "github_pat_abcdefghijklmnopqrstuvwxyz123456",
      releaseRecordId: "release_record_1234567890abcdefghijklmnopqrstuvwxyz",
      featureFlagId: "feature_flag_1234567890abcdefghijklmnopqrstuvwxyz",
      deploymentUrl: "https://inkroute-preview.example.com",
      protectedEnvironmentApproval: "approved by release-admin@example.com for production",
      workflowRunLog: "gh run view 1234567890 --log with deployment job output",
      rollbackTranscript: "rollback incident INC-123 linked to release_record_1234567890abcdefghijklmnopqrstuvwxyz",
      migrationDryRunOutput: "prisma migrate deploy dry-run against postgres://inkroute:secret@db.example.com:5432/inkroute",
      repositorySelector: "repo:dominator509/InkRoute",
      branchSelector: "branch:production/release-launch",
      pullRequestSelector: "pr_release_launch",
      reviewerHandle: "reviewer_release_owner",
      codeownerSelector: "CODEOWNER:release-platform-team",
      easRolloutPayload: { updateUrl: "https://expo.dev/accounts/inkroute/projects/mobile/updates/123" },
      stackTrace: "Error: release launch control leaked provider payload",
      nested: {
        databaseUrl: "postgres://inkroute:secret@db.example.com:5432/inkroute",
        tenantId: "tenant_release_1234567890",
        publicSummary: "release launch control evidence captured",
      },
    };
    const redactedOnly = buildRedactedReleaseLaunchControlArtifact(artifact);
    const review = buildReleaseLaunchControlArtifactReview(artifact);
    const serialized = JSON.stringify(review.artifact);

    expect(JSON.stringify(redactedOnly)).not.toContain("github_pat_abcdefghijklmnopqrstuvwxyz123456");
    expect(serialized).not.toContain("release_record_1234567890abcdefghijklmnopqrstuvwxyz");
    expect(serialized).not.toContain("feature_flag_1234567890abcdefghijklmnopqrstuvwxyz");
    expect(serialized).not.toContain("https://inkroute-preview.example.com");
    expect(serialized).not.toContain("release-admin@example.com");
    expect(serialized).not.toContain("deployment job output");
    expect(serialized).not.toContain("INC-123");
    expect(serialized).not.toContain("prisma migrate deploy");
    expect(serialized).not.toContain("expo.dev/accounts");
    expect(serialized).not.toContain("repo:dominator509/InkRoute");
    expect(serialized).not.toContain("branch:production/release-launch");
    expect(serialized).not.toContain("pr_release_launch");
    expect(serialized).not.toContain("reviewer_release_owner");
    expect(serialized).not.toContain("CODEOWNER:release-platform-team");
    expect(serialized).not.toContain("provider payload");
    expect(serialized).not.toContain("postgres://inkroute:secret@db.example.com:5432/inkroute");
    expect(serialized).not.toContain("tenant_release_1234567890");
    expect(review.redactions).toEqual([
      "githubToken",
      "releaseRecordId",
      "featureFlagId",
      "deploymentUrl",
      "protectedEnvironmentApproval",
      "workflowRunLog",
      "rollbackTranscript",
      "migrationDryRunOutput",
      "repositorySelector",
      "branchSelector",
      "pullRequestSelector",
      "reviewerHandle",
      "codeownerSelector",
      "easRolloutPayload",
      "stackTrace",
      "nested.databaseUrl",
      "nested.tenantId",
    ]);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(releaseLaunchControlRequiredExternalEvidence);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming release launch control readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 12 release launch control runtime contracts");
    expect(ciWorkflow).toContain("release-launch-control-runtime-static.test.ts");
    expect(ciWorkflow).toContain("release-launch-control-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/release-launch-control-runtime.json");
    expect(unitManifest).toContain("unit-web-release-launch-control-runtime-static");
    expect(unitManifest).toContain("ReleaseLaunchControlRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/releaseLaunchControlRuntime.ts");
    expect(gapTracker).toContain("ReleaseLaunchControlRun Prisma model and app row contract");
    expect(gapTracker).toContain("local redacted release-control/persistence/RBAC/concurrency/audit/governance/rollback/EAS/rollout/kill-switch/release-health/provider-route/CI/secret-safe fixture artifacts");
    expect(gapTracker).toContain("persistReleaseLaunchControlRun upsert seam is source-wired");
    expect(gapTracker).toContain("live ReleaseRecord/FeatureFlag provider-backed persistence, provider-backed persistReleaseLaunchControlRun execution, protected environments, signed jobs, CI required checks, preview/prod approval dry runs, migration gates, incident-linked rollback, EAS governance, provider route tests, and CI artifacts remain open");
    expect(gapTracker).toContain("GAP-015 is release-launch-control-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("proof inventory");
    expect(gapTracker).toContain("buildReleaseLaunchControlExecutionPlan");
    expect(gapTracker).toContain("releaseLaunchControlLocalCommands/releaseLaunchControlExternalCommands");
    expect(gapTracker).toContain("releaseLaunchControlExecutionPolicy");
    expect(gapTracker).toContain("releaseLaunchControlRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedReleaseLaunchControlArtifact");
    expect(gapTracker).toContain("buildReleaseLaunchControlArtifactReview");
    expect(gapTracker).toContain("GAP-015 release launch control artifact hardening now redacts repository/branch/PR/reviewer/CODEOWNER selectors");
  });

  it("pins current release launch control proof files for GAP-015", () => {
    expect(releaseLaunchControlRuntimeProofFiles).toContain("packages/releases/package.json");
    expect(releaseLaunchControlRuntimeProofFiles).toContain("apps/web/lib/releaseLaunchControlRuntime.ts");
    expect(releaseLaunchControlRuntimeProofFiles).toContain("scripts/releases/write-release-launch-control-evidence.mjs");
    expect(releaseLaunchControlRuntimeProofFiles).toContain("apps/web/tests/release-launch-control-runtime-static.test.ts");
    for (const proofFile of releaseLaunchControlRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});


