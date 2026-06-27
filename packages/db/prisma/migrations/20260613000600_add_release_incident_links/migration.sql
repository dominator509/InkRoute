CREATE TABLE "ReleaseIncidentLink" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "releaseRecordId" TEXT,
  "releaseId" TEXT NOT NULL,
  "releaseVersion" TEXT NOT NULL,
  "environment" TEXT NOT NULL,
  "errorReportId" TEXT NOT NULL,
  "auditLogId" TEXT NOT NULL,
  "incidentStatus" TEXT NOT NULL,
  "rollbackRequested" BOOLEAN NOT NULL DEFAULT false,
  "tenantCommunicationOwner" TEXT NOT NULL,
  "rollbackCommunicationHandoffPersisted" BOOLEAN NOT NULL DEFAULT false,
  "tenantScopedIncidentIsolationVerified" BOOLEAN NOT NULL DEFAULT false,
  "sanitizedPayloadsVerified" BOOLEAN NOT NULL DEFAULT false,
  "liveProviderEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
  "rawPayloadStored" BOOLEAN NOT NULL DEFAULT false,
  "artifactPaths" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ReleaseIncidentLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReleaseIncidentLink_tenantId_releaseId_errorReportId_key"
  ON "ReleaseIncidentLink"("tenantId", "releaseId", "errorReportId");

CREATE INDEX "ReleaseIncidentLink_tenantId_releaseVersion_environment_idx"
  ON "ReleaseIncidentLink"("tenantId", "releaseVersion", "environment");

CREATE INDEX "ReleaseIncidentLink_releaseRecordId_idx"
  ON "ReleaseIncidentLink"("releaseRecordId");

CREATE INDEX "ReleaseIncidentLink_errorReportId_idx"
  ON "ReleaseIncidentLink"("errorReportId");

ALTER TABLE "ReleaseIncidentLink"
  ADD CONSTRAINT "ReleaseIncidentLink_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReleaseIncidentLink"
  ADD CONSTRAINT "ReleaseIncidentLink_releaseRecordId_fkey"
  FOREIGN KEY ("releaseRecordId") REFERENCES "ReleaseRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReleaseIncidentLink"
  ADD CONSTRAINT "ReleaseIncidentLink_errorReportId_fkey"
  FOREIGN KEY ("errorReportId") REFERENCES "ErrorReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
