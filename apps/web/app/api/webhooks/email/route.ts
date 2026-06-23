import { interpretEmailWebhook } from "@inkroute/notifications";
import { inkrouteDemoTenant } from "@inkroute/config";
import { NextResponse, type NextRequest } from "next/server";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;
import { persistWebhookEvent } from "../../../../lib/localRuntimeState";
import { buildEmailProviderReconciliation, buildEmailWebhookReadinessFromPayload, emailProviderContract, verifyEmailWebhookSignature } from "../../../../lib/emailProvider";
import { persistProviderNotificationWebhookEvent } from "../../../../lib/providerNotificationWebhookPersistence";
import { buildProviderWebhookRouteBoundary, providerWebhookContract } from "../../../../lib/providerWebhookReconciliation";

function getTenantSlugFromPayload(payload: Record<string, unknown>): string {
  const candidateSlug = typeof payload.tenantSlug === "string" ? payload.tenantSlug : undefined;
  const candidateTenantId = typeof payload.tenant_id === "string" ? payload.tenant_id : undefined;
  if (candidateSlug === inkrouteDemoTenant.slug) return candidateSlug;
  if (candidateTenantId === inkrouteDemoTenant.id) return inkrouteDemoTenant.slug;
  return inkrouteDemoTenant.slug;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("resend-signature") ?? request.headers.get("svix-signature");
  const signatureVerification = verifyEmailWebhookSignature({
    rawBody,
    signatureHeader: signature,
    svixId: request.headers.get("svix-id"),
    svixTimestamp: request.headers.get("svix-timestamp"),
    secret: process.env.RESEND_WEBHOOK_SECRET ?? process.env.EMAIL_WEBHOOK_SECRET,
  });

  if (!signature) {
    return NextResponse.json(
      { ok: false, error: { code: "MISSING_EMAIL_PROVIDER_SIGNATURE", message: "Email webhooks must include a provider signature header before production processing." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  if (process.env.NODE_ENV === "production" && !signatureVerification.webhookSecretConfigured) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "EMAIL_PROVIDER_WEBHOOK_SECRET_NOT_CONFIGURED",
          message: "Production email webhooks require RESEND_WEBHOOK_SECRET or EMAIL_WEBHOOK_SECRET before parsing or persistence.",
          gapIds: ["GAP-066"],
        },
        productionBoundary: {
          localEmailWebhookPersistenceDisabled: true,
          requiresCryptographicSignatureSecret: true,
          durablePersistence: "not-attempted-production-secret-gated",
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  if (signatureVerification.webhookSecretConfigured && !signatureVerification.verified) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_EMAIL_PROVIDER_SIGNATURE",
          message: "Email webhook signature verification failed.",
          reason: signatureVerification.reason,
        },
      },
      { status: 401, headers: noStoreHeaders },
    );
  }

  let eventType = "unknown";
  let eventPayload: Record<string, unknown> = {};
  let eventId = "missing-email-event-id";
  let providerMessageId: string | undefined;
  let destinationEmail: string | undefined;
  try {
    const event = JSON.parse(rawBody) as { type?: unknown; event?: unknown };
    eventType = typeof event.type === "string" ? event.type : typeof event.event === "string" ? event.event : "unknown";
    eventPayload = typeof event === "object" && event !== null ? (event as Record<string, unknown>) : {};
    const dataPayload = typeof eventPayload.data === "object" && eventPayload.data !== null ? (eventPayload.data as Record<string, unknown>) : {};
    eventId = typeof eventPayload.id === "string" ? eventPayload.id : typeof eventPayload.event_id === "string" ? eventPayload.event_id : eventId;
    providerMessageId =
      typeof eventPayload.email_id === "string"
        ? eventPayload.email_id
        : typeof eventPayload.message_id === "string"
          ? eventPayload.message_id
          : typeof dataPayload.email_id === "string"
            ? dataPayload.email_id
            : typeof dataPayload.message_id === "string"
              ? dataPayload.message_id
              : undefined;
    destinationEmail =
      typeof eventPayload.to === "string"
        ? eventPayload.to
        : typeof eventPayload.email === "string"
          ? eventPayload.email
          : typeof eventPayload.recipient === "string"
            ? eventPayload.recipient
            : typeof dataPayload.to === "string"
              ? dataPayload.to
              : typeof dataPayload.email === "string"
                ? dataPayload.email
                : typeof dataPayload.recipient === "string"
                  ? dataPayload.recipient
                  : undefined;
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_WEBHOOK_JSON", message: "Email webhook body must be valid JSON." } }, { status: 400, headers: noStoreHeaders });
  }

  const tenantSlug = getTenantSlugFromPayload(eventPayload);
  const readiness = buildEmailWebhookReadinessFromPayload({
    tenantId: tenantSlug,
    eventId,
    eventType,
    ...(providerMessageId ? { providerMessageId } : {}),
    rawBodyCaptured: true,
    signatureHeaderPresent: true,
    signatureVerification,
  });
  const reconciliation = buildEmailProviderReconciliation({
    eventId,
    eventType,
    ...(providerMessageId ? { providerMessageId } : {}),
  });
  const providerWebhookBoundary = buildProviderWebhookRouteBoundary({
    source: "email",
    tenantId: tenantSlug,
    eventId,
    eventType,
    rawBodyBytes: rawBody.length,
    signatureHeaderPresent: true,
    reconciliation,
  });
  const interpretation = interpretEmailWebhook(eventType);

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_EMAIL_WEBHOOK_RECONCILIATION_NOT_CONFIGURED",
          message:
            "Production email webhooks require cryptographic signature verification plus durable NotificationDelivery, ProviderEvent, and suppression reconciliation; local runtime webhook persistence is disabled.",
          gapIds: ["GAP-010", "GAP-061", "GAP-064", "GAP-066"],
        },
        data: {
          tenantSlug,
          eventId,
          eventType,
          interpretation,
          readiness,
          reconciliation,
          signatureVerification,
          durablePersistence: "not-attempted-production-signature-gated",
          providerWebhookBoundary,
          crossProviderReadiness: providerWebhookContract.runtimeReadiness,
          productionBoundary: {
            localEmailWebhookPersistenceDisabled: true,
            requiresDurableProviderEventPersistence: true,
            gapIds: ["GAP-010", "GAP-061", "GAP-064", "GAP-066"],
            requiredWrites: readiness.requiredWrites,
            requiredControls: readiness.requiredControls,
            crossProviderRequiredMethods: providerWebhookContract.requiredRepositoryMethods,
          },
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const persistenceResult = await persistProviderNotificationWebhookEvent({
    tenantSlug,
    provider: "resend",
    channel: "email",
    eventId,
    eventType,
    ...(providerMessageId ? { providerMessageId } : {}),
    normalizedStatus: interpretation.normalizedStatus,
    payloadSummary: {
      provider: "resend",
      eventType,
      hasProviderMessageId: Boolean(providerMessageId),
      payloadKeys: Object.keys(eventPayload).slice(0, 12),
    },
    rawPayloadStored: false,
    signatureHeaderPresent: true,
    ...(destinationEmail && /bounce|complaint|unsubscribe/i.test(eventType) ? { suppressionDestination: destinationEmail, suppressionReason: `email_${interpretation.normalizedStatus}` } : {}),
  });

  const storedWebhook = persistWebhookEvent(tenantSlug, {
    source: "email",
    eventType,
    signatureHeader: "present",
    payloadLength: rawBody.length,
    interpretation: interpretation.eventType,
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        tenantSlug,
        storedWebhook,
        interpretation,
        readiness,
        reconciliation,
        signatureVerification,
        durablePersistence: persistenceResult.persistence,
        providerEventId: persistenceResult.providerEventId,
        auditLogId: persistenceResult.auditLogId,
        deliveryId: persistenceResult.deliveryId,
        deliveryStatusTransitionId: persistenceResult.deliveryStatusTransitionId,
        deliveryStatusMutated: persistenceResult.deliveryStatusMutated,
        suppressionId: persistenceResult.suppressionId,
        suppressionWritten: persistenceResult.suppressionWritten,
        replayDetected: persistenceResult.replayDetected,
        idempotencyKey: persistenceResult.idempotencyKey,
        providerWebhookBoundary,
        crossProviderReadiness: providerWebhookContract.runtimeReadiness,
        rawBodyBytes: rawBody.length,
        localRuntime: {
          status: "received-in-local-runtime",
          source: "email",
          gapIds: ["GAP-061", "GAP-064", "GAP-066"],
        },
        productionBoundary: {
          gapIds: ["GAP-061", "GAP-064", "GAP-066"],
          requiredBeforeEnablement: [
            "Verify provider signature before applying any delivery updates.",
            "Promote ProviderEvent/idempotency persistence from local DB attempts to integration evidence.",
            "Apply suppression state transitions for bounce/complaint/unsubscribe events.",
          ],
          sendPlan: emailProviderContract.sendPlan,
          requiredWrites: readiness.requiredWrites,
          requiredControls: readiness.requiredControls,
          crossProviderRequiredMethods: providerWebhookContract.requiredRepositoryMethods,
        },
      },
    },
    { status: 200, headers: noStoreHeaders },
  );
}

