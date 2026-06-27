import {
  buildRetentionEnforcementDryRun,
  buildRetentionEnforcementRuntimeReadinessPlan,
  type RetentionCandidateRecord,
} from "@inkroute/security";

export type RetentionWorkerAction =
  | "load-due-retention-candidates"
  | "apply-tenant-isolation-filter"
  | "run-database-retention-worker"
  | "run-storage-retention-worker"
  | "generate-export-artifact"
  | "persist-deletion-tombstone"
  | "persist-anonymization-tombstone"
  | "skip-legal-hold-record"
  | "write-retention-audit-log"
  | "reconcile-dry-run-to-execution"
  | "replay-tombstones-after-restore"
  | "attach-destructive-action-rollback-note";

export type RetentionWorkerExecutionMode = "dry-run-only" | "external-evidence-required";

export interface RetentionEnforcementContractInput {
  records: readonly RetentionCandidateRecord[];
  legalReviewApproved: boolean;
  databaseWorkerConfigured: boolean;
  storageWorkerConfigured: boolean;
  auditLogConfigured: boolean;
  backupPolicyDocumented: boolean;
  restorePolicyDocumented: boolean;
}

export interface RetentionScheduledWorkerPlan {
  readonly mode: RetentionWorkerExecutionMode;
  readonly destructiveExecutionAllowed: false;
  readonly workerRunId: string;
  readonly dryRunStatus: "ready" | "blocked";
  readonly dueRecordCount: number;
  readonly databaseActions: readonly RetentionWorkerAction[];
  readonly storageActions: readonly RetentionWorkerAction[];
  readonly exportActions: readonly RetentionWorkerAction[];
  readonly tombstoneActions: readonly RetentionWorkerAction[];
  readonly auditActions: readonly RetentionWorkerAction[];
  readonly legalHoldSkippedRecordIds: readonly string[];
  readonly requiredExternalEvidence: typeof retentionEnforcementRequiredExternalEvidence;
  readonly blockedReasons: readonly string[];
}

export interface RetentionTombstonePersistenceInput {
  tenantId: string;
  privacyRequestId?: string;
  workerRunId: string;
  sourceRecordId: string;
  sourceRecordType: string;
  category: RetentionCandidateRecord["category"];
  action: "delete" | "anonymize" | "retain_legal_hold" | "export";
  reason: string;
  dryRunFingerprint: string;
  executedAt: string;
  restoreReplayAfter?: string;
  storageObjectKey?: string;
  legalHoldSkipped: boolean;
  rollbackNote?: string;
}

export interface RetentionTombstonePersistenceContract {
  modelName: "RetentionTombstone";
  row: RetentionTombstonePersistenceInput;
  transactionWrites: readonly ["RetentionTombstone", "AuditLog"];
  reconciliationKeys: readonly ["tenantId", "workerRunId", "sourceRecordType", "sourceRecordId", "dryRunFingerprint"];
  restoreReplayGate: "restore_replay_after_before_queryable";
  redactedFields: readonly ["storageObjectKey", "redactedFields", "auditLogIds"];
  tenantIsolationKey: "tenantId";
}

export interface RetentionTombstonePersistenceClient {
  readonly retentionTombstone: {
    create(input: {
      data: {
        tenantId: string;
        privacyRequestId?: string;
        workerRunId: string;
        sourceRecordId: string;
        sourceRecordType: string;
        category: string;
        action: string;
        reason: string;
        dryRunFingerprint: string;
        executedAt: Date;
        restoreReplayAfter?: Date;
        storageObjectKey?: string;
        redactedFields: Record<string, unknown>;
        auditLogIds: readonly string[];
        legalHoldSkipped: boolean;
        rollbackNote?: string;
      };
    }): Promise<{ id?: string } | unknown>;
  };
  readonly auditLog: {
    create(input: {
      data: {
        tenantId: string;
        action: "retention.tombstone.persisted";
        entityType: "RetentionTombstone";
        entityId: string;
        metadata: Record<string, unknown>;
      };
    }): Promise<{ id?: string } | unknown>;
  };
}

export interface RetentionTombstonePersistenceResult {
  readonly persisted: true;
  readonly auditAction: "retention.tombstone.persisted";
  readonly tombstoneId: string;
  readonly tenantId: string;
  readonly legalHoldSkipped: boolean;
  readonly restoreReplayRequired: boolean;
}

export const retentionEnforcementArtifactPaths = [
  "coverage/retention-enforcement-dry-run.json",
  "coverage/retention-scheduled-worker.json",
  "coverage/retention-postgres-execution.json",
  "coverage/retention-object-storage-execution.json",
  "coverage/retention-export-artifacts-redacted.json",
  "coverage/retention-deletion-tombstones.json",
  "coverage/retention-anonymization-tombstones.json",
  "coverage/retention-legal-hold-skips.json",
  "coverage/retention-audit-log-persistence.json",
  "coverage/retention-backup-restore-tombstone-replay.json",
  "coverage/retention-destructive-rollback.md",
  "test-results/retention-enforcement",
] as const;

export const retentionEnforcementProofFiles = [
  "scripts/privacy/execute-retention-workers.mjs",
  "scripts/privacy/run-retention-dry-run.mjs",
  "scripts/privacy/verify-backup-restore-tombstones.mjs",
  "packages/security/package.json",
  "SECURITY.md",
  "DATABASE_SCHEMA.md",
  "packages/security/src/index.ts",
  "packages/security/tests/upload-policy.test.ts",
  "apps/web/lib/retentionEnforcement.ts",
  "apps/web/tests/retention-enforcement-static.test.ts",
  "apps/web/lib/privacyRequestWorkflow.ts",
  "apps/web/tests/privacy-request-workflow-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609002000_add_retention_tombstones/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export const retentionEnforcementCommands = [
  "pnpm --filter @inkroute/security test",
  "pnpm vitest run apps/web/tests/retention-enforcement-static.test.ts apps/web/tests/privacy-request-workflow-static.test.ts",
  "node scripts/privacy/run-retention-dry-run.mjs",
  "node scripts/privacy/execute-retention-workers.mjs",
  "node scripts/privacy/verify-backup-restore-tombstones.mjs",
  "Postgres retention/delete/anonymize/export integration test",
  "object-storage retention/delete integration test",
  "tenant-isolation retention integration test",
] as const;

export const retentionEnforcementLocalCommands = retentionEnforcementCommands.slice(0, 3);
export const retentionEnforcementExternalCommands = retentionEnforcementCommands.slice(3);

export const retentionEnforcementRequiredExternalEvidence = [
  "Scheduled retention worker execution evidence",
  "Postgres delete/anonymize/export integration evidence",
  "Object-storage retention/delete integration evidence",
  "Retention export artifact evidence",
  "Anonymization tombstone persistence evidence",
  "Retention AuditLog persistence evidence",
  "Backup/restore tombstone replay evidence",
  "Destructive retention rollback documentation evidence",
  "Tenant-isolation retention integration evidence",
] as const;

export type RetentionEnforcementArtifact = (typeof retentionEnforcementArtifactPaths)[number];

export const retentionEnforcementLocalArtifacts = [
  "coverage/retention-enforcement-dry-run.json",
  "coverage/retention-export-artifacts-redacted.json",
  "coverage/retention-deletion-tombstones.json",
  "coverage/retention-legal-hold-skips.json",
  "test-results/retention-enforcement",
] as const satisfies readonly RetentionEnforcementArtifact[];

const retentionEnforcementLocalArtifactSet = new Set<RetentionEnforcementArtifact>(
  retentionEnforcementLocalArtifacts,
);

export const retentionEnforcementExternalArtifacts = retentionEnforcementArtifactPaths.filter(
  (artifact) => !retentionEnforcementLocalArtifactSet.has(artifact),
) as readonly RetentionEnforcementArtifact[];

export type RetentionEnforcementCommand = (typeof retentionEnforcementCommands)[number];

export type RetentionEnforcementExecutionPolicy = {
  localDryRunOnly: true;
  tombstonePersistenceContractAvailable: true;
  scheduledWorkerExecutionRequiresExternalEvidence: true;
  postgresExecutionRequiresExternalEvidence: true;
  objectStorageExecutionRequiresExternalEvidence: true;
  destructiveRollbackRequiresExternalEvidence: true;
  tenantIsolationRequiresExternalEvidence: true;
  externalEvidenceRequired: typeof retentionEnforcementRequiredExternalEvidence;
};

export type RetentionEnforcementEvidenceInput = {
  packageRetentionHelpersPassed: boolean;
  dryRunCaptured: boolean;
  scheduledWorkerCaptured: boolean;
  postgresExecutionCaptured: boolean;
  objectStorageExecutionCaptured: boolean;
  exportArtifactCaptured: boolean;
  deletionTombstoneCaptured: boolean;
  anonymizationTombstoneCaptured: boolean;
  legalHoldSkipCaptured: boolean;
  auditLogPersistenceCaptured: boolean;
  backupRestoreReplayCaptured: boolean;
  destructiveRollbackDocumented: boolean;
  tenantIsolationCaptured: boolean;
  requiredCommandsRun: readonly RetentionEnforcementCommand[];
  capturedArtifacts: readonly RetentionEnforcementArtifact[];
};

export type RetentionEnforcementEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: RetentionEnforcementArtifact[];
  requiredCommands: typeof retentionEnforcementCommands;
  requiredEvidence: typeof retentionEnforcementArtifactPaths;
  destructiveActionPolicy: {
    dryRunMustMatchExecution: true;
    tombstonesReplayBeforeRestoreQueryable: true;
    rollbackNotesRequired: true;
  };
};

export type RetentionEnforcementExecutionPlan = {
  status: "local-plan-ready";
  policy: RetentionEnforcementExecutionPolicy;
  tombstonePersistenceContractAvailable: true;
  externalEvidenceRequired: typeof retentionEnforcementRequiredExternalEvidence;
  scheduledWorkerExecutionAllowed: false;
  postgresExecutionAllowed: false;
  objectStorageExecutionAllowed: false;
  backupRestoreReplayExecutionAllowed: false;
  destructiveRollbackExecutionAllowed: false;
  tenantIsolationExecutionAllowed: false;
  localCommands: typeof retentionEnforcementLocalCommands;
  externalCommands: typeof retentionEnforcementExternalCommands;
  localArtifacts: typeof retentionEnforcementLocalArtifacts;
  externalArtifacts: typeof retentionEnforcementExternalArtifacts;
  disabledReasons: readonly string[];
};

export const retentionEnforcementExecutionPolicy: RetentionEnforcementExecutionPolicy = {
  localDryRunOnly: true,
  tombstonePersistenceContractAvailable: true,
  scheduledWorkerExecutionRequiresExternalEvidence: true,
  postgresExecutionRequiresExternalEvidence: true,
  objectStorageExecutionRequiresExternalEvidence: true,
  destructiveRollbackRequiresExternalEvidence: true,
  tenantIsolationRequiresExternalEvidence: true,
  externalEvidenceRequired: retentionEnforcementRequiredExternalEvidence,
};

export type RetentionEnforcementArtifactReview = {
  status: "redacted-review-ready";
  redactedArtifact: unknown;
  requiredArtifacts: typeof retentionEnforcementArtifactPaths;
  retainedExternalGates: readonly string[];
};

const retentionEnforcementSensitivePatterns = [
  /(storage[_-]?object[_-]?key['":=\s]+)[^"',\s}]+/gi,
  /(export[_-]?artifact['":=\s]+)[^"',\s}]+/gi,
  /(dry[_-]?run[_-]?fingerprint['":=\s]+)[^"',\s}]+/gi,
  /(worker[_-]?run[_-]?id['":=\s]+)[^"',\s}]+/gi,
  /(rollback[_-]?note['":=\s]+)[^"',}]+/gi,
  /(authorization:\s*bearer\s+)[A-Za-z0-9._-]+/gi,
  /(secret['":=\s]+)[^"',\s}]+/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
] as const;

export function buildRedactedRetentionEnforcementArtifact(value: unknown): unknown {
  if (typeof value === "string") {
    return retentionEnforcementSensitivePatterns.reduce(
      (redacted, pattern) => redacted.replace(pattern, (_match, prefix: string | undefined) => `${prefix ?? ""}[REDACTED]`),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => buildRedactedRetentionEnforcementArtifact(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /email|phone|name|address|token|secret|authorization|credential|password|rawBody|stack|storageObjectKey|exportArtifact|dryRunFingerprint|workerRunId|rollbackNote|auditLogIds/i.test(key)
          ? "[REDACTED]"
          : buildRedactedRetentionEnforcementArtifact(entry),
      ]),
    );
  }

  return value;
}

export function buildRetentionEnforcementExecutionPlan(): RetentionEnforcementExecutionPlan {
  return {
    status: "local-plan-ready",
    policy: retentionEnforcementExecutionPolicy,
    tombstonePersistenceContractAvailable: true,
    externalEvidenceRequired: retentionEnforcementRequiredExternalEvidence,
    scheduledWorkerExecutionAllowed: false,
    postgresExecutionAllowed: false,
    objectStorageExecutionAllowed: false,
    backupRestoreReplayExecutionAllowed: false,
    destructiveRollbackExecutionAllowed: false,
    tenantIsolationExecutionAllowed: false,
    localCommands: retentionEnforcementLocalCommands,
    externalCommands: retentionEnforcementExternalCommands,
    localArtifacts: retentionEnforcementLocalArtifacts,
    externalArtifacts: retentionEnforcementExternalArtifacts,
    disabledReasons: [
      "Scheduled worker execution requires production-like scheduler and worker runtime evidence.",
      "RetentionTombstone persistence contract is wired, but Postgres delete/anonymize/export execution requires migrated database integration.",
      "Object-storage delete/export execution requires live private storage integration.",
      "Backup/restore tombstone replay requires restore workflow evidence before restored data is queryable.",
      "Destructive rollback documentation requires approved incident/rollback evidence.",
      "Tenant-isolation retention proof requires integration tenants and records.",
    ],
  };
}

export function buildRetentionScheduledWorkerPlan(
  input: RetentionEnforcementContractInput,
  workerRunId = "retention_worker_dry_run_preview",
): RetentionScheduledWorkerPlan {
  const dryRun = buildRetentionEnforcementDryRun(input);
  const dueSteps = dryRun.steps.filter((step) => !step.blocked);
  const hasDatabaseAction = dueSteps.some((step) => step.action === "delete" || step.action === "anonymize");
  const hasStorageAction = dueSteps.some((step) => step.category === "reference_file" && step.action === "delete");
  const hasExportAction = dueSteps.some((step) => step.action === "export");
  const legalHoldSkippedRecordIds = dryRun.steps
    .filter((step) => step.action === "retain_legal_hold")
    .map((step) => step.recordId);

  return {
    mode: dryRun.status === "ready" ? "external-evidence-required" : "dry-run-only",
    destructiveExecutionAllowed: false,
    workerRunId,
    dryRunStatus: dryRun.status,
    dueRecordCount: dueSteps.length,
    databaseActions: hasDatabaseAction
      ? ["load-due-retention-candidates", "apply-tenant-isolation-filter", "run-database-retention-worker"]
      : ["load-due-retention-candidates", "apply-tenant-isolation-filter"],
    storageActions: hasStorageAction ? ["run-storage-retention-worker"] : [],
    exportActions: hasExportAction ? ["generate-export-artifact"] : [],
    tombstoneActions: [
      "persist-deletion-tombstone",
      "persist-anonymization-tombstone",
      "reconcile-dry-run-to-execution",
      "replay-tombstones-after-restore",
    ],
    auditActions: ["skip-legal-hold-record", "write-retention-audit-log", "attach-destructive-action-rollback-note"],
    legalHoldSkippedRecordIds,
    requiredExternalEvidence: retentionEnforcementRequiredExternalEvidence,
    blockedReasons: [
      ...dryRun.blockers,
      "Destructive DB/storage retention execution remains disabled until Postgres, object-storage, restore replay, rollback, and tenant-isolation evidence is captured.",
    ],
  };
}

export function buildRetentionEnforcementArtifactReview(rawArtifact: unknown): RetentionEnforcementArtifactReview {
  return {
    status: "redacted-review-ready",
    redactedArtifact: buildRedactedRetentionEnforcementArtifact(rawArtifact),
    requiredArtifacts: retentionEnforcementArtifactPaths,
    retainedExternalGates: [
      "Scheduled retention worker execution evidence",
      "Postgres delete/anonymize/export integration evidence",
      "Object-storage retention/delete integration evidence",
      "Backup/restore tombstone replay evidence",
      "Destructive rollback documentation evidence",
      "Tenant-isolation retention integration evidence",
    ],
  };
}

export function buildRetentionEnforcementEvidenceDecision(
  input: RetentionEnforcementEvidenceInput,
): RetentionEnforcementEvidenceDecision {
  const blockers = [
    !input.packageRetentionHelpersPassed && "Run package retention helper tests.",
    !input.dryRunCaptured && "Capture retention dry-run decision evidence.",
    !input.scheduledWorkerCaptured && "Capture scheduled retention worker execution evidence.",
    !input.postgresExecutionCaptured && "Capture Postgres delete/anonymize/export execution evidence.",
    !input.objectStorageExecutionCaptured && "Capture object-storage delete/export execution evidence.",
    !input.exportArtifactCaptured && "Capture retention export artifact evidence.",
    !input.deletionTombstoneCaptured && "Capture deletion tombstone persistence evidence.",
    !input.anonymizationTombstoneCaptured && "Capture anonymization tombstone persistence evidence.",
    !input.legalHoldSkipCaptured && "Capture legal-hold skip evidence.",
    !input.auditLogPersistenceCaptured && "Capture retention AuditLog persistence evidence.",
    !input.backupRestoreReplayCaptured && "Capture backup/restore tombstone replay evidence.",
    !input.destructiveRollbackDocumented && "Document destructive-action rollback evidence.",
    !input.tenantIsolationCaptured && "Capture tenant-isolation retention integration evidence.",
  ].filter(Boolean) as string[];

  const missingArtifacts = retentionEnforcementArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = retentionEnforcementCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: retentionEnforcementCommands,
    requiredEvidence: retentionEnforcementArtifactPaths,
    destructiveActionPolicy: {
      dryRunMustMatchExecution: true,
      tombstonesReplayBeforeRestoreQueryable: true,
      rollbackNotesRequired: true,
    },
  };
}

export function buildRetentionTombstonePersistenceContract(
  input: RetentionTombstonePersistenceInput,
): RetentionTombstonePersistenceContract {
  return {
    modelName: "RetentionTombstone",
    row: input,
    transactionWrites: ["RetentionTombstone", "AuditLog"],
    reconciliationKeys: ["tenantId", "workerRunId", "sourceRecordType", "sourceRecordId", "dryRunFingerprint"],
    restoreReplayGate: "restore_replay_after_before_queryable",
    redactedFields: ["storageObjectKey", "redactedFields", "auditLogIds"],
    tenantIsolationKey: "tenantId",
  };
}

export async function persistRetentionTombstoneOutcome(
  client: RetentionTombstonePersistenceClient,
  input: RetentionTombstonePersistenceInput,
): Promise<RetentionTombstonePersistenceResult> {
  const metadata = buildRedactedRetentionEnforcementArtifact({
    workerRunId: input.workerRunId,
    sourceRecordType: input.sourceRecordType,
    sourceRecordId: input.sourceRecordId,
    category: input.category,
    action: input.action,
    reason: input.reason,
    dryRunFingerprint: input.dryRunFingerprint,
    storageObjectKey: input.storageObjectKey,
    legalHoldSkipped: input.legalHoldSkipped,
    rollbackNote: input.rollbackNote,
  }) as Record<string, unknown>;

  const tombstone = await client.retentionTombstone.create({
    data: {
      tenantId: input.tenantId,
      ...(input.privacyRequestId ? { privacyRequestId: input.privacyRequestId } : {}),
      workerRunId: input.workerRunId,
      sourceRecordId: input.sourceRecordId,
      sourceRecordType: input.sourceRecordType,
      category: input.category,
      action: input.action,
      reason: input.reason,
      dryRunFingerprint: input.dryRunFingerprint,
      executedAt: new Date(input.executedAt),
      ...(input.restoreReplayAfter ? { restoreReplayAfter: new Date(input.restoreReplayAfter) } : {}),
      ...(input.storageObjectKey ? { storageObjectKey: input.storageObjectKey } : {}),
      redactedFields: metadata,
      auditLogIds: [],
      legalHoldSkipped: input.legalHoldSkipped,
      ...(input.rollbackNote ? { rollbackNote: input.rollbackNote } : {}),
    },
  });
  const tombstoneId =
    typeof tombstone === "object" && tombstone && "id" in tombstone && typeof tombstone.id === "string"
      ? tombstone.id
      : `${input.workerRunId}:${input.sourceRecordType}:${input.sourceRecordId}`;

  await client.auditLog.create({
    data: {
      tenantId: input.tenantId,
      action: "retention.tombstone.persisted",
      entityType: "RetentionTombstone",
      entityId: tombstoneId,
      metadata,
    },
  });

  return {
    persisted: true,
    auditAction: "retention.tombstone.persisted",
    tombstoneId,
    tenantId: input.tenantId,
    legalHoldSkipped: input.legalHoldSkipped,
    restoreReplayRequired: Boolean(input.restoreReplayAfter),
  };
}

export function buildRetentionEnforcementContract(input: RetentionEnforcementContractInput) {
  const dryRun = buildRetentionEnforcementDryRun(input);
  const actions: RetentionWorkerAction[] = [
    "load-due-retention-candidates",
    "apply-tenant-isolation-filter",
    "run-database-retention-worker",
    "run-storage-retention-worker",
    "generate-export-artifact",
    "persist-deletion-tombstone",
    "persist-anonymization-tombstone",
    "skip-legal-hold-record",
    "write-retention-audit-log",
    "reconcile-dry-run-to-execution",
    "replay-tombstones-after-restore",
    "attach-destructive-action-rollback-note",
  ];

  return {
    gapIds: ["GAP-099"] as const,
    dryRun,
    actions,
    requiredWorkers: dryRun.requiredWorkers,
    requiredAuditEvents: dryRun.requiredAuditEvents,
    backupRestorePolicy: dryRun.backupRestorePolicy,
    artifactPaths: retentionEnforcementArtifactPaths,
  };
}

export const retentionEnforcementRuntimeContract = buildRetentionEnforcementRuntimeReadinessPlan({
  packageScripts: ["test", "typecheck"],
  securityTestsPassed: false,
  securityTypecheckPassed: false,
  attorneyRetentionScheduleApproved: false,
  scheduledWorkerConfigured: false,
  workerIdempotencyConfigured: false,
  postgresRetentionExecutionVerified: false,
  objectStorageRetentionExecutionVerified: false,
  exportArtifactGenerationVerified: false,
  deletionTombstonePersistenceConfigured: true,
  anonymizationTombstonePersistenceConfigured: true,
  restoreTombstoneReplayVerified: false,
  backupRetentionPolicyDocumented: false,
  legalHoldEnforcementVerified: false,
  auditLogPersistenceConfigured: true,
  tenantIsolationIntegrationTestsPassed: false,
  dryRunToExecutionReconciliationVerified: false,
  destructiveActionRollbackDocumented: false,
});

export const retentionEnforcementPreview = buildRetentionEnforcementContract({
  records: [
    { id: "client_due", category: "client_profile", ageDays: 2600 },
    { id: "reference_due", category: "reference_file", ageDays: 1200 },
    { id: "payment_hold", category: "payment_record", ageDays: 3000, legalHoldActive: true },
    { id: "audit_hold", category: "audit_log", ageDays: 5000 },
  ],
  legalReviewApproved: false,
  databaseWorkerConfigured: false,
  storageWorkerConfigured: false,
  auditLogConfigured: false,
  backupPolicyDocumented: false,
  restorePolicyDocumented: false,
});

export const retentionScheduledWorkerPlanPreview = buildRetentionScheduledWorkerPlan({
  records: retentionEnforcementPreview.dryRun.steps.map((step) => ({
    id: step.recordId,
    category: step.category,
    ageDays: 0,
    legalHoldActive: step.action === "retain_legal_hold",
  })),
  legalReviewApproved: false,
  databaseWorkerConfigured: false,
  storageWorkerConfigured: false,
  auditLogConfigured: false,
  backupPolicyDocumented: false,
  restorePolicyDocumented: false,
});

export const retentionTombstonePersistencePreview = buildRetentionTombstonePersistenceContract({
  tenantId: "tenant_demo",
  privacyRequestId: "privacy_request_demo",
  workerRunId: "retention_run_demo",
  sourceRecordId: "reference_due",
  sourceRecordType: "FileAsset",
  category: "reference_file",
  action: "delete",
  reason: "Past retention window and no legal hold.",
  dryRunFingerprint: "sha256:redacted-dry-run",
  executedAt: "2026-06-09T00:20:00.000Z",
  restoreReplayAfter: "2026-06-09T00:20:00.000Z",
  storageObjectKey: "private/tenant_demo/reference/reference_due.jpg",
  legalHoldSkipped: false,
  rollbackNote: "Restore only after tombstone replay keeps deleted record inaccessible.",
});
