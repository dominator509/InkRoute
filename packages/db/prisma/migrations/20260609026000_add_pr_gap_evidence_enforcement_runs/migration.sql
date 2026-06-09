CREATE TABLE "PrGapEvidenceEnforcementRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "fixtureMatrix" JSONB NOT NULL,
    "prAuditMatrix" JSONB NOT NULL,
    "branchProtectionEvidence" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "prGapAuditPassedWithoutContext" BOOLEAN NOT NULL DEFAULT false,
    "prGapAuditPassedWithMergeFallback" BOOLEAN NOT NULL DEFAULT false,
    "positiveFixturePassed" BOOLEAN NOT NULL DEFAULT false,
    "negativeFixtureFailed" BOOLEAN NOT NULL DEFAULT false,
    "productionBlockerDowngradeCovered" BOOLEAN NOT NULL DEFAULT false,
    "closedRowFixtureCovered" BOOLEAN NOT NULL DEFAULT false,
    "noSecretLogsVerified" BOOLEAN NOT NULL DEFAULT false,
    "ciPullRequestStepWired" BOOLEAN NOT NULL DEFAULT false,
    "branchProtectionRequiresQualityJob" BOOLEAN NOT NULL DEFAULT false,
    "liveFailingPrEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "livePassingPrEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "mergeBlockProofCaptured" BOOLEAN NOT NULL DEFAULT false,
    "fixtureArtifactPath" TEXT,
    "prGapAuditArtifactPath" TEXT,
    "branchProtectionArtifactPath" TEXT,
    "liveFailingPrArtifactPath" TEXT,
    "livePassingPrArtifactPath" TEXT,
    "secretSafeLogReviewArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrGapEvidenceEnforcementRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrGapEvidenceEnforcementRun_tenantId_runId_key" ON "PrGapEvidenceEnforcementRun"("tenantId", "runId");
CREATE INDEX "PrGapEvidenceEnforcementRun_tenantId_status_idx" ON "PrGapEvidenceEnforcementRun"("tenantId", "status");
CREATE INDEX "PrGapEvidenceEnforcementRun_tenantId_createdAt_idx" ON "PrGapEvidenceEnforcementRun"("tenantId", "createdAt");

ALTER TABLE "PrGapEvidenceEnforcementRun" ADD CONSTRAINT "PrGapEvidenceEnforcementRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
