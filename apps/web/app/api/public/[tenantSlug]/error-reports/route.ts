import { buildPublicErrorReportPreview } from "../../../../../lib/errorReporting";
import {
  buildAbuseMonitoringDecision,
  buildProviderForwardingDecision,
  buildRequestCorrelation,
  enforceErrorReportBotProtection,
  errorReportIngestHardeningContract,
} from "../../../../../lib/errorReportIngestHardening";
import { errorReportInputSchema } from "@inkroute/validators";
import { prisma } from "@inkroute/db";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, getClientIpFromHeaders, persistErrorReport, resolveTenant } from "../../../../../lib/localRuntimeState";

type TenantResolution = { tenantId: string; source: "database" | "local-fallback" };
const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (!process.env.DATABASE_URL) {
    return true;
  }

  if (!(error instanceof Error)) return false;
  const code = (error as { code?: string }).code;
  if (typeof code === "string" && ["P1000", "P1001", "P1002", "P1003", "P1008"].includes(code)) return true;

  const message = error.message.toLowerCase();
  return message.includes("connect") && message.includes("database");
}

async function resolveTenantScope(tenantSlug: string): Promise<TenantResolution | null> {
  const normalizedSlug = decodeURIComponent(tenantSlug).toLowerCase().trim();
  try {
    const prismaRuntime = prisma as unknown as {
      tenant: {
        findUnique: (options: { where: { slug: string }; select: { id: true } }) => Promise<{ id: string } | null>;
      };
    };
    const tenant = await prismaRuntime.tenant.findUnique({
      where: { slug: normalizedSlug },
      select: { id: true },
    });
    if (tenant?.id) return { tenantId: tenant.id, source: "database" };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      throw error;
    }
  }

  const local = resolveTenant(normalizedSlug);
  if (!local) return null;
  return { tenantId: local.tenantId, source: "local-fallback" };
}

function buildSafeErrorReportDatabaseReceipt(persisted: {
  persistedReport: { severity: string; status: string; source: string; message: string; stackHash: string; release: string | null; route: string | null; createdAt: Date };
}) {
  return {
    report: {
      severity: persisted.persistedReport.severity,
      status: persisted.persistedReport.status,
      source: persisted.persistedReport.source,
      redactedMessage: persisted.persistedReport.message,
      stackHashStored: Boolean(persisted.persistedReport.stackHash),
      stackHashEchoed: false,
      release: persisted.persistedReport.release,
      route: persisted.persistedReport.route,
      createdAt: persisted.persistedReport.createdAt.toISOString(),
    },
    persistenceReceipt: {
      errorReportPersisted: true,
      abuseEventPersisted: true,
      auditPersisted: true,
    },
    responseProjection: {
      errorReportIdEchoed: false,
      auditIdEchoed: false,
      abuseEventIdEchoed: false,
      tenantIdEchoed: false,
      rawPayloadEchoed: false,
      rawMessageEchoed: false,
      rawMetadataEchoed: false,
      rawStackEchoed: false,
      stackHashEchoed: false,
      internalPersistenceIdsEchoed: false,
      redactedPreviewOnly: true,
    },
  };
}

function buildSafePublicErrorReportPreview(preview: ReturnType<typeof buildPublicErrorReportPreview>) {
  return {
    report: {
      severity: preview.report.severity,
      status: preview.report.status,
      source: preview.report.source,
      redactedMessage: preview.report.redactedMessage,
      redactionLevel: preview.report.redactionLevel,
      route: preview.report.route,
      release: preview.report.release,
      stackHashStored: Boolean(preview.report.stackHash),
      stackHashEchoed: false,
      responseProjection: {
        rawMessageEchoed: false,
        rawMetadataEchoed: false,
        rawStackEchoed: false,
        stackHashEchoed: false,
      },
    },
    alertRoute: preview.alertRoute,
  };
}

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  const correlation = buildRequestCorrelation(request.headers);
  const botProtection = enforceErrorReportBotProtection(request.headers);
  if (!botProtection.allowed) {
    return NextResponse.json(
      { ok: false, error: { code: "BOT_PROTECTION_FAILED", message: botProtection.reason }, requestId: correlation.requestId, traceparent: correlation.traceparent },
      { status: 403, headers: { ...noStoreHeaders, "x-request-id": correlation.requestId, "traceparent": correlation.traceparent } },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Error report body must be valid JSON." } }, { status: 400, headers: noStoreHeaders });
  }

  const parsed = errorReportInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Error report payload is not valid.", issues: parsed.error.flatten() } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const resolvedTenant = await resolveTenantScope(tenantSlug);
  if (!resolvedTenant) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_NOT_FOUND", message: "Error reports are available for known tenant slugs only." } },
      { status: 404, headers: noStoreHeaders },
    );
  }

  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = checkRateLimit("fallback-error-report", tenantSlug, `${clientIp}:${resolvedTenant.tenantId}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            gapIds: ["GAP-081", "GAP-095", "GAP-101"],
            remaining: rateLimit.remaining,
            retryAfterSeconds: rateLimit.retryAfterSeconds,
          },
        },
      },
      { status: 429, headers: { ...noStoreHeaders, "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const reportInput = {
    tenantId: resolvedTenant.tenantId,
    source: parsed.data.source,
    runtime: parsed.data.runtime,
    environment: parsed.data.environment,
    message: parsed.data.message,
    route: typeof parsed.data.route === "string" ? parsed.data.route : `/api/public/${tenantSlug}/error-reports`,
    release: typeof parsed.data.release === "string" ? parsed.data.release : "phase11-demo",
    ...(parsed.data.stack ? { stack: parsed.data.stack } : {}),
    ...(parsed.data.userAgent ? { userAgent: parsed.data.userAgent } : request.headers.get("user-agent") ? { userAgent: request.headers.get("user-agent") as string } : {}),
    ...(parsed.data.statusCode ? { statusCode: parsed.data.statusCode } : {}),
    handled: parsed.data.handled ?? true,
    ...(parsed.data.metadata ? { metadata: parsed.data.metadata } : {}),
    ...(parsed.data.tags ? { tags: parsed.data.tags } : {}),
  };

  const preview = buildPublicErrorReportPreview(reportInput);
  const providerForwarding = buildProviderForwardingDecision({ report: preview.report, requestId: correlation.requestId });
  const localPayload = {
    message: parsed.data.message,
    route: reportInput.route,
    release: reportInput.release,
    metadata: parsed.data.metadata ?? {},
    ...(parsed.data.stack ? { stack: parsed.data.stack } : {}),
    ...(parsed.data.userAgent ? { userAgent: parsed.data.userAgent } : request.headers.get("user-agent") ? { userAgent: request.headers.get("user-agent") as string } : {}),
  };

  if (resolvedTenant.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PROVIDER_OBSERVABILITY_PERSISTENCE_NOT_CONFIGURED",
            message: "Production error-report ingest requires database-backed tenant resolution and persistence; local runtime fallback is disabled.",
            gapIds: ["GAP-006", "GAP-011", "GAP-081", "GAP-095", "GAP-101"],
          },
          productionBoundary: { localObservabilityRuntimeFallbackDisabled: true },
        },
        { status: 503, headers: { ...noStoreHeaders, "x-request-id": correlation.requestId, "traceparent": correlation.traceparent } },
      );
    }

    const persisted = persistErrorReport(tenantSlug, localPayload);
    const abuseMonitoring = buildAbuseMonitoringDecision({
      tenantId: resolvedTenant.tenantId,
      requestId: correlation.requestId,
      rateLimitRemaining: rateLimit.remaining,
      botStatus: botProtection.status,
    });
    return NextResponse.json(
      {
        ok: true,
        data: {
          tenantScope: { routeTenantSlugReceived: true, tenantSlugEchoed: false },
          persistence: "local-runtime",
          persisted: {
            createdAt: persisted.createdAt,
            redactedRecord: persisted.redactedRecord,
          },
          preview: buildSafePublicErrorReportPreview(preview),
          requiredNextWork: [
            "Resolve tenant by domain/slug and enforce abuse controls before accepting public reports.",
            "Persist redacted ErrorReport rows only after database, rate limiting, and bot protection are wired.",
            "Forward sanitized events to Sentry/OpenTelemetry only after DSNs, source maps, sampling, and redaction are verified.",
            "Create issue/alert automation only after repository and alerting credentials are configured.",
          ],
          localBoundary: {
            tenantIdEchoed: false,
            rateLimitRule: "fallback-error-report",
            requestId: correlation.requestId,
            traceparent: correlation.traceparent,
            botProtection,
            abuseMonitoring,
            providerForwarding,
            hardening: errorReportIngestHardeningContract,
          },
          responseProjection: {
            errorReportIdEchoed: false,
            tenantIdEchoed: false,
            rawPayloadEchoed: false,
            rawMessageEchoed: false,
            rawMetadataEchoed: false,
            rawStackEchoed: false,
            internalPersistenceIdsEchoed: false,
            redactedPreviewOnly: true,
          },
        },
      },
      { status: 201, headers: { ...noStoreHeaders, "x-request-id": correlation.requestId, "traceparent": correlation.traceparent } },
    );
  }

  try {
    const report = preview.report;
    const abuseMonitoring = buildAbuseMonitoringDecision({
      tenantId: resolvedTenant.tenantId,
      requestId: correlation.requestId,
      rateLimitRemaining: rateLimit.remaining,
      botStatus: botProtection.status,
    });

    const persisted = await prisma.$transaction(async (tx) => {
      const persistedReport = await tx.errorReport.create({
        data: {
          tenantId: resolvedTenant.tenantId,
          severity: report.severity,
          status: "open",
          source: report.source,
          message: report.redactedMessage,
          stackHash: report.stackHash,
          release: report.release ?? null,
          route: report.route ?? null,
          userAgent: report.userAgent ?? null,
          metadata: toJsonValue(report.redactedMetadata),
        },
      });
      const abuseEvent = await tx.abuseEvent.create({
        data: {
          tenantId: resolvedTenant.tenantId,
          routeFamily: "observability",
          routePattern: "/api/public/[tenantSlug]/error-reports",
          abuseKeyHash: `error-report:${resolvedTenant.tenantId}:${correlation.requestId}`,
          ipHash: clientIp ? `ip-length:${clientIp.length}` : null,
          userAgentHash: report.userAgent ? `ua-length:${report.userAgent.length}` : null,
          action: "observability:error_report.ingest",
          reason: abuseMonitoring.status,
          limiterProvider: "local-runtime-fallback",
          limiterDecision: rateLimit.allowed ? "allowed" : "blocked",
          observedRequests: null,
          windowSeconds: null,
          botChallengeRequired: botProtection.status !== "verified",
          providerSignatureValid: providerForwarding.credentialsConfigured,
          failClosed: false,
          redactedMetadata: toJsonValue({
            requestId: correlation.requestId,
            traceparent: correlation.traceparent,
            botProtectionStatus: botProtection.status,
            rateLimitRemaining: rateLimit.remaining,
            rateLimitRule: "fallback-error-report",
            providerForwardingStatus: providerForwarding.status,
            rawPayloadStored: false,
          }),
        },
        select: { id: true },
      });
      const audit = await tx.auditLog.create({
        data: {
          tenantId: resolvedTenant.tenantId,
          action: "observability:error_report.persist",
          entityType: "ErrorReport",
          entityId: persistedReport.id,
          metadata: toJsonValue({
            requestId: correlation.requestId,
            traceparent: correlation.traceparent,
            botProtectionStatus: botProtection.status,
            abuseEventId: abuseEvent.id,
            providerForwarding,
            source: report.source,
            severity: report.severity,
            route: report.route ?? "unknown",
            release: report.release ?? "unknown",
            gapIds: ["GAP-011", "GAP-081", "GAP-095", "GAP-101"],
          }),
        },
      });
      return { persistedReport, audit, abuseEvent };
    });

    return NextResponse.json(
      {
        ok: true,
          data: {
            tenantScope: { routeTenantSlugReceived: true, tenantSlugEchoed: false },
            persistence: "database",
            ...buildSafeErrorReportDatabaseReceipt(persisted),
            reportContext: {
            redactionLevel: preview.report.redactionLevel,
            alertRoute: preview.alertRoute,
            requestId: correlation.requestId,
            traceparent: correlation.traceparent,
            botProtection,
            abuseMonitoring,
            providerForwarding,
            hardening: errorReportIngestHardeningContract,
          },
          requiredNextWork: [
            "Forward sanitized events to Sentry only after provider DSNs, source maps, sampling, and sampling-restart policy are configured.",
            "Expose tenant-scoped query/read APIs with RBAC before dashboard triage workflows consume these records.",
            "Keep report payloads free of medical notes, consent signatures, token fragments, and payment details.",
          ],
        },
      },
      { status: 201, headers: { ...noStoreHeaders, "x-request-id": correlation.requestId, "traceparent": correlation.traceparent } },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "PROVIDER_OBSERVABILITY_PERSISTENCE_NOT_CONFIGURED",
              message: "Production error-report ingest requires database-backed persistence; local runtime fallback is disabled.",
              gapIds: ["GAP-006", "GAP-011", "GAP-081", "GAP-095", "GAP-101"],
            },
          },
          { status: 503, headers: { ...noStoreHeaders, "x-request-id": correlation.requestId, "traceparent": correlation.traceparent } },
        );
      }

      const persisted = persistErrorReport(tenantSlug, localPayload);
      return NextResponse.json(
        {
          ok: true,
          data: {
            tenantScope: { routeTenantSlugReceived: true, tenantSlugEchoed: false },
            persistence: "local-runtime",
            persisted: {
              createdAt: persisted.createdAt,
              redactedRecord: persisted.redactedRecord,
            },
            preview: buildSafePublicErrorReportPreview(preview),
            warning: "Database was temporarily unavailable; request persisted to local runtime.",
            localBoundary: {
              tenantIdEchoed: false,
              rateLimitRule: "fallback-error-report",
            },
            responseProjection: {
              errorReportIdEchoed: false,
              tenantIdEchoed: false,
              rawPayloadEchoed: false,
              rawMessageEchoed: false,
              rawMetadataEchoed: false,
              rawStackEchoed: false,
              stackHashEchoed: false,
              internalPersistenceIdsEchoed: false,
              redactedPreviewOnly: true,
            },
          },
        },
        { status: 201, headers: { ...noStoreHeaders, "x-request-id": correlation.requestId, "traceparent": correlation.traceparent } },
      );
    }

    return NextResponse.json(
      { ok: false, error: { code: "ERROR_REPORT_PERSISTENCE_FAILED", message: "Error report could not be persisted after validation." } },
      { status: 500, headers: noStoreHeaders },
    );
  }
}

