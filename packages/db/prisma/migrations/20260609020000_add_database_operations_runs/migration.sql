CREATE TABLE "DatabaseOperationsRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "operationCheckMatrix" JSONB NOT NULL,
    "destructiveSqlScan" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "providerBranchProvisioned" BOOLEAN NOT NULL DEFAULT false,
    "secretStoreReferenceConfigured" BOOLEAN NOT NULL DEFAULT false,
    "verifierPassed" BOOLEAN NOT NULL DEFAULT false,
    "prismaGeneratePassed" BOOLEAN NOT NULL DEFAULT false,
    "prismaValidatePassed" BOOLEAN NOT NULL DEFAULT false,
    "migrationDryRunPassed" BOOLEAN NOT NULL DEFAULT false,
    "generatedSqlReviewed" BOOLEAN NOT NULL DEFAULT false,
    "destructiveSqlScanPassed" BOOLEAN NOT NULL DEFAULT false,
    "stagingMigrationApplied" BOOLEAN NOT NULL DEFAULT false,
    "seedPolicyVerified" BOOLEAN NOT NULL DEFAULT false,
    "backupRestoreDrillPassed" BOOLEAN NOT NULL DEFAULT false,
    "tenantIsolationSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "branchPromotionApproved" BOOLEAN NOT NULL DEFAULT false,
    "productionDataSafetyReviewed" BOOLEAN NOT NULL DEFAULT false,
    "ciDatabaseOperationsArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "providerBranchArtifactPath" TEXT,
    "migrationDryRunArtifactPath" TEXT,
    "destructiveSqlScanArtifactPath" TEXT,
    "backupRestoreArtifactPath" TEXT,
    "tenantIsolationArtifactPath" TEXT,
    "branchPromotionArtifactPath" TEXT,
    "productionDataSafetyArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatabaseOperationsRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DatabaseOperationsRun_tenantId_runId_key" ON "DatabaseOperationsRun"("tenantId", "runId");
CREATE INDEX "DatabaseOperationsRun_tenantId_status_idx" ON "DatabaseOperationsRun"("tenantId", "status");
CREATE INDEX "DatabaseOperationsRun_tenantId_createdAt_idx" ON "DatabaseOperationsRun"("tenantId", "createdAt");

ALTER TABLE "DatabaseOperationsRun" ADD CONSTRAINT "DatabaseOperationsRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
