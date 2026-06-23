import { NextResponse } from "next/server";
import { publicReadQuerySchema } from "@inkroute/validators";
import {
  buildLocalPublicContentResponse,
  buildPublicContentProductionBoundary,
  isPublicContentDatabaseUnavailable,
  publicContentNoStoreHeaders,
  readPublicTestimonials,
  resolvePublicTenantScope,
} from "../../../../../lib/publicContentApi";

export async function GET(request: Request, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  const query = publicReadQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Public reviews query parameters are invalid.", issues: query.error.flatten() } },
      { status: 400, headers: publicContentNoStoreHeaders },
    );
  }

  const tenant = await resolvePublicTenantScope(tenantSlug);

  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_NOT_FOUND", message: "Public reviews are unavailable for unknown tenant slug." } },
      { status: 404, headers: publicContentNoStoreHeaders },
    );
  }

  if (process.env.NODE_ENV === "production" && tenant.source === "local-fallback") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_PUBLIC_CONTENT_NOT_CONFIGURED",
          message: "Production public review reads require database-backed tenant content; local fallback content is disabled.",
        },
        productionBoundary: buildPublicContentProductionBoundary("reviews"),
      },
      { status: 503, headers: publicContentNoStoreHeaders },
    );
  }

  try {
    if (tenant.source === "database") {
      const reviews = await readPublicTestimonials(tenant.tenantId);
      const limitedReviews = reviews.slice(0, query.data.limit);
      return NextResponse.json(
        {
          ok: true,
          data: {
            tenantSlug,
            tenantId: tenant.tenantId,
            source: tenant.source,
            persistence: "database",
            collection: "testimonials",
            query: { limit: query.data.limit },
            data: limitedReviews,
            redactedFields: ["clientId", "bookingRequestId", "email", "phone", "privateNotes"],
            cachePolicy: { strategy: "tenant-revalidated", revalidateSeconds: 300 },
            boundary: "Public reviews expose approved testimonial fields only and omit client/private booking metadata.",
            gapIds: ["GAP-027", "GAP-028", "GAP-076"],
          },
        },
        { headers: publicContentNoStoreHeaders },
      );
    }

    const local = buildLocalPublicContentResponse(tenantSlug, tenant, "testimonials");
    return NextResponse.json({ ok: true, data: local ? { ...local, query: { limit: query.data.limit }, testimonials: local.testimonials.slice(0, query.data.limit) } : local }, { headers: publicContentNoStoreHeaders });
  } catch (error) {
    if (!isPublicContentDatabaseUnavailable(error)) throw error;

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PROVIDER_PUBLIC_CONTENT_NOT_CONFIGURED",
            message: "Production public review reads require database-backed content; local fallback content is disabled.",
          },
          productionBoundary: buildPublicContentProductionBoundary("reviews"),
        },
        { status: 503, headers: publicContentNoStoreHeaders },
      );
    }

    const local = buildLocalPublicContentResponse(tenantSlug, { tenantId: tenant.tenantId, source: "local-fallback" }, "testimonials");
    if (!local) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PUBLIC_CONTENT_FALLBACK_UNAVAILABLE",
            message: "Public review database read failed and no tenant-safe local fallback exists for this slug.",
          },
          productionBoundary: buildPublicContentProductionBoundary("reviews"),
        },
        { status: 503, headers: publicContentNoStoreHeaders },
      );
    }
    return NextResponse.json({ ok: true, data: local ? { ...local, query: { limit: query.data.limit }, testimonials: local.testimonials.slice(0, query.data.limit) } : local }, { headers: publicContentNoStoreHeaders });
  }
}
