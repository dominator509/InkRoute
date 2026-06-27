import { buildPrivacyRetentionDryRunEvidencePlan } from "@inkroute/security";

export type PrivacyRetentionRuntimeStatus =
  | "wired"
  | "legal-gated"
  | "worker-gated"
  | "data-gated"
  | "tombstone-gated"
  | "ci-gated";

export interface PrivacyRetentionRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: PrivacyRetentionRuntimeStatus;
}


export interface PrivacyRetentionRunPersistenceContract {
  readonly prismaModel: "PrivacyRetentionRun";
  readonly tenantRelation: "privacyRetentionRuns";
  readonly migration: "20260609034700_add_privacy_retention_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesReadinessStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesAttorneyApprovalEvidence: true;
  readonly storesWorkerPersistenceEvidence: true;
  readonly storesPrismaDryRunEvidence: true;
  readonly storesObjectStorageDryRunEvidence: true;
  readonly storesTenantIsolationEvidence: true;
  readonly storesLegalHoldEvidence: true;
  readonly storesTombstoneReplayEvidence: true;
  readonly storesCiEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export const privacyRetentionRunPersistenceContract = {
  prismaModel: "PrivacyRetentionRun",
  tenantRelation: "privacyRetentionRuns",
  migration: "20260609034700_add_privacy_retention_runs",
  storesRunId: true,
  storesCommitSha: true,
  storesReadinessStatus: true,
  storesCommandMatrix: true,
  storesArtifactManifest: true,
  storesAttorneyApprovalEvidence: true,
  storesWorkerPersistenceEvidence: true,
  storesPrismaDryRunEvidence: true,
  storesObjectStorageDryRunEvidence: true,
  storesTenantIsolationEvidence: true,
  storesLegalHoldEvidence: true,
  storesTombstoneReplayEvidence: true,
  storesCiEvidence: true,
  storesSecretSafeArtifacts: true,
} as const satisfies PrivacyRetentionRunPersistenceContract;

export interface PrivacyRetentionRunRecordInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: PrivacyRetentionEvidenceDecision["status"];
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly attorneyApprovalEvidenceCaptured: boolean;
  readonly workerPersistenceEvidenceCaptured: boolean;
  readonly prismaDryRunEvidenceCaptured: boolean;
  readonly objectStorageDryRunEvidenceCaptured: boolean;
  readonly tenantIsolationEvidenceCaptured: boolean;
  readonly legalHoldEvidenceCaptured: boolean;
  readonly tombstoneReplayEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly retentionReportPath?: string | null;
  readonly tombstoneReplayReportPath?: string | null;
}

export interface PrivacyRetentionRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: PrivacyRetentionEvidenceDecision["status"];
  readonly commandMatrix: readonly string[];
  readonly artifactManifest: readonly string[];
  readonly attorneyApprovalEvidenceCaptured: boolean;
  readonly workerPersistenceEvidenceCaptured: boolean;
  readonly prismaDryRunEvidenceCaptured: boolean;
  readonly objectStorageDryRunEvidenceCaptured: boolean;
  readonly tenantIsolationEvidenceCaptured: boolean;
  readonly legalHoldEvidenceCaptured: boolean;
  readonly tombstoneReplayEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly retentionReportPath: string | null;
  readonly tombstoneReplayReportPath: string | null;
}

export interface PrivacyRetentionRunRepository {
  readonly privacyRetentionRun: {
    readonly upsert: (args: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: PrivacyRetentionRunData;
      readonly update: Omit<PrivacyRetentionRunData, "tenantId" | "runId">;
    }) => Promise<unknown>;
  };
}

export function buildPrivacyRetentionRunData(input: PrivacyRetentionRunRecordInput): PrivacyRetentionRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha,
    status: input.status,
    commandMatrix: input.commands ?? privacyRetentionRuntimeCommands,
    artifactManifest: input.artifacts ?? privacyRetentionArtifactPaths,
    attorneyApprovalEvidenceCaptured: input.attorneyApprovalEvidenceCaptured,
    workerPersistenceEvidenceCaptured: input.workerPersistenceEvidenceCaptured,
    prismaDryRunEvidenceCaptured: input.prismaDryRunEvidenceCaptured,
    objectStorageDryRunEvidenceCaptured: input.objectStorageDryRunEvidenceCaptured,
    tenantIsolationEvidenceCaptured: input.tenantIsolationEvidenceCaptured,
    legalHoldEvidenceCaptured: input.legalHoldEvidenceCaptured,
    tombstoneReplayEvidenceCaptured: input.tombstoneReplayEvidenceCaptured,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    retentionReportPath: input.retentionReportPath ?? null,
    tombstoneReplayReportPath: input.tombstoneReplayReportPath ?? null,
  };
}

export async function persistPrivacyRetentionRun(
  repository: PrivacyRetentionRunRepository,
  input: PrivacyRetentionRunRecordInput,
): Promise<unknown> {
  const data = buildPrivacyRetentionRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.privacyRetentionRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

export const privacyRetentionRuntimeCommands = [
  "pnpm --filter @inkroute/security typecheck",
  "pnpm --filter @inkroute/security test",
  "privacy request worker integration tests",
  "Prisma privacy delete/anonymize dry run",
  "object storage deletion dry run",
  "tenant isolation privacy dry run",
  "backup/restore tombstone replay drill",
  "GitHub Actions privacy retention evidence job",
] as const;

export const privacyRetentionArtifactPaths = [
  "coverage/privacy-retention-runtime.json",
  "coverage/privacy-retention-security-typecheck.txt",
  "coverage/privacy-retention-security-test.txt",
  "coverage/privacy-retention-attorney-approval-redacted.json",
  "coverage/privacy-retention-worker-output-redacted.json",
  "coverage/privacy-retention-prisma-dry-run-redacted.json",
  "coverage/privacy-retention-object-storage-dry-run-redacted.json",
  "coverage/privacy-retention-tenant-isolation.json",
  "coverage/privacy-retention-legal-hold.json",
  "coverage/privacy-retention-tombstone-replay.json",
  "coverage/privacy-retention-ci-evidence.json",
  "coverage/privacy-retention-secret-safe-artifacts.json",
  "test-results/privacy-retention-runtime",
] as const;

export const privacyRetentionRuntimeProofFiles = [
  "packages/security/package.json",
  "packages/security/src/index.ts",
  "packages/security/tests/upload-policy.test.ts",
  "apps/web/lib/privacyRetentionRuntime.ts",
  "apps/web/tests/privacy-retention-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609034700_add_privacy_retention_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export const privacyRetentionRuntimeMatrix = [
  {
    id: "security-package-gates",
    command: "pnpm --filter @inkroute/security typecheck && pnpm --filter @inkroute/security test",
    artifact: "coverage/privacy-retention-security-test.txt",
    status: "wired",
  },
  {
    id: "attorney-notification-approval",
    command: "attorney approval packet for retention, legal holds, destructive actions, and notification templates",
    artifact: "coverage/privacy-retention-attorney-approval-redacted.json",
    status: "legal-gated",
  },
  {
    id: "privacy-worker-persistence",
    command: "privacy request worker integration tests",
    artifact: "coverage/privacy-retention-worker-output-redacted.json",
    status: "worker-gated",
  },
  {
    id: "prisma-object-storage-dry-runs",
    command: "Prisma privacy delete/anonymize dry run && object storage deletion dry run",
    artifact: "coverage/privacy-retention-prisma-dry-run-redacted.json",
    status: "data-gated",
  },
  {
    id: "tenant-isolation-legal-hold-dry-runs",
    command: "tenant isolation privacy dry run",
    artifact: "coverage/privacy-retention-tenant-isolation.json",
    status: "data-gated",
  },
  {
    id: "backup-restore-tombstone-replay",
    command: "backup/restore tombstone replay drill",
    artifact: "coverage/privacy-retention-tombstone-replay.json",
    status: "tombstone-gated",
  },
  {
    id: "ci-redacted-evidence",
    command: "GitHub Actions privacy retention evidence job",
    artifact: "coverage/privacy-retention-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly PrivacyRetentionRuntimeMatrixEntry[];

export const privacyRetentionRuntimeControls = [
  "verify-requester-identity-before-privacy-workers-run",
  "persist-privacy-case-worker-output-tombstones-audit-events-transactionally",
  "run-prisma-object-storage-dry-runs-against-non-production-fixtures-only",
  "enforce-legal-holds-before-destructive-actions",
  "replay-deletion-anonymization-tombstones-after-backup-restore-before-query",
  "keep-privacy-evidence-redacted-secret-safe-client-pii-medical-free",
] as const;

export const privacyRetentionEvidenceFlags = [
  "securityTestsPassed",
  "securityTypecheckPassed",
  "attorneyApprovalCaptured",
  "identityVerificationWorkerIntegrated",
  "exportWorkerPersisted",
  "deleteAnonymizeWorkerPersisted",
  "caseAuditPersistenceConfigured",
  "prismaDryRunPassed",
  "objectStorageDryRunPassed",
  "tenantIsolationDryRunPassed",
  "legalHoldEnforced",
  "notificationTemplatesApproved",
  "backupRestoreTombstoneReplayPassed",
  "retentionReportCaptured",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type PrivacyRetentionEvidenceFlag = (typeof privacyRetentionEvidenceFlags)[number];

export interface PrivacyRetentionEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly controls?: readonly string[];
  readonly evidence?: Partial<Record<PrivacyRetentionEvidenceFlag, boolean>>;
}

export interface PrivacyRetentionEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingControls: readonly string[];
  readonly missingEvidence: readonly PrivacyRetentionEvidenceFlag[];
  readonly requiredCommands: typeof privacyRetentionRuntimeCommands;
  readonly requiredArtifacts: typeof privacyRetentionArtifactPaths;
  readonly requiredControls: typeof privacyRetentionRuntimeControls;
  readonly requiredEvidence: typeof privacyRetentionEvidenceFlags;
  readonly blockers: readonly string[];
}

export interface PrivacyRetentionExecutionPlan {
  readonly localCommands: typeof privacyRetentionLocalCommands;
  readonly externalCommands: typeof privacyRetentionExternalCommands;
  readonly localArtifacts: typeof privacyRetentionLocalArtifacts;
  readonly externalArtifacts: typeof privacyRetentionExternalArtifacts;
  readonly commandExecutionAllowed: false;
  readonly attorneyApprovalExecutionAllowed: false;
  readonly privacyWorkerExecutionAllowed: false;
  readonly storageExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly providerPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof privacyRetentionExecutionPolicy;
  readonly requiredExternalEvidence: typeof privacyRetentionRequiredExternalEvidence;
}

export interface PrivacyRetentionArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof privacyRetentionRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

const privacyRetentionEvidenceBlockers: Record<PrivacyRetentionEvidenceFlag, string> = {
  securityTestsPassed: "Security package tests must pass.",
  securityTypecheckPassed: "Security package typecheck must pass.",
  attorneyApprovalCaptured: "Attorney approval must be captured for retention, export, delete, anonymization, notification, and legal-hold behavior.",
  identityVerificationWorkerIntegrated: "Requester identity verification worker must be integrated before privacy actions run.",
  exportWorkerPersisted: "Export worker dry-runs must persist case output metadata and audit events.",
  deleteAnonymizeWorkerPersisted: "Delete/anonymize worker dry-runs must persist tombstones, skipped legal holds, and audit events.",
  caseAuditPersistenceConfigured: "Privacy case and AuditLog persistence must be configured transactionally.",
  prismaDryRunPassed: "Prisma privacy delete/anonymize dry run must pass.",
  objectStorageDryRunPassed: "Object-storage deletion dry run must pass.",
  tenantIsolationDryRunPassed: "Tenant isolation privacy dry run must pass.",
  legalHoldEnforced: "Legal holds must be enforced before destructive action planning or execution.",
  notificationTemplatesApproved: "Privacy notification templates must be attorney-approved.",
  backupRestoreTombstoneReplayPassed: "Backup/restore tombstone replay drill must pass.",
  retentionReportCaptured: "Redacted privacy retention report must be captured.",
  ciEvidenceCaptured: "CI privacy retention evidence must be captured.",
  secretSafeArtifactsCaptured: "Privacy retention artifacts must be redacted and free of secrets, client PII, medical notes, and provider tokens.",
};

export const privacyRetentionLocalCommands = [
  "pnpm --filter @inkroute/security typecheck",
  "pnpm --filter @inkroute/security test",
] as const;

export const privacyRetentionExternalCommands = [
  "privacy request worker integration tests",
  "Prisma privacy delete/anonymize dry run",
  "object storage deletion dry run",
  "tenant isolation privacy dry run",
  "backup/restore tombstone replay drill",
  "GitHub Actions privacy retention evidence job",
  "provider-backed persistPrivacyRetentionRun execution proof",
] as const;

export const privacyRetentionLocalArtifacts = [
  "coverage/privacy-retention-runtime.json",
  "coverage/privacy-retention-security-typecheck.txt",
  "coverage/privacy-retention-security-test.txt",
] as const;

export const privacyRetentionExternalArtifacts = [
  "coverage/privacy-retention-attorney-approval-redacted.json",
  "coverage/privacy-retention-worker-output-redacted.json",
  "coverage/privacy-retention-prisma-dry-run-redacted.json",
  "coverage/privacy-retention-object-storage-dry-run-redacted.json",
  "coverage/privacy-retention-tenant-isolation.json",
  "coverage/privacy-retention-legal-hold.json",
  "coverage/privacy-retention-tombstone-replay.json",
  "coverage/privacy-retention-ci-evidence.json",
  "coverage/privacy-retention-secret-safe-artifacts.json",
  "test-results/privacy-retention-runtime",
  "provider-backed PrivacyRetentionRun persistence proof",
] as const;

export const privacyRetentionExecutionPolicy = {
  codexMayClassifyStaticPrivacyRetentionReadiness: true,
  attorneyApprovalRequiredForClosure: true,
  nonProductionDryRunRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const;

export const privacyRetentionRequiredExternalEvidence = [
  "Attorney approval for retention, export, delete, anonymization, notification, and legal-hold behavior.",
  "Identity-gated privacy worker output persisted with case, audit, and tombstone records.",
  "Non-production Prisma and object-storage export/delete/anonymization dry-run artifacts.",
  "Tenant isolation, legal-hold enforcement, notification approval, and backup/restore tombstone replay proof.",
  "Provider-backed PrivacyRetentionRun persistence row captured through persistPrivacyRetentionRun.",
  "CI evidence and secret-safe reports free of secrets, client PII, medical notes, and provider tokens.",
] as const;

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

const sensitivePrivacyRetentionKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|name|address|medical|payment|card|consent|tenant|user|client|patient|attorney|provider|database|storage|object|url|uri|dsn|key|id|payload|artifact|tombstone|audit|case)/iu;
const sensitivePrivacyRetentionValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|s3:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|[A-Za-z0-9_-]{24,})/giu;

const buildRedactedPrivacyRetentionValue = (value: unknown, path: string, redactions: string[]): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => buildRedactedPrivacyRetentionValue(entry, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitivePrivacyRetentionKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedPrivacyRetentionValue(entry, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redacted = value.replace(sensitivePrivacyRetentionValuePattern, "[REDACTED]");
    if (redacted !== value) {
      redactions.push(path || "$");
    }
    return redacted;
  }

  return value;
};

export function buildPrivacyRetentionExecutionPlan(): PrivacyRetentionExecutionPlan {
  return {
    localCommands: privacyRetentionLocalCommands,
    externalCommands: privacyRetentionExternalCommands,
    localArtifacts: privacyRetentionLocalArtifacts,
    externalArtifacts: privacyRetentionExternalArtifacts,
    commandExecutionAllowed: false,
    attorneyApprovalExecutionAllowed: false,
    privacyWorkerExecutionAllowed: false,
    storageExecutionAllowed: false,
    ciExecutionAllowed: false,
    providerPersistenceExecutionAllowed: false,
    executionPolicy: privacyRetentionExecutionPolicy,
    requiredExternalEvidence: privacyRetentionRequiredExternalEvidence,
  };
}

export function buildRedactedPrivacyRetentionArtifact(artifact: unknown): unknown {
  return buildRedactedPrivacyRetentionValue(artifact, "", []);
}

export function buildPrivacyRetentionArtifactReview(artifact: unknown): PrivacyRetentionArtifactReview {
  const redactions: string[] = [];
  return {
    artifact: buildRedactedPrivacyRetentionValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: privacyRetentionRequiredExternalEvidence,
    safeForTracker: true,
  };
}

export const buildPrivacyRetentionEvidenceDecision = (
  input: PrivacyRetentionEvidenceInput,
): PrivacyRetentionEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, privacyRetentionRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, privacyRetentionArtifactPaths);
  const missingControls = missingFrom(input.controls, privacyRetentionRuntimeControls);
  const missingEvidence = privacyRetentionEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => privacyRetentionEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 &&
      missingArtifacts.length === 0 &&
      missingControls.length === 0 &&
      missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingControls,
    missingEvidence,
    requiredCommands: privacyRetentionRuntimeCommands,
    requiredArtifacts: privacyRetentionArtifactPaths,
    requiredControls: privacyRetentionRuntimeControls,
    requiredEvidence: privacyRetentionEvidenceFlags,
    blockers,
  };
};

export const privacyRetentionRuntimeReadiness = buildPrivacyRetentionDryRunEvidencePlan({
  packageScripts: ["test", "typecheck"],
  securityTestsPassed: false,
  securityTypecheckPassed: false,
  attorneyApprovalCaptured: false,
  identityVerificationWorkerIntegrated: false,
  exportWorkerPersisted: false,
  deleteAnonymizeWorkerPersisted: false,
  caseAuditPersistenceConfigured: false,
  prismaDryRunPassed: false,
  objectStorageDryRunPassed: false,
  tenantIsolationDryRunPassed: false,
  legalHoldEnforced: false,
  notificationTemplatesApproved: false,
  backupRestoreTombstoneReplayPassed: false,
  retentionReportCaptured: false,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});



