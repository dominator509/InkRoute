-- CreateTable
CREATE TABLE "ProviderStorageUploadRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "readinessAreaManifest" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "providerConfigurationManifest" JSONB NOT NULL,
    "bucketPolicyManifest" JSONB NOT NULL,
    "scanDerivativeManifest" JSONB NOT NULL,
    "securityTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "securityTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "webUploadRouteTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "webTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "storageProviderSelected" BOOLEAN NOT NULL DEFAULT false,
    "storageProviderConfigured" BOOLEAN NOT NULL DEFAULT false,
    "storageSecretsConfigured" BOOLEAN NOT NULL DEFAULT false,
    "privateBucketAclVerified" BOOLEAN NOT NULL DEFAULT false,
    "derivativeBucketPolicyVerified" BOOLEAN NOT NULL DEFAULT false,
    "signedUploadUrlsProviderBacked" BOOLEAN NOT NULL DEFAULT false,
    "signedDownloadUrlsProviderBacked" BOOLEAN NOT NULL DEFAULT false,
    "serverOwnedObjectKeysEnforced" BOOLEAN NOT NULL DEFAULT false,
    "fileAssetPersistenceTransactional" BOOLEAN NOT NULL DEFAULT false,
    "auditLogPersistenceConfigured" BOOLEAN NOT NULL DEFAULT false,
    "linkTablePersistenceConfigured" BOOLEAN NOT NULL DEFAULT false,
    "signedUrlGrantPersistenceConfigured" BOOLEAN NOT NULL DEFAULT false,
    "malwareScanProviderConfigured" BOOLEAN NOT NULL DEFAULT false,
    "scanVerdictPersistenceConfigured" BOOLEAN NOT NULL DEFAULT false,
    "metadataStrippingWorkerConfigured" BOOLEAN NOT NULL DEFAULT false,
    "publicDerivativeGenerationConfigured" BOOLEAN NOT NULL DEFAULT false,
    "privateOriginalPublicReadDenied" BOOLEAN NOT NULL DEFAULT false,
    "approvedDerivativePublicReadVerified" BOOLEAN NOT NULL DEFAULT false,
    "tenantScopedProviderIntegrationTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "privacyRetentionEnforced" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "securityTypecheckArtifactPath" TEXT,
    "securityTestArtifactPath" TEXT,
    "webTypecheckArtifactPath" TEXT,
    "uploadRouteTestArtifactPath" TEXT,
    "providerConfigArtifactPath" TEXT,
    "bucketPolicyArtifactPath" TEXT,
    "signedUrlProviderArtifactPath" TEXT,
    "fileAssetPersistenceArtifactPath" TEXT,
    "scanDerivativeWorkerArtifactPath" TEXT,
    "privateOriginalDenialArtifactPath" TEXT,
    "tenantIsolationArtifactPath" TEXT,
    "retentionArtifactPath" TEXT,
    "ciEvidenceArtifactPath" TEXT,
    "secretSafeArtifactsPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderStorageUploadRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderStorageUploadRun_tenantId_runId_key" ON "ProviderStorageUploadRun"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "ProviderStorageUploadRun_tenantId_status_idx" ON "ProviderStorageUploadRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ProviderStorageUploadRun_tenantId_createdAt_idx" ON "ProviderStorageUploadRun"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProviderStorageUploadRun" ADD CONSTRAINT "ProviderStorageUploadRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
