import { buildGoogleCalendarProviderSyncPlan } from "@inkroute/calendar";
import { NextResponse, type NextRequest } from "next/server";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function normalizeHeader(value: string | null): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

export async function POST(request: NextRequest) {
  const channelId = normalizeHeader(request.headers.get("x-goog-channel-id"));
  const resourceId = normalizeHeader(request.headers.get("x-goog-resource-id"));
  const resourceState = normalizeHeader(request.headers.get("x-goog-resource-state"));
  const messageNumber = normalizeHeader(request.headers.get("x-goog-message-number"));
  const channelToken = normalizeHeader(request.headers.get("x-goog-channel-token"));
  const bodyText = await request.text();

  if (!channelId || !resourceId || !resourceState || !messageNumber) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "MISSING_GOOGLE_CALENDAR_WEBHOOK_HEADERS",
          message: "Google Calendar push webhook requests must include channel id, resource id, resource state, and message number headers.",
        },
        gapIds: ["GAP-009", "GAP-057", "GAP-058"],
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const tenantId = normalizeHeader(request.headers.get("x-inkroute-tenant-id"));
  const artistId = normalizeHeader(request.headers.get("x-inkroute-artist-id"));
  const plan = buildGoogleCalendarProviderSyncPlan({
    tenantId: tenantId ?? "",
    artistId: artistId ?? "",
    calendarId: resourceId,
    action: "incremental_sync",
    oauthClientConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    requiredScopesGranted: false,
    encryptedTokenRepositoryConfigured: false,
    providerWorkerEnabled: false,
    idempotencyKey: `google-calendar-webhook:${channelId}:${messageNumber}`,
    pushChannelId: channelId,
    pushResourceId: resourceId,
    syncToken: channelToken ?? undefined,
  });

  const responsePayload = {
    channel: {
      channelId,
      resourceId,
      resourceState,
      messageNumber,
      tokenPresent: Boolean(channelToken),
    },
    bodyBytes: bodyText.length,
    plan: {
      action: plan.action,
      providerCall: plan.providerCall,
      idempotencyKey: plan.idempotencyKey,
      requiresTransaction: plan.requiresTransaction,
      blockers: plan.blockers,
      nextAction: plan.nextAction,
      writeModels: plan.writes.map((write) => write.model),
    },
    gapIds: ["GAP-009", "GAP-057", "GAP-058"],
    boundary: "Google Calendar push webhook boundary validates provider headers and builds an incremental-sync plan only; OAuth credentials, encrypted tokens, provider worker execution, idempotency persistence, and CalendarAuditLog proof remain gated.",
  };

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_GOOGLE_CALENDAR_WEBHOOK_NOT_CONFIGURED",
          message: "Production Google Calendar webhooks require verified channel tokens, encrypted provider tokens, sync worker execution, durable idempotency, and CalendarAuditLog persistence.",
        },
        data: {
          ...responsePayload,
          productionBoundary: {
            localCalendarWebhookProcessingDisabled: true,
            requiresGoogleOauthAndEncryptedTokens: true,
            requiresProviderWorker: true,
          },
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      data: {
        ...responsePayload,
        localRuntime: {
          status: "received-in-local-runtime",
          processedProviderChanges: false,
          persistedProviderState: false,
        },
      },
    },
    { status: 202, headers: noStoreHeaders },
  );
}
