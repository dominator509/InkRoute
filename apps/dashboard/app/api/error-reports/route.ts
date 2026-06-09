import {
  buildAlertRoute,
  buildObservabilityReportDraft,
  type ErrorSurface,
  type ObservabilityEventInput,
} from "@inkroute/observability";
import { errorReportFilterSchema, errorReportInputSchema, type ErrorReportInput } from "@inkroute/validators";
import { prisma } from "@inkroute/db";
import type { ErrorReportStatus, ErrorSeverity } from "@inkroute/types";
import { NextResponse, type NextRequest } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

type LocalErrorReport = {
  id: string;
  tenantId: string;
  severity: ErrorSeverity;
  status: ErrorReportStatus;
  source: ErrorSurface;
  message: string;
  redactionLevel: string;
  stackHash: string;
  release?: string;
  route?: string;
  createdAt: string;
  auditRoute: {
    shouldNotifyNow: boolean;
    channel: "none" | "dashboard" | "email" | "slack" | "pager";
  };
};

const localErrorReports = new Map<string, LocalErrorReport[]>();
const LOCAL_REPORT_LIMIT = 150;

type ErrorReportCreateData = Parameters<(typeof prisma)["errorReport"]["create"]>[0]["data"];
type ErrorReportMetadataInput = Exclude<ErrorReportCreateData["metadata"], undefined>;

function nextLocalErrorId(tenantId: string): string {
  const random = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(16).slice(2);
  return `err_${tenantId}_${Date.now()}_${random}`;
}

function parseErrorFilters(request: NextRequest, tenantId: string) {
  const params = new URL(request.url).searchParams;
  const parsed = errorReportFilterSchema.safeParse({
    tenantId: params.get("tenantId") ?? tenantId,
    status: params.get("status") ?? undefined,
    source: params.get("source") ?? undefined,
    limit: params.get("limit") ?? undefined,
  });
  return parsed;
}

function storeLocalErrorReport(input: Omit<LocalErrorReport, "id" | "createdAt" | "auditRoute"> & { auditRoute: LocalErrorReport["auditRoute"] }): LocalErrorReport {
  const tenantStore = localErrorReports.get(input.tenantId) ?? [];
  const report: LocalErrorReport = {
    ...input,
    id: nextLocalErrorId(input.tenantId),
    createdAt: new Date().toISOString(),
  };
  localErrorReports.set(input.tenantId, [report, ...tenantStore].slice(0, LOCAL_REPORT_LIMIT));
  return report;
}

function buildDashboardReportInput(parsed: { data: ErrorReportInput }, tenantId: string, request: NextRequest): ObservabilityEventInput {
  const inputData = parsed.data;
  const userAgent = typeof inputData.userAgent === "string" ? inputData.userAgent : request.headers.get("user-agent") ?? undefined;
  return {
    tenantId,
    source: typeof inputData.source === "string" ? inputData.source : "dashboard",
    runtime: typeof inputData.runtime === "string" ? inputData.runtime : "browser",
    environment: typeof inputData.environment === "string" ? inputData.environment : "production",
    message: inputData.message,
    ...(typeof inputData.stack === "string" ? { stack: inputData.stack } : {}),
    route: typeof inputData.route === "string" ? inputData.route : "/dashboard",
    release: typeof inputData.release === "string" ? inputData.release : "phase11-dashboard-demo",
    ...(typeof userAgent === "string" ? { userAgent } : {}),
    ...(typeof inputData.statusCode === "number" ? { statusCode: inputData.statusCode } : {}),
    handled: typeof inputData.handled === "boolean" ? inputData.handled : true,
    ...(typeof inputData.metadata === "object" && inputData.metadata !== null ? { metadata: inputData.metadata as Record<string, unknown> } : {}),
    ...(typeof inputData.tags === "object" && inputData.tags !== null ? { tags: inputData.tags as Record<string, string> } : {}),
  };
}

function redactMetadata(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, metadataValue]) => [
      key,
      /email|phone|token|secret|cookie|authorization|password|ip|useragent|body|stack|payload|client|card/i.test(key)
        ? "[redacted-dashboard-field]"
        : metadataValue,
    ]),
  );
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "error:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read error reports." } }, { status: 403 });
  }

  const parsed = parseErrorFilters(request, actor.tenantId);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Error-report query parameters are invalid.", issues: parsed.error.flatten() } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const filters = parsed.data;
  const tenantId = filters.tenantId ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query a different tenant's error reports." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  if (actor.source === "local-fallback") {
    const localData = localErrorReports.get(actor.tenantId) ?? [];
    const filtered = localData.filter((candidate) => (!filters.status || candidate.status === filters.status) && (!filters.source || candidate.source === filters.source)).slice(0, filters.limit);
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId: actor.tenantId,
        actorRole: actor.role,
        persistence: "local-fallback",
        count: filtered.length,
        status: "local-read-fallback",
        reports: filtered,
        gapIds: ["GAP-079", "GAP-081", "GAP-095"],
        boundary: "Local fallback mode active; errors are retained in-memory only.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const rows = await tx.errorReport.findMany({
        where: {
          tenantId,
          ...(filters.source ? { source: filters.source } : {}),
          ...(filters.status ? { status: filters.status } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: filters.limit ?? 50,
        select: {
          id: true,
          tenantId: true,
          severity: true,
          status: true,
          source: true,
          message: true,
          stackHash: true,
          release: true,
          route: true,
          createdAt: true,
          metadata: true,
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "error_report:read:list",
          entityType: "ErrorReport",
          metadata: {
            source: "dashboard-api",
            count: rows.length,
            filters: { status: filters.status ?? null, source: filters.source ?? null, limit: filters.limit ?? 50 },
            redactedFields: ["metadata", "userAgent", "stack", "payload", "client", "token", "secret"],
          },
        },
        select: { id: true },
      });

      return { rows, audit };
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        actorRole: actor.role,
        persistence: "database",
        count: result.rows.length,
        status: "authenticated-read",
        reports: result.rows.map((entry) => ({
          id: entry.id,
          tenantId: entry.tenantId,
          severity: entry.severity,
          status: entry.status,
          source: entry.source,
          message: entry.message,
          stackHash: entry.stackHash,
          release: entry.release ?? undefined,
          route: entry.route ?? undefined,
          metadata: redactMetadata(entry.metadata),
          createdAt: entry.createdAt.toISOString(),
        })),
        auditId: result.audit.id,
        gapIds: ["GAP-079", "GAP-081", "GAP-095", "GAP-101"],
        boundary: "Error report reads are tenant-scoped, RBAC-gated, no-store, audit-logged, and metadata-redacted in DB-backed mode.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      throw error;
    }

    const localData = localErrorReports.get(actor.tenantId) ?? [];
    const filtered = localData.filter((candidate) => (!filters.status || candidate.status === filters.status) && (!filters.source || candidate.source === filters.source)).slice(0, filters.limit);
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId: actor.tenantId,
        actorRole: actor.role,
        persistence: "local-fallback",
        count: filtered.length,
        status: "database-unavailable",
        reports: filtered,
        warning: "Database is currently unavailable; returning local fallback data.",
        gapIds: ["GAP-079", "GAP-081", "GAP-095", "GAP-101"],
        boundary: "DB outage fallback only; data persistence is temporary and request-scoped.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "error:write");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to create error reports." } }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Error report body must be valid JSON." } }, { status: 400 });
  }

  const parsed = errorReportInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Error report payload failed validation.", issues: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  const tenantId = parsed.data.tenantId ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot create an error report for a different tenant." } },
      { status: 403 },
    );
  }

  const dashboardInput = buildDashboardReportInput(parsed, tenantId, request);
  const report = buildObservabilityReportDraft(dashboardInput);
  const auditRoute = buildAlertRoute(report);

  const localPayload = {
    tenantId,
    severity: report.severity,
    status: report.status,
    source: report.source,
    message: report.redactedMessage,
    redactionLevel: report.redactionLevel,
    stackHash: report.stackHash,
    ...(report.release ? { release: report.release } : {}),
    ...(report.route ? { route: report.route } : {}),
    auditRoute,
  };

  if (actor.source === "local-fallback") {
    const persisted = storeLocalErrorReport({
      ...localPayload,
    });
    return NextResponse.json({
      ok: true,
      source: actor.source,
      tenantId,
      persistence: "local-fallback",
      report: {
        id: persisted.id,
        tenantId: persisted.tenantId,
        severity: persisted.severity,
        status: persisted.status,
        source: persisted.source,
        redactedMessage: persisted.message,
        stackHash: persisted.stackHash,
        redactionLevel: persisted.redactionLevel,
        route: persisted.route,
        release: persisted.release,
        createdAt: persisted.createdAt,
        alertRoute: persisted.auditRoute,
      },
      gapIds: ["GAP-079", "GAP-081", "GAP-095"],
      boundary: "Local fallback mode active; report persisted in-memory for runtime continuity only.",
    }, { status: 201 });
  }

  try {
    const persisted = await prisma.$transaction(async (tx) => {
      const created = await tx.errorReport.create({
        data: {
          tenantId,
          severity: report.severity,
          status: "open",
          source: report.source,
          message: report.redactedMessage,
          stackHash: report.stackHash,
          release: report.release ?? null,
          route: report.route ?? null,
          userAgent: report.userAgent ?? null,
          metadata: report.redactedMetadata as ErrorReportMetadataInput,
        },
      });
      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "error_report:create",
          entityType: "ErrorReport",
          entityId: created.id,
          metadata: {
            source: report.source,
            severity: report.severity,
            route: report.route ?? "unknown",
            stackHash: report.stackHash,
            redactionLevel: report.redactionLevel,
          },
        },
      });
      return { created, audit };
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        report: {
          id: persisted.created.id,
          tenantId: persisted.created.tenantId,
          severity: persisted.created.severity,
          status: persisted.created.status,
          source: persisted.created.source,
          redactedMessage: persisted.created.message,
          stackHash: persisted.created.stackHash,
          redactionLevel: report.redactionLevel,
          route: persisted.created.route ?? undefined,
          release: persisted.created.release ?? undefined,
          metadata: persisted.created.metadata as Record<string, unknown> | null ?? {},
          createdAt: persisted.created.createdAt.toISOString(),
          alertRoute: auditRoute,
          auditId: persisted.audit.id,
        },
        requiredNextWork: [
          "Forward dashboard-only route through Sentry/OpenTelemetry after provider DSNs, sampling policy, and provider allowlist are configured.",
          "Add provider webhook reconciliation so issue/alert state updates can close persisted reports.",
        ],
        gapIds: ["GAP-079", "GAP-081", "GAP-095", "GAP-101"],
        boundary: "Dashboard error ingest is now authenticated and persisted in tenant scope; alert routing remains dashboard-level only until provider credentials exist.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const persisted = storeLocalErrorReport({
        ...localPayload,
      });
      return NextResponse.json({
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "local-fallback",
        report: {
          id: persisted.id,
          tenantId: persisted.tenantId,
          severity: persisted.severity,
          status: persisted.status,
          source: persisted.source,
          redactedMessage: persisted.message,
          stackHash: persisted.stackHash,
          redactionLevel: persisted.redactionLevel,
          route: persisted.route,
          release: persisted.release,
          createdAt: persisted.createdAt,
          alertRoute: persisted.auditRoute,
        },
        warning: "Database was temporarily unavailable; report persisted in local fallback store.",
        gapIds: ["GAP-079", "GAP-081", "GAP-095", "GAP-101"],
      }, { status: 201 });
    }

    return NextResponse.json(
      {
        ok: false,
        error: { code: "ERROR_REPORT_PERSISTENCE_FAILED", message: "Error report could not be persisted after validation." },
      },
      { status: 500 },
    );
  }
}
