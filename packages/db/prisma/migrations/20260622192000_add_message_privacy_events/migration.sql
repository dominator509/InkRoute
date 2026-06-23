-- GAP-068: durable messaging privacy workflow/audit persistence.
CREATE TABLE "MessagePrivacyEvent" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "threadId" TEXT,
  "messageId" TEXT,
  "actorUserId" TEXT,
  "role" TEXT,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "workflowStatus" TEXT,
  "retentionDays" INTEGER,
  "redactionFindings" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MessagePrivacyEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessageAuditLog" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "threadId" TEXT,
  "messageId" TEXT,
  "actorUserId" TEXT,
  "role" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MessageAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MessagePrivacyEvent_tenantId_action_createdAt_idx" ON "MessagePrivacyEvent"("tenantId", "action", "createdAt");
CREATE INDEX "MessagePrivacyEvent_tenantId_threadId_idx" ON "MessagePrivacyEvent"("tenantId", "threadId");
CREATE INDEX "MessagePrivacyEvent_tenantId_messageId_idx" ON "MessagePrivacyEvent"("tenantId", "messageId");
CREATE INDEX "MessagePrivacyEvent_tenantId_workflowStatus_idx" ON "MessagePrivacyEvent"("tenantId", "workflowStatus");
CREATE INDEX "MessageAuditLog_tenantId_action_createdAt_idx" ON "MessageAuditLog"("tenantId", "action", "createdAt");
CREATE INDEX "MessageAuditLog_tenantId_threadId_idx" ON "MessageAuditLog"("tenantId", "threadId");
CREATE INDEX "MessageAuditLog_tenantId_messageId_idx" ON "MessageAuditLog"("tenantId", "messageId");

ALTER TABLE "MessagePrivacyEvent" ADD CONSTRAINT "MessagePrivacyEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageAuditLog" ADD CONSTRAINT "MessageAuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
