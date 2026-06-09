import { buildProviderWebhookReconciliationPlan, redactMetadata, redactSensitiveText } from "@inkroute/observability";
import type { ErrorReportStatus } from "@inkroute/types";

export const providerWebhookReconciliationArtifactPaths = [
  "coverage/provider-webhook-reconciliation.json",
  "coverage/provider-webhook-idempotency.json",
  "coverage/provider-webhook-status-mutation.json",
  "coverage/provider-webhook-sanitized-payload-redacted.json",
  "coverage/provider-webhook-live-sentry-proof-redacted.json",
  "test-results/provider-webhook-reconciliation",
] as const;

export function buildProviderDeliveryId(event: Record<string, unknown>, data: Record<string, unknown>): string {
  const providerId = data.id ?? data.issueId ?? data.issue_id ?? data.event_id ?? event.id ?? event.installationId ?? event.action ?? "unknown";
  const action = typeof event.action === "string" ? event.action : "unknown";
  return `sentry:${action}:${String(providerId)}`;
}

export function mapSentryActionToErrorStatus(action: string): ErrorReportStatus {
  if (["resolved", "closed"].includes(action)) return "resolved";
  if (["ignored", "archived"].includes(action)) return "ignored";
  if (["assigned", "regressed"].includes(action)) return "triaged";
  return "open";
}

export function providerIssueOwnershipLookup(data: Record<string, unknown>) {
  const tenantId = typeof data.tenantId === "string" ? data.tenantId : typeof data.tags === "object" && data.tags !== null && typeof (data.tags as Record<string, unknown>).tenantId === "string" ? String((data.tags as Record<string, unknown>).tenantId) : undefined;
  const stackHash = typeof data.stackHash === "string" ? data.stackHash : typeof data.fingerprint === "string" ? data.fingerprint : typeof data.culprit === "string" ? data.culprit : undefined;
  return {
    tenantId,
    stackHash,
    lookupReady: Boolean(tenantId || stackHash),
  };
}

export function sanitizeProviderWebhookPayload(event: Record<string, unknown>, data: Record<string, unknown>) {
  const payload = redactMetadata({
    action: typeof event.action === "string" ? event.action : "unknown",
    providerIssueId: data.id ?? data.issueId ?? data.issue_id ?? "unknown",
    title: typeof data.title === "string" ? redactSensitiveText(data.title).text : undefined,
    culprit: typeof data.culprit === "string" ? redactSensitiveText(data.culprit).text : undefined,
    rawPayloadKeys: Object.keys(event).slice(0, 12),
  }).metadata;
  return payload;
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
