import { NextResponse, type NextRequest } from "next/server";
import { buildPreferencePlanFromRequest, preferenceCenterContract } from "../../../../../lib/preferenceCenter";
import type { PreferenceMutationAction } from "@inkroute/notifications";

const actions: readonly PreferenceMutationAction[] = ["issue_preference_token", "update_email_preferences", "unsubscribe_email", "record_sms_stop", "record_sms_start", "update_tenant_channel_settings"];

function parseAction(value: unknown): PreferenceMutationAction {
  return typeof value === "string" && actions.includes(value as PreferenceMutationAction) ? (value as PreferenceMutationAction) : "update_email_preferences";
}

export async function GET(_request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  return NextResponse.json(
    {
      ok: true,
      tenantSlug,
      contract: preferenceCenterContract,
      gapIds: ["GAP-067"],
      boundary: "Preference center route exposes token, unsubscribe, STOP/START, tenant settings, List-Unsubscribe, and legal-copy gates without mutating durable stores.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_PREFERENCE_JSON", message: "Preference mutation body must be valid JSON." } }, { status: 400 });
  }

  const action = parseAction(body.action);
  const plan = buildPreferencePlanFromRequest({
    tenantId: typeof body.tenantId === "string" ? body.tenantId : tenantSlug,
    action,
    now: typeof body.now === "string" ? body.now : new Date().toISOString(),
    ...(typeof body.clientId === "string" ? { clientId: body.clientId } : {}),
    ...(typeof body.actorId === "string" ? { actorId: body.actorId } : {}),
    ...(typeof body.email === "string" ? { email: body.email } : {}),
    ...(typeof body.phone === "string" ? { phone: body.phone } : {}),
    ...(typeof body.token === "string" ? { token: body.token } : {}),
    ...(typeof body.tokenHash === "string" ? { tokenHash: body.tokenHash } : {}),
    ...(typeof body.tokenExpiresAt === "string" ? { tokenExpiresAt: body.tokenExpiresAt } : {}),
    idempotencyKey: typeof body.idempotencyKey === "string" ? body.idempotencyKey : `preference:${tenantSlug}:${action}`,
    ...(typeof body.emailOptIn === "boolean" ? { emailOptIn: body.emailOptIn } : {}),
    ...(typeof body.smsOptIn === "boolean" ? { smsOptIn: body.smsOptIn } : {}),
    ...(typeof body.pushOptIn === "boolean" ? { pushOptIn: body.pushOptIn } : {}),
    ...(typeof body.marketingOptIn === "boolean" ? { marketingOptIn: body.marketingOptIn } : {}),
    ...(typeof body.transactionalAllowed === "boolean" ? { transactionalAllowed: body.transactionalAllowed } : {}),
    ...(typeof body.tenantChannelSettingsConfigured === "boolean" ? { tenantChannelSettingsConfigured: body.tenantChannelSettingsConfigured } : {}),
    ...(typeof body.legalCopyApproved === "boolean" ? { legalCopyApproved: body.legalCopyApproved } : {}),
  });

  return NextResponse.json(
    {
      ok: plan.status === "ready",
      tenantSlug,
      plan,
      requiredRepositoryMethods: preferenceCenterContract.requiredRepositoryMethods,
      gapIds: ["GAP-067"],
      boundary: "Preference POST returns the mutation/write plan; durable token, suppression, preference, settings, audit, and idempotency repositories remain required for live mutations.",
    },
    { status: plan.status === "ready" ? 202 : 409, headers: { "Cache-Control": "no-store" } },
  );
}
