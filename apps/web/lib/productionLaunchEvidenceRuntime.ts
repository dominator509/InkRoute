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

export const productionLaunchEvidenceRuntimeCommands = [
  "pnpm deploy:verify-launch-evidence",
  "pnpm quality:all",
  "pnpm test:unit",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard build",
  "pnpm deploy:verify-database-ops",
  "pnpm deploy:verify-provider-envs",
  "pnpm deploy:verify-secrets",
  "pnpm deploy:verify-mobile",
  "production rollback drill"
] as const;

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
    id: "database-provider-secret-bundles",
    command: "verify database, provider, and secret evidence bundles",
    artifact: "coverage/production-launch-provider-secret-redacted.json",
    status: "evidence-gated"
  },
  {
    id: "security-quality-mobile-bundles",
    command: "verify security/privacy, accessibility/SEO/performance, and mobile release evidence bundles",
    artifact: "coverage/production-launch-mobile-release-redacted.json",
    status: "evidence-gated"
  },
  {
    id: "legal-approval-bundle",
    command: "verify legal approval labels for privacy, terms, consent, SMS, deposit, refund, and medical copy",
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
    requiredEvidence: ["redacted evidence label", "source artifact", "approval/blocker status"],
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
