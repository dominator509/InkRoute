CREATE TABLE "QualityGateRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "generatedManifestMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "packageTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "packageTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "qualityDocsPassed" BOOLEAN NOT NULL DEFAULT false,
    "qualityGapsPassed" BOOLEAN NOT NULL DEFAULT false,
    "qualityPrGapFixturesPassed" BOOLEAN NOT NULL DEFAULT false,
    "qualityGovernancePassed" BOOLEAN NOT NULL DEFAULT false,
    "qualityRequiredChecksPassed" BOOLEAN NOT NULL DEFAULT false,
    "qualityGatesSummaryPassed" BOOLEAN NOT NULL DEFAULT false,
    "qualityAllPassed" BOOLEAN NOT NULL DEFAULT false,
    "markdownLinkManifestGenerated" BOOLEAN NOT NULL DEFAULT false,
    "documentationConsistencyManifestGenerated" BOOLEAN NOT NULL DEFAULT false,
    "documentationInventoryManifestGenerated" BOOLEAN NOT NULL DEFAULT false,
    "gapEvidenceManifestGenerated" BOOLEAN NOT NULL DEFAULT false,
    "prGapFixtureManifestGenerated" BOOLEAN NOT NULL DEFAULT false,
    "repositoryGovernanceManifestGenerated" BOOLEAN NOT NULL DEFAULT false,
    "requiredChecksManifestGenerated" BOOLEAN NOT NULL DEFAULT false,
    "qualityGatesManifestGenerated" BOOLEAN NOT NULL DEFAULT false,
    "ciQualityJobPassed" BOOLEAN NOT NULL DEFAULT false,
    "ciArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "packageTypecheckArtifactPath" TEXT,
    "packageTestArtifactPath" TEXT,
    "qualityAllArtifactPath" TEXT,
    "qualityCiJobArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualityGateRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QualityGateRun_tenantId_runId_key" ON "QualityGateRun"("tenantId", "runId");
CREATE INDEX "QualityGateRun_tenantId_status_idx" ON "QualityGateRun"("tenantId", "status");
CREATE INDEX "QualityGateRun_tenantId_createdAt_idx" ON "QualityGateRun"("tenantId", "createdAt");

ALTER TABLE "QualityGateRun" ADD CONSTRAINT "QualityGateRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
