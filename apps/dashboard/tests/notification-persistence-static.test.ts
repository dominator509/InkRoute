import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedNotificationPersistencePayload,
  createInMemoryNotificationPersistenceRepository,
} from "../lib/notificationPersistenceRepository";

const persistenceSource = readFileSync(join(process.cwd(), "apps/dashboard/lib/notificationPersistence.ts"), "utf8");
const repositoryContractSource = readFileSync(join(process.cwd(), "apps/dashboard/lib/notificationPersistenceRepository.ts"), "utf8");
const messageRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/messages/route.ts"), "utf8");
const messagePageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/messages/page.tsx"), "utf8");
const messageActionPanelSource = readFileSync(join(process.cwd(), "apps/dashboard/components/MessageActionPanel.tsx"), "utf8");

describe("dashboard notification persistence write contract", () => {
  it("uses the notification package persistence readiness plan and message draft helpers", () => {
    expect(persistenceSource).toContain("buildNotificationPersistenceRuntimeReadinessPlan");
    expect(persistenceSource).toContain("buildMessageThreadDraft");
    expect(persistenceSource).toContain("buildNotificationProviderHandoffWorkerPlan");
    expect(persistenceSource).toContain("dashboardNotificationPersistenceContract");
    expect(persistenceSource).toContain("dashboardMessagePersistenceRequiredControls");
    expect(persistenceSource).toContain("requiredControls: dashboardMessagePersistenceRequiredControls");
    expect(repositoryContractSource).toContain("notificationPersistenceRepositoryContract");
    expect(repositoryContractSource).toContain("assertNotificationPersistenceRepositoryContract");
  });

  it("defines write plans for messages, notifications, deliveries, audit logs, and idempotency", () => {
    expect(persistenceSource).toContain("MessageThread");
    expect(persistenceSource).toContain("Message");
    expect(persistenceSource).toContain("Notification");
    expect(persistenceSource).toContain("NotificationDelivery");
    expect(persistenceSource).toContain("NotificationDeliveryStatusTransition");
    expect(persistenceSource).toContain("NotificationProviderHandoff");
    expect(persistenceSource).toContain("NotificationReadState");
    expect(persistenceSource).toContain("AuditLog");
    expect(persistenceSource).toContain("IdempotencyKey");
    expect(persistenceSource).toContain("destinationHash");
    expect(persistenceSource).toContain("redactedDashboardMessagePreview");
  });

  it("exposes repository methods for status transitions, read state, audit, and idempotency seams", () => {
    expect(persistenceSource).toContain("updateDeliveryStatus");
    expect(persistenceSource).toContain("createNotificationDeliveryStatusTransition");
    expect(persistenceSource).toContain("createNotificationProviderHandoff");
    expect(persistenceSource).toContain("markThreadMessagesRead");
    expect(persistenceSource).toContain("upsertNotificationReadState");
    expect(persistenceSource).toContain("writeNotificationAuditLog");
    expect(persistenceSource).toContain("claimMessageIdempotencyKey");
    expect(repositoryContractSource).toContain("tenantScopedFiltersRequired");
    expect(repositoryContractSource).toContain("transactionRequired");
    expect(repositoryContractSource).toContain("rawBodyStorageForbidden");
    expect(repositoryContractSource).toContain("createNotificationProviderHandoff");
    expect(persistenceSource).toContain("providerHandoffWorkerPlan");
    expect(persistenceSource).toContain("claim_due_handoff");
  });

  it("redacts nested notification persistence payloads before local repository capture", () => {
    const payload = buildRedactedNotificationPersistencePayload({
      action: "message_created",
      body: "private message body",
      nested: {
        destination: "client@example.test",
        providerMessageId: "provider_secret_id",
      },
    });

    expect(payload).toEqual({
      action: "message_created",
      body: "[redacted]",
      nested: {
        destination: "[redacted]",
        providerMessageId: "[redacted]",
      },
    });
    expect(JSON.stringify(payload)).not.toContain("private message body");
    expect(JSON.stringify(payload)).not.toContain("client@example.test");
    expect(JSON.stringify(payload)).not.toContain("provider_secret_id");
  });

  it("executes a local notification persistence repository contract for idempotency, read state, status transitions, provider handoff, audit, and redacted transactions", () => {
    const repository = createInMemoryNotificationPersistenceRepository();
    const firstClaim = repository.claimMessageIdempotencyKey({
      tenantId: "tenant_demo",
      key: "message-key",
      requestId: "request-1",
      redactedCommittedResult: {
        messageId: "message_demo",
        body: "private committed body",
      },
    });
    const duplicateClaim = repository.claimMessageIdempotencyKey({
      tenantId: "tenant_demo",
      key: "message-key",
      requestId: "request-1",
    });

    repository.createMessageThreadInTransaction({
      tenantId: "tenant_demo",
      payload: { subject: "Appointment prep", body: "private thread body" },
    });
    repository.appendMessageInTransaction({
      tenantId: "tenant_demo",
      payload: { body: "private appended body", destination: "client@example.test" },
    });
    repository.upsertNotificationReadState({
      tenantId: "tenant_demo",
      threadId: "thread_demo",
      userId: "user_demo",
      readAt: "2026-06-14T00:00:00.000Z",
    });
    repository.createNotificationDeliveryStatusTransition({
      tenantId: "tenant_demo",
      deliveryId: "delivery_demo",
      status: "queued",
      occurredAt: "2026-06-14T00:00:00.000Z",
    });
    repository.createNotificationProviderHandoff({
      tenantId: "tenant_demo",
      deliveryId: "delivery_demo",
      payload: {
        action: "send_email",
        body: "private provider body",
        providerMessageId: "provider_secret_id",
      },
    });
    repository.writeNotificationAuditLog({
      tenantId: "tenant_demo",
      action: "message_created",
      metadata: { clientName: "Private Client", status: "queued" },
    });

    expect(firstClaim).toBe("claimed");
    expect(duplicateClaim).toBe("duplicate");
    expect(repository.state.transactions.map((entry) => entry.model)).toEqual(["MessageThread", "Message"]);
    expect(repository.state.readStates.size).toBe(1);
    expect(repository.state.statusTransitions).toHaveLength(1);
    expect(repository.state.providerHandoffs).toHaveLength(1);
    expect(repository.state.auditLogs).toHaveLength(1);
    expect(JSON.stringify(repository.state)).not.toContain("private committed body");
    expect(JSON.stringify(repository.state)).not.toContain("private provider body");
    expect(JSON.stringify(repository.state)).not.toContain("provider_secret_id");
    expect(JSON.stringify(repository.state)).not.toContain("Private Client");
  });

  it("wires dashboard message POST through RBAC, tenant checks, transaction writes, and redacted responses", () => {
    expect(messageRouteSource).toContain("export async function POST");
    expect(messageRouteSource).toContain('import { prisma } from "@inkroute/db"');
    expect(messageRouteSource).toContain('assertPermission(actor, "message:write")');
    expect(messageRouteSource).toContain('code: "TENANT_MISMATCH"');
    expect(messageRouteSource).toContain("buildDashboardMessagePersistencePlan");
    expect(messageRouteSource).toContain("prisma.$transaction");
    expect(messageRouteSource).toContain("tx.messageThread.create");
    expect(messageRouteSource).toContain("tx.message.create");
    expect(messageRouteSource).toContain("tx.notification.create");
    expect(messageRouteSource).toContain("tx.notificationDelivery.create");
    expect(messageRouteSource).toContain("tx.notificationDeliveryStatusTransition.create");
    expect(messageRouteSource).toContain("tx.notificationProviderHandoff.create");
    expect(messageRouteSource).toContain("tx.idempotencyKey.create");
    expect(messageRouteSource).toContain("tx.idempotencyKey.update");
    expect(messageRouteSource).toContain("tx.notificationReadState.upsert");
    expect(messageRouteSource).toContain("tx.auditLog.create");
    expect(messageRouteSource).toContain('code: "DUPLICATE_MESSAGE_WRITE"');
    expect(messageRouteSource).toContain("plan.redactedBodyPreview");
    expect(messageRouteSource).toContain("function buildDashboardMessageWriteResponseProjection");
    expect(messageRouteSource).toContain("tenantIdEchoed: false");
    expect(messageRouteSource).toContain("threadIdEchoed: false");
    expect(messageRouteSource).toContain("messageIdEchoed: false");
    expect(messageRouteSource).toContain("notificationIdEchoed: false");
    expect(messageRouteSource).toContain("deliveryIdEchoed: false");
    expect(messageRouteSource).toContain("readStateIdEchoed: false");
    expect(messageRouteSource).toContain("deliveryStatusTransitionIdEchoed: false");
    expect(messageRouteSource).toContain("providerHandoffIdEchoed: false");
    expect(messageRouteSource).toContain("auditIdEchoed: false");
    expect(messageRouteSource).toContain("rawMessageBodyEchoed: false");
    expect(messageRouteSource).toContain("rawDestinationHashEchoed: false");
    expect(messageRouteSource).toContain("rawIdempotencyKeyEchoed: false");
    expect(messageRouteSource).toContain("tenantScope: { actorTenantMatched: true }");
    expect(messageRouteSource).not.toContain("tenantId,\n          error:");
    expect(messageRouteSource).not.toContain("tenantId,\n        persistence");
    expect(messageRouteSource).toContain("tenant-scoped message write contract");
    expect(messageRouteSource).not.toContain("tenant-scoped write plan only");
    expect(messageRouteSource).toContain('"Cache-Control": "no-store"');
  });

  it("replaces the disabled message placeholder with a gated dashboard message action", () => {
    expect(messagePageSource).toContain("MessageActionPanel");
    expect(messageActionPanelSource).toContain('fetch("/api/messages"');
    expect(messageActionPanelSource).toContain("Queue safe follow-up");
    expect(messageActionPanelSource).toContain("Provider email, SMS, push delivery, inbound routing, and reconciliation remain evidence-gated.");
    expect(messageActionPanelSource).toContain("requestId");
  });
});
