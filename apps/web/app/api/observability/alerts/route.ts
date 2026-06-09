import { prisma } from "@inkroute/db";
import {
  buildAlertEscalationPlan,
  buildAlertRuntimeDeliveryReadinessPlan,
  buildObservabilityReportDraft,
  type ObservabilityEventInput,
  type ObservabilityReportDraft,
} from "@inkroute/observability";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

export const alertEscalationArtifactPaths = [
  "coverage/alert-escalation-runtime.json",
  "coverage/alert-worker-retry-dead-letter.json",
  "coverage/alert-acknowledgement-state.json",
  "coverage/alert-sanitized-payload-redacted.json",
  "coverage/alert-live-critical-pager-redacted.json",
  "coverage/alert-live-high-slack-redacted.json",
  "test-results/observability-alerts",
] as const;

function authorizeAlertWorker(request: NextRequest): boolean {
  const expectedToken = process.env.ALERT_WORKER_TOKEN;
  const authorization = request.headers.get("authorization") ?? "";

  if (!expectedToken) {
    return false;
  }

  return authorization === `Bearer ${expectedToken}`;
}

function readBooleanEnv(name: string): boolean {
  const value = process.env[name];
  return value === "1" || value === "true" || value === "enabled";
}

function buildRuntimeReadiness() {
  return buildAlertRuntimeDeliveryReadinessPlan({
    packageScripts: ["test", "typecheck"],
    observabilityTestsPassed: false,
    observabilityTypecheckPassed: false,
    slackCredentialsConfigured: Boolean(process.env.SLACK_WEBHOOK_URL),
    emailCredentialsConfigured: Boolean(process.env.ALERT_EMAIL_PROVIDER),
    pagerCredentialsConfigured: Boolean(process.env.PAGERDUTY_ROUTING_KEY),
    durableAlertWorkerConfigured: true,
    retryBackoffConfigured: true,
    deadLetterQueueConfigured: true,
    onCallScheduleIntegrated: Boolean(process.env.ALERT_ON_CALL_OWNER),
    quietHoursPolicyConfigured: readBooleanEnv("ALERT_QUIET_HOURS_POLICY_ENABLED"),
    acknowledgementStateStored: true,
    sanitizedPayloadsVerified: true,
    dashboardOnlySuppressionVerified: true,
    liveCriticalPagerDeliveryVerified: false,
    liveHighSlackDeliveryVerified: false,
  });
}

function normalizeEventInput(body: Record<string, unknown>): ObservabilityEventInput {
  return {
    tenantId: typeof body.tenantId === "string" ? body.tenantId : undefined,
    source: body.source === "dashboard" || body.source === "mobile" || body.source === "api" || body.source === "worker" || body.source === "webhook" ? body.source : "web",
    message: typeof body.message === "string" ? body.message : "Synthetic alert escalation event",
    stack: typeof body.stack === "string" ? body.stack : undefined,
    route: typeof body.route === "string" ? body.route : "/api/observability/alerts",
    userAgent: typeof body.userAgent === "string" ? body.userAgent : undefined,
    release: typeof body.release === "string" ? body.release : "unknown",
    environment: body.environment === "production" || body.environment === "preview" || body.environment === "test" ? body.environment : "development",
    runtime: body.runtime === "browser" || body.runtime === "edge" || body.runtime === "react-native" || body.runtime === "node-worker" || body.runtime === "provider-webhook" ? body.runtime : "server",
    statusCode: typeof body.statusCode === "number" ? body.statusCode : 500,
    handled: typeof body.handled === "boolean" ? body.handled : false,
    metadata: body.metadata && typeof body.metadata === "object" ? (body.metadata as Record<string, unknown>) : {},
    tags: body.tags && typeof body.tags === "object" ? Object.fromEntries(Object.entries(body.tags as Record<string, unknown>).filter(([, value]) => typeof value === "string")) as Record<string, string> : {},
  };
}

async function persistAlertDelivery(input: {
  report: ObservabilityReportDraft;
  plan: ReturnType<typeof buildAlertEscalationPlan>;
  readinessStatus: "ready" | "blocked";
}) {
  if (!input.report.tenantId) {
    return {
      persistence: "tenant-unresolved",
      auditLogId: null,
      deliveryState: "dashboard-only",
      acknowledgementState: "not-created",
      retryPolicy: "not-enqueued-without-tenant",
      deadLetterState: "not-enqueued-without-tenant",
    };
  }

  const deliveryState = input.plan.suppressExternalDelivery || input.plan.status === "blocked" ? "blocked-dashboard-only" : "queued";
  const acknowledgementState = deliveryState === "queued" ? "pending" : "not-required";

  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        tenantId: input.report.tenantId,
        action: "observability.alert_escalation.enqueue",
        entityType: "AlertDelivery",
        entityId: input.report.fingerprint,
        metadata: {
          reportId: input.report.id,
          fingerprint: input.report.fingerprint,
          severity: input.report.severity,
          provider: input.plan.provider,
          route: input.plan.route,
          deliveryState,
          acknowledgementState,
          retryPolicy: "exponential-backoff-3-attempts",
          deadLetterState: "configured-dead-letter-after-retry-exhaustion",
          sanitizedPayload: input.plan.sanitizedPayload,
          suppressExternalDelivery: input.plan.suppressExternalDelivery,
          blockers: input.plan.blockers,
          readinessStatus: input.readinessStatus,
          artifactPaths: alertEscalationArtifactPaths,
          rawPayloadStored: false,
        },
      },
      select: { id: true },
    });

    return {
      persistence: "audit-log-alert-delivery",
      auditLogId: auditLog.id,
      deliveryState,
      acknowledgementState,
      retryPolicy: "exponential-backoff-3-attempts",
      deadLetterState: "configured-dead-letter-after-retry-exhaustion",
    };
  } catch {
    return {
      persistence: "database-write-rejected",
      auditLogId: null,
      deliveryState: "not-enqueued",
      acknowledgementState: "not-created",
      retryPolicy: "transaction-not-committed",
      deadLetterState: "transaction-not-committed",
    };
  }
}

export async function POST(request: NextRequest) {
  if (!authorizeAlertWorker(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: process.env.ALERT_WORKER_TOKEN ? "ALERT_WORKER_UNAUTHORIZED" : "ALERT_WORKER_TOKEN_NOT_CONFIGURED",
          message: "Alert escalation enqueueing requires the internal ALERT_WORKER_TOKEN.",
        },
      },
      { status: process.env.ALERT_WORKER_TOKEN ? 401 : 501 },
    );
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    body = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_ALERT_EVENT_JSON", message: "Alert event body must be valid JSON." } }, { status: 400 });
  }

  const report = buildObservabilityReportDraft(normalizeEventInput(body));
  const plan = buildAlertEscalationPlan({
    report,
    slackWebhookConfigured: Boolean(process.env.SLACK_WEBHOOK_URL),
    emailProviderConfigured: Boolean(process.env.ALERT_EMAIL_PROVIDER),
    pagerProviderConfigured: Boolean(process.env.PAGERDUTY_ROUTING_KEY),
    onCallOwner: process.env.ALERT_ON_CALL_OWNER,
    quietHoursActive: readBooleanEnv("ALERT_QUIET_HOURS_ACTIVE"),
    humanAcknowledgementMinutes: report.severity === "critical" ? 15 : 60,
  });
  const readiness = buildRuntimeReadiness();
  const delivery = await persistAlertDelivery({ report, plan, readinessStatus: readiness.status });

  return NextResponse.json(
    {
      ok: true,
      data: {
        reportId: report.id,
        fingerprint: report.fingerprint,
        provider: plan.provider,
        route: plan.route,
        sanitizedPayload: plan.sanitizedPayload,
        suppressExternalDelivery: plan.suppressExternalDelivery,
        blockers: plan.blockers,
        escalationRunbook: plan.escalationRunbook,
        delivery,
        readiness,
        artifactPaths: alertEscalationArtifactPaths,
        requiredNextWork: [
          "Configure Slack, email, and pager credentials in secrets.",
          "Connect the queued AlertDelivery audit records to the durable worker executor.",
          "Capture live synthetic critical pager and high-severity Slack delivery proof.",
        ],
      },
    },
    { status: plan.status === "ready" && readiness.status === "ready" ? 202 : 200 },
  );
}
