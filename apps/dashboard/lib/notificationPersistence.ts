import {
  buildMessageThreadDraft,
  buildNotificationProviderHandoffWorkerPlan,
  buildNotificationPersistenceRuntimeReadinessPlan,
  type MessageThreadDraft,
  type NotificationProviderHandoffWorkerPlan,
  type NotificationPersistenceRuntimeReadinessPlan,
} from "@inkroute/notifications";
import { createHash } from "node:crypto";

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
  requiredControls: typeof dashboardMessagePersistenceRequiredControls;
  blockers: readonly string[];
}

export interface DashboardNotificationPersistenceContract {
  runtimeReadiness: NotificationPersistenceRuntimeReadinessPlan;
  createThreadMessagePlan: DashboardMessagePersistencePlan;
  markReadPlan: DashboardMessagePersistencePlan;
  providerHandoffWorkerPlan: NotificationProviderHandoffWorkerPlan;
  requiredRepositoryMethods: readonly string[];
}

function compactText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function buildDashboardMessageIdempotencyKey(parts: readonly string[]): string {
  return `message-persistence:${createHash("sha256").update(JSON.stringify(parts)).digest("hex")}`;
}

export function redactedDashboardMessagePreview(value: string): string {
  const compact = compactText(value);
  if (!compact) return "[redacted-empty-message]";
  return compact.length > 0 ? "[redacted-message-body]" : "";
}

export function stableDashboardDestinationHash(value: string): string {
  return `dest_${createHash("sha256").update(value).digest("hex")}`;
}

export const dashboardMessagePersistenceRequiredControls = [
      "Require message:write before creating message or notification persistence rows.",
      "Write MessageThread, Message, Notification, NotificationDelivery, and AuditLog rows in one tenant-scoped transaction when models are present.",
      "Hash destinations and return redacted message previews rather than raw body/provider destination fields.",
      "Hash related booking and appointment selectors in reusable message drafts instead of echoing raw IDs.",
      "Claim request idempotency keys before side effects and store redacted committed result ids.",
      "Record NotificationReadState rows for dashboard read/write state without storing raw message bodies.",
      "Persist NotificationDeliveryStatusTransition rows for delivery state changes.",
      "Create NotificationProviderHandoff rows with sanitized payloads so provider workers consume source rows instead of raw request bodies.",
      "Reject tenant mismatches before any database mutation.",
      "Keep provider worker execution evidence explicit; provider sends are handled by provider-specific contracts.",
    ] as const;

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
    idempotencyKey: buildDashboardMessageIdempotencyKey([input.tenantId, action, input.requestId]),
    threadDraft,
    redactedBodyPreview: redactedDashboardMessagePreview(input.body),
    destinationHash: stableDashboardDestinationHash(`${input.tenantId}:${input.clientId}:${input.deliveryChannel ?? input.channel ?? "in_app"}`),
    requiredWrites: action === "mark_thread_read"
      ? ["Message", "NotificationReadState", "AuditLog", "IdempotencyKey"]
      : action === "record_delivery_status"
        ? ["NotificationDelivery", "NotificationDeliveryStatusTransition", "AuditLog", "IdempotencyKey"]
        : ["MessageThread", "Message", "Notification", "NotificationDelivery", "NotificationDeliveryStatusTransition", "NotificationProviderHandoff", "NotificationReadState", "AuditLog", "IdempotencyKey"],
    requiredControls: dashboardMessagePersistenceRequiredControls,
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
      deliveryStatusTransitionPersistenceAvailable: true,
      providerHandoffPersistenceAvailable: true,
      readStatePersistenceAvailable: true,
      auditLogPersistenceAvailable: true,
      idempotencyStoreAvailable: true,
      destinationHashingEnforced: true,
      bodyPreviewRedactionEnforced: true,
      rbacIntegrationEnforced: true,
      postgresIntegrationTestsPassed: false,
      crossTenantIsolationTestsPassed: false,
    }),
    createThreadMessagePlan: buildDashboardMessagePersistencePlan("create_thread_message", baseInput),
    markReadPlan: buildDashboardMessagePersistencePlan("mark_thread_read", { ...baseInput, threadId: "thread_demo", body: "read" }),
    providerHandoffWorkerPlan: buildNotificationProviderHandoffWorkerPlan({
      tenantId: baseInput.tenantId,
      handoffId: "handoff_demo",
      deliveryId: "delivery_demo",
      provider: "in_app",
      action: "claim_due_handoff",
      currentState: "queued",
      attempts: 0,
      maxAttempts: 3,
      providerReady: true,
      sanitizedPayloadAvailable: true,
      destinationHashAvailable: true,
      idempotencyStoreAvailable: true,
      auditLogPersistenceAvailable: true,
      deliveryStatusTransitionPersistenceAvailable: true,
      now: "2026-06-08T10:00:00.000Z",
    }),
    requiredRepositoryMethods: [
      "createMessageThreadInTransaction",
      "appendMessageInTransaction",
      "createNotificationRecord",
      "createNotificationDeliveryRecord",
      "updateDeliveryStatus",
      "createNotificationDeliveryStatusTransition",
      "createNotificationProviderHandoff",
      "markThreadMessagesRead",
      "upsertNotificationReadState",
      "writeNotificationAuditLog",
      "claimMessageIdempotencyKey",
    ],
  };
}

export const dashboardNotificationPersistenceContract = buildDashboardNotificationPersistenceContract();
