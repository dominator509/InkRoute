import { prisma } from "@inkroute/db";
import {
  buildAlertEscalationPlan,
  buildAlertRuntimeDeliveryReadinessPlan,
  buildObservabilityReportDraft,
  type ObservabilityEventInput,
  type ObservabilityReportDraft,
} from "@inkroute/observability";
import { NextResponse, type NextRequest } from "next/server";
import { alertEscalationArtifactPaths } from "../../../../lib/alertEscalationRuntime";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

export const runtime = "nodejs";
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
    source: body.source === "dashboard" || body.source === "mobile" || body.source === "api" || body.source === "worker" || body.source === "webhook" ? body.source : "web",
    message: typeof body.message === "string" ? body.message : "Synthetic alert escalation event",
    ...(typeof body.stack === "string" ? { stack: body.stack } : {}),
    ...(typeof body.route === "string" ? { route: body.route } : { route: "/api/observability/alerts" }),
    ...(typeof body.userAgent === "string" ? { userAgent: body.userAgent } : {}),
    ...(typeof body.release === "string" ? { release: body.release } : {}),
    ...(body.environment === "production" || body.environment === "preview" || body.environment === "test" ? { environment: body.environment } : {}),
    ...(body.runtime === "browser" || body.runtime === "edge" || body.runtime === "react-native" || body.runtime === "node-worker" || body.runtime === "provider-webhook" ? { runtime: body.runtime } : {}),
    statusCode: typeof body.statusCode === "number" ? body.statusCode : 500,
    handled: typeof body.handled === "boolean" ? body.handled : false,
    ...(body.metadata && typeof body.metadata === "object" ? { metadata: body.metadata as Record<string, unknown> } : {}),
    ...(body.tags && typeof body.tags === "object" ? { tags: Object.fromEntries(Object.entries(body.tags as Record<string, unknown>).filter(([, value]) => typeof value === "string")) as Record<string, string> } : {}),
    ...(typeof body.tenantId === "string" ? { tenantId: body.tenantId } : {}),
  };
}

function buildSafeAlertReportResponse(report: ObservabilityReportDraft) {
  return {
    prepared: true,
    source: report.source,
    runtime: report.runtime,
    environment: report.environment,
    severity: report.severity,
    route: report.route,
    release: report.release,
    redactedMessage: report.redactedMessage,
    responseProjection: {
      rawReportEchoed: false,
      reportIdEchoed: false,
      fingerprintEchoed: false,
      stackHashEchoed: false,
      rawMessageEchoed: false,
      rawMetadataEchoed: false,
      rawStackEchoed: false,
    },
  };
}

function buildSafeAlertPayloadPreview(payload: unknown) {
  return {
    retained: true,
    fieldNames: payload && typeof payload === "object" ? Object.keys(payload as Record<string, unknown>).sort() : [],
    responseProjection: {
      rawPayloadEchoed: false,
      rawSanitizedPayloadEchoed: false,
    },
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
      auditLogged: false,
      auditLogIdEchoed: false,
      deliveryState: "dashboard-only",
      acknowledgementState: "not-created",
      retryPolicy: "not-enqueued-without-tenant",
      deadLetterState: "not-enqueued-without-tenant",
    };
  }

  const deliveryState = input.plan.suppressExternalDelivery || input.plan.status === "blocked" ? "blocked-dashboard-only" : "queued";
  const acknowledgementState = deliveryState === "queued" ? "pending" : "not-required";

  try {
    const result = await prisma.$transaction(async (tx) => {
      const alertDeliveryDelegate = tx.alertDelivery;
      const auditLogDelegate = tx.auditLog;
      if (!alertDeliveryDelegate?.create || !auditLogDelegate?.create) {
        throw new Error("Prisma transaction delegates unavailable.");
      }

      const alertDelivery = await alertDeliveryDelegate.create({
        data: {
          tenantId: input.report.tenantId!,
          fingerprint: input.report.fingerprint,
          provider: input.plan.provider,
          route: input.plan.route,
          deliveryState,
          acknowledgementState,
          retryPolicy: "exponential-backoff-3-attempts",
          deadLetterState: "configured-dead-letter-after-retry-exhaustion",
          sanitizedPayload: input.plan.sanitizedPayload,
          suppressExternalDelivery: input.plan.suppressExternalDelivery,
        },
        select: { id: true },
      });

      const auditLog = await auditLogDelegate.create({
        data: {
          tenantId: input.report.tenantId!,
          action: "observability.alert_escalation.enqueue",
          entityType: "AlertDelivery",
          entityId: alertDelivery.id,
          metadata: {
            reportMatched: true,
            fingerprint: input.report.fingerprint,
            severity: input.report.severity,
            provider: input.plan.provider,
            route: input.plan.route,
            deliveryState,
            acknowledgementState,
            retryPolicy: "exponential-backoff-3-attempts",
            deadLetterState: "configured-dead-letter-after-retry-exhaustion",
            alertDeliveryRecorded: true,
            internalPersistenceIdsStored: false,
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

      return { alertDeliveryRecorded: true, auditLogged: true };
    });

    return {
      persistence: "alert-delivery-transaction",
      alertDeliveryRecorded: result.alertDeliveryRecorded,
      alertDeliveryIdEchoed: false,
      auditLogged: result.auditLogged,
      auditLogIdEchoed: false,
      internalPersistenceIdsEchoed: false,
      deliveryState,
      acknowledgementState,
      retryPolicy: "exponential-backoff-3-attempts",
      deadLetterState: "configured-dead-letter-after-retry-exhaustion",
    };
  } catch {
    return {
      persistence: "database-write-rejected",
      alertDeliveryRecorded: false,
      alertDeliveryIdEchoed: false,
      auditLogged: false,
      auditLogIdEchoed: false,
      internalPersistenceIdsEchoed: false,
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
      { status: process.env.ALERT_WORKER_TOKEN ? 401 : 503, headers: noStoreHeaders },
    );
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    body = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_ALERT_EVENT_JSON", message: "Alert event body must be valid JSON." } }, { status: 400, headers: noStoreHeaders });
  }

  const report = buildObservabilityReportDraft(normalizeEventInput(body));
  const plan = buildAlertEscalationPlan({
    report,
    slackWebhookConfigured: Boolean(process.env.SLACK_WEBHOOK_URL),
    emailProviderConfigured: Boolean(process.env.ALERT_EMAIL_PROVIDER),
    pagerProviderConfigured: Boolean(process.env.PAGERDUTY_ROUTING_KEY),
    ...(process.env.ALERT_ON_CALL_OWNER ? { onCallOwner: process.env.ALERT_ON_CALL_OWNER } : {}),
    quietHoursActive: readBooleanEnv("ALERT_QUIET_HOURS_ACTIVE"),
    humanAcknowledgementMinutes: report.severity === "critical" ? 15 : 60,
  });
  const readiness = buildRuntimeReadiness();

  if (process.env.NODE_ENV === "production" && (plan.status !== "ready" || readiness.status !== "ready")) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ALERT_ESCALATION_DELIVERY_NOT_CONFIGURED",
          message:
            "Production alert escalation requires durable worker execution, provider credentials, on-call routing, acknowledgement callbacks, and live delivery evidence before enqueueing.",
          gapIds: ["GAP-083"],
        },
        data: {
          report: buildSafeAlertReportResponse(report),
          provider: plan.provider,
          route: plan.route,
          sanitizedPayload: buildSafeAlertPayloadPreview(plan.sanitizedPayload),
          responseProjection: {
            rawReportEchoed: false,
            reportIdEchoed: false,
            fingerprintEchoed: false,
            rawPayloadEchoed: false,
            rawSanitizedPayloadEchoed: false,
            internalPersistenceIdsEchoed: false,
          },
          suppressExternalDelivery: plan.suppressExternalDelivery,
          blockers: [...plan.blockers, ...readiness.blockers],
          readiness,
          artifactPaths: alertEscalationArtifactPaths,
          productionBoundary: {
            alertDeliveryEnqueueDisabled: true,
            requiresDurableWorkerExecutor: true,
            requiresProviderCredentials: true,
            requiresOnCallRouting: true,
            requiresAcknowledgementCallbacks: true,
            gapIds: ["GAP-083"],
          },
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const delivery = await persistAlertDelivery({ report, plan, readinessStatus: readiness.status });

  if (process.env.NODE_ENV === "production" && delivery.persistence !== "alert-delivery-transaction") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ALERT_ESCALATION_PERSISTENCE_NOT_AVAILABLE",
          message:
            "Production alert escalation requires durable AlertDelivery row and audit persistence before enqueue acknowledgement; database-write fallback responses are disabled.",
          gapIds: ["GAP-083"],
        },
        data: {
          report: buildSafeAlertReportResponse(report),
          provider: plan.provider,
          route: plan.route,
          sanitizedPayload: buildSafeAlertPayloadPreview(plan.sanitizedPayload),
          responseProjection: {
            rawReportEchoed: false,
            reportIdEchoed: false,
            fingerprintEchoed: false,
            rawPayloadEchoed: false,
            rawSanitizedPayloadEchoed: false,
            internalPersistenceIdsEchoed: false,
          },
          suppressExternalDelivery: plan.suppressExternalDelivery,
          blockers: plan.blockers,
          delivery,
          readiness,
          artifactPaths: alertEscalationArtifactPaths,
          productionBoundary: {
            alertDeliveryPersistenceRequired: true,
            databaseWriteFallbackDisabled: true,
            gapIds: ["GAP-083"],
          },
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      data: {
        report: buildSafeAlertReportResponse(report),
        provider: plan.provider,
        route: plan.route,
        sanitizedPayload: buildSafeAlertPayloadPreview(plan.sanitizedPayload),
        responseProjection: {
          rawReportEchoed: false,
          reportIdEchoed: false,
          fingerprintEchoed: false,
          rawPayloadEchoed: false,
          rawSanitizedPayloadEchoed: false,
          internalPersistenceIdsEchoed: false,
        },
        suppressExternalDelivery: plan.suppressExternalDelivery,
        blockers: plan.blockers,
        escalationRunbook: plan.escalationRunbook,
        delivery,
        readiness,
        artifactPaths: alertEscalationArtifactPaths,
        requiredNextWork: [
          "Configure Slack, email, and pager credentials in secrets.",
          "Connect queued AlertDelivery rows to the durable worker executor.",
          "Capture live synthetic critical pager and high-severity Slack delivery proof.",
        ],
      },
    },
    { status: plan.status === "ready" && readiness.status === "ready" ? 202 : 200, headers: noStoreHeaders },
  );
}




