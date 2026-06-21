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

export const imageSeoPipelineRequiredExternalEvidence = [
  "storage-backed responsive image transforms",
  "private original denial and public derivative CDN load proof",
  "CDN cache header proof",
  "FileAsset and PortfolioImage persistence proof",
  "AuditLog proof for image SEO pipeline operations",
  "Lighthouse image optimization audit",
  "CI image SEO pipeline evidence",
] as const;

export const imageSeoPipelineDecisionRequiredEvidence = [
  "SEO package typecheck/test and image pipeline static plan artifacts",
  "storage transform, private original ACL, public derivative load, and CDN header artifacts",
  "FileAsset/PortfolioImage persistence, audit log, and Lighthouse image audit artifacts",
  "CI evidence and redacted secret-safe provider artifact review",
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

export const imageSeoPipelineProofFiles = [
  "packages/seo/package.json",
  "packages/seo/src/index.ts",
  "packages/seo/tests/seo-engine.test.ts",
  "packages/db/prisma/schema.prisma",
  "apps/dashboard/lib/imageSeoPipeline.ts",
  "apps/dashboard/app/api/portfolio/image-seo-pipeline/route.ts",
  "apps/dashboard/app/portfolio/page.tsx",
  "apps/dashboard/components/ImageSeoActionPanel.tsx",
  "apps/dashboard/tests/image-seo-pipeline-static.test.ts",
  "apps/dashboard/app/api/portfolio/route.ts",
  "apps/dashboard/tests/portfolio-read-route-static.test.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type ImageSeoPipelineEvidenceArtifact = (typeof imageSeoPipelineArtifactPaths)[number];

export interface ImageSeoPipelineExecutionPlan {
  readonly id: "gap-077-image-seo-pipeline";
  readonly storageProviderExecutionAllowed: false;
  readonly lighthouseExecutionAllowed: false;
  readonly policy: ImageSeoPipelineExecutionPolicy;
  readonly source: "local-software-plan";
  readonly requiredCommands: typeof imageSeoPipelineRuntimeCommands;
  readonly requiredArtifacts: typeof imageSeoPipelineArtifactPaths;
  readonly localSoftwareArtifacts: readonly ImageSeoPipelineEvidenceArtifact[];
  readonly storageProviderArtifacts: readonly ImageSeoPipelineEvidenceArtifact[];
  readonly cdnProviderArtifacts: readonly ImageSeoPipelineEvidenceArtifact[];
  readonly lighthouseArtifacts: readonly ImageSeoPipelineEvidenceArtifact[];
  readonly secretSafeArtifactPath: ImageSeoPipelineEvidenceArtifact;
  readonly externalEvidenceRequired: typeof imageSeoPipelineRequiredExternalEvidence;
}

export interface ImageSeoPipelineExecutionPolicy {
  readonly executeStorageTransforms: false;
  readonly executePrivateOriginalAclChecks: false;
  readonly executePublicDerivativeCdnLoads: false;
  readonly executeCdnCacheHeaderChecks: false;
  readonly executeLighthouseAudit: false;
  readonly executeCi: false;
}

export interface ImageSeoPipelineArtifactReview {
  readonly artifactName: string;
  readonly safeToPersist: boolean;
  readonly redactedArtifact: unknown;
  readonly unsafeFindings: readonly string[];
  readonly requiredArtifactPath: ImageSeoPipelineEvidenceArtifact;
}

const imageSeoSensitiveKeyPattern =
  /(?:authorization|bucket|clientsecret|credential|cookie|email|original|password|phone|private|secret|signedurl|sourceobjectkey|token)/i;
const imageSeoEmailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const imageSeoPhonePattern = /\+?\d[\d ().-]{7,}\d/g;
const imageSeoTokenPattern = /\b(?:aws|bearer|cdn|gcp|s3|sk|supabase)[A-Za-z0-9._:/-]{8,}\b/gi;

function redactImageSeoPipelineValue(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (imageSeoSensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value
      .replace(imageSeoEmailPattern, "[REDACTED_EMAIL]")
      .replace(imageSeoPhonePattern, "[REDACTED_PHONE]")
      .replace(imageSeoTokenPattern, "[REDACTED_TOKEN]");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactImageSeoPipelineValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactImageSeoPipelineValue(entryValue, entryKey)]),
    );
  }

  return value;
}

export function buildRedactedImageSeoPipelineArtifact(artifact: unknown): unknown {
  return redactImageSeoPipelineValue(artifact);
}

export const imageSeoPipelineExecutionPolicy: ImageSeoPipelineExecutionPolicy = {
  executeStorageTransforms: false,
  executePrivateOriginalAclChecks: false,
  executePublicDerivativeCdnLoads: false,
  executeCdnCacheHeaderChecks: false,
  executeLighthouseAudit: false,
  executeCi: false,
};

export function buildImageSeoPipelineExecutionPlan(): ImageSeoPipelineExecutionPlan {
  return {
    id: "gap-077-image-seo-pipeline",
    storageProviderExecutionAllowed: false,
    lighthouseExecutionAllowed: false,
    policy: imageSeoPipelineExecutionPolicy,
    source: "local-software-plan",
    requiredCommands: imageSeoPipelineRuntimeCommands,
    requiredArtifacts: imageSeoPipelineArtifactPaths,
    localSoftwareArtifacts: [
      "coverage/image-seo-pipeline-plan.json",
      "coverage/image-seo-seo-typecheck.txt",
      "coverage/image-seo-seo-test.txt",
      "coverage/image-seo-fileasset-portfolioimage-persistence.json",
      "coverage/image-seo-audit-log.json",
    ],
    storageProviderArtifacts: [
      "coverage/image-seo-storage-transform.json",
      "coverage/image-seo-private-original-acl.json",
      "coverage/image-seo-public-derivative-load.json",
    ],
    cdnProviderArtifacts: ["coverage/image-seo-cdn-headers.json"],
    lighthouseArtifacts: ["coverage/lighthouse-image-seo-audit.json"],
    secretSafeArtifactPath: "coverage/image-seo-secret-safe-artifacts.json",
    externalEvidenceRequired: imageSeoPipelineRequiredExternalEvidence,
  };
}

export function buildImageSeoPipelineArtifactReview(
  artifactName: string,
  artifact: unknown,
  requiredArtifactPath: ImageSeoPipelineEvidenceArtifact = "coverage/image-seo-secret-safe-artifacts.json",
): ImageSeoPipelineArtifactReview {
  const redactedArtifact = buildRedactedImageSeoPipelineArtifact(artifact);
  const serialized = JSON.stringify(redactedArtifact);
  const unsafeFindings = [
    imageSeoEmailPattern.test(serialized) ? "email" : null,
    imageSeoPhonePattern.test(serialized) ? "phone" : null,
    imageSeoTokenPattern.test(serialized) ? "provider-token" : null,
  ].filter((finding): finding is string => finding !== null);

  return {
    artifactName,
    safeToPersist: unsafeFindings.length === 0,
    redactedArtifact,
    unsafeFindings,
    requiredArtifactPath,
  };
}

export interface ImageSeoPipelineEvidenceInput {
  readonly seoTypecheckPassed: boolean;
  readonly seoTestsPassed: boolean;
  readonly pipelinePlanContractPassed: boolean;
  readonly storageTransformPassed: boolean;
  readonly privateOriginalAclVerified: boolean;
  readonly publicDerivativeLoadVerified: boolean;
  readonly cdnCacheHeadersVerified: boolean;
  readonly fileAssetPortfolioImagePersistenceVerified: boolean;
  readonly auditLogVerified: boolean;
  readonly lighthouseImageAuditPassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly ImageSeoPipelineEvidenceArtifact[];
}

export interface ImageSeoPipelineEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly ImageSeoPipelineEvidenceArtifact[];
  readonly requiredCommands: typeof imageSeoPipelineRuntimeCommands;
  readonly requiredEvidence: typeof imageSeoPipelineDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export function buildImageSeoPipelineEvidenceDecision(input: ImageSeoPipelineEvidenceInput): ImageSeoPipelineEvidenceDecision {
  const blockers = [
    !input.seoTypecheckPassed ? "SEO package typecheck evidence is required." : null,
    !input.seoTestsPassed ? "SEO package test evidence is required." : null,
    !input.pipelinePlanContractPassed ? "Image SEO pipeline static plan evidence is required." : null,
    !input.storageTransformPassed ? "Storage-backed responsive image transform evidence is required." : null,
    !input.privateOriginalAclVerified ? "Private original denial evidence is required." : null,
    !input.publicDerivativeLoadVerified ? "Public derivative CDN load evidence is required." : null,
    !input.cdnCacheHeadersVerified ? "CDN cache header evidence is required." : null,
    !input.fileAssetPortfolioImagePersistenceVerified ? "FileAsset and PortfolioImage persistence evidence is required." : null,
    !input.auditLogVerified ? "Image SEO audit log evidence is required." : null,
    !input.lighthouseImageAuditPassed ? "Lighthouse image optimization audit evidence is required." : null,
    !input.ciEvidenceCaptured ? "CI image SEO pipeline job evidence is required." : null,
    !input.secretSafeArtifactReviewPassed ? "Secret-safe artifact review evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = imageSeoPipelineArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: imageSeoPipelineRuntimeCommands,
    requiredEvidence: imageSeoPipelineDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-077 image SEO pipeline evidence is complete with CI-safe artifacts captured."
        : "GAP-077 image SEO pipeline evidence remains blocked until storage, ACL, CDN, persistence, Lighthouse, CI, and redaction artifacts are captured.",
  };
}

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
    blurDataUrl: derivative.blurDataUrl,
    acl: derivative.acl,
    cacheControl: derivative.cacheControl,
    immutable: derivative.cacheControl.includes("immutable"),
    sourceObjectKey: plan.sourceObjectKey,
    sourceAcl: plan.sourceAcl,
    exifStripped: plan.requiresExifStrip,
    blurPlaceholderRequired: plan.requiresBlurPlaceholder,
  }));
}


