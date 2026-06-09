import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRetentionEnforcementContract,
  buildRetentionTombstonePersistenceContract,
  retentionEnforcementArtifactPaths,
  retentionEnforcementCommands,
  retentionEnforcementPreview,
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

  it("blocks runtime readiness until scheduled workers, tombstones, restore replay, legal holds, audits, tenant isolation, and rollback docs exist", () => {
    expect(retentionEnforcementRuntimeContract.status).toBe("blocked");
    expect(retentionEnforcementRuntimeContract.blockers).toEqual(
      expect.arrayContaining([
        "Attorney-approved retention, deletion, anonymization, export, and legal-hold schedule must be recorded.",
        "Scheduled retention worker must execute due DB and storage actions on an approved cadence.",
        "Deletion tombstones must persist tenant, record, category, action, reason, timestamp, and worker run identifiers.",
        "Restore jobs must replay deletion and anonymization tombstones before restored data becomes queryable.",
        "Tenant-isolation integration tests must deny cross-tenant retention, export, deletion, and restore actions.",
        "Rollback and incident response notes must exist for failed or accidental destructive retention actions.",
      ]),
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
    const ci = readWorkspaceFile(".github/workflows/ci.yml");
    const manifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
    const tracker = readWorkspaceFile("GAP_TRACKER.md");

    expect(securityDoc).toContain("Implement privacy request persistence, identity verification, export/delete/rectification workers, retention/legal holds, and audit logs.");
    expect(databaseSchema).toContain("restore");
    expect(retentionEnforcementCommands).toContain("node scripts/privacy/execute-retention-workers.mjs");
    expect(retentionEnforcementCommands).toContain("tenant-isolation retention integration test");
    expect(retentionEnforcementArtifactPaths).toContain("coverage/retention-backup-restore-tombstone-replay.json");
    expect(manifest).toContain("RetentionTombstone Prisma model and app row contract are wired");
    expect(ci).toContain("Run Phase 13 retention enforcement contracts");
    expect(ci).toContain("apps/web/tests/retention-enforcement-static.test.ts");
    expect(ci).toContain("retention-enforcement-artifacts");
    expect(manifest).toContain("unit-web-retention-enforcement-static");
    expect(tracker).toContain("apps/web/lib/retentionEnforcement.ts");
    expect(tracker).toContain("production retention worker proof remains open");
  });
});
