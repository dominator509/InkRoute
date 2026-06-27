import { interpretSmsWebhook } from "@inkroute/notifications";
import { inkrouteDemoTenant } from "@inkroute/config";
import { NextResponse, type NextRequest } from "next/server";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;
import { persistWebhookEvent } from "../../../../lib/localRuntimeState";
import { buildSmsProviderReconciliation, buildSmsWebhookReadinessFromPayload, smsProviderContract, verifySmsWebhookSignature } from "../../../../lib/smsProvider";
import { persistProviderNotificationWebhookEvent } from "../../../../lib/providerNotificationWebhookPersistence";
import { buildProviderWebhookRouteBoundary, providerWebhookContract } from "../../../../lib/providerWebhookReconciliation";

function getTenantSlugFromPayload(payload: Record<string, unknown>): string {
  const candidateSlug = typeof payload.tenantSlug === "string" ? payload.tenantSlug : undefined;
  const candidateTenantId = typeof payload.tenant_id === "string" ? payload.tenant_id : undefined;
  if (candidateSlug === inkrouteDemoTenant.slug) return candidateSlug;
  if (candidateTenantId === inkrouteDemoTenant.id) return inkrouteDemoTenant.slug;
  return inkrouteDemoTenant.slug;
}

function getPayloadValue(payload: Record<string, unknown>, keys: readonly string[], fallback: string): string {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-twilio-signature");
  const contentType = request.headers.get("content-type") ?? "";
  const signatureVerification = verifySmsWebhookSignature({
    requestUrl: request.url,
    rawBody,
    signatureHeader: signature,
    authToken: process.env.TWILIO_AUTH_TOKEN ?? process.env.SMS_WEBHOOK_AUTH_TOKEN,
    contentType,
  });

  if (!signature) {
    return NextResponse.json(
      { ok: false, error: { code: "MISSING_SMS_PROVIDER_SIGNATURE", message: "SMS webhooks must include the provider signature header before production processing." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  if (process.env.NODE_ENV === "production" && !signatureVerification.twilioAuthTokenConfigured) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SMS_PROVIDER_WEBHOOK_AUTH_TOKEN_NOT_CONFIGURED",
          message: "Production SMS webhooks require TWILIO_AUTH_TOKEN or SMS_WEBHOOK_AUTH_TOKEN before parsing or persistence.",
          gapIds: ["GAP-066"],
        },
        productionBoundary: {
          localSmsWebhookPersistenceDisabled: true,
          requiresCryptographicSignatureSecret: true,
          durablePersistence: "not-attempted-production-secret-gated",
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  if (signatureVerification.twilioAuthTokenConfigured && !signatureVerification.verified) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_SMS_PROVIDER_SIGNATURE",
          message: "SMS webhook signature verification failed.",
          reason: signatureVerification.reason,
        },
      },
      { status: 401, headers: noStoreHeaders },
    );
  }

  let eventType = "sms.callback";
  let inboundBody: string | undefined;
  let sourcePhone: string | undefined;
  let eventPayload: Record<string, unknown> = {};

  if (contentType.includes("application/json")) {
    try {
      const event = JSON.parse(rawBody) as { MessageStatus?: unknown; SmsStatus?: unknown; Body?: unknown };
      eventType = typeof event.MessageStatus === "string" ? event.MessageStatus : typeof event.SmsStatus === "string" ? event.SmsStatus : "sms.callback";
      inboundBody = typeof event.Body === "string" ? event.Body : undefined;
      eventPayload = event as Record<string, unknown>;
      sourcePhone = typeof event.From === "string" ? event.From : undefined;
    } catch {
      return NextResponse.json({ ok: false, error: { code: "INVALID_WEBHOOK_JSON", message: "SMS JSON webhook body must be valid JSON." } }, { status: 400, headers: noStoreHeaders });
    }
  } else {
    const params = new URLSearchParams(rawBody);
    eventPayload = Object.fromEntries(params.entries());
    eventType = params.get("MessageStatus") ?? params.get("SmsStatus") ?? "sms.callback";
    inboundBody = params.get("Body") ?? undefined;
    sourcePhone = params.get("From") ?? undefined;
  }

  const tenantSlug = getTenantSlugFromPayload(eventPayload);
  const eventId = getPayloadValue(eventPayload, ["EventSid", "MessageSid", "SmsSid", "event_id", "id"], "missing-sms-event-id");
  const providerMessageId = getPayloadValue(eventPayload, ["MessageSid", "SmsSid", "message_id"], "");
  const readiness = buildSmsWebhookReadinessFromPayload({
    tenantId: tenantSlug,
    eventId,
    eventType,
    ...(providerMessageId ? { providerMessageId } : {}),
    ...(inboundBody ? { inboundBody } : {}),
    rawBodyCaptured: true,
    signatureHeaderPresent: true,
    signatureVerification,
  });
  const reconciliation = buildSmsProviderReconciliation({
    eventId,
    eventType,
    ...(providerMessageId ? { providerMessageId } : {}),
    ...(inboundBody ? { inboundBody } : {}),
  });
  const providerWebhookBoundary = buildProviderWebhookRouteBoundary({
    source: "sms",
    tenantId: tenantSlug,
    eventId,
    eventType,
    rawBodyBytes: rawBody.length,
    signatureHeaderPresent: true,
    reconciliation,
  });
  const interpretation = interpretSmsWebhook(eventType, inboundBody);

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_SMS_WEBHOOK_RECONCILIATION_NOT_CONFIGURED",
          message:
            "Production SMS webhooks require Twilio signature verification plus durable ProviderEvent, suppression, and inbound-thread reconciliation; local runtime webhook persistence is disabled.",
          gapIds: ["GAP-010", "GAP-062", "GAP-064", "GAP-066"],
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
          inboundBodyProvided: typeof inboundBody === "string",
          rawBodyBytes: rawBody.length,
          productionBoundary: {
            localSmsWebhookPersistenceDisabled: true,
            requiresDurableProviderEventPersistence: true,
            gapIds: ["GAP-010", "GAP-062", "GAP-064", "GAP-066"],
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
    provider: "twilio",
    channel: "sms",
    eventId,
    eventType,
    ...(providerMessageId ? { providerMessageId } : {}),
    normalizedStatus: eventType,
    payloadSummary: {
      provider: "twilio",
      eventType,
      hasProviderMessageId: Boolean(providerMessageId),
      inboundBodyProvided: typeof inboundBody === "string",
      payloadKeys: Object.keys(eventPayload).slice(0, 12),
    },
    rawPayloadStored: false,
    signatureHeaderPresent: true,
    ...(sourcePhone && inboundBody?.trim().toLowerCase() === "stop" ? { suppressionDestination: sourcePhone, suppressionReason: "sms_stop" } : {}),
    inboundBodyProvided: typeof inboundBody === "string",
  });

  const storedWebhook = persistWebhookEvent(tenantSlug, {
    source: "sms",
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
        inboundThreadCreated: persistenceResult.inboundThreadCreated,
        inboundThreadBoundary: persistenceResult.inboundThreadBoundary,
        replayDetected: persistenceResult.replayDetected,
        idempotencyKey: persistenceResult.idempotencyKey,
        providerWebhookBoundary,
        crossProviderReadiness: providerWebhookContract.runtimeReadiness,
        inboundBodyProvided: typeof inboundBody === "string",
        rawBodyBytes: rawBody.length,
        localRuntime: {
          status: "received-in-local-runtime",
          source: "sms",
          gapIds: ["GAP-062", "GAP-064", "GAP-066"],
        },
        productionBoundary: {
          gapIds: ["GAP-062", "GAP-064", "GAP-066"],
          requiredBeforeEnablement: [
            "Verify signature hash from Twilio before trusting payload content.",
            "Promote ProviderEvent/idempotency persistence from local DB attempts to integration evidence.",
            "Handle inbound STOP by muting the sender destination immediately.",
            "Queue HELP and client replies to tenant-scoped threads only after validation.",
          ],
          sendPlan: smsProviderContract.sendPlan,
          stopWebhookReadiness: smsProviderContract.stopWebhookReadiness,
          helpWebhookReadiness: smsProviderContract.helpWebhookReadiness,
          requiredWrites: readiness.requiredWrites,
          requiredControls: readiness.requiredControls,
          crossProviderRequiredMethods: providerWebhookContract.requiredRepositoryMethods,
        },
      },
    },
    { status: 200, headers: noStoreHeaders },
  );
}

