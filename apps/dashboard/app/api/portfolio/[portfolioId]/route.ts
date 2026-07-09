import { buildTenantDashboardView } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { dashboardProjectedPortfolio } from "../../../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

interface PortfolioDetailRouteContext {
  params: Promise<{ portfolioId: string }>;
}

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

function buildPortfolioDetailResponseProjection() {
  return {
    portfolioItemIdEchoed: false,
    tenantIdEchoed: false,
    attributedBookingIdsEchoed: false,
    portfolioImageIdsEchoed: false,
    fileAssetIdsEchoed: false,
    auditIdEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildSafePortfolioDetailRecord(record: Record<string, unknown>) {
  const {
    id: _id,
    tenantId: _tenantId,
    attributedBookingId: _attributedBookingId,
    attributedBookingIds: _attributedBookingIds,
    attributedBookings,
    images,
    ...safeRecord
  } = record;

  return {
    ...safeRecord,
    attributedBookings: Array.isArray(attributedBookings)
      ? attributedBookings.map((booking) => {
          if (typeof booking !== "object" || booking === null) return booking;
          const { id: _bookingId, ...safeBooking } = booking as Record<string, unknown>;
          return safeBooking;
        })
      : attributedBookings,
    images: Array.isArray(images)
      ? images.map((image) => {
          if (typeof image !== "object" || image === null) return image;
          const { id: _imageId, fileAssetId: _fileAssetId, ...safeImage } = image as Record<string, unknown>;
          return safeImage;
        })
      : images,
    responseProjection: buildPortfolioDetailResponseProjection(),
  };
}

type PortfolioStyleRow = {
  slug: string | null;
  label: string | null;
};

type PortfolioBookingRequestRow = {
  id: string;
  status: string;
  clientNameSnapshot: string | null;
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
  sortOrder: number;
  fileAsset: PortfolioImageAssetRow | null;
};

type PortfolioDetailRow = {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  caption: string | null;
  placement: string | null;
  freshness: string | null;
  city: string | null;
  completedAt: Date | null;
  sessionCount: number;
  isPublic: boolean;
  isFeatured: boolean;
  publishedAt: Date | null;
  attributionKey: string | null;
  styles: PortfolioStyleRow[];
  attributedBookingRequests: PortfolioBookingRequestRow[];
  images: PortfolioImageRow[];
};

export async function GET(request: NextRequest, context: PortfolioDetailRouteContext) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "portfolio:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read portfolio items." } }, { status: 403, headers: noStoreHeaders });
  }

  const { portfolioId } = await context.params;
  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query a portfolio item for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: {
            code: "PROVIDER_DASHBOARD_READS_NOT_CONFIGURED",
            message: "Production dashboard portfolio reads require DB-backed actor resolution and tenant-scoped repository data; local fallback demo payloads are disabled.",
            gapIds: ["GAP-005", "GAP-007", "GAP-037", "GAP-040"],
          },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildPortfolioDetailResponseProjection(),
          productionBoundary: { localDashboardReadFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    const item = dashboardProjectedPortfolio.find((row) => row.id === portfolioId);
    if (!item) {
      return NextResponse.json({ ok: false, error: { code: "PORTFOLIO_NOT_FOUND", message: "Portfolio item was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "local-fallback",
        portfolioItem: buildSafePortfolioDetailRecord(item as Record<string, unknown>),
        tenantScope: { actorTenantMatched: true },
        responseProjection: buildPortfolioDetailResponseProjection(),
        gapIds: ["GAP-005", "GAP-007", "GAP-037", "GAP-040"],
        boundary: "Local fallback returns a tenant-projected demo portfolio item only; database mode is required for live portfolio reads.",
      },
      { headers: noStoreHeaders },
    );
  }

    try {
    const result = await prisma.$transaction(async (tx) => {
      const portfolioItemModel = tx.portfolioItem as {
        findFirst: (args: unknown) => Promise<PortfolioDetailRow | null>;
      };
      const row = await portfolioItemModel.findFirst({
        where: { id: portfolioId, tenantId },
        select: {
          id: true,
          tenantId: true,
          title: true,
          slug: true,
          caption: true,
          placement: true,
          freshness: true,
          city: true,
          completedAt: true,
          sessionCount: true,
          isPublic: true,
          isFeatured: true,
          publishedAt: true,
          attributionKey: true,
          styles: { select: { slug: true, label: true } },
          attributedBookingRequests: { select: { id: true, status: true, clientNameSnapshot: true } },
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            select: {
              id: true,
              imageUrl: true,
              altText: true,
              width: true,
              height: true,
              isPrimary: true,
              sortOrder: true,
              fileAsset: {
                select: {
                  id: true,
                  kind: true,
                  visibility: true,
                  publicUrl: true,
                  metadata: true,
                },
              },
            },
          },
        },
      });

      if (!row) return { status: "not_found" as const };

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "portfolio:read:detail",
          entityType: "PortfolioItem",
          entityId: row.id,
          metadata: {
            source: "dashboard-api",
            redaction: "buildTenantDashboardView",
            imageCount: row.images.length,
            attributedBookingCount: row.attributedBookingRequests.length,
            redactsAssetKeys: true,
          },
        },
        select: { id: true },
      });

      return { status: "found" as const, row, audit };
    });

    if (result.status === "not_found") {
      return NextResponse.json({ ok: false, error: { code: "PORTFOLIO_NOT_FOUND", message: "Portfolio item was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }

    const view = buildTenantDashboardView({
      collection: "portfolio",
      tenantId,
      source: "repository",
      records: [
        {
          title: result.row.title,
          slug: result.row.slug,
          caption: result.row.caption,
          placement: result.row.placement,
          freshness: result.row.freshness,
          city: result.row.city,
          completedAt: result.row.completedAt?.toISOString() ?? null,
          sessionCount: result.row.sessionCount,
          isPublic: result.row.isPublic,
          isFeatured: result.row.isFeatured,
          publishedAt: result.row.publishedAt?.toISOString() ?? null,
          attributionKey: result.row.attributionKey,
          attributionCount: result.row.attributedBookingRequests.length,
          styles: result.row.styles.map((style: PortfolioStyleRow) => style.slug || style.label),
          attributedBookings: result.row.attributedBookingRequests.map((booking: PortfolioBookingRequestRow) => ({
            status: booking.status,
            clientName: "[redacted-dashboard-field]",
          })),
          needsAltTextReview: result.row.images.some((image) => image.altText.trim().length < 24),
          images: result.row.images.map((image) => ({
            imageUrl: image.fileAsset?.visibility === "public" ? image.imageUrl : "[redacted-dashboard-field]",
            altText: image.altText,
            width: image.width,
            height: image.height,
            isPrimary: image.isPrimary,
            sortOrder: image.sortOrder,
            fileAssetLinked: Boolean(image.fileAsset?.id),
            visibility: image.fileAsset?.visibility ?? null,
            objectKey: "[redacted-dashboard-field]",
            bucket: "[redacted-dashboard-field]",
            checksumSha256: "[redacted-dashboard-field]",
            signedUrlExpiresAt: "[redacted-dashboard-field]",
            objectKeySelectedFromDatabase: false,
            bucketSelectedFromDatabase: false,
            checksumSelectedFromDatabase: false,
            signedUrlExpirySelectedFromDatabase: false,
            metadata: redactAssetMetadata(image.fileAsset?.metadata),
          })),
        },
      ],
      redactedFields: ["attributionKey", "objectKey", "bucket", "checksumSha256", "signedUrlExpiresAt", "metadata"],
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "database",
        portfolioItem: buildSafePortfolioDetailRecord(view.records[0] as Record<string, unknown>),
        auditLogged: true,
        tenantScope: { actorTenantMatched: true, portfolioTenantMatched: true },
        responseProjection: buildPortfolioDetailResponseProjection(),
        gapIds: ["GAP-005", "GAP-007", "GAP-037", "GAP-040"],
        boundary: "Dashboard portfolio detail reads are tenant-scoped, file-key redacted, no-store, and audited.",
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: { code: "DATABASE_UNAVAILABLE", message: "Portfolio detail reads require the dashboard database connection." },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildPortfolioDetailResponseProjection(),
          gapIds: ["GAP-005", "GAP-007", "GAP-037", "GAP-040"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "PORTFOLIO_DETAIL_READ_FAILED", message: "Portfolio item could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}
