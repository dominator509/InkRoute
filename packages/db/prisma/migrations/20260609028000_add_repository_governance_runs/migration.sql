CREATE TABLE "RepositoryGovernanceRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "sourcePrerequisiteMatrix" JSONB NOT NULL,
    "externalSettingsMatrix" JSONB NOT NULL,
    "enforcementTestMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "governanceAuditPassed" BOOLEAN NOT NULL DEFAULT false,
    "qualityAllGovernancePassed" BOOLEAN NOT NULL DEFAULT false,
    "requiredFilesPresent" BOOLEAN NOT NULL DEFAULT false,
    "codeownersCoveragePassed" BOOLEAN NOT NULL DEFAULT false,
    "prTemplateEvidenceTermsPresent" BOOLEAN NOT NULL DEFAULT false,
    "issueTemplateEvidenceTermsPresent" BOOLEAN NOT NULL DEFAULT false,
    "ciGovernanceTermsPresent" BOOLEAN NOT NULL DEFAULT false,
    "branchProtectionActive" BOOLEAN NOT NULL DEFAULT false,
    "requiredStatusChecksEnforced" BOOLEAN NOT NULL DEFAULT false,
    "codeownersReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "secretScanningEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dependabotOrSecurityAlertsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mergeRulesConfigured" BOOLEAN NOT NULL DEFAULT false,
    "enforcementTestPrCaptured" BOOLEAN NOT NULL DEFAULT false,
    "redactedSettingsEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "governanceAuditArtifactPath" TEXT,
    "qualityAllArtifactPath" TEXT,
    "branchProtectionArtifactPath" TEXT,
    "requiredChecksArtifactPath" TEXT,
    "codeownersReviewArtifactPath" TEXT,
    "securitySettingsArtifactPath" TEXT,
    "mergeRulesArtifactPath" TEXT,
    "enforcementTestPrArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepositoryGovernanceRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RepositoryGovernanceRun_tenantId_runId_key" ON "RepositoryGovernanceRun"("tenantId", "runId");
CREATE INDEX "RepositoryGovernanceRun_tenantId_status_idx" ON "RepositoryGovernanceRun"("tenantId", "status");
CREATE INDEX "RepositoryGovernanceRun_tenantId_createdAt_idx" ON "RepositoryGovernanceRun"("tenantId", "createdAt");

ALTER TABLE "RepositoryGovernanceRun" ADD CONSTRAINT "RepositoryGovernanceRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
