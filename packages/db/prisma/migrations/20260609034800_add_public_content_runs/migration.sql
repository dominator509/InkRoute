-- Add durable public content runtime run tracking.
CREATE TABLE "PublicContentRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "tenantDomainResolverEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "repositoryReadEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "routeApiAdoptionEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "seededContentEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "apiJsonRedactionEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "renderedHtmlRedactionEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "privatePortfolioExclusionEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "cacheRevalidationEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "browserCiEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "resolverReportPath" TEXT,
    "redactionReportPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicContentRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublicContentRun_tenantId_runId_key" ON "PublicContentRun"("tenantId", "runId");
CREATE INDEX "PublicContentRun_tenantId_status_idx" ON "PublicContentRun"("tenantId", "status");
CREATE INDEX "PublicContentRun_commitSha_idx" ON "PublicContentRun"("commitSha");

ALTER TABLE "PublicContentRun" ADD CONSTRAINT "PublicContentRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
