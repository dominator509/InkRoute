import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { dashboardSeoRouteRecords } from "../../lib/seoDemo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

function jsonObject(value: unknown): Record<string, unknown> | unknown[] | null {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown> | unknown[];
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "seo:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read SEO records." } }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query SEO records for another tenant." } }, { status: 403 });
  }

  const limit = Math.min(Math.max(Number(params.get("limit") ?? 100), 1), 200);

  if (actor.source === "local-fallback") {
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "local-fallback",
        count: dashboardSeoRouteRecords.length,
        routes: dashboardSeoRouteRecords.slice(0, limit),
        gapIds: ["GAP-037", "GAP-071", "GAP-072", "GAP-076"],
        boundary: "Local fallback returns demo SEO route records only; database mode is required for live SEO reads.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [cityPages, stylePages, redirects] = await Promise.all([
        tx.seoCityPage.findMany({
          where: { tenantId },
          orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
          take: limit,
          select: {
            id: true,
            tenantId: true,
            slug: true,
            city: true,
            region: true,
            country: true,
            title: true,
            metaDescription: true,
            canonicalPath: true,
            status: true,
            heroCopy: true,
            faq: true,
            internalLinks: true,
            publishedAt: true,
            updatedAt: true,
            featuredPortfolio: { select: { id: true, title: true, slug: true, isPublic: true } },
          },
        }),
        tx.seoStylePage.findMany({
          where: { tenantId },
          orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
          take: limit,
          select: {
            id: true,
            tenantId: true,
            slug: true,
            styleName: true,
            title: true,
            metaDescription: true,
            canonicalPath: true,
            status: true,
            bodyCopy: true,
            faq: true,
            internalLinks: true,
            publishedAt: true,
            updatedAt: true,
            featuredPortfolio: { select: { id: true, title: true, slug: true, isPublic: true } },
          },
        }),
        tx.seoRedirect.findMany({
          where: { tenantId },
          orderBy: { updatedAt: "desc" },
          take: limit,
          select: { id: true, tenantId: true, fromPath: true, toPath: true, statusCode: true, isActive: true, updatedAt: true },
        }),
      ]);

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "seo:read:list",
          entityType: "Seo",
          metadata: {
            source: "dashboard-api",
            cityPageCount: cityPages.length,
            stylePageCount: stylePages.length,
            redirectCount: redirects.length,
            cachePolicy: "no-store",
          },
        },
        select: { id: true },
      });

      return { cityPages, stylePages, redirects, audit };
    });

    const cityRoutes = result.cityPages.map((page) => ({
      id: page.id,
      tenantId: page.tenantId,
      kind: "city",
      slug: page.slug,
      title: page.title,
      metaDescription: page.metaDescription,
      canonicalPath: page.canonicalPath,
      status: page.status,
      indexMode: page.status === "published" ? "index" : "noindex",
      city: page.city,
      region: page.region,
      country: page.country,
      heroCopy: page.heroCopy,
      faq: jsonObject(page.faq),
      internalLinks: jsonObject(page.internalLinks),
      featuredPortfolio: page.featuredPortfolio.filter((item) => item.isPublic).map((item) => ({ id: item.id, title: item.title, slug: item.slug })),
      publishedAt: page.publishedAt?.toISOString() ?? null,
      updatedAt: page.updatedAt.toISOString(),
    }));
    const styleRoutes = result.stylePages.map((page) => ({
      id: page.id,
      tenantId: page.tenantId,
      kind: "style",
      slug: page.slug,
      title: page.title,
      metaDescription: page.metaDescription,
      canonicalPath: page.canonicalPath,
      status: page.status,
      indexMode: page.status === "published" ? "index" : "noindex",
      styleName: page.styleName,
      bodyCopy: page.bodyCopy,
      faq: jsonObject(page.faq),
      internalLinks: jsonObject(page.internalLinks),
      featuredPortfolio: page.featuredPortfolio.filter((item) => item.isPublic).map((item) => ({ id: item.id, title: item.title, slug: item.slug })),
      publishedAt: page.publishedAt?.toISOString() ?? null,
      updatedAt: page.updatedAt.toISOString(),
    }));

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        count: cityRoutes.length + styleRoutes.length,
        routes: [...cityRoutes, ...styleRoutes],
        redirects: result.redirects.map((redirect) => ({
          id: redirect.id,
          tenantId: redirect.tenantId,
          fromPath: redirect.fromPath,
          toPath: redirect.toPath,
          statusCode: redirect.statusCode,
          isActive: redirect.isActive,
          updatedAt: redirect.updatedAt.toISOString(),
        })),
        auditId: result.audit.id,
        gapIds: ["GAP-037", "GAP-071", "GAP-072", "GAP-076"],
        boundary: "Dashboard SEO reads are tenant-scoped, no-store, and audited; publish/revalidation/Search Console writes remain gated.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: { code: "DATABASE_UNAVAILABLE", message: "SEO reads require the dashboard database connection." },
          gapIds: ["GAP-037", "GAP-071", "GAP-072", "GAP-076"],
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "SEO_READ_FAILED", message: "SEO records could not be loaded." } }, { status: 500 });
  }
}
