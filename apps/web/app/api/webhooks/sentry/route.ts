import { buildObservabilityReportDraft, buildAgenticBugFixWorkflow, buildGithubIssueDraft } from "@inkroute/observability";
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

function verifySentrySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const normalizedSignature = signature.replace(/^sha256=/i, "");
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(normalizedSignature, "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

function buildProviderDeliveryId(event: Record<string, unknown>, data: Record<string, unknown>): string {
  const providerId = data.id ?? data.issueId ?? event.id ?? event.installationId ?? event.action ?? "unknown";
  const action = typeof event.action === "string" ? event.action : "unknown";
  return `sentry:${action}:${String(providerId)}`;
}

function mapSentryActionToErrorStatus(action: string): "open" | "triaged" | "resolved" | "ignored" {
  if (["resolved", "closed"].includes(action)) return "resolved";
  if (["ignored", "archived"].includes(action)) return "ignored";
  if (["assigned", "regressed"].includes(action)) return "triaged";
  return "open";
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("sentry-hook-signature") ?? request.headers.get("x-sentry-signature");

  if (!signature) {
    return NextResponse.json(
      { ok: false, error: { code: "MISSING_SENTRY_SIGNATURE", message: "Sentry webhook requests must include a provider signature header before production use." } },
      { status: 400 },
    );
  }

  const webhookSecret = process.env.SENTRY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "SENTRY_WEBHOOK_SECRET_NOT_CONFIGURED", message: "Sentry webhook signature verification requires SENTRY_WEBHOOK_SECRET." },
        data: {
          receivedSignatureHeader: "present",
          requiredNextWork: ["Configure SENTRY_WEBHOOK_SECRET before accepting provider webhook deliveries."],
        },
      },
      { status: 501 },
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "WEBHOOK_BODY_UNREADABLE", message: "Webhook body could not be read." } }, { status: 400 });
  }

  if (!verifySentrySignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_SENTRY_SIGNATURE", message: "Sentry webhook signature verification failed." } },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
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
    route: culprit ?? "/api/webhooks/sentry",
    release: typeof data.release === "string" ? data.release : "sentry-webhook-preview",
    metadata: {
      provider: "sentry",
      eventType: typeof event.action === "string" ? event.action : "unknown",
      providerDeliveryId: buildProviderDeliveryId(event, data),
      rawPayloadShape: Object.keys(event).slice(0, 12),
    },
    tags: { phase: "11", provider: "sentry" },
  });
  const action = typeof event.action === "string" ? event.action : "unknown";

  return NextResponse.json(
    {
      ok: true,
      data: {
        receivedSignatureHeader: "present",
        providerDeliveryId: buildProviderDeliveryId(event, data),
        idempotencyKey: buildProviderDeliveryId(event, data),
        reconciliation: {
          provider: "sentry",
          action,
          targetErrorStatus: mapSentryActionToErrorStatus(action),
          persistence: "not-yet-wired",
        },
        report,
        workflow: buildAgenticBugFixWorkflow(report),
        issueDraft: buildGithubIssueDraft(report),
        requiredNextWork: [
          "Persist webhook deliveries idempotently and connect them to ErrorReport rows.",
          "Map provider issue status transitions to tenant-scoped ErrorReport status updates.",
          "Create sanitized GitHub issues only after human-approved repo integration is configured.",
        ],
      },
    },
    { status: 202 },
  );
}
