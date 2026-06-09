import { describe, expect, it } from "vitest";
import {
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
    expect(plan.requiredCommands).toEqual(expect.arrayContaining([
      "pnpm --filter @inkroute/dashboard test",
      "dashboard auth/RBAC/tenant-isolation tests",
      "dashboard axe accessibility checks",
      "Playwright dashboard critical-flow suite",
      "branch protection dashboard required-check proof",
    ]));
    expect(plan.requiredControls).toContain("Use real runnable dashboard test files instead of package-only coverage matrices.");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "dashboard typecheck and build command evidence",
      "dashboard unit/component, route rendering, and auth guard test output",
      "dashboard RBAC/tenant, mutation lifecycle, and provider-safe state test output",
      "axe, keyboard, and Playwright dashboard critical-flow evidence",
      "CI artifact, branch protection, flaky policy, and secret-safe artifact evidence",
    ]));
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
    expect(plan.requiredControls).toContain("Require dashboard test gates in CI branch protection before launch.");
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
    expect(plan.requiredCommands).toEqual([
      "pnpm install --frozen-lockfile",
      "pnpm test:phase14:static",
      "pnpm test:manifest",
      "pnpm typecheck",
      "pnpm test:unit",
      "pnpm exec playwright install --with-deps",
      "pnpm test:e2e",
    ]);
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "committed lockfile and frozen pnpm install transcript",
      "Vitest workspace, static manifest, unit, and typecheck execution output",
      "Playwright browser install and web/dashboard E2E execution output",
      "passing CI workflow with retained Vitest, coverage, Playwright, trace, screenshot, video, and manifest artifacts",
      "triaged runner failure log, committed fixes, preserved scaffold coverage diff, and flaky-test policy",
    ]));
    expect(plan.blockers).toContain("pnpm install --frozen-lockfile must pass before runner evidence is production-significant.");
    expect(plan.blockers).toContain("Runner fixes must preserve the Phase 14 scaffolded security, route, middleware, E2E, Next config, and mobile coverage.");
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
    expect(plan.requiredCommands).toEqual([
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm exec playwright install --with-deps chromium",
      "pnpm test:e2e",
      "pnpm test:manifest",
    ]);
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "web/dashboard build output and running Next.js runtime logs",
      "Playwright browser install plus public booking/security/SEO spec output",
      "dashboard smoke/security/operator E2E output and manifest verification",
      "retained Playwright report, traces, screenshots, videos, and CI E2E artifact bundle",
      "documented E2E retry policy and committed fixes from real Playwright failures",
    ]));
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
    expect(plan.requiredCommands).toEqual([
      "pnpm test:e2e --project=web-chromium --grep @a11y",
      "pnpm test:e2e --project=dashboard-chromium --grep @a11y",
      "Lighthouse accessibility budget run for public and dashboard routes",
      "visual regression baseline and diff review",
      "manual screen-reader and mobile accessibility QA pass",
    ]);
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "web/dashboard Playwright @a11y output and axe reports",
      "Lighthouse, contrast, and responsive layout audit reports",
      "manual screen-reader and mobile accessibility QA notes",
      "visual regression baselines, reviewed diffs, screenshots, and retained artifacts",
      "manifest verification, CI accessibility/visual job output, and triaged regression log",
    ]));
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
    expect(plan.requiredCommands).toContain("provider sandbox contract suite for calendar/storage/email/sms/push/sentry/auth/rate-limit");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "static provider contract suite, manifest verification, signed raw-body fixtures, and replay/idempotency fixtures",
      "Stripe CLI webhook/idempotency and Google Calendar OAuth/sync sandbox transcripts",
      "storage signed URL/upload/download, rate-limit store, and auth session fixture contract output",
      "email, SMS, push, and Sentry sandbox send/capture artifacts",
      "redacted provider artifact bundle and CI provider-contract job evidence",
    ]));
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
    expect(plan.requiredCommands).toContain("gh api repos/:owner/:repo/actions/runs/<ci-run-id>/artifacts");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "CI workflow YAML and run log showing install, typecheck, coverage, and E2E gates",
      "coverage thresholds, Vitest coverage artifact, JUnit/JSON reports, and published test summary",
      "Playwright report plus retained traces, screenshots, videos, and failed-test debug artifact proof",
      "passing CI run, branch protection settings, flaky-test policy, and artifact retention settings",
    ]));
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
    expect(plan.requiredCommands).toContain("database EXPLAIN/ANALYZE query-plan checks");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "performance budget verifier, Lighthouse CI, Core Web Vitals, and route budget reports",
      "booking, webhook, and upload-intent load-test reports",
      "database EXPLAIN/ANALYZE query-plan output and image optimization benchmark report",
      "CI performance job, retained artifacts, regression thresholds, and triage log",
    ]));
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
    expect(plan.requiredCommands).toContain("pnpm install --frozen-lockfile");
    expect(plan.requiredCommands).toContain("branch protection required-check proof");
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
    expect(plan.requiredEvidence).toEqual([
      "install, static, manifest, and typecheck command evidence",
      "unit test, coverage threshold, and coverage artifact evidence",
      "Playwright E2E report, traces, screenshots, videos, and failure-debug artifact evidence",
      "app build, database integration, provider sandbox, and security test evidence",
      "mobile simulator and device test evidence",
      "CI reports, branch protection, flaky policy, and secret-safe artifact evidence",
    ]);
    expect(plan.blockers).toContain("pnpm install --frozen-lockfile must pass before testing launch execution is ready.");
    expect(plan.blockers).toContain("Provider sandbox tests must pass or remain explicitly launch-blocking.");
    expect(plan.blockers).toContain("Branch protection must require the CI quality check before merge.");
    expect(plan.blockers).toContain("Testing artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.");
  });
});
