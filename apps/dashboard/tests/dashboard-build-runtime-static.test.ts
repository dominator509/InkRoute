import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  dashboardBuildArtifactPaths,
  dashboardBuildRuntimeCommands,
  dashboardBuildRuntimeMatrix,
  dashboardBuildRuntimeReadiness,
} from "../lib/dashboardBuildRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("dashboard build/runtime verification contract", () => {
  const dashboardPackageJson = readRepoFile("apps/dashboard/package.json");
  const nextConfig = readRepoFile("apps/dashboard/next.config.mjs");
  const dashboardLayout = readRepoFile("apps/dashboard/app/layout.tsx");
  const dashboardMiddleware = readRepoFile("apps/dashboard/middleware.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-039 install, typecheck, build, browser smoke commands, matrix rows, and artifacts", () => {
    expect(dashboardBuildRuntimeCommands).toEqual([
      "pnpm install",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/dashboard test",
      "dashboard browser smoke: /",
      "dashboard browser smoke: /bookings",
      "dashboard browser smoke: /clients",
      "dashboard browser smoke: /payments",
      "dashboard browser smoke: /portfolio",
      "dashboard browser smoke: /travel",
      "dashboard browser smoke: /messages",
      "dashboard browser smoke: /settings",
      "GitHub Actions dashboard build/runtime evidence job",
    ]);
    expect(dashboardBuildRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "dependency-install",
      "next-react-types",
      "dashboard-typecheck",
      "dashboard-build",
      "dashboard-tests",
      "browser-home",
      "browser-bookings-clients",
      "browser-commerce-content",
      "browser-messages-settings",
      "next15-runtime",
      "ci-secret-safe-evidence",
    ]);
    expect(dashboardBuildArtifactPaths).toContain("coverage/dashboard-build-runtime.json");
    expect(dashboardBuildArtifactPaths).toContain("coverage/dashboard-install-output.txt");
    expect(dashboardBuildArtifactPaths).toContain("test-results/dashboard-build-runtime");
  });

  it("keeps dashboard Next/React dependencies, scripts, config, layout, and middleware build surfaces visible", () => {
    expect(dashboardPackageJson).toContain('"next"');
    expect(dashboardPackageJson).toContain('"react"');
    expect(dashboardPackageJson).toContain('"react-dom"');
    expect(dashboardPackageJson).toContain('"@types/react"');
    expect(dashboardPackageJson).toContain('"typecheck"');
    expect(dashboardPackageJson).toContain('"build"');
    expect(dashboardPackageJson).toContain('"test"');
    expect(nextConfig).toContain("transpilePackages");
    expect(dashboardLayout).toContain("export const metadata");
    expect(dashboardLayout).toContain("DashboardLayout");
    expect(dashboardMiddleware).toContain("export const config");
  });

  it("keeps build/runtime readiness blocked until install, Next build, and browser rendering evidence exists", () => {
    expect(dashboardBuildRuntimeReadiness.status).toBe("blocked");
    expect(dashboardBuildRuntimeReadiness.missingScripts).toEqual([]);
    expect(dashboardBuildRuntimeReadiness.requiredCommands).toEqual([
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/dashboard test",
      "pnpm test:e2e --project=dashboard-chromium",
      "dashboard provider-backed auth smoke tests",
      "dashboard RBAC and cross-tenant denial tests",
      "dashboard mutation AuditLog persistence tests",
      "GitHub Actions dashboard launch evidence job",
    ]);
    expect(dashboardBuildRuntimeReadiness.requiredEvidence).toContain(
      "dashboard typecheck, build, unit/contract, and Playwright smoke output",
    );
    expect(dashboardBuildRuntimeReadiness.blockers).toContain("@inkroute/dashboard typecheck must pass.");
    expect(dashboardBuildRuntimeReadiness.blockers).toContain("@inkroute/dashboard build must pass.");
    expect(dashboardBuildRuntimeReadiness.blockers).toContain("Dashboard Playwright smoke tests must pass with seeded tenant data.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming build verification has run", () => {
    expect(ciWorkflow).toContain("Run Phase 5 dashboard build/runtime verification contracts");
    expect(ciWorkflow).toContain("dashboard-build-runtime-static.test.ts");
    expect(ciWorkflow).toContain("dashboard-build-runtime-artifacts");
    expect(unitManifest).toContain("unit-dashboard-build-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/dashboardBuildRuntime.ts");
    expect(gapTracker).toContain("GAP-039 is build-runtime-matrix wired");
    expect(dashboardBuildArtifactPaths).toContain("coverage/dashboard-build-secret-safe-artifacts.json");
  });
});
