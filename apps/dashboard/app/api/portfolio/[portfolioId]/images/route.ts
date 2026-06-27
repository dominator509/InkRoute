import { createHash } from "node:crypto";
import { prisma } from "@inkroute/db";
import { portfolioImageInputSchema } from "@inkroute/validators";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../../dashboardAuth";

interface PortfolioImageRouteContext {
  params: Promise<{ portfolioId: string }>;
}

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function hashIdempotencySubject(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function resultPortfolioImageId(result: unknown): string | null {
  if (!result || typeof result !== "object" || !("portfolioImageId" in result)) {
    return null;
  }

  const value = (result as { portfolioImageId?: unknown }).portfolioImageId;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function POST(request: NextRequest, context: PortfolioImageRouteContext) {
  let actor;
  try {
    actor = resolveDashboardActor(request);
    assertPermission(actor, "portfolio:write");
  } catch (error) {
    const status = error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 403;
    const code = status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN";
    return NextResponse.json(
      { ok: false, error: { code, message: "Actor is not allowed to attach portfolio images." } },
      { status, headers: noStoreHeaders },
    );
  }

  const { portfolioId } = await context.params;
  const tenantId = new URL(request.url).searchParams.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot attach portfolio images for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Portfolio image body must be valid JSON." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const parsed = portfolioImageInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Portfolio image payload failed validation.",
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const input = parsed.data;
  if (input.portfolioItemId !== portfolioId) {
    return NextResponse.json(
      { ok: false, error: { code: "PORTFOLIO_ID_MISMATCH", message: "Portfolio image body must match the route portfolio id." } },
      { status: 409, headers: noStoreHeaders },
    );
  }
  const idempotencyKey =
    request.headers.get("idempotency-key") ??
    `portfolio-image-attach:${tenantId}:${hashIdempotencySubject(
      `${portfolioId}:${input.fileAssetId ?? input.imageUrl}:${input.sortOrder}:${input.isPrimary}`,
    )}`;

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_PORTFOLIO_IMAGE_PERSISTENCE_NOT_CONFIGURED",
            message: "Production portfolio image attachment requires DB-backed dashboard auth, tenant-scoped PortfolioImage persistence, and AuditLog rows; local fallback mutations are disabled.",
            gapIds: ["GAP-005", "GAP-007", "GAP-038", "GAP-077"],
          },
          productionBoundary: { localPortfolioImageMutationFallbackDisabled: true },
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
          message: "Portfolio image attachment requires database-backed dashboard auth so PortfolioImage and AuditLog rows can be persisted.",
        },
        gapIds: ["GAP-005", "GAP-007", "GAP-038", "GAP-077"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-portfolio-image-attach", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-portfolio-image-attach",
          key: idempotencyKey,
          status: "claimed",
          metadata: toJsonValue({
            route: "/api/portfolio/[portfolioId]/images",
            action: "attach_portfolio_image_metadata",
            imageHash: hashIdempotencySubject(`${portfolioId}:${input.fileAssetId ?? input.imageUrl}:${input.sortOrder}:${input.isPrimary}`),
            rawImageUrlStoredInResult: false,
            providerUrlMinted: false,
            malwareScanExecuted: false,
            derivativesGenerated: false,
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/portfolio/[portfolioId]/images",
            action: "attach_portfolio_image_metadata",
            replayObserved: true,
            imageHash: hashIdempotencySubject(`${portfolioId}:${input.fileAssetId ?? input.imageUrl}:${input.sortOrder}:${input.isPrimary}`),
            rawImageUrlStoredInResult: false,
            providerUrlMinted: false,
            malwareScanExecuted: false,
            derivativesGenerated: false,
          }),
        },
        select: { id: true, status: true, result: true },
      });
      const replayPortfolioImageId = idempotency.status === "completed" ? resultPortfolioImageId(idempotency.result) : null;
      if (replayPortfolioImageId) {
        const image = await tx.portfolioImage.findFirst({
          where: { id: replayPortfolioImageId, tenantId, portfolioItemId: portfolioId },
          select: {
            id: true,
            portfolioItemId: true,
            fileAssetId: true,
            imageUrl: true,
            altText: true,
            width: true,
            height: true,
            sortOrder: true,
            isPrimary: true,
            createdAt: true,
          },
        });

        if (image) {
          return { status: "replayed" as const, image, idempotency };
        }
      }

      const portfolioItem = await tx.portfolioItem.findFirst({
        where: { id: portfolioId, tenantId },
        select: { id: true },
      });
      if (!portfolioItem) {
        return { status: "portfolio_not_found" as const };
      }

      if (input.fileAssetId !== undefined) {
        const fileAsset = await tx.fileAsset.findFirst({
          where: { id: input.fileAssetId, tenantId },
          select: { id: true, visibility: true, scanStatus: true },
        });
        if (!fileAsset) {
          return { status: "file_asset_not_found" as const };
        }
      }

      if (input.isPrimary) {
        await tx.portfolioImage.updateMany({
          where: { tenantId, portfolioItemId: portfolioId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      const image = await tx.portfolioImage.create({
        data: {
          tenantId,
          portfolioItemId: portfolioId,
          ...(input.fileAssetId !== undefined ? { fileAssetId: input.fileAssetId } : {}),
          imageUrl: input.imageUrl,
          altText: input.altText.trim(),
          ...(input.width !== undefined ? { width: input.width } : {}),
          ...(input.height !== undefined ? { height: input.height } : {}),
          sortOrder: input.sortOrder,
          isPrimary: input.isPrimary,
        },
        select: {
          id: true,
          portfolioItemId: true,
          fileAssetId: true,
          imageUrl: true,
          altText: true,
          width: true,
          height: true,
          sortOrder: true,
          isPrimary: true,
          createdAt: true,
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "portfolio.image.attach",
          entityType: "PortfolioImage",
          entityId: image.id,
          metadata: {
            source: "dashboard-api",
            portfolioItemId: portfolioId,
            fileAssetId: image.fileAssetId,
            isPrimary: image.isPrimary,
            idempotencyKeyId: idempotency.id,
            boundary: "Metadata attachment only; signed upload, malware scan, derivative generation, EXIF stripping, CDN proof, and Lighthouse evidence remain gated.",
          },
        },
        select: { id: true, createdAt: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-portfolio-image-attach", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            portfolioImageId: image.id,
            auditId: audit.id,
            attached: true,
            rawImageUrlStoredInResult: false,
            providerUrlMinted: false,
            malwareScanExecuted: false,
            derivativesGenerated: false,
          }),
        },
      });

      return { status: "attached" as const, image, audit, idempotency };
    });

    if (result.status === "portfolio_not_found") {
      return NextResponse.json({ ok: false, error: { code: "PORTFOLIO_NOT_FOUND", message: "Portfolio item was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }

    if (result.status === "file_asset_not_found") {
      return NextResponse.json({ ok: false, error: { code: "FILE_ASSET_NOT_FOUND", message: "File asset was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        image: { ...result.image, createdAt: result.image.createdAt.toISOString() },
        auditId: result.status === "attached" ? result.audit.id : null,
        idempotencyKeyId: result.idempotency.id,
        idempotencyReplay: result.status === "replayed",
        gapIds: ["GAP-005", "GAP-007", "GAP-038", "GAP-077"],
        boundary: "Portfolio image metadata attachment is tenant-scoped, no-store, idempotency-backed, and audited; provider storage, scan, derivative, CDN, and performance evidence remain gated.",
      },
      { status: result.status === "attached" ? 201 : 200, headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Portfolio image attachment requires the dashboard database connection." },
          gapIds: ["GAP-005", "GAP-007", "GAP-038", "GAP-077"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "PORTFOLIO_IMAGE_ATTACH_FAILED", message: "Portfolio image could not be attached." } }, { status: 500, headers: noStoreHeaders });
  }
}
