import { buildPublicErrorReportPreview } from "../../../../../lib/errorReporting";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, getClientIp, persistErrorReport, resolveTenant } from "../../../../../lib/localRuntimeState";

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Error report body must be valid JSON." } }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("message" in body)) {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_FAILED", message: "Error report preview requires a message field." } }, { status: 400 });
  }

  const candidate = body as { message?: unknown; route?: unknown; stack?: unknown; release?: unknown; metadata?: unknown; userAgent?: unknown };
  if (typeof candidate.message !== "string") {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_FAILED", message: "Error report message must be a string." } }, { status: 400 });
  }

  const reportInput = {
    message: candidate.message,
    release: typeof candidate.release === "string" ? candidate.release : "phase11-demo",
    metadata: typeof candidate.metadata === "object" && candidate.metadata !== null ? (candidate.metadata as Record<string, unknown>) : {},
    ...(typeof candidate.route === "string" ? { route: candidate.route } : {}),
    ...(typeof candidate.stack === "string" ? { stack: candidate.stack } : {}),
    ...(typeof candidate.userAgent === "string" ? { userAgent: candidate.userAgent } : request.headers.get("user-agent") ? { userAgent: request.headers.get("user-agent") as string } : {}),
  };

  const resolvedTenant = resolveTenant(tenantSlug);
  if (!resolvedTenant) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_NOT_FOUND", message: "Error reports are available for local demo tenant slug only." } },
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

  const preview = buildPublicErrorReportPreview(reportInput);
  const persisted = persistErrorReport(tenantSlug, reportInput);

  return NextResponse.json(
    {
      ok: true,
      data: {
        tenantSlug,
        ...preview,
        requiredNextWork: [
          "Resolve tenant by domain/slug and enforce abuse controls before accepting public reports.",
          "Persist redacted ErrorReport rows only after database, rate limiting, and bot protection are wired.",
          "Forward sanitized events to Sentry/OpenTelemetry only after DSNs, source maps, sampling, and redaction are verified.",
          "Create issue/alert automation only after repository and alerting credentials are configured.",
        ],
        persisted,
        localBoundary: {
          tenantId: resolvedTenant.tenantId,
          rateLimitRule: "fallback-error-report",
        },
      },
    },
    { status: 201 },
  );
}
