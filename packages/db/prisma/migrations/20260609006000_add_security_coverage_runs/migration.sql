CREATE TABLE "SecurityCoverageRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "suiteMatrix" JSONB NOT NULL,
    "providerGatedSuites" JSONB,
    "artifactManifest" JSONB NOT NULL,
    "failureFixturesPath" TEXT,
    "dbIsolationCovered" BOOLEAN NOT NULL DEFAULT false,
    "storageNegativeCovered" BOOLEAN NOT NULL DEFAULT false,
    "privacyWorkflowCovered" BOOLEAN NOT NULL DEFAULT false,
    "roleBoundaryCovered" BOOLEAN NOT NULL DEFAULT false,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityCoverageRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SecurityCoverageRun_tenantId_runId_key" ON "SecurityCoverageRun"("tenantId", "runId");
CREATE INDEX "SecurityCoverageRun_tenantId_status_idx" ON "SecurityCoverageRun"("tenantId", "status");
CREATE INDEX "SecurityCoverageRun_tenantId_createdAt_idx" ON "SecurityCoverageRun"("tenantId", "createdAt");

ALTER TABLE "SecurityCoverageRun" ADD CONSTRAINT "SecurityCoverageRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;