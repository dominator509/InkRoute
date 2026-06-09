-- Add durable SEO/accessibility/performance audit run tracking.
CREATE TABLE "SeoA11yPerformanceAuditRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "renderedCrawlEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "schemaValidatorEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "sitemapCanonicalEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "axeEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "lighthouseCwvEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "mobileVisualQaEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "accessibilityFixEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "crawlReportPath" TEXT,
    "lighthouseReportPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoA11yPerformanceAuditRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SeoA11yPerformanceAuditRun_tenantId_runId_key" ON "SeoA11yPerformanceAuditRun"("tenantId", "runId");
CREATE INDEX "SeoA11yPerformanceAuditRun_tenantId_status_idx" ON "SeoA11yPerformanceAuditRun"("tenantId", "status");
CREATE INDEX "SeoA11yPerformanceAuditRun_commitSha_idx" ON "SeoA11yPerformanceAuditRun"("commitSha");

ALTER TABLE "SeoA11yPerformanceAuditRun" ADD CONSTRAINT "SeoA11yPerformanceAuditRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
