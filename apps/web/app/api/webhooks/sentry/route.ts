import { buildObservabilityReportDraft, buildAgenticBugFixWorkflow, buildGithubIssueDraft } from "@inkroute/observability";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("sentry-hook-signature") ?? request.headers.get("x-sentry-signature");

  if (!signature) {
    return NextResponse.json(
      { ok: false, error: { code: "MISSING_SENTRY_SIGNATURE", message: "Sentry webhook requests must include a provider signature header before production use." } },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_WEBHOOK_JSON", message: "Webhook body must be valid JSON." } }, { status: 400 });
  }

  const event = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const data = typeof event.data === "object" && event.data !== null ? (event.data as Record<string, unknown>) : event;
  const issueTitle = typeof data.title === "string" ? data.title : typeof event.title === "string" ? event.title : "Sentry webhook event preview";
  const culprit = typeof data.culprit === "string" ? data.culprit : undefined;

  const report = buildObservabilityReportDraft({
    source: "webhook",
    runtime: "provider-webhook",
    environment: "development",
    message: issueTitle,
    route: culprit,
    release: typeof data.release === "string" ? data.release : "sentry-webhook-preview",
    metadata: { provider: "sentry", eventType: typeof event.action === "string" ? event.action : "unknown", rawPayloadShape: Object.keys(event).slice(0, 12) },
    tags: { phase: "11", provider: "sentry" },
  });

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "SENTRY_WEBHOOK_NOT_IMPLEMENTED",
        message: "Sentry webhook shape was inspected, but signature verification, issue sync, persistence, and GitHub automation are not wired.",
      },
      data: {
        receivedSignatureHeader: "present",
        report,
        workflow: buildAgenticBugFixWorkflow(report),
        issueDraft: buildGithubIssueDraft(report),
        requiredNextWork: [
          "Verify provider webhook signatures with the configured secret.",
          "Persist webhook deliveries idempotently and connect them to ErrorReport rows.",
          "Create sanitized GitHub issues only after human-approved repo integration is configured.",
        ],
      },
    },
    { status: 501 },
  );
}
