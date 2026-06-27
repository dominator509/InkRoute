CREATE TABLE "DocumentationAuditRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "auditReportMatrix" JSONB NOT NULL,
    "documentationConsistencyFindings" JSONB NOT NULL,
    "reviewEvidenceManifest" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "qualityDocsPassed" BOOLEAN NOT NULL DEFAULT false,
    "markdownLinkAuditPassed" BOOLEAN NOT NULL DEFAULT false,
    "documentationConsistencyPassed" BOOLEAN NOT NULL DEFAULT false,
    "documentationInventoryPassed" BOOLEAN NOT NULL DEFAULT false,
    "apiRouteReferencesPassed" BOOLEAN NOT NULL DEFAULT false,
    "providerReadinessLanguagePassed" BOOLEAN NOT NULL DEFAULT false,
    "legalReadinessLanguagePassed" BOOLEAN NOT NULL DEFAULT false,
    "workspaceInventoryPassed" BOOLEAN NOT NULL DEFAULT false,
    "generatedReportsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciQualityDocsEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "providerReviewEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "legalReviewEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "staleProviderStatusProofCaptured" BOOLEAN NOT NULL DEFAULT false,
    "linkAuditArtifactPath" TEXT,
    "consistencyAuditArtifactPath" TEXT,
    "inventoryAuditArtifactPath" TEXT,
    "providerReviewArtifactPath" TEXT,
    "legalReviewArtifactPath" TEXT,
    "staleProviderStatusArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentationAuditRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DocumentationAuditRun_tenantId_runId_key" ON "DocumentationAuditRun"("tenantId", "runId");
CREATE INDEX "DocumentationAuditRun_tenantId_status_idx" ON "DocumentationAuditRun"("tenantId", "status");
CREATE INDEX "DocumentationAuditRun_tenantId_createdAt_idx" ON "DocumentationAuditRun"("tenantId", "createdAt");

ALTER TABLE "DocumentationAuditRun" ADD CONSTRAINT "DocumentationAuditRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
