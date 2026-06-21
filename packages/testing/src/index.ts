export type TestLayer =
  | "unit"
  | "integration"
  | "e2e"
  | "accessibility"
  | "security"
  | "seo"
  | "mobile_device"
  | "provider"
  | "manual_qa";

export type TestSurface = "web" | "dashboard" | "mobile" | "api" | "package" | "database" | "provider" | "ci";
export type TestPriority = "critical" | "high" | "medium" | "low";
export type TestAutomationStatus = "implemented" | "local_contract" | "scaffolded" | "runtime_gated" | "credential_gated" | "manual";
export type QualityGateStatus = "pass" | "warn" | "block" | "not_run";

export interface TestCaseRecord {
  id: string;
  layer: TestLayer;
  surface: TestSurface;
  name: string;
  priority: TestPriority;
  status: TestAutomationStatus;
  files: string[];
  command?: string;
  verifies: string[];
  blockers: string[];
  gapIds: string[];
}

export interface TestSuiteRecord {
  id: string;
  name: string;
  layer: TestLayer;
  surface: TestSurface;
  command: string;
  status: TestAutomationStatus;
  cases: TestCaseRecord[];
}

export interface QaChecklistItem {
  id: string;
  area: string;
  description: string;
  priority: TestPriority;
  status: TestAutomationStatus;
  evidenceRequired: string;
  gapIds: string[];
}

export interface RouteSmokeTestRecord {
  id: string;
  surface: Extract<TestSurface, "web" | "dashboard" | "api">;
  path: string;
  expectedStatus: number;
  expectedEvidence: string[];
  status: TestAutomationStatus;
}

export interface CiQualityGate {
  id: string;
  command: string;
  required: boolean;
  status: QualityGateStatus;
  blocker: string;
  owner: "Codex" | "Jules" | "Claude Code" | "Local terminal" | "CI provider";
}

export type DashboardCoverageArea =
  | "route_rendering"
  | "component_state"
  | "rbac_tenant_isolation"
  | "mutation_lifecycle"
  | "accessibility"
  | "e2e_flow";

export interface DashboardTestRequirement {
  id: string;
  area: DashboardCoverageArea;
  priority: TestPriority;
  status: TestAutomationStatus;
  command: string;
  targetFiles: string[];
  verifies: string[];
  blockers: string[];
  gapIds: string[];
}

export interface DashboardTestingRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  testingPackageTestsPassed: boolean;
  testingPackageTypecheckPassed: boolean;
  dashboardTypecheckPassed: boolean;
  dashboardBuildPassed: boolean;
  implementedRequirementIds: readonly string[];
  passingRequirementIds: readonly string[];
  seededAuthFixturesConfigured: boolean;
  seededTenantDataConfigured: boolean;
  rbacTenantIsolationFixturesConfigured: boolean;
  mutationTestHarnessConfigured: boolean;
  accessibilityRunnerConfigured: boolean;
  playwrightDashboardProjectConfigured: boolean;
  ciUploadsDashboardArtifacts: boolean;
  branchProtectionRequiresDashboardTests: boolean;
}

export interface DashboardTestingRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  missingImplementedRequirements: readonly string[];
  missingPassingRequirements: readonly string[];
  requiredCommands: typeof dashboardTestingRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly DashboardTestingRuntimeReadinessRequiredEvidence[];
  blockers: readonly string[];
}

export interface TestingRuntimeReadinessInput {
  rootScripts: readonly string[];
  lockfileCommitted: boolean;
  dependenciesInstalled: boolean;
  vitestWorkspaceConfigured: boolean;
  playwrightConfigured: boolean;
  ciWorkflowConfigured: boolean;
  phase14StaticPassed: boolean;
  testManifestPassed: boolean;
  unitTestsPassed: boolean;
  e2eTestsPassed: boolean;
  appBuildsPassed: boolean;
  prismaIntegrationTestsPassed: boolean;
  providerSandboxTestsPassed: boolean;
  securityRegressionTestsPassed: boolean;
  mobileStaticTestsPassed: boolean;
  mobileDeviceTestsPassed: boolean;
  coverageThresholdsConfigured: boolean;
  coverageArtifactsUploaded: boolean;
  playwrightArtifactsUploaded: boolean;
  ciRunPassed: boolean;
  branchProtectionRequiresCi: boolean;
  flakyTestPolicyConfigured: boolean;
}

export interface TestingRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof testingRuntimeReadinessRequiredCommands;
  requiredEvidence: typeof testingRuntimeReadinessRequiredEvidence;
  blockers: readonly string[];
}

export interface Phase14RunnerExecutionReadinessInput {
  rootScripts: readonly string[];
  lockfileCommitted: boolean;
  frozenInstallPassed: boolean;
  vitestWorkspaceResolved: boolean;
  playwrightBrowsersInstalled: boolean;
  phase14StaticPassed: boolean;
  manifestVerificationPassed: boolean;
  unitCommandPassed: boolean;
  e2eCommandPassed: boolean;
  typecheckCommandPassed: boolean;
  ciWorkflowPassed: boolean;
  ciArtifactsUploaded: boolean;
  runnerFailuresTriaged: boolean;
  runnerFixesCommitted: boolean;
  scaffoldCoveragePreserved: boolean;
  flakyRetryPolicyDocumented: boolean;
}

export interface Phase14RunnerExecutionReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof phase14RunnerExecutionReadinessRequiredCommands;
  requiredEvidence: readonly Phase14RunnerExecutionReadinessRequiredEvidence[];
  blockers: readonly string[];
}

export interface AppE2eRuntimeReadinessInput {
  rootScripts: readonly string[];
  webBuildPassed: boolean;
  dashboardBuildPassed: boolean;
  webRuntimeStarted: boolean;
  dashboardRuntimeStarted: boolean;
  playwrightBrowsersInstalled: boolean;
  publicBookingSpecPassed: boolean;
  publicSecurityRuntimeSpecPassed: boolean;
  publicSeoSpecPassed: boolean;
  dashboardSmokeSpecPassed: boolean;
  dashboardSecurityRuntimeSpecPassed: boolean;
  dashboardOperatorSurfacesSpecPassed: boolean;
  e2eManifestVerificationPassed: boolean;
  traceCaptureConfigured: boolean;
  artifactsRetained: boolean;
  failureScreenshotsVideosRetained: boolean;
  flakyRetriesConfigured: boolean;
  hardenedFailuresCommitted: boolean;
  ciE2eJobPassed: boolean;
}

export interface AppE2eRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof appE2eRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly AppE2eRuntimeReadinessRequiredEvidence[];
  blockers: readonly string[];
}

export interface AccessibilityVisualRuntimeReadinessInput {
  rootScripts: readonly string[];
  webA11ySpecPassed: boolean;
  dashboardA11ySpecPassed: boolean;
  axeReportsCollected: boolean;
  lighthouseBudgetsPassed: boolean;
  manualScreenReaderPassCompleted: boolean;
  contrastAuditPassed: boolean;
  responsiveLayoutChecksPassed: boolean;
  visualBaselinesCaptured: boolean;
  visualDiffsReviewed: boolean;
  mobileAccessibilityQaPassed: boolean;
  accessibilityManifestVerified: boolean;
  artifactsRetained: boolean;
  ciA11yVisualJobPassed: boolean;
  regressionsTriagedAndFixed: boolean;
}

export interface AccessibilityVisualRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof accessibilityVisualRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly AccessibilityVisualRuntimeReadinessRequiredEvidence[];
  blockers: readonly string[];
}

export interface ProviderContractRuntimeReadinessInput {
  rootScripts: readonly string[];
  staticWebhookContractSuitePassed: boolean;
  providerManifestVerified: boolean;
  stripeCliWebhookPassed: boolean;
  stripeIdempotencyVerified: boolean;
  googleCalendarOauthPassed: boolean;
  googleCalendarSyncVerified: boolean;
  storageSignedUrlTestsPassed: boolean;
  storageUploadDownloadVerified: boolean;
  resendEmailSandboxPassed: boolean;
  twilioSmsSandboxPassed: boolean;
  expoPushSandboxPassed: boolean;
  sentryCaptureVerified: boolean;
  authSessionFixturesPassed: boolean;
  rateLimitStoreTestsPassed: boolean;
  rawBodySignatureFixturesCommitted: boolean;
  replayIdempotencyFixturesCommitted: boolean;
  redactedProviderArtifactsRetained: boolean;
  ciProviderContractJobPassed: boolean;
}

export interface ProviderContractRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof providerContractRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly ProviderContractRuntimeReadinessRequiredEvidence[];
  blockers: readonly string[];
}

export interface CiCoverageReportingReadinessInput {
  rootScripts: readonly string[];
  ciWorkflowRunsInstall: boolean;
  ciWorkflowRunsTypecheck: boolean;
  ciWorkflowRunsUnitCoverage: boolean;
  ciWorkflowRunsE2e: boolean;
  coverageThresholdsConfigured: boolean;
  vitestCoverageArtifactUploaded: boolean;
  playwrightReportArtifactUploaded: boolean;
  playwrightTracesScreenshotsVideosUploaded: boolean;
  junitJsonReportsPublished: boolean;
  ciRunPassed: boolean;
  branchProtectionRequiresCi: boolean;
  flakyRetryPolicyConfigured: boolean;
  flakyQuarantineDocumented: boolean;
  testReportSummaryPublished: boolean;
  artifactRetentionConfigured: boolean;
  failureDebugArtifactsVerified: boolean;
}

export interface CiCoverageReportingReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof ciCoverageReportingReadinessRequiredCommands;
  requiredEvidence: readonly CiCoverageReportingReadinessRequiredEvidence[];
  blockers: readonly string[];
}

export interface PerformanceLoadRuntimeReadinessInput {
  rootScripts: readonly string[];
  performanceBudgetVerifierPassed: boolean;
  lighthouseCiPassed: boolean;
  coreWebVitalsWithinBudget: boolean;
  publicRouteBudgetsPassed: boolean;
  dashboardRouteBudgetsPassed: boolean;
  bookingLoadTestPassed: boolean;
  webhookBurstTestPassed: boolean;
  uploadIntentLoadTestPassed: boolean;
  dbExplainPlansPassed: boolean;
  imageOptimizationBenchmarksPassed: boolean;
  regressionThresholdsConfigured: boolean;
  performanceArtifactsRetained: boolean;
  ciPerformanceJobPassed: boolean;
  regressionsTriagedAndFixed: boolean;
}

export interface PerformanceLoadRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof performanceLoadRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly PerformanceLoadRuntimeReadinessRequiredEvidence[];
  blockers: readonly string[];
}

export interface Phase9AppRuntimeBuildReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  testingPackageTestsPassed: boolean;
  testingPackageTypecheckPassed: boolean;
  webBuildPassed: boolean;
  dashboardBuildPassed: boolean;
  mobileTypecheckPassed: boolean;
  notificationRouteTestsPassed: boolean;
  providerWebhookRouteTestsPassed: boolean;
  bookingRouteRuntimeSmokePassed: boolean;
  depositRouteRuntimeSmokePassed: boolean;
  dashboardTemplatesPlaywrightSmokePassed: boolean;
  dashboardMessagesPlaywrightSmokePassed: boolean;
  dashboardProviderDisabledStatesVerified: boolean;
  mobileNotificationScreenSmokePassed: boolean;
  expoSimulatorNotificationSmokePassed: boolean;
  expoDeviceNotificationSmokePassed: boolean;
  bookingToNotificationRuntimeSmokePassed: boolean;
  providerSendsDisabledInRuntimeSmoke: boolean;
  runtimeArtifactsCaptured: boolean;
  ciRequiresPhase9AppRuntimeGate: boolean;
}

export interface Phase9AppRuntimeBuildReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof phase9AppRuntimeBuildReadinessRequiredCommands;
  requiredEvidence: readonly Phase9AppRuntimeBuildReadinessRequiredEvidence[];
  blockers: readonly string[];
}

export interface Phase10SeoAppRuntimeBuildReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  testingPackageTestsPassed: boolean;
  testingPackageTypecheckPassed: boolean;
  webBuildPassed: boolean;
  dashboardBuildPassed: boolean;
  sitemapRouteTestsPassed: boolean;
  seoPreviewRouteTestsPassed: boolean;
  sitemapPreviewRouteTestsPassed: boolean;
  dashboardSeoBrowserSmokePassed: boolean;
  dashboardSeoPublishInteractionSmokePassed: boolean;
  renderedPublicSeoCrawlPassed: boolean;
  renderedSitemapCrawlPassed: boolean;
  databaseBackedSeoRoutesWired: boolean;
  sitemapRuntimeEvidenceCaptured: boolean;
  apiPreviewRuntimeEvidenceCaptured: boolean;
  canonicalRuntimeEvidenceCaptured: boolean;
  ciRequiresPhase10SeoRuntimeGate: boolean;
}

export interface Phase10SeoAppRuntimeBuildReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof phase10SeoAppRuntimeBuildReadinessRequiredCommands;
  requiredEvidence: readonly Phase10SeoAppRuntimeBuildReadinessRequiredEvidence[];
  blockers: readonly string[];
}

export function createTestCase(input: TestCaseRecord): TestCaseRecord {
  return input;
}

export function createRouteSmokeTest(input: RouteSmokeTestRecord): RouteSmokeTestRecord {
  return input;
}

export function summarizeSuites(suites: readonly TestSuiteRecord[]) {
  const cases = suites.flatMap((suite) => suite.cases);
  const byStatus = cases.reduce<Record<TestAutomationStatus, number>>(
    (acc, testCase) => {
      acc[testCase.status] += 1;
      return acc;
    },
    {
      implemented: 0,
      local_contract: 0,
      scaffolded: 0,
      runtime_gated: 0,
      credential_gated: 0,
      manual: 0
    }
  );

  const productionBlocking = cases.filter((testCase) =>
    testCase.priority === "critical" && testCase.status !== "implemented"
  );

  return {
    suiteCount: suites.length,
    caseCount: cases.length,
    byStatus,
    productionBlockingCount: productionBlocking.length,
    productionBlockingIds: productionBlocking.map((testCase) => testCase.id)
  };
}

export function buildCiQualityGatePlan(): CiQualityGate[] {
  return [
    {
      id: "ci-install",
      command: "pnpm install --frozen-lockfile",
      required: true,
      status: "block",
      blocker: "No committed pnpm-lock.yaml and package install was unavailable in the ChatGPT sandbox.",
      owner: "Codex"
    },
    {
      id: "ci-typecheck",
      command: "pnpm typecheck",
      required: true,
      status: "not_run",
      blocker: "Requires dependency installation and generated Prisma client for DB package checks.",
      owner: "CI provider"
    },
    {
      id: "ci-unit-tests",
      command: "pnpm test:unit",
      required: true,
      status: "not_run",
      blocker: "Vitest dependency and workspace install are required before execution.",
      owner: "CI provider"
    },
    {
      id: "ci-e2e-tests",
      command: "pnpm test:e2e",
      required: true,
      status: "not_run",
      blocker: "Requires built/running Next.js apps and Playwright browsers.",
      owner: "CI provider"
    },
    {
      id: "ci-mobile-smoke",
      command: "pnpm --filter @inkroute/mobile test",
      required: false,
      status: "not_run",
      blocker: "Requires Expo dependencies and device/simulator coverage for full confidence.",
      owner: "Local terminal"
    }
  ];
}

export function buildManualQaChecklist(): QaChecklistItem[] {
  return [
    {
      id: "qa-booking-mobile",
      area: "Public booking",
      description: "Complete the mobile booking flow with city, concept, client, reference metadata, policies, and deposit preview.",
      priority: "critical",
      status: "manual",
      evidenceRequired: "Screen recording plus submitted draft payload from a non-production environment.",
      gapIds: ["GAP-031", "GAP-032", "GAP-033", "GAP-034"]
    },
    {
      id: "qa-dashboard-tenant-switching",
      area: "Dashboard tenancy",
      description: "Confirm protected dashboard pages never display cross-tenant bookings, clients, media, payments, or error reports.",
      priority: "critical",
      status: "manual",
      evidenceRequired: "Two-tenant seeded account test with screenshots and failing cross-tenant fixture proof.",
      gapIds: ["GAP-036", "GAP-095"]
    },
    {
      id: "qa-mobile-offline-sync",
      area: "Mobile offline mode",
      description: "Capture offline notes, reconnect, and verify encrypted queue reconciliation without duplicate client timeline events.",
      priority: "high",
      status: "manual",
      evidenceRequired: "Device logs, sync transcript, and conflict resolution screenshot.",
      gapIds: ["GAP-045", "GAP-048"]
    }
  ];
}

export function buildRouteSmokeManifest(): RouteSmokeTestRecord[] {
  return [
    createRouteSmokeTest({
      id: "web-home",
      surface: "web",
      path: "/",
      expectedStatus: 200,
      expectedEvidence: ["hero booking CTA", "portfolio section", "travel schedule"],
      status: "runtime_gated"
    }),
    createRouteSmokeTest({
      id: "web-booking",
      surface: "web",
      path: "/booking",
      expectedStatus: 200,
      expectedEvidence: ["multi-step intake", "policy acknowledgement", "readiness score"],
      status: "runtime_gated"
    }),
    createRouteSmokeTest({
      id: "dashboard-bookings",
      surface: "dashboard",
      path: "/bookings",
      expectedStatus: 200,
      expectedEvidence: ["booking inbox", "status pills", "readiness indicators"],
      status: "runtime_gated"
    }),
    createRouteSmokeTest({
      id: "api-release-health",
      surface: "api",
      path: "/api/public/demo/release-health",
      expectedStatus: 200,
      expectedEvidence: ["release version", "feature flag snapshot", "health checks"],
      status: "runtime_gated"
    })
  ];
}

export function buildDashboardTestRequirements(): DashboardTestRequirement[] {
  return [
    {
      id: "dashboard-route-rendering",
      area: "route_rendering",
      priority: "critical",
      status: "runtime_gated",
      command: "pnpm --filter @inkroute/dashboard test -- dashboard-routes",
      targetFiles: ["apps/dashboard/app/**/*", "apps/dashboard/tests/routes/dashboard-routes.test.ts"],
      verifies: ["bookings route renders", "payments route renders", "clients route renders", "settings route renders"],
      blockers: ["Dashboard Next.js runtime/typecheck blockers must be resolved before route render tests can execute."],
      gapIds: ["GAP-039", "GAP-041"]
    },
    {
      id: "dashboard-component-state",
      area: "component_state",
      priority: "high",
      status: "runtime_gated",
      command: "pnpm --filter @inkroute/dashboard test -- dashboard-components",
      targetFiles: [
        "apps/dashboard/components/BookingLifecycleActionPanel.tsx",
        "apps/dashboard/components/MessageActionPanel.tsx",
        "apps/dashboard/components/PaymentActionPanel.tsx",
        "apps/dashboard/components/TravelPublishActionPanel.tsx",
        "apps/dashboard/components/SeoPublicationActionPanel.tsx",
        "apps/dashboard/tests/dashboard-mutation-runtime-static.test.ts",
      ],
      verifies: ["empty states", "loading states", "error states", "gated provider action states", "operator-review copy"],
      blockers: ["Runnable dashboard unit/component test evidence must be captured for empty, loading, error, gated provider action, and operator-review states."],
      gapIds: ["GAP-038", "GAP-041"]
    },
    {
      id: "dashboard-rbac-tenant-isolation",
      area: "rbac_tenant_isolation",
      priority: "critical",
      status: "runtime_gated",
      command: "pnpm --filter @inkroute/dashboard test -- dashboard-rbac",
      targetFiles: ["apps/dashboard/tests/auth/dashboard-rbac.test.ts", "packages/auth/tests/authorization.test.ts"],
      verifies: ["login redirect", "tenant switch redirect", "cross-tenant denial", "sensitive field redaction"],
      blockers: ["Dashboard RBAC and tenant-isolation fixture evidence must be captured against the wired auth middleware and tenant-scoped loader contracts."],
      gapIds: ["GAP-036", "GAP-037", "GAP-040", "GAP-041"]
    },
    {
      id: "dashboard-mutation-lifecycle",
      area: "mutation_lifecycle",
      priority: "critical",
      status: "runtime_gated",
      command: "pnpm --filter @inkroute/dashboard test -- dashboard-mutations",
      targetFiles: ["apps/dashboard/app/**/*", "packages/booking/tests/booking-readiness.test.ts"],
      verifies: ["booking lifecycle action", "idempotency replay", "audit log write", "provider rollback path"],
      blockers: ["Dashboard server actions/API routes still need to call package mutation plans and persistence services."],
      gapIds: ["GAP-024", "GAP-038", "GAP-041"]
    },
    {
      id: "dashboard-accessibility",
      area: "accessibility",
      priority: "high",
      status: "runtime_gated",
      command: "pnpm test:e2e --project=dashboard-chromium --grep @a11y",
      targetFiles: ["apps/dashboard/tests/e2e/dashboard-a11y.spec.ts"],
      verifies: ["keyboard navigation", "landmark structure", "form labels", "axe critical violations"],
      blockers: ["Playwright browsers and running dashboard app are required for accessibility checks."],
      gapIds: ["GAP-041", "GAP-104"]
    },
    {
      id: "dashboard-e2e-critical-flow",
      area: "e2e_flow",
      priority: "critical",
      status: "runtime_gated",
      command: "pnpm test:e2e --project=dashboard-chromium --grep @dashboard-critical",
      targetFiles: ["apps/dashboard/tests/e2e/dashboard-critical-flow.spec.ts"],
      verifies: ["auth gate", "booking inbox", "booking acceptance", "payment handoff", "notification preview"],
      blockers: ["Seeded data, auth fixtures, dashboard runtime, and provider-safe mutation routes are not all available yet."],
      gapIds: ["GAP-036", "GAP-037", "GAP-038", "GAP-041"]
    }
  ];
}

export function summarizeDashboardTestRequirements(requirements: readonly DashboardTestRequirement[] = buildDashboardTestRequirements()) {
  const requiredAreas: DashboardCoverageArea[] = [
    "route_rendering",
    "component_state",
    "rbac_tenant_isolation",
    "mutation_lifecycle",
    "accessibility",
    "e2e_flow"
  ];
  const coveredAreas = new Set(requirements.map((requirement) => requirement.area));
  const missingAreas = requiredAreas.filter((area) => !coveredAreas.has(area));
  const criticalRuntimeGated = requirements.filter(
    (requirement) => requirement.priority === "critical" && requirement.status !== "implemented"
  );

  return {
    requirementCount: requirements.length,
    missingAreas,
    runtimeGatedCount: requirements.filter((requirement) => requirement.status === "runtime_gated").length,
    criticalRuntimeGatedIds: criticalRuntimeGated.map((requirement) => requirement.id),
    productionReady: missingAreas.length === 0 && criticalRuntimeGated.length === 0
  };
}

export const dashboardTestingRuntimeReadinessRequiredCommands = [
      "pnpm --filter @inkroute/testing typecheck",
      "pnpm --filter @inkroute/testing test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/dashboard test",
      "pnpm test:e2e --project=dashboard-chromium",
    ] as const;

export const dashboardTestingRuntimeReadinessRequiredEvidence = [
      "passing route/component/RBAC/mutation/accessibility/E2E dashboard test output",
      "seeded auth, tenant, and RBAC fixture evidence",
      "CI artifact upload and required-check enforcement evidence",
    ] as const;

export type DashboardTestingRuntimeReadinessRequiredEvidence = (typeof dashboardTestingRuntimeReadinessRequiredEvidence)[number];

export function buildDashboardTestingRuntimeReadinessPlan(
  input: DashboardTestingRuntimeReadinessInput,
  requirements: readonly DashboardTestRequirement[] = buildDashboardTestRequirements(),
): DashboardTestingRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const requirementIds = requirements.map((requirement) => requirement.id);
  const missingImplementedRequirements = requirementIds.filter((id) => !input.implementedRequirementIds.includes(id));
  const missingPassingRequirements = requirementIds.filter((id) => !input.passingRequirementIds.includes(id));
  const blockers: string[] = [];
  const requiredEvidence: DashboardTestingRuntimeReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/testing package script is missing ${script}.`);
  if (!input.testingPackageTestsPassed) blockers.push("@inkroute/testing dashboard matrix tests must pass.");
  if (!input.testingPackageTypecheckPassed) blockers.push("@inkroute/testing typecheck must pass in an installed workspace.");
  if (!input.dashboardTypecheckPassed) blockers.push("@inkroute/dashboard typecheck must pass before dashboard app tests are meaningful.");
  if (!input.dashboardBuildPassed) blockers.push("@inkroute/dashboard build must pass before dashboard E2E evidence is meaningful.");
  if (missingImplementedRequirements.length > 0) blockers.push(`Dashboard test files are missing for requirement(s): ${missingImplementedRequirements.join(", ")}.`);
  if (missingPassingRequirements.length > 0) blockers.push(`Dashboard test requirements have not passed: ${missingPassingRequirements.join(", ")}.`);
  if (!input.seededAuthFixturesConfigured) blockers.push("Dashboard tests need seeded auth/session fixtures.");
  if (!input.seededTenantDataConfigured) blockers.push("Dashboard tests need seeded tenant data for bookings, clients, payments, and settings.");
  if (!input.rbacTenantIsolationFixturesConfigured) blockers.push("Dashboard tests need RBAC and cross-tenant denial fixtures.");
  if (!input.mutationTestHarnessConfigured) blockers.push("Dashboard mutation tests need a provider-safe server-action/API harness.");
  if (!input.accessibilityRunnerConfigured) blockers.push("Dashboard accessibility tests need an axe/keyboard runner.");
  if (!input.playwrightDashboardProjectConfigured) blockers.push("Playwright must include a dashboard project.");
  if (!input.ciUploadsDashboardArtifacts) blockers.push("CI must upload dashboard test, Playwright, trace, screenshot, and accessibility artifacts.");
  if (!input.branchProtectionRequiresDashboardTests) blockers.push("Branch protection must require dashboard test gates before merge.");

  if (missingImplementedRequirements.length > 0 || missingPassingRequirements.length > 0) {
    requiredEvidence.push(dashboardTestingRuntimeReadinessRequiredEvidence[0]);
  }
  if (!input.seededAuthFixturesConfigured || !input.seededTenantDataConfigured || !input.rbacTenantIsolationFixturesConfigured) {
    requiredEvidence.push(dashboardTestingRuntimeReadinessRequiredEvidence[1]);
  }
  if (!input.ciUploadsDashboardArtifacts || !input.branchProtectionRequiresDashboardTests) {
    requiredEvidence.push(dashboardTestingRuntimeReadinessRequiredEvidence[2]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    missingImplementedRequirements,
    missingPassingRequirements,
    requiredCommands: dashboardTestingRuntimeReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === dashboardTestingRuntimeReadinessRequiredEvidence.length
        ? dashboardTestingRuntimeReadinessRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export const testingRuntimeReadinessRequiredCommands = [
      "pnpm install --frozen-lockfile",
      "pnpm test:phase14:static",
      "pnpm test:manifest",
      "pnpm typecheck",
      "pnpm test:unit",
      "pnpm test:unit:coverage",
      "pnpm test:e2e",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "Prisma integration test suite against non-production fixtures",
      "Expo simulator/device smoke suite",
      "provider sandbox integration suites",
    ] as const;

export const testingRuntimeReadinessRequiredEvidence = [
  "Committed lockfile and reproducible dependency install output.",
  "Passing local or CI output for static, manifest, typecheck, unit, coverage, E2E, app build, Prisma, provider, and mobile commands.",
  "Vitest coverage thresholds plus retained coverage artifact from CI.",
  "Playwright report, JUnit/JSON output, and retained failure traces/screenshots/videos from CI.",
  "Branch protection settings showing CI required before merge.",
  "Documented flaky-test handling and quarantine process.",
] as const;

export function buildTestingRuntimeReadinessPlan(input: TestingRuntimeReadinessInput): TestingRuntimeReadinessPlan {
  const requiredScripts = ["test:phase14:static", "test:manifest", "test:unit", "test:e2e", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.rootScripts.includes(script));
  const blockers: string[] = [];

  for (const script of missingScripts) blockers.push(`Missing root ${script} script.`);
  if (!input.lockfileCommitted) blockers.push("Committed pnpm-lock.yaml is required before reproducible test execution.");
  if (!input.dependenciesInstalled) blockers.push("Workspace dependencies must install with pnpm before test execution.");
  if (!input.vitestWorkspaceConfigured) blockers.push("Vitest workspace configuration must include package, app, and contract tests.");
  if (!input.playwrightConfigured) blockers.push("Playwright configuration must include web and dashboard projects.");
  if (!input.ciWorkflowConfigured) blockers.push("CI workflow must run install, manifest, typecheck, unit, coverage, and E2E gates.");
  if (!input.phase14StaticPassed) blockers.push("Phase 14 static testing manifest check must pass.");
  if (!input.testManifestPassed) blockers.push("Test manifest verification must pass.");
  if (!input.unitTestsPassed) blockers.push("Unit tests must pass across workspace packages and app contract tests.");
  if (!input.e2eTestsPassed) blockers.push("Playwright web/dashboard E2E tests must pass.");
  if (!input.appBuildsPassed) blockers.push("Web and dashboard builds must pass before E2E results are production-significant.");
  if (!input.prismaIntegrationTestsPassed) blockers.push("Prisma/database integration tests must pass against non-production database fixtures.");
  if (!input.providerSandboxTestsPassed) blockers.push("Provider sandbox tests must pass for Stripe, storage, notification, calendar, and observability boundaries.");
  if (!input.securityRegressionTestsPassed) blockers.push("Security regression tests must cover auth, CSRF, tenant isolation, uploads, webhooks, and redaction.");
  if (!input.mobileStaticTestsPassed) blockers.push("Mobile static tests must pass.");
  if (!input.mobileDeviceTestsPassed) blockers.push("Expo simulator/device smoke tests must pass.");
  if (!input.coverageThresholdsConfigured) blockers.push("Coverage thresholds must be configured before launch quality gates.");
  if (!input.coverageArtifactsUploaded) blockers.push("Vitest coverage artifacts must upload from CI.");
  if (!input.playwrightArtifactsUploaded) blockers.push("Playwright HTML/JUnit/JSON reports and failure traces/screenshots/videos must upload from CI.");
  if (!input.ciRunPassed) blockers.push("A GitHub Actions CI run must pass on the PR branch.");
  if (!input.branchProtectionRequiresCi) blockers.push("Branch protection must require the CI quality check before merge.");
  if (!input.flakyTestPolicyConfigured) blockers.push("Flaky-test retry/quarantine policy must be configured and documented.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: testingRuntimeReadinessRequiredCommands,
    requiredEvidence: testingRuntimeReadinessRequiredEvidence,
    blockers,
  };
}

export const phase14RunnerExecutionReadinessRequiredCommands = [
      "pnpm install --frozen-lockfile",
      "pnpm test:phase14:static",
      "pnpm test:manifest",
      "pnpm typecheck",
      "pnpm test:unit",
      "pnpm exec playwright install --with-deps",
      "pnpm test:e2e",
    ] as const;

export const phase14RunnerExecutionReadinessRequiredEvidence = [
      "committed lockfile and frozen pnpm install transcript",
      "Vitest workspace, static manifest, unit, and typecheck execution output",
      "Playwright browser install and web/dashboard E2E execution output",
      "passing CI workflow with retained Vitest, coverage, Playwright, trace, screenshot, video, and manifest artifacts",
      "triaged runner failure log, committed fixes, preserved local-contract coverage diff, and flaky-test policy",
    ] as const;

export type Phase14RunnerExecutionReadinessRequiredEvidence = (typeof phase14RunnerExecutionReadinessRequiredEvidence)[number];

export function buildPhase14RunnerExecutionReadinessPlan(
  input: Phase14RunnerExecutionReadinessInput,
): Phase14RunnerExecutionReadinessPlan {
  const requiredScripts = ["test:phase14:static", "test:manifest", "test:unit", "test:e2e", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.rootScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: Phase14RunnerExecutionReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing root ${script} script.`);
  if (!input.lockfileCommitted) blockers.push("Committed pnpm-lock.yaml is required for reproducible Phase 14 runner execution.");
  if (!input.frozenInstallPassed) blockers.push("pnpm install --frozen-lockfile must pass before runner evidence is production-significant.");
  if (!input.vitestWorkspaceResolved) blockers.push("Vitest workspace must resolve all package, app, route, and contract test projects.");
  if (!input.playwrightBrowsersInstalled) blockers.push("Playwright browsers must install before web/dashboard E2E execution.");
  if (!input.phase14StaticPassed) blockers.push("Phase 14 static local-contract check must pass.");
  if (!input.manifestVerificationPassed) blockers.push("Test manifest verification must pass with security route, middleware, E2E, Next config, and mobile static suites included.");
  if (!input.unitCommandPassed) blockers.push("pnpm test:unit must execute and pass across packages and app contract tests.");
  if (!input.e2eCommandPassed) blockers.push("pnpm test:e2e must execute and pass for configured web/dashboard Playwright projects.");
  if (!input.typecheckCommandPassed) blockers.push("pnpm typecheck must execute and pass after runner/config fixes.");
  if (!input.ciWorkflowPassed) blockers.push("GitHub Actions CI workflow must pass with install, manifest, typecheck, unit, and E2E gates.");
  if (!input.ciArtifactsUploaded) blockers.push("CI must upload Vitest, coverage, Playwright, traces, screenshots, videos, and manifest artifacts.");
  if (!input.runnerFailuresTriaged) blockers.push("Real runner failures must be triaged from local or CI output before marking Phase 14 ready.");
  if (!input.runnerFixesCommitted) blockers.push("Fixes for TypeScript, module resolution, test environment, browser, or runner failures must be committed.");
  if (!input.scaffoldCoveragePreserved) blockers.push("Runner fixes must preserve the Phase 14 local-contract security, route, middleware, E2E, Next config, and mobile coverage.");
  if (!input.flakyRetryPolicyDocumented) blockers.push("Flaky retry/quarantine policy must be documented before CI runner evidence is trusted.");

  if (!input.lockfileCommitted || !input.frozenInstallPassed) {
    requiredEvidence.push(phase14RunnerExecutionReadinessRequiredEvidence[0]);
  }
  if (!input.vitestWorkspaceResolved || !input.phase14StaticPassed || !input.manifestVerificationPassed || !input.unitCommandPassed || !input.typecheckCommandPassed) {
    requiredEvidence.push(phase14RunnerExecutionReadinessRequiredEvidence[1]);
  }
  if (!input.playwrightBrowsersInstalled || !input.e2eCommandPassed) {
    requiredEvidence.push(phase14RunnerExecutionReadinessRequiredEvidence[2]);
  }
  if (!input.ciWorkflowPassed || !input.ciArtifactsUploaded) {
    requiredEvidence.push(phase14RunnerExecutionReadinessRequiredEvidence[3]);
  }
  if (!input.runnerFailuresTriaged || !input.runnerFixesCommitted || !input.scaffoldCoveragePreserved || !input.flakyRetryPolicyDocumented) {
    requiredEvidence.push(phase14RunnerExecutionReadinessRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: phase14RunnerExecutionReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === phase14RunnerExecutionReadinessRequiredEvidence.length
        ? phase14RunnerExecutionReadinessRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export const appE2eRuntimeReadinessRequiredCommands = [
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm exec playwright install --with-deps chromium",
      "pnpm test:e2e",
      "pnpm test:manifest",
    ] as const;

export const appE2eRuntimeReadinessRequiredEvidence = [
      "web/dashboard build output and running Next.js runtime logs",
      "Playwright browser install plus public booking/security/SEO spec output",
      "dashboard smoke/security/operator E2E output and manifest verification",
      "retained Playwright report, traces, screenshots, videos, and CI E2E artifact bundle",
      "documented E2E retry policy and committed fixes from real Playwright failures",
    ] as const;

export type AppE2eRuntimeReadinessRequiredEvidence = (typeof appE2eRuntimeReadinessRequiredEvidence)[number];

export function buildAppE2eRuntimeReadinessPlan(input: AppE2eRuntimeReadinessInput): AppE2eRuntimeReadinessPlan {
  const requiredScripts = ["test:e2e"];
  const missingScripts = requiredScripts.filter((script) => !input.rootScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: AppE2eRuntimeReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing root ${script} script.`);
  if (!input.webBuildPassed) blockers.push("@inkroute/web build must pass before public-site E2E smoke results are meaningful.");
  if (!input.dashboardBuildPassed) blockers.push("@inkroute/dashboard build must pass before dashboard E2E smoke results are meaningful.");
  if (!input.webRuntimeStarted) blockers.push("Web Next.js runtime must start for Playwright public booking, security, and SEO specs.");
  if (!input.dashboardRuntimeStarted) blockers.push("Dashboard Next.js runtime must start for dashboard smoke, security, and operator surface specs.");
  if (!input.playwrightBrowsersInstalled) blockers.push("Playwright Chromium browser must be installed before E2E execution.");
  if (!input.publicBookingSpecPassed) blockers.push("Public booking Playwright smoke spec must pass.");
  if (!input.publicSecurityRuntimeSpecPassed) blockers.push("Public security runtime Playwright spec must pass.");
  if (!input.publicSeoSpecPassed) blockers.push("Public city/style SEO Playwright spec must pass.");
  if (!input.dashboardSmokeSpecPassed) blockers.push("Dashboard smoke Playwright spec must pass.");
  if (!input.dashboardSecurityRuntimeSpecPassed) blockers.push("Dashboard security runtime Playwright spec must pass.");
  if (!input.dashboardOperatorSurfacesSpecPassed) blockers.push("Dashboard operator surfaces Playwright spec must pass for payments, releases, errors, messages, templates, SEO, and trust.");
  if (!input.e2eManifestVerificationPassed) blockers.push("E2E manifest verification must include public booking, security runtime, SEO, dashboard smoke, dashboard security, and operator surface specs.");
  if (!input.traceCaptureConfigured) blockers.push("Playwright trace capture must be configured for failed E2E runs.");
  if (!input.artifactsRetained) blockers.push("Playwright reports and E2E artifacts must be retained locally or in CI.");
  if (!input.failureScreenshotsVideosRetained) blockers.push("Failure screenshots and videos must be retained for E2E debugging.");
  if (!input.flakyRetriesConfigured) blockers.push("E2E retry/flake handling must be configured before CI evidence is trusted.");
  if (!input.hardenedFailuresCommitted) blockers.push("Fixes from real Playwright rendering, selector, routing, or timing failures must be committed.");
  if (!input.ciE2eJobPassed) blockers.push("CI E2E job must pass with retained artifacts.");

  if (!input.webBuildPassed || !input.dashboardBuildPassed || !input.webRuntimeStarted || !input.dashboardRuntimeStarted) {
    requiredEvidence.push(appE2eRuntimeReadinessRequiredEvidence[0]);
  }
  if (!input.playwrightBrowsersInstalled || !input.publicBookingSpecPassed || !input.publicSecurityRuntimeSpecPassed || !input.publicSeoSpecPassed) {
    requiredEvidence.push(appE2eRuntimeReadinessRequiredEvidence[1]);
  }
  if (!input.dashboardSmokeSpecPassed || !input.dashboardSecurityRuntimeSpecPassed || !input.dashboardOperatorSurfacesSpecPassed || !input.e2eManifestVerificationPassed) {
    requiredEvidence.push(appE2eRuntimeReadinessRequiredEvidence[2]);
  }
  if (!input.traceCaptureConfigured || !input.artifactsRetained || !input.failureScreenshotsVideosRetained || !input.ciE2eJobPassed) {
    requiredEvidence.push(appE2eRuntimeReadinessRequiredEvidence[3]);
  }
  if (!input.flakyRetriesConfigured || !input.hardenedFailuresCommitted) {
    requiredEvidence.push(appE2eRuntimeReadinessRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: appE2eRuntimeReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === appE2eRuntimeReadinessRequiredEvidence.length
        ? appE2eRuntimeReadinessRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export const accessibilityVisualRuntimeReadinessRequiredCommands = [
      "pnpm test:e2e --project=web-chromium --grep @a11y",
      "pnpm test:e2e --project=dashboard-chromium --grep @a11y",
      "collect axe reports for public web and dashboard accessibility runs",
      "Lighthouse accessibility budget run for public and dashboard routes",
      "contrast audit for public web, dashboard, and mobile high-risk surfaces",
      "responsive layout audit for mobile, tablet, and desktop breakpoints",
      "visual regression baseline and diff review",
      "manual screen-reader and mobile accessibility QA pass",
    ] as const;

export const accessibilityVisualRuntimeReadinessRequiredEvidence = [
      "web/dashboard Playwright @a11y output and axe reports",
      "Lighthouse, contrast, and responsive layout audit reports",
      "manual screen-reader and mobile accessibility QA notes",
      "visual regression baselines, reviewed diffs, screenshots, and retained artifacts",
      "manifest verification, CI accessibility/visual job output, and triaged regression log",
    ] as const;

export type AccessibilityVisualRuntimeReadinessRequiredEvidence = (typeof accessibilityVisualRuntimeReadinessRequiredEvidence)[number];

export function buildAccessibilityVisualRuntimeReadinessPlan(
  input: AccessibilityVisualRuntimeReadinessInput,
): AccessibilityVisualRuntimeReadinessPlan {
  const requiredScripts = ["test:e2e"];
  const missingScripts = requiredScripts.filter((script) => !input.rootScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: AccessibilityVisualRuntimeReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing root ${script} script.`);
  if (!input.webA11ySpecPassed) blockers.push("Web Playwright @a11y spec must pass for public booking, navigation, labels, focus, and landmarks.");
  if (!input.dashboardA11ySpecPassed) blockers.push("Dashboard Playwright @a11y spec must pass for navigation, tenant context, request regions, and labelled controls.");
  if (!input.axeReportsCollected) blockers.push("Axe reports must be collected for public web and dashboard accessibility runs.");
  if (!input.lighthouseBudgetsPassed) blockers.push("Lighthouse accessibility budgets must pass for critical public and dashboard routes.");
  if (!input.manualScreenReaderPassCompleted) blockers.push("Manual screen-reader pass must cover VoiceOver/NVDA or equivalent public, dashboard, and mobile flows.");
  if (!input.contrastAuditPassed) blockers.push("Color contrast audit must pass for public web, dashboard, and mobile high-risk surfaces.");
  if (!input.responsiveLayoutChecksPassed) blockers.push("Responsive layout checks must pass for mobile, tablet, and desktop breakpoints.");
  if (!input.visualBaselinesCaptured) blockers.push("Visual regression baselines must be captured for public web, dashboard, and mobile critical screens.");
  if (!input.visualDiffsReviewed) blockers.push("Visual regression diffs must be reviewed and accepted or fixed.");
  if (!input.mobileAccessibilityQaPassed) blockers.push("Mobile accessibility QA must pass for VoiceOver/TalkBack, text scaling, contrast, and touch targets.");
  if (!input.accessibilityManifestVerified) blockers.push("Accessibility checklist and E2E manifests must verify required a11y/visual specs are present.");
  if (!input.artifactsRetained) blockers.push("Accessibility, Lighthouse, visual baseline/diff, screenshot, and manual QA artifacts must be retained.");
  if (!input.ciA11yVisualJobPassed) blockers.push("CI accessibility/visual job must pass or publish explicit retained artifacts.");
  if (!input.regressionsTriagedAndFixed) blockers.push("Accessibility and visual regressions found during execution must be triaged and fixed or documented as accepted exceptions.");

  if (!input.webA11ySpecPassed || !input.dashboardA11ySpecPassed || !input.axeReportsCollected) {
    requiredEvidence.push(accessibilityVisualRuntimeReadinessRequiredEvidence[0]);
  }
  if (!input.lighthouseBudgetsPassed || !input.contrastAuditPassed || !input.responsiveLayoutChecksPassed) {
    requiredEvidence.push(accessibilityVisualRuntimeReadinessRequiredEvidence[1]);
  }
  if (!input.manualScreenReaderPassCompleted || !input.mobileAccessibilityQaPassed) {
    requiredEvidence.push(accessibilityVisualRuntimeReadinessRequiredEvidence[2]);
  }
  if (!input.visualBaselinesCaptured || !input.visualDiffsReviewed || !input.artifactsRetained) {
    requiredEvidence.push(accessibilityVisualRuntimeReadinessRequiredEvidence[3]);
  }
  if (!input.accessibilityManifestVerified || !input.ciA11yVisualJobPassed || !input.regressionsTriagedAndFixed) {
    requiredEvidence.push(accessibilityVisualRuntimeReadinessRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: accessibilityVisualRuntimeReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === accessibilityVisualRuntimeReadinessRequiredEvidence.length
        ? accessibilityVisualRuntimeReadinessRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export const providerContractRuntimeReadinessRequiredCommands = [
      "pnpm test:manifest",
      "pnpm vitest run apps/web/tests/provider-webhook-contracts.test.ts",
      "stripe listen --forward-to localhost:3000/api/webhooks/stripe",
      "stripe trigger checkout.session.completed",
      "provider sandbox contract suite for calendar/storage/email/sms/push/sentry/auth/rate-limit",
    ] as const;

export const providerContractRuntimeReadinessRequiredEvidence = [
      "static provider contract suite, manifest verification, signed raw-body fixtures, and replay/idempotency fixtures",
      "Stripe CLI webhook/idempotency and Google Calendar OAuth/sync sandbox transcripts",
      "storage signed URL/upload/download, rate-limit store, and auth session fixture contract output",
      "email, SMS, push, and Sentry sandbox send/capture artifacts",
      "redacted provider artifact bundle and CI provider-contract job evidence",
    ] as const;

export type ProviderContractRuntimeReadinessRequiredEvidence = (typeof providerContractRuntimeReadinessRequiredEvidence)[number];

export function buildProviderContractRuntimeReadinessPlan(
  input: ProviderContractRuntimeReadinessInput,
): ProviderContractRuntimeReadinessPlan {
  const requiredScripts = ["test:unit", "test:manifest"];
  const missingScripts = requiredScripts.filter((script) => !input.rootScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: ProviderContractRuntimeReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing root ${script} script.`);
  if (!input.staticWebhookContractSuitePassed) blockers.push("Static provider webhook contract suite must pass for Stripe, email, SMS, and Sentry route boundaries.");
  if (!input.providerManifestVerified) blockers.push("Provider test manifest must verify all credential-gated provider suites and evidence requirements.");
  if (!input.stripeCliWebhookPassed) blockers.push("Stripe CLI signed webhook replay must pass against the local or preview webhook route.");
  if (!input.stripeIdempotencyVerified) blockers.push("Stripe payment webhook idempotency and audit-log replay behavior must be verified.");
  if (!input.googleCalendarOauthPassed) blockers.push("Google Calendar OAuth sandbox flow must pass with test account consent.");
  if (!input.googleCalendarSyncVerified) blockers.push("Google Calendar freebusy, sync-token, conflict, insert/update/delete, and disconnect flows must be verified.");
  if (!input.storageSignedUrlTestsPassed) blockers.push("Storage signed URL contract tests must pass for upload/download expiry, revocation, ACL denial, and derivative access.");
  if (!input.storageUploadDownloadVerified) blockers.push("Storage sandbox upload/download must verify object bytes, private originals, public derivatives, and scan-approved reads.");
  if (!input.resendEmailSandboxPassed) blockers.push("Resend/email sandbox send and webhook delivery contract must pass.");
  if (!input.twilioSmsSandboxPassed) blockers.push("Twilio SMS sandbox send, STOP handling, and webhook signature contract must pass.");
  if (!input.expoPushSandboxPassed) blockers.push("Expo Push sandbox token, receipt, opt-out, and tap-routing contract must pass.");
  if (!input.sentryCaptureVerified) blockers.push("Sentry web, dashboard, and mobile capture contracts must verify event ids, source maps, issue grouping, and redaction.");
  if (!input.authSessionFixturesPassed) blockers.push("Auth session fixtures must verify login, refresh, expiry, RBAC, tenant membership, and cross-tenant denial.");
  if (!input.rateLimitStoreTestsPassed) blockers.push("Rate-limit store contract tests must verify distributed counters, TTL, tenant-safe keys, bot challenge, and provider webhook bypass.");
  if (!input.rawBodySignatureFixturesCommitted) blockers.push("Signed raw-body fixtures must be committed for Stripe, email, SMS, and Sentry webhook verification.");
  if (!input.replayIdempotencyFixturesCommitted) blockers.push("Webhook replay/idempotency fixtures must be committed for duplicate delivery and out-of-order provider events.");
  if (!input.redactedProviderArtifactsRetained) blockers.push("Provider sandbox artifacts must be retained with credentials, tokens, raw payloads, PII, and payment details redacted.");
  if (!input.ciProviderContractJobPassed) blockers.push("CI provider-contract job must pass or publish credential-gated skip evidence and retained artifacts.");

  if (!input.staticWebhookContractSuitePassed || !input.providerManifestVerified || !input.rawBodySignatureFixturesCommitted || !input.replayIdempotencyFixturesCommitted) {
    requiredEvidence.push(providerContractRuntimeReadinessRequiredEvidence[0]);
  }
  if (!input.stripeCliWebhookPassed || !input.stripeIdempotencyVerified || !input.googleCalendarOauthPassed || !input.googleCalendarSyncVerified) {
    requiredEvidence.push(providerContractRuntimeReadinessRequiredEvidence[1]);
  }
  if (!input.storageSignedUrlTestsPassed || !input.storageUploadDownloadVerified || !input.rateLimitStoreTestsPassed || !input.authSessionFixturesPassed) {
    requiredEvidence.push(providerContractRuntimeReadinessRequiredEvidence[2]);
  }
  if (!input.resendEmailSandboxPassed || !input.twilioSmsSandboxPassed || !input.expoPushSandboxPassed || !input.sentryCaptureVerified) {
    requiredEvidence.push(providerContractRuntimeReadinessRequiredEvidence[3]);
  }
  if (!input.redactedProviderArtifactsRetained || !input.ciProviderContractJobPassed) {
    requiredEvidence.push(providerContractRuntimeReadinessRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: providerContractRuntimeReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === providerContractRuntimeReadinessRequiredEvidence.length
        ? providerContractRuntimeReadinessRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export const ciCoverageReportingReadinessRequiredCommands = [
      "pnpm test:unit:coverage",
      "pnpm test:e2e",
      "gh run view <ci-run-id> --json conclusion,status,url",
      "gh api repos/:owner/:repo/actions/runs/<ci-run-id>/artifacts",
      "verify branch protection requires CI quality check",
    ] as const;

export const ciCoverageReportingReadinessRequiredEvidence = [
      "CI workflow YAML and run log showing install, typecheck, coverage, and E2E gates",
      "coverage thresholds, Vitest coverage artifact, JUnit/JSON reports, and published test summary",
      "Playwright report plus retained traces, screenshots, videos, and failed-test debug artifact proof",
      "passing CI run, branch protection settings, flaky-test policy, and artifact retention settings",
    ] as const;

export type CiCoverageReportingReadinessRequiredEvidence = (typeof ciCoverageReportingReadinessRequiredEvidence)[number];

export function buildCiCoverageReportingReadinessPlan(
  input: CiCoverageReportingReadinessInput,
): CiCoverageReportingReadinessPlan {
  const requiredScripts = ["test:unit:coverage", "test:e2e", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.rootScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: CiCoverageReportingReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing root ${script} script.`);
  if (!input.ciWorkflowRunsInstall) blockers.push("CI workflow must run a frozen dependency install.");
  if (!input.ciWorkflowRunsTypecheck) blockers.push("CI workflow must run workspace typecheck.");
  if (!input.ciWorkflowRunsUnitCoverage) blockers.push("CI workflow must run unit tests with coverage.");
  if (!input.ciWorkflowRunsE2e) blockers.push("CI workflow must run Playwright E2E tests or publish an explicit runtime blocker.");
  if (!input.coverageThresholdsConfigured) blockers.push("Vitest coverage thresholds and reporters must be configured.");
  if (!input.vitestCoverageArtifactUploaded) blockers.push("CI must upload the Vitest coverage artifact.");
  if (!input.playwrightReportArtifactUploaded) blockers.push("CI must upload the Playwright HTML/JSON/JUnit report artifact.");
  if (!input.playwrightTracesScreenshotsVideosUploaded) blockers.push("CI must retain Playwright failure traces, screenshots, and videos.");
  if (!input.junitJsonReportsPublished) blockers.push("CI must publish machine-readable JUnit/JSON test reports.");
  if (!input.ciRunPassed) blockers.push("A GitHub Actions CI run must pass on the PR branch.");
  if (!input.branchProtectionRequiresCi) blockers.push("Branch protection must require the CI quality check before merge.");
  if (!input.flakyRetryPolicyConfigured) blockers.push("Flaky-test retry policy must be configured for CI runs.");
  if (!input.flakyQuarantineDocumented) blockers.push("Flaky-test quarantine/escalation policy must be documented.");
  if (!input.testReportSummaryPublished) blockers.push("CI must publish a human-readable test report summary.");
  if (!input.artifactRetentionConfigured) blockers.push("CI artifact retention window must be configured for coverage, reports, traces, screenshots, and videos.");
  if (!input.failureDebugArtifactsVerified) blockers.push("A failed-test artifact path must be verified for debugging traces/screenshots/videos.");

  if (!input.ciWorkflowRunsInstall || !input.ciWorkflowRunsTypecheck || !input.ciWorkflowRunsUnitCoverage || !input.ciWorkflowRunsE2e) {
    requiredEvidence.push(ciCoverageReportingReadinessRequiredEvidence[0]);
  }
  if (!input.coverageThresholdsConfigured || !input.vitestCoverageArtifactUploaded || !input.junitJsonReportsPublished || !input.testReportSummaryPublished) {
    requiredEvidence.push(ciCoverageReportingReadinessRequiredEvidence[1]);
  }
  if (!input.playwrightReportArtifactUploaded || !input.playwrightTracesScreenshotsVideosUploaded || !input.failureDebugArtifactsVerified) {
    requiredEvidence.push(ciCoverageReportingReadinessRequiredEvidence[2]);
  }
  if (!input.ciRunPassed || !input.branchProtectionRequiresCi || !input.flakyRetryPolicyConfigured || !input.flakyQuarantineDocumented || !input.artifactRetentionConfigured) {
    requiredEvidence.push(ciCoverageReportingReadinessRequiredEvidence[3]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: ciCoverageReportingReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === ciCoverageReportingReadinessRequiredEvidence.length
        ? ciCoverageReportingReadinessRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export const performanceLoadRuntimeReadinessRequiredCommands = [
      "pnpm test:performance:budgets",
      "Lighthouse CI for public and dashboard route budgets",
      "capture Core Web Vitals for public and dashboard critical routes",
      "measure public home/booking/city SEO route budgets",
      "measure dashboard overview and booking detail route budgets",
      "load test public booking endpoint",
      "load test Stripe webhook burst handling",
      "load test secure upload intent endpoint",
      "database EXPLAIN/ANALYZE query-plan checks",
      "image optimization benchmark report",
      "verify performance regression thresholds",
    ] as const;

export const performanceLoadRuntimeReadinessRequiredEvidence = [
      "performance budget verifier, Lighthouse CI, Core Web Vitals, and route budget reports",
      "booking, webhook, and upload-intent load-test reports",
      "database EXPLAIN/ANALYZE query-plan output and image optimization benchmark report",
      "CI performance job, retained artifacts, regression thresholds, and triage log",
    ] as const;

export type PerformanceLoadRuntimeReadinessRequiredEvidence = (typeof performanceLoadRuntimeReadinessRequiredEvidence)[number];

export function buildPerformanceLoadRuntimeReadinessPlan(
  input: PerformanceLoadRuntimeReadinessInput,
): PerformanceLoadRuntimeReadinessPlan {
  const requiredScripts = ["test:performance:budgets"];
  const missingScripts = requiredScripts.filter((script) => !input.rootScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: PerformanceLoadRuntimeReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing root ${script} script.`);
  if (!input.performanceBudgetVerifierPassed) blockers.push("Performance budget manifest verifier must pass.");
  if (!input.lighthouseCiPassed) blockers.push("Lighthouse CI must execute against public and dashboard route budgets.");
  if (!input.coreWebVitalsWithinBudget) blockers.push("Core Web Vitals must stay within LCP, CLS, INP, TBT, and FCP budgets.");
  if (!input.publicRouteBudgetsPassed) blockers.push("Public route performance budgets must pass for home, booking, and city/style SEO pages.");
  if (!input.dashboardRouteBudgetsPassed) blockers.push("Dashboard route performance budgets must pass for overview and booking detail surfaces.");
  if (!input.bookingLoadTestPassed) blockers.push("Public booking abuse/load test must meet RPS, p95, and error-rate targets.");
  if (!input.webhookBurstTestPassed) blockers.push("Webhook burst load test must meet signed replay, idempotency, p95, and error-rate targets.");
  if (!input.uploadIntentLoadTestPassed) blockers.push("Secure upload intent load test must meet rate-limit, signed URL, p95, and error-rate targets.");
  if (!input.dbExplainPlansPassed) blockers.push("Database EXPLAIN/ANALYZE query-plan checks must pass for dashboard, SEO, and webhook idempotency queries.");
  if (!input.imageOptimizationBenchmarksPassed) blockers.push("Image optimization benchmarks must pass for portfolio and private reference derivative budgets.");
  if (!input.regressionThresholdsConfigured) blockers.push("Performance regression thresholds must be configured for CI comparison.");
  if (!input.performanceArtifactsRetained) blockers.push("Lighthouse, load-test, EXPLAIN, image benchmark, and regression artifacts must be retained.");
  if (!input.ciPerformanceJobPassed) blockers.push("CI performance/load job must pass or publish explicit retained performance artifacts.");
  if (!input.regressionsTriagedAndFixed) blockers.push("Performance regressions must be triaged and fixed or accepted with documented rationale.");

  if (!input.performanceBudgetVerifierPassed || !input.lighthouseCiPassed || !input.coreWebVitalsWithinBudget || !input.publicRouteBudgetsPassed || !input.dashboardRouteBudgetsPassed) {
    requiredEvidence.push(performanceLoadRuntimeReadinessRequiredEvidence[0]);
  }
  if (!input.bookingLoadTestPassed || !input.webhookBurstTestPassed || !input.uploadIntentLoadTestPassed) {
    requiredEvidence.push(performanceLoadRuntimeReadinessRequiredEvidence[1]);
  }
  if (!input.dbExplainPlansPassed || !input.imageOptimizationBenchmarksPassed) {
    requiredEvidence.push(performanceLoadRuntimeReadinessRequiredEvidence[2]);
  }
  if (!input.regressionThresholdsConfigured || !input.performanceArtifactsRetained || !input.ciPerformanceJobPassed || !input.regressionsTriagedAndFixed) {
    requiredEvidence.push(performanceLoadRuntimeReadinessRequiredEvidence[3]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: performanceLoadRuntimeReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === performanceLoadRuntimeReadinessRequiredEvidence.length
        ? performanceLoadRuntimeReadinessRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export const phase9AppRuntimeBuildReadinessRequiredCommands = [
      "pnpm --filter @inkroute/testing typecheck",
      "pnpm --filter @inkroute/testing test",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/mobile typecheck",
      "pnpm vitest run apps/web/tests/notification-messaging-routes.test.ts",
      "pnpm vitest run apps/web/tests/provider-webhook-routes.test.ts",
      "Playwright dashboard templates/messages smoke tests",
      "Expo simulator notification screen smoke test",
      "Expo device notification screen smoke test",
      "booking-to-notification runtime smoke with provider sends disabled",
    ] as const;

export const phase9AppRuntimeBuildReadinessRequiredEvidence = [
      "web build, dashboard build, and mobile typecheck output",
      "Phase 9 API route and booking/deposit runtime smoke output",
      "dashboard templates/messages Playwright smoke and provider-disabled state evidence",
      "mobile notification screen simulator and device smoke evidence",
      "booking-to-notification runtime, provider-disabled, artifact, and CI required-gate evidence",
    ] as const;

export type Phase9AppRuntimeBuildReadinessRequiredEvidence = (typeof phase9AppRuntimeBuildReadinessRequiredEvidence)[number];

export function buildPhase9AppRuntimeBuildReadinessPlan(input: Phase9AppRuntimeBuildReadinessInput): Phase9AppRuntimeBuildReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: Phase9AppRuntimeBuildReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/testing package script is missing ${script}.`);
  if (!input.testingPackageTestsPassed) blockers.push("@inkroute/testing Phase 9 app runtime matrix tests must pass.");
  if (!input.testingPackageTypecheckPassed) blockers.push("@inkroute/testing typecheck must pass.");
  if (!input.webBuildPassed) blockers.push("@inkroute/web build must pass with Phase 9 notification and messaging routes.");
  if (!input.dashboardBuildPassed) blockers.push("@inkroute/dashboard build must pass with templates and messages pages.");
  if (!input.mobileTypecheckPassed) blockers.push("@inkroute/mobile typecheck must pass with notification screen wiring.");
  if (!input.notificationRouteTestsPassed) blockers.push("Notification preview and messaging route tests must pass.");
  if (!input.providerWebhookRouteTestsPassed) blockers.push("Provider webhook route tests must pass.");
  if (!input.bookingRouteRuntimeSmokePassed) blockers.push("Booking route runtime smoke must pass with notification workflow handoff.");
  if (!input.depositRouteRuntimeSmokePassed) blockers.push("Deposit route runtime smoke must pass with provider sends disabled.");
  if (!input.dashboardTemplatesPlaywrightSmokePassed) blockers.push("Dashboard templates Playwright smoke test must pass.");
  if (!input.dashboardMessagesPlaywrightSmokePassed) blockers.push("Dashboard messages Playwright smoke test must pass.");
  if (!input.dashboardProviderDisabledStatesVerified) blockers.push("Dashboard provider-disabled states must be verified before runtime promotion.");
  if (!input.mobileNotificationScreenSmokePassed) blockers.push("Mobile notification screen smoke test must pass.");
  if (!input.expoSimulatorNotificationSmokePassed) blockers.push("Expo simulator notification screen smoke test must pass.");
  if (!input.expoDeviceNotificationSmokePassed) blockers.push("Expo device notification screen smoke test must pass.");
  if (!input.bookingToNotificationRuntimeSmokePassed) blockers.push("Booking-to-notification runtime smoke must pass with provider sends disabled.");
  if (!input.providerSendsDisabledInRuntimeSmoke) blockers.push("Runtime smoke tests must prove provider sends remain disabled or sandboxed.");
  if (!input.runtimeArtifactsCaptured) blockers.push("Phase 9 runtime smoke artifacts must be captured.");
  if (!input.ciRequiresPhase9AppRuntimeGate) blockers.push("CI must require the Phase 9 app runtime/build gate before merge.");

  if (!input.webBuildPassed || !input.dashboardBuildPassed || !input.mobileTypecheckPassed) {
    requiredEvidence.push(phase9AppRuntimeBuildReadinessRequiredEvidence[0]);
  }
  if (!input.notificationRouteTestsPassed || !input.providerWebhookRouteTestsPassed || !input.bookingRouteRuntimeSmokePassed || !input.depositRouteRuntimeSmokePassed) {
    requiredEvidence.push(phase9AppRuntimeBuildReadinessRequiredEvidence[1]);
  }
  if (!input.dashboardTemplatesPlaywrightSmokePassed || !input.dashboardMessagesPlaywrightSmokePassed || !input.dashboardProviderDisabledStatesVerified) {
    requiredEvidence.push(phase9AppRuntimeBuildReadinessRequiredEvidence[2]);
  }
  if (!input.mobileNotificationScreenSmokePassed || !input.expoSimulatorNotificationSmokePassed || !input.expoDeviceNotificationSmokePassed) {
    requiredEvidence.push(phase9AppRuntimeBuildReadinessRequiredEvidence[3]);
  }
  if (!input.bookingToNotificationRuntimeSmokePassed || !input.providerSendsDisabledInRuntimeSmoke || !input.runtimeArtifactsCaptured || !input.ciRequiresPhase9AppRuntimeGate) {
    requiredEvidence.push(phase9AppRuntimeBuildReadinessRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: phase9AppRuntimeBuildReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === phase9AppRuntimeBuildReadinessRequiredEvidence.length
        ? phase9AppRuntimeBuildReadinessRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export const phase10SeoAppRuntimeBuildReadinessRequiredCommands = [
      "pnpm --filter @inkroute/testing typecheck",
      "pnpm --filter @inkroute/testing test",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm vitest run apps/web/tests/sitemap-route.test.ts",
      "SEO preview and sitemap preview route tests",
      "dashboard SEO browser smoke test",
      "dashboard SEO publish/edit/archive interaction smoke test",
      "rendered public SEO route crawl",
      "rendered sitemap/canonical crawl",
    ] as const;

export const phase10SeoAppRuntimeBuildReadinessRequiredEvidence = [
      "web/dashboard build and sitemap/SEO preview route test output",
      "dashboard SEO browser and publish/edit/archive interaction smoke evidence",
      "rendered public SEO route, sitemap, and canonical crawl evidence",
      "database-backed SEO route, runtime artifact, API preview, and CI required-gate evidence",
    ] as const;

export type Phase10SeoAppRuntimeBuildReadinessRequiredEvidence = (typeof phase10SeoAppRuntimeBuildReadinessRequiredEvidence)[number];

export function buildPhase10SeoAppRuntimeBuildReadinessPlan(input: Phase10SeoAppRuntimeBuildReadinessInput): Phase10SeoAppRuntimeBuildReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: Phase10SeoAppRuntimeBuildReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/testing package script is missing ${script}.`);
  if (!input.testingPackageTestsPassed) blockers.push("@inkroute/testing Phase 10 SEO runtime matrix tests must pass.");
  if (!input.testingPackageTypecheckPassed) blockers.push("@inkroute/testing typecheck must pass.");
  if (!input.webBuildPassed) blockers.push("@inkroute/web build must pass with Phase 10 SEO routes.");
  if (!input.dashboardBuildPassed) blockers.push("@inkroute/dashboard build must pass with SEO manager page.");
  if (!input.sitemapRouteTestsPassed) blockers.push("Sitemap route smoke tests must pass.");
  if (!input.seoPreviewRouteTestsPassed) blockers.push("SEO preview API route tests must pass.");
  if (!input.sitemapPreviewRouteTestsPassed) blockers.push("Sitemap preview API route tests must pass.");
  if (!input.dashboardSeoBrowserSmokePassed) blockers.push("Dashboard SEO browser smoke test must pass.");
  if (!input.dashboardSeoPublishInteractionSmokePassed) blockers.push("Dashboard SEO publish/edit/archive interaction smoke test must pass.");
  if (!input.renderedPublicSeoCrawlPassed) blockers.push("Rendered public SEO route crawl must pass.");
  if (!input.renderedSitemapCrawlPassed) blockers.push("Rendered sitemap crawl must pass.");
  if (!input.databaseBackedSeoRoutesWired) blockers.push("Database-backed SEO route execution evidence must be captured before production runtime evidence is complete.");
  if (!input.sitemapRuntimeEvidenceCaptured) blockers.push("Sitemap runtime evidence must be captured.");
  if (!input.apiPreviewRuntimeEvidenceCaptured) blockers.push("SEO and sitemap preview API runtime evidence must be captured.");
  if (!input.canonicalRuntimeEvidenceCaptured) blockers.push("Canonical/runtime crawl evidence must be captured.");
  if (!input.ciRequiresPhase10SeoRuntimeGate) blockers.push("CI must require the Phase 10 SEO app runtime/build gate before merge.");

  if (!input.webBuildPassed || !input.dashboardBuildPassed || !input.sitemapRouteTestsPassed || !input.seoPreviewRouteTestsPassed || !input.sitemapPreviewRouteTestsPassed) {
    requiredEvidence.push(phase10SeoAppRuntimeBuildReadinessRequiredEvidence[0]);
  }
  if (!input.dashboardSeoBrowserSmokePassed || !input.dashboardSeoPublishInteractionSmokePassed) {
    requiredEvidence.push(phase10SeoAppRuntimeBuildReadinessRequiredEvidence[1]);
  }
  if (!input.renderedPublicSeoCrawlPassed || !input.renderedSitemapCrawlPassed || !input.canonicalRuntimeEvidenceCaptured) {
    requiredEvidence.push(phase10SeoAppRuntimeBuildReadinessRequiredEvidence[2]);
  }
  if (!input.databaseBackedSeoRoutesWired || !input.sitemapRuntimeEvidenceCaptured || !input.apiPreviewRuntimeEvidenceCaptured || !input.ciRequiresPhase10SeoRuntimeGate) {
    requiredEvidence.push(phase10SeoAppRuntimeBuildReadinessRequiredEvidence[3]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: phase10SeoAppRuntimeBuildReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === phase10SeoAppRuntimeBuildReadinessRequiredEvidence.length
        ? phase10SeoAppRuntimeBuildReadinessRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export interface TestingLaunchExecutionEvidenceInput {
  rootScripts: readonly string[];
  lockfileInstallPassed: boolean;
  staticChecksPassed: boolean;
  manifestChecksPassed: boolean;
  typecheckPassed: boolean;
  unitTestsPassed: boolean;
  unitCoveragePassed: boolean;
  e2eTestsPassed: boolean;
  webBuildPassed: boolean;
  dashboardBuildPassed: boolean;
  prismaIntegrationTestsPassed: boolean;
  providerSandboxTestsPassed: boolean;
  securityTestsPassed: boolean;
  mobileSimulatorTestsPassed: boolean;
  mobileDeviceTestsPassed: boolean;
  coverageThresholdsMet: boolean;
  coverageArtifactsUploaded: boolean;
  playwrightArtifactsUploaded: boolean;
  junitJsonReportsPublished: boolean;
  ciRunPassed: boolean;
  branchProtectionRequiresCi: boolean;
  flakyTestPolicyDocumented: boolean;
  failureDebugArtifactsVerified: boolean;
  secretSafeArtifactsCaptured: boolean;
}

export interface TestingLaunchExecutionEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof testingLaunchExecutionEvidenceRequiredCommands;
  requiredEvidence:
    | readonly TestingLaunchExecutionEvidenceRequiredEvidence[]
    | typeof testingLaunchExecutionEvidenceRequiredEvidence;
  blockers: readonly string[];
}

export const testingLaunchExecutionEvidenceRequiredCommands = [
      "pnpm install --frozen-lockfile",
      "pnpm test:phase14:static",
      "pnpm test:manifest",
      "pnpm typecheck",
      "pnpm test:unit",
      "pnpm test:unit:coverage",
      "pnpm test:e2e",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "Prisma/database integration test suite",
      "provider sandbox test suite",
      "security test suite",
      "Expo simulator and device test suites",
      "GitHub Actions CI quality run with retained artifacts",
      "branch protection required-check proof",
    ] as const;

export const testingLaunchExecutionEvidenceRequiredEvidence = [
      "install, static, manifest, and typecheck command evidence",
      "unit test, coverage threshold, and coverage artifact evidence",
      "Playwright E2E report, traces, screenshots, videos, and failure-debug artifact evidence",
      "app build, database integration, provider sandbox, and security test evidence",
      "mobile simulator and device test evidence",
      "CI reports, branch protection, flaky policy, and secret-safe artifact evidence",
    ] as const;

export type TestingLaunchExecutionEvidenceRequiredEvidence = (typeof testingLaunchExecutionEvidenceRequiredEvidence)[number];

export function buildTestingLaunchExecutionEvidencePlan(
  input: TestingLaunchExecutionEvidenceInput,
): TestingLaunchExecutionEvidencePlan {
  const requiredScripts = ["test:phase14:static", "test:manifest", "typecheck", "test:unit", "test:unit:coverage", "test:e2e"];
  const missingScripts = requiredScripts.filter((script) => !input.rootScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: TestingLaunchExecutionEvidenceRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing root ${script} script.`);
  if (!input.lockfileInstallPassed) blockers.push("pnpm install --frozen-lockfile must pass before testing launch execution is ready.");
  if (!input.staticChecksPassed) blockers.push("Phase 14 static checks must pass.");
  if (!input.manifestChecksPassed) blockers.push("Testing manifest checks must pass.");
  if (!input.typecheckPassed) blockers.push("Workspace typecheck must pass.");
  if (!input.unitTestsPassed) blockers.push("Unit test suite must pass.");
  if (!input.unitCoveragePassed) blockers.push("Unit coverage suite must pass.");
  if (!input.e2eTestsPassed) blockers.push("Playwright E2E suite must pass.");
  if (!input.webBuildPassed) blockers.push("@inkroute/web build must pass.");
  if (!input.dashboardBuildPassed) blockers.push("@inkroute/dashboard build must pass.");
  if (!input.prismaIntegrationTestsPassed) blockers.push("Prisma/database integration tests must pass.");
  if (!input.providerSandboxTestsPassed) blockers.push("Provider sandbox tests must pass or remain explicitly launch-blocking.");
  if (!input.securityTestsPassed) blockers.push("Security test suite must pass.");
  if (!input.mobileSimulatorTestsPassed) blockers.push("Mobile simulator tests must pass.");
  if (!input.mobileDeviceTestsPassed) blockers.push("Mobile device tests must pass or remain explicitly launch-blocking.");
  if (!input.coverageThresholdsMet) blockers.push("Coverage thresholds must be met.");
  if (!input.coverageArtifactsUploaded) blockers.push("Coverage artifacts must be uploaded and retained.");
  if (!input.playwrightArtifactsUploaded) blockers.push("Playwright reports, traces, screenshots, and videos must be uploaded and retained.");
  if (!input.junitJsonReportsPublished) blockers.push("JUnit/JSON test reports must be published.");
  if (!input.ciRunPassed) blockers.push("CI quality run must pass on the PR branch.");
  if (!input.branchProtectionRequiresCi) blockers.push("Branch protection must require the CI quality check before merge.");
  if (!input.flakyTestPolicyDocumented) blockers.push("Flaky-test retry, quarantine, and ownership policy must be documented.");
  if (!input.failureDebugArtifactsVerified) blockers.push("Failure debug artifacts must be verified for failed test reproduction.");
  if (!input.secretSafeArtifactsCaptured) blockers.push("Testing artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.");

  if (!input.lockfileInstallPassed || !input.staticChecksPassed || !input.manifestChecksPassed || !input.typecheckPassed) {
    requiredEvidence.push(testingLaunchExecutionEvidenceRequiredEvidence[0]);
  }
  if (!input.unitTestsPassed || !input.unitCoveragePassed || !input.coverageThresholdsMet || !input.coverageArtifactsUploaded) {
    requiredEvidence.push(testingLaunchExecutionEvidenceRequiredEvidence[1]);
  }
  if (!input.e2eTestsPassed || !input.playwrightArtifactsUploaded || !input.failureDebugArtifactsVerified) {
    requiredEvidence.push(testingLaunchExecutionEvidenceRequiredEvidence[2]);
  }
  if (!input.webBuildPassed || !input.dashboardBuildPassed || !input.prismaIntegrationTestsPassed || !input.providerSandboxTestsPassed || !input.securityTestsPassed) {
    requiredEvidence.push(testingLaunchExecutionEvidenceRequiredEvidence[3]);
  }
  if (!input.mobileSimulatorTestsPassed || !input.mobileDeviceTestsPassed) {
    requiredEvidence.push(testingLaunchExecutionEvidenceRequiredEvidence[4]);
  }
  if (!input.junitJsonReportsPublished || !input.ciRunPassed || !input.branchProtectionRequiresCi || !input.flakyTestPolicyDocumented || !input.secretSafeArtifactsCaptured) {
    requiredEvidence.push(testingLaunchExecutionEvidenceRequiredEvidence[5]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: testingLaunchExecutionEvidenceRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === testingLaunchExecutionEvidenceRequiredEvidence.length
        ? testingLaunchExecutionEvidenceRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export const phase14Suites: TestSuiteRecord[] = [
  {
    id: "unit-domain-packages",
    name: "Dependency-light domain package unit tests",
    layer: "unit",
    surface: "package",
    command: "pnpm test:unit",
    status: "local_contract",
    cases: [
      createTestCase({
        id: "unit-booking-readiness",
        layer: "unit",
        surface: "package",
        name: "Tattoo Readiness Score flags incomplete booking drafts",
        priority: "critical",
        status: "local_contract",
        files: ["packages/booking/tests/booking-readiness.test.ts"],
        command: "pnpm test:unit -- packages/booking/tests/booking-readiness.test.ts",
        verifies: ["readiness score", "missing-field warnings"],
        blockers: ["Vitest install not available in ChatGPT sandbox"],
        gapIds: ["GAP-035", "GAP-105"]
      }),
      createTestCase({
        id: "unit-security-upload",
        layer: "unit",
        surface: "package",
        name: "Secure upload draft rejects suspicious file inputs",
        priority: "critical",
        status: "local_contract",
        files: ["packages/security/tests/upload-policy.test.ts"],
        command: "pnpm test:unit -- packages/security/tests/upload-policy.test.ts",
        verifies: ["extension allowlist", "private storage recommendation", "suspicious filename detection"],
        blockers: ["Vitest install not available in ChatGPT sandbox"],
        gapIds: ["GAP-096", "GAP-103", "GAP-105"]
      })
    ]
  },
  {
    id: "e2e-critical-flows",
    name: "Critical web/dashboard Playwright flows",
    layer: "e2e",
    surface: "web",
    command: "pnpm test:e2e",
    status: "runtime_gated",
    cases: [
      createTestCase({
        id: "e2e-public-booking-preview",
        layer: "e2e",
        surface: "web",
        name: "Public booking preview can move through the local-contract intake",
        priority: "critical",
        status: "runtime_gated",
        files: ["apps/web/tests/e2e/public-booking.spec.ts"],
        command: "pnpm test:e2e --project=web-chromium",
        verifies: ["homepage CTA", "booking stepper", "deposit preview boundary"],
        blockers: ["Next.js runtime and Playwright browsers unavailable in ChatGPT sandbox"],
        gapIds: ["GAP-031", "GAP-105"]
      }),
      createTestCase({
        id: "e2e-dashboard-admin-surfaces",
        layer: "e2e",
        surface: "dashboard",
        name: "Dashboard local-contract shell exposes critical admin surfaces",
        priority: "high",
        status: "runtime_gated",
        files: ["apps/dashboard/tests/e2e/dashboard-smoke.spec.ts"],
        command: "pnpm test:e2e --project=dashboard-chromium",
        verifies: ["booking inbox", "payments view", "trust center", "release controls"],
        blockers: ["Dashboard runtime and Playwright browsers unavailable in ChatGPT sandbox"],
        gapIds: ["GAP-039", "GAP-104", "GAP-105"]
      })
    ]
  }
];

export interface DashboardTestExecutionEvidenceInput {
  packageScripts: Readonly<Record<string, string>>;
  testingPackageTestsPassed: boolean;
  testingPackageTypecheckPassed: boolean;
  dashboardTypecheckPassed: boolean;
  dashboardBuildPassed: boolean;
  dashboardUnitTestsPassed: boolean;
  dashboardRouteRenderingTestsPassed: boolean;
  dashboardAuthGuardTestsPassed: boolean;
  dashboardRbacTenantIsolationTestsPassed: boolean;
  dashboardMutationLifecycleTestsPassed: boolean;
  dashboardProviderSafeStateTestsPassed: boolean;
  dashboardAccessibilityAxePassed: boolean;
  dashboardKeyboardChecksPassed: boolean;
  playwrightDashboardSuitePassed: boolean;
  ciArtifactsUploaded: boolean;
  branchProtectionRequiresDashboardGate: boolean;
  flakyDashboardPolicyDocumented: boolean;
  secretSafeArtifactsCaptured: boolean;
}

export interface DashboardTestExecutionEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof dashboardTestExecutionEvidenceRequiredCommands;
  requiredControls: typeof dashboardTestExecutionEvidenceRequiredControls;
  requiredEvidence: readonly DashboardTestExecutionEvidenceRequiredEvidence[];
  blockers: readonly string[];
}

export const dashboardTestExecutionEvidenceRequiredCommands = [
      "pnpm --filter @inkroute/testing typecheck",
      "pnpm --filter @inkroute/testing test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/dashboard test",
      "dashboard route rendering tests",
      "dashboard auth/RBAC/tenant-isolation tests",
      "dashboard booking mutation lifecycle tests",
      "dashboard provider-safe state tests",
      "dashboard axe accessibility checks",
      "dashboard keyboard navigation checks",
      "Playwright dashboard critical-flow suite",
      "GitHub Actions dashboard test artifact upload",
      "branch protection dashboard required-check proof",
    ] as const;

export const dashboardTestExecutionEvidenceRequiredControls = [
      "Use real runnable dashboard test files instead of package-only coverage matrices.",
      "Seed auth, tenant, RBAC, and dashboard data fixtures before route and mutation tests.",
      "Cover route rendering, auth guard, tenant isolation, booking lifecycle mutations, provider-safe states, accessibility, and critical E2E flows.",
      "Upload retained traces, screenshots, videos, coverage, and reports for failed dashboard tests.",
      "Require dashboard test gates in CI branch protection before launch.",
      "Redact secrets, tokens, raw PII, medical notes, payment data, provider tokens, and private file URLs from artifacts.",
    ] as const;

export const dashboardTestExecutionEvidenceRequiredEvidence = [
      "dashboard typecheck and build command evidence",
      "dashboard unit/component, route rendering, and auth guard test output",
      "dashboard RBAC/tenant, mutation lifecycle, and provider-safe state test output",
      "axe, keyboard, and Playwright dashboard critical-flow evidence",
      "CI artifact, branch protection, flaky policy, and secret-safe artifact evidence",
    ] as const;

export type DashboardTestExecutionEvidenceRequiredEvidence = (typeof dashboardTestExecutionEvidenceRequiredEvidence)[number];

export function buildDashboardTestExecutionEvidencePlan(
  input: DashboardTestExecutionEvidenceInput,
): DashboardTestExecutionEvidencePlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: DashboardTestExecutionEvidenceRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/testing package script is missing ${script}.`);
  if (!input.testingPackageTestsPassed) blockers.push("@inkroute/testing tests must pass before dashboard test execution evidence can close.");
  if (!input.testingPackageTypecheckPassed) blockers.push("@inkroute/testing typecheck must pass before dashboard test execution evidence can close.");
  if (!input.dashboardTypecheckPassed) blockers.push("@inkroute/dashboard typecheck must pass before dashboard app test evidence can close.");
  if (!input.dashboardBuildPassed) blockers.push("@inkroute/dashboard build must pass before dashboard browser/E2E evidence can close.");
  if (!input.dashboardUnitTestsPassed) blockers.push("Runnable dashboard unit/component tests must pass.");
  if (!input.dashboardRouteRenderingTestsPassed) blockers.push("Dashboard route rendering tests must pass for protected and public-support routes.");
  if (!input.dashboardAuthGuardTestsPassed) blockers.push("Dashboard auth guard tests must pass with provider-backed or seeded auth fixtures.");
  if (!input.dashboardRbacTenantIsolationTestsPassed) blockers.push("Dashboard RBAC and tenant-isolation tests must pass.");
  if (!input.dashboardMutationLifecycleTestsPassed) blockers.push("Dashboard booking lifecycle mutation tests must pass.");
  if (!input.dashboardProviderSafeStateTestsPassed) blockers.push("Dashboard provider-safe disabled/loading/failure/retry state tests must pass.");
  if (!input.dashboardAccessibilityAxePassed) blockers.push("Dashboard axe accessibility checks must pass.");
  if (!input.dashboardKeyboardChecksPassed) blockers.push("Dashboard keyboard navigation checks must pass.");
  if (!input.playwrightDashboardSuitePassed) blockers.push("Playwright dashboard critical-flow suite must pass.");
  if (!input.ciArtifactsUploaded) blockers.push("Dashboard test CI artifacts must be uploaded and retained.");
  if (!input.branchProtectionRequiresDashboardGate) blockers.push("Branch protection must require the dashboard test gate before merge.");
  if (!input.flakyDashboardPolicyDocumented) blockers.push("Dashboard flaky-test retry, quarantine, and ownership policy must be documented.");
  if (!input.secretSafeArtifactsCaptured) blockers.push("Dashboard test artifacts must be redacted and free of secrets, tokens, raw PII, medical notes, payment data, provider tokens, and private file URLs.");

  if (!input.dashboardTypecheckPassed || !input.dashboardBuildPassed) {
    requiredEvidence.push(dashboardTestExecutionEvidenceRequiredEvidence[0]);
  }
  if (!input.dashboardUnitTestsPassed || !input.dashboardRouteRenderingTestsPassed || !input.dashboardAuthGuardTestsPassed) {
    requiredEvidence.push(dashboardTestExecutionEvidenceRequiredEvidence[1]);
  }
  if (!input.dashboardRbacTenantIsolationTestsPassed || !input.dashboardMutationLifecycleTestsPassed || !input.dashboardProviderSafeStateTestsPassed) {
    requiredEvidence.push(dashboardTestExecutionEvidenceRequiredEvidence[2]);
  }
  if (!input.dashboardAccessibilityAxePassed || !input.dashboardKeyboardChecksPassed || !input.playwrightDashboardSuitePassed) {
    requiredEvidence.push(dashboardTestExecutionEvidenceRequiredEvidence[3]);
  }
  if (!input.ciArtifactsUploaded || !input.branchProtectionRequiresDashboardGate || !input.flakyDashboardPolicyDocumented || !input.secretSafeArtifactsCaptured) {
    requiredEvidence.push(dashboardTestExecutionEvidenceRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: dashboardTestExecutionEvidenceRequiredCommands,
    requiredControls: dashboardTestExecutionEvidenceRequiredControls,
    requiredEvidence,
    blockers,
  };
}
