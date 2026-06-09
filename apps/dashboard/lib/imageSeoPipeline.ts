import { demoPortfolioItems, inkrouteDemoTenant } from "@inkroute/config";
import {
  buildSeoImagePipelinePlan,
  buildSeoImagePipelineRuntimeReadinessPlan,
  type SeoImagePipelinePlan,
  type SeoImagePipelineRuntimeReadinessPlan,
} from "@inkroute/seo";
import type { PortfolioItem } from "@inkroute/types";

export type ImageSeoPipelineRuntimeStatus =
  | "wired"
  | "storage-gated"
  | "acl-gated"
  | "cdn-gated"
  | "audit-gated"
  | "ci-gated";

export interface ImageSeoPipelineRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: ImageSeoPipelineRuntimeStatus;
}

export const imageSeoPipelineRuntimeCommands = [
  "pnpm --filter @inkroute/seo typecheck",
  "pnpm --filter @inkroute/seo test",
  "pnpm vitest run apps/dashboard/tests/image-seo-pipeline-static.test.ts",
  "storage-backed responsive image transform tests",
  "private original denial and public derivative load tests",
  "CDN cache header tests",
  "Lighthouse image optimization audit",
] as const;

export const imageSeoPipelineArtifactPaths = [
  "coverage/image-seo-pipeline-plan.json",
  "coverage/image-seo-seo-typecheck.txt",
  "coverage/image-seo-seo-test.txt",
  "coverage/image-seo-storage-transform.json",
  "coverage/image-seo-private-original-acl.json",
  "coverage/image-seo-public-derivative-load.json",
  "coverage/image-seo-cdn-headers.json",
  "coverage/image-seo-fileasset-portfolioimage-persistence.json",
  "coverage/image-seo-audit-log.json",
  "coverage/lighthouse-image-seo-audit.json",
  "coverage/image-seo-ci-evidence.json",
  "coverage/image-seo-secret-safe-artifacts.json",
  "test-results/image-seo-pipeline",
] as const;

export const imageSeoPipelineRuntimeMatrix: readonly ImageSeoPipelineRuntimeMatrixEntry[] = [
  { id: "seo-typecheck", command: "pnpm --filter @inkroute/seo typecheck", artifact: "coverage/image-seo-seo-typecheck.txt", status: "wired" },
  { id: "seo-tests", command: "pnpm --filter @inkroute/seo test", artifact: "coverage/image-seo-seo-test.txt", status: "wired" },
  { id: "pipeline-plan", command: "pnpm vitest run apps/dashboard/tests/image-seo-pipeline-static.test.ts", artifact: "coverage/image-seo-pipeline-plan.json", status: "wired" },
  { id: "storage-transform", command: "storage-backed responsive image transform tests", artifact: "coverage/image-seo-storage-transform.json", status: "storage-gated" },
  { id: "private-original-acl", command: "private original denial tests", artifact: "coverage/image-seo-private-original-acl.json", status: "acl-gated" },
  { id: "public-derivative-load", command: "public derivative load tests", artifact: "coverage/image-seo-public-derivative-load.json", status: "acl-gated" },
  { id: "cdn-cache-headers", command: "CDN cache header tests", artifact: "coverage/image-seo-cdn-headers.json", status: "cdn-gated" },
  { id: "persistence", command: "FileAsset/PortfolioImage derivative metadata persistence tests", artifact: "coverage/image-seo-fileasset-portfolioimage-persistence.json", status: "wired" },
  { id: "audit-log", command: "image SEO processing audit log tests", artifact: "coverage/image-seo-audit-log.json", status: "wired" },
  { id: "lighthouse-image-audit", command: "Lighthouse image optimization audit", artifact: "coverage/lighthouse-image-seo-audit.json", status: "audit-gated" },
  { id: "ci-image-seo-job", command: "GitHub Actions image SEO pipeline job", artifact: "coverage/image-seo-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "redacted image SEO artifact audit", artifact: "coverage/image-seo-secret-safe-artifacts.json", status: "ci-gated" },
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
