-- CreateTable
CREATE TABLE "WorkspaceRequiredChecksRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "branchProtectionCheckMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "mergeBlockProofManifest" JSONB NOT NULL,
    "redactedLogManifest" JSONB NOT NULL,
    "requiredChecksAuditPassed" BOOLEAN NOT NULL DEFAULT false,
    "workspaceRequiredChecksPassed" BOOLEAN NOT NULL DEFAULT false,
    "workspaceAllPassed" BOOLEAN NOT NULL DEFAULT false,
    "qualityRequiredChecksPassed" BOOLEAN NOT NULL DEFAULT false,
    "ciQualityJobPassed" BOOLEAN NOT NULL DEFAULT false,
    "branchProtectionEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "branchProtectionChecksConfigured" BOOLEAN NOT NULL DEFAULT false,
    "failingWorkspaceAuditBlocksMerge" BOOLEAN NOT NULL DEFAULT false,
    "prGapDiffCheckBlocksMerge" BOOLEAN NOT NULL DEFAULT false,
    "evidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "logsRedacted" BOOLEAN NOT NULL DEFAULT false,
    "workspaceRequiredChecksArtifactPath" TEXT,
    "workspaceAllArtifactPath" TEXT,
    "qualityRequiredChecksArtifactPath" TEXT,
    "ciQualityArtifactPath" TEXT,
    "branchProtectionArtifactPath" TEXT,
    "failingWorkspacePrArtifactPath" TEXT,
    "failingPrGapDiffArtifactPath" TEXT,
    "redactedLogsArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceRequiredChecksRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceRequiredChecksRun_tenantId_runId_key" ON "WorkspaceRequiredChecksRun"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "WorkspaceRequiredChecksRun_tenantId_status_idx" ON "WorkspaceRequiredChecksRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "WorkspaceRequiredChecksRun_tenantId_createdAt_idx" ON "WorkspaceRequiredChecksRun"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "WorkspaceRequiredChecksRun" ADD CONSTRAINT "WorkspaceRequiredChecksRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
