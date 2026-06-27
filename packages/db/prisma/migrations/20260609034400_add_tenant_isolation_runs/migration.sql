-- Add durable tenant isolation run tracking.
CREATE TABLE "TenantIsolationRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "databaseLifecycleEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "repositoryAdoptionEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "tenantOwnedModelCoverageCaptured" BOOLEAN NOT NULL DEFAULT false,
    "crossTenantDenialEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "missingTenantRejectionEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "auditRowEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "fixtureCleanupEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "modelCoverageReportPath" TEXT,
    "denialMatrixReportPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantIsolationRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TenantIsolationRun_tenantId_runId_key" ON "TenantIsolationRun"("tenantId", "runId");
CREATE INDEX "TenantIsolationRun_tenantId_status_idx" ON "TenantIsolationRun"("tenantId", "status");
CREATE INDEX "TenantIsolationRun_commitSha_idx" ON "TenantIsolationRun"("commitSha");

ALTER TABLE "TenantIsolationRun" ADD CONSTRAINT "TenantIsolationRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
