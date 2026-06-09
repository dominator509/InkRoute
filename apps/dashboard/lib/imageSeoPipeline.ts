import { demoPortfolioItems, inkrouteDemoTenant } from "@inkroute/config";
import {
  buildSeoImagePipelinePlan,
  buildSeoImagePipelineRuntimeReadinessPlan,
  type SeoImagePipelinePlan,
  type SeoImagePipelineRuntimeReadinessPlan,
} from "@inkroute/seo";
import type { PortfolioItem } from "@inkroute/types";

export const imageSeoPipelineArtifactPaths = [
  "coverage/image-seo-pipeline-plan.json",
  "coverage/image-seo-private-original-acl.json",
  "coverage/image-seo-public-derivative-load.json",
  "coverage/image-seo-cdn-headers.json",
  "coverage/lighthouse-image-seo-audit.json",
  "test-results/image-seo-pipeline",
] as const;

export const imageSeoDerivativeFormats = ["webp", "avif", "jpeg"] as const;
export const imageSeoDerivativeWidths = [320, 768, 1280, 1600] as const;
export const imageSeoCdnCacheControl = "public, max-age=31536000, immutable";

export function sourceObjectKeyForPortfolio(item: Pick<PortfolioItem, "tenantId" | "id" | "slug">): string {
  return `${item.tenantId}/private/originals/portfolio/${item.id}/${item.slug}.jpg`;
}

export function buildDashboardImageSeoPipelinePlan(input: {
  item?: PortfolioItem;
  portfolioItemId?: string;
  cdnBaseUrl?: string;
  now?: string;
}): SeoImagePipelinePlan {
  const item = input.item ?? demoPortfolioItems.find((candidate) => candidate.id === input.portfolioItemId) ?? demoPortfolioItems[0]!;
  return buildSeoImagePipelinePlan({
    item,
    tenantSlug: inkrouteDemoTenant.slug,
    sourceObjectKey: sourceObjectKeyForPortfolio(item),
    sourceAcl: "private",
    cdnBaseUrl: input.cdnBaseUrl ?? "https://cdn.inkroute.example",
    widths: [...imageSeoDerivativeWidths],
    formats: [...imageSeoDerivativeFormats],
    now: input.now,
  });
}

export function buildImageSeoPipelineRuntimeContract(): SeoImagePipelineRuntimeReadinessPlan {
  return buildSeoImagePipelineRuntimeReadinessPlan({
    packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
    seoPackageTestsPassed: false,
    seoPackageTypecheckPassed: false,
    imageProcessingWorkerImplemented: true,
    storageProviderConfigured: false,
    sourceDimensionProbeImplemented: true,
    exifStrippingImplemented: true,
    responsiveDerivativeGenerationImplemented: true,
    blurPlaceholderGenerationImplemented: true,
    fileAssetPersistenceAvailable: true,
    portfolioImagePersistenceAvailable: true,
    derivativeMetadataPersistenceAvailable: true,
    privateOriginalAclEnforced: true,
    publicDerivativeAclEnforced: true,
    cdnCacheHeadersConfigured: true,
    immutableDerivativeUrlsConfigured: true,
    uploadImageProcessingTestsPassed: false,
    privateOriginalAccessTestsPassed: false,
    publicDerivativeLoadTestsPassed: false,
    cdnHeaderTestsPassed: false,
    lighthouseImageAuditPassed: false,
  });
}

export const imageSeoPipelineRuntimeContract = buildImageSeoPipelineRuntimeContract();

export function imageSeoDerivativeMetadata(plan: SeoImagePipelinePlan) {
  return plan.derivatives.map((derivative) => ({
    width: derivative.width,
    format: derivative.format,
    objectKey: derivative.objectKey,
    publicUrl: derivative.publicUrl ?? null,
    acl: derivative.acl,
    cacheControl: derivative.cacheControl,
    immutable: derivative.cacheControl.includes("immutable"),
    sourceObjectKey: plan.sourceObjectKey,
    sourceAcl: plan.sourceAcl,
    exifStripped: plan.requiresExifStrip,
    blurPlaceholderRequired: plan.requiresBlurPlaceholder,
  }));
}
