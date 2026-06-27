-- CreateTable
CREATE TABLE "MobileLaunchRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "readinessAreaManifest" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "deviceQaManifest" JSONB NOT NULL,
    "providerQaManifest" JSONB NOT NULL,
    "easRuntimeManifest" JSONB NOT NULL,
    "mobileSupportTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "mobileSupportTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "mobileAppTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "mobileAppTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "expoRuntimeStarted" BOOLEAN NOT NULL DEFAULT false,
    "iosSimulatorSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "androidEmulatorSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "easPreviewBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "easPreviewUpdatePassed" BOOLEAN NOT NULL DEFAULT false,
    "authSessionBiometricQaPassed" BOOLEAN NOT NULL DEFAULT false,
    "tenantApiClientQaPassed" BOOLEAN NOT NULL DEFAULT false,
    "pushNotificationQaPassed" BOOLEAN NOT NULL DEFAULT false,
    "encryptedOfflineStoreQaPassed" BOOLEAN NOT NULL DEFAULT false,
    "uploadFlowQaPassed" BOOLEAN NOT NULL DEFAULT false,
    "crashReportingQaPassed" BOOLEAN NOT NULL DEFAULT false,
    "otaUpdateRollbackQaPassed" BOOLEAN NOT NULL DEFAULT false,
    "physicalDeviceQaCompleted" BOOLEAN NOT NULL DEFAULT false,
    "accessibilityQaPassed" BOOLEAN NOT NULL DEFAULT false,
    "appJsonProjectConfigured" BOOLEAN NOT NULL DEFAULT false,
    "easChannelsConfigured" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "launchArtifactsSecretSafe" BOOLEAN NOT NULL DEFAULT false,
    "mobileSupportTypecheckArtifactPath" TEXT,
    "mobileSupportTestArtifactPath" TEXT,
    "mobileAppTypecheckArtifactPath" TEXT,
    "mobileAppTestArtifactPath" TEXT,
    "expoRuntimeArtifactPath" TEXT,
    "iosSimulatorSmokeArtifactPath" TEXT,
    "androidEmulatorSmokeArtifactPath" TEXT,
    "easPreviewBuildArtifactPath" TEXT,
    "easPreviewUpdateArtifactPath" TEXT,
    "authApiPushOfflineQaArtifactPath" TEXT,
    "uploadCrashOtaQaArtifactPath" TEXT,
    "physicalDeviceQaArtifactPath" TEXT,
    "accessibilityQaArtifactPath" TEXT,
    "ciEvidenceArtifactPath" TEXT,
    "secretSafeArtifactsPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobileLaunchRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MobileLaunchRun_tenantId_runId_key" ON "MobileLaunchRun"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "MobileLaunchRun_tenantId_status_idx" ON "MobileLaunchRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "MobileLaunchRun_tenantId_createdAt_idx" ON "MobileLaunchRun"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "MobileLaunchRun" ADD CONSTRAINT "MobileLaunchRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
