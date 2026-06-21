import { buildTenantDashboardView } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { dashboardProjectedPortfolio } from "../../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

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
      const rows = await tx.portfolioItem.findMany({
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
      records: result.rows.map((row) => ({
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
        styles: row.styles.map((style) => style.slug || style.label),
        needsAltTextReview: row.images.some((image) => image.altText.trim().length < 24),
        images: row.images.map((image) => ({
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
