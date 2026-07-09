import { NextResponse } from "next/server";
import { publicReadQuerySchema } from "@inkroute/validators";
import {
  buildLocalPublicContentResponse,
  buildPublicContentProductionBoundary,
  buildSafeLocalPublicContentRouteResponse,
  isPublicContentDatabaseUnavailable,
  publicContentNoStoreHeaders,
  readPublicTravelStops,
  resolvePublicTenantScope,
} from "../../../../../lib/publicContentApi";

export async function GET(request: Request, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  const query = publicReadQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Public travel query parameters are invalid.", issues: query.error.flatten() } },
      { status: 400, headers: publicContentNoStoreHeaders },
    );
  }

  const tenant = await resolvePublicTenantScope(tenantSlug);

  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_NOT_FOUND", message: "Public travel schedule is unavailable for unknown tenant slug." } },
      { status: 404, headers: publicContentNoStoreHeaders },
    );
  }

  if (process.env.NODE_ENV === "production" && tenant.source === "local-fallback") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_PUBLIC_CONTENT_NOT_CONFIGURED",
          message: "Production public travel reads require database-backed tenant content; local fallback content is disabled.",
        },
        productionBoundary: buildPublicContentProductionBoundary("travel"),
      },
      { status: 503, headers: publicContentNoStoreHeaders },
    );
  }

  try {
    if (tenant.source === "database") {
      const stops = await readPublicTravelStops(tenant.tenantId);
      const limitedStops = stops.slice(0, query.data.limit);
      return NextResponse.json(
        {
          ok: true,
          data: {
            tenantSlug,
            source: tenant.source,
            persistence: "database",
            collection: "travelStops",
            query: { limit: query.data.limit },
            data: limitedStops,
            redactedFields: ["tenantId", "artistId", "internalNotes", "guestSpotUrl"],
            responseProjection: { tenantIdEchoed: false, internalPersistenceIdsEchoed: false, rawPrivateFieldsEchoed: false },
            cachePolicy: { strategy: "tenant-revalidated", revalidateSeconds: 300 },
            boundary: "Public travel reads use tenant-scoped database schedules and omit internal notes/provider metadata.",
            gapIds: ["GAP-027", "GAP-028", "GAP-055", "GAP-076"],
          },
        },
        { headers: publicContentNoStoreHeaders },
      );
    }

    const local = buildLocalPublicContentResponse(tenantSlug, tenant, "travelStops");
    return NextResponse.json({ ok: true, data: local ? buildSafeLocalPublicContentRouteResponse(local, "travelStops", query.data.limit) : local }, { headers: publicContentNoStoreHeaders });
  } catch (error) {
    if (!isPublicContentDatabaseUnavailable(error)) throw error;

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PROVIDER_PUBLIC_CONTENT_NOT_CONFIGURED",
            message: "Production public travel reads require database-backed content; local fallback content is disabled.",
          },
          productionBoundary: buildPublicContentProductionBoundary("travel"),
        },
        { status: 503, headers: publicContentNoStoreHeaders },
      );
    }

    const local = buildLocalPublicContentResponse(tenantSlug, { tenantId: tenant.tenantId, source: "local-fallback" }, "travelStops");
    if (!local) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PUBLIC_CONTENT_FALLBACK_UNAVAILABLE",
            message: "Public travel database read failed and no tenant-safe local fallback exists for this slug.",
          },
          productionBoundary: buildPublicContentProductionBoundary("travel"),
        },
        { status: 503, headers: publicContentNoStoreHeaders },
      );
    }
    return NextResponse.json({ ok: true, data: local ? buildSafeLocalPublicContentRouteResponse(local, "travelStops", query.data.limit) : local }, { headers: publicContentNoStoreHeaders });
  }
}
