CREATE TABLE "AgentTaskTrackingRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "queueTaskMatrix" JSONB NOT NULL,
    "plannedIssueMatrix" JSONB NOT NULL,
    "trackingLinkMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "verifierPassed" BOOLEAN NOT NULL DEFAULT false,
    "queueIssueParityVerified" BOOLEAN NOT NULL DEFAULT false,
    "defaultLabelsApplied" BOOLEAN NOT NULL DEFAULT false,
    "targetPriorityLabelsApplied" BOOLEAN NOT NULL DEFAULT false,
    "gapIdsLinked" BOOLEAN NOT NULL DEFAULT false,
    "acceptanceEvidenceFieldsLinked" BOOLEAN NOT NULL DEFAULT false,
    "githubIssuesCreated" BOOLEAN NOT NULL DEFAULT false,
    "githubProjectItemsLinked" BOOLEAN NOT NULL DEFAULT false,
    "redactedTrackingUrlsRecorded" BOOLEAN NOT NULL DEFAULT false,
    "handoffDocsLinked" BOOLEAN NOT NULL DEFAULT false,
    "gapTrackerLinked" BOOLEAN NOT NULL DEFAULT false,
    "statusUpdatesTraceable" BOOLEAN NOT NULL DEFAULT false,
    "ciTaskTrackingArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "issueCreateArtifactPath" TEXT,
    "projectSyncArtifactPath" TEXT,
    "docLinksArtifactPath" TEXT,
    "gapLinksArtifactPath" TEXT,
    "statusTraceabilityArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentTaskTrackingRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgentTaskTrackingRun_tenantId_runId_key" ON "AgentTaskTrackingRun"("tenantId", "runId");
CREATE INDEX "AgentTaskTrackingRun_tenantId_status_idx" ON "AgentTaskTrackingRun"("tenantId", "status");
CREATE INDEX "AgentTaskTrackingRun_tenantId_createdAt_idx" ON "AgentTaskTrackingRun"("tenantId", "createdAt");

ALTER TABLE "AgentTaskTrackingRun" ADD CONSTRAINT "AgentTaskTrackingRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
