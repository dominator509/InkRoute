import { buildReleaseAutomatedTestReadinessPlan } from "@inkroute/releases";

export const releaseAutomatedCoverageArtifactPaths = [
  "coverage/release-automated-coverage.json",
  "coverage/release-dashboard-playwright-smoke.json",
  "coverage/release-provider-backed-route-integration.json",
  "coverage/release-expo-render-smoke.json",
  "coverage/release-expo-device-ota-proof-redacted.json",
  "coverage/release-github-actions-execution-redacted.json",
  "coverage/release-real-secrets-environments-redacted.json",
  "test-results/release-automated",
  "test-results/release-dashboard",
  "test-results/release-provider",
  "test-results/release-expo",
] as const;

export const releaseAutomatedCoverageProofFiles = [
  "apps/dashboard/package.json",
  "packages/releases/package.json",
  "packages/releases/src/index.ts",
  "packages/releases/tests/feature-flags.test.ts",
  "packages/releases/tests/release-governance-workflow.test.ts",
  "apps/web/lib/releaseAutomatedCoverage.ts",
  "apps/web/tests/release-health-route.test.ts",
  "apps/web/tests/release-automation-static.test.ts",
  "apps/web/tests/release-automated-coverage-static.test.ts",
  "apps/dashboard/tests/e2e/release-dashboard.spec.ts",
  "apps/mobile/tests/mobile-static.test.ts",
  "apps/dashboard/app/releases/page.tsx",
  "apps/dashboard/components/ReleaseActionPanel.tsx",
  "apps/dashboard/app/api/releases/route.ts",
  "apps/dashboard/app/api/feature-flags/route.ts",
  "apps/dashboard/tests/release-route-static.test.ts",
  "apps/dashboard/tests/feature-flag-route-static.test.ts",
  ".github/workflows/release-governance.yml",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export const releaseAutomatedCoverageCommands = [
  "pnpm --filter @inkroute/releases test",
  "pnpm vitest run apps/web/tests/release-health-route.test.ts apps/web/tests/release-automation-static.test.ts apps/web/tests/release-automated-coverage-static.test.ts apps/mobile/tests/mobile-static.test.ts",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm exec playwright test apps/dashboard/tests/e2e/release-dashboard.spec.ts",
  "provider-backed release route integration tests",
  "Expo release status render/device tests",
  "GitHub Actions release-governance workflow execution",
] as const;

export const releaseAutomatedCoverageLocalCommands = releaseAutomatedCoverageCommands.slice(0, 3);
export const releaseAutomatedCoverageExternalCommands = releaseAutomatedCoverageCommands.slice(3);

export type ReleaseAutomatedCoverageEvidenceArtifact = (typeof releaseAutomatedCoverageArtifactPaths)[number];

export const releaseAutomatedCoverageLocalArtifacts = [
  "coverage/release-automated-coverage.json",
  "test-results/release-automated",
] as const satisfies readonly ReleaseAutomatedCoverageEvidenceArtifact[];

const releaseAutomatedCoverageLocalArtifactSet = new Set<ReleaseAutomatedCoverageEvidenceArtifact>(
  releaseAutomatedCoverageLocalArtifacts,
);

export const releaseAutomatedCoverageExternalArtifacts = releaseAutomatedCoverageArtifactPaths.filter(
  (artifact) => !releaseAutomatedCoverageLocalArtifactSet.has(artifact),
) as readonly ReleaseAutomatedCoverageEvidenceArtifact[];

export const releaseAutomatedCoverageRequiredExternalEvidence = [
  "Playwright dashboard release smoke artifact",
  "Provider-backed release/feature-flag route integration artifact",
  "Expo render and physical-device release/OTA proof",
  "GitHub Actions release-governance workflow execution proof",
  "Real secret/protected environment proof and CI artifact capture",
] as const;

export interface ReleaseAutomatedCoverageEvidenceInput {
  readonly releasePackageTestsPassed: boolean;
  readonly releaseWorkflowTestsPassed: boolean;
  readonly releaseHealthRouteTestsPassed: boolean;
  readonly releaseAutomationStaticTestsPassed: boolean;
  readonly mobileStaticTestsPassed: boolean;
  readonly dashboardTypecheckPassed: boolean;
  readonly playwrightDashboardReleaseSmokePassed: boolean;
  readonly providerBackedRouteIntegrationTestsPassed: boolean;
  readonly expoRenderTestsPassed: boolean;
  readonly expoDeviceTestsPassed: boolean;
  readonly githubActionsWorkflowExecutionEvidenceCaptured: boolean;
  readonly realSecretsAndEnvironmentsConfigured: boolean;
  readonly ciArtifactsCaptured: boolean;
  readonly capturedArtifacts: readonly ReleaseAutomatedCoverageEvidenceArtifact[];
}

export interface ReleaseAutomatedCoverageEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly ReleaseAutomatedCoverageEvidenceArtifact[];
  readonly requiredCommands: typeof releaseAutomatedCoverageCommands;
  readonly requiredEvidence: typeof releaseAutomatedCoverageDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export interface ReleaseAutomatedCoverageExecutionPlan {
  readonly status: "local-plan-ready";
  readonly playwrightExecutionAllowed: false;
  readonly expoExecutionAllowed: false;
  readonly providerBackedRouteExecutionAllowed: false;
  readonly githubActionsExecutionAllowed: false;
  readonly secretEnvironmentExecutionAllowed: false;
  readonly policy: ReleaseAutomatedCoverageExecutionPolicy;
  readonly localCommands: typeof releaseAutomatedCoverageLocalCommands;
  readonly externalCommands: typeof releaseAutomatedCoverageExternalCommands;
  readonly localArtifacts: typeof releaseAutomatedCoverageLocalArtifacts;
  readonly externalArtifacts: typeof releaseAutomatedCoverageExternalArtifacts;
  readonly requiredExternalEvidence: typeof releaseAutomatedCoverageRequiredExternalEvidence;
  readonly disabledReasons: readonly string[];
}

export interface ReleaseAutomatedCoverageExecutionPolicy {
  readonly executePlaywright: false;
  readonly executeExpo: false;
  readonly executeProviderBackedRoutes: false;
  readonly executeGithubActions: false;
  readonly useRealSecretsOrProtectedEnvironments: false;
  readonly executeCi: false;
}

export interface ReleaseAutomatedCoverageArtifactReview {
  readonly status: "redacted-review-ready";
  readonly redactedArtifact: unknown;
  readonly requiredArtifacts: typeof releaseAutomatedCoverageArtifactPaths;
  readonly retainedExternalGates: readonly string[];
}

const releaseAutomatedCoverageSecretPatterns = [
  /(gh[pousr]_[A-Za-z0-9_]+)/gi,
  /(github[_-]?token['":=\s]+)[^"',\s}]+/gi,
  /(expo[_-]?token['":=\s]+)[^"',\s}]+/gi,
  /(eas[_-]?token['":=\s]+)[^"',\s}]+/gi,
  /(secret['":=\s]+)[^"',\s}]+/gi,
  /(authorization:\s*bearer\s+)[A-Za-z0-9._-]+/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
] as const;

export function buildRedactedReleaseAutomatedCoverageArtifact(value: unknown): unknown {
  if (typeof value === "string") {
    return releaseAutomatedCoverageSecretPatterns.reduce(
      (redacted, pattern) => redacted.replace(pattern, (_match, prefix: string | undefined) => `${prefix ?? ""}[REDACTED]`),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => buildRedactedReleaseAutomatedCoverageArtifact(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /token|secret|authorization|credential|password|private|providerPayload|rawBody|stack|deviceId/i.test(key)
          ? "[REDACTED]"
          : buildRedactedReleaseAutomatedCoverageArtifact(entry),
      ]),
    );
  }

  return value;
}

export const releaseAutomatedCoverageExecutionPolicy: ReleaseAutomatedCoverageExecutionPolicy = {
  executePlaywright: false,
  executeExpo: false,
  executeProviderBackedRoutes: false,
  executeGithubActions: false,
  useRealSecretsOrProtectedEnvironments: false,
  executeCi: false,
};

export function buildReleaseAutomatedCoverageExecutionPlan(): ReleaseAutomatedCoverageExecutionPlan {
  return {
    status: "local-plan-ready",
    playwrightExecutionAllowed: false,
    expoExecutionAllowed: false,
    providerBackedRouteExecutionAllowed: false,
    githubActionsExecutionAllowed: false,
    secretEnvironmentExecutionAllowed: false,
    policy: releaseAutomatedCoverageExecutionPolicy,
    localCommands: releaseAutomatedCoverageLocalCommands,
    externalCommands: releaseAutomatedCoverageExternalCommands,
    localArtifacts: releaseAutomatedCoverageLocalArtifacts,
    externalArtifacts: releaseAutomatedCoverageExternalArtifacts,
    requiredExternalEvidence: releaseAutomatedCoverageRequiredExternalEvidence,
    disabledReasons: [
      "Playwright dashboard execution needs browser/runtime evidence outside static local closure.",
      "Expo render/device proof needs device or Expo runtime execution.",
      "Provider-backed route integration needs database-backed tenant/provider evidence.",
      "GitHub Actions workflow proof needs remote workflow execution with protected environments.",
      "Real secret/protected environment proof cannot be generated without credentials.",
    ],
  };
}

export function buildReleaseAutomatedCoverageArtifactReview(rawArtifact: unknown): ReleaseAutomatedCoverageArtifactReview {
  return {
    status: "redacted-review-ready",
    redactedArtifact: buildRedactedReleaseAutomatedCoverageArtifact(rawArtifact),
    requiredArtifacts: releaseAutomatedCoverageArtifactPaths,
    retainedExternalGates: [
      "Playwright dashboard release smoke artifact",
      "Provider-backed release/feature-flag route integration artifact",
      "Expo render/device proof artifact",
      "GitHub Actions release-governance execution artifact",
      "Real secret/protected environment artifact",
      "CI artifact capture",
    ],
  };
}

export const releaseAutomatedCoverageDecisionRequiredEvidence = [
  "release package/helper, release-health route, release automation static, mobile static, and dashboard typecheck artifacts",
  "Playwright dashboard release smoke, provider-backed route integration, Expo render/device, and GitHub Actions workflow execution artifacts",
  "real secret/protected environment and CI artifact evidence",
] as const;

export function buildReleaseAutomatedCoverageEvidenceDecision(
  input: ReleaseAutomatedCoverageEvidenceInput,
): ReleaseAutomatedCoverageEvidenceDecision {
  const blockers = [
    !input.releasePackageTestsPassed ? "@inkroute/releases package test evidence is required." : null,
    !input.releaseWorkflowTestsPassed ? "Release-governance workflow validation evidence is required." : null,
    !input.releaseHealthRouteTestsPassed ? "Release-health route test evidence is required." : null,
    !input.releaseAutomationStaticTestsPassed ? "Release automation static contract evidence is required." : null,
    !input.mobileStaticTestsPassed ? "Mobile release static evidence is required." : null,
    !input.dashboardTypecheckPassed ? "Dashboard typecheck evidence is required." : null,
    !input.playwrightDashboardReleaseSmokePassed ? "Playwright dashboard release smoke evidence is required." : null,
    !input.providerBackedRouteIntegrationTestsPassed ? "Provider-backed release/feature-flag route integration evidence is required." : null,
    !input.expoRenderTestsPassed ? "Expo release status render evidence is required." : null,
    !input.expoDeviceTestsPassed ? "Expo device/OTA proof evidence is required." : null,
    !input.githubActionsWorkflowExecutionEvidenceCaptured ? "GitHub Actions release-governance workflow execution evidence is required." : null,
    !input.realSecretsAndEnvironmentsConfigured ? "Real CI secret/protected environment evidence is required." : null,
    !input.ciArtifactsCaptured ? "Release automated coverage CI artifact evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = releaseAutomatedCoverageArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: releaseAutomatedCoverageCommands,
    requiredEvidence: releaseAutomatedCoverageDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-094 release automated coverage evidence is complete with CI-safe redacted artifacts captured."
        : "GAP-094 release automated coverage evidence remains blocked until Playwright, provider route, Expo, workflow, secret/environment, and CI artifacts are captured.",
  };
}

export const releaseAutomatedCoverageMatrix = [
  {
    id: "package-helper-tests",
    command: "pnpm --filter @inkroute/releases test",
    artifact: "coverage/release-automated-coverage.json",
    status: "command-target-wired",
  },
  {
    id: "dashboard-release-playwright-smoke",
    command: "pnpm exec playwright test apps/dashboard/tests/e2e/release-dashboard.spec.ts",
    artifact: "coverage/release-dashboard-playwright-smoke.json",
    status: "playwright-target-added",
  },
  {
    id: "provider-backed-route-integrations",
    command: "provider-backed release route integration tests",
    artifact: "coverage/release-provider-backed-route-integration.json",
    status: "provider-proof-gated",
  },
  {
    id: "expo-render-device-tests",
    command: "Expo release status render/device tests",
    artifact: "coverage/release-expo-device-ota-proof-redacted.json",
    status: "expo-proof-gated",
  },
  {
    id: "github-actions-workflow-execution",
    command: "GitHub Actions release-governance workflow execution",
    artifact: "coverage/release-github-actions-execution-redacted.json",
    status: "workflow-proof-gated",
  },
] as const;

export function buildProviderBackedReleaseRouteIntegrationPlan(input: {
  tenantId: string;
  releaseRoute: string;
  featureFlagRoute: string;
}) {
  return {
    tenantId: input.tenantId,
    routes: [
      {
        id: "release-route-db-backed-read",
        path: input.releaseRoute,
        requiredHeaders: ["x-tenant-id", "x-user-id", "x-user-role"],
        expectedStatus: [200, 503],
        requiresDatabase: true,
        requiresProviderMutation: false,
      },
      {
        id: "feature-flag-route-db-backed-read",
        path: input.featureFlagRoute,
        requiredHeaders: ["x-tenant-id", "x-user-id", "x-user-role"],
        expectedStatus: [200, 503],
        requiresDatabase: true,
        requiresProviderMutation: false,
      },
    ],
    assertions: [
      "no-store cache headers",
      "tenant mismatch denial",
      "server-side TenantMember permission lookup",
      "provider actions remain disabled without secrets",
      "redacted artifact capture",
    ],
    artifact: "coverage/release-provider-backed-route-integration.json",
  };
}

export const providerBackedReleaseRouteIntegrationPlan = buildProviderBackedReleaseRouteIntegrationPlan({
  tenantId: "inkroute-demo",
  releaseRoute: "/api/releases?tenantId=inkroute-demo",
  featureFlagRoute: "/api/feature-flags?tenantId=inkroute-demo",
});

export function buildReleaseAutomatedCoverageContract() {
  return buildReleaseAutomatedTestReadinessPlan({
    packageScripts: ["test", "typecheck"],
    releasePackageTestsPassed: false,
    releaseWorkflowTestsPassed: false,
    releaseHealthRouteTestsPassed: false,
    releaseAutomationStaticTestsPassed: false,
    mobileStaticTestsPassed: false,
    dashboardTypecheckPassed: false,
    playwrightDashboardReleaseSmokePassed: true,
    providerBackedRouteIntegrationTestsPassed: false,
    expoRenderTestsPassed: false,
    expoDeviceTestsPassed: false,
    githubActionsWorkflowExecutionEvidenceCaptured: false,
    realSecretsAndEnvironmentsConfigured: false,
    ciArtifactsCaptured: true,
  });
}

export const releaseAutomatedCoverageContract = buildReleaseAutomatedCoverageContract();



