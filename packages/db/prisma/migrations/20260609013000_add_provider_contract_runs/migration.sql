CREATE TABLE "ProviderContractRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "runtimeMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "staticWebhookContractsPassed" BOOLEAN NOT NULL DEFAULT false,
    "providerManifestVerified" BOOLEAN NOT NULL DEFAULT false,
    "rawBodyFixturesCommitted" BOOLEAN NOT NULL DEFAULT false,
    "replayIdempotencyFixturesCommitted" BOOLEAN NOT NULL DEFAULT false,
    "stripeCliWebhookPassed" BOOLEAN NOT NULL DEFAULT false,
    "stripeIdempotencyVerified" BOOLEAN NOT NULL DEFAULT false,
    "googleCalendarOauthPassed" BOOLEAN NOT NULL DEFAULT false,
    "googleCalendarSyncVerified" BOOLEAN NOT NULL DEFAULT false,
    "storageSignedUrlPassed" BOOLEAN NOT NULL DEFAULT false,
    "storageUploadDownloadPassed" BOOLEAN NOT NULL DEFAULT false,
    "resendSandboxPassed" BOOLEAN NOT NULL DEFAULT false,
    "twilioSandboxPassed" BOOLEAN NOT NULL DEFAULT false,
    "expoPushSandboxPassed" BOOLEAN NOT NULL DEFAULT false,
    "sentryCaptureVerified" BOOLEAN NOT NULL DEFAULT false,
    "authSessionFixturesPassed" BOOLEAN NOT NULL DEFAULT false,
    "rateLimitStorePassed" BOOLEAN NOT NULL DEFAULT false,
    "redactedArtifactsRetained" BOOLEAN NOT NULL DEFAULT false,
    "ciProviderContractPassed" BOOLEAN NOT NULL DEFAULT false,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderContractRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderContractRun_tenantId_runId_key" ON "ProviderContractRun"("tenantId", "runId");
CREATE INDEX "ProviderContractRun_tenantId_status_idx" ON "ProviderContractRun"("tenantId", "status");
CREATE INDEX "ProviderContractRun_tenantId_createdAt_idx" ON "ProviderContractRun"("tenantId", "createdAt");

ALTER TABLE "ProviderContractRun" ADD CONSTRAINT "ProviderContractRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;