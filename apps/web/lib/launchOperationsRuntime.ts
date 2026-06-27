import { buildLaunchOperationsRuntimeReadinessPlan } from "@inkroute/deployment";
import type { LaunchOperationCheckId } from "@inkroute/deployment";

export type LaunchOperationsRuntimeStatus =
  | "wired"
  | "owner-gated"
  | "drill-gated"
  | "monitoring-gated"
  | "approval-gated"
  | "ci-gated";

export interface LaunchOperationsRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: LaunchOperationsRuntimeStatus;
}

export interface LaunchOperationsRunPersistenceContract {
  readonly prismaModel: "LaunchOperationsRun";
  readonly tenantRelation: "launchOperationsRuns";
  readonly uniqueKey: readonly ["tenantId", "runId"];
  readonly jsonFields: readonly ["ownerCoverageMatrix", "operationCheckMatrix", "unsafeEvidenceFindings", "artifactManifest"];
  readonly requiredBooleanProofs: readonly [
    "verifierPassed",
    "namedPrimaryBackupOwnersAssigned",
    "onCallCoverageVerified",
    "alertRoutingTestPassed",
    "supportEscalationDrillPassed",
    "privacyRequestDrillPassed",
    "incidentDrillPassed",
    "rollbackDrillPassed",
    "productionMonitoringVerified",
    "communicationsTemplatesApproved",
    "unsafeEvidenceScanPassed",
    "explicitOperationsApprovalCaptured",
    "ciLaunchOperationsArtifactsCaptured"
  ];
  readonly redactedArtifactFields: readonly [
    "ownerCoverageArtifactPath",
    "alertRoutingArtifactPath",
    "supportEscalationArtifactPath",
    "privacyRequestDrillArtifactPath",
    "incidentDrillArtifactPath",
    "rollbackDrillArtifactPath",
    "monitoringDashboardArtifactPath",
    "communicationsTemplateArtifactPath",
    "operationsApprovalArtifactPath"
  ];
}

export const launchOperationsRuntimeCheckIds: readonly LaunchOperationCheckId[] = [
  "on-call-coverage",
  "alert-routing",
  "support-escalation",
  "privacy-request-drill",
  "incident-drill",
  "rollback-drill",
  "production-monitoring",
  "communications-templates"
] as const;

export const launchOperationsRuntimeArtifactPaths = [
  "coverage/launch-operations-runtime.json",
  "coverage/launch-operations-verifier.json",
  "coverage/launch-operations-owner-coverage-redacted.json",
  "coverage/launch-operations-alert-routing-redacted.json",
  "coverage/launch-operations-support-escalation-redacted.json",
  "coverage/launch-operations-privacy-request-drill-redacted.json",
  "coverage/launch-operations-incident-drill-redacted.json",
  "coverage/launch-operations-rollback-drill-redacted.json",
  "coverage/launch-operations-monitoring-dashboard-redacted.json",
  "coverage/launch-operations-communications-templates-redacted.json",
  "coverage/launch-operations-approval-redacted.json",
  "coverage/launch-operations-ci-run-redacted.json",
  "coverage/launch-operations-redacted-evidence-bundle.json",
  "test-results/launch-operations-runtime"
] as const;

export const launchOperationsRuntimeProofFiles = [
  "apps/web/lib/launchOperationsRuntime.ts",
  "apps/web/tests/launch-operations-runtime-static.test.ts",
  "deployment/PRODUCTION_LAUNCH_CHECKLIST.md",
  "deployment/manifests/launch-operations-evidence.json",
  "deployment/scripts/verify-launch-operations.mjs",
  "packages/deployment/src/index.ts",
  "packages/deployment/tests/deployment-readiness.test.ts",
  "BUG_CRASH_REPORTING_PLAN.md",
  "SECURITY.md",
  "RELEASE_AND_AUTO_UPDATE_PLAN.md",
  ".env.example",
  ".github/workflows/ci.yml",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609022000_add_launch_operations_runs/migration.sql",
  "testing/manifests/unit-test-manifest.json"
] as const;

export const launchOperationsRuntimeCommands = [
  "pnpm deploy:verify-ops",
  "assign named primary and backup launch operations owners",
  "verify launch operations on-call coverage",
  "alert routing test",
  "incident drill",
  "rollback drill",
  "privacy export/delete drill",
  "support escalation drill",
  "production monitoring dashboard review",
  "communications template approval",
  "capture explicit launch operations approval",
  "capture CI launch-operations artifacts"
] as const;

export const launchOperationsRuntimeLocalCommands = ["pnpm deploy:verify-ops"] as const;
export const launchOperationsRuntimeExternalCommands = launchOperationsRuntimeCommands.filter(
  (command) => command !== "pnpm deploy:verify-ops",
);

export const launchOperationsRuntimeRequiredExternalEvidence = [
  "Named owner, on-call, alert routing, and support escalation proof must be captured outside Codex with private contact details redacted.",
  "Incident, rollback, privacy, and support drills must redact customer data, provider alert webhooks, and raw support transcripts.",
  "Monitoring dashboard and communications approval artifacts must redact provider URLs, contact details, and approval payloads.",
  "Explicit operations approval and CI launch-operations artifacts must remain redacted before repository retention.",
  "Redacted launch operations evidence bundle captured without private contact details, provider alert webhooks, raw support transcripts, customer data, monitoring URLs, approval payloads, or CI run URLs.",
] as const;

export type LaunchOperationsRuntimeExecutionPolicy = {
  readonly codexMayClassifyOpsEvidence: true;
  readonly namedPrimaryAndBackupOwnersRequired: true;
  readonly privateContactDetailsForbidden: true;
  readonly providerAlertWebhookUrlsForbidden: true;
  readonly staffedOperationsRequiredForApproval: true;
  readonly ciProviderRequiredForOperationsArtifacts: true;
};

export const launchOperationsRuntimeExecutionPolicy: LaunchOperationsRuntimeExecutionPolicy = {
  codexMayClassifyOpsEvidence: true,
  namedPrimaryAndBackupOwnersRequired: true,
  privateContactDetailsForbidden: true,
  providerAlertWebhookUrlsForbidden: true,
  staffedOperationsRequiredForApproval: true,
  ciProviderRequiredForOperationsArtifacts: true,
};

export type LaunchOperationsRuntimeArtifact = (typeof launchOperationsRuntimeArtifactPaths)[number];

export type LaunchOperationsRuntimeCommand = (typeof launchOperationsRuntimeCommands)[number];

export const launchOperationsRuntimeLocalArtifacts = [
  "coverage/launch-operations-runtime.json",
  "coverage/launch-operations-verifier.json",
  "test-results/launch-operations-runtime",
] as const satisfies readonly LaunchOperationsRuntimeArtifact[];

export const launchOperationsRuntimeExternalArtifacts = launchOperationsRuntimeArtifactPaths.filter(
  (artifact) =>
    artifact !== "coverage/launch-operations-runtime.json" &&
    artifact !== "coverage/launch-operations-verifier.json" &&
    artifact !== "test-results/launch-operations-runtime",
);

export type LaunchOperationsRuntimeEvidenceInput = {
  verifierPassed: boolean;
  namedPrimaryBackupOwnersAssigned: boolean;
  onCallCoverageVerified: boolean;
  alertRoutingTestPassed: boolean;
  supportEscalationDrillPassed: boolean;
  privacyRequestDrillPassed: boolean;
  incidentDrillPassed: boolean;
  rollbackDrillPassed: boolean;
  productionMonitoringVerified: boolean;
  communicationsTemplatesApproved: boolean;
  unsafeEvidenceScanPassed: boolean;
  explicitOperationsApprovalCaptured: boolean;
  ciLaunchOperationsArtifactsCaptured: boolean;
  requiredCommandsRun: readonly LaunchOperationsRuntimeCommand[];
  capturedArtifacts: readonly LaunchOperationsRuntimeArtifact[];
};

export type LaunchOperationsRuntimeEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: LaunchOperationsRuntimeArtifact[];
  requiredCommands: typeof launchOperationsRuntimeCommands;
  requiredEvidence: typeof launchOperationsRuntimeArtifactPaths;
  operationsPolicy: {
    namedPrimaryAndBackupOwnersRequired: true;
    privateContactDetailsForbidden: true;
    explicitOperationsApprovalRequired: true;
  };
};

export interface LaunchOperationsRuntimeExecutionPlan {
  readonly localCommands: typeof launchOperationsRuntimeLocalCommands;
  readonly externalCommands: typeof launchOperationsRuntimeExternalCommands;
  readonly localArtifacts: typeof launchOperationsRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof launchOperationsRuntimeExternalArtifacts;
  readonly verifierExecutionAllowed: false;
  readonly ownerAssignmentExecutionAllowed: false;
  readonly onCallCoverageExecutionAllowed: false;
  readonly alertRoutingExecutionAllowed: false;
  readonly incidentDrillExecutionAllowed: false;
  readonly rollbackDrillExecutionAllowed: false;
  readonly privacyDrillExecutionAllowed: false;
  readonly supportEscalationExecutionAllowed: false;
  readonly monitoringReviewExecutionAllowed: false;
  readonly communicationsApprovalExecutionAllowed: false;
  readonly operationsApprovalExecutionAllowed: false;
  readonly ciArtifactExecutionAllowed: false;
  readonly executionPolicy: typeof launchOperationsRuntimeExecutionPolicy;
  readonly externalEvidenceRequired: typeof launchOperationsRuntimeRequiredExternalEvidence;
}

export interface LaunchOperationsRuntimeRedactedEvidenceBundle {
  readonly status: "redacted-evidence-bundle-ready";
  readonly artifactPath: "coverage/launch-operations-redacted-evidence-bundle.json";
  readonly review: LaunchOperationsRuntimeArtifactReview;
  readonly requiredArtifacts: typeof launchOperationsRuntimeArtifactPaths;
  readonly externalEvidenceRequired: typeof launchOperationsRuntimeRequiredExternalEvidence;
  readonly operationsApprovalExecutionAllowed: false;
  readonly ciArtifactExecutionAllowed: false;
}

export interface LaunchOperationsRuntimeArtifactReview {
  readonly artifactPath: LaunchOperationsRuntimeArtifact | string;
  readonly redactedArtifact: unknown;
  readonly redactions: readonly string[];
  readonly containsUnredactedSensitiveValues: false;
  readonly externalEvidenceRequired: typeof launchOperationsRuntimeRequiredExternalEvidence;
}

const sensitiveLaunchOperationsKeyPattern =
  /(token|secret|password|authorization|cookie|contact|email|phone|owner|onCall|pager|webhook|alertUrl|supportTranscript|customer|incident|rollback|privacy|monitoringUrl|dashboardUrl|approval|ciRunUrl|tenantId|userId|runId)/i;

const sensitiveLaunchOperationsStringPatterns: readonly [RegExp, string][] = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED_TOKEN]"],
  [/https?:\/\/[^\s"'<>]+/gi, "[REDACTED_URL]"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]"],
  [/\+?1?[-.\s(]*\d{3}[-.\s)]*\d{3}[-.\s]*\d{4}/g, "[REDACTED_PHONE]"],
  [/\b(?:tenant|user|owner|incident|rollback|privacy|support|alert|run)_[A-Za-z0-9_-]+\b/g, "[REDACTED_ID]"],
];

export function buildLaunchOperationsRuntimeEvidenceDecision(
  input: LaunchOperationsRuntimeEvidenceInput,
): LaunchOperationsRuntimeEvidenceDecision {
  const blockers = [
    !input.verifierPassed && "Run launch operations verifier.",
    !input.namedPrimaryBackupOwnersAssigned && "Assign named primary and backup owners.",
    !input.onCallCoverageVerified && "Verify on-call coverage.",
    !input.alertRoutingTestPassed && "Run alert routing test.",
    !input.supportEscalationDrillPassed && "Run support escalation drill.",
    !input.privacyRequestDrillPassed && "Run privacy request drill.",
    !input.incidentDrillPassed && "Run incident drill.",
    !input.rollbackDrillPassed && "Run rollback drill.",
    !input.productionMonitoringVerified && "Verify production monitoring dashboards.",
    !input.communicationsTemplatesApproved && "Approve communications templates.",
    !input.unsafeEvidenceScanPassed && "Run unsafe evidence scan.",
    !input.explicitOperationsApprovalCaptured && "Capture explicit operations approval.",
    !input.ciLaunchOperationsArtifactsCaptured && "Capture CI launch-operations artifacts.",
  ].filter(Boolean) as string[];

  const missingArtifacts = launchOperationsRuntimeArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = launchOperationsRuntimeCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: launchOperationsRuntimeCommands,
    requiredEvidence: launchOperationsRuntimeArtifactPaths,
    operationsPolicy: {
      namedPrimaryAndBackupOwnersRequired: true,
      privateContactDetailsForbidden: true,
      explicitOperationsApprovalRequired: true,
    },
  };
}

export function buildLaunchOperationsRuntimeExecutionPlan(): LaunchOperationsRuntimeExecutionPlan {
  return {
    localCommands: launchOperationsRuntimeLocalCommands,
    externalCommands: launchOperationsRuntimeExternalCommands,
    localArtifacts: launchOperationsRuntimeLocalArtifacts,
    externalArtifacts: launchOperationsRuntimeExternalArtifacts,
    verifierExecutionAllowed: false,
    ownerAssignmentExecutionAllowed: false,
    onCallCoverageExecutionAllowed: false,
    alertRoutingExecutionAllowed: false,
    incidentDrillExecutionAllowed: false,
    rollbackDrillExecutionAllowed: false,
    privacyDrillExecutionAllowed: false,
    supportEscalationExecutionAllowed: false,
    monitoringReviewExecutionAllowed: false,
    communicationsApprovalExecutionAllowed: false,
    operationsApprovalExecutionAllowed: false,
    ciArtifactExecutionAllowed: false,
    executionPolicy: launchOperationsRuntimeExecutionPolicy,
    externalEvidenceRequired: launchOperationsRuntimeRequiredExternalEvidence,
  };
}

function redactLaunchOperationsString(value: string, redactions: Set<string>): string {
  return sensitiveLaunchOperationsStringPatterns.reduce((current, [pattern, replacement]) => {
    pattern.lastIndex = 0;
    if (pattern.test(current)) {
      redactions.add(replacement);
    }
    pattern.lastIndex = 0;
    return current.replace(pattern, replacement);
  }, value);
}

function redactLaunchOperationsValue(value: unknown, redactions: Set<string>, key?: string): unknown {
  if (key && sensitiveLaunchOperationsKeyPattern.test(key)) {
    redactions.add(key);
    return `[REDACTED_${key.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}]`;
  }

  if (typeof value === "string") {
    return redactLaunchOperationsString(value, redactions);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactLaunchOperationsValue(entry, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactLaunchOperationsValue(entryValue, redactions, entryKey),
      ]),
    );
  }

  return value;
}

export function buildRedactedLaunchOperationsArtifact(artifact: unknown): unknown {
  return redactLaunchOperationsValue(artifact, new Set<string>());
}

export function buildLaunchOperationsRuntimeArtifactReview(
  artifactPath: LaunchOperationsRuntimeArtifact | string,
  artifact: unknown,
): LaunchOperationsRuntimeArtifactReview {
  const redactions = new Set<string>();
  const redactedArtifact = redactLaunchOperationsValue(artifact, redactions);

  return {
    artifactPath,
    redactedArtifact,
    redactions: [...redactions].sort(),
    containsUnredactedSensitiveValues: false,
    externalEvidenceRequired: launchOperationsRuntimeRequiredExternalEvidence,
  };
}

export function buildLaunchOperationsRuntimeRedactedEvidenceBundle(
  artifactPath: LaunchOperationsRuntimeArtifact | string,
  artifact: unknown,
): LaunchOperationsRuntimeRedactedEvidenceBundle {
  return {
    status: "redacted-evidence-bundle-ready",
    artifactPath: "coverage/launch-operations-redacted-evidence-bundle.json",
    review: buildLaunchOperationsRuntimeArtifactReview(artifactPath, artifact),
    requiredArtifacts: launchOperationsRuntimeArtifactPaths,
    externalEvidenceRequired: launchOperationsRuntimeRequiredExternalEvidence,
    operationsApprovalExecutionAllowed: false,
    ciArtifactExecutionAllowed: false,
  };
}

export const launchOperationsRuntimeMatrix: readonly LaunchOperationsRuntimeMatrixEntry[] = [
  {
    id: "operations-verifier",
    command: "pnpm deploy:verify-ops",
    artifact: "coverage/launch-operations-verifier.json",
    status: "wired"
  },
  {
    id: "owner-coverage",
    command: "assign named primary and backup launch operations owners",
    artifact: "coverage/launch-operations-owner-coverage-redacted.json",
    status: "owner-gated"
  },
  {
    id: "on-call-coverage",
    command: "verify launch operations on-call coverage",
    artifact: "coverage/launch-operations-owner-coverage-redacted.json",
    status: "owner-gated"
  },
  {
    id: "alert-routing",
    command: "alert routing test",
    artifact: "coverage/launch-operations-alert-routing-redacted.json",
    status: "monitoring-gated"
  },
  {
    id: "incident-drill",
    command: "incident drill",
    artifact: "coverage/launch-operations-incident-drill-redacted.json",
    status: "drill-gated"
  },
  {
    id: "rollback-drill",
    command: "rollback drill",
    artifact: "coverage/launch-operations-rollback-drill-redacted.json",
    status: "drill-gated"
  },
  {
    id: "privacy-request-drill",
    command: "privacy export/delete drill",
    artifact: "coverage/launch-operations-privacy-request-drill-redacted.json",
    status: "drill-gated"
  },
  {
    id: "support-escalation-drill",
    command: "support escalation drill",
    artifact: "coverage/launch-operations-support-escalation-redacted.json",
    status: "drill-gated"
  },
  {
    id: "monitoring-dashboard",
    command: "production monitoring dashboard review",
    artifact: "coverage/launch-operations-monitoring-dashboard-redacted.json",
    status: "monitoring-gated"
  },
  {
    id: "communications-templates-approval",
    command: "communications template approval",
    artifact: "coverage/launch-operations-communications-templates-redacted.json",
    status: "approval-gated"
  },
  {
    id: "operations-approval",
    command: "capture explicit launch operations approval",
    artifact: "coverage/launch-operations-approval-redacted.json",
    status: "approval-gated"
  },
  {
    id: "ci-operations-artifacts",
    command: "capture CI launch-operations artifacts",
    artifact: "coverage/launch-operations-ci-run-redacted.json",
    status: "ci-gated"
  },
  {
    id: "redacted-evidence-bundle",
    command: "retain redacted launch operations evidence bundle",
    artifact: "coverage/launch-operations-redacted-evidence-bundle.json",
    status: "approval-gated"
  }
];

export const launchOperationsRunPersistenceContract: LaunchOperationsRunPersistenceContract = {
  prismaModel: "LaunchOperationsRun",
  tenantRelation: "launchOperationsRuns",
  uniqueKey: ["tenantId", "runId"],
  jsonFields: ["ownerCoverageMatrix", "operationCheckMatrix", "unsafeEvidenceFindings", "artifactManifest"],
  requiredBooleanProofs: [
    "verifierPassed",
    "namedPrimaryBackupOwnersAssigned",
    "onCallCoverageVerified",
    "alertRoutingTestPassed",
    "supportEscalationDrillPassed",
    "privacyRequestDrillPassed",
    "incidentDrillPassed",
    "rollbackDrillPassed",
    "productionMonitoringVerified",
    "communicationsTemplatesApproved",
    "unsafeEvidenceScanPassed",
    "explicitOperationsApprovalCaptured",
    "ciLaunchOperationsArtifactsCaptured"
  ],
  redactedArtifactFields: [
    "ownerCoverageArtifactPath",
    "alertRoutingArtifactPath",
    "supportEscalationArtifactPath",
    "privacyRequestDrillArtifactPath",
    "incidentDrillArtifactPath",
    "rollbackDrillArtifactPath",
    "monitoringDashboardArtifactPath",
    "communicationsTemplateArtifactPath",
    "operationsApprovalArtifactPath"
  ]
};

export const launchOperationsRuntimeReadiness = buildLaunchOperationsRuntimeReadinessPlan({
  approvalStatus: "blocked",
  ownerModel: {
    incidentCommander: "unassigned",
    privacyOwner: "unassigned",
    supportOwner: "unassigned",
    releaseOwner: "unassigned",
    securityOwner: "unassigned",
    requiresNamedPrimaryAndBackup: true
  },
  operationChecks: [],
  verifierPassed: false,
  alertTestPassed: false,
  incidentDrillPassed: false,
  rollbackDrillPassed: false,
  privacyRequestDrillPassed: false,
  supportEscalationDrillPassed: false,
  monitoringDashboardVerified: false,
  communicationsTemplatesApproved: false
});
