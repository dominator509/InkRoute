-- Add durable domain event/audit transaction run tracking.
CREATE TABLE "DomainEventAuditRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "transactionServiceEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "repositoryEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "atomicityEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "eventAuditPersistenceEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "idempotencyReplayEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "rollbackEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "denialEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "databaseCiEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "transactionReportPath" TEXT,
    "idempotencyReportPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainEventAuditRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DomainEventAuditRun_tenantId_runId_key" ON "DomainEventAuditRun"("tenantId", "runId");
CREATE INDEX "DomainEventAuditRun_tenantId_status_idx" ON "DomainEventAuditRun"("tenantId", "status");
CREATE INDEX "DomainEventAuditRun_commitSha_idx" ON "DomainEventAuditRun"("commitSha");

ALTER TABLE "DomainEventAuditRun" ADD CONSTRAINT "DomainEventAuditRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
