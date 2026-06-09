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
  "test-results/privacy-request-workflow",
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
  privacyCasePersistenceConfigured: false,
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
  auditLogPersistenceConfigured: false,
  statusTransitionPersistenceConfigured: false,
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
