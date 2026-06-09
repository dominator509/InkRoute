-- CreateTable
CREATE TABLE "PrismaLifecycleRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "packageScriptManifest" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "sqlReviewManifest" JSONB NOT NULL,
    "driftCheckManifest" JSONB NOT NULL,
    "postgresProvisioned" BOOLEAN NOT NULL DEFAULT false,
    "databaseUrlConfigured" BOOLEAN NOT NULL DEFAULT false,
    "directUrlConfigured" BOOLEAN NOT NULL DEFAULT false,
    "prismaValidatePassed" BOOLEAN NOT NULL DEFAULT false,
    "prismaGeneratePassed" BOOLEAN NOT NULL DEFAULT false,
    "migrationGenerated" BOOLEAN NOT NULL DEFAULT false,
    "migrationSqlReviewed" BOOLEAN NOT NULL DEFAULT false,
    "migrationAppliedToDevDb" BOOLEAN NOT NULL DEFAULT false,
    "seedReadinessVerified" BOOLEAN NOT NULL DEFAULT false,
    "seedScriptPassed" BOOLEAN NOT NULL DEFAULT false,
    "destructiveProductionUrlGuarded" BOOLEAN NOT NULL DEFAULT false,
    "migrationDriftChecked" BOOLEAN NOT NULL DEFAULT false,
    "commandEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "validateArtifactPath" TEXT,
    "generateArtifactPath" TEXT,
    "migrateArtifactPath" TEXT,
    "seedReadinessArtifactPath" TEXT,
    "seedArtifactPath" TEXT,
    "sqlReviewArtifactPath" TEXT,
    "driftCheckArtifactPath" TEXT,
    "productionUrlGuardArtifactPath" TEXT,
    "ciDbLifecycleArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrismaLifecycleRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaLifecycleRun_tenantId_runId_key" ON "PrismaLifecycleRun"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "PrismaLifecycleRun_tenantId_status_idx" ON "PrismaLifecycleRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PrismaLifecycleRun_tenantId_createdAt_idx" ON "PrismaLifecycleRun"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "PrismaLifecycleRun" ADD CONSTRAINT "PrismaLifecycleRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
