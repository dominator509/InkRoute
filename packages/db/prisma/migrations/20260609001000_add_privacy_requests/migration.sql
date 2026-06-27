CREATE TABLE "PrivacyRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requesterUserId" TEXT,
    "clientId" TEXT,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'intake_received',
    "requesterEmail" TEXT NOT NULL,
    "requesterName" TEXT,
    "identityProofStatus" TEXT NOT NULL DEFAULT 'pending',
    "tenantRelationshipStatus" TEXT NOT NULL DEFAULT 'pending',
    "requesterMismatchDeniedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3) NOT NULL,
    "legalHold" BOOLEAN NOT NULL DEFAULT false,
    "legalHoldReason" TEXT,
    "exportArtifactObjectKey" TEXT,
    "deletionTombstoneObjectKey" TEXT,
    "workerCursor" TEXT,
    "fulfillmentMetadata" JSONB,
    "statusHistory" JSONB,
    "redactedSubmission" JSONB,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivacyRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PrivacyRequest_tenantId_status_idx" ON "PrivacyRequest"("tenantId", "status");
CREATE INDEX "PrivacyRequest_tenantId_requestType_idx" ON "PrivacyRequest"("tenantId", "requestType");
CREATE INDEX "PrivacyRequest_tenantId_requesterEmail_idx" ON "PrivacyRequest"("tenantId", "requesterEmail");
CREATE INDEX "PrivacyRequest_tenantId_dueAt_idx" ON "PrivacyRequest"("tenantId", "dueAt");
CREATE INDEX "PrivacyRequest_tenantId_legalHold_idx" ON "PrivacyRequest"("tenantId", "legalHold");

ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;