import {
  buildWorkspaceRuntimeToolchainReadinessPlan,
  workspaceRuntimeToolchainRequiredEvidence as workspaceRuntimeToolchainPackageRequiredEvidence,
} from "@inkroute/workspace";

export type WorkspaceRuntimeToolchainStatus =
  | "wired"
  | "runtime-gated"
  | "ci-gated"
  | "install-gated"
  | "build-gated";

export interface WorkspaceRuntimeToolchainMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: WorkspaceRuntimeToolchainStatus;
}

export interface WorkspaceRuntimeToolchainRunPersistenceContract {
  readonly model: "WorkspaceRuntimeToolchainRun";
  readonly tenantRelation: "workspaceRuntimeToolchainRuns";
  readonly migration: "20260609032100_add_workspace_runtime_toolchain_runs";
  readonly jsonFields: readonly [
    "commandMatrix",
    "generatedReportManifest",
    "artifactManifest",
    "productionBlockerManifest",
  ];
  readonly evidenceBooleans: readonly [
    "toolchainAuditPassed",
    "packageTypecheckPassed",
    "packageTestsPassed",
    "workspaceToolchainPassed",
    "workspaceAllPassed",
    "dependencyInstallEvidenceCaptured",
    "webBuildEvidenceCaptured",
    "dashboardBuildEvidenceCaptured",
    "ciWorkspaceJobPassed",
    "ciEvidenceCaptured",
    "productionBlockersVisible",
  ];
  readonly artifactFields: readonly [
    "packageTypecheckArtifactPath",
    "packageTestArtifactPath",
    "workspaceToolchainArtifactPath",
    "workspaceAllArtifactPath",
    "dependencyInstallArtifactPath",
    "webBuildArtifactPath",
    "dashboardBuildArtifactPath",
    "ciWorkspaceJobArtifactPath",
    "productionBlockerArtifactPath",
    "ciRunUrl",
  ];
}

export const workspaceRuntimeToolchainRunPersistenceContract: WorkspaceRuntimeToolchainRunPersistenceContract = {
  model: "WorkspaceRuntimeToolchainRun",
  tenantRelation: "workspaceRuntimeToolchainRuns",
  migration: "20260609032100_add_workspace_runtime_toolchain_runs",
  jsonFields: [
    "commandMatrix",
    "generatedReportManifest",
    "artifactManifest",
    "productionBlockerManifest",
  ],
  evidenceBooleans: [
    "toolchainAuditPassed",
    "packageTypecheckPassed",
    "packageTestsPassed",
    "workspaceToolchainPassed",
    "workspaceAllPassed",
    "dependencyInstallEvidenceCaptured",
    "webBuildEvidenceCaptured",
    "dashboardBuildEvidenceCaptured",
    "ciWorkspaceJobPassed",
    "ciEvidenceCaptured",
    "productionBlockersVisible",
  ],
  artifactFields: [
    "packageTypecheckArtifactPath",
    "packageTestArtifactPath",
    "workspaceToolchainArtifactPath",
    "workspaceAllArtifactPath",
    "dependencyInstallArtifactPath",
    "webBuildArtifactPath",
    "dashboardBuildArtifactPath",
    "ciWorkspaceJobArtifactPath",
    "productionBlockerArtifactPath",
    "ciRunUrl",
  ],
};

export const workspaceRuntimeToolchainCommands = [
  "pnpm --filter @inkroute/workspace typecheck",
  "pnpm --filter @inkroute/workspace test",
  "pnpm workspace:toolchain",
  "pnpm workspace:all",
  "pnpm install",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard build",
  "GitHub Actions Phase 18 workspace runtime readiness job",
  "runtime readiness report keeps production blockers visible",
] as const;

export const workspaceRuntimeToolchainGeneratedReports = [
  "docs/workspace/manifests/workspace-import-audit.json",
  "docs/workspace/manifests/package-script-audit.json",
  "docs/workspace/manifests/runtime-evidence-audit.json",
  "docs/workspace/manifests/runtime-readiness.json",
  "docs/workspace/manifests/workspace-required-checks-audit.json",
  "docs/workspace/manifests/workspace-toolchain-readiness-audit.json",
] as const;

export const workspaceRuntimeToolchainArtifactPaths = [
  "coverage/workspace-runtime-toolchain.json",
  "coverage/workspace-package-typecheck.txt",
  "coverage/workspace-package-test.txt",
  "coverage/workspace-toolchain-output.txt",
  "coverage/workspace-all-output.txt",
  "coverage/workspace-install-output.txt",
  "coverage/workspace-web-build-output.txt",
  "coverage/workspace-dashboard-build-output.txt",
  "coverage/workspace-ci-job.json",
  "coverage/workspace-production-blockers.json",
  "coverage/workspace-runtime-redacted-evidence-bundle.json",
  "test-results/workspace-runtime-toolchain",
] as const;

export const workspaceRuntimeToolchainProofFiles = [
  "apps/dashboard/package.json",
  "apps/web/package.json",
  "packages/workspace/src/index.ts",
  "packages/workspace/tests/workspace-audit.test.ts",
  "packages/workspace/package.json",
  "scripts/workspace/audit-workspace-imports.mjs",
  "scripts/workspace/audit-package-scripts.mjs",
  "scripts/workspace/print-runtime-readiness.mjs",
  "scripts/workspace/verify-workspace-toolchain.mjs",
  "docs/workspace/README.md",
  "docs/workspace/WORKSPACE_AUDIT_PROTOCOL.md",
  "docs/workspace/manifests/workspace-import-audit.json",
  "docs/workspace/manifests/package-script-audit.json",
  "docs/workspace/manifests/runtime-evidence-audit.json",
  "docs/workspace/manifests/runtime-readiness.json",
  "docs/workspace/manifests/workspace-required-checks-audit.json",
  "docs/workspace/manifests/workspace-toolchain-readiness-audit.json",
  "apps/web/lib/workspaceRuntimeToolchain.ts",
  "apps/web/tests/workspace-runtime-toolchain-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609032100_add_workspace_runtime_toolchain_runs/migration.sql",
  "package.json",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "scripts/quality/print-quality-gates.mjs",
  "packages/quality/src/index.ts",
  "packages/quality/tests/quality-gates.test.ts",
] as const;

export type WorkspaceRuntimeToolchainCommand = (typeof workspaceRuntimeToolchainCommands)[number];
export type WorkspaceRuntimeToolchainArtifact = (typeof workspaceRuntimeToolchainArtifactPaths)[number];
export type WorkspaceRuntimeToolchainGeneratedReport = (typeof workspaceRuntimeToolchainGeneratedReports)[number];

export interface WorkspaceRuntimeToolchainEvidenceInput {
  readonly toolchainAuditPassed: boolean;
  readonly packageTypecheckPassed: boolean;
  readonly packageTestsPassed: boolean;
  readonly workspaceToolchainPassed: boolean;
  readonly workspaceAllPassed: boolean;
  readonly dependencyInstallEvidenceCaptured: boolean;
  readonly webBuildEvidenceCaptured: boolean;
  readonly dashboardBuildEvidenceCaptured: boolean;
  readonly ciWorkspaceJobPassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly productionBlockersVisible: boolean;
  readonly workspaceRuntimeToolchainRunPersisted: boolean;
  readonly redactedEvidenceBundleCaptured: boolean;
  readonly capturedReports: readonly WorkspaceRuntimeToolchainGeneratedReport[];
  readonly capturedArtifacts: readonly WorkspaceRuntimeToolchainArtifact[];
  readonly completedCommands: readonly WorkspaceRuntimeToolchainCommand[];
}

export interface WorkspaceRuntimeToolchainEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingReports: readonly WorkspaceRuntimeToolchainGeneratedReport[];
  readonly missingArtifacts: readonly WorkspaceRuntimeToolchainArtifact[];
  readonly missingCommands: readonly WorkspaceRuntimeToolchainCommand[];
  readonly requiredReports: readonly WorkspaceRuntimeToolchainGeneratedReport[];
  readonly requiredArtifacts: typeof workspaceRuntimeToolchainArtifactPaths;
  readonly requiredCommands: typeof workspaceRuntimeToolchainCommands;
  readonly requiredEvidence: typeof workspaceRuntimeToolchainRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface WorkspaceRuntimeToolchainExecutionPlan {
  readonly localCommands: typeof workspaceRuntimeToolchainLocalCommands;
  readonly externalCommands: typeof workspaceRuntimeToolchainExternalCommands;
  readonly localArtifacts: typeof workspaceRuntimeToolchainLocalArtifacts;
  readonly externalArtifacts: typeof workspaceRuntimeToolchainExternalArtifacts;
  readonly packageTypecheckExecutionAllowed: false;
  readonly packageTestExecutionAllowed: false;
  readonly workspaceToolchainExecutionAllowed: false;
  readonly workspaceAllExecutionAllowed: false;
  readonly dependencyInstallExecutionAllowed: false;
  readonly webBuildExecutionAllowed: false;
  readonly dashboardBuildExecutionAllowed: false;
  readonly ciWorkspaceJobExecutionAllowed: false;
  readonly productionBlockerVisibilityExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly executionPolicy: WorkspaceRuntimeToolchainExecutionPolicy;
  readonly requiredExternalEvidence: typeof workspaceRuntimeToolchainRequiredExternalEvidence;
}

export interface WorkspaceRuntimeToolchainArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof workspaceRuntimeToolchainRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export interface WorkspaceRuntimeToolchainRedactedEvidenceBundle {
  readonly status: "redacted-evidence-bundle-ready";
  readonly artifactPath: "coverage/workspace-runtime-redacted-evidence-bundle.json";
  readonly review: WorkspaceRuntimeToolchainArtifactReview;
  readonly requiredArtifacts: typeof workspaceRuntimeToolchainArtifactPaths;
  readonly requiredExternalEvidence: typeof workspaceRuntimeToolchainRequiredExternalEvidence;
  readonly providerExecutionAllowed: false;
}

export const workspaceRuntimeToolchainLocalCommands = [
  "pnpm --filter @inkroute/workspace typecheck",
  "pnpm --filter @inkroute/workspace test",
  "pnpm workspace:toolchain",
  "pnpm workspace:all",
  "runtime readiness report keeps production blockers visible",
] as const satisfies readonly WorkspaceRuntimeToolchainCommand[];

export const workspaceRuntimeToolchainExternalCommands = [
  "pnpm install",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard build",
  "GitHub Actions Phase 18 workspace runtime readiness job",
] as const satisfies readonly WorkspaceRuntimeToolchainCommand[];

export const workspaceRuntimeToolchainRequiredExternalEvidence = [
  "@inkroute/workspace package typecheck/test and workspace:toolchain/workspace:all output captured as artifacts.",
  "pnpm install evidence captured after dependency resolution.",
  "Web and dashboard build output captured from the target workspace.",
  "GitHub Actions Phase 18 workspace runtime readiness job URL and conclusion.",
  "Durable WorkspaceRuntimeToolchainRun persistence row captured from the target database.",
  "Runtime readiness report keeps production blockers visible in redacted evidence.",
  "Redacted workspace runtime evidence bundle captured without raw install logs, CI URLs, database URLs, tokens, or operator identifiers.",
] as const;

export const workspaceRuntimeToolchainLocalArtifacts = [
  "coverage/workspace-runtime-toolchain.json",
  "coverage/workspace-package-typecheck.txt",
  "coverage/workspace-package-test.txt",
  "coverage/workspace-toolchain-output.txt",
  "coverage/workspace-all-output.txt",
  "coverage/workspace-production-blockers.json",
] as const satisfies readonly WorkspaceRuntimeToolchainArtifact[];

export const workspaceRuntimeToolchainExternalArtifacts = [
  "coverage/workspace-install-output.txt",
  "coverage/workspace-web-build-output.txt",
  "coverage/workspace-dashboard-build-output.txt",
  "coverage/workspace-ci-job.json",
  "coverage/workspace-runtime-redacted-evidence-bundle.json",
  "test-results/workspace-runtime-toolchain",
] as const satisfies readonly WorkspaceRuntimeToolchainArtifact[];

export const workspaceRuntimeToolchainReadinessRequiredEvidence =
  workspaceRuntimeToolchainPackageRequiredEvidence;

export function buildWorkspaceRuntimeToolchainDecisionRequiredEvidence(
  readinessEvidence: typeof workspaceRuntimeToolchainReadinessRequiredEvidence,
): WorkspaceRuntimeToolchainRequiredEvidence {
  return [
    ...readinessEvidence,
    "WorkspaceRuntimeToolchainRun row with command, generated report, artifact, and production blocker matrices.",
    "Artifact bundle proving workspace package typecheck/test, workspace toolchain/all, dependency install, web build, dashboard build, CI workspace job, and production blocker visibility evidence.",
  ];
}

export type WorkspaceRuntimeToolchainRequiredEvidence = readonly [
  ...typeof workspaceRuntimeToolchainReadinessRequiredEvidence,
  "WorkspaceRuntimeToolchainRun row with command, generated report, artifact, and production blocker matrices.",
  "Artifact bundle proving workspace package typecheck/test, workspace toolchain/all, dependency install, web build, dashboard build, CI workspace job, and production blocker visibility evidence.",
];

export const workspaceRuntimeToolchainRequiredEvidence = buildWorkspaceRuntimeToolchainDecisionRequiredEvidence(
  workspaceRuntimeToolchainReadinessRequiredEvidence,
);

export type WorkspaceRuntimeToolchainExecutionPolicy = {
  readonly codexMayClassifyStaticWorkspaceToolchain: true;
  readonly packageRuntimeProofRequiredForClosure: true;
  readonly installAndBuildEvidenceRequiredForClosure: true;
  readonly ciWorkspaceEvidenceRequiredForClosure: true;
  readonly productionBlockerVisibilityRequiredForClosure: true;
  readonly providerDatabaseRequiredForPersistence: true;
};

export const workspaceRuntimeToolchainExecutionPolicy: WorkspaceRuntimeToolchainExecutionPolicy = {
  codexMayClassifyStaticWorkspaceToolchain: true,
  packageRuntimeProofRequiredForClosure: true,
  installAndBuildEvidenceRequiredForClosure: true,
  ciWorkspaceEvidenceRequiredForClosure: true,
  productionBlockerVisibilityRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
};

export const workspaceRuntimeToolchainMatrix = [
  {
    id: "workspace-package-typecheck",
    command: "pnpm --filter @inkroute/workspace typecheck",
    artifact: "coverage/workspace-package-typecheck.txt",
    status: "runtime-gated",
  },
  {
    id: "workspace-package-test",
    command: "pnpm --filter @inkroute/workspace test",
    artifact: "coverage/workspace-package-test.txt",
    status: "runtime-gated",
  },
  {
    id: "workspace-toolchain",
    command: "pnpm workspace:toolchain",
    artifact: "coverage/workspace-toolchain-output.txt",
    status: "wired",
  },
  {
    id: "workspace-all",
    command: "pnpm workspace:all",
    artifact: "coverage/workspace-all-output.txt",
    status: "runtime-gated",
  },
  {
    id: "dependency-install",
    command: "pnpm install",
    artifact: "coverage/workspace-install-output.txt",
    status: "install-gated",
  },
  {
    id: "web-build",
    command: "pnpm --filter @inkroute/web build",
    artifact: "coverage/workspace-web-build-output.txt",
    status: "build-gated",
  },
  {
    id: "dashboard-build",
    command: "pnpm --filter @inkroute/dashboard build",
    artifact: "coverage/workspace-dashboard-build-output.txt",
    status: "build-gated",
  },
  {
    id: "ci-workspace-job",
    command: "GitHub Actions Phase 18 workspace runtime readiness job",
    artifact: "coverage/workspace-ci-job.json",
    status: "ci-gated",
  },
  {
    id: "production-blocker-visibility",
    command: "runtime readiness report keeps production blockers visible",
    artifact: "coverage/workspace-production-blockers.json",
    status: "wired",
  },
  {
    id: "redacted-evidence-bundle",
    command: "retain redacted workspace runtime evidence bundle",
    artifact: "coverage/workspace-runtime-redacted-evidence-bundle.json",
    status: "ci-gated",
  },
] as const satisfies readonly WorkspaceRuntimeToolchainMatrixEntry[];

export const workspaceRuntimeToolchainReadiness = buildWorkspaceRuntimeToolchainReadinessPlan({
  toolchainAuditStatus: "pass",
  packageTypecheckPassed: false,
  packageTestsPassed: false,
  workspaceToolchainPassed: false,
  workspaceAllPassed: false,
  requiredGeneratedReports: workspaceRuntimeToolchainGeneratedReports,
  generatedReports: [...workspaceRuntimeToolchainGeneratedReports],
  ciWorkspaceJobPassed: false,
  ciEvidenceCaptured: false,
  dependencyInstallEvidenceCaptured: false,
  appBuildEvidenceCaptured: false,
  productionBlockersVisible: true,
});

export function buildWorkspaceRuntimeToolchainEvidenceDecision(
  input: WorkspaceRuntimeToolchainEvidenceInput,
): WorkspaceRuntimeToolchainEvidenceDecision {
  const capturedReports = new Set(input.capturedReports);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingReports = workspaceRuntimeToolchainGeneratedReports.filter((report) => !capturedReports.has(report));
  const missingArtifacts = workspaceRuntimeToolchainArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = workspaceRuntimeToolchainCommands.filter((command) => !completedCommands.has(command));
  const readinessPlan = buildWorkspaceRuntimeToolchainReadinessPlan({
    toolchainAuditStatus: input.toolchainAuditPassed ? "pass" : "fail",
    packageTypecheckPassed: input.packageTypecheckPassed,
    packageTestsPassed: input.packageTestsPassed,
    workspaceToolchainPassed: input.workspaceToolchainPassed,
    workspaceAllPassed: input.workspaceAllPassed,
    requiredGeneratedReports: workspaceRuntimeToolchainGeneratedReports,
    generatedReports: input.capturedReports,
    ciWorkspaceJobPassed: input.ciWorkspaceJobPassed,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    dependencyInstallEvidenceCaptured: input.dependencyInstallEvidenceCaptured,
    appBuildEvidenceCaptured: input.webBuildEvidenceCaptured && input.dashboardBuildEvidenceCaptured,
    productionBlockersVisible: input.productionBlockersVisible,
  });
  const blockers = [...readinessPlan.blockers];

  if (!input.workspaceRuntimeToolchainRunPersisted) {
    blockers.push("WorkspaceRuntimeToolchainRun persistence row must be captured for durable auditability.");
  }
  if (!input.redactedEvidenceBundleCaptured) {
    blockers.push("Redacted workspace runtime evidence bundle must be captured.");
  }
  if (missingReports.length > 0) {
    blockers.push("Every required workspace runtime report must be captured.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required workspace runtime artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required workspace runtime command must be completed.");
  }

  return {
    status: blockers.length === 0 && missingReports.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    missingReports,
    missingArtifacts,
    missingCommands,
    requiredReports: workspaceRuntimeToolchainGeneratedReports,
    requiredArtifacts: workspaceRuntimeToolchainArtifactPaths,
    requiredCommands: workspaceRuntimeToolchainCommands,
    requiredEvidence: workspaceRuntimeToolchainRequiredEvidence,
    blockers,
  };
}

const sensitiveWorkspaceToolchainKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|tenant|user|account|database|url|uri|dsn|key|id|workspace|repository|branch)$/iu;
const sensitiveWorkspaceToolchainValuePattern =
  /(https?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|[A-Za-z0-9_-]{24,})/giu;

const redactWorkspaceToolchainString = (value: string): string =>
  value.replace(sensitiveWorkspaceToolchainValuePattern, "[REDACTED]");

const buildRedactedWorkspaceToolchainValue = (
  value: unknown,
  path: string,
  redactions: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item, index) => buildRedactedWorkspaceToolchainValue(item, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveWorkspaceToolchainKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedWorkspaceToolchainValue(nestedValue, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redactedValue = redactWorkspaceToolchainString(value);
    if (redactedValue !== value) {
      redactions.push(path || "value");
    }
    return redactedValue;
  }

  return value;
};

export function buildWorkspaceRuntimeToolchainExecutionPlan(): WorkspaceRuntimeToolchainExecutionPlan {
  return {
    localCommands: workspaceRuntimeToolchainLocalCommands,
    externalCommands: workspaceRuntimeToolchainExternalCommands,
    localArtifacts: workspaceRuntimeToolchainLocalArtifacts,
    externalArtifacts: workspaceRuntimeToolchainExternalArtifacts,
    packageTypecheckExecutionAllowed: false,
    packageTestExecutionAllowed: false,
    workspaceToolchainExecutionAllowed: false,
    workspaceAllExecutionAllowed: false,
    dependencyInstallExecutionAllowed: false,
    webBuildExecutionAllowed: false,
    dashboardBuildExecutionAllowed: false,
    ciWorkspaceJobExecutionAllowed: false,
    productionBlockerVisibilityExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    executionPolicy: workspaceRuntimeToolchainExecutionPolicy,
    requiredExternalEvidence: workspaceRuntimeToolchainRequiredExternalEvidence,
  };
}

export function buildRedactedWorkspaceRuntimeToolchainArtifact(artifact: unknown): unknown {
  return buildRedactedWorkspaceToolchainValue(artifact, "", []);
}

export function buildWorkspaceRuntimeToolchainArtifactReview(
  artifact: unknown,
): WorkspaceRuntimeToolchainArtifactReview {
  const redactions: string[] = [];

  return {
    artifact: buildRedactedWorkspaceToolchainValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: workspaceRuntimeToolchainRequiredExternalEvidence,
    safeForTracker: true,
  };
}

export function buildWorkspaceRuntimeToolchainRedactedEvidenceBundle(
  artifact: unknown,
): WorkspaceRuntimeToolchainRedactedEvidenceBundle {
  return {
    status: "redacted-evidence-bundle-ready",
    artifactPath: "coverage/workspace-runtime-redacted-evidence-bundle.json",
    review: buildWorkspaceRuntimeToolchainArtifactReview(artifact),
    requiredArtifacts: workspaceRuntimeToolchainArtifactPaths,
    requiredExternalEvidence: workspaceRuntimeToolchainRequiredExternalEvidence,
    providerExecutionAllowed: false,
  };
}


