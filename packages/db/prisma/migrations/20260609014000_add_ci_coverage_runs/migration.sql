CREATE TABLE "CiCoverageRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "reportingMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "frozenInstallPassed" BOOLEAN NOT NULL DEFAULT false,
    "typecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "unitCoveragePassed" BOOLEAN NOT NULL DEFAULT false,
    "unitCoverageThresholdsPassed" BOOLEAN NOT NULL DEFAULT false,
    "e2ePassed" BOOLEAN NOT NULL DEFAULT false,
    "vitestReportsUploaded" BOOLEAN NOT NULL DEFAULT false,
    "playwrightReportsUploaded" BOOLEAN NOT NULL DEFAULT false,
    "tracesScreenshotsVideosRetained" BOOLEAN NOT NULL DEFAULT false,
    "testSummaryPublished" BOOLEAN NOT NULL DEFAULT false,
    "artifactRetentionVerified" BOOLEAN NOT NULL DEFAULT false,
    "failedDebugArtifactsVerified" BOOLEAN NOT NULL DEFAULT false,
    "flakyPolicyDocumented" BOOLEAN NOT NULL DEFAULT false,
    "ciRunPassed" BOOLEAN NOT NULL DEFAULT false,
    "branchProtectionRequiresCi" BOOLEAN NOT NULL DEFAULT false,
    "branchProtectionArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CiCoverageRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CiCoverageRun_tenantId_runId_key" ON "CiCoverageRun"("tenantId", "runId");
CREATE INDEX "CiCoverageRun_tenantId_status_idx" ON "CiCoverageRun"("tenantId", "status");
CREATE INDEX "CiCoverageRun_tenantId_createdAt_idx" ON "CiCoverageRun"("tenantId", "createdAt");

ALTER TABLE "CiCoverageRun" ADD CONSTRAINT "CiCoverageRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;