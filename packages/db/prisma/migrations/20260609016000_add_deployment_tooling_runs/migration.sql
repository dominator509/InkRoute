CREATE TABLE "DeploymentToolingRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "runtimeMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "frozenInstallPassed" BOOLEAN NOT NULL DEFAULT false,
    "deploymentPackageTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "deploymentPackageTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "routeContractTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "deployCheckEnvPassed" BOOLEAN NOT NULL DEFAULT false,
    "deployChecklistPassed" BOOLEAN NOT NULL DEFAULT false,
    "deployGapsPassed" BOOLEAN NOT NULL DEFAULT false,
    "dashboardBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "dashboardPageSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "dashboardReadinessApiSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "rollbackPreflightVerified" BOOLEAN NOT NULL DEFAULT false,
    "productionApprovalBoundaryVerified" BOOLEAN NOT NULL DEFAULT false,
    "ciDeploymentReportsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "blockerOwnersDocumented" BOOLEAN NOT NULL DEFAULT false,
    "blockerOwnerArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeploymentToolingRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeploymentToolingRun_tenantId_runId_key" ON "DeploymentToolingRun"("tenantId", "runId");
CREATE INDEX "DeploymentToolingRun_tenantId_status_idx" ON "DeploymentToolingRun"("tenantId", "status");
CREATE INDEX "DeploymentToolingRun_tenantId_createdAt_idx" ON "DeploymentToolingRun"("tenantId", "createdAt");

ALTER TABLE "DeploymentToolingRun" ADD CONSTRAINT "DeploymentToolingRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;