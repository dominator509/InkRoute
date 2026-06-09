CREATE TABLE "PrDiffEvidenceRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "diffAuditMatrix" JSONB NOT NULL,
    "fixtureMatrix" JSONB NOT NULL,
    "evidenceRuleMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "diffAuditScriptPresent" BOOLEAN NOT NULL DEFAULT false,
    "prContextDetectionImplemented" BOOLEAN NOT NULL DEFAULT false,
    "missingPrContextSkipsSafely" BOOLEAN NOT NULL DEFAULT false,
    "gapRowParserCoversTrackerColumns" BOOLEAN NOT NULL DEFAULT false,
    "closureRequiresStatusEvidence" BOOLEAN NOT NULL DEFAULT false,
    "closureRequiresVerificationEvidence" BOOLEAN NOT NULL DEFAULT false,
    "blockerDowngradeRequiresEvidence" BOOLEAN NOT NULL DEFAULT false,
    "unrelatedGapChangesIgnored" BOOLEAN NOT NULL DEFAULT false,
    "shallowCheckoutFallbackImplemented" BOOLEAN NOT NULL DEFAULT false,
    "positiveFixturePassed" BOOLEAN NOT NULL DEFAULT false,
    "negativeFixtureFailed" BOOLEAN NOT NULL DEFAULT false,
    "ciPullRequestStepWired" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeLogsVerified" BOOLEAN NOT NULL DEFAULT false,
    "noPrContextArtifactPath" TEXT,
    "mergeFallbackArtifactPath" TEXT,
    "positiveFixtureArtifactPath" TEXT,
    "negativeFixtureArtifactPath" TEXT,
    "secretSafeLogReviewArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrDiffEvidenceRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrDiffEvidenceRun_tenantId_runId_key" ON "PrDiffEvidenceRun"("tenantId", "runId");
CREATE INDEX "PrDiffEvidenceRun_tenantId_status_idx" ON "PrDiffEvidenceRun"("tenantId", "status");
CREATE INDEX "PrDiffEvidenceRun_tenantId_createdAt_idx" ON "PrDiffEvidenceRun"("tenantId", "createdAt");

ALTER TABLE "PrDiffEvidenceRun" ADD CONSTRAINT "PrDiffEvidenceRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
