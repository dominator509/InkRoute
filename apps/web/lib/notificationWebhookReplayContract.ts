import { createHash } from "node:crypto";

export type NotificationWebhookProvider = "resend" | "twilio" | "expo";

export interface NotificationWebhookReplayInput {
  readonly tenantId: string;
  readonly provider: NotificationWebhookProvider;
  readonly eventId: string;
  readonly rawBodyAvailable: boolean;
  readonly signatureHeaderAvailable: boolean;
  readonly webhookSecretConfigured: boolean;
  readonly providerEventPersistenceAvailable: boolean;
  readonly replayAlreadySeen: boolean;
  readonly payloadRedacted: boolean;
}

export interface NotificationWebhookReplayDecision {
  readonly status: "allow" | "reject";
  readonly idempotencyKey: string;
  readonly requiredWrites: readonly string[];
  readonly requiredControls: typeof notificationWebhookReplayRequiredControls;
  readonly blockers: readonly string[];
}

export const notificationWebhookReplayRequiredControls = [
  "Verify provider signatures against the exact raw webhook body before parsing trusted fields.",
  "Claim ProviderEvent idempotency before delivery, suppression, or message-thread side effects.",
  "Reject replayed provider events before side effects.",
  "Persist only redacted provider payload summaries and never raw provider payloads.",
  "Record NotificationDeliveryStatusTransition and AuditLog rows for accepted provider status changes.",
] as const;

function buildNotificationWebhookReplayKey(parts: readonly string[]): string {
  return `notification-webhook:${createHash("sha256").update(JSON.stringify(parts)).digest("hex")}`;
}

export function buildNotificationWebhookReplayDecision(
  input: NotificationWebhookReplayInput,
): NotificationWebhookReplayDecision {
  const blockers: string[] = [];
  const provider = input.provider;
  const eventId = input.eventId.trim();

  if (!input.tenantId.trim()) blockers.push("Tenant scope is required before notification webhook processing.");
  if (!eventId) blockers.push("Provider event id is required before notification webhook processing.");
  if (!input.rawBodyAvailable) blockers.push("Raw webhook body must be available for provider signature verification.");
  if (!input.signatureHeaderAvailable) blockers.push("Provider signature header must be present.");
  if (!input.webhookSecretConfigured) blockers.push("Provider webhook secret must be configured before accepting events.");
  if (!input.providerEventPersistenceAvailable) blockers.push("ProviderEvent persistence must be available before webhook side effects.");
  if (input.replayAlreadySeen) blockers.push("Provider webhook replay detected; reject before side effects.");
  if (!input.payloadRedacted) blockers.push("Provider webhook payload summary must be redacted before persistence.");

  return {
    status: blockers.length === 0 ? "allow" : "reject",
    idempotencyKey: buildNotificationWebhookReplayKey([input.tenantId, provider, eventId || "missing-event-id"]),
    requiredWrites: ["ProviderEvent", "NotificationDelivery", "NotificationDeliveryStatusTransition", "AuditLog", "IdempotencyKey"],
    requiredControls: notificationWebhookReplayRequiredControls,
    blockers,
  };
}
