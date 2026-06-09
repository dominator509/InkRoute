CREATE TABLE "ProductionLaunchEvidenceRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "launchBundleMatrix" JSONB NOT NULL,
    "checklistBlockers" JSONB NOT NULL,
    "unsafeEvidenceFindings" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "verifierPassed" BOOLEAN NOT NULL DEFAULT false,
    "ciBuildTestEvidenceVerified" BOOLEAN NOT NULL DEFAULT false,
    "databaseOperationsEvidenceVerified" BOOLEAN NOT NULL DEFAULT false,
    "providerSecretEvidenceVerified" BOOLEAN NOT NULL DEFAULT false,
    "securityPrivacyTrustEvidenceVerified" BOOLEAN NOT NULL DEFAULT false,
    "accessibilitySeoPerformanceVerified" BOOLEAN NOT NULL DEFAULT false,
    "mobileReleaseEvidenceVerified" BOOLEAN NOT NULL DEFAULT false,
    "legalApprovalVerified" BOOLEAN NOT NULL DEFAULT false,
    "rollbackOperationsEvidenceVerified" BOOLEAN NOT NULL DEFAULT false,
    "checklistBlockersRetained" BOOLEAN NOT NULL DEFAULT false,
    "unsafeEvidenceScanPassed" BOOLEAN NOT NULL DEFAULT false,
    "explicitProductionApprovalCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciLaunchEvidenceArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "launchEvidenceBundleArtifactPath" TEXT,
    "checklistBlockerArtifactPath" TEXT,
    "unsafeEvidenceArtifactPath" TEXT,
    "legalApprovalArtifactPath" TEXT,
    "rollbackOperationsArtifactPath" TEXT,
    "explicitApprovalArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionLaunchEvidenceRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductionLaunchEvidenceRun_tenantId_runId_key" ON "ProductionLaunchEvidenceRun"("tenantId", "runId");
CREATE INDEX "ProductionLaunchEvidenceRun_tenantId_status_idx" ON "ProductionLaunchEvidenceRun"("tenantId", "status");
CREATE INDEX "ProductionLaunchEvidenceRun_tenantId_createdAt_idx" ON "ProductionLaunchEvidenceRun"("tenantId", "createdAt");

ALTER TABLE "ProductionLaunchEvidenceRun" ADD CONSTRAINT "ProductionLaunchEvidenceRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
