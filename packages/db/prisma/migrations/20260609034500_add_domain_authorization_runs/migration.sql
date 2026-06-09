-- Add durable domain authorization run tracking.
CREATE TABLE "DomainAuthorizationRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "providerSessionEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "customRoleEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "routeGuardEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "roleMatrixEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "fieldRedactionEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "auditLogEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "csrfRevocationEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "routeGuardReportPath" TEXT,
    "auditLogReportPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainAuthorizationRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DomainAuthorizationRun_tenantId_runId_key" ON "DomainAuthorizationRun"("tenantId", "runId");
CREATE INDEX "DomainAuthorizationRun_tenantId_status_idx" ON "DomainAuthorizationRun"("tenantId", "status");
CREATE INDEX "DomainAuthorizationRun_commitSha_idx" ON "DomainAuthorizationRun"("commitSha");

ALTER TABLE "DomainAuthorizationRun" ADD CONSTRAINT "DomainAuthorizationRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
