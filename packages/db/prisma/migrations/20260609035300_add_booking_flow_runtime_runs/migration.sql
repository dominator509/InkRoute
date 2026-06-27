-- Add durable booking flow runtime run tracking.
CREATE TABLE "BookingFlowRuntimeRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "dependencyInstallEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "prismaGenerationEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "webTypecheckBuildEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "routeRuntimeSmokeEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "browserSmokeEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "databaseSmokeEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "providerBoundaryEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "routeSmokeReportPath" TEXT,
    "browserSmokeReportPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingFlowRuntimeRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BookingFlowRuntimeRun_tenantId_runId_key" ON "BookingFlowRuntimeRun"("tenantId", "runId");
CREATE INDEX "BookingFlowRuntimeRun_tenantId_status_idx" ON "BookingFlowRuntimeRun"("tenantId", "status");
CREATE INDEX "BookingFlowRuntimeRun_commitSha_idx" ON "BookingFlowRuntimeRun"("commitSha");

ALTER TABLE "BookingFlowRuntimeRun" ADD CONSTRAINT "BookingFlowRuntimeRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
