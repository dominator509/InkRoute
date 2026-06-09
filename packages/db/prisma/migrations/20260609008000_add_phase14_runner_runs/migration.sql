CREATE TABLE "Phase14RunnerRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "frozenInstallPassed" BOOLEAN NOT NULL DEFAULT false,
    "lockfileReproducible" BOOLEAN NOT NULL DEFAULT false,
    "staticChecksPassed" BOOLEAN NOT NULL DEFAULT false,
    "manifestChecksPassed" BOOLEAN NOT NULL DEFAULT false,
    "typecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "unitPassed" BOOLEAN NOT NULL DEFAULT false,
    "playwrightBrowsersInstalled" BOOLEAN NOT NULL DEFAULT false,
    "e2ePassed" BOOLEAN NOT NULL DEFAULT false,
    "ciPassed" BOOLEAN NOT NULL DEFAULT false,
    "runnerFailuresTriaged" BOOLEAN NOT NULL DEFAULT false,
    "runnerFixesCommitted" BOOLEAN NOT NULL DEFAULT false,
    "scaffoldCoveragePreserved" BOOLEAN NOT NULL DEFAULT false,
    "flakyPolicyDocumented" BOOLEAN NOT NULL DEFAULT false,
    "triageArtifactPath" TEXT,
    "scaffoldDiffArtifactPath" TEXT,
    "flakyPolicyArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Phase14RunnerRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Phase14RunnerRun_tenantId_runId_key" ON "Phase14RunnerRun"("tenantId", "runId");
CREATE INDEX "Phase14RunnerRun_tenantId_status_idx" ON "Phase14RunnerRun"("tenantId", "status");
CREATE INDEX "Phase14RunnerRun_tenantId_createdAt_idx" ON "Phase14RunnerRun"("tenantId", "createdAt");

ALTER TABLE "Phase14RunnerRun" ADD CONSTRAINT "Phase14RunnerRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;