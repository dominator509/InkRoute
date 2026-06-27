CREATE TABLE "RetentionTombstone" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "privacyRequestId" TEXT,
    "workerRunId" TEXT NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "sourceRecordType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "dryRunFingerprint" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL,
    "restoreReplayAfter" TIMESTAMP(3),
    "storageObjectKey" TEXT,
    "redactedFields" JSONB,
    "auditLogIds" JSONB,
    "legalHoldSkipped" BOOLEAN NOT NULL DEFAULT false,
    "rollbackNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetentionTombstone_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RetentionTombstone_tenantId_workerRunId_idx" ON "RetentionTombstone"("tenantId", "workerRunId");
CREATE INDEX "RetentionTombstone_tenantId_sourceRecordType_sourceRecordId_idx" ON "RetentionTombstone"("tenantId", "sourceRecordType", "sourceRecordId");
CREATE INDEX "RetentionTombstone_tenantId_category_idx" ON "RetentionTombstone"("tenantId", "category");
CREATE INDEX "RetentionTombstone_tenantId_restoreReplayAfter_idx" ON "RetentionTombstone"("tenantId", "restoreReplayAfter");

ALTER TABLE "RetentionTombstone" ADD CONSTRAINT "RetentionTombstone_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;