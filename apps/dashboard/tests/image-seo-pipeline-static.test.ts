import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildDashboardImageSeoPipelinePlan,
  buildImageSeoPipelineArtifactReview,
  buildImageSeoPipelineEvidenceDecision,
  buildImageSeoPipelineExecutionPlan,
  buildRedactedImageSeoPipelineArtifact,
  imageSeoCdnCacheControl,
  imageSeoDerivativeFormats,
  imageSeoDerivativeMetadata,
  imageSeoDerivativeWidths,
  imageSeoPipelineArtifactPaths,
  imageSeoPipelineDecisionRequiredEvidence,
  imageSeoPipelineExecutionPolicy,
  imageSeoPipelineProofFiles,
  imageSeoPipelineRequiredExternalEvidence,
  imageSeoPipelineRuntimeCommands,
  imageSeoPipelineRuntimeContract,
  imageSeoPipelineRuntimeMatrix,
} from "../lib/imageSeoPipeline";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/portfolio/image-seo-pipeline/route.ts"), "utf8");
const portfolioPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/portfolio/page.tsx"), "utf8");
const imageSeoActionPanelSource = readFileSync(join(process.cwd(), "apps/dashboard/components/ImageSeoActionPanel.tsx"), "utf8");
const schemaSource = readFileSync(join(process.cwd(), "packages/db/prisma/schema.prisma"), "utf8");
const ciWorkflow = readFileSync(join(process.cwd(), ".github/workflows/ci.yml"), "utf8");
const unitManifest = readFileSync(join(process.cwd(), "testing/manifests/unit-test-manifest.json"), "utf8");
const gapTracker = readFileSync(join(process.cwd(), "GAP_TRACKER.md"), "utf8");

describe("GAP-077 image SEO pipeline boundary", () => {
  it("plans responsive public derivatives from private originals", () => {
    const plan = buildDashboardImageSeoPipelinePlan({ now: "2026-06-09T00:00:00.000Z" });
    expect(plan.sourceAcl).toBe("private");
    expect(plan.sourceRemainsPrivate).toBe(true);
    expect(plan.requiresExifStrip).toBe(true);
    expect(plan.requiresDimensionProbe).toBe(true);
    expect(plan.requiresBlurPlaceholder).toBe(true);
    expect(plan.derivatives).toHaveLength(imageSeoDerivativeFormats.length * imageSeoDerivativeWidths.length);
    expect(plan.derivatives.every((derivative) => derivative.acl === "public")).toBe(true);
    expect(plan.derivatives.every((derivative) => derivative.cacheControl === imageSeoCdnCacheControl)).toBe(true);
  });

  it("captures derivative metadata for FileAsset and PortfolioImage persistence", () => {
    const metadata = imageSeoDerivativeMetadata(buildDashboardImageSeoPipelinePlan({}));
    expect(metadata).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ width: 320, format: "webp", acl: "public", immutable: true, blurDataUrl: expect.stringContaining("svg") }),
        expect.objectContaining({ width: 1600, format: "jpeg", acl: "public", immutable: true, blurDataUrl: expect.stringContaining("svg") }),
      ]),
    );
    expect(schemaSource).toContain("model FileAsset");
    expect(schemaSource).toContain("model PortfolioImage");
    expect(schemaSource).toContain("@@unique([bucket, objectKey])");
  });

  it("guards the dashboard processing route with RBAC, tenant isolation, transactions, and audit logs", () => {
    expect(routeSource).toContain('assertPermission(actor, "portfolio:read")');
    expect(routeSource).toContain('assertPermission(actor, "portfolio:write")');
    expect(routeSource).toContain("tenantId !== actor.tenantId");
    expect(routeSource).toContain("prisma.$transaction");
    expect(routeSource).toContain("tx.fileAsset.upsert");
    expect(routeSource).toContain("tx.portfolioImage.create");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain("sourceObjectKey: \"[redacted-dashboard-field]\"");
    expect(routeSource).toContain("PROVIDER_IMAGE_SEO_PERSISTENCE_NOT_CONFIGURED");
    expect(routeSource).toContain("localImageSeoDryRunFallbackDisabled");
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("headers: noStoreHeaders");
    expect(routeSource).not.toContain('headers: { "Cache-Control": "no-store" }');
  });

  it("wires the portfolio dashboard action through the gated image SEO route", () => {
    expect(portfolioPageSource).toContain("ImageSeoActionPanel");
    expect(portfolioPageSource).not.toContain("Image workflow actions still require");
    expect(imageSeoActionPanelSource).toContain('fetch("/api/portfolio/image-seo-pipeline"');
    expect(imageSeoActionPanelSource).toContain("Generate derivative draft");
    expect(imageSeoActionPanelSource).toContain("real storage transforms, CDN proof, and Lighthouse evidence remain gated");
  });

  it("keeps private-original, CDN, and Lighthouse proof tracked as runtime blockers", () => {
    expect(imageSeoPipelineRuntimeContract.status).toBe("blocked");
    expect(imageSeoPipelineRuntimeContract.requiredEvidence).toEqual(
      expect.arrayContaining([
        "storage-backed image processing worker and upload test evidence",
        "private original and public derivative ACL/load test evidence",
        "CDN cache header, immutable URL, and Lighthouse image audit evidence",
      ]),
    );
    expect(imageSeoPipelineArtifactPaths).toContain("coverage/image-seo-private-original-acl.json");
    expect(imageSeoPipelineArtifactPaths).toContain("coverage/lighthouse-image-seo-audit.json");
  });

  it("pins the image SEO runtime matrix and provider proof boundaries", () => {
    expect(imageSeoPipelineRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/seo typecheck",
      "pnpm --filter @inkroute/seo test",
      "pnpm vitest run apps/dashboard/tests/image-seo-pipeline-static.test.ts",
      "storage-backed responsive image transform tests",
      "private original denial and public derivative load tests",
      "CDN cache header tests",
      "Lighthouse image optimization audit",
    ]);
    expect(imageSeoPipelineRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "seo-typecheck",
      "seo-tests",
      "pipeline-plan",
      "storage-transform",
      "private-original-acl",
      "public-derivative-load",
      "cdn-cache-headers",
      "persistence",
      "audit-log",
      "lighthouse-image-audit",
      "ci-image-seo-job",
      "secret-safe-artifacts",
    ]);
    expect(imageSeoPipelineArtifactPaths).toContain("coverage/image-seo-storage-transform.json");
    expect(imageSeoPipelineArtifactPaths).toContain("coverage/image-seo-secret-safe-artifacts.json");
  });

  it("builds a provider-disabled local image SEO execution plan", () => {
    const plan = buildImageSeoPipelineExecutionPlan();

    expect(plan.id).toBe("gap-077-image-seo-pipeline");
    expect(plan.storageProviderExecutionAllowed).toBe(false);
    expect(plan.lighthouseExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(imageSeoPipelineExecutionPolicy);
    expect(plan.policy).toEqual({
      executeStorageTransforms: false,
      executePrivateOriginalAclChecks: false,
      executePublicDerivativeCdnLoads: false,
      executeCdnCacheHeaderChecks: false,
      executeLighthouseAudit: false,
      executeCi: false,
    });
    expect(plan.requiredCommands).toBe(imageSeoPipelineRuntimeCommands);
    expect(plan.requiredArtifacts).toBe(imageSeoPipelineArtifactPaths);
    expect(plan.localSoftwareArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/image-seo-pipeline-plan.json",
        "coverage/image-seo-fileasset-portfolioimage-persistence.json",
        "coverage/image-seo-audit-log.json",
      ]),
    );
    expect(plan.storageProviderArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/image-seo-storage-transform.json",
        "coverage/image-seo-private-original-acl.json",
        "coverage/image-seo-public-derivative-load.json",
      ]),
    );
    expect(plan.cdnProviderArtifacts).toEqual(["coverage/image-seo-cdn-headers.json"]);
    expect(plan.lighthouseArtifacts).toEqual(["coverage/lighthouse-image-seo-audit.json"]);
    expect(plan.secretSafeArtifactPath).toBe("coverage/image-seo-secret-safe-artifacts.json");
    expect(plan.externalEvidenceRequired).toBe(imageSeoPipelineRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toEqual([
      "storage-backed responsive image transforms",
      "private original denial and public derivative CDN load proof",
      "CDN cache header proof",
      "FileAsset and PortfolioImage persistence proof",
      "AuditLog proof for image SEO pipeline operations",
      "Lighthouse image optimization audit",
      "CI image SEO pipeline evidence",
    ]);
  });

  it("redacts private image SEO provider artifacts before persistence", () => {
    const rawArtifact = {
      storage: {
        bucket: "tenant-private-originals",
        sourceObjectKey: "tenant-1/private/originals/portfolio/item-1/dragon.jpg",
        signedUrl: "https://storage.example.com/private/originals/dragon.jpg?token=supabase-secret-token",
      },
      actor: {
        email: "owner@example.com",
        phone: "+1 555 010 2222",
      },
      derivative: {
        objectKey: "tenant-1/public/derivatives/portfolio/item-1/dragon-768.webp",
        publicUrl: "https://cdn.inkroute.example/tenant-1/dragon-768.webp",
      },
    };

    const redacted = buildRedactedImageSeoPipelineArtifact(rawArtifact);
    const review = buildImageSeoPipelineArtifactReview("image-seo-storage-transform", rawArtifact);
    const serialized = JSON.stringify(review.redactedArtifact);

    expect(JSON.stringify(redacted)).not.toContain("tenant-private-originals");
    expect(serialized).not.toContain("tenant-1/private/originals");
    expect(serialized).not.toContain("supabase-secret-token");
    expect(serialized).not.toContain("owner@example.com");
    expect(serialized).not.toContain("+1 555 010 2222");
    expect(serialized).toContain("https://cdn.inkroute.example/tenant-1/dragon-768.webp");
    expect(review.safeToPersist).toBe(true);
    expect(review.unsafeFindings).toEqual([]);
    expect(review.requiredArtifactPath).toBe("coverage/image-seo-secret-safe-artifacts.json");
  });

  it("classifies GAP-077 image SEO pipeline evidence as blocked until every provider artifact is captured", () => {
    const blocked = buildImageSeoPipelineEvidenceDecision({
      seoTypecheckPassed: true,
      seoTestsPassed: true,
      pipelinePlanContractPassed: true,
      storageTransformPassed: false,
      privateOriginalAclVerified: false,
      publicDerivativeLoadVerified: false,
      cdnCacheHeadersVerified: false,
      fileAssetPortfolioImagePersistenceVerified: true,
      auditLogVerified: true,
      lighthouseImageAuditPassed: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: ["coverage/image-seo-pipeline-plan.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Storage-backed responsive image transform evidence is required.",
        "Private original denial evidence is required.",
        "Public derivative CDN load evidence is required.",
        "CDN cache header evidence is required.",
        "Lighthouse image optimization audit evidence is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/image-seo-storage-transform.json");
    expect(blocked.requiredCommands).toBe(imageSeoPipelineRuntimeCommands);
    expect(blocked.requiredEvidence).toBe(imageSeoPipelineDecisionRequiredEvidence);

    const complete = buildImageSeoPipelineEvidenceDecision({
      seoTypecheckPassed: true,
      seoTestsPassed: true,
      pipelinePlanContractPassed: true,
      storageTransformPassed: true,
      privateOriginalAclVerified: true,
      publicDerivativeLoadVerified: true,
      cdnCacheHeadersVerified: true,
      fileAssetPortfolioImagePersistenceVerified: true,
      auditLogVerified: true,
      lighthouseImageAuditPassed: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: imageSeoPipelineArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.requiredEvidence).toBe(imageSeoPipelineDecisionRequiredEvidence);
    expect(complete.redactedSummary).toContain("CI-safe artifacts captured");
  });

  it("keeps CI, manifest, and tracker evidence tied to GAP-077", () => {
    expect(ciWorkflow).toContain("Run Phase 10 image SEO pipeline runtime contracts");
    expect(ciWorkflow).toContain("image-seo-pipeline-static.test.ts");
    expect(ciWorkflow).toContain("image-seo-pipeline-artifacts");
    expect(unitManifest).toContain("unit-dashboard-image-seo-pipeline-static");
    expect(unitManifest).toContain("imageSeoPipelineRuntimeMatrix");
    expect(gapTracker).toContain("Image SEO pipeline evidence classifier wired and runtime-matrix gated");
    expect(gapTracker).toContain("imageSeoPipelineDecisionRequiredEvidence");
  });

  it("pins current image SEO pipeline proof files for GAP-077", () => {
    expect(imageSeoPipelineProofFiles).toEqual(expect.arrayContaining([
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
    ]));
    for (const file of imageSeoPipelineProofFiles) {
      expect(readFileSync(join(process.cwd(), file), "utf8").length).toBeGreaterThan(0);
    }
  });
});
