CREATE TABLE "GithubIssueLink" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "errorReportId" TEXT NOT NULL,
  "approvalAuditLogId" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'github',
  "repository" TEXT NOT NULL,
  "issueUrl" TEXT NOT NULL,
  "issueNumber" INTEGER,
  "dispatchState" TEXT NOT NULL,
  "reportFingerprint" TEXT NOT NULL,
  "dashboardStatusSynced" BOOLEAN NOT NULL DEFAULT true,
  "providerDispatchExecuted" BOOLEAN NOT NULL DEFAULT false,
  "rawProviderPayloadStored" BOOLEAN NOT NULL DEFAULT false,
  "artifactPaths" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GithubIssueLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GithubIssueLink_errorReportId_key"
  ON "GithubIssueLink"("errorReportId");

CREATE UNIQUE INDEX "GithubIssueLink_provider_repository_issueNumber_key"
  ON "GithubIssueLink"("provider", "repository", "issueNumber");

CREATE INDEX "GithubIssueLink_tenantId_dispatchState_createdAt_idx"
  ON "GithubIssueLink"("tenantId", "dispatchState", "createdAt");

CREATE INDEX "GithubIssueLink_tenantId_reportFingerprint_idx"
  ON "GithubIssueLink"("tenantId", "reportFingerprint");

ALTER TABLE "GithubIssueLink"
  ADD CONSTRAINT "GithubIssueLink_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GithubIssueLink"
  ADD CONSTRAINT "GithubIssueLink_errorReportId_fkey"
  FOREIGN KEY ("errorReportId") REFERENCES "ErrorReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
