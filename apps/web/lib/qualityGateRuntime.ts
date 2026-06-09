import { buildQualityGateRuntimeReadinessPlan } from "@inkroute/quality";

export type QualityGateRuntimeStatus =
  | "wired"
  | "runtime-gated"
  | "ci-gated"
  | "artifact-gated";

export interface QualityGateRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: QualityGateRuntimeStatus;
}

export interface QualityGateRunPersistenceContract {
  readonly prismaModel: "QualityGateRun";
  readonly tenantRelation: "qualityGateRuns";
  readonly uniqueKey: readonly ["tenantId", "runId"];
  readonly jsonFields: readonly ["commandMatrix", "generatedManifestMatrix", "artifactManifest"];
  readonly requiredBooleanProofs: readonly [
    "packageTypecheckPassed",
    "packageTestsPassed",
    "qualityDocsPassed",
    "qualityGapsPassed",
    "qualityPrGapFixturesPassed",
    "qualityGovernancePassed",
    "qualityRequiredChecksPassed",
    "qualityGatesSummaryPassed",
    "qualityAllPassed",
    "ciQualityJobPassed",
    "ciArtifactsCaptured"
  ];
  readonly artifactFields: readonly [
    "packageTypecheckArtifactPath",
    "packageTestArtifactPath",
    "qualityAllArtifactPath",
    "qualityCiJobArtifactPath"
  ];
}

export const qualityGateRootScripts = [
  "quality:docs",
  "quality:gaps",
  "quality:pr-gaps",
  "quality:pr-gap-fixtures",
  "quality:governance",
  "quality:required-checks",
  "quality:gates",
  "quality:all",
] as const;

export const qualityGateRuntimeCommands = [
  "pnpm --filter @inkroute/quality typecheck",
  "pnpm --filter @inkroute/quality test",
  "pnpm quality:docs",
  "pnpm quality:gaps",
  "pnpm quality:pr-gap-fixtures",
  "pnpm quality:governance",
  "pnpm quality:required-checks",
  "pnpm quality:gates",
  "pnpm quality:all",
  "GitHub Actions CI quality job",
] as const;

export const qualityGateGeneratedManifests = [
  "docs/quality/manifests/markdown-link-audit.json",
  "docs/quality/manifests/documentation-consistency-audit.json",
  "docs/quality/manifests/documentation-inventory-audit.json",
  "docs/quality/manifests/gap-evidence-audit.json",
  "docs/quality/manifests/pr-gap-diff-fixtures.json",
  "docs/quality/manifests/repository-governance-audit.json",
  "docs/quality/manifests/required-checks-audit.json",
  "docs/quality/manifests/quality-gates.json",
] as const;

export const qualityGateRuntimeArtifactPaths = [
  "coverage/quality-gate-runtime.json",
  "coverage/quality-package-typecheck.txt",
  "coverage/quality-package-test.txt",
  "coverage/quality-docs-output.txt",
  "coverage/quality-gaps-output.txt",
  "coverage/quality-pr-gap-fixtures-output.txt",
  "coverage/quality-governance-output.txt",
  "coverage/quality-required-checks-output.txt",
  "coverage/quality-gates-output.txt",
  "coverage/quality-all-output.txt",
  "coverage/quality-ci-job.json",
  "test-results/quality-gate-runtime",
] as const;

export const qualityGateRuntimeMatrix = [
  {
    id: "quality-package-typecheck",
    command: "pnpm --filter @inkroute/quality typecheck",
    artifact: "coverage/quality-package-typecheck.txt",
    status: "runtime-gated",
  },
  {
    id: "quality-package-test",
    command: "pnpm --filter @inkroute/quality test",
    artifact: "coverage/quality-package-test.txt",
    status: "runtime-gated",
  },
  {
    id: "quality-docs",
    command: "pnpm quality:docs",
    artifact: "coverage/quality-docs-output.txt",
    status: "wired",
  },
  {
    id: "quality-gaps",
    command: "pnpm quality:gaps",
    artifact: "coverage/quality-gaps-output.txt",
    status: "wired",
  },
  {
    id: "quality-pr-gap-fixtures",
    command: "pnpm quality:pr-gap-fixtures",
    artifact: "coverage/quality-pr-gap-fixtures-output.txt",
    status: "wired",
  },
  {
    id: "quality-governance",
    command: "pnpm quality:governance",
    artifact: "coverage/quality-governance-output.txt",
    status: "wired",
  },
  {
    id: "quality-required-checks",
    command: "pnpm quality:required-checks",
    artifact: "coverage/quality-required-checks-output.txt",
    status: "wired",
  },
  {
    id: "quality-gates-summary",
    command: "pnpm quality:gates",
    artifact: "coverage/quality-gates-output.txt",
    status: "wired",
  },
  {
    id: "quality-all",
    command: "pnpm quality:all",
    artifact: "coverage/quality-all-output.txt",
    status: "runtime-gated",
  },
  {
    id: "quality-ci-job",
    command: "GitHub Actions CI quality job",
    artifact: "coverage/quality-ci-job.json",
    status: "ci-gated",
  },
  {
    id: "quality-ci-artifacts",
    command: "capture CI quality reports/artifacts",
    artifact: "coverage/quality-gate-runtime.json",
    status: "artifact-gated",
  },
] as const satisfies readonly QualityGateRuntimeMatrixEntry[];

export const qualityGateRunPersistenceContract: QualityGateRunPersistenceContract = {
  prismaModel: "QualityGateRun",
  tenantRelation: "qualityGateRuns",
  uniqueKey: ["tenantId", "runId"],
  jsonFields: ["commandMatrix", "generatedManifestMatrix", "artifactManifest"],
  requiredBooleanProofs: [
    "packageTypecheckPassed",
    "packageTestsPassed",
    "qualityDocsPassed",
    "qualityGapsPassed",
    "qualityPrGapFixturesPassed",
    "qualityGovernancePassed",
    "qualityRequiredChecksPassed",
    "qualityGatesSummaryPassed",
    "qualityAllPassed",
    "ciQualityJobPassed",
    "ciArtifactsCaptured",
  ],
  artifactFields: [
    "packageTypecheckArtifactPath",
    "packageTestArtifactPath",
    "qualityAllArtifactPath",
    "qualityCiJobArtifactPath",
  ],
};

export const qualityGateRuntimeReadiness = buildQualityGateRuntimeReadinessPlan({
  rootScripts: {
    "quality:docs": "pnpm quality:doc-links && pnpm quality:doc-consistency && pnpm quality:doc-inventory",
    "quality:gaps": "node scripts/quality/audit-gap-evidence.mjs",
    "quality:pr-gaps": "node scripts/quality/audit-gap-tracker-diff.mjs",
    "quality:pr-gap-fixtures": "node scripts/quality/verify-pr-gap-diff-fixtures.mjs",
    "quality:governance": "node scripts/quality/verify-repository-governance.mjs",
    "quality:required-checks": "node scripts/quality/verify-required-checks.mjs",
    "quality:gates": "node scripts/quality/print-quality-gates.mjs",
    "quality:all": "pnpm quality:docs && pnpm quality:gaps && pnpm quality:pr-gap-fixtures && pnpm quality:governance && pnpm quality:required-checks && pnpm quality:gates",
  },
  qualityPackageScripts: {
    typecheck: "tsc --noEmit",
    test: "vitest run --passWithNoTests",
  },
  generatedManifests: [...qualityGateGeneratedManifests],
  packageTypecheckPassed: false,
  packageTestsPassed: false,
  qualityAllPassed: false,
  markdownLinkManifestGenerated: true,
  documentationConsistencyManifestGenerated: true,
  documentationInventoryManifestGenerated: true,
  gapEvidenceManifestGenerated: true,
  prGapFixtureManifestGenerated: true,
  repositoryGovernanceManifestGenerated: true,
  requiredChecksManifestGenerated: true,
  qualityGatesManifestGenerated: true,
  ciQualityJobPassed: false,
  ciArtifactsCaptured: false,
});
