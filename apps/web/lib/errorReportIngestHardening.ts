import { buildErrorReportIngestHardeningPlan, redactMetadata, type ObservabilityReportDraft } from "@inkroute/observability";

export type ErrorReportIngestHardeningStatus =
  | "wired"
  | "rate-limit-gated"
  | "database-gated"
  | "provider-gated"
  | "privacy-gated"
  | "ci-gated";

export interface ErrorReportIngestHardeningMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: ErrorReportIngestHardeningStatus;
}

export const errorReportIngestHardeningCommands = [
  "pnpm --filter @inkroute/observability typecheck",
  "pnpm --filter @inkroute/observability test",
  "pnpm vitest run apps/web/tests/error-report-ingest-hardening-static.test.ts apps/web/tests/observability-routes.test.ts apps/dashboard/tests/error-report-route-static.test.ts",
  "distributed error-report rate-limit provider integration tests",
  "live Postgres ErrorReport tenant-isolation fixtures",
  "provider forwarding replay/no-PII smoke",
  "redacted persistence no-PII artifact audit",
] as const;

export const errorReportIngestArtifactPaths = [
  "coverage/error-report-ingest-hardening.json",
  "coverage/error-report-observability-typecheck.txt",
  "coverage/error-report-observability-test.txt",
  "coverage/error-report-route-static-contracts.json",
  "coverage/error-report-bot-protection.json",
  "coverage/error-report-distributed-rate-limit.json",
  "coverage/error-report-request-correlation.json",
  "coverage/error-report-provider-forwarding-redacted.json",
  "coverage/error-report-provider-replay-no-pii-redacted.json",
  "coverage/error-report-postgres-tenant-isolation.json",
  "coverage/error-report-redacted-persistence-no-pii.json",
  "coverage/error-report-ci-evidence.json",
  "coverage/error-report-secret-safe-artifacts.json",
  "test-results/error-report-ingest",
] as const;

export const errorReportIngestHardeningMatrix: readonly ErrorReportIngestHardeningMatrixEntry[] = [
  { id: "observability-typecheck", command: "pnpm --filter @inkroute/observability typecheck", artifact: "coverage/error-report-observability-typecheck.txt", status: "wired" },
  { id: "observability-tests", command: "pnpm --filter @inkroute/observability test", artifact: "coverage/error-report-observability-test.txt", status: "wired" },
  { id: "route-static-contracts", command: "error-report ingest/dashboard route static contracts", artifact: "coverage/error-report-route-static-contracts.json", status: "wired" },
  { id: "bot-protection", command: "public error-report ingest bot-protection smoke", artifact: "coverage/error-report-bot-protection.json", status: "wired" },
  { id: "request-correlation", command: "request ID and traceparent propagation smoke", artifact: "coverage/error-report-request-correlation.json", status: "wired" },
  { id: "distributed-rate-limit", command: "distributed error-report rate-limit provider integration tests", artifact: "coverage/error-report-distributed-rate-limit.json", status: "rate-limit-gated" },
  { id: "postgres-tenant-isolation", command: "live Postgres ErrorReport tenant-isolation fixtures", artifact: "coverage/error-report-postgres-tenant-isolation.json", status: "database-gated" },
  { id: "provider-forwarding", command: "provider forwarding credential/redaction smoke", artifact: "coverage/error-report-provider-forwarding-redacted.json", status: "provider-gated" },
  { id: "provider-replay-no-pii", command: "provider forwarding replay/no-PII smoke", artifact: "coverage/error-report-provider-replay-no-pii-redacted.json", status: "provider-gated" },
  { id: "redacted-persistence-no-pii", command: "redacted persistence no-PII artifact audit", artifact: "coverage/error-report-redacted-persistence-no-pii.json", status: "privacy-gated" },
  { id: "ci-error-report-ingest-gate", command: "GitHub Actions error-report ingest hardening gate", artifact: "coverage/error-report-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "redacted error-report artifact audit", artifact: "coverage/error-report-secret-safe-artifacts.json", status: "ci-gated" },
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
