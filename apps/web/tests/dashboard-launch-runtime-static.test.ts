import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDashboardLaunchArtifactReview,
  buildDashboardLaunchDecisionRequiredEvidence,
  buildDashboardLaunchEvidenceDecision,
  buildDashboardLaunchExecutionPlan,
  buildDashboardLaunchRunData,
  buildRedactedDashboardLaunchArtifact,
  dashboardLaunchExecutionPolicy,
  dashboardLaunchRequiredEvidence,
  dashboardLaunchRequiredExternalEvidence,
  dashboardLaunchArtifactPaths,
  dashboardLaunchRuntimeExternalArtifacts,
  dashboardLaunchRuntimeExternalCommands,
  dashboardLaunchRuntimeLocalArtifacts,
  dashboardLaunchRuntimeLocalCommands,
  dashboardLaunchRunPersistenceContract,
  dashboardLaunchRuntimeCommands,
  dashboardLaunchRuntimeControls,
  dashboardLaunchRuntimeMatrix,
  dashboardLaunchRuntimeReadiness,
  dashboardLaunchRuntimeProofFiles,
  persistDashboardLaunchRun,
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
    const runData = buildDashboardLaunchRunData({
      tenantId: "tenant_static",
      runId: "dashboard_static",
      commitSha: "abc123",
      status: "blocked",
      dashboardTypecheckPassed: true,
      dashboardBuildPassed: false,
      dashboardUnitTestsPassed: false,
      dashboardPlaywrightSmokePassed: false,
      seededTenantDataAvailable: false,
      providerBackedAuthConfigured: false,
      tenantScopedApisImplemented: false,
      prismaRepositoriesImplemented: false,
      realMutationsEnabled: false,
      mutationAuditLogsPersisted: false,
      providerActionsImplemented: false,
      rbacDenialTestsPassed: false,
      crossTenantDenialTestsPassed: false,
      fieldRedactionVerified: true,
      loadingEmptyErrorStatesVerified: false,
      ciEvidenceCaptured: false,
      dashboardArtifactsSecretSafe: false,
      dashboardLaunchRunPersisted: false,
      coveredControls: ["private-field-redaction-before-serialization"],
      capturedArtifacts: [
        "coverage/dashboard-launch-runtime.json",
        "coverage/dashboard-typecheck.txt",
      ],
      completedCommands: ["pnpm --filter @inkroute/dashboard typecheck"],
      dashboardTypecheckArtifactPath: "coverage/dashboard-typecheck.txt",
    });

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
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "dashboard_static",
      commitSha: "abc123",
      status: "blocked",
      dashboardTypecheckPassed: true,
      dashboardBuildPassed: false,
      fieldRedactionVerified: true,
      dashboardTypecheckArtifactPath: "coverage/dashboard-typecheck.txt",
    });
    expect(runData.commandMatrix).toBe(dashboardLaunchRuntimeMatrix);
    expect(runData.controlManifest).toEqual(["private-field-redaction-before-serialization"]);
    expect(runData.tenantApiManifest.mutationAuditLogsPersisted).toBe(false);
    expect(String(persistDashboardLaunchRun)).toContain("repository.dashboardLaunchRun.upsert");
  });

  it("keeps dashboard scripts, launch helper, middleware, mutation route, and redaction tests wired", () => {
    expect(dashboardPackageJson).toContain('"typecheck"');
    expect(dashboardPackageJson).toContain('"build"');
    expect(dashboardPackageJson).toContain('"test"');
    expect(authSource).toContain("buildDashboardLaunchEvidencePlan");
    expect(authTests).toContain("buildDashboardLaunchEvidencePlan");
    expect(middleware).toContain("/login?next=");
    expect(bookingStateRoute).toContain("BookingStateEvent");
    expect(bookingStateRoute).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(paymentReadTest).toContain("PaymentAuditLog");
  });

  it("keeps dashboard launch blockers explicit until provider-backed runtime evidence exists", () => {
    expect(dashboardLaunchRuntimeReadiness.status).toBe("blocked");
    expect(dashboardLaunchRuntimeReadiness.missingScripts).toEqual([]);
    expect(dashboardLaunchRuntimeReadiness.requiredCommands).toBe(dashboardLaunchRuntimeCommands);
    expect(dashboardLaunchRuntimeReadiness.requiredControls).toBe(dashboardLaunchRuntimeControls);
    expect(dashboardLaunchRuntimeReadiness.requiredEvidence).toBe(dashboardLaunchRequiredEvidence);
    expect(dashboardLaunchRuntimeReadiness.blockers).toContain("@inkroute/dashboard build must pass.");
    expect(dashboardLaunchRuntimeReadiness.blockers).toContain(
      "Dashboard must use provider-backed auth/session state.",
    );
  });

  it("blocks dashboard launch closure until build, auth, tenancy, mutations, RBAC, CI, persistence, artifacts, controls, and commands are proven", () => {
    const decision = buildDashboardLaunchEvidenceDecision({
      dashboardTypecheckPassed: true,
      dashboardBuildPassed: false,
      dashboardUnitTestsPassed: false,
      dashboardPlaywrightSmokePassed: false,
      seededTenantDataAvailable: false,
      providerBackedAuthConfigured: false,
      tenantScopedApisImplemented: false,
      prismaRepositoriesImplemented: false,
      realMutationsEnabled: false,
      mutationAuditLogsPersisted: false,
      providerActionsImplemented: false,
      rbacDenialTestsPassed: false,
      crossTenantDenialTestsPassed: false,
      fieldRedactionVerified: false,
      loadingEmptyErrorStatesVerified: false,
      ciEvidenceCaptured: false,
      dashboardArtifactsSecretSafe: false,
      dashboardLaunchRunPersisted: false,
      coveredControls: ["private-field-redaction-before-serialization"],
      capturedArtifacts: [
        "coverage/dashboard-launch-runtime.json",
        "coverage/dashboard-typecheck.txt",
      ],
      completedCommands: ["pnpm --filter @inkroute/dashboard typecheck"],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingControls).toEqual([
      "provider-backed-session-and-tenant-membership",
      "tenant-scoped-repositories-or-authenticated-apis",
      "tenant-scoped-mutation-transactions-with-auditlog",
      "rbac-and-cross-tenant-denial",
      "secret-safe-build-smoke-ci-artifacts",
    ]);
    expect(decision.missingArtifacts).toEqual([
      "coverage/dashboard-build.txt",
      "coverage/dashboard-test.txt",
      "coverage/dashboard-playwright-smoke.json",
      "coverage/dashboard-seeded-tenant-data.json",
      "coverage/dashboard-provider-auth-smoke.json",
      "coverage/dashboard-tenant-scoped-apis.json",
      "coverage/dashboard-prisma-repositories.json",
      "coverage/dashboard-mutation-auditlog.json",
      "coverage/dashboard-rbac-cross-tenant-denial.json",
      "coverage/dashboard-field-redaction.json",
      "coverage/dashboard-loading-empty-error-states.json",
      "coverage/dashboard-ci-evidence.json",
      "coverage/dashboard-secret-safe-artifacts.json",
      "test-results/dashboard-launch-runtime",
    ]);
    expect(decision.missingCommands).toEqual([
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/dashboard test",
      "pnpm test:e2e --project=dashboard-chromium",
      "dashboard provider-backed auth smoke tests",
      "dashboard RBAC and cross-tenant denial tests",
      "dashboard mutation AuditLog persistence tests",
      "GitHub Actions dashboard launch evidence job",
    ]);
    expect(decision.requiredControls).toBe(dashboardLaunchRuntimeControls);
    expect(decision.requiredArtifacts).toBe(dashboardLaunchArtifactPaths);
    expect(decision.requiredCommands).toBe(dashboardLaunchRuntimeCommands);
    expect(decision.requiredEvidence).toEqual(
      buildDashboardLaunchDecisionRequiredEvidence(dashboardLaunchRuntimeReadiness.requiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(dashboardLaunchRequiredEvidence);
    expect(decision.blockers).toContain("@inkroute/dashboard build must pass.");
    expect(decision.blockers).toContain("DashboardLaunchRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Every required dashboard launch control must be covered.");
  });

  it("completes dashboard launch closure when build, auth, tenancy, mutations, RBAC, CI, persistence, artifacts, controls, and commands are proven", () => {
    const decision = buildDashboardLaunchEvidenceDecision({
      dashboardTypecheckPassed: true,
      dashboardBuildPassed: true,
      dashboardUnitTestsPassed: true,
      dashboardPlaywrightSmokePassed: true,
      seededTenantDataAvailable: true,
      providerBackedAuthConfigured: true,
      tenantScopedApisImplemented: true,
      prismaRepositoriesImplemented: true,
      realMutationsEnabled: true,
      mutationAuditLogsPersisted: true,
      providerActionsImplemented: true,
      rbacDenialTestsPassed: true,
      crossTenantDenialTestsPassed: true,
      fieldRedactionVerified: true,
      loadingEmptyErrorStatesVerified: true,
      ciEvidenceCaptured: true,
      dashboardArtifactsSecretSafe: true,
      dashboardLaunchRunPersisted: true,
      coveredControls: dashboardLaunchRuntimeControls,
      capturedArtifacts: dashboardLaunchArtifactPaths,
      completedCommands: dashboardLaunchRuntimeCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingControls).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming dashboard launch readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 5 dashboard launch runtime contracts");
    expect(ciWorkflow).toContain("dashboard-launch-runtime-static.test.ts");
    expect(ciWorkflow).toContain("dashboard-launch-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-dashboard-launch-runtime-static");
    expect(unitManifest).toContain("DashboardLaunchRun Prisma model and app row contract");
    expect(gapTracker).toContain("DashboardLaunchRun");
    expect(gapTracker).toContain("apps/web/lib/dashboardLaunchRuntime.ts");
    expect(gapTracker).toContain("buildDashboardLaunchDecisionRequiredEvidence");
    expect(gapTracker).toContain("dashboardLaunchRequiredEvidence");
    expect(gapTracker).toContain("persistDashboardLaunchRun upsert seam");
    expect(gapTracker).toContain("live dashboard typecheck/build/test, Playwright, seeded tenant data, provider auth, Prisma repositories, real mutations, provider actions, RBAC/cross-tenant denial, field redaction, launch states, CI evidence, provider-backed persistDashboardLaunchRun execution, and secret-safe artifacts remain open");
    expect(gapTracker).toContain("GAP-007 is dashboard-launch-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("proof inventory");
  });

  it("pins current dashboard launch proof files for GAP-007", () => {
    expect(dashboardLaunchRuntimeProofFiles).toContain("apps/dashboard/package.json");
    expect(dashboardLaunchRuntimeProofFiles).toContain("apps/web/lib/dashboardLaunchRuntime.ts");
    expect(dashboardLaunchRuntimeProofFiles).toContain("apps/web/tests/dashboard-launch-runtime-static.test.ts");
    for (const proofFile of dashboardLaunchRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });

  it("keeps GAP-007 execution policy non-executing while separating dashboard provider proof", () => {
    const plan = buildDashboardLaunchExecutionPlan();

    expect(plan.localCommands).toBe(dashboardLaunchRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(dashboardLaunchRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(dashboardLaunchRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(dashboardLaunchRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toEqual(["coverage/dashboard-launch-runtime.json", "coverage/dashboard-typecheck.txt"]);
    expect(plan.externalArtifacts).toContain("coverage/dashboard-secret-safe-artifacts.json");
    expect(plan.externalArtifacts).toContain("test-results/dashboard-launch-runtime");
    expect(plan).toMatchObject({
      dashboardTypecheckExecutionAllowed: false,
      dashboardBuildExecutionAllowed: false,
      dashboardTestExecutionAllowed: false,
      playwrightSmokeExecutionAllowed: false,
      providerAuthSmokeExecutionAllowed: false,
      rbacTenantDenialExecutionAllowed: false,
      mutationAuditLogExecutionAllowed: false,
      ciLaunchEvidenceExecutionAllowed: false,
      providerBackedPersistenceExecutionAllowed: false,
    });
    expect(plan.executionPolicy).toBe(dashboardLaunchExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyStaticDashboardReadiness: true,
      dashboardRuntimeEvidenceRequiredForClosure: true,
      providerAuthEvidenceRequiredForClosure: true,
      tenantScopedPersistenceRequiredForClosure: true,
      rbacCrossTenantProofRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(plan.requiredExternalEvidence).toBe(dashboardLaunchRequiredExternalEvidence);
  });

  it("redacts dashboard launch artifacts before tracker or handoff use", () => {
    const artifact = {
      runId: "dashboard_01HZYXZYXZYXZYXZYXZYXZYXZ",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/27171288295",
      privateClientNote: "client@example.com called from +1 (555) 867-5309",
      providerAuth: {
        tenantId: "tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
        sessionToken: "github_pat_1234567890ABCDEFGHIJKLMNOP",
      },
      persistence: {
        databaseUrl: "postgres://inkroute:secret@example.neon.tech/inkroute",
      },
    };

    expect(buildRedactedDashboardLaunchArtifact(artifact)).toEqual({
      runId: "[REDACTED]",
      ciRunUrl: "[REDACTED]",
      privateClientNote: "[REDACTED]",
      providerAuth: "[REDACTED]",
      persistence: {
        databaseUrl: "[REDACTED]",
      },
    });

    const review = buildDashboardLaunchArtifactReview(artifact);
    expect(review.safeForTracker).toBe(true);
    expect(review.redactions).toEqual(
      expect.arrayContaining(["runId", "ciRunUrl", "privateClientNote", "providerAuth", "persistence.databaseUrl"]),
    );
    expect(review.requiredExternalEvidence).toBe(dashboardLaunchRequiredExternalEvidence);
  });
});



