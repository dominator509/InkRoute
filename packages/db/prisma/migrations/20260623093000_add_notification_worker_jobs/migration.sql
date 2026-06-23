-- GAP-065: durable notification scheduler worker repositories.
-- Adds tenant-scoped job, dead-letter, and worker audit tables while
-- provider dispatch and deployed queue workers remain evidence-gated.

CREATE TABLE "NotificationJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "notificationId" TEXT,
    "deliveryId" TEXT,
    "providerHandoffId" TEXT,
    "sourceAction" TEXT NOT NULL,
    "templateKey" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'in_app',
    "state" TEXT NOT NULL DEFAULT 'queued',
    "idempotencyKey" TEXT NOT NULL,
    "appointmentId" TEXT,
    "bookingRequestId" TEXT,
    "actorUserId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeadLetterJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "notificationJobId" TEXT,
    "deliveryId" TEXT,
    "providerHandoffId" TEXT,
    "reason" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeadLetterJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationWorkerAuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "notificationJobId" TEXT,
    "deliveryId" TEXT,
    "providerHandoffId" TEXT,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationWorkerAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationJob_tenantId_idempotencyKey_sourceAction_key" ON "NotificationJob"("tenantId", "idempotencyKey", "sourceAction");
CREATE INDEX "NotificationJob_tenantId_state_availableAt_idx" ON "NotificationJob"("tenantId", "state", "availableAt");
CREATE INDEX "NotificationJob_tenantId_appointmentId_idx" ON "NotificationJob"("tenantId", "appointmentId");
CREATE INDEX "NotificationJob_tenantId_bookingRequestId_idx" ON "NotificationJob"("tenantId", "bookingRequestId");
CREATE INDEX "NotificationJob_tenantId_providerHandoffId_idx" ON "NotificationJob"("tenantId", "providerHandoffId");
CREATE INDEX "DeadLetterJob_tenantId_notificationJobId_idx" ON "DeadLetterJob"("tenantId", "notificationJobId");
CREATE INDEX "DeadLetterJob_tenantId_providerHandoffId_idx" ON "DeadLetterJob"("tenantId", "providerHandoffId");
CREATE INDEX "DeadLetterJob_tenantId_createdAt_idx" ON "DeadLetterJob"("tenantId", "createdAt");
CREATE INDEX "NotificationWorkerAuditLog_tenantId_notificationJobId_createdAt_idx" ON "NotificationWorkerAuditLog"("tenantId", "notificationJobId", "createdAt");
CREATE INDEX "NotificationWorkerAuditLog_tenantId_providerHandoffId_createdAt_idx" ON "NotificationWorkerAuditLog"("tenantId", "providerHandoffId", "createdAt");
CREATE INDEX "NotificationWorkerAuditLog_tenantId_action_createdAt_idx" ON "NotificationWorkerAuditLog"("tenantId", "action", "createdAt");

ALTER TABLE "NotificationJob" ADD CONSTRAINT "NotificationJob_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeadLetterJob" ADD CONSTRAINT "DeadLetterJob_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationWorkerAuditLog" ADD CONSTRAINT "NotificationWorkerAuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
