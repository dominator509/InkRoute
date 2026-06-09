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
  "test-results/semantic-documentation-runtime",
] as const;

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
