export interface NotificationTenantIsolationCheck {
  readonly surface: string;
  readonly tenantId: string;
  readonly requestedTenantId: string;
  readonly model: string;
  readonly operation: "read" | "write" | "update" | "delete";
  readonly tenantFilterPresent: boolean;
  readonly auditMetadataRedacted: boolean;
}

export interface NotificationTenantIsolationDecision {
  readonly status: "allow" | "deny";
  readonly surface: string;
  readonly model: string;
  readonly requiredControls: typeof notificationTenantIsolationRequiredControls;
  readonly blockers: readonly string[];
}

export const notificationTenantOwnedModels = [
  "NotificationDelivery",
  "NotificationProviderHandoff",
  "ProviderEvent",
  "NotificationChannelPreference",
  "NotificationSuppression",
  "MessageThread",
  "Message",
  "AuditLog",
  "IdempotencyKey",
] as const;

export const notificationTenantIsolationRequiredControls = [
  "Compare actor tenant id to requested tenant id before notification repository calls.",
  "Require tenantId filters on every notification launch read/write/update/delete repository operation.",
  "Deny cross-tenant notification access before provider, worker, webhook, suppression, or message side effects.",
  "Redact tenant-isolation audit metadata and never log raw destinations or provider payloads.",
] as const;

export function buildNotificationTenantIsolationDecision(
  input: NotificationTenantIsolationCheck,
): NotificationTenantIsolationDecision {
  const blockers: string[] = [];

  if (!input.surface.trim()) blockers.push("Notification tenant-isolation surface is required.");
  if (!input.tenantId.trim()) blockers.push("Actor tenant id is required before notification data access.");
  if (!input.requestedTenantId.trim()) blockers.push("Requested tenant id is required before notification data access.");
  if (input.tenantId && input.requestedTenantId && input.tenantId !== input.requestedTenantId) {
    blockers.push("Notification data access must reject cross-tenant requests before repository calls.");
  }
  if (!input.tenantFilterPresent) blockers.push(`Notification ${input.model} ${input.operation} must include tenantId in the repository filter.`);
  if (!input.auditMetadataRedacted) blockers.push("Notification tenant-isolation audit metadata must be redacted.");
  if (!notificationTenantOwnedModels.includes(input.model as (typeof notificationTenantOwnedModels)[number])) {
    blockers.push(`Notification model is not registered as tenant-owned: ${input.model}.`);
  }

  return {
    status: blockers.length === 0 ? "allow" : "deny",
    surface: input.surface,
    model: input.model,
    requiredControls: notificationTenantIsolationRequiredControls,
    blockers,
  };
}
