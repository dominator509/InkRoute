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
  "capture CI quality reports/artifacts",
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

export const qualityGateRuntimeProofFiles = [
  "packages/quality/package.json",
  "packages/quality/src/index.ts",
  "packages/quality/tests/quality-gates.test.ts",
  "scripts/quality/audit-doc-links.mjs",
  "scripts/quality/audit-gap-evidence.mjs",
  "scripts/quality/audit-gap-tracker-diff.mjs",
  "scripts/quality/verify-pr-gap-diff-fixtures.mjs",
  "scripts/quality/verify-repository-governance.mjs",
  "scripts/quality/verify-required-checks.mjs",
  "scripts/quality/print-quality-gates.mjs",
  "docs/quality/manifests/markdown-link-audit.json",
  "docs/quality/manifests/documentation-consistency-audit.json",
  "docs/quality/manifests/documentation-inventory-audit.json",
  "docs/quality/manifests/gap-evidence-audit.json",
  "docs/quality/manifests/repository-governance-audit.json",
  "docs/quality/manifests/required-checks-audit.json",
  "docs/quality/manifests/quality-gates.json",
  "docs/quality/QUALITY_GATE_PROTOCOL.md",
  "docs/quality/README.md",
  "apps/web/lib/qualityGateRuntime.ts",
  "apps/web/tests/quality-gate-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609029000_add_quality_gate_runs/migration.sql",
  "package.json",
  ".github/workflows/ci.yml",
  ".github/CODEOWNERS",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type QualityGateRuntimeCommand = (typeof qualityGateRuntimeCommands)[number];
export type QualityGateRuntimeArtifact = (typeof qualityGateRuntimeArtifactPaths)[number];
export type QualityGateGeneratedManifest = (typeof qualityGateGeneratedManifests)[number];

export const qualityGateRuntimeLocalArtifacts = [
  "coverage/quality-docs-output.txt",
  "coverage/quality-gaps-output.txt",
  "coverage/quality-pr-gap-fixtures-output.txt",
  "coverage/quality-governance-output.txt",
  "coverage/quality-required-checks-output.txt",
  "coverage/quality-gates-output.txt",
] as const satisfies readonly QualityGateRuntimeArtifact[];

export const qualityGateRuntimeExternalArtifacts = [
  "coverage/quality-gate-runtime.json",
  "coverage/quality-package-typecheck.txt",
  "coverage/quality-package-test.txt",
  "coverage/quality-all-output.txt",
  "coverage/quality-ci-job.json",
  "test-results/quality-gate-runtime",
] as const satisfies readonly QualityGateRuntimeArtifact[];

export interface QualityGateEvidenceInput {
  readonly packageTypecheckPassed: boolean;
  readonly packageTestsPassed: boolean;
  readonly qualityDocsPassed: boolean;
  readonly qualityGapsPassed: boolean;
  readonly qualityPrGapFixturesPassed: boolean;
  readonly qualityGovernancePassed: boolean;
  readonly qualityRequiredChecksPassed: boolean;
  readonly qualityGatesSummaryPassed: boolean;
  readonly qualityAllPassed: boolean;
  readonly ciQualityJobPassed: boolean;
  readonly ciArtifactsCaptured: boolean;
  readonly qualityGateRunPersisted: boolean;
  readonly capturedManifests: readonly QualityGateGeneratedManifest[];
  readonly capturedArtifacts: readonly QualityGateRuntimeArtifact[];
  readonly completedCommands: readonly QualityGateRuntimeCommand[];
}

export interface QualityGateEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingManifests: readonly QualityGateGeneratedManifest[];
  readonly missingArtifacts: readonly QualityGateRuntimeArtifact[];
  readonly missingCommands: readonly QualityGateRuntimeCommand[];
  readonly requiredManifests: readonly QualityGateGeneratedManifest[];
  readonly requiredArtifacts: typeof qualityGateRuntimeArtifactPaths;
  readonly requiredCommands: typeof qualityGateRuntimeCommands;
  readonly requiredEvidence: typeof qualityGateRuntimeRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface QualityGateRuntimeExecutionPlan {
  readonly localCommands: typeof qualityGateRuntimeLocalCommands;
  readonly externalCommands: typeof qualityGateRuntimeExternalCommands;
  readonly localArtifacts: typeof qualityGateRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof qualityGateRuntimeExternalArtifacts;
  readonly packageTypecheckExecutionAllowed: false;
  readonly packageTestExecutionAllowed: false;
  readonly qualityDocsExecutionAllowed: false;
  readonly qualityGapsExecutionAllowed: false;
  readonly prGapFixturesExecutionAllowed: false;
  readonly governanceExecutionAllowed: false;
  readonly requiredChecksExecutionAllowed: false;
  readonly gateSummaryExecutionAllowed: false;
  readonly qualityAllExecutionAllowed: false;
  readonly ciQualityJobExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly ciArtifactCaptureExecutionAllowed: false;
  readonly executionPolicy: typeof qualityGateRuntimeExecutionPolicy;
  readonly requiredExternalEvidence: typeof qualityGateRuntimeRequiredExternalEvidence;
}

export interface QualityGateRuntimeArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof qualityGateRuntimeRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export const qualityGateRuntimeLocalCommands = [
  "pnpm quality:docs",
  "pnpm quality:gaps",
  "pnpm quality:pr-gap-fixtures",
  "pnpm quality:governance",
  "pnpm quality:required-checks",
  "pnpm quality:gates",
] as const satisfies readonly QualityGateRuntimeCommand[];

export const qualityGateRuntimeExternalCommands = [
  "pnpm --filter @inkroute/quality typecheck",
  "pnpm --filter @inkroute/quality test",
  "pnpm quality:all",
  "GitHub Actions CI quality job",
  "capture CI quality reports/artifacts",
] as const satisfies readonly QualityGateRuntimeCommand[];

export const qualityGateRuntimeRequiredExternalEvidence = [
  "@inkroute/quality package typecheck and test output captured as artifacts.",
  "pnpm quality:all output captured after all quality gates run together.",
  "GitHub Actions CI quality job URL, conclusion, and artifact bundle.",
  "Durable QualityGateRun persistence row captured from the target database.",
  "CI quality reports/artifacts uploaded or explicitly documented as unavailable.",
] as const;

export type QualityGateRuntimeExecutionPolicy = {
  readonly codexMayClassifyStaticQualityGates: true;
  readonly packageRuntimeProofRequiredForClosure: true;
  readonly qualityAllRequiredForClosure: true;
  readonly ciQualityJobRequiredForClosure: true;
  readonly providerDatabaseRequiredForPersistence: true;
  readonly runtimeCommandEvidenceRequired: true;
};

export const qualityGateRuntimeExecutionPolicy: QualityGateRuntimeExecutionPolicy = {
  codexMayClassifyStaticQualityGates: true,
  packageRuntimeProofRequiredForClosure: true,
  qualityAllRequiredForClosure: true,
  ciQualityJobRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  runtimeCommandEvidenceRequired: true,
};

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

export function buildQualityGateDecisionRequiredEvidence(
  readinessEvidence: typeof qualityGateRuntimeReadiness.requiredEvidence,
): QualityGateRuntimeRequiredEvidence {
  return [
    ...readinessEvidence,
    "QualityGateRun row with command, generated manifest, and artifact matrices.",
    "CI artifact bundle proving package typecheck/test, docs, gaps, PR fixtures, governance, required checks, quality gate summary, quality:all, and CI quality job evidence.",
  ];
}

export type QualityGateRuntimeRequiredEvidence = readonly [
  ...typeof qualityGateRuntimeReadiness.requiredEvidence,
  "QualityGateRun row with command, generated manifest, and artifact matrices.",
  "CI artifact bundle proving package typecheck/test, docs, gaps, PR fixtures, governance, required checks, quality gate summary, quality:all, and CI quality job evidence.",
];

export const qualityGateRuntimeRequiredEvidence = buildQualityGateDecisionRequiredEvidence(
  qualityGateRuntimeReadiness.requiredEvidence,
);

export function buildQualityGateEvidenceDecision(input: QualityGateEvidenceInput): QualityGateEvidenceDecision {
  const capturedManifests = new Set(input.capturedManifests);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingManifests = qualityGateGeneratedManifests.filter((manifest) => !capturedManifests.has(manifest));
  const missingArtifacts = qualityGateRuntimeArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = qualityGateRuntimeCommands.filter((command) => !completedCommands.has(command));
  const readinessPlan = buildQualityGateRuntimeReadinessPlan({
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
    generatedManifests: input.capturedManifests,
    packageTypecheckPassed: input.packageTypecheckPassed,
    packageTestsPassed: input.packageTestsPassed,
    qualityAllPassed: input.qualityAllPassed,
    markdownLinkManifestGenerated: capturedManifests.has("docs/quality/manifests/markdown-link-audit.json"),
    documentationConsistencyManifestGenerated: capturedManifests.has("docs/quality/manifests/documentation-consistency-audit.json"),
    documentationInventoryManifestGenerated: capturedManifests.has("docs/quality/manifests/documentation-inventory-audit.json"),
    gapEvidenceManifestGenerated: capturedManifests.has("docs/quality/manifests/gap-evidence-audit.json"),
    prGapFixtureManifestGenerated: capturedManifests.has("docs/quality/manifests/pr-gap-diff-fixtures.json"),
    repositoryGovernanceManifestGenerated: capturedManifests.has("docs/quality/manifests/repository-governance-audit.json"),
    requiredChecksManifestGenerated: capturedManifests.has("docs/quality/manifests/required-checks-audit.json"),
    qualityGatesManifestGenerated: capturedManifests.has("docs/quality/manifests/quality-gates.json"),
    ciQualityJobPassed: input.ciQualityJobPassed,
    ciArtifactsCaptured: input.ciArtifactsCaptured,
  });
  const blockers = [...readinessPlan.blockers];

  if (!input.qualityDocsPassed) {
    blockers.push("pnpm quality:docs must pass.");
  }
  if (!input.qualityGapsPassed) {
    blockers.push("pnpm quality:gaps must pass.");
  }
  if (!input.qualityPrGapFixturesPassed) {
    blockers.push("pnpm quality:pr-gap-fixtures must pass.");
  }
  if (!input.qualityGovernancePassed) {
    blockers.push("pnpm quality:governance must pass.");
  }
  if (!input.qualityRequiredChecksPassed) {
    blockers.push("pnpm quality:required-checks must pass.");
  }
  if (!input.qualityGatesSummaryPassed) {
    blockers.push("pnpm quality:gates must pass.");
  }
  if (!input.qualityGateRunPersisted) {
    blockers.push("QualityGateRun persistence row must be captured for durable auditability.");
  }
  if (missingManifests.length > 0) {
    blockers.push("Every required quality manifest must be captured.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required quality gate artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required quality gate command must be completed.");
  }

  return {
    status:
      blockers.length === 0 && missingManifests.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0
        ? "complete"
        : "blocked",
    missingManifests,
    missingArtifacts,
    missingCommands,
    requiredManifests: qualityGateGeneratedManifests,
    requiredArtifacts: qualityGateRuntimeArtifactPaths,
    requiredCommands: qualityGateRuntimeCommands,
    requiredEvidence: qualityGateRuntimeRequiredEvidence,
    blockers,
  };
}

const sensitiveQualityGateKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|tenant|user|account|database|url|uri|dsn|key|id)$/iu;
const sensitiveQualityGateValuePattern =
  /(https?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|[A-Za-z0-9_-]{24,})/giu;

const redactQualityGateString = (value: string): string =>
  value.replace(sensitiveQualityGateValuePattern, "[REDACTED]");

const buildRedactedQualityGateValue = (
  value: unknown,
  path: string,
  redactions: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item, index) => buildRedactedQualityGateValue(item, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveQualityGateKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedQualityGateValue(nestedValue, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redactedValue = redactQualityGateString(value);
    if (redactedValue !== value) {
      redactions.push(path || "value");
    }
    return redactedValue;
  }

  return value;
};

export function buildQualityGateRuntimeExecutionPlan(): QualityGateRuntimeExecutionPlan {
  return {
    localCommands: qualityGateRuntimeLocalCommands,
    externalCommands: qualityGateRuntimeExternalCommands,
    localArtifacts: qualityGateRuntimeLocalArtifacts,
    externalArtifacts: qualityGateRuntimeExternalArtifacts,
    packageTypecheckExecutionAllowed: false,
    packageTestExecutionAllowed: false,
    qualityDocsExecutionAllowed: false,
    qualityGapsExecutionAllowed: false,
    prGapFixturesExecutionAllowed: false,
    governanceExecutionAllowed: false,
    requiredChecksExecutionAllowed: false,
    gateSummaryExecutionAllowed: false,
    qualityAllExecutionAllowed: false,
    ciQualityJobExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    ciArtifactCaptureExecutionAllowed: false,
    executionPolicy: qualityGateRuntimeExecutionPolicy,
    requiredExternalEvidence: qualityGateRuntimeRequiredExternalEvidence,
  };
}

export function buildRedactedQualityGateArtifact(artifact: unknown): unknown {
  return buildRedactedQualityGateValue(artifact, "", []);
}

export function buildQualityGateRuntimeArtifactReview(artifact: unknown): QualityGateRuntimeArtifactReview {
  const redactions: string[] = [];

  return {
    artifact: buildRedactedQualityGateValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: qualityGateRuntimeRequiredExternalEvidence,
    safeForTracker: true,
  };
}

