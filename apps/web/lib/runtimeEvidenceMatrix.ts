import {
  buildRuntimeEvidenceReadinessPlan,
  runtimeEvidenceReadinessRequiredEvidence as runtimeEvidencePackageReadinessRequiredEvidence,
} from "@inkroute/workspace";

export type RuntimeEvidenceMatrixStatus =
  | "required"
  | "missing-evidence"
  | "ci-gated"
  | "production-blocker-visible";

export interface RuntimeEvidenceMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: RuntimeEvidenceMatrixStatus;
  readonly requiredForProduction: boolean;
}

export interface RuntimeEvidenceRunPersistenceContract {
  readonly model: "RuntimeEvidenceRun";
  readonly tenantRelation: "runtimeEvidenceRuns";
  readonly migration: "20260609032300_add_runtime_evidence_runs";
  readonly jsonFields: readonly [
    "commandMatrix",
    "requirementManifest",
    "artifactManifest",
    "redactedEvidenceManifest",
    "productionBlockerManifest",
  ];
  readonly evidenceBooleans: readonly [
    "installEvidenceCaptured",
    "runtimeEvidenceCommandPassed",
    "workspaceAllPassed",
    "handoffAllPassed",
    "qualityAllPassed",
    "typecheckPassed",
    "unitTestsPassed",
    "webBuildEvidenceCaptured",
    "dashboardBuildEvidenceCaptured",
    "ciRuntimeReadinessPassed",
    "ciEvidenceCaptured",
    "runtimeEvidenceAuditPassed",
    "redactedEvidenceLabelsCaptured",
    "productionBlockersVisible",
  ];
  readonly artifactFields: readonly [
    "installArtifactPath",
    "runtimeEvidenceArtifactPath",
    "workspaceAllArtifactPath",
    "handoffAllArtifactPath",
    "qualityAllArtifactPath",
    "typecheckArtifactPath",
    "unitTestArtifactPath",
    "webBuildArtifactPath",
    "dashboardBuildArtifactPath",
    "ciRuntimeReadinessArtifactPath",
    "productionBlockerArtifactPath",
    "ciRunUrl",
  ];
}

export const runtimeEvidenceRunPersistenceContract: RuntimeEvidenceRunPersistenceContract = {
  model: "RuntimeEvidenceRun",
  tenantRelation: "runtimeEvidenceRuns",
  migration: "20260609032300_add_runtime_evidence_runs",
  jsonFields: [
    "commandMatrix",
    "requirementManifest",
    "artifactManifest",
    "redactedEvidenceManifest",
    "productionBlockerManifest",
  ],
  evidenceBooleans: [
    "installEvidenceCaptured",
    "runtimeEvidenceCommandPassed",
    "workspaceAllPassed",
    "handoffAllPassed",
    "qualityAllPassed",
    "typecheckPassed",
    "unitTestsPassed",
    "webBuildEvidenceCaptured",
    "dashboardBuildEvidenceCaptured",
    "ciRuntimeReadinessPassed",
    "ciEvidenceCaptured",
    "runtimeEvidenceAuditPassed",
    "redactedEvidenceLabelsCaptured",
    "productionBlockersVisible",
  ],
  artifactFields: [
    "installArtifactPath",
    "runtimeEvidenceArtifactPath",
    "workspaceAllArtifactPath",
    "handoffAllArtifactPath",
    "qualityAllArtifactPath",
    "typecheckArtifactPath",
    "unitTestArtifactPath",
    "webBuildArtifactPath",
    "dashboardBuildArtifactPath",
    "ciRuntimeReadinessArtifactPath",
    "productionBlockerArtifactPath",
    "ciRunUrl",
  ],
};

export const runtimeEvidenceCommands = [
  "pnpm install",
  "pnpm workspace:runtime-evidence",
  "pnpm workspace:all",
  "pnpm handoff:all",
  "pnpm quality:all",
  "pnpm typecheck",
  "pnpm test:unit",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard build",
  "GitHub Actions Phase 18 workspace runtime readiness job",
  "runtime evidence report keeps production blockers visible",
] as const;

export const runtimeEvidenceRequirementIds = [
  "dependency-install",
  "workspace-runtime-evidence",
  "workspace-all",
  "handoff-all",
  "quality-all",
  "typecheck",
  "unit-tests",
  "web-build",
  "dashboard-build",
] as const;

export const runtimeEvidenceArtifactPaths = [
  "coverage/runtime-evidence-matrix.json",
  "coverage/runtime-evidence-install-output.txt",
  "coverage/runtime-evidence-workspace-output.txt",
  "coverage/runtime-evidence-workspace-all-output.txt",
  "coverage/runtime-evidence-handoff-all-output.txt",
  "coverage/runtime-evidence-quality-all-output.txt",
  "coverage/runtime-evidence-typecheck-output.txt",
  "coverage/runtime-evidence-unit-output.txt",
  "coverage/runtime-evidence-web-build-output.txt",
  "coverage/runtime-evidence-dashboard-build-output.txt",
  "coverage/runtime-evidence-ci-job.json",
  "coverage/runtime-evidence-production-blockers.json",
  "test-results/runtime-evidence-matrix",
] as const;

export const runtimeEvidenceProofFiles = [
  "apps/dashboard/package.json",
  "apps/web/package.json",
  "scripts/workspace/print-runtime-readiness.mjs",
  "scripts/workspace/verify-runtime-evidence.mjs",
  "docs/workspace/manifests/runtime-evidence-contract.json",
  "docs/workspace/manifests/runtime-evidence.json",
  "docs/workspace/manifests/runtime-evidence-audit.json",
  "docs/workspace/manifests/runtime-readiness.json",
  "packages/workspace/src/index.ts",
  "packages/workspace/tests/workspace-audit.test.ts",
  "docs/workspace/README.md",
  "docs/workspace/WORKSPACE_AUDIT_PROTOCOL.md",
  "apps/web/lib/runtimeEvidenceMatrix.ts",
  "apps/web/tests/runtime-evidence-matrix-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609032300_add_runtime_evidence_runs/migration.sql",
  "package.json",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "scripts/quality/print-quality-gates.mjs",
  "packages/quality/src/index.ts",
  "packages/quality/tests/quality-gates.test.ts",
] as const;

export type RuntimeEvidenceCommand = (typeof runtimeEvidenceCommands)[number];
export type RuntimeEvidenceArtifact = (typeof runtimeEvidenceArtifactPaths)[number];
export type RuntimeEvidenceRequirementId = (typeof runtimeEvidenceRequirementIds)[number];

export interface RuntimeEvidenceDecisionInput {
  readonly installEvidenceCaptured: boolean;
  readonly runtimeEvidenceCommandPassed: boolean;
  readonly workspaceAllPassed: boolean;
  readonly handoffAllPassed: boolean;
  readonly qualityAllPassed: boolean;
  readonly typecheckPassed: boolean;
  readonly unitTestsPassed: boolean;
  readonly webBuildEvidenceCaptured: boolean;
  readonly dashboardBuildEvidenceCaptured: boolean;
  readonly ciRuntimeReadinessPassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly runtimeEvidenceAuditPassed: boolean;
  readonly redactedEvidenceLabelsCaptured: boolean;
  readonly productionBlockersVisible: boolean;
  readonly runtimeEvidenceRunPersisted: boolean;
  readonly passedRequirementIds: readonly RuntimeEvidenceRequirementId[];
  readonly capturedArtifacts: readonly RuntimeEvidenceArtifact[];
  readonly completedCommands: readonly RuntimeEvidenceCommand[];
}

export interface RuntimeEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingRequirementIds: readonly RuntimeEvidenceRequirementId[];
  readonly missingArtifacts: readonly RuntimeEvidenceArtifact[];
  readonly missingCommands: readonly RuntimeEvidenceCommand[];
  readonly requiredRequirementIds: readonly RuntimeEvidenceRequirementId[];
  readonly requiredArtifacts: typeof runtimeEvidenceArtifactPaths;
  readonly requiredCommands: typeof runtimeEvidenceCommands;
  readonly requiredEvidence: typeof runtimeEvidenceRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface RuntimeEvidenceExecutionPlan {
  readonly localCommands: typeof runtimeEvidenceLocalCommands;
  readonly externalCommands: typeof runtimeEvidenceExternalCommands;
  readonly localArtifacts: typeof runtimeEvidenceLocalArtifacts;
  readonly externalArtifacts: typeof runtimeEvidenceExternalArtifacts;
  readonly installExecutionAllowed: false;
  readonly workspaceRuntimeEvidenceExecutionAllowed: false;
  readonly workspaceAllExecutionAllowed: false;
  readonly handoffAllExecutionAllowed: false;
  readonly qualityAllExecutionAllowed: false;
  readonly typecheckExecutionAllowed: false;
  readonly unitTestExecutionAllowed: false;
  readonly webBuildExecutionAllowed: false;
  readonly dashboardBuildExecutionAllowed: false;
  readonly ciRuntimeReadinessExecutionAllowed: false;
  readonly productionBlockerVisibilityExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly executionPolicy: RuntimeEvidenceExecutionPolicy;
  readonly requiredExternalEvidence: typeof runtimeEvidenceRequiredExternalEvidence;
}

export interface RuntimeEvidenceArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof runtimeEvidenceRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export const runtimeEvidenceLocalCommands = [
  "runtime evidence report keeps production blockers visible",
] as const satisfies readonly RuntimeEvidenceCommand[];

export const runtimeEvidenceExternalCommands = [
  "pnpm install",
  "pnpm workspace:runtime-evidence",
  "pnpm workspace:all",
  "pnpm handoff:all",
  "pnpm quality:all",
  "pnpm typecheck",
  "pnpm test:unit",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard build",
  "GitHub Actions Phase 18 workspace runtime readiness job",
] as const satisfies readonly RuntimeEvidenceCommand[];

export const runtimeEvidenceRequiredExternalEvidence = [
  "Redacted command evidence for install, workspace, handoff, quality, typecheck, unit, and build commands.",
  "Runtime evidence audit output with passed records for every required requirement ID.",
  "GitHub Actions Phase 18 runtime readiness job URL and conclusion.",
  "Durable RuntimeEvidenceRun persistence row captured from the target database.",
  "Production blockers remain visible in runtime evidence until resolved.",
] as const;

export const runtimeEvidenceLocalArtifacts = [
  "coverage/runtime-evidence-production-blockers.json",
] as const satisfies readonly RuntimeEvidenceArtifact[];

export const runtimeEvidenceExternalArtifacts = [
  "coverage/runtime-evidence-matrix.json",
  "coverage/runtime-evidence-install-output.txt",
  "coverage/runtime-evidence-workspace-output.txt",
  "coverage/runtime-evidence-workspace-all-output.txt",
  "coverage/runtime-evidence-handoff-all-output.txt",
  "coverage/runtime-evidence-quality-all-output.txt",
  "coverage/runtime-evidence-typecheck-output.txt",
  "coverage/runtime-evidence-unit-output.txt",
  "coverage/runtime-evidence-web-build-output.txt",
  "coverage/runtime-evidence-dashboard-build-output.txt",
  "coverage/runtime-evidence-ci-job.json",
  "test-results/runtime-evidence-matrix",
] as const satisfies readonly RuntimeEvidenceArtifact[];

export const runtimeEvidenceReadinessRequiredEvidence = runtimeEvidencePackageReadinessRequiredEvidence;

export type RuntimeEvidenceRequiredEvidence = readonly [
  ...typeof runtimeEvidenceReadinessRequiredEvidence,
  "RuntimeEvidenceRun row with command, requirement, artifact, redacted evidence, and production blocker matrices.",
  "Artifact bundle proving install, workspace runtime evidence, workspace:all, handoff:all, quality:all, typecheck, unit tests, web build, dashboard build, CI runtime readiness, redacted labels, and production blocker visibility.",
];

export function buildRuntimeEvidenceDecisionRequiredEvidence(
  readinessEvidence: typeof runtimeEvidenceReadinessRequiredEvidence,
): RuntimeEvidenceRequiredEvidence {
  return [
    ...readinessEvidence,
    "RuntimeEvidenceRun row with command, requirement, artifact, redacted evidence, and production blocker matrices.",
    "Artifact bundle proving install, workspace runtime evidence, workspace:all, handoff:all, quality:all, typecheck, unit tests, web build, dashboard build, CI runtime readiness, redacted labels, and production blocker visibility.",
  ];
}

export const runtimeEvidenceRequiredEvidence = buildRuntimeEvidenceDecisionRequiredEvidence(
  runtimeEvidenceReadinessRequiredEvidence,
);

export type RuntimeEvidenceExecutionPolicy = {
  readonly codexMayClassifyStaticRuntimeEvidence: true;
  readonly commandEvidenceRequiredForClosure: true;
  readonly redactedEvidenceLabelsRequiredForClosure: true;
  readonly ciRuntimeReadinessRequiredForClosure: true;
  readonly productionBlockerVisibilityRequiredForClosure: true;
  readonly providerDatabaseRequiredForPersistence: true;
};

export const runtimeEvidenceExecutionPolicy: RuntimeEvidenceExecutionPolicy = {
  codexMayClassifyStaticRuntimeEvidence: true,
  commandEvidenceRequiredForClosure: true,
  redactedEvidenceLabelsRequiredForClosure: true,
  ciRuntimeReadinessRequiredForClosure: true,
  productionBlockerVisibilityRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
};

export const runtimeEvidenceMatrix = [
  {
    id: "dependency-install",
    command: "pnpm install",
    artifact: "coverage/runtime-evidence-install-output.txt",
    status: "missing-evidence",
    requiredForProduction: true,
  },
  {
    id: "workspace-runtime-evidence",
    command: "pnpm workspace:runtime-evidence",
    artifact: "coverage/runtime-evidence-workspace-output.txt",
    status: "missing-evidence",
    requiredForProduction: true,
  },
  {
    id: "workspace-all",
    command: "pnpm workspace:all",
    artifact: "coverage/runtime-evidence-workspace-all-output.txt",
    status: "missing-evidence",
    requiredForProduction: true,
  },
  {
    id: "handoff-all",
    command: "pnpm handoff:all",
    artifact: "coverage/runtime-evidence-handoff-all-output.txt",
    status: "missing-evidence",
    requiredForProduction: true,
  },
  {
    id: "quality-all",
    command: "pnpm quality:all",
    artifact: "coverage/runtime-evidence-quality-all-output.txt",
    status: "missing-evidence",
    requiredForProduction: true,
  },
  {
    id: "typecheck",
    command: "pnpm typecheck",
    artifact: "coverage/runtime-evidence-typecheck-output.txt",
    status: "missing-evidence",
    requiredForProduction: true,
  },
  {
    id: "unit-tests",
    command: "pnpm test:unit",
    artifact: "coverage/runtime-evidence-unit-output.txt",
    status: "missing-evidence",
    requiredForProduction: true,
  },
  {
    id: "web-build",
    command: "pnpm --filter @inkroute/web build",
    artifact: "coverage/runtime-evidence-web-build-output.txt",
    status: "missing-evidence",
    requiredForProduction: true,
  },
  {
    id: "dashboard-build",
    command: "pnpm --filter @inkroute/dashboard build",
    artifact: "coverage/runtime-evidence-dashboard-build-output.txt",
    status: "missing-evidence",
    requiredForProduction: true,
  },
  {
    id: "ci-runtime-readiness",
    command: "GitHub Actions Phase 18 workspace runtime readiness job",
    artifact: "coverage/runtime-evidence-ci-job.json",
    status: "ci-gated",
    requiredForProduction: true,
  },
  {
    id: "production-blockers-visible",
    command: "runtime evidence report keeps production blockers visible",
    artifact: "coverage/runtime-evidence-production-blockers.json",
    status: "production-blocker-visible",
    requiredForProduction: true,
  },
] as const satisfies readonly RuntimeEvidenceMatrixEntry[];

const runtimeEvidenceRequirements = runtimeEvidenceMatrix
  .filter((entry) => runtimeEvidenceRequirementIds.includes(entry.id as (typeof runtimeEvidenceRequirementIds)[number]))
  .map((entry) => ({
    id: entry.id,
    command: entry.command,
    requiredForProduction: entry.requiredForProduction,
  }));

export const runtimeEvidenceReadiness = buildRuntimeEvidenceReadinessPlan({
  requirements: runtimeEvidenceRequirements,
  records: [],
  auditStatus: "fail",
  runtimeEvidenceCommandPassed: false,
  workspaceAllIncludesRuntimeEvidence: true,
  ciEvidenceCaptured: false,
  productionBlockersVisible: true,
});

export function buildRuntimeEvidenceDecision(input: RuntimeEvidenceDecisionInput): RuntimeEvidenceDecision {
  const passedRequirementIds = new Set(input.passedRequirementIds);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingRequirementIds = runtimeEvidenceRequirementIds.filter((id) => !passedRequirementIds.has(id));
  const missingArtifacts = runtimeEvidenceArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = runtimeEvidenceCommands.filter((command) => !completedCommands.has(command));
  const blockers: string[] = [];

  if (!input.installEvidenceCaptured) {
    blockers.push("Runtime evidence is missing for pnpm install.");
  }
  if (!input.runtimeEvidenceCommandPassed) {
    blockers.push("pnpm workspace:runtime-evidence must pass.");
  }
  if (!input.workspaceAllPassed) {
    blockers.push("pnpm workspace:all must pass.");
  }
  if (!input.handoffAllPassed) {
    blockers.push("pnpm handoff:all must pass.");
  }
  if (!input.qualityAllPassed) {
    blockers.push("pnpm quality:all must pass.");
  }
  if (!input.typecheckPassed) {
    blockers.push("pnpm typecheck must pass.");
  }
  if (!input.unitTestsPassed) {
    blockers.push("pnpm test:unit must pass.");
  }
  if (!input.webBuildEvidenceCaptured || !input.dashboardBuildEvidenceCaptured) {
    blockers.push("Web and dashboard build evidence must be captured.");
  }
  if (!input.ciRuntimeReadinessPassed || !input.ciEvidenceCaptured) {
    blockers.push("GitHub Actions runtime readiness evidence must be captured.");
  }
  if (!input.runtimeEvidenceAuditPassed) {
    blockers.push("Runtime evidence audit must pass before runtime readiness can be claimed.");
  }
  if (!input.redactedEvidenceLabelsCaptured) {
    blockers.push("Every runtime evidence record must include a redacted evidence label.");
  }
  if (!input.productionBlockersVisible) {
    blockers.push("Production blockers must remain visible in runtime evidence until resolved.");
  }
  if (!input.runtimeEvidenceRunPersisted) {
    blockers.push("RuntimeEvidenceRun persistence row must be captured for durable auditability.");
  }
  if (missingRequirementIds.length > 0) {
    blockers.push("Every required runtime evidence requirement must have passing evidence.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required runtime evidence artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required runtime evidence command must be completed.");
  }

  return {
    status:
      blockers.length === 0 && missingRequirementIds.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0
        ? "complete"
        : "blocked",
    missingRequirementIds,
    missingArtifacts,
    missingCommands,
    requiredRequirementIds: runtimeEvidenceRequirementIds,
    requiredArtifacts: runtimeEvidenceArtifactPaths,
    requiredCommands: runtimeEvidenceCommands,
    requiredEvidence: runtimeEvidenceRequiredEvidence,
    blockers,
  };
}

const sensitiveRuntimeEvidenceKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|tenant|user|account|database|url|uri|dsn|key|id|repository|branch|customer|label)$/iu;
const sensitiveRuntimeEvidenceValuePattern =
  /(https?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|[A-Za-z0-9_-]{24,})/giu;

const redactRuntimeEvidenceString = (value: string): string =>
  value.replace(sensitiveRuntimeEvidenceValuePattern, "[REDACTED]");

const buildRedactedRuntimeEvidenceValue = (
  value: unknown,
  path: string,
  redactions: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item, index) => buildRedactedRuntimeEvidenceValue(item, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveRuntimeEvidenceKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedRuntimeEvidenceValue(nestedValue, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redactedValue = redactRuntimeEvidenceString(value);
    if (redactedValue !== value) {
      redactions.push(path || "value");
    }
    return redactedValue;
  }

  return value;
};

export function buildRuntimeEvidenceExecutionPlan(): RuntimeEvidenceExecutionPlan {
  return {
    localCommands: runtimeEvidenceLocalCommands,
    externalCommands: runtimeEvidenceExternalCommands,
    localArtifacts: runtimeEvidenceLocalArtifacts,
    externalArtifacts: runtimeEvidenceExternalArtifacts,
    installExecutionAllowed: false,
    workspaceRuntimeEvidenceExecutionAllowed: false,
    workspaceAllExecutionAllowed: false,
    handoffAllExecutionAllowed: false,
    qualityAllExecutionAllowed: false,
    typecheckExecutionAllowed: false,
    unitTestExecutionAllowed: false,
    webBuildExecutionAllowed: false,
    dashboardBuildExecutionAllowed: false,
    ciRuntimeReadinessExecutionAllowed: false,
    productionBlockerVisibilityExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    executionPolicy: runtimeEvidenceExecutionPolicy,
    requiredExternalEvidence: runtimeEvidenceRequiredExternalEvidence,
  };
}

export function buildRedactedRuntimeEvidenceArtifact(artifact: unknown): unknown {
  return buildRedactedRuntimeEvidenceValue(artifact, "", []);
}

export function buildRuntimeEvidenceArtifactReview(artifact: unknown): RuntimeEvidenceArtifactReview {
  const redactions: string[] = [];

  return {
    artifact: buildRedactedRuntimeEvidenceValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: runtimeEvidenceRequiredExternalEvidence,
    safeForTracker: true,
  };
}

