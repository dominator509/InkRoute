-- Add durable validator launch adoption run tracking.
CREATE TABLE "ValidatorLaunchAdoptionRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "schemaDomainEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "routeAdoptionEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "malformedPayloadEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "tenantScopeEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "sensitiveFieldEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "routeAdoptionReportPath" TEXT,
    "sensitiveFieldReportPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValidatorLaunchAdoptionRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ValidatorLaunchAdoptionRun_tenantId_runId_key" ON "ValidatorLaunchAdoptionRun"("tenantId", "runId");
CREATE INDEX "ValidatorLaunchAdoptionRun_tenantId_status_idx" ON "ValidatorLaunchAdoptionRun"("tenantId", "status");
CREATE INDEX "ValidatorLaunchAdoptionRun_commitSha_idx" ON "ValidatorLaunchAdoptionRun"("commitSha");

ALTER TABLE "ValidatorLaunchAdoptionRun" ADD CONSTRAINT "ValidatorLaunchAdoptionRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
