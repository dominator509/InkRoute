-- Add durable release launch control run tracking.
CREATE TABLE "ReleaseLaunchControlRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "persistenceEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "governanceEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "migrationGateEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "rollbackEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "mobileGovernanceEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciArtifactEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "releaseHealthEnvelopePath" TEXT,
    "rollbackDrillArtifactPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReleaseLaunchControlRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReleaseLaunchControlRun_tenantId_runId_key" ON "ReleaseLaunchControlRun"("tenantId", "runId");
CREATE INDEX "ReleaseLaunchControlRun_tenantId_status_idx" ON "ReleaseLaunchControlRun"("tenantId", "status");
CREATE INDEX "ReleaseLaunchControlRun_commitSha_idx" ON "ReleaseLaunchControlRun"("commitSha");

ALTER TABLE "ReleaseLaunchControlRun" ADD CONSTRAINT "ReleaseLaunchControlRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
