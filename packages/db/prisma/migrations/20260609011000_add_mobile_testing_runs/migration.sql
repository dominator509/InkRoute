CREATE TABLE "MobileTestingRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "executionMatrix" JSONB NOT NULL,
    "checklistIds" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "mobileSupportTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "mobileSupportTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "mobileAppTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "mobileStaticTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "expoDependenciesInstalled" BOOLEAN NOT NULL DEFAULT false,
    "expoRuntimeStarted" BOOLEAN NOT NULL DEFAULT false,
    "iosSimulatorSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "androidEmulatorSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "physicalDeviceChecklistCompleted" BOOLEAN NOT NULL DEFAULT false,
    "biometricQaPassed" BOOLEAN NOT NULL DEFAULT false,
    "tenantApiSyncQaPassed" BOOLEAN NOT NULL DEFAULT false,
    "offlineReconnectQaPassed" BOOLEAN NOT NULL DEFAULT false,
    "pushDeliveryQaPassed" BOOLEAN NOT NULL DEFAULT false,
    "crashCaptureQaPassed" BOOLEAN NOT NULL DEFAULT false,
    "easPreviewBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "easUpdateRollbackPassed" BOOLEAN NOT NULL DEFAULT false,
    "accessibilityQaPassed" BOOLEAN NOT NULL DEFAULT false,
    "ciMobileChecksPassed" BOOLEAN NOT NULL DEFAULT false,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobileTestingRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MobileTestingRun_tenantId_runId_key" ON "MobileTestingRun"("tenantId", "runId");
CREATE INDEX "MobileTestingRun_tenantId_status_idx" ON "MobileTestingRun"("tenantId", "status");
CREATE INDEX "MobileTestingRun_tenantId_createdAt_idx" ON "MobileTestingRun"("tenantId", "createdAt");

ALTER TABLE "MobileTestingRun" ADD CONSTRAINT "MobileTestingRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;