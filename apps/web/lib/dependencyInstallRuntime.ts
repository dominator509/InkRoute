import {
  buildDependencyInstallReadinessPlan,
  dependencyInstallRequiredEvidence as dependencyInstallPackageRequiredEvidence,
  dependencyInstallRequiredCommands,
} from "@inkroute/workspace";

export type DependencyInstallRuntimeStatus =
  | "wired"
  | "install-gated"
  | "ci-gated"
  | "quality-gated";

export interface DependencyInstallRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DependencyInstallRuntimeStatus;
}

export interface DependencyInstallRunPersistenceContract {
  readonly model: "DependencyInstallRun";
  readonly tenantRelation: "dependencyInstallRuns";
  readonly migration: "20260609032500_add_dependency_install_runs";
  readonly jsonFields: readonly [
    "commandMatrix",
    "sourceFileManifest",
    "artifactManifest",
    "productionBlockerManifest",
  ];
  readonly evidenceBooleans: readonly [
    "packageJsonPresent",
    "pnpmWorkspacePresent",
    "pnpmLockfilePresent",
    "packageManagerPinned",
    "lockfileCommitted",
    "corepackEnabled",
    "installCommandPassed",
    "frozenLockfileInstallPassed",
    "workspaceAuditPassed",
    "typecheckPassed",
    "lintPassed",
    "unitTestsPassed",
    "ciQualityJobPassed",
    "ciEvidenceCaptured",
    "productionBlockersVisible",
  ];
  readonly artifactFields: readonly [
    "corepackArtifactPath",
    "installArtifactPath",
    "frozenLockfileArtifactPath",
    "workspaceAllArtifactPath",
    "typecheckArtifactPath",
    "lintArtifactPath",
    "unitTestArtifactPath",
    "ciQualityJobArtifactPath",
    "productionBlockerArtifactPath",
    "ciRunUrl",
  ];
}

export const dependencyInstallRunPersistenceContract: DependencyInstallRunPersistenceContract = {
  model: "DependencyInstallRun",
  tenantRelation: "dependencyInstallRuns",
  migration: "20260609032500_add_dependency_install_runs",
  jsonFields: [
    "commandMatrix",
    "sourceFileManifest",
    "artifactManifest",
    "productionBlockerManifest",
  ],
  evidenceBooleans: [
    "packageJsonPresent",
    "pnpmWorkspacePresent",
    "pnpmLockfilePresent",
    "packageManagerPinned",
    "lockfileCommitted",
    "corepackEnabled",
    "installCommandPassed",
    "frozenLockfileInstallPassed",
    "workspaceAuditPassed",
    "typecheckPassed",
    "lintPassed",
    "unitTestsPassed",
    "ciQualityJobPassed",
    "ciEvidenceCaptured",
    "productionBlockersVisible",
  ],
  artifactFields: [
    "corepackArtifactPath",
    "installArtifactPath",
    "frozenLockfileArtifactPath",
    "workspaceAllArtifactPath",
    "typecheckArtifactPath",
    "lintArtifactPath",
    "unitTestArtifactPath",
    "ciQualityJobArtifactPath",
    "productionBlockerArtifactPath",
    "ciRunUrl",
  ],
};

export const dependencyInstallRuntimeCommands = dependencyInstallRequiredCommands;

export const dependencyInstallSourceFiles = [
  "package.json",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
] as const;

export const dependencyInstallArtifactPaths = [
  "coverage/dependency-install-runtime.json",
  "coverage/dependency-corepack-output.txt",
  "coverage/dependency-install-output.txt",
  "coverage/dependency-frozen-lockfile-output.txt",
  "coverage/dependency-workspace-all-output.txt",
  "coverage/dependency-typecheck-output.txt",
  "coverage/dependency-lint-output.txt",
  "coverage/dependency-unit-output.txt",
  "coverage/dependency-ci-quality-job.json",
  "coverage/dependency-production-blockers.json",
  "coverage/dependency-install-redacted-evidence-bundle.json",
  "test-results/dependency-install-runtime",
] as const;

export const dependencyInstallProofFiles = [
  "package.json",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  "packages/workspace/src/index.ts",
  "packages/workspace/tests/workspace-audit.test.ts",
  "docs/workspace/manifests/runtime-evidence.json",
  "apps/web/lib/dependencyInstallRuntime.ts",
  "apps/web/tests/dependency-install-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609032500_add_dependency_install_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type DependencyInstallRuntimeCommand = (typeof dependencyInstallRuntimeCommands)[number];
export type DependencyInstallSourceFile = (typeof dependencyInstallSourceFiles)[number];
export type DependencyInstallArtifact = (typeof dependencyInstallArtifactPaths)[number];

export interface DependencyInstallRedactedEvidenceBundle {
  readonly status: "redacted-evidence-bundle-ready";
  readonly artifactPath: "coverage/dependency-install-redacted-evidence-bundle.json";
  readonly redactedArtifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredArtifacts: typeof dependencyInstallArtifactPaths;
  readonly requiredExternalEvidence: typeof dependencyInstallRequiredExternalEvidence;
  readonly providerExecutionAllowed: false;
}

export interface DependencyInstallEvidenceInput {
  readonly packageJsonPresent: boolean;
  readonly pnpmWorkspacePresent: boolean;
  readonly pnpmLockfilePresent: boolean;
  readonly packageManagerPinned: boolean;
  readonly lockfileCommitted: boolean;
  readonly corepackEnabled: boolean;
  readonly installCommandPassed: boolean;
  readonly frozenLockfileInstallPassed: boolean;
  readonly workspaceAuditPassed: boolean;
  readonly typecheckPassed: boolean;
  readonly lintPassed: boolean;
  readonly unitTestsPassed: boolean;
  readonly ciQualityJobPassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly productionBlockersVisible: boolean;
  readonly dependencyInstallRunPersisted: boolean;
  readonly presentSourceFiles: readonly DependencyInstallSourceFile[];
  readonly capturedArtifacts: readonly DependencyInstallArtifact[];
  readonly completedCommands: readonly DependencyInstallRuntimeCommand[];
}

export interface DependencyInstallRunRecordInput extends DependencyInstallEvidenceInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha?: string | null;
  readonly status: "complete" | "blocked";
  readonly productionBlockerManifest?: readonly string[];
  readonly corepackArtifactPath?: string | null;
  readonly installArtifactPath?: string | null;
  readonly frozenLockfileArtifactPath?: string | null;
  readonly workspaceAllArtifactPath?: string | null;
  readonly typecheckArtifactPath?: string | null;
  readonly lintArtifactPath?: string | null;
  readonly unitTestArtifactPath?: string | null;
  readonly ciQualityJobArtifactPath?: string | null;
  readonly productionBlockerArtifactPath?: string | null;
  readonly ciRunUrl?: string | null;
}

export interface DependencyInstallRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string | null;
  readonly status: string;
  readonly commandMatrix: readonly DependencyInstallRuntimeMatrixEntry[];
  readonly sourceFileManifest: readonly DependencyInstallSourceFile[];
  readonly artifactManifest: readonly DependencyInstallArtifact[];
  readonly productionBlockerManifest: readonly string[];
  readonly packageJsonPresent: boolean;
  readonly pnpmWorkspacePresent: boolean;
  readonly pnpmLockfilePresent: boolean;
  readonly packageManagerPinned: boolean;
  readonly lockfileCommitted: boolean;
  readonly corepackEnabled: boolean;
  readonly installCommandPassed: boolean;
  readonly frozenLockfileInstallPassed: boolean;
  readonly workspaceAuditPassed: boolean;
  readonly typecheckPassed: boolean;
  readonly lintPassed: boolean;
  readonly unitTestsPassed: boolean;
  readonly ciQualityJobPassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly productionBlockersVisible: boolean;
  readonly corepackArtifactPath: string | null;
  readonly installArtifactPath: string | null;
  readonly frozenLockfileArtifactPath: string | null;
  readonly workspaceAllArtifactPath: string | null;
  readonly typecheckArtifactPath: string | null;
  readonly lintArtifactPath: string | null;
  readonly unitTestArtifactPath: string | null;
  readonly ciQualityJobArtifactPath: string | null;
  readonly productionBlockerArtifactPath: string | null;
  readonly ciRunUrl: string | null;
}

export interface DependencyInstallRunRepository {
  readonly dependencyInstallRun: {
    upsert(input: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: DependencyInstallRunData;
      readonly update: Omit<DependencyInstallRunData, "tenantId" | "runId">;
    }): Promise<unknown>;
  };
}

export interface DependencyInstallEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingSourceFiles: readonly DependencyInstallSourceFile[];
  readonly missingArtifacts: readonly DependencyInstallArtifact[];
  readonly missingCommands: readonly DependencyInstallRuntimeCommand[];
  readonly requiredSourceFiles: readonly DependencyInstallSourceFile[];
  readonly requiredArtifacts: typeof dependencyInstallArtifactPaths;
  readonly requiredCommands: typeof dependencyInstallRuntimeCommands;
  readonly requiredEvidence: typeof dependencyInstallRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface DependencyInstallExecutionPolicy {
  readonly codexMayClassifyStaticDependencyReadiness: true;
  readonly localInstallOutputRequiredForClosure: true;
  readonly frozenLockfileOutputRequiredForClosure: true;
  readonly workspaceQualityOutputRequiredForClosure: true;
  readonly ciQualityEvidenceRequiredForClosure: true;
  readonly providerPersistenceRequiredForClosure: true;
  readonly productionBlockerArtifactRequiredForClosure: true;
}

export interface DependencyInstallExecutionPlan {
  readonly localCommands: typeof dependencyInstallRuntimeCommands;
  readonly artifactPaths: typeof dependencyInstallArtifactPaths;
  readonly proofFiles: typeof dependencyInstallProofFiles;
  readonly commandExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly providerPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof dependencyInstallExecutionPolicy;
  readonly requiredExternalEvidence: typeof dependencyInstallRequiredExternalEvidence;
}

export const dependencyInstallExecutionPolicy: DependencyInstallExecutionPolicy = {
  codexMayClassifyStaticDependencyReadiness: true,
  localInstallOutputRequiredForClosure: true,
  frozenLockfileOutputRequiredForClosure: true,
  workspaceQualityOutputRequiredForClosure: true,
  ciQualityEvidenceRequiredForClosure: true,
  providerPersistenceRequiredForClosure: true,
  productionBlockerArtifactRequiredForClosure: true,
};

export const dependencyInstallRequiredExternalEvidence = [
  "Live pnpm install output from the working environment.",
  "Frozen-lockfile install output from CI or a clean checkout.",
  "Typecheck, lint, unit-test, and workspace audit output after install.",
  "GitHub Actions CI quality job evidence.",
  "Provider-backed persistDependencyInstallRun execution evidence.",
  "Production-blocker visibility artifact evidence.",
  "Redacted dependency install evidence bundle captured without raw install logs, tokens, URLs, environment values, or actor identifiers.",
] as const;

export const dependencyInstallReadinessRequiredEvidence = dependencyInstallPackageRequiredEvidence;

export type DependencyInstallRequiredEvidence = readonly [
  ...typeof dependencyInstallReadinessRequiredEvidence,
  "DependencyInstallRun row with command, source file, artifact, and production blocker matrices.",
  "Artifact bundle proving corepack, pnpm install, frozen-lockfile install, workspace audit, typecheck, lint, unit tests, CI quality job, and production blocker visibility.",
];

export function buildDependencyInstallDecisionRequiredEvidence(
  readinessEvidence: typeof dependencyInstallReadinessRequiredEvidence,
): DependencyInstallRequiredEvidence {
  return [
    ...readinessEvidence,
    "DependencyInstallRun row with command, source file, artifact, and production blocker matrices.",
    "Artifact bundle proving corepack, pnpm install, frozen-lockfile install, workspace audit, typecheck, lint, unit tests, CI quality job, and production blocker visibility.",
  ];
}

export const dependencyInstallRequiredEvidence = buildDependencyInstallDecisionRequiredEvidence(
  dependencyInstallReadinessRequiredEvidence,
);

export function buildDependencyInstallExecutionPlan(): DependencyInstallExecutionPlan {
  return {
    localCommands: dependencyInstallRuntimeCommands,
    artifactPaths: dependencyInstallArtifactPaths,
    proofFiles: dependencyInstallProofFiles,
    commandExecutionAllowed: false,
    ciExecutionAllowed: false,
    providerPersistenceExecutionAllowed: false,
    executionPolicy: dependencyInstallExecutionPolicy,
    requiredExternalEvidence: dependencyInstallRequiredExternalEvidence,
  };
}

export const dependencyInstallRuntimeMatrix = [
  {
    id: "package-manager-corepack",
    command: "corepack enable",
    artifact: "coverage/dependency-corepack-output.txt",
    status: "install-gated",
  },
  {
    id: "dependency-install",
    command: "pnpm install",
    artifact: "coverage/dependency-install-output.txt",
    status: "install-gated",
  },
  {
    id: "frozen-lockfile-install",
    command: "pnpm install --frozen-lockfile",
    artifact: "coverage/dependency-frozen-lockfile-output.txt",
    status: "ci-gated",
  },
  {
    id: "workspace-audit-after-install",
    command: "pnpm workspace:all",
    artifact: "coverage/dependency-workspace-all-output.txt",
    status: "quality-gated",
  },
  {
    id: "typecheck-after-install",
    command: "pnpm typecheck",
    artifact: "coverage/dependency-typecheck-output.txt",
    status: "quality-gated",
  },
  {
    id: "lint-after-install",
    command: "pnpm lint",
    artifact: "coverage/dependency-lint-output.txt",
    status: "quality-gated",
  },
  {
    id: "unit-tests-after-install",
    command: "pnpm test:unit",
    artifact: "coverage/dependency-unit-output.txt",
    status: "quality-gated",
  },
  {
    id: "ci-quality-job",
    command: "GitHub Actions CI quality job",
    artifact: "coverage/dependency-ci-quality-job.json",
    status: "ci-gated",
  },
  {
    id: "production-blocker-visibility",
    command: "dependency readiness report keeps provider/runtime/legal blockers visible",
    artifact: "coverage/dependency-production-blockers.json",
    status: "wired",
  },
  {
    id: "redacted-evidence-bundle",
    command: "retain redacted dependency install evidence bundle",
    artifact: "coverage/dependency-install-redacted-evidence-bundle.json",
    status: "ci-gated",
  },
] as const satisfies readonly DependencyInstallRuntimeMatrixEntry[];

export const dependencyInstallReadiness = buildDependencyInstallReadinessPlan({
  packageJsonPresent: true,
  pnpmWorkspacePresent: true,
  pnpmLockfilePresent: true,
  packageManagerPinned: true,
  lockfileCommitted: true,
  installCommandPassed: false,
  frozenLockfileInstallPassed: false,
  typecheckPassed: false,
  lintPassed: false,
  unitTestsPassed: false,
  workspaceAuditPassed: false,
  ciEvidenceCaptured: false,
  productionBlockersVisible: true,
});

export function buildDependencyInstallEvidenceDecision(
  input: DependencyInstallEvidenceInput,
): DependencyInstallEvidenceDecision {
  const presentSourceFiles = new Set(input.presentSourceFiles);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingSourceFiles = dependencyInstallSourceFiles.filter((file) => !presentSourceFiles.has(file));
  const missingArtifacts = dependencyInstallArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = dependencyInstallRuntimeCommands.filter((command) => !completedCommands.has(command));
  const readinessPlan = buildDependencyInstallReadinessPlan({
    packageJsonPresent: input.packageJsonPresent,
    pnpmWorkspacePresent: input.pnpmWorkspacePresent,
    pnpmLockfilePresent: input.pnpmLockfilePresent,
    packageManagerPinned: input.packageManagerPinned,
    lockfileCommitted: input.lockfileCommitted,
    installCommandPassed: input.installCommandPassed,
    frozenLockfileInstallPassed: input.frozenLockfileInstallPassed,
    typecheckPassed: input.typecheckPassed,
    lintPassed: input.lintPassed,
    unitTestsPassed: input.unitTestsPassed,
    workspaceAuditPassed: input.workspaceAuditPassed,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    productionBlockersVisible: input.productionBlockersVisible,
  });
  const blockers = [...readinessPlan.blockers];

  if (!input.corepackEnabled) {
    blockers.push("corepack enable must pass before dependency install evidence is complete.");
  }
  if (!input.ciQualityJobPassed) {
    blockers.push("GitHub Actions CI quality job must pass.");
  }
  if (!input.dependencyInstallRunPersisted) {
    blockers.push("DependencyInstallRun persistence row must be captured for durable auditability.");
  }
  if (missingSourceFiles.length > 0) {
    blockers.push("Every required dependency source file must be present.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required dependency install artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required dependency install command must be completed.");
  }

  return {
    status:
      blockers.length === 0 && missingSourceFiles.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0
        ? "complete"
        : "blocked",
    missingSourceFiles,
    missingArtifacts,
    missingCommands,
    requiredSourceFiles: dependencyInstallSourceFiles,
    requiredArtifacts: dependencyInstallArtifactPaths,
    requiredCommands: dependencyInstallRuntimeCommands,
    requiredEvidence: dependencyInstallRequiredEvidence,
    blockers,
  };
}

export function buildDependencyInstallRunData(input: DependencyInstallRunRecordInput): DependencyInstallRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha ?? null,
    status: input.status,
    commandMatrix: dependencyInstallRuntimeMatrix,
    sourceFileManifest: input.presentSourceFiles,
    artifactManifest: input.capturedArtifacts,
    productionBlockerManifest: input.productionBlockerManifest ?? [
      "provider/runtime/legal blockers remain visible outside dependency install proof",
    ],
    packageJsonPresent: input.packageJsonPresent,
    pnpmWorkspacePresent: input.pnpmWorkspacePresent,
    pnpmLockfilePresent: input.pnpmLockfilePresent,
    packageManagerPinned: input.packageManagerPinned,
    lockfileCommitted: input.lockfileCommitted,
    corepackEnabled: input.corepackEnabled,
    installCommandPassed: input.installCommandPassed,
    frozenLockfileInstallPassed: input.frozenLockfileInstallPassed,
    workspaceAuditPassed: input.workspaceAuditPassed,
    typecheckPassed: input.typecheckPassed,
    lintPassed: input.lintPassed,
    unitTestsPassed: input.unitTestsPassed,
    ciQualityJobPassed: input.ciQualityJobPassed,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    productionBlockersVisible: input.productionBlockersVisible,
    corepackArtifactPath: input.corepackArtifactPath ?? null,
    installArtifactPath: input.installArtifactPath ?? null,
    frozenLockfileArtifactPath: input.frozenLockfileArtifactPath ?? null,
    workspaceAllArtifactPath: input.workspaceAllArtifactPath ?? null,
    typecheckArtifactPath: input.typecheckArtifactPath ?? null,
    lintArtifactPath: input.lintArtifactPath ?? null,
    unitTestArtifactPath: input.unitTestArtifactPath ?? null,
    ciQualityJobArtifactPath: input.ciQualityJobArtifactPath ?? null,
    productionBlockerArtifactPath: input.productionBlockerArtifactPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export async function persistDependencyInstallRun(
  repository: DependencyInstallRunRepository,
  input: DependencyInstallRunRecordInput,
): Promise<unknown> {
  const data = buildDependencyInstallRunData(input);
  const update = {
    commitSha: data.commitSha,
    status: data.status,
    commandMatrix: data.commandMatrix,
    sourceFileManifest: data.sourceFileManifest,
    artifactManifest: data.artifactManifest,
    productionBlockerManifest: data.productionBlockerManifest,
    packageJsonPresent: data.packageJsonPresent,
    pnpmWorkspacePresent: data.pnpmWorkspacePresent,
    pnpmLockfilePresent: data.pnpmLockfilePresent,
    packageManagerPinned: data.packageManagerPinned,
    lockfileCommitted: data.lockfileCommitted,
    corepackEnabled: data.corepackEnabled,
    installCommandPassed: data.installCommandPassed,
    frozenLockfileInstallPassed: data.frozenLockfileInstallPassed,
    workspaceAuditPassed: data.workspaceAuditPassed,
    typecheckPassed: data.typecheckPassed,
    lintPassed: data.lintPassed,
    unitTestsPassed: data.unitTestsPassed,
    ciQualityJobPassed: data.ciQualityJobPassed,
    ciEvidenceCaptured: data.ciEvidenceCaptured,
    productionBlockersVisible: data.productionBlockersVisible,
    corepackArtifactPath: data.corepackArtifactPath,
    installArtifactPath: data.installArtifactPath,
    frozenLockfileArtifactPath: data.frozenLockfileArtifactPath,
    workspaceAllArtifactPath: data.workspaceAllArtifactPath,
    typecheckArtifactPath: data.typecheckArtifactPath,
    lintArtifactPath: data.lintArtifactPath,
    unitTestArtifactPath: data.unitTestArtifactPath,
    ciQualityJobArtifactPath: data.ciQualityJobArtifactPath,
    productionBlockerArtifactPath: data.productionBlockerArtifactPath,
    ciRunUrl: data.ciRunUrl,
  };

  return repository.dependencyInstallRun.upsert({
    where: { tenantId_runId: { tenantId: input.tenantId, runId: input.runId } },
    create: data,
    update,
  });
}


function redactDependencyInstallEvidenceArtifact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactDependencyInstallEvidenceArtifact(entry));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        if (
          /(token|secret|password|authorization|cookie|url|uri|dsn|email|phone|actor|tenant|user|account|log|output|stdout|stderr|transcript|environment|env|artifact|path|file|report|manifest|payload|body|command|install|lockfile|lock|package|dependency|workspace|typecheck|lint|unit|ci|workflow|run|commit|branch|cache|blocker|database|key|id)/i.test(
            key,
          )
        ) {
          return [key, "[REDACTED]"];
        }
        return [key, redactDependencyInstallEvidenceArtifact(entry)];
      }),
    );
  }
  if (typeof value === "string") {
    return value
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED]")
      .replace(/postgres(?:ql)?:\/\/[^\s"'<>]+/gi, "[REDACTED]")
      .replace(/https?:\/\/\S+/gi, "[REDACTED]")
      .replace(/\b(?:github_pat|ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]+\b/g, "[REDACTED]")
      .replace(/\b(?:coverage|artifacts|test-results|reports|docs)\/[A-Za-z0-9_./-]{6,}\b/gi, "[REDACTED]")
      .replace(
        /\b(?:tenant|user|account|run|commit|workflow|ci|artifact|package|dependency|workspace|install|lock|cache|branch|repo|database|env|typecheck|lint|unit|blocker|production)[-_:/]?[A-Za-z0-9_.-]{6,}\b/gi,
        "[REDACTED]",
      )
      .replace(/\b[A-Za-z0-9_-]{24,}\b/g, "[REDACTED]");
  }
  return value;
}

export function buildDependencyInstallRedactedEvidenceBundle(
  artifact: unknown,
): DependencyInstallRedactedEvidenceBundle {
  return {
    status: "redacted-evidence-bundle-ready",
    artifactPath: "coverage/dependency-install-redacted-evidence-bundle.json",
    redactedArtifact: redactDependencyInstallEvidenceArtifact(artifact),
    redactions: [
      "token",
      "secret",
      "password",
      "authorization",
      "url",
      "email",
      "actor",
      "tenant",
      "log",
      "output",
      "environment",
      "artifact",
      "path",
      "manifest",
      "payload",
      "command",
      "install",
      "lockfile",
      "package",
      "dependency",
      "workspace",
      "ci",
      "workflow",
      "run",
      "commit",
      "branch",
      "cache",
      "blocker",
      "database",
    ],
    requiredArtifacts: dependencyInstallArtifactPaths,
    requiredExternalEvidence: dependencyInstallRequiredExternalEvidence,
    providerExecutionAllowed: false,
  };
}
