-- CreateTable
CREATE TABLE "NotificationLaunchRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "controlManifest" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "providerSendManifest" JSONB NOT NULL,
    "suppressionManifest" JSONB NOT NULL,
    "webhookReplayManifest" JSONB NOT NULL,
    "notificationsTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "notificationsTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "providerSdksConfigured" BOOLEAN NOT NULL DEFAULT false,
    "resendSandboxSendPassed" BOOLEAN NOT NULL DEFAULT false,
    "twilioSandboxSendPassed" BOOLEAN NOT NULL DEFAULT false,
    "expoPushDeviceSendPassed" BOOLEAN NOT NULL DEFAULT false,
    "queueWorkerImplemented" BOOLEAN NOT NULL DEFAULT false,
    "deliveryPersistenceConfigured" BOOLEAN NOT NULL DEFAULT false,
    "providerEventPersistenceConfigured" BOOLEAN NOT NULL DEFAULT false,
    "messageThreadPersistenceConfigured" BOOLEAN NOT NULL DEFAULT false,
    "messagePersistenceConfigured" BOOLEAN NOT NULL DEFAULT false,
    "preferenceCenterImplemented" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribeStopSuppressionTested" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursRateLimitTested" BOOLEAN NOT NULL DEFAULT false,
    "signedWebhookVerificationPassed" BOOLEAN NOT NULL DEFAULT false,
    "retryDeadLetterFlowTested" BOOLEAN NOT NULL DEFAULT false,
    "tenantIsolationTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "redactionPrivacyReviewPassed" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "notificationTypecheckArtifactPath" TEXT,
    "notificationTestArtifactPath" TEXT,
    "providerSandboxArtifactPath" TEXT,
    "resendSandboxArtifactPath" TEXT,
    "twilioSandboxArtifactPath" TEXT,
    "expoPushDeviceArtifactPath" TEXT,
    "queueWorkerArtifactPath" TEXT,
    "persistenceArtifactPath" TEXT,
    "preferenceSuppressionArtifactPath" TEXT,
    "webhookSignatureReplayArtifactPath" TEXT,
    "retryDeadLetterArtifactPath" TEXT,
    "tenantIsolationArtifactPath" TEXT,
    "redactionPrivacyArtifactPath" TEXT,
    "ciEvidenceArtifactPath" TEXT,
    "secretSafeArtifactsPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationLaunchRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationLaunchRun_tenantId_runId_key" ON "NotificationLaunchRun"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "NotificationLaunchRun_tenantId_status_idx" ON "NotificationLaunchRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "NotificationLaunchRun_tenantId_createdAt_idx" ON "NotificationLaunchRun"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "NotificationLaunchRun" ADD CONSTRAINT "NotificationLaunchRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
