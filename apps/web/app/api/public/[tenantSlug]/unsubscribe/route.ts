import { NextResponse, type NextRequest } from "next/server";
import { buildPreferencePlanFromRequest, preferenceCenterContract } from "../../../../../lib/preferenceCenter";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  const tokenHash = request.nextUrl.searchParams.get("tokenHash") ?? request.headers.get("x-preference-token-hash") ?? undefined;
  const email = request.nextUrl.searchParams.get("email") ?? undefined;
  const tokenExpiresAt = request.nextUrl.searchParams.get("tokenExpiresAt") ?? undefined;
  const plan = buildPreferencePlanFromRequest({
    tenantId: tenantSlug,
    action: "unsubscribe_email",
    clientId: request.nextUrl.searchParams.get("clientId") ?? "missing_client",
    ...(email ? { email } : {}),
    ...(tokenHash ? { tokenHash } : {}),
    ...(tokenExpiresAt ? { tokenExpiresAt } : {}),
    now: new Date().toISOString(),
    idempotencyKey: `unsubscribe:${tenantSlug}:${tokenHash ?? "missing"}`,
    emailOptIn: false,
    marketingOptIn: false,
    transactionalAllowed: true,
  });

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_UNSUBSCRIBE_PERSISTENCE_NOT_CONFIGURED",
          message: "Production one-click unsubscribe requires durable hash-only token validation, suppression persistence, audit logs, and idempotency storage; local-contract fallback responses are disabled.",
          gapIds: ["GAP-010", "GAP-061", "GAP-067", "GAP-069"],
        },
        productionBoundary: {
          localContractUnsubscribeFallbackDisabled: true,
          requiredBeforeEnablement: [
            "hash-only preference token validation",
            "SuppressionListEntry persistence",
            "NotificationAuditLog and IdempotencyKey persistence",
            "provider List-Unsubscribe integration evidence",
          ],
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  return NextResponse.json(
    {
      ok: plan.status === "ready",
      tenantSlug,
      plan,
      listUnsubscribeHeaders: preferenceCenterContract.listUnsubscribeHeaders,
      gapIds: ["GAP-067"],
      boundary: "One-click unsubscribe route returns the suppression write plan and never stores raw preference tokens in local runtime.",
    },
    { status: plan.status === "ready" ? 202 : 409, headers: noStoreHeaders },
  );
}
