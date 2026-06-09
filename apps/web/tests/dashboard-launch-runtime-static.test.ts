import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  dashboardLaunchArtifactPaths,
  dashboardLaunchRunPersistenceContract,
  dashboardLaunchRuntimeCommands,
  dashboardLaunchRuntimeControls,
  dashboardLaunchRuntimeMatrix,
  dashboardLaunchRuntimeReadiness,
} from "../lib/dashboardLaunchRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("dashboard launch runtime contract", () => {
  const dashboardPackageJson = readRepoFile("apps/dashboard/package.json");
  const authSource = readRepoFile("packages/auth/src/index.ts");
  const authTests = readRepoFile("packages/auth/tests/authorization.test.ts");
  const middleware = readRepoFile("apps/dashboard/middleware.ts");
  const bookingStateRoute = readRepoFile("apps/dashboard/app/api/bookings/[bookingId]/state/route.ts");
  const paymentReadTest = readRepoFile("apps/dashboard/tests/payment-read-route-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const dashboardLaunchMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609033100_add_dashboard_launch_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins dashboard launch commands, controls, matrix rows, and artifacts", () => {
    expect(dashboardLaunchRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/dashboard test",
      "pnpm test:e2e --project=dashboard-chromium",
      "dashboard provider-backed auth smoke tests",
      "dashboard RBAC and cross-tenant denial tests",
      "dashboard mutation AuditLog persistence tests",
      "GitHub Actions dashboard launch evidence job",
    ]);
    expect(dashboardLaunchRuntimeControls).toContain("tenant-scoped-mutation-transactions-with-auditlog");
    expect(dashboardLaunchRuntimeControls).toContain("private-field-redaction-before-serialization");
    expect(dashboardLaunchRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "dashboard-typecheck",
      "dashboard-build",
      "dashboard-tests",
      "dashboard-playwright-smoke",
      "seeded-tenant-data",
      "provider-backed-auth",
      "tenant-scoped-apis-repositories",
      "real-mutations-auditlog",
      "rbac-cross-tenant-denial",
      "field-redaction",
      "loading-empty-error-states",
      "ci-secret-safe-artifacts",
    ]);
    expect(dashboardLaunchArtifactPaths).toContain("coverage/dashboard-launch-runtime.json");
    expect(dashboardLaunchArtifactPaths).toContain("test-results/dashboard-launch-runtime");
  });

  it("pins the DashboardLaunchRun persistence model and migration", () => {
    expect(dashboardLaunchRunPersistenceContract.model).toBe("DashboardLaunchRun");
    expect(dashboardLaunchRunPersistenceContract.tenantRelation).toBe("dashboardLaunchRuns");
    expect(dashboardLaunchRunPersistenceContract.migration).toBe("20260609033100_add_dashboard_launch_runs");
    expect(dashboardLaunchRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "controlManifest",
      "artifactManifest",
      "tenantApiManifest",
      "launchStateManifest",
    ]);
    expect(dashboardLaunchRunPersistenceContract.evidenceBooleans).toContain("dashboardBuildPassed");
    expect(dashboardLaunchRunPersistenceContract.evidenceBooleans).toContain("mutationAuditLogsPersisted");
    expect(dashboardLaunchRunPersistenceContract.evidenceBooleans).toContain("dashboardArtifactsSecretSafe");
    expect(dashboardLaunchRunPersistenceContract.artifactFields).toContain("rbacCrossTenantDenialArtifactPath");
    expect(dashboardLaunchRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("dashboardLaunchRuns DashboardLaunchRun[]");
    expect(prismaSchema).toContain("model DashboardLaunchRun");
    expect(prismaSchema).toContain("tenantApiManifest");
    expect(prismaSchema).toContain("mutationAuditLogsPersisted");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(dashboardLaunchMigration).toContain('CREATE TABLE "DashboardLaunchRun"');
    expect(dashboardLaunchMigration).toContain('"tenantApiManifest" JSONB NOT NULL');
    expect(dashboardLaunchMigration).toContain('"dashboardArtifactsSecretSafe" BOOLEAN NOT NULL DEFAULT false');
    expect(dashboardLaunchMigration).toContain('CREATE UNIQUE INDEX "DashboardLaunchRun_tenantId_runId_key"');
  });

  it("keeps dashboard scripts, launch helper, middleware, mutation route, and redaction tests wired", () => {
    expect(dashboardPackageJson).toContain('"typecheck"');
    expect(dashboardPackageJson).toContain('"build"');
    expect(dashboardPackageJson).toContain('"test"');
    expect(authSource).toContain("buildDashboardLaunchEvidencePlan");
    expect(authTests).toContain("buildDashboardLaunchEvidencePlan");
    expect(middleware).toContain("/login?next=");
    expect(bookingStateRoute).toContain("BookingStateEvent");
    expect(paymentReadTest).toContain("PaymentAuditLog");
  });

  it("keeps dashboard launch blockers explicit until provider-backed runtime evidence exists", () => {
    expect(dashboardLaunchRuntimeReadiness.status).toBe("blocked");
    expect(dashboardLaunchRuntimeReadiness.missingScripts).toEqual([]);
    expect(dashboardLaunchRuntimeReadiness.requiredCommands).toEqual([...dashboardLaunchRuntimeCommands]);
    expect(dashboardLaunchRuntimeReadiness.requiredControls).toEqual([
      "Resolve provider-backed session and tenant membership before every dashboard data load.",
      "Load dashboard data through tenant-scoped repositories or authenticated APIs.",
      "Execute mutations in tenant-scoped transactions with AuditLog rows.",
      "Enforce RBAC and cross-tenant denial for pages, APIs, server actions, and provider actions.",
      "Redact private client, medical, payment, consent, and system fields before serialization.",
      "Capture secret-safe build, smoke, and CI artifacts for launch closeout.",
    ]);
    expect(dashboardLaunchRuntimeReadiness.requiredEvidence).toContain(
      "dashboard typecheck, build, unit/contract, and Playwright smoke output",
    );
    expect(dashboardLaunchRuntimeReadiness.blockers).toContain("@inkroute/dashboard build must pass.");
    expect(dashboardLaunchRuntimeReadiness.blockers).toContain(
      "Dashboard must use provider-backed auth/session state.",
    );
  });

  it("wires CI, manifest, tracker, and artifacts without claiming dashboard launch readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 5 dashboard launch runtime contracts");
    expect(ciWorkflow).toContain("dashboard-launch-runtime-static.test.ts");
    expect(ciWorkflow).toContain("dashboard-launch-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-dashboard-launch-runtime-static");
    expect(unitManifest).toContain("DashboardLaunchRun Prisma model and app row contract");
    expect(gapTracker).toContain("DashboardLaunchRun");
    expect(gapTracker).toContain("apps/web/lib/dashboardLaunchRuntime.ts");
    expect(gapTracker).toContain("live dashboard typecheck/build/test, Playwright, seeded tenant data, provider auth, Prisma repositories, real mutations, provider actions, RBAC/cross-tenant denial, field redaction, launch states, CI evidence, and secret-safe artifacts remain open");
  });
});
