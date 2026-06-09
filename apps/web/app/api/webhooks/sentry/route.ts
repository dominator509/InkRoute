import { buildObservabilityReportDraft, buildAgenticBugFixWorkflow, buildGithubIssueDraft } from "@inkroute/observability";
import { prisma } from "@inkroute/db";
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  buildProviderDeliveryId,
  mapSentryActionToErrorStatus,
  providerIssueOwnershipLookup,
  providerWebhookReconciliationArtifactPaths,
  providerWebhookReconciliationContract,
  sanitizeProviderWebhookPayload,
} from "../../../../lib/providerWebhookReconciliation";

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

function isDatabaseUnavailable(error: unknown): boolean {
  if (!process.env.DATABASE_URL) return true;
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: string }).code;
  if (typeof code === "string" && ["P1000", "P1001", "P1002", "P1003", "P1008"].includes(code)) return true;
  const message = error.message.toLowerCase();
  return message.includes("connect") && message.includes("database");
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
  const action = typeof event.action === "string" ? event.action : "unknown";
  const providerDeliveryId = buildProviderDeliveryId(event, data);
  const targetErrorStatus = mapSentryActionToErrorStatus(action);
  const ownership = providerIssueOwnershipLookup(data);
  const sanitizedProviderPayload = sanitizeProviderWebhookPayload(event, data);

  const report = buildObservabilityReportDraft({
    source: "webhook",
    runtime: "provider-webhook",
    environment: "development",
    message: issueTitle,
    route: culprit ?? "/api/webhooks/sentry",
    release: typeof data.release === "string" ? data.release : "sentry-webhook-preview",
    metadata: {
      provider: "sentry",
      eventType: action,
      providerDeliveryId,
      rawPayloadShape: Object.keys(event).slice(0, 12),
      sanitizedProviderPayload,
    },
    tags: { phase: "11", provider: "sentry" },
  });

  let persistence = "audit-log-seam";
  let auditId: string | null = null;
  let errorReportId: string | null = null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const matchedReport = ownership.stackHash
        ? await tx.errorReport.findFirst({
            where: { ...(ownership.tenantId ? { tenantId: ownership.tenantId } : {}), stackHash: ownership.stackHash },
            select: { id: true, tenantId: true, status: true },
          })
        : null;

      const updatedReport = matchedReport
        ? await tx.errorReport.update({
            where: { id: matchedReport.id },
            data: { status: targetErrorStatus, ...(targetErrorStatus === "resolved" ? { resolvedAt: new Date() } : {}) },
            select: { id: true, tenantId: true, status: true },
          })
        : null;

      const audit = await tx.auditLog.create({
        data: {
          tenantId: updatedReport?.tenantId ?? ownership.tenantId ?? null,
          action: "observability:sentry_webhook.reconcile",
          entityType: "ProviderWebhookDelivery",
          entityId: providerDeliveryId,
          metadata: {
            provider: "sentry",
            providerDeliveryId,
            idempotencyKey: providerDeliveryId,
            replayProtection: "audit-log-idempotency-seam",
            action,
            targetErrorStatus,
            matchedErrorReportId: updatedReport?.id ?? null,
            ownership,
            sanitizedProviderPayload,
            rawPayloadStored: false,
            requiredFutureConstraint: "dedicated unique ProviderWebhookDelivery(provider, providerDeliveryId)",
          },
        },
        select: { id: true },
      });

      return { auditId: audit.id, errorReportId: updatedReport?.id ?? null };
    });
    auditId = result.auditId;
    errorReportId = result.errorReportId;
    persistence = errorReportId ? "error-report-status-updated" : "delivery-audit-persisted";
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    persistence = "local-preview-database-unavailable";
  }

  return NextResponse.json(
    {
      ok: true,
      data: {
        receivedSignatureHeader: "present",
        providerDeliveryId,
        idempotencyKey: providerDeliveryId,
        reconciliation: {
          provider: "sentry",
          action,
          targetErrorStatus,
          persistence,
          auditId,
          errorReportId,
          ownership,
        },
        report,
        workflow: buildAgenticBugFixWorkflow(report),
        issueDraft: buildGithubIssueDraft(report),
        providerWebhookReconciliation: providerWebhookReconciliationContract,
        artifactPaths: providerWebhookReconciliationArtifactPaths,
        requiredNextWork: [
          "Add a dedicated ProviderWebhookDelivery table with unique provider delivery id constraints for stronger replay protection.",
          "Run live Sentry webhook replay tests against a verified provider delivery.",
          "Create sanitized GitHub issues only after human-approved repo integration is configured.",
        ],
      },
    },
    { status: 202 },
  );
}
