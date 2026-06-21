import { buildDashboardTestExecutionEvidencePlan } from "@inkroute/testing";

export type DashboardTestRuntimeStatus =
  | "wired"
  | "fixture-gated"
  | "browser-gated"
  | "accessibility-gated"
  | "ci-gated";

export interface DashboardTestRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DashboardTestRuntimeStatus;
}

export const dashboardTestRuntimeCommands = [
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

export const dashboardTestArtifactPaths = [
  "coverage/dashboard-test-runtime.json",
  "coverage/dashboard-test-testing-typecheck.txt",
  "coverage/dashboard-test-testing-test.txt",
  "coverage/dashboard-test-dashboard-typecheck.txt",
  "coverage/dashboard-test-dashboard-build.txt",
  "coverage/dashboard-test-dashboard-unit.txt",
  "coverage/dashboard-test-route-rendering.json",
  "coverage/dashboard-test-auth-rbac-tenant.json",
  "coverage/dashboard-test-booking-mutation-lifecycle.json",
  "coverage/dashboard-test-provider-safe-states.json",
  "coverage/dashboard-test-axe-accessibility.json",
  "coverage/dashboard-test-keyboard-navigation.json",
  "coverage/dashboard-test-playwright-critical-flow.json",
  "coverage/dashboard-test-ci-artifacts.json",
  "coverage/dashboard-test-branch-protection.json",
  "coverage/dashboard-test-flaky-policy.json",
  "coverage/dashboard-test-secret-safe-artifacts.json",
  "test-results/dashboard-test-runtime",
] as const;

export const dashboardTestRuntimeProofFiles = [
  "apps/dashboard/lib/dashboardTestRuntime.ts",
  "apps/dashboard/tests/dashboard-test-runtime-static.test.ts",
  "packages/testing/package.json",
  "packages/testing/src/index.ts",
  "packages/testing/tests/testing-manifest.test.ts",
  "apps/dashboard/package.json",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export const dashboardRunnableTestCoverageFiles = [
  "apps/dashboard/tests/dashboard-auth-guard-runtime-static.test.ts",
  "apps/dashboard/tests/dashboard-data-layer-runtime-static.test.ts",
  "apps/dashboard/tests/dashboard-mutation-runtime-static.test.ts",
  "apps/dashboard/tests/dashboard-build-runtime-static.test.ts",
  "apps/dashboard/tests/dashboard-test-runtime-static.test.ts",
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
  "packages/testing/tests/testing-manifest.test.ts",
] as const;

export const dashboardTestEvidenceFlags = [
  "testingPackageTypecheckPassed",
  "testingPackageTestsPassed",
  "dashboardTypecheckPassed",
  "dashboardBuildPassed",
  "dashboardUnitTestsPassed",
  "dashboardRouteRenderingTestsPassed",
  "dashboardAuthGuardTestsPassed",
  "dashboardRbacTenantIsolationTestsPassed",
  "dashboardMutationLifecycleTestsPassed",
  "dashboardProviderSafeStateTestsPassed",
  "dashboardAccessibilityAxePassed",
  "dashboardKeyboardChecksPassed",
  "playwrightDashboardSuitePassed",
  "ciArtifactsUploaded",
  "branchProtectionRequiresDashboardGate",
  "flakyDashboardPolicyDocumented",
  "secretSafeArtifactsCaptured",
] as const;

export type DashboardTestEvidenceFlag = (typeof dashboardTestEvidenceFlags)[number];

export interface DashboardTestEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly evidence?: Partial<Record<DashboardTestEvidenceFlag, boolean>>;
}

export interface DashboardTestEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly requiredCommands: typeof dashboardTestRuntimeCommands;
  readonly missingCommands: readonly string[];
  readonly requiredArtifacts: typeof dashboardTestArtifactPaths;
  readonly missingArtifacts: readonly string[];
  readonly requiredEvidence: typeof dashboardTestEvidenceFlags;
  readonly missingEvidence: readonly DashboardTestEvidenceFlag[];
  readonly blockers: readonly string[];
}

export const dashboardTestRuntimeMatrix = [
  {
    id: "testing-typecheck",
    command: "pnpm --filter @inkroute/testing typecheck",
    artifact: "coverage/dashboard-test-testing-typecheck.txt",
    status: "wired",
  },
  {
    id: "testing-tests",
    command: "pnpm --filter @inkroute/testing test",
    artifact: "coverage/dashboard-test-testing-test.txt",
    status: "wired",
  },
  {
    id: "dashboard-typecheck-build",
    command: "pnpm --filter @inkroute/dashboard typecheck && pnpm --filter @inkroute/dashboard build",
    artifact: "coverage/dashboard-test-dashboard-build.txt",
    status: "browser-gated",
  },
  {
    id: "dashboard-unit-component",
    command: "pnpm --filter @inkroute/dashboard test",
    artifact: "coverage/dashboard-test-dashboard-unit.txt",
    status: "browser-gated",
  },
  {
    id: "route-rendering",
    command: "dashboard route rendering tests",
    artifact: "coverage/dashboard-test-route-rendering.json",
    status: "fixture-gated",
  },
  {
    id: "auth-rbac-tenant-isolation",
    command: "dashboard auth/RBAC/tenant-isolation tests",
    artifact: "coverage/dashboard-test-auth-rbac-tenant.json",
    status: "fixture-gated",
  },
  {
    id: "booking-mutation-lifecycle",
    command: "dashboard booking mutation lifecycle tests",
    artifact: "coverage/dashboard-test-booking-mutation-lifecycle.json",
    status: "fixture-gated",
  },
  {
    id: "provider-safe-states",
    command: "dashboard provider-safe state tests",
    artifact: "coverage/dashboard-test-provider-safe-states.json",
    status: "fixture-gated",
  },
  {
    id: "axe-keyboard-accessibility",
    command: "dashboard axe accessibility checks && dashboard keyboard navigation checks",
    artifact: "coverage/dashboard-test-axe-accessibility.json",
    status: "accessibility-gated",
  },
  {
    id: "playwright-critical-flow",
    command: "Playwright dashboard critical-flow suite",
    artifact: "coverage/dashboard-test-playwright-critical-flow.json",
    status: "browser-gated",
  },
  {
    id: "ci-branch-flaky-secret-safe",
    command: "GitHub Actions dashboard test artifact upload && branch protection dashboard required-check proof",
    artifact: "coverage/dashboard-test-ci-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly DashboardTestRuntimeMatrixEntry[];

export const dashboardTestRuntimeReadiness = buildDashboardTestExecutionEvidencePlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  testingPackageTestsPassed: false,
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

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) => {
  const actualSet = new Set(actual ?? []);
  return required.filter((entry) => !actualSet.has(entry));
};

export const buildDashboardTestEvidenceDecision = (
  input: DashboardTestEvidenceInput = {},
): DashboardTestEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, dashboardTestRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, dashboardTestArtifactPaths);
  const missingEvidence = dashboardTestEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = [
    missingCommands.length > 0 ? "Pinned dashboard test commands must be run and captured." : "",
    missingArtifacts.length > 0 ? "Dashboard test artifacts must be retained, including CI and secret-safe evidence." : "",
    missingEvidence.length > 0
      ? "Dashboard route, auth/RBAC/tenant, mutation, accessibility, Playwright, CI, branch protection, flaky-policy, and secret-safe evidence must pass."
      : "",
  ].filter(Boolean);

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    requiredCommands: dashboardTestRuntimeCommands,
    missingCommands,
    requiredArtifacts: dashboardTestArtifactPaths,
    missingArtifacts,
    requiredEvidence: dashboardTestEvidenceFlags,
    missingEvidence,
    blockers,
  };
};

export interface DashboardTestExecutionPolicy {
  readonly codexMayClassifyStaticDashboardTestReadiness: true;
  readonly runnableDashboardTestsRequiredForClosure: true;
  readonly accessibilityAndKeyboardChecksRequiredForClosure: true;
  readonly playwrightCriticalFlowsRequiredForClosure: true;
  readonly branchProtectionRequiredForClosure: true;
  readonly flakyPolicyRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface DashboardTestExecutionPlan {
  readonly localCommands: typeof dashboardTestLocalCommands;
  readonly externalCommands: typeof dashboardTestExternalCommands;
  readonly requiredExternalEvidence: typeof dashboardTestRuntimeRequiredExternalEvidence;
  readonly commandExecutionAllowed: false;
  readonly dashboardTestExecutionAllowed: false;
  readonly accessibilityExecutionAllowed: false;
  readonly playwrightExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly branchProtectionExecutionAllowed: false;
  readonly executionPolicy: typeof dashboardTestRuntimeExecutionPolicy;
}

export interface DashboardTestArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof dashboardTestRuntimeRequiredExternalEvidence;
  readonly secretSafe: boolean;
}

export const dashboardTestRuntimeRequiredExternalEvidence = [
  "dashboard unit component and route rendering test output",
  "dashboard auth guard fixture test output",
  "dashboard RBAC and tenant-isolation fixture evidence",
  "dashboard booking mutation lifecycle test output",
  "dashboard provider-safe mutation state evidence",
  "dashboard axe accessibility check output",
  "dashboard keyboard navigation check output",
  "Playwright dashboard critical-flow suite evidence",
  "CI dashboard test artifact upload proof",
  "branch protection dashboard required-check proof",
  "flaky dashboard test policy evidence",
  "secret-safe dashboard test artifact review",
] as const;

export const dashboardTestRequiredExternalEvidence = dashboardTestRuntimeRequiredExternalEvidence;

export const dashboardTestRuntimeExecutionPolicy: DashboardTestExecutionPolicy = {
  codexMayClassifyStaticDashboardTestReadiness: true,
  runnableDashboardTestsRequiredForClosure: true,
  accessibilityAndKeyboardChecksRequiredForClosure: true,
  playwrightCriticalFlowsRequiredForClosure: true,
  branchProtectionRequiredForClosure: true,
  flakyPolicyRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
};

export const dashboardTestLocalCommands = [
  "pnpm --filter @inkroute/testing typecheck",
  "pnpm --filter @inkroute/testing test",
  "static dashboard runtime test coverage inventory review",
  "static dashboard test manifest review",
] as const;

export const dashboardTestExternalCommands = [
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

export const buildDashboardTestExecutionPlan = (): DashboardTestExecutionPlan => ({
  localCommands: dashboardTestLocalCommands,
  externalCommands: dashboardTestExternalCommands,
  requiredExternalEvidence: dashboardTestRuntimeRequiredExternalEvidence,
  commandExecutionAllowed: false,
  dashboardTestExecutionAllowed: false,
  accessibilityExecutionAllowed: false,
  playwrightExecutionAllowed: false,
  ciExecutionAllowed: false,
  branchProtectionExecutionAllowed: false,
  executionPolicy: dashboardTestRuntimeExecutionPolicy,
});

const dashboardTestSensitiveArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|cookie|email|phone|medical|payment|stripe|screenshot|trace|video|playwright|auth|rbac|booking|message|file|artifact|log|branch)/i;

export const buildRedactedDashboardTestArtifact = (
  artifact: unknown,
): Pick<DashboardTestArtifactReview, "artifact" | "redactions"> => {
  const redactions: string[] = [];

  const redact = (value: unknown, path: string): unknown => {
    if (Array.isArray(value)) {
      return value.map((item, index) => redact(item, `${path}[${index}]`));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
          const entryPath = path ? `${path}.${key}` : key;

          if (dashboardTestSensitiveArtifactKeyPattern.test(key)) {
            redactions.push(entryPath);
            return [key, "[REDACTED_DASHBOARD_TEST_PRIVATE_VALUE]"];
          }

          return [key, redact(entry, entryPath)];
        }),
      );
    }

    return value;
  };

  return {
    artifact: redact(artifact, ""),
    redactions,
  };
};

export const buildDashboardTestArtifactReview = (
  artifact: unknown,
): DashboardTestArtifactReview => {
  const redacted = buildRedactedDashboardTestArtifact(artifact);
  const serialized = JSON.stringify(redacted.artifact);
  const leakedPrivateMarkers = [
    "client@example.com",
    "tenant.example.com",
    "session_",
    "provider-token",
    "trace.zip",
    "playwright-video",
    "private-tenant",
  ].some((marker) => serialized.includes(marker));

  return {
    ...redacted,
    requiredExternalEvidence: dashboardTestRuntimeRequiredExternalEvidence,
    secretSafe: !leakedPrivateMarkers,
  };
};



