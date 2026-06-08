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
