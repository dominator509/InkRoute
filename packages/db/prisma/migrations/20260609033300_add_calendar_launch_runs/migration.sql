-- CreateTable
CREATE TABLE "CalendarLaunchRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "readinessAreaManifest" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "googleSyncManifest" JSONB NOT NULL,
    "signedIcsManifest" JSONB NOT NULL,
    "timezoneQaManifest" JSONB NOT NULL,
    "calendarTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "calendarTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "availabilityRepositoriesImplemented" BOOLEAN NOT NULL DEFAULT false,
    "availabilityPostgresIntegrationPassed" BOOLEAN NOT NULL DEFAULT false,
    "concurrentHoldRaceTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "tenantIsolationTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "googleOauthConfigured" BOOLEAN NOT NULL DEFAULT false,
    "googleEncryptedTokensConfigured" BOOLEAN NOT NULL DEFAULT false,
    "googleWorkerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "googleFreebusySmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "googleEventSyncSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "googlePushOrIncrementalSyncVerified" BOOLEAN NOT NULL DEFAULT false,
    "signedIcsTokenPersistenceConfigured" BOOLEAN NOT NULL DEFAULT false,
    "signedIcsAccessSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "signedIcsClientImportSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "timezoneDstQaPassed" BOOLEAN NOT NULL DEFAULT false,
    "providerRenderMatrixPassed" BOOLEAN NOT NULL DEFAULT false,
    "travelPublishPersistencePassed" BOOLEAN NOT NULL DEFAULT false,
    "cacheRevalidationVerified" BOOLEAN NOT NULL DEFAULT false,
    "dashboardCalendarSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "publicTravelSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "calendarArtifactsSecretSafe" BOOLEAN NOT NULL DEFAULT false,
    "calendarTypecheckArtifactPath" TEXT,
    "calendarTestArtifactPath" TEXT,
    "postgresAvailabilityArtifactPath" TEXT,
    "concurrentHoldRaceArtifactPath" TEXT,
    "tenantIsolationArtifactPath" TEXT,
    "googleOauthArtifactPath" TEXT,
    "googleFreebusySyncArtifactPath" TEXT,
    "googlePushIncrementalArtifactPath" TEXT,
    "signedIcsTokenRouteArtifactPath" TEXT,
    "icsClientImportsArtifactPath" TEXT,
    "timezoneProviderMatrixArtifactPath" TEXT,
    "travelPublishCacheArtifactPath" TEXT,
    "dashboardPublicSmokeArtifactPath" TEXT,
    "ciEvidenceArtifactPath" TEXT,
    "secretSafeArtifactsPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarLaunchRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarLaunchRun_tenantId_runId_key" ON "CalendarLaunchRun"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "CalendarLaunchRun_tenantId_status_idx" ON "CalendarLaunchRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "CalendarLaunchRun_tenantId_createdAt_idx" ON "CalendarLaunchRun"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "CalendarLaunchRun" ADD CONSTRAINT "CalendarLaunchRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
