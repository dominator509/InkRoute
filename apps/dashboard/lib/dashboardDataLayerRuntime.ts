import { buildDashboardRepositoryRouteEvidencePlan, dashboardDataCollections } from "@inkroute/config";

export type DashboardDataLayerRuntimeStatus =
  | "wired"
  | "database-gated"
  | "test-gated"
  | "audit-gated"
  | "ci-gated";

export interface DashboardDataLayerRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DashboardDataLayerRuntimeStatus;
}

export const dashboardDataLayerRuntimeCommands = [
  "pnpm --filter @inkroute/config typecheck",
  "pnpm --filter @inkroute/config test",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm --filter @inkroute/dashboard build",
  "seeded database dashboard route smoke",
  "dashboard repository/API tenant-isolation tests",
  "dashboard repository/API RBAC and redaction tests",
  "dashboard sensitive-read AuditLog persistence tests",
  "GitHub Actions dashboard data repository evidence job",
] as const;

export const dashboardDataLayerArtifactPaths = [
  "coverage/dashboard-data-layer-runtime.json",
  "coverage/dashboard-data-config-typecheck.txt",
  "coverage/dashboard-data-config-test.txt",
  "coverage/dashboard-data-dashboard-typecheck.txt",
  "coverage/dashboard-data-dashboard-build.txt",
  "coverage/dashboard-data-prisma-loader-matrix.json",
  "coverage/dashboard-data-route-wiring-matrix.json",
  "coverage/dashboard-data-static-demo-removal.json",
  "coverage/dashboard-data-seeded-db-smoke.json",
  "coverage/dashboard-data-tenant-isolation.json",
  "coverage/dashboard-data-rbac-redaction.json",
  "coverage/dashboard-data-sensitive-read-auditlog.json",
  "coverage/dashboard-data-no-store-cache.json",
  "coverage/dashboard-data-ci-evidence.json",
  "coverage/dashboard-data-secret-safe-artifacts.json",
  "test-results/dashboard-data-layer-runtime",
] as const;

export const dashboardDataLayerRouteTestFiles = [
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
] as const;

export const dashboardDataLayerRuntimeMatrix = [
  {
    id: "config-typecheck",
    command: "pnpm --filter @inkroute/config typecheck",
    artifact: "coverage/dashboard-data-config-typecheck.txt",
    status: "wired",
  },
  {
    id: "config-tests",
    command: "pnpm --filter @inkroute/config test",
    artifact: "coverage/dashboard-data-config-test.txt",
    status: "wired",
  },
  {
    id: "dashboard-typecheck-build",
    command: "pnpm --filter @inkroute/dashboard typecheck && pnpm --filter @inkroute/dashboard build",
    artifact: "coverage/dashboard-data-dashboard-build.txt",
    status: "test-gated",
  },
  {
    id: "prisma-loader-matrix",
    command: "verify Prisma loaders for every dashboardDataCollections entry",
    artifact: "coverage/dashboard-data-prisma-loader-matrix.json",
    status: "wired",
  },
  {
    id: "route-wiring-matrix",
    command: "verify dashboard read/write routes use repository loaders and projections",
    artifact: "coverage/dashboard-data-route-wiring-matrix.json",
    status: "wired",
  },
  {
    id: "static-demo-removal",
    command: "verify production dashboard pages avoid raw sensitive demo arrays",
    artifact: "coverage/dashboard-data-static-demo-removal.json",
    status: "wired",
  },
  {
    id: "seeded-database-smoke",
    command: "seeded database dashboard route smoke",
    artifact: "coverage/dashboard-data-seeded-db-smoke.json",
    status: "database-gated",
  },
  {
    id: "tenant-isolation-rbac-redaction",
    command: "dashboard repository/API tenant-isolation tests && dashboard repository/API RBAC and redaction tests",
    artifact: "coverage/dashboard-data-rbac-redaction.json",
    status: "test-gated",
  },
  {
    id: "sensitive-read-auditlog",
    command: "dashboard sensitive-read AuditLog persistence tests",
    artifact: "coverage/dashboard-data-sensitive-read-auditlog.json",
    status: "audit-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions dashboard data repository evidence job",
    artifact: "coverage/dashboard-data-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly DashboardDataLayerRuntimeMatrixEntry[];

export const dashboardDataLayerRuntimeReadiness = buildDashboardRepositoryRouteEvidencePlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  configTestsPassed: false,
  configTypecheckPassed: false,
  dashboardTypecheckPassed: false,
  dashboardBuildPassed: false,
  prismaLoadersImplemented: dashboardDataCollections,
  dashboardRoutesWired: dashboardDataCollections,
  staticDemoImportsRemoved: dashboardDataCollections,
  seededDatabaseSmokePassed: false,
  repositoryApiTestsPassed: false,
  tenantIsolationTestsPassed: false,
  rbacGuardTestsPassed: false,
  redactionTestsPassed: false,
  noStoreCacheVerified: true,
  sensitiveReadAuditLogsPersisted: false,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});
