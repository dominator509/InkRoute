import { buildDependencyInstallReadinessPlan } from "@inkroute/workspace";

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

export const dependencyInstallRuntimeCommands = [
  "corepack enable",
  "pnpm install",
  "pnpm install --frozen-lockfile",
  "pnpm workspace:all",
  "pnpm typecheck",
  "pnpm lint",
  "pnpm test:unit",
  "GitHub Actions CI quality job",
] as const;

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
  "test-results/dependency-install-runtime",
] as const;

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
