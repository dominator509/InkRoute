CREATE TABLE "ProviderEnvironmentRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "environmentMatrix" JSONB NOT NULL,
    "surfaceMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "verifierPassed" BOOLEAN NOT NULL DEFAULT false,
    "strictEnvCheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "previewProvisioned" BOOLEAN NOT NULL DEFAULT false,
    "stagingProvisioned" BOOLEAN NOT NULL DEFAULT false,
    "productionProvisioned" BOOLEAN NOT NULL DEFAULT false,
    "webDashboardSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "databaseMigrationDryRunPassed" BOOLEAN NOT NULL DEFAULT false,
    "storagePrivateAclSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "mobilePreviewBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "observabilitySourceMapSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "githubEnvironmentProtectionsConfigured" BOOLEAN NOT NULL DEFAULT false,
    "secretStoreDestinationsConfigured" BOOLEAN NOT NULL DEFAULT false,
    "redactedEvidenceLabelsRecorded" BOOLEAN NOT NULL DEFAULT false,
    "ciProviderEnvironmentArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "redactedHandoffArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderEnvironmentRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderEnvironmentRun_tenantId_runId_key" ON "ProviderEnvironmentRun"("tenantId", "runId");
CREATE INDEX "ProviderEnvironmentRun_tenantId_status_idx" ON "ProviderEnvironmentRun"("tenantId", "status");
CREATE INDEX "ProviderEnvironmentRun_tenantId_createdAt_idx" ON "ProviderEnvironmentRun"("tenantId", "createdAt");

ALTER TABLE "ProviderEnvironmentRun" ADD CONSTRAINT "ProviderEnvironmentRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
