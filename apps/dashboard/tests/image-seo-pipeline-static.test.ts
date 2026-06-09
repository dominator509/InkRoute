import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildDashboardImageSeoPipelinePlan,
  imageSeoCdnCacheControl,
  imageSeoDerivativeFormats,
  imageSeoDerivativeMetadata,
  imageSeoDerivativeWidths,
  imageSeoPipelineArtifactPaths,
  imageSeoPipelineRuntimeCommands,
  imageSeoPipelineRuntimeContract,
  imageSeoPipelineRuntimeMatrix,
} from "../lib/imageSeoPipeline";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/portfolio/image-seo-pipeline/route.ts"), "utf8");
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
        expect.objectContaining({ width: 320, format: "webp", acl: "public", immutable: true }),
        expect.objectContaining({ width: 1600, format: "jpeg", acl: "public", immutable: true }),
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

  it("keeps CI, manifest, and tracker evidence tied to GAP-077", () => {
    expect(ciWorkflow).toContain("Run Phase 10 image SEO pipeline runtime contracts");
    expect(ciWorkflow).toContain("image-seo-pipeline-static.test.ts");
    expect(ciWorkflow).toContain("image-seo-pipeline-artifacts");
    expect(unitManifest).toContain("unit-dashboard-image-seo-pipeline-static");
    expect(unitManifest).toContain("imageSeoPipelineRuntimeMatrix");
    expect(gapTracker).toContain("GAP-077 is image-seo-pipeline-runtime-matrix wired");
  });
});
