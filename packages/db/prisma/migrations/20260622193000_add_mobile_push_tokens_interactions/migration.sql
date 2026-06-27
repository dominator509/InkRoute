-- Add durable mobile push token and tap/open interaction persistence for GAP-063.

CREATE TABLE "PushToken" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'expo',
    "tokenHash" TEXT NOT NULL,
    "tokenMasked" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "permissionStatus" TEXT NOT NULL,
    "optIn" BOOLEAN NOT NULL DEFAULT true,
    "disabledAt" TIMESTAMP(3),
    "metadata" JSONB,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationInteraction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "interactionType" TEXT NOT NULL,
    "routePath" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationInteraction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushToken_tenantId_provider_deviceId_key" ON "PushToken"("tenantId", "provider", "deviceId");
CREATE INDEX "PushToken_tenantId_userId_active_idx" ON "PushToken"("tenantId", "userId", "active");
CREATE INDEX "PushToken_tenantId_provider_tokenHash_idx" ON "PushToken"("tenantId", "provider", "tokenHash");

CREATE UNIQUE INDEX "NotificationInteraction_tenantId_idempotencyKey_key" ON "NotificationInteraction"("tenantId", "idempotencyKey");
CREATE INDEX "NotificationInteraction_tenantId_notificationId_occurredAt_idx" ON "NotificationInteraction"("tenantId", "notificationId", "occurredAt");
CREATE INDEX "NotificationInteraction_tenantId_channel_interactionType_idx" ON "NotificationInteraction"("tenantId", "channel", "interactionType");

ALTER TABLE "PushToken" ADD CONSTRAINT "PushToken_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationInteraction" ADD CONSTRAINT "NotificationInteraction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
