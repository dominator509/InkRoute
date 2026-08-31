import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDeploymentLaunchEvidenceArtifactReview,
  buildDeploymentLaunchEvidenceRunData,
  buildDeploymentLaunchEvidenceDecision,
  buildDeploymentLaunchEvidenceExecutionPlan,
  buildRedactedDeploymentLaunchEvidenceArtifact,
  deploymentLaunchEvidenceExternalArtifacts,
  deploymentLaunchEvidenceExternalCommands,
  deploymentLaunchEvidenceFlags,
  deploymentLaunchEvidenceArtifactPaths,
  deploymentLaunchEvidenceExecutionPolicy,
  deploymentLaunchEvidenceLocalArtifacts,
  deploymentLaunchEvidenceLocalCommands,
  deploymentLaunchEvidenceRequiredExternalEvidence,
  deploymentLaunchEvidenceRuntimeCommands,
  deploymentLaunchEvidenceRuntimeMatrix,
  deploymentLaunchEvidenceRuntimeProofFiles,
  deploymentLaunchEvidenceRuntimeReadiness,
  deploymentLaunchEvidenceRunPersistenceContract,
  deploymentLaunchEvidenceSurfaceContract,
  persistDeploymentLaunchEvidenceRun,
} from "../lib/deploymentLaunchEvidenceRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("deployment launch evidence runtime contract", () => {
  const deploymentPackageJson = readRepoFile("packages/deployment/package.json");
  const deploymentSource = readRepoFile("packages/deployment/src/index.ts");
  const deploymentTests = readRepoFile("packages/deployment/tests/deployment-readiness.test.ts");
  const dashboardDeploymentPage = readRepoFile("apps/dashboard/app/deployment/page.tsx");
  const deploymentReadinessActionPanel = readRepoFile("apps/dashboard/components/DeploymentReadinessActionPanel.tsx");
  const dashboardReadinessRoute = readRepoFile("apps/dashboard/app/api/deployment/readiness/route.ts");
  const dashboardReadinessTest = readRepoFile("apps/dashboard/tests/deployment-readiness-route-static.test.ts");
  const deploymentDocs = readRepoFile("DEPLOYMENT.md");
  const releaseGovernanceWorkflow = readRepoFile(".github/workflows/release-governance.yml");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const deploymentLaunchEvidenceRunMigration = readRepoFile("packages/db/prisma/migrations/20260609033800_add_deployment_launch_evidence_runs/migration.sql");

  it("pins deployment launch commands, matrix rows, and redacted artifact paths", () => {
    expect(deploymentLaunchEvidenceRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/deployment typecheck",
      "pnpm --filter @inkroute/deployment test",
      "pnpm deploy:verify-provider-envs",
      "pnpm deploy:verify-secrets",
      "pnpm deploy:verify-database-ops",
      "pnpm deploy:verify-mobile",
      "Vercel preview deployment smoke",
      "production deployment dry run",
      "EAS preview build",
      "mobile OTA rollback test",
      "deployment rollback drill",
      "GitHub protected environment approval proof",
      "Sentry release/source-map upload proof",
      "pnpm deploy:verify-launch-evidence",
    ]);
    expect(deploymentLaunchEvidenceRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "deployment-package-gates",
      "provider-projects-and-preview",
      "protected-environments-secrets-approval",
      "production-dry-run-strict-env",
      "database-storage-operations",
      "mobile-eas-preview-native-ota",
      "ci-sentry-release-upload",
      "rollback-launch-packet-artifact-safety",
    ]);
    expect(deploymentLaunchEvidenceSurfaceContract.map((entry) => entry.surfaceId)).toEqual([
      "deployment-package-gates",
      "provider-projects-and-preview",
      "protected-environments-secrets-approval",
      "production-dry-run-strict-env",
      "database-storage-operations",
      "mobile-eas-preview-native-ota",
      "ci-sentry-release-upload",
      "rollback-launch-packet",
      "protected-approval-proof",
      "provider-artifact-safety",
    ]);
    expect(deploymentLaunchEvidenceArtifactPaths).toContain("coverage/deployment-launch-evidence-runtime.json");
    expect(deploymentLaunchEvidenceArtifactPaths).toContain("coverage/deployment-provider-artifact-safety.json");
    expect(deploymentLaunchEvidenceArtifactPaths).toContain("test-results/deployment-launch-evidence-runtime");
  });

  it("keeps deployment helper, package scripts, dashboard readiness route, docs, and release workflow wired", () => {
    expect(deploymentPackageJson).toContain('"typecheck"');
    expect(deploymentPackageJson).toContain('"test"');
    expect(deploymentSource).toContain("buildDeploymentLaunchEvidencePlan");
    expect(deploymentTests).toContain("buildDeploymentLaunchEvidencePlan");
    expect(dashboardReadinessRoute).toContain("release:read");
    expect(dashboardReadinessRoute).toContain("no-store");
    expect(dashboardReadinessRoute).toContain("prisma.auditLog.create");
    expect(dashboardDeploymentPage).toContain("DeploymentReadinessActionPanel");
    expect(deploymentReadinessActionPanel).toContain('fetch("/api/deployment/readiness"');
    expect(deploymentReadinessActionPanel).toContain("Request readiness review");
    expect(dashboardReadinessTest).toContain("redactedFields");
    expect(dashboardReadinessTest).toContain("without exposing secret values");
    expect(deploymentDocs).toContain("Deployment");
    expect(releaseGovernanceWorkflow).toContain("workflow_dispatch");
  });

  it("keeps deployment launch evidence blocked until provider, environment, mobile, rollback, Sentry, CI, and safe artifacts exist", () => {
    expect(deploymentLaunchEvidenceRuntimeReadiness.status).toBe("blocked");
    expect(deploymentLaunchEvidenceRuntimeReadiness.missingScripts).toEqual([]);
    expect(deploymentLaunchEvidenceRuntimeReadiness.requiredCommands).toBe(deploymentLaunchEvidenceRuntimeCommands);
    expect(deploymentLaunchEvidenceRuntimeReadiness.requiredEvidence).toBe(deploymentLaunchEvidenceFlags);
    expect(deploymentLaunchEvidenceRuntimeReadiness.blockers).toContain(
      "Vercel web and dashboard projects must be configured with redacted project evidence.",
    );
    expect(deploymentLaunchEvidenceRuntimeReadiness.blockers).toContain(
      "Production deployment must be protected by verified approval gates.",
    );
    expect(deploymentLaunchEvidenceRuntimeReadiness.blockers).toContain(
      "Provider artifacts must be redacted and free of secrets, tokens, raw PII, medical, or payment data.",
    );
  });

  it("pins the DeploymentLaunchEvidenceRun persistence model and migration", () => {
    const runData = buildDeploymentLaunchEvidenceRunData({
      tenantId: "tenant_static",
      runId: "deployment_static",
      commitSha: "abc123",
      status: "blocked",
      commands: ["pnpm deploy:verify-provider-envs"],
      artifacts: ["coverage/deployment-provider-envs-redacted.json"],
      providerGateEvidenceCaptured: true,
      environmentGateEvidenceCaptured: false,
      databaseGateEvidenceCaptured: false,
      mobileGateEvidenceCaptured: false,
      ciGateEvidenceCaptured: false,
      rollbackGateEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      evidencePacketPath: "coverage/deployment-launch-evidence-packet-redacted.json",
      providerArtifactSafetyPath: "coverage/deployment-provider-artifact-safety.json",
    });

    expect(deploymentLaunchEvidenceRunPersistenceContract).toEqual({
      prismaModel: "DeploymentLaunchEvidenceRun",
      tenantRelation: "deploymentLaunchEvidenceRuns",
      migration: "20260609033800_add_deployment_launch_evidence_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesReadinessStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesProviderGateEvidence: true,
      storesEnvironmentGateEvidence: true,
      storesDatabaseGateEvidence: true,
      storesMobileGateEvidence: true,
      storesCiGateEvidence: true,
      storesRollbackGateEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "deployment_static",
      commitSha: "abc123",
      status: "blocked",
      commandMatrix: ["pnpm deploy:verify-provider-envs"],
      artifactManifest: ["coverage/deployment-provider-envs-redacted.json"],
      providerGateEvidenceCaptured: true,
      environmentGateEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      evidencePacketPath: "coverage/deployment-launch-evidence-packet-redacted.json",
      providerArtifactSafetyPath: "coverage/deployment-provider-artifact-safety.json",
    });
    expect(String(persistDeploymentLaunchEvidenceRun)).toContain("repository.deploymentLaunchEvidenceRun.upsert");
    expect(prismaSchema).toContain("model DeploymentLaunchEvidenceRun");
    expect(prismaSchema).toContain("deploymentLaunchEvidenceRuns DeploymentLaunchEvidenceRun[]");
    expect(prismaSchema).toContain("providerGateEvidenceCaptured");
    expect(prismaSchema).toContain("secretSafeArtifactsCaptured");
    expect(deploymentLaunchEvidenceRunMigration).toContain('CREATE TABLE "DeploymentLaunchEvidenceRun"');
    expect(deploymentLaunchEvidenceRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(deploymentLaunchEvidenceRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(deploymentLaunchEvidenceRunMigration).toContain('"DeploymentLaunchEvidenceRun_tenantId_runId_key"');
  });

  it("blocks deployment launch completion when provider, runtime, or secret-safe evidence is missing", () => {
    const decision = buildDeploymentLaunchEvidenceDecision({
      commands: ["pnpm --filter @inkroute/deployment typecheck"],
      artifacts: ["coverage/deployment-launch-package-typecheck.txt"],
      evidence: {
        deploymentTypecheckPassed: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("pnpm deploy:verify-secrets");
    expect(decision.missingArtifacts).toContain("coverage/deployment-provider-artifact-safety.json");
    expect(decision.missingEvidence).toContain("productionApprovalGateVerified");
    expect(decision.missingEvidence).toContain("providerArtifactsSecretSafe");
    expect(decision.blockers).toContain("Production deployment must be protected by verified approval gates.");
    expect(decision.blockers).toContain(
      "Provider artifacts must be redacted and free of secrets, tokens, raw PII, medical, or payment data.",
    );
  });

  it("completes deployment launch evidence only when every command, artifact, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(deploymentLaunchEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildDeploymentLaunchEvidenceDecision({
      commands: deploymentLaunchEvidenceRuntimeCommands,
      artifacts: deploymentLaunchEvidenceArtifactPaths,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(deploymentLaunchEvidenceFlags);
  });

  it("keeps deployment launch evidence execution classified, redacted, and provider-gated", () => {
    const executionPlan = buildDeploymentLaunchEvidenceExecutionPlan();
    expect(executionPlan.localCommands).toBe(deploymentLaunchEvidenceLocalCommands);
    expect(executionPlan.localCommands).toEqual([
      "pnpm --filter @inkroute/deployment typecheck",
      "pnpm --filter @inkroute/deployment test",
    ]);
    expect(executionPlan.externalCommands).toBe(deploymentLaunchEvidenceExternalCommands);
    expect(executionPlan.localArtifacts).toBe(deploymentLaunchEvidenceLocalArtifacts);
    expect(executionPlan.externalArtifacts).toBe(deploymentLaunchEvidenceExternalArtifacts);
    expect(executionPlan.externalCommands).toContain("Vercel preview deployment smoke");
    expect(executionPlan.externalCommands).toContain("Sentry release/source-map upload proof");
    expect(executionPlan.localArtifacts).toContain("coverage/deployment-launch-package-test.txt");
    expect(executionPlan.externalArtifacts).toContain("coverage/deployment-provider-envs-redacted.json");
    expect(executionPlan.externalArtifacts).toContain("test-results/deployment-launch-evidence-runtime");
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.providerExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.mobileProviderExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.productionExecutionAllowed).toBe(false);
    expect(executionPlan.surfaceContract).toBe(deploymentLaunchEvidenceSurfaceContract);
    expect(executionPlan.surfaceContract).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          surfaceId: "provider-projects-and-preview",
          requiredCommand: "pnpm deploy:verify-provider-envs",
          requiredArtifact: "coverage/deployment-provider-envs-redacted.json",
          launchBoundary: "provider-env",
          providerBackedEvidenceRequired: true,
          redactedArtifactRequired: true,
        }),
        expect.objectContaining({
          surfaceId: "protected-approval-proof",
          requiredCommand: "GitHub protected environment approval proof",
          requiredArtifact: "coverage/deployment-github-environment-approval-redacted.json",
          launchBoundary: "production-approval",
          providerBackedEvidenceRequired: true,
          redactedArtifactRequired: true,
        }),
        expect.objectContaining({
          surfaceId: "provider-artifact-safety",
          requiredCommand: "pnpm deploy:verify-launch-evidence",
          requiredArtifact: "coverage/deployment-provider-artifact-safety.json",
          launchBoundary: "artifact-safety",
          providerBackedEvidenceRequired: true,
          redactedArtifactRequired: true,
        }),
      ]),
    );
    expect(executionPlan.executionPolicy).toBe(deploymentLaunchEvidenceExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticDeploymentLaunchReadiness: true,
      providerEvidenceRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      productionDryRunEvidenceRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(deploymentLaunchEvidenceRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Provider-backed DeploymentLaunchEvidenceRun persistence row captured through persistDeploymentLaunchEvidenceRun.",
    );

    const artifact = {
      vercelProjectId: "prj_abcdefghijklmnopqrstuvwxyz123456",
      githubToken: "github_pat_abcdefghijklmnopqrstuvwxyz123456",
      sentryDsn: "https://public:secret@sentry.example.com/123",
      deploymentUrl: "https://inkroute-preview.example.com",
      protectedEnvironmentApproval: "approved by ops@example.com for production run_123",
      providerEnvVerifierOutput: "Vercel env check printed prj_abcdefghijklmnopqrstuvwxyz123456",
      databaseMigrationDryRunOutput: "postgres://inkroute:secret@db.example.com:5432/inkroute migration dry run",
      backupRestoreTranscript: "restore drill read backup_bucket_123",
      sentryReleaseUploadLog: "sentry upload source-map https://sentry.example.com/releases/release_123",
      rollbackDrillPacketPath: "coverage/deployment-rollback/raw-drill-packet.json",
      neutralRepositoryTrace:
        "repository_private_01HZYXZYXZYXZYXZYXZYXZYXZ branch_private_01HZYXZYXZYXZYXZYXZYXZYXZ pr_private_01HZYXZYXZYXZYXZYXZYXZYXZ reviewer_private_01HZYXZYXZYXZYXZYXZYXZYXZ codeowner_private_01HZYXZYXZYXZYXZYXZYXZYXZ",
      stackTrace: "Error: deployment launch evidence leaked provider payload",
      nested: {
        databaseUrl: "postgres://inkroute:secret@db.example.com:5432/inkroute",
        easProjectId: "eas_project_1234567890abcdefghijklmnopqrstuvwxyz",
        publicSummary: "deployment launch evidence captured",
      },
    };
    const redactedOnly = buildRedactedDeploymentLaunchEvidenceArtifact(artifact);
    const review = buildDeploymentLaunchEvidenceArtifactReview(artifact);
    const serialized = JSON.stringify(review.artifact);

    expect(JSON.stringify(redactedOnly)).not.toContain("github_pat_abcdefghijklmnopqrstuvwxyz123456");
    expect(serialized).not.toContain("prj_abcdefghijklmnopqrstuvwxyz123456");
    expect(serialized).not.toContain("https://public:secret@sentry.example.com/123");
    expect(serialized).not.toContain("https://inkroute-preview.example.com");
    expect(serialized).not.toContain("postgres://inkroute:secret@db.example.com:5432/inkroute");
    expect(serialized).not.toContain("eas_project_1234567890abcdefghijklmnopqrstuvwxyz");
    expect(serialized).not.toContain("ops@example.com");
    expect(serialized).not.toContain("production run_123");
    expect(serialized).not.toContain("backup_bucket_123");
    expect(serialized).not.toContain("sentry upload source-map");
    expect(serialized).not.toContain("raw-drill-packet.json");
    expect(serialized).not.toContain("repository_private_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("branch_private_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("pr_private_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("reviewer_private_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("codeowner_private_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("provider payload");
    expect(review.redactions).toEqual([
      "vercelProjectId",
      "githubToken",
      "sentryDsn",
      "deploymentUrl",
      "protectedEnvironmentApproval",
      "providerEnvVerifierOutput",
      "databaseMigrationDryRunOutput",
      "backupRestoreTranscript",
      "sentryReleaseUploadLog",
      "rollbackDrillPacketPath",
      "neutralRepositoryTrace",
      "stackTrace",
      "nested.databaseUrl",
      "nested.easProjectId",
    ]);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(deploymentLaunchEvidenceRequiredExternalEvidence);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming deployment launch readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 15 deployment launch evidence runtime contracts");
    expect(ciWorkflow).toContain("deployment-launch-evidence-runtime-static.test.ts");
    expect(ciWorkflow).toContain("deployment-launch-evidence-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/deployment-launch-evidence-runtime.json");
    expect(unitManifest).toContain("unit-web-deployment-launch-evidence-runtime-static");
    expect(unitManifest).toContain("DeploymentLaunchEvidenceRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/deploymentLaunchEvidenceRuntime.ts");
    expect(gapTracker).toContain("persistDeploymentLaunchEvidenceRun upsert seam");
    expect(gapTracker).toContain("live Vercel/GitHub environment setup, secret-backed provider evidence, preview/prod dry runs, database/storage operations, EAS/native credentials/OTA rollback, CI deployment gate, Sentry release upload, rollback drill, launch evidence packet, provider-backed persistDeploymentLaunchEvidenceRun execution, and secret-safe provider artifact proof remain open");
    expect(gapTracker).toContain("GAP-014 is deployment-launch-evidence-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("proof inventory");
    expect(gapTracker).toContain("buildDeploymentLaunchEvidenceExecutionPlan");
    expect(gapTracker).toContain("deploymentLaunchEvidenceLocalCommands/deploymentLaunchEvidenceExternalCommands");
    expect(gapTracker).toContain("deploymentLaunchEvidenceExecutionPolicy");
    expect(gapTracker).toContain("deploymentLaunchEvidenceRequiredExternalEvidence");
    expect(gapTracker).toContain("deploymentLaunchEvidenceSurfaceContract");
    expect(gapTracker).toContain("buildRedactedDeploymentLaunchEvidenceArtifact");
    expect(gapTracker).toContain("buildDeploymentLaunchEvidenceArtifactReview");
    expect(gapTracker).toContain("Deployment launch evidence identity assertions pin exported local/external commands, artifacts, required external evidence, policy, surface contract, and readiness evidence helpers");
  });

  it("pins current deployment launch evidence proof files for GAP-014", () => {
    expect(deploymentLaunchEvidenceRuntimeProofFiles).toContain("packages/deployment/package.json");
    expect(deploymentLaunchEvidenceRuntimeProofFiles).toContain("apps/dashboard/app/deployment/page.tsx");
    expect(deploymentLaunchEvidenceRuntimeProofFiles).toContain("apps/dashboard/components/DeploymentReadinessActionPanel.tsx");
    expect(deploymentLaunchEvidenceRuntimeProofFiles).toContain("apps/web/lib/deploymentLaunchEvidenceRuntime.ts");
    expect(deploymentLaunchEvidenceRuntimeProofFiles).toContain("apps/web/tests/deployment-launch-evidence-runtime-static.test.ts");
    for (const proofFile of deploymentLaunchEvidenceRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});


