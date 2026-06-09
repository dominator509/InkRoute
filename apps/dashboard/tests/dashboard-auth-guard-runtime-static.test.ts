import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  dashboardAuthGuardArtifactPaths,
  dashboardAuthGuardReadinessAreas,
  dashboardAuthGuardRuntimeCommands,
  dashboardAuthGuardRuntimeMatrix,
  dashboardAuthGuardRuntimeReadiness,
} from "../lib/dashboardAuthGuardRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("dashboard auth guard runtime contract", () => {
  const authPackageJson = readRepoFile("packages/auth/package.json");
  const authSource = readRepoFile("packages/auth/src/index.ts");
  const authTests = readRepoFile("packages/auth/tests/authorization.test.ts");
  const dashboardLayout = readRepoFile("apps/dashboard/app/layout.tsx");
  const dashboardAuthApi = readRepoFile("apps/dashboard/app/api/dashboardAuth.ts");
  const dashboardMiddleware = readRepoFile("apps/dashboard/middleware.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-036 commands, readiness areas, matrix rows, and artifacts", () => {
    expect(dashboardAuthGuardRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/auth typecheck",
      "pnpm --filter @inkroute/auth test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "dashboard middleware auth guard tests",
      "dashboard protected layout auth guard tests",
      "dashboard API auth guard tests",
      "browser dashboard login/logout smoke",
      "browser dashboard tenant-switch smoke",
      "browser dashboard cross-tenant denial smoke",
      "auth AuditLog persistence tests",
      "GitHub Actions dashboard auth guard evidence job",
    ]);
    expect(dashboardAuthGuardReadinessAreas).toContain("dashboard-middleware-guard");
    expect(dashboardAuthGuardReadinessAreas).toContain("dashboard-api-helper-guard");
    expect(dashboardAuthGuardReadinessAreas).toContain("browser-cross-tenant-denial");
    expect(dashboardAuthGuardRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "auth-typecheck",
      "auth-tests",
      "dashboard-typecheck-build",
      "middleware-guard",
      "protected-layout-guard",
      "api-helper-guard",
      "provider-session",
      "tenantmember-customrole-db",
      "unauthorized-states-audit",
      "browser-denial-smokes",
      "ci-secret-safe-evidence",
    ]);
    expect(dashboardAuthGuardArtifactPaths).toContain("coverage/dashboard-auth-guard-runtime.json");
    expect(dashboardAuthGuardArtifactPaths).toContain("test-results/dashboard-auth-guard-runtime");
  });

  it("keeps shared auth helper, layout guard, middleware guard, and API helper guard wired", () => {
    expect(authPackageJson).toContain('"typecheck"');
    expect(authPackageJson).toContain('"test"');
    expect(authSource).toContain("buildDashboardAuthGuardEvidencePlan");
    expect(authSource).toContain("evaluateDashboardRouteGuard");
    expect(authTests).toContain("buildDashboardAuthGuardEvidencePlan");
    expect(dashboardLayout).toContain("noStore()");
    expect(dashboardLayout).toContain("evaluateDashboardRouteGuard");
    expect(dashboardMiddleware).toContain("evaluateDashboardRouteGuard");
    expect(dashboardMiddleware).toContain("Cache-Control");
    expect(dashboardMiddleware).toContain("x-inkroute-dashboard-auth-guard");
    expect(dashboardAuthApi).toContain("evaluateDashboardApiGuard");
    expect(dashboardAuthApi).toContain("dashboardApiGuardFailureResponse");
  });

  it("keeps evidence blockers explicit until provider sessions, DB roles, browser denial, CI, and safe artifacts exist", () => {
    expect(dashboardAuthGuardRuntimeReadiness.status).toBe("blocked");
    expect(dashboardAuthGuardRuntimeReadiness.missingScripts).toEqual([]);
    expect(dashboardAuthGuardRuntimeReadiness.requiredCommands).toEqual([...dashboardAuthGuardRuntimeCommands]);
    expect(dashboardAuthGuardRuntimeReadiness.requiredControls).toContain(
      "Apply middleware, protected layout, and API helper guards before private reads or mutations.",
    );
    expect(dashboardAuthGuardRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "provider-backed session plus TenantMember/CustomRole database lookup evidence",
      "browser login/logout, tenant-switch, and cross-tenant denial evidence",
      "dashboard typecheck/build, CI, and secret-safe artifact evidence",
    ]));
    expect(dashboardAuthGuardRuntimeReadiness.blockers).toContain(
      "Real auth provider sessions must be configured for dashboard guard tests.",
    );
    expect(dashboardAuthGuardRuntimeReadiness.blockers).toContain(
      "Browser cross-tenant denial evidence must prove private tenant data is not exposed.",
    );
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider-backed auth readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 5 dashboard auth guard runtime contracts");
    expect(ciWorkflow).toContain("dashboard-auth-guard-runtime-static.test.ts");
    expect(ciWorkflow).toContain("dashboard-auth-guard-runtime-artifacts");
    expect(unitManifest).toContain("unit-dashboard-auth-guard-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/dashboardAuthGuardRuntime.ts");
    expect(gapTracker).toContain("GAP-036 is middleware/layout/API-helper wired");
    expect(dashboardAuthGuardArtifactPaths).toContain("coverage/dashboard-auth-secret-safe-artifacts.json");
  });
});
