import {
  buildMobileAuthRuntimeReadinessPlan,
  evaluateMobileSessionGate,
  type MobileAuthRuntimeReadinessPlan,
  type MobileSessionGateDecision,
  type Permission,
  type TenantAccessContext,
} from "@inkroute/auth";
import { inkrouteDemoTenant } from "@inkroute/config";
import { createHash } from "node:crypto";

export interface MobileSecureSession {
  tenantId: string;
  userId: string;
  role: TenantAccessContext["role"];
  accessTokenPreview: string;
  refreshTokenStored: boolean;
  expiresAt: string;
  biometricRequired: boolean;
}

export interface MobileSecureSessionStore {
  provider: "expo-secure-store" | "memory-test";
  secureStoreAvailable: boolean;
  loadSession(): Promise<MobileSecureSession | null>;
  saveSession(session: MobileSecureSession): Promise<void>;
  clearSession(reason: "logout" | "revoked" | "expired" | "tenant_mismatch"): Promise<void>;
}

export interface MobileBiometricAdapter {
  available: boolean;
  unlock(reason: string): Promise<boolean>;
}

export interface MobileAuthAuditEvent {
  action: string;
  tenantIdHash: string;
  userIdHash?: string;
  rawTenantIdEchoed: false;
  rawUserIdEchoed: false;
  decision: MobileSessionGateDecision["action"];
  status: MobileSessionGateDecision["status"];
  occurredAt: string;
  redactedDetail: string;
}

export interface MobileAuthSessionPreview {
  decision: MobileSessionGateDecision;
  readiness: MobileAuthRuntimeReadinessPlan;
  auditEvent: MobileAuthAuditEvent;
  boundary: string;
}

export function buildTenantContextFromMobileSession(session: MobileSecureSession): TenantAccessContext {
  return {
    tenantId: session.tenantId,
    userId: session.userId,
    role: session.role,
    expiresAt: session.expiresAt,
  };
}

export function evaluateMobileAuthSession(input: {
  session: MobileSecureSession | null;
  tenantId: string;
  permission: Permission;
  now: string;
  secureStoreAvailable: boolean;
  biometricUnlocked: boolean;
  logoutRequested?: boolean;
}): MobileSessionGateDecision {
  return evaluateMobileSessionGate({
    context: input.session ? buildTenantContextFromMobileSession(input.session) : null,
    tenantId: input.tenantId,
    permission: input.permission,
    now: input.now,
    biometricRequired: input.session?.biometricRequired ?? true,
    biometricUnlocked: input.biometricUnlocked,
    secureStoreAvailable: input.secureStoreAvailable,
    refreshTokenAvailable: input.session?.refreshTokenStored ?? false,
    logoutRequested: input.logoutRequested,
  });
}

export function buildMobileAuthAuditEvent(
  decision: MobileSessionGateDecision,
  occurredAt: string,
  userId?: string,
): MobileAuthAuditEvent {
  return {
    action: decision.auditAction,
    tenantIdHash: createHash("sha256").update(decision.tenantId).digest("hex"),
    ...(userId ? { userIdHash: createHash("sha256").update(userId).digest("hex") } : {}),
    rawTenantIdEchoed: false,
    rawUserIdEchoed: false,
    decision: decision.action,
    status: decision.status,
    occurredAt,
    redactedDetail: decision.allowed
      ? "Mobile auth decision allowed with tenant-safe session metadata."
      : "Mobile auth decision blocked; token material and provider payloads redacted.",
  };
}

export function buildMobileAuthReadinessPreview(): MobileAuthRuntimeReadinessPlan {
  return buildMobileAuthRuntimeReadinessPlan({
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
}

export async function resolveMobileSessionGate(input: {
  store: MobileSecureSessionStore;
  biometric: MobileBiometricAdapter;
  tenantId: string;
  permission: Permission;
  now: string;
  logoutRequested?: boolean;
}): Promise<MobileAuthSessionPreview> {
  const session = await input.store.loadSession();
  const biometricUnlocked = session?.biometricRequired ? await input.biometric.unlock("Unlock InkRoute Artist") : true;
  const decision = evaluateMobileAuthSession({
    session,
    tenantId: input.tenantId,
    permission: input.permission,
    now: input.now,
    secureStoreAvailable: input.store.secureStoreAvailable,
    biometricUnlocked,
    logoutRequested: input.logoutRequested,
  });

  if (decision.action === "logout") await input.store.clearSession("logout");
  if (decision.status === "refresh_token_missing") await input.store.clearSession("expired");
  if (decision.status === "tenant_mismatch") await input.store.clearSession("tenant_mismatch");

  return {
    decision,
    readiness: buildMobileAuthReadinessPreview(),
    auditEvent: buildMobileAuthAuditEvent(decision, input.now, session?.userId),
    boundary:
      "Mobile auth now has an app-side secure-session, biometric, refresh, logout, and audit contract; provider login and device SecureStore proof remain gated.",
  };
}

export const mobileAuthSessionPreview: MobileAuthSessionPreview = {
  decision: evaluateMobileAuthSession({
    session: {
      tenantId: inkrouteDemoTenant.id,
      userId: "user_mara_demo",
      role: "owner",
      accessTokenPreview: "access_***",
      refreshTokenStored: true,
      expiresAt: "2026-06-09T23:59:59.000Z",
      biometricRequired: true,
    },
    tenantId: inkrouteDemoTenant.id,
    permission: "booking:read",
    now: "2026-06-09T00:00:00.000Z",
    secureStoreAvailable: true,
    biometricUnlocked: false,
  }),
  readiness: buildMobileAuthReadinessPreview(),
  auditEvent: buildMobileAuthAuditEvent(
    evaluateMobileAuthSession({
      session: {
        tenantId: inkrouteDemoTenant.id,
        userId: "user_mara_demo",
        role: "owner",
        accessTokenPreview: "access_***",
        refreshTokenStored: true,
        expiresAt: "2026-06-09T23:59:59.000Z",
        biometricRequired: true,
      },
      tenantId: inkrouteDemoTenant.id,
      permission: "booking:read",
      now: "2026-06-09T00:00:00.000Z",
      secureStoreAvailable: true,
      biometricUnlocked: false,
    }),
    "2026-06-09T00:00:00.000Z",
    "user_mara_demo",
  ),
  boundary:
    "Mobile auth now has an app-side secure-session, biometric, refresh, logout, and audit contract; provider login and device SecureStore proof remain gated.",
};
