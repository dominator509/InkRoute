-- CreateTable
CREATE TABLE "TestingLaunchExecutionRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "coverageReportManifest" JSONB NOT NULL,
    "playwrightReportManifest" JSONB NOT NULL,
    "policyEvidenceManifest" JSONB NOT NULL,
    "lockfileInstallPassed" BOOLEAN NOT NULL DEFAULT false,
    "staticChecksPassed" BOOLEAN NOT NULL DEFAULT false,
    "manifestChecksPassed" BOOLEAN NOT NULL DEFAULT false,
    "typecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "unitTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "unitCoveragePassed" BOOLEAN NOT NULL DEFAULT false,
    "e2eTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "webBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "dashboardBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "prismaIntegrationTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "providerSandboxTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "securityTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "mobileSimulatorTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "mobileDeviceTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "coverageThresholdsMet" BOOLEAN NOT NULL DEFAULT false,
    "coverageArtifactsUploaded" BOOLEAN NOT NULL DEFAULT false,
    "playwrightArtifactsUploaded" BOOLEAN NOT NULL DEFAULT false,
    "junitJsonReportsPublished" BOOLEAN NOT NULL DEFAULT false,
    "ciRunPassed" BOOLEAN NOT NULL DEFAULT false,
    "branchProtectionRequiresCi" BOOLEAN NOT NULL DEFAULT false,
    "flakyTestPolicyDocumented" BOOLEAN NOT NULL DEFAULT false,
    "failureDebugArtifactsVerified" BOOLEAN NOT NULL DEFAULT false,
    "secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "frozenInstallArtifactPath" TEXT,
    "phase14StaticArtifactPath" TEXT,
    "manifestArtifactPath" TEXT,
    "typecheckArtifactPath" TEXT,
    "unitOutputArtifactPath" TEXT,
    "unitCoverageArtifactPath" TEXT,
    "e2eOutputArtifactPath" TEXT,
    "playwrightReportArtifactPath" TEXT,
    "webBuildArtifactPath" TEXT,
    "dashboardBuildArtifactPath" TEXT,
    "prismaIntegrationArtifactPath" TEXT,
    "providerSandboxArtifactPath" TEXT,
    "securityArtifactPath" TEXT,
    "mobileSimulatorArtifactPath" TEXT,
    "mobileDeviceArtifactPath" TEXT,
    "ciQualityRunArtifactPath" TEXT,
    "branchProtectionArtifactPath" TEXT,
    "flakyPolicyArtifactPath" TEXT,
    "failureDebugArtifactPath" TEXT,
    "secretSafeArtifactPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestingLaunchExecutionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TestingLaunchExecutionRun_tenantId_runId_key" ON "TestingLaunchExecutionRun"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "TestingLaunchExecutionRun_tenantId_status_idx" ON "TestingLaunchExecutionRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "TestingLaunchExecutionRun_tenantId_createdAt_idx" ON "TestingLaunchExecutionRun"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "TestingLaunchExecutionRun" ADD CONSTRAINT "TestingLaunchExecutionRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
