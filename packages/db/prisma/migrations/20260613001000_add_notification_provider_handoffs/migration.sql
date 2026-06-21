-- Add durable provider handoff source rows for GAP-064.

CREATE TABLE "NotificationProviderHandoff" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "threadId" TEXT,
    "messageId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "provider" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'queued',
    "idempotencyKey" TEXT NOT NULL,
    "destinationHash" TEXT,
    "sanitizedPayload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationProviderHandoff_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationProviderHandoff_tenantId_idempotencyKey_provider_key" ON "NotificationProviderHandoff"("tenantId", "idempotencyKey", "provider");
CREATE INDEX "NotificationProviderHandoff_tenantId_state_availableAt_idx" ON "NotificationProviderHandoff"("tenantId", "state", "availableAt");
CREATE INDEX "NotificationProviderHandoff_tenantId_deliveryId_idx" ON "NotificationProviderHandoff"("tenantId", "deliveryId");
CREATE INDEX "NotificationProviderHandoff_tenantId_notificationId_idx" ON "NotificationProviderHandoff"("tenantId", "notificationId");

ALTER TABLE "NotificationProviderHandoff" ADD CONSTRAINT "NotificationProviderHandoff_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationProviderHandoff" ADD CONSTRAINT "NotificationProviderHandoff_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationProviderHandoff" ADD CONSTRAINT "NotificationProviderHandoff_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "NotificationDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
