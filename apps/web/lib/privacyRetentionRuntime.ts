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
