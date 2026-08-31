import {
  buildDashboardPrivacyWorkflowEvidencePlan,
  dashboardPrivacyWorkflowEvidenceRequiredCommands,
  dashboardPrivacyWorkflowEvidenceRequiredEvidence,
} from "@inkroute/security";

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

export const dashboardPrivacyRuntimeCommands = dashboardPrivacyWorkflowEvidenceRequiredCommands;

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

export const dashboardPrivacyRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "apps/dashboard/lib/dashboardPrivacyRuntime.ts",
  "apps/dashboard/tests/dashboard-privacy-runtime-static.test.ts",
  "packages/security/package.json",
  "packages/security/src/index.ts",
  "packages/security/tests/upload-policy.test.ts",
  "apps/dashboard/app/api/security/privacy-requests/route.ts",
  "apps/dashboard/app/api/security/trust-status/route.ts",
  "apps/dashboard/app/api/clients/[clientId]/route.ts",
  "apps/dashboard/components/ClientDetailActionPanel.tsx",
  "apps/dashboard/tests/client-read-route-static.test.ts",
  "apps/dashboard/app/api/forms/[formId]/route.ts",
  "apps/dashboard/components/FormActionPanel.tsx",
  "apps/dashboard/tests/form-read-route-static.test.ts",
  "apps/dashboard/tests/security-privacy-route-static.test.ts",
  "apps/dashboard/tests/security-trust-route-static.test.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
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

const dashboardPrivacyRuntimePlan = buildDashboardPrivacyWorkflowEvidencePlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  securityTestsPassed: false,
  securityTypecheckPassed: false,
  dashboardTypecheckPassed: false,
  dashboardBuildPassed: false,
  routeProjectionSurfaces: [...dashboardPrivacySurfaces],
  routeTestSurfaces: [...dashboardPrivacySurfaces],
  persistedPrivacyRequestStoreConfigured: true,
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

export const dashboardPrivacyRuntimeReadiness = {
  ...dashboardPrivacyRuntimePlan,
  requiredEvidence: dashboardPrivacyWorkflowEvidenceRequiredEvidence,
};

export const dashboardPrivacyEvidenceFlags = [
  "securityTestsPassed",
  "securityTypecheckPassed",
  "dashboardTypecheckPassed",
  "dashboardBuildPassed",
  "persistedPrivacyRequestStoreConfigured",
  "exportWorkflowIntegrationPassed",
  "deleteAnonymizeWorkflowIntegrationPassed",
  "privateStorageDeletionIntegrationPassed",
  "auditLogPersistencePassed",
  "legalApprovalCaptured",
  "consentMedicalDepositSmsCopyApproved",
  "sanitizedLogEvidenceCaptured",
  "sanitizedErrorEvidenceCaptured",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type DashboardPrivacyEvidenceFlag = (typeof dashboardPrivacyEvidenceFlags)[number];

export interface DashboardPrivacyEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly projectionSurfaces?: readonly string[];
  readonly routeTestSurfaces?: readonly string[];
  readonly evidence?: Partial<Record<DashboardPrivacyEvidenceFlag, boolean>>;
}

export interface DashboardPrivacyEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingProjectionSurfaces: readonly string[];
  readonly missingRouteTestSurfaces: readonly string[];
  readonly missingEvidence: readonly DashboardPrivacyEvidenceFlag[];
  readonly requiredCommands: typeof dashboardPrivacyRuntimeCommands;
  readonly requiredArtifacts: typeof dashboardPrivacyArtifactPaths;
  readonly requiredSurfaces: readonly string[];
  readonly requiredEvidence: typeof dashboardPrivacyEvidenceFlags;
  readonly blockers: readonly string[];
}

const dashboardPrivacyEvidenceBlockers: Record<DashboardPrivacyEvidenceFlag, string> = {
  securityTestsPassed: "Security package privacy tests must pass.",
  securityTypecheckPassed: "Security package typecheck must pass.",
  dashboardTypecheckPassed: "Dashboard typecheck must pass.",
  dashboardBuildPassed: "Dashboard build must pass.",
  persistedPrivacyRequestStoreConfigured: "Persisted privacy request/case store must back dashboard export/delete workflows.",
  exportWorkflowIntegrationPassed: "Persisted dashboard export workflow tests must pass.",
  deleteAnonymizeWorkflowIntegrationPassed: "Persisted dashboard delete/anonymize workflow tests must pass.",
  privateStorageDeletionIntegrationPassed: "Private file deletion integration tests must pass.",
  auditLogPersistencePassed: "Redacted privacy AuditLog persistence tests must pass.",
  legalApprovalCaptured: "Attorney/product approval must be captured for dashboard privacy behavior.",
  consentMedicalDepositSmsCopyApproved: "Consent, medical, deposit/payment, and SMS/message copy must be attorney/product approved.",
  sanitizedLogEvidenceCaptured: "Sanitized runtime log evidence must be captured.",
  sanitizedErrorEvidenceCaptured: "Sanitized runtime error evidence must be captured.",
  ciEvidenceCaptured: "CI dashboard privacy evidence must be captured.",
  secretSafeArtifactsCaptured:
    "Dashboard privacy artifacts must be redacted and free of secrets, raw PII, medical notes, payment data, provider tokens, and private file URLs.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export const buildDashboardPrivacyEvidenceDecision = (
  input: DashboardPrivacyEvidenceInput,
): DashboardPrivacyEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, dashboardPrivacyRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, dashboardPrivacyArtifactPaths);
  const missingProjectionSurfaces = missingFrom(input.projectionSurfaces, dashboardPrivacySurfaces);
  const missingRouteTestSurfaces = missingFrom(input.routeTestSurfaces, dashboardPrivacySurfaces);
  const missingEvidence = dashboardPrivacyEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => dashboardPrivacyEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 &&
      missingArtifacts.length === 0 &&
      missingProjectionSurfaces.length === 0 &&
      missingRouteTestSurfaces.length === 0 &&
      missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingProjectionSurfaces,
    missingRouteTestSurfaces,
    missingEvidence,
    requiredCommands: dashboardPrivacyRuntimeCommands,
    requiredArtifacts: dashboardPrivacyArtifactPaths,
    requiredSurfaces: dashboardPrivacySurfaces,
    requiredEvidence: dashboardPrivacyEvidenceFlags,
    blockers,
  };
};

export interface DashboardPrivacyExecutionPolicy {
  readonly codexMayClassifyStaticPrivacyReadiness: true;
  readonly persistedPrivacyWorkflowRequiredForClosure: true;
  readonly privateFileDeletionRequiredForClosure: true;
  readonly auditLogAndSanitizedRuntimeEvidenceRequiredForClosure: true;
  readonly legalProductApprovalRequiredForClosure: true;
  readonly dashboardTypecheckBuildRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface DashboardPrivacyExecutionPlan {
  readonly localCommands: typeof dashboardPrivacyLocalCommands;
  readonly externalCommands: typeof dashboardPrivacyExternalCommands;
  readonly requiredExternalEvidence: typeof dashboardPrivacyRequiredExternalEvidence;
  readonly commandExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly storageExecutionAllowed: false;
  readonly auditExecutionAllowed: false;
  readonly legalApprovalExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly executionPolicy: typeof dashboardPrivacyExecutionPolicy;
}

export interface DashboardPrivacyArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof dashboardPrivacyRequiredExternalEvidence;
  readonly secretSafe: boolean;
}

export const dashboardPrivacyRequiredExternalEvidence = [
  "persisted privacy request and case store evidence",
  "persisted export workflow test output",
  "persisted delete and anonymize workflow test output",
  "private consent reference document and message file deletion evidence",
  "redacted privacy AuditLog persistence evidence",
  "sanitized runtime log and error evidence",
  "attorney and product approval for privacy consent medical deposit payment SMS message copy",
  "dashboard typecheck and build evidence",
  "fresh CI dashboard privacy evidence",
  "secret-safe dashboard privacy artifact review",
] as const;

export const dashboardPrivacyExecutionPolicy: DashboardPrivacyExecutionPolicy = {
  codexMayClassifyStaticPrivacyReadiness: true,
  persistedPrivacyWorkflowRequiredForClosure: true,
  privateFileDeletionRequiredForClosure: true,
  auditLogAndSanitizedRuntimeEvidenceRequiredForClosure: true,
  legalProductApprovalRequiredForClosure: true,
  dashboardTypecheckBuildRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
};

export const dashboardPrivacyLocalCommands = [
  "pnpm --filter @inkroute/security typecheck",
  "pnpm --filter @inkroute/security test",
  "static dashboard privacy route projection review",
  "static trust/privacy no-store route guard review",
] as const;

export const dashboardPrivacyExternalCommands = [
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

export const buildDashboardPrivacyExecutionPlan = (): DashboardPrivacyExecutionPlan => ({
  localCommands: dashboardPrivacyLocalCommands,
  externalCommands: dashboardPrivacyExternalCommands,
  requiredExternalEvidence: dashboardPrivacyRequiredExternalEvidence,
  commandExecutionAllowed: false,
  databaseExecutionAllowed: false,
  storageExecutionAllowed: false,
  auditExecutionAllowed: false,
  legalApprovalExecutionAllowed: false,
  ciExecutionAllowed: false,
  executionPolicy: dashboardPrivacyExecutionPolicy,
});

const dashboardPrivacySensitiveArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|cookie|email|phone|medical|payment|deposit|sms|message|consent|signature|file|document|reference|audit|legal|approval|delete|anonymize|export|error|log|pii|workflow|artifact|path|ci|run|evidence|id|key)/i;
const dashboardPrivacySensitiveArtifactValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:sk|pk|gh[psuor]|github_pat|provider-token)[A-Za-z0-9_-]*|(?:tenant|client|booking|payment|deposit|portfolio|travel|message|consent|signature|file|document|reference|audit|legal|approval|delete|anonymize|export|privacy|workflow|artifact|ci|run|evidence)[-_:/]?[A-Za-z0-9_.-]{6,}|(?:coverage|artifacts|test-results|reports|docs)\/[A-Za-z0-9_./-]{6,}|medical:[^"'\n\r]+|sms:[^"'\n\r]+|private-file|consent-signature|[A-Za-z0-9_-]{24,})/giu;

export const buildRedactedDashboardPrivacyArtifact = (
  artifact: unknown,
): Pick<DashboardPrivacyArtifactReview, "artifact" | "redactions"> => {
  const redactions: string[] = [];

  const redact = (value: unknown, path: string): unknown => {
    if (Array.isArray(value)) {
      return value.map((item, index) => redact(item, `${path}[${index}]`));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
          const entryPath = path ? `${path}.${key}` : key;

          if (dashboardPrivacySensitiveArtifactKeyPattern.test(key)) {
            redactions.push(entryPath);
            return [key, "[REDACTED_DASHBOARD_PRIVACY_PRIVATE_VALUE]"];
          }

          return [key, redact(entry, entryPath)];
        }),
      );
    }

    if (
      typeof value === "string" &&
      dashboardPrivacySensitiveArtifactValuePattern.test(value)
    ) {
      dashboardPrivacySensitiveArtifactValuePattern.lastIndex = 0;
      redactions.push(path);
      return value.replace(
        dashboardPrivacySensitiveArtifactValuePattern,
        "[REDACTED_DASHBOARD_PRIVACY_PRIVATE_VALUE]",
      );
    }

    dashboardPrivacySensitiveArtifactValuePattern.lastIndex = 0;
    return value;
  };

  return {
    artifact: redact(artifact, ""),
    redactions,
  };
};

export const buildDashboardPrivacyArtifactReview = (
  artifact: unknown,
): DashboardPrivacyArtifactReview => {
  const redacted = buildRedactedDashboardPrivacyArtifact(artifact);
  const serialized = JSON.stringify(redacted.artifact);
  const leakedPrivateMarkers = [
    "client@example.com",
    "tenant.example.com",
    "medical:",
    "sms:",
    "private-file",
    "consent-signature",
    "provider-token",
    "postgres://",
  ].some((marker) => serialized.includes(marker));

  return {
    ...redacted,
    requiredExternalEvidence: dashboardPrivacyRequiredExternalEvidence,
    secretSafe: !leakedPrivateMarkers,
  };
};



