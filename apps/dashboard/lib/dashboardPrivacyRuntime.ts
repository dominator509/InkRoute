import { buildDashboardPrivacyWorkflowEvidencePlan } from "@inkroute/security";

export type DashboardPrivacyRuntimeStatus =
  | "wired"
  | "workflow-gated"
  | "storage-gated"
  | "legal-gated"
  | "observability-gated"
  | "ci-gated";

export interface DashboardPrivacyRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DashboardPrivacyRuntimeStatus;
}

export const dashboardPrivacySurfaces = [
  "client_profile",
  "booking_request",
  "consent_form",
  "payment",
  "message",
  "file_asset",
] as const;

export const dashboardPrivacyRuntimeCommands = [
  "pnpm --filter @inkroute/security typecheck",
  "pnpm --filter @inkroute/security test",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm --filter @inkroute/dashboard build",
  "dashboard privacy route/API tests",
  "persisted dashboard export workflow tests",
  "persisted dashboard delete/anonymize workflow tests",
  "private file deletion integration tests",
  "dashboard privacy AuditLog persistence tests",
  "dashboard sanitized log/error evidence sweep",
  "legal/product dashboard privacy approval review",
  "GitHub Actions dashboard privacy evidence job",
] as const;

export const dashboardPrivacyArtifactPaths = [
  "coverage/dashboard-privacy-runtime.json",
  "coverage/dashboard-privacy-security-typecheck.txt",
  "coverage/dashboard-privacy-security-test.txt",
  "coverage/dashboard-privacy-dashboard-typecheck.txt",
  "coverage/dashboard-privacy-dashboard-build.txt",
  "coverage/dashboard-privacy-route-projection-matrix.json",
  "coverage/dashboard-privacy-route-tests.json",
  "coverage/dashboard-privacy-request-store.json",
  "coverage/dashboard-privacy-export-workflow.json",
  "coverage/dashboard-privacy-delete-anonymize-workflow.json",
  "coverage/dashboard-privacy-private-file-deletion.json",
  "coverage/dashboard-privacy-auditlog-redacted.json",
  "coverage/dashboard-privacy-sanitized-logs.json",
  "coverage/dashboard-privacy-sanitized-errors.json",
  "coverage/dashboard-privacy-legal-approval-redacted.json",
  "coverage/dashboard-privacy-ci-evidence.json",
  "coverage/dashboard-privacy-secret-safe-artifacts.json",
  "test-results/dashboard-privacy-runtime",
] as const;

export const dashboardPrivacyRuntimeMatrix = [
  {
    id: "security-typecheck",
    command: "pnpm --filter @inkroute/security typecheck",
    artifact: "coverage/dashboard-privacy-security-typecheck.txt",
    status: "wired",
  },
  {
    id: "security-tests",
    command: "pnpm --filter @inkroute/security test",
    artifact: "coverage/dashboard-privacy-security-test.txt",
    status: "wired",
  },
  {
    id: "dashboard-typecheck-build",
    command: "pnpm --filter @inkroute/dashboard typecheck && pnpm --filter @inkroute/dashboard build",
    artifact: "coverage/dashboard-privacy-dashboard-build.txt",
    status: "ci-gated",
  },
  {
    id: "route-projection-matrix",
    command: "verify dashboard privacy projections across client, booking, consent, payment, message, and file surfaces",
    artifact: "coverage/dashboard-privacy-route-projection-matrix.json",
    status: "wired",
  },
  {
    id: "privacy-trust-route-tests",
    command: "dashboard privacy route/API tests",
    artifact: "coverage/dashboard-privacy-route-tests.json",
    status: "wired",
  },
  {
    id: "persisted-request-store",
    command: "persisted dashboard export workflow tests",
    artifact: "coverage/dashboard-privacy-request-store.json",
    status: "workflow-gated",
  },
  {
    id: "export-delete-anonymize",
    command: "persisted dashboard export workflow tests && persisted dashboard delete/anonymize workflow tests",
    artifact: "coverage/dashboard-privacy-delete-anonymize-workflow.json",
    status: "workflow-gated",
  },
  {
    id: "private-file-deletion",
    command: "private file deletion integration tests",
    artifact: "coverage/dashboard-privacy-private-file-deletion.json",
    status: "storage-gated",
  },
  {
    id: "auditlog-sanitized-logs-errors",
    command: "dashboard privacy AuditLog persistence tests && dashboard sanitized log/error evidence sweep",
    artifact: "coverage/dashboard-privacy-auditlog-redacted.json",
    status: "observability-gated",
  },
  {
    id: "legal-product-approval",
    command: "legal/product dashboard privacy approval review",
    artifact: "coverage/dashboard-privacy-legal-approval-redacted.json",
    status: "legal-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions dashboard privacy evidence job",
    artifact: "coverage/dashboard-privacy-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly DashboardPrivacyRuntimeMatrixEntry[];

export const dashboardPrivacyRuntimeReadiness = buildDashboardPrivacyWorkflowEvidencePlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  securityTestsPassed: false,
  securityTypecheckPassed: false,
  dashboardTypecheckPassed: false,
  dashboardBuildPassed: false,
  routeProjectionSurfaces: [...dashboardPrivacySurfaces],
  routeTestSurfaces: [...dashboardPrivacySurfaces],
  persistedPrivacyRequestStoreConfigured: false,
  exportWorkflowIntegrationPassed: false,
  deleteAnonymizeWorkflowIntegrationPassed: false,
  privateStorageDeletionIntegrationPassed: false,
  auditLogPersistencePassed: false,
  legalApprovalCaptured: false,
  consentMedicalDepositSmsCopyApproved: false,
  sanitizedLogEvidenceCaptured: false,
  sanitizedErrorEvidenceCaptured: false,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});
