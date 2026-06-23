import { NextResponse } from "next/server";
import {
  buildLocalPublicContentResponse,
  buildPublicContentProductionBoundary,
  isPublicContentDatabaseUnavailable,
  publicContentNoStoreHeaders,
  readPublicSeoStylePage,
  resolvePublicTenantScope,
} from "../../../../../../../lib/publicContentApi";

export async function GET(_request: Request, context: { params: Promise<{ tenantSlug: string; styleSlug: string }> }) {
  const { tenantSlug, styleSlug } = await context.params;
  const tenant = await resolvePublicTenantScope(tenantSlug);
  const normalizedStyleSlug = decodeURIComponent(styleSlug).toLowerCase().trim();

  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_NOT_FOUND", message: "Public style SEO content is unavailable for unknown tenant slug." } },
      { status: 404, headers: publicContentNoStoreHeaders },
    );
  }

  if (process.env.NODE_ENV === "production" && tenant.source === "local-fallback") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_PUBLIC_CONTENT_NOT_CONFIGURED",
          message: "Production style SEO reads require database-backed tenant content; local fallback content is disabled.",
        },
        productionBoundary: buildPublicContentProductionBoundary("seo-style"),
      },
      { status: 503, headers: publicContentNoStoreHeaders },
    );
  }

  try {
    if (tenant.source === "database") {
      const page = await readPublicSeoStylePage(tenant.tenantId, normalizedStyleSlug);
      if (!page) {
        return NextResponse.json(
          { ok: false, error: { code: "SEO_STYLE_PAGE_NOT_FOUND", message: "Published style SEO page was not found for this tenant." } },
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
            collection: "stylePages",
            data: page,
            redactedFields: ["tenantId", "tattooStyleId", "internalLinks.private", "draftBody"],
            cachePolicy: { strategy: "tenant-revalidated", revalidateSeconds: 300 },
            boundary: "Public style SEO page reads published tenant-scoped database content only.",
            gapIds: ["GAP-026", "GAP-071", "GAP-072", "GAP-076"],
          },
        },
        { headers: publicContentNoStoreHeaders },
      );
    }

    const local = buildLocalPublicContentResponse(tenantSlug, tenant, "stylePages", (page) => page.slug === normalizedStyleSlug);
    if (!local || local.data.length === 0) {
      return NextResponse.json(
        { ok: false, error: { code: "SEO_STYLE_PAGE_NOT_FOUND", message: "Local style SEO page was not found for this tenant." } },
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
            message: "Production style SEO reads require database-backed content; local fallback content is disabled.",
          },
          productionBoundary: buildPublicContentProductionBoundary("seo-style"),
        },
        { status: 503, headers: publicContentNoStoreHeaders },
      );
    }

    const local = buildLocalPublicContentResponse(tenantSlug, { tenantId: tenant.tenantId, source: "local-fallback" }, "stylePages", (page) => page.slug === normalizedStyleSlug);
    if (!local || local.data.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PUBLIC_CONTENT_FALLBACK_UNAVAILABLE",
            message: "Style SEO database read failed and no tenant-safe local fallback exists for this slug.",
          },
          productionBoundary: buildPublicContentProductionBoundary("seo-style"),
        },
        { status: 503, headers: publicContentNoStoreHeaders },
      );
    }
    return NextResponse.json({ ok: true, data: { ...local, data: local.data[0] } }, { headers: publicContentNoStoreHeaders });
  }
}
