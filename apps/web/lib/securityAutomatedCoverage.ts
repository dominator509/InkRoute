import { buildSecurityAutomatedCoverageReadinessPlan } from "@inkroute/security";

export type SecurityCoverageSuiteKind =
  | "package"
  | "route-vitest"
  | "middleware-runtime"
  | "middleware-static"
  | "playwright"
  | "db-integration"
  | "storage-provider"
  | "privacy-workflow"
  | "role-boundary";

export interface SecurityCoverageSuiteTarget {
  id: string;
  kind: SecurityCoverageSuiteKind;
  command: string;
  artifact: string;
  status: "wired" | "provider-gated" | "execution-gated";
}

export interface SecurityCoverageRunPersistenceInput {
  tenantId: string;
  runId: string;
  commitSha?: string;
  status: "blocked" | "running" | "passed" | "failed" | "provider_gated";
  suiteMatrix: readonly SecurityCoverageSuiteTarget[];
  providerGatedSuites: readonly string[];
  artifactManifest: readonly string[];
  failureFixturesPath?: string;
  dbIsolationCovered: boolean;
  storageNegativeCovered: boolean;
  privacyWorkflowCovered: boolean;
  roleBoundaryCovered: boolean;
  ciRunUrl?: string;
}

export interface SecurityCoverageRunPersistenceContract {
  modelName: "SecurityCoverageRun";
  row: SecurityCoverageRunPersistenceInput;
  transactionWrites: readonly ["SecurityCoverageRun", "AuditLog"];
  requiredCoverageFlags: readonly ["dbIsolationCovered", "storageNegativeCovered", "privacyWorkflowCovered", "roleBoundaryCovered"];
  artifactFields: readonly ["suiteMatrix", "providerGatedSuites", "artifactManifest", "failureFixturesPath"];
  tenantIsolationKey: "tenantId";
}

export type SecurityCoverageRunData = SecurityCoverageRunPersistenceInput & {
  commitSha: string | null;
  failureFixturesPath: string | null;
  ciRunUrl: string | null;
};

export interface SecurityCoverageRunRepository {
  readonly securityCoverageRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: SecurityCoverageRunData;
      update: SecurityCoverageRunData;
    }): unknown;
  };
}

export const securityAutomatedCoverageArtifactPaths = [
  "coverage/security-automated-coverage.json",
  "coverage/security-package-tests.json",
  "coverage/security-route-vitest.json",
  "coverage/security-middleware-runtime.json",
  "coverage/security-middleware-static.json",
  "coverage/security-web-playwright.json",
  "coverage/security-dashboard-playwright.json",
  "coverage/security-db-tenant-isolation.json",
  "coverage/security-storage-provider-negative.json",
  "coverage/security-privacy-workflow-integration.json",
  "coverage/security-role-boundary-authenticated.json",
  "coverage/security-failure-mode-fixtures.md",
  "test-results/security-automated",
] as const;

export const securityAutomatedCoverageProofFiles = [
  "packages/security/package.json",
  "packages/security/src/index.ts",
  "packages/security/tests/upload-policy.test.ts",
  "apps/web/lib/securityAutomatedCoverage.ts",
  "apps/web/tests/security-automated-coverage-static.test.ts",
  "apps/web/tests/secure-upload-intents-route.test.ts",
  "apps/web/tests/privacy-requests-public-route.test.ts",
  "apps/web/tests/privacy-requests-dashboard-route.test.ts",
  "apps/web/tests/dashboard-trust-status-route.test.ts",
  "apps/web/tests/security-runtime-middleware.test.ts",
  "apps/web/tests/security-runtime-middleware-static.test.ts",
  "apps/web/tests/dashboard-security-runtime-middleware-static.test.ts",
  "apps/web/tests/e2e/security-runtime.spec.ts",
  "apps/dashboard/tests/e2e/security-runtime.spec.ts",
  "apps/dashboard/app/api/security/trust-status/route.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609006000_add_security_coverage_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "testing/manifests/security-checklist.json",
] as const;

export const securityAutomatedCoverageSuites: readonly SecurityCoverageSuiteTarget[] = [
  {
    id: "security-package",
    kind: "package",
    command: "pnpm --filter @inkroute/security test",
    artifact: "coverage/security-package-tests.json",
    status: "wired",
  },
  {
    id: "security-route-vitest",
    kind: "route-vitest",
    command:
      "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts apps/web/tests/privacy-requests-public-route.test.ts apps/web/tests/privacy-requests-dashboard-route.test.ts apps/web/tests/dashboard-trust-status-route.test.ts",
    artifact: "coverage/security-route-vitest.json",
    status: "wired",
  },
  {
    id: "security-middleware-runtime",
    kind: "middleware-runtime",
    command: "pnpm vitest run apps/web/tests/security-runtime-middleware.test.ts",
    artifact: "coverage/security-middleware-runtime.json",
    status: "wired",
  },
  {
    id: "security-middleware-static",
    kind: "middleware-static",
    command: "pnpm vitest run apps/web/tests/security-runtime-middleware-static.test.ts apps/web/tests/dashboard-security-runtime-middleware-static.test.ts",
    artifact: "coverage/security-middleware-static.json",
    status: "wired",
  },
  {
    id: "security-playwright",
    kind: "playwright",
    command: "pnpm exec playwright test apps/web/tests/e2e/security-runtime.spec.ts apps/dashboard/tests/e2e/security-runtime.spec.ts",
    artifact: "coverage/security-web-playwright.json",
    status: "execution-gated",
  },
  {
    id: "security-db-tenant-isolation",
    kind: "db-integration",
    command: "DB-backed tenant-isolation security integration tests",
    artifact: "coverage/security-db-tenant-isolation.json",
    status: "provider-gated",
  },
  {
    id: "security-storage-provider-negative",
    kind: "storage-provider",
    command: "storage/provider negative security tests",
    artifact: "coverage/security-storage-provider-negative.json",
    status: "provider-gated",
  },
  {
    id: "security-privacy-workflow-integration",
    kind: "privacy-workflow",
    command: "privacy workflow integration tests with auth/Postgres/storage",
    artifact: "coverage/security-privacy-workflow-integration.json",
    status: "provider-gated",
  },
  {
    id: "security-authenticated-role-boundary",
    kind: "role-boundary",
    command: "authenticated role-boundary security tests",
    artifact: "coverage/security-role-boundary-authenticated.json",
    status: "provider-gated",
  },
] as const;

export const securityAutomatedCoverageCommands = securityAutomatedCoverageSuites.map((suite) => suite.command);
export const securityAutomatedCoverageLocalCommands = securityAutomatedCoverageCommands.slice(0, 4);
export const securityAutomatedCoverageExternalCommands = securityAutomatedCoverageCommands.slice(4);

export const securityAutomatedCoverageRequiredExternalEvidence = [
  "Web/dashboard Playwright security smoke proof",
  "DB-backed tenant-isolation security proof",
  "Storage/provider negative security proof",
  "Privacy workflow security integration proof",
  "Authenticated role-boundary security proof",
  "Provider-backed SecurityCoverageRun persistence proof",
  "Security failure-mode fixture proof",
] as const;

export type SecurityAutomatedCoverageArtifact = (typeof securityAutomatedCoverageArtifactPaths)[number];

export const securityAutomatedCoverageLocalArtifacts = [
  "coverage/security-automated-coverage.json",
  "coverage/security-package-tests.json",
  "coverage/security-route-vitest.json",
  "coverage/security-middleware-runtime.json",
  "coverage/security-middleware-static.json",
  "test-results/security-automated",
] as const satisfies readonly SecurityAutomatedCoverageArtifact[];

const securityAutomatedCoverageLocalArtifactSet = new Set<SecurityAutomatedCoverageArtifact>(
  securityAutomatedCoverageLocalArtifacts,
);

export const securityAutomatedCoverageExternalArtifacts = securityAutomatedCoverageArtifactPaths.filter(
  (artifact) => !securityAutomatedCoverageLocalArtifactSet.has(artifact),
) as readonly SecurityAutomatedCoverageArtifact[];

export type SecurityAutomatedCoverageCommand = (typeof securityAutomatedCoverageCommands)[number];

export type SecurityAutomatedCoverageExecutionPolicy = {
  localStaticAndVitestCoverageOnly: true;
  playwrightRequiresExternalEvidence: true;
  dbTenantIsolationRequiresExternalEvidence: true;
  storageProviderRequiresExternalEvidence: true;
  privacyWorkflowRequiresExternalEvidence: true;
  roleBoundaryRequiresExternalEvidence: true;
  ciPersistenceRequiresExternalEvidence: true;
  externalEvidenceRequired: typeof securityAutomatedCoverageRequiredExternalEvidence;
};

export type SecurityAutomatedCoverageEvidenceInput = {
  packageSuitePassed: boolean;
  routeVitestSuitePassed: boolean;
  middlewareRuntimeSuitePassed: boolean;
  middlewareStaticSuitePassed: boolean;
  webDashboardPlaywrightPassed: boolean;
  dbTenantIsolationPassed: boolean;
  storageProviderNegativePassed: boolean;
  privacyWorkflowIntegrationPassed: boolean;
  authenticatedRoleBoundaryPassed: boolean;
  fullUnitCiPassed: boolean;
  failureFixturesDocumented: boolean;
  requiredCommandsRun: readonly SecurityAutomatedCoverageCommand[];
  capturedArtifacts: readonly SecurityAutomatedCoverageArtifact[];
};

export type SecurityAutomatedCoverageEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: SecurityAutomatedCoverageArtifact[];
  requiredCommands: typeof securityAutomatedCoverageCommands;
  requiredEvidence: typeof securityAutomatedCoverageArtifactPaths;
  coveragePolicy: {
    providerGatedSuitesMustExecute: true;
    failureFixturesRequired: true;
    ciArtifactsRetained: true;
  };
};

export type SecurityAutomatedCoverageExecutionPlan = {
  status: "local-plan-ready";
  policy: SecurityAutomatedCoverageExecutionPolicy;
  externalEvidenceRequired: typeof securityAutomatedCoverageRequiredExternalEvidence;
  playwrightExecutionAllowed: false;
  dbTenantIsolationExecutionAllowed: false;
  storageProviderExecutionAllowed: false;
  privacyWorkflowExecutionAllowed: false;
  roleBoundaryExecutionAllowed: false;
  ciPersistenceExecutionAllowed: false;
  localCommands: typeof securityAutomatedCoverageLocalCommands;
  externalCommands: typeof securityAutomatedCoverageExternalCommands;
  localArtifacts: typeof securityAutomatedCoverageLocalArtifacts;
  externalArtifacts: typeof securityAutomatedCoverageExternalArtifacts;
  disabledReasons: readonly string[];
};

export const securityAutomatedCoverageExecutionPolicy: SecurityAutomatedCoverageExecutionPolicy = {
  localStaticAndVitestCoverageOnly: true,
  playwrightRequiresExternalEvidence: true,
  dbTenantIsolationRequiresExternalEvidence: true,
  storageProviderRequiresExternalEvidence: true,
  privacyWorkflowRequiresExternalEvidence: true,
  roleBoundaryRequiresExternalEvidence: true,
  ciPersistenceRequiresExternalEvidence: true,
  externalEvidenceRequired: securityAutomatedCoverageRequiredExternalEvidence,
};

export type SecurityAutomatedCoverageArtifactReview = {
  status: "redacted-review-ready";
  redactedArtifact: unknown;
  requiredArtifacts: typeof securityAutomatedCoverageArtifactPaths;
  retainedExternalGates: readonly string[];
};

const securityAutomatedCoverageSensitivePatterns = [
  /(run[_-]?id['":=\s]+)[^"',\s}]+/gi,
  /(commit[_-]?sha['":=\s]+)[^"',\s}]+/gi,
  /(ci[_-]?run[_-]?url['":=\s]+)[^"',\s}]+/gi,
  /(artifact[_-]?manifest['":=\s]+)[^"',}]+/gi,
  /(failure[_-]?fixtures[_-]?path['":=\s]+)[^"',\s}]+/gi,
  /(authorization:\s*bearer\s+)[A-Za-z0-9._-]+/gi,
  /(token['":=\s]+)[^"',\s}]+/gi,
  /(secret['":=\s]+)[^"',\s}]+/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
] as const;

export function buildRedactedSecurityAutomatedCoverageArtifact(value: unknown): unknown {
  if (typeof value === "string") {
    return securityAutomatedCoverageSensitivePatterns.reduce(
      (redacted, pattern) => redacted.replace(pattern, (_match, prefix: string | undefined) => `${prefix ?? ""}[REDACTED]`),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => buildRedactedSecurityAutomatedCoverageArtifact(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /email|phone|token|secret|authorization|credential|password|rawBody|stack|ciRunUrl|commitSha|runId|artifactManifest|failureFixturesPath|providerPayload/i.test(key)
          ? "[REDACTED]"
          : buildRedactedSecurityAutomatedCoverageArtifact(entry),
      ]),
    );
  }

  return value;
}

export function buildSecurityAutomatedCoverageExecutionPlan(): SecurityAutomatedCoverageExecutionPlan {
  return {
    status: "local-plan-ready",
    policy: securityAutomatedCoverageExecutionPolicy,
    externalEvidenceRequired: securityAutomatedCoverageRequiredExternalEvidence,
    playwrightExecutionAllowed: false,
    dbTenantIsolationExecutionAllowed: false,
    storageProviderExecutionAllowed: false,
    privacyWorkflowExecutionAllowed: false,
    roleBoundaryExecutionAllowed: false,
    ciPersistenceExecutionAllowed: false,
    localCommands: securityAutomatedCoverageLocalCommands,
    externalCommands: securityAutomatedCoverageExternalCommands,
    localArtifacts: securityAutomatedCoverageLocalArtifacts,
    externalArtifacts: securityAutomatedCoverageExternalArtifacts,
    disabledReasons: [
      "Web/dashboard Playwright security smoke proof requires browser execution.",
      "DB-backed tenant-isolation proof requires provider-backed database fixtures.",
      "Storage/provider negative proof requires storage/provider sandbox execution.",
      "Privacy workflow integration proof requires auth, Postgres, and storage integrations.",
      "Authenticated role-boundary proof requires provider-backed actors and sessions.",
      "SecurityCoverageRun persistence proof requires provider-backed database execution.",
    ],
  };
}

export function buildSecurityAutomatedCoverageArtifactReview(rawArtifact: unknown): SecurityAutomatedCoverageArtifactReview {
  return {
    status: "redacted-review-ready",
    redactedArtifact: buildRedactedSecurityAutomatedCoverageArtifact(rawArtifact),
    requiredArtifacts: securityAutomatedCoverageArtifactPaths,
    retainedExternalGates: [
      "Web/dashboard Playwright security smoke proof",
      "DB-backed tenant-isolation security proof",
      "Storage/provider negative security proof",
      "Privacy workflow security integration proof",
      "Authenticated role-boundary security proof",
      "Provider-backed SecurityCoverageRun persistence proof",
      "Security failure-mode fixture proof",
    ],
  };
}

export function buildSecurityAutomatedCoverageEvidenceDecision(
  input: SecurityAutomatedCoverageEvidenceInput,
): SecurityAutomatedCoverageEvidenceDecision {
  const blockers = [
    !input.packageSuitePassed && "Run @inkroute/security package coverage suite.",
    !input.routeVitestSuitePassed && "Run security route Vitest suite.",
    !input.middlewareRuntimeSuitePassed && "Run security middleware runtime suite.",
    !input.middlewareStaticSuitePassed && "Run security middleware static suite.",
    !input.webDashboardPlaywrightPassed && "Run web/dashboard Playwright security smoke suite.",
    !input.dbTenantIsolationPassed && "Run DB-backed tenant-isolation security tests.",
    !input.storageProviderNegativePassed && "Run storage/provider negative security tests.",
    !input.privacyWorkflowIntegrationPassed && "Run privacy workflow security integration tests.",
    !input.authenticatedRoleBoundaryPassed && "Run authenticated role-boundary security tests.",
    !input.fullUnitCiPassed && "Run full unit and CI security checks.",
    !input.failureFixturesDocumented && "Document security failure-mode fixtures.",
  ].filter(Boolean) as string[];

  const missingArtifacts = securityAutomatedCoverageArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = securityAutomatedCoverageCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: securityAutomatedCoverageCommands,
    requiredEvidence: securityAutomatedCoverageArtifactPaths,
    coveragePolicy: {
      providerGatedSuitesMustExecute: true,
      failureFixturesRequired: true,
      ciArtifactsRetained: true,
    },
  };
}

export function buildSecurityCoverageRunPersistenceContract(
  input: SecurityCoverageRunPersistenceInput,
): SecurityCoverageRunPersistenceContract {
  return {
    modelName: "SecurityCoverageRun",
    row: input,
    transactionWrites: ["SecurityCoverageRun", "AuditLog"],
    requiredCoverageFlags: ["dbIsolationCovered", "storageNegativeCovered", "privacyWorkflowCovered", "roleBoundaryCovered"],
    artifactFields: ["suiteMatrix", "providerGatedSuites", "artifactManifest", "failureFixturesPath"],
    tenantIsolationKey: "tenantId",
  };
}

export function buildSecurityCoverageRunData(input: SecurityCoverageRunPersistenceInput): SecurityCoverageRunData {
  return {
    ...input,
    commitSha: input.commitSha ?? null,
    failureFixturesPath: input.failureFixturesPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export function persistSecurityCoverageRun(
  repository: SecurityCoverageRunRepository,
  input: SecurityCoverageRunPersistenceInput,
): unknown {
  const data = buildSecurityCoverageRunData(input);

  return repository.securityCoverageRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update: data,
  });
}

export const securityAutomatedCoverageReadiness = buildSecurityAutomatedCoverageReadinessPlan({
  packageScripts: ["test", "typecheck"],
  securityPackageTestsPassed: false,
  securityPackageTypecheckPassed: false,
  routeVitestSuitePassed: false,
  middlewareRuntimeSuitePassed: false,
  middlewareStaticSuitePassed: false,
  webE2eSecuritySuitePassed: false,
  dashboardE2eSecuritySuitePassed: false,
  fullUnitSuitePassed: false,
  ciSecurityChecksPassed: false,
  testManifestIncludesSecuritySuites: true,
  dbBackedTenantIsolationTestsPassed: false,
  storageProviderNegativeTestsPassed: false,
  privacyWorkflowIntegrationTestsPassed: false,
  authenticatedRoleBoundaryTestsPassed: false,
  coverageArtifactsCollected: true,
  failureModeFixturesDocumented: false,
});

export const securityCoverageRunPersistencePreview = buildSecurityCoverageRunPersistenceContract({
  tenantId: "tenant_demo",
  runId: "security-run-demo",
  status: "provider_gated",
  suiteMatrix: securityAutomatedCoverageSuites,
  providerGatedSuites: securityAutomatedCoverageSuites.filter((suite) => suite.status === "provider-gated").map((suite) => suite.id),
  artifactManifest: securityAutomatedCoverageArtifactPaths,
  failureFixturesPath: "coverage/security-failure-mode-fixtures.md",
  dbIsolationCovered: false,
  storageNegativeCovered: false,
  privacyWorkflowCovered: false,
  roleBoundaryCovered: false,
});
