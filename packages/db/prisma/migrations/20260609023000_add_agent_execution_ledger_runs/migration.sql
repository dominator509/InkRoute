CREATE TABLE "AgentExecutionLedgerRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "queueTaskMatrix" JSONB NOT NULL,
    "ledgerExecutionMatrix" JSONB NOT NULL,
    "changedFilesMatrix" JSONB NOT NULL,
    "evidenceArtifactManifest" JSONB NOT NULL,
    "verifierPassed" BOOLEAN NOT NULL DEFAULT false,
    "handoffAuditPassed" BOOLEAN NOT NULL DEFAULT false,
    "handoffDocsVerified" BOOLEAN NOT NULL DEFAULT false,
    "handoffNextComputed" BOOLEAN NOT NULL DEFAULT false,
    "queueLedgerParityVerified" BOOLEAN NOT NULL DEFAULT false,
    "agentCommandPlansRecorded" BOOLEAN NOT NULL DEFAULT false,
    "redactedCommandTranscriptsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "changedFilesRecorded" BOOLEAN NOT NULL DEFAULT false,
    "providerEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "remainingGapsRecorded" BOOLEAN NOT NULL DEFAULT false,
    "secretSafetyReviewed" BOOLEAN NOT NULL DEFAULT false,
    "gapTrackerUpdated" BOOLEAN NOT NULL DEFAULT false,
    "externalAgentResultsImported" BOOLEAN NOT NULL DEFAULT false,
    "ciLedgerArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "commandTranscriptArtifactPath" TEXT,
    "diffSummaryArtifactPath" TEXT,
    "providerEvidenceArtifactPath" TEXT,
    "secretSafetyArtifactPath" TEXT,
    "gapTrackerUpdateArtifactPath" TEXT,
    "externalResultsImportArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentExecutionLedgerRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgentExecutionLedgerRun_tenantId_runId_key" ON "AgentExecutionLedgerRun"("tenantId", "runId");
CREATE INDEX "AgentExecutionLedgerRun_tenantId_status_idx" ON "AgentExecutionLedgerRun"("tenantId", "status");
CREATE INDEX "AgentExecutionLedgerRun_tenantId_createdAt_idx" ON "AgentExecutionLedgerRun"("tenantId", "createdAt");

ALTER TABLE "AgentExecutionLedgerRun" ADD CONSTRAINT "AgentExecutionLedgerRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
