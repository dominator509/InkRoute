import { buildDocumentationAuditRuntimeReadinessPlan } from "@inkroute/quality";

export type DocumentationAuditRuntimeStatus =
  | "wired"
  | "ci-gated"
  | "provider-gated"
  | "legal-gated"
  | "evidence-gated";

export interface DocumentationAuditRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DocumentationAuditRuntimeStatus;
}

export interface DocumentationAuditRunPersistenceContract {
  readonly prismaModel: "DocumentationAuditRun";
  readonly tenantRelation: "documentationAuditRuns";
  readonly uniqueKey: readonly ["tenantId", "runId"];
  readonly jsonFields: readonly [
    "auditReportMatrix",
    "documentationConsistencyFindings",
    "reviewEvidenceManifest",
    "artifactManifest"
  ];
  readonly requiredBooleanProofs: readonly [
    "qualityDocsPassed",
    "markdownLinkAuditPassed",
    "documentationConsistencyPassed",
    "documentationInventoryPassed",
    "apiRouteReferencesPassed",
    "providerReadinessLanguagePassed",
    "legalReadinessLanguagePassed",
    "workspaceInventoryPassed",
    "generatedReportsCaptured",
    "ciQualityDocsEvidenceCaptured",
    "providerReviewEvidenceCaptured",
    "legalReviewEvidenceCaptured",
    "staleProviderStatusProofCaptured"
  ];
  readonly redactedArtifactFields: readonly [
    "linkAuditArtifactPath",
    "consistencyAuditArtifactPath",
    "inventoryAuditArtifactPath",
    "providerReviewArtifactPath",
    "legalReviewArtifactPath",
    "staleProviderStatusArtifactPath"
  ];
}

export const documentationAuditRuntimeCommands = [
  "pnpm quality:docs",
  "node scripts/quality/audit-doc-links.mjs",
  "node scripts/quality/verify-documentation-consistency.mjs",
  "node scripts/quality/verify-documentation-inventory.mjs",
  "GitHub Actions CI quality job",
  "provider/legal evidence review",
] as const;

export const documentationAuditRootScripts = [
  "quality:docs",
  "quality:doc-links",
  "quality:doc-consistency",
  "quality:doc-inventory",
] as const;

export const documentationAuditGeneratedReports = [
  "docs/quality/manifests/markdown-link-audit.json",
  "docs/quality/manifests/documentation-consistency-audit.json",
  "docs/quality/manifests/documentation-inventory-audit.json",
] as const;

export const documentationAuditRuntimeArtifactPaths = [
  "coverage/documentation-audit-runtime.json",
  "coverage/documentation-link-audit-output.txt",
  "coverage/documentation-consistency-output.txt",
  "coverage/documentation-inventory-output.txt",
  "coverage/documentation-provider-review-redacted.json",
  "coverage/documentation-legal-review-redacted.json",
  "coverage/documentation-stale-provider-status-redacted.json",
  "coverage/documentation-ci-quality-docs.json",
  "test-results/documentation-audit-runtime",
] as const;

export const documentationAuditRuntimeMatrix = [
  {
    id: "markdown-link-path-audit",
    command: "node scripts/quality/audit-doc-links.mjs",
    artifact: "coverage/documentation-link-audit-output.txt",
    status: "wired",
  },
  {
    id: "documentation-consistency-audit",
    command: "node scripts/quality/verify-documentation-consistency.mjs",
    artifact: "coverage/documentation-consistency-output.txt",
    status: "wired",
  },
  {
    id: "documentation-inventory-audit",
    command: "node scripts/quality/verify-documentation-inventory.mjs",
    artifact: "coverage/documentation-inventory-output.txt",
    status: "wired",
  },
  {
    id: "quality-docs-aggregate",
    command: "pnpm quality:docs",
    artifact: "coverage/documentation-audit-runtime.json",
    status: "wired",
  },
  {
    id: "ci-quality-docs-evidence",
    command: "GitHub Actions CI quality job",
    artifact: "coverage/documentation-ci-quality-docs.json",
    status: "ci-gated",
  },
  {
    id: "provider-review-evidence",
    command: "provider readiness evidence review",
    artifact: "coverage/documentation-provider-review-redacted.json",
    status: "provider-gated",
  },
  {
    id: "legal-review-evidence",
    command: "legal readiness evidence review",
    artifact: "coverage/documentation-legal-review-redacted.json",
    status: "legal-gated",
  },
  {
    id: "stale-provider-status-proof",
    command: "stale provider status proof review",
    artifact: "coverage/documentation-stale-provider-status-redacted.json",
    status: "evidence-gated",
  },
] as const satisfies readonly DocumentationAuditRuntimeMatrixEntry[];

export const documentationAuditRunPersistenceContract: DocumentationAuditRunPersistenceContract = {
  prismaModel: "DocumentationAuditRun",
  tenantRelation: "documentationAuditRuns",
  uniqueKey: ["tenantId", "runId"],
  jsonFields: [
    "auditReportMatrix",
    "documentationConsistencyFindings",
    "reviewEvidenceManifest",
    "artifactManifest",
  ],
  requiredBooleanProofs: [
    "qualityDocsPassed",
    "markdownLinkAuditPassed",
    "documentationConsistencyPassed",
    "documentationInventoryPassed",
    "apiRouteReferencesPassed",
    "providerReadinessLanguagePassed",
    "legalReadinessLanguagePassed",
    "workspaceInventoryPassed",
    "generatedReportsCaptured",
    "ciQualityDocsEvidenceCaptured",
    "providerReviewEvidenceCaptured",
    "legalReviewEvidenceCaptured",
    "staleProviderStatusProofCaptured",
  ],
  redactedArtifactFields: [
    "linkAuditArtifactPath",
    "consistencyAuditArtifactPath",
    "inventoryAuditArtifactPath",
    "providerReviewArtifactPath",
    "legalReviewArtifactPath",
    "staleProviderStatusArtifactPath",
  ],
};

export const documentationAuditRuntimeReadiness = buildDocumentationAuditRuntimeReadinessPlan({
  rootScripts: {
    "quality:docs": "pnpm quality:doc-links && pnpm quality:doc-consistency && pnpm quality:doc-inventory",
    "quality:doc-links": "node scripts/quality/audit-doc-links.mjs",
    "quality:doc-consistency": "node scripts/quality/verify-documentation-consistency.mjs",
    "quality:doc-inventory": "node scripts/quality/verify-documentation-inventory.mjs",
  },
  auditsPassed: {
    markdownLinks: true,
    semanticPaths: true,
    routeReferences: true,
    providerReadinessLanguage: true,
    legalReadinessLanguage: true,
    workspaceInventory: true,
  },
  reportsGenerated: [...documentationAuditGeneratedReports],
  ciEvidenceCaptured: false,
  providerReviewEvidenceCaptured: false,
  legalReviewEvidenceCaptured: false,
  staleProviderStatusProofCaptured: false,
  packageInventoryCheckPassed: true,
  appInventoryCheckPassed: true,
});
