import { buildReleaseLaunchControlEvidencePlan } from "@inkroute/releases";

export type ReleaseLaunchControlRuntimeStatus =
  | "wired"
  | "persistence-gated"
  | "governance-gated"
  | "migration-gated"
  | "rollback-gated"
  | "mobile-gated"
  | "ci-gated";

export interface ReleaseLaunchControlRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: ReleaseLaunchControlRuntimeStatus;
}


export interface ReleaseLaunchControlRunPersistenceContract {
  readonly prismaModel: "ReleaseLaunchControlRun";
  readonly tenantRelation: "releaseLaunchControlRuns";
  readonly migration: "20260609033900_add_release_launch_control_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesReadinessStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesPersistenceEvidence: true;
  readonly storesGovernanceEvidence: true;
  readonly storesMigrationGateEvidence: true;
  readonly storesRollbackEvidence: true;
  readonly storesMobileGovernanceEvidence: true;
  readonly storesCiArtifactEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export interface ReleaseLaunchControlRunRecordInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: "complete" | "blocked" | "partial";
  readonly commandMatrix?: readonly ReleaseLaunchControlRuntimeMatrixEntry[];
  readonly artifactManifest?: readonly string[];
  readonly evidence?: Partial<Record<ReleaseLaunchControlEvidenceFlag, boolean>>;
  readonly releaseHealthEnvelopePath?: string | null;
  readonly rollbackDrillArtifactPath?: string | null;
}

export interface ReleaseLaunchControlRunRepository {
  readonly releaseLaunchControlRun: {
    upsert(input: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: ReleaseLaunchControlRunData;
      readonly update: Omit<ReleaseLaunchControlRunData, "tenantId" | "runId">;
    }): Promise<unknown>;
  };
}

export interface ReleaseLaunchControlRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: string;
  readonly commandMatrix: readonly ReleaseLaunchControlRuntimeMatrixEntry[];
  readonly artifactManifest: readonly string[];
  readonly persistenceEvidenceCaptured: boolean;
  readonly governanceEvidenceCaptured: boolean;
  readonly migrationGateEvidenceCaptured: boolean;
  readonly rollbackEvidenceCaptured: boolean;
  readonly mobileGovernanceEvidenceCaptured: boolean;
  readonly ciArtifactEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly releaseHealthEnvelopePath: string | null;
  readonly rollbackDrillArtifactPath: string | null;
}

export const releaseLaunchControlRunPersistenceContract = {
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
} as const satisfies ReleaseLaunchControlRunPersistenceContract;

export const releaseLaunchControlRuntimeCommands = [
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
] as const;

export const releaseLaunchControlArtifactPaths = [
  "coverage/release-launch-control-runtime.json",
  "coverage/release-package-typecheck.txt",
  "coverage/release-package-test.txt",
  "coverage/release-record-persistence-redacted.json",
  "coverage/release-feature-flag-persistence-redacted.json",
  "coverage/release-rbac-tenant-scope-redacted.json",
  "coverage/release-optimistic-concurrency.json",
  "coverage/release-audit-rows-redacted.json",
  "coverage/release-protected-environments-redacted.json",
  "coverage/release-signed-provenance-redacted.json",
  "coverage/release-ci-required-checks-redacted.json",
  "coverage/release-preview-deploy-redacted.json",
  "coverage/release-production-approval-dry-run-redacted.json",
  "coverage/release-migration-gate-dry-run-redacted.json",
  "coverage/release-incident-linked-rollback-redacted.json",
  "coverage/release-eas-update-governance-redacted.json",
  "coverage/release-rollout-controls-redacted.json",
  "coverage/release-kill-switch-drill-redacted.json",
  "coverage/release-health-envelope.json",
  "coverage/release-provider-route-tests-redacted.json",
  "coverage/release-ci-artifacts-redacted.json",
  "coverage/release-secret-safe-artifacts.json",
  "test-results/release-launch-control-runtime",
] as const;

export const releaseLaunchControlRuntimeProofFiles = [
  "packages/releases/package.json",
  "packages/releases/src/index.ts",
  "packages/releases/tests/feature-flags.test.ts",
  "apps/dashboard/app/api/releases/route.ts",
  "apps/dashboard/app/api/feature-flags/route.ts",
  "apps/dashboard/tests/release-route-static.test.ts",
  "apps/dashboard/tests/feature-flag-route-static.test.ts",
  "apps/web/app/api/public/[tenantSlug]/release-health/route.ts",
  "scripts/releases/write-release-launch-control-evidence.mjs",
  ".github/workflows/release-governance.yml",
  "RELEASE_AND_AUTO_UPDATE_PLAN.md",
  "apps/web/lib/releaseLaunchControlRuntime.ts",
  "apps/web/tests/release-launch-control-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609033900_add_release_launch_control_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export const releaseLaunchControlRuntimeMatrix = [
  {
    id: "release-package-gates",
    command: "pnpm --filter @inkroute/releases typecheck && pnpm --filter @inkroute/releases test",
    artifact: "coverage/release-package-test.txt",
    status: "wired",
  },
  {
    id: "local-evidence-writer",
    command: "pnpm release:launch-control-evidence",
    artifact: "coverage/release-launch-control-runtime.json",
    status: "wired",
  },
  {
    id: "persistence-rbac-concurrency-audit",
    command: "provider-backed release/feature-flag route integration tests",
    artifact: "coverage/release-record-persistence-redacted.json",
    status: "persistence-gated",
  },
  {
    id: "protected-environments-signed-jobs-ci",
    command: "release-governance GitHub Actions workflow execution && signed deployment provenance check",
    artifact: "coverage/release-protected-environments-redacted.json",
    status: "governance-gated",
  },
  {
    id: "preview-production-approval-dry-run",
    command: "protected environment approval dry run",
    artifact: "coverage/release-production-approval-dry-run-redacted.json",
    status: "governance-gated",
  },
  {
    id: "migration-gate-dry-run",
    command: "migration gate dry run",
    artifact: "coverage/release-migration-gate-dry-run-redacted.json",
    status: "migration-gated",
  },
  {
    id: "incident-linked-rollback",
    command: "incident-linked rollback drill",
    artifact: "coverage/release-incident-linked-rollback-redacted.json",
    status: "rollback-gated",
  },
  {
    id: "eas-update-governance",
    command: "EAS update governance drill",
    artifact: "coverage/release-eas-update-governance-redacted.json",
    status: "mobile-gated",
  },
  {
    id: "rollout-kill-switch-health",
    command: "feature-flag kill-switch drill && release-health envelope smoke",
    artifact: "coverage/release-kill-switch-drill-redacted.json",
    status: "rollback-gated",
  },
  {
    id: "ci-secret-safe-artifacts",
    command: "capture release launch CI artifacts and secret-safe evidence",
    artifact: "coverage/release-ci-artifacts-redacted.json",
    status: "ci-gated",
  },
] as const satisfies readonly ReleaseLaunchControlRuntimeMatrixEntry[];

export const releaseLaunchControlEvidenceFlags = [
  "releasesTestsPassed",
  "releasesTypecheckPassed",
  "releaseRecordPersistenceVerified",
  "featureFlagPersistenceVerified",
  "rbacTenantScopeVerified",
  "optimisticConcurrencyVerified",
  "auditRowsPersisted",
  "protectedGithubEnvironmentsConfigured",
  "signedDeploymentJobsConfigured",
  "ciRequiredChecksPassed",
  "previewDeployJobPassed",
  "productionDeployApprovalDryRunPassed",
  "migrationGateDryRunPassed",
  "incidentLinkedRollbackDrillPassed",
  "easUpdateGovernanceVerified",
  "rolloutControlsVerified",
  "killSwitchDrillPassed",
  "releaseHealthEnvelopeVerified",
  "providerBackedRouteTestsPassed",
  "ciArtifactsCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type ReleaseLaunchControlEvidenceFlag = (typeof releaseLaunchControlEvidenceFlags)[number];

export interface ReleaseLaunchControlEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly evidence?: Partial<Record<ReleaseLaunchControlEvidenceFlag, boolean>>;
}

export interface ReleaseLaunchControlEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingEvidence: readonly ReleaseLaunchControlEvidenceFlag[];
  readonly requiredCommands: typeof releaseLaunchControlRuntimeCommands;
  readonly requiredArtifacts: typeof releaseLaunchControlArtifactPaths;
  readonly requiredEvidence: typeof releaseLaunchControlEvidenceFlags;
  readonly blockers: readonly string[];
}

export interface ReleaseLaunchControlExecutionPlan {
  readonly localCommands: typeof releaseLaunchControlLocalCommands;
  readonly externalCommands: typeof releaseLaunchControlExternalCommands;
  readonly localArtifacts: typeof releaseLaunchControlLocalArtifacts;
  readonly externalArtifacts: typeof releaseLaunchControlExternalArtifacts;
  readonly commandExecutionAllowed: false;
  readonly providerExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly productionExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly mobileProviderExecutionAllowed: false;
  readonly executionPolicy: typeof releaseLaunchControlExecutionPolicy;
  readonly requiredExternalEvidence: typeof releaseLaunchControlRequiredExternalEvidence;
}

export interface ReleaseLaunchControlArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof releaseLaunchControlRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export const releaseLaunchControlRequiredExternalEvidence = [
  "Provider-backed ReleaseRecord and FeatureFlag persistence, RBAC, tenant-scope, optimistic concurrency, audit row, and route integration evidence.",
  "Protected GitHub environment configuration and production approval dry-run evidence.",
  "Signed deployment provenance, CI required checks, preview deploy, and release-governance workflow evidence.",
  "Migration gate and incident-linked rollback drill evidence.",
  "EAS update governance evidence for channel, runtime, adoption, and rollback controls.",
  "Provider-backed ReleaseLaunchControlRun persistence row captured through persistReleaseLaunchControlRun.",
  "Live CI artifacts and secret-safe release launch artifact review.",
] as const;

export const releaseLaunchControlLocalCommands = [
  "pnpm --filter @inkroute/releases typecheck",
  "pnpm --filter @inkroute/releases test",
  "pnpm release:launch-control-evidence",
  "tenant rollout controls drill",
  "feature-flag kill-switch drill",
  "release-health envelope smoke",
  "secret-safe release launch artifact review",
] as const;

export const releaseLaunchControlExternalCommands = [
  "provider-backed release/feature-flag route integration tests",
  "release-governance GitHub Actions workflow execution",
  "CI required checks release gate",
  "preview deploy job smoke",
  "protected environment approval dry run",
  "signed deployment provenance check",
  "migration gate dry run",
  "incident-linked rollback drill",
  "EAS update governance drill",
  "capture release launch CI artifacts",
] as const;

export const releaseLaunchControlLocalArtifacts = [
  "coverage/release-launch-control-runtime.json",
  "coverage/release-package-typecheck.txt",
  "coverage/release-package-test.txt",
  "coverage/release-optimistic-concurrency.json",
  "coverage/release-rollout-controls-redacted.json",
  "coverage/release-kill-switch-drill-redacted.json",
  "coverage/release-health-envelope.json",
  "coverage/release-secret-safe-artifacts.json",
] as const;

export const releaseLaunchControlExternalArtifacts = [
  "coverage/release-record-persistence-redacted.json",
  "coverage/release-feature-flag-persistence-redacted.json",
  "coverage/release-rbac-tenant-scope-redacted.json",
  "coverage/release-audit-rows-redacted.json",
  "coverage/release-protected-environments-redacted.json",
  "coverage/release-signed-provenance-redacted.json",
  "coverage/release-ci-required-checks-redacted.json",
  "coverage/release-preview-deploy-redacted.json",
  "coverage/release-production-approval-dry-run-redacted.json",
  "coverage/release-migration-gate-dry-run-redacted.json",
  "coverage/release-incident-linked-rollback-redacted.json",
  "coverage/release-eas-update-governance-redacted.json",
  "coverage/release-provider-route-tests-redacted.json",
  "coverage/release-ci-artifacts-redacted.json",
  "test-results/release-launch-control-runtime",
] as const;

export type ReleaseLaunchControlExecutionPolicy = {
  readonly codexMayClassifyStaticReleaseLaunchReadiness: true;
  readonly providerPersistenceRequiredForClosure: true;
  readonly protectedEnvironmentEvidenceRequiredForClosure: true;
  readonly providerDatabaseRequiredForPersistence: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
};

export const releaseLaunchControlExecutionPolicy: ReleaseLaunchControlExecutionPolicy = {
  codexMayClassifyStaticReleaseLaunchReadiness: true,
  providerPersistenceRequiredForClosure: true,
  protectedEnvironmentEvidenceRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
};

const sensitiveReleaseLaunchControlKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|name|address|github|vercel|eas|expo|sentry|release|feature|flag|tenant|user|client|database|provider|deployment|provenance|environment|url|uri|dsn|key|id|payload|artifact)/iu;
const sensitiveReleaseLaunchControlValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|[A-Za-z0-9_-]{24,})/giu;

const buildRedactedReleaseLaunchControlValue = (value: unknown, path: string, redactions: string[]): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => buildRedactedReleaseLaunchControlValue(entry, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveReleaseLaunchControlKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedReleaseLaunchControlValue(entry, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redacted = value.replace(sensitiveReleaseLaunchControlValuePattern, "[REDACTED]");
    if (redacted !== value) {
      redactions.push(path || "$");
    }
    return redacted;
  }

  return value;
};

export function buildReleaseLaunchControlExecutionPlan(): ReleaseLaunchControlExecutionPlan {
  return {
    localCommands: releaseLaunchControlLocalCommands,
    externalCommands: releaseLaunchControlExternalCommands,
    localArtifacts: releaseLaunchControlLocalArtifacts,
    externalArtifacts: releaseLaunchControlExternalArtifacts,
    commandExecutionAllowed: false,
    providerExecutionAllowed: false,
    ciExecutionAllowed: false,
    productionExecutionAllowed: false,
    databaseExecutionAllowed: false,
    mobileProviderExecutionAllowed: false,
    executionPolicy: releaseLaunchControlExecutionPolicy,
    requiredExternalEvidence: releaseLaunchControlRequiredExternalEvidence,
  };
}

export function buildRedactedReleaseLaunchControlArtifact(artifact: unknown): unknown {
  return buildRedactedReleaseLaunchControlValue(artifact, "", []);
}

export function buildReleaseLaunchControlArtifactReview(artifact: unknown): ReleaseLaunchControlArtifactReview {
  const redactions: string[] = [];
  return {
    artifact: buildRedactedReleaseLaunchControlValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: releaseLaunchControlRequiredExternalEvidence,
    safeForTracker: true,
  };
}

const releaseLaunchControlEvidenceBlockers: Record<ReleaseLaunchControlEvidenceFlag, string> = {
  releasesTestsPassed: "Release package tests must pass.",
  releasesTypecheckPassed: "Release package typecheck must pass.",
  releaseRecordPersistenceVerified: "ReleaseRecord provider-backed persistence must be verified.",
  featureFlagPersistenceVerified: "FeatureFlag provider-backed persistence must be verified.",
  rbacTenantScopeVerified: "Release and feature-flag RBAC and tenant scope must be verified.",
  optimisticConcurrencyVerified: "Release optimistic concurrency must be verified.",
  auditRowsPersisted: "Release audit rows must be persisted.",
  protectedGithubEnvironmentsConfigured: "GitHub preview, staging, and production protected environments must be configured.",
  signedDeploymentJobsConfigured: "Signed deployment provenance jobs must be configured.",
  ciRequiredChecksPassed: "CI required checks must pass.",
  previewDeployJobPassed: "Preview deploy job must pass.",
  productionDeployApprovalDryRunPassed: "Production deployment approval dry run must pass.",
  migrationGateDryRunPassed: "Migration gate dry run must pass.",
  incidentLinkedRollbackDrillPassed: "Incident-linked rollback drill must pass for web, dashboard, mobile OTA, database, and flags.",
  easUpdateGovernanceVerified: "EAS update governance must be verified.",
  rolloutControlsVerified: "Tenant rollout controls must be verified.",
  killSwitchDrillPassed: "Feature-flag kill-switch drill must pass.",
  releaseHealthEnvelopeVerified: "Release-health envelope smoke must pass.",
  providerBackedRouteTestsPassed: "Provider-backed release and feature-flag route tests must pass.",
  ciArtifactsCaptured: "Release launch CI artifacts must be captured.",
  secretSafeArtifactsCaptured: "Release launch artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export function buildReleaseLaunchControlRunData(input: ReleaseLaunchControlRunRecordInput): ReleaseLaunchControlRunData {
  const evidence = input.evidence ?? {};

  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha,
    status: input.status,
    commandMatrix: input.commandMatrix ?? releaseLaunchControlRuntimeMatrix,
    artifactManifest: input.artifactManifest ?? releaseLaunchControlArtifactPaths,
    persistenceEvidenceCaptured:
      evidence.releaseRecordPersistenceVerified === true &&
      evidence.featureFlagPersistenceVerified === true &&
      evidence.rbacTenantScopeVerified === true &&
      evidence.optimisticConcurrencyVerified === true &&
      evidence.auditRowsPersisted === true &&
      evidence.providerBackedRouteTestsPassed === true,
    governanceEvidenceCaptured:
      evidence.protectedGithubEnvironmentsConfigured === true &&
      evidence.signedDeploymentJobsConfigured === true &&
      evidence.ciRequiredChecksPassed === true &&
      evidence.previewDeployJobPassed === true &&
      evidence.productionDeployApprovalDryRunPassed === true,
    migrationGateEvidenceCaptured: evidence.migrationGateDryRunPassed === true,
    rollbackEvidenceCaptured:
      evidence.incidentLinkedRollbackDrillPassed === true &&
      evidence.rolloutControlsVerified === true &&
      evidence.killSwitchDrillPassed === true &&
      evidence.releaseHealthEnvelopeVerified === true,
    mobileGovernanceEvidenceCaptured: evidence.easUpdateGovernanceVerified === true,
    ciArtifactEvidenceCaptured: evidence.ciArtifactsCaptured === true,
    secretSafeArtifactsCaptured: evidence.secretSafeArtifactsCaptured === true,
    releaseHealthEnvelopePath: input.releaseHealthEnvelopePath ?? null,
    rollbackDrillArtifactPath: input.rollbackDrillArtifactPath ?? null,
  };
}

export async function persistReleaseLaunchControlRun(
  repository: ReleaseLaunchControlRunRepository,
  input: ReleaseLaunchControlRunRecordInput,
): Promise<unknown> {
  const data = buildReleaseLaunchControlRunData(input);
  const update = {
    commitSha: data.commitSha,
    status: data.status,
    commandMatrix: data.commandMatrix,
    artifactManifest: data.artifactManifest,
    persistenceEvidenceCaptured: data.persistenceEvidenceCaptured,
    governanceEvidenceCaptured: data.governanceEvidenceCaptured,
    migrationGateEvidenceCaptured: data.migrationGateEvidenceCaptured,
    rollbackEvidenceCaptured: data.rollbackEvidenceCaptured,
    mobileGovernanceEvidenceCaptured: data.mobileGovernanceEvidenceCaptured,
    ciArtifactEvidenceCaptured: data.ciArtifactEvidenceCaptured,
    secretSafeArtifactsCaptured: data.secretSafeArtifactsCaptured,
    releaseHealthEnvelopePath: data.releaseHealthEnvelopePath,
    rollbackDrillArtifactPath: data.rollbackDrillArtifactPath,
  };

  return repository.releaseLaunchControlRun.upsert({
    where: { tenantId_runId: { tenantId: input.tenantId, runId: input.runId } },
    create: data,
    update,
  });
}

export const buildReleaseLaunchControlEvidenceDecision = (
  input: ReleaseLaunchControlEvidenceInput,
): ReleaseLaunchControlEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, releaseLaunchControlRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, releaseLaunchControlArtifactPaths);
  const missingEvidence = releaseLaunchControlEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => releaseLaunchControlEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 && missingArtifacts.length === 0 && missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingEvidence,
    requiredCommands: releaseLaunchControlRuntimeCommands,
    requiredArtifacts: releaseLaunchControlArtifactPaths,
    requiredEvidence: releaseLaunchControlEvidenceFlags,
    blockers,
  };
};

export const releaseLaunchControlRuntimeReadiness = buildReleaseLaunchControlEvidencePlan({
  packageScripts: ["test", "typecheck"],
  releasesTestsPassed: false,
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
  rolloutControlsVerified: true,
  killSwitchDrillPassed: true,
  releaseHealthEnvelopeVerified: true,
  providerBackedRouteTestsPassed: false,
  ciArtifactsCaptured: false,
  secretSafeArtifactsCaptured: true,
});



