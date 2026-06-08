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
