import { buildRuntimeEvidenceReadinessPlan } from "@inkroute/workspace";

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
