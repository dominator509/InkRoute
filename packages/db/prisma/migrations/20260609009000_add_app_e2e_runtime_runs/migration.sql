CREATE TABLE "AppE2eRuntimeRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "runtimeMatrix" JSONB NOT NULL,
    "specFiles" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "webBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "dashboardBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "webRuntimeStarted" BOOLEAN NOT NULL DEFAULT false,
    "dashboardRuntimeStarted" BOOLEAN NOT NULL DEFAULT false,
    "chromiumInstalled" BOOLEAN NOT NULL DEFAULT false,
    "publicSpecsPassed" BOOLEAN NOT NULL DEFAULT false,
    "dashboardSpecsPassed" BOOLEAN NOT NULL DEFAULT false,
    "e2eManifestVerified" BOOLEAN NOT NULL DEFAULT false,
    "tracesRetained" BOOLEAN NOT NULL DEFAULT false,
    "screenshotsRetained" BOOLEAN NOT NULL DEFAULT false,
    "videosRetained" BOOLEAN NOT NULL DEFAULT false,
    "ciE2ePassed" BOOLEAN NOT NULL DEFAULT false,
    "flakyRetriesConfigured" BOOLEAN NOT NULL DEFAULT false,
    "hardenedFailuresCommitted" BOOLEAN NOT NULL DEFAULT false,
    "failureHardeningArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppE2eRuntimeRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppE2eRuntimeRun_tenantId_runId_key" ON "AppE2eRuntimeRun"("tenantId", "runId");
CREATE INDEX "AppE2eRuntimeRun_tenantId_status_idx" ON "AppE2eRuntimeRun"("tenantId", "status");
CREATE INDEX "AppE2eRuntimeRun_tenantId_createdAt_idx" ON "AppE2eRuntimeRun"("tenantId", "createdAt");

ALTER TABLE "AppE2eRuntimeRun" ADD CONSTRAINT "AppE2eRuntimeRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;