import { buildDeploymentLaunchEvidencePlan } from "@inkroute/deployment";

export type DeploymentLaunchEvidenceRuntimeStatus =
  | "wired"
  | "provider-gated"
  | "environment-gated"
  | "database-gated"
  | "mobile-gated"
  | "rollback-gated"
  | "ci-gated";

export interface DeploymentLaunchEvidenceRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DeploymentLaunchEvidenceRuntimeStatus;
}


export interface DeploymentLaunchEvidenceRunPersistenceContract {
  readonly prismaModel: "DeploymentLaunchEvidenceRun";
  readonly tenantRelation: "deploymentLaunchEvidenceRuns";
  readonly migration: "20260609033800_add_deployment_launch_evidence_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesReadinessStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesProviderGateEvidence: true;
  readonly storesEnvironmentGateEvidence: true;
  readonly storesDatabaseGateEvidence: true;
  readonly storesMobileGateEvidence: true;
  readonly storesCiGateEvidence: true;
  readonly storesRollbackGateEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export const deploymentLaunchEvidenceRunPersistenceContract = {
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
} as const satisfies DeploymentLaunchEvidenceRunPersistenceContract;

export const deploymentLaunchEvidenceRuntimeCommands = [
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
] as const;

export const deploymentLaunchEvidenceArtifactPaths = [
  "coverage/deployment-launch-evidence-runtime.json",
  "coverage/deployment-launch-package-typecheck.txt",
  "coverage/deployment-launch-package-test.txt",
  "coverage/deployment-provider-envs-redacted.json",
  "coverage/deployment-secrets-redacted.json",
  "coverage/deployment-vercel-projects-redacted.json",
  "coverage/deployment-preview-smoke-redacted.json",
  "coverage/deployment-production-dry-run-redacted.json",
  "coverage/deployment-github-environment-approval-redacted.json",
  "coverage/deployment-strict-env-check-redacted.json",
  "coverage/deployment-database-migration-dry-run-redacted.json",
  "coverage/deployment-backup-restore-drill-redacted.json",
  "coverage/deployment-storage-provider-redacted.json",
  "coverage/deployment-eas-project-redacted.json",
  "coverage/deployment-eas-preview-build-redacted.json",
  "coverage/deployment-native-credentials-redacted.json",
  "coverage/deployment-ota-rollback-redacted.json",
  "coverage/deployment-ci-gate-redacted.json",
  "coverage/deployment-sentry-release-upload-redacted.json",
  "coverage/deployment-rollback-drill-redacted.json",
  "coverage/deployment-launch-evidence-packet-redacted.json",
  "coverage/deployment-provider-artifact-safety.json",
  "test-results/deployment-launch-evidence-runtime",
] as const;

export const deploymentLaunchEvidenceRuntimeMatrix = [
  {
    id: "deployment-package-gates",
    command: "pnpm --filter @inkroute/deployment typecheck && pnpm --filter @inkroute/deployment test",
    artifact: "coverage/deployment-launch-package-test.txt",
    status: "wired",
  },
  {
    id: "provider-projects-and-preview",
    command: "pnpm deploy:verify-provider-envs && Vercel preview deployment smoke",
    artifact: "coverage/deployment-preview-smoke-redacted.json",
    status: "provider-gated",
  },
  {
    id: "protected-environments-secrets-approval",
    command: "pnpm deploy:verify-secrets && GitHub protected environment approval proof",
    artifact: "coverage/deployment-github-environment-approval-redacted.json",
    status: "environment-gated",
  },
  {
    id: "production-dry-run-strict-env",
    command: "production deployment dry run && strict environment verification",
    artifact: "coverage/deployment-production-dry-run-redacted.json",
    status: "environment-gated",
  },
  {
    id: "database-storage-operations",
    command: "pnpm deploy:verify-database-ops && backup/restore drill && storage provider verification",
    artifact: "coverage/deployment-database-migration-dry-run-redacted.json",
    status: "database-gated",
  },
  {
    id: "mobile-eas-preview-native-ota",
    command: "pnpm deploy:verify-mobile && EAS preview build && mobile OTA rollback test",
    artifact: "coverage/deployment-eas-preview-build-redacted.json",
    status: "mobile-gated",
  },
  {
    id: "ci-sentry-release-upload",
    command: "CI deployment gate and Sentry release/source-map upload proof",
    artifact: "coverage/deployment-sentry-release-upload-redacted.json",
    status: "ci-gated",
  },
  {
    id: "rollback-launch-packet-artifact-safety",
    command: "deployment rollback drill && pnpm deploy:verify-launch-evidence",
    artifact: "coverage/deployment-launch-evidence-packet-redacted.json",
    status: "rollback-gated",
  },
] as const satisfies readonly DeploymentLaunchEvidenceRuntimeMatrixEntry[];

export const deploymentLaunchEvidenceRuntimeReadiness = buildDeploymentLaunchEvidencePlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  deploymentTestsPassed: false,
  deploymentTypecheckPassed: false,
  vercelProjectsConfigured: false,
  githubEnvironmentsConfigured: false,
  secretsConfiguredAndRedacted: false,
  previewDeploymentPassed: false,
  productionDryRunPassed: false,
  productionApprovalGateVerified: false,
  strictEnvironmentCheckPassed: false,
  databaseMigrationDryRunPassed: false,
  backupRestoreDrillPassed: false,
  storageProviderConfigured: false,
  easProjectConfigured: false,
  easPreviewBuildPassed: false,
  nativeCredentialsConfigured: false,
  otaRollbackTestPassed: false,
  ciDeploymentGatePassed: false,
  sentryReleaseUploadVerified: false,
  deploymentRollbackTestPassed: false,
  launchEvidencePacketCaptured: false,
  providerArtifactsSecretSafe: false,
});
