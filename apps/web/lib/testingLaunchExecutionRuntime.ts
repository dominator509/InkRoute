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

export const testingLaunchExecutionRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "apps/web/package.json",
  "package.json",
  "packages/testing/src/index.ts",
  "packages/testing/tests/testing-manifest.test.ts",
  "TESTING_PLAN.md",
  "vitest.workspace.ts",
  "playwright.config.ts",
  "apps/web/lib/testingLaunchExecutionRuntime.ts",
  "apps/web/tests/testing-launch-execution-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609033600_add_testing_launch_execution_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
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

export type TestingLaunchExecutionEvidenceFlag =
  (typeof testingLaunchExecutionRunPersistenceContract.evidenceBooleans)[number];

export interface TestingLaunchExecutionRunEvidenceFields {
  readonly lockfileInstallPassed: boolean;
  readonly staticChecksPassed: boolean;
  readonly manifestChecksPassed: boolean;
  readonly typecheckPassed: boolean;
  readonly unitTestsPassed: boolean;
  readonly unitCoveragePassed: boolean;
  readonly e2eTestsPassed: boolean;
  readonly webBuildPassed: boolean;
  readonly dashboardBuildPassed: boolean;
  readonly prismaIntegrationTestsPassed: boolean;
  readonly providerSandboxTestsPassed: boolean;
  readonly securityTestsPassed: boolean;
  readonly mobileSimulatorTestsPassed: boolean;
  readonly mobileDeviceTestsPassed: boolean;
  readonly coverageThresholdsMet: boolean;
  readonly coverageArtifactsUploaded: boolean;
  readonly playwrightArtifactsUploaded: boolean;
  readonly junitJsonReportsPublished: boolean;
  readonly ciRunPassed: boolean;
  readonly branchProtectionRequiresCi: boolean;
  readonly flakyTestPolicyDocumented: boolean;
  readonly failureDebugArtifactsVerified: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
}

export interface TestingLaunchExecutionRunRecordInput extends TestingLaunchExecutionRunEvidenceFields {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha?: string | null;
  readonly status: "complete" | "blocked";
  readonly artifacts: readonly string[];
  readonly frozenInstallArtifactPath?: string | null;
  readonly phase14StaticArtifactPath?: string | null;
  readonly manifestArtifactPath?: string | null;
  readonly typecheckArtifactPath?: string | null;
  readonly unitOutputArtifactPath?: string | null;
  readonly unitCoverageArtifactPath?: string | null;
  readonly e2eOutputArtifactPath?: string | null;
  readonly playwrightReportArtifactPath?: string | null;
  readonly webBuildArtifactPath?: string | null;
  readonly dashboardBuildArtifactPath?: string | null;
  readonly prismaIntegrationArtifactPath?: string | null;
  readonly providerSandboxArtifactPath?: string | null;
  readonly securityArtifactPath?: string | null;
  readonly mobileSimulatorArtifactPath?: string | null;
  readonly mobileDeviceArtifactPath?: string | null;
  readonly ciQualityRunArtifactPath?: string | null;
  readonly branchProtectionArtifactPath?: string | null;
  readonly flakyPolicyArtifactPath?: string | null;
  readonly failureDebugArtifactPath?: string | null;
  readonly secretSafeArtifactPath?: string | null;
  readonly ciRunUrl?: string | null;
}

export interface TestingLaunchExecutionRunData
  extends Omit<TestingLaunchExecutionRunRecordInput, "artifacts"> {
  readonly commandMatrix: typeof testingLaunchExecutionRuntimeMatrix;
  readonly artifactManifest: readonly string[];
  readonly coverageReportManifest: {
    readonly unitCoveragePassed: boolean;
    readonly coverageThresholdsMet: boolean;
    readonly coverageArtifactsUploaded: boolean;
  };
  readonly playwrightReportManifest: {
    readonly e2eTestsPassed: boolean;
    readonly playwrightArtifactsUploaded: boolean;
    readonly junitJsonReportsPublished: boolean;
  };
  readonly policyEvidenceManifest: {
    readonly ciRunPassed: boolean;
    readonly branchProtectionRequiresCi: boolean;
    readonly flakyTestPolicyDocumented: boolean;
    readonly failureDebugArtifactsVerified: boolean;
    readonly secretSafeArtifactsCaptured: boolean;
  };
}

export interface TestingLaunchExecutionRunRepository {
  readonly testingLaunchExecutionRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: TestingLaunchExecutionRunData;
      update: Omit<TestingLaunchExecutionRunData, "tenantId" | "runId">;
    }): Promise<unknown>;
  };
}

export interface TestingLaunchExecutionEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly evidence?: Partial<Record<TestingLaunchExecutionEvidenceFlag, boolean>>;
}

export interface TestingLaunchExecutionEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingEvidence: readonly TestingLaunchExecutionEvidenceFlag[];
  readonly requiredCommands: typeof testingLaunchExecutionRuntimeCommands;
  readonly requiredArtifacts: typeof testingLaunchExecutionArtifactPaths;
  readonly requiredEvidence: readonly TestingLaunchExecutionEvidenceFlag[];
  readonly blockers: readonly string[];
}

export interface TestingLaunchExecutionPlan {
  readonly localCommands: typeof testingLaunchExecutionLocalCommands;
  readonly externalCommands: typeof testingLaunchExecutionExternalCommands;
  readonly localArtifacts: typeof testingLaunchExecutionLocalArtifacts;
  readonly externalArtifacts: typeof testingLaunchExecutionExternalArtifacts;
  readonly surfaceContract: typeof testingLaunchExecutionSurfaceContract;
  readonly commandExecutionAllowed: false;
  readonly providerExecutionAllowed: false;
  readonly mobileDeviceExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly executionPolicy: typeof testingLaunchExecutionPolicy;
  readonly requiredExternalEvidence: typeof testingLaunchExecutionRequiredExternalEvidence;
}

export interface TestingLaunchExecutionArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof testingLaunchExecutionRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export interface TestingLaunchExecutionSurfaceContractEntry {
  readonly surfaceId: string;
  readonly requiredCommand: (typeof testingLaunchExecutionRuntimeCommands)[number];
  readonly requiredArtifact: (typeof testingLaunchExecutionArtifactPaths)[number];
  readonly executionBoundary:
    | "local-command"
    | "database"
    | "provider-sandbox"
    | "mobile-device"
    | "ci-proof"
    | "branch-protection"
    | "artifact-review";
  readonly externalEvidenceRequired: boolean;
  readonly redactedArtifactRequired: true;
}

export const testingLaunchExecutionSurfaceContract: readonly TestingLaunchExecutionSurfaceContractEntry[] = [
  {
    surfaceId: "frozen-install",
    requiredCommand: "pnpm install --frozen-lockfile",
    requiredArtifact: "coverage/testing-frozen-install-output.txt",
    executionBoundary: "local-command",
    externalEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "static-manifest-typecheck",
    requiredCommand: "pnpm typecheck",
    requiredArtifact: "coverage/testing-typecheck-output.txt",
    executionBoundary: "local-command",
    externalEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "unit-coverage",
    requiredCommand: "pnpm test:unit:coverage",
    requiredArtifact: "coverage/testing-unit-coverage-summary.json",
    executionBoundary: "local-command",
    externalEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "playwright-e2e",
    requiredCommand: "pnpm test:e2e",
    requiredArtifact: "coverage/playwright-results.json",
    executionBoundary: "local-command",
    externalEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "web-dashboard-builds",
    requiredCommand: "pnpm --filter @inkroute/web build",
    requiredArtifact: "coverage/testing-web-build-output.txt",
    executionBoundary: "local-command",
    externalEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "database-integration",
    requiredCommand: "Prisma/database integration test suite",
    requiredArtifact: "coverage/testing-prisma-integration-output.json",
    executionBoundary: "database",
    externalEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "provider-sandbox",
    requiredCommand: "provider sandbox test suite",
    requiredArtifact: "coverage/testing-provider-sandbox-output-redacted.json",
    executionBoundary: "provider-sandbox",
    externalEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "mobile-simulator-device",
    requiredCommand: "Expo simulator and device test suites",
    requiredArtifact: "coverage/testing-mobile-device-output-redacted.json",
    executionBoundary: "mobile-device",
    externalEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "ci-quality-run",
    requiredCommand: "GitHub Actions CI quality run with retained artifacts",
    requiredArtifact: "coverage/testing-ci-quality-run-redacted.json",
    executionBoundary: "ci-proof",
    externalEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "branch-protection",
    requiredCommand: "branch protection required-check proof",
    requiredArtifact: "coverage/testing-branch-protection-required-checks-redacted.json",
    executionBoundary: "branch-protection",
    externalEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "secret-safe-artifacts",
    requiredCommand: "GitHub Actions CI quality run with retained artifacts",
    requiredArtifact: "coverage/testing-secret-safe-artifacts.json",
    executionBoundary: "artifact-review",
    externalEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
] as const;

const sensitiveTestingLaunchExecutionKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|name|address|medical|payment|card|provider|tenant|user|client|patient|database|url|uri|dsn|key|id|trace|screenshot|video|payload|artifact|raw|body|stack|error|log|output|transcript|command|junit|json|report|coverage|failure|debug|branch|protection|flaky|policy|mobile|expo|device|ci|commit|run|repository|repo|pull|pr|reviewer|codeowner)/iu;
const sensitiveTestingLaunchExecutionValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|repo:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|branch:[A-Za-z0-9_./-]+|pr[_:#-]?[A-Za-z0-9_.-]+|reviewer[_:@-]?[A-Za-z0-9_.-]+|CODEOWNER:[A-Za-z0-9_.@/-]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|(?:tenant|user|client|patient|payment|provider|device|mobile|artifact|junit|report|coverage|trace|screenshot|video|failure|debug|branch|check|flaky|workflow|ci|run|commit|command|test|build|typecheck)[-_:/]?[A-Za-z0-9_.-]{6,}|(?:coverage|test-results|playwright-report|artifacts|reports)\/[A-Za-z0-9_./-]{6,}|[A-Za-z0-9_-]{24,})/giu;

export const testingLaunchExecutionPolicy = {
  codexMayClassifyStaticTestingLaunchReadiness: true,
  commandOutputRequiredForClosure: true,
  providerEvidenceRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const;

export const testingLaunchExecutionRequiredExternalEvidence = [
  "Actual frozen install, static, manifest, typecheck, unit, coverage, E2E, build, database, and security command outputs.",
  "Provider sandbox test evidence with redacted provider payloads.",
  "Expo simulator and physical device test evidence.",
  "GitHub Actions CI quality run with retained coverage, Playwright, JUnit, JSON, trace, screenshot, video, and failure-debug artifacts.",
  "Branch protection required-check proof and flaky-test policy evidence.",
  "Provider-backed TestingLaunchExecutionRun persistence row captured through persistTestingLaunchExecutionRun.",
  "Secret-safe artifact proof free of secrets, tokens, raw PII, medical data, and payment data.",
] as const;

export const testingLaunchExecutionLocalCommands = [
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
  "security test suite",
] as const;

export const testingLaunchExecutionExternalCommands = [
  "provider sandbox test suite",
  "Expo simulator and device test suites",
  "GitHub Actions CI quality run with retained artifacts",
  "branch protection required-check proof",
] as const;

export const testingLaunchExecutionLocalArtifacts = [
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
  "coverage/testing-security-output.json",
  "coverage/testing-flaky-policy.md",
  "coverage/testing-failure-debug-artifacts.json",
  "coverage/testing-secret-safe-artifacts.json",
] as const;

export const testingLaunchExecutionExternalArtifacts = [
  "coverage/testing-provider-sandbox-output-redacted.json",
  "coverage/testing-mobile-simulator-output.json",
  "coverage/testing-mobile-device-output-redacted.json",
  "coverage/testing-ci-quality-run-redacted.json",
  "coverage/testing-branch-protection-required-checks-redacted.json",
  "test-results/testing-launch-execution-runtime",
] as const;

const buildRedactedTestingLaunchExecutionValue = (value: unknown, path: string, redactions: string[]): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => buildRedactedTestingLaunchExecutionValue(entry, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveTestingLaunchExecutionKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedTestingLaunchExecutionValue(entry, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redacted = value.replace(sensitiveTestingLaunchExecutionValuePattern, "[REDACTED]");
    if (redacted !== value) {
      redactions.push(path || "$");
    }
    return redacted;
  }

  return value;
};

export function buildTestingLaunchExecutionPlan(): TestingLaunchExecutionPlan {
  return {
    localCommands: testingLaunchExecutionLocalCommands,
    externalCommands: testingLaunchExecutionExternalCommands,
    localArtifacts: testingLaunchExecutionLocalArtifacts,
    externalArtifacts: testingLaunchExecutionExternalArtifacts,
    surfaceContract: testingLaunchExecutionSurfaceContract,
    commandExecutionAllowed: false,
    providerExecutionAllowed: false,
    mobileDeviceExecutionAllowed: false,
    ciExecutionAllowed: false,
    databaseExecutionAllowed: false,
    executionPolicy: testingLaunchExecutionPolicy,
    requiredExternalEvidence: testingLaunchExecutionRequiredExternalEvidence,
  };
}

export function buildRedactedTestingLaunchExecutionArtifact(artifact: unknown): unknown {
  return buildRedactedTestingLaunchExecutionValue(artifact, "", []);
}

export function buildTestingLaunchExecutionArtifactReview(
  artifact: unknown,
): TestingLaunchExecutionArtifactReview {
  const redactions: string[] = [];
  return {
    artifact: buildRedactedTestingLaunchExecutionValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: testingLaunchExecutionRequiredExternalEvidence,
    safeForTracker: true,
  };
}

export function buildTestingLaunchExecutionRunData(
  input: TestingLaunchExecutionRunRecordInput,
): TestingLaunchExecutionRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha ?? null,
    status: input.status,
    commandMatrix: testingLaunchExecutionRuntimeMatrix,
    artifactManifest: input.artifacts,
    coverageReportManifest: {
      unitCoveragePassed: input.unitCoveragePassed,
      coverageThresholdsMet: input.coverageThresholdsMet,
      coverageArtifactsUploaded: input.coverageArtifactsUploaded,
    },
    playwrightReportManifest: {
      e2eTestsPassed: input.e2eTestsPassed,
      playwrightArtifactsUploaded: input.playwrightArtifactsUploaded,
      junitJsonReportsPublished: input.junitJsonReportsPublished,
    },
    policyEvidenceManifest: {
      ciRunPassed: input.ciRunPassed,
      branchProtectionRequiresCi: input.branchProtectionRequiresCi,
      flakyTestPolicyDocumented: input.flakyTestPolicyDocumented,
      failureDebugArtifactsVerified: input.failureDebugArtifactsVerified,
      secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    },
    lockfileInstallPassed: input.lockfileInstallPassed,
    staticChecksPassed: input.staticChecksPassed,
    manifestChecksPassed: input.manifestChecksPassed,
    typecheckPassed: input.typecheckPassed,
    unitTestsPassed: input.unitTestsPassed,
    unitCoveragePassed: input.unitCoveragePassed,
    e2eTestsPassed: input.e2eTestsPassed,
    webBuildPassed: input.webBuildPassed,
    dashboardBuildPassed: input.dashboardBuildPassed,
    prismaIntegrationTestsPassed: input.prismaIntegrationTestsPassed,
    providerSandboxTestsPassed: input.providerSandboxTestsPassed,
    securityTestsPassed: input.securityTestsPassed,
    mobileSimulatorTestsPassed: input.mobileSimulatorTestsPassed,
    mobileDeviceTestsPassed: input.mobileDeviceTestsPassed,
    coverageThresholdsMet: input.coverageThresholdsMet,
    coverageArtifactsUploaded: input.coverageArtifactsUploaded,
    playwrightArtifactsUploaded: input.playwrightArtifactsUploaded,
    junitJsonReportsPublished: input.junitJsonReportsPublished,
    ciRunPassed: input.ciRunPassed,
    branchProtectionRequiresCi: input.branchProtectionRequiresCi,
    flakyTestPolicyDocumented: input.flakyTestPolicyDocumented,
    failureDebugArtifactsVerified: input.failureDebugArtifactsVerified,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    frozenInstallArtifactPath: input.frozenInstallArtifactPath ?? null,
    phase14StaticArtifactPath: input.phase14StaticArtifactPath ?? null,
    manifestArtifactPath: input.manifestArtifactPath ?? null,
    typecheckArtifactPath: input.typecheckArtifactPath ?? null,
    unitOutputArtifactPath: input.unitOutputArtifactPath ?? null,
    unitCoverageArtifactPath: input.unitCoverageArtifactPath ?? null,
    e2eOutputArtifactPath: input.e2eOutputArtifactPath ?? null,
    playwrightReportArtifactPath: input.playwrightReportArtifactPath ?? null,
    webBuildArtifactPath: input.webBuildArtifactPath ?? null,
    dashboardBuildArtifactPath: input.dashboardBuildArtifactPath ?? null,
    prismaIntegrationArtifactPath: input.prismaIntegrationArtifactPath ?? null,
    providerSandboxArtifactPath: input.providerSandboxArtifactPath ?? null,
    securityArtifactPath: input.securityArtifactPath ?? null,
    mobileSimulatorArtifactPath: input.mobileSimulatorArtifactPath ?? null,
    mobileDeviceArtifactPath: input.mobileDeviceArtifactPath ?? null,
    ciQualityRunArtifactPath: input.ciQualityRunArtifactPath ?? null,
    branchProtectionArtifactPath: input.branchProtectionArtifactPath ?? null,
    flakyPolicyArtifactPath: input.flakyPolicyArtifactPath ?? null,
    failureDebugArtifactPath: input.failureDebugArtifactPath ?? null,
    secretSafeArtifactPath: input.secretSafeArtifactPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export async function persistTestingLaunchExecutionRun(
  repository: TestingLaunchExecutionRunRepository,
  input: TestingLaunchExecutionRunRecordInput,
): Promise<unknown> {
  const data = buildTestingLaunchExecutionRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.testingLaunchExecutionRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

const testingLaunchExecutionEvidenceBlockers: Record<TestingLaunchExecutionEvidenceFlag, string> = {
  lockfileInstallPassed: "pnpm install --frozen-lockfile must pass before testing launch execution is ready.",
  staticChecksPassed: "Phase 14 static checks must pass.",
  manifestChecksPassed: "Test manifest checks must pass.",
  typecheckPassed: "Workspace typecheck must pass.",
  unitTestsPassed: "Unit tests must pass.",
  unitCoveragePassed: "Unit coverage command must pass.",
  e2eTestsPassed: "Playwright E2E tests must pass.",
  webBuildPassed: "Web build must pass.",
  dashboardBuildPassed: "Dashboard build must pass.",
  prismaIntegrationTestsPassed: "Prisma/database integration tests must pass.",
  providerSandboxTestsPassed: "Provider sandbox tests must pass or remain explicitly launch-blocking.",
  securityTestsPassed: "Security tests must pass.",
  mobileSimulatorTestsPassed: "Expo simulator tests must pass.",
  mobileDeviceTestsPassed: "Expo device tests must pass.",
  coverageThresholdsMet: "Coverage thresholds must be met.",
  coverageArtifactsUploaded: "Coverage artifacts must be uploaded and retained.",
  playwrightArtifactsUploaded: "Playwright reports, traces, screenshots, and videos must be uploaded and retained.",
  junitJsonReportsPublished: "JUnit and JSON reports must be published.",
  ciRunPassed: "CI quality run must pass.",
  branchProtectionRequiresCi: "Branch protection must require the CI quality run.",
  flakyTestPolicyDocumented: "Flaky-test policy must be documented.",
  failureDebugArtifactsVerified: "Failure-debug artifacts must be verified.",
  secretSafeArtifactsCaptured: "Testing artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export const buildTestingLaunchExecutionEvidenceDecision = (
  input: TestingLaunchExecutionEvidenceInput,
): TestingLaunchExecutionEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, testingLaunchExecutionRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, testingLaunchExecutionArtifactPaths);
  const missingEvidence = testingLaunchExecutionRunPersistenceContract.evidenceBooleans.filter(
    (flag) => input.evidence?.[flag] !== true,
  );
  const blockers = missingEvidence.map((flag) => testingLaunchExecutionEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 && missingArtifacts.length === 0 && missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingEvidence,
    requiredCommands: testingLaunchExecutionRuntimeCommands,
    requiredArtifacts: testingLaunchExecutionArtifactPaths,
    requiredEvidence: testingLaunchExecutionRunPersistenceContract.evidenceBooleans,
    blockers,
  };
};

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


