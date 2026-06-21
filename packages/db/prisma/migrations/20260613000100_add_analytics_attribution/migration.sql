CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "bookingRequestId" TEXT,
  "portfolioItemId" TEXT,
  "source" TEXT,
  "medium" TEXT,
  "campaign" TEXT,
  "idempotencyKey" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Campaign" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "source" TEXT,
  "medium" TEXT,
  "campaign" TEXT NOT NULL,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "eventCount" INTEGER NOT NULL DEFAULT 0,
  "bookingRequestCount" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AnalyticsEvent_tenantId_idempotencyKey_key" ON "AnalyticsEvent"("tenantId", "idempotencyKey");
CREATE INDEX "AnalyticsEvent_tenantId_name_occurredAt_idx" ON "AnalyticsEvent"("tenantId", "name", "occurredAt");
CREATE INDEX "AnalyticsEvent_tenantId_campaign_idx" ON "AnalyticsEvent"("tenantId", "campaign");
CREATE INDEX "AnalyticsEvent_tenantId_bookingRequestId_idx" ON "AnalyticsEvent"("tenantId", "bookingRequestId");
CREATE INDEX "AnalyticsEvent_tenantId_portfolioItemId_idx" ON "AnalyticsEvent"("tenantId", "portfolioItemId");
CREATE UNIQUE INDEX "Campaign_tenantId_source_medium_campaign_key" ON "Campaign"("tenantId", "source", "medium", "campaign");
CREATE INDEX "Campaign_tenantId_lastSeenAt_idx" ON "Campaign"("tenantId", "lastSeenAt");

ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
