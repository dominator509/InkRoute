import { buildObservabilityReportDraft, buildAlertRoute } from "@inkroute/observability";
import { NextResponse, type NextRequest } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "DASHBOARD_ERROR_REPORTS_NOT_IMPLEMENTED",
        message: "Phase 11 dashboard error reports are static only. Production requires auth, tenant scope, RBAC, Prisma reads, and pagination.",
      },
      data: {
        requiredPermission: "error:read",
        requiredNextWork: ["Authenticate dashboard user", "Resolve tenant membership", "Query tenant-scoped ErrorReport rows", "Hide redacted metadata from unauthorized roles"],
      },
    },
    { status: 501 },
  );
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Error report body must be JSON." } }, { status: 400 });
  }

  const candidate = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  if (typeof candidate.message !== "string") {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_FAILED", message: "Dashboard error report requires a message string." } }, { status: 400 });
  }

  const report = buildObservabilityReportDraft({
    source: "dashboard",
    runtime: "browser",
    environment: "development",
    message: candidate.message,
    route: typeof candidate.route === "string" ? candidate.route : "/dashboard",
    release: typeof candidate.release === "string" ? candidate.release : "phase11-dashboard-demo",
    metadata: typeof candidate.metadata === "object" && candidate.metadata !== null ? (candidate.metadata as Record<string, unknown>) : {},
    tags: { phase: "11", surface: "dashboard" },
  });

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "DASHBOARD_ERROR_REPORT_PERSISTENCE_NOT_IMPLEMENTED",
        message: "A sanitized dashboard report draft was generated, but persistence and authenticated ingest are not wired.",
      },
      data: { report, alertRoute: buildAlertRoute(report) },
    },
    { status: 501 },
  );
}
