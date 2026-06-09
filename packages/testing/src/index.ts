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
export type TestAutomationStatus = "implemented" | "scaffolded" | "runtime_gated" | "credential_gated" | "manual";
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
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
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
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
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
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
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
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
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
      targetFiles: ["apps/dashboard/components/**/*", "apps/dashboard/tests/components/dashboard-components.test.tsx"],
      verifies: ["empty states", "loading states", "error states", "disabled provider action states"],
      blockers: ["React/Next component test harness is not wired for dashboard app components."],
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
      blockers: ["Dashboard auth middleware and tenant-scoped loaders must be wired before app-level RBAC tests are meaningful."],
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
  const requiredEvidence: string[] = [];

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
    requiredEvidence.push("passing route/component/RBAC/mutation/accessibility/E2E dashboard test output");
  }
  if (!input.seededAuthFixturesConfigured || !input.seededTenantDataConfigured || !input.rbacTenantIsolationFixturesConfigured) {
    requiredEvidence.push("seeded auth, tenant, and RBAC fixture evidence");
  }
  if (!input.ciUploadsDashboardArtifacts || !input.branchProtectionRequiresDashboardTests) {
    requiredEvidence.push("CI artifact upload and required-check enforcement evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    missingImplementedRequirements,
    missingPassingRequirements,
    requiredCommands: [
      "pnpm --filter @inkroute/testing typecheck",
      "pnpm --filter @inkroute/testing test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/dashboard test",
      "pnpm test:e2e --project=dashboard-chromium",
    ],
    requiredEvidence,
    blockers,
  };
}

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
    requiredCommands: [
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
    ],
    requiredEvidence: [
      "Committed lockfile and reproducible dependency install output.",
      "Passing local or CI output for static, manifest, typecheck, unit, coverage, E2E, app build, Prisma, provider, and mobile commands.",
      "Vitest coverage thresholds plus retained coverage artifact from CI.",
      "Playwright report, JUnit/JSON output, and retained failure traces/screenshots/videos from CI.",
      "Branch protection settings showing CI required before merge.",
      "Documented flaky-test handling and quarantine process.",
    ],
    blockers,
  };
}

export function buildPhase9AppRuntimeBuildReadinessPlan(input: Phase9AppRuntimeBuildReadinessInput): Phase9AppRuntimeBuildReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

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
    requiredEvidence.push("web build, dashboard build, and mobile typecheck output");
  }
  if (!input.notificationRouteTestsPassed || !input.providerWebhookRouteTestsPassed || !input.bookingRouteRuntimeSmokePassed || !input.depositRouteRuntimeSmokePassed) {
    requiredEvidence.push("Phase 9 API route and booking/deposit runtime smoke output");
  }
  if (!input.dashboardTemplatesPlaywrightSmokePassed || !input.dashboardMessagesPlaywrightSmokePassed || !input.dashboardProviderDisabledStatesVerified) {
    requiredEvidence.push("dashboard templates/messages Playwright smoke and provider-disabled state evidence");
  }
  if (!input.mobileNotificationScreenSmokePassed || !input.expoSimulatorNotificationSmokePassed || !input.expoDeviceNotificationSmokePassed) {
    requiredEvidence.push("mobile notification screen simulator and device smoke evidence");
  }
  if (!input.bookingToNotificationRuntimeSmokePassed || !input.providerSendsDisabledInRuntimeSmoke || !input.runtimeArtifactsCaptured || !input.ciRequiresPhase9AppRuntimeGate) {
    requiredEvidence.push("booking-to-notification runtime, provider-disabled, artifact, and CI required-gate evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
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
    ],
    requiredEvidence,
    blockers,
  };
}

export function buildPhase10SeoAppRuntimeBuildReadinessPlan(input: Phase10SeoAppRuntimeBuildReadinessInput): Phase10SeoAppRuntimeBuildReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

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
  if (!input.databaseBackedSeoRoutesWired) blockers.push("Database-backed SEO routes must be wired before production runtime evidence is complete.");
  if (!input.sitemapRuntimeEvidenceCaptured) blockers.push("Sitemap runtime evidence must be captured.");
  if (!input.apiPreviewRuntimeEvidenceCaptured) blockers.push("SEO and sitemap preview API runtime evidence must be captured.");
  if (!input.canonicalRuntimeEvidenceCaptured) blockers.push("Canonical/runtime crawl evidence must be captured.");
  if (!input.ciRequiresPhase10SeoRuntimeGate) blockers.push("CI must require the Phase 10 SEO app runtime/build gate before merge.");

  if (!input.webBuildPassed || !input.dashboardBuildPassed || !input.sitemapRouteTestsPassed || !input.seoPreviewRouteTestsPassed || !input.sitemapPreviewRouteTestsPassed) {
    requiredEvidence.push("web/dashboard build and sitemap/SEO preview route test output");
  }
  if (!input.dashboardSeoBrowserSmokePassed || !input.dashboardSeoPublishInteractionSmokePassed) {
    requiredEvidence.push("dashboard SEO browser and publish/edit/archive interaction smoke evidence");
  }
  if (!input.renderedPublicSeoCrawlPassed || !input.renderedSitemapCrawlPassed || !input.canonicalRuntimeEvidenceCaptured) {
    requiredEvidence.push("rendered public SEO route, sitemap, and canonical crawl evidence");
  }
  if (!input.databaseBackedSeoRoutesWired || !input.sitemapRuntimeEvidenceCaptured || !input.apiPreviewRuntimeEvidenceCaptured || !input.ciRequiresPhase10SeoRuntimeGate) {
    requiredEvidence.push("database-backed SEO route, runtime artifact, API preview, and CI required-gate evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
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
    ],
    requiredEvidence,
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
    status: "scaffolded",
    cases: [
      createTestCase({
        id: "unit-booking-readiness",
        layer: "unit",
        surface: "package",
        name: "Tattoo Readiness Score flags incomplete booking drafts",
        priority: "critical",
        status: "scaffolded",
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
        status: "scaffolded",
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
        name: "Public booking preview can move through the scaffolded intake",
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
        name: "Dashboard scaffold exposes critical admin surfaces",
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
