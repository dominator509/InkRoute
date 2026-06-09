import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  deploymentLaunchEvidenceArtifactPaths,
  deploymentLaunchEvidenceRuntimeCommands,
  deploymentLaunchEvidenceRuntimeMatrix,
  deploymentLaunchEvidenceRuntimeReadiness,
  deploymentLaunchEvidenceRunPersistenceContract,
} from "../lib/deploymentLaunchEvidenceRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("deployment launch evidence runtime contract", () => {
  const deploymentPackageJson = readRepoFile("packages/deployment/package.json");
  const deploymentSource = readRepoFile("packages/deployment/src/index.ts");
  const deploymentTests = readRepoFile("packages/deployment/tests/deployment-readiness.test.ts");
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
    expect(dashboardReadinessRoute).toContain("AuditLog");
    expect(dashboardReadinessTest).toContain("secret-name-only redaction metadata");
    expect(deploymentDocs).toContain("Deployment");
    expect(releaseGovernanceWorkflow).toContain("workflow_dispatch");
  });

  it("keeps deployment launch evidence blocked until provider, environment, mobile, rollback, Sentry, CI, and safe artifacts exist", () => {
    expect(deploymentLaunchEvidenceRuntimeReadiness.status).toBe("blocked");
    expect(deploymentLaunchEvidenceRuntimeReadiness.missingScripts).toEqual([]);
    expect(deploymentLaunchEvidenceRuntimeReadiness.requiredCommands).toEqual([...deploymentLaunchEvidenceRuntimeCommands]);
    expect(deploymentLaunchEvidenceRuntimeReadiness.requiredEvidence).toEqual([
      "Vercel web/dashboard project, preview deployment, and production dry-run evidence",
      "GitHub protected environment, approval gate, and CI deployment gate evidence",
      "strict environment, secret redaction, and provider artifact safety evidence",
      "managed database migration dry-run, backup/restore, and storage provider evidence",
      "EAS project, preview build, native credential, and OTA rollback evidence",
      "Sentry release upload, rollback test, and launch evidence packet",
    ]);
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
    expect(prismaSchema).toContain("model DeploymentLaunchEvidenceRun");
    expect(prismaSchema).toContain("deploymentLaunchEvidenceRuns DeploymentLaunchEvidenceRun[]");
    expect(prismaSchema).toContain("providerGateEvidenceCaptured");
    expect(prismaSchema).toContain("secretSafeArtifactsCaptured");
    expect(deploymentLaunchEvidenceRunMigration).toContain('CREATE TABLE "DeploymentLaunchEvidenceRun"');
    expect(deploymentLaunchEvidenceRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(deploymentLaunchEvidenceRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(deploymentLaunchEvidenceRunMigration).toContain('"DeploymentLaunchEvidenceRun_tenantId_runId_key"');
  });

  it("wires CI, manifest, tracker, and artifacts without claiming deployment launch readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 15 deployment launch evidence runtime contracts");
    expect(ciWorkflow).toContain("deployment-launch-evidence-runtime-static.test.ts");
    expect(ciWorkflow).toContain("deployment-launch-evidence-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/deployment-launch-evidence-runtime.json");
    expect(unitManifest).toContain("unit-web-deployment-launch-evidence-runtime-static");
    expect(unitManifest).toContain("DeploymentLaunchEvidenceRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/deploymentLaunchEvidenceRuntime.ts");
    expect(gapTracker).toContain("DeploymentLaunchEvidenceRun Prisma model and app row contract");
    expect(gapTracker).toContain("live Vercel/GitHub environment setup, secret-backed provider evidence, preview/prod dry runs, database/storage operations, EAS/native credentials/OTA rollback, CI deployment gate, Sentry release upload, rollback drill, launch evidence packet, and secret-safe provider artifact proof remain open");
  });
});
