import { NextResponse } from "next/server";
import { publicReadQuerySchema } from "@inkroute/validators";
import {
  buildLocalPublicContentResponse,
  buildPublicContentProductionBoundary,
  isPublicContentDatabaseUnavailable,
  publicContentNoStoreHeaders,
  readPublicPortfolioItems,
  resolvePublicTenantScope,
} from "../../../../../lib/publicContentApi";

export async function GET(request: Request, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  const query = publicReadQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Public portfolio query parameters are invalid.", issues: query.error.flatten() } },
      { status: 400, headers: publicContentNoStoreHeaders },
    );
  }

  const tenant = await resolvePublicTenantScope(tenantSlug);

  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_NOT_FOUND", message: "Public portfolio is unavailable for unknown tenant slug." } },
      { status: 404, headers: publicContentNoStoreHeaders },
    );
  }

  if (process.env.NODE_ENV === "production" && tenant.source === "local-fallback") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_PUBLIC_CONTENT_NOT_CONFIGURED",
          message: "Production public portfolio reads require database-backed tenant content; local fallback content is disabled.",
        },
        productionBoundary: buildPublicContentProductionBoundary("portfolio"),
      },
      { status: 503, headers: publicContentNoStoreHeaders },
    );
  }

  try {
    if (tenant.source === "database") {
      const items = await readPublicPortfolioItems(tenant.tenantId);
      const limitedItems = items.slice(0, query.data.limit);
      return NextResponse.json(
        {
          ok: true,
          data: {
            tenantSlug,
            tenantId: tenant.tenantId,
            source: tenant.source,
            persistence: "database",
            collection: "portfolioItems",
            query: { limit: query.data.limit },
            data: limitedItems,
            redactedFields: ["tenantId", "artistId", "attributionKey", "fileAsset.objectKey", "privateOriginal"],
            cachePolicy: { strategy: "tenant-revalidated", revalidateSeconds: 300 },
            boundary: "Public portfolio reads use tenant-scoped database rows and expose only public derivative image metadata.",
            gapIds: ["GAP-027", "GAP-028", "GAP-029", "GAP-076"],
          },
        },
        { headers: publicContentNoStoreHeaders },
      );
    }

    const local = buildLocalPublicContentResponse(tenantSlug, tenant, "portfolioItems");
    return NextResponse.json({ ok: true, data: local ? { ...local, query: { limit: query.data.limit }, portfolioItems: local.portfolioItems.slice(0, query.data.limit) } : local }, { headers: publicContentNoStoreHeaders });
  } catch (error) {
    if (!isPublicContentDatabaseUnavailable(error)) throw error;

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PROVIDER_PUBLIC_CONTENT_NOT_CONFIGURED",
            message: "Production public portfolio reads require database-backed content; local fallback content is disabled.",
          },
          productionBoundary: buildPublicContentProductionBoundary("portfolio"),
        },
        { status: 503, headers: publicContentNoStoreHeaders },
      );
    }

    const local = buildLocalPublicContentResponse(tenantSlug, { tenantId: tenant.tenantId, source: "local-fallback" }, "portfolioItems");
    if (!local) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PUBLIC_CONTENT_FALLBACK_UNAVAILABLE",
            message: "Public portfolio database read failed and no tenant-safe local fallback exists for this slug.",
          },
          productionBoundary: buildPublicContentProductionBoundary("portfolio"),
        },
        { status: 503, headers: publicContentNoStoreHeaders },
      );
    }
    return NextResponse.json({ ok: true, data: local ? { ...local, query: { limit: query.data.limit }, portfolioItems: local.portfolioItems.slice(0, query.data.limit) } : local }, { headers: publicContentNoStoreHeaders });
  }
}
