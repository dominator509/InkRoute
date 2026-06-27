-- Add durable provider webhook event rows for GAP-010.

CREATE TABLE "ProviderEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "deliveryId" TEXT,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "normalizedStatus" "NotificationStatus",
    "idempotencyKey" TEXT NOT NULL,
    "payloadSummary" JSONB NOT NULL,
    "replayDetected" BOOLEAN NOT NULL DEFAULT false,
    "rawPayloadStored" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderEvent_tenantId_provider_eventId_key" ON "ProviderEvent"("tenantId", "provider", "eventId");
CREATE UNIQUE INDEX "ProviderEvent_tenantId_idempotencyKey_key" ON "ProviderEvent"("tenantId", "idempotencyKey");
CREATE INDEX "ProviderEvent_tenantId_provider_eventType_createdAt_idx" ON "ProviderEvent"("tenantId", "provider", "eventType", "createdAt");
CREATE INDEX "ProviderEvent_tenantId_providerMessageId_idx" ON "ProviderEvent"("tenantId", "providerMessageId");
CREATE INDEX "ProviderEvent_tenantId_replayDetected_idx" ON "ProviderEvent"("tenantId", "replayDetected");

ALTER TABLE "ProviderEvent" ADD CONSTRAINT "ProviderEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderEvent" ADD CONSTRAINT "ProviderEvent_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "NotificationDelivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
