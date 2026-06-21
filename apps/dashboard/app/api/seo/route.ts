import { buildSeoPublicationMutationPlan, type SeoPublicationAction, type SeoPublishableModel, type SeoRouteRecord } from "@inkroute/seo";
import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { dashboardSeoRouteRecords } from "../../../lib/seoDemo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

function jsonObject(value: unknown): Record<string, unknown> | unknown[] | null {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown> | unknown[];
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function objectValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

function publicationAction(value: unknown): SeoPublicationAction {
  if (value === "create" || value === "update" || value === "publish" || value === "archive" || value === "redirect") return value;
  return "update";
}

function publicationModel(value: unknown): SeoPublishableModel {
  if (value === "SeoStylePage" || value === "SeoRedirect") return value;
  return "SeoCityPage";
}

function pageStatus(action: SeoPublicationAction, value: unknown) {
  if (action === "publish") return "published" as const;
  if (action === "archive") return "archived" as const;
  if (value === "published" || value === "archived") return value;
  return "draft" as const;
}

function canonicalPathFor(model: SeoPublishableModel, payload: Record<string, unknown>): string {
  const explicit = stringValue(payload.canonicalPath);
  if (explicit) return explicit.startsWith("/") ? explicit : `/${explicit}`;
  const slug = stringValue(payload.slug, "draft");
  if (model === "SeoStylePage") return `/styles/${slug}`;
  if (model === "SeoRedirect") return stringValue(payload.fromPath, `/${slug}`);
  return `/cities/${slug}`;
}

function routeRecordFor(model: SeoPublishableModel, action: SeoPublicationAction, payload: Record<string, unknown>): SeoRouteRecord {
  const canonicalPath = canonicalPathFor(model, payload);
  const status = pageStatus(action, payload.status);
  const kind: SeoRouteRecord["kind"] = model === "SeoStylePage" ? "style" : model === "SeoCityPage" ? "city" : "static";
  const city = optionalString(payload.city);
  const region = optionalString(payload.region);
  const style = optionalString(payload.styleName);
  return {
    path: canonicalPath,
    canonicalPath,
    kind,
    title: stringValue(payload.title, "Draft SEO page"),
    description: stringValue(payload.metaDescription, "Draft SEO metadata pending editorial review."),
    status,
    indexMode: status === "published" ? "index" : "noindex",
    priority: 0.7,
    changeFrequency: "monthly",
    lastModified: new Date().toISOString(),
    ...(city ? { city } : {}),
    ...(region ? { region } : {}),
    ...(style ? { style } : {}),
    relatedPortfolioIds: stringArray(payload.featuredPortfolioIds),
    revalidationTags: [`seo:${model}:${canonicalPath}`],
  };
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

type SeoPageStatus = "draft" | "published" | "archived";
type SeoCityPageRow = {
  id: string;
  tenantId: string;
  slug: string;
  city: string;
  region: string;
  country: string;
  title: string;
  metaDescription: string | null;
  canonicalPath: string | null;
  status: SeoPageStatus;
  heroCopy: string | null;
  faq: unknown;
  internalLinks: unknown;
  publishedAt: Date | null;
  updatedAt: Date;
  featuredPortfolio: { id: string; title: string; slug: string; isPublic: boolean }[];
};

type SeoStylePageRow = {
  id: string;
  tenantId: string;
  slug: string;
  styleName: string;
  title: string;
  metaDescription: string | null;
  canonicalPath: string | null;
  status: SeoPageStatus;
  bodyCopy: string | null;
  faq: unknown;
  internalLinks: unknown;
  publishedAt: Date | null;
  updatedAt: Date;
  featuredPortfolio: { id: string; title: string; slug: string; isPublic: boolean }[];
};

type SeoRedirectRow = {
  id: string;
  tenantId: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  isActive: boolean;
  updatedAt: Date;
};

function mutationResponse(plan: ReturnType<typeof buildSeoPublicationMutationPlan>, status = 200, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    {
      ok: plan.canCommit,
      plan,
      gapIds: ["GAP-071", "GAP-076"],
      boundary: "SEO publication mutations are tenant-scoped, RBAC-gated, transaction-backed, audited, and revalidation-ready.",
      ...extra,
    },
    { status, headers: noStoreHeaders },
  );
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "seo:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read SEO records." } }, { status: 403, headers: noStoreHeaders });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query SEO records for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const limit = Math.min(Math.max(Number(params.get("limit") ?? 100), 1), 200);

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_DASHBOARD_READS_NOT_CONFIGURED",
            message: "Production dashboard SEO reads require DB-backed actor resolution and tenant-scoped repository data; local fallback demo payloads are disabled.",
            gapIds: ["GAP-037", "GAP-071", "GAP-072", "GAP-076"],
          },
          productionBoundary: { localDashboardReadFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

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
      { headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [cityPages, stylePages, redirects] = await Promise.all([
        (tx.seoCityPage as { findMany: (args: unknown) => Promise<SeoCityPageRow[]> }).findMany({
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
        (tx.seoStylePage as { findMany: (args: unknown) => Promise<SeoStylePageRow[]> }).findMany({
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
        (tx.seoRedirect as { findMany: (args: unknown) => Promise<SeoRedirectRow[]> }).findMany({
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

    const cityRoutes = result.cityPages.map((page: SeoCityPageRow) => ({
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
      featuredPortfolio: page.featuredPortfolio.filter((item: { id: string; isPublic: boolean; title: string; slug: string }) => item.isPublic).map((item) => ({ id: item.id, title: item.title, slug: item.slug })),
      publishedAt: page.publishedAt?.toISOString() ?? null,
      updatedAt: page.updatedAt.toISOString(),
    }));
    const styleRoutes = result.stylePages.map((page: SeoStylePageRow) => ({
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
      featuredPortfolio: page.featuredPortfolio.filter((item: { id: string; isPublic: boolean; title: string; slug: string }) => item.isPublic).map((item) => ({ id: item.id, title: item.title, slug: item.slug })),
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
        redirects: result.redirects.map((redirect: SeoRedirectRow) => ({
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
      { headers: noStoreHeaders },
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
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "SEO_READ_FAILED", message: "SEO records could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(request: NextRequest) {
  return mutateSeoPublication(request);
}

export async function PATCH(request: NextRequest) {
  return mutateSeoPublication(request);
}

async function mutateSeoPublication(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "seo:write");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to mutate SEO records." } }, { status: 403, headers: noStoreHeaders });
  }

  const body = objectValue(await request.json().catch(() => ({})));
  const tenantId = stringValue(body.tenantId, actor.tenantId);
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot mutate SEO records for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const action = publicationAction(body.action);
  const model = publicationModel(body.model);
  const route = routeRecordFor(model, action, body);
  const idempotencyKey = optionalString(request.headers.get("idempotency-key")) ?? optionalString(body.idempotencyKey);
  const redirectFromPath = optionalString(body.fromPath);
  const redirectToPath = optionalString(body.toPath);
  const plan = buildSeoPublicationMutationPlan({
    action,
    model,
    tenantId,
    actorId: actor.actorUserId,
    actorRole: actor.role,
    route,
    now: new Date().toISOString(),
    targetStatus: pageStatus(action, body.status),
    ...(idempotencyKey ? { idempotencyKey } : {}),
    relatedFaqIds: stringArray(body.relatedFaqIds),
    relatedReviewIds: stringArray(body.relatedReviewIds),
    relatedImageIds: stringArray(body.relatedImageIds),
    ...(redirectFromPath ? { redirectFromPath } : {}),
    ...(redirectToPath ? { redirectToPath } : {}),
  });

  if (!plan.canCommit) {
    return mutationResponse(plan, plan.status === "invalid" ? 422 : 403);
  }

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_DASHBOARD_WRITES_NOT_CONFIGURED",
            message: "Production dashboard SEO publication writes require DB-backed actor resolution and tenant-scoped persistence; local fallback mutation plans are disabled.",
            gapIds: ["GAP-071", "GAP-076"],
          },
          plan,
          productionBoundary: { localDashboardWriteFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return mutationResponse(plan, 202, {
      persistence: "dry-run",
      boundary: "Local fallback returns a SEO publication mutation contract with idempotency, revalidation, and audit metadata; database mode is required to commit publishing writes.",
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let entityId = stringValue(body.id);

      if (model === "SeoRedirect") {
        const redirect = await tx.seoRedirect.upsert({
          where: { tenantId_fromPath: { tenantId, fromPath: stringValue(body.fromPath, route.canonicalPath) } },
          create: {
            tenantId,
            fromPath: stringValue(body.fromPath, route.canonicalPath),
            toPath: stringValue(body.toPath, "/"),
            statusCode: Number(body.statusCode ?? 301),
            isActive: action !== "archive",
          },
          update: {
            toPath: stringValue(body.toPath, "/"),
            statusCode: Number(body.statusCode ?? 301),
            isActive: action !== "archive",
          },
          select: { id: true },
        });
        entityId = redirect.id;
      } else if (model === "SeoStylePage") {
        const status = pageStatus(action, body.status);
        const style = await tx.seoStylePage.upsert({
          where: { tenantId_slug: { tenantId, slug: stringValue(body.slug, route.canonicalPath.replace(/^\/styles\//, "")) } },
          create: {
            tenantId,
            slug: stringValue(body.slug, route.canonicalPath.replace(/^\/styles\//, "")),
            styleName: stringValue(body.styleName, route.style ?? "Tattoo style"),
            title: route.title,
            metaDescription: route.description,
            canonicalPath: route.canonicalPath,
            status,
            bodyCopy: optionalString(body.bodyCopy),
            faq: jsonObject(body.faq),
            internalLinks: jsonObject(body.internalLinks),
            publishedAt: status === "published" ? new Date() : null,
          },
          update: {
            styleName: stringValue(body.styleName, route.style ?? "Tattoo style"),
            title: route.title,
            metaDescription: route.description,
            canonicalPath: route.canonicalPath,
            status,
            bodyCopy: optionalString(body.bodyCopy),
            faq: jsonObject(body.faq),
            internalLinks: jsonObject(body.internalLinks),
            publishedAt: status === "published" ? new Date() : null,
          },
          select: { id: true },
        });
        entityId = style.id;
      } else {
        const status = pageStatus(action, body.status);
        const city = await tx.seoCityPage.upsert({
          where: { tenantId_slug: { tenantId, slug: stringValue(body.slug, route.canonicalPath.replace(/^\/cities\//, "")) } },
          create: {
            tenantId,
            slug: stringValue(body.slug, route.canonicalPath.replace(/^\/cities\//, "")),
            city: stringValue(body.city, route.city ?? "City"),
            region: stringValue(body.region, route.region ?? "Region"),
            country: stringValue(body.country, "US"),
            title: route.title,
            metaDescription: route.description,
            canonicalPath: route.canonicalPath,
            status,
            heroCopy: optionalString(body.heroCopy),
            faq: jsonObject(body.faq),
            internalLinks: jsonObject(body.internalLinks),
            publishedAt: status === "published" ? new Date() : null,
          },
          update: {
            city: stringValue(body.city, route.city ?? "City"),
            region: stringValue(body.region, route.region ?? "Region"),
            country: stringValue(body.country, "US"),
            title: route.title,
            metaDescription: route.description,
            canonicalPath: route.canonicalPath,
            status,
            heroCopy: optionalString(body.heroCopy),
            faq: jsonObject(body.faq),
            internalLinks: jsonObject(body.internalLinks),
            publishedAt: status === "published" ? new Date() : null,
          },
          select: { id: true },
        });
        entityId = city.id;
      }

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: plan.auditAction,
          entityType: model,
          entityId,
          metadata: {
            idempotencyKey: plan.idempotencyKey,
            writes: plan.writes,
            revalidation: plan.revalidation,
            relatedFaqIds: stringArray(body.relatedFaqIds),
            relatedReviewIds: stringArray(body.relatedReviewIds),
            relatedImageIds: stringArray(body.relatedImageIds),
          },
        },
        select: { id: true },
      });

      return { entityId, auditId: audit.id };
    });

    return mutationResponse(plan, action === "create" ? 201 : 200, {
      persistence: "database",
      entityId: result.entityId,
      auditId: result.auditId,
      revalidation: plan.revalidation,
    });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          tenantId,
          error: { code: "DATABASE_UNAVAILABLE", message: "SEO publication writes require the dashboard database connection." },
          plan,
          gapIds: ["GAP-071", "GAP-076"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "SEO_WRITE_FAILED", message: "SEO record could not be mutated." } }, { status: 500, headers: noStoreHeaders });
  }
}
