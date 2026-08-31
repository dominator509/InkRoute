import {
  buildDocumentationAuditRuntimeReadinessPlan,
  documentationAuditRuntimeRequiredEvidence as documentationAuditPackageRequiredEvidence,
} from "@inkroute/quality";

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
  "provider readiness evidence review",
  "legal readiness evidence review",
  "stale provider status proof review",
] as const;

export const documentationAuditRuntimeLocalCommands = [
  "pnpm quality:docs",
  "node scripts/quality/audit-doc-links.mjs",
  "node scripts/quality/verify-documentation-consistency.mjs",
  "node scripts/quality/verify-documentation-inventory.mjs",
] as const;

const documentationAuditRuntimeLocalCommandSet = new Set<string>(documentationAuditRuntimeLocalCommands);

export const documentationAuditRuntimeExternalCommands = documentationAuditRuntimeCommands.filter(
  (command) => !documentationAuditRuntimeLocalCommandSet.has(command),
);

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
  "coverage/documentation-audit-redacted-evidence-bundle.json",
  "test-results/documentation-audit-runtime",
] as const;

export const documentationAuditRuntimeProofFiles = [
  "scripts/handoff/verify-phase-docs.mjs",
  "scripts/quality/audit-doc-links.mjs",
  "scripts/quality/verify-documentation-consistency.mjs",
  "scripts/quality/verify-documentation-inventory.mjs",
  "packages/quality/src/index.ts",
  "packages/quality/tests/quality-gates.test.ts",
  "docs/handoff/manifests/phase-documentation-audit.json",
  "docs/quality/manifests/markdown-link-audit.json",
  "docs/quality/manifests/documentation-consistency-contract.json",
  "docs/quality/manifests/documentation-consistency-audit.json",
  "docs/quality/manifests/documentation-inventory-contract.json",
  "docs/quality/manifests/documentation-inventory-audit.json",
  "docs/quality/QUALITY_GATE_PROTOCOL.md",
  "apps/web/lib/documentationAuditRuntime.ts",
  "apps/web/tests/documentation-audit-runtime-static.test.ts",
  ".github/workflows/ci.yml",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609027000_add_documentation_audit_runs/migration.sql",
  "testing/manifests/unit-test-manifest.json",
  "package.json",
] as const;

export type DocumentationAuditRuntimeCommand = (typeof documentationAuditRuntimeCommands)[number];
export type DocumentationAuditRuntimeArtifact = (typeof documentationAuditRuntimeArtifactPaths)[number];

export const documentationAuditRuntimeLocalArtifacts = [
  "coverage/documentation-audit-runtime.json",
  "coverage/documentation-link-audit-output.txt",
  "coverage/documentation-consistency-output.txt",
  "coverage/documentation-inventory-output.txt",
  "test-results/documentation-audit-runtime",
] as const satisfies readonly DocumentationAuditRuntimeArtifact[];

export const documentationAuditRuntimeExternalArtifacts = documentationAuditRuntimeArtifactPaths.filter(
  (artifact) =>
    !documentationAuditRuntimeLocalArtifacts.includes(
      artifact as (typeof documentationAuditRuntimeLocalArtifacts)[number],
    ),
) as readonly DocumentationAuditRuntimeArtifact[];

export interface DocumentationAuditEvidenceInput {
  readonly qualityDocsPassed: boolean;
  readonly markdownLinkAuditPassed: boolean;
  readonly documentationConsistencyPassed: boolean;
  readonly documentationInventoryPassed: boolean;
  readonly apiRouteReferencesPassed: boolean;
  readonly providerReadinessLanguagePassed: boolean;
  readonly legalReadinessLanguagePassed: boolean;
  readonly workspaceInventoryPassed: boolean;
  readonly generatedReportsCaptured: boolean;
  readonly ciQualityDocsEvidenceCaptured: boolean;
  readonly providerReviewEvidenceCaptured: boolean;
  readonly legalReviewEvidenceCaptured: boolean;
  readonly staleProviderStatusProofCaptured: boolean;
  readonly documentationAuditRunPersisted: boolean;
  readonly capturedArtifacts: readonly DocumentationAuditRuntimeArtifact[];
  readonly completedCommands: readonly DocumentationAuditRuntimeCommand[];
}

export interface DocumentationAuditEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingArtifacts: readonly DocumentationAuditRuntimeArtifact[];
  readonly missingCommands: readonly DocumentationAuditRuntimeCommand[];
  readonly requiredArtifacts: typeof documentationAuditRuntimeArtifactPaths;
  readonly requiredCommands: typeof documentationAuditRuntimeCommands;
  readonly requiredEvidence: typeof documentationAuditRuntimeRequiredEvidence;
  readonly blockers: readonly string[];
}

export const documentationAuditRuntimeReadinessRequiredEvidence = documentationAuditPackageRequiredEvidence;

export type DocumentationAuditRuntimeRequiredEvidence = readonly [
  ...typeof documentationAuditRuntimeReadinessRequiredEvidence,
  "DocumentationAuditRun row with audit report, documentation consistency, review evidence, and artifact matrices.",
  "CI artifact bundle proving quality docs, generated reports, provider review, legal review, and stale provider status evidence.",
];

export function buildDocumentationAuditDecisionRequiredEvidence(
  readinessEvidence: typeof documentationAuditRuntimeReadinessRequiredEvidence,
): DocumentationAuditRuntimeRequiredEvidence {
  return [
    ...readinessEvidence,
    "DocumentationAuditRun row with audit report, documentation consistency, review evidence, and artifact matrices.",
    "CI artifact bundle proving quality docs, generated reports, provider review, legal review, and stale provider status evidence.",
  ];
}

export const documentationAuditRuntimeRequiredEvidence = buildDocumentationAuditDecisionRequiredEvidence(
  documentationAuditRuntimeReadinessRequiredEvidence,
);

export interface DocumentationAuditRuntimeExecutionPlan {
  readonly localCommands: typeof documentationAuditRuntimeLocalCommands;
  readonly externalCommands: typeof documentationAuditRuntimeExternalCommands;
  readonly localArtifacts: typeof documentationAuditRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof documentationAuditRuntimeExternalArtifacts;
  readonly qualityDocsExecutionAllowed: false;
  readonly markdownLinkAuditExecutionAllowed: false;
  readonly documentationConsistencyExecutionAllowed: false;
  readonly documentationInventoryExecutionAllowed: false;
  readonly ciQualityDocsExecutionAllowed: false;
  readonly providerReviewExecutionAllowed: false;
  readonly legalReviewExecutionAllowed: false;
  readonly staleProviderStatusExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly executionPolicy: typeof documentationAuditRuntimeExecutionPolicy;
  readonly externalEvidenceRequired: typeof documentationAuditRuntimeRequiredExternalEvidence;
}

export interface DocumentationAuditRuntimeArtifactReview {
  readonly artifactPath: DocumentationAuditRuntimeArtifact | string;
  readonly redactedArtifact: unknown;
  readonly redactions: readonly string[];
  readonly containsUnredactedSensitiveValues: false;
  readonly externalEvidenceRequired: typeof documentationAuditRuntimeRequiredExternalEvidence;
}

export interface DocumentationAuditRuntimeRedactedEvidenceBundle {
  readonly status: "redacted-evidence-bundle-ready";
  readonly sourceArtifactPath: DocumentationAuditRuntimeArtifact | string;
  readonly artifactPath: "coverage/documentation-audit-redacted-evidence-bundle.json";
  readonly review: DocumentationAuditRuntimeArtifactReview;
  readonly requiredArtifacts: typeof documentationAuditRuntimeArtifactPaths;
  readonly externalEvidenceRequired: typeof documentationAuditRuntimeRequiredExternalEvidence;
  readonly ciQualityDocsExecutionAllowed: false;
  readonly providerReviewExecutionAllowed: false;
  readonly legalReviewExecutionAllowed: false;
  readonly staleProviderStatusExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
}

export const documentationAuditRuntimeRequiredExternalEvidence = [
  "CI quality-docs evidence must be captured from GitHub Actions with run URLs and logs redacted.",
  "Provider readiness review evidence must include redacted labels only and keep provider resource IDs out of repository artifacts.",
  "Legal readiness review evidence must redact attorney/reviewer contact details and privileged communications.",
  "Stale provider status proof and DocumentationAuditRun persistence must remain external until approved evidence exists.",
  "Redacted documentation audit evidence bundle must omit raw CI logs, provider resource IDs, reviewer contacts, privileged communications, stale-provider URLs, and run URLs.",
] as const;

export type DocumentationAuditRuntimeExecutionPolicy = {
  readonly codexMayClassifyLocalDocumentationAudits: true;
  readonly ciEvidenceRequiredForClosure: true;
  readonly providerReviewEvidenceRequired: true;
  readonly legalReviewEvidenceRequired: true;
  readonly staleProviderStatusProofRequired: true;
  readonly providerDatabaseRequiredForPersistence: true;
};

export const documentationAuditRuntimeExecutionPolicy: DocumentationAuditRuntimeExecutionPolicy = {
  codexMayClassifyLocalDocumentationAudits: true,
  ciEvidenceRequiredForClosure: true,
  providerReviewEvidenceRequired: true,
  legalReviewEvidenceRequired: true,
  staleProviderStatusProofRequired: true,
  providerDatabaseRequiredForPersistence: true,
};

const sensitiveDocumentationAuditKeyPattern =
  /(token|secret|password|authorization|cookie|provider|projectId|resourceId|legal|attorney|reviewer|privileged|contact|ciRun|ciRunUrl|workflow|commit|artifact|artifactUrl|path|tenantId|userId|runId|email|phone|payload|raw|request|response|markdown|document|doc|link|inventory|consistency|audit|quality|command|output|log|transcript|report|status|stale|url|uri|stack|error|database|dsn|repository|branch|pr|pullrequest|codeowner|check)/i;

const sensitiveDocumentationAuditStringPatterns: readonly [RegExp, string][] = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED_TOKEN]"],
  [/https?:\/\/[^\s"'<>]+/gi, "[REDACTED_URL]"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]"],
  [/\+?1?[-.\s(]*\d{3}[-.\s)]*\d{3}[-.\s]*\d{4}/g, "[REDACTED_PHONE]"],
  [/\b(?:ghp|gho|ghu|ghs|sk|pk|rk|whsec)_[A-Za-z0-9_]+\b/g, "[REDACTED_PROVIDER_TOKEN]"],
  [/postgres(?:ql)?:\/\/[^\s"'<>]+/gi, "[REDACTED_DSN]"],
  [/\b(?:tenant|user|project|provider|artifact|review|legal|run|resource|document|doc|link|inventory|consistency|audit|quality|status|stale|workflow|ci|commit|repository|branch|pr|pullrequest|reviewer|codeowner|check)_[A-Za-z0-9_.-]+\b/gi, "[REDACTED_ID]"],
  [/\b(?:coverage|artifacts|test-results|reports|docs)\/[A-Za-z0-9_./-]{6,}\b/gi, "[REDACTED_ARTIFACT_PATH]"],
];

export function buildDocumentationAuditRuntimeExecutionPlan(): DocumentationAuditRuntimeExecutionPlan {
  return {
    localCommands: documentationAuditRuntimeLocalCommands,
    externalCommands: documentationAuditRuntimeExternalCommands,
    localArtifacts: documentationAuditRuntimeLocalArtifacts,
    externalArtifacts: documentationAuditRuntimeExternalArtifacts,
    qualityDocsExecutionAllowed: false,
    markdownLinkAuditExecutionAllowed: false,
    documentationConsistencyExecutionAllowed: false,
    documentationInventoryExecutionAllowed: false,
    ciQualityDocsExecutionAllowed: false,
    providerReviewExecutionAllowed: false,
    legalReviewExecutionAllowed: false,
    staleProviderStatusExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    executionPolicy: documentationAuditRuntimeExecutionPolicy,
    externalEvidenceRequired: documentationAuditRuntimeRequiredExternalEvidence,
  };
}

function redactDocumentationAuditString(value: string, redactions: Set<string>): string {
  return sensitiveDocumentationAuditStringPatterns.reduce((current, [pattern, replacement]) => {
    pattern.lastIndex = 0;
    if (pattern.test(current)) {
      redactions.add(replacement);
    }
    pattern.lastIndex = 0;
    return current.replace(pattern, replacement);
  }, value);
}

function redactDocumentationAuditValue(value: unknown, redactions: Set<string>, key?: string): unknown {
  if (key && sensitiveDocumentationAuditKeyPattern.test(key)) {
    redactions.add(key);
    return `[REDACTED_${key.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}]`;
  }

  if (typeof value === "string") {
    return redactDocumentationAuditString(value, redactions);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactDocumentationAuditValue(entry, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactDocumentationAuditValue(entryValue, redactions, entryKey),
      ]),
    );
  }

  return value;
}

export function buildRedactedDocumentationAuditArtifact(artifact: unknown): unknown {
  return redactDocumentationAuditValue(artifact, new Set<string>());
}

export function buildDocumentationAuditRuntimeArtifactReview(
  artifactPath: DocumentationAuditRuntimeArtifact | string,
  artifact: unknown,
): DocumentationAuditRuntimeArtifactReview {
  const redactions = new Set<string>();
  const redactedArtifact = redactDocumentationAuditValue(artifact, redactions);

  return {
    artifactPath,
    redactedArtifact,
    redactions: [...redactions].sort(),
    containsUnredactedSensitiveValues: false,
    externalEvidenceRequired: documentationAuditRuntimeRequiredExternalEvidence,
  };
}

export function buildDocumentationAuditRuntimeRedactedEvidenceBundle(
  artifactPath: DocumentationAuditRuntimeArtifact | string,
  artifact: unknown,
): DocumentationAuditRuntimeRedactedEvidenceBundle {
  return {
    status: "redacted-evidence-bundle-ready",
    sourceArtifactPath: artifactPath,
    artifactPath: "coverage/documentation-audit-redacted-evidence-bundle.json",
    review: buildDocumentationAuditRuntimeArtifactReview(artifactPath, artifact),
    requiredArtifacts: documentationAuditRuntimeArtifactPaths,
    externalEvidenceRequired: documentationAuditRuntimeRequiredExternalEvidence,
    ciQualityDocsExecutionAllowed: false,
    providerReviewExecutionAllowed: false,
    legalReviewExecutionAllowed: false,
    staleProviderStatusExecutionAllowed: false,
    persistenceExecutionAllowed: false,
  };
}

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
  {
    id: "redacted-evidence-bundle",
    command: "retain redacted documentation audit evidence bundle",
    artifact: "coverage/documentation-audit-redacted-evidence-bundle.json",
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

export function buildDocumentationAuditEvidenceDecision(
  input: DocumentationAuditEvidenceInput,
): DocumentationAuditEvidenceDecision {
  const readinessPlan = buildDocumentationAuditRuntimeReadinessPlan({
    rootScripts: {
      "quality:docs": "pnpm quality:doc-links && pnpm quality:doc-consistency && pnpm quality:doc-inventory",
      "quality:doc-links": "node scripts/quality/audit-doc-links.mjs",
      "quality:doc-consistency": "node scripts/quality/verify-documentation-consistency.mjs",
      "quality:doc-inventory": "node scripts/quality/verify-documentation-inventory.mjs",
    },
    auditsPassed: {
      markdownLinks: input.markdownLinkAuditPassed,
      semanticPaths: input.documentationConsistencyPassed,
      routeReferences: input.apiRouteReferencesPassed,
      providerReadinessLanguage: input.providerReadinessLanguagePassed,
      legalReadinessLanguage: input.legalReadinessLanguagePassed,
      workspaceInventory: input.documentationInventoryPassed && input.workspaceInventoryPassed,
    },
    reportsGenerated: input.generatedReportsCaptured ? [...documentationAuditGeneratedReports] : [],
    ciEvidenceCaptured: input.ciQualityDocsEvidenceCaptured,
    providerReviewEvidenceCaptured: input.providerReviewEvidenceCaptured,
    legalReviewEvidenceCaptured: input.legalReviewEvidenceCaptured,
    staleProviderStatusProofCaptured: input.staleProviderStatusProofCaptured,
    packageInventoryCheckPassed: input.workspaceInventoryPassed,
    appInventoryCheckPassed: input.workspaceInventoryPassed,
  });
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingArtifacts = documentationAuditRuntimeArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = documentationAuditRuntimeCommands.filter((command) => !completedCommands.has(command));
  const blockers = [...readinessPlan.blockers];

  if (!input.qualityDocsPassed) {
    blockers.push("pnpm quality:docs must pass.");
  }
  if (!input.markdownLinkAuditPassed) {
    blockers.push("Markdown link/path audit must pass.");
  }
  if (!input.documentationConsistencyPassed) {
    blockers.push("Documentation consistency audit must pass.");
  }
  if (!input.documentationInventoryPassed) {
    blockers.push("Documentation inventory audit must pass.");
  }
  if (!input.generatedReportsCaptured) {
    blockers.push("Generated documentation audit reports must be captured.");
  }
  if (!input.documentationAuditRunPersisted) {
    blockers.push("DocumentationAuditRun persistence row must be captured for durable auditability.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required documentation audit artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required documentation audit command must be completed.");
  }

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    missingArtifacts,
    missingCommands,
    requiredArtifacts: documentationAuditRuntimeArtifactPaths,
    requiredCommands: documentationAuditRuntimeCommands,
    requiredEvidence: documentationAuditRuntimeRequiredEvidence,
    blockers,
  };
}

