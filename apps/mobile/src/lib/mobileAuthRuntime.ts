import { buildMobileAuthRuntimeReadinessPlan } from "@inkroute/auth";

export type MobileAuthRuntimeStatus =
  | "wired"
  | "provider-gated"
  | "secure-store-gated"
  | "biometric-gated"
  | "tenant-gated"
  | "audit-gated"
  | "device-gated";

export interface MobileAuthRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: MobileAuthRuntimeStatus;
}

export interface MobileAuthSecureSessionLifecycleContract {
  readonly localStates: readonly ["signed_out", "provider_pending", "secure_store_active", "biometric_locked", "refresh_required", "revoked"];
  readonly clearingTransitions: readonly ["logout", "revoked_session", "tenant_mismatch", "secure_store_unavailable"];
  readonly plaintextTokenStorageAllowed: false;
  readonly refreshRequiresSecureStore: true;
  readonly revokedSessionClearsTenantContext: true;
  readonly auditDecisionRequiredForEveryTransition: true;
}

export const mobileAuthSecureSessionLifecycleContract = {
  localStates: ["signed_out", "provider_pending", "secure_store_active", "biometric_locked", "refresh_required", "revoked"],
  clearingTransitions: ["logout", "revoked_session", "tenant_mismatch", "secure_store_unavailable"],
  plaintextTokenStorageAllowed: false,
  refreshRequiresSecureStore: true,
  revokedSessionClearsTenantContext: true,
  auditDecisionRequiredForEveryTransition: true,
} as const satisfies MobileAuthSecureSessionLifecycleContract;

export const mobileAuthRuntimeCommands = [
  "pnpm --filter @inkroute/auth typecheck",
  "pnpm --filter @inkroute/auth test",
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "Expo iOS/Android auth smoke tests",
  "Expo device biometric unlock test",
] as const;

export const mobileAuthArtifactPaths = [
  "coverage/mobile-auth-runtime.json",
  "coverage/mobile-auth-auth-typecheck.txt",
  "coverage/mobile-auth-auth-test.txt",
  "coverage/mobile-auth-app-typecheck.txt",
  "coverage/mobile-auth-app-test.txt",
  "coverage/mobile-auth-provider-login-logout-redacted.json",
  "coverage/mobile-auth-securestore-redacted.json",
  "coverage/mobile-auth-secure-session-lifecycle.json",
  "coverage/mobile-auth-biometric-device-redacted.json",
  "coverage/mobile-auth-refresh-logout-revocation.json",
  "coverage/mobile-auth-tenant-role-denial.json",
  "coverage/mobile-auth-auditlog-redacted.json",
  "coverage/mobile-auth-ios-android-smoke-redacted.json",
  "coverage/mobile-auth-persisted-run-payload.json",
  "coverage/mobile-auth-secret-safe-artifacts.json",
  "test-results/mobile-auth-runtime",
] as const;

export const mobileAuthRuntimeProofFiles = [
  "apps/mobile/package.json",
  "packages/mobile/package.json",
  "apps/mobile/src/lib/mobileAuth.ts",
  "apps/mobile/src/lib/mobileAuthRuntime.ts",
  "apps/mobile/src/screens/AuthScreen.tsx",
  "apps/mobile/tests/mobile-auth-static.test.ts",
  "apps/mobile/tests/mobile-auth-runtime-static.test.ts",
  "packages/auth/package.json",
  "packages/auth/src/index.ts",
  "packages/auth/tests/authorization.test.ts",
  "testing/manifests/unit-test-manifest.json",
] as const;

export const mobileAuthEvidenceFlags = [
  "authTypecheckPassed",
  "authTestsPassed",
  "mobileTypecheckPassed",
  "mobileTestsPassed",
  "providerLoginLogoutTested",
  "secureStorePlaintextDenied",
  "secureSessionLifecycleCaptured",
  "biometricDeviceTested",
  "refreshLogoutRevocationClearingTested",
  "tenantMembershipRoleResolutionTested",
  "crossTenantDenialTested",
  "auditPersistenceVerified",
  "iosAndroidSmokeTested",
  "persistedRunPayloadCaptured",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export const mobileAuthExecutionPolicy = {
  codexMayClassifyStaticMobileAuthReadiness: true,
  providerLoginLogoutRequiredForClosure: true,
  secureStorePersistenceRequiredForClosure: true,
  biometricDeviceSmokeRequiredForClosure: true,
  serverTenantMembershipRequiredForClosure: true,
  auditPersistenceRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies MobileAuthExecutionPolicy;

export const mobileAuthRequiredExternalEvidence = [
  "provider-backed login/logout/session callback transcript",
  "real Expo SecureStore persistence evidence",
  "plaintext-denial SecureStore evidence",
  "secure-session lifecycle clearing evidence",
  "biometric device unlock smoke",
  "refresh/logout/revocation clearing proof",
  "server-backed tenant membership and role resolution proof",
  "cross-tenant runtime denial proof",
  "mobile auth audit persistence evidence",
  "persisted MobileAuthRuntime run payload",
  "mobile typecheck/test output",
  "CI mobile auth evidence",
  "secret-safe mobile auth artifact review",
] as const;

export type MobileAuthEvidenceFlag = (typeof mobileAuthEvidenceFlags)[number];

export interface MobileAuthExecutionPolicy {
  readonly codexMayClassifyStaticMobileAuthReadiness: true;
  readonly providerLoginLogoutRequiredForClosure: true;
  readonly secureStorePersistenceRequiredForClosure: true;
  readonly biometricDeviceSmokeRequiredForClosure: true;
  readonly serverTenantMembershipRequiredForClosure: true;
  readonly auditPersistenceRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface MobileAuthExecutionPlan {
  readonly policy: typeof mobileAuthExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly authProviderExecutionAllowed: false;
  readonly secureStoreExecutionAllowed: false;
  readonly biometricExecutionAllowed: false;
  readonly deviceExecutionAllowed: false;
  readonly serverTenantExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly localCommands: typeof mobileAuthLocalCommands;
  readonly externalCommands: typeof mobileAuthExternalCommands;
  readonly surfaceContract: typeof mobileAuthSurfaceContract;
  readonly requiredExternalEvidence: typeof mobileAuthRequiredExternalEvidence;
  readonly secureSessionLifecycleContract: typeof mobileAuthSecureSessionLifecycleContract;
}

export interface MobileAuthArtifactReview {
  readonly artifact: unknown;
  readonly redactedArtifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: boolean;
  readonly requiredExternalEvidence: typeof mobileAuthRequiredExternalEvidence;
}

export interface MobileAuthPersistedRunPayload {
  readonly payloadId: "gap-042-mobile-auth-persisted-run";
  readonly requiredArtifact: "coverage/mobile-auth-persisted-run-payload.json";
  readonly providerBackedPersistenceRequired: true;
  readonly localPersistenceExecutionAllowed: false;
  readonly secureStoreDeviceEvidenceRequired: true;
  readonly tenantDenialEvidenceRequired: true;
  readonly auditPersistenceEvidenceRequired: true;
  readonly redactionRequired: true;
  readonly requiredExternalEvidence: typeof mobileAuthRequiredExternalEvidence;
}

export interface MobileAuthEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly evidence?: Partial<Record<MobileAuthEvidenceFlag, boolean>>;
}

export interface MobileAuthEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly requiredCommands: typeof mobileAuthRuntimeCommands;
  readonly missingCommands: readonly string[];
  readonly requiredArtifacts: typeof mobileAuthArtifactPaths;
  readonly missingArtifacts: readonly string[];
  readonly requiredEvidence: typeof mobileAuthEvidenceFlags;
  readonly missingEvidence: readonly MobileAuthEvidenceFlag[];
  readonly blockers: readonly string[];
}

export const mobileAuthRuntimeMatrix = [
  {
    id: "auth-typecheck",
    command: "pnpm --filter @inkroute/auth typecheck",
    artifact: "coverage/mobile-auth-auth-typecheck.txt",
    status: "wired",
  },
  {
    id: "auth-tests",
    command: "pnpm --filter @inkroute/auth test",
    artifact: "coverage/mobile-auth-auth-test.txt",
    status: "wired",
  },
  {
    id: "mobile-typecheck-test",
    command: "pnpm --filter @inkroute/mobile typecheck && pnpm --filter @inkroute/mobile test",
    artifact: "coverage/mobile-auth-app-test.txt",
    status: "device-gated",
  },
  {
    id: "provider-login-logout",
    command: "provider-backed mobile login/logout/refresh tests",
    artifact: "coverage/mobile-auth-provider-login-logout-redacted.json",
    status: "provider-gated",
  },
  {
    id: "securestore-token-storage",
    command: "Expo SecureStore plaintext-denial and clearing evidence",
    artifact: "coverage/mobile-auth-securestore-redacted.json",
    status: "secure-store-gated",
  },
  {
    id: "secure-session-lifecycle",
    command: "local secure-session lifecycle clearing contract tests",
    artifact: "coverage/mobile-auth-secure-session-lifecycle.json",
    status: "secure-store-gated",
  },
  {
    id: "biometric-unlock",
    command: "Expo device biometric unlock test",
    artifact: "coverage/mobile-auth-biometric-device-redacted.json",
    status: "biometric-gated",
  },
  {
    id: "refresh-logout-revocation-clearing",
    command: "refresh token recovery plus logout/revoked-session local clearing tests",
    artifact: "coverage/mobile-auth-refresh-logout-revocation.json",
    status: "secure-store-gated",
  },
  {
    id: "tenant-role-cross-tenant-denial",
    command: "server-backed tenant membership, role resolution, and cross-tenant denial tests",
    artifact: "coverage/mobile-auth-tenant-role-denial.json",
    status: "tenant-gated",
  },
  {
    id: "audit-persistence",
    command: "mobile auth AuditLog persistence tests",
    artifact: "coverage/mobile-auth-auditlog-redacted.json",
    status: "audit-gated",
  },
  {
    id: "ios-android-device-smoke",
    command: "Expo iOS/Android auth smoke tests",
    artifact: "coverage/mobile-auth-ios-android-smoke-redacted.json",
    status: "device-gated",
  },
  {
    id: "persisted-run-payload",
    command: "capture persisted MobileAuthRuntime run payload",
    artifact: "coverage/mobile-auth-persisted-run-payload.json",
    status: "audit-gated",
  },
] as const satisfies readonly MobileAuthRuntimeMatrixEntry[];

export interface MobileAuthSurfaceContractEntry {
  readonly surfaceId: string;
  readonly command: string;
  readonly artifact: string;
  readonly proofBoundary:
    | "provider-session"
    | "secure-store"
    | "secure-session-lifecycle"
    | "biometric-device"
    | "refresh-revocation"
    | "tenant-role-denial"
    | "audit-persistence"
    | "device-smoke"
    | "ci-secret-safe";
  readonly providerBackedEvidenceRequired: boolean;
  readonly deviceEvidenceRequired: boolean;
  readonly redactedArtifactRequired: boolean;
}

export const mobileAuthSurfaceContract = [
  {
    surfaceId: "provider-login-logout",
    command: "provider-backed mobile login/logout/refresh tests",
    artifact: "coverage/mobile-auth-provider-login-logout-redacted.json",
    proofBoundary: "provider-session",
    providerBackedEvidenceRequired: true,
    deviceEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "securestore-token-storage",
    command: "Expo SecureStore plaintext-denial and clearing evidence",
    artifact: "coverage/mobile-auth-securestore-redacted.json",
    proofBoundary: "secure-store",
    providerBackedEvidenceRequired: false,
    deviceEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "secure-session-lifecycle",
    command: "local secure-session lifecycle clearing contract tests",
    artifact: "coverage/mobile-auth-secure-session-lifecycle.json",
    proofBoundary: "secure-session-lifecycle",
    providerBackedEvidenceRequired: false,
    deviceEvidenceRequired: false,
    redactedArtifactRequired: false,
  },
  {
    surfaceId: "biometric-unlock",
    command: "Expo device biometric unlock test",
    artifact: "coverage/mobile-auth-biometric-device-redacted.json",
    proofBoundary: "biometric-device",
    providerBackedEvidenceRequired: false,
    deviceEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "refresh-logout-revocation-clearing",
    command: "refresh token recovery plus logout/revoked-session local clearing tests",
    artifact: "coverage/mobile-auth-refresh-logout-revocation.json",
    proofBoundary: "refresh-revocation",
    providerBackedEvidenceRequired: true,
    deviceEvidenceRequired: true,
    redactedArtifactRequired: false,
  },
  {
    surfaceId: "tenant-role-cross-tenant-denial",
    command: "server-backed tenant membership, role resolution, and cross-tenant denial tests",
    artifact: "coverage/mobile-auth-tenant-role-denial.json",
    proofBoundary: "tenant-role-denial",
    providerBackedEvidenceRequired: true,
    deviceEvidenceRequired: false,
    redactedArtifactRequired: false,
  },
  {
    surfaceId: "audit-persistence",
    command: "mobile auth AuditLog persistence tests",
    artifact: "coverage/mobile-auth-auditlog-redacted.json",
    proofBoundary: "audit-persistence",
    providerBackedEvidenceRequired: true,
    deviceEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "ios-android-device-smoke",
    command: "Expo iOS/Android auth smoke tests",
    artifact: "coverage/mobile-auth-ios-android-smoke-redacted.json",
    proofBoundary: "device-smoke",
    providerBackedEvidenceRequired: true,
    deviceEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "ci-secret-safe-artifacts",
    command: "GitHub Actions mobile auth runtime evidence job",
    artifact: "coverage/mobile-auth-secret-safe-artifacts.json",
    proofBoundary: "ci-secret-safe",
    providerBackedEvidenceRequired: true,
    deviceEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
] as const satisfies readonly MobileAuthSurfaceContractEntry[];

export const mobileAuthRuntimeReadiness = buildMobileAuthRuntimeReadinessPlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  authTestsPassed: false,
  authTypecheckPassed: false,
  mobileTypecheckPassed: false,
  mobileDeviceTestsPassed: false,
  authProviderConfigured: false,
  providerLoginLogoutTested: false,
  expoSecureStoreConfigured: false,
  biometricUnlockConfigured: true,
  biometricDeviceTested: false,
  refreshTokenRecoveryTested: false,
  logoutClearsLocalStateTested: false,
  revokedSessionClearsLocalStateTested: false,
  tenantMembershipLookupConfigured: false,
  roleResolutionConfigured: false,
  crossTenantDenialTested: false,
  secureTokenStorageVerified: false,
  auditLogPersistenceConfigured: false,
});

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) => {
  const actualSet = new Set(actual ?? []);
  return required.filter((entry) => !actualSet.has(entry));
};

const sensitiveMobileAuthArtifactKey = /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|securestore|biometric|device|auth|audit|role|member|email|phone|medical|payment|artifact|path|ci|workflow|run|evidence|id|key)/i;
const sensitiveMobileAuthArtifactValue =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:sk|pk|gh[psuor]|github_pat|provider-token)[A-Za-z0-9_-]*|(?:tenant|client|user|member|role|session|refresh|securestore|biometric|device|auth|audit|provider|artifact|workflow|ci|run|evidence|mobile)[-_:/]?[A-Za-z0-9_.-]{6,}|(?:coverage|artifacts|test-results|reports|docs)\/[A-Za-z0-9_./-]{6,}|[A-Za-z0-9_-]{24,})/giu;

const redactMobileAuthArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactMobileAuthArtifactValue(entry, `${path}.${index}`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveMobileAuthArtifactKey.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, redactMobileAuthArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  if (typeof value === "string" && sensitiveMobileAuthArtifactValue.test(value)) {
    sensitiveMobileAuthArtifactValue.lastIndex = 0;
    redactedPaths.push(path);
    return value.replace(sensitiveMobileAuthArtifactValue, "[REDACTED]");
  }

  sensitiveMobileAuthArtifactValue.lastIndex = 0;
  return value;
};

export const mobileAuthLocalCommands = [
  "pnpm --filter @inkroute/auth typecheck",
  "pnpm --filter @inkroute/auth test",
  "static mobile secure-session adapter review",
  "static secure-session lifecycle clearing review",
  "static AuthScreen auth contract surfacing review",
] as const;

export const mobileAuthExternalCommands = [
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "provider-backed mobile login/logout/session callback tests",
  "Expo SecureStore plaintext-denial evidence",
  "local secure-session lifecycle clearing contract tests",
  "biometric device unlock smoke",
  "mobile refresh/logout/revocation clearing tests",
  "server-backed tenant membership and cross-tenant denial tests",
  "mobile auth audit persistence tests",
  "GitHub Actions mobile auth evidence job",
] as const;

export const buildMobileAuthExecutionPlan = (): MobileAuthExecutionPlan => ({
  policy: mobileAuthExecutionPolicy,
  commandExecutionAllowed: false,
  authProviderExecutionAllowed: false,
  secureStoreExecutionAllowed: false,
  biometricExecutionAllowed: false,
  deviceExecutionAllowed: false,
  serverTenantExecutionAllowed: false,
  ciExecutionAllowed: false,
  localCommands: mobileAuthLocalCommands,
  externalCommands: mobileAuthExternalCommands,
  surfaceContract: mobileAuthSurfaceContract,
  requiredExternalEvidence: mobileAuthRequiredExternalEvidence,
  secureSessionLifecycleContract: mobileAuthSecureSessionLifecycleContract,
});

export const buildRedactedMobileAuthArtifact = (artifact: unknown): Pick<MobileAuthArtifactReview, "redactedArtifact" | "redactedPaths"> => {
  const redactedPaths: string[] = [];
  return {
    redactedArtifact: redactMobileAuthArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
  };
};

export const buildMobileAuthArtifactReview = (artifact: unknown): MobileAuthArtifactReview => {
  const redacted = buildRedactedMobileAuthArtifact(artifact);
  return {
    artifact,
    redactedArtifact: redacted.redactedArtifact,
    redactedPaths: redacted.redactedPaths,
    secretSafe: redacted.redactedPaths.length > 0,
    requiredExternalEvidence: mobileAuthRequiredExternalEvidence,
  };
};

export const buildMobileAuthPersistedRunPayload = (): MobileAuthPersistedRunPayload => ({
  payloadId: "gap-042-mobile-auth-persisted-run",
  requiredArtifact: "coverage/mobile-auth-persisted-run-payload.json",
  providerBackedPersistenceRequired: true,
  localPersistenceExecutionAllowed: false,
  secureStoreDeviceEvidenceRequired: true,
  tenantDenialEvidenceRequired: true,
  auditPersistenceEvidenceRequired: true,
  redactionRequired: true,
  requiredExternalEvidence: mobileAuthRequiredExternalEvidence,
});

export const buildMobileAuthEvidenceDecision = (
  input: MobileAuthEvidenceInput = {},
): MobileAuthEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, mobileAuthRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, mobileAuthArtifactPaths);
  const missingEvidence = mobileAuthEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = [
    missingCommands.length > 0 ? "Pinned mobile auth commands must be run and captured." : "",
    missingArtifacts.length > 0 ? "Mobile auth artifacts must be retained with redacted provider, device, CI, and secret-safe evidence." : "",
    missingEvidence.length > 0
      ? "Provider login/logout, SecureStore, biometric, refresh/revocation clearing, tenant/RBAC denial, audit, device smoke, CI, and secret-safe evidence must pass."
      : "",
  ].filter(Boolean);

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    requiredCommands: mobileAuthRuntimeCommands,
    missingCommands,
    requiredArtifacts: mobileAuthArtifactPaths,
    missingArtifacts,
    requiredEvidence: mobileAuthEvidenceFlags,
    missingEvidence,
    blockers,
  };
};


