-- CreateTable
CREATE TABLE "StaticDependencyAuditRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "coverageAreaManifest" JSONB NOT NULL,
    "locallyVerifiedAudit" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "peerVersionReviewManifest" JSONB NOT NULL,
    "workspaceImportAuditPassed" BOOLEAN NOT NULL DEFAULT false,
    "workspacePackageTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "workspacePackageTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "dependencyInstallEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "workspaceTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "webBuildEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "dashboardBuildEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciWorkspaceResolutionPassed" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "peerVersionReviewCaptured" BOOLEAN NOT NULL DEFAULT false,
    "runtimeResolutionProofCaptured" BOOLEAN NOT NULL DEFAULT false,
    "workspaceImportAuditArtifactPath" TEXT,
    "workspacePackageTestArtifactPath" TEXT,
    "workspacePackageTypecheckArtifactPath" TEXT,
    "dependencyInstallArtifactPath" TEXT,
    "workspaceTypecheckArtifactPath" TEXT,
    "webBuildArtifactPath" TEXT,
    "dashboardBuildArtifactPath" TEXT,
    "ciWorkspaceResolutionArtifactPath" TEXT,
    "peerVersionReviewArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaticDependencyAuditRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaticDependencyAuditRun_tenantId_runId_key" ON "StaticDependencyAuditRun"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "StaticDependencyAuditRun_tenantId_status_idx" ON "StaticDependencyAuditRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "StaticDependencyAuditRun_tenantId_createdAt_idx" ON "StaticDependencyAuditRun"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "StaticDependencyAuditRun" ADD CONSTRAINT "StaticDependencyAuditRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
