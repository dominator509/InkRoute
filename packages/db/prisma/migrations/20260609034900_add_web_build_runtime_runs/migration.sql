-- Add durable web build/runtime verification run tracking.
CREATE TABLE "WebBuildRuntimeRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "prismaClientEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "typecheckEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "buildEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "browserSmokeEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "fallbackEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "exactOptionalEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "typecheckOutputPath" TEXT,
    "buildOutputPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebBuildRuntimeRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WebBuildRuntimeRun_tenantId_runId_key" ON "WebBuildRuntimeRun"("tenantId", "runId");
CREATE INDEX "WebBuildRuntimeRun_tenantId_status_idx" ON "WebBuildRuntimeRun"("tenantId", "status");
CREATE INDEX "WebBuildRuntimeRun_commitSha_idx" ON "WebBuildRuntimeRun"("commitSha");

ALTER TABLE "WebBuildRuntimeRun" ADD CONSTRAINT "WebBuildRuntimeRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
