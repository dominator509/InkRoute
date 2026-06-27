CREATE TABLE "AlertDelivery" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "errorReportId" TEXT,
  "fingerprint" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "deliveryState" TEXT NOT NULL,
  "acknowledgementState" TEXT NOT NULL,
  "retryPolicy" TEXT NOT NULL,
  "deadLetterState" TEXT NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3),
  "acknowledgedAt" TIMESTAMP(3),
  "providerCallbackReceivedAt" TIMESTAMP(3),
  "sanitizedPayload" JSONB NOT NULL,
  "providerCallbackPayload" JSONB,
  "suppressExternalDelivery" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AlertDelivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AlertDelivery_tenantId_deliveryState_createdAt_idx"
  ON "AlertDelivery"("tenantId", "deliveryState", "createdAt");

CREATE INDEX "AlertDelivery_tenantId_acknowledgementState_idx"
  ON "AlertDelivery"("tenantId", "acknowledgementState");

CREATE INDEX "AlertDelivery_tenantId_fingerprint_idx"
  ON "AlertDelivery"("tenantId", "fingerprint");

CREATE INDEX "AlertDelivery_errorReportId_idx"
  ON "AlertDelivery"("errorReportId");

ALTER TABLE "AlertDelivery"
  ADD CONSTRAINT "AlertDelivery_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AlertDelivery"
  ADD CONSTRAINT "AlertDelivery_errorReportId_fkey"
  FOREIGN KEY ("errorReportId") REFERENCES "ErrorReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
