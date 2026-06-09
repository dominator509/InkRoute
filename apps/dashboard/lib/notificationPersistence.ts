import {
  buildMessageThreadDraft,
  buildNotificationPersistenceRuntimeReadinessPlan,
  type MessageThreadDraft,
  type NotificationPersistenceRuntimeReadinessPlan,
} from "@inkroute/notifications";

export type DashboardMessageWriteAction = "create_thread_message" | "append_message" | "mark_thread_read" | "record_delivery_status";

export interface DashboardMessagePersistenceInput {
  tenantId: string;
  actorUserId: string;
  clientId: string;
  threadId?: string;
  subject: string;
  body: string;
  channel?: "in_app" | "email" | "sms" | "system";
  direction?: "inbound" | "outbound" | "internal" | "system";
  status?: "draft" | "queued" | "sent" | "delivered" | "failed" | "read";
  bookingRequestId?: string;
  appointmentId?: string;
  requestId: string;
  notificationType?: string;
  deliveryChannel?: "in_app" | "email" | "sms" | "push";
}

export interface DashboardMessagePersistencePlan {
  status: "ready" | "blocked";
  action: DashboardMessageWriteAction;
  tenantId: string;
  threadId: string | null;
  idempotencyKey: string;
  threadDraft: MessageThreadDraft;
  redactedBodyPreview: string;
  destinationHash: string;
  requiredWrites: readonly string[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

export interface DashboardNotificationPersistenceContract {
  runtimeReadiness: NotificationPersistenceRuntimeReadinessPlan;
  createThreadMessagePlan: DashboardMessagePersistencePlan;
  markReadPlan: DashboardMessagePersistencePlan;
  requiredRepositoryMethods: readonly string[];
}

function compactText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function redactedDashboardMessagePreview(value: string): string {
  const compact = compactText(value);
  if (!compact) return "[redacted-empty-message]";
  return compact.length > 0 ? "[redacted-message-body]" : "";
}

export function stableDashboardDestinationHash(value: string): string {
  let hash = 17;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1_000_000_007;
  }
  return `dest_${hash.toString(36)}`;
}

export function buildDashboardMessagePersistencePlan(
  action: DashboardMessageWriteAction,
  input: DashboardMessagePersistenceInput,
): DashboardMessagePersistencePlan {
  const blockers: string[] = [];
  if (!input.tenantId.trim()) blockers.push("Tenant scope is required before message persistence.");
  if (!input.actorUserId.trim()) blockers.push("Actor user id is required before message persistence.");
  if (!input.clientId.trim()) blockers.push("Client id is required before message persistence.");
  if (!input.requestId.trim()) blockers.push("Request id is required for message persistence idempotency.");
  if ((action === "append_message" || action === "mark_thread_read" || action === "record_delivery_status") && !input.threadId?.trim()) {
    blockers.push("Existing thread id is required for this message persistence action.");
  }
  if ((action === "create_thread_message" || action === "append_message") && !compactText(input.body)) {
    blockers.push("Message body is required before message persistence.");
  }

  const threadDraft = buildMessageThreadDraft({
    subject: compactText(input.subject) || "Untitled message thread",
    body: input.body,
    channel: input.channel ?? "in_app",
    direction: input.direction ?? "outbound",
    status: input.status ?? "queued",
    ...(input.bookingRequestId ? { relatedBookingRequestId: input.bookingRequestId } : {}),
    ...(input.appointmentId ? { relatedAppointmentId: input.appointmentId } : {}),
  });
  const threadId = input.threadId?.trim() ? input.threadId : null;

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    action,
    tenantId: input.tenantId,
    threadId,
    idempotencyKey: `message-persistence:${input.tenantId}:${action}:${input.requestId}`,
    threadDraft,
    redactedBodyPreview: redactedDashboardMessagePreview(input.body),
    destinationHash: stableDashboardDestinationHash(`${input.tenantId}:${input.clientId}:${input.deliveryChannel ?? input.channel ?? "in_app"}`),
    requiredWrites: action === "mark_thread_read"
      ? ["Message", "AuditLog", "IdempotencyKey"]
      : action === "record_delivery_status"
        ? ["NotificationDelivery", "AuditLog", "IdempotencyKey"]
        : ["MessageThread", "Message", "Notification", "NotificationDelivery", "AuditLog", "IdempotencyKey"],
    requiredControls: [
      "Require message:write before creating message or notification persistence rows.",
      "Write MessageThread, Message, Notification, NotificationDelivery, and AuditLog rows in one tenant-scoped transaction when models are present.",
      "Hash destinations and return redacted message previews rather than raw body/provider destination fields.",
      "Use request idempotency keys before allowing retries or worker handoff.",
      "Reject tenant mismatches before any database mutation.",
      "Keep provider worker handoff explicit; provider sends are handled by provider-specific contracts.",
    ],
    blockers,
  };
}

export function buildDashboardNotificationPersistenceContract(): DashboardNotificationPersistenceContract {
  const baseInput: DashboardMessagePersistenceInput = {
    tenantId: "tenant_demo",
    actorUserId: "user_mara_demo",
    clientId: "client_demo",
    subject: "Appointment prep",
    body: "Your appointment prep message is ready in InkRoute.",
    requestId: "message_write_demo",
    notificationType: "appointment_prep_24h",
    deliveryChannel: "in_app",
  };

  return {
    runtimeReadiness: buildNotificationPersistenceRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      notificationTestsPassed: false,
      notificationTypecheckPassed: false,
      prismaModelsMigrated: true,
      repositoriesImplemented: true,
      tenantScopedQueriesEnforced: true,
      transactionalWritesConfigured: true,
      messageThreadPersistenceAvailable: true,
      messagePersistenceAvailable: true,
      notificationPersistenceAvailable: true,
      deliveryPersistenceAvailable: true,
      deliveryStatusTransitionPersistenceAvailable: false,
      readStatePersistenceAvailable: false,
      auditLogPersistenceAvailable: true,
      idempotencyStoreAvailable: false,
      destinationHashingEnforced: true,
      bodyPreviewRedactionEnforced: true,
      rbacIntegrationEnforced: true,
      postgresIntegrationTestsPassed: false,
      crossTenantIsolationTestsPassed: false,
    }),
    createThreadMessagePlan: buildDashboardMessagePersistencePlan("create_thread_message", baseInput),
    markReadPlan: buildDashboardMessagePersistencePlan("mark_thread_read", { ...baseInput, threadId: "thread_demo", body: "read" }),
    requiredRepositoryMethods: [
      "createMessageThreadInTransaction",
      "appendMessageInTransaction",
      "createNotificationRecord",
      "createNotificationDeliveryRecord",
      "updateDeliveryStatus",
      "markThreadMessagesRead",
      "writeNotificationAuditLog",
      "claimMessageIdempotencyKey",
    ],
  };
}

export const dashboardNotificationPersistenceContract = buildDashboardNotificationPersistenceContract();
