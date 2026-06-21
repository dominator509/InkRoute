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
  "coverage/mobile-auth-biometric-device-redacted.json",
  "coverage/mobile-auth-refresh-logout-revocation.json",
  "coverage/mobile-auth-tenant-role-denial.json",
  "coverage/mobile-auth-auditlog-redacted.json",
  "coverage/mobile-auth-ios-android-smoke-redacted.json",
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
  "biometricDeviceTested",
  "refreshLogoutRevocationClearingTested",
  "tenantMembershipRoleResolutionTested",
  "crossTenantDenialTested",
  "auditPersistenceVerified",
  "iosAndroidSmokeTested",
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
  "biometric device unlock smoke",
  "refresh/logout/revocation clearing proof",
  "server-backed tenant membership and role resolution proof",
  "cross-tenant runtime denial proof",
  "mobile auth audit persistence evidence",
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
  readonly requiredExternalEvidence: typeof mobileAuthRequiredExternalEvidence;
}

export interface MobileAuthArtifactReview {
  readonly artifact: unknown;
  readonly redactedArtifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: boolean;
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
] as const satisfies readonly MobileAuthRuntimeMatrixEntry[];

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

const sensitiveMobileAuthArtifactKey = /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|securestore|biometric|device|auth|audit|role|member|email|phone|medical|payment)/i;

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

  return value;
};

export const mobileAuthLocalCommands = [
  "pnpm --filter @inkroute/auth typecheck",
  "pnpm --filter @inkroute/auth test",
  "static mobile secure-session adapter review",
  "static AuthScreen auth contract surfacing review",
] as const;

export const mobileAuthExternalCommands = [
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "provider-backed mobile login/logout/session callback tests",
  "Expo SecureStore plaintext-denial evidence",
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
  requiredExternalEvidence: mobileAuthRequiredExternalEvidence,
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


