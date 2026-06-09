CREATE TABLE "MobileDeploymentRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "buildProfileMatrix" JSONB NOT NULL,
    "qaEvidenceMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "verifierPassed" BOOLEAN NOT NULL DEFAULT false,
    "easDevelopmentBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "easPreviewIosBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "easPreviewAndroidBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "easProductionIosBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "easProductionAndroidBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "easChannelsConfigured" BOOLEAN NOT NULL DEFAULT false,
    "nativeCredentialsConfigured" BOOLEAN NOT NULL DEFAULT false,
    "pushCredentialsConfigured" BOOLEAN NOT NULL DEFAULT false,
    "deviceQaPassed" BOOLEAN NOT NULL DEFAULT false,
    "pushTokenSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "sentryCrashCapturePassed" BOOLEAN NOT NULL DEFAULT false,
    "otaPreviewPublishPassed" BOOLEAN NOT NULL DEFAULT false,
    "otaRollbackRehearsed" BOOLEAN NOT NULL DEFAULT false,
    "runtimePolicyParityVerified" BOOLEAN NOT NULL DEFAULT false,
    "storeReadinessReviewed" BOOLEAN NOT NULL DEFAULT false,
    "redactedBuildArtifactsRecorded" BOOLEAN NOT NULL DEFAULT false,
    "ciMobileDeploymentArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "redactedBuildArtifactPath" TEXT,
    "deviceQaArtifactPath" TEXT,
    "otaRollbackArtifactPath" TEXT,
    "storeReadinessArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobileDeploymentRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MobileDeploymentRun_tenantId_runId_key" ON "MobileDeploymentRun"("tenantId", "runId");
CREATE INDEX "MobileDeploymentRun_tenantId_status_idx" ON "MobileDeploymentRun"("tenantId", "status");
CREATE INDEX "MobileDeploymentRun_tenantId_createdAt_idx" ON "MobileDeploymentRun"("tenantId", "createdAt");

ALTER TABLE "MobileDeploymentRun" ADD CONSTRAINT "MobileDeploymentRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
