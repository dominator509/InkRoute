import { prisma } from "@inkroute/db";
import type { ReviewStatus } from "@inkroute/types";
import { NextRequest, NextResponse } from "next/server";
import { dashboardReviewQueue } from "../../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function redactReviewBody(value: string | null | undefined): string {
  if (!value) return "";
  return value.length > 0 ? "[redacted-review-body]" : "";
}

function publicDisplayName(value: string | null | undefined): string {
  if (!value || value.trim().length === 0) return "Private client";
  return value;
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "review:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read reviews." } }, { status: 403, headers: noStoreHeaders });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query reviews for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const limit = Math.min(Math.max(Number(params.get("limit") ?? 50), 1), 100);
  const status = params.get("status");
  const allowedStatuses = new Set<ReviewStatus>(["submitted", "approved", "rejected", "hidden"]);
  const statusFilter: ReviewStatus | null = allowedStatuses.has(status as ReviewStatus) ? (status as ReviewStatus) : null;

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_DASHBOARD_READS_NOT_CONFIGURED",
            message: "Production dashboard review reads require DB-backed actor resolution and tenant-scoped repository data; local fallback demo payloads are disabled.",
            gapIds: ["GAP-026", "GAP-037", "GAP-071"],
          },
          productionBoundary: { localDashboardReadFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    const reviews = dashboardReviewQueue
      .filter((review) => !statusFilter || review.status === statusFilter)
      .slice(0, limit)
      .map((review) => ({
        id: review.id,
        displayName: review.displayName,
        rating: review.rating,
        status: review.status,
        bodyPreview: "[redacted-review-body]",
        source: "local-fallback",
      }));

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "local-fallback",
        count: reviews.length,
        reviews,
        gapIds: ["GAP-026", "GAP-037", "GAP-071"],
        boundary: "Local fallback returns redacted demo review metadata only; database mode is required for live moderation and publication reads.",
      },
      { headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const rows = await tx.review.findMany({
        where: {
          tenantId,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        take: limit,
        select: {
          id: true,
          tenantId: true,
          artistId: true,
          status: true,
          rating: true,
          title: true,
          body: true,
          publicDisplayName: true,
          source: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "review:read:list",
          entityType: "Review",
          metadata: {
            source: "dashboard-api",
            count: rows.length,
            status: statusFilter,
            redactedFields: ["body", "clientId", "bookingRequestId", "privateClientName"],
          },
        },
        select: { id: true },
      });

      return { rows, audit };
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        count: result.rows.length,
        reviews: result.rows.map((review) => ({
          id: review.id,
          tenantId: review.tenantId,
          artistId: review.artistId,
          status: review.status,
          rating: review.rating,
          title: review.title,
          bodyPreview: redactReviewBody(review.body),
          publicDisplayName: publicDisplayName(review.publicDisplayName),
          source: review.source,
          publishedAt: review.publishedAt?.toISOString() ?? null,
          createdAt: review.createdAt.toISOString(),
          updatedAt: review.updatedAt.toISOString(),
        })),
        auditId: result.audit.id,
        gapIds: ["GAP-026", "GAP-037", "GAP-071"],
        boundary: "Dashboard review reads are tenant-scoped, no-store, audit-logged, and redact raw review body plus private client/booking references; publication workflows remain gated.",
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
          error: { code: "DATABASE_UNAVAILABLE", message: "Review reads require the dashboard database connection." },
          gapIds: ["GAP-026", "GAP-037", "GAP-071"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "REVIEW_READ_FAILED", message: "Reviews could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}
