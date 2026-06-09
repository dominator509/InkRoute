-- Add durable booking persistence API run tracking.
CREATE TABLE "BookingPersistenceApiRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "routeContractEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "webTypecheckBuildEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "prismaGenerationEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "databaseTransactionEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "nextRouteSmokeEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "providerBoundaryEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "transactionSmokeReportPath" TEXT,
    "nextRouteSmokeReportPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingPersistenceApiRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BookingPersistenceApiRun_tenantId_runId_key" ON "BookingPersistenceApiRun"("tenantId", "runId");
CREATE INDEX "BookingPersistenceApiRun_tenantId_status_idx" ON "BookingPersistenceApiRun"("tenantId", "status");
CREATE INDEX "BookingPersistenceApiRun_commitSha_idx" ON "BookingPersistenceApiRun"("commitSha");

ALTER TABLE "BookingPersistenceApiRun" ADD CONSTRAINT "BookingPersistenceApiRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
