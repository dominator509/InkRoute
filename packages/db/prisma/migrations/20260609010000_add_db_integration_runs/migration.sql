CREATE TABLE "DbIntegrationRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "runtimeMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "nonProductionPostgresProvisioned" BOOLEAN NOT NULL DEFAULT false,
    "databaseUrlConfigured" BOOLEAN NOT NULL DEFAULT false,
    "directUrlConfigured" BOOLEAN NOT NULL DEFAULT false,
    "prismaValidatePassed" BOOLEAN NOT NULL DEFAULT false,
    "prismaGeneratePassed" BOOLEAN NOT NULL DEFAULT false,
    "prismaMigratePassed" BOOLEAN NOT NULL DEFAULT false,
    "prismaSeedPassed" BOOLEAN NOT NULL DEFAULT false,
    "seedVerificationPassed" BOOLEAN NOT NULL DEFAULT false,
    "tenantIsolationPassed" BOOLEAN NOT NULL DEFAULT false,
    "workflowPersistencePassed" BOOLEAN NOT NULL DEFAULT false,
    "auditLogIntegrationPassed" BOOLEAN NOT NULL DEFAULT false,
    "destructiveResetGuarded" BOOLEAN NOT NULL DEFAULT false,
    "rollbackDocumented" BOOLEAN NOT NULL DEFAULT false,
    "redactedTranscriptPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DbIntegrationRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DbIntegrationRun_tenantId_runId_key" ON "DbIntegrationRun"("tenantId", "runId");
CREATE INDEX "DbIntegrationRun_tenantId_status_idx" ON "DbIntegrationRun"("tenantId", "status");
CREATE INDEX "DbIntegrationRun_tenantId_createdAt_idx" ON "DbIntegrationRun"("tenantId", "createdAt");

ALTER TABLE "DbIntegrationRun" ADD CONSTRAINT "DbIntegrationRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;