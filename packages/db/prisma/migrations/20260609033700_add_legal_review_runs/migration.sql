-- CreateTable
CREATE TABLE "LegalReviewRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "requiredReviewItemManifest" JSONB NOT NULL,
    "approvedReviewItemManifest" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "redactedEvidenceLabelManifest" JSONB NOT NULL,
    "launchBlockerManifest" JSONB NOT NULL,
    "legalReviewAuditPassed" BOOLEAN NOT NULL DEFAULT false,
    "redactedEvidenceLabelsPresent" BOOLEAN NOT NULL DEFAULT false,
    "privilegedAdviceExcluded" BOOLEAN NOT NULL DEFAULT false,
    "placeholderCopyReplacedAfterApproval" BOOLEAN NOT NULL DEFAULT false,
    "legalVerifyCommandPassed" BOOLEAN NOT NULL DEFAULT false,
    "ciQualityGateIncludesLegalReview" BOOLEAN NOT NULL DEFAULT false,
    "ciLegalEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "productionLaunchBlockedUntilApproval" BOOLEAN NOT NULL DEFAULT false,
    "qualifiedCounselApprovalCaptured" BOOLEAN NOT NULL DEFAULT false,
    "legalReviewAuditArtifactPath" TEXT,
    "qualityGatesArtifactPath" TEXT,
    "qualityAllArtifactPath" TEXT,
    "ciQualityJobArtifactPath" TEXT,
    "counselApprovalRedactedArtifactPath" TEXT,
    "placeholderReplacementArtifactPath" TEXT,
    "privilegedAdviceExclusionArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalReviewRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LegalReviewRun_tenantId_runId_key" ON "LegalReviewRun"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "LegalReviewRun_tenantId_status_idx" ON "LegalReviewRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "LegalReviewRun_tenantId_createdAt_idx" ON "LegalReviewRun"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "LegalReviewRun" ADD CONSTRAINT "LegalReviewRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
