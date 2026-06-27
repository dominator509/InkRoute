-- Add durable booking/contact runtime run tracking.
CREATE TABLE "BookingContactRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "databasePersistenceEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "tenantIsolationEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "providerHandoffEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "noLivePaymentEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "apiE2eEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "browserE2eEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "webBuildEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "e2eReportPath" TEXT,
    "providerBoundaryReportPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingContactRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BookingContactRun_tenantId_runId_key" ON "BookingContactRun"("tenantId", "runId");
CREATE INDEX "BookingContactRun_tenantId_status_idx" ON "BookingContactRun"("tenantId", "status");
CREATE INDEX "BookingContactRun_commitSha_idx" ON "BookingContactRun"("commitSha");

ALTER TABLE "BookingContactRun" ADD CONSTRAINT "BookingContactRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
