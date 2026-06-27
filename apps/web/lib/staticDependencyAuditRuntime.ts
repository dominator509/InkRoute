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
  "inspect peer dependency compatibility and version warnings",
  "capture runtime dependency resolution proof",
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
  "coverage/static-dependency-redacted-evidence-bundle.json",
  "test-results/static-dependency-audit-runtime",
] as const;

export const staticDependencyAuditProofFiles = [
  "apps/dashboard/package.json",
  "apps/web/package.json",
  "scripts/workspace/audit-workspace-imports.mjs",
  "packages/workspace/package.json",
  "packages/workspace/src/index.ts",
  "packages/workspace/tests/workspace-audit.test.ts",
  "docs/workspace/WORKSPACE_AUDIT_PROTOCOL.md",
  "docs/workspace/README.md",
  "docs/workspace/manifests/workspace-import-audit.json",
  "apps/web/lib/staticDependencyAuditRuntime.ts",
  "apps/web/tests/static-dependency-audit-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609032200_add_static_dependency_audit_runs/migration.sql",
  "package.json",
  "pnpm-lock.yaml",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type StaticDependencyAuditCommand = (typeof staticDependencyAuditCommands)[number];
export type StaticDependencyAuditArtifact = (typeof staticDependencyAuditArtifactPaths)[number];
export type StaticDependencyAuditCoverageArea = (typeof staticDependencyAuditCoverageAreas)[number];

export const staticDependencyAuditLocalArtifacts = [
  "coverage/static-dependency-audit-runtime.json",
  "coverage/static-dependency-audit-output.txt",
] as const satisfies readonly StaticDependencyAuditArtifact[];

export const staticDependencyAuditExternalArtifacts = [
  "coverage/static-dependency-workspace-package-test.txt",
  "coverage/static-dependency-workspace-package-typecheck.txt",
  "coverage/static-dependency-install-output.txt",
  "coverage/static-dependency-typecheck-output.txt",
  "coverage/static-dependency-web-build-output.txt",
  "coverage/static-dependency-dashboard-build-output.txt",
  "coverage/static-dependency-ci-job.json",
  "coverage/static-dependency-peer-version-review.json",
  "coverage/static-dependency-redacted-evidence-bundle.json",
  "test-results/static-dependency-audit-runtime",
] as const satisfies readonly StaticDependencyAuditArtifact[];

export interface StaticDependencyAuditEvidenceInput {
  readonly workspaceImportAuditPassed: boolean;
  readonly workspacePackageTestsPassed: boolean;
  readonly workspacePackageTypecheckPassed: boolean;
  readonly dependencyInstallEvidenceCaptured: boolean;
  readonly workspaceTypecheckPassed: boolean;
  readonly webBuildEvidenceCaptured: boolean;
  readonly dashboardBuildEvidenceCaptured: boolean;
  readonly ciWorkspaceResolutionPassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly peerVersionReviewCaptured: boolean;
  readonly runtimeResolutionProofCaptured: boolean;
  readonly staticDependencyAuditRunPersisted: boolean;
  readonly redactedEvidenceBundleCaptured: boolean;
  readonly coveredAreas: readonly StaticDependencyAuditCoverageArea[];
  readonly capturedArtifacts: readonly StaticDependencyAuditArtifact[];
  readonly completedCommands: readonly StaticDependencyAuditCommand[];
}

export interface StaticDependencyAuditEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCoverageAreas: readonly StaticDependencyAuditCoverageArea[];
  readonly missingArtifacts: readonly StaticDependencyAuditArtifact[];
  readonly missingCommands: readonly StaticDependencyAuditCommand[];
  readonly requiredCoverageAreas: readonly StaticDependencyAuditCoverageArea[];
  readonly requiredArtifacts: typeof staticDependencyAuditArtifactPaths;
  readonly requiredCommands: typeof staticDependencyAuditCommands;
  readonly requiredEvidence: typeof staticDependencyAuditRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface StaticDependencyAuditExecutionPlan {
  readonly localCommands: typeof staticDependencyAuditLocalCommands;
  readonly externalCommands: typeof staticDependencyAuditExternalCommands;
  readonly localArtifacts: typeof staticDependencyAuditLocalArtifacts;
  readonly externalArtifacts: typeof staticDependencyAuditExternalArtifacts;
  readonly workspaceImportAuditExecutionAllowed: false;
  readonly workspacePackageTestExecutionAllowed: false;
  readonly workspacePackageTypecheckExecutionAllowed: false;
  readonly dependencyInstallExecutionAllowed: false;
  readonly workspaceTypecheckExecutionAllowed: false;
  readonly webBuildExecutionAllowed: false;
  readonly dashboardBuildExecutionAllowed: false;
  readonly ciWorkspaceResolutionExecutionAllowed: false;
  readonly peerVersionReviewExecutionAllowed: false;
  readonly runtimeResolutionProofExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly executionPolicy: typeof staticDependencyAuditExecutionPolicy;
  readonly requiredExternalEvidence: typeof staticDependencyAuditRequiredExternalEvidence;
}

export interface StaticDependencyAuditArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof staticDependencyAuditRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export interface StaticDependencyAuditRedactedEvidenceBundle {
  readonly status: "redacted-evidence-bundle-ready";
  readonly artifactPath: "coverage/static-dependency-redacted-evidence-bundle.json";
  readonly review: StaticDependencyAuditArtifactReview;
  readonly requiredArtifacts: typeof staticDependencyAuditArtifactPaths;
  readonly requiredExternalEvidence: typeof staticDependencyAuditRequiredExternalEvidence;
  readonly providerExecutionAllowed: false;
}

export const staticDependencyAuditLocalCommands = [
  "node scripts/workspace/audit-workspace-imports.mjs",
] as const satisfies readonly StaticDependencyAuditCommand[];

export const staticDependencyAuditExternalCommands = [
  "pnpm --filter @inkroute/workspace test",
  "pnpm --filter @inkroute/workspace typecheck",
  "pnpm install",
  "pnpm typecheck",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard build",
  "GitHub Actions Phase 18 workspace runtime readiness job",
  "inspect peer dependency compatibility and version warnings",
  "capture runtime dependency resolution proof",
] as const satisfies readonly StaticDependencyAuditCommand[];

export const staticDependencyAuditRequiredExternalEvidence = [
  "@inkroute/workspace package test/typecheck output captured as artifacts.",
  "pnpm install, pnpm typecheck, web build, and dashboard build output proving runtime dependency resolution.",
  "GitHub Actions Phase 18 workspace runtime readiness job URL and conclusion.",
  "Peer dependency compatibility and version warning review artifact.",
  "Runtime dependency resolution proof captured from the target workspace.",
  "Durable StaticDependencyAuditRun persistence row captured from the target database.",
  "Redacted static dependency audit evidence bundle captured without raw install logs, registry URLs, tokens, database URLs, or package-owner identifiers.",
] as const;

export type StaticDependencyAuditExecutionPolicy = {
  readonly codexMayClassifyStaticDependencyAudit: true;
  readonly packageRuntimeProofRequiredForClosure: true;
  readonly installTypecheckBuildEvidenceRequiredForClosure: true;
  readonly ciWorkspaceEvidenceRequiredForClosure: true;
  readonly peerVersionReviewRequiredForClosure: true;
  readonly runtimeResolutionProofRequiredForClosure: true;
  readonly providerDatabaseRequiredForPersistence: true;
};

export const staticDependencyAuditExecutionPolicy: StaticDependencyAuditExecutionPolicy = {
  codexMayClassifyStaticDependencyAudit: true,
  packageRuntimeProofRequiredForClosure: true,
  installTypecheckBuildEvidenceRequiredForClosure: true,
  ciWorkspaceEvidenceRequiredForClosure: true,
  peerVersionReviewRequiredForClosure: true,
  runtimeResolutionProofRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
};

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
  {
    id: "runtime-resolution-proof",
    command: "capture runtime dependency resolution proof",
    artifact: "coverage/static-dependency-audit-runtime.json",
    status: "runtime-resolution-gated",
  },
  {
    id: "redacted-evidence-bundle",
    command: "retain redacted static dependency audit evidence bundle",
    artifact: "coverage/static-dependency-redacted-evidence-bundle.json",
    status: "ci-gated",
  },
] as const satisfies readonly StaticDependencyAuditRuntimeMatrixEntry[];

export const staticDependencyAuditReadinessRequiredEvidence = [
  "Static workspace import audit output proving declared workspace dependencies, source imports, aliases, entrypoints, exports, and bare third-party imports are aligned.",
  "@inkroute/workspace package test and typecheck output.",
  "Dependency install, workspace typecheck, web build, and dashboard build output proving runtime package resolution.",
  "CI workspace runtime readiness job evidence.",
  "Peer dependency compatibility and version warning review evidence.",
] as const;

export function buildStaticDependencyAuditDecisionRequiredEvidence(
  readinessEvidence: typeof staticDependencyAuditReadinessRequiredEvidence,
): StaticDependencyAuditRequiredEvidence {
  return [
    ...readinessEvidence,
    "StaticDependencyAuditRun row with command, coverage area, local audit, artifact, and peer/version review matrices.",
    "Artifact bundle proving workspace import audit, package test/typecheck, install, workspace typecheck, web build, dashboard build, CI resolution, peer/version review, and runtime resolution proof.",
  ];
}

export type StaticDependencyAuditRequiredEvidence = readonly [
  ...typeof staticDependencyAuditReadinessRequiredEvidence,
  "StaticDependencyAuditRun row with command, coverage area, local audit, artifact, and peer/version review matrices.",
  "Artifact bundle proving workspace import audit, package test/typecheck, install, workspace typecheck, web build, dashboard build, CI resolution, peer/version review, and runtime resolution proof.",
];

export const staticDependencyAuditRequiredEvidence = buildStaticDependencyAuditDecisionRequiredEvidence(
  staticDependencyAuditReadinessRequiredEvidence,
);

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
  requiredEvidence: staticDependencyAuditReadinessRequiredEvidence,
  blockers: [
    "@inkroute/workspace package tests must pass after the static dependency audit patch.",
    "@inkroute/workspace typecheck must pass after the static dependency audit patch.",
    "pnpm install, pnpm typecheck, and app builds must prove runtime dependency resolution.",
    "CI workspace runtime readiness evidence must be captured.",
    "Peer dependency compatibility and version warning review must be captured.",
  ],
} as const;

export function buildStaticDependencyAuditEvidenceDecision(
  input: StaticDependencyAuditEvidenceInput,
): StaticDependencyAuditEvidenceDecision {
  const coveredAreas = new Set(input.coveredAreas);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingCoverageAreas = staticDependencyAuditCoverageAreas.filter((area) => !coveredAreas.has(area));
  const missingArtifacts = staticDependencyAuditArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = staticDependencyAuditCommands.filter((command) => !completedCommands.has(command));
  const blockers: string[] = [];

  if (!input.workspaceImportAuditPassed) {
    blockers.push("Static workspace import audit must pass.");
  }
  if (!input.workspacePackageTestsPassed) {
    blockers.push("@inkroute/workspace package tests must pass after the static dependency audit patch.");
  }
  if (!input.workspacePackageTypecheckPassed) {
    blockers.push("@inkroute/workspace typecheck must pass after the static dependency audit patch.");
  }
  if (!input.dependencyInstallEvidenceCaptured || !input.workspaceTypecheckPassed || !input.webBuildEvidenceCaptured || !input.dashboardBuildEvidenceCaptured) {
    blockers.push("pnpm install, pnpm typecheck, and app builds must prove runtime dependency resolution.");
  }
  if (!input.ciWorkspaceResolutionPassed || !input.ciEvidenceCaptured) {
    blockers.push("CI workspace runtime readiness evidence must be captured.");
  }
  if (!input.peerVersionReviewCaptured) {
    blockers.push("Peer dependency compatibility and version warning review must be captured.");
  }
  if (!input.runtimeResolutionProofCaptured) {
    blockers.push("Runtime dependency resolution proof must be captured.");
  }
  if (!input.staticDependencyAuditRunPersisted) {
    blockers.push("StaticDependencyAuditRun persistence row must be captured for durable auditability.");
  }
  if (!input.redactedEvidenceBundleCaptured) {
    blockers.push("Redacted static dependency audit evidence bundle must be captured.");
  }
  if (missingCoverageAreas.length > 0) {
    blockers.push("Every required static dependency audit coverage area must be captured.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required static dependency audit artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required static dependency audit command must be completed.");
  }

  return {
    status:
      blockers.length === 0 && missingCoverageAreas.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0
        ? "complete"
        : "blocked",
    missingCoverageAreas,
    missingArtifacts,
    missingCommands,
    requiredCoverageAreas: staticDependencyAuditCoverageAreas,
    requiredArtifacts: staticDependencyAuditArtifactPaths,
    requiredCommands: staticDependencyAuditCommands,
    requiredEvidence: staticDependencyAuditRequiredEvidence,
    blockers,
  };
}

const sensitiveStaticDependencyKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|tenant|user|account|database|url|uri|dsn|key|id|repository|branch|registry|package)$/iu;
const sensitiveStaticDependencyValuePattern =
  /(https?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|[A-Za-z0-9_-]{24,})/giu;

const redactStaticDependencyString = (value: string): string =>
  value.replace(sensitiveStaticDependencyValuePattern, "[REDACTED]");

const buildRedactedStaticDependencyValue = (
  value: unknown,
  path: string,
  redactions: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item, index) => buildRedactedStaticDependencyValue(item, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveStaticDependencyKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedStaticDependencyValue(nestedValue, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redactedValue = redactStaticDependencyString(value);
    if (redactedValue !== value) {
      redactions.push(path || "value");
    }
    return redactedValue;
  }

  return value;
};

export function buildStaticDependencyAuditExecutionPlan(): StaticDependencyAuditExecutionPlan {
  return {
    localCommands: staticDependencyAuditLocalCommands,
    externalCommands: staticDependencyAuditExternalCommands,
    localArtifacts: staticDependencyAuditLocalArtifacts,
    externalArtifacts: staticDependencyAuditExternalArtifacts,
    workspaceImportAuditExecutionAllowed: false,
    workspacePackageTestExecutionAllowed: false,
    workspacePackageTypecheckExecutionAllowed: false,
    dependencyInstallExecutionAllowed: false,
    workspaceTypecheckExecutionAllowed: false,
    webBuildExecutionAllowed: false,
    dashboardBuildExecutionAllowed: false,
    ciWorkspaceResolutionExecutionAllowed: false,
    peerVersionReviewExecutionAllowed: false,
    runtimeResolutionProofExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    executionPolicy: staticDependencyAuditExecutionPolicy,
    requiredExternalEvidence: staticDependencyAuditRequiredExternalEvidence,
  };
}

export function buildRedactedStaticDependencyAuditArtifact(artifact: unknown): unknown {
  return buildRedactedStaticDependencyValue(artifact, "", []);
}

export function buildStaticDependencyAuditArtifactReview(artifact: unknown): StaticDependencyAuditArtifactReview {
  const redactions: string[] = [];

  return {
    artifact: buildRedactedStaticDependencyValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: staticDependencyAuditRequiredExternalEvidence,
    safeForTracker: true,
  };
}

export function buildStaticDependencyAuditRedactedEvidenceBundle(
  artifact: unknown,
): StaticDependencyAuditRedactedEvidenceBundle {
  return {
    status: "redacted-evidence-bundle-ready",
    artifactPath: "coverage/static-dependency-redacted-evidence-bundle.json",
    review: buildStaticDependencyAuditArtifactReview(artifact),
    requiredArtifacts: staticDependencyAuditArtifactPaths,
    requiredExternalEvidence: staticDependencyAuditRequiredExternalEvidence,
    providerExecutionAllowed: false,
  };
}

