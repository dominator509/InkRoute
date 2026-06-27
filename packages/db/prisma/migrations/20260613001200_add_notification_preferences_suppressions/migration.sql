-- Add durable notification preference and suppression rows for GAP-010.

CREATE TABLE "NotificationChannelPreference" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "optedIn" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "timezone" TEXT,
    "rateLimitWindow" TEXT,
    "rateLimitCount" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'preference_center',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationChannelPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationSuppression" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "provider" TEXT,
    "destinationHash" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "providerEventId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "rawPayloadStored" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "NotificationSuppression_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationChannelPreference_tenantId_subjectType_subjectId_channel_key" ON "NotificationChannelPreference"("tenantId", "subjectType", "subjectId", "channel");
CREATE INDEX "NotificationChannelPreference_tenantId_channel_optedIn_idx" ON "NotificationChannelPreference"("tenantId", "channel", "optedIn");
CREATE INDEX "NotificationChannelPreference_tenantId_subjectType_subjectId_idx" ON "NotificationChannelPreference"("tenantId", "subjectType", "subjectId");

CREATE UNIQUE INDEX "NotificationSuppression_tenantId_channel_destinationHash_reason_key" ON "NotificationSuppression"("tenantId", "channel", "destinationHash", "reason");
CREATE INDEX "NotificationSuppression_tenantId_channel_active_idx" ON "NotificationSuppression"("tenantId", "channel", "active");
CREATE INDEX "NotificationSuppression_tenantId_provider_source_idx" ON "NotificationSuppression"("tenantId", "provider", "source");
CREATE INDEX "NotificationSuppression_tenantId_expiresAt_idx" ON "NotificationSuppression"("tenantId", "expiresAt");

ALTER TABLE "NotificationChannelPreference" ADD CONSTRAINT "NotificationChannelPreference_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationSuppression" ADD CONSTRAINT "NotificationSuppression_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
