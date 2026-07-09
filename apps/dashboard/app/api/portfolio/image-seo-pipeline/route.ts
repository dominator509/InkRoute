import { createHash } from "node:crypto";
import { demoPortfolioItems, inkrouteDemoTenant } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import type { SeoImagePipelinePlan } from "@inkroute/seo";
import { NextRequest, NextResponse } from "next/server";
import {
  buildDashboardImageSeoPipelinePlan,
  imageSeoDerivativeMetadata,
  imageSeoPipelineArtifactPaths,
  imageSeoPipelineRuntimeContract,
} from "../../../../lib/imageSeoPipeline";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

export const runtime = "nodejs";

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function hashImageSeoSubject(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function resultBoolean(value: unknown, key: string): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return (value as Record<string, unknown>)[key] === true;
}

function json(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, { status, headers: noStoreHeaders });
}

function buildSafeImageSeoPipelinePlanResponse(plan: SeoImagePipelinePlan) {
  return {
    tenantSlug: plan.tenantSlug,
    sourceAcl: plan.sourceAcl,
    sourceRemainsPrivate: plan.sourceRemainsPrivate,
    requiresExifStrip: plan.requiresExifStrip,
    requiresDimensionProbe: plan.requiresDimensionProbe,
    requiresBlurPlaceholder: plan.requiresBlurPlaceholder,
    requiresDerivativePersistence: plan.requiresDerivativePersistence,
    cacheControl: plan.cacheControl,
    generatedAt: plan.generatedAt,
    blockers: plan.blockers,
    derivativeCount: plan.derivatives.length,
    derivativeSummaries: plan.derivatives.map((derivative) => ({
      label: derivative.label,
      width: derivative.width,
      format: derivative.format,
      acl: derivative.acl,
      cacheControl: derivative.cacheControl,
      objectKeyEchoed: false,
      publicUrlEchoed: false,
      blurDataUrlEchoed: false,
    })),
    filenameHintEchoed: false,
    altTextEchoed: false,
    captionEchoed: false,
    sourceObjectKeyEchoed: false,
    rawDerivativeMetadataEchoed: false,
    rawProviderPayloadEchoed: false,
    tenantIdEchoed: false,
    portfolioItemIdEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildImageSeoPipelineResponseProjection() {
  return {
    tenantIdEchoed: false,
    portfolioItemIdEchoed: false,
    fileAssetIdEchoed: false,
    portfolioImageIdEchoed: false,
    auditIdEchoed: false,
    idempotencyKeyIdEchoed: false,
    rawIdempotencyKeyEchoed: false,
    rawProviderPayloadEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "portfolio:read");
  } catch {
    return json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read image SEO pipeline status." } }, 403);
  }

  const tenantId = new URL(request.url).searchParams.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot read image SEO pipeline status for another tenant." } }, 403);
  }

  return json({
    ok: true,
    tenantScope: { actorTenantMatched: true },
    responseProjection: buildImageSeoPipelineResponseProjection(),
    runtime: imageSeoPipelineRuntimeContract,
    artifactPaths: imageSeoPipelineArtifactPaths,
    gapIds: ["GAP-077"],
    boundary: "Image SEO pipeline status is tenant-scoped; storage processing, CDN load tests, and Lighthouse proof remain provider/runtime gated.",
  });
}

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "portfolio:write");
  } catch {
    return json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to process image SEO derivatives." } }, 403);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const tenantId = stringValue(body.tenantId) ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot process image SEO derivatives for another tenant." } }, 403);
  }

  const portfolioItemId = stringValue(body.portfolioItemId) ?? demoPortfolioItems[0]?.id;
  const demoItem = demoPortfolioItems.find((item) => item.id === portfolioItemId && item.tenantId === inkrouteDemoTenant.id);
  const cdnBaseUrl = stringValue(body.cdnBaseUrl);
  const plan = buildDashboardImageSeoPipelinePlan({
    ...(cdnBaseUrl ? { cdnBaseUrl } : {}),
    ...(portfolioItemId ? { portfolioItemId } : {}),
    ...(demoItem ? { item: demoItem } : {}),
  });
  const derivativeMetadata = imageSeoDerivativeMetadata(plan);
  const primaryDerivative = derivativeMetadata.find((derivative) => derivative.width === 1280 && derivative.format === "webp") ?? derivativeMetadata[0];
  const requestedWidth = numberValue(body.width) ?? primaryDerivative?.width ?? 1280;
  const requestedHeight = numberValue(body.height) ?? Math.round(requestedWidth * 1.25);

  if (plan.blockers.length > 0) {
    return json({ ok: false, tenantScope: { actorTenantMatched: true }, responseProjection: buildImageSeoPipelineResponseProjection(), plan: buildSafeImageSeoPipelinePlanResponse(plan), blockers: plan.blockers, gapIds: ["GAP-077"] }, 422);
  }

  if (process.env.NODE_ENV === "production" && actor.source === "local-fallback") {
    return json(
      {
        ok: false,
        source: actor.source,
        tenantScope: { actorTenantMatched: true },
        responseProjection: buildImageSeoPipelineResponseProjection(),
        error: {
          code: "PROVIDER_IMAGE_SEO_PERSISTENCE_NOT_CONFIGURED",
          message: "Production image SEO processing requires DB-backed actor resolution plus FileAsset, PortfolioImage, and AuditLog persistence; dry-run fallback processing is disabled.",
          gapIds: ["GAP-005", "GAP-077"],
        },
        productionBoundary: { localImageSeoDryRunFallbackDisabled: true },
      },
      503,
    );
  }

  let persisted: {
    fileAssetPersisted: boolean;
    portfolioImagePersisted: boolean;
    auditLogged: boolean;
    fileAssetIdEchoed: false;
    portfolioImageIdEchoed: false;
    auditIdEchoed: false;
    idempotencyKeyIdEchoed: false;
    internalPersistenceIdsEchoed: false;
    idempotencyReplay: boolean;
  } | null = null;
  if (actor.source !== "local-fallback") {
    const objectKey = primaryDerivative?.objectKey ?? plan.derivatives[0]!.objectKey;
    const idempotencyKey = stringValue(body.idempotencyKey) ?? `image-seo:${tenantId}:${plan.portfolioItemId}:${objectKey}:${requestedWidth}x${requestedHeight}`;
    const requestHash = hashImageSeoSubject(
      JSON.stringify({
        tenantId,
        portfolioItemId: plan.portfolioItemId,
        objectKey,
        publicUrl: primaryDerivative?.publicUrl ?? null,
        width: requestedWidth,
        height: requestedHeight,
        derivativeCount: derivativeMetadata.length,
      }),
    );

    try {
      const result = await prisma.$transaction(async (tx) => {
        const portfolioItem = await tx.portfolioItem.findFirst({
          where: { id: plan.portfolioItemId, tenantId },
          select: { id: true },
        });
        if (!portfolioItem) return { status: "portfolio_item_not_found" as const };

        const idempotency = await tx.idempotencyKey.upsert({
          where: { tenantId_scope_key: { tenantId, scope: "portfolio.image_seo_pipeline", key: idempotencyKey } },
          create: {
            tenantId,
            scope: "portfolio.image_seo_pipeline",
            key: idempotencyKey,
            status: "pending",
            requestHash,
            metadata: {
              source: "dashboard-image-seo-pipeline-route",
              portfolioItemMatched: true,
              portfolioItemIdEchoed: false,
              rawRequestHashStored: false,
              internalPersistenceIdsStored: false,
              objectKey,
              requestedWidth,
              requestedHeight,
              storageTransformExecuted: false,
              cdnLoadVerified: false,
              lighthouseAuditExecuted: false,
            },
          },
          update: {},
          select: { id: true, status: true, requestHash: true, result: true },
        });

        if (idempotency.requestHash !== requestHash) {
          return { status: "idempotency_conflict" as const, idempotency };
        }

        if (idempotency.status === "completed") {
          return {
            status: "replayed" as const,
            idempotency,
            fileAssetPersisted: resultBoolean(idempotency.result, "fileAssetPersisted"),
            portfolioImagePersisted: resultBoolean(idempotency.result, "portfolioImagePersisted"),
            auditLogged: resultBoolean(idempotency.result, "auditLogged"),
          };
        }

        const existingFileAsset = await tx.fileAsset.findUnique({
          where: { bucket_objectKey: { bucket: "portfolio-public-derivatives", objectKey } },
          select: { tenantId: true },
        });
        if (existingFileAsset && existingFileAsset.tenantId !== tenantId) {
          return { status: "file_asset_tenant_conflict" as const, idempotency };
        }

        const fileAsset = await tx.fileAsset.upsert({
          where: { bucket_objectKey: { bucket: "portfolio-public-derivatives", objectKey } },
          create: {
            tenantId,
            uploadedByUserId: actor.actorUserId,
            kind: "portfolio_image",
            visibility: "public",
            bucket: "portfolio-public-derivatives",
            objectKey,
            originalFilename: plan.filenameHint,
            mimeType: `image/${primaryDerivative?.format ?? "webp"}`,
            sizeBytes: numberValue(body.sizeBytes) ?? 1,
            publicUrl: primaryDerivative?.publicUrl ?? null,
            metadata: {
              sourceObjectKey: plan.sourceObjectKey,
              sourceAcl: plan.sourceAcl,
              sourceRemainsPrivate: plan.sourceRemainsPrivate,
              cacheControl: plan.cacheControl,
              derivatives: derivativeMetadata,
              exifStripped: plan.requiresExifStrip,
              dimensionProbe: { width: requestedWidth, height: requestedHeight },
              blurPlaceholderRequired: plan.requiresBlurPlaceholder,
            },
          },
          update: {
            visibility: "public",
            publicUrl: primaryDerivative?.publicUrl ?? null,
            metadata: {
              sourceObjectKey: plan.sourceObjectKey,
              sourceAcl: plan.sourceAcl,
              sourceRemainsPrivate: plan.sourceRemainsPrivate,
              cacheControl: plan.cacheControl,
              derivatives: derivativeMetadata,
              exifStripped: plan.requiresExifStrip,
              dimensionProbe: { width: requestedWidth, height: requestedHeight },
              blurPlaceholderRequired: plan.requiresBlurPlaceholder,
            },
          },
          select: { id: true },
        });

        const portfolioImage = await tx.portfolioImage.create({
          data: {
            tenantId,
            portfolioItemId: plan.portfolioItemId,
            fileAssetId: fileAsset.id,
            imageUrl: primaryDerivative?.publicUrl ?? `/${primaryDerivative?.objectKey ?? plan.derivatives[0]!.objectKey}`,
            altText: plan.altText,
            width: requestedWidth,
            height: requestedHeight,
            isPrimary: true,
          },
          select: { id: true },
        });

        const audit = await tx.auditLog.create({
          data: {
            tenantId,
            actorUserId: actor.actorUserId,
            action: "portfolio:imageSeoPipeline.process",
            entityType: "PortfolioImage",
            entityId: portfolioImage.id,
            metadata: {
              fileAssetMatched: true,
              portfolioItemMatched: true,
              derivativeCount: plan.derivatives.length,
            sourceObjectKey: "[redacted-dashboard-field]",
              idempotencyPersisted: true,
              requestHashPersisted: true,
              rawIdempotencyKeyStored: false,
              rawRequestHashStored: false,
              internalPersistenceIdsStored: false,
              sourceRemainsPrivate: plan.sourceRemainsPrivate,
              cacheControl: plan.cacheControl,
              requiredEvidence: imageSeoPipelineRuntimeContract.requiredEvidence,
            },
          },
          select: { id: true },
        });

        await tx.idempotencyKey.update({
          where: { tenantId_scope_key: { tenantId, scope: "portfolio.image_seo_pipeline", key: idempotencyKey } },
          data: {
            status: "completed",
            result: {
              fileAssetPersisted: true,
              portfolioImagePersisted: true,
              auditLogged: true,
              fileAssetIdEchoed: false,
              portfolioImageIdEchoed: false,
              auditIdEchoed: false,
              idempotencyKeyIdEchoed: false,
              internalPersistenceIdsEchoed: false,
              internalPersistenceIdsStored: false,
              requestHashPersisted: true,
              rawRequestHashStored: false,
              storageTransformExecuted: false,
              cdnLoadVerified: false,
              lighthouseAuditExecuted: false,
            },
          },
        });

        return { status: "persisted" as const, idempotency, fileAssetPersisted: true, portfolioImagePersisted: true, auditLogged: true };
      });

      if (result.status === "portfolio_item_not_found") {
        return json(
          {
            ok: false,
            source: actor.source,
            tenantScope: { actorTenantMatched: true },
            responseProjection: buildImageSeoPipelineResponseProjection(),
            error: { code: "RELATED_RECORD_NOT_FOUND", message: "Image SEO portfolio item must exist for this tenant." },
            gapIds: ["GAP-005", "GAP-077"],
          },
          404,
        );
      }

      if (result.status === "idempotency_conflict") {
        return json(
          {
            ok: false,
            source: actor.source,
            tenantScope: { actorTenantMatched: true },
            error: { code: "IDEMPOTENCY_CONFLICT", message: "Idempotency key was already used for a different image SEO payload." },
            idempotencyRecorded: true,
            responseProjection: buildImageSeoPipelineResponseProjection(),
            gapIds: ["GAP-005", "GAP-077"],
            boundary: "Image SEO idempotency is request-hash guarded and defaults to denial on mismatched replay payloads.",
          },
          409,
        );
      }

      if (result.status === "file_asset_tenant_conflict") {
        return json(
          {
            ok: false,
            source: actor.source,
            tenantScope: { actorTenantMatched: true },
            error: { code: "TENANT_ASSET_CONFLICT", message: "Image SEO derivative object key is already owned by another tenant." },
            idempotencyRecorded: true,
            responseProjection: buildImageSeoPipelineResponseProjection(),
            gapIds: ["GAP-005", "GAP-077"],
            boundary: "Image SEO derivative metadata denies cross-tenant FileAsset object-key collisions before writes.",
          },
          409,
        );
      }

      persisted = {
        fileAssetPersisted: result.fileAssetPersisted,
        portfolioImagePersisted: result.portfolioImagePersisted,
        auditLogged: result.auditLogged,
        fileAssetIdEchoed: false,
        portfolioImageIdEchoed: false,
        auditIdEchoed: false,
        idempotencyKeyIdEchoed: false,
        internalPersistenceIdsEchoed: false,
        idempotencyReplay: result.status === "replayed",
      };
    } catch (error) {
      if (process.env.NODE_ENV === "production" && isDatabaseUnavailable(error)) {
        return json(
          {
            ok: false,
            source: actor.source,
            tenantScope: { actorTenantMatched: true },
            responseProjection: buildImageSeoPipelineResponseProjection(),
            error: {
              code: "PROVIDER_IMAGE_SEO_PERSISTENCE_NOT_CONFIGURED",
              message: "Production image SEO processing requires the dashboard database connection; dry-run fallback processing is disabled.",
              gapIds: ["GAP-005", "GAP-077"],
            },
            productionBoundary: { localImageSeoDryRunFallbackDisabled: true },
          },
          503,
        );
      }
      if (!isDatabaseUnavailable(error)) throw error;
    }
  }

  return json(
    {
      ok: true,
      tenantScope: { actorTenantMatched: true },
      persistence: persisted ? "database" : "dry-run",
      idempotencyRecorded: Boolean(persisted),
      responseProjection: buildImageSeoPipelineResponseProjection(),
      idempotencyReplay: persisted?.idempotencyReplay ?? false,
      plan: buildSafeImageSeoPipelinePlanResponse(plan),
      derivativeMetadataEchoed: false,
      persisted,
      runtime: imageSeoPipelineRuntimeContract,
      gapIds: ["GAP-077"],
      boundary: "Image SEO pipeline plans private originals and public immutable derivatives; real storage transforms/CDN/Lighthouse proof remain gated.",
    },
    persisted ? 201 : 202,
  );
}
