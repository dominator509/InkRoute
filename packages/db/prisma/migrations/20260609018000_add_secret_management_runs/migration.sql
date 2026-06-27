CREATE TABLE "SecretManagementRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "productionSecretInventory" JSONB NOT NULL,
    "auditManifest" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "verifierPassed" BOOLEAN NOT NULL DEFAULT false,
    "strictEnvCheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "providerSecretStoresConfigured" BOOLEAN NOT NULL DEFAULT false,
    "maskedCiLogsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "providerAuditLogsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "rotationCadenceDocumented" BOOLEAN NOT NULL DEFAULT false,
    "dualControlPolicyDocumented" BOOLEAN NOT NULL DEFAULT false,
    "incidentRotationTabletopDocumented" BOOLEAN NOT NULL DEFAULT false,
    "committedSecretScanPassed" BOOLEAN NOT NULL DEFAULT false,
    "ciSecretManagementArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "redactedProviderStoreArtifactPath" TEXT,
    "maskedCiLogArtifactPath" TEXT,
    "providerAuditLogArtifactPath" TEXT,
    "incidentRotationTabletopArtifactPath" TEXT,
    "committedSecretScanArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecretManagementRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SecretManagementRun_tenantId_runId_key" ON "SecretManagementRun"("tenantId", "runId");
CREATE INDEX "SecretManagementRun_tenantId_status_idx" ON "SecretManagementRun"("tenantId", "status");
CREATE INDEX "SecretManagementRun_tenantId_createdAt_idx" ON "SecretManagementRun"("tenantId", "createdAt");

ALTER TABLE "SecretManagementRun" ADD CONSTRAINT "SecretManagementRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
