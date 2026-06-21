import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRetentionEnforcementContract,
  buildRetentionEnforcementArtifactReview,
  buildRetentionEnforcementEvidenceDecision,
  buildRetentionEnforcementExecutionPlan,
  buildRetentionTombstonePersistenceContract,
  buildRedactedRetentionEnforcementArtifact,
  retentionEnforcementArtifactPaths,
  retentionEnforcementCommands,
  retentionEnforcementExternalArtifacts,
  retentionEnforcementExternalCommands,
  retentionEnforcementExecutionPolicy,
  retentionEnforcementLocalArtifacts,
  retentionEnforcementLocalCommands,
  retentionEnforcementProofFiles,
  retentionEnforcementPreview,
  retentionEnforcementRequiredExternalEvidence,
  retentionEnforcementRuntimeContract,
  retentionTombstonePersistencePreview,
} from "../lib/retentionEnforcement";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("GAP-099 retention enforcement contract", () => {
  it("builds scheduled DB/storage retention actions from package dry-run decisions", () => {
    const source = readWorkspaceFile("apps/web/lib/retentionEnforcement.ts");

    expect(source).toContain("buildRetentionEnforcementDryRun");
    expect(source).toContain("buildRetentionEnforcementRuntimeReadinessPlan");
    expect(source).toContain("load-due-retention-candidates");
    expect(source).toContain("run-database-retention-worker");
    expect(source).toContain("run-storage-retention-worker");
    expect(source).toContain("generate-export-artifact");
    expect(source).toContain("persist-deletion-tombstone");
    expect(source).toContain("persist-anonymization-tombstone");
    expect(source).toContain("skip-legal-hold-record");
    expect(source).toContain("replay-tombstones-after-restore");
    expect(source).toContain("attach-destructive-action-rollback-note");
    expect(retentionEnforcementPreview.dryRun.status).toBe("blocked");
    expect(retentionEnforcementPreview.requiredWorkers).toEqual(
      expect.arrayContaining(["database-retention", "storage-retention", "privacy-export", "audit-log", "backup-restore-reconciliation"]),
    );
  });

  it("classifies due deletes, anonymizations, legal holds, and restore replay implications", () => {
    const contract = buildRetentionEnforcementContract({
      records: [
        { id: "message_due", category: "message", ageDays: 1200 },
        { id: "reference_due", category: "reference_file", ageDays: 1200 },
        { id: "payment_hold", category: "payment_record", ageDays: 3000, legalHoldActive: true },
        { id: "audit_hold", category: "audit_log", ageDays: 5000 },
      ],
      legalReviewApproved: true,
      databaseWorkerConfigured: true,
      storageWorkerConfigured: true,
      auditLogConfigured: true,
      backupPolicyDocumented: true,
      restorePolicyDocumented: true,
    });

    expect(contract.dryRun.status).toBe("ready");
    expect(contract.dryRun.steps.map((step) => [step.recordId, step.action, step.blocked])).toEqual(
      expect.arrayContaining([
        ["message_due", "anonymize", false],
        ["reference_due", "delete", false],
        ["payment_hold", "retain_legal_hold", false],
        ["audit_hold", "retain_legal_hold", false],
      ]),
    );
    expect(contract.requiredAuditEvents).toEqual(
      expect.arrayContaining(["retention:message:anonymize:message_due", "retention:reference_file:delete:reference_due"]),
    );
    expect(contract.backupRestorePolicy.implication).toContain("tombstones");
  });

  it("pins durable retention tombstones, dry-run reconciliation keys, restore replay, and redacted audit writes", () => {
    const schema = readWorkspaceFile("packages/db/prisma/schema.prisma");
    const contract = buildRetentionTombstonePersistenceContract({
      tenantId: "tenant_demo",
      privacyRequestId: "privacy_request_demo",
      workerRunId: "retention_run_demo",
      sourceRecordId: "message_due",
      sourceRecordType: "Message",
      category: "message",
      action: "anonymize",
      reason: "Past retention window.",
      dryRunFingerprint: "sha256:redacted-dry-run",
      executedAt: "2026-06-09T00:20:00.000Z",
      restoreReplayAfter: "2026-06-09T00:20:00.000Z",
      legalHoldSkipped: false,
      rollbackNote: "Restore replay must apply tombstone before restored messages are queryable.",
    });

    expect(schema).toContain("model RetentionTombstone");
    expect(schema).toContain("dryRunFingerprint");
    expect(schema).toContain("restoreReplayAfter");
    expect(schema).toContain("@@index([tenantId, sourceRecordType, sourceRecordId])");
    expect(contract.transactionWrites).toEqual(["RetentionTombstone", "AuditLog"]);
    expect(contract.reconciliationKeys).toContain("dryRunFingerprint");
    expect(contract.restoreReplayGate).toBe("restore_replay_after_before_queryable");
    expect(contract.redactedFields).toContain("storageObjectKey");
    expect(contract.tenantIsolationKey).toBe("tenantId");
    expect(retentionTombstonePersistencePreview.modelName).toBe("RetentionTombstone");
  });

  it("blocks runtime readiness until scheduled workers, restore replay, legal holds, tenant isolation, and rollback docs exist", () => {
    expect(retentionEnforcementRuntimeContract.status).toBe("blocked");
    expect(retentionEnforcementRuntimeContract.blockers).toEqual(
      expect.arrayContaining([
        "Attorney-approved retention, deletion, anonymization, export, and legal-hold schedule must be recorded.",
        "Scheduled retention worker must execute due DB and storage actions on an approved cadence.",
        "Restore jobs must replay deletion and anonymization tombstones before restored data becomes queryable.",
        "Tenant-isolation integration tests must deny cross-tenant retention, export, deletion, and restore actions.",
        "Rollback and incident response notes must exist for failed or accidental destructive retention actions.",
      ]),
    );
    expect(retentionEnforcementRuntimeContract.blockers).not.toContain(
      "Deletion tombstones must persist tenant, record, category, action, reason, timestamp, and worker run identifiers.",
    );
    expect(retentionEnforcementRuntimeContract.blockers).not.toContain(
      "Retention AuditLog persistence must cover dry-run, execution, legal-hold skip, export, delete, anonymize, restore replay, and rollback actions.",
    );
    expect(retentionEnforcementRuntimeContract.requiredCommands).toEqual(
      expect.arrayContaining([
        "node scripts/privacy/run-retention-dry-run.mjs",
        "node scripts/privacy/execute-retention-workers.mjs",
        "node scripts/privacy/verify-backup-restore-tombstones.mjs",
      ]),
    );
  });

  it("pins docs, CI, manifest, tracker, commands, and artifact paths for GAP-099", () => {
    const securityDoc = readWorkspaceFile("SECURITY.md");
    const databaseSchema = readWorkspaceFile("DATABASE_SCHEMA.md");
    const dryRunScript = readWorkspaceFile("scripts/privacy/run-retention-dry-run.mjs");
    const workerScript = readWorkspaceFile("scripts/privacy/execute-retention-workers.mjs");
    const restoreScript = readWorkspaceFile("scripts/privacy/verify-backup-restore-tombstones.mjs");
    const ci = readWorkspaceFile(".github/workflows/ci.yml");
    const manifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
    const tracker = readWorkspaceFile("GAP_TRACKER.md");

    expect(securityDoc).toContain("Implement privacy request persistence, identity verification, export/delete/rectification workers, retention/legal holds, and audit logs.");
    expect(databaseSchema).toContain("restore");
    expect(retentionEnforcementCommands).toContain("node scripts/privacy/execute-retention-workers.mjs");
    expect(retentionEnforcementCommands).toContain("tenant-isolation retention integration test");
    expect(dryRunScript).toContain("coverage/retention-enforcement-dry-run.json");
    expect(workerScript).toContain("coverage/retention-scheduled-worker.json");
    expect(restoreScript).toContain("coverage/retention-backup-restore-tombstone-replay.json");
    expect(retentionEnforcementArtifactPaths).toContain("coverage/retention-enforcement-dry-run.json");
    expect(retentionEnforcementArtifactPaths).toContain("coverage/retention-scheduled-worker.json");
    expect(retentionEnforcementArtifactPaths).toContain("coverage/retention-backup-restore-tombstone-replay.json");
    expect(manifest).toContain("RetentionTombstone Prisma model and app row contract are wired");
    expect(ci).toContain("Run Phase 13 retention enforcement contracts");
    expect(ci).toContain("apps/web/tests/retention-enforcement-static.test.ts");
    expect(ci).toContain("retention-enforcement-artifacts");
    expect(manifest).toContain("unit-web-retention-enforcement-static");
    expect(tracker).toContain("apps/web/lib/retentionEnforcement.ts");
    expect(tracker).toContain("Retention enforcement evidence classifier wired and worker proof gated");
    expect(tracker).toContain("retentionEnforcementLocalArtifacts");
    expect(tracker).toContain("retentionEnforcementExternalArtifacts");
  });

  it("pins current retention enforcement proof files for GAP-099", () => {
    expect(retentionEnforcementProofFiles).toEqual(
      expect.arrayContaining([
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
      ]),
    );
    for (const file of retentionEnforcementProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("classifies GAP-099 evidence as blocked until scheduled retention execution proof is captured", () => {
    const blockedDecision = buildRetentionEnforcementEvidenceDecision({
      packageRetentionHelpersPassed: true,
      dryRunCaptured: true,
      scheduledWorkerCaptured: false,
      postgresExecutionCaptured: false,
      objectStorageExecutionCaptured: false,
      exportArtifactCaptured: true,
      deletionTombstoneCaptured: true,
      anonymizationTombstoneCaptured: false,
      legalHoldSkipCaptured: true,
      auditLogPersistenceCaptured: false,
      backupRestoreReplayCaptured: false,
      destructiveRollbackDocumented: false,
      tenantIsolationCaptured: false,
      requiredCommandsRun: retentionEnforcementCommands.filter(
        (command) =>
          command !== "node scripts/privacy/execute-retention-workers.mjs" &&
          command !== "node scripts/privacy/verify-backup-restore-tombstones.mjs" &&
          command !== "tenant-isolation retention integration test",
      ),
      capturedArtifacts: [
        "coverage/retention-enforcement-dry-run.json",
        "coverage/retention-export-artifacts-redacted.json",
        "coverage/retention-deletion-tombstones.json",
        "coverage/retention-legal-hold-skips.json",
        "test-results/retention-enforcement",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Capture scheduled retention worker execution evidence.",
        "Capture Postgres delete/anonymize/export execution evidence.",
        "Capture object-storage delete/export execution evidence.",
        "Capture anonymization tombstone persistence evidence.",
        "Capture backup/restore tombstone replay evidence.",
        "Document destructive-action rollback evidence.",
        "Capture tenant-isolation retention integration evidence.",
        "Required command not recorded: node scripts/privacy/execute-retention-workers.mjs",
        "Required command not recorded: node scripts/privacy/verify-backup-restore-tombstones.mjs",
        "Required command not recorded: tenant-isolation retention integration test",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/retention-scheduled-worker.json",
        "coverage/retention-postgres-execution.json",
        "coverage/retention-object-storage-execution.json",
        "coverage/retention-backup-restore-tombstone-replay.json",
        "coverage/retention-destructive-rollback.md",
      ]),
    );
    expect(blockedDecision.destructiveActionPolicy).toEqual({
      dryRunMustMatchExecution: true,
      tombstonesReplayBeforeRestoreQueryable: true,
      rollbackNotesRequired: true,
    });

    const completeDecision = buildRetentionEnforcementEvidenceDecision({
      packageRetentionHelpersPassed: true,
      dryRunCaptured: true,
      scheduledWorkerCaptured: true,
      postgresExecutionCaptured: true,
      objectStorageExecutionCaptured: true,
      exportArtifactCaptured: true,
      deletionTombstoneCaptured: true,
      anonymizationTombstoneCaptured: true,
      legalHoldSkipCaptured: true,
      auditLogPersistenceCaptured: true,
      backupRestoreReplayCaptured: true,
      destructiveRollbackDocumented: true,
      tenantIsolationCaptured: true,
      requiredCommandsRun: retentionEnforcementCommands,
      capturedArtifacts: retentionEnforcementArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(retentionEnforcementCommands);
    expect(completeDecision.requiredEvidence).toBe(retentionEnforcementArtifactPaths);
  });

  it("keeps GAP-099 destructive retention execution disabled in the local plan", () => {
    const plan = buildRetentionEnforcementExecutionPlan();

    expect(plan.scheduledWorkerExecutionAllowed).toBe(false);
    expect(plan.postgresExecutionAllowed).toBe(false);
    expect(plan.objectStorageExecutionAllowed).toBe(false);
    expect(plan.backupRestoreReplayExecutionAllowed).toBe(false);
    expect(plan.destructiveRollbackExecutionAllowed).toBe(false);
    expect(plan.tenantIsolationExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(retentionEnforcementExecutionPolicy);
    expect(plan.externalEvidenceRequired).toBe(retentionEnforcementRequiredExternalEvidence);
    expect(retentionEnforcementExecutionPolicy.externalEvidenceRequired).toBe(retentionEnforcementRequiredExternalEvidence);
    expect(retentionEnforcementRequiredExternalEvidence).toEqual(expect.arrayContaining([
      "Scheduled retention worker execution evidence",
      "Postgres delete/anonymize/export integration evidence",
      "Object-storage retention/delete integration evidence",
      "Backup/restore tombstone replay evidence",
      "Tenant-isolation retention integration evidence",
    ]));
    expect(plan.localCommands).toBe(retentionEnforcementLocalCommands);
    expect(plan.externalCommands).toBe(retentionEnforcementExternalCommands);
    expect(plan.localArtifacts).toBe(retentionEnforcementLocalArtifacts);
    expect(plan.externalArtifacts).toBe(retentionEnforcementExternalArtifacts);
    expect(plan.localArtifacts).toEqual([
      "coverage/retention-enforcement-dry-run.json",
      "coverage/retention-export-artifacts-redacted.json",
      "coverage/retention-deletion-tombstones.json",
      "coverage/retention-legal-hold-skips.json",
      "test-results/retention-enforcement",
    ]);
    expect(plan.externalArtifacts).toEqual(expect.arrayContaining([
      "coverage/retention-scheduled-worker.json",
      "coverage/retention-postgres-execution.json",
      "coverage/retention-object-storage-execution.json",
      "coverage/retention-backup-restore-tombstone-replay.json",
      "coverage/retention-destructive-rollback.md",
    ]));
    expect(plan.disabledReasons.join(" ")).toContain("Scheduled worker execution requires production-like scheduler");
  });

  it("redacts GAP-099 retention dry-run, tombstone, storage, and rollback artifacts before review", () => {
    const rawArtifact = {
      workerRunId: "retention-run-private",
      dryRunFingerprint: "sha256:private-fingerprint",
      storageObjectKey: "private/tenant_demo/reference/reference_due.jpg",
      exportArtifact: "privacy/tenant_demo/export.zip",
      rollbackNote: "Restore client@example.com after manual approval",
      contact: "client@example.com +1 555 222 3333",
      headers: ["Authorization: Bearer retention-secret-token"],
      stack: "Error: retention worker failed",
    };

    const redacted = buildRedactedRetentionEnforcementArtifact(rawArtifact);
    const review = buildRetentionEnforcementArtifactReview(rawArtifact);
    const serialized = JSON.stringify({ redacted, review });

    expect(serialized).not.toContain("retention-run-private");
    expect(serialized).not.toContain("sha256:private-fingerprint");
    expect(serialized).not.toContain("private/tenant_demo/reference/reference_due.jpg");
    expect(serialized).not.toContain("privacy/tenant_demo/export.zip");
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("+1 555 222 3333");
    expect(serialized).not.toContain("retention-secret-token");
    expect(serialized).toContain("[REDACTED]");
    expect(review.requiredArtifacts).toBe(retentionEnforcementArtifactPaths);
    expect(review.retainedExternalGates).toEqual(expect.arrayContaining([
      "Scheduled retention worker execution evidence",
      "Backup/restore tombstone replay evidence",
      "Tenant-isolation retention integration evidence",
    ]));
  });
});

