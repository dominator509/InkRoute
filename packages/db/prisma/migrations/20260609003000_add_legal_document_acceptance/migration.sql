CREATE TABLE "LegalDocumentVersion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "reviewedCopyHash" TEXT NOT NULL,
    "reviewerName" TEXT,
    "reviewerFirm" TEXT,
    "approvedAt" TIMESTAMP(3),
    "effectiveAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),
    "noindexUntilApproved" BOOLEAN NOT NULL DEFAULT true,
    "rollbackFromVersion" TEXT,
    "evidenceObjectKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDocumentVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LegalAcceptanceAudit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "legalDocumentVersionId" TEXT NOT NULL,
    "acceptedByUserId" TEXT,
    "subjectEmailHash" TEXT,
    "acceptanceContext" TEXT NOT NULL,
    "acceptedVersion" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgentHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalAcceptanceAudit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LegalDocumentVersion_tenantId_documentType_version_key" ON "LegalDocumentVersion"("tenantId", "documentType", "version");
CREATE INDEX "LegalDocumentVersion_tenantId_documentType_approvedAt_idx" ON "LegalDocumentVersion"("tenantId", "documentType", "approvedAt");
CREATE INDEX "LegalDocumentVersion_tenantId_jurisdiction_idx" ON "LegalDocumentVersion"("tenantId", "jurisdiction");
CREATE INDEX "LegalAcceptanceAudit_tenantId_legalDocumentVersionId_idx" ON "LegalAcceptanceAudit"("tenantId", "legalDocumentVersionId");
CREATE INDEX "LegalAcceptanceAudit_tenantId_acceptedVersion_idx" ON "LegalAcceptanceAudit"("tenantId", "acceptedVersion");
CREATE INDEX "LegalAcceptanceAudit_tenantId_createdAt_idx" ON "LegalAcceptanceAudit"("tenantId", "createdAt");

ALTER TABLE "LegalDocumentVersion" ADD CONSTRAINT "LegalDocumentVersion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LegalAcceptanceAudit" ADD CONSTRAINT "LegalAcceptanceAudit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LegalAcceptanceAudit" ADD CONSTRAINT "LegalAcceptanceAudit_legalDocumentVersionId_fkey" FOREIGN KEY ("legalDocumentVersionId") REFERENCES "LegalDocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LegalAcceptanceAudit" ADD CONSTRAINT "LegalAcceptanceAudit_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;