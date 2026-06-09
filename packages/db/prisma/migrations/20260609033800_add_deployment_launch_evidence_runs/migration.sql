-- Add durable deployment launch evidence run tracking.
CREATE TABLE "DeploymentLaunchEvidenceRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "providerGateEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "environmentGateEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "databaseGateEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "mobileGateEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciGateEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "rollbackGateEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "evidencePacketPath" TEXT,
    "providerArtifactSafetyPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeploymentLaunchEvidenceRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeploymentLaunchEvidenceRun_tenantId_runId_key" ON "DeploymentLaunchEvidenceRun"("tenantId", "runId");
CREATE INDEX "DeploymentLaunchEvidenceRun_tenantId_status_idx" ON "DeploymentLaunchEvidenceRun"("tenantId", "status");
CREATE INDEX "DeploymentLaunchEvidenceRun_commitSha_idx" ON "DeploymentLaunchEvidenceRun"("commitSha");

ALTER TABLE "DeploymentLaunchEvidenceRun" ADD CONSTRAINT "DeploymentLaunchEvidenceRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
