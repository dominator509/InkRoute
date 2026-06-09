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
