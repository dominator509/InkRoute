CREATE TABLE "SemanticDocumentationRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "semanticCheckMatrix" JSONB NOT NULL,
    "proofBoundaryMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "qualityDocsPassed" BOOLEAN NOT NULL DEFAULT false,
    "structuralLinksPassed" BOOLEAN NOT NULL DEFAULT false,
    "concreteRepoPathsPassed" BOOLEAN NOT NULL DEFAULT false,
    "productionReadinessClaimsPassed" BOOLEAN NOT NULL DEFAULT false,
    "apiRouteReferencesPassed" BOOLEAN NOT NULL DEFAULT false,
    "providerReadinessLanguagePassed" BOOLEAN NOT NULL DEFAULT false,
    "legalReadinessLanguagePassed" BOOLEAN NOT NULL DEFAULT false,
    "appPackageInventoryPassed" BOOLEAN NOT NULL DEFAULT false,
    "documentationInventoryContractCurrent" BOOLEAN NOT NULL DEFAULT false,
    "ciQualityDocsEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "runtimeProofSeparated" BOOLEAN NOT NULL DEFAULT false,
    "providerProofSeparated" BOOLEAN NOT NULL DEFAULT false,
    "legalReviewSeparated" BOOLEAN NOT NULL DEFAULT false,
    "linkPathArtifactPath" TEXT,
    "consistencyArtifactPath" TEXT,
    "inventoryArtifactPath" TEXT,
    "ciQualityDocsArtifactPath" TEXT,
    "runtimeBoundaryArtifactPath" TEXT,
    "providerBoundaryArtifactPath" TEXT,
    "legalBoundaryArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SemanticDocumentationRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SemanticDocumentationRun_tenantId_runId_key" ON "SemanticDocumentationRun"("tenantId", "runId");
CREATE INDEX "SemanticDocumentationRun_tenantId_status_idx" ON "SemanticDocumentationRun"("tenantId", "status");
CREATE INDEX "SemanticDocumentationRun_tenantId_createdAt_idx" ON "SemanticDocumentationRun"("tenantId", "createdAt");

ALTER TABLE "SemanticDocumentationRun" ADD CONSTRAINT "SemanticDocumentationRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
