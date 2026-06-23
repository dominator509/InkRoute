import { createHash } from "node:crypto";
import { buildTenantDashboardView } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { portfolioItemInputSchema } from "@inkroute/validators";
import { NextRequest, NextResponse } from "next/server";
import { dashboardProjectedPortfolio } from "../../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

export const runtime = "nodejs";

function redactAssetMetadata(metadata: unknown): Record<string, unknown> {
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) return {};
  return Object.fromEntries(
    Object.entries(metadata as Record<string, unknown>).map(([key, value]) => [
      key,
      /key|bucket|checksum|signed|url|token|client|private/i.test(key) ? "[redacted-dashboard-field]" : value,
    ]),
  );
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function hashIdempotencySubject(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function resultPortfolioItemId(result: unknown): string | null {
  if (!result || typeof result !== "object" || !("portfolioItemId" in result)) {
    return null;
  }

  const value = (result as { portfolioItemId?: unknown }).portfolioItemId;
  return typeof value === "string" && value.length > 0 ? value : null;
}

type PortfolioStyleRow = {
  slug: string | null;
  label: string | null;
};

type PortfolioBookingRequestRow = {
  id: string;
};

type PortfolioImageAssetRow = {
  id: string;
  kind: string;
  visibility: string;
  bucket: string | null;
  objectKey: string | null;
  checksumSha256: string | null;
  publicUrl: string | null;
  signedUrlExpiresAt: Date | null;
  metadata: Record<string, unknown> | null;
};

type PortfolioImageRow = {
  id: string;
  imageUrl: string;
  altText: string;
  width: number;
  height: number;
  isPrimary: boolean;
  fileAsset: PortfolioImageAssetRow | null;
};

type PortfolioListRow = {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  caption: string | null;
  placement: string | null;
  freshness: string | null;
  city: string | null;
  isPublic: boolean;
  isFeatured: boolean;
  publishedAt: Date | null;
  attributionKey: string | null;
  styles: PortfolioStyleRow[];
  attributedBookingRequests: PortfolioBookingRequestRow[];
  images: PortfolioImageRow[];
};

type PortfolioMutationRow = {
  id: string;
  tenantId: string;
  artistId: string;
  title: string;
  slug: string;
  isPublic: boolean;
  isFeatured: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  images: Array<{ id: string; imageUrl: string; altText: string; isPrimary: boolean }>;
};

type PortfolioItemMutationModel = {
  findUnique: (args: unknown) => Promise<{ id: string } | null>;
  findFirst: (args: unknown) => Promise<PortfolioMutationRow | null>;
  create: (args: unknown) => Promise<PortfolioMutationRow>;
};

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "portfolio:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read portfolio items." } }, { status: 403, headers: noStoreHeaders });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query portfolio items for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const limit = Math.min(Math.max(Number(params.get("limit") ?? 50), 1), 100);

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_DASHBOARD_READS_NOT_CONFIGURED",
            message: "Production dashboard portfolio reads require DB-backed actor resolution and tenant-scoped repository data; local fallback demo payloads are disabled.",
            gapIds: ["GAP-005", "GAP-007", "GAP-037", "GAP-040"],
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
        count: dashboardProjectedPortfolio.length,
        portfolio: dashboardProjectedPortfolio.slice(0, limit),
        gapIds: ["GAP-005", "GAP-007", "GAP-037", "GAP-040"],
        boundary: "Local fallback returns tenant-projected demo portfolio rows only; database mode is required for live portfolio reads.",
      },
      { headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const portfolioItemModel = tx.portfolioItem as { findMany: (args: unknown) => Promise<PortfolioListRow[]> };
      const rows = await portfolioItemModel.findMany({
        where: { tenantId },
        orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
        take: limit,
        select: {
          id: true,
          tenantId: true,
          title: true,
          slug: true,
          caption: true,
          placement: true,
          freshness: true,
          city: true,
          isPublic: true,
          isFeatured: true,
          publishedAt: true,
          attributionKey: true,
          styles: { select: { slug: true, label: true } },
          attributedBookingRequests: { select: { id: true } },
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            take: 3,
            select: {
              id: true,
              imageUrl: true,
              altText: true,
              width: true,
              height: true,
              isPrimary: true,
              fileAsset: {
                select: {
                  id: true,
                  kind: true,
                  visibility: true,
                  bucket: true,
                  objectKey: true,
                  checksumSha256: true,
                  publicUrl: true,
                  signedUrlExpiresAt: true,
                  metadata: true,
                },
              },
            },
          },
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "portfolio:read:list",
          entityType: "PortfolioItem",
          metadata: {
            source: "dashboard-api",
            count: rows.length,
            limit,
            redaction: "buildTenantDashboardView",
            redactsAssetKeys: true,
          },
        },
        select: { id: true },
      });

      return { rows, audit };
    });

    const view = buildTenantDashboardView({
      collection: "portfolio",
      tenantId,
      source: "repository",
      records: result.rows.map((row: PortfolioListRow) => ({
        id: row.id,
        tenantId: row.tenantId,
        title: row.title,
        slug: row.slug,
        caption: row.caption,
        placement: row.placement,
        freshness: row.freshness,
        city: row.city,
        isPublic: row.isPublic,
        isFeatured: row.isFeatured,
        publishedAt: row.publishedAt?.toISOString() ?? null,
        attributionKey: row.attributionKey,
        attributionCount: row.attributedBookingRequests.length,
        styles: row.styles.map((style: PortfolioStyleRow) => style.slug || style.label),
        needsAltTextReview: row.images.some((image: PortfolioImageRow) => image.altText.trim().length < 24),
        images: row.images.map((image: PortfolioImageRow) => ({
          id: image.id,
          imageUrl: image.fileAsset?.visibility === "public" ? image.imageUrl : "[redacted-dashboard-field]",
          altText: image.altText,
          width: image.width,
          height: image.height,
          isPrimary: image.isPrimary,
          fileAssetId: image.fileAsset?.id ?? null,
          visibility: image.fileAsset?.visibility ?? null,
          objectKey: image.fileAsset?.objectKey ?? null,
          bucket: image.fileAsset?.bucket ?? null,
          checksumSha256: image.fileAsset?.checksumSha256 ?? null,
          signedUrlExpiresAt: image.fileAsset?.signedUrlExpiresAt?.toISOString() ?? null,
          metadata: redactAssetMetadata(image.fileAsset?.metadata),
        })),
      })),
      redactedFields: ["attributionKey", "objectKey", "bucket", "checksumSha256", "signedUrlExpiresAt", "metadata"],
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        count: view.records.length,
        portfolio: view.records,
        auditId: result.audit.id,
        gapIds: ["GAP-005", "GAP-007", "GAP-037", "GAP-040"],
        boundary: "Dashboard portfolio list reads are tenant-scoped, file-key redacted, no-store, and audited.",
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
          error: { code: "DATABASE_UNAVAILABLE", message: "Portfolio list reads require the dashboard database connection." },
          gapIds: ["GAP-005", "GAP-007", "GAP-037", "GAP-040"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "PORTFOLIO_LIST_READ_FAILED", message: "Portfolio items could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(request: NextRequest) {
  let actor;
  try {
    actor = resolveDashboardActor(request);
    assertPermission(actor, "portfolio:write");
  } catch (error) {
    const status = error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 403;
    const code = status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN";
    return NextResponse.json(
      { ok: false, error: { code, message: "Actor is not allowed to create portfolio items." } },
      { status, headers: noStoreHeaders },
    );
  }

  const tenantId = new URL(request.url).searchParams.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot create portfolio items for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Portfolio item body must be valid JSON." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const parsed = portfolioItemInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Portfolio item payload failed validation.",
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const input = parsed.data;
  const idempotencyKey =
    request.headers.get("idempotency-key") ??
    `portfolio-create:${tenantId}:${hashIdempotencySubject(input.slug)}`;

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_PORTFOLIO_PERSISTENCE_NOT_CONFIGURED",
            message: "Production portfolio mutations require DB-backed dashboard auth, tenant-scoped PortfolioItem persistence, and AuditLog rows; local fallback mutations are disabled.",
            gapIds: ["GAP-005", "GAP-007", "GAP-037", "GAP-038", "GAP-040"],
          },
          productionBoundary: { localPortfolioMutationFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        source: actor.source,
        tenantId,
        error: {
          code: "DATABASE_REQUIRED",
          message: "Portfolio item creation requires database-backed dashboard auth so PortfolioItem, PortfolioImage, and AuditLog rows can be persisted.",
        },
        gapIds: ["GAP-005", "GAP-007", "GAP-037", "GAP-038", "GAP-040"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const portfolioItemModel = tx.portfolioItem as PortfolioItemMutationModel;
      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-portfolio-create", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-portfolio-create",
          key: idempotencyKey,
          status: "claimed",
          metadata: toJsonValue({
            route: "/api/portfolio",
            action: "create_portfolio_item",
            slugHash: hashIdempotencySubject(input.slug),
            imageUrlStoredInResult: false,
            providerUrlMinted: false,
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/portfolio",
            action: "create_portfolio_item",
            replayObserved: true,
            slugHash: hashIdempotencySubject(input.slug),
            imageUrlStoredInResult: false,
            providerUrlMinted: false,
          }),
        },
        select: { id: true, status: true, result: true },
      });
      const replayPortfolioItemId = idempotency.status === "completed" ? resultPortfolioItemId(idempotency.result) : null;
      if (replayPortfolioItemId) {
        const item = await portfolioItemModel.findFirst({
          where: { id: replayPortfolioItemId, tenantId },
          select: {
            id: true,
            tenantId: true,
            artistId: true,
            title: true,
            slug: true,
            isPublic: true,
            isFeatured: true,
            publishedAt: true,
            createdAt: true,
            images: { select: { id: true, imageUrl: true, altText: true, isPrimary: true } },
          },
        });

        if (item) {
          return { status: "replayed" as const, item, idempotency };
        }
      }

      const artist = await tx.artist.findFirst({ where: { id: input.artistId, tenantId }, select: { id: true } });
      if (!artist) {
        return { status: "artist_not_found" as const };
      }

      const existing = await portfolioItemModel.findUnique({
        where: { tenantId_slug: { tenantId, slug: input.slug } },
        select: { id: true },
      });
      if (existing) {
        return { status: "slug_exists" as const, portfolioItemId: existing.id };
      }

      const styles = await tx.tattooStyle.findMany({
        where: { tenantId, slug: { in: input.styles } },
        select: { id: true, slug: true },
      });
      if (styles.length !== input.styles.length) {
        return { status: "style_not_found" as const };
      }

      const item = await portfolioItemModel.create({
        data: {
          tenantId,
          artistId: input.artistId,
          title: input.title.trim(),
          slug: input.slug,
          caption: input.caption.trim(),
          placement: input.placement,
          freshness: input.freshness,
          ...(input.bodySide !== undefined ? { bodySide: input.bodySide.trim() } : {}),
          ...(input.city !== undefined ? { city: input.city.trim() } : {}),
          ...(input.completedAt !== undefined ? { completedAt: new Date(input.completedAt) } : {}),
          ...(input.sessionCount !== undefined ? { sessionCount: input.sessionCount } : {}),
          isFeatured: input.isFeatured,
          isPublic: input.isPublic,
          publishedAt: input.isPublic ? new Date() : null,
          attributionKey: `portfolio:${tenantId}:${input.slug}`,
          styles: { connect: styles.map((style) => ({ id: style.id })) },
          images: {
            create: {
              tenantId,
              imageUrl: input.imageUrl,
              altText: input.altText.trim(),
              isPrimary: true,
              sortOrder: 0,
            },
          },
        },
        select: {
          id: true,
          tenantId: true,
          artistId: true,
          title: true,
          slug: true,
          isPublic: true,
          isFeatured: true,
          publishedAt: true,
          createdAt: true,
          images: { select: { id: true, imageUrl: true, altText: true, isPrimary: true } },
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "portfolio.create",
          entityType: "PortfolioItem",
          entityId: item.id,
          metadata: {
            source: "dashboard-api",
            artistId: item.artistId,
            slug: item.slug,
            isPublic: item.isPublic,
            idempotencyKeyId: idempotency.id,
            imageBoundary: "Primary image URL metadata persisted; signed upload/object storage handoff is not executed by this route.",
            redaction: "storage object keys and signed URLs are not accepted or returned by this mutation",
          },
        },
        select: { id: true, createdAt: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-portfolio-create", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            portfolioItemId: item.id,
            auditId: audit.id,
            created: true,
            imageUrlStoredInResult: false,
            providerUrlMinted: false,
          }),
        },
      });

      return { status: "created" as const, item, audit, idempotency };
    });

    if (result.status === "artist_not_found") {
      return NextResponse.json({ ok: false, error: { code: "ARTIST_NOT_FOUND", message: "Portfolio artist was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }

    if (result.status === "slug_exists") {
      return NextResponse.json(
        { ok: false, error: { code: "PORTFOLIO_SLUG_EXISTS", message: "A portfolio item with this slug already exists for this tenant.", portfolioItemId: result.portfolioItemId } },
        { status: 409, headers: noStoreHeaders },
      );
    }

    if (result.status === "style_not_found") {
      return NextResponse.json(
        { ok: false, error: { code: "STYLE_NOT_FOUND", message: "Every portfolio style must exist for this tenant before creating the item." } },
        { status: 404, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        portfolioItem: {
          ...result.item,
          createdAt: result.item.createdAt.toISOString(),
          publishedAt: result.item.publishedAt?.toISOString() ?? null,
        },
        auditId: result.status === "created" ? result.audit.id : null,
        idempotencyKeyId: result.idempotency.id,
        idempotencyReplay: result.status === "replayed",
        gapIds: ["GAP-005", "GAP-007", "GAP-037", "GAP-038", "GAP-040"],
        boundary: "Portfolio metadata creation is idempotency-backed and persists PortfolioItem, style links, primary PortfolioImage URL metadata, and AuditLog rows; signed upload/object-storage processing remains a separate provider-gated handoff.",
      },
      { status: result.status === "created" ? 201 : 200, headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Portfolio item creation requires the dashboard database connection." },
          gapIds: ["GAP-005", "GAP-007", "GAP-037", "GAP-038", "GAP-040"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    if (error instanceof Error && /Unique constraint/i.test(error.message)) {
      return NextResponse.json(
        { ok: false, error: { code: "PORTFOLIO_SLUG_EXISTS", message: "A portfolio item with this slug or attribution key already exists." } },
        { status: 409, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "PORTFOLIO_CREATE_FAILED", message: "Portfolio item could not be persisted." } }, { status: 500, headers: noStoreHeaders });
  }
}
