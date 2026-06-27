-- CreateTable
CREATE TABLE "PublicWebLaunchRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "commandMatrix" JSONB NOT NULL,
    "readinessAreaManifest" JSONB NOT NULL,
    "artifactManifest" JSONB NOT NULL,
    "providerRouteManifest" JSONB NOT NULL,
    "runtimeSeoManifest" JSONB NOT NULL,
    "legalRouteReviewManifest" JSONB NOT NULL,
    "webTypecheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "webBuildPassed" BOOLEAN NOT NULL DEFAULT false,
    "webTestsPassed" BOOLEAN NOT NULL DEFAULT false,
    "webRouteSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "webPlaywrightDesktopPassed" BOOLEAN NOT NULL DEFAULT false,
    "webPlaywrightMobilePassed" BOOLEAN NOT NULL DEFAULT false,
    "accessibilityAuditPassed" BOOLEAN NOT NULL DEFAULT false,
    "lighthousePerformancePassed" BOOLEAN NOT NULL DEFAULT false,
    "apiRoutesUseTenantScopedPersistence" BOOLEAN NOT NULL DEFAULT false,
    "providerBackedRoutesVerified" BOOLEAN NOT NULL DEFAULT false,
    "localRuntimeFallbackDisabledForProduction" BOOLEAN NOT NULL DEFAULT false,
    "realPortfolioDerivativesConfigured" BOOLEAN NOT NULL DEFAULT false,
    "placeholderAssetsRemovedOrDocumented" BOOLEAN NOT NULL DEFAULT false,
    "sitemapRuntimeVerified" BOOLEAN NOT NULL DEFAULT false,
    "robotsRuntimeVerified" BOOLEAN NOT NULL DEFAULT false,
    "jsonLdRuntimeVerified" BOOLEAN NOT NULL DEFAULT false,
    "canonicalRuntimeVerified" BOOLEAN NOT NULL DEFAULT false,
    "privacyAndLegalRoutesReviewed" BOOLEAN NOT NULL DEFAULT false,
    "ciEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false,
    "launchArtifactsSecretSafe" BOOLEAN NOT NULL DEFAULT false,
    "webTypecheckArtifactPath" TEXT,
    "webBuildArtifactPath" TEXT,
    "webTestArtifactPath" TEXT,
    "routeSmokeArtifactPath" TEXT,
    "playwrightDesktopArtifactPath" TEXT,
    "playwrightMobileArtifactPath" TEXT,
    "axeAuditArtifactPath" TEXT,
    "lighthouseArtifactPath" TEXT,
    "providerRoutesArtifactPath" TEXT,
    "mediaDerivativesArtifactPath" TEXT,
    "runtimeSeoArtifactPath" TEXT,
    "legalRoutesArtifactPath" TEXT,
    "ciEvidenceArtifactPath" TEXT,
    "secretSafeArtifactsPath" TEXT,
    "ciRunUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicWebLaunchRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicWebLaunchRun_tenantId_runId_key" ON "PublicWebLaunchRun"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "PublicWebLaunchRun_tenantId_status_idx" ON "PublicWebLaunchRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PublicWebLaunchRun_tenantId_createdAt_idx" ON "PublicWebLaunchRun"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "PublicWebLaunchRun" ADD CONSTRAINT "PublicWebLaunchRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
