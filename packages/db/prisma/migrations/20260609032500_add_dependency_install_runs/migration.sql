-- CreateTable
CREATE TABLE "DependencyInstallRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "sourceFileManifest" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "productionBlockerManifest" JSONB NOT NULL,
    "packageJsonPresent" BOOLEAN NOT NULL DEFAULT false,
    "pnpmWorkspacePresent" BOOLEAN NOT NULL DEFAULT false,
    "pnpmLockfilePresent" BOOLEAN NOT NULL DEFAULT false,
    "packageManagerPinned" BOOLEAN NOT NULL DEFAULT false,
    "lockfileCommitted" BOOLEAN NOT NULL DEFAULT false,
    "corepackEnabled" BOOLEAN NOT NULL DEFAULT false,
    "installCommandPassed" BOOLEAN NOT NULL DEFAULT false,
    "frozenLockfileInstallPassed" BOOLEAN NOT NULL DEFAULT false,
    "workspaceAuditPassed" BOOLEAN NOT NULL DEFAULT false,
    "typecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "lintPassed" BOOLEAN NOT NULL DEFAULT false,
    "unitTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "ciQualityJobPassed" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "productionBlockersVisible" BOOLEAN NOT NULL DEFAULT false,
    "corepackArtifactPath" TEXT,
    "installArtifactPath" TEXT,
    "frozenLockfileArtifactPath" TEXT,
    "workspaceAllArtifactPath" TEXT,
    "typecheckArtifactPath" TEXT,
    "lintArtifactPath" TEXT,
    "unitTestArtifactPath" TEXT,
    "ciQualityJobArtifactPath" TEXT,
    "productionBlockerArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DependencyInstallRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DependencyInstallRun_tenantId_runId_key" ON "DependencyInstallRun"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "DependencyInstallRun_tenantId_status_idx" ON "DependencyInstallRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "DependencyInstallRun_tenantId_createdAt_idx" ON "DependencyInstallRun"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "DependencyInstallRun" ADD CONSTRAINT "DependencyInstallRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
