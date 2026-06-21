import { prisma } from "@inkroute/db";
import { buildAgenticBugFixWorkflow, buildGithubIssueDraft, buildObservabilityReportDraft } from "@inkroute/observability";
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

import {
  buildProviderWebhookReconciliationContract,
  buildProviderDeliveryId,
  buildSentryReconciliationPlan,
  providerWebhookReconciliationArtifactPaths,
} from "../../../../lib/providerWebhookReconciliation";

export const runtime = "nodejs";

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
  return error instanceof Error && /connect|timeout|ECONN|P10\d{2}|database|tenant/i.test(error.message);
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "P2002");
}

async function persistProviderWebhookReconciliation(input: {
  tenantId: string | null;
  providerDeliveryId: string;
  idempotencyKey: string;
  providerFingerprint: string | null;
  targetErrorStatus: "open" | "triaged" | "in_progress" | "resolved" | "ignored";
  sanitizedPayload: Record<string, unknown>;
  rawPayloadStored: boolean;
}) {
  if (!input.tenantId) {
    return {
      persistence: "tenant-unresolved",
      providerWebhookDeliveryId: null,
      auditLogId: null,
      matchedErrorReportId: null,
      statusMutated: false,
      replayProtection: "idempotency-key-returned-no-tenant-write",
    };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const providerWebhookDelivery = await tx.providerWebhookDelivery.create({
        data: {
          tenantId: input.tenantId!,
          provider: "sentry",
          providerDeliveryId: input.providerDeliveryId,
          idempotencyKey: input.idempotencyKey,
          providerFingerprint: input.providerFingerprint,
          action: "sentry.webhook.reconcile",
          targetErrorStatus: input.targetErrorStatus,
          rawPayloadStored: input.rawPayloadStored,
          sanitizedPayload: input.sanitizedPayload,
        },
        select: { id: true },
      });

      const existingErrorReport = input.providerFingerprint
        ? await tx.errorReport.findFirst({
            where: { tenantId: input.tenantId, stackHash: input.providerFingerprint },
            select: { id: true, status: true },
          })
        : null;

      const updatedErrorReport = existingErrorReport
        ? await tx.errorReport.update({
            where: { id: existingErrorReport.id },
            data: {
              status: input.targetErrorStatus,
              resolvedAt: ["resolved", "ignored"].includes(input.targetErrorStatus) ? new Date() : null,
            },
            select: { id: true, status: true, resolvedAt: true },
          })
        : null;

      const auditLog = await tx.auditLog.create({
        data: {
          tenantId: input.tenantId!,
          action: "observability.provider_webhook.reconcile",
          entityType: "ProviderWebhookDelivery",
          entityId: input.providerDeliveryId,
          metadata: {
            provider: "sentry",
            providerDeliveryId: input.providerDeliveryId,
            idempotencyKey: input.idempotencyKey,
            providerFingerprint: input.providerFingerprint,
            targetErrorStatus: input.targetErrorStatus,
            previousErrorStatus: existingErrorReport?.status ?? null,
            matchedErrorReportId: updatedErrorReport?.id ?? null,
            statusMutated: Boolean(updatedErrorReport),
            rawPayloadStored: input.rawPayloadStored,
            sanitizedProviderPayload: input.sanitizedPayload,
            providerWebhookDeliveryId: providerWebhookDelivery.id,
            replayProtection: "ProviderWebhookDelivery unique provider/idempotency constraint claimed before side effects",
          },
        },
        select: { id: true },
      });

      await tx.providerWebhookDelivery.update({
        where: { id: providerWebhookDelivery.id },
        data: {
          errorReportId: updatedErrorReport?.id ?? null,
          statusMutationApplied: Boolean(updatedErrorReport),
        },
      });

      return {
        persistence: "database-provider-webhook-delivery-transaction",
        providerWebhookDeliveryId: providerWebhookDelivery.id,
        auditLogId: auditLog.id,
        matchedErrorReportId: updatedErrorReport?.id ?? null,
        statusMutated: Boolean(updatedErrorReport),
        replayProtection: "provider-webhook-delivery-unique-constraint",
      };
    });
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      return {
        persistence: "duplicate-provider-webhook-delivery",
        providerWebhookDeliveryId: null,
        auditLogId: null,
        matchedErrorReportId: null,
        statusMutated: false,
        replayProtection: "provider-webhook-delivery-unique-constraint-replay-rejected",
      };
    }

    return {
      persistence: isDatabaseUnavailable(error) ? "database-unavailable" : "database-write-rejected",
      providerWebhookDeliveryId: null,
      auditLogId: null,
      matchedErrorReportId: null,
      statusMutated: false,
      replayProtection: "idempotency-key-returned-transaction-not-committed",
    };
  }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("sentry-hook-signature") ?? request.headers.get("x-sentry-signature");

  if (!signature) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "MISSING_SENTRY_SIGNATURE",
          message: "Sentry webhook requests must include a provider signature header before production use.",
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const webhookSecret = process.env.SENTRY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SENTRY_WEBHOOK_SECRET_NOT_CONFIGURED",
          message: "Sentry webhook signature verification requires SENTRY_WEBHOOK_SECRET.",
        },
        data: {
          receivedSignatureHeader: "present",
          requiredNextWork: ["Configure SENTRY_WEBHOOK_SECRET before accepting provider webhook deliveries."],
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "WEBHOOK_BODY_UNREADABLE", message: "Webhook body could not be read." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  if (!verifySentrySignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_SENTRY_SIGNATURE", message: "Sentry webhook signature verification failed." } },
      { status: 401, headers: noStoreHeaders },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_WEBHOOK_JSON", message: "Webhook body must be valid JSON." } },
      { status: 400, headers: noStoreHeaders },
    );
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
  const reconciliationPlan = buildSentryReconciliationPlan({
    event,
    data,
    ...(typeof data.tenantId === "string" ? { fallbackTenantId: data.tenantId } : {}),
  });
  const persistenceResult = await persistProviderWebhookReconciliation({
    tenantId: reconciliationPlan.ownership.tenantId,
    providerDeliveryId: reconciliationPlan.providerDeliveryId,
    idempotencyKey: reconciliationPlan.idempotencyKey,
    providerFingerprint: reconciliationPlan.providerFingerprint,
    targetErrorStatus: reconciliationPlan.targetErrorStatus,
    sanitizedPayload: reconciliationPlan.sanitizedPayload,
    rawPayloadStored: reconciliationPlan.rawPayloadStored,
  });
  if (process.env.NODE_ENV === "production" && persistenceResult.persistence !== "database-provider-webhook-delivery-transaction") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_WEBHOOK_RECONCILIATION_NOT_CONFIGURED",
          message: "Production Sentry webhook reconciliation requires tenant ownership resolution and durable AuditLog/ErrorReport persistence; non-durable fallback reconciliation is disabled.",
          gapIds: ["GAP-079", "GAP-082"],
        },
        data: {
          receivedSignatureHeader: "present",
          providerDeliveryId: reconciliationPlan.providerDeliveryId,
          idempotencyKey: reconciliationPlan.idempotencyKey,
          durablePersistence: persistenceResult.persistence,
          providerWebhookDeliveryId: persistenceResult.providerWebhookDeliveryId,
          replayProtection: persistenceResult.replayProtection,
          ownership: reconciliationPlan.ownership,
          productionBoundary: { providerWebhookDurablePersistenceRequired: true },
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }
  const reconciliationContract = buildProviderWebhookReconciliationContract();

  return NextResponse.json(
    {
      ok: true,
      data: {
        receivedSignatureHeader: "present",
        providerDeliveryId: reconciliationPlan.providerDeliveryId,
        idempotencyKey: reconciliationPlan.idempotencyKey,
        reconciliation: {
          provider: reconciliationPlan.provider,
          action: reconciliationPlan.action,
          targetErrorStatus: reconciliationPlan.targetErrorStatus,
          persistence: "durable-provider-webhook-attempt",
          durablePersistence: persistenceResult.persistence,
          providerWebhookDeliveryId: persistenceResult.providerWebhookDeliveryId,
          auditLogId: persistenceResult.auditLogId,
          matchedErrorReportId: persistenceResult.matchedErrorReportId,
          statusMutated: persistenceResult.statusMutated,
          replayProtection: persistenceResult.replayProtection,
          ownership: reconciliationPlan.ownership,
          rawPayloadStored: reconciliationPlan.rawPayloadStored,
          sanitizedProviderPayload: reconciliationPlan.sanitizedPayload,
          artifactPaths: providerWebhookReconciliationArtifactPaths,
          contractStatus: reconciliationContract.status,
        },
        report,
        workflow: buildAgenticBugFixWorkflow(report),
        issueDraft: buildGithubIssueDraft(report),
        requiredNextWork: [
          "Run live Sentry webhook replay/idempotency proof against the configured provider secret.",
          "Promote seeded ErrorReport status-mutation and provider no-PII artifact checks from static coverage to integration evidence.",
        ],
      },
    },
    { status: 202, headers: noStoreHeaders },
  );
}

