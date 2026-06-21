import { describe, expect, it } from "vitest";
import {
  testingRuntimeReadinessRequiredCommands,
  testingRuntimeReadinessRequiredEvidence,
  testingLaunchExecutionEvidenceRequiredCommands,
  providerContractRuntimeReadinessRequiredCommands,
  providerContractRuntimeReadinessRequiredEvidence,
  phase14RunnerExecutionReadinessRequiredCommands,
  phase14RunnerExecutionReadinessRequiredEvidence,
  appE2eRuntimeReadinessRequiredCommands,
  appE2eRuntimeReadinessRequiredEvidence,
  accessibilityVisualRuntimeReadinessRequiredCommands,
  accessibilityVisualRuntimeReadinessRequiredEvidence,
  phase10SeoAppRuntimeBuildReadinessRequiredCommands,
  phase10SeoAppRuntimeBuildReadinessRequiredEvidence,
  phase9AppRuntimeBuildReadinessRequiredCommands,
  phase9AppRuntimeBuildReadinessRequiredEvidence,
  dashboardTestingRuntimeReadinessRequiredCommands,
  dashboardTestingRuntimeReadinessRequiredEvidence,
  dashboardTestExecutionEvidenceRequiredCommands,
  dashboardTestExecutionEvidenceRequiredControls,
  dashboardTestExecutionEvidenceRequiredEvidence,
  ciCoverageReportingReadinessRequiredCommands,
  ciCoverageReportingReadinessRequiredEvidence,
  performanceLoadRuntimeReadinessRequiredCommands,
  performanceLoadRuntimeReadinessRequiredEvidence,
  testingLaunchExecutionEvidenceRequiredEvidence,
  buildAccessibilityVisualRuntimeReadinessPlan,
  buildAppE2eRuntimeReadinessPlan,
  buildCiQualityGatePlan,
  buildCiCoverageReportingReadinessPlan,
  buildDashboardTestExecutionEvidencePlan,
  buildDashboardTestingRuntimeReadinessPlan,
  buildDashboardTestRequirements,
  buildPhase9AppRuntimeBuildReadinessPlan,
  buildPhase10SeoAppRuntimeBuildReadinessPlan,
  buildManualQaChecklist,
  buildPhase14RunnerExecutionReadinessPlan,
  buildPerformanceLoadRuntimeReadinessPlan,
  buildProviderContractRuntimeReadinessPlan,
  buildRouteSmokeManifest,
  buildTestingLaunchExecutionEvidencePlan,
  buildTestingRuntimeReadinessPlan,
  phase14Suites,
  summarizeDashboardTestRequirements,
  summarizeSuites,
} from "../src/index";

describe("Phase 14 testing manifest", () => {
  it("summarizes local-contract and gated tests", () => {
    const summary = summarizeSuites(phase14Suites);

    expect(summary.suiteCount).toBeGreaterThan(0);
    expect(summary.caseCount).toBeGreaterThan(0);
    expect(summary.byStatus.local_contract).toBeGreaterThan(0);
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
    expect(requirements.find((requirement) => requirement.id === "dashboard-component-state")?.blockers).toContain(
      "Runnable dashboard unit/component test evidence must be captured for empty, loading, error, gated provider action, and operator-review states.",
    );
    expect(requirements.find((requirement) => requirement.id === "dashboard-component-state")?.targetFiles).toEqual([
      "apps/dashboard/components/BookingLifecycleActionPanel.tsx",
      "apps/dashboard/components/MessageActionPanel.tsx",
      "apps/dashboard/components/PaymentActionPanel.tsx",
      "apps/dashboard/components/TravelPublishActionPanel.tsx",
      "apps/dashboard/components/SeoPublicationActionPanel.tsx",
      "apps/dashboard/tests/dashboard-mutation-runtime-static.test.ts",
    ]);
    expect(requirements.find((requirement) => requirement.id === "dashboard-component-state")?.verifies).toContain("gated provider action states");
    expect(requirements.find((requirement) => requirement.id === "dashboard-component-state")?.verifies).toContain("operator-review copy");
    expect(requirements.find((requirement) => requirement.id === "dashboard-component-state")?.blockers).not.toContain(
      "React/Next component test harness is not wired for dashboard app components.",
    );
    expect(requirements.find((requirement) => requirement.id === "dashboard-rbac-tenant-isolation")?.blockers).toContain(
      "Dashboard RBAC and tenant-isolation fixture evidence must be captured against the wired auth middleware and tenant-scoped loader contracts.",
    );
    expect(requirements.find((requirement) => requirement.id === "dashboard-rbac-tenant-isolation")?.blockers).not.toContain(
      "Dashboard auth middleware and tenant-scoped loaders must be wired before app-level RBAC tests are meaningful.",
    );
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
    expect(plan.requiredCommands).toBe(dashboardTestingRuntimeReadinessRequiredCommands);
    expect(plan.requiredEvidence).toBe(dashboardTestingRuntimeReadinessRequiredEvidence);
    expect(plan.blockers).toContain("Dashboard mutation tests need a provider-safe server-action/API harness.");
  });

  it("blocks dashboard test execution evidence until app tests, axe, Playwright, CI, branch protection, and safe artifacts exist", () => {
    const plan = buildDashboardTestExecutionEvidencePlan({
      packageScripts: { test: "vitest run" },
      testingPackageTestsPassed: true,
      testingPackageTypecheckPassed: false,
      dashboardTypecheckPassed: false,
      dashboardBuildPassed: false,
      dashboardUnitTestsPassed: false,
      dashboardRouteRenderingTestsPassed: false,
      dashboardAuthGuardTestsPassed: false,
      dashboardRbacTenantIsolationTestsPassed: false,
      dashboardMutationLifecycleTestsPassed: false,
      dashboardProviderSafeStateTestsPassed: false,
      dashboardAccessibilityAxePassed: false,
      dashboardKeyboardChecksPassed: false,
      playwrightDashboardSuitePassed: false,
      ciArtifactsUploaded: false,
      branchProtectionRequiresDashboardGate: false,
      flakyDashboardPolicyDocumented: false,
      secretSafeArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(dashboardTestExecutionEvidenceRequiredCommands);
    expect(plan.requiredCommands).toEqual(dashboardTestExecutionEvidenceRequiredCommands);
    expect(plan.requiredControls).toBe(dashboardTestExecutionEvidenceRequiredControls);
    expect(plan.requiredEvidence).toBe(dashboardTestExecutionEvidenceRequiredEvidence);
    expect(plan.blockers).toContain("Dashboard axe accessibility checks must pass.");
    expect(plan.blockers).toContain("Branch protection must require the dashboard test gate before merge.");
    expect(plan.blockers).toContain("Dashboard test artifacts must be redacted and free of secrets, tokens, raw PII, medical notes, payment data, provider tokens, and private file URLs.");
  });

  it("marks dashboard test execution evidence ready when app tests, axe, Playwright, CI, branch protection, and artifacts align", () => {
    const plan = buildDashboardTestExecutionEvidencePlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      testingPackageTestsPassed: true,
      testingPackageTypecheckPassed: true,
      dashboardTypecheckPassed: true,
      dashboardBuildPassed: true,
      dashboardUnitTestsPassed: true,
      dashboardRouteRenderingTestsPassed: true,
      dashboardAuthGuardTestsPassed: true,
      dashboardRbacTenantIsolationTestsPassed: true,
      dashboardMutationLifecycleTestsPassed: true,
      dashboardProviderSafeStateTestsPassed: true,
      dashboardAccessibilityAxePassed: true,
      dashboardKeyboardChecksPassed: true,
      playwrightDashboardSuitePassed: true,
      ciArtifactsUploaded: true,
      branchProtectionRequiresDashboardGate: true,
      flakyDashboardPolicyDocumented: true,
      secretSafeArtifactsCaptured: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredControls).toBe(dashboardTestExecutionEvidenceRequiredControls);
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
    expect(plan.requiredCommands).toBe(testingRuntimeReadinessRequiredCommands);
    expect(plan.requiredEvidence).toBe(testingRuntimeReadinessRequiredEvidence);
    expect(plan.blockers).toContain("Workspace dependencies must install with pnpm before test execution.");
    expect(plan.blockers).toContain("Provider sandbox tests must pass for Stripe, storage, notification, calendar, and observability boundaries.");
    expect(plan.blockers).toContain("A GitHub Actions CI run must pass on the PR branch.");
  });

  it("blocks Phase 14 runner execution readiness until install, unit, E2E, CI, artifacts, and runner fixes are proven", () => {
    const plan = buildPhase14RunnerExecutionReadinessPlan({
      rootScripts: ["test:phase14:static", "test:manifest", "test:unit"],
      lockfileCommitted: true,
      frozenInstallPassed: false,
      vitestWorkspaceResolved: false,
      playwrightBrowsersInstalled: false,
      phase14StaticPassed: true,
      manifestVerificationPassed: true,
      unitCommandPassed: false,
      e2eCommandPassed: false,
      typecheckCommandPassed: false,
      ciWorkflowPassed: false,
      ciArtifactsUploaded: false,
      runnerFailuresTriaged: false,
      runnerFixesCommitted: false,
      scaffoldCoveragePreserved: false,
      flakyRetryPolicyDocumented: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["test:e2e", "typecheck"]);
    expect(plan.requiredCommands).toBe(phase14RunnerExecutionReadinessRequiredCommands);
    expect(plan.requiredEvidence).toBe(phase14RunnerExecutionReadinessRequiredEvidence);
    expect(plan.blockers).toContain("pnpm install --frozen-lockfile must pass before runner evidence is production-significant.");
    expect(plan.blockers).toContain("Runner fixes must preserve the Phase 14 local-contract security, route, middleware, E2E, Next config, and mobile coverage.");
  });

  it("marks Phase 14 runner execution ready only after install, manifests, unit, E2E, CI, artifacts, and fixes are proven", () => {
    const plan = buildPhase14RunnerExecutionReadinessPlan({
      rootScripts: ["test:phase14:static", "test:manifest", "test:unit", "test:e2e", "typecheck"],
      lockfileCommitted: true,
      frozenInstallPassed: true,
      vitestWorkspaceResolved: true,
      playwrightBrowsersInstalled: true,
      phase14StaticPassed: true,
      manifestVerificationPassed: true,
      unitCommandPassed: true,
      e2eCommandPassed: true,
      typecheckCommandPassed: true,
      ciWorkflowPassed: true,
      ciArtifactsUploaded: true,
      runnerFailuresTriaged: true,
      runnerFixesCommitted: true,
      scaffoldCoveragePreserved: true,
      flakyRetryPolicyDocumented: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });

  it("blocks app E2E runtime readiness until app builds, running Next runtimes, Playwright specs, and artifacts are proven", () => {
    const plan = buildAppE2eRuntimeReadinessPlan({
      rootScripts: [],
      webBuildPassed: false,
      dashboardBuildPassed: false,
      webRuntimeStarted: false,
      dashboardRuntimeStarted: false,
      playwrightBrowsersInstalled: false,
      publicBookingSpecPassed: false,
      publicSecurityRuntimeSpecPassed: false,
      publicSeoSpecPassed: false,
      dashboardSmokeSpecPassed: false,
      dashboardSecurityRuntimeSpecPassed: false,
      dashboardOperatorSurfacesSpecPassed: false,
      e2eManifestVerificationPassed: false,
      traceCaptureConfigured: false,
      artifactsRetained: false,
      failureScreenshotsVideosRetained: false,
      flakyRetriesConfigured: false,
      hardenedFailuresCommitted: false,
      ciE2eJobPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["test:e2e"]);
    expect(plan.requiredCommands).toBe(appE2eRuntimeReadinessRequiredCommands);
    expect(plan.requiredEvidence).toBe(appE2eRuntimeReadinessRequiredEvidence);
    expect(plan.blockers).toContain("Web Next.js runtime must start for Playwright public booking, security, and SEO specs.");
    expect(plan.blockers).toContain("Dashboard operator surfaces Playwright spec must pass for payments, releases, errors, messages, templates, SEO, and trust.");
    expect(plan.blockers).toContain("CI E2E job must pass with retained artifacts.");
  });

  it("marks app E2E runtime ready only after public/dashboard specs, runtimes, traces, artifacts, and hardened fixes exist", () => {
    const plan = buildAppE2eRuntimeReadinessPlan({
      rootScripts: ["test:e2e"],
      webBuildPassed: true,
      dashboardBuildPassed: true,
      webRuntimeStarted: true,
      dashboardRuntimeStarted: true,
      playwrightBrowsersInstalled: true,
      publicBookingSpecPassed: true,
      publicSecurityRuntimeSpecPassed: true,
      publicSeoSpecPassed: true,
      dashboardSmokeSpecPassed: true,
      dashboardSecurityRuntimeSpecPassed: true,
      dashboardOperatorSurfacesSpecPassed: true,
      e2eManifestVerificationPassed: true,
      traceCaptureConfigured: true,
      artifactsRetained: true,
      failureScreenshotsVideosRetained: true,
      flakyRetriesConfigured: true,
      hardenedFailuresCommitted: true,
      ciE2eJobPassed: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });

  it("blocks accessibility and visual runtime readiness until axe, Lighthouse, screen-reader, responsive, visual, artifact, and CI evidence exists", () => {
    const plan = buildAccessibilityVisualRuntimeReadinessPlan({
      rootScripts: [],
      webA11ySpecPassed: false,
      dashboardA11ySpecPassed: false,
      axeReportsCollected: false,
      lighthouseBudgetsPassed: false,
      manualScreenReaderPassCompleted: false,
      contrastAuditPassed: false,
      responsiveLayoutChecksPassed: false,
      visualBaselinesCaptured: false,
      visualDiffsReviewed: false,
      mobileAccessibilityQaPassed: false,
      accessibilityManifestVerified: true,
      artifactsRetained: false,
      ciA11yVisualJobPassed: false,
      regressionsTriagedAndFixed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["test:e2e"]);
    expect(plan.requiredCommands).toBe(accessibilityVisualRuntimeReadinessRequiredCommands);
    expect(plan.requiredEvidence).toBe(accessibilityVisualRuntimeReadinessRequiredEvidence);
    expect(plan.blockers).toContain("Manual screen-reader pass must cover VoiceOver/NVDA or equivalent public, dashboard, and mobile flows.");
    expect(plan.blockers).toContain("Visual regression diffs must be reviewed and accepted or fixed.");
  });

  it("marks accessibility and visual runtime ready only after all automated, manual, visual, mobile, artifact, and CI evidence exists", () => {
    const plan = buildAccessibilityVisualRuntimeReadinessPlan({
      rootScripts: ["test:e2e"],
      webA11ySpecPassed: true,
      dashboardA11ySpecPassed: true,
      axeReportsCollected: true,
      lighthouseBudgetsPassed: true,
      manualScreenReaderPassCompleted: true,
      contrastAuditPassed: true,
      responsiveLayoutChecksPassed: true,
      visualBaselinesCaptured: true,
      visualDiffsReviewed: true,
      mobileAccessibilityQaPassed: true,
      accessibilityManifestVerified: true,
      artifactsRetained: true,
      ciA11yVisualJobPassed: true,
      regressionsTriagedAndFixed: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });

  it("blocks provider contract runtime readiness until signed webhook fixtures, provider sandboxes, auth, rate-limit, artifacts, and CI evidence exist", () => {
    const plan = buildProviderContractRuntimeReadinessPlan({
      rootScripts: ["test:manifest"],
      staticWebhookContractSuitePassed: true,
      providerManifestVerified: true,
      stripeCliWebhookPassed: false,
      stripeIdempotencyVerified: false,
      googleCalendarOauthPassed: false,
      googleCalendarSyncVerified: false,
      storageSignedUrlTestsPassed: false,
      storageUploadDownloadVerified: false,
      resendEmailSandboxPassed: false,
      twilioSmsSandboxPassed: false,
      expoPushSandboxPassed: false,
      sentryCaptureVerified: false,
      authSessionFixturesPassed: false,
      rateLimitStoreTestsPassed: false,
      rawBodySignatureFixturesCommitted: false,
      replayIdempotencyFixturesCommitted: false,
      redactedProviderArtifactsRetained: false,
      ciProviderContractJobPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["test:unit"]);
    expect(plan.requiredCommands).toBe(providerContractRuntimeReadinessRequiredCommands);
    expect(plan.requiredEvidence).toBe(providerContractRuntimeReadinessRequiredEvidence);
    expect(plan.blockers).toContain("Stripe CLI signed webhook replay must pass against the local or preview webhook route.");
    expect(plan.blockers).toContain("Google Calendar freebusy, sync-token, conflict, insert/update/delete, and disconnect flows must be verified.");
    expect(plan.blockers).toContain("Sentry web, dashboard, and mobile capture contracts must verify event ids, source maps, issue grouping, and redaction.");
  });

  it("marks provider contract runtime ready only after every provider sandbox and credential-safe artifact proof exists", () => {
    const plan = buildProviderContractRuntimeReadinessPlan({
      rootScripts: ["test:manifest", "test:unit"],
      staticWebhookContractSuitePassed: true,
      providerManifestVerified: true,
      stripeCliWebhookPassed: true,
      stripeIdempotencyVerified: true,
      googleCalendarOauthPassed: true,
      googleCalendarSyncVerified: true,
      storageSignedUrlTestsPassed: true,
      storageUploadDownloadVerified: true,
      resendEmailSandboxPassed: true,
      twilioSmsSandboxPassed: true,
      expoPushSandboxPassed: true,
      sentryCaptureVerified: true,
      authSessionFixturesPassed: true,
      rateLimitStoreTestsPassed: true,
      rawBodySignatureFixturesCommitted: true,
      replayIdempotencyFixturesCommitted: true,
      redactedProviderArtifactsRetained: true,
      ciProviderContractJobPassed: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });

  it("blocks CI coverage/reporting readiness until CI passes with coverage, reports, artifacts, branch protection, and flaky policy", () => {
    const plan = buildCiCoverageReportingReadinessPlan({
      rootScripts: ["test:e2e"],
      ciWorkflowRunsInstall: true,
      ciWorkflowRunsTypecheck: false,
      ciWorkflowRunsUnitCoverage: false,
      ciWorkflowRunsE2e: true,
      coverageThresholdsConfigured: true,
      vitestCoverageArtifactUploaded: false,
      playwrightReportArtifactUploaded: false,
      playwrightTracesScreenshotsVideosUploaded: false,
      junitJsonReportsPublished: false,
      ciRunPassed: false,
      branchProtectionRequiresCi: false,
      flakyRetryPolicyConfigured: false,
      flakyQuarantineDocumented: false,
      testReportSummaryPublished: false,
      artifactRetentionConfigured: false,
      failureDebugArtifactsVerified: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["test:unit:coverage", "typecheck"]);
    expect(plan.requiredCommands).toBe(ciCoverageReportingReadinessRequiredCommands);
    expect(plan.requiredEvidence).toBe(ciCoverageReportingReadinessRequiredEvidence);
    expect(plan.blockers).toContain("A GitHub Actions CI run must pass on the PR branch.");
    expect(plan.blockers).toContain("Branch protection must require the CI quality check before merge.");
    expect(plan.blockers).toContain("CI must retain Playwright failure traces, screenshots, and videos.");
  });

  it("marks CI coverage/reporting ready only after all gates, artifacts, branch protection, reports, and flaky policy are proven", () => {
    const plan = buildCiCoverageReportingReadinessPlan({
      rootScripts: ["test:unit:coverage", "test:e2e", "typecheck"],
      ciWorkflowRunsInstall: true,
      ciWorkflowRunsTypecheck: true,
      ciWorkflowRunsUnitCoverage: true,
      ciWorkflowRunsE2e: true,
      coverageThresholdsConfigured: true,
      vitestCoverageArtifactUploaded: true,
      playwrightReportArtifactUploaded: true,
      playwrightTracesScreenshotsVideosUploaded: true,
      junitJsonReportsPublished: true,
      ciRunPassed: true,
      branchProtectionRequiresCi: true,
      flakyRetryPolicyConfigured: true,
      flakyQuarantineDocumented: true,
      testReportSummaryPublished: true,
      artifactRetentionConfigured: true,
      failureDebugArtifactsVerified: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });

  it("blocks performance/load readiness until budgets, Lighthouse, load tests, query plans, image benchmarks, artifacts, and CI evidence exist", () => {
    const plan = buildPerformanceLoadRuntimeReadinessPlan({
      rootScripts: [],
      performanceBudgetVerifierPassed: true,
      lighthouseCiPassed: false,
      coreWebVitalsWithinBudget: false,
      publicRouteBudgetsPassed: false,
      dashboardRouteBudgetsPassed: false,
      bookingLoadTestPassed: false,
      webhookBurstTestPassed: false,
      uploadIntentLoadTestPassed: false,
      dbExplainPlansPassed: false,
      imageOptimizationBenchmarksPassed: false,
      regressionThresholdsConfigured: false,
      performanceArtifactsRetained: false,
      ciPerformanceJobPassed: false,
      regressionsTriagedAndFixed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["test:performance:budgets"]);
    expect(plan.requiredCommands).toBe(performanceLoadRuntimeReadinessRequiredCommands);
    expect(plan.requiredCommands).toEqual(performanceLoadRuntimeReadinessRequiredCommands);
    expect(plan.requiredEvidence).toBe(performanceLoadRuntimeReadinessRequiredEvidence);
    expect(plan.blockers).toContain("Lighthouse CI must execute against public and dashboard route budgets.");
    expect(plan.blockers).toContain("Webhook burst load test must meet signed replay, idempotency, p95, and error-rate targets.");
    expect(plan.blockers).toContain("Database EXPLAIN/ANALYZE query-plan checks must pass for dashboard, SEO, and webhook idempotency queries.");
  });

  it("marks performance/load readiness ready only after budgets, load, DB, image, artifact, CI, and triage evidence exists", () => {
    const plan = buildPerformanceLoadRuntimeReadinessPlan({
      rootScripts: ["test:performance:budgets"],
      performanceBudgetVerifierPassed: true,
      lighthouseCiPassed: true,
      coreWebVitalsWithinBudget: true,
      publicRouteBudgetsPassed: true,
      dashboardRouteBudgetsPassed: true,
      bookingLoadTestPassed: true,
      webhookBurstTestPassed: true,
      uploadIntentLoadTestPassed: true,
      dbExplainPlansPassed: true,
      imageOptimizationBenchmarksPassed: true,
      regressionThresholdsConfigured: true,
      performanceArtifactsRetained: true,
      ciPerformanceJobPassed: true,
      regressionsTriagedAndFixed: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
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
    expect(plan.requiredCommands).toBe(phase9AppRuntimeBuildReadinessRequiredCommands);
    
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
    expect(plan.requiredEvidence).toEqual(phase9AppRuntimeBuildReadinessRequiredEvidence.slice(1));
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
    expect(plan.requiredCommands).toBe(phase10SeoAppRuntimeBuildReadinessRequiredCommands);
    
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
    expect(plan.requiredEvidence).toBe(phase10SeoAppRuntimeBuildReadinessRequiredEvidence);
    expect(plan.blockers).toContain("Dashboard SEO browser smoke test must pass.");
    expect(plan.blockers).toContain("Rendered public SEO route crawl must pass.");
    expect(plan.blockers).toContain("Database-backed SEO route execution evidence must be captured before production runtime evidence is complete.");
    expect(plan.blockers).not.toContain("Database-backed SEO routes must be wired before production runtime evidence is complete.");
    expect(plan.blockers).toContain("CI must require the Phase 10 SEO app runtime/build gate before merge.");
  });

  it("summarizes Phase 14 testing launch execution evidence across install, static, manifest, typecheck, unit, coverage, E2E, builds, integrations, mobile, CI, and artifacts", () => {
    const plan = buildTestingLaunchExecutionEvidencePlan({
      rootScripts: ["test:phase14:static", "test:manifest", "typecheck", "test:unit", "test:unit:coverage", "test:e2e"],
      lockfileInstallPassed: true,
      staticChecksPassed: true,
      manifestChecksPassed: true,
      typecheckPassed: true,
      unitTestsPassed: true,
      unitCoveragePassed: true,
      e2eTestsPassed: true,
      webBuildPassed: true,
      dashboardBuildPassed: true,
      prismaIntegrationTestsPassed: true,
      providerSandboxTestsPassed: true,
      securityTestsPassed: true,
      mobileSimulatorTestsPassed: true,
      mobileDeviceTestsPassed: true,
      coverageThresholdsMet: true,
      coverageArtifactsUploaded: true,
      playwrightArtifactsUploaded: true,
      junitJsonReportsPublished: true,
      ciRunPassed: true,
      branchProtectionRequiresCi: true,
      flakyTestPolicyDocumented: true,
      failureDebugArtifactsVerified: true,
      secretSafeArtifactsCaptured: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredCommands).toBe(testingLaunchExecutionEvidenceRequiredCommands);
    
  });

  it("blocks Phase 14 testing launch execution evidence until full command, integration, provider, mobile, CI, branch-protection, flaky-policy, and secret-safe artifact proof exists", () => {
    const plan = buildTestingLaunchExecutionEvidencePlan({
      rootScripts: ["test:manifest", "test:unit"],
      lockfileInstallPassed: false,
      staticChecksPassed: false,
      manifestChecksPassed: true,
      typecheckPassed: false,
      unitTestsPassed: true,
      unitCoveragePassed: false,
      e2eTestsPassed: false,
      webBuildPassed: false,
      dashboardBuildPassed: false,
      prismaIntegrationTestsPassed: false,
      providerSandboxTestsPassed: false,
      securityTestsPassed: false,
      mobileSimulatorTestsPassed: false,
      mobileDeviceTestsPassed: false,
      coverageThresholdsMet: false,
      coverageArtifactsUploaded: false,
      playwrightArtifactsUploaded: false,
      junitJsonReportsPublished: false,
      ciRunPassed: false,
      branchProtectionRequiresCi: false,
      flakyTestPolicyDocumented: false,
      failureDebugArtifactsVerified: false,
      secretSafeArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["test:phase14:static", "typecheck", "test:unit:coverage", "test:e2e"]);
    expect(plan.requiredEvidence).toBe(testingLaunchExecutionEvidenceRequiredEvidence);
    expect(plan.blockers).toContain("pnpm install --frozen-lockfile must pass before testing launch execution is ready.");
    expect(plan.blockers).toContain("Provider sandbox tests must pass or remain explicitly launch-blocking.");
    expect(plan.blockers).toContain("Branch protection must require the CI quality check before merge.");
    expect(plan.blockers).toContain("Testing artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.");
  });
});
