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

export interface RetentionEnforcementContractInput {
  records: readonly RetentionCandidateRecord[];
  legalReviewApproved: boolean;
  databaseWorkerConfigured: boolean;
  storageWorkerConfigured: boolean;
  auditLogConfigured: boolean;
  backupPolicyDocumented: boolean;
  restorePolicyDocumented: boolean;
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
  deletionTombstonePersistenceConfigured: false,
  anonymizationTombstonePersistenceConfigured: false,
  restoreTombstoneReplayVerified: false,
  backupRetentionPolicyDocumented: false,
  legalHoldEnforcementVerified: false,
  auditLogPersistenceConfigured: false,
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
