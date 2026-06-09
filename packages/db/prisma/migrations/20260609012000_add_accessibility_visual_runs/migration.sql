CREATE TABLE "AccessibilityVisualRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "runtimeMatrix" JSONB NOT NULL,
    "specFiles" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "webA11ySpecPassed" BOOLEAN NOT NULL DEFAULT false,
    "dashboardA11ySpecPassed" BOOLEAN NOT NULL DEFAULT false,
    "axeReportsCollected" BOOLEAN NOT NULL DEFAULT false,
    "lighthouseBudgetsPassed" BOOLEAN NOT NULL DEFAULT false,
    "contrastAuditPassed" BOOLEAN NOT NULL DEFAULT false,
    "responsiveChecksPassed" BOOLEAN NOT NULL DEFAULT false,
    "screenReaderPassCompleted" BOOLEAN NOT NULL DEFAULT false,
    "mobileAccessibilityQaPassed" BOOLEAN NOT NULL DEFAULT false,
    "visualBaselinesCaptured" BOOLEAN NOT NULL DEFAULT false,
    "visualDiffsReviewed" BOOLEAN NOT NULL DEFAULT false,
    "artifactsRetained" BOOLEAN NOT NULL DEFAULT false,
    "ciAccessibilityVisualPassed" BOOLEAN NOT NULL DEFAULT false,
    "regressionsTriagedAndFixed" BOOLEAN NOT NULL DEFAULT false,
    "triageArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessibilityVisualRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccessibilityVisualRun_tenantId_runId_key" ON "AccessibilityVisualRun"("tenantId", "runId");
CREATE INDEX "AccessibilityVisualRun_tenantId_status_idx" ON "AccessibilityVisualRun"("tenantId", "status");
CREATE INDEX "AccessibilityVisualRun_tenantId_createdAt_idx" ON "AccessibilityVisualRun"("tenantId", "createdAt");

ALTER TABLE "AccessibilityVisualRun" ADD CONSTRAINT "AccessibilityVisualRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;