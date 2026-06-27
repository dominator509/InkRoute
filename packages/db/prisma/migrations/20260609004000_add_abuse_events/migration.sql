CREATE TABLE "AbuseEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "routeFamily" TEXT NOT NULL,
    "routePattern" TEXT NOT NULL,
    "abuseKeyHash" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgentHash" TEXT,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "limiterProvider" TEXT,
    "limiterDecision" TEXT NOT NULL,
    "observedRequests" INTEGER,
    "windowSeconds" INTEGER,
    "botChallengeRequired" BOOLEAN NOT NULL DEFAULT false,
    "providerSignatureValid" BOOLEAN,
    "alertDispatchedAt" TIMESTAMP(3),
    "failClosed" BOOLEAN NOT NULL DEFAULT false,
    "redactedMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbuseEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AbuseEvent_tenantId_routeFamily_createdAt_idx" ON "AbuseEvent"("tenantId", "routeFamily", "createdAt");
CREATE INDEX "AbuseEvent_tenantId_abuseKeyHash_idx" ON "AbuseEvent"("tenantId", "abuseKeyHash");
CREATE INDEX "AbuseEvent_tenantId_action_idx" ON "AbuseEvent"("tenantId", "action");
CREATE INDEX "AbuseEvent_tenantId_failClosed_idx" ON "AbuseEvent"("tenantId", "failClosed");

ALTER TABLE "AbuseEvent" ADD CONSTRAINT "AbuseEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AbuseEvent" ADD CONSTRAINT "AbuseEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;