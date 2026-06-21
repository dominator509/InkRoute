import { buildProductionLaunchEvidenceRuntimeReadinessPlan } from "@inkroute/deployment";
import type { ProductionLaunchEvidenceBundleId } from "@inkroute/deployment";

export type ProductionLaunchEvidenceRuntimeStatus =
  | "wired"
  | "evidence-gated"
  | "approval-gated"
  | "ci-gated";

export interface ProductionLaunchEvidenceRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: ProductionLaunchEvidenceRuntimeStatus;
}

export interface ProductionLaunchEvidenceRunPersistenceContract {
  readonly prismaModel: "ProductionLaunchEvidenceRun";
  readonly tenantRelation: "productionLaunchEvidenceRuns";
  readonly uniqueKey: readonly ["tenantId", "runId"];
  readonly jsonFields: readonly ["launchBundleMatrix", "checklistBlockers", "unsafeEvidenceFindings", "artifactManifest"];
  readonly requiredBooleanProofs: readonly [
    "verifierPassed",
    "ciBuildTestEvidenceVerified",
    "databaseOperationsEvidenceVerified",
    "providerSecretEvidenceVerified",
    "securityPrivacyTrustEvidenceVerified",
    "accessibilitySeoPerformanceVerified",
    "mobileReleaseEvidenceVerified",
    "legalApprovalVerified",
    "rollbackOperationsEvidenceVerified",
    "checklistBlockersRetained",
    "unsafeEvidenceScanPassed",
    "explicitProductionApprovalCaptured",
    "ciLaunchEvidenceArtifactsCaptured"
  ];
  readonly redactedArtifactFields: readonly [
    "launchEvidenceBundleArtifactPath",
    "checklistBlockerArtifactPath",
    "unsafeEvidenceArtifactPath",
    "legalApprovalArtifactPath",
    "rollbackOperationsArtifactPath",
    "explicitApprovalArtifactPath"
  ];
}

export const productionLaunchEvidenceBundleIds: readonly ProductionLaunchEvidenceBundleId[] = [
  "ci-build-test",
  "database-ops",
  "provider-and-secret-readiness",
  "security-privacy-trust",
  "accessibility-seo-performance",
  "mobile-release",
  "legal-approval",
  "rollback-and-operations"
] as const;

export const productionLaunchEvidenceBundleRequiredEvidence = [
  "redacted evidence label",
  "source artifact",
  "approval/blocker status",
] as const;

export const productionLaunchEvidenceRuntimeArtifactPaths = [
  "coverage/production-launch-evidence-runtime.json",
  "coverage/production-launch-verifier.json",
  "coverage/production-launch-ci-build-test-redacted.json",
  "coverage/production-launch-database-ops-redacted.json",
  "coverage/production-launch-provider-secret-redacted.json",
  "coverage/production-launch-security-privacy-redacted.json",
  "coverage/production-launch-a11y-seo-performance-redacted.json",
  "coverage/production-launch-mobile-release-redacted.json",
  "coverage/production-launch-legal-approval-redacted.json",
  "coverage/production-launch-rollback-operations-redacted.json",
  "coverage/production-launch-checklist-blockers.json",
  "coverage/production-launch-approval-redacted.json",
  "coverage/production-launch-ci-run-redacted.json",
  "test-results/production-launch-evidence-runtime"
] as const;

export const productionLaunchEvidenceRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "apps/web/package.json",
  "apps/web/lib/productionLaunchEvidenceRuntime.ts",
  "apps/web/tests/production-launch-evidence-runtime-static.test.ts",
  "deployment/PRODUCTION_LAUNCH_CHECKLIST.md",
  "deployment/manifests/production-launch-checklist.json",
  "deployment/manifests/production-launch-evidence.json",
  "deployment/scripts/verify-launch-evidence.mjs",
  "packages/deployment/src/index.ts",
  "packages/deployment/tests/deployment-readiness.test.ts",
  "TESTING_PLAN.md",
  "SECURITY.md",
  "SEO_PLAN.md",
  "GAP_TRACKER.md",
  ".github/workflows/ci.yml",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609021000_add_production_launch_evidence_runs/migration.sql",
  "testing/manifests/unit-test-manifest.json"
] as const;

export const productionLaunchEvidenceRuntimeCommands = [
  "pnpm deploy:verify-launch-evidence",
  "pnpm quality:all",
  "pnpm test:unit",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard build",
  "verify production launch database operations bundle",
  "verify production launch provider readiness bundle",
  "verify production launch secret readiness bundle",
  "verify production launch security/privacy/trust bundle",
  "verify production launch accessibility/SEO/performance bundle",
  "pnpm deploy:verify-mobile",
  "verify production launch legal approval bundle",
  "production rollback drill"
] as const;

export const productionLaunchEvidenceRuntimeLocalCommands = ["pnpm deploy:verify-launch-evidence"] as const;
export const productionLaunchEvidenceRuntimeExternalCommands = productionLaunchEvidenceRuntimeCommands.filter(
  (command) => command !== "pnpm deploy:verify-launch-evidence",
);

export const productionLaunchEvidenceRuntimeRequiredExternalEvidence = [
  "CI/build/test, database, provider, secret, security, accessibility, SEO, performance, and mobile bundles must be captured outside Codex when execution is approved.",
  "Legal approval and explicit production approval must be human-reviewed, redacted, and captured only after every bundle is verified.",
  "Rollback and operations artifacts must prove approved runtime execution and redact incident owner contact details.",
  "Launch evidence artifacts must redact provider IDs, database URLs, run URLs, reviewer contacts, customer data, and approval payloads.",
] as const;

export type ProductionLaunchEvidenceRuntimeExecutionPolicy = {
  readonly codexMayClassifyLaunchBundles: true;
  readonly approvalBlockedUntilEveryBundleVerified: true;
  readonly legalApprovalRequiresHumanReviewer: true;
  readonly rollbackDrillRequiresApprovedRuntime: true;
  readonly productionApprovalMustRemainHumanGated: true;
  readonly unsafeEvidenceForbidden: true;
};

export const productionLaunchEvidenceRuntimeExecutionPolicy: ProductionLaunchEvidenceRuntimeExecutionPolicy = {
  codexMayClassifyLaunchBundles: true,
  approvalBlockedUntilEveryBundleVerified: true,
  legalApprovalRequiresHumanReviewer: true,
  rollbackDrillRequiresApprovedRuntime: true,
  productionApprovalMustRemainHumanGated: true,
  unsafeEvidenceForbidden: true,
};

export type ProductionLaunchEvidenceRuntimeArtifact = (typeof productionLaunchEvidenceRuntimeArtifactPaths)[number];

export type ProductionLaunchEvidenceRuntimeCommand = (typeof productionLaunchEvidenceRuntimeCommands)[number];

export const productionLaunchEvidenceRuntimeLocalArtifacts = [
  "coverage/production-launch-evidence-runtime.json",
  "coverage/production-launch-verifier.json",
  "coverage/production-launch-checklist-blockers.json",
  "test-results/production-launch-evidence-runtime",
] as const satisfies readonly ProductionLaunchEvidenceRuntimeArtifact[];

export const productionLaunchEvidenceRuntimeExternalArtifacts = [
  "coverage/production-launch-ci-build-test-redacted.json",
  "coverage/production-launch-database-ops-redacted.json",
  "coverage/production-launch-provider-secret-redacted.json",
  "coverage/production-launch-security-privacy-redacted.json",
  "coverage/production-launch-a11y-seo-performance-redacted.json",
  "coverage/production-launch-mobile-release-redacted.json",
  "coverage/production-launch-legal-approval-redacted.json",
  "coverage/production-launch-rollback-operations-redacted.json",
  "coverage/production-launch-approval-redacted.json",
  "coverage/production-launch-ci-run-redacted.json",
] as const satisfies readonly ProductionLaunchEvidenceRuntimeArtifact[];

export type ProductionLaunchEvidenceRuntimeEvidenceInput = {
  verifierPassed: boolean;
  ciBuildTestEvidenceVerified: boolean;
  databaseOperationsEvidenceVerified: boolean;
  providerSecretEvidenceVerified: boolean;
  securityPrivacyTrustEvidenceVerified: boolean;
  accessibilitySeoPerformanceVerified: boolean;
  mobileReleaseEvidenceVerified: boolean;
  legalApprovalVerified: boolean;
  rollbackOperationsEvidenceVerified: boolean;
  checklistBlockersRetained: boolean;
  unsafeEvidenceScanPassed: boolean;
  explicitProductionApprovalCaptured: boolean;
  ciLaunchEvidenceArtifactsCaptured: boolean;
  requiredCommandsRun: readonly ProductionLaunchEvidenceRuntimeCommand[];
  capturedArtifacts: readonly ProductionLaunchEvidenceRuntimeArtifact[];
};

export type ProductionLaunchEvidenceRuntimeEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: ProductionLaunchEvidenceRuntimeArtifact[];
  requiredCommands: typeof productionLaunchEvidenceRuntimeCommands;
  requiredEvidence: typeof productionLaunchEvidenceRuntimeArtifactPaths;
  launchPolicy: {
    approvalBlockedUntilEveryBundleVerified: true;
    unsafeEvidenceForbidden: true;
    redactedApprovalRecordRequired: true;
  };
};

export interface ProductionLaunchEvidenceRuntimeExecutionPlan {
  readonly localCommands: typeof productionLaunchEvidenceRuntimeLocalCommands;
  readonly externalCommands: typeof productionLaunchEvidenceRuntimeExternalCommands;
  readonly localArtifacts: typeof productionLaunchEvidenceRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof productionLaunchEvidenceRuntimeExternalArtifacts;
  readonly verifierExecutionAllowed: false;
  readonly qualityGateExecutionAllowed: false;
  readonly buildExecutionAllowed: false;
  readonly databaseBundleExecutionAllowed: false;
  readonly providerSecretBundleExecutionAllowed: false;
  readonly securityPrivacyTrustExecutionAllowed: false;
  readonly accessibilitySeoPerformanceExecutionAllowed: false;
  readonly mobileReleaseExecutionAllowed: false;
  readonly legalApprovalExecutionAllowed: false;
  readonly rollbackDrillExecutionAllowed: false;
  readonly productionApprovalExecutionAllowed: false;
  readonly ciArtifactExecutionAllowed: false;
  readonly executionPolicy: typeof productionLaunchEvidenceRuntimeExecutionPolicy;
  readonly externalEvidenceRequired: typeof productionLaunchEvidenceRuntimeRequiredExternalEvidence;
}

export interface ProductionLaunchEvidenceRuntimeArtifactReview {
  readonly artifactPath: ProductionLaunchEvidenceRuntimeArtifact | string;
  readonly redactedArtifact: unknown;
  readonly redactions: readonly string[];
  readonly containsUnredactedSensitiveValues: false;
  readonly externalEvidenceRequired: typeof productionLaunchEvidenceRuntimeRequiredExternalEvidence;
}

const sensitiveProductionLaunchKeyPattern =
  /(token|secret|password|authorization|cookie|approval|legal|reviewer|provider|projectId|databaseUrl|directUrl|ciRunUrl|deployUrl|rollback|incident|tenantId|userId|runId|email|phone|contact|payload)/i;

const sensitiveProductionLaunchStringPatterns: readonly [RegExp, string][] = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED_TOKEN]"],
  [/postgres(?:ql)?:\/\/[^\s"'<>]+/gi, "[REDACTED_DATABASE_URL]"],
  [/https?:\/\/[^\s"'<>]+/gi, "[REDACTED_URL]"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]"],
  [/\+?1?[-.\s(]*\d{3}[-.\s)]*\d{3}[-.\s]*\d{4}/g, "[REDACTED_PHONE]"],
  [/\b(?:tenant|user|project|approval|rollback|incident|run|bundle)_[A-Za-z0-9_-]+\b/g, "[REDACTED_ID]"],
];

export function buildProductionLaunchEvidenceRuntimeEvidenceDecision(
  input: ProductionLaunchEvidenceRuntimeEvidenceInput,
): ProductionLaunchEvidenceRuntimeEvidenceDecision {
  const blockers = [
    !input.verifierPassed && "Run production launch evidence verifier.",
    !input.ciBuildTestEvidenceVerified && "Verify CI/build/test evidence bundle.",
    !input.databaseOperationsEvidenceVerified && "Verify database operations evidence bundle.",
    !input.providerSecretEvidenceVerified && "Verify provider and secret readiness evidence bundle.",
    !input.securityPrivacyTrustEvidenceVerified && "Verify security/privacy/trust evidence bundle.",
    !input.accessibilitySeoPerformanceVerified && "Verify accessibility/SEO/performance evidence bundle.",
    !input.mobileReleaseEvidenceVerified && "Verify mobile release evidence bundle.",
    !input.legalApprovalVerified && "Verify legal approval evidence bundle.",
    !input.rollbackOperationsEvidenceVerified && "Verify rollback and operations evidence bundle.",
    !input.checklistBlockersRetained && "Retain production checklist blockers until evidence is verified.",
    !input.unsafeEvidenceScanPassed && "Run unsafe evidence scan.",
    !input.explicitProductionApprovalCaptured && "Capture explicit redacted production approval.",
    !input.ciLaunchEvidenceArtifactsCaptured && "Capture CI launch-evidence artifacts.",
  ].filter(Boolean) as string[];

  const missingArtifacts = productionLaunchEvidenceRuntimeArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = productionLaunchEvidenceRuntimeCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: productionLaunchEvidenceRuntimeCommands,
    requiredEvidence: productionLaunchEvidenceRuntimeArtifactPaths,
    launchPolicy: {
      approvalBlockedUntilEveryBundleVerified: true,
      unsafeEvidenceForbidden: true,
      redactedApprovalRecordRequired: true,
    },
  };
}

export function buildProductionLaunchEvidenceRuntimeExecutionPlan(): ProductionLaunchEvidenceRuntimeExecutionPlan {
  return {
    localCommands: productionLaunchEvidenceRuntimeLocalCommands,
    externalCommands: productionLaunchEvidenceRuntimeExternalCommands,
    localArtifacts: productionLaunchEvidenceRuntimeLocalArtifacts,
    externalArtifacts: productionLaunchEvidenceRuntimeExternalArtifacts,
    verifierExecutionAllowed: false,
    qualityGateExecutionAllowed: false,
    buildExecutionAllowed: false,
    databaseBundleExecutionAllowed: false,
    providerSecretBundleExecutionAllowed: false,
    securityPrivacyTrustExecutionAllowed: false,
    accessibilitySeoPerformanceExecutionAllowed: false,
    mobileReleaseExecutionAllowed: false,
    legalApprovalExecutionAllowed: false,
    rollbackDrillExecutionAllowed: false,
    productionApprovalExecutionAllowed: false,
    ciArtifactExecutionAllowed: false,
    executionPolicy: productionLaunchEvidenceRuntimeExecutionPolicy,
    externalEvidenceRequired: productionLaunchEvidenceRuntimeRequiredExternalEvidence,
  };
}

function redactProductionLaunchString(value: string, redactions: Set<string>): string {
  return sensitiveProductionLaunchStringPatterns.reduce((current, [pattern, replacement]) => {
    pattern.lastIndex = 0;
    if (pattern.test(current)) {
      redactions.add(replacement);
    }
    pattern.lastIndex = 0;
    return current.replace(pattern, replacement);
  }, value);
}

function redactProductionLaunchValue(value: unknown, redactions: Set<string>, key?: string): unknown {
  if (key && sensitiveProductionLaunchKeyPattern.test(key)) {
    redactions.add(key);
    return `[REDACTED_${key.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}]`;
  }

  if (typeof value === "string") {
    return redactProductionLaunchString(value, redactions);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactProductionLaunchValue(entry, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactProductionLaunchValue(entryValue, redactions, entryKey),
      ]),
    );
  }

  return value;
}

export function buildRedactedProductionLaunchEvidenceArtifact(artifact: unknown): unknown {
  return redactProductionLaunchValue(artifact, new Set<string>());
}

export function buildProductionLaunchEvidenceRuntimeArtifactReview(
  artifactPath: ProductionLaunchEvidenceRuntimeArtifact | string,
  artifact: unknown,
): ProductionLaunchEvidenceRuntimeArtifactReview {
  const redactions = new Set<string>();
  const redactedArtifact = redactProductionLaunchValue(artifact, redactions);

  return {
    artifactPath,
    redactedArtifact,
    redactions: [...redactions].sort(),
    containsUnredactedSensitiveValues: false,
    externalEvidenceRequired: productionLaunchEvidenceRuntimeRequiredExternalEvidence,
  };
}

export const productionLaunchEvidenceRuntimeMatrix: readonly ProductionLaunchEvidenceRuntimeMatrixEntry[] = [
  {
    id: "launch-evidence-verifier",
    command: "pnpm deploy:verify-launch-evidence",
    artifact: "coverage/production-launch-verifier.json",
    status: "wired"
  },
  {
    id: "ci-build-test-bundle",
    command: "pnpm quality:all && pnpm test:unit && web/dashboard builds",
    artifact: "coverage/production-launch-ci-build-test-redacted.json",
    status: "ci-gated"
  },
  {
    id: "database-ops-bundle",
    command: "verify production launch database operations bundle",
    artifact: "coverage/production-launch-database-ops-redacted.json",
    status: "evidence-gated"
  },
  {
    id: "provider-secret-bundle",
    command: "verify production launch provider readiness bundle and verify production launch secret readiness bundle",
    artifact: "coverage/production-launch-provider-secret-redacted.json",
    status: "evidence-gated"
  },
  {
    id: "security-privacy-trust-bundle",
    command: "verify production launch security/privacy/trust bundle",
    artifact: "coverage/production-launch-security-privacy-redacted.json",
    status: "evidence-gated"
  },
  {
    id: "accessibility-seo-performance-bundle",
    command: "verify production launch accessibility/SEO/performance bundle",
    artifact: "coverage/production-launch-a11y-seo-performance-redacted.json",
    status: "evidence-gated"
  },
  {
    id: "mobile-release-bundle",
    command: "pnpm deploy:verify-mobile",
    artifact: "coverage/production-launch-mobile-release-redacted.json",
    status: "evidence-gated"
  },
  {
    id: "legal-approval-bundle",
    command: "verify production launch legal approval bundle",
    artifact: "coverage/production-launch-legal-approval-redacted.json",
    status: "approval-gated"
  },
  {
    id: "rollback-operations-bundle",
    command: "production rollback drill",
    artifact: "coverage/production-launch-rollback-operations-redacted.json",
    status: "evidence-gated"
  },
  {
    id: "final-approval-record",
    command: "capture explicit redacted production approval after every bundle is verified",
    artifact: "coverage/production-launch-approval-redacted.json",
    status: "approval-gated"
  }
];

export const productionLaunchEvidenceRunPersistenceContract: ProductionLaunchEvidenceRunPersistenceContract = {
  prismaModel: "ProductionLaunchEvidenceRun",
  tenantRelation: "productionLaunchEvidenceRuns",
  uniqueKey: ["tenantId", "runId"],
  jsonFields: ["launchBundleMatrix", "checklistBlockers", "unsafeEvidenceFindings", "artifactManifest"],
  requiredBooleanProofs: [
    "verifierPassed",
    "ciBuildTestEvidenceVerified",
    "databaseOperationsEvidenceVerified",
    "providerSecretEvidenceVerified",
    "securityPrivacyTrustEvidenceVerified",
    "accessibilitySeoPerformanceVerified",
    "mobileReleaseEvidenceVerified",
    "legalApprovalVerified",
    "rollbackOperationsEvidenceVerified",
    "checklistBlockersRetained",
    "unsafeEvidenceScanPassed",
    "explicitProductionApprovalCaptured",
    "ciLaunchEvidenceArtifactsCaptured"
  ],
  redactedArtifactFields: [
    "launchEvidenceBundleArtifactPath",
    "checklistBlockerArtifactPath",
    "unsafeEvidenceArtifactPath",
    "legalApprovalArtifactPath",
    "rollbackOperationsArtifactPath",
    "explicitApprovalArtifactPath"
  ]
};

export const productionLaunchEvidenceRuntimeReadiness = buildProductionLaunchEvidenceRuntimeReadinessPlan({
  approvalStatus: "blocked",
  requiredBundles: productionLaunchEvidenceBundleIds.map((id) => ({
    id,
    area: id,
    status: "missing",
    requiredEvidence: productionLaunchEvidenceBundleRequiredEvidence,
    sourceArtifacts: ["deployment/manifests/production-launch-evidence.json"],
    gapIds: ["GAP-118"]
  })),
  productionChecklistBlockerCount: 8,
  verifierPassed: false,
  ciBuildTestEvidenceVerified: false,
  providerEvidenceVerified: false,
  legalApprovalVerified: false,
  rollbackEvidenceVerified: false,
  explicitProductionApprovalCaptured: false
});
