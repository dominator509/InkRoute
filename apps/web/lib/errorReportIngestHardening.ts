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

export const errorReportIngestRequiredExternalEvidence = [
  "distributed rate-limit provider execution",
  "live Postgres ErrorReport and AbuseEvent tenant-isolation fixtures",
  "redacted provider forwarding proof",
  "provider forwarding replay/no-PII smoke",
  "redacted persistence no-PII audit, CI evidence, and secret-safe artifacts",
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

export const errorReportIngestHardeningProofFiles = [
  "packages/observability/package.json",
  "apps/web/lib/errorReportIngestHardening.ts",
  "apps/web/app/api/public/[tenantSlug]/error-reports/route.ts",
  "apps/dashboard/app/api/error-reports/route.ts",
  "apps/dashboard/tests/error-report-route-static.test.ts",
  "apps/web/tests/error-report-ingest-hardening-static.test.ts",
  "apps/web/tests/observability-routes.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/observability/src/index.ts",
  "packages/observability/tests/redaction-report.test.ts",
  "packages/validators/src/observability.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type ErrorReportIngestEvidenceArtifact = (typeof errorReportIngestArtifactPaths)[number];

export interface ErrorReportIngestExecutionPlan {
  readonly id: "gap-081-error-report-ingest-hardening";
  readonly distributedRateLimitProviderAllowed: false;
  readonly livePostgresAllowed: false;
  readonly providerForwardingAllowed: false;
  readonly policy: ErrorReportIngestExecutionPolicy;
  readonly source: "local-software-plan";
  readonly requiredCommands: typeof errorReportIngestHardeningCommands;
  readonly requiredArtifacts: typeof errorReportIngestArtifactPaths;
  readonly localContractArtifacts: readonly ErrorReportIngestEvidenceArtifact[];
  readonly providerArtifacts: readonly ErrorReportIngestEvidenceArtifact[];
  readonly databaseArtifacts: readonly ErrorReportIngestEvidenceArtifact[];
  readonly privacyArtifacts: readonly ErrorReportIngestEvidenceArtifact[];
  readonly secretSafeArtifactPath: ErrorReportIngestEvidenceArtifact;
  readonly externalEvidenceRequired: typeof errorReportIngestRequiredExternalEvidence;
}

export interface ErrorReportIngestExecutionPolicy {
  readonly executeDistributedRateLimitProvider: false;
  readonly executeLivePostgresFixtures: false;
  readonly executeProviderForwarding: false;
  readonly executeProviderReplay: false;
  readonly executePersistenceNoPiiAudit: false;
  readonly executeCi: false;
}

export interface ErrorReportIngestArtifactReview {
  readonly artifactName: string;
  readonly safeToPersist: boolean;
  readonly redactedArtifact: unknown;
  readonly unsafeFindings: readonly string[];
  readonly requiredArtifactPath: ErrorReportIngestEvidenceArtifact;
}

const errorReportSensitiveKeyPattern =
  /(?:authorization|body|clientsecret|cookie|credential|email|errorreportid|eventid|fingerprint|headers|idempotency|ip|password|phone|private|raw|requestid|secret|sessionid|stack|tenantid|token|traceparent|userid)/i;
const errorReportEmailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const errorReportPhonePattern = /\+?\d[\d ().-]{7,}\d/g;
const errorReportTokenPattern = /\b(?:bearer|ghp|sentry|sk|xox|ya29)[A-Za-z0-9._:/-]{8,}\b/gi;
const errorReportIpPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

function redactErrorReportIngestValue(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (errorReportSensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value
      .replace(errorReportEmailPattern, "[REDACTED_EMAIL]")
      .replace(errorReportPhonePattern, "[REDACTED_PHONE]")
      .replace(errorReportTokenPattern, "[REDACTED_TOKEN]")
      .replace(errorReportIpPattern, "[REDACTED_IP]");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactErrorReportIngestValue(entry));
  }

  if (typeof value === "object") {
    return redactMetadata(
      Object.fromEntries(Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactErrorReportIngestValue(entryValue, entryKey)])),
    ).metadata;
  }

  return value;
}

export function buildRedactedErrorReportIngestArtifact(artifact: unknown): unknown {
  return redactErrorReportIngestValue(artifact);
}

export const errorReportIngestExecutionPolicy: ErrorReportIngestExecutionPolicy = {
  executeDistributedRateLimitProvider: false,
  executeLivePostgresFixtures: false,
  executeProviderForwarding: false,
  executeProviderReplay: false,
  executePersistenceNoPiiAudit: false,
  executeCi: false,
};

export function buildErrorReportIngestExecutionPlan(): ErrorReportIngestExecutionPlan {
  return {
    id: "gap-081-error-report-ingest-hardening",
    distributedRateLimitProviderAllowed: false,
    livePostgresAllowed: false,
    providerForwardingAllowed: false,
    policy: errorReportIngestExecutionPolicy,
    source: "local-software-plan",
    requiredCommands: errorReportIngestHardeningCommands,
    requiredArtifacts: errorReportIngestArtifactPaths,
    localContractArtifacts: [
      "coverage/error-report-ingest-hardening.json",
      "coverage/error-report-observability-typecheck.txt",
      "coverage/error-report-observability-test.txt",
      "coverage/error-report-route-static-contracts.json",
      "coverage/error-report-bot-protection.json",
      "coverage/error-report-request-correlation.json",
    ],
    providerArtifacts: [
      "coverage/error-report-distributed-rate-limit.json",
      "coverage/error-report-provider-forwarding-redacted.json",
      "coverage/error-report-provider-replay-no-pii-redacted.json",
    ],
    databaseArtifacts: ["coverage/error-report-postgres-tenant-isolation.json"],
    privacyArtifacts: ["coverage/error-report-redacted-persistence-no-pii.json"],
    secretSafeArtifactPath: "coverage/error-report-secret-safe-artifacts.json",
    externalEvidenceRequired: errorReportIngestRequiredExternalEvidence,
  };
}

export function buildErrorReportIngestArtifactReview(
  artifactName: string,
  artifact: unknown,
  requiredArtifactPath: ErrorReportIngestEvidenceArtifact = "coverage/error-report-secret-safe-artifacts.json",
): ErrorReportIngestArtifactReview {
  const redactedArtifact = buildRedactedErrorReportIngestArtifact(artifact);
  const serialized = JSON.stringify(redactedArtifact);
  const unsafeFindings = [
    serialized.match(errorReportEmailPattern) ? "email" : null,
    serialized.match(errorReportPhonePattern) ? "phone" : null,
    serialized.match(errorReportTokenPattern) ? "provider-token" : null,
    serialized.match(errorReportIpPattern) ? "ip-address" : null,
  ].filter((finding): finding is string => finding !== null);

  return {
    artifactName,
    safeToPersist: unsafeFindings.length === 0,
    redactedArtifact,
    unsafeFindings,
    requiredArtifactPath,
  };
}

export interface ErrorReportIngestEvidenceInput {
  readonly observabilityTypecheckPassed: boolean;
  readonly observabilityTestsPassed: boolean;
  readonly routeStaticContractsPassed: boolean;
  readonly botProtectionVerified: boolean;
  readonly requestCorrelationVerified: boolean;
  readonly distributedRateLimitVerified: boolean;
  readonly postgresTenantIsolationVerified: boolean;
  readonly providerForwardingVerified: boolean;
  readonly providerReplayNoPiiVerified: boolean;
  readonly redactedPersistenceNoPiiVerified: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly ErrorReportIngestEvidenceArtifact[];
}

export interface ErrorReportIngestEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly ErrorReportIngestEvidenceArtifact[];
  readonly requiredCommands: typeof errorReportIngestHardeningCommands;
  readonly requiredEvidence: typeof errorReportIngestDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export const errorReportIngestDecisionRequiredEvidence = [
  "observability package typecheck/test and route static contract artifacts",
  "bot protection, request correlation, and distributed rate-limit provider artifacts",
  "live Postgres tenant-isolation, provider forwarding, provider replay/no-PII, and redacted persistence artifacts",
  "CI evidence and redacted secret-safe artifact review",
] as const;

export function buildErrorReportIngestEvidenceDecision(input: ErrorReportIngestEvidenceInput): ErrorReportIngestEvidenceDecision {
  const blockers = [
    !input.observabilityTypecheckPassed ? "Observability package typecheck evidence is required." : null,
    !input.observabilityTestsPassed ? "Observability package test evidence is required." : null,
    !input.routeStaticContractsPassed ? "Error-report route static contract evidence is required." : null,
    !input.botProtectionVerified ? "Error-report bot protection evidence is required." : null,
    !input.requestCorrelationVerified ? "Request ID and traceparent correlation evidence is required." : null,
    !input.distributedRateLimitVerified ? "Distributed error-report rate-limit provider evidence is required." : null,
    !input.postgresTenantIsolationVerified ? "Live Postgres ErrorReport tenant-isolation evidence is required." : null,
    !input.providerForwardingVerified ? "Redacted provider forwarding evidence is required." : null,
    !input.providerReplayNoPiiVerified ? "Provider forwarding replay/no-PII evidence is required." : null,
    !input.redactedPersistenceNoPiiVerified ? "Redacted persistence no-PII artifact audit evidence is required." : null,
    !input.ciEvidenceCaptured ? "CI error-report ingest hardening gate evidence is required." : null,
    !input.secretSafeArtifactReviewPassed ? "Secret-safe artifact review evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = errorReportIngestArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: errorReportIngestHardeningCommands,
    requiredEvidence: errorReportIngestDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-081 error-report ingest hardening evidence is complete with CI-safe redacted artifacts captured."
        : "GAP-081 error-report ingest hardening evidence remains blocked until distributed rate-limit, Postgres, provider, no-PII, CI, and redaction artifacts are captured.",
  };
}

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
    if (env.NODE_ENV === "production") {
      return {
        allowed: false,
        status: "blocked_missing_token" as const,
        reason: "Production bot protection token is not configured; public error-report ingest is fail-closed.",
      };
    }

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


