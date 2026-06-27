import { NextResponse } from "next/server";
import {
  buildLocalPublicContentResponse,
  buildPublicContentProductionBoundary,
  isPublicContentDatabaseUnavailable,
  publicContentNoStoreHeaders,
  readPublicSeoCityPage,
  resolvePublicTenantScope,
} from "../../../../../../../lib/publicContentApi";

export async function GET(_request: Request, context: { params: Promise<{ tenantSlug: string; citySlug: string }> }) {
  const { tenantSlug, citySlug } = await context.params;
  const tenant = await resolvePublicTenantScope(tenantSlug);
  const normalizedCitySlug = decodeURIComponent(citySlug).toLowerCase().trim();

  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_NOT_FOUND", message: "Public city SEO content is unavailable for unknown tenant slug." } },
      { status: 404, headers: publicContentNoStoreHeaders },
    );
  }

  if (process.env.NODE_ENV === "production" && tenant.source === "local-fallback") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_PUBLIC_CONTENT_NOT_CONFIGURED",
          message: "Production city SEO reads require database-backed tenant content; local fallback content is disabled.",
        },
        productionBoundary: buildPublicContentProductionBoundary("seo-city"),
      },
      { status: 503, headers: publicContentNoStoreHeaders },
    );
  }

  try {
    if (tenant.source === "database") {
      const page = await readPublicSeoCityPage(tenant.tenantId, normalizedCitySlug);
      if (!page) {
        return NextResponse.json(
          { ok: false, error: { code: "SEO_CITY_PAGE_NOT_FOUND", message: "Published city SEO page was not found for this tenant." } },
          { status: 404, headers: publicContentNoStoreHeaders },
        );
      }

      return NextResponse.json(
        {
          ok: true,
          data: {
            tenantSlug,
            tenantId: tenant.tenantId,
            source: tenant.source,
            persistence: "database",
            collection: "cityPages",
            data: page,
            redactedFields: ["tenantId", "travelCityId", "internalLinks.private", "draftBody"],
            cachePolicy: { strategy: "tenant-revalidated", revalidateSeconds: 300 },
            boundary: "Public city SEO page reads published tenant-scoped database content only.",
            gapIds: ["GAP-026", "GAP-071", "GAP-072", "GAP-076"],
          },
        },
        { headers: publicContentNoStoreHeaders },
      );
    }

    const local = buildLocalPublicContentResponse(tenantSlug, tenant, "cityPages", (page) => page.slug === normalizedCitySlug);
    if (!local || local.data.length === 0) {
      return NextResponse.json(
        { ok: false, error: { code: "SEO_CITY_PAGE_NOT_FOUND", message: "Local city SEO page was not found for this tenant." } },
        { status: 404, headers: publicContentNoStoreHeaders },
      );
    }
    return NextResponse.json({ ok: true, data: { ...local, data: local.data[0] } }, { headers: publicContentNoStoreHeaders });
  } catch (error) {
    if (!isPublicContentDatabaseUnavailable(error)) throw error;

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PROVIDER_PUBLIC_CONTENT_NOT_CONFIGURED",
            message: "Production city SEO reads require database-backed content; local fallback content is disabled.",
          },
          productionBoundary: buildPublicContentProductionBoundary("seo-city"),
        },
        { status: 503, headers: publicContentNoStoreHeaders },
      );
    }

    const local = buildLocalPublicContentResponse(tenantSlug, { tenantId: tenant.tenantId, source: "local-fallback" }, "cityPages", (page) => page.slug === normalizedCitySlug);
    if (!local || local.data.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PUBLIC_CONTENT_FALLBACK_UNAVAILABLE",
            message: "City SEO database read failed and no tenant-safe local fallback exists for this slug.",
          },
          productionBoundary: buildPublicContentProductionBoundary("seo-city"),
        },
        { status: 503, headers: publicContentNoStoreHeaders },
      );
    }
    return NextResponse.json({ ok: true, data: { ...local, data: local.data[0] } }, { headers: publicContentNoStoreHeaders });
  }
}
