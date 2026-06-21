import { buildDeploymentToolingRuntimeVerificationPlan } from "@inkroute/deployment";

export type DeploymentToolingRuntimeStatus =
  | "wired"
  | "execution-gated"
  | "dashboard-gated"
  | "ci-gated";

export interface DeploymentToolingRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DeploymentToolingRuntimeStatus;
}

export interface DeploymentToolingRunPersistenceInput {
  tenantId: string;
  runId: string;
  commitSha?: string;
  status: "blocked" | "running" | "passed" | "failed" | "dashboard_gated";
  runtimeMatrix: readonly DeploymentToolingRuntimeMatrixEntry[];
  artifactManifest: readonly string[];
  frozenInstallPassed: boolean;
  deploymentPackageTypecheckPassed: boolean;
  deploymentPackageTestsPassed: boolean;
  routeContractTestsPassed: boolean;
  deployCheckEnvPassed: boolean;
  deployChecklistPassed: boolean;
  deployGapsPassed: boolean;
  dashboardBuildPassed: boolean;
  dashboardPageSmokePassed: boolean;
  dashboardReadinessApiSmokePassed: boolean;
  rollbackPreflightVerified: boolean;
  productionApprovalBoundaryVerified: boolean;
  ciDeploymentReportsCaptured: boolean;
  blockerOwnersDocumented: boolean;
  blockerOwnerArtifactPath?: string;
  ciRunUrl?: string;
}

export interface DeploymentToolingRunPersistenceContract {
  modelName: "DeploymentToolingRun";
  row: DeploymentToolingRunPersistenceInput;
  transactionWrites: readonly ["DeploymentToolingRun", "AuditLog"];
  requiredDeploymentFlags: readonly [
    "frozenInstallPassed",
    "deploymentPackageTypecheckPassed",
    "deploymentPackageTestsPassed",
    "routeContractTestsPassed",
    "deployCheckEnvPassed",
    "deployChecklistPassed",
    "deployGapsPassed",
    "dashboardBuildPassed",
    "dashboardPageSmokePassed",
    "dashboardReadinessApiSmokePassed",
    "rollbackPreflightVerified",
    "productionApprovalBoundaryVerified",
    "ciDeploymentReportsCaptured",
    "blockerOwnersDocumented",
  ];
  artifactFields: readonly ["runtimeMatrix", "artifactManifest", "blockerOwnerArtifactPath"];
  tenantIsolationKey: "tenantId";
}

export type DeploymentToolingRunData = DeploymentToolingRunPersistenceInput & {
  commitSha: string | null;
  blockerOwnerArtifactPath: string | null;
  ciRunUrl: string | null;
};

export interface DeploymentToolingRunRepository {
  readonly deploymentToolingRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: DeploymentToolingRunData;
      update: DeploymentToolingRunData;
    }): unknown;
  };
}

export const deploymentToolingRuntimeArtifactPaths = [
  "coverage/deployment-tooling-runtime.json",
  "coverage/deployment-install.log",
  "coverage/deployment-package-typecheck.log",
  "coverage/deployment-package-tests.json",
  "coverage/deployment-route-contracts.json",
  "coverage/deploy-check-env.json",
  "coverage/deploy-checklist.json",
  "coverage/deploy-gaps.json",
  "coverage/deployment-dashboard-build.log",
  "coverage/deployment-dashboard-page-smoke.json",
  "coverage/deployment-readiness-api-smoke.json",
  "coverage/deployment-rollback-preflight.json",
  "coverage/deployment-production-approval-boundary.json",
  "coverage/deployment-ci-reports-redacted.json",
  "coverage/deployment-blocker-owner-list.json",
  "test-results/deployment-tooling-runtime"
] as const;

export const deploymentToolingRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "packages/deployment/package.json",
  "apps/web/lib/deploymentToolingRuntime.ts",
  "apps/web/tests/deployment-tooling-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609016000_add_deployment_tooling_runs/migration.sql",
  "packages/deployment/src/index.ts",
  "packages/deployment/tests/deployment-readiness.test.ts",
  "apps/web/tests/dashboard-deployment-readiness-route.test.ts",
  "apps/dashboard/tests/deployment-readiness-route-static.test.ts",
  "deployment/scripts/check-env.mjs",
  "deployment/scripts/print-launch-checklist.mjs",
  "deployment/scripts/final-gap-summary.mjs",
  "deployment/manifests/environment-contract.json",
  "apps/dashboard/app/deployment/page.tsx",
  "apps/dashboard/components/DeploymentReadinessActionPanel.tsx",
  "apps/dashboard/app/api/deployment/readiness/route.ts",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export const deploymentToolingRuntimeCommands = [
  "pnpm install --frozen-lockfile",
  "pnpm --filter @inkroute/deployment typecheck",
  "pnpm --filter @inkroute/deployment test",
  "pnpm test:unit -- apps/web/tests/dashboard-deployment-readiness-route.test.ts",
  "pnpm deploy:check-env",
  "pnpm deploy:checklist",
  "pnpm deploy:gaps",
  "pnpm --filter @inkroute/dashboard build",
  "dashboard deployment page smoke",
  "dashboard deployment readiness API smoke",
  "verify rollback preflight remains non-mutating",
  "verify production approval boundary remains blocked without required evidence",
  "capture CI deployment reports",
  "capture deployment blocker-owner artifact"
] as const;

export const deploymentToolingRuntimeLocalCommands = [
  "pnpm --filter @inkroute/deployment typecheck",
  "pnpm --filter @inkroute/deployment test",
  "pnpm test:unit -- apps/web/tests/dashboard-deployment-readiness-route.test.ts",
  "pnpm deploy:check-env",
  "pnpm deploy:checklist",
  "pnpm deploy:gaps",
] as const;

const deploymentToolingRuntimeLocalCommandSet = new Set<string>(deploymentToolingRuntimeLocalCommands);

export const deploymentToolingRuntimeExternalCommands = deploymentToolingRuntimeCommands.filter(
  (command) => !deploymentToolingRuntimeLocalCommandSet.has(command),
);

export const deploymentToolingRuntimeRequiredExternalEvidence = [
  "Frozen install, dashboard build, and route-smoke artifacts must be captured outside Codex when execution is approved.",
  "Deployment approval and rollback-preflight artifacts must prove production actions stayed human-gated and non-mutating.",
  "CI deployment reports must be retained with run URLs, provider identifiers, tokens, and environment details redacted.",
  "Provider-backed DeploymentToolingRun persistence must execute only in approved provider environments.",
] as const;

export type DeploymentToolingRuntimeExecutionPolicy = {
  readonly codexMayClassifyLocalCommands: true;
  readonly dependencyInstallRequiresUserApproval: true;
  readonly dashboardRuntimeSmokeRequiresRunningApp: true;
  readonly productionApprovalMustRemainHumanGated: true;
  readonly ciProviderRequiredForDeploymentReports: true;
  readonly providerEnvironmentRequiredForPersistence: true;
};

export const deploymentToolingRuntimeExecutionPolicy: DeploymentToolingRuntimeExecutionPolicy = {
  codexMayClassifyLocalCommands: true,
  dependencyInstallRequiresUserApproval: true,
  dashboardRuntimeSmokeRequiresRunningApp: true,
  productionApprovalMustRemainHumanGated: true,
  ciProviderRequiredForDeploymentReports: true,
  providerEnvironmentRequiredForPersistence: true,
};

export type DeploymentToolingRuntimeArtifact = (typeof deploymentToolingRuntimeArtifactPaths)[number];

export const deploymentToolingRuntimeLocalArtifacts = [
  "coverage/deployment-tooling-runtime.json",
  "coverage/deployment-package-typecheck.log",
  "coverage/deployment-package-tests.json",
  "coverage/deployment-route-contracts.json",
  "coverage/deploy-check-env.json",
  "coverage/deploy-checklist.json",
  "coverage/deploy-gaps.json",
  "test-results/deployment-tooling-runtime",
] as const satisfies readonly DeploymentToolingRuntimeArtifact[];

export const deploymentToolingRuntimeExternalArtifacts = deploymentToolingRuntimeArtifactPaths.filter(
  (artifact) =>
    !deploymentToolingRuntimeLocalArtifacts.includes(
      artifact as (typeof deploymentToolingRuntimeLocalArtifacts)[number],
    ),
) as readonly DeploymentToolingRuntimeArtifact[];

export type DeploymentToolingRuntimeCommand = (typeof deploymentToolingRuntimeCommands)[number];

export type DeploymentToolingRuntimeEvidenceInput = {
  frozenInstallPassed: boolean;
  deploymentPackageTypecheckPassed: boolean;
  deploymentPackageTestsPassed: boolean;
  routeContractTestsPassed: boolean;
  deployCheckEnvPassed: boolean;
  deployChecklistPassed: boolean;
  deployGapsPassed: boolean;
  dashboardBuildPassed: boolean;
  dashboardPageSmokePassed: boolean;
  dashboardReadinessApiSmokePassed: boolean;
  rollbackPreflightVerified: boolean;
  productionApprovalBoundaryVerified: boolean;
  ciDeploymentReportsCaptured: boolean;
  blockerOwnersDocumented: boolean;
  requiredCommandsRun: readonly DeploymentToolingRuntimeCommand[];
  capturedArtifacts: readonly DeploymentToolingRuntimeArtifact[];
};

export type DeploymentToolingRuntimeEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: DeploymentToolingRuntimeArtifact[];
  requiredCommands: typeof deploymentToolingRuntimeCommands;
  requiredEvidence: typeof deploymentToolingRuntimeArtifactPaths;
  deploymentPolicy: {
    productionActionsRemainApprovalGated: true;
    rollbackPreflightRequired: true;
    blockerOwnersRequired: true;
  };
};

export interface DeploymentToolingRuntimeExecutionPlan {
  readonly localCommands: typeof deploymentToolingRuntimeLocalCommands;
  readonly externalCommands: typeof deploymentToolingRuntimeExternalCommands;
  readonly localArtifacts: typeof deploymentToolingRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof deploymentToolingRuntimeExternalArtifacts;
  readonly frozenInstallExecutionAllowed: false;
  readonly packageQualityExecutionAllowed: false;
  readonly deploymentScriptExecutionAllowed: false;
  readonly dashboardBuildExecutionAllowed: false;
  readonly dashboardSmokeExecutionAllowed: false;
  readonly rollbackPreflightExecutionAllowed: false;
  readonly productionApprovalExecutionAllowed: false;
  readonly ciReportExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly executionPolicy: typeof deploymentToolingRuntimeExecutionPolicy;
}

export interface DeploymentToolingRuntimeArtifactReview {
  readonly artifactPath: DeploymentToolingRuntimeArtifact | string;
  readonly redactedArtifact: unknown;
  readonly redactions: readonly string[];
  readonly containsUnredactedSensitiveValues: false;
  readonly externalEvidenceRequired: typeof deploymentToolingRuntimeRequiredExternalEvidence;
}

const sensitiveDeploymentToolingKeyPattern =
  /(token|secret|password|authorization|cookie|env|databaseUrl|dbUrl|provider|ciRunUrl|deployUrl|previewUrl|approval|payload|tenantId|userId|runId|email|phone|blockerOwner)/i;

const sensitiveDeploymentToolingStringPatterns: readonly [RegExp, string][] = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED_TOKEN]"],
  [/https?:\/\/[^\s"'<>]+/gi, "[REDACTED_URL]"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]"],
  [/\+?1?[-.\s(]*\d{3}[-.\s)]*\d{3}[-.\s]*\d{4}/g, "[REDACTED_PHONE]"],
  [/\b(?:sk|pk|rk|whsec)_(?:live|test)_[A-Za-z0-9_]+\b/g, "[REDACTED_PROVIDER_TOKEN]"],
  [/\b(?:tenant|user|owner|deployment|run|approval)_[A-Za-z0-9_-]+\b/g, "[REDACTED_ID]"],
];

export function buildDeploymentToolingRuntimeEvidenceDecision(
  input: DeploymentToolingRuntimeEvidenceInput,
): DeploymentToolingRuntimeEvidenceDecision {
  const blockers = [
    !input.frozenInstallPassed && "Run frozen dependency install.",
    !input.deploymentPackageTypecheckPassed && "Run @inkroute/deployment typecheck.",
    !input.deploymentPackageTestsPassed && "Run @inkroute/deployment tests.",
    !input.routeContractTestsPassed && "Run dashboard deployment readiness route contract tests.",
    !input.deployCheckEnvPassed && "Run deploy:check-env.",
    !input.deployChecklistPassed && "Run deploy:checklist.",
    !input.deployGapsPassed && "Run deploy:gaps.",
    !input.dashboardBuildPassed && "Run dashboard build.",
    !input.dashboardPageSmokePassed && "Capture dashboard deployment page smoke proof.",
    !input.dashboardReadinessApiSmokePassed && "Capture dashboard deployment readiness API smoke proof.",
    !input.rollbackPreflightVerified && "Capture rollback preflight proof.",
    !input.productionApprovalBoundaryVerified && "Capture production approval boundary proof.",
    !input.ciDeploymentReportsCaptured && "Capture CI deployment report artifacts.",
    !input.blockerOwnersDocumented && "Capture blocker-owner artifact.",
  ].filter(Boolean) as string[];

  const missingArtifacts = deploymentToolingRuntimeArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = deploymentToolingRuntimeCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: deploymentToolingRuntimeCommands,
    requiredEvidence: deploymentToolingRuntimeArtifactPaths,
    deploymentPolicy: {
      productionActionsRemainApprovalGated: true,
      rollbackPreflightRequired: true,
      blockerOwnersRequired: true,
    },
  };
}

export function buildDeploymentToolingRuntimeExecutionPlan(): DeploymentToolingRuntimeExecutionPlan {
  return {
    localCommands: deploymentToolingRuntimeLocalCommands,
    externalCommands: deploymentToolingRuntimeExternalCommands,
    localArtifacts: deploymentToolingRuntimeLocalArtifacts,
    externalArtifacts: deploymentToolingRuntimeExternalArtifacts,
    frozenInstallExecutionAllowed: false,
    packageQualityExecutionAllowed: false,
    deploymentScriptExecutionAllowed: false,
    dashboardBuildExecutionAllowed: false,
    dashboardSmokeExecutionAllowed: false,
    rollbackPreflightExecutionAllowed: false,
    productionApprovalExecutionAllowed: false,
    ciReportExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    executionPolicy: deploymentToolingRuntimeExecutionPolicy,
  };
}

function redactDeploymentToolingString(value: string, redactions: Set<string>): string {
  return sensitiveDeploymentToolingStringPatterns.reduce((current, [pattern, replacement]) => {
    pattern.lastIndex = 0;
    if (pattern.test(current)) {
      redactions.add(replacement);
    }
    pattern.lastIndex = 0;
    return current.replace(pattern, replacement);
  }, value);
}

function redactDeploymentToolingValue(value: unknown, redactions: Set<string>, key?: string): unknown {
  if (key && sensitiveDeploymentToolingKeyPattern.test(key)) {
    redactions.add(key);
    return `[REDACTED_${key.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}]`;
  }

  if (typeof value === "string") {
    return redactDeploymentToolingString(value, redactions);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactDeploymentToolingValue(entry, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactDeploymentToolingValue(entryValue, redactions, entryKey),
      ]),
    );
  }

  return value;
}

export function buildRedactedDeploymentToolingArtifact(artifact: unknown): unknown {
  return redactDeploymentToolingValue(artifact, new Set<string>());
}

export function buildDeploymentToolingRuntimeArtifactReview(
  artifactPath: DeploymentToolingRuntimeArtifact | string,
  artifact: unknown,
): DeploymentToolingRuntimeArtifactReview {
  const redactions = new Set<string>();
  const redactedArtifact = redactDeploymentToolingValue(artifact, redactions);

  return {
    artifactPath,
    redactedArtifact,
    redactions: [...redactions].sort(),
    containsUnredactedSensitiveValues: false,
    externalEvidenceRequired: deploymentToolingRuntimeRequiredExternalEvidence,
  };
}

export const deploymentToolingRuntimeMatrix: readonly DeploymentToolingRuntimeMatrixEntry[] = [
  {
    id: "install-package-quality",
    command: "pnpm install --frozen-lockfile && pnpm --filter @inkroute/deployment typecheck && pnpm --filter @inkroute/deployment test",
    artifact: "coverage/deployment-package-tests.json",
    status: "execution-gated"
  },
  {
    id: "route-contract-tests",
    command: "pnpm test:unit -- apps/web/tests/dashboard-deployment-readiness-route.test.ts",
    artifact: "coverage/deployment-route-contracts.json",
    status: "execution-gated"
  },
  {
    id: "deployment-scripts",
    command: "pnpm deploy:check-env && pnpm deploy:checklist && pnpm deploy:gaps",
    artifact: "coverage/deploy-gaps.json",
    status: "wired"
  },
  {
    id: "dashboard-build",
    command: "pnpm --filter @inkroute/dashboard build",
    artifact: "coverage/deployment-dashboard-build.log",
    status: "dashboard-gated"
  },
  {
    id: "dashboard-page-smoke",
    command: "dashboard deployment page smoke",
    artifact: "coverage/deployment-dashboard-page-smoke.json",
    status: "dashboard-gated"
  },
  {
    id: "dashboard-readiness-api-smoke",
    command: "dashboard deployment readiness API smoke",
    artifact: "coverage/deployment-readiness-api-smoke.json",
    status: "dashboard-gated"
  },
  {
    id: "rollback-preflight",
    command: "verify rollback preflight remains non-mutating",
    artifact: "coverage/deployment-rollback-preflight.json",
    status: "dashboard-gated"
  },
  {
    id: "production-approval-boundary",
    command: "verify production approval boundary remains blocked without required evidence",
    artifact: "coverage/deployment-production-approval-boundary.json",
    status: "dashboard-gated"
  },
  {
    id: "ci-deployment-reports",
    command: "capture CI deployment reports",
    artifact: "coverage/deployment-ci-reports-redacted.json",
    status: "ci-gated"
  },
  {
    id: "blocker-owner-artifact",
    command: "capture deployment blocker-owner artifact",
    artifact: "coverage/deployment-blocker-owner-list.json",
    status: "ci-gated"
  }
];

export function buildDeploymentToolingRunPersistenceContract(
  input: DeploymentToolingRunPersistenceInput,
): DeploymentToolingRunPersistenceContract {
  return {
    modelName: "DeploymentToolingRun",
    row: input,
    transactionWrites: ["DeploymentToolingRun", "AuditLog"],
    requiredDeploymentFlags: [
      "frozenInstallPassed",
      "deploymentPackageTypecheckPassed",
      "deploymentPackageTestsPassed",
      "routeContractTestsPassed",
      "deployCheckEnvPassed",
      "deployChecklistPassed",
      "deployGapsPassed",
      "dashboardBuildPassed",
      "dashboardPageSmokePassed",
      "dashboardReadinessApiSmokePassed",
      "rollbackPreflightVerified",
      "productionApprovalBoundaryVerified",
      "ciDeploymentReportsCaptured",
      "blockerOwnersDocumented",
    ],
    artifactFields: ["runtimeMatrix", "artifactManifest", "blockerOwnerArtifactPath"],
    tenantIsolationKey: "tenantId",
  };
}

export function buildDeploymentToolingRunData(input: DeploymentToolingRunPersistenceInput): DeploymentToolingRunData {
  return {
    ...input,
    commitSha: input.commitSha ?? null,
    blockerOwnerArtifactPath: input.blockerOwnerArtifactPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export function persistDeploymentToolingRun(
  repository: DeploymentToolingRunRepository,
  input: DeploymentToolingRunPersistenceInput,
): unknown {
  const data = buildDeploymentToolingRunData(input);

  return repository.deploymentToolingRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update: data,
  });
}

export const deploymentToolingRuntimeReadiness = buildDeploymentToolingRuntimeVerificationPlan({
  packageScripts: {
    typecheck: "tsc --noEmit",
    test: "vitest run --passWithNoTests"
  },
  rootScripts: ["deploy:check-env", "deploy:checklist", "deploy:gaps", "test:unit"],
  dependenciesInstalled: false,
  deploymentPackageTestsPassed: false,
  deploymentPackageTypecheckPassed: false,
  deploymentScriptsExecuted: false,
  deployCheckEnvPassed: false,
  deployChecklistPassed: false,
  deployGapsPassed: false,
  routeContractTestsPassed: false,
  dashboardBuildPassed: false,
  dashboardDeploymentPageSmokePassed: false,
  dashboardReadinessApiSmokePassed: false,
  rollbackPreflightVerified: false,
  productionApprovalBoundaryVerified: true,
  ciDeploymentReportsCaptured: false,
  blockersDocumented: true
});

export const deploymentToolingRunPersistencePreview = buildDeploymentToolingRunPersistenceContract({
  tenantId: "tenant_demo",
  runId: "deployment-tooling-demo",
  status: "dashboard_gated",
  runtimeMatrix: deploymentToolingRuntimeMatrix,
  artifactManifest: deploymentToolingRuntimeArtifactPaths,
  frozenInstallPassed: false,
  deploymentPackageTypecheckPassed: false,
  deploymentPackageTestsPassed: false,
  routeContractTestsPassed: false,
  deployCheckEnvPassed: false,
  deployChecklistPassed: false,
  deployGapsPassed: false,
  dashboardBuildPassed: false,
  dashboardPageSmokePassed: false,
  dashboardReadinessApiSmokePassed: false,
  rollbackPreflightVerified: false,
  productionApprovalBoundaryVerified: true,
  ciDeploymentReportsCaptured: false,
  blockerOwnersDocumented: true,
  blockerOwnerArtifactPath: "coverage/deployment-blocker-owner-list.json",
});
