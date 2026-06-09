-- Add durable seed runtime execution run tracking.
CREATE TABLE "SeedRuntimeExecutionRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "databaseProvisioningEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "prismaLifecycleEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "seedCommandEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "seededDomainQueryEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "appSmokeEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "commandTranscriptEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciCleanCheckoutEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "seededTenantSlug" TEXT,
    "commandTranscriptPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeedRuntimeExecutionRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SeedRuntimeExecutionRun_tenantId_runId_key" ON "SeedRuntimeExecutionRun"("tenantId", "runId");
CREATE INDEX "SeedRuntimeExecutionRun_tenantId_status_idx" ON "SeedRuntimeExecutionRun"("tenantId", "status");
CREATE INDEX "SeedRuntimeExecutionRun_commitSha_idx" ON "SeedRuntimeExecutionRun"("commitSha");

ALTER TABLE "SeedRuntimeExecutionRun" ADD CONSTRAINT "SeedRuntimeExecutionRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
