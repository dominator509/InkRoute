import { NextRequest, NextResponse } from "next/server";
import { buildGoogleCalendarProviderSyncPlan, type GoogleCalendarSyncAction } from "@inkroute/calendar";

import { dashboardGoogleCalendarSyncContract } from "../../../../lib/googleCalendarSync";
import { assertPermission, resolveDashboardActor } from "../../dashboardAuth";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

const supportedActions = new Set<GoogleCalendarSyncAction>(dashboardGoogleCalendarSyncContract.supportedActions);

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "calendar:write");
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to sync Google Calendar." } },
      { status: 403, headers: noStoreHeaders },
    );
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const tenantId = String(body?.tenantId ?? actor.tenantId);
  if (tenantId !== actor.tenantId) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot sync Google Calendar for another tenant." } },
      { status: 403, headers: noStoreHeaders },
    );
  }

  const action = String(body?.action ?? "");
  if (!supportedActions.has(action as GoogleCalendarSyncAction)) {
    return NextResponse.json(
      { ok: false, error: { code: "UNSUPPORTED_GOOGLE_SYNC_ACTION", message: "Google Calendar sync action is not supported." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const plan = buildGoogleCalendarProviderSyncPlan({
    tenantId,
    artistId: String(body?.artistId ?? ""),
    calendarId: String(body?.calendarId ?? ""),
    action: action as GoogleCalendarSyncAction,
    occurredAt: new Date().toISOString(),
    oauthClientConfigured: Boolean(body?.oauthClientConfigured),
    requiredScopesGranted: Boolean(body?.requiredScopesGranted),
    refreshTokenEncrypted: Boolean(body?.refreshTokenEncrypted),
    providerWorkerEnabled: Boolean(body?.providerWorkerEnabled),
    ...(typeof body?.idempotencyKey === "string" ? { idempotencyKey: body.idempotencyKey } : {}),
    ...(typeof body?.appointmentId === "string" ? { appointmentId: body.appointmentId } : {}),
    ...(typeof body?.providerEventId === "string" ? { providerEventId: body.providerEventId } : {}),
    ...(typeof body?.syncToken === "string" ? { syncToken: body.syncToken } : {}),
    ...(typeof body?.syncTokenInvalid === "boolean" ? { syncTokenInvalid: body.syncTokenInvalid } : {}),
    ...(typeof body?.pushChannelId === "string" ? { pushChannelId: body.pushChannelId } : {}),
    ...(typeof body?.pushResourceId === "string" ? { pushResourceId: body.pushResourceId } : {}),
    ...(typeof body?.pushChannelExpiresAt === "string" ? { pushChannelExpiresAt: body.pushChannelExpiresAt } : {}),
    retryAttempt: Number.isFinite(Number(body?.retryAttempt)) ? Number(body?.retryAttempt) : 0,
  });

  if (plan.status === "blocked") {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "GOOGLE_CALENDAR_SYNC_BLOCKED", message: "Google Calendar sync is not safe to execute." },
        plan,
        readiness: dashboardGoogleCalendarSyncContract.readiness,
        gapIds: ["GAP-057"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      status: "provider-worker-required",
      message: "Google Calendar sync plan is valid, but the provider worker must execute the real Google call.",
      plan,
      readiness: dashboardGoogleCalendarSyncContract.readiness,
      gapIds: ["GAP-057"],
    },
    { status: 202, headers: noStoreHeaders },
  );
}
