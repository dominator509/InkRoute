CREATE TABLE "LaunchOperationsRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "ownerCoverageMatrix" JSONB NOT NULL,
    "operationCheckMatrix" JSONB NOT NULL,
    "unsafeEvidenceFindings" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "verifierPassed" BOOLEAN NOT NULL DEFAULT false,
    "namedPrimaryBackupOwnersAssigned" BOOLEAN NOT NULL DEFAULT false,
    "onCallCoverageVerified" BOOLEAN NOT NULL DEFAULT false,
    "alertRoutingTestPassed" BOOLEAN NOT NULL DEFAULT false,
    "supportEscalationDrillPassed" BOOLEAN NOT NULL DEFAULT false,
    "privacyRequestDrillPassed" BOOLEAN NOT NULL DEFAULT false,
    "incidentDrillPassed" BOOLEAN NOT NULL DEFAULT false,
    "rollbackDrillPassed" BOOLEAN NOT NULL DEFAULT false,
    "productionMonitoringVerified" BOOLEAN NOT NULL DEFAULT false,
    "communicationsTemplatesApproved" BOOLEAN NOT NULL DEFAULT false,
    "unsafeEvidenceScanPassed" BOOLEAN NOT NULL DEFAULT false,
    "explicitOperationsApprovalCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciLaunchOperationsArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ownerCoverageArtifactPath" TEXT,
    "alertRoutingArtifactPath" TEXT,
    "supportEscalationArtifactPath" TEXT,
    "privacyRequestDrillArtifactPath" TEXT,
    "incidentDrillArtifactPath" TEXT,
    "rollbackDrillArtifactPath" TEXT,
    "monitoringDashboardArtifactPath" TEXT,
    "communicationsTemplateArtifactPath" TEXT,
    "operationsApprovalArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaunchOperationsRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LaunchOperationsRun_tenantId_runId_key" ON "LaunchOperationsRun"("tenantId", "runId");
CREATE INDEX "LaunchOperationsRun_tenantId_status_idx" ON "LaunchOperationsRun"("tenantId", "status");
CREATE INDEX "LaunchOperationsRun_tenantId_createdAt_idx" ON "LaunchOperationsRun"("tenantId", "createdAt");

ALTER TABLE "LaunchOperationsRun" ADD CONSTRAINT "LaunchOperationsRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
