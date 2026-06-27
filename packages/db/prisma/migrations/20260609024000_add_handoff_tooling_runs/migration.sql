CREATE TABLE "HandoffToolingRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "rootScriptMatrix" JSONB NOT NULL,
    "packageScriptMatrix" JSONB NOT NULL,
    "reportArtifactManifest" JSONB NOT NULL,
    "ciEvidenceManifest" JSONB NOT NULL,
    "dependenciesInstalled" BOOLEAN NOT NULL DEFAULT false,
    "packageTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "packageTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "verifyDocsPassed" BOOLEAN NOT NULL DEFAULT false,
    "handoffAuditPassed" BOOLEAN NOT NULL DEFAULT false,
    "handoffNextPassed" BOOLEAN NOT NULL DEFAULT false,
    "verifyLedgerPassed" BOOLEAN NOT NULL DEFAULT false,
    "verifyToolingPassed" BOOLEAN NOT NULL DEFAULT false,
    "verifyTaskSyncPassed" BOOLEAN NOT NULL DEFAULT false,
    "handoffAllPassed" BOOLEAN NOT NULL DEFAULT false,
    "queueLedgerParityVerified" BOOLEAN NOT NULL DEFAULT false,
    "ciRunCaptured" BOOLEAN NOT NULL DEFAULT false,
    "reportArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "installArtifactPath" TEXT,
    "packageTypecheckArtifactPath" TEXT,
    "packageTestArtifactPath" TEXT,
    "handoffScriptArtifactPath" TEXT,
    "toolingVerifierArtifactPath" TEXT,
    "handoffAllArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HandoffToolingRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HandoffToolingRun_tenantId_runId_key" ON "HandoffToolingRun"("tenantId", "runId");
CREATE INDEX "HandoffToolingRun_tenantId_status_idx" ON "HandoffToolingRun"("tenantId", "status");
CREATE INDEX "HandoffToolingRun_tenantId_createdAt_idx" ON "HandoffToolingRun"("tenantId", "createdAt");

ALTER TABLE "HandoffToolingRun" ADD CONSTRAINT "HandoffToolingRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
