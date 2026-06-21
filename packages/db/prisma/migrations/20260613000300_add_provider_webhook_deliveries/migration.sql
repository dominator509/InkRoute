CREATE TABLE "ProviderWebhookDelivery" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerDeliveryId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "providerFingerprint" TEXT,
  "errorReportId" TEXT,
  "action" TEXT NOT NULL,
  "targetErrorStatus" "ErrorReportStatus" NOT NULL DEFAULT 'open',
  "statusMutationApplied" BOOLEAN NOT NULL DEFAULT false,
  "rawPayloadStored" BOOLEAN NOT NULL DEFAULT false,
  "sanitizedPayload" JSONB NOT NULL,
  "replayedAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProviderWebhookDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderWebhookDelivery_provider_providerDeliveryId_key"
  ON "ProviderWebhookDelivery"("provider", "providerDeliveryId");

CREATE UNIQUE INDEX "ProviderWebhookDelivery_provider_idempotencyKey_key"
  ON "ProviderWebhookDelivery"("provider", "idempotencyKey");

CREATE INDEX "ProviderWebhookDelivery_tenantId_processedAt_idx"
  ON "ProviderWebhookDelivery"("tenantId", "processedAt");

CREATE INDEX "ProviderWebhookDelivery_tenantId_providerFingerprint_idx"
  ON "ProviderWebhookDelivery"("tenantId", "providerFingerprint");

CREATE INDEX "ProviderWebhookDelivery_errorReportId_idx"
  ON "ProviderWebhookDelivery"("errorReportId");

ALTER TABLE "ProviderWebhookDelivery"
  ADD CONSTRAINT "ProviderWebhookDelivery_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProviderWebhookDelivery"
  ADD CONSTRAINT "ProviderWebhookDelivery_errorReportId_fkey"
  FOREIGN KEY ("errorReportId") REFERENCES "ErrorReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
