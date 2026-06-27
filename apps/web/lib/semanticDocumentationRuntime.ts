import { buildSemanticDocumentationRuntimeReadinessPlan } from "@inkroute/quality";

export type SemanticDocumentationRuntimeStatus =
  | "wired"
  | "ci-gated"
  | "runtime-proof-separated"
  | "provider-proof-separated"
  | "legal-review-separated";

export interface SemanticDocumentationRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: SemanticDocumentationRuntimeStatus;
}

export interface SemanticDocumentationRunPersistenceContract {
  readonly prismaModel: "SemanticDocumentationRun";
  readonly tenantRelation: "semanticDocumentationRuns";
  readonly uniqueKey: readonly ["tenantId", "runId"];
  readonly jsonFields: readonly ["semanticCheckMatrix", "proofBoundaryMatrix", "artifactManifest"];
  readonly requiredBooleanProofs: readonly [
    "qualityDocsPassed",
    "structuralLinksPassed",
    "concreteRepoPathsPassed",
    "productionReadinessClaimsPassed",
    "apiRouteReferencesPassed",
    "providerReadinessLanguagePassed",
    "legalReadinessLanguagePassed",
    "appPackageInventoryPassed",
    "documentationInventoryContractCurrent",
    "ciQualityDocsEvidenceCaptured",
    "runtimeProofSeparated",
    "providerProofSeparated",
    "legalReviewSeparated"
  ];
  readonly artifactFields: readonly [
    "linkPathArtifactPath",
    "consistencyArtifactPath",
    "inventoryArtifactPath",
    "ciQualityDocsArtifactPath",
    "runtimeBoundaryArtifactPath",
    "providerBoundaryArtifactPath",
    "legalBoundaryArtifactPath"
  ];
}

export const semanticDocumentationRuntimeCommands = [
  "pnpm quality:docs",
  "node scripts/quality/audit-doc-links.mjs",
  "node scripts/quality/verify-documentation-consistency.mjs",
  "node scripts/quality/verify-documentation-inventory.mjs",
  "GitHub Actions CI quality job",
  "document that semantic docs are not runtime build or live route proof",
  "document that provider readiness proof stays separate from wording checks",
  "document that legal review proof stays separate from wording checks",
] as const;

export const semanticDocumentationChecks = [
  "structural-links",
  "concrete-repo-paths",
  "production-readiness-claims",
  "api-route-references",
  "provider-readiness-language",
  "legal-readiness-language",
  "app-package-inventory",
  "documentation-inventory-contract",
] as const;

export const semanticDocumentationRuntimeArtifactPaths = [
  "coverage/semantic-documentation-runtime.json",
  "coverage/semantic-documentation-link-path-output.txt",
  "coverage/semantic-documentation-consistency-output.txt",
  "coverage/semantic-documentation-inventory-output.txt",
  "coverage/semantic-documentation-ci-quality-docs.json",
  "coverage/semantic-documentation-runtime-proof-boundary.json",
  "coverage/semantic-documentation-provider-proof-boundary.json",
  "coverage/semantic-documentation-legal-review-boundary.json",
  "coverage/semantic-documentation-redacted-evidence-bundle.json",
  "test-results/semantic-documentation-runtime",
] as const;

export const semanticDocumentationRuntimeProofFiles = [
  "scripts/quality/audit-doc-links.mjs",
  "scripts/quality/verify-documentation-consistency.mjs",
  "scripts/quality/verify-documentation-inventory.mjs",
  "scripts/quality/print-quality-gates.mjs",
  "packages/quality/src/index.ts",
  "packages/quality/tests/quality-gates.test.ts",
  "docs/quality/manifests/markdown-link-audit.json",
  "docs/quality/manifests/documentation-consistency-contract.json",
  "docs/quality/manifests/documentation-consistency-audit.json",
  "docs/quality/manifests/documentation-inventory-contract.json",
  "docs/quality/manifests/documentation-inventory-audit.json",
  "docs/quality/manifests/quality-gates.json",
  "apps/web/lib/semanticDocumentationRuntime.ts",
  "apps/web/tests/semantic-documentation-runtime-static.test.ts",
  ".github/workflows/ci.yml",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609031000_add_semantic_documentation_runs/migration.sql",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type SemanticDocumentationRuntimeCommand = (typeof semanticDocumentationRuntimeCommands)[number];
export type SemanticDocumentationRuntimeArtifact = (typeof semanticDocumentationRuntimeArtifactPaths)[number];

export const semanticDocumentationRuntimeLocalArtifacts = [
  "coverage/semantic-documentation-runtime.json",
  "coverage/semantic-documentation-link-path-output.txt",
  "coverage/semantic-documentation-consistency-output.txt",
  "coverage/semantic-documentation-inventory-output.txt",
  "coverage/semantic-documentation-runtime-proof-boundary.json",
  "coverage/semantic-documentation-provider-proof-boundary.json",
  "coverage/semantic-documentation-legal-review-boundary.json",
] as const satisfies readonly SemanticDocumentationRuntimeArtifact[];

export const semanticDocumentationRuntimeExternalArtifacts = [
  "coverage/semantic-documentation-ci-quality-docs.json",
  "coverage/semantic-documentation-redacted-evidence-bundle.json",
  "test-results/semantic-documentation-runtime",
] as const satisfies readonly SemanticDocumentationRuntimeArtifact[];

export interface SemanticDocumentationEvidenceInput {
  readonly qualityDocsPassed: boolean;
  readonly structuralLinksPassed: boolean;
  readonly concreteRepoPathsPassed: boolean;
  readonly productionReadinessClaimsPassed: boolean;
  readonly apiRouteReferencesPassed: boolean;
  readonly providerReadinessLanguagePassed: boolean;
  readonly legalReadinessLanguagePassed: boolean;
  readonly appPackageInventoryPassed: boolean;
  readonly documentationInventoryContractCurrent: boolean;
  readonly ciQualityDocsEvidenceCaptured: boolean;
  readonly runtimeProofSeparated: boolean;
  readonly providerProofSeparated: boolean;
  readonly legalReviewSeparated: boolean;
  readonly semanticDocumentationRunPersisted: boolean;
  readonly redactedEvidenceBundleCaptured: boolean;
  readonly capturedArtifacts: readonly SemanticDocumentationRuntimeArtifact[];
  readonly completedCommands: readonly SemanticDocumentationRuntimeCommand[];
}

export interface SemanticDocumentationEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingArtifacts: readonly SemanticDocumentationRuntimeArtifact[];
  readonly missingCommands: readonly SemanticDocumentationRuntimeCommand[];
  readonly requiredArtifacts: typeof semanticDocumentationRuntimeArtifactPaths;
  readonly requiredCommands: typeof semanticDocumentationRuntimeCommands;
  readonly requiredEvidence: typeof semanticDocumentationRuntimeRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface SemanticDocumentationRuntimeExecutionPlan {
  readonly localCommands: typeof semanticDocumentationRuntimeLocalCommands;
  readonly externalCommands: typeof semanticDocumentationRuntimeExternalCommands;
  readonly localArtifacts: typeof semanticDocumentationRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof semanticDocumentationRuntimeExternalArtifacts;
  readonly qualityDocsExecutionAllowed: false;
  readonly linkAuditExecutionAllowed: false;
  readonly consistencyAuditExecutionAllowed: false;
  readonly inventoryAuditExecutionAllowed: false;
  readonly ciQualityDocsExecutionAllowed: false;
  readonly runtimeBoundaryExecutionAllowed: false;
  readonly providerBoundaryExecutionAllowed: false;
  readonly legalBoundaryExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly executionPolicy: typeof semanticDocumentationRuntimeExecutionPolicy;
  readonly requiredExternalEvidence: typeof semanticDocumentationRuntimeRequiredExternalEvidence;
}

export interface SemanticDocumentationRuntimeArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof semanticDocumentationRuntimeRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export interface SemanticDocumentationRuntimeRedactedEvidenceBundle {
  readonly status: "redacted-evidence-bundle-ready";
  readonly artifactPath: "coverage/semantic-documentation-redacted-evidence-bundle.json";
  readonly review: SemanticDocumentationRuntimeArtifactReview;
  readonly requiredArtifacts: typeof semanticDocumentationRuntimeArtifactPaths;
  readonly requiredExternalEvidence: typeof semanticDocumentationRuntimeRequiredExternalEvidence;
  readonly providerExecutionAllowed: false;
}

export const semanticDocumentationRuntimeLocalCommands = [
  "pnpm quality:docs",
  "node scripts/quality/audit-doc-links.mjs",
  "node scripts/quality/verify-documentation-consistency.mjs",
  "node scripts/quality/verify-documentation-inventory.mjs",
  "document that semantic docs are not runtime build or live route proof",
  "document that provider readiness proof stays separate from wording checks",
  "document that legal review proof stays separate from wording checks",
] as const satisfies readonly SemanticDocumentationRuntimeCommand[];

export const semanticDocumentationRuntimeExternalCommands = [
  "GitHub Actions CI quality job",
] as const satisfies readonly SemanticDocumentationRuntimeCommand[];

export const semanticDocumentationRuntimeRequiredExternalEvidence = [
  "CI quality-docs job URL and conclusion captured from GitHub Actions.",
  "Durable SemanticDocumentationRun persistence row captured from the target database.",
  "Runtime build and live route proof captured outside semantic documentation wording checks.",
  "Provider readiness proof captured outside semantic documentation wording checks.",
  "Legal review proof captured outside semantic documentation wording checks.",
  "Redacted semantic documentation evidence bundle captured without raw provider, legal, runtime, or CI secrets.",
] as const;

export type SemanticDocumentationRuntimeExecutionPolicy = {
  readonly codexMayClassifyStaticSemanticDocumentation: true;
  readonly ciQualityDocsEvidenceRequiredForClosure: true;
  readonly providerProofMustRemainSeparate: true;
  readonly legalReviewMustRemainSeparate: true;
  readonly runtimeProofMustRemainSeparate: true;
  readonly providerDatabaseRequiredForPersistence: true;
};

export const semanticDocumentationRuntimeExecutionPolicy: SemanticDocumentationRuntimeExecutionPolicy = {
  codexMayClassifyStaticSemanticDocumentation: true,
  ciQualityDocsEvidenceRequiredForClosure: true,
  providerProofMustRemainSeparate: true,
  legalReviewMustRemainSeparate: true,
  runtimeProofMustRemainSeparate: true,
  providerDatabaseRequiredForPersistence: true,
};

export const semanticDocumentationRuntimeMatrix = [
  {
    id: "structural-links-and-paths",
    command: "node scripts/quality/audit-doc-links.mjs",
    artifact: "coverage/semantic-documentation-link-path-output.txt",
    status: "wired",
  },
  {
    id: "semantic-consistency",
    command: "node scripts/quality/verify-documentation-consistency.mjs",
    artifact: "coverage/semantic-documentation-consistency-output.txt",
    status: "wired",
  },
  {
    id: "workspace-inventory",
    command: "node scripts/quality/verify-documentation-inventory.mjs",
    artifact: "coverage/semantic-documentation-inventory-output.txt",
    status: "wired",
  },
  {
    id: "quality-docs-aggregate",
    command: "pnpm quality:docs",
    artifact: "coverage/semantic-documentation-runtime.json",
    status: "wired",
  },
  {
    id: "ci-quality-docs",
    command: "GitHub Actions CI quality job",
    artifact: "coverage/semantic-documentation-ci-quality-docs.json",
    status: "ci-gated",
  },
  {
    id: "runtime-proof-boundary",
    command: "document that semantic docs are not runtime build or live route proof",
    artifact: "coverage/semantic-documentation-runtime-proof-boundary.json",
    status: "runtime-proof-separated",
  },
  {
    id: "provider-proof-boundary",
    command: "document that provider readiness proof stays separate from wording checks",
    artifact: "coverage/semantic-documentation-provider-proof-boundary.json",
    status: "provider-proof-separated",
  },
  {
    id: "legal-review-boundary",
    command: "document that legal review proof stays separate from wording checks",
    artifact: "coverage/semantic-documentation-legal-review-boundary.json",
    status: "legal-review-separated",
  },
  {
    id: "redacted-evidence-bundle",
    command: "retain redacted semantic documentation evidence bundle",
    artifact: "coverage/semantic-documentation-redacted-evidence-bundle.json",
    status: "ci-gated",
  },
] as const satisfies readonly SemanticDocumentationRuntimeMatrixEntry[];

export const semanticDocumentationRunPersistenceContract: SemanticDocumentationRunPersistenceContract = {
  prismaModel: "SemanticDocumentationRun",
  tenantRelation: "semanticDocumentationRuns",
  uniqueKey: ["tenantId", "runId"],
  jsonFields: ["semanticCheckMatrix", "proofBoundaryMatrix", "artifactManifest"],
  requiredBooleanProofs: [
    "qualityDocsPassed",
    "structuralLinksPassed",
    "concreteRepoPathsPassed",
    "productionReadinessClaimsPassed",
    "apiRouteReferencesPassed",
    "providerReadinessLanguagePassed",
    "legalReadinessLanguagePassed",
    "appPackageInventoryPassed",
    "documentationInventoryContractCurrent",
    "ciQualityDocsEvidenceCaptured",
    "runtimeProofSeparated",
    "providerProofSeparated",
    "legalReviewSeparated",
  ],
  artifactFields: [
    "linkPathArtifactPath",
    "consistencyArtifactPath",
    "inventoryArtifactPath",
    "ciQualityDocsArtifactPath",
    "runtimeBoundaryArtifactPath",
    "providerBoundaryArtifactPath",
    "legalBoundaryArtifactPath",
  ],
};

export const semanticDocumentationRuntimeReadiness = buildSemanticDocumentationRuntimeReadinessPlan({
  qualityDocsScriptIncludesLinkAudit: true,
  qualityDocsScriptIncludesConsistencyAudit: true,
  qualityDocsScriptIncludesInventoryAudit: true,
  structuralLinksPassed: true,
  concreteRepoPathsPassed: true,
  productionReadinessClaimsPassed: true,
  apiRouteReferencesPassed: true,
  providerReadinessLanguagePassed: true,
  legalReadinessLanguagePassed: true,
  appPackageInventoryPassed: true,
  documentationInventoryContractCurrent: true,
  ciEvidenceCaptured: false,
  runtimeProofSeparated: true,
  providerProofSeparated: true,
  legalReviewSeparated: true,
});

export function buildSemanticDocumentationDecisionRequiredEvidence(
  readinessEvidence: typeof semanticDocumentationRuntimeReadiness.requiredEvidence,
): SemanticDocumentationRuntimeRequiredEvidence {
  return [
    ...readinessEvidence,
    "SemanticDocumentationRun row with semantic check, proof boundary, and artifact matrices.",
    "Artifact bundle proving quality docs, link/path, consistency, inventory, CI, runtime boundary, provider boundary, and legal boundary evidence.",
  ];
}

export type SemanticDocumentationRuntimeRequiredEvidence = readonly [
  ...typeof semanticDocumentationRuntimeReadiness.requiredEvidence,
  "SemanticDocumentationRun row with semantic check, proof boundary, and artifact matrices.",
  "Artifact bundle proving quality docs, link/path, consistency, inventory, CI, runtime boundary, provider boundary, and legal boundary evidence.",
];

export const semanticDocumentationRuntimeRequiredEvidence = buildSemanticDocumentationDecisionRequiredEvidence(
  semanticDocumentationRuntimeReadiness.requiredEvidence,
);

export function buildSemanticDocumentationEvidenceDecision(
  input: SemanticDocumentationEvidenceInput,
): SemanticDocumentationEvidenceDecision {
  const readinessPlan = buildSemanticDocumentationRuntimeReadinessPlan({
    qualityDocsScriptIncludesLinkAudit: true,
    qualityDocsScriptIncludesConsistencyAudit: true,
    qualityDocsScriptIncludesInventoryAudit: true,
    structuralLinksPassed: input.structuralLinksPassed,
    concreteRepoPathsPassed: input.concreteRepoPathsPassed,
    productionReadinessClaimsPassed: input.productionReadinessClaimsPassed,
    apiRouteReferencesPassed: input.apiRouteReferencesPassed,
    providerReadinessLanguagePassed: input.providerReadinessLanguagePassed,
    legalReadinessLanguagePassed: input.legalReadinessLanguagePassed,
    appPackageInventoryPassed: input.appPackageInventoryPassed,
    documentationInventoryContractCurrent: input.documentationInventoryContractCurrent,
    ciEvidenceCaptured: input.ciQualityDocsEvidenceCaptured,
    runtimeProofSeparated: input.runtimeProofSeparated,
    providerProofSeparated: input.providerProofSeparated,
    legalReviewSeparated: input.legalReviewSeparated,
  });
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingArtifacts = semanticDocumentationRuntimeArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = semanticDocumentationRuntimeCommands.filter((command) => !completedCommands.has(command));
  const blockers = [...readinessPlan.blockers];

  if (!input.qualityDocsPassed) {
    blockers.push("pnpm quality:docs must pass.");
  }
  if (!input.semanticDocumentationRunPersisted) {
    blockers.push("SemanticDocumentationRun persistence row must be captured for durable auditability.");
  }
  if (!input.redactedEvidenceBundleCaptured) {
    blockers.push("Redacted semantic documentation evidence bundle must be captured.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required semantic documentation artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required semantic documentation command must be completed.");
  }

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    missingArtifacts,
    missingCommands,
    requiredArtifacts: semanticDocumentationRuntimeArtifactPaths,
    requiredCommands: semanticDocumentationRuntimeCommands,
    requiredEvidence: semanticDocumentationRuntimeRequiredEvidence,
    blockers,
  };
}

const sensitiveSemanticDocumentationKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|tenant|user|account|database|url|uri|dsn|key|id|provider|legal|client)$/iu;
const sensitiveSemanticDocumentationValuePattern =
  /(https?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|[A-Za-z0-9_-]{24,})/giu;

const redactSemanticDocumentationString = (value: string): string =>
  value.replace(sensitiveSemanticDocumentationValuePattern, "[REDACTED]");

const buildRedactedSemanticDocumentationValue = (
  value: unknown,
  path: string,
  redactions: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item, index) => buildRedactedSemanticDocumentationValue(item, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveSemanticDocumentationKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedSemanticDocumentationValue(nestedValue, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redactedValue = redactSemanticDocumentationString(value);
    if (redactedValue !== value) {
      redactions.push(path || "value");
    }
    return redactedValue;
  }

  return value;
};

export function buildSemanticDocumentationRuntimeExecutionPlan(): SemanticDocumentationRuntimeExecutionPlan {
  return {
    localCommands: semanticDocumentationRuntimeLocalCommands,
    externalCommands: semanticDocumentationRuntimeExternalCommands,
    localArtifacts: semanticDocumentationRuntimeLocalArtifacts,
    externalArtifacts: semanticDocumentationRuntimeExternalArtifacts,
    qualityDocsExecutionAllowed: false,
    linkAuditExecutionAllowed: false,
    consistencyAuditExecutionAllowed: false,
    inventoryAuditExecutionAllowed: false,
    ciQualityDocsExecutionAllowed: false,
    runtimeBoundaryExecutionAllowed: false,
    providerBoundaryExecutionAllowed: false,
    legalBoundaryExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    executionPolicy: semanticDocumentationRuntimeExecutionPolicy,
    requiredExternalEvidence: semanticDocumentationRuntimeRequiredExternalEvidence,
  };
}

export function buildRedactedSemanticDocumentationArtifact(artifact: unknown): unknown {
  return buildRedactedSemanticDocumentationValue(artifact, "", []);
}

export function buildSemanticDocumentationRuntimeArtifactReview(
  artifact: unknown,
): SemanticDocumentationRuntimeArtifactReview {
  const redactions: string[] = [];

  return {
    artifact: buildRedactedSemanticDocumentationValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: semanticDocumentationRuntimeRequiredExternalEvidence,
    safeForTracker: true,
  };
}

export function buildSemanticDocumentationRuntimeRedactedEvidenceBundle(
  artifact: unknown,
): SemanticDocumentationRuntimeRedactedEvidenceBundle {
  return {
    status: "redacted-evidence-bundle-ready",
    artifactPath: "coverage/semantic-documentation-redacted-evidence-bundle.json",
    review: buildSemanticDocumentationRuntimeArtifactReview(artifact),
    requiredArtifacts: semanticDocumentationRuntimeArtifactPaths,
    requiredExternalEvidence: semanticDocumentationRuntimeRequiredExternalEvidence,
    providerExecutionAllowed: false,
  };
}

