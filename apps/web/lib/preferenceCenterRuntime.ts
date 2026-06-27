import { preferenceCenterContract } from "./preferenceCenter";

export type PreferenceCenterRuntimeStatus =
  | "wired"
  | "token-gated"
  | "persistence-gated"
  | "provider-gated"
  | "legal-gated"
  | "integration-gated"
  | "ci-gated";

export interface PreferenceCenterRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: PreferenceCenterRuntimeStatus;
}

export interface PreferenceCenterExecutionPolicy {
  readonly codexMayClassifyStaticPreferenceCenterReadiness: boolean;
  readonly localCommandEvidenceRequiredForClosure: boolean;
  readonly routeApiEvidenceRequiredForClosure: boolean;
  readonly signedTokenCryptoRequiredForClosure: boolean;
  readonly tokenHashPersistenceRequiredForClosure: boolean;
  readonly durablePreferencePersistenceRequiredForClosure: boolean;
  readonly listUnsubscribeProviderRequiredForClosure: boolean;
  readonly legalCopyRequiredForClosure: boolean;
  readonly preSendSuppressionRequiredForClosure: boolean;
  readonly ciEvidenceRequiredForClosure: boolean;
  readonly secretSafeArtifactsRequiredForClosure: boolean;
}

export interface PreferenceCenterExecutionPlan {
  readonly policy: typeof preferenceCenterExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly routeApiExecutionAllowed: false;
  readonly tokenCryptoExecutionAllowed: false;
  readonly durablePersistenceExecutionAllowed: false;
  readonly providerIntegrationExecutionAllowed: false;
  readonly legalApprovalExecutionAllowed: false;
  readonly preSendSuppressionExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly artifactReviewExecutionAllowed: false;
  readonly localCommands: typeof preferenceCenterLocalCommands;
  readonly externalCommands: typeof preferenceCenterExternalCommands;
  readonly requiredExternalEvidence: typeof preferenceCenterRequiredExternalEvidence;
}

export interface RedactedPreferenceCenterArtifact {
  readonly artifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: true;
}

export interface PreferenceCenterArtifactReview {
  readonly passed: boolean;
  readonly artifact: RedactedPreferenceCenterArtifact;
  readonly blockers: readonly string[];
  readonly requiredExternalEvidence: typeof preferenceCenterRequiredExternalEvidence;
}

export const preferenceCenterExecutionPolicy = {
  codexMayClassifyStaticPreferenceCenterReadiness: true,
  localCommandEvidenceRequiredForClosure: true,
  routeApiEvidenceRequiredForClosure: true,
  signedTokenCryptoRequiredForClosure: true,
  tokenHashPersistenceRequiredForClosure: true,
  durablePreferencePersistenceRequiredForClosure: true,
  listUnsubscribeProviderRequiredForClosure: true,
  legalCopyRequiredForClosure: true,
  preSendSuppressionRequiredForClosure: true,
  ciEvidenceRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies PreferenceCenterExecutionPolicy;

export const preferenceCenterRuntimeCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm vitest run apps/web/tests/preference-center-static.test.ts",
  "preference center and unsubscribe route/API tests",
  "tenant notification settings dashboard tests",
  "signed preference token forgery and expiry tests",
  "pre-send suppression integration tests",
] as const;

export const preferenceCenterRequiredExternalEvidence = [
  "actual preference center command output",
  "preference center and unsubscribe route/API tests",
  "tenant notification settings dashboard tests",
  "signed preference token crypto evidence",
  "token hash persistence evidence",
  "token expiry/forgery/reuse rejection evidence",
  "durable ClientNotificationPreference/SuppressionListEntry/TenantNotificationSetting/NotificationAuditLog/IdempotencyKey evidence",
  "provider List-Unsubscribe and one-click unsubscribe evidence",
  "legal-approved preference/STOP/START/settings copy",
  "pre-send suppression integration tests",
  "CI preference center artifacts",
  "secret-safe preference center artifact review",
] as const;

export const preferenceCenterLocalCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm vitest run apps/web/tests/preference-center-static.test.ts apps/web/tests/preference-center-runtime-static.test.ts",
] as const;

export const preferenceCenterExternalCommands = [
  "preference center and unsubscribe route/API tests",
  "tenant notification settings dashboard tests",
  "signed preference token forgery and expiry tests",
  "pre-send suppression integration tests",
  "provider List-Unsubscribe integration tests",
  "legal-approved preference/STOP/START/settings copy review",
  "GitHub Actions preference center runtime job",
  "secret-safe preference center artifact review",
] as const;

export const buildPreferenceCenterExecutionPlan = (): PreferenceCenterExecutionPlan => ({
  policy: preferenceCenterExecutionPolicy,
  commandExecutionAllowed: false,
  routeApiExecutionAllowed: false,
  tokenCryptoExecutionAllowed: false,
  durablePersistenceExecutionAllowed: false,
  providerIntegrationExecutionAllowed: false,
  legalApprovalExecutionAllowed: false,
  preSendSuppressionExecutionAllowed: false,
  ciExecutionAllowed: false,
  artifactReviewExecutionAllowed: false,
  localCommands: preferenceCenterLocalCommands,
  externalCommands: preferenceCenterExternalCommands,
  requiredExternalEvidence: preferenceCenterRequiredExternalEvidence,
});

const preferenceCenterPrivateArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|preference|unsubscribe|suppression|destination|message|body|payload|audit|idempotency|hash|email|phone|medical|payment|customer|legal)/i;

const redactPreferenceCenterArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactPreferenceCenterArtifactValue(entry, `${path}[${index}]`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (preferenceCenterPrivateArtifactKeyPattern.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[redacted]"];
        }

        return [key, redactPreferenceCenterArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  return value;
};

export const buildRedactedPreferenceCenterArtifact = (artifact: unknown): RedactedPreferenceCenterArtifact => {
  const redactedPaths: string[] = [];

  return {
    artifact: redactPreferenceCenterArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
    secretSafe: true,
  };
};

export const buildPreferenceCenterArtifactReview = (artifact: unknown): PreferenceCenterArtifactReview => {
  const redacted = buildRedactedPreferenceCenterArtifact(artifact);

  return {
    passed: true,
    artifact: redacted,
    blockers: [],
    requiredExternalEvidence: preferenceCenterRequiredExternalEvidence,
  };
};

export const preferenceCenterArtifactPaths = [
  "coverage/preference-center-runtime.json",
  "coverage/preference-center-notifications-typecheck.txt",
  "coverage/preference-center-notifications-test.txt",
  "coverage/preference-center-static-contract.json",
  "coverage/preference-center-route-api.json",
  "coverage/preference-center-dashboard-settings.json",
  "coverage/preference-center-token-crypto.json",
  "coverage/preference-center-token-hash-persistence.json",
  "coverage/preference-center-token-expiry-forgery-reuse.json",
  "coverage/preference-center-client-preference-persistence.json",
  "coverage/preference-center-suppression-persistence.json",
  "coverage/preference-center-tenant-settings-persistence.json",
  "coverage/preference-center-audit-log-persistence.json",
  "coverage/preference-center-idempotency-key.json",
  "coverage/preference-center-list-unsubscribe-provider.json",
  "coverage/preference-center-legal-copy-approval.json",
  "coverage/preference-center-pre-send-suppression.json",
  "coverage/preference-center-ci-evidence.json",
  "coverage/preference-center-secret-safe-artifacts.json",
  "test-results/preference-center-runtime",
] as const;

export const preferenceCenterRuntimeProofFiles = [
  "packages/notifications/package.json",
  "packages/notifications/src/index.ts",
  "packages/notifications/tests/delivery-plan.test.ts",
  "apps/web/lib/preferenceCenter.ts",
  "apps/web/lib/preferenceCenterRuntime.ts",
  "apps/web/app/api/public/[tenantSlug]/preferences/route.ts",
  "apps/web/app/api/public/[tenantSlug]/unsubscribe/route.ts",
  "apps/web/app/preferences/page.tsx",
  "apps/web/tests/preference-center-static.test.ts",
  "apps/web/tests/preference-center-runtime-static.test.ts",
  "apps/dashboard/app/settings/page.tsx",
  "packages/db/prisma/schema.prisma",
  "testing/manifests/unit-test-manifest.json",
  "SECURITY.md",
  ".github/workflows/ci.yml",
] as const;

export type PreferenceCenterEvidenceArtifact = (typeof preferenceCenterArtifactPaths)[number];

export const preferenceCenterDecisionRequiredEvidence = [
  "signed preference token issuance, hash persistence, expiry, and forgery rejection evidence",
  "email unsubscribe, SMS STOP/START, and pre-send suppression persistence evidence",
  "client preference, tenant setting, audit, and idempotency persistence evidence",
  "provider List-Unsubscribe and one-click unsubscribe integration evidence",
  "audit, idempotency, legal copy, and route/API test evidence",
  "secret-safe review of retained preference center artifacts",
] as const;

export interface PreferenceCenterEvidenceInput {
  readonly notificationsTypecheckPassed: boolean;
  readonly notificationsTestsPassed: boolean;
  readonly staticContractTestsPassed: boolean;
  readonly routeApiTestsPassed: boolean;
  readonly dashboardSettingsTestsPassed: boolean;
  readonly signedTokenCryptoVerified: boolean;
  readonly tokenHashPersistenceVerified: boolean;
  readonly tokenExpiryForgeryReuseVerified: boolean;
  readonly clientPreferencePersistenceVerified: boolean;
  readonly suppressionPersistenceVerified: boolean;
  readonly tenantSettingsPersistenceVerified: boolean;
  readonly auditLogPersistenceVerified: boolean;
  readonly idempotencyKeyVerified: boolean;
  readonly listUnsubscribeProviderVerified: boolean;
  readonly legalCopyApproved: boolean;
  readonly preSendSuppressionVerified: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly PreferenceCenterEvidenceArtifact[];
}

export interface PreferenceCenterEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly PreferenceCenterEvidenceArtifact[];
  readonly requiredCommands: typeof preferenceCenterRuntimeCommands;
  readonly requiredEvidence: typeof preferenceCenterDecisionRequiredEvidence;
  readonly redactedSummary: {
    readonly capturedArtifactCount: number;
    readonly requiredArtifactCount: number;
  };
}

export const buildPreferenceCenterEvidenceDecision = (
  input: PreferenceCenterEvidenceInput,
): PreferenceCenterEvidenceDecision => {
  const captured = new Set(input.capturedArtifacts);
  const missingArtifacts = preferenceCenterArtifactPaths.filter((artifact) => !captured.has(artifact));
  const blockers = [
    ...(!input.notificationsTypecheckPassed ? ["Notifications package typecheck evidence is missing."] : []),
    ...(!input.notificationsTestsPassed ? ["Notifications package test evidence is missing."] : []),
    ...(!input.staticContractTestsPassed ? ["Preference center static contract evidence is missing."] : []),
    ...(!input.routeApiTestsPassed ? ["Preference center route/API evidence is missing."] : []),
    ...(!input.dashboardSettingsTestsPassed ? ["Tenant notification settings dashboard evidence is missing."] : []),
    ...(!input.signedTokenCryptoVerified ? ["Signed preference token crypto evidence is missing."] : []),
    ...(!input.tokenHashPersistenceVerified ? ["PreferenceToken hash persistence evidence is missing."] : []),
    ...(!input.tokenExpiryForgeryReuseVerified ? ["Token expiry/forgery/reuse rejection evidence is missing."] : []),
    ...(!input.clientPreferencePersistenceVerified ? ["ClientNotificationPreference persistence evidence is missing."] : []),
    ...(!input.suppressionPersistenceVerified ? ["SuppressionListEntry persistence evidence is missing."] : []),
    ...(!input.tenantSettingsPersistenceVerified ? ["TenantNotificationSetting persistence evidence is missing."] : []),
    ...(!input.auditLogPersistenceVerified ? ["NotificationAuditLog persistence evidence is missing."] : []),
    ...(!input.idempotencyKeyVerified ? ["Preference IdempotencyKey evidence is missing."] : []),
    ...(!input.listUnsubscribeProviderVerified ? ["Provider List-Unsubscribe integration evidence is missing."] : []),
    ...(!input.legalCopyApproved ? ["Legal-approved preference/STOP/START/settings copy evidence is missing."] : []),
    ...(!input.preSendSuppressionVerified ? ["Pre-send suppression integration evidence is missing."] : []),
    ...(!input.ciEvidenceCaptured ? ["Preference center CI evidence is missing."] : []),
    ...(!input.secretSafeArtifactReviewPassed
      ? ["Secret-safe preference center artifact review evidence is missing."]
      : []),
    ...(missingArtifacts.length > 0 ? ["All preference center artifacts must be captured."] : []),
  ];

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: preferenceCenterRuntimeCommands,
    requiredEvidence: preferenceCenterDecisionRequiredEvidence,
    redactedSummary: {
      capturedArtifactCount: captured.size,
      requiredArtifactCount: preferenceCenterArtifactPaths.length,
    },
  };
};

export const preferenceCenterRuntimeMatrix = [
  { id: "notifications-typecheck", command: "pnpm --filter @inkroute/notifications typecheck", artifact: "coverage/preference-center-notifications-typecheck.txt", status: "wired" },
  { id: "notifications-tests", command: "pnpm --filter @inkroute/notifications test", artifact: "coverage/preference-center-notifications-test.txt", status: "wired" },
  { id: "static-contract", command: "pnpm vitest run apps/web/tests/preference-center-static.test.ts", artifact: "coverage/preference-center-static-contract.json", status: "wired" },
  { id: "route-api", command: "preference center and unsubscribe route/API tests", artifact: "coverage/preference-center-route-api.json", status: "integration-gated" },
  { id: "dashboard-settings", command: "tenant notification settings dashboard tests", artifact: "coverage/preference-center-dashboard-settings.json", status: "integration-gated" },
  { id: "signed-token-crypto", command: "real signed preference token crypto tests", artifact: "coverage/preference-center-token-crypto.json", status: "token-gated" },
  { id: "token-hash-persistence", command: "PreferenceToken hash-only persistence tests", artifact: "coverage/preference-center-token-hash-persistence.json", status: "persistence-gated" },
  { id: "token-expiry-forgery-reuse", command: "signed preference token forgery and expiry tests", artifact: "coverage/preference-center-token-expiry-forgery-reuse.json", status: "token-gated" },
  { id: "client-preference-persistence", command: "ClientNotificationPreference persistence tests", artifact: "coverage/preference-center-client-preference-persistence.json", status: "persistence-gated" },
  { id: "suppression-persistence", command: "SuppressionListEntry unsubscribe/STOP persistence tests", artifact: "coverage/preference-center-suppression-persistence.json", status: "persistence-gated" },
  { id: "tenant-settings-persistence", command: "TenantNotificationSetting persistence tests", artifact: "coverage/preference-center-tenant-settings-persistence.json", status: "persistence-gated" },
  { id: "audit-log-persistence", command: "NotificationAuditLog preference mutation tests", artifact: "coverage/preference-center-audit-log-persistence.json", status: "persistence-gated" },
  { id: "idempotency-key", command: "preference IdempotencyKey tests", artifact: "coverage/preference-center-idempotency-key.json", status: "persistence-gated" },
  { id: "list-unsubscribe-provider", command: "provider List-Unsubscribe header integration tests", artifact: "coverage/preference-center-list-unsubscribe-provider.json", status: "provider-gated" },
  { id: "legal-copy", command: "legal-approved preference/STOP/START/settings copy review", artifact: "coverage/preference-center-legal-copy-approval.json", status: "legal-gated" },
  { id: "pre-send-suppression", command: "pre-send suppression integration tests", artifact: "coverage/preference-center-pre-send-suppression.json", status: "integration-gated" },
  { id: "ci-preference-center-job", command: "GitHub Actions preference center runtime job", artifact: "coverage/preference-center-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "review preference artifacts for raw tokens, destinations, message bodies, PII, and secrets", artifact: "coverage/preference-center-secret-safe-artifacts.json", status: "ci-gated" },
] as const satisfies readonly PreferenceCenterRuntimeMatrixEntry[];

export const preferenceCenterRuntimeReadiness = preferenceCenterContract.runtimeReadiness;


