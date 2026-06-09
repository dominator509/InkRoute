CREATE TABLE "PerformanceLoadRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "runtimeMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "performanceBudgetVerifierPassed" BOOLEAN NOT NULL DEFAULT false,
    "lighthouseCiPassed" BOOLEAN NOT NULL DEFAULT false,
    "coreWebVitalsWithinBudget" BOOLEAN NOT NULL DEFAULT false,
    "publicRouteBudgetsPassed" BOOLEAN NOT NULL DEFAULT false,
    "dashboardRouteBudgetsPassed" BOOLEAN NOT NULL DEFAULT false,
    "bookingLoadTestPassed" BOOLEAN NOT NULL DEFAULT false,
    "webhookBurstTestPassed" BOOLEAN NOT NULL DEFAULT false,
    "uploadIntentLoadTestPassed" BOOLEAN NOT NULL DEFAULT false,
    "dbExplainPlansPassed" BOOLEAN NOT NULL DEFAULT false,
    "imageOptimizationBenchmarksPassed" BOOLEAN NOT NULL DEFAULT false,
    "regressionThresholdsConfigured" BOOLEAN NOT NULL DEFAULT false,
    "performanceArtifactsRetained" BOOLEAN NOT NULL DEFAULT false,
    "ciPerformanceJobPassed" BOOLEAN NOT NULL DEFAULT false,
    "regressionsTriagedAndFixed" BOOLEAN NOT NULL DEFAULT false,
    "triageArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceLoadRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PerformanceLoadRun_tenantId_runId_key" ON "PerformanceLoadRun"("tenantId", "runId");
CREATE INDEX "PerformanceLoadRun_tenantId_status_idx" ON "PerformanceLoadRun"("tenantId", "status");
CREATE INDEX "PerformanceLoadRun_tenantId_createdAt_idx" ON "PerformanceLoadRun"("tenantId", "createdAt");

ALTER TABLE "PerformanceLoadRun" ADD CONSTRAINT "PerformanceLoadRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;