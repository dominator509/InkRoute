import {
  buildDeploymentLaunchEvidencePlan,
  deploymentLaunchEvidenceRequiredCommands,
} from "@inkroute/deployment";

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

export interface DeploymentLaunchEvidenceRunRecordInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: DeploymentLaunchEvidenceDecision["status"];
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly providerGateEvidenceCaptured: boolean;
  readonly environmentGateEvidenceCaptured: boolean;
  readonly databaseGateEvidenceCaptured: boolean;
  readonly mobileGateEvidenceCaptured: boolean;
  readonly ciGateEvidenceCaptured: boolean;
  readonly rollbackGateEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly evidencePacketPath?: string | null;
  readonly providerArtifactSafetyPath?: string | null;
}

export interface DeploymentLaunchEvidenceRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: DeploymentLaunchEvidenceDecision["status"];
  readonly commandMatrix: readonly string[];
  readonly artifactManifest: readonly string[];
  readonly providerGateEvidenceCaptured: boolean;
  readonly environmentGateEvidenceCaptured: boolean;
  readonly databaseGateEvidenceCaptured: boolean;
  readonly mobileGateEvidenceCaptured: boolean;
  readonly ciGateEvidenceCaptured: boolean;
  readonly rollbackGateEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly evidencePacketPath: string | null;
  readonly providerArtifactSafetyPath: string | null;
}

export interface DeploymentLaunchEvidenceRunRepository {
  readonly deploymentLaunchEvidenceRun: {
    readonly upsert: (args: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: DeploymentLaunchEvidenceRunData;
      readonly update: Omit<DeploymentLaunchEvidenceRunData, "tenantId" | "runId">;
    }) => Promise<unknown>;
  };
}

export function buildDeploymentLaunchEvidenceRunData(
  input: DeploymentLaunchEvidenceRunRecordInput,
): DeploymentLaunchEvidenceRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha,
    status: input.status,
    commandMatrix: input.commands ?? deploymentLaunchEvidenceRuntimeCommands,
    artifactManifest: input.artifacts ?? deploymentLaunchEvidenceArtifactPaths,
    providerGateEvidenceCaptured: input.providerGateEvidenceCaptured,
    environmentGateEvidenceCaptured: input.environmentGateEvidenceCaptured,
    databaseGateEvidenceCaptured: input.databaseGateEvidenceCaptured,
    mobileGateEvidenceCaptured: input.mobileGateEvidenceCaptured,
    ciGateEvidenceCaptured: input.ciGateEvidenceCaptured,
    rollbackGateEvidenceCaptured: input.rollbackGateEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    evidencePacketPath: input.evidencePacketPath ?? null,
    providerArtifactSafetyPath: input.providerArtifactSafetyPath ?? null,
  };
}

export async function persistDeploymentLaunchEvidenceRun(
  repository: DeploymentLaunchEvidenceRunRepository,
  input: DeploymentLaunchEvidenceRunRecordInput,
): Promise<unknown> {
  const data = buildDeploymentLaunchEvidenceRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.deploymentLaunchEvidenceRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

export const deploymentLaunchEvidenceRuntimeCommands = deploymentLaunchEvidenceRequiredCommands;

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

export const deploymentLaunchEvidenceRuntimeProofFiles = [
  "packages/deployment/package.json",
  "packages/deployment/src/index.ts",
  "packages/deployment/tests/deployment-readiness.test.ts",
  "apps/dashboard/app/deployment/page.tsx",
  "apps/dashboard/components/DeploymentReadinessActionPanel.tsx",
  "apps/dashboard/app/api/deployment/readiness/route.ts",
  "apps/dashboard/tests/deployment-readiness-route-static.test.ts",
  "DEPLOYMENT.md",
  ".github/workflows/release-governance.yml",
  "apps/web/lib/deploymentLaunchEvidenceRuntime.ts",
  "apps/web/tests/deployment-launch-evidence-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609033800_add_deployment_launch_evidence_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
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

export const deploymentLaunchEvidenceFlags = [
  "deploymentTestsPassed",
  "deploymentTypecheckPassed",
  "vercelProjectsConfigured",
  "githubEnvironmentsConfigured",
  "secretsConfiguredAndRedacted",
  "previewDeploymentPassed",
  "productionDryRunPassed",
  "productionApprovalGateVerified",
  "strictEnvironmentCheckPassed",
  "databaseMigrationDryRunPassed",
  "backupRestoreDrillPassed",
  "storageProviderConfigured",
  "easProjectConfigured",
  "easPreviewBuildPassed",
  "nativeCredentialsConfigured",
  "otaRollbackTestPassed",
  "ciDeploymentGatePassed",
  "sentryReleaseUploadVerified",
  "deploymentRollbackTestPassed",
  "launchEvidencePacketCaptured",
  "providerArtifactsSecretSafe",
] as const;

export type DeploymentLaunchEvidenceFlag = (typeof deploymentLaunchEvidenceFlags)[number];

export interface DeploymentLaunchEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly evidence?: Partial<Record<DeploymentLaunchEvidenceFlag, boolean>>;
}

export interface DeploymentLaunchEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingEvidence: readonly DeploymentLaunchEvidenceFlag[];
  readonly requiredCommands: typeof deploymentLaunchEvidenceRuntimeCommands;
  readonly requiredArtifacts: typeof deploymentLaunchEvidenceArtifactPaths;
  readonly requiredEvidence: typeof deploymentLaunchEvidenceFlags;
  readonly blockers: readonly string[];
}

export interface DeploymentLaunchEvidenceExecutionPlan {
  readonly localCommands: typeof deploymentLaunchEvidenceLocalCommands;
  readonly externalCommands: typeof deploymentLaunchEvidenceExternalCommands;
  readonly localArtifacts: typeof deploymentLaunchEvidenceLocalArtifacts;
  readonly externalArtifacts: typeof deploymentLaunchEvidenceExternalArtifacts;
  readonly surfaceContract: typeof deploymentLaunchEvidenceSurfaceContract;
  readonly commandExecutionAllowed: false;
  readonly providerExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly mobileProviderExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly productionExecutionAllowed: false;
  readonly executionPolicy: typeof deploymentLaunchEvidenceExecutionPolicy;
  readonly requiredExternalEvidence: typeof deploymentLaunchEvidenceRequiredExternalEvidence;
}

export interface DeploymentLaunchEvidenceArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof deploymentLaunchEvidenceRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export interface DeploymentLaunchEvidenceSurfaceContractEntry {
  readonly surfaceId: string;
  readonly requiredCommand: (typeof deploymentLaunchEvidenceRuntimeCommands)[number];
  readonly requiredArtifact: (typeof deploymentLaunchEvidenceArtifactPaths)[number];
  readonly launchBoundary:
    | "local-package"
    | "provider-env"
    | "secret-destination"
    | "database-storage"
    | "mobile-eas"
    | "production-approval"
    | "ci-release"
    | "rollback"
    | "artifact-safety";
  readonly providerBackedEvidenceRequired: boolean;
  readonly redactedArtifactRequired: true;
}

export const deploymentLaunchEvidenceSurfaceContract: readonly DeploymentLaunchEvidenceSurfaceContractEntry[] = [
  {
    surfaceId: "deployment-package-gates",
    requiredCommand: "pnpm --filter @inkroute/deployment typecheck",
    requiredArtifact: "coverage/deployment-launch-package-typecheck.txt",
    launchBoundary: "local-package",
    providerBackedEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "provider-projects-and-preview",
    requiredCommand: "pnpm deploy:verify-provider-envs",
    requiredArtifact: "coverage/deployment-provider-envs-redacted.json",
    launchBoundary: "provider-env",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "protected-environments-secrets-approval",
    requiredCommand: "pnpm deploy:verify-secrets",
    requiredArtifact: "coverage/deployment-secrets-redacted.json",
    launchBoundary: "secret-destination",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "production-dry-run-strict-env",
    requiredCommand: "production deployment dry run",
    requiredArtifact: "coverage/deployment-production-dry-run-redacted.json",
    launchBoundary: "production-approval",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "database-storage-operations",
    requiredCommand: "pnpm deploy:verify-database-ops",
    requiredArtifact: "coverage/deployment-database-migration-dry-run-redacted.json",
    launchBoundary: "database-storage",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "mobile-eas-preview-native-ota",
    requiredCommand: "pnpm deploy:verify-mobile",
    requiredArtifact: "coverage/deployment-eas-preview-build-redacted.json",
    launchBoundary: "mobile-eas",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "ci-sentry-release-upload",
    requiredCommand: "Sentry release/source-map upload proof",
    requiredArtifact: "coverage/deployment-sentry-release-upload-redacted.json",
    launchBoundary: "ci-release",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "rollback-launch-packet",
    requiredCommand: "deployment rollback drill",
    requiredArtifact: "coverage/deployment-rollback-drill-redacted.json",
    launchBoundary: "rollback",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "protected-approval-proof",
    requiredCommand: "GitHub protected environment approval proof",
    requiredArtifact: "coverage/deployment-github-environment-approval-redacted.json",
    launchBoundary: "production-approval",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "provider-artifact-safety",
    requiredCommand: "pnpm deploy:verify-launch-evidence",
    requiredArtifact: "coverage/deployment-provider-artifact-safety.json",
    launchBoundary: "artifact-safety",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
] as const;

const sensitiveDeploymentLaunchEvidenceKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|name|address|vercel|github|eas|expo|sentry|supabase|neon|postgres|database|storage|provider|tenant|user|client|project|team|org|environment|deployment|preview|production|approval|protected|workflow|run|ci|commit|repository|branch|pr|pullrequest|reviewer|codeowner|migration|backup|restore|strict|env|native|credential|ota|rollback|launch|evidence|packet|smoke|source.?map|release|upload|url|uri|dsn|key|id|payload|artifact|path|raw|request|response|log|output|transcript|stack|error)/iu;
const sensitiveDeploymentLaunchEvidenceValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|(?:repository|branch|pr|pullrequest|reviewer|codeowner|workflow|ci|commit|run|deployment|approval|provider|project|artifact)[-_:/]?[A-Za-z0-9_.-]{6,}|[A-Za-z0-9_-]{24,})/giu;

export const deploymentLaunchEvidenceExecutionPolicy = {
  codexMayClassifyStaticDeploymentLaunchReadiness: true,
  providerEvidenceRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  productionDryRunEvidenceRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const;

export const deploymentLaunchEvidenceRequiredExternalEvidence = [
  "Vercel web/dashboard project configuration and preview deployment smoke evidence.",
  "GitHub preview, staging, and production environment configuration with protected approval proof.",
  "Secret-backed provider evidence represented only by redacted artifact labels.",
  "Managed database migration dry run, backup/restore drill, and storage provider evidence.",
  "EAS project, native credential, preview build, and OTA rollback evidence.",
  "CI deployment gate and Sentry release/source-map upload proof.",
  "Deployment rollback drill and launch evidence packet.",
  "Provider-backed DeploymentLaunchEvidenceRun persistence row captured through persistDeploymentLaunchEvidenceRun.",
  "Secret-safe provider artifact proof free of secrets, tokens, raw PII, medical data, and payment data.",
] as const;

export const deploymentLaunchEvidenceLocalCommands = [
  "pnpm --filter @inkroute/deployment typecheck",
  "pnpm --filter @inkroute/deployment test",
] as const;

export const deploymentLaunchEvidenceExternalCommands = [
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

export const deploymentLaunchEvidenceLocalArtifacts = [
  "coverage/deployment-launch-evidence-runtime.json",
  "coverage/deployment-launch-package-typecheck.txt",
  "coverage/deployment-launch-package-test.txt",
] as const;

export const deploymentLaunchEvidenceExternalArtifacts = [
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

const buildRedactedDeploymentLaunchEvidenceValue = (value: unknown, path: string, redactions: string[]): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => buildRedactedDeploymentLaunchEvidenceValue(entry, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveDeploymentLaunchEvidenceKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedDeploymentLaunchEvidenceValue(entry, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redacted = value.replace(sensitiveDeploymentLaunchEvidenceValuePattern, "[REDACTED]");
    if (redacted !== value) {
      redactions.push(path || "$");
    }
    return redacted;
  }

  return value;
};

export function buildDeploymentLaunchEvidenceExecutionPlan(): DeploymentLaunchEvidenceExecutionPlan {
  return {
    localCommands: deploymentLaunchEvidenceLocalCommands,
    externalCommands: deploymentLaunchEvidenceExternalCommands,
    localArtifacts: deploymentLaunchEvidenceLocalArtifacts,
    externalArtifacts: deploymentLaunchEvidenceExternalArtifacts,
    surfaceContract: deploymentLaunchEvidenceSurfaceContract,
    commandExecutionAllowed: false,
    providerExecutionAllowed: false,
    databaseExecutionAllowed: false,
    mobileProviderExecutionAllowed: false,
    ciExecutionAllowed: false,
    productionExecutionAllowed: false,
    executionPolicy: deploymentLaunchEvidenceExecutionPolicy,
    requiredExternalEvidence: deploymentLaunchEvidenceRequiredExternalEvidence,
  };
}

export function buildRedactedDeploymentLaunchEvidenceArtifact(artifact: unknown): unknown {
  return buildRedactedDeploymentLaunchEvidenceValue(artifact, "", []);
}

export function buildDeploymentLaunchEvidenceArtifactReview(
  artifact: unknown,
): DeploymentLaunchEvidenceArtifactReview {
  const redactions: string[] = [];
  return {
    artifact: buildRedactedDeploymentLaunchEvidenceValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: deploymentLaunchEvidenceRequiredExternalEvidence,
    safeForTracker: true,
  };
}

const deploymentLaunchEvidenceBlockers: Record<DeploymentLaunchEvidenceFlag, string> = {
  deploymentTestsPassed: "Deployment package tests must pass.",
  deploymentTypecheckPassed: "Deployment package typecheck must pass.",
  vercelProjectsConfigured: "Vercel web and dashboard projects must be configured with redacted project evidence.",
  githubEnvironmentsConfigured: "GitHub preview, staging, and production environments must be configured.",
  secretsConfiguredAndRedacted: "Provider secrets must be configured and represented only by redacted evidence.",
  previewDeploymentPassed: "Vercel preview deployment smoke must pass.",
  productionDryRunPassed: "Production deployment dry run must pass.",
  productionApprovalGateVerified: "Production deployment must be protected by verified approval gates.",
  strictEnvironmentCheckPassed: "Strict environment verification must pass.",
  databaseMigrationDryRunPassed: "Database migration dry run must pass.",
  backupRestoreDrillPassed: "Backup/restore drill must pass.",
  storageProviderConfigured: "Storage provider verification must pass.",
  easProjectConfigured: "EAS project configuration evidence is required.",
  easPreviewBuildPassed: "EAS preview build must pass.",
  nativeCredentialsConfigured: "Native credential configuration evidence is required.",
  otaRollbackTestPassed: "Mobile OTA rollback test must pass.",
  ciDeploymentGatePassed: "CI deployment gate must pass.",
  sentryReleaseUploadVerified: "Sentry release and source-map upload proof is required.",
  deploymentRollbackTestPassed: "Deployment rollback drill must pass.",
  launchEvidencePacketCaptured: "Launch evidence packet must be captured.",
  providerArtifactsSecretSafe: "Provider artifacts must be redacted and free of secrets, tokens, raw PII, medical, or payment data.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export const buildDeploymentLaunchEvidenceDecision = (
  input: DeploymentLaunchEvidenceInput,
): DeploymentLaunchEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, deploymentLaunchEvidenceRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, deploymentLaunchEvidenceArtifactPaths);
  const missingEvidence = deploymentLaunchEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => deploymentLaunchEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 && missingArtifacts.length === 0 && missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingEvidence,
    requiredCommands: deploymentLaunchEvidenceRuntimeCommands,
    requiredArtifacts: deploymentLaunchEvidenceArtifactPaths,
    requiredEvidence: deploymentLaunchEvidenceFlags,
    blockers,
  };
};

export const deploymentLaunchEvidenceRuntimeReadiness = {
  ...buildDeploymentLaunchEvidencePlan({
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
  }),
  requiredEvidence: deploymentLaunchEvidenceFlags,
} as const;



