export type StaticDependencyAuditRuntimeStatus =
  | "wired"
  | "locally-verified"
  | "runtime-resolution-gated"
  | "ci-gated";

export interface StaticDependencyAuditRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: StaticDependencyAuditRuntimeStatus;
}

export interface StaticDependencyAuditRunPersistenceContract {
  readonly model: "StaticDependencyAuditRun";
  readonly tenantRelation: "staticDependencyAuditRuns";
  readonly migration: "20260609032200_add_static_dependency_audit_runs";
  readonly jsonFields: readonly [
    "commandMatrix",
    "coverageAreaManifest",
    "locallyVerifiedAudit",
    "artifactManifest",
    "peerVersionReviewManifest",
  ];
  readonly evidenceBooleans: readonly [
    "workspaceImportAuditPassed",
    "workspacePackageTestsPassed",
    "workspacePackageTypecheckPassed",
    "dependencyInstallEvidenceCaptured",
    "workspaceTypecheckPassed",
    "webBuildEvidenceCaptured",
    "dashboardBuildEvidenceCaptured",
    "ciWorkspaceResolutionPassed",
    "ciEvidenceCaptured",
    "peerVersionReviewCaptured",
    "runtimeResolutionProofCaptured",
  ];
  readonly artifactFields: readonly [
    "workspaceImportAuditArtifactPath",
    "workspacePackageTestArtifactPath",
    "workspacePackageTypecheckArtifactPath",
    "dependencyInstallArtifactPath",
    "workspaceTypecheckArtifactPath",
    "webBuildArtifactPath",
    "dashboardBuildArtifactPath",
    "ciWorkspaceResolutionArtifactPath",
    "peerVersionReviewArtifactPath",
    "ciRunUrl",
  ];
}

export const staticDependencyAuditRunPersistenceContract: StaticDependencyAuditRunPersistenceContract = {
  model: "StaticDependencyAuditRun",
  tenantRelation: "staticDependencyAuditRuns",
  migration: "20260609032200_add_static_dependency_audit_runs",
  jsonFields: [
    "commandMatrix",
    "coverageAreaManifest",
    "locallyVerifiedAudit",
    "artifactManifest",
    "peerVersionReviewManifest",
  ],
  evidenceBooleans: [
    "workspaceImportAuditPassed",
    "workspacePackageTestsPassed",
    "workspacePackageTypecheckPassed",
    "dependencyInstallEvidenceCaptured",
    "workspaceTypecheckPassed",
    "webBuildEvidenceCaptured",
    "dashboardBuildEvidenceCaptured",
    "ciWorkspaceResolutionPassed",
    "ciEvidenceCaptured",
    "peerVersionReviewCaptured",
    "runtimeResolutionProofCaptured",
  ],
  artifactFields: [
    "workspaceImportAuditArtifactPath",
    "workspacePackageTestArtifactPath",
    "workspacePackageTypecheckArtifactPath",
    "dependencyInstallArtifactPath",
    "workspaceTypecheckArtifactPath",
    "webBuildArtifactPath",
    "dashboardBuildArtifactPath",
    "ciWorkspaceResolutionArtifactPath",
    "peerVersionReviewArtifactPath",
    "ciRunUrl",
  ],
};

export const staticDependencyAuditCommands = [
  "node scripts/workspace/audit-workspace-imports.mjs",
  "pnpm --filter @inkroute/workspace test",
  "pnpm --filter @inkroute/workspace typecheck",
  "pnpm install",
  "pnpm typecheck",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard build",
  "GitHub Actions Phase 18 workspace runtime readiness job",
] as const;

export const staticDependencyAuditCoverageAreas = [
  "declared-workspace-dependencies",
  "workspace-source-imports",
  "tsconfig-path-aliases",
  "package-source-entrypoints",
  "manifest-main-types-export-targets",
  "bare-third-party-imports",
  "root-devdependency-test-tooling",
  "runtime-resolution-boundary",
  "peer-version-boundary",
] as const;

export const staticDependencyAuditArtifactPaths = [
  "coverage/static-dependency-audit-runtime.json",
  "coverage/static-dependency-audit-output.txt",
  "coverage/static-dependency-workspace-package-test.txt",
  "coverage/static-dependency-workspace-package-typecheck.txt",
  "coverage/static-dependency-install-output.txt",
  "coverage/static-dependency-typecheck-output.txt",
  "coverage/static-dependency-web-build-output.txt",
  "coverage/static-dependency-dashboard-build-output.txt",
  "coverage/static-dependency-ci-job.json",
  "coverage/static-dependency-peer-version-review.json",
  "test-results/static-dependency-audit-runtime",
] as const;

export const staticDependencyAuditRuntimeMatrix = [
  {
    id: "workspace-import-audit",
    command: "node scripts/workspace/audit-workspace-imports.mjs",
    artifact: "coverage/static-dependency-audit-output.txt",
    status: "locally-verified",
  },
  {
    id: "workspace-package-tests",
    command: "pnpm --filter @inkroute/workspace test",
    artifact: "coverage/static-dependency-workspace-package-test.txt",
    status: "runtime-resolution-gated",
  },
  {
    id: "workspace-package-typecheck",
    command: "pnpm --filter @inkroute/workspace typecheck",
    artifact: "coverage/static-dependency-workspace-package-typecheck.txt",
    status: "runtime-resolution-gated",
  },
  {
    id: "dependency-install-resolution",
    command: "pnpm install",
    artifact: "coverage/static-dependency-install-output.txt",
    status: "runtime-resolution-gated",
  },
  {
    id: "workspace-typecheck-resolution",
    command: "pnpm typecheck",
    artifact: "coverage/static-dependency-typecheck-output.txt",
    status: "runtime-resolution-gated",
  },
  {
    id: "web-build-resolution",
    command: "pnpm --filter @inkroute/web build",
    artifact: "coverage/static-dependency-web-build-output.txt",
    status: "runtime-resolution-gated",
  },
  {
    id: "dashboard-build-resolution",
    command: "pnpm --filter @inkroute/dashboard build",
    artifact: "coverage/static-dependency-dashboard-build-output.txt",
    status: "runtime-resolution-gated",
  },
  {
    id: "ci-workspace-resolution",
    command: "GitHub Actions Phase 18 workspace runtime readiness job",
    artifact: "coverage/static-dependency-ci-job.json",
    status: "ci-gated",
  },
  {
    id: "peer-version-review",
    command: "inspect peer dependency compatibility and version warnings",
    artifact: "coverage/static-dependency-peer-version-review.json",
    status: "runtime-resolution-gated",
  },
] as const satisfies readonly StaticDependencyAuditRuntimeMatrixEntry[];

export const staticDependencyAuditReadiness = {
  status: "blocked",
  locallyVerifiedAudit: {
    command: "node scripts/workspace/audit-workspace-imports.mjs",
    projects: 25,
    sourceFiles: 809,
    workspaceImports: 139,
    externalImports: 174,
    entrypointFindings: 0,
  },
  requiredCommands: staticDependencyAuditCommands,
  requiredEvidence: [
    "Static workspace import audit output proving declared workspace dependencies, source imports, aliases, entrypoints, exports, and bare third-party imports are aligned.",
    "@inkroute/workspace package test and typecheck output.",
    "Dependency install, workspace typecheck, web build, and dashboard build output proving runtime package resolution.",
    "CI workspace runtime readiness job evidence.",
    "Peer dependency compatibility and version warning review evidence.",
  ],
  blockers: [
    "@inkroute/workspace package tests must pass after the static dependency audit patch.",
    "@inkroute/workspace typecheck must pass after the static dependency audit patch.",
    "pnpm install, pnpm typecheck, and app builds must prove runtime dependency resolution.",
    "CI workspace runtime readiness evidence must be captured.",
    "Peer dependency compatibility and version warning review must be captured.",
  ],
} as const;
