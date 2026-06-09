import { NextRequest, NextResponse } from "next/server";
import { buildGoogleCalendarProviderSyncPlan, type GoogleCalendarSyncAction } from "@inkroute/calendar";

import { dashboardGoogleCalendarSyncContract } from "../../../../lib/googleCalendarSync";
import { assertPermission, resolveDashboardActor } from "../../dashboardAuth";

const supportedActions = new Set<GoogleCalendarSyncAction>(dashboardGoogleCalendarSyncContract.supportedActions);

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "calendar:write");
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to sync Google Calendar." } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const tenantId = String(body?.tenantId ?? actor.tenantId);
  if (tenantId !== actor.tenantId) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot sync Google Calendar for another tenant." } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const action = String(body?.action ?? "");
  if (!supportedActions.has(action as GoogleCalendarSyncAction)) {
    return NextResponse.json(
      { ok: false, error: { code: "UNSUPPORTED_GOOGLE_SYNC_ACTION", message: "Google Calendar sync action is not supported." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
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
    idempotencyKey: typeof body?.idempotencyKey === "string" ? body.idempotencyKey : undefined,
    appointmentId: typeof body?.appointmentId === "string" ? body.appointmentId : undefined,
    providerEventId: typeof body?.providerEventId === "string" ? body.providerEventId : undefined,
    syncToken: typeof body?.syncToken === "string" ? body.syncToken : undefined,
    syncTokenInvalid: Boolean(body?.syncTokenInvalid),
    pushChannelId: typeof body?.pushChannelId === "string" ? body.pushChannelId : undefined,
    pushResourceId: typeof body?.pushResourceId === "string" ? body.pushResourceId : undefined,
    pushChannelExpiresAt: typeof body?.pushChannelExpiresAt === "string" ? body.pushChannelExpiresAt : undefined,
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
      { status: 409, headers: { "Cache-Control": "no-store" } },
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
    { status: 501, headers: { "Cache-Control": "no-store" } },
  );
}
