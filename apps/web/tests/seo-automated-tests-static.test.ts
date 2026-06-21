import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  buildRedactedSeoAutomatedArtifact,
  buildSeoAutomatedArtifactReview,
  buildSeoAutomatedEvidenceDecision,
  buildSeoAutomatedExecutionPlan,
  seoAutomatedArtifactPaths,
  seoAutomatedDecisionRequiredEvidence,
  seoAutomatedExecutionPolicy,
  seoAutomatedGateCommands,
  seoAutomatedGateMatrix,
  seoAutomatedProofFiles,
  seoAutomatedRequiredExternalEvidence,
  seoAutomatedSuites,
  seoAutomatedTestContract,
} from "../lib/seoAutomatedTests";

const ciWorkflow = readFileSync(".github/workflows/ci.yml", "utf8");
const unitManifest = readFileSync("testing/manifests/unit-test-manifest.json", "utf8");
const gapTracker = readFileSync("GAP_TRACKER.md", "utf8");

describe("GAP-078 SEO automated test gate", () => {
  it("enumerates SEO package, preview route, adjacent runtime, crawl, provider, and image suites", () => {
    expect(seoAutomatedSuites.map((suite) => suite.id)).toEqual([
      "seo-package-tests",
      "seo-package-typecheck",
      "sitemap-route-tests",
      "seo-preview-route-tests",
      "sitemap-preview-route-tests",
      "canonical-domain-runtime-static",
      "structured-data-crawl-qa-static",
      "seo-analytics-attribution-static",
      "search-console-route-static",
      "image-seo-pipeline-static",
      "phase10-seo-runtime-build-static",
    ]);
  });

  it("links GAP-073 crawl evidence and GAP-076 runtime/build evidence into the SEO automated gate", () => {
    expect(seoAutomatedTestContract.blockers).not.toContain("Runtime/build evidence must be covered by GAP-076.");
    expect(seoAutomatedTestContract.blockers).not.toContain("Rendered crawl and external structured-data evidence must be covered by GAP-073.");
    expect(seoAutomatedTestContract.blockers).not.toContain("CI must run the SEO package and preview route test gate.");
    expect(seoAutomatedTestContract.requiredSuites).toContain("CI SEO package and preview route test gate");
  });

  it("retains SEO automated artifacts while package/route execution remains explicit", () => {
    expect(seoAutomatedArtifactPaths).toContain("coverage/seo-automated-test-gate.json");
    expect(seoAutomatedArtifactPaths).toContain("coverage/phase10-seo-*.json");
    expect(seoAutomatedArtifactPaths).toContain("test-results/seo-automated");
    expect(seoAutomatedTestContract.status).toBe("blocked");
    expect(seoAutomatedTestContract.requiredEvidence).toEqual(
      expect.arrayContaining([
        "route record, sitemap, metadata, and audit test output",
        "content brief, internal-link, JSON-LD, and structured-data snapshot test output",
        "image pipeline, canonical/redirect, and Search Console planner test output",
        "web sitemap, SEO preview, and sitemap preview route test output",
      ]),
    );
  });

  it("pins the SEO automated gate command and artifact matrix", () => {
    expect(seoAutomatedGateCommands).toEqual([
      "pnpm --filter @inkroute/seo test",
      "pnpm --filter @inkroute/seo typecheck",
      "pnpm vitest run apps/web/tests/seo-automated-tests-static.test.ts apps/web/tests/sitemap-route.test.ts apps/web/tests/canonical-domain-runtime-static.test.ts apps/web/tests/structured-data-crawl-qa-static.test.ts apps/web/tests/phase10-seo-runtime-build-static.test.ts apps/dashboard/tests/search-console-route-static.test.ts apps/dashboard/tests/image-seo-pipeline-static.test.ts",
    ]);
    expect(seoAutomatedGateMatrix.map((entry) => entry.id)).toEqual([
      "seo-package-tests",
      "seo-package-typecheck",
      "route-contracts",
      "linked-gap073-crawl",
      "linked-gap076-runtime-build",
      "ci-seo-automated-gate",
      "secret-safe-artifacts",
    ]);
    expect(seoAutomatedArtifactPaths).toContain("coverage/seo-automated-secret-safe-artifacts.json");
  });

  it("builds a local SEO automated execution plan without CI or provider execution", () => {
    const plan = buildSeoAutomatedExecutionPlan();

    expect(plan.id).toBe("gap-078-seo-automated-test-gate");
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.providerExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(seoAutomatedExecutionPolicy);
    expect(plan.policy).toEqual({
      executeSeoPackageTests: false,
      executeRouteStaticTests: false,
      executeLinkedGap073Crawl: false,
      executeLinkedGap076RuntimeBuild: false,
      executeCi: false,
      executeProviderAdjacentChecks: false,
    });
    expect(plan.requiredCommands).toBe(seoAutomatedGateCommands);
    expect(plan.requiredArtifacts).toBe(seoAutomatedArtifactPaths);
    expect(plan.localSuiteIds).toEqual(seoAutomatedSuites.map((suite) => suite.id));
    expect(plan.linkedGapArtifacts).toEqual([
      "coverage/seo-automated-linked-gap073-crawl.json",
      "coverage/seo-automated-linked-gap076-runtime-build.json",
    ]);
    expect(plan.ciArtifacts).toEqual(["coverage/seo-automated-ci-evidence.json"]);
    expect(plan.secretSafeArtifactPath).toBe("coverage/seo-automated-secret-safe-artifacts.json");
    expect(plan.externalEvidenceRequired).toBe(seoAutomatedRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toEqual([
      "SEO package test and typecheck command output",
      "route/static contract command output",
      "linked GAP-073 crawl evidence",
      "linked GAP-076 runtime/build evidence",
      "GitHub Actions SEO automated gate evidence",
      "produced secret-safe artifact bundle",
    ]);
  });

  it("redacts SEO automated test artifacts before persistence", () => {
    const rawArtifact = {
      command: "pnpm --filter @inkroute/seo test",
      env: {
        workflowToken: "ghp_seoAutomatedGateToken",
        searchConsoleToken: "ya29.search-console-token",
      },
      failure: {
        email: "tester@example.com",
        phone: "+1 555 010 3333",
        trace: "private stack trace with tenant draft",
      },
      summary: "SEO package test failed on sitemap route",
    };

    const redacted = buildRedactedSeoAutomatedArtifact(rawArtifact);
    const review = buildSeoAutomatedArtifactReview("seo-automated-test-output", rawArtifact);
    const serialized = JSON.stringify(review.redactedArtifact);

    expect(JSON.stringify(redacted)).not.toContain("ghp_seoAutomatedGateToken");
    expect(serialized).not.toContain("ya29.search-console-token");
    expect(serialized).not.toContain("tester@example.com");
    expect(serialized).not.toContain("+1 555 010 3333");
    expect(serialized).not.toContain("private stack trace");
    expect(serialized).toContain("SEO package test failed on sitemap route");
    expect(review.safeToPersist).toBe(true);
    expect(review.unsafeFindings).toEqual([]);
    expect(review.requiredArtifactPath).toBe("coverage/seo-automated-secret-safe-artifacts.json");
  });

  it("classifies GAP-078 SEO automated gate evidence as blocked until every linked artifact is captured", () => {
    const blocked = buildSeoAutomatedEvidenceDecision({
      seoPackageTestsPassed: true,
      seoPackageTypecheckPassed: false,
      routeContractsPassed: true,
      linkedGap073CrawlEvidenceCaptured: false,
      linkedGap076RuntimeBuildEvidenceCaptured: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: ["coverage/seo-automated-test-gate.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "SEO package typecheck evidence is required.",
        "Linked GAP-073 structured-data crawl evidence is required.",
        "Linked GAP-076 runtime/build evidence is required.",
        "CI SEO automated test gate evidence is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/seo-automated-linked-gap073-crawl.json");
    expect(blocked.requiredCommands).toBe(seoAutomatedGateCommands);
    expect(blocked.requiredEvidence).toBe(seoAutomatedDecisionRequiredEvidence);

    const complete = buildSeoAutomatedEvidenceDecision({
      seoPackageTestsPassed: true,
      seoPackageTypecheckPassed: true,
      routeContractsPassed: true,
      linkedGap073CrawlEvidenceCaptured: true,
      linkedGap076RuntimeBuildEvidenceCaptured: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: seoAutomatedArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.redactedSummary).toContain("CI-safe artifacts captured");
  });

  it("requires the SEO automated gate in CI", () => {
    expect(ciWorkflow).toContain("Run Phase 10 SEO automated test gate");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/seo test");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/seo typecheck");
    expect(ciWorkflow).toContain("apps/web/tests/seo-automated-tests-static.test.ts");
    expect(ciWorkflow).toContain("apps/web/tests/sitemap-route.test.ts");
    expect(ciWorkflow).toContain("apps/dashboard/tests/image-seo-pipeline-static.test.ts");
    expect(ciWorkflow).toContain("seo-automated-test-artifacts");
    expect(ciWorkflow).toContain("coverage/seo-automated-ci-evidence.json");
    expect(unitManifest).toContain("seoAutomatedGateMatrix");
    expect(gapTracker).toContain("SEO automated test evidence classifier wired and runtime-matrix gated");
    expect(gapTracker).toContain("seoAutomatedDecisionRequiredEvidence");
  });

  it("pins current SEO automated test proof files for GAP-078", () => {
    expect(seoAutomatedProofFiles).toEqual(expect.arrayContaining([
      "packages/seo/package.json",
      "packages/seo/src/index.ts",
      "packages/seo/tests/seo-engine.test.ts",
      "apps/web/lib/seoAutomatedTests.ts",
      "apps/web/tests/seo-automated-tests-static.test.ts",
      "apps/web/app/sitemap.ts",
      "apps/web/tests/sitemap-route.test.ts",
      "apps/web/app/api/public/[tenantSlug]/seo-preview/route.ts",
      "apps/web/app/api/public/[tenantSlug]/sitemap-preview/route.ts",
      "apps/web/tests/canonical-domain-runtime-static.test.ts",
      "apps/web/tests/structured-data-crawl-qa-static.test.ts",
      "apps/web/tests/phase10-seo-runtime-build-static.test.ts",
      "apps/dashboard/tests/search-console-route-static.test.ts",
      "apps/dashboard/tests/image-seo-pipeline-static.test.ts",
      ".github/workflows/ci.yml",
      "testing/manifests/unit-test-manifest.json",
    ]));
    for (const file of seoAutomatedProofFiles) {
      expect(readFileSync(file, "utf8").length).toBeGreaterThan(0);
    }
  });
});
