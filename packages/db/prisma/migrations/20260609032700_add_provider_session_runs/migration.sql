-- CreateTable
CREATE TABLE "ProviderSessionRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "controlManifest" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "providerConfigurationManifest" JSONB NOT NULL,
    "tenantIsolationManifest" JSONB NOT NULL,
    "authPackageTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "authPackageTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "providerSelected" BOOLEAN NOT NULL DEFAULT false,
    "providerEnvConfigured" BOOLEAN NOT NULL DEFAULT false,
    "loginCallbackWired" BOOLEAN NOT NULL DEFAULT false,
    "logoutCallbackWired" BOOLEAN NOT NULL DEFAULT false,
    "sessionCallbackWired" BOOLEAN NOT NULL DEFAULT false,
    "userProvisioningConfigured" BOOLEAN NOT NULL DEFAULT false,
    "tenantMembershipLookupPersisted" BOOLEAN NOT NULL DEFAULT false,
    "customRoleLookupPersisted" BOOLEAN NOT NULL DEFAULT false,
    "databaseSessionStoreConfigured" BOOLEAN NOT NULL DEFAULT false,
    "sessionRevocationPersisted" BOOLEAN NOT NULL DEFAULT false,
    "secureDashboardCookiesConfigured" BOOLEAN NOT NULL DEFAULT false,
    "mobileTokenStorageConfigured" BOOLEAN NOT NULL DEFAULT false,
    "auditLogWritesConfigured" BOOLEAN NOT NULL DEFAULT false,
    "providerBackedTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "crossTenantSmokeTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "commandEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "authTypecheckArtifactPath" TEXT,
    "authTestArtifactPath" TEXT,
    "providerEnvArtifactPath" TEXT,
    "loginCallbackArtifactPath" TEXT,
    "logoutCallbackArtifactPath" TEXT,
    "sessionCallbackArtifactPath" TEXT,
    "persistenceArtifactPath" TEXT,
    "securityControlsArtifactPath" TEXT,
    "auditLogArtifactPath" TEXT,
    "tenantIsolationSmokeArtifactPath" TEXT,
    "mobileRevocationSmokeArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderSessionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderSessionRun_tenantId_runId_key" ON "ProviderSessionRun"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "ProviderSessionRun_tenantId_status_idx" ON "ProviderSessionRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ProviderSessionRun_tenantId_createdAt_idx" ON "ProviderSessionRun"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProviderSessionRun" ADD CONSTRAINT "ProviderSessionRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
