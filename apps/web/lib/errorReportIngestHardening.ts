import { buildErrorReportIngestHardeningPlan, redactMetadata, type ObservabilityReportDraft } from "@inkroute/observability";

export const errorReportIngestArtifactPaths = [
  "coverage/error-report-ingest-hardening.json",
  "coverage/error-report-bot-protection.json",
  "coverage/error-report-distributed-rate-limit.json",
  "coverage/error-report-request-correlation.json",
  "coverage/error-report-provider-forwarding-redacted.json",
  "coverage/error-report-postgres-tenant-isolation.json",
  "test-results/error-report-ingest",
] as const;

export const errorReportBotHeaders = {
  token: "x-inkroute-bot-token",
  honeypot: "x-inkroute-error-honeypot",
  requestId: "x-request-id",
  traceparent: "traceparent",
} as const;

export function buildRequestCorrelation(headers: Headers) {
  const requestId = headers.get(errorReportBotHeaders.requestId) || `req_${crypto.randomUUID()}`;
  const traceparent = headers.get(errorReportBotHeaders.traceparent) || `00-${requestId.replace(/[^a-f0-9]/gi, "").padEnd(32, "0").slice(0, 32)}-0000000000000001-01`;
  return { requestId, traceparent };
}

export function enforceErrorReportBotProtection(headers: Headers, env: NodeJS.ProcessEnv = process.env) {
  const honeypot = headers.get(errorReportBotHeaders.honeypot);
  if (honeypot && honeypot.trim().length > 0) {
    return { allowed: false, status: "blocked_honeypot" as const, reason: "Honeypot header was populated." };
  }

  const expectedToken = env.ERROR_REPORT_BOT_PROTECTION_TOKEN?.trim();
  if (!expectedToken) {
    return { allowed: true, status: "monitor_only" as const, reason: "Bot protection token is not configured; local fallback rate limiting still applies." };
  }

  const provided = headers.get(errorReportBotHeaders.token)?.trim();
  return provided === expectedToken
    ? { allowed: true, status: "verified" as const, reason: "Bot protection token matched." }
    : { allowed: false, status: "blocked_token_mismatch" as const, reason: "Bot protection token was missing or invalid." };
}

export function buildProviderForwardingDecision(input: { report?: ObservabilityReportDraft; requestId: string; env?: NodeJS.ProcessEnv }) {
  const env = input.env ?? process.env;
  const credentialsConfigured = Boolean(env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN) && Boolean(env.SENTRY_WEBHOOK_SECRET);
  const redactedMetadata = redactMetadata({
    requestId: input.requestId,
    severity: input.report?.severity,
    route: input.report?.route,
    redactionLevel: input.report?.redactionLevel,
  }).metadata;
  return {
    provider: "sentry" as const,
    status: credentialsConfigured ? "ready_for_redacted_forwarding" : "blocked_missing_credentials",
    credentialsConfigured,
    replayProtectionRequired: true,
    tenantBoundaryRequired: true,
    sanitizedOnly: true,
    redactedMetadata,
  };
}

export function buildAbuseMonitoringDecision(input: { tenantId: string; requestId: string; rateLimitRemaining: number; botStatus: string }) {
  return {
    status: input.rateLimitRemaining <= 1 ? "watch_spike" : "normal",
    tenantId: input.tenantId,
    requestId: input.requestId,
    botStatus: input.botStatus,
    alertOwner: "observability-on-call",
    dashboardOnlyUntilProviderProof: true,
  };
}

export function buildErrorReportIngestHardeningContract() {
  return buildErrorReportIngestHardeningPlan({
    packageScripts: ["test", "typecheck"],
    routeTestsPassed: false,
    webTypecheckPassed: false,
    tenantScopeResolved: true,
    payloadValidationEnabled: true,
    botProtectionConfigured: true,
    distributedRateLimitConfigured: false,
    abuseMonitoringConfigured: true,
    requestIdPropagationConfigured: true,
    providerForwardingControlsConfigured: true,
    dbBackedPersistenceConfigured: true,
    auditLogPersistenceConfigured: true,
    localFallbackRedactionVerified: true,
    dashboardTenantRbacVerified: true,
    providerWebhookSignatureVerified: true,
    livePostgresTenantIsolationVerified: false,
    noPiiPersistenceVerified: false,
  });
}

export const errorReportIngestHardeningContract = buildErrorReportIngestHardeningContract();
