import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  publicContentArtifactPaths,
  publicContentRuntimeCommands,
  publicContentRuntimeMatrix,
  publicContentRuntimeReadiness,
} from "../lib/publicContentRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("public content runtime evidence contract", () => {
  const configPackageJson = readRepoFile("packages/config/package.json");
  const configSource = readRepoFile("packages/config/src/index.ts");
  const configTests = readRepoFile("packages/config/tests/public-content.test.ts");
  const dashboardReviewRoute = readRepoFile("apps/dashboard/app/api/reviews/route.ts");
  const dashboardReviewTest = readRepoFile("apps/dashboard/tests/review-read-route-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins public content commands, matrix rows, and artifact paths", () => {
    expect(publicContentRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/config typecheck",
      "pnpm --filter @inkroute/config test",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "public content seeded DB/API redaction tests",
      "public content browser HTML redaction smoke",
      "public content cache revalidation smoke",
    ]);
    expect(publicContentRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "config-and-web-package-gates",
      "tenant-domain-repository-route-wiring",
      "seeded-db-or-cms-content-reads",
      "api-json-and-rendered-html-redaction",
      "private-portfolio-exclusion",
      "cache-revalidation-smoke",
      "browser-and-ci-evidence",
    ]);
    expect(publicContentArtifactPaths).toContain("coverage/public-content-runtime.json");
    expect(publicContentArtifactPaths).toContain("coverage/public-content-rendered-html-redaction.json");
    expect(publicContentArtifactPaths).toContain("test-results/public-content-runtime");
  });

  it("keeps config scripts, public projection helpers, redaction tests, and dashboard review redaction visible", () => {
    for (const scriptName of ["typecheck", "test"]) {
      expect(configPackageJson).toContain(`"${scriptName}"`);
    }
    expect(configSource).toContain("buildPublicContentBundle");
    expect(configSource).toContain("buildPublicContentRuntimeEvidencePlan");
    expect(configSource).toContain("privateOriginalAvailable: false");
    expect(configTests).toContain("normalizes tenant slugs and rejects unknown tenants");
    expect(configTests).toContain("blocks public content runtime evidence until repository wiring, redaction, cache, browser, and CI proof exist");
    expect(dashboardReviewRoute).toContain("reviews");
    expect(dashboardReviewTest).toContain("private");
  });

  it("keeps public content evidence blocked until persisted repository reads, redaction, cache, browser, and CI proof exist", () => {
    expect(publicContentRuntimeReadiness.status).toBe("blocked");
    expect(publicContentRuntimeReadiness.missingScripts).toEqual([]);
    expect(publicContentRuntimeReadiness.requiredCommands).toEqual([...publicContentRuntimeCommands]);
    expect(publicContentRuntimeReadiness.requiredEvidence).toEqual([
      "persistent tenant/domain resolver plus public repository route wiring map",
      "seeded DB or CMS public content read transcript",
      "public API JSON and rendered HTML private-field redaction proof",
      "public content cache revalidation configuration and invalidation smoke output",
      "web typecheck/build, browser smoke, and CI artifact evidence",
    ]);
    expect(publicContentRuntimeReadiness.blockers).toContain(
      "Tenant/domain resolver must be backed by persisted tenant records instead of static demo-only matching.",
    );
    expect(publicContentRuntimeReadiness.blockers).toContain(
      "Public API JSON must be proven free of tenant IDs, artist IDs, attribution keys, private object keys, plan/status fields, and non-public portfolio records.",
    );
    expect(publicContentRuntimeReadiness.blockers).toContain(
      "Browser smoke evidence must cover portfolio, travel, FAQ, testimonials, city, and style pages.",
    );
  });

  it("wires CI, manifest, tracker, and artifacts without claiming repository-backed public content readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 3 public content runtime contracts");
    expect(ciWorkflow).toContain("public-content-runtime-static.test.ts");
    expect(ciWorkflow).toContain("public-content-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/public-content-runtime.json");
    expect(unitManifest).toContain("unit-web-public-content-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/publicContentRuntime.ts");
    expect(gapTracker).toContain("live persisted tenant/domain resolver, repository-backed public reads, DB/CMS seed proof, route/API adoption proof, API JSON and rendered HTML redaction proof, cache revalidation, web build, browser smoke, CI evidence, and secret-safe artifact review remain open");
  });
});
