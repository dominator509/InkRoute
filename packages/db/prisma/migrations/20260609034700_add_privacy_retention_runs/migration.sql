-- Add durable privacy retention run tracking.
CREATE TABLE "PrivacyRetentionRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "attorneyApprovalEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "workerPersistenceEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "prismaDryRunEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "objectStorageDryRunEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "tenantIsolationEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "legalHoldEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "tombstoneReplayEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "retentionReportPath" TEXT,
    "tombstoneReplayReportPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivacyRetentionRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrivacyRetentionRun_tenantId_runId_key" ON "PrivacyRetentionRun"("tenantId", "runId");
CREATE INDEX "PrivacyRetentionRun_tenantId_status_idx" ON "PrivacyRetentionRun"("tenantId", "status");
CREATE INDEX "PrivacyRetentionRun_commitSha_idx" ON "PrivacyRetentionRun"("commitSha");

ALTER TABLE "PrivacyRetentionRun" ADD CONSTRAINT "PrivacyRetentionRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
