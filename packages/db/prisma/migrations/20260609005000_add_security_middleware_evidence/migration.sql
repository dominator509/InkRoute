CREATE TABLE "SecurityMiddlewareEvidence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "routePattern" TEXT NOT NULL,
    "headerSmokePassed" BOOLEAN NOT NULL DEFAULT false,
    "productionHstsVerified" BOOLEAN NOT NULL DEFAULT false,
    "previewLocalHstsSuppressed" BOOLEAN NOT NULL DEFAULT false,
    "cspProviderConnectSrcVerified" BOOLEAN NOT NULL DEFAULT false,
    "cspFrameBaseFormInvariantPassed" BOOLEAN NOT NULL DEFAULT false,
    "csrfAttackRejected" BOOLEAN NOT NULL DEFAULT false,
    "csrfValidSessionAllowed" BOOLEAN NOT NULL DEFAULT false,
    "sameSiteSessionBoundVerified" BOOLEAN NOT NULL DEFAULT false,
    "signedWebhookBypassReviewed" BOOLEAN NOT NULL DEFAULT false,
    "artifactObjectKey" TEXT,
    "redactedMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityMiddlewareEvidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SecurityMiddlewareEvidence_tenantId_surface_environment_idx" ON "SecurityMiddlewareEvidence"("tenantId", "surface", "environment");
CREATE INDEX "SecurityMiddlewareEvidence_tenantId_routePattern_idx" ON "SecurityMiddlewareEvidence"("tenantId", "routePattern");
CREATE INDEX "SecurityMiddlewareEvidence_tenantId_createdAt_idx" ON "SecurityMiddlewareEvidence"("tenantId", "createdAt");

ALTER TABLE "SecurityMiddlewareEvidence" ADD CONSTRAINT "SecurityMiddlewareEvidence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;