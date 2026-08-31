import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDashboardDataLayerArtifactReview,
  buildDashboardDataLayerEvidenceDecision,
  buildDashboardDataLayerExecutionPlan,
  buildRedactedDashboardDataLayerArtifact,
  dashboardDataLayerArtifactPaths,
  dashboardDataLayerCollections,
  dashboardDataLayerEvidenceFlags,
  dashboardDataLayerExternalCommands,
  dashboardDataLayerExecutionPolicy,
  dashboardDataLayerLocalCommands,
  dashboardDataLayerRouteTestFiles,
  dashboardDataLayerRequiredExternalEvidence,
  dashboardDataLayerRuntimeCommands,
  dashboardDataLayerRuntimeMatrix,
  dashboardDataLayerRuntimeProofFiles,
  dashboardDataLayerRuntimeReadiness,
} from "../lib/dashboardDataLayerRuntime";
import { dashboardRepositoryRouteRequiredEvidence } from "@inkroute/config";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("dashboard data layer runtime contract", () => {
  const configPackageJson = readRepoFile("packages/config/package.json");
  const configSource = readRepoFile("packages/config/src/index.ts");
  const configTests = readRepoFile("packages/config/tests/dashboard-data.test.ts");
  const dashboardDemo = readRepoFile("apps/dashboard/lib/demo.ts");
  const dashboardMetricsRoute = readRepoFile("apps/dashboard/app/api/metrics/route.ts");
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

  it("pins current GAP-037 proof files", () => {
    expect(dashboardDataLayerRuntimeProofFiles).toContain("packages/config/package.json");
    expect(dashboardDataLayerRuntimeProofFiles).toContain("apps/dashboard/package.json");
    expect(dashboardDataLayerRuntimeProofFiles).toContain("apps/dashboard/tests/dashboard-data-layer-runtime-static.test.ts");
    for (const file of dashboardDataLayerRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
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
    expect(readRepoFile("apps/dashboard/tests/payment-read-route-static.test.ts")).toContain("providerPaymentId");
    expect(readRepoFile("apps/dashboard/tests/portfolio-read-route-static.test.ts")).toContain("Portfolio reads now redact storage keys");
    expect(readRepoFile("apps/dashboard/tests/message-read-route-static.test.ts")).toContain("uses Prisma message-thread reads with body/provider/contact redaction and audit logs");
    expect(dashboardMetricsRoute).toContain("dashboardMetricsQuerySchema.safeParse");
    expect(dashboardMetricsRoute).toContain("VALIDATION_FAILED");
    expect(dashboardMetricsRoute).toContain("query.data.tenantId ?? actor.tenantId");
    expect(dashboardMetricsRoute).toContain("function buildMetricsResponseProjection");
    expect(dashboardMetricsRoute).toContain("tenantIdEchoed: false");
    expect(dashboardMetricsRoute).toContain("auditIdEchoed: false");
    expect(dashboardMetricsRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(dashboardMetricsRoute).toContain("tenantScope: { actorTenantMatched: true }");
    expect(dashboardMetricsRoute).not.toContain("tenantId,\n          error:");
    expect(dashboardMetricsRoute).not.toContain("tenantId,\n        persistence");
    expect(dashboardMetricsRoute).not.toContain("auditId: result.audit.id");
    expect(dashboardDemo).toContain("Dashboard read and mutation contracts added");
    expect(dashboardDemo).toContain("Booking flow and tenant-scoped API contract wired");
    expect(dashboardDemo).toContain("Provider delivery and unsubscribe footer proof remain evidence-gated");
    expect(dashboardDemo).toContain("real auth/session provider proof remains evidence-gated");
    expect(dashboardDemo).toContain("Medical notes are redacted in dashboard projections");
    expect(dashboardDemo).toContain("Stripe Checkout readiness contract remains provider-evidence gated");
    expect(dashboardDemo).toContain("Expo app API client local contract awaits seeded smoke evidence");
    expect(dashboardDemo).toContain("provider auth and device smoke remain gated");
    expect(dashboardDemo).not.toContain("Booking API returns 501 after validation");
    expect(dashboardDemo).not.toContain("Expo app not connected to API client");
    expect(dashboardDemo).not.toContain("Provider and unsubscribe footer not wired");
    expect(dashboardDemo).not.toContain("no real auth/session provider is wired");
    expect(dashboardDemo).not.toContain("Stripe session not created in scaffold");
    expect(dashboardDemo).not.toContain("No live medical storage in this dashboard scaffold");
  });

  it("keeps runtime evidence blocked until seeded DB, tenant isolation, RBAC, audit, CI, and artifacts exist", () => {
    expect(dashboardDataLayerRuntimeReadiness.status).toBe("blocked");
    expect(dashboardDataLayerRuntimeReadiness.missingScripts).toEqual([]);
    expect(dashboardDataLayerRuntimeReadiness.missingPrismaLoaders).toEqual([]);
    expect(dashboardDataLayerRuntimeReadiness.missingRouteWiring).toEqual([]);
    expect(dashboardDataLayerRuntimeReadiness.remainingStaticDemoImports).toEqual([]);
    expect(dashboardDataLayerRuntimeReadiness.requiredCommands).toBe(dashboardDataLayerRuntimeCommands);
    expect(dashboardDataLayerRuntimeReadiness.requiredEvidence).toBe(dashboardRepositoryRouteRequiredEvidence);
    expect(dashboardDataLayerRuntimeReadiness.blockers).toContain("Seeded database dashboard route smoke must pass.");
    expect(dashboardDataLayerRuntimeReadiness.blockers).toContain("Tenant-isolation tests must reject cross-tenant dashboard data reads.");
    expect(dashboardDataLayerRuntimeReadiness.blockers).toContain("Dashboard data artifacts must be redacted and free of secrets, raw PII, medical notes, payment data, provider tokens, and private object keys.");
  });

  it("blocks dashboard data layer completion when seeded DB, tenant, RBAC, audit, CI, or safe evidence is missing", () => {
    const decision = buildDashboardDataLayerEvidenceDecision({
      commands: ["pnpm --filter @inkroute/config typecheck"],
      artifacts: ["coverage/dashboard-data-config-typecheck.txt"],
      routeTestFiles: ["apps/dashboard/tests/client-read-route-static.test.ts"],
      prismaLoaders: ["bookings"],
      routeWiring: ["bookings"],
      staticDemoImportsRemoved: ["bookings"],
      evidence: {
        configTypecheckPassed: true,
        noStoreCacheVerified: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("seeded database dashboard route smoke");
    expect(decision.missingArtifacts).toContain("coverage/dashboard-data-secret-safe-artifacts.json");
    expect(decision.missingRouteTestFiles).toContain("apps/dashboard/tests/payment-read-route-static.test.ts");
    expect(decision.missingEvidence).toContain("seededDatabaseSmokePassed");
    expect(decision.missingEvidence).toContain("tenantIsolationTestsPassed");
    expect(decision.blockers).toContain("Seeded database dashboard route smoke must pass.");
    expect(decision.blockers).toContain("Tenant-isolation tests must reject cross-tenant dashboard data reads.");
  });

  it("completes dashboard data layer readiness only when every command, artifact, route file, collection, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(dashboardDataLayerEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildDashboardDataLayerEvidenceDecision({
      commands: dashboardDataLayerRuntimeCommands,
      artifacts: dashboardDataLayerArtifactPaths,
      routeTestFiles: dashboardDataLayerRouteTestFiles,
      prismaLoaders: dashboardDataLayerCollections,
      routeWiring: dashboardDataLayerCollections,
      staticDemoImportsRemoved: dashboardDataLayerCollections,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingRouteTestFiles).toEqual([]);
    expect(decision.missingPrismaLoaders).toEqual([]);
    expect(decision.missingRouteWiring).toEqual([]);
    expect(decision.remainingStaticDemoImports).toEqual([]);
    expect(decision.requiredEvidence).toEqual(dashboardDataLayerEvidenceFlags);
  });

  it("separates static dashboard data review from seeded database execution and redacts private artifacts", () => {
    const executionPlan = buildDashboardDataLayerExecutionPlan();
    const artifactReview = buildDashboardDataLayerArtifactReview({
      tenantDomain: "tenant.example.com",
      clientEmail: "client@example.com",
      stripePaymentId: "stripe_pi_private",
      databaseUrl: "postgres://inkroute:secret@db.example.com:5432/inkroute",
      nested: {
        privateObjectKey: "private-object/client-reference.png",
        publicSummary: "dashboard data layer evidence captured",
      },
      routeReadPayload: "GET /api/bookings returned booking_01HZYXZYXZYXZYXZYXZYXZYXZ for tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
      repositoryReadTrace: "prisma query loaded client_01HZYXZYXZYXZYXZYXZYXZYXZ and audit_01HZYXZYXZYXZYXZYXZYXZYXZ",
      rbacRedactionProof: "member_01HZYXZYXZYXZYXZYXZYXZYXZ denied portfolio_01HZYXZYXZYXZYXZYXZYXZYXZ",
      ciOutput: "workflow run ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ passed",
      safeNote: "evidence_dashboard_data_01HZYXZYXZYXZYXZYXZYXZYXZ wrote artifacts/dashboard-data/private-proof.json",
      safeDatabaseTrace: "postgresql://tenant_demo:secret@db.example.com/inkroute",
    });
    const directRedaction = buildRedactedDashboardDataLayerArtifact({
      publicSummary: "safe dashboard data evidence",
      rbacMemberRole: "owner",
    });

    expect(executionPlan.localCommands).toBe(dashboardDataLayerLocalCommands);
    expect(executionPlan.localCommands).toEqual([
      "pnpm --filter @inkroute/config typecheck",
      "pnpm --filter @inkroute/config test",
      "static dashboard route wiring matrix review",
      "static no-store/read redaction route review",
    ]);
    expect(executionPlan.externalCommands).toBe(dashboardDataLayerExternalCommands);
    expect(executionPlan.externalCommands).toEqual([
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "seeded database dashboard route smoke",
      "dashboard repository/API tenant-isolation tests",
      "dashboard repository/API RBAC and redaction tests",
      "dashboard sensitive-read AuditLog persistence tests",
      "GitHub Actions dashboard data repository evidence job",
    ]);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.tenantIsolationExecutionAllowed).toBe(false);
    expect(executionPlan.rbacExecutionAllowed).toBe(false);
    expect(executionPlan.auditPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(dashboardDataLayerExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticRepositoryRouteReadiness: true,
      seededDatabaseSmokeRequiredForClosure: true,
      tenantIsolationRbacAndRedactionRequiredForClosure: true,
      sensitiveReadAuditLogRequiredForClosure: true,
      dashboardTypecheckBuildRequiredForClosure: true,
      noStorePolicyRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(dashboardDataLayerRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain("seeded database dashboard route smoke evidence");
    expect(executionPlan.requiredExternalEvidence).toContain("sensitive-read AuditLog persistence evidence");
    expect(executionPlan.requiredExternalEvidence).toContain("secret-safe dashboard data artifact review");
    expect(artifactReview.requiredExternalEvidence).toBe(dashboardDataLayerRequiredExternalEvidence);
    expect(artifactReview.redactions).toEqual([
      "tenantDomain",
      "clientEmail",
      "stripePaymentId",
      "databaseUrl",
      "nested.privateObjectKey",
      "routeReadPayload",
      "repositoryReadTrace",
      "rbacRedactionProof",
      "ciOutput",
      "safeNote",
      "safeDatabaseTrace",
    ]);
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("tenant.example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("client@example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("stripe_pi_private");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("postgres://");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("booking_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("client_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("member_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("evidence_dashboard_data_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("artifacts/dashboard-data/private-proof.json");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("postgresql://tenant_demo:secret@db.example.com/inkroute");
    expect(JSON.stringify(artifactReview.artifact)).toContain("dashboard data layer evidence captured");
    expect(artifactReview.secretSafe).toBe(true);
    expect(directRedaction.redactions).toEqual(["rbacMemberRole"]);
    expect(JSON.stringify(directRedaction.artifact)).toContain("safe dashboard data evidence");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming seeded database readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 5 dashboard data layer runtime contracts");
    expect(ciWorkflow).toContain("dashboard-data-layer-runtime-static.test.ts");
    expect(ciWorkflow).toContain("dashboard-data-layer-runtime-artifacts");
    expect(unitManifest).toContain("unit-dashboard-data-layer-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/dashboardDataLayerRuntime.ts");
    expect(gapTracker).toContain("buildDashboardDataLayerExecutionPlan");
    expect(gapTracker).toContain("dashboardDataLayerLocalCommands/dashboardDataLayerExternalCommands");
    expect(gapTracker).toContain("buildRedactedDashboardDataLayerArtifact");
    expect(gapTracker).toContain("buildDashboardDataLayerArtifactReview");
    expect(gapTracker).toContain("dashboardDataLayerExecutionPolicy");
    expect(gapTracker).toContain("dashboardDataLayerRequiredExternalEvidence");
    expect(gapTracker).toContain("GAP-037 is dashboard-data-layer-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("GAP-037 is repository-route-matrix wired");
    expect(dashboardDataLayerArtifactPaths).toContain("coverage/dashboard-data-secret-safe-artifacts.json");
  });
});



