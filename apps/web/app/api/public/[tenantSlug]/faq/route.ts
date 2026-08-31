import { NextResponse } from "next/server";
import { publicReadQuerySchema } from "@inkroute/validators";
import {
  buildLocalPublicContentResponse,
  buildPublicContentProductionBoundary,
  buildSafeLocalPublicContentRouteResponse,
  isPublicContentDatabaseUnavailable,
  publicContentNoStoreHeaders,
  resolvePublicTenantScope,
} from "../../../../../lib/publicContentApi";

export async function GET(request: Request, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  const query = publicReadQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Public FAQ query parameters are invalid.", issues: query.error.flatten() } },
      { status: 400, headers: publicContentNoStoreHeaders },
    );
  }

  const tenant = await resolvePublicTenantScope(tenantSlug);

  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_NOT_FOUND", message: "Public FAQ is unavailable for unknown tenant slug." } },
      { status: 404, headers: publicContentNoStoreHeaders },
    );
  }

  if (process.env.NODE_ENV === "production" && tenant.source === "local-fallback") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_PUBLIC_CONTENT_NOT_CONFIGURED",
          message: "Production public FAQ reads require database-backed tenant content; local fallback content is disabled.",
        },
        productionBoundary: buildPublicContentProductionBoundary("faq"),
      },
      { status: 503, headers: publicContentNoStoreHeaders },
    );
  }

  try {
    const local = buildLocalPublicContentResponse(tenantSlug, tenant, "faqs");
    if (!local) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PUBLIC_CONTENT_FALLBACK_UNAVAILABLE",
            message: "Public FAQ fallback is unavailable for this slug.",
          },
          productionBoundary: buildPublicContentProductionBoundary("faq"),
        },
        { status: 503, headers: publicContentNoStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          ...buildSafeLocalPublicContentRouteResponse(local, "faqs", query.data.limit),
          boundary:
            "FAQ currently serves tenant-safe public content bundle entries; durable FAQ CMS rows remain part of the SEO publication persistence gap.",
          gapIds: ["GAP-026", "GAP-071", "GAP-076"],
        },
      },
      { headers: publicContentNoStoreHeaders },
    );
  } catch (error) {
    if (!isPublicContentDatabaseUnavailable(error)) throw error;

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PROVIDER_PUBLIC_CONTENT_NOT_CONFIGURED",
            message: "Production public FAQ reads require database-backed content; local fallback content is disabled.",
          },
          productionBoundary: buildPublicContentProductionBoundary("faq"),
        },
        { status: 503, headers: publicContentNoStoreHeaders },
      );
    }

    const local = buildLocalPublicContentResponse(tenantSlug, { tenantId: tenant.tenantId, source: "local-fallback" }, "faqs");
    if (!local) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PUBLIC_CONTENT_FALLBACK_UNAVAILABLE",
            message: "Public FAQ database read failed and no tenant-safe local fallback exists for this slug.",
          },
          productionBoundary: buildPublicContentProductionBoundary("faq"),
        },
        { status: 503, headers: publicContentNoStoreHeaders },
      );
    }
    return NextResponse.json({ ok: true, data: local ? buildSafeLocalPublicContentRouteResponse(local, "faqs", query.data.limit) : local }, { headers: publicContentNoStoreHeaders });
  }
}
