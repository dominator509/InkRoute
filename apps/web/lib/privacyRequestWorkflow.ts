import {
  buildPrivacyCaseWorkflowPlan,
  buildPrivacyRequestRuntimeReadinessPlan,
  type PrivacyDataCategory,
  type PrivacyRequestType,
} from "@inkroute/security";

export type PrivacyWorkflowWorkerAction =
  | "persist-privacy-request-case"
  | "verify-requester-identity"
  | "prove-tenant-relationship"
  | "deny-requester-mismatch"
  | "assemble-export-artifact"
  | "redact-third-party-data"
  | "delete-or-anonymize-postgres-records"
  | "delete-or-export-private-storage-objects"
  | "enforce-legal-hold"
  | "persist-status-transition"
  | "send-versioned-notification"
  | "write-privacy-audit-log";

export interface PrivacyWorkflowCaseInput {
  requestType: PrivacyRequestType;
  categories: PrivacyDataCategory[];
  requesterVerified: boolean;
  tenantMembershipVerified: boolean;
  caseStoreConfigured: boolean;
  exportWorkerConfigured: boolean;
  deletionWorkerConfigured: boolean;
  notificationProviderConfigured: boolean;
  auditLogConfigured: boolean;
  legalReviewApproved: boolean;
}

export interface PrivacyRequestPersistenceInput {
  tenantId: string;
  requesterUserId?: string;
  clientId?: string;
  requestType: PrivacyRequestType;
  status: "intake_received" | "identity_pending" | "processing" | "legal_hold" | "completed" | "denied";
  requesterEmail: string;
  requesterName?: string;
  identityProofStatus: "pending" | "verified" | "failed";
  tenantRelationshipStatus: "pending" | "verified" | "mismatch_denied";
  dueAt: string;
  legalHold: boolean;
  legalHoldReason?: string;
  exportArtifactObjectKey?: string;
  deletionTombstoneObjectKey?: string;
}

export interface PrivacyRequestPersistenceContract {
  modelName: "PrivacyRequest";
  row: PrivacyRequestPersistenceInput;
  transactionWrites: readonly ["PrivacyRequest", "AuditLog"];
  statusTransitions: readonly ["intake_received", "identity_pending", "processing", "legal_hold", "completed", "denied"];
  auditActions: readonly [
    "privacy.request.created",
    "privacy.identity.verified",
    "privacy.worker.executed",
    "privacy.legal_hold.applied",
    "privacy.case_closed",
  ];
  redactedFields: readonly ["requesterEmail", "redactedSubmission", "exportArtifactObjectKey"];
  tenantIsolationKey: "tenantId";
}

export const privacyWorkflowArtifactPaths = [
  "coverage/privacy-request-workflow-plan.json",
  "coverage/privacy-identity-proof-redacted.json",
  "coverage/privacy-tenant-relationship-proof.json",
  "coverage/privacy-status-transition-persistence.json",
  "coverage/privacy-export-artifact-redacted.json",
  "coverage/privacy-delete-anonymize-tombstones.json",
  "coverage/privacy-storage-export-delete.json",
  "coverage/privacy-third-party-redaction.json",
  "coverage/privacy-legal-hold-denial.json",
  "coverage/privacy-notification-version-redacted.json",
  "coverage/privacy-audit-log-persistence.json",
  "coverage/privacy-requester-mismatch-denial.json",
  "test-results/privacy-request-workflow",
] as const;

export const privacyWorkflowProofFiles = [
  "packages/security/package.json",
  "packages/security/src/index.ts",
  "packages/security/tests/upload-policy.test.ts",
  "apps/web/lib/privacyRequestWorkflow.ts",
  "apps/web/tests/privacy-request-workflow-static.test.ts",
  "apps/web/app/api/public/[tenantSlug]/privacy-requests/route.ts",
  "apps/dashboard/app/api/security/privacy-requests/route.ts",
  "apps/dashboard/components/PrivacyRequestActionPanel.tsx",
  "apps/web/tests/privacy-requests-public-route.test.ts",
  "apps/web/tests/privacy-requests-dashboard-route.test.ts",
  "apps/dashboard/tests/security-privacy-route-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609001000_add_privacy_requests/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export const privacyWorkflowCommands = [
  "pnpm --filter @inkroute/security test",
  "pnpm vitest run apps/web/tests/privacy-requests-public-route.test.ts apps/web/tests/privacy-requests-dashboard-route.test.ts apps/web/tests/privacy-request-workflow-static.test.ts apps/dashboard/tests/security-privacy-route-static.test.ts",
  "PrivacyRequest Postgres persistence integration test",
  "privacy export worker integration test",
  "privacy delete/anonymize/rectify worker integration test",
  "object-storage privacy export/delete integration test",
  "privacy notification and AuditLog persistence test",
  "cross-tenant privacy requester mismatch denial test",
] as const;

export const privacyWorkflowLocalCommands = privacyWorkflowCommands.slice(0, 2);
export const privacyWorkflowExternalCommands = privacyWorkflowCommands.slice(2);

export const privacyWorkflowRequiredExternalEvidence = [
  "requester identity proofing evidence",
  "tenant relationship proofing evidence",
  "PrivacyRequest Postgres persistence and worker execution proof",
  "object-storage privacy export/delete evidence",
  "privacy notification and AuditLog persistence evidence",
  "cross-tenant requester mismatch denial proof",
] as const;

export type PrivacyWorkflowArtifact = (typeof privacyWorkflowArtifactPaths)[number];

export type PrivacyWorkflowCommand = (typeof privacyWorkflowCommands)[number];

export const privacyWorkflowLocalArtifacts = [
  "coverage/privacy-request-workflow-plan.json",
  "coverage/privacy-status-transition-persistence.json",
  "coverage/privacy-third-party-redaction.json",
  "test-results/privacy-request-workflow",
] as const satisfies readonly PrivacyWorkflowArtifact[];

export const privacyWorkflowExternalArtifacts = [
  "coverage/privacy-identity-proof-redacted.json",
  "coverage/privacy-tenant-relationship-proof.json",
  "coverage/privacy-export-artifact-redacted.json",
  "coverage/privacy-delete-anonymize-tombstones.json",
  "coverage/privacy-storage-export-delete.json",
  "coverage/privacy-legal-hold-denial.json",
  "coverage/privacy-notification-version-redacted.json",
  "coverage/privacy-audit-log-persistence.json",
  "coverage/privacy-requester-mismatch-denial.json",
] as const satisfies readonly PrivacyWorkflowArtifact[];

export type PrivacyWorkflowEvidenceInput = {
  intakeRoutesPassed: boolean;
  identityProofCaptured: boolean;
  tenantRelationshipProofCaptured: boolean;
  statusPersistenceCaptured: boolean;
  exportWorkerCaptured: boolean;
  deleteAnonymizeWorkerCaptured: boolean;
  storageExportDeleteCaptured: boolean;
  thirdPartyRedactionCaptured: boolean;
  legalHoldCaptured: boolean;
  notificationCaptured: boolean;
  auditLogPersistenceCaptured: boolean;
  requesterMismatchDenialCaptured: boolean;
  requiredCommandsRun: readonly PrivacyWorkflowCommand[];
  capturedArtifacts: readonly PrivacyWorkflowArtifact[];
};

export type PrivacyWorkflowEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: PrivacyWorkflowArtifact[];
  requiredCommands: typeof privacyWorkflowCommands;
  requiredEvidence: typeof privacyWorkflowArtifactPaths;
  redactionPolicy: {
    requesterPiiRedacted: true;
    exportObjectKeysRedacted: true;
    thirdPartyDataRedacted: true;
  };
};

export type PrivacyWorkflowExecutionPlan = {
  status: "local-plan-ready";
  identityProofingExecutionAllowed: false;
  postgresWorkerExecutionAllowed: false;
  storageExportDeleteExecutionAllowed: false;
  notificationExecutionAllowed: false;
  legalHoldExecutionAllowed: false;
  crossTenantExecutionAllowed: false;
  policy: PrivacyWorkflowExecutionPolicy;
  localCommands: typeof privacyWorkflowLocalCommands;
  externalCommands: typeof privacyWorkflowExternalCommands;
  localArtifacts: typeof privacyWorkflowLocalArtifacts;
  externalArtifacts: typeof privacyWorkflowExternalArtifacts;
  requiredExternalEvidence: typeof privacyWorkflowRequiredExternalEvidence;
  disabledReasons: readonly string[];
};

export type PrivacyWorkflowExecutionPolicy = {
  identityProofingExecutionAllowed: false;
  postgresWorkerExecutionAllowed: false;
  storageExportDeleteExecutionAllowed: false;
  notificationExecutionAllowed: false;
  legalHoldExecutionAllowed: false;
  crossTenantExecutionAllowed: false;
  thirdPartyRedactionExecutionAllowed: false;
};

export type PrivacyWorkflowArtifactReview = {
  status: "redacted-review-ready";
  redactedArtifact: unknown;
  requiredArtifacts: typeof privacyWorkflowArtifactPaths;
  retainedExternalGates: readonly string[];
};

const privacyWorkflowSensitivePatterns = [
  /(requester[_-]?email['":=\s]+)[^"',\s}]+/gi,
  /(requester[_-]?name['":=\s]+)[^"',\s}]+/gi,
  /(export[_-]?artifact[_-]?object[_-]?key['":=\s]+)[^"',\s}]+/gi,
  /(deletion[_-]?tombstone[_-]?object[_-]?key['":=\s]+)[^"',\s}]+/gi,
  /(notification[_-]?body['":=\s]+)[^"',}]+/gi,
  /(authorization:\s*bearer\s+)[A-Za-z0-9._-]+/gi,
  /(secret['":=\s]+)[^"',\s}]+/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
] as const;

export function buildRedactedPrivacyWorkflowArtifact(value: unknown): unknown {
  if (typeof value === "string") {
    return privacyWorkflowSensitivePatterns.reduce(
      (redacted, pattern) => redacted.replace(pattern, (_match, prefix: string | undefined) => `${prefix ?? ""}[REDACTED]`),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => buildRedactedPrivacyWorkflowArtifact(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /email|phone|name|address|token|secret|authorization|credential|password|rawBody|stack|objectKey|thirdParty|notificationBody|exportArtifact/i.test(key)
          ? "[REDACTED]"
          : buildRedactedPrivacyWorkflowArtifact(entry),
      ]),
    );
  }

  return value;
}

export const privacyWorkflowExecutionPolicy: PrivacyWorkflowExecutionPolicy = {
  identityProofingExecutionAllowed: false,
  postgresWorkerExecutionAllowed: false,
  storageExportDeleteExecutionAllowed: false,
  notificationExecutionAllowed: false,
  legalHoldExecutionAllowed: false,
  crossTenantExecutionAllowed: false,
  thirdPartyRedactionExecutionAllowed: false,
};

export function buildPrivacyWorkflowExecutionPlan(): PrivacyWorkflowExecutionPlan {
  return {
    status: "local-plan-ready",
    identityProofingExecutionAllowed: false,
    postgresWorkerExecutionAllowed: false,
    storageExportDeleteExecutionAllowed: false,
    notificationExecutionAllowed: false,
    legalHoldExecutionAllowed: false,
    crossTenantExecutionAllowed: false,
    policy: privacyWorkflowExecutionPolicy,
    localCommands: privacyWorkflowLocalCommands,
    externalCommands: privacyWorkflowExternalCommands,
    localArtifacts: privacyWorkflowLocalArtifacts,
    externalArtifacts: privacyWorkflowExternalArtifacts,
    requiredExternalEvidence: privacyWorkflowRequiredExternalEvidence,
    disabledReasons: [
      "Requester identity proofing requires production identity verification evidence.",
      "Privacy export/delete/anonymize/rectify workers require Postgres execution.",
      "Object-storage export/delete proof requires live private storage execution.",
      "Versioned notifications require configured notification provider execution.",
      "Legal hold handling requires approved retention policy evidence.",
      "Cross-tenant requester mismatch proof requires integration actors and tenant data.",
    ],
  };
}

export function buildPrivacyWorkflowArtifactReview(rawArtifact: unknown): PrivacyWorkflowArtifactReview {
  return {
    status: "redacted-review-ready",
    redactedArtifact: buildRedactedPrivacyWorkflowArtifact(rawArtifact),
    requiredArtifacts: privacyWorkflowArtifactPaths,
    retainedExternalGates: [
      "Requester identity proofing evidence",
      "Tenant relationship proofing evidence",
      "Privacy export/delete/anonymize/rectify worker evidence",
      "Object-storage privacy export/delete evidence",
      "Versioned notification and AuditLog persistence evidence",
      "Cross-tenant requester mismatch denial evidence",
    ],
  };
}

export function buildPrivacyWorkflowEvidenceDecision(
  input: PrivacyWorkflowEvidenceInput,
): PrivacyWorkflowEvidenceDecision {
  const blockers = [
    !input.intakeRoutesPassed && "Run public/dashboard privacy intake route contracts.",
    !input.identityProofCaptured && "Capture requester identity proofing evidence.",
    !input.tenantRelationshipProofCaptured && "Capture tenant relationship proofing evidence.",
    !input.statusPersistenceCaptured && "Capture PrivacyRequest case/status persistence evidence.",
    !input.exportWorkerCaptured && "Capture privacy export worker evidence.",
    !input.deleteAnonymizeWorkerCaptured && "Capture delete/anonymize/rectify worker evidence.",
    !input.storageExportDeleteCaptured && "Capture object-storage export/delete evidence.",
    !input.thirdPartyRedactionCaptured && "Capture third-party redaction evidence.",
    !input.legalHoldCaptured && "Capture legal hold handling and denial evidence.",
    !input.notificationCaptured && "Capture versioned privacy notification evidence.",
    !input.auditLogPersistenceCaptured && "Capture privacy AuditLog persistence evidence.",
    !input.requesterMismatchDenialCaptured && "Capture cross-tenant requester mismatch denial evidence.",
  ].filter(Boolean) as string[];

  const missingArtifacts = privacyWorkflowArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = privacyWorkflowCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: privacyWorkflowCommands,
    requiredEvidence: privacyWorkflowArtifactPaths,
    redactionPolicy: {
      requesterPiiRedacted: true,
      exportObjectKeysRedacted: true,
      thirdPartyDataRedacted: true,
    },
  };
}

export function buildPrivacyRequestPersistenceContract(input: PrivacyRequestPersistenceInput): PrivacyRequestPersistenceContract {
  return {
    modelName: "PrivacyRequest",
    row: input,
    transactionWrites: ["IdempotencyKey", "PrivacyRequest", "AuditLog"],
    statusTransitions: ["intake_received", "identity_pending", "processing", "legal_hold", "completed", "denied"],
    auditActions: [
      "privacy.request.created",
      "privacy.identity.verified",
      "privacy.worker.executed",
      "privacy.legal_hold.applied",
      "privacy.case_closed",
    ],
    redactedFields: ["requesterEmail", "redactedSubmission", "exportArtifactObjectKey"],
    tenantIsolationKey: "tenantId",
  };
}

export function buildPrivacyRequestWorkflowContract(input: PrivacyWorkflowCaseInput) {
  const workflow = buildPrivacyCaseWorkflowPlan(input);
  const actions: PrivacyWorkflowWorkerAction[] = [
    "persist-privacy-request-case",
    "verify-requester-identity",
    "prove-tenant-relationship",
    "deny-requester-mismatch",
    "assemble-export-artifact",
    "redact-third-party-data",
    "delete-or-anonymize-postgres-records",
    "delete-or-export-private-storage-objects",
    "enforce-legal-hold",
    "persist-status-transition",
    "send-versioned-notification",
    "write-privacy-audit-log",
  ];

  return {
    gapIds: ["GAP-098", "GAP-099", "GAP-100"] as const,
    workflow,
    actions,
    requiredCaseFields: workflow.requiredCaseFields,
    requiredWorkers: workflow.requiredWorkers,
    auditEvents: workflow.auditEvents,
    artifactPaths: privacyWorkflowArtifactPaths,
  };
}

export const privacyWorkflowRuntimeContract = buildPrivacyRequestRuntimeReadinessPlan({
  packageScripts: ["test", "typecheck"],
  securityTestsPassed: false,
  securityTypecheckPassed: false,
  publicRouteTestsPassed: false,
  dashboardRouteTestsPassed: false,
  privacyCasePersistenceConfigured: true,
  identityProofingConfigured: false,
  tenantRelationshipProofingConfigured: false,
  requesterMismatchDenied: false,
  exportWorkerConfigured: false,
  deleteAnonymizeRectifyWorkersConfigured: false,
  storageExportDeleteConfigured: false,
  thirdPartyRedactionConfigured: false,
  legalHoldHandlingConfigured: false,
  notificationProviderConfigured: false,
  notificationTemplatesApproved: false,
  auditLogPersistenceConfigured: true,
  statusTransitionPersistenceConfigured: true,
  tenantIsolationIntegrationTestsPassed: false,
  postgresStorageIntegrationTestsPassed: false,
});

export const privacyWorkflowPreview = buildPrivacyRequestWorkflowContract({
  requestType: "deletion",
  categories: ["client_profile", "reference_file", "consent_signature", "payment_record", "audit_log"],
  requesterVerified: false,
  tenantMembershipVerified: false,
  caseStoreConfigured: false,
  exportWorkerConfigured: false,
  deletionWorkerConfigured: false,
  notificationProviderConfigured: false,
  auditLogConfigured: false,
  legalReviewApproved: false,
});

export const privacyRequestPersistencePreview = buildPrivacyRequestPersistenceContract({
  tenantId: "tenant_demo",
  requesterUserId: "user_demo",
  clientId: "client_demo",
  requestType: "export",
  status: "intake_received",
  requesterEmail: "client@example.test",
  requesterName: "Redacted Client",
  identityProofStatus: "pending",
  tenantRelationshipStatus: "pending",
  dueAt: "2026-07-09T00:00:00.000Z",
  legalHold: false,
});
