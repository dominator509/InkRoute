-- CreateTable
CREATE TABLE "ObservabilityLaunchRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "controlManifest" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "sdkConfigurationManifest" JSONB NOT NULL,
    "captureEvidenceManifest" JSONB NOT NULL,
    "alertReleaseManifest" JSONB NOT NULL,
    "observabilityTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "observabilityTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "webBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "dashboardBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "mobileTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "sentryWebSdkConfigured" BOOLEAN NOT NULL DEFAULT false,
    "sentryDashboardSdkConfigured" BOOLEAN NOT NULL DEFAULT false,
    "sentryMobileSdkConfigured" BOOLEAN NOT NULL DEFAULT false,
    "openTelemetryExporterConfigured" BOOLEAN NOT NULL DEFAULT false,
    "structuredLoggingConfigured" BOOLEAN NOT NULL DEFAULT false,
    "sourceMapsUploaded" BOOLEAN NOT NULL DEFAULT false,
    "mobileDebugSymbolsUploaded" BOOLEAN NOT NULL DEFAULT false,
    "forcedWebCaptureVerified" BOOLEAN NOT NULL DEFAULT false,
    "forcedDashboardCaptureVerified" BOOLEAN NOT NULL DEFAULT false,
    "forcedApiCaptureVerified" BOOLEAN NOT NULL DEFAULT false,
    "forcedWebhookCaptureVerified" BOOLEAN NOT NULL DEFAULT false,
    "forcedMobileCrashVerified" BOOLEAN NOT NULL DEFAULT false,
    "errorReportPersistenceConfigured" BOOLEAN NOT NULL DEFAULT false,
    "dashboardTenantTriageReadsVerified" BOOLEAN NOT NULL DEFAULT false,
    "sentryWebhookSignatureReplayVerified" BOOLEAN NOT NULL DEFAULT false,
    "alertRoutingVerified" BOOLEAN NOT NULL DEFAULT false,
    "releaseIncidentLinkageVerified" BOOLEAN NOT NULL DEFAULT false,
    "redactionNoPiiVerified" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "observabilityTypecheckArtifactPath" TEXT,
    "observabilityTestArtifactPath" TEXT,
    "webBuildArtifactPath" TEXT,
    "dashboardBuildArtifactPath" TEXT,
    "mobileTypecheckArtifactPath" TEXT,
    "sentrySdkArtifactPath" TEXT,
    "otelPipelineArtifactPath" TEXT,
    "structuredLoggingArtifactPath" TEXT,
    "sourceMapsDebugSymbolsArtifactPath" TEXT,
    "forcedCapturesArtifactPath" TEXT,
    "errorReportPersistenceArtifactPath" TEXT,
    "dashboardTriageArtifactPath" TEXT,
    "providerWebhookArtifactPath" TEXT,
    "alertRoutingArtifactPath" TEXT,
    "releaseLinkageArtifactPath" TEXT,
    "redactionReviewArtifactPath" TEXT,
    "ciEvidenceArtifactPath" TEXT,
    "secretSafeArtifactsPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObservabilityLaunchRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ObservabilityLaunchRun_tenantId_runId_key" ON "ObservabilityLaunchRun"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "ObservabilityLaunchRun_tenantId_status_idx" ON "ObservabilityLaunchRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ObservabilityLaunchRun_tenantId_createdAt_idx" ON "ObservabilityLaunchRun"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "ObservabilityLaunchRun" ADD CONSTRAINT "ObservabilityLaunchRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
