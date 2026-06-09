import { describe, expect, it } from "vitest";
import {
  buildCiQualityGatePlan,
  buildDashboardTestingRuntimeReadinessPlan,
  buildDashboardTestRequirements,
  buildPhase9AppRuntimeBuildReadinessPlan,
  buildPhase10SeoAppRuntimeBuildReadinessPlan,
  buildManualQaChecklist,
  buildRouteSmokeManifest,
  buildTestingRuntimeReadinessPlan,
  phase14Suites,
  summarizeDashboardTestRequirements,
  summarizeSuites,
} from "../src/index";

describe("Phase 14 testing manifest", () => {
  it("summarizes scaffolded and gated tests", () => {
    const summary = summarizeSuites(phase14Suites);

    expect(summary.suiteCount).toBeGreaterThan(0);
    expect(summary.caseCount).toBeGreaterThan(0);
    expect(summary.productionBlockingCount).toBeGreaterThan(0);
  });

  it("declares CI quality gates and manual QA evidence", () => {
    expect(buildCiQualityGatePlan().some((gate) => gate.id === "ci-install" && gate.required)).toBe(true);
    expect(buildManualQaChecklist().some((item) => item.priority === "critical")).toBe(true);
    expect(buildRouteSmokeManifest().some((route) => route.path === "/booking")).toBe(true);
  });

  it("declares dashboard test coverage requirements for GAP-041", () => {
    const requirements = buildDashboardTestRequirements();
    const summary = summarizeDashboardTestRequirements(requirements);

    expect(summary.missingAreas).toEqual([]);
    expect(summary.productionReady).toBe(false);
    expect(summary.criticalRuntimeGatedIds).toEqual([
      "dashboard-route-rendering",
      "dashboard-rbac-tenant-isolation",
      "dashboard-mutation-lifecycle",
      "dashboard-e2e-critical-flow",
    ]);
    expect(requirements.every((requirement) => requirement.gapIds.includes("GAP-041"))).toBe(true);
    expect(requirements.find((requirement) => requirement.area === "accessibility")?.verifies).toContain("axe critical violations");
  });

  it("blocks dashboard testing runtime readiness until app tests, fixtures, artifacts, and required checks exist", () => {
    const plan = buildDashboardTestingRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      testingPackageTestsPassed: true,
      testingPackageTypecheckPassed: false,
      dashboardTypecheckPassed: false,
      dashboardBuildPassed: false,
      implementedRequirementIds: ["dashboard-route-rendering"],
      passingRequirementIds: [],
      seededAuthFixturesConfigured: false,
      seededTenantDataConfigured: false,
      rbacTenantIsolationFixturesConfigured: false,
      mutationTestHarnessConfigured: false,
      accessibilityRunnerConfigured: false,
      playwrightDashboardProjectConfigured: true,
      ciUploadsDashboardArtifacts: false,
      branchProtectionRequiresDashboardTests: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.missingImplementedRequirements).toEqual([
      "dashboard-component-state",
      "dashboard-rbac-tenant-isolation",
      "dashboard-mutation-lifecycle",
      "dashboard-accessibility",
      "dashboard-e2e-critical-flow",
    ]);
    expect(plan.missingPassingRequirements).toContain("dashboard-route-rendering");
    expect(plan.requiredCommands).toContain("pnpm test:e2e --project=dashboard-chromium");
    expect(plan.requiredEvidence).toContain("seeded auth, tenant, and RBAC fixture evidence");
    expect(plan.blockers).toContain("Dashboard mutation tests need a provider-safe server-action/API harness.");
  });

  it("summarizes testing runtime readiness across install, execution, coverage, artifacts, CI, and branch protection", () => {
    const plan = buildTestingRuntimeReadinessPlan({
      rootScripts: ["test:phase14:static", "test:manifest", "test:unit"],
      lockfileCommitted: true,
      dependenciesInstalled: false,
      vitestWorkspaceConfigured: true,
      playwrightConfigured: true,
      ciWorkflowConfigured: true,
      phase14StaticPassed: true,
      testManifestPassed: true,
      unitTestsPassed: false,
      e2eTestsPassed: false,
      appBuildsPassed: false,
      prismaIntegrationTestsPassed: false,
      providerSandboxTestsPassed: false,
      securityRegressionTestsPassed: false,
      mobileStaticTestsPassed: true,
      mobileDeviceTestsPassed: false,
      coverageThresholdsConfigured: true,
      coverageArtifactsUploaded: false,
      playwrightArtifactsUploaded: false,
      ciRunPassed: false,
      branchProtectionRequiresCi: false,
      flakyTestPolicyConfigured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["test:e2e", "typecheck"]);
    expect(plan.requiredCommands).toContain("pnpm test:unit:coverage");
    expect(plan.requiredEvidence).toContain("Branch protection settings showing CI required before merge.");
    expect(plan.blockers).toContain("Workspace dependencies must install with pnpm before test execution.");
    expect(plan.blockers).toContain("Provider sandbox tests must pass for Stripe, storage, notification, calendar, and observability boundaries.");
    expect(plan.blockers).toContain("A GitHub Actions CI run must pass on the PR branch.");
  });

  it("summarizes Phase 9 app runtime/build readiness across web, dashboard, mobile, routes, Playwright, Expo, provider-disabled runtime, artifacts, and CI", () => {
    const plan = buildPhase9AppRuntimeBuildReadinessPlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      testingPackageTestsPassed: true,
      testingPackageTypecheckPassed: true,
      webBuildPassed: true,
      dashboardBuildPassed: true,
      mobileTypecheckPassed: true,
      notificationRouteTestsPassed: true,
      providerWebhookRouteTestsPassed: true,
      bookingRouteRuntimeSmokePassed: true,
      depositRouteRuntimeSmokePassed: true,
      dashboardTemplatesPlaywrightSmokePassed: true,
      dashboardMessagesPlaywrightSmokePassed: true,
      dashboardProviderDisabledStatesVerified: true,
      mobileNotificationScreenSmokePassed: true,
      expoSimulatorNotificationSmokePassed: true,
      expoDeviceNotificationSmokePassed: true,
      bookingToNotificationRuntimeSmokePassed: true,
      providerSendsDisabledInRuntimeSmoke: true,
      runtimeArtifactsCaptured: true,
      ciRequiresPhase9AppRuntimeGate: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredCommands).toContain("Playwright dashboard templates/messages smoke tests");
    expect(plan.requiredCommands).toContain("booking-to-notification runtime smoke with provider sends disabled");
  });

  it("blocks Phase 9 app runtime/build readiness until dashboard, mobile, runtime smoke, provider-disabled, artifacts, and CI evidence exist", () => {
    const plan = buildPhase9AppRuntimeBuildReadinessPlan({
      packageScripts: { test: "vitest run" },
      testingPackageTestsPassed: true,
      testingPackageTypecheckPassed: false,
      webBuildPassed: true,
      dashboardBuildPassed: true,
      mobileTypecheckPassed: true,
      notificationRouteTestsPassed: true,
      providerWebhookRouteTestsPassed: true,
      bookingRouteRuntimeSmokePassed: false,
      depositRouteRuntimeSmokePassed: false,
      dashboardTemplatesPlaywrightSmokePassed: false,
      dashboardMessagesPlaywrightSmokePassed: false,
      dashboardProviderDisabledStatesVerified: false,
      mobileNotificationScreenSmokePassed: false,
      expoSimulatorNotificationSmokePassed: false,
      expoDeviceNotificationSmokePassed: false,
      bookingToNotificationRuntimeSmokePassed: false,
      providerSendsDisabledInRuntimeSmoke: false,
      runtimeArtifactsCaptured: false,
      ciRequiresPhase9AppRuntimeGate: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "Phase 9 API route and booking/deposit runtime smoke output",
      "dashboard templates/messages Playwright smoke and provider-disabled state evidence",
      "mobile notification screen simulator and device smoke evidence",
      "booking-to-notification runtime, provider-disabled, artifact, and CI required-gate evidence",
    ]);
    expect(plan.blockers).toContain("Dashboard templates Playwright smoke test must pass.");
    expect(plan.blockers).toContain("Expo device notification screen smoke test must pass.");
    expect(plan.blockers).toContain("Runtime smoke tests must prove provider sends remain disabled or sandboxed.");
    expect(plan.blockers).toContain("CI must require the Phase 9 app runtime/build gate before merge.");
  });

  it("summarizes Phase 10 SEO app runtime/build readiness across builds, route smokes, dashboard browser interactions, rendered crawl, runtime artifacts, and CI", () => {
    const plan = buildPhase10SeoAppRuntimeBuildReadinessPlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      testingPackageTestsPassed: true,
      testingPackageTypecheckPassed: true,
      webBuildPassed: true,
      dashboardBuildPassed: true,
      sitemapRouteTestsPassed: true,
      seoPreviewRouteTestsPassed: true,
      sitemapPreviewRouteTestsPassed: true,
      dashboardSeoBrowserSmokePassed: true,
      dashboardSeoPublishInteractionSmokePassed: true,
      renderedPublicSeoCrawlPassed: true,
      renderedSitemapCrawlPassed: true,
      databaseBackedSeoRoutesWired: true,
      sitemapRuntimeEvidenceCaptured: true,
      apiPreviewRuntimeEvidenceCaptured: true,
      canonicalRuntimeEvidenceCaptured: true,
      ciRequiresPhase10SeoRuntimeGate: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredCommands).toContain("dashboard SEO browser smoke test");
    expect(plan.requiredCommands).toContain("rendered sitemap/canonical crawl");
  });

  it("blocks Phase 10 SEO app runtime/build readiness until dashboard SEO smoke, rendered crawl, database-backed routes, preview artifacts, and CI evidence exist", () => {
    const plan = buildPhase10SeoAppRuntimeBuildReadinessPlan({
      packageScripts: { test: "vitest run" },
      testingPackageTestsPassed: true,
      testingPackageTypecheckPassed: false,
      webBuildPassed: true,
      dashboardBuildPassed: true,
      sitemapRouteTestsPassed: true,
      seoPreviewRouteTestsPassed: false,
      sitemapPreviewRouteTestsPassed: false,
      dashboardSeoBrowserSmokePassed: false,
      dashboardSeoPublishInteractionSmokePassed: false,
      renderedPublicSeoCrawlPassed: false,
      renderedSitemapCrawlPassed: false,
      databaseBackedSeoRoutesWired: false,
      sitemapRuntimeEvidenceCaptured: false,
      apiPreviewRuntimeEvidenceCaptured: false,
      canonicalRuntimeEvidenceCaptured: false,
      ciRequiresPhase10SeoRuntimeGate: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "web/dashboard build and sitemap/SEO preview route test output",
      "dashboard SEO browser and publish/edit/archive interaction smoke evidence",
      "rendered public SEO route, sitemap, and canonical crawl evidence",
      "database-backed SEO route, runtime artifact, API preview, and CI required-gate evidence",
    ]);
    expect(plan.blockers).toContain("Dashboard SEO browser smoke test must pass.");
    expect(plan.blockers).toContain("Rendered public SEO route crawl must pass.");
    expect(plan.blockers).toContain("Database-backed SEO routes must be wired before production runtime evidence is complete.");
    expect(plan.blockers).toContain("CI must require the Phase 10 SEO app runtime/build gate before merge.");
  });
});
