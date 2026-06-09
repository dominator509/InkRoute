import { buildWorkspaceRuntimeToolchainReadinessPlan } from "@inkroute/workspace";

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
] as const;

export const workspaceRuntimeToolchainGeneratedReports = [
  "docs/workspace/manifests/workspace-import-audit.json",
  "docs/workspace/manifests/workspace-package-scripts-audit.json",
  "docs/workspace/manifests/runtime-evidence-audit.json",
  "docs/workspace/manifests/runtime-readiness.json",
  "docs/workspace/manifests/workspace-required-checks-audit.json",
  "docs/workspace/manifests/workspace-toolchain-readiness.json",
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
  "test-results/workspace-runtime-toolchain",
] as const;

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
] as const satisfies readonly WorkspaceRuntimeToolchainMatrixEntry[];

export const workspaceRuntimeToolchainReadiness = buildWorkspaceRuntimeToolchainReadinessPlan({
  toolchainAuditStatus: "pass",
  packageTypecheckPassed: false,
  packageTestsPassed: false,
  workspaceToolchainPassed: false,
  workspaceAllPassed: false,
  requiredGeneratedReports: [...workspaceRuntimeToolchainGeneratedReports],
  generatedReports: [...workspaceRuntimeToolchainGeneratedReports],
  ciWorkspaceJobPassed: false,
  ciEvidenceCaptured: false,
  dependencyInstallEvidenceCaptured: false,
  appBuildEvidenceCaptured: false,
  productionBlockersVisible: true,
});
