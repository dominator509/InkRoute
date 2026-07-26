import { describe, expect, it } from "vitest";
import {
  buildDashboardDataRuntimeReadinessPlan,
  buildDashboardRepositoryRouteEvidencePlan,
  buildTenantDashboardView,
  dashboardDataCollections,
  dashboardDataRuntimeRequiredCommands,
  dashboardDataRuntimeRequiredEvidence,
  dashboardRepositoryRouteRequiredCommands,
  dashboardRepositoryRouteRequiredControls,
  dashboardRepositoryRouteRequiredEvidence,
  findMissingDashboardCollections,
  type DashboardScopedRecord,
} from "../src/index";

describe("tenant dashboard data projections", () => {
  it("covers every dashboard collection required by GAP-037", () => {
    expect(findMissingDashboardCollections(dashboardDataCollections)).toEqual([]);
    expect(dashboardDataCollections).toEqual([
      "bookings",
      "clients",
      "appointments",
      "payments",
      "portfolio",
      "travel",
      "seo",
      "templates",
      "errors",
      "releases",
      "settings",
    ]);
  });

  it("filters records by tenant and redacts private dashboard fields", () => {
    const records: DashboardScopedRecord[] = [
      {
        id: "booking_001",
        tenantId: "tenant_inkroute",
        clientName: "Avery Stone",
        clientEmail: "avery@example.test",
        medicalNotes: "allergy detail",
        stripePaymentIntentId: "pi_private_123",
        status: "deposit_due",
      },
      {
        id: "booking_002",
        tenantId: "tenant_other",
        clientName: "Cross Tenant",
        clientEmail: "cross@example.test",
        status: "confirmed",
      },
    ];

    const view = buildTenantDashboardView({
      collection: "bookings",
      tenantId: "tenant_inkroute",
      records,
      source: "demo-static",
    });

    expect(view.records).toEqual([
      {
        id: "booking_001",
        tenantId: "tenant_inkroute",
        clientName: "Avery Stone",
        clientEmail: "[redacted-dashboard-field]",
        medicalNotes: "[redacted-dashboard-field]",
        stripePaymentIntentId: "[redacted-dashboard-field]",
        status: "deposit_due",
      },
    ]);
    expect(view.rejectedRecordCount).toBe(1);
    expect(view.cachePolicy).toEqual({ strategy: "no-store" });
    expect(JSON.stringify(view.records)).not.toContain("avery@example.test");
    expect(JSON.stringify(view.records)).not.toContain("cross@example.test");
    expect(JSON.stringify(view.records)).not.toContain("pi_private_123");
  });

  it("allows collection-specific redaction fields for repository loaders", () => {
    const view = buildTenantDashboardView({
      collection: "portfolio",
      tenantId: "tenant_inkroute",
      records: [
        {
          id: "portfolio_001",
          tenantId: "tenant_inkroute",
          title: "Serpent sleeve",
          objectKey: "tenant_private/originals/serpent.jpg",
          reviewToken: "review_private_token",
        },
      ],
      redactedFields: ["objectKey", "reviewToken"],
    });

    expect(view.source).toBe("repository");
    expect(view.records[0]).toMatchObject({
      objectKey: "[redacted-dashboard-field]",
      reviewToken: "[redacted-dashboard-field]",
    });
    expect(JSON.stringify(view.records)).not.toContain("tenant_private/originals");
    expect(JSON.stringify(view.records)).not.toContain("review_private_token");
  });

  it("blocks dashboard data runtime readiness until repository loaders, route wiring, and runtime evidence exist", () => {
    const plan = buildDashboardDataRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      configTestsPassed: true,
      configTypecheckPassed: false,
      dashboardTypecheckPassed: false,
      dashboardBuildPassed: false,
      repositoryLoadersConfigured: ["bookings", "clients", "payments"],
      dashboardRoutesUsingRepositories: ["bookings"],
      seededDatabaseVerified: false,
      tenantIsolationTestsPassed: false,
      redactionTestsPassed: true,
      rbacGuardsConfigured: false,
      noStoreCachingVerified: true,
      auditLogsConfiguredForSensitiveReads: false,
      demoStaticImportsRemoved: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.missingRepositoryLoaders).toEqual([
      "appointments",
      "portfolio",
      "travel",
      "seo",
      "templates",
      "errors",
      "releases",
      "settings",
    ]);
    expect(plan.missingRouteWiring).toContain("clients");
    expect(plan.requiredCommands).toBe(dashboardDataRuntimeRequiredCommands);
    expect(plan.requiredEvidence).toBe(dashboardDataRuntimeRequiredEvidence);
    expect(plan.blockers).toContain("Repository-backed dashboard route wiring is required for: clients, appointments, payments, portfolio, travel, seo, templates, errors, releases, settings.");
    expect(plan.blockers).not.toContain("Dashboard routes are not wired to repository loaders for: clients, payments, appointments, portfolio, travel, seo, templates, errors, releases, settings.");
    expect(plan.blockers).toContain("Dashboard route data dependencies must no longer read static demo arrays for production surfaces.");
  });

  it("blocks dashboard repository route evidence until loaders, routes, DB smoke, RBAC, redaction, CI, and safe artifacts exist", () => {
    const plan = buildDashboardRepositoryRouteEvidencePlan({
      packageScripts: { test: "vitest run" },
      configTestsPassed: true,
      configTypecheckPassed: false,
      dashboardTypecheckPassed: false,
      dashboardBuildPassed: false,
      prismaLoadersImplemented: ["bookings", "clients"],
      dashboardRoutesWired: ["bookings"],
      staticDemoImportsRemoved: ["bookings", "clients", "appointments"],
      seededDatabaseSmokePassed: false,
      repositoryApiTestsPassed: false,
      tenantIsolationTestsPassed: false,
      rbacGuardTestsPassed: false,
      redactionTestsPassed: false,
      noStoreCacheVerified: false,
      sensitiveReadAuditLogsPersisted: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.missingPrismaLoaders).toContain("payments");
    expect(plan.missingRouteWiring).toContain("clients");
    expect(plan.remainingStaticDemoImports).toContain("payments");
    expect(plan.requiredCommands).toBe(dashboardRepositoryRouteRequiredCommands);
    expect(plan.requiredControls).toBe(dashboardRepositoryRouteRequiredControls);
    expect(plan.requiredEvidence).toBe(dashboardRepositoryRouteRequiredEvidence);
    expect(plan.blockers).toContain("Tenant-isolation tests must reject cross-tenant dashboard data reads.");
    expect(plan.blockers).toContain("Dashboard data artifacts must be redacted and free of secrets, raw PII, medical notes, payment data, provider tokens, and private object keys.");
  });

  it("marks dashboard repository route evidence ready when loaders, routes, DB smoke, RBAC, redaction, CI, and artifacts align", () => {
    const plan = buildDashboardRepositoryRouteEvidencePlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      configTestsPassed: true,
      configTypecheckPassed: true,
      dashboardTypecheckPassed: true,
      dashboardBuildPassed: true,
      prismaLoadersImplemented: dashboardDataCollections,
      dashboardRoutesWired: dashboardDataCollections,
      staticDemoImportsRemoved: dashboardDataCollections,
      seededDatabaseSmokePassed: true,
      repositoryApiTestsPassed: true,
      tenantIsolationTestsPassed: true,
      rbacGuardTestsPassed: true,
      redactionTestsPassed: true,
      noStoreCacheVerified: true,
      sensitiveReadAuditLogsPersisted: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      missingPrismaLoaders: [],
      missingRouteWiring: [],
      remainingStaticDemoImports: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredCommands).toBe(dashboardRepositoryRouteRequiredCommands);
    expect(plan.requiredControls).toBe(dashboardRepositoryRouteRequiredControls);
  });
});
