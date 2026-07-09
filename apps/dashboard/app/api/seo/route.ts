import {
  buildSeoPublicationMutationPlan,
  type SeoPublicationAction,
  type SeoPublicationMutationPlan,
  type SeoPublishableModel,
  type SeoRouteRecord,
} from "@inkroute/seo";
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
  featuredPortfolio: { title: string; slug: string; isPublic: boolean }[];
};

type SeoStylePageRow = {
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
  featuredPortfolio: { title: string; slug: string; isPublic: boolean }[];
};

type SeoRedirectRow = {
  fromPath: string;
  toPath: string;
  statusCode: number;
  isActive: boolean;
  updatedAt: Date;
};

function buildSafeSeoRevalidationResponse(plan: SeoPublicationMutationPlan) {
  return {
    pathCount: plan.revalidation.paths.length,
    tagCount: plan.revalidation.tags.length,
    requiresRuntime: plan.revalidation.requiresRuntime,
    providerBoundary: plan.revalidation.providerBoundary,
    rawPathsEchoed: false,
    rawTagsEchoed: false,
    rawReasonEchoed: false,
  };
}

function buildSafeSeoPublicationPlanResponse(plan: SeoPublicationMutationPlan) {
  return {
    status: plan.status,
    action: plan.action,
    model: plan.model,
    actorRole: plan.actorRole,
    targetStatus: plan.targetStatus,
    canCommit: plan.canCommit,
    requiresTenantScope: plan.requiresTenantScope,
    requiresRbac: plan.requiresRbac,
    requiresAuditLog: plan.requiresAuditLog,
    requiresTransaction: plan.requiresTransaction,
    blockers: plan.blockers,
    writeModels: plan.writes.map((write) => write.model),
    writeOperations: plan.writes.map((write) => write.operation),
    revalidation: buildSafeSeoRevalidationResponse(plan),
    idempotencyKeyPresent: Boolean(plan.idempotencyKey),
    rawActorIdEchoed: false,
    rawIdempotencyKeyEchoed: false,
    rawWriteSummariesEchoed: false,
    rawRevalidationPathsEchoed: false,
    rawRevalidationTagsEchoed: false,
    rawRoutePayloadEchoed: false,
    tenantIdEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function mutationResponse(plan: ReturnType<typeof buildSeoPublicationMutationPlan>, status = 200, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    {
      ok: plan.canCommit,
      tenantScope: { actorTenantMatched: true },
      plan: buildSafeSeoPublicationPlanResponse(plan),
      tenantIdEchoed: false,
      gapIds: ["GAP-071", "GAP-076"],
      boundary: "SEO publication mutations are tenant-scoped, RBAC-gated, transaction-backed, audited, and revalidation-ready.",
      ...extra,
    },
    { status, headers: noStoreHeaders },
  );
}

function seoPublicationAssociationRows(input: {
  tenantId: string;
  entityType: SeoPublishableModel;
  entityId: string;
  relatedFaqIds: readonly string[];
  relatedReviewIds: readonly string[];
  relatedImageIds: readonly string[];
}) {
  return [
    ...input.relatedFaqIds.map((relatedId) => ({ tenantId: input.tenantId, entityType: input.entityType, entityId: input.entityId, relatedKind: "faq", relatedId })),
    ...input.relatedReviewIds.map((relatedId) => ({ tenantId: input.tenantId, entityType: input.entityType, entityId: input.entityId, relatedKind: "review", relatedId })),
    ...input.relatedImageIds.map((relatedId) => ({ tenantId: input.tenantId, entityType: input.entityType, entityId: input.entityId, relatedKind: "image", relatedId })),
  ];
}

function buildSeoReadResponseProjection() {
  return {
    tenantIdEchoed: false,
    seoPageIdsEchoed: false,
    redirectIdsEchoed: false,
    portfolioItemIdsEchoed: false,
    auditIdEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildSafeDashboardSeoRouteRecord(record: (typeof dashboardSeoRouteRecords)[number]) {
  const { relatedPortfolioIds: _relatedPortfolioIds, ...safeRecord } = record;
  return {
    ...safeRecord,
    relatedPortfolioLinked: Array.isArray(record.relatedPortfolioIds) && record.relatedPortfolioIds.length > 0,
  };
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
          error: {
            code: "PROVIDER_DASHBOARD_READS_NOT_CONFIGURED",
            message: "Production dashboard SEO reads require DB-backed actor resolution and tenant-scoped repository data; local fallback demo payloads are disabled.",
            gapIds: ["GAP-037", "GAP-071", "GAP-072", "GAP-076"],
          },
          productionBoundary: { localDashboardReadFallbackDisabled: true },
          ...buildSeoReadResponseProjection(),
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "local-fallback",
        count: dashboardSeoRouteRecords.length,
        routes: dashboardSeoRouteRecords.slice(0, limit).map(buildSafeDashboardSeoRouteRecord),
        ...buildSeoReadResponseProjection(),
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
            featuredPortfolio: { select: { title: true, slug: true, isPublic: true } },
          },
        }),
        (tx.seoStylePage as { findMany: (args: unknown) => Promise<SeoStylePageRow[]> }).findMany({
          where: { tenantId },
          orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
          take: limit,
          select: {
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
            featuredPortfolio: { select: { title: true, slug: true, isPublic: true } },
          },
        }),
        (tx.seoRedirect as { findMany: (args: unknown) => Promise<SeoRedirectRow[]> }).findMany({
          where: { tenantId },
          orderBy: { updatedAt: "desc" },
          take: limit,
          select: { fromPath: true, toPath: true, statusCode: true, isActive: true, updatedAt: true },
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
      featuredPortfolio: page.featuredPortfolio.filter((item) => item.isPublic).map((item) => ({ title: item.title, slug: item.slug })),
      featuredPortfolioLinked: page.featuredPortfolio.some((item) => item.isPublic),
      publishedAt: page.publishedAt?.toISOString() ?? null,
      updatedAt: page.updatedAt.toISOString(),
    }));
    const styleRoutes = result.stylePages.map((page: SeoStylePageRow) => ({
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
      featuredPortfolio: page.featuredPortfolio.filter((item) => item.isPublic).map((item) => ({ title: item.title, slug: item.slug })),
      featuredPortfolioLinked: page.featuredPortfolio.some((item) => item.isPublic),
      publishedAt: page.publishedAt?.toISOString() ?? null,
      updatedAt: page.updatedAt.toISOString(),
    }));

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "database",
        count: cityRoutes.length + styleRoutes.length,
        routes: [...cityRoutes, ...styleRoutes],
        redirects: result.redirects.map((redirect: SeoRedirectRow) => ({
          fromPath: redirect.fromPath,
          toPath: redirect.toPath,
          statusCode: redirect.statusCode,
          isActive: redirect.isActive,
          updatedAt: redirect.updatedAt.toISOString(),
        })),
        auditLogged: true,
        ...buildSeoReadResponseProjection(),
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
          error: { code: "DATABASE_UNAVAILABLE", message: "SEO reads require the dashboard database connection." },
          ...buildSeoReadResponseProjection(),
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
          tenantScope: { actorTenantMatched: true },
          tenantIdEchoed: false,
          error: {
            code: "PROVIDER_DASHBOARD_WRITES_NOT_CONFIGURED",
            message: "Production dashboard SEO publication writes require DB-backed actor resolution and tenant-scoped persistence; local fallback mutation plans are disabled.",
            gapIds: ["GAP-071", "GAP-076"],
          },
          plan: buildSafeSeoPublicationPlanResponse(plan),
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
      const publicationTx = tx as typeof tx & {
        seoPublicationRevalidationJob: { create(args: unknown): Promise<unknown> };
        seoPublicationAssociation: { createMany(args: unknown): Promise<unknown> };
      };
      const idempotencyScope = "seo-publication";
      const existingIdempotency = await tx.idempotencyKey.findUnique({
        where: { tenantId_scope_key: { tenantId, scope: idempotencyScope, key: plan.idempotencyKey } },
        select: { status: true },
      });
      if (existingIdempotency) {
        return { duplicate: true as const, entityPersisted: true, auditLogged: false, idempotencyRecorded: true };
      }

      const idempotency = await tx.idempotencyKey.create({
        data: {
          tenantId,
          scope: idempotencyScope,
          key: plan.idempotencyKey,
          status: "claimed",
          metadata: {
            model,
            action,
            revalidationTagCount: plan.revalidation.length,
            relatedFaqCount: stringArray(body.relatedFaqIds).length,
            relatedReviewCount: stringArray(body.relatedReviewIds).length,
            relatedImageCount: stringArray(body.relatedImageIds).length,
            rawRevalidationTagsStored: false,
            internalPersistenceIdsStored: false,
          },
        },
        select: { id: true },
      });
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
            idempotencyPersisted: true,
            writePlanPersisted: true,
            writeCount: plan.writes.length,
            revalidationTagCount: plan.revalidation.length,
            relatedFaqCount: stringArray(body.relatedFaqIds).length,
            relatedReviewCount: stringArray(body.relatedReviewIds).length,
            relatedImageCount: stringArray(body.relatedImageIds).length,
            rawIdempotencyKeyStored: false,
            rawWriteSummariesStored: false,
            rawRevalidationTagsStored: false,
            internalPersistenceIdsStored: false,
          },
        },
        select: { id: true },
      });

      await publicationTx.seoPublicationRevalidationJob.create({
        data: {
          tenantId,
          entityType: model,
          entityId,
          action,
          tags: plan.revalidation,
          status: "queued",
          auditLogId: audit.id,
          metadata: {
            idempotencyPersisted: true,
            writePlanPersisted: true,
            writeCount: plan.writes.length,
            rawIdempotencyKeyStored: false,
            internalPersistenceIdsStored: false,
          },
        },
      });

      const associationRows = seoPublicationAssociationRows({
        tenantId,
        entityType: model,
        entityId,
        relatedFaqIds: stringArray(body.relatedFaqIds),
        relatedReviewIds: stringArray(body.relatedReviewIds),
        relatedImageIds: stringArray(body.relatedImageIds),
      });
      if (associationRows.length > 0) {
        await publicationTx.seoPublicationAssociation.createMany({ data: associationRows, skipDuplicates: true });
      }

      await tx.idempotencyKey.update({
        where: { id: idempotency.id },
        data: { status: "completed", result: { entityPersisted: true, auditLogged: true, internalPersistenceIdsStored: false } },
      });

      return { duplicate: false as const, entityPersisted: Boolean(entityId), auditLogged: Boolean(audit.id), idempotencyRecorded: Boolean(idempotency.id) };
    });

    if (result.duplicate) {
      return mutationResponse(plan, 200, {
        persistence: "database",
        duplicate: true,
        entityPersisted: true,
        idempotencyReplay: true,
        entityIdEchoed: false,
        auditIdEchoed: false,
        idempotencyKeyIdEchoed: false,
        internalPersistenceIdsEchoed: false,
      });
    }

    return mutationResponse(plan, action === "create" ? 201 : 200, {
      persistence: "database",
      entityPersisted: result.entityPersisted,
      entityIdEchoed: false,
      auditLogged: result.auditLogged,
      idempotencyRecorded: result.idempotencyRecorded,
      auditIdEchoed: false,
      idempotencyKeyIdEchoed: false,
      internalPersistenceIdsEchoed: false,
      revalidation: buildSafeSeoRevalidationResponse(plan),
      associationPersistence: "database",
    });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          tenantScope: { actorTenantMatched: true },
          tenantIdEchoed: false,
          error: { code: "DATABASE_UNAVAILABLE", message: "SEO publication writes require the dashboard database connection." },
          plan: buildSafeSeoPublicationPlanResponse(plan),
          gapIds: ["GAP-071", "GAP-076"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "SEO_WRITE_FAILED", message: "SEO record could not be mutated." } }, { status: 500, headers: noStoreHeaders });
  }
}
