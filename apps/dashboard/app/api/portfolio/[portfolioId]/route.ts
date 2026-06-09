import { buildTenantDashboardView } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { dashboardProjectedPortfolio } from "../../../lib/demo";
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

export async function GET(request: NextRequest, context: PortfolioDetailRouteContext) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "portfolio:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read portfolio items." } }, { status: 403 });
  }

  const { portfolioId } = await context.params;
  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query a portfolio item for another tenant." } }, { status: 403 });
  }

  if (actor.source === "local-fallback") {
    const item = dashboardProjectedPortfolio.find((row) => row.id === portfolioId);
    if (!item) {
      return NextResponse.json({ ok: false, error: { code: "PORTFOLIO_NOT_FOUND", message: "Portfolio item was not found for this tenant." } }, { status: 404 });
    }
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "local-fallback",
        portfolioItem: item,
        gapIds: ["GAP-005", "GAP-007", "GAP-037", "GAP-040"],
        boundary: "Local fallback returns a tenant-projected demo portfolio item only; database mode is required for live portfolio reads.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.portfolioItem.findFirst({
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
      return NextResponse.json({ ok: false, error: { code: "PORTFOLIO_NOT_FOUND", message: "Portfolio item was not found for this tenant." } }, { status: 404 });
    }

    const view = buildTenantDashboardView({
      collection: "portfolio",
      tenantId,
      source: "repository",
      records: [
        {
          id: result.row.id,
          tenantId: result.row.tenantId,
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
          styles: result.row.styles.map((style) => style.slug || style.label),
          attributedBookings: result.row.attributedBookingRequests.map((booking) => ({
            id: booking.id,
            status: booking.status,
            clientName: "[redacted-dashboard-field]",
          })),
          needsAltTextReview: result.row.images.some((image) => image.altText.trim().length < 24),
          images: result.row.images.map((image) => ({
            id: image.id,
            imageUrl: image.fileAsset?.visibility === "public" ? image.imageUrl : "[redacted-dashboard-field]",
            altText: image.altText,
            width: image.width,
            height: image.height,
            isPrimary: image.isPrimary,
            sortOrder: image.sortOrder,
            fileAssetId: image.fileAsset?.id ?? null,
            visibility: image.fileAsset?.visibility ?? null,
            objectKey: image.fileAsset?.objectKey ?? null,
            bucket: image.fileAsset?.bucket ?? null,
            checksumSha256: image.fileAsset?.checksumSha256 ?? null,
            signedUrlExpiresAt: image.fileAsset?.signedUrlExpiresAt?.toISOString() ?? null,
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
        tenantId,
        persistence: "database",
        portfolioItem: view.records[0],
        auditId: result.audit.id,
        gapIds: ["GAP-005", "GAP-007", "GAP-037", "GAP-040"],
        boundary: "Dashboard portfolio detail reads are tenant-scoped, file-key redacted, no-store, and audited.",
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
          portfolioId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Portfolio detail reads require the dashboard database connection." },
          gapIds: ["GAP-005", "GAP-007", "GAP-037", "GAP-040"],
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "PORTFOLIO_DETAIL_READ_FAILED", message: "Portfolio item could not be loaded." } }, { status: 500 });
  }
}
