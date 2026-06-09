import { NextResponse, type NextRequest } from "next/server";
import { buildPreferencePlanFromRequest, preferenceCenterContract } from "../../../../../lib/preferenceCenter";

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  const tokenHash = request.nextUrl.searchParams.get("tokenHash") ?? request.headers.get("x-preference-token-hash") ?? undefined;
  const email = request.nextUrl.searchParams.get("email") ?? undefined;
  const plan = buildPreferencePlanFromRequest({
    tenantId: tenantSlug,
    action: "unsubscribe_email",
    clientId: request.nextUrl.searchParams.get("clientId") ?? "missing_client",
    ...(email ? { email } : {}),
    ...(tokenHash ? { tokenHash } : {}),
    ...(request.nextUrl.searchParams.get("tokenExpiresAt") ? { tokenExpiresAt: request.nextUrl.searchParams.get("tokenExpiresAt") ?? undefined } : {}),
    now: new Date().toISOString(),
    idempotencyKey: `unsubscribe:${tenantSlug}:${tokenHash ?? "missing"}`,
    emailOptIn: false,
    marketingOptIn: false,
    transactionalAllowed: true,
  });

  return NextResponse.json(
    {
      ok: plan.status === "ready",
      tenantSlug,
      plan,
      listUnsubscribeHeaders: preferenceCenterContract.listUnsubscribeHeaders,
      gapIds: ["GAP-067"],
      boundary: "One-click unsubscribe route returns the suppression write plan and never stores raw preference tokens in local runtime.",
    },
    { status: plan.status === "ready" ? 202 : 409, headers: { "Cache-Control": "no-store" } },
  );
}
