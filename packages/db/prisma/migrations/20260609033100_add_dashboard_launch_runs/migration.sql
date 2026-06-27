-- CreateTable
CREATE TABLE "DashboardLaunchRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "controlManifest" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "tenantApiManifest" JSONB NOT NULL,
    "launchStateManifest" JSONB NOT NULL,
    "dashboardTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "dashboardBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "dashboardUnitTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "dashboardPlaywrightSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "seededTenantDataAvailable" BOOLEAN NOT NULL DEFAULT false,
    "providerBackedAuthConfigured" BOOLEAN NOT NULL DEFAULT false,
    "tenantScopedApisImplemented" BOOLEAN NOT NULL DEFAULT false,
    "prismaRepositoriesImplemented" BOOLEAN NOT NULL DEFAULT false,
    "realMutationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mutationAuditLogsPersisted" BOOLEAN NOT NULL DEFAULT false,
    "providerActionsImplemented" BOOLEAN NOT NULL DEFAULT false,
    "rbacDenialTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "crossTenantDenialTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "fieldRedactionVerified" BOOLEAN NOT NULL DEFAULT false,
    "loadingEmptyErrorStatesVerified" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "dashboardArtifactsSecretSafe" BOOLEAN NOT NULL DEFAULT false,
    "dashboardTypecheckArtifactPath" TEXT,
    "dashboardBuildArtifactPath" TEXT,
    "dashboardTestArtifactPath" TEXT,
    "playwrightSmokeArtifactPath" TEXT,
    "seededTenantDataArtifactPath" TEXT,
    "providerAuthSmokeArtifactPath" TEXT,
    "tenantScopedApisArtifactPath" TEXT,
    "prismaRepositoriesArtifactPath" TEXT,
    "mutationAuditLogArtifactPath" TEXT,
    "rbacCrossTenantDenialArtifactPath" TEXT,
    "fieldRedactionArtifactPath" TEXT,
    "launchStatesArtifactPath" TEXT,
    "ciEvidenceArtifactPath" TEXT,
    "secretSafeArtifactsPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardLaunchRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardLaunchRun_tenantId_runId_key" ON "DashboardLaunchRun"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "DashboardLaunchRun_tenantId_status_idx" ON "DashboardLaunchRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "DashboardLaunchRun_tenantId_createdAt_idx" ON "DashboardLaunchRun"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "DashboardLaunchRun" ADD CONSTRAINT "DashboardLaunchRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
