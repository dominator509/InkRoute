import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  dashboardDataLayerArtifactPaths,
  dashboardDataLayerRouteTestFiles,
  dashboardDataLayerRuntimeCommands,
  dashboardDataLayerRuntimeMatrix,
  dashboardDataLayerRuntimeReadiness,
} from "../lib/dashboardDataLayerRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("dashboard data layer runtime contract", () => {
  const configPackageJson = readRepoFile("packages/config/package.json");
  const configSource = readRepoFile("packages/config/src/index.ts");
  const configTests = readRepoFile("packages/config/tests/dashboard-data.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-037 commands, route-test files, matrix rows, and artifacts", () => {
    expect(dashboardDataLayerRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/config typecheck",
      "pnpm --filter @inkroute/config test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "seeded database dashboard route smoke",
      "dashboard repository/API tenant-isolation tests",
      "dashboard repository/API RBAC and redaction tests",
      "dashboard sensitive-read AuditLog persistence tests",
      "GitHub Actions dashboard data repository evidence job",
    ]);
    expect(dashboardDataLayerRouteTestFiles).toEqual([
      "apps/dashboard/tests/booking-state-route-static.test.ts",
      "apps/dashboard/tests/client-read-route-static.test.ts",
      "apps/dashboard/tests/payment-read-route-static.test.ts",
      "apps/dashboard/tests/portfolio-read-route-static.test.ts",
      "apps/dashboard/tests/travel-read-route-static.test.ts",
      "apps/dashboard/tests/message-read-route-static.test.ts",
      "apps/dashboard/tests/seo-read-route-static.test.ts",
      "apps/dashboard/tests/settings-read-route-static.test.ts",
      "apps/dashboard/tests/calendar-read-route-static.test.ts",
      "apps/dashboard/tests/review-read-route-static.test.ts",
    ]);
    expect(dashboardDataLayerRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "config-typecheck",
      "config-tests",
      "dashboard-typecheck-build",
      "prisma-loader-matrix",
      "route-wiring-matrix",
      "static-demo-removal",
      "seeded-database-smoke",
      "tenant-isolation-rbac-redaction",
      "sensitive-read-auditlog",
      "ci-secret-safe-evidence",
    ]);
    expect(dashboardDataLayerArtifactPaths).toContain("coverage/dashboard-data-layer-runtime.json");
    expect(dashboardDataLayerArtifactPaths).toContain("test-results/dashboard-data-layer-runtime");
  });

  it("keeps package projections, repository evidence helper, and static route contracts wired", () => {
    expect(configPackageJson).toContain('"typecheck"');
    expect(configPackageJson).toContain('"test"');
    expect(configSource).toContain("buildDashboardRepositoryRouteEvidencePlan");
    expect(configSource).toContain("dashboardDataCollections");
    expect(configTests).toContain("buildDashboardRepositoryRouteEvidencePlan");

    for (const file of dashboardDataLayerRouteTestFiles) {
      const source = readRepoFile(file);
      expect(source).toContain("tenant");
      expect(source).toContain("no-store");
    }

    expect(readRepoFile("apps/dashboard/tests/booking-state-route-static.test.ts")).toContain("tx.auditLog.create");
    expect(readRepoFile("apps/dashboard/tests/client-read-route-static.test.ts")).toContain("buildTenantDashboardView");
    expect(readRepoFile("apps/dashboard/tests/payment-read-route-static.test.ts")).toContain("stripe");
    expect(readRepoFile("apps/dashboard/tests/portfolio-read-route-static.test.ts")).toContain("storage-key redaction");
    expect(readRepoFile("apps/dashboard/tests/message-read-route-static.test.ts")).toContain("message body redaction");
  });

  it("keeps runtime evidence blocked until seeded DB, tenant isolation, RBAC, audit, CI, and artifacts exist", () => {
    expect(dashboardDataLayerRuntimeReadiness.status).toBe("blocked");
    expect(dashboardDataLayerRuntimeReadiness.missingScripts).toEqual([]);
    expect(dashboardDataLayerRuntimeReadiness.missingPrismaLoaders).toEqual([]);
    expect(dashboardDataLayerRuntimeReadiness.missingRouteWiring).toEqual([]);
    expect(dashboardDataLayerRuntimeReadiness.remainingStaticDemoImports).toEqual([]);
    expect(dashboardDataLayerRuntimeReadiness.requiredCommands).toEqual([...dashboardDataLayerRuntimeCommands]);
    expect(dashboardDataLayerRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "seeded database dashboard route smoke plus repository/API test output",
      "tenant isolation, RBAC guard, and redaction test output",
      "no-store cache and sensitive-read AuditLog evidence",
      "dashboard typecheck/build, CI, and secret-safe artifact evidence",
    ]));
    expect(dashboardDataLayerRuntimeReadiness.blockers).toContain("Seeded database dashboard route smoke must pass.");
    expect(dashboardDataLayerRuntimeReadiness.blockers).toContain("Tenant-isolation tests must reject cross-tenant dashboard data reads.");
    expect(dashboardDataLayerRuntimeReadiness.blockers).toContain("Dashboard data artifacts must be redacted and free of secrets, raw PII, medical notes, payment data, provider tokens, and private object keys.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming seeded database readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 5 dashboard data layer runtime contracts");
    expect(ciWorkflow).toContain("dashboard-data-layer-runtime-static.test.ts");
    expect(ciWorkflow).toContain("dashboard-data-layer-runtime-artifacts");
    expect(unitManifest).toContain("unit-dashboard-data-layer-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/dashboardDataLayerRuntime.ts");
    expect(gapTracker).toContain("GAP-037 is repository-route-matrix wired");
    expect(dashboardDataLayerArtifactPaths).toContain("coverage/dashboard-data-secret-safe-artifacts.json");
  });
});
