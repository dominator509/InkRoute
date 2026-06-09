import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  performanceLoadRuntimeArtifactPaths,
  performanceLoadRuntimeCommands,
  performanceLoadRuntimeMatrix,
  performanceLoadRuntimeReadiness
} from "../lib/performanceLoadRuntime";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const packageJson = read("package.json");
const performanceBudget = read("testing/manifests/performance-budget.json");
const budgetVerifier = read("testing/scripts/verify-performance-budgets.mjs");
const phase14StaticCheck = read("testing/scripts/phase14-static-check.mjs");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");

describe("GAP-112 performance and load runtime wiring", () => {
  it("pins performance/load commands, matrix entries, and artifact paths", () => {
    expect(performanceLoadRuntimeCommands).toEqual([
      "pnpm test:performance:budgets",
      "Lighthouse CI for public and dashboard route budgets",
      "load test public booking, Stripe webhook, and secure upload intent endpoints",
      "database EXPLAIN/ANALYZE query-plan checks",
      "image optimization benchmark report",
      "GitHub Actions performance/load job"
    ]);
    expect(performanceLoadRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "budget-verifier",
      "lighthouse-core-web-vitals",
      "public-dashboard-route-budgets",
      "booking-webhook-upload-load",
      "db-explain-analyze",
      "image-optimization-benchmarks",
      "regression-thresholds-artifacts-ci"
    ]);
    expect(performanceLoadRuntimeArtifactPaths).toEqual(
      expect.arrayContaining([
        "coverage/performance-load-runtime.json",
        "coverage/performance-budget-verification.json",
        "coverage/performance-lighthouse-ci.json",
        "coverage/performance-core-web-vitals.json",
        "coverage/performance-public-route-budgets.json",
        "coverage/performance-booking-load.json",
        "coverage/performance-db-explain-analyze.json",
        "coverage/performance-image-optimization.json",
        "coverage/performance-ci-run-redacted.json",
        "coverage/performance-regression-triage.md",
        "test-results/performance-load-runtime"
      ])
    );
  });

  it("keeps performance budget manifest, verifier, and root script wired", () => {
    expect(packageJson).toContain('"test:performance:budgets"');
    expect(phase14StaticCheck).toContain("test:performance:budgets");
    expect(budgetVerifier).toContain("testing/manifests/performance-budget.json");
    for (const required of [
      "largestContentfulPaintMs",
      "public-home",
      "public-booking",
      "dashboard-overview",
      "booking-request-abuse",
      "stripe-webhook-burst",
      "secure-upload-intent-burst",
      "tenant-booking-dashboard",
      "webhook-idempotency-lookup",
      "portfolio_public",
      "reference_private"
    ]) {
      expect(performanceBudget).toContain(required);
    }
  });

  it("keeps readiness blocked until real Lighthouse, load, EXPLAIN, image, CI, and triage proof exists", () => {
    expect(performanceLoadRuntimeReadiness.status).toBe("blocked");
    expect(performanceLoadRuntimeReadiness.missingScripts).toEqual([]);
    expect(performanceLoadRuntimeReadiness.requiredCommands).toEqual([
      "pnpm test:performance:budgets",
      "Lighthouse CI for public and dashboard route budgets",
      "load test public booking, Stripe webhook, and secure upload intent endpoints",
      "database EXPLAIN/ANALYZE query-plan checks",
      "image optimization benchmark report"
    ]);
    expect(performanceLoadRuntimeReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "performance budget verifier, Lighthouse CI, Core Web Vitals, and route budget reports",
        "booking, webhook, and upload-intent load-test reports",
        "database EXPLAIN/ANALYZE query-plan output and image optimization benchmark report",
        "CI performance job, retained artifacts, regression thresholds, and triage log"
      ])
    );
    expect(performanceLoadRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Lighthouse CI must execute against public and dashboard route budgets.",
        "Public booking abuse/load test must meet RPS, p95, and error-rate targets.",
        "Database EXPLAIN/ANALYZE query-plan checks must pass for dashboard, SEO, and webhook idempotency queries.",
        "CI performance/load job must pass or publish explicit retained performance artifacts."
      ])
    );
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 14 performance load runtime contracts");
    expect(ciWorkflow).toContain("apps/web/tests/performance-load-runtime-static.test.ts");
    expect(ciWorkflow).toContain("performance-load-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/performance-load-runtime.json");
    expect(ciWorkflow).toContain("test-results/performance-load-runtime");
    expect(unitManifest).toContain("unit-web-performance-load-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/performanceLoadRuntime.ts");
    expect(gapTracker).toContain("live Lighthouse/load/database benchmark proof remains open");
  });
});
