-- CreateTable
CREATE TABLE "RequiredChecksRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "packageScriptMatrix" JSONB NOT NULL,
    "ciWorkflowTermMatrix" JSONB NOT NULL,
    "branchProtectionCheckMatrix" JSONB NOT NULL,
    "repositorySettingsMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "requiredChecksAuditPassed" BOOLEAN NOT NULL DEFAULT false,
    "qualityAllChainsRequiredChecks" BOOLEAN NOT NULL DEFAULT false,
    "branchProtectionEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "failingQualityPrBlocked" BOOLEAN NOT NULL DEFAULT false,
    "codeownersReviewActive" BOOLEAN NOT NULL DEFAULT false,
    "requiredPackageScriptsPresent" BOOLEAN NOT NULL DEFAULT false,
    "ciWorkflowTermsPresent" BOOLEAN NOT NULL DEFAULT false,
    "branchProtectionChecksConfigured" BOOLEAN NOT NULL DEFAULT false,
    "repositorySettingsConfigured" BOOLEAN NOT NULL DEFAULT false,
    "ciQualityJobPassed" BOOLEAN NOT NULL DEFAULT false,
    "redactedSettingsEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "requiredChecksAuditArtifactPath" TEXT,
    "qualityAllArtifactPath" TEXT,
    "branchProtectionArtifactPath" TEXT,
    "failingQualityPrArtifactPath" TEXT,
    "codeownersReviewArtifactPath" TEXT,
    "repositorySettingsArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequiredChecksRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequiredChecksRun_tenantId_runId_key" ON "RequiredChecksRun"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "RequiredChecksRun_tenantId_status_idx" ON "RequiredChecksRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "RequiredChecksRun_tenantId_createdAt_idx" ON "RequiredChecksRun"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "RequiredChecksRun" ADD CONSTRAINT "RequiredChecksRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
