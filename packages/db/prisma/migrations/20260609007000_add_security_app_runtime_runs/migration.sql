CREATE TABLE "SecurityAppRuntimeRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "targetMatrix" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "webTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "webBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "dashboardTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "dashboardBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "mobileTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "routeSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "middlewareSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "browserRuntimeSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "mobileDeviceSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "deviceGatedTargets" JSONB,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityAppRuntimeRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SecurityAppRuntimeRun_tenantId_runId_key" ON "SecurityAppRuntimeRun"("tenantId", "runId");
CREATE INDEX "SecurityAppRuntimeRun_tenantId_status_idx" ON "SecurityAppRuntimeRun"("tenantId", "status");
CREATE INDEX "SecurityAppRuntimeRun_tenantId_createdAt_idx" ON "SecurityAppRuntimeRun"("tenantId", "createdAt");

ALTER TABLE "SecurityAppRuntimeRun" ADD CONSTRAINT "SecurityAppRuntimeRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;