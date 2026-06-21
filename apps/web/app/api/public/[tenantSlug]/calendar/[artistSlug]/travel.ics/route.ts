import { buildTravelScheduleIcs } from "@inkroute/calendar";
import { demoTravelStops, inkrouteDemoArtist, inkrouteDemoTenant } from "@inkroute/config";
import { evaluateSignedIcsFeedRequest } from "../../../../../../../lib/signedIcsFeeds";

export const dynamic = "force-dynamic";

const privateNoStoreHeaders = { "Cache-Control": "private, no-store" } as const;

export async function GET(request: Request, context: { params: Promise<{ tenantSlug: string; artistSlug: string }> }) {
  const { tenantSlug, artistSlug } = await context.params;
  if (tenantSlug !== inkrouteDemoTenant.slug || artistSlug !== inkrouteDemoArtist.slug) {
    return Response.json(
      { ok: false, error: { code: "NOT_FOUND", message: "No demo travel calendar exists for this tenant or artist." } },
      { status: 404, headers: privateNoStoreHeaders },
    );
  }

  if (process.env.NODE_ENV === "production") {
    return Response.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_SIGNED_ICS_NOT_CONFIGURED",
          message: "Production travel ICS feeds require durable signed-token persistence, revocation checks, access logs, and client-import proof; local demo feed tokens are disabled.",
          gapIds: ["GAP-009", "GAP-055", "GAP-059"],
        },
        productionBoundary: {
          localDemoSignedFeedDisabled: true,
          requiredBeforeEnablement: [
            "tenant/artist-scoped signed feed token persistence",
            "revocation lookup and rejected-token route tests",
            "durable access-log persistence",
            "Apple, Google, and Outlook import smoke evidence",
          ],
        },
      },
      {
        status: 503,
        headers: {
          ...privateNoStoreHeaders,
          "X-InkRoute-Status": "signed-feed-provider-not-configured",
          "X-InkRoute-Gaps": "GAP-009,GAP-055,GAP-059",
        },
      },
    );
  }

  const token = new URL(request.url).searchParams.get("token") ?? undefined;
  const { decision: access } = await evaluateSignedIcsFeedRequest({
    ...(token ? { token } : {}),
    tenantSlug,
    artistSlug,
    now: new Date().toISOString(),
    userAgent: request.headers.get("user-agent"),
    ipHash: request.headers.get("x-forwarded-for") ? "redacted-forwarded-for-present" : null,
  });

  if (!access.allowed) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "ICS_FEED_TOKEN_REQUIRED",
          status: access.status,
          message: access.reason,
        },
      },
      {
        status: 401,
        headers: {
          "Cache-Control": access.cacheControl,
          "X-InkRoute-Status": "signed-feed-token-rejected",
          "X-InkRoute-Gaps": "GAP-055",
        },
      },
    );
  }

  const body = buildTravelScheduleIcs(`${inkrouteDemoArtist.displayName} travel schedule`, demoTravelStops);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${artistSlug}-travel.ics"`,
      "Cache-Control": access.cacheControl,
      "X-InkRoute-Status": "local-demo-signed-feed",
      "X-InkRoute-Gaps": "GAP-009,GAP-055",
      "X-InkRoute-Feed-Access-Logged": String(access.shouldLogAccess),
    },
  });
}
