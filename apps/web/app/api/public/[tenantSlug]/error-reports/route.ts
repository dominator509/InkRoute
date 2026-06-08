import { buildPublicErrorReportPreview } from "../../../../../lib/errorReporting";
import { errorReportInputSchema } from "@inkroute/validators";
import { prisma } from "@inkroute/db";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, getClientIp, persistErrorReport, resolveTenant } from "../../../../../lib/localRuntimeState";

type TenantResolution = { tenantId: string; source: "database" | "local-fallback" };

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
    const tenant = await prisma.tenant.findUnique({
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

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Error report body must be valid JSON." } }, { status: 400 });
  }

  const parsed = errorReportInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Error report payload is not valid.", issues: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  const resolvedTenant = await resolveTenantScope(tenantSlug);
  if (!resolvedTenant) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_NOT_FOUND", message: "Error reports are available for known tenant slugs only." } },
      { status: 404 },
    );
  }

  const clientIp = getClientIp(Object.fromEntries(request.headers.entries()));
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
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
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
  const localPayload = {
    message: parsed.data.message,
    route: reportInput.route,
    release: reportInput.release,
    metadata: parsed.data.metadata ?? {},
    ...(parsed.data.stack ? { stack: parsed.data.stack } : {}),
    ...(parsed.data.userAgent ? { userAgent: parsed.data.userAgent } : request.headers.get("user-agent") ? { userAgent: request.headers.get("user-agent") as string } : {}),
  };

  if (resolvedTenant.source === "local-fallback") {
    const persisted = persistErrorReport(tenantSlug, localPayload);
    return NextResponse.json(
      {
        ok: true,
        data: {
          tenantSlug,
          tenantId: resolvedTenant.tenantId,
          persistence: "local-runtime",
          persisted,
          preview,
          requiredNextWork: [
            "Resolve tenant by domain/slug and enforce abuse controls before accepting public reports.",
            "Persist redacted ErrorReport rows only after database, rate limiting, and bot protection are wired.",
            "Forward sanitized events to Sentry/OpenTelemetry only after DSNs, source maps, sampling, and redaction are verified.",
            "Create issue/alert automation only after repository and alerting credentials are configured.",
          ],
          localBoundary: {
            tenantId: resolvedTenant.tenantId,
            rateLimitRule: "fallback-error-report",
          },
        },
      },
      { status: 201 },
    );
  }

  try {
    const report = preview.report;
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
      const audit = await tx.auditLog.create({
        data: {
          tenantId: resolvedTenant.tenantId,
          action: "observability:error_report.persist",
          entityType: "ErrorReport",
          entityId: persistedReport.id,
          metadata: toJsonValue({
            source: report.source,
            severity: report.severity,
            route: report.route ?? "unknown",
            release: report.release ?? "unknown",
            gapIds: ["GAP-011", "GAP-081", "GAP-095", "GAP-101"],
          }),
        },
      });
      return { persistedReport, audit };
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          tenantSlug,
          tenantId: resolvedTenant.tenantId,
          persistence: "database",
          report: {
            id: persisted.persistedReport.id,
            tenantId: persisted.persistedReport.tenantId,
            severity: persisted.persistedReport.severity,
            status: persisted.persistedReport.status,
            source: persisted.persistedReport.source,
            redactedMessage: persisted.persistedReport.message,
            stackHash: persisted.persistedReport.stackHash,
            release: persisted.persistedReport.release,
            route: persisted.persistedReport.route,
            createdAt: persisted.persistedReport.createdAt.toISOString(),
            redactionLevel: preview.report.redactionLevel,
            alertRoute: preview.alertRoute,
            auditId: persisted.audit.id,
          },
          requiredNextWork: [
            "Forward sanitized events to Sentry only after provider DSNs, source maps, sampling, and sampling-restart policy are configured.",
            "Expose tenant-scoped query/read APIs with RBAC before dashboard triage workflows consume these records.",
            "Keep report payloads free of medical notes, consent signatures, token fragments, and payment details.",
          ],
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const persisted = persistErrorReport(tenantSlug, localPayload);
      return NextResponse.json(
        {
          ok: true,
          data: {
            tenantSlug,
            tenantId: resolvedTenant.tenantId,
            persistence: "local-runtime",
            persisted,
            preview,
            warning: "Database was temporarily unavailable; request persisted to local runtime.",
            localBoundary: {
              tenantId: resolvedTenant.tenantId,
              rateLimitRule: "fallback-error-report",
            },
          },
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      { ok: false, error: { code: "ERROR_REPORT_PERSISTENCE_FAILED", message: "Error report could not be persisted after validation." } },
      { status: 500 },
    );
  }
}
