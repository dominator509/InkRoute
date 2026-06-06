import { buildTravelScheduleIcs } from "@inkroute/calendar";
import { demoTravelStops, inkrouteDemoArtist, inkrouteDemoTenant } from "@inkroute/config";

export const dynamic = "force-static";

export async function GET(_request: Request, context: { params: Promise<{ tenantSlug: string; artistSlug: string }> }) {
  const { tenantSlug, artistSlug } = await context.params;
  if (tenantSlug !== inkrouteDemoTenant.slug || artistSlug !== inkrouteDemoArtist.slug) {
    return Response.json({ ok: false, error: { code: "NOT_FOUND", message: "No demo travel calendar exists for this tenant or artist." } }, { status: 404 });
  }

  const body = buildTravelScheduleIcs(`${inkrouteDemoArtist.displayName} travel schedule`, demoTravelStops);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${artistSlug}-travel.ics"`,
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "X-InkRoute-Status": "static-demo-not-signed",
      "X-InkRoute-Gaps": "GAP-009,GAP-055",
    },
  });
}
