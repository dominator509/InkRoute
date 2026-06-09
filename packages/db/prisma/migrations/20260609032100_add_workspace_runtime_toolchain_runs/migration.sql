-- CreateTable
CREATE TABLE "WorkspaceRuntimeToolchainRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "generatedReportManifest" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "productionBlockerManifest" JSONB NOT NULL,
    "toolchainAuditPassed" BOOLEAN NOT NULL DEFAULT false,
    "packageTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "packageTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "workspaceToolchainPassed" BOOLEAN NOT NULL DEFAULT false,
    "workspaceAllPassed" BOOLEAN NOT NULL DEFAULT false,
    "dependencyInstallEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "webBuildEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "dashboardBuildEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciWorkspaceJobPassed" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "productionBlockersVisible" BOOLEAN NOT NULL DEFAULT false,
    "packageTypecheckArtifactPath" TEXT,
    "packageTestArtifactPath" TEXT,
    "workspaceToolchainArtifactPath" TEXT,
    "workspaceAllArtifactPath" TEXT,
    "dependencyInstallArtifactPath" TEXT,
    "webBuildArtifactPath" TEXT,
    "dashboardBuildArtifactPath" TEXT,
    "ciWorkspaceJobArtifactPath" TEXT,
    "productionBlockerArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceRuntimeToolchainRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceRuntimeToolchainRun_tenantId_runId_key" ON "WorkspaceRuntimeToolchainRun"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "WorkspaceRuntimeToolchainRun_tenantId_status_idx" ON "WorkspaceRuntimeToolchainRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "WorkspaceRuntimeToolchainRun_tenantId_createdAt_idx" ON "WorkspaceRuntimeToolchainRun"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "WorkspaceRuntimeToolchainRun" ADD CONSTRAINT "WorkspaceRuntimeToolchainRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
