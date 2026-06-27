CREATE TABLE "SearchConsoleImportedRow" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "siteUrl" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "page" TEXT NOT NULL,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "ctr" DOUBLE PRECISION,
  "position" DOUBLE PRECISION,
  "rangeStart" TIMESTAMP(3) NOT NULL,
  "rangeEnd" TIMESTAMP(3) NOT NULL,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SearchConsoleImportedRow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SearchConsoleOperationRun" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "siteUrl" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "artifactManifest" JSONB NOT NULL,
  "providerMetadata" JSONB,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),

  CONSTRAINT "SearchConsoleOperationRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SearchConsoleImportedRow_tenantId_siteUrl_query_page_rangeStart_rangeEnd_key" ON "SearchConsoleImportedRow"("tenantId", "siteUrl", "query", "page", "rangeStart", "rangeEnd");
CREATE INDEX "SearchConsoleImportedRow_tenantId_importedAt_idx" ON "SearchConsoleImportedRow"("tenantId", "importedAt");
CREATE INDEX "SearchConsoleImportedRow_tenantId_query_idx" ON "SearchConsoleImportedRow"("tenantId", "query");
CREATE INDEX "SearchConsoleImportedRow_tenantId_page_idx" ON "SearchConsoleImportedRow"("tenantId", "page");

CREATE UNIQUE INDEX "SearchConsoleOperationRun_tenantId_idempotencyKey_key" ON "SearchConsoleOperationRun"("tenantId", "idempotencyKey");
CREATE UNIQUE INDEX "SearchConsoleOperationRun_tenantId_runId_key" ON "SearchConsoleOperationRun"("tenantId", "runId");
CREATE INDEX "SearchConsoleOperationRun_tenantId_operation_status_idx" ON "SearchConsoleOperationRun"("tenantId", "operation", "status");
CREATE INDEX "SearchConsoleOperationRun_tenantId_startedAt_idx" ON "SearchConsoleOperationRun"("tenantId", "startedAt");

ALTER TABLE "SearchConsoleImportedRow" ADD CONSTRAINT "SearchConsoleImportedRow_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SearchConsoleOperationRun" ADD CONSTRAINT "SearchConsoleOperationRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
