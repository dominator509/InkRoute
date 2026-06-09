import type { ErrorReportStatus, ErrorSeverity } from "@inkroute/types";

export type ErrorSurface = "web" | "dashboard" | "mobile" | "api" | "worker" | "webhook";
export type RuntimeEnvironment = "development" | "preview" | "production" | "test";
export type ObservabilityRuntime = "browser" | "server" | "edge" | "react-native" | "node-worker" | "provider-webhook";
export type RedactionLevel = "none_detected" | "standard_redaction" | "sensitive_context_removed" | "blocked_high_risk_payload";

export interface ObservabilityEventInput {
  tenantId?: string;
  source: ErrorSurface;
  message: string;
  stack?: string;
  route?: string;
  userAgent?: string;
  release?: string;
  environment?: RuntimeEnvironment;
  runtime?: ObservabilityRuntime;
  statusCode?: number;
  handled?: boolean;
  metadata?: Record<string, unknown>;
  tags?: Record<string, string>;
}

export interface ObservabilityReportDraft {
  id: string;
  tenantId?: string;
  severity: ErrorSeverity;
  status: ErrorReportStatus;
  source: ErrorSurface;
  message: string;
  redactedMessage: string;
  stackHash: string;
  route?: string;
  userAgent?: string;
  release?: string;
  environment: RuntimeEnvironment;
  runtime: ObservabilityRuntime;
  handled: boolean;
  redactionLevel: RedactionLevel;
  redactedMetadata: Record<string, unknown>;
  tags: Record<string, string>;
  fingerprint: string;
  alertRecommended: boolean;
  createdAt: string;
}

export interface ProviderBoundary {
  id: string;
  provider: "sentry" | "opentelemetry" | "self_hosted" | "github" | "slack";
  surface: ErrorSurface | "all";
  status: "scaffolded" | "credential-gated" | "deployment-gated" | "externally-dependent";
  blocksProduction: boolean;
  requiredEnv: readonly string[];
  implementationFiles: readonly string[];
  riskNote: string;
}

export interface AlertRouteDraft {
  channel: "none" | "dashboard" | "email" | "slack" | "pager";
  shouldNotifyNow: boolean;
  reason: string;
  escalationMinutes?: number;
}

export interface AlertEscalationInput {
  report: Pick<ObservabilityReportDraft, "severity" | "source" | "route" | "release" | "fingerprint" | "redactedMessage" | "redactionLevel" | "alertRecommended">;
  slackWebhookConfigured: boolean;
  emailProviderConfigured: boolean;
  pagerProviderConfigured: boolean;
  onCallOwner?: string;
  quietHoursActive?: boolean;
  humanAcknowledgementMinutes?: number;
}

export interface AlertEscalationPlan {
  status: "ready" | "blocked";
  route: AlertRouteDraft;
  provider: "dashboard" | "email" | "slack" | "pager";
  blockers: readonly string[];
  sanitizedPayload: {
    fingerprint: string;
    severity: ErrorSeverity;
    source: ErrorSurface;
    route: string;
    release: string;
    message: string;
    redactionLevel: RedactionLevel;
  };
  escalationRunbook: readonly string[];
  suppressExternalDelivery: boolean;
}

export interface AlertRuntimeDeliveryReadinessInput {
  packageScripts: readonly string[];
  observabilityTestsPassed: boolean;
  observabilityTypecheckPassed: boolean;
  slackCredentialsConfigured: boolean;
  emailCredentialsConfigured: boolean;
  pagerCredentialsConfigured: boolean;
  durableAlertWorkerConfigured: boolean;
  retryBackoffConfigured: boolean;
  deadLetterQueueConfigured: boolean;
  onCallScheduleIntegrated: boolean;
  quietHoursPolicyConfigured: boolean;
  acknowledgementStateStored: boolean;
  sanitizedPayloadsVerified: boolean;
  dashboardOnlySuppressionVerified: boolean;
  liveCriticalPagerDeliveryVerified: boolean;
  liveHighSlackDeliveryVerified: boolean;
}

export interface AlertRuntimeDeliveryReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

export interface TelemetryPipelineInput {
  serviceName: "web" | "dashboard" | "mobile" | "api" | "worker";
  environment: RuntimeEnvironment;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  route?: string;
  tenantId?: string;
  errorReport?: Pick<ObservabilityReportDraft, "fingerprint" | "stackHash" | "severity" | "redactionLevel">;
  otlpEndpointConfigured: boolean;
  structuredLoggingEnabled: boolean;
  requestIdPropagationEnabled: boolean;
  traceContextPropagationEnabled: boolean;
  sampleRate?: number;
  attributes?: Record<string, unknown>;
}

export interface TelemetryPipelinePlan {
  status: "ready" | "blocked";
  blockers: readonly string[];
  requestId: string;
  traceId: string;
  spanId: string;
  sampleRate: number;
  exporter: {
    type: "otlp-http";
    configured: boolean;
    requiredEnv: readonly string[];
  };
  logRecord: {
    serviceName: TelemetryPipelineInput["serviceName"];
    environment: RuntimeEnvironment;
    requestId: string;
    traceId: string;
    spanId: string;
    route: string;
    tenantId?: string;
    errorFingerprint?: string;
    stackHash?: string;
    severity?: ErrorSeverity;
    attributes: Record<string, unknown>;
  };
  propagationHeaders: Record<string, string>;
  privacyGuards: readonly string[];
}

export interface OpenTelemetryRuntimeReadinessInput {
  packageScripts: readonly string[];
  observabilityTestsPassed: boolean;
  observabilityTypecheckPassed: boolean;
  otelSdkInstalled: boolean;
  otlpExporterInstalled: boolean;
  webMiddlewareInstrumented: boolean;
  dashboardMiddlewareInstrumented: boolean;
  apiRoutesInstrumented: boolean;
  workerRuntimeInstrumented: boolean;
  requestIdPropagationConfigured: boolean;
  traceContextPropagationConfigured: boolean;
  errorReportTraceCorrelationConfigured: boolean;
  structuredRuntimeLoggingConfigured: boolean;
  otlpEndpointConfigured: boolean;
  serviceMetadataConfigured: boolean;
  samplingPolicyConfigured: boolean;
  highRiskExportSuppressionVerified: boolean;
  liveTraceBackendIngestionVerified: boolean;
  liveLogBackendIngestionVerified: boolean;
  noPiiTelemetryVerified: boolean;
}

export interface OpenTelemetryRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

export interface AgenticBugFixStep {
  order: number;
  title: string;
  owner: "system" | "human" | "codex" | "jules" | "claude_code";
  status: "manual" | "scaffolded" | "blocked";
  instruction: string;
}

export interface GithubIssueDraft {
  title: string;
  labels: readonly string[];
  body: string;
  blocked: true;
  blockedReason: string;
}

export interface GithubIssueAutomationInput {
  report: ObservabilityReportDraft;
  githubTokenConfigured: boolean;
  repositoryConfigured: boolean;
  labelsConfigured: readonly string[];
  assigneesConfigured?: readonly string[];
  humanApproved: boolean;
  issueTemplateConfigured?: boolean;
}

export interface GithubIssueAutomationPlan {
  status: "ready" | "blocked";
  draft: GithubIssueDraft;
  blockers: readonly string[];
  labels: readonly string[];
  assignees: readonly string[];
  reportLink: {
    errorReportFingerprint: string;
    stackHash: string;
    route: string;
    release: string;
  };
  privacyChecklist: readonly string[];
  createIssueRequest?: {
    repository: string;
    title: string;
    body: string;
    labels: readonly string[];
    assignees: readonly string[];
  };
}

export interface GithubIssueRuntimeDispatchInput {
  packageScripts: readonly string[];
  observabilityTestsPassed: boolean;
  observabilityTypecheckPassed: boolean;
  githubTokenConfigured: boolean;
  repositoryConfigured: boolean;
  labelsConfigured: boolean;
  assigneesConfigured: boolean;
  privacyTemplateConfigured: boolean;
  dashboardApprovalUiWired: boolean;
  humanApprovalAuditStored: boolean;
  githubApiCreateIssueWired: boolean;
  reportIssueLinkPersistenceConfigured: boolean;
  dashboardStatusSyncConfigured: boolean;
  highRiskDashboardOnlyBlockingVerified: boolean;
  sanitizedIssueBodyVerified: boolean;
  liveSyntheticIssueCreationVerified: boolean;
}

export interface GithubIssueRuntimeDispatchPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

export interface ObservabilityAutomatedCoverageReadinessInput {
  packageScripts: readonly string[];
  observabilityPackageTestsPassed: boolean;
  webRouteTestsPassed: boolean;
  webUiStaticTestsPassed: boolean;
  webTypecheckPassed: boolean;
  globalErrorRenderedComponentTestsAdded: boolean;
  dashboardErrorsPageSmokePassed: boolean;
  playwrightDashboardTriageCovered: boolean;
  mobileSimulatorCrashReportUiTested: boolean;
  mobileDeviceCrashReportUiTested: boolean;
  sentryWebhookSignatureTestsCovered: boolean;
  publicIngestPersistenceTestsCovered: boolean;
  ciArtifactsCaptured: boolean;
}

export interface ObservabilityAutomatedCoverageReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

export interface ReleaseIncidentLinkageInput {
  releaseId: string;
  releaseVersion: string;
  environment: RuntimeEnvironment;
  tenantId?: string;
  reports: readonly ObservabilityReportDraft[];
  rollbackRequested: boolean;
  sentryReleaseConfigured: boolean;
  incidentProviderConfigured: boolean;
  tenantCommunicationOwner?: string;
}

export interface ReleaseIncidentLinkagePlan {
  status: "ready" | "blocked";
  releaseTags: Record<string, string>;
  dashboardFilters: {
    release: string;
    environment: RuntimeEnvironment;
    tenantId?: string;
    severities: readonly ErrorSeverity[];
  };
  linkedReports: readonly {
    id: string;
    fingerprint: string;
    severity: ErrorSeverity;
    source: ErrorSurface;
    route: string;
    release: string;
    redactedMessage: string;
  }[];
  incidentStatus: "none" | "monitoring" | "active_incident" | "rollback_required";
  rollbackIncidentNote?: string;
  tenantCommunicationDraft?: string;
  blockers: readonly string[];
  handoffRecords: readonly string[];
  privacyChecklist: readonly string[];
}

export interface ReleaseIncidentRuntimeReadinessInput {
  packageScripts: readonly string[];
  observabilityTestsPassed: boolean;
  observabilityTypecheckPassed: boolean;
  sentryReleaseTagsConfigured: boolean;
  sentrySourceMapsUploaded: boolean;
  liveSentryReleaseEvidenceCaptured: boolean;
  errorReportReleaseLinkPersistenceConfigured: boolean;
  releaseRecordIncidentLinkPersistenceConfigured: boolean;
  incidentProviderConfigured: boolean;
  providerIncidentCreationVerified: boolean;
  rollbackCommunicationHandoffPersisted: boolean;
  tenantCommunicationOwnerConfigured: boolean;
  dashboardReleaseFiltersVerified: boolean;
  tenantScopedIncidentIsolationVerified: boolean;
  sanitizedPayloadsVerified: boolean;
  liveProviderEvidenceCaptured: boolean;
}

export interface ReleaseIncidentRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
}

export interface ObservabilityRuntimeReadinessInput {
  packageScripts: readonly string[];
  packageTestsPassed: boolean;
  packageTypecheckPassed: boolean;
  sentryWebConfigured: boolean;
  sentryDashboardConfigured: boolean;
  sentryMobileConfigured: boolean;
  sentryReleaseArtifactsConfigured: boolean;
  sourceMapsVerified: boolean;
  mobileDebugSymbolsVerified: boolean;
  forcedWebErrorVerified: boolean;
  forcedDashboardErrorVerified: boolean;
  forcedMobileCrashVerified: boolean;
  forcedApiErrorVerified: boolean;
  otelExporterConfigured: boolean;
  structuredLoggingConfigured: boolean;
  requestTracePropagationVerified: boolean;
  errorReportPersistenceConfigured: boolean;
  dashboardTriagePersistenceVerified: boolean;
  providerWebhookSignatureVerified: boolean;
  alertRoutingConfigured: boolean;
  redactionTestsPassed: boolean;
}

export interface ObservabilityRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

export interface ObservabilityRuntimeVerificationInput {
  packageScripts: readonly string[];
  packageTestsPassed: boolean;
  packageTypecheckPassed: boolean;
  webBuildPassed: boolean;
  dashboardBuildPassed: boolean;
  mobileTypecheckPassed: boolean;
  routeSmokeTestsPassed: boolean;
  forcedWebErrorUxVerified: boolean;
  forcedDashboardErrorUxVerified: boolean;
  forcedApiErrorVerified: boolean;
  forcedWebhookErrorVerified: boolean;
  forcedMobileErrorUxVerified: boolean;
  browserScreenshotsCaptured: boolean;
  simulatorOrDeviceScreenshotsCaptured: boolean;
  sanitizedLogOutputCaptured: boolean;
  localFallbackPersistenceVerified: boolean;
  dashboardTriageDisplayVerified: boolean;
  sentrySdkConfigured: boolean;
  liveSentryProviderProofCaptured: boolean;
  providerWebhookProofCaptured: boolean;
  noPiiLeakageVerified: boolean;
  runtimeEvidenceAttached: boolean;
}

export interface ObservabilityRuntimeVerificationPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phonePattern = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g;
const tokenPattern = /(sk_live_|sk_test_|pk_live_|pk_test_|sntrys_|xox[baprs]-|Bearer\s+)[A-Za-z0-9_\-.]+/g;
const cardPattern = /\b(?:\d[ -]*?){13,19}\b/g;
const highRiskKeyPattern = /(password|secret|token|authorization|cookie|signature|card|medical|diagnosis|allergy|ssn|dob|birth|stripe|private|consent|phone|email)/i;

function stableHash(value: string): string {
  let hash = 2166136261;
  let secondary = 16777619;
  for (let index = 0; index < value.length; index += 1) {
    const charCode = value.charCodeAt(index);
    hash ^= charCode;
    secondary = Math.imul(secondary ^ charCode, 1099511628211 % 4294967296);
    hash = Math.imul(hash, 16777619 + index);
  }
  const primary = (hash >>> 0).toString(16).padStart(8, "0");
  const tail = (secondary >>> 0).toString(16).padStart(4, "0");
  return `${primary}${tail}`.slice(0, 12);
}

export function redactSensitiveText(value: string): { text: string; redactionLevel: RedactionLevel } {
  let redactionLevel: RedactionLevel = "none_detected";
  let text = value
    .replace(emailPattern, () => {
      redactionLevel = "standard_redaction";
      return "[redacted:email]";
    })
    .replace(phonePattern, () => {
      redactionLevel = "standard_redaction";
      return "[redacted:phone]";
    })
    .replace(tokenPattern, () => {
      redactionLevel = "sensitive_context_removed";
      return "[redacted:token]";
    })
    .replace(cardPattern, () => {
      redactionLevel = "sensitive_context_removed";
      return "[redacted:card]";
    });

  if (text.length > 1600) {
    text = `${text.slice(0, 1600)}…[truncated]`;
    if (redactionLevel === "none_detected") redactionLevel = "standard_redaction";
  }

  return { text, redactionLevel };
}

function maxRedactionLevel(a: RedactionLevel, b: RedactionLevel): RedactionLevel {
  const rank: Record<RedactionLevel, number> = {
    none_detected: 0,
    standard_redaction: 1,
    sensitive_context_removed: 2,
    blocked_high_risk_payload: 3,
  };
  return rank[a] >= rank[b] ? a : b;
}

export function redactMetadata(metadata: Record<string, unknown> = {}): { metadata: Record<string, unknown>; redactionLevel: RedactionLevel } {
  let redactionLevel: RedactionLevel = "none_detected";

  const redactValue = (key: string, value: unknown, depth: number): unknown => {
    if (depth > 4) {
      redactionLevel = maxRedactionLevel(redactionLevel, "sensitive_context_removed");
      return "[redacted:max-depth]";
    }

    if (highRiskKeyPattern.test(key)) {
      redactionLevel = maxRedactionLevel(redactionLevel, "sensitive_context_removed");
      return "[redacted:sensitive-field]";
    }

    if (typeof value === "string") {
      const redacted = redactSensitiveText(value);
      redactionLevel = maxRedactionLevel(redactionLevel, redacted.redactionLevel);
      return redacted.text;
    }

    if (typeof value === "number" || typeof value === "boolean" || value === null) return value;

    if (Array.isArray(value)) return value.slice(0, 20).map((item, index) => redactValue(`${key}.${index}`, item, depth + 1));

    if (typeof value === "object") {
      const objectValue = value as Record<string, unknown>;
      return Object.fromEntries(Object.entries(objectValue).slice(0, 40).map(([childKey, childValue]) => [childKey, redactValue(childKey, childValue, depth + 1)]));
    }

    return "[redacted:unsupported-value]";
  };

  const redacted = Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, redactValue(key, value, 0)]));
  return { metadata: redacted, redactionLevel };
}

export function classifyErrorSeverity(input: Pick<ObservabilityEventInput, "source" | "message" | "statusCode" | "handled">): ErrorSeverity {
  const message = input.message.toLowerCase();

  if (input.statusCode && input.statusCode >= 500) return "critical";
  if (message.includes("payment") || message.includes("stripe") || message.includes("tenant isolation") || message.includes("auth bypass")) return "critical";
  if (message.includes("medical") || message.includes("consent") || message.includes("privacy") || message.includes("pii")) return "critical";
  if (input.source === "api" || input.source === "webhook") return input.handled === false ? "high" : "medium";
  if (input.source === "mobile" && message.includes("crash")) return "high";
  if (message.includes("not implemented") || message.includes("501")) return "medium";
  return input.handled === false ? "medium" : "low";
}

export function buildStackHash(input: Pick<ObservabilityEventInput, "message" | "stack" | "route" | "source">): string {
  const firstStackLines = input.stack?.split("\n").slice(0, 5).join("|") ?? "no-stack";
  return stableHash(`${input.source}|${input.route ?? "unknown-route"}|${input.message}|${firstStackLines}`);
}

export function buildObservabilityReportDraft(input: ObservabilityEventInput, now = new Date().toISOString()): ObservabilityReportDraft {
  const redactedMessage = redactSensitiveText(input.message);
  const redactedMetadata = redactMetadata(input.metadata ?? {});
  const redactionLevel = maxRedactionLevel(redactedMessage.redactionLevel, redactedMetadata.redactionLevel);
  const stackHash = buildStackHash(input);
  const severity = classifyErrorSeverity(input);
  const fingerprint = `${input.source}-${stackHash}`;
  const base = {
    id: `err_${stableHash(`${fingerprint}|${now}`).slice(0, 10)}`,
    severity,
    status: "open" as const,
    source: input.source,
    message: redactedMessage.text,
    redactedMessage: redactedMessage.text,
    stackHash,
    environment: input.environment ?? "development",
    runtime: input.runtime ?? (input.source === "mobile" ? "react-native" : input.source === "webhook" ? "provider-webhook" : "server"),
    handled: input.handled ?? true,
    redactionLevel,
    redactedMetadata: redactedMetadata.metadata,
    tags: input.tags ?? {},
    fingerprint,
    alertRecommended: severity === "critical" || severity === "high",
    createdAt: now,
  } satisfies Omit<ObservabilityReportDraft, "tenantId" | "route" | "userAgent" | "release">;

  return {
    ...base,
    ...(input.tenantId ? { tenantId: input.tenantId } : {}),
    ...(input.route ? { route: input.route } : {}),
    ...(input.userAgent ? { userAgent: redactSensitiveText(input.userAgent).text } : {}),
    ...(input.release ? { release: input.release } : {}),
  };
}

export const observabilityProviderBoundaries: readonly ProviderBoundary[] = [
  {
    id: "sentry-nextjs",
    provider: "sentry",
    surface: "web",
    status: "credential-gated",
    blocksProduction: true,
    requiredEnv: ["NEXT_PUBLIC_SENTRY_DSN", "SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT"],
    implementationFiles: ["apps/web/instrumentation.ts", "apps/web/sentry.server.config.ts", "apps/web/sentry.edge.config.ts", "apps/web/instrumentation-client.ts"],
    riskNote: "Next.js SDK, source maps, sampling, tunnel route, and request-error capture require dependency install and Sentry project credentials.",
  },
  {
    id: "sentry-dashboard",
    provider: "sentry",
    surface: "dashboard",
    status: "credential-gated",
    blocksProduction: true,
    requiredEnv: ["NEXT_PUBLIC_SENTRY_DSN", "SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT"],
    implementationFiles: ["apps/dashboard/instrumentation.ts", "apps/dashboard/sentry.server.config.ts", "apps/dashboard/instrumentation-client.ts"],
    riskNote: "Dashboard errors may contain client PII; beforeSend redaction and tenant tags must be tested before enabling live capture.",
  },
  {
    id: "sentry-react-native",
    provider: "sentry",
    surface: "mobile",
    status: "deployment-gated",
    blocksProduction: true,
    requiredEnv: ["EXPO_PUBLIC_SENTRY_DSN", "SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT"],
    implementationFiles: ["apps/mobile/App.tsx", "apps/mobile/app.json", "apps/mobile/metro.config.js"],
    riskNote: "React Native capture, native debug symbols, Expo source maps, and EAS release metadata must be verified on simulator and device.",
  },
  {
    id: "otel-api",
    provider: "opentelemetry",
    surface: "api",
    status: "externally-dependent",
    blocksProduction: false,
    requiredEnv: ["OTEL_EXPORTER_OTLP_ENDPOINT", "OTEL_SERVICE_NAME", "OTEL_EXPORTER_OTLP_HEADERS"],
    implementationFiles: ["future packages/observability/src/otel.ts", "future apps/*/instrumentation.ts"],
    riskNote: "OpenTelemetry traces/logs are planned as optional observability. Exporter endpoint and sampling policy are not configured.",
  },
  {
    id: "fallback-error-route",
    provider: "self_hosted",
    surface: "all",
    status: "scaffolded",
    blocksProduction: true,
    requiredEnv: ["ERROR_REPORT_INGEST_SECRET", "DATABASE_URL"],
    implementationFiles: ["apps/web/app/api/public/[tenantSlug]/error-reports/route.ts", "packages/db/prisma/schema.prisma"],
    riskNote: "Fallback ingest route builds redacted drafts only. Persistence, rate limiting, bot protection, and tenant abuse controls are missing.",
  },
  {
    id: "agentic-issue-handoff",
    provider: "github",
    surface: "all",
    status: "externally-dependent",
    blocksProduction: false,
    requiredEnv: ["GITHUB_TOKEN", "GITHUB_REPOSITORY"],
    implementationFiles: ["future .github/workflows/error-triage.yml", "HANDOFF_TO_CODEX.md"],
    riskNote: "Automated issue creation and agent assignment require repo access, privacy-safe issue bodies, and human approval rules.",
  },
];

export function buildAlertRoute(report: Pick<ObservabilityReportDraft, "severity" | "source" | "alertRecommended" | "redactionLevel">): AlertRouteDraft {
  if (!report.alertRecommended) {
    return { channel: "dashboard", shouldNotifyNow: false, reason: "Low/medium severity reports should appear in the dashboard queue without interrupting the artist." };
  }

  if (report.severity === "critical") {
    return {
      channel: report.redactionLevel === "blocked_high_risk_payload" ? "dashboard" : "pager",
      shouldNotifyNow: true,
      reason: "Critical reports affect payments, privacy, consent, tenant isolation, or production availability.",
      escalationMinutes: 15,
    };
  }

  return {
    channel: "slack",
    shouldNotifyNow: true,
    reason: `High severity ${report.source} reports should notify the release owner and remain visible in dashboard triage.`,
    escalationMinutes: 60,
  };
}

export function buildAlertEscalationPlan(input: AlertEscalationInput): AlertEscalationPlan {
  const route = buildAlertRoute(input.report);
  const blockers: string[] = [];
  const suppressExternalDelivery = input.report.redactionLevel === "blocked_high_risk_payload";
  const provider = suppressExternalDelivery ? "dashboard" : route.channel === "none" ? "dashboard" : route.channel;

  if (route.channel === "pager" && !input.pagerProviderConfigured && !suppressExternalDelivery) {
    blockers.push("Pager provider is required for critical production alerts.");
  }
  if (route.channel === "slack" && !input.slackWebhookConfigured && !suppressExternalDelivery) {
    blockers.push("Slack webhook is required for high-severity alert delivery.");
  }
  if (route.channel === "email" && !input.emailProviderConfigured && !suppressExternalDelivery) {
    blockers.push("Email provider is required before email alert delivery.");
  }
  if (!input.onCallOwner || input.onCallOwner.trim().length === 0) {
    blockers.push("On-call owner must be assigned before production alert routing is ready.");
  }
  if (input.quietHoursActive && route.channel !== "pager") {
    blockers.push("Quiet-hours policy must defer non-critical external alerts to dashboard triage.");
  }

  const acknowledgementMinutes = input.humanAcknowledgementMinutes ?? route.escalationMinutes ?? 120;

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    route,
    provider,
    blockers,
    sanitizedPayload: {
      fingerprint: input.report.fingerprint,
      severity: input.report.severity,
      source: input.report.source,
      route: input.report.route ?? "unknown",
      release: input.report.release ?? "unknown",
      message: input.report.redactedMessage,
      redactionLevel: input.report.redactionLevel,
    },
    escalationRunbook: [
      `Notify ${input.onCallOwner?.trim() || "unassigned-on-call-owner"} via ${provider}.`,
      `Acknowledge within ${acknowledgementMinutes} minute(s) and keep raw payloads out of chat/email/pager tools.`,
      "Use seeded or synthetic reproduction data only; do not paste PII, medical notes, consent signatures, tokens, cookies, or payment data.",
      "Escalate to dashboard-only review when redaction level is blocked_high_risk_payload.",
    ],
    suppressExternalDelivery,
  };
}

export function buildAlertRuntimeDeliveryReadinessPlan(input: AlertRuntimeDeliveryReadinessInput): AlertRuntimeDeliveryReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/observability ${script} script.`);
  if (!input.observabilityTestsPassed) blockers.push("@inkroute/observability alert delivery tests must pass.");
  if (!input.observabilityTypecheckPassed) blockers.push("@inkroute/observability typecheck must pass.");
  if (!input.slackCredentialsConfigured) blockers.push("Slack alert credentials must be configured in secrets.");
  if (!input.emailCredentialsConfigured) blockers.push("Email alert provider credentials must be configured in secrets.");
  if (!input.pagerCredentialsConfigured) blockers.push("Pager provider credentials must be configured in secrets.");
  if (!input.durableAlertWorkerConfigured) blockers.push("Durable alert worker delivery must be configured.");
  if (!input.retryBackoffConfigured) blockers.push("Alert delivery retry/backoff policy must be configured.");
  if (!input.deadLetterQueueConfigured) blockers.push("Alert delivery dead-letter handling must be configured.");
  if (!input.onCallScheduleIntegrated) blockers.push("On-call schedule integration must drive alert ownership.");
  if (!input.quietHoursPolicyConfigured) blockers.push("Quiet-hours policy must be wired to production alert config.");
  if (!input.acknowledgementStateStored) blockers.push("Alert acknowledgement state must be stored durably.");
  if (!input.sanitizedPayloadsVerified) blockers.push("External alert payloads must be proven sanitized before delivery.");
  if (!input.dashboardOnlySuppressionVerified) blockers.push("Dashboard-only suppression must be verified for blocked high-risk payloads.");
  if (!input.liveCriticalPagerDeliveryVerified) blockers.push("Live synthetic critical pager delivery proof is required.");
  if (!input.liveHighSlackDeliveryVerified) blockers.push("Live synthetic high-severity Slack delivery proof is required.");

  if (!input.slackCredentialsConfigured || !input.emailCredentialsConfigured || !input.pagerCredentialsConfigured) {
    requiredEvidence.push("Slack, email, and pager provider credential evidence");
  }
  if (!input.durableAlertWorkerConfigured || !input.retryBackoffConfigured || !input.deadLetterQueueConfigured) {
    requiredEvidence.push("durable alert worker retry/backoff and dead-letter evidence");
  }
  if (!input.onCallScheduleIntegrated || !input.quietHoursPolicyConfigured || !input.acknowledgementStateStored) {
    requiredEvidence.push("on-call schedule, quiet-hours policy, and acknowledgement-state evidence");
  }
  if (!input.sanitizedPayloadsVerified || !input.dashboardOnlySuppressionVerified) {
    requiredEvidence.push("sanitized payload and dashboard-only suppression evidence");
  }
  if (!input.liveCriticalPagerDeliveryVerified || !input.liveHighSlackDeliveryVerified) {
    requiredEvidence.push("live synthetic critical pager and high-severity Slack delivery evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/observability typecheck",
      "pnpm --filter @inkroute/observability test",
      "alert worker retry/dead-letter smoke",
      "on-call schedule and quiet-hours policy smoke",
      "live synthetic critical pager delivery",
      "live synthetic high-severity Slack delivery",
    ],
    requiredEvidence,
    requiredControls: [
      "Load Slack, email, and pager credentials from secrets only.",
      "Deliver alerts through a durable worker with retry, backoff, and dead-letter handling.",
      "Use on-call schedules and quiet-hours policy before choosing external delivery.",
      "Persist acknowledgement state so escalations are auditable and resumable.",
      "Send sanitized external payloads only and suppress blocked high-risk payloads to dashboard triage.",
      "Capture live synthetic critical/high provider delivery evidence before closing the gap.",
    ],
    blockers,
  };
}

export function buildAgenticBugFixWorkflow(report: ObservabilityReportDraft): readonly AgenticBugFixStep[] {
  return [
    {
      order: 1,
      title: "Classify and redact",
      owner: "system",
      status: "scaffolded",
      instruction: `Confirm severity ${report.severity}, fingerprint ${report.fingerprint}, and redaction level ${report.redactionLevel}. Do not expose raw PII, medical notes, payment data, cookies, or tokens.`,
    },
    {
      order: 2,
      title: "Reproduce safely",
      owner: "human",
      status: "manual",
      instruction: `Reproduce on route ${report.route ?? "unknown route"} using seeded or synthetic data only. Never use a real client record for reproduction.`,
    },
    {
      order: 3,
      title: "Create issue draft",
      owner: "codex",
      status: "blocked",
      instruction: "Create a GitHub issue from the sanitized draft only after repo credentials, labels, and human approval are configured.",
    },
    {
      order: 4,
      title: "Patch with tests",
      owner: "jules",
      status: "manual",
      instruction: "Patch the smallest affected boundary, add regression tests, and run package/app typecheck plus any route/browser/device tests relevant to the surface.",
    },
    {
      order: 5,
      title: "Verify and close loop",
      owner: "claude_code",
      status: "manual",
      instruction: "Summarize root cause, files changed, test evidence, and remaining gaps. Update GAP_TRACKER.md before closing the report.",
    },
  ];
}

export function buildGithubIssueDraft(report: ObservabilityReportDraft): GithubIssueDraft {
  const labels = ["bug", `severity:${report.severity}`, `surface:${report.source}`];
  const body = [
    "## Sanitized error report",
    `- Fingerprint: ${report.fingerprint}`,
    `- Severity: ${report.severity}`,
    `- Source: ${report.source}`,
    `- Route: ${report.route ?? "unknown"}`,
    `- Release: ${report.release ?? "unknown"}`,
    `- Redaction: ${report.redactionLevel}`,
    "",
    "## Message",
    report.redactedMessage,
    "",
    "## Reproduction guardrails",
    "Use seeded/synthetic data only. Do not paste raw client PII, medical notes, consent signatures, payment payloads, cookies, authorization headers, or provider tokens.",
    "",
    "## Required verification",
    "Add or update tests that fail before the patch and pass after the patch. Attach command output to the phase closeout or issue comment.",
  ].join("\n");

  return {
    title: `[${report.severity.toUpperCase()}][${report.source}] ${report.redactedMessage.slice(0, 90)}`,
    labels,
    body,
    blocked: true,
    blockedReason: "GitHub issue creation is scaffolded only until repo token, project labels, and privacy review are configured.",
  };
}

export function buildGithubIssueAutomationPlan(input: GithubIssueAutomationInput): GithubIssueAutomationPlan {
  const draft = buildGithubIssueDraft(input.report);
  const requiredLabels = draft.labels;
  const blockers: string[] = [];
  const configuredLabels = new Set(input.labelsConfigured);
  const missingLabels = requiredLabels.filter((label) => !configuredLabels.has(label));
  const repository = process.env.GITHUB_REPOSITORY ?? "unconfigured/repository";

  if (!input.githubTokenConfigured) blockers.push("GitHub token must be configured before issue creation.");
  if (!input.repositoryConfigured) blockers.push("GitHub repository target must be configured before issue creation.");
  if (missingLabels.length > 0) blockers.push(`Missing configured GitHub labels: ${missingLabels.join(", ")}.`);
  if (!input.humanApproved) blockers.push("Human approval is required before creating an agentic issue.");
  if (!input.issueTemplateConfigured) blockers.push("Privacy-safe issue template must be configured before issue creation.");
  if (!input.assigneesConfigured || input.assigneesConfigured.length === 0) blockers.push("At least one triage assignee must be configured.");
  if (input.report.redactionLevel === "blocked_high_risk_payload") blockers.push("Blocked high-risk payloads require dashboard-only review and cannot create GitHub issues automatically.");

  const privacyChecklist = [
    "Issue body must use buildGithubIssueDraft output only.",
    "Do not include raw PII, medical notes, consent signatures, payment payloads, cookies, authorization headers, or provider tokens.",
    "Human approver must confirm labels, assignees, and sanitized reproduction steps before dispatch.",
  ] as const;

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    draft,
    blockers,
    labels: requiredLabels,
    assignees: input.assigneesConfigured ?? [],
    reportLink: {
      errorReportFingerprint: input.report.fingerprint,
      stackHash: input.report.stackHash,
      route: input.report.route ?? "unknown",
      release: input.report.release ?? "unknown",
    },
    privacyChecklist,
    ...(blockers.length === 0
      ? {
          createIssueRequest: {
            repository,
            title: draft.title,
            body: draft.body,
            labels: requiredLabels,
            assignees: input.assigneesConfigured ?? [],
          },
        }
      : {}),
  };
}

export function buildGithubIssueRuntimeDispatchPlan(input: GithubIssueRuntimeDispatchInput): GithubIssueRuntimeDispatchPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/observability ${script} script.`);
  if (!input.observabilityTestsPassed) blockers.push("@inkroute/observability GitHub issue automation tests must pass.");
  if (!input.observabilityTypecheckPassed) blockers.push("@inkroute/observability typecheck must pass.");
  if (!input.githubTokenConfigured) blockers.push("GitHub token must be configured in secrets before live issue dispatch.");
  if (!input.repositoryConfigured) blockers.push("GitHub repository target must be configured before live issue dispatch.");
  if (!input.labelsConfigured) blockers.push("Required GitHub labels must exist before live issue dispatch.");
  if (!input.assigneesConfigured) blockers.push("Required GitHub triage assignees must be configured before live issue dispatch.");
  if (!input.privacyTemplateConfigured) blockers.push("Privacy-safe GitHub issue template must be configured before live dispatch.");
  if (!input.dashboardApprovalUiWired) blockers.push("Dashboard approval UI/actions must be wired before GitHub issue dispatch.");
  if (!input.humanApprovalAuditStored) blockers.push("Human approval audit trail must be stored before GitHub issue dispatch.");
  if (!input.githubApiCreateIssueWired) blockers.push("GitHub API issue creation must be wired behind human approval.");
  if (!input.reportIssueLinkPersistenceConfigured) blockers.push("Created issue URL/number must persist back to ErrorReport records.");
  if (!input.dashboardStatusSyncConfigured) blockers.push("Dashboard issue status/link sync must be configured after dispatch.");
  if (!input.highRiskDashboardOnlyBlockingVerified) blockers.push("Blocked high-risk payloads must remain dashboard-only and never dispatch to GitHub.");
  if (!input.sanitizedIssueBodyVerified) blockers.push("Sanitized issue body must be verified free of raw PII, tokens, medical notes, consent data, and payment payloads.");
  if (!input.liveSyntheticIssueCreationVerified) blockers.push("Live synthetic GitHub issue creation proof is required before closing GAP-085.");

  if (!input.githubTokenConfigured || !input.repositoryConfigured || !input.labelsConfigured || !input.assigneesConfigured || !input.privacyTemplateConfigured) {
    requiredEvidence.push("GitHub token, repository, labels, assignees, and privacy template evidence");
  }
  if (!input.dashboardApprovalUiWired || !input.humanApprovalAuditStored || !input.githubApiCreateIssueWired) {
    requiredEvidence.push("dashboard approval UI, human approval audit, and GitHub API dispatch evidence");
  }
  if (!input.reportIssueLinkPersistenceConfigured || !input.dashboardStatusSyncConfigured) {
    requiredEvidence.push("ErrorReport issue-link persistence and dashboard status sync evidence");
  }
  if (!input.highRiskDashboardOnlyBlockingVerified || !input.sanitizedIssueBodyVerified) {
    requiredEvidence.push("high-risk dashboard-only blocking and sanitized issue body evidence");
  }
  if (!input.liveSyntheticIssueCreationVerified) {
    requiredEvidence.push("live synthetic GitHub issue creation evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/observability typecheck",
      "pnpm --filter @inkroute/observability test",
      "dashboard GitHub issue approval action smoke",
      "GitHub issue create API smoke",
      "ErrorReport issue-link persistence smoke",
      "live synthetic GitHub issue creation proof",
    ],
    requiredEvidence,
    requiredControls: [
      "Dispatch GitHub issues only from sanitized createIssueRequest payloads after explicit human approval.",
      "Store human approval audit metadata before calling the GitHub API.",
      "Persist issue URL/number back to ErrorReport records and reflect status in dashboard triage.",
      "Keep blocked high-risk payloads dashboard-only with no external GitHub dispatch.",
      "Use secret-backed GitHub tokens and configured repo/labels/assignees/templates only.",
      "Capture live synthetic issue creation evidence before closing the gap.",
    ],
    blockers,
  };
}

export function buildObservabilityAutomatedCoverageReadinessPlan(input: ObservabilityAutomatedCoverageReadinessInput): ObservabilityAutomatedCoverageReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/observability ${script} script.`);
  if (!input.observabilityPackageTestsPassed) blockers.push("@inkroute/observability helper tests must pass.");
  if (!input.webRouteTestsPassed) blockers.push("Web observability route tests must pass.");
  if (!input.webUiStaticTestsPassed) blockers.push("Web observability UI static wiring tests must pass.");
  if (!input.webTypecheckPassed) blockers.push("@inkroute/web typecheck must pass.");
  if (!input.globalErrorRenderedComponentTestsAdded) blockers.push("Rendered component tests for web/dashboard global-error boundaries must be added.");
  if (!input.dashboardErrorsPageSmokePassed) blockers.push("Dashboard errors page smoke test must pass in a rendered browser/runtime context.");
  if (!input.playwrightDashboardTriageCovered) blockers.push("Playwright coverage for dashboard triage UI must be added.");
  if (!input.mobileSimulatorCrashReportUiTested) blockers.push("Mobile simulator crash-report UI test must be added.");
  if (!input.mobileDeviceCrashReportUiTested) blockers.push("Mobile physical-device crash-report UI proof must be captured.");
  if (!input.sentryWebhookSignatureTestsCovered) blockers.push("Sentry webhook signature tests must cover missing, invalid, valid, and replay-shaped deliveries.");
  if (!input.publicIngestPersistenceTestsCovered) blockers.push("Public ingest tests must cover invalid, local fallback, DB persistence, audit metadata, and tenant boundaries.");
  if (!input.ciArtifactsCaptured) blockers.push("CI artifacts/screenshots/logs must be captured for observability route, UI, browser, and mobile coverage.");

  if (!input.observabilityPackageTestsPassed || !input.webRouteTestsPassed || !input.webUiStaticTestsPassed || !input.webTypecheckPassed) {
    requiredEvidence.push("package, route, UI static, and web typecheck evidence");
  }
  if (!input.globalErrorRenderedComponentTestsAdded || !input.dashboardErrorsPageSmokePassed || !input.playwrightDashboardTriageCovered) {
    requiredEvidence.push("rendered global-error, dashboard errors smoke, and Playwright triage evidence");
  }
  if (!input.mobileSimulatorCrashReportUiTested || !input.mobileDeviceCrashReportUiTested) {
    requiredEvidence.push("mobile simulator and physical-device crash-report UI evidence");
  }
  if (!input.sentryWebhookSignatureTestsCovered || !input.publicIngestPersistenceTestsCovered) {
    requiredEvidence.push("Sentry webhook signature and public ingest persistence coverage evidence");
  }
  if (!input.ciArtifactsCaptured) {
    requiredEvidence.push("CI screenshots, logs, and artifact evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/observability test",
      "pnpm vitest run apps/web/tests/observability-routes.test.ts apps/web/tests/observability-ui-static.test.ts",
      "pnpm --filter @inkroute/web typecheck",
      "Playwright dashboard observability triage smoke",
      "mobile simulator crash-report UI smoke",
      "mobile physical-device crash-report proof",
    ],
    requiredEvidence,
    requiredControls: [
      "Keep package helper tests, route tests, static UI checks, browser smoke tests, and mobile UI tests in the same Phase 11 closeout matrix.",
      "Render global-error boundaries rather than relying only on static source checks before closure.",
      "Exercise dashboard triage in a browser context with sanitized reports only.",
      "Cover mobile crash-report UI in simulator and physical-device evidence before closure.",
      "Attach CI screenshots, logs, and artifacts for route, UI, browser, and mobile observability coverage.",
    ],
    blockers,
  };
}

export function buildReleaseIncidentLinkagePlan(input: ReleaseIncidentLinkageInput): ReleaseIncidentLinkagePlan {
  const matchingReports = input.reports.filter((report) => {
    const releaseMatches = report.release === input.releaseVersion;
    const environmentMatches = report.environment === input.environment;
    const tenantMatches = !input.tenantId || report.tenantId === input.tenantId;
    return releaseMatches && environmentMatches && tenantMatches;
  });
  const severities = [...new Set(matchingReports.map((report) => report.severity))];
  const hasHighSeverity = matchingReports.some((report) => report.severity === "critical" || report.severity === "high");
  const incidentStatus = input.rollbackRequested ? "rollback_required" : hasHighSeverity ? "active_incident" : matchingReports.length > 0 ? "monitoring" : "none";
  const blockers: string[] = [];

  if (!input.sentryReleaseConfigured) blockers.push("Sentry release tags must be configured before release-level error correlation is ready.");
  if (incidentStatus !== "none" && !input.incidentProviderConfigured) blockers.push("Incident provider/workflow must be configured before release incidents can be opened.");
  if ((input.rollbackRequested || hasHighSeverity) && !input.tenantCommunicationOwner?.trim()) blockers.push("Tenant communication owner must be assigned before rollback or high-severity incident messaging.");

  const linkedReports = matchingReports.map((report) => ({
    id: report.id,
    fingerprint: report.fingerprint,
    severity: report.severity,
    source: report.source,
    route: report.route ?? "unknown",
    release: report.release ?? "unknown",
    redactedMessage: report.redactedMessage,
  }));
  const topReport = linkedReports[0];
  const owner = input.tenantCommunicationOwner?.trim() || "unassigned-release-owner";
  const rollbackIncidentNote = input.rollbackRequested
    ? [
        `Rollback requested for release ${input.releaseVersion} (${input.releaseId}) in ${input.environment}.`,
        topReport ? `Linked sanitized error fingerprint ${topReport.fingerprint} on ${topReport.route}.` : "No matching error report is linked yet.",
        "Use rollback runbook and forward-fix notes; do not include raw PII, medical notes, payment payloads, cookies, or provider tokens.",
      ].join(" ")
    : undefined;
  const tenantCommunicationDraft =
    incidentStatus === "none"
      ? undefined
      : redactSensitiveText(
          [
            `Owner ${owner} will send a tenant-safe ${incidentStatus.replace(/_/g, " ")} update for release ${input.releaseVersion}.`,
            topReport ? `Known impact is tracked as ${topReport.source} ${topReport.severity} on ${topReport.route}: ${topReport.redactedMessage}` : "Known impact is still under review.",
            "Message must avoid client names, contact details, medical details, payment identifiers, screenshots, cookies, authorization headers, and provider payloads.",
          ].join(" "),
        ).text;

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    releaseTags: {
      release: input.releaseVersion,
      releaseId: input.releaseId,
      environment: input.environment,
      ...(input.tenantId ? { tenantId: input.tenantId } : {}),
    },
    dashboardFilters: {
      release: input.releaseVersion,
      environment: input.environment,
      ...(input.tenantId ? { tenantId: input.tenantId } : {}),
      severities,
    },
    linkedReports,
    incidentStatus,
    ...(rollbackIncidentNote ? { rollbackIncidentNote } : {}),
    ...(tenantCommunicationDraft ? { tenantCommunicationDraft } : {}),
    blockers,
    handoffRecords: [
      `Filter dashboard errors by release=${input.releaseVersion}, environment=${input.environment}${input.tenantId ? `, tenant=${input.tenantId}` : ""}.`,
      "Attach linked error fingerprints, alert route, rollback decision, and sanitized tenant communication draft to the release record.",
      "Create provider incident only after owner, Sentry release tags, and tenant-safe messaging are configured.",
    ],
    privacyChecklist: [
      "Use ObservabilityReportDraft.redactedMessage and redactedMetadata only.",
      "Do not include raw PII, medical notes, consent signatures, payment payloads, cookies, authorization headers, or provider tokens in incident notes.",
      "Tenant communication drafts must describe user-visible impact without exposing client-specific details.",
    ],
  };
}

export function buildReleaseIncidentRuntimeReadinessPlan(input: ReleaseIncidentRuntimeReadinessInput): ReleaseIncidentRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/observability ${script} script.`);
  if (!input.observabilityTestsPassed) blockers.push("@inkroute/observability release incident linkage tests must pass.");
  if (!input.observabilityTypecheckPassed) blockers.push("@inkroute/observability typecheck must pass.");
  if (!input.sentryReleaseTagsConfigured) blockers.push("Sentry release tags must be configured for web, dashboard, API, worker, and mobile surfaces.");
  if (!input.sentrySourceMapsUploaded) blockers.push("Sentry source maps and debug symbols must be uploaded for release correlation.");
  if (!input.liveSentryReleaseEvidenceCaptured) blockers.push("Live Sentry release evidence must be captured before production incident linkage.");
  if (!input.errorReportReleaseLinkPersistenceConfigured) blockers.push("ErrorReport-to-release link persistence must be configured.");
  if (!input.releaseRecordIncidentLinkPersistenceConfigured) blockers.push("ReleaseRecord-to-incident link persistence must be configured.");
  if (!input.incidentProviderConfigured) blockers.push("Tenant incident workflow provider must be configured.");
  if (!input.providerIncidentCreationVerified) blockers.push("Provider incident creation must be verified with sanitized release/report payloads.");
  if (!input.rollbackCommunicationHandoffPersisted) blockers.push("Rollback communication handoff must be persisted in the database.");
  if (!input.tenantCommunicationOwnerConfigured) blockers.push("Tenant communication owner must be configured for release incident workflows.");
  if (!input.dashboardReleaseFiltersVerified) blockers.push("Dashboard release/environment/tenant incident filters must be verified.");
  if (!input.tenantScopedIncidentIsolationVerified) blockers.push("Tenant-scoped incident isolation must be verified for release/report links.");
  if (!input.sanitizedPayloadsVerified) blockers.push("Release incident notes, provider payloads, and tenant communication drafts must be proven sanitized.");
  if (!input.liveProviderEvidenceCaptured) blockers.push("Live incident/provider evidence must be captured before closing GAP-093.");

  if (!input.sentryReleaseTagsConfigured || !input.sentrySourceMapsUploaded || !input.liveSentryReleaseEvidenceCaptured) {
    requiredEvidence.push("Sentry release tag, source-map/debug-symbol, and live release evidence");
  }
  if (!input.errorReportReleaseLinkPersistenceConfigured || !input.releaseRecordIncidentLinkPersistenceConfigured || !input.rollbackCommunicationHandoffPersisted) {
    requiredEvidence.push("ErrorReport, ReleaseRecord, incident link, and rollback communication persistence evidence");
  }
  if (!input.incidentProviderConfigured || !input.providerIncidentCreationVerified || !input.liveProviderEvidenceCaptured) {
    requiredEvidence.push("tenant incident provider configuration, creation, and live provider evidence");
  }
  if (!input.tenantCommunicationOwnerConfigured || !input.dashboardReleaseFiltersVerified || !input.tenantScopedIncidentIsolationVerified || !input.sanitizedPayloadsVerified) {
    requiredEvidence.push("tenant owner, dashboard filter, tenant isolation, and sanitized payload evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/observability typecheck",
      "pnpm --filter @inkroute/observability test",
      "Sentry release/source-map correlation smoke",
      "ErrorReport ReleaseRecord linkage persistence smoke",
      "tenant incident provider creation smoke",
      "rollback communication handoff persistence smoke",
      "dashboard release incident filter smoke",
    ],
    requiredEvidence,
    blockers,
  };
}

export function buildSentrySetupChecklist(surface: "nextjs" | "react-native") {
  if (surface === "nextjs") {
    return [
      "Install @sentry/nextjs and run the Sentry wizard or manual setup in each Next.js app.",
      "Create client, server, and edge initialization files with PII redaction before enabling production capture.",
      "Wrap next.config.mjs with source-map upload configuration and keep SENTRY_AUTH_TOKEN in CI secrets only.",
      "Add app/global-error.tsx capture, request error capture, release tags, environment tags, and sampling policy.",
      "Trigger a synthetic error in preview and confirm source maps, release, route, tenant, and redaction behavior.",
    ] as const;
  }

  return [
    "Install @sentry/react-native and configure Expo plugin/Metro integration.",
    "Initialize SDK with EXPO_PUBLIC_SENTRY_DSN, release/runtimeVersion, environment, and beforeSend redaction.",
    "Upload source maps/debug symbols through EAS or CI using SENTRY_AUTH_TOKEN.",
    "Wrap the root component and verify native/JS crashes on simulator and physical device.",
    "Confirm offline crash buffering does not leak PII and that release health aligns with EAS channels.",
  ] as const;
}

export const demoErrorReports: readonly ObservabilityReportDraft[] = [
  buildObservabilityReportDraft({
    tenantId: "tenant_demo_inkroute",
    source: "web",
    runtime: "server",
    environment: "development",
    message: "Booking API returns 501 after validation for ari@example.test",
    route: "/api/public/inkroute-demo/booking-requests",
    release: "phase4-demo",
    metadata: { email: "ari@example.test", reason: "Persistence boundary intentionally not implemented" },
    tags: { phase: "4", feature: "booking" },
  }, "2026-06-01T20:00:00-07:00"),
  buildObservabilityReportDraft({
    tenantId: "tenant_demo_inkroute",
    source: "dashboard",
    runtime: "server",
    environment: "development",
    message: "Dashboard build not verified due missing dependencies",
    route: "/dashboard/*",
    release: "phase5-demo",
    metadata: { command: "tsc --noEmit -p apps/dashboard/tsconfig.json", blocker: "next/react types unavailable" },
    tags: { phase: "5", feature: "dashboard" },
  }, "2026-06-02T09:10:00-07:00"),
  buildObservabilityReportDraft({
    tenantId: "tenant_demo_inkroute",
    source: "mobile",
    runtime: "react-native",
    environment: "development",
    message: "Mobile crash reporting is not connected to Expo runtime",
    route: "apps/mobile/SystemStatusScreen",
    release: "phase6-mobile",
    metadata: { device: "simulator not executed", pushToken: "ExponentPushToken[demo-token]" },
    tags: { phase: "6", feature: "mobile" },
  }, "2026-06-03T10:00:00-07:00"),
];

export type SentryRuntimeSurface = "web-nextjs" | "dashboard-nextjs" | "mobile-expo";
export type SentrySdkReadinessStatus = "ready" | "blocked";
export type SentrySdkEnvironment = Extract<RuntimeEnvironment, "development" | "preview" | "production">;

export interface SentrySdkConfigurationInput {
  surface: SentryRuntimeSurface;
  dsnConfigured: boolean;
  authTokenConfigured: boolean;
  orgConfigured: boolean;
  projectConfigured: boolean;
  release: string;
  environment: SentrySdkEnvironment;
  sampleRate?: number;
  tracesSampleRate?: number;
  sourceMapsEnabled?: boolean;
  debugSymbolsEnabled?: boolean;
  beforeSendRedactionEnabled?: boolean;
  tenantTaggingEnabled?: boolean;
}

export interface SentrySdkConfigurationPlan {
  surface: SentryRuntimeSurface;
  status: SentrySdkReadinessStatus;
  requiredPackages: readonly string[];
  requiredEnv: readonly string[];
  configFiles: readonly string[];
  providerBoundaryIds: readonly string[];
  blockers: readonly string[];
  sourceMapUploadRequired: boolean;
  debugSymbolsRequired: boolean;
  beforeSendPipeline: readonly string[];
  releaseTags: Record<string, string>;
  sampleRate: number;
  tracesSampleRate: number;
}

export interface SentrySdkRuntimeImplementationInput {
  packageScripts: readonly string[];
  observabilityTestsPassed: boolean;
  observabilityTypecheckPassed: boolean;
  webSentryPackageInstalled: boolean;
  dashboardSentryPackageInstalled: boolean;
  mobileSentryPackageInstalled: boolean;
  webInstrumentationFilesImplemented: boolean;
  dashboardInstrumentationFilesImplemented: boolean;
  mobileInstrumentationFilesImplemented: boolean;
  sentryDsnConfigured: boolean;
  sentryAuthTokenConfigured: boolean;
  sentryOrgConfigured: boolean;
  sentryProjectConfigured: boolean;
  releaseTagsConfigured: boolean;
  beforeSendRedactionConfigured: boolean;
  tenantSafeTagsConfigured: boolean;
  nextSourceMapUploadConfigured: boolean;
  expoSourceMapUploadConfigured: boolean;
  reactNativeDebugSymbolsConfigured: boolean;
  ciReleaseArtifactUploadConfigured: boolean;
  liveWebSyntheticCaptureVerified: boolean;
  liveDashboardSyntheticCaptureVerified: boolean;
  liveMobileSyntheticCaptureVerified: boolean;
  providerIssueEvidenceCaptured: boolean;
  noPiiProviderPayloadVerified: boolean;
}

export interface SentrySdkRuntimeImplementationPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

export interface ErrorReportIngestHardeningInput {
  packageScripts: readonly string[];
  routeTestsPassed: boolean;
  webTypecheckPassed: boolean;
  tenantScopeResolved: boolean;
  payloadValidationEnabled: boolean;
  botProtectionConfigured: boolean;
  distributedRateLimitConfigured: boolean;
  abuseMonitoringConfigured: boolean;
  requestIdPropagationConfigured: boolean;
  providerForwardingControlsConfigured: boolean;
  dbBackedPersistenceConfigured: boolean;
  auditLogPersistenceConfigured: boolean;
  localFallbackRedactionVerified: boolean;
  dashboardTenantRbacVerified: boolean;
  providerWebhookSignatureVerified: boolean;
  livePostgresTenantIsolationVerified: boolean;
  noPiiPersistenceVerified: boolean;
}

export interface ErrorReportIngestHardeningPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

export interface ProviderWebhookReconciliationInput {
  packageScripts: readonly string[];
  routeTestsPassed: boolean;
  webTypecheckPassed: boolean;
  webhookSecretConfigured: boolean;
  signatureVerificationEnabled: boolean;
  timingSafeComparisonEnabled: boolean;
  replayProtectionConfigured: boolean;
  durableDeliveryPersistenceConfigured: boolean;
  idempotencyConstraintConfigured: boolean;
  tenantIssueOwnershipLookupConfigured: boolean;
  errorReportStatusMutationConfigured: boolean;
  reconciliationAuditLogsConfigured: boolean;
  sanitizedProviderPayloadsVerified: boolean;
  liveSentryWebhookProofCaptured: boolean;
}

export interface ProviderWebhookReconciliationPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

export interface MobileCrashRuntimeReadinessInput {
  packageScripts: readonly string[];
  observabilityTestsPassed: boolean;
  observabilityTypecheckPassed: boolean;
  mobileTypecheckPassed: boolean;
  sentryExpoSdkConfigured: boolean;
  fallbackReporterConfigured: boolean;
  sentryDsnConfigured: boolean;
  releaseTagsConfigured: boolean;
  beforeSendRedactionConfigured: boolean;
  piiRedactionTestsPassed: boolean;
  sourceMapsUploaded: boolean;
  debugSymbolsUploaded: boolean;
  forcedCrashSimulatorVerified: boolean;
  forcedCrashDeviceVerified: boolean;
  errorReportPersistenceConfigured: boolean;
  sanitizedDashboardSyncVerified: boolean;
  offlineCrashBufferingVerified: boolean;
  noPiiProviderPayloadVerified: boolean;
}

export interface MobileCrashRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
}

const sentrySurfaceBoundaries: Record<SentryRuntimeSurface, readonly string[]> = {
  "web-nextjs": ["sentry-nextjs"],
  "dashboard-nextjs": ["sentry-dashboard"],
  "mobile-expo": ["sentry-react-native"],
};

function clampSampleRate(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function normalizeTelemetryId(value: string | undefined, fallback: string): string {
  const cleaned = value?.trim();
  if (!cleaned) return fallback;
  return cleaned.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || fallback;
}

export function buildTelemetryPipelinePlan(input: TelemetryPipelineInput): TelemetryPipelinePlan {
  const requestId = normalizeTelemetryId(input.requestId, `req_${stableHash(`${input.serviceName}|${input.route ?? "unknown"}|${input.environment}`)}`);
  const traceId = normalizeTelemetryId(input.traceId, `trace_${stableHash(`${requestId}|trace`)}`);
  const spanId = normalizeTelemetryId(input.spanId, `span_${stableHash(`${requestId}|span`)}`);
  const sampleRate = clampSampleRate(input.sampleRate, input.environment === "production" ? 0.1 : 1);
  const blockers: string[] = [];

  if (!input.otlpEndpointConfigured) blockers.push("OTLP exporter endpoint must be configured before external trace/log export.");
  if (!input.structuredLoggingEnabled) blockers.push("Structured logging must be enabled before request/error correlation is ready.");
  if (!input.requestIdPropagationEnabled) blockers.push("Request ID propagation must be enabled across routes, workers, and provider callbacks.");
  if (!input.traceContextPropagationEnabled) blockers.push("Trace context propagation must be enabled before distributed traces are useful.");

  const redactedAttributes = redactMetadata(input.attributes ?? {}).metadata;
  const highRiskPayload = input.errorReport?.redactionLevel === "blocked_high_risk_payload";
  if (highRiskPayload) blockers.push("High-risk payloads must remain local/dashboard-only and cannot be exported to external telemetry sinks.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    blockers,
    requestId,
    traceId,
    spanId,
    sampleRate,
    exporter: {
      type: "otlp-http",
      configured: input.otlpEndpointConfigured,
      requiredEnv: ["OTEL_EXPORTER_OTLP_ENDPOINT", "OTEL_SERVICE_NAME", "OTEL_TRACES_SAMPLER"],
    },
    logRecord: {
      serviceName: input.serviceName,
      environment: input.environment,
      requestId,
      traceId,
      spanId,
      route: input.route ?? "unknown",
      ...(input.tenantId ? { tenantId: input.tenantId } : {}),
      ...(input.errorReport?.fingerprint ? { errorFingerprint: input.errorReport.fingerprint } : {}),
      ...(input.errorReport?.stackHash ? { stackHash: input.errorReport.stackHash } : {}),
      ...(input.errorReport?.severity ? { severity: input.errorReport.severity } : {}),
      attributes: redactedAttributes,
    },
    propagationHeaders: {
      "x-request-id": requestId,
      traceparent: `00-${traceId.padEnd(32, "0").slice(0, 32)}-${spanId.padEnd(16, "0").slice(0, 16)}-01`,
    },
    privacyGuards: [
      "redactMetadata removes sensitive attributes before log export.",
      "Do not export blocked_high_risk_payload events to external OTLP sinks.",
      "Log records may include tenant IDs and fingerprints, but not raw PII, medical notes, consent data, tokens, cookies, or payment payloads.",
    ],
  };
}

export function buildOpenTelemetryRuntimeReadinessPlan(input: OpenTelemetryRuntimeReadinessInput): OpenTelemetryRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/observability ${script} script.`);
  if (!input.observabilityTestsPassed) blockers.push("@inkroute/observability telemetry tests must pass.");
  if (!input.observabilityTypecheckPassed) blockers.push("@inkroute/observability typecheck must pass.");
  if (!input.otelSdkInstalled) blockers.push("OpenTelemetry SDK packages must be installed.");
  if (!input.otlpExporterInstalled) blockers.push("OTLP exporter package must be installed.");
  if (!input.webMiddlewareInstrumented) blockers.push("Public web middleware must propagate OpenTelemetry request and trace context.");
  if (!input.dashboardMiddlewareInstrumented) blockers.push("Dashboard middleware must propagate OpenTelemetry request and trace context.");
  if (!input.apiRoutesInstrumented) blockers.push("API routes must attach OpenTelemetry request IDs and trace context.");
  if (!input.workerRuntimeInstrumented) blockers.push("Worker runtimes must attach OpenTelemetry request IDs and trace context.");
  if (!input.requestIdPropagationConfigured) blockers.push("Request ID propagation must be configured across web, dashboard, API, worker, and provider callbacks.");
  if (!input.traceContextPropagationConfigured) blockers.push("Trace context propagation must be configured across runtime boundaries.");
  if (!input.errorReportTraceCorrelationConfigured) blockers.push("ErrorReport persistence must store request ID, trace ID, fingerprint, and stackHash correlation.");
  if (!input.structuredRuntimeLoggingConfigured) blockers.push("Structured runtime logging middleware must emit privacy-safe telemetry records.");
  if (!input.otlpEndpointConfigured) blockers.push("OTLP backend endpoint must be configured before external export.");
  if (!input.serviceMetadataConfigured) blockers.push("OpenTelemetry service metadata must be configured for every runtime surface.");
  if (!input.samplingPolicyConfigured) blockers.push("Production OpenTelemetry sampling policy must be configured.");
  if (!input.highRiskExportSuppressionVerified) blockers.push("blocked_high_risk_payload telemetry export suppression must be verified.");
  if (!input.liveTraceBackendIngestionVerified) blockers.push("Live trace ingestion must be verified in the OTLP backend.");
  if (!input.liveLogBackendIngestionVerified) blockers.push("Live structured log ingestion must be verified in the OTLP backend.");
  if (!input.noPiiTelemetryVerified) blockers.push("Telemetry traces, logs, attributes, and ErrorReport correlations must be proven free of raw PII.");

  if (!input.otelSdkInstalled || !input.otlpExporterInstalled || !input.otlpEndpointConfigured || !input.serviceMetadataConfigured || !input.samplingPolicyConfigured) {
    requiredEvidence.push("OpenTelemetry SDK, OTLP exporter, endpoint, service metadata, and sampling evidence");
  }
  if (!input.webMiddlewareInstrumented || !input.dashboardMiddlewareInstrumented || !input.apiRoutesInstrumented || !input.workerRuntimeInstrumented) {
    requiredEvidence.push("web, dashboard, API, and worker instrumentation middleware evidence");
  }
  if (!input.requestIdPropagationConfigured || !input.traceContextPropagationConfigured || !input.errorReportTraceCorrelationConfigured || !input.structuredRuntimeLoggingConfigured) {
    requiredEvidence.push("request ID, trace context, ErrorReport correlation, and structured logging evidence");
  }
  if (!input.highRiskExportSuppressionVerified || !input.noPiiTelemetryVerified) {
    requiredEvidence.push("blocked high-risk export suppression and no-PII telemetry evidence");
  }
  if (!input.liveTraceBackendIngestionVerified || !input.liveLogBackendIngestionVerified) {
    requiredEvidence.push("live OTLP trace and structured log backend ingestion evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/observability typecheck",
      "pnpm --filter @inkroute/observability test",
      "OpenTelemetry middleware propagation smoke",
      "ErrorReport trace correlation smoke",
      "blocked_high_risk_payload telemetry suppression smoke",
      "live OTLP trace/log backend ingestion proof",
    ],
    requiredEvidence,
    requiredControls: [
      "Install OpenTelemetry SDK and OTLP exporter packages before enabling external telemetry export.",
      "Propagate request IDs and trace context through web, dashboard, API, worker, and provider callback paths.",
      "Attach request ID, trace ID, fingerprint, and stackHash to redacted ErrorReport persistence only.",
      "Emit structured logs through privacy-safe middleware that uses redactMetadata before export.",
      "Suppress blocked_high_risk_payload events from all external OTLP sinks.",
      "Capture live backend traces/logs and no-PII evidence before closing the gap.",
    ],
    blockers,
  };
}

export function buildSentrySdkConfigurationPlan(input: SentrySdkConfigurationInput): SentrySdkConfigurationPlan {
  const providerBoundaries = observabilityProviderBoundaries.filter((boundary) => sentrySurfaceBoundaries[input.surface].includes(boundary.id));
  const requiredEnv = [...new Set(providerBoundaries.flatMap((boundary) => boundary.requiredEnv))];
  const configFiles = [...new Set(providerBoundaries.flatMap((boundary) => boundary.implementationFiles))];
  const isMobile = input.surface === "mobile-expo";
  const blockers: string[] = [];

  if (!input.dsnConfigured) blockers.push("Sentry DSN is not configured for this runtime surface.");
  if (!input.authTokenConfigured) blockers.push("SENTRY_AUTH_TOKEN is required for release artifact upload.");
  if (!input.orgConfigured) blockers.push("SENTRY_ORG is required for release artifact upload.");
  if (!input.projectConfigured) blockers.push("SENTRY_PROJECT is required for release artifact upload.");
  if (input.release.trim().length === 0) blockers.push("Sentry release tag is required before runtime capture can be enabled.");
  if (!input.beforeSendRedactionEnabled) blockers.push("beforeSend redaction must call redactSensitiveText and redactMetadata before event submission.");
  if (!input.tenantTaggingEnabled) blockers.push("Tenant-safe tags must be emitted without customer PII or medical/payment data.");
  if (!isMobile && !input.sourceMapsEnabled) blockers.push("Next.js source-map upload must be enabled for server, edge, and browser bundles.");
  if (isMobile && !input.sourceMapsEnabled) blockers.push("Expo JavaScript source-map upload must be enabled for mobile releases.");
  if (isMobile && !input.debugSymbolsEnabled) blockers.push("React Native debug symbol upload must be enabled and verified through EAS.");

  return {
    surface: input.surface,
    status: blockers.length === 0 ? "ready" : "blocked",
    requiredPackages: isMobile ? ["@sentry/react-native"] : ["@sentry/nextjs"],
    requiredEnv,
    configFiles,
    providerBoundaryIds: providerBoundaries.map((boundary) => boundary.id),
    blockers,
    sourceMapUploadRequired: true,
    debugSymbolsRequired: isMobile,
    beforeSendPipeline: ["redactSensitiveText", "redactMetadata", "drop-high-risk-context", "tenant-safe-tags"],
    releaseTags: {
      release: input.release,
      environment: input.environment,
      surface: input.surface,
    },
    sampleRate: clampSampleRate(input.sampleRate, input.environment === "production" ? 0.25 : 1),
    tracesSampleRate: clampSampleRate(input.tracesSampleRate, input.environment === "production" ? 0.1 : 0.25),
  };
}

export function buildSentrySdkRuntimeImplementationPlan(input: SentrySdkRuntimeImplementationInput): SentrySdkRuntimeImplementationPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/observability ${script} script.`);
  if (!input.observabilityTestsPassed) blockers.push("@inkroute/observability Sentry SDK tests must pass.");
  if (!input.observabilityTypecheckPassed) blockers.push("@inkroute/observability typecheck must pass.");
  if (!input.webSentryPackageInstalled) blockers.push("@sentry/nextjs must be installed for the public web app.");
  if (!input.dashboardSentryPackageInstalled) blockers.push("@sentry/nextjs must be installed for the dashboard app.");
  if (!input.mobileSentryPackageInstalled) blockers.push("@sentry/react-native must be installed for the Expo mobile app.");
  if (!input.webInstrumentationFilesImplemented) blockers.push("Public web Sentry instrumentation/config files must be implemented.");
  if (!input.dashboardInstrumentationFilesImplemented) blockers.push("Dashboard Sentry instrumentation/config files must be implemented.");
  if (!input.mobileInstrumentationFilesImplemented) blockers.push("Mobile Sentry/Expo instrumentation files must be implemented.");
  if (!input.sentryDsnConfigured) blockers.push("Sentry DSN must be configured for web, dashboard, and mobile surfaces.");
  if (!input.sentryAuthTokenConfigured) blockers.push("SENTRY_AUTH_TOKEN must be configured in CI secrets.");
  if (!input.sentryOrgConfigured) blockers.push("SENTRY_ORG must be configured in CI secrets.");
  if (!input.sentryProjectConfigured) blockers.push("SENTRY_PROJECT must be configured in CI secrets.");
  if (!input.releaseTagsConfigured) blockers.push("Sentry release, environment, and surface tags must be configured.");
  if (!input.beforeSendRedactionConfigured) blockers.push("Sentry beforeSend redaction must be configured for every surface.");
  if (!input.tenantSafeTagsConfigured) blockers.push("Sentry tenant-safe tags must be configured without raw PII.");
  if (!input.nextSourceMapUploadConfigured) blockers.push("Next.js source-map upload must be configured for web and dashboard.");
  if (!input.expoSourceMapUploadConfigured) blockers.push("Expo JavaScript source-map upload must be configured.");
  if (!input.reactNativeDebugSymbolsConfigured) blockers.push("React Native debug-symbol upload must be configured.");
  if (!input.ciReleaseArtifactUploadConfigured) blockers.push("CI release artifact upload must be configured for Sentry.");
  if (!input.liveWebSyntheticCaptureVerified) blockers.push("Live public web synthetic Sentry capture must be verified.");
  if (!input.liveDashboardSyntheticCaptureVerified) blockers.push("Live dashboard synthetic Sentry capture must be verified.");
  if (!input.liveMobileSyntheticCaptureVerified) blockers.push("Live mobile synthetic Sentry capture must be verified.");
  if (!input.providerIssueEvidenceCaptured) blockers.push("Sentry provider issue/event evidence must be captured.");
  if (!input.noPiiProviderPayloadVerified) blockers.push("Sentry provider payloads must be proven free of raw PII, medical, payment, token, and private URL values.");

  if (!input.webSentryPackageInstalled || !input.dashboardSentryPackageInstalled || !input.mobileSentryPackageInstalled) {
    requiredEvidence.push("Sentry package installation evidence for web, dashboard, and mobile");
  }
  if (!input.webInstrumentationFilesImplemented || !input.dashboardInstrumentationFilesImplemented || !input.mobileInstrumentationFilesImplemented) {
    requiredEvidence.push("Sentry instrumentation and config file evidence across app surfaces");
  }
  if (!input.sentryDsnConfigured || !input.sentryAuthTokenConfigured || !input.sentryOrgConfigured || !input.sentryProjectConfigured) {
    requiredEvidence.push("Sentry credential and CI secret configuration evidence");
  }
  if (!input.nextSourceMapUploadConfigured || !input.expoSourceMapUploadConfigured || !input.reactNativeDebugSymbolsConfigured || !input.ciReleaseArtifactUploadConfigured) {
    requiredEvidence.push("source-map, debug-symbol, and CI release artifact upload evidence");
  }
  if (!input.liveWebSyntheticCaptureVerified || !input.liveDashboardSyntheticCaptureVerified || !input.liveMobileSyntheticCaptureVerified || !input.providerIssueEvidenceCaptured || !input.noPiiProviderPayloadVerified) {
    requiredEvidence.push("live synthetic capture, provider issue, and no-PII payload evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/observability typecheck",
      "pnpm --filter @inkroute/observability test",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/mobile typecheck",
      "Sentry web synthetic capture smoke",
      "Sentry dashboard synthetic capture smoke",
      "Sentry mobile synthetic capture smoke",
      "Sentry source-map/debug-symbol resolution check",
    ],
    requiredEvidence,
    requiredControls: [
      "Install and configure Sentry SDKs separately for public web, dashboard, and Expo mobile surfaces.",
      "Run beforeSend redaction and tenant-safe tag filtering before every provider submission.",
      "Upload web/dashboard source maps, Expo source maps, and React Native debug symbols from CI with secret-backed credentials.",
      "Tag Sentry events with release, environment, surface, route, and tenant-safe identifiers only.",
      "Verify live synthetic captures and source resolution for web, dashboard, and mobile before launch.",
      "Capture provider issue links/screenshots proving no raw PII, medical, payment, token, or private URL payload leakage.",
    ],
    blockers,
  };
}

export function buildErrorReportIngestHardeningPlan(input: ErrorReportIngestHardeningInput): ErrorReportIngestHardeningPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/web ${script} script.`);
  if (!input.routeTestsPassed) blockers.push("Public error-report ingest and dashboard route tests must pass.");
  if (!input.webTypecheckPassed) blockers.push("@inkroute/web typecheck must pass without unrelated booking-contract failures.");
  if (!input.tenantScopeResolved) blockers.push("Public ingest must resolve tenant scope before persistence or provider forwarding.");
  if (!input.payloadValidationEnabled) blockers.push("Public ingest must reject malformed or abusive error-report payloads before persistence.");
  if (!input.botProtectionConfigured) blockers.push("Production bot protection must guard public error-report ingest.");
  if (!input.distributedRateLimitConfigured) blockers.push("Durable distributed rate limiting must replace process-local fallback limits.");
  if (!input.abuseMonitoringConfigured) blockers.push("Abuse monitoring and alert ownership must be configured for ingest spikes.");
  if (!input.requestIdPropagationConfigured) blockers.push("Request ID and trace context must propagate through ingest, persistence, audit, and provider forwarding.");
  if (!input.providerForwardingControlsConfigured) blockers.push("Provider forwarding controls must enforce signature, replay, tenant, and redaction gates.");
  if (!input.dbBackedPersistenceConfigured) blockers.push("DB-backed redacted ErrorReport persistence must be configured.");
  if (!input.auditLogPersistenceConfigured) blockers.push("AuditLog persistence must record public ingest, dashboard triage, and provider-forwarding decisions.");
  if (!input.localFallbackRedactionVerified) blockers.push("Local fallback previews must remain redacted when the DB is unavailable.");
  if (!input.dashboardTenantRbacVerified) blockers.push("Dashboard read/write routes must prove tenant and RBAC isolation for persisted ErrorReport records.");
  if (!input.providerWebhookSignatureVerified) blockers.push("Provider webhook ingestion must be credential-gated with signature and replay protection.");
  if (!input.livePostgresTenantIsolationVerified) blockers.push("Live Postgres tenant-isolation proof is required before closing GAP-081.");
  if (!input.noPiiPersistenceVerified) blockers.push("Persisted reports, audit logs, provider payloads, and dashboard views must be proven free of raw PII.");

  if (!input.tenantScopeResolved || !input.payloadValidationEnabled || !input.botProtectionConfigured || !input.distributedRateLimitConfigured) {
    requiredEvidence.push("public ingest tenant, validation, bot-protection, and distributed rate-limit evidence");
  }
  if (!input.dbBackedPersistenceConfigured || !input.auditLogPersistenceConfigured || !input.localFallbackRedactionVerified) {
    requiredEvidence.push("redacted ErrorReport, AuditLog, and local fallback persistence evidence");
  }
  if (!input.dashboardTenantRbacVerified || !input.livePostgresTenantIsolationVerified) {
    requiredEvidence.push("dashboard RBAC and live Postgres tenant-isolation evidence");
  }
  if (!input.providerForwardingControlsConfigured || !input.providerWebhookSignatureVerified || !input.noPiiPersistenceVerified) {
    requiredEvidence.push("provider forwarding, webhook signature, replay, and no-PII payload evidence");
  }
  if (!input.abuseMonitoringConfigured || !input.requestIdPropagationConfigured) {
    requiredEvidence.push("abuse monitoring, request ID, and trace propagation evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm vitest run apps/web/tests/observability-routes.test.ts",
      "pnpm --filter @inkroute/web typecheck",
      "public error-report ingest bot-protection smoke",
      "distributed rate-limit abuse smoke",
      "live Postgres tenant-isolation ingest proof",
      "provider forwarding redaction and replay smoke",
    ],
    requiredEvidence,
    requiredControls: [
      "Resolve tenant scope and validate request shape before persistence, audit writes, or provider forwarding.",
      "Use production bot protection plus durable distributed rate limiting for public ingest endpoints.",
      "Persist only redacted ErrorReport rows and AuditLog metadata; keep raw provider payloads out of storage.",
      "Propagate request IDs through ingest, dashboard triage, audit records, and provider forwarding.",
      "Gate provider forwarding and webhooks with credentials, replay protection, tenant boundaries, and redaction checks.",
      "Prove dashboard RBAC and live Postgres tenant isolation before closing the gap.",
    ],
    blockers,
  };
}

export function buildProviderWebhookReconciliationPlan(input: ProviderWebhookReconciliationInput): ProviderWebhookReconciliationPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/web ${script} script.`);
  if (!input.routeTestsPassed) blockers.push("Sentry webhook route tests must pass.");
  if (!input.webTypecheckPassed) blockers.push("@inkroute/web typecheck must pass.");
  if (!input.webhookSecretConfigured) blockers.push("SENTRY_WEBHOOK_SECRET must be configured before accepting provider deliveries.");
  if (!input.signatureVerificationEnabled) blockers.push("Sentry webhook HMAC-SHA256 signature verification must be enabled.");
  if (!input.timingSafeComparisonEnabled) blockers.push("Webhook signature comparison must use timing-safe comparison.");
  if (!input.replayProtectionConfigured) blockers.push("Provider webhook replay protection must be configured.");
  if (!input.durableDeliveryPersistenceConfigured) blockers.push("Durable provider-delivery persistence must be configured.");
  if (!input.idempotencyConstraintConfigured) blockers.push("Replay-safe unique idempotency constraints must protect provider deliveries.");
  if (!input.tenantIssueOwnershipLookupConfigured) blockers.push("Provider issue ownership must resolve tenant scope before reconciliation.");
  if (!input.errorReportStatusMutationConfigured) blockers.push("Provider action reconciliation must mutate ErrorReport status transactionally.");
  if (!input.reconciliationAuditLogsConfigured) blockers.push("Reconciliation audit logs must record provider action, target status, tenant, and actor metadata.");
  if (!input.sanitizedProviderPayloadsVerified) blockers.push("Provider webhook payloads and reconciliation metadata must be proven sanitized.");
  if (!input.liveSentryWebhookProofCaptured) blockers.push("Live Sentry webhook delivery and replay proof must be captured.");

  if (!input.webhookSecretConfigured || !input.signatureVerificationEnabled || !input.timingSafeComparisonEnabled || !input.replayProtectionConfigured) {
    requiredEvidence.push("webhook secret, signature, timing-safe comparison, and replay-protection evidence");
  }
  if (!input.durableDeliveryPersistenceConfigured || !input.idempotencyConstraintConfigured) {
    requiredEvidence.push("durable provider-delivery persistence and idempotency constraint evidence");
  }
  if (!input.tenantIssueOwnershipLookupConfigured || !input.errorReportStatusMutationConfigured || !input.reconciliationAuditLogsConfigured) {
    requiredEvidence.push("tenant ownership lookup, ErrorReport status mutation, and reconciliation audit evidence");
  }
  if (!input.sanitizedProviderPayloadsVerified || !input.liveSentryWebhookProofCaptured) {
    requiredEvidence.push("sanitized provider payload and live Sentry webhook replay evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm vitest run apps/web/tests/observability-routes.test.ts",
      "pnpm --filter @inkroute/web typecheck",
      "Sentry webhook valid signature smoke",
      "Sentry webhook replay/idempotency smoke",
      "provider action ErrorReport reconciliation smoke",
      "live Sentry webhook delivery proof",
    ],
    requiredEvidence,
    requiredControls: [
      "Reject unsigned, invalidly signed, replayed, or uncredentialed provider webhook deliveries before reconciliation.",
      "Persist provider deliveries durably with unique idempotency keys before mutating ErrorReport state.",
      "Resolve tenant ownership for provider issues before status reconciliation.",
      "Mutate ErrorReport status and reconciliation audit logs in a single transaction boundary.",
      "Store sanitized provider payload summaries only; keep raw provider payloads out of tenant-visible surfaces.",
      "Capture live Sentry delivery and replay evidence before closing the gap.",
    ],
    blockers,
  };
}

export function buildMobileCrashRuntimeReadinessPlan(input: MobileCrashRuntimeReadinessInput): MobileCrashRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/observability ${script} script.`);
  if (!input.observabilityTestsPassed) blockers.push("@inkroute/observability mobile crash tests must pass.");
  if (!input.observabilityTypecheckPassed) blockers.push("@inkroute/observability typecheck must pass.");
  if (!input.mobileTypecheckPassed) blockers.push("@inkroute/mobile typecheck must pass with crash reporting wired.");
  if (!input.sentryExpoSdkConfigured && !input.fallbackReporterConfigured) {
    blockers.push("Either Sentry Expo/React Native SDK or a privacy-safe fallback reporter must be configured.");
  }
  if (!input.sentryDsnConfigured) blockers.push("Mobile Sentry DSN must be configured in environment/secret settings.");
  if (!input.releaseTagsConfigured) blockers.push("Mobile crash reports must include release, environment, EAS channel, and runtime version tags.");
  if (!input.beforeSendRedactionConfigured) blockers.push("beforeSend/fallback redaction must run before external mobile crash capture.");
  if (!input.piiRedactionTestsPassed) blockers.push("Mobile crash redaction tests must cover PII, medical notes, reference file URLs, payment ids, push tokens, auth tokens, and breadcrumbs.");
  if (!input.sourceMapsUploaded) blockers.push("Expo JavaScript source maps must upload for mobile releases.");
  if (!input.debugSymbolsUploaded) blockers.push("React Native debug symbols must upload and resolve stack frames.");
  if (!input.forcedCrashSimulatorVerified) blockers.push("Forced mobile crash must be verified on simulator without leaking PII.");
  if (!input.forcedCrashDeviceVerified) blockers.push("Forced mobile crash must be verified on physical device without leaking PII.");
  if (!input.errorReportPersistenceConfigured) blockers.push("Sanitized mobile crash summaries must persist to ErrorReport.");
  if (!input.sanitizedDashboardSyncVerified) blockers.push("Dashboard triage must read sanitized mobile ErrorReport records with tenant/release filters.");
  if (!input.offlineCrashBufferingVerified) blockers.push("Offline crash buffering must be verified to avoid storing raw PII/provider payloads.");
  if (!input.noPiiProviderPayloadVerified) blockers.push("Provider payloads and dashboard summaries must be proven free of raw PII, medical, payment, token, and private URL values.");

  if (!input.sentryExpoSdkConfigured && !input.fallbackReporterConfigured) requiredEvidence.push("mobile crash capture SDK or fallback reporter configuration evidence");
  if (!input.sourceMapsUploaded || !input.debugSymbolsUploaded) requiredEvidence.push("Expo source-map and React Native debug-symbol upload evidence");
  if (!input.forcedCrashSimulatorVerified || !input.forcedCrashDeviceVerified) requiredEvidence.push("forced simulator and device crash capture evidence");
  if (!input.errorReportPersistenceConfigured || !input.sanitizedDashboardSyncVerified) requiredEvidence.push("sanitized ErrorReport persistence and dashboard triage evidence");
  if (!input.piiRedactionTestsPassed || !input.noPiiProviderPayloadVerified || !input.offlineCrashBufferingVerified) {
    requiredEvidence.push("mobile crash privacy redaction and offline buffering evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/observability typecheck",
      "pnpm --filter @inkroute/observability test",
      "pnpm --filter @inkroute/mobile typecheck",
      "Expo simulator forced crash smoke test",
      "Expo physical-device forced crash smoke test",
      "Sentry source-map/debug-symbol resolution check",
    ],
    requiredEvidence,
    blockers,
  };
}

export function buildObservabilityRuntimeVerificationPlan(input: ObservabilityRuntimeVerificationInput): ObservabilityRuntimeVerificationPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/observability ${script} script.`);
  if (!input.packageTestsPassed) blockers.push("@inkroute/observability runtime verification tests must pass.");
  if (!input.packageTypecheckPassed) blockers.push("@inkroute/observability typecheck must pass.");
  if (!input.webBuildPassed) blockers.push("@inkroute/web build must pass before web forced-error verification.");
  if (!input.dashboardBuildPassed) blockers.push("@inkroute/dashboard build must pass before dashboard forced-error verification.");
  if (!input.mobileTypecheckPassed) blockers.push("@inkroute/mobile typecheck must pass before mobile forced-error verification.");
  if (!input.routeSmokeTestsPassed) blockers.push("Observability route smoke tests must pass.");
  if (!input.forcedWebErrorUxVerified) blockers.push("Forced public web error fallback UX must be verified in a browser.");
  if (!input.forcedDashboardErrorUxVerified) blockers.push("Forced dashboard error fallback UX must be verified in a browser.");
  if (!input.forcedApiErrorVerified) blockers.push("Forced API error response envelope and sanitized logs must be verified.");
  if (!input.forcedWebhookErrorVerified) blockers.push("Forced webhook error response envelope and provider-gated behavior must be verified.");
  if (!input.forcedMobileErrorUxVerified) blockers.push("Forced mobile error/crash UX must be verified on simulator or device.");
  if (!input.browserScreenshotsCaptured) blockers.push("Browser fallback screenshots must be captured.");
  if (!input.simulatorOrDeviceScreenshotsCaptured) blockers.push("Simulator or device screenshots must be captured for mobile error UX.");
  if (!input.sanitizedLogOutputCaptured) blockers.push("Sanitized log output must be captured for forced errors.");
  if (!input.localFallbackPersistenceVerified) blockers.push("Local fallback ErrorReport persistence must be verified.");
  if (!input.dashboardTriageDisplayVerified) blockers.push("Dashboard triage display for sanitized reports must be verified.");
  if (!input.sentrySdkConfigured) blockers.push("Sentry SDK must be configured before live provider runtime proof.");
  if (!input.liveSentryProviderProofCaptured) blockers.push("Live Sentry/provider runtime proof must be captured.");
  if (!input.providerWebhookProofCaptured) blockers.push("Provider webhook runtime proof must be captured.");
  if (!input.noPiiLeakageVerified) blockers.push("Forced-error screenshots, logs, persistence, and provider payloads must be proven free of raw PII.");
  if (!input.runtimeEvidenceAttached) blockers.push("Runtime verification screenshots, logs, and provider evidence must be attached to closeout.");

  if (!input.forcedWebErrorUxVerified || !input.forcedDashboardErrorUxVerified || !input.browserScreenshotsCaptured) {
    requiredEvidence.push("browser forced-error fallback UX screenshot evidence");
  }
  if (!input.forcedMobileErrorUxVerified || !input.simulatorOrDeviceScreenshotsCaptured) {
    requiredEvidence.push("mobile simulator/device forced-error UX evidence");
  }
  if (!input.forcedApiErrorVerified || !input.forcedWebhookErrorVerified || !input.sanitizedLogOutputCaptured || !input.localFallbackPersistenceVerified) {
    requiredEvidence.push("API/webhook forced-error envelope, sanitized log, and local persistence evidence");
  }
  if (!input.dashboardTriageDisplayVerified || !input.noPiiLeakageVerified) {
    requiredEvidence.push("dashboard triage and no-PII leakage evidence");
  }
  if (!input.sentrySdkConfigured || !input.liveSentryProviderProofCaptured || !input.providerWebhookProofCaptured || !input.runtimeEvidenceAttached) {
    requiredEvidence.push("Sentry/provider runtime proof and attached closeout evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/observability typecheck",
      "pnpm --filter @inkroute/observability test",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/mobile typecheck",
      "pnpm vitest run apps/web/tests/observability-routes.test.ts",
      "browser forced web/dashboard error smoke",
      "API/webhook forced error smoke",
      "Expo simulator/device forced error smoke",
      "Sentry/provider live runtime proof",
    ],
    requiredEvidence,
    requiredControls: [
      "Use safe synthetic errors only; never trigger destructive or production-impacting failures.",
      "Verify fallback UX for public web, dashboard, API, webhook, and mobile surfaces under real runtime.",
      "Capture screenshots, route envelopes, and sanitized logs for forced-error closeout evidence.",
      "Persist only sanitized ErrorReport summaries and prove dashboard triage reads the sanitized records.",
      "Prove live Sentry/provider capture after SDK configuration, with source/release tags and no raw PII.",
      "Attach runtime screenshots, logs, provider event links, and redaction proof before closing the gap.",
    ],
    blockers,
  };
}

export function buildObservabilityRuntimeReadinessPlan(input: ObservabilityRuntimeReadinessInput): ObservabilityRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/observability ${script} script.`);
  if (!input.packageTestsPassed) blockers.push("Observability package tests must pass before launch readiness.");
  if (!input.packageTypecheckPassed) blockers.push("Observability package typecheck must pass before launch readiness.");
  if (!input.sentryWebConfigured) blockers.push("Sentry Next.js SDK must be configured for the public web app.");
  if (!input.sentryDashboardConfigured) blockers.push("Sentry Next.js SDK must be configured for the dashboard app.");
  if (!input.sentryMobileConfigured) blockers.push("Sentry React Native SDK must be configured for the Expo mobile app.");
  if (!input.sentryReleaseArtifactsConfigured) blockers.push("Sentry release artifact upload must be configured in CI.");
  if (!input.sourceMapsVerified) blockers.push("Web and dashboard source-map resolution must be verified with forced errors.");
  if (!input.mobileDebugSymbolsVerified) blockers.push("Mobile source maps/debug symbols must be verified through Expo/EAS crash evidence.");
  if (!input.forcedWebErrorVerified) blockers.push("Forced public web error must appear in Sentry and dashboard triage without PII.");
  if (!input.forcedDashboardErrorVerified) blockers.push("Forced dashboard error must appear in Sentry and dashboard triage without PII.");
  if (!input.forcedMobileCrashVerified) blockers.push("Forced mobile crash must appear in Sentry and dashboard triage without PII.");
  if (!input.forcedApiErrorVerified) blockers.push("Forced API/webhook error must appear in Sentry and dashboard triage without PII.");
  if (!input.otelExporterConfigured) blockers.push("OpenTelemetry exporter endpoint and service metadata must be configured.");
  if (!input.structuredLoggingConfigured) blockers.push("Structured logging must be configured for web, dashboard, API, worker, and webhook surfaces.");
  if (!input.requestTracePropagationVerified) blockers.push("Request ID and trace context propagation must be verified across routes, workers, and provider callbacks.");
  if (!input.errorReportPersistenceConfigured) blockers.push("Sanitized ErrorReport persistence must be configured before dashboard viewing is production-ready.");
  if (!input.dashboardTriagePersistenceVerified) blockers.push("Dashboard triage must read persisted sanitized ErrorReport records with tenant isolation.");
  if (!input.providerWebhookSignatureVerified) blockers.push("Sentry/provider webhook signature verification and replay protection must be verified.");
  if (!input.alertRoutingConfigured) blockers.push("High/critical alert routing must be configured with on-call ownership and dashboard-only privacy fallback.");
  if (!input.redactionTestsPassed) blockers.push("Redaction tests must pass for messages, metadata, tags, alert payloads, issue drafts, and telemetry attributes.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/observability typecheck",
      "pnpm --filter @inkroute/observability test",
      "forced web/dashboard/API Sentry capture smoke",
      "forced Expo mobile crash capture smoke",
      "source-map and debug-symbol resolution checks",
      "tenant-isolated ErrorReport persistence integration tests",
      "Sentry/provider webhook signature and replay tests",
    ],
    requiredControls: [
      "Run redactSensitiveText and redactMetadata before external capture, persistence, alerting, issue creation, or telemetry export.",
      "Tag events with release, environment, surface, route, request ID, trace ID, and tenant-safe identifiers only.",
      "Upload web/dashboard source maps and mobile debug symbols from CI using secret-backed Sentry credentials.",
      "Persist only sanitized ErrorReport summaries and keep raw provider payloads out of dashboard triage.",
      "Verify provider webhook signatures and replay protection before reconciling Sentry or incident events.",
      "Route high-risk payloads to dashboard-only review instead of Slack, pager, GitHub, or OTLP export.",
      "Keep request ID and trace context propagation consistent across routes, workers, provider callbacks, and mobile crash reports.",
    ],
    blockers,
  };
}
