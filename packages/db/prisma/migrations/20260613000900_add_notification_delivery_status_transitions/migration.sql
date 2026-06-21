-- Add durable notification delivery status transitions for GAP-064.

CREATE TABLE "NotificationDeliveryStatusTransition" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "fromStatus" "NotificationStatus",
    "toStatus" "NotificationStatus" NOT NULL,
    "actorUserId" TEXT,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationDeliveryStatusTransition_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NotificationDeliveryStatusTransition_tenantId_deliveryId_createdAt_idx" ON "NotificationDeliveryStatusTransition"("tenantId", "deliveryId", "createdAt");
CREATE INDEX "NotificationDeliveryStatusTransition_tenantId_toStatus_idx" ON "NotificationDeliveryStatusTransition"("tenantId", "toStatus");

ALTER TABLE "NotificationDeliveryStatusTransition" ADD CONSTRAINT "NotificationDeliveryStatusTransition_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationDeliveryStatusTransition" ADD CONSTRAINT "NotificationDeliveryStatusTransition_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "NotificationDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
