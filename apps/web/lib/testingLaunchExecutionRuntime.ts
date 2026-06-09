import { buildTestingLaunchExecutionEvidencePlan } from "@inkroute/testing";

export type TestingLaunchExecutionRuntimeStatus =
  | "wired"
  | "execution-gated"
  | "integration-gated"
  | "mobile-gated"
  | "ci-gated"
  | "policy-gated";

export interface TestingLaunchExecutionRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: TestingLaunchExecutionRuntimeStatus;
}

export interface TestingLaunchExecutionRunPersistenceContract {
  readonly model: "TestingLaunchExecutionRun";
  readonly tenantRelation: "testingLaunchExecutionRuns";
  readonly migration: "20260609033600_add_testing_launch_execution_runs";
  readonly jsonFields: readonly [
    "commandMatrix",
    "artifactManifest",
    "coverageReportManifest",
    "playwrightReportManifest",
    "policyEvidenceManifest",
  ];
  readonly evidenceBooleans: readonly [
    "lockfileInstallPassed",
    "staticChecksPassed",
    "manifestChecksPassed",
    "typecheckPassed",
    "unitTestsPassed",
    "unitCoveragePassed",
    "e2eTestsPassed",
    "webBuildPassed",
    "dashboardBuildPassed",
    "prismaIntegrationTestsPassed",
    "providerSandboxTestsPassed",
    "securityTestsPassed",
    "mobileSimulatorTestsPassed",
    "mobileDeviceTestsPassed",
    "coverageThresholdsMet",
    "coverageArtifactsUploaded",
    "playwrightArtifactsUploaded",
    "junitJsonReportsPublished",
    "ciRunPassed",
    "branchProtectionRequiresCi",
    "flakyTestPolicyDocumented",
    "failureDebugArtifactsVerified",
    "secretSafeArtifactsCaptured",
  ];
  readonly artifactFields: readonly [
    "frozenInstallArtifactPath",
    "phase14StaticArtifactPath",
    "manifestArtifactPath",
    "typecheckArtifactPath",
    "unitOutputArtifactPath",
    "unitCoverageArtifactPath",
    "e2eOutputArtifactPath",
    "playwrightReportArtifactPath",
    "webBuildArtifactPath",
    "dashboardBuildArtifactPath",
    "prismaIntegrationArtifactPath",
    "providerSandboxArtifactPath",
    "securityArtifactPath",
    "mobileSimulatorArtifactPath",
    "mobileDeviceArtifactPath",
    "ciQualityRunArtifactPath",
    "branchProtectionArtifactPath",
    "flakyPolicyArtifactPath",
    "failureDebugArtifactPath",
    "secretSafeArtifactPath",
    "ciRunUrl",
  ];
}

export const testingLaunchExecutionRunPersistenceContract: TestingLaunchExecutionRunPersistenceContract = {
  model: "TestingLaunchExecutionRun",
  tenantRelation: "testingLaunchExecutionRuns",
  migration: "20260609033600_add_testing_launch_execution_runs",
  jsonFields: [
    "commandMatrix",
    "artifactManifest",
    "coverageReportManifest",
    "playwrightReportManifest",
    "policyEvidenceManifest",
  ],
  evidenceBooleans: [
    "lockfileInstallPassed",
    "staticChecksPassed",
    "manifestChecksPassed",
    "typecheckPassed",
    "unitTestsPassed",
    "unitCoveragePassed",
    "e2eTestsPassed",
    "webBuildPassed",
    "dashboardBuildPassed",
    "prismaIntegrationTestsPassed",
    "providerSandboxTestsPassed",
    "securityTestsPassed",
    "mobileSimulatorTestsPassed",
    "mobileDeviceTestsPassed",
    "coverageThresholdsMet",
    "coverageArtifactsUploaded",
    "playwrightArtifactsUploaded",
    "junitJsonReportsPublished",
    "ciRunPassed",
    "branchProtectionRequiresCi",
    "flakyTestPolicyDocumented",
    "failureDebugArtifactsVerified",
    "secretSafeArtifactsCaptured",
  ],
  artifactFields: [
    "frozenInstallArtifactPath",
    "phase14StaticArtifactPath",
    "manifestArtifactPath",
    "typecheckArtifactPath",
    "unitOutputArtifactPath",
    "unitCoverageArtifactPath",
    "e2eOutputArtifactPath",
    "playwrightReportArtifactPath",
    "webBuildArtifactPath",
    "dashboardBuildArtifactPath",
    "prismaIntegrationArtifactPath",
    "providerSandboxArtifactPath",
    "securityArtifactPath",
    "mobileSimulatorArtifactPath",
    "mobileDeviceArtifactPath",
    "ciQualityRunArtifactPath",
    "branchProtectionArtifactPath",
    "flakyPolicyArtifactPath",
    "failureDebugArtifactPath",
    "secretSafeArtifactPath",
    "ciRunUrl",
  ],
};

export const testingLaunchExecutionRuntimeCommands = [
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

export const testingLaunchExecutionArtifactPaths = [
  "coverage/testing-launch-execution-runtime.json",
  "coverage/testing-frozen-install-output.txt",
  "coverage/testing-phase14-static-output.txt",
  "coverage/testing-manifest-output.txt",
  "coverage/testing-typecheck-output.txt",
  "coverage/testing-unit-output.json",
  "coverage/testing-unit-coverage",
  "coverage/testing-unit-coverage-summary.json",
  "coverage/testing-e2e-output.json",
  "coverage/playwright-report",
  "coverage/playwright-results.json",
  "coverage/playwright-junit.xml",
  "coverage/playwright-traces",
  "coverage/playwright-screenshots",
  "coverage/playwright-videos",
  "coverage/testing-web-build-output.txt",
  "coverage/testing-dashboard-build-output.txt",
  "coverage/testing-prisma-integration-output.json",
  "coverage/testing-provider-sandbox-output-redacted.json",
  "coverage/testing-security-output.json",
  "coverage/testing-mobile-simulator-output.json",
  "coverage/testing-mobile-device-output-redacted.json",
  "coverage/testing-ci-quality-run-redacted.json",
  "coverage/testing-branch-protection-required-checks-redacted.json",
  "coverage/testing-flaky-policy.md",
  "coverage/testing-failure-debug-artifacts.json",
  "coverage/testing-secret-safe-artifacts.json",
  "test-results/testing-launch-execution-runtime",
] as const;

export const testingLaunchExecutionRuntimeMatrix = [
  {
    id: "frozen-install-static-manifest-typecheck",
    command: "pnpm install --frozen-lockfile && pnpm test:phase14:static && pnpm test:manifest && pnpm typecheck",
    artifact: "coverage/testing-frozen-install-output.txt",
    status: "execution-gated",
  },
  {
    id: "unit-and-coverage",
    command: "pnpm test:unit && pnpm test:unit:coverage",
    artifact: "coverage/testing-unit-coverage-summary.json",
    status: "execution-gated",
  },
  {
    id: "playwright-e2e-artifacts",
    command: "pnpm test:e2e",
    artifact: "coverage/playwright-report",
    status: "execution-gated",
  },
  {
    id: "web-dashboard-builds",
    command: "pnpm --filter @inkroute/web build && pnpm --filter @inkroute/dashboard build",
    artifact: "coverage/testing-web-build-output.txt",
    status: "execution-gated",
  },
  {
    id: "database-provider-security-integration",
    command: "Prisma/database integration test suite && provider sandbox test suite && security test suite",
    artifact: "coverage/testing-prisma-integration-output.json",
    status: "integration-gated",
  },
  {
    id: "mobile-simulator-device",
    command: "Expo simulator and device test suites",
    artifact: "coverage/testing-mobile-device-output-redacted.json",
    status: "mobile-gated",
  },
  {
    id: "reports-artifact-retention",
    command: "retain coverage, Playwright, JUnit, JSON, trace, screenshot, video, and failure-debug artifacts",
    artifact: "coverage/testing-failure-debug-artifacts.json",
    status: "wired",
  },
  {
    id: "ci-quality-run",
    command: "GitHub Actions CI quality run with retained artifacts",
    artifact: "coverage/testing-ci-quality-run-redacted.json",
    status: "ci-gated",
  },
  {
    id: "branch-protection-flaky-policy-secret-safety",
    command: "branch protection required-check proof, flaky policy, and secret-safe artifact review",
    artifact: "coverage/testing-branch-protection-required-checks-redacted.json",
    status: "policy-gated",
  },
] as const satisfies readonly TestingLaunchExecutionRuntimeMatrixEntry[];

export const testingLaunchExecutionRuntimeReadiness = buildTestingLaunchExecutionEvidencePlan({
  rootScripts: ["test:phase14:static", "test:manifest", "typecheck", "test:unit", "test:unit:coverage", "test:e2e"],
  lockfileInstallPassed: false,
  staticChecksPassed: false,
  manifestChecksPassed: false,
  typecheckPassed: false,
  unitTestsPassed: false,
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
