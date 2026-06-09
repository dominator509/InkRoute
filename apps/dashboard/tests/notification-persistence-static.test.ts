import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const persistenceSource = readFileSync(join(process.cwd(), "apps/dashboard/lib/notificationPersistence.ts"), "utf8");
const messageRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/messages/route.ts"), "utf8");

describe("dashboard notification persistence write contract", () => {
  it("uses the notification package persistence readiness plan and message draft helpers", () => {
    expect(persistenceSource).toContain("buildNotificationPersistenceRuntimeReadinessPlan");
    expect(persistenceSource).toContain("buildMessageThreadDraft");
    expect(persistenceSource).toContain("dashboardNotificationPersistenceContract");
  });

  it("defines write plans for messages, notifications, deliveries, audit logs, and idempotency", () => {
    expect(persistenceSource).toContain("MessageThread");
    expect(persistenceSource).toContain("Message");
    expect(persistenceSource).toContain("Notification");
    expect(persistenceSource).toContain("NotificationDelivery");
    expect(persistenceSource).toContain("AuditLog");
    expect(persistenceSource).toContain("IdempotencyKey");
    expect(persistenceSource).toContain("destinationHash");
    expect(persistenceSource).toContain("redactedDashboardMessagePreview");
  });

  it("exposes repository methods for status transitions, read state, audit, and idempotency seams", () => {
    expect(persistenceSource).toContain("updateDeliveryStatus");
    expect(persistenceSource).toContain("markThreadMessagesRead");
    expect(persistenceSource).toContain("writeNotificationAuditLog");
    expect(persistenceSource).toContain("claimMessageIdempotencyKey");
  });

  it("wires dashboard message POST through RBAC, tenant checks, transaction writes, and redacted responses", () => {
    expect(messageRouteSource).toContain("export async function POST");
    expect(messageRouteSource).toContain('assertPermission(actor, "message:write")');
    expect(messageRouteSource).toContain('code: "TENANT_MISMATCH"');
    expect(messageRouteSource).toContain("buildDashboardMessagePersistencePlan");
    expect(messageRouteSource).toContain("prisma.$transaction");
    expect(messageRouteSource).toContain("tx.messageThread.create");
    expect(messageRouteSource).toContain("tx.message.create");
    expect(messageRouteSource).toContain("tx.notification.create");
    expect(messageRouteSource).toContain("tx.notificationDelivery.create");
    expect(messageRouteSource).toContain("tx.auditLog.create");
    expect(messageRouteSource).toContain("plan.redactedBodyPreview");
    expect(messageRouteSource).toContain('"Cache-Control": "no-store"');
  });
});
