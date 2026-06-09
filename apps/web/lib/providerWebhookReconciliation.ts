import { buildProviderWebhookReconciliationPlan } from "@inkroute/observability";

export type ProviderWebhookErrorStatus = "open" | "triaged" | "in_progress" | "resolved" | "ignored";

export const providerWebhookReconciliationArtifactPaths = [
  "coverage/provider-webhook-reconciliation.json",
  "coverage/provider-webhook-idempotency.json",
  "coverage/provider-webhook-error-status-mutation.json",
  "coverage/provider-webhook-sanitized-payload-redacted.json",
  "coverage/provider-webhook-live-sentry-proof-redacted.json",
  "test-results/provider-webhook-reconciliation",
] as const;

const SECRET_KEY_PATTERN = /(authorization|cookie|password|secret|token|api[-_]?key|sentry[-_]?secret|dsn)/i;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BEARER_PATTERN = /bearer\s+[a-z0-9._~+/-]+=*/gi;

function redactText(value: string): string {
  return value.replace(EMAIL_PATTERN, "[redacted-email]").replace(BEARER_PATTERN, "[redacted-token]");
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return redactText(value).slice(0, 500);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 12).map((item) => sanitizeValue(item));
  }

  if (value && typeof value === "object") {
    return sanitizeProviderObject(value as Record<string, unknown>);
  }

  return value ?? null;
}

function sanitizeProviderObject(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 24)
      .map(([key, entry]) => [key, SECRET_KEY_PATTERN.test(key) ? "[redacted-secret]" : sanitizeValue(entry)]),
  );
}

export function buildProviderDeliveryId(event: Record<string, unknown>, data: Record<string, unknown>): string {
  const providerId = data.id ?? data.issueId ?? event.id ?? event.installationId ?? event.action ?? "unknown";
  const action = typeof event.action === "string" ? event.action : "unknown";

  return `sentry:${action}:${String(providerId)}`;
}

export function mapSentryActionToErrorStatus(action: string): ProviderWebhookErrorStatus {
  if (["resolved", "closed"].includes(action)) {
    return "resolved";
  }

  if (["ignored", "archived"].includes(action)) {
    return "ignored";
  }

  if (["assigned", "regressed"].includes(action)) {
    return "triaged";
  }

  return "open";
}

export function sanitizeProviderWebhookPayload(
  event: Record<string, unknown>,
  data: Record<string, unknown>,
): Record<string, unknown> {
  return {
    provider: "sentry",
    action: typeof event.action === "string" ? event.action : "unknown",
    issueId: sanitizeValue(data.id ?? data.issueId ?? null),
    title: sanitizeValue(data.title ?? event.title ?? null),
    culprit: sanitizeValue(data.culprit ?? null),
    release: sanitizeValue(data.release ?? null),
    fingerprint: sanitizeValue(data.fingerprint ?? data.stackHash ?? null),
    tenantId: sanitizeValue(data.tenantId ?? null),
    rawPayloadShape: Object.keys(event).slice(0, 12),
    sanitizedDataPreview: sanitizeProviderObject(data),
  };
}

export function resolveTenantOwnershipFromProvider(
  data: Record<string, unknown>,
  fallbackTenantId?: string,
): { tenantId: string | null; source: "provider-payload" | "fallback" | "unresolved" } {
  if (typeof data.tenantId === "string" && data.tenantId.trim()) {
    return { tenantId: data.tenantId, source: "provider-payload" };
  }

  if (typeof data.projectSlug === "string" && data.projectSlug.startsWith("tenant_")) {
    return { tenantId: data.projectSlug, source: "provider-payload" };
  }

  if (fallbackTenantId) {
    return { tenantId: fallbackTenantId, source: "fallback" };
  }

  return { tenantId: null, source: "unresolved" };
}

export function resolveProviderFingerprint(data: Record<string, unknown>): string | null {
  if (typeof data.fingerprint === "string" && data.fingerprint.trim()) {
    return data.fingerprint;
  }

  if (typeof data.stackHash === "string" && data.stackHash.trim()) {
    return data.stackHash;
  }

  return null;
}

export function buildSentryReconciliationPlan(input: {
  event: Record<string, unknown>;
  data: Record<string, unknown>;
  fallbackTenantId?: string;
}) {
  const action = typeof input.event.action === "string" ? input.event.action : "unknown";
  const providerDeliveryId = buildProviderDeliveryId(input.event, input.data);

  return {
    provider: "sentry" as const,
    action,
    providerDeliveryId,
    idempotencyKey: providerDeliveryId,
    targetErrorStatus: mapSentryActionToErrorStatus(action),
    providerFingerprint: resolveProviderFingerprint(input.data),
    sanitizedPayload: sanitizeProviderWebhookPayload(input.event, input.data),
    ownership: resolveTenantOwnershipFromProvider(input.data, input.fallbackTenantId),
    persistence: "audit-log-transaction" as const,
    rawPayloadStored: false,
  };
}

export function buildProviderWebhookReconciliationContract() {
  return buildProviderWebhookReconciliationPlan({
    packageScripts: ["test", "typecheck"],
    routeTestsPassed: false,
    webTypecheckPassed: false,
    webhookSecretConfigured: Boolean(process.env.SENTRY_WEBHOOK_SECRET),
    signatureVerificationEnabled: true,
    timingSafeComparisonEnabled: true,
    replayProtectionConfigured: true,
    durableDeliveryPersistenceConfigured: true,
    idempotencyConstraintConfigured: false,
    tenantIssueOwnershipLookupConfigured: true,
    errorReportStatusMutationConfigured: true,
    reconciliationAuditLogsConfigured: true,
    sanitizedProviderPayloadsVerified: true,
    liveSentryWebhookProofCaptured: false,
  });
}

export const providerWebhookReconciliationContract = buildProviderWebhookReconciliationContract();
