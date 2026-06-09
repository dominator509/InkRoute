-- Add durable portfolio image performance run tracking.
CREATE TABLE "PortfolioImagePerformanceRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "derivativeFixtureEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "nextImageEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "exifStrippingEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "privateOriginalDenialEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "browserRenderingEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "lighthouseEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "derivativeFixtureReportPath" TEXT,
    "lighthouseReportPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioImagePerformanceRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PortfolioImagePerformanceRun_tenantId_runId_key" ON "PortfolioImagePerformanceRun"("tenantId", "runId");
CREATE INDEX "PortfolioImagePerformanceRun_tenantId_status_idx" ON "PortfolioImagePerformanceRun"("tenantId", "status");
CREATE INDEX "PortfolioImagePerformanceRun_commitSha_idx" ON "PortfolioImagePerformanceRun"("commitSha");

ALTER TABLE "PortfolioImagePerformanceRun" ADD CONSTRAINT "PortfolioImagePerformanceRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
