-- Add durable notification/message idempotency and read-state storage for GAP-064.

CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'claimed',
    "result" JSONB,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationReadState" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "messageId" TEXT,
    "actorUserId" TEXT,
    "clientId" TEXT,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationReadState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IdempotencyKey_tenantId_scope_key_key" ON "IdempotencyKey"("tenantId", "scope", "key");
CREATE INDEX "IdempotencyKey_tenantId_scope_status_idx" ON "IdempotencyKey"("tenantId", "scope", "status");
CREATE INDEX "IdempotencyKey_tenantId_expiresAt_idx" ON "IdempotencyKey"("tenantId", "expiresAt");

CREATE UNIQUE INDEX "NotificationReadState_tenantId_threadId_actorUserId_clientId_key" ON "NotificationReadState"("tenantId", "threadId", "actorUserId", "clientId");
CREATE INDEX "NotificationReadState_tenantId_threadId_readAt_idx" ON "NotificationReadState"("tenantId", "threadId", "readAt");
CREATE INDEX "NotificationReadState_tenantId_messageId_idx" ON "NotificationReadState"("tenantId", "messageId");

ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationReadState" ADD CONSTRAINT "NotificationReadState_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
