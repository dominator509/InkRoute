-- CreateTable
CREATE TABLE "RuntimeEvidenceRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "requirementManifest" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "redactedEvidenceManifest" JSONB NOT NULL,
    "productionBlockerManifest" JSONB NOT NULL,
    "installEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "runtimeEvidenceCommandPassed" BOOLEAN NOT NULL DEFAULT false,
    "workspaceAllPassed" BOOLEAN NOT NULL DEFAULT false,
    "handoffAllPassed" BOOLEAN NOT NULL DEFAULT false,
    "qualityAllPassed" BOOLEAN NOT NULL DEFAULT false,
    "typecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "unitTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "webBuildEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "dashboardBuildEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "ciRuntimeReadinessPassed" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "runtimeEvidenceAuditPassed" BOOLEAN NOT NULL DEFAULT false,
    "redactedEvidenceLabelsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "productionBlockersVisible" BOOLEAN NOT NULL DEFAULT false,
    "installArtifactPath" TEXT,
    "runtimeEvidenceArtifactPath" TEXT,
    "workspaceAllArtifactPath" TEXT,
    "handoffAllArtifactPath" TEXT,
    "qualityAllArtifactPath" TEXT,
    "typecheckArtifactPath" TEXT,
    "unitTestArtifactPath" TEXT,
    "webBuildArtifactPath" TEXT,
    "dashboardBuildArtifactPath" TEXT,
    "ciRuntimeReadinessArtifactPath" TEXT,
    "productionBlockerArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuntimeEvidenceRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RuntimeEvidenceRun_tenantId_runId_key" ON "RuntimeEvidenceRun"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "RuntimeEvidenceRun_tenantId_status_idx" ON "RuntimeEvidenceRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "RuntimeEvidenceRun_tenantId_createdAt_idx" ON "RuntimeEvidenceRun"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "RuntimeEvidenceRun" ADD CONSTRAINT "RuntimeEvidenceRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
