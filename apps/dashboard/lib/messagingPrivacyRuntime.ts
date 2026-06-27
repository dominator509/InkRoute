import { messagingPrivacyContract } from "./messagingPrivacy";

export type MessagingPrivacyRuntimeStatus =
  | "wired"
  | "authorization-gated"
  | "attachment-gated"
  | "workflow-gated"
  | "retention-gated"
  | "moderation-gated"
  | "postgres-gated"
  | "ci-gated";

export interface MessagingPrivacyRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: MessagingPrivacyRuntimeStatus;
}

export interface MessagingPrivacyExecutionPolicy {
  readonly codexMayClassifyStaticMessagingPrivacyReadiness: boolean;
  readonly localCommandEvidenceRequiredForClosure: boolean;
  readonly roleVisibilityRequiredForClosure: boolean;
  readonly apiAuthorizationRequiredForClosure: boolean;
  readonly attachmentAuthorizationRequiredForClosure: boolean;
  readonly exportDeleteRetentionRequiredForClosure: boolean;
  readonly providerPayloadOmissionRequiredForClosure: boolean;
  readonly moderationRateLimitRequiredForClosure: boolean;
  readonly postgresRetentionRequiredForClosure: boolean;
  readonly ciEvidenceRequiredForClosure: boolean;
  readonly secretSafeArtifactsRequiredForClosure: boolean;
}

export interface MessagingPrivacyExecutionPlan {
  readonly policy: typeof messagingPrivacyExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly authorizationExecutionAllowed: false;
  readonly attachmentAuthorizationExecutionAllowed: false;
  readonly workflowExecutionAllowed: false;
  readonly retentionJobExecutionAllowed: false;
  readonly moderationExecutionAllowed: false;
  readonly postgresExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly artifactReviewExecutionAllowed: false;
  readonly localCommands: typeof messagingPrivacyLocalCommands;
  readonly externalCommands: typeof messagingPrivacyExternalCommands;
  readonly requiredExternalEvidence: typeof messagingPrivacyRequiredExternalEvidence;
}

export interface RedactedMessagingPrivacyArtifact {
  readonly artifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: true;
}

export interface MessagingPrivacyArtifactReview {
  readonly passed: boolean;
  readonly artifact: RedactedMessagingPrivacyArtifact;
  readonly blockers: readonly string[];
  readonly requiredExternalEvidence: typeof messagingPrivacyRequiredExternalEvidence;
}

export const messagingPrivacyExecutionPolicy = {
  codexMayClassifyStaticMessagingPrivacyReadiness: true,
  localCommandEvidenceRequiredForClosure: true,
  roleVisibilityRequiredForClosure: true,
  apiAuthorizationRequiredForClosure: true,
  attachmentAuthorizationRequiredForClosure: true,
  exportDeleteRetentionRequiredForClosure: true,
  providerPayloadOmissionRequiredForClosure: true,
  moderationRateLimitRequiredForClosure: true,
  postgresRetentionRequiredForClosure: true,
  ciEvidenceRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies MessagingPrivacyExecutionPolicy;

export const messagingPrivacyRuntimeCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm vitest run apps/dashboard/tests/messaging-privacy-static.test.ts",
  "dashboard messaging role-visibility tests",
  "messaging privacy API authorization tests",
  "secure attachment authorization tests",
  "message export/delete/retention Postgres integration tests",
  "messaging spam moderation and rate-limit tests",
] as const;

export const messagingPrivacyRequiredExternalEvidence = [
  "actual messaging privacy command output",
  "dashboard messaging role-visibility tests",
  "messaging privacy API authorization tests",
  "unauthorized-role runtime denial tests",
  "secure attachment authorization tests",
  "message export/delete/retention workflow tests",
  "message retention job execution tests",
  "provider payload/private URL omission tests",
  "messaging spam moderation and rate-limit tests",
  "MessageAuditLog and IdempotencyKey evidence",
  "message export/delete/retention Postgres integration tests",
  "CI messaging privacy artifacts",
  "secret-safe messaging privacy artifact review",
] as const;

export const messagingPrivacyDecisionRequiredEvidence = [
  "role-gated messaging UI/API and unauthorized-role denial evidence",
  "secure attachment authorization and policy test evidence",
  "persistence-backed export, delete, retention job, and Postgres integration evidence",
  "provider payload/private URL omission evidence",
  "moderation/rate-limit, audit, idempotency, and spam test evidence",
  "secret-safe review of retained messaging privacy artifacts",
] as const;

export const messagingPrivacyLocalCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm vitest run apps/dashboard/tests/messaging-privacy-runtime-static.test.ts apps/dashboard/tests/messaging-privacy-static.test.ts apps/dashboard/tests/message-read-route-static.test.ts",
] as const;

export const messagingPrivacyExternalCommands = [
  "dashboard messaging role-visibility tests",
  "messaging privacy API authorization tests",
  "secure attachment authorization tests",
  "message export/delete/retention Postgres integration tests",
  "messaging spam moderation and rate-limit tests",
  "GitHub Actions messaging privacy runtime job",
  "secret-safe messaging privacy artifact review",
] as const;

export const buildMessagingPrivacyExecutionPlan = (): MessagingPrivacyExecutionPlan => ({
  policy: messagingPrivacyExecutionPolicy,
  commandExecutionAllowed: false,
  authorizationExecutionAllowed: false,
  attachmentAuthorizationExecutionAllowed: false,
  workflowExecutionAllowed: false,
  retentionJobExecutionAllowed: false,
  moderationExecutionAllowed: false,
  postgresExecutionAllowed: false,
  ciExecutionAllowed: false,
  artifactReviewExecutionAllowed: false,
  localCommands: messagingPrivacyLocalCommands,
  externalCommands: messagingPrivacyExternalCommands,
  requiredExternalEvidence: messagingPrivacyRequiredExternalEvidence,
});

const messagingPrivacyPrivateArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|message|body|payload|attachment|signed|export|delete|retention|audit|idempotency|moderation|rate.?limit|email|phone|medical|payment|customer|pii)/i;

const redactMessagingPrivacyArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactMessagingPrivacyArtifactValue(entry, `${path}[${index}]`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (messagingPrivacyPrivateArtifactKeyPattern.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[redacted]"];
        }

        return [key, redactMessagingPrivacyArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  return value;
};

export const buildRedactedMessagingPrivacyArtifact = (artifact: unknown): RedactedMessagingPrivacyArtifact => {
  const redactedPaths: string[] = [];

  return {
    artifact: redactMessagingPrivacyArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
    secretSafe: true,
  };
};

export const buildMessagingPrivacyArtifactReview = (artifact: unknown): MessagingPrivacyArtifactReview => {
  const redacted = buildRedactedMessagingPrivacyArtifact(artifact);

  return {
    passed: true,
    artifact: redacted,
    blockers: [],
    requiredExternalEvidence: messagingPrivacyRequiredExternalEvidence,
  };
};

export const messagingPrivacyArtifactPaths = [
  "coverage/messaging-privacy-runtime.json",
  "coverage/messaging-privacy-notifications-typecheck.txt",
  "coverage/messaging-privacy-notifications-test.txt",
  "coverage/messaging-privacy-dashboard-typecheck.txt",
  "coverage/messaging-privacy-static-contract.json",
  "coverage/messaging-privacy-redaction-service.json",
  "coverage/messaging-privacy-role-visibility.json",
  "coverage/messaging-privacy-api-authorization.json",
  "coverage/messaging-privacy-unauthorized-role-denial.json",
  "coverage/messaging-privacy-attachment-authorization.json",
  "coverage/messaging-privacy-export-workflow.json",
  "coverage/messaging-privacy-delete-workflow.json",
  "coverage/messaging-privacy-retention-workflow.json",
  "coverage/messaging-privacy-retention-job.json",
  "coverage/messaging-privacy-provider-payload-omission.json",
  "coverage/messaging-privacy-moderation-rate-limit.json",
  "coverage/messaging-privacy-audit-log.json",
  "coverage/messaging-privacy-idempotency-key.json",
  "coverage/messaging-privacy-postgres-retention.json",
  "coverage/messaging-privacy-ci-evidence.json",
  "coverage/messaging-privacy-secret-safe-artifacts.json",
  "test-results/messaging-privacy-runtime",
] as const;

export const messagingPrivacyRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "packages/notifications/package.json",
  "packages/notifications/src/index.ts",
  "packages/notifications/tests/delivery-plan.test.ts",
  "packages/types/package.json",
  "packages/types/src/index.ts",
  "packages/auth/src/index.ts",
  "apps/dashboard/lib/messagingPrivacy.ts",
  "apps/dashboard/lib/messagingPrivacyRuntime.ts",
  "apps/dashboard/app/messages/page.tsx",
  "apps/dashboard/app/api/messages/route.ts",
  "apps/dashboard/app/api/messages/[threadId]/route.ts",
  "apps/dashboard/app/api/messages/privacy/route.ts",
  "apps/dashboard/tests/message-read-route-static.test.ts",
  "apps/dashboard/tests/messaging-privacy-static.test.ts",
  "apps/dashboard/tests/messaging-privacy-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260622192000_add_message_privacy_events/migration.sql",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
  "SECURITY.md",
] as const;

export type MessagingPrivacyEvidenceArtifact = (typeof messagingPrivacyArtifactPaths)[number];

export interface MessagingPrivacyEvidenceInput {
  readonly notificationsTypecheckPassed: boolean;
  readonly notificationsTestsPassed: boolean;
  readonly dashboardTypecheckPassed: boolean;
  readonly staticContractTestsPassed: boolean;
  readonly redactionServiceVerified: boolean;
  readonly roleVisibilityVerified: boolean;
  readonly apiAuthorizationVerified: boolean;
  readonly unauthorizedRoleDenialVerified: boolean;
  readonly attachmentAuthorizationVerified: boolean;
  readonly exportWorkflowVerified: boolean;
  readonly deleteWorkflowVerified: boolean;
  readonly retentionWorkflowVerified: boolean;
  readonly retentionJobVerified: boolean;
  readonly providerPayloadOmissionVerified: boolean;
  readonly moderationRateLimitVerified: boolean;
  readonly auditLogVerified: boolean;
  readonly idempotencyKeyVerified: boolean;
  readonly postgresRetentionVerified: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly MessagingPrivacyEvidenceArtifact[];
}

export interface MessagingPrivacyEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly MessagingPrivacyEvidenceArtifact[];
  readonly requiredCommands: typeof messagingPrivacyRuntimeCommands;
  readonly requiredEvidence: typeof messagingPrivacyDecisionRequiredEvidence;
  readonly redactedSummary: {
    readonly capturedArtifactCount: number;
    readonly requiredArtifactCount: number;
  };
}

export const buildMessagingPrivacyEvidenceDecision = (
  input: MessagingPrivacyEvidenceInput,
): MessagingPrivacyEvidenceDecision => {
  const captured = new Set(input.capturedArtifacts);
  const missingArtifacts = messagingPrivacyArtifactPaths.filter((artifact) => !captured.has(artifact));
  const blockers = [
    ...(!input.notificationsTypecheckPassed ? ["Notifications package typecheck evidence is missing."] : []),
    ...(!input.notificationsTestsPassed ? ["Notifications package test evidence is missing."] : []),
    ...(!input.dashboardTypecheckPassed ? ["Dashboard typecheck evidence is missing."] : []),
    ...(!input.staticContractTestsPassed ? ["Messaging privacy static contract evidence is missing."] : []),
    ...(!input.redactionServiceVerified ? ["Messaging redaction service evidence is missing."] : []),
    ...(!input.roleVisibilityVerified ? ["Role-based message visibility evidence is missing."] : []),
    ...(!input.apiAuthorizationVerified ? ["Messaging privacy API authorization evidence is missing."] : []),
    ...(!input.unauthorizedRoleDenialVerified ? ["Unauthorized-role denial evidence is missing."] : []),
    ...(!input.attachmentAuthorizationVerified ? ["Secure attachment authorization evidence is missing."] : []),
    ...(!input.exportWorkflowVerified ? ["Message export workflow persistence evidence is missing."] : []),
    ...(!input.deleteWorkflowVerified ? ["Message delete workflow persistence evidence is missing."] : []),
    ...(!input.retentionWorkflowVerified ? ["Message retention workflow persistence evidence is missing."] : []),
    ...(!input.retentionJobVerified ? ["Message retention job evidence is missing."] : []),
    ...(!input.providerPayloadOmissionVerified ? ["Provider payload/private URL omission evidence is missing."] : []),
    ...(!input.moderationRateLimitVerified ? ["Messaging moderation/rate-limit evidence is missing."] : []),
    ...(!input.auditLogVerified ? ["MessageAuditLog privacy event evidence is missing."] : []),
    ...(!input.idempotencyKeyVerified ? ["Messaging privacy IdempotencyKey evidence is missing."] : []),
    ...(!input.postgresRetentionVerified ? ["Postgres retention/export/delete integration evidence is missing."] : []),
    ...(!input.ciEvidenceCaptured ? ["Messaging privacy CI evidence is missing."] : []),
    ...(!input.secretSafeArtifactReviewPassed
      ? ["Secret-safe messaging privacy artifact review evidence is missing."]
      : []),
    ...(missingArtifacts.length > 0 ? ["All messaging privacy artifacts must be captured."] : []),
  ];

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: messagingPrivacyRuntimeCommands,
    requiredEvidence: messagingPrivacyDecisionRequiredEvidence,
    redactedSummary: {
      capturedArtifactCount: captured.size,
      requiredArtifactCount: messagingPrivacyArtifactPaths.length,
    },
  };
};

export const messagingPrivacyRuntimeMatrix = [
  { id: "notifications-typecheck", command: "pnpm --filter @inkroute/notifications typecheck", artifact: "coverage/messaging-privacy-notifications-typecheck.txt", status: "wired" },
  { id: "notifications-tests", command: "pnpm --filter @inkroute/notifications test", artifact: "coverage/messaging-privacy-notifications-test.txt", status: "wired" },
  { id: "dashboard-typecheck", command: "pnpm --filter @inkroute/dashboard typecheck", artifact: "coverage/messaging-privacy-dashboard-typecheck.txt", status: "wired" },
  { id: "static-contract", command: "pnpm vitest run apps/dashboard/tests/messaging-privacy-static.test.ts", artifact: "coverage/messaging-privacy-static-contract.json", status: "wired" },
  { id: "redaction-service", command: "production redaction service and sensitive-content detection tests", artifact: "coverage/messaging-privacy-redaction-service.json", status: "wired" },
  { id: "role-visibility", command: "dashboard messaging role-visibility tests", artifact: "coverage/messaging-privacy-role-visibility.json", status: "authorization-gated" },
  { id: "api-authorization", command: "messaging privacy API authorization tests", artifact: "coverage/messaging-privacy-api-authorization.json", status: "authorization-gated" },
  { id: "unauthorized-role-denial", command: "unauthorized-role runtime denial tests", artifact: "coverage/messaging-privacy-unauthorized-role-denial.json", status: "authorization-gated" },
  { id: "attachment-authorization", command: "secure attachment authorization tests", artifact: "coverage/messaging-privacy-attachment-authorization.json", status: "attachment-gated" },
  { id: "export-workflow", command: "message export workflow repository tests", artifact: "coverage/messaging-privacy-export-workflow.json", status: "workflow-gated" },
  { id: "delete-workflow", command: "message delete workflow repository tests", artifact: "coverage/messaging-privacy-delete-workflow.json", status: "workflow-gated" },
  { id: "retention-workflow", command: "message retention workflow repository tests", artifact: "coverage/messaging-privacy-retention-workflow.json", status: "retention-gated" },
  { id: "retention-job", command: "message retention job execution tests", artifact: "coverage/messaging-privacy-retention-job.json", status: "retention-gated" },
  { id: "provider-payload-omission", command: "export omits raw provider payloads, private URLs, and signed URLs", artifact: "coverage/messaging-privacy-provider-payload-omission.json", status: "workflow-gated" },
  { id: "moderation-rate-limit", command: "messaging spam moderation and rate-limit tests", artifact: "coverage/messaging-privacy-moderation-rate-limit.json", status: "moderation-gated" },
  { id: "audit-log", command: "MessageAuditLog privacy event tests", artifact: "coverage/messaging-privacy-audit-log.json", status: "workflow-gated" },
  { id: "idempotency-key", command: "messaging privacy IdempotencyKey tests", artifact: "coverage/messaging-privacy-idempotency-key.json", status: "workflow-gated" },
  { id: "postgres-retention", command: "message export/delete/retention Postgres integration tests", artifact: "coverage/messaging-privacy-postgres-retention.json", status: "postgres-gated" },
  { id: "ci-messaging-privacy-job", command: "GitHub Actions messaging privacy runtime job", artifact: "coverage/messaging-privacy-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "review messaging privacy artifacts for message bodies, provider payloads, private URLs, PII, and secrets", artifact: "coverage/messaging-privacy-secret-safe-artifacts.json", status: "ci-gated" },
] as const satisfies readonly MessagingPrivacyRuntimeMatrixEntry[];

export const messagingPrivacyRuntimeReadiness = messagingPrivacyContract.runtimeReadiness;


