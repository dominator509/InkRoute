import { buildPublicErrorReportPreview } from "../../../../../lib/errorReporting";
import { NextResponse, type NextRequest } from "next/server";

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

  const preview = buildPublicErrorReportPreview(reportInput);

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "ERROR_REPORT_PERSISTENCE_NOT_IMPLEMENTED",
        message: "The fallback error-report route builds a redacted draft, but Phase 11 does not persist reports, rate-limit traffic, or send alerts.",
      },
      data: {
        tenantSlug,
        ...preview,
        requiredNextWork: [
          "Resolve tenant by domain/slug and enforce abuse controls before accepting public reports.",
          "Persist redacted ErrorReport rows only after database, rate limiting, and bot protection are wired.",
          "Forward sanitized events to Sentry/OpenTelemetry only after DSNs, source maps, sampling, and redaction are verified.",
          "Create issue/alert automation only after repository and alerting credentials are configured.",
        ],
      },
    },
    { status: 501 },
  );
}
