import { buildDashboardAuthGuardEvidencePlan } from "@inkroute/auth";

export type DashboardAuthGuardRuntimeStatus =
  | "wired"
  | "provider-gated"
  | "database-gated"
  | "browser-gated"
  | "audit-gated"
  | "ci-gated";

export interface DashboardAuthGuardRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DashboardAuthGuardRuntimeStatus;
}

export const dashboardAuthGuardRuntimeCommands = [
  "pnpm --filter @inkroute/auth typecheck",
  "pnpm --filter @inkroute/auth test",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm --filter @inkroute/dashboard build",
  "dashboard middleware auth guard tests",
  "dashboard protected layout auth guard tests",
  "dashboard API auth guard tests",
  "browser dashboard login/logout smoke",
  "browser dashboard tenant-switch smoke",
  "browser dashboard cross-tenant denial smoke",
  "auth AuditLog persistence tests",
  "GitHub Actions dashboard auth guard evidence job",
] as const;

export const dashboardAuthGuardReadinessAreas = [
  "provider-backed-dashboard-session",
  "dashboard-middleware-guard",
  "protected-layout-guard",
  "dashboard-api-helper-guard",
  "tenantmember-database-lookup",
  "customrole-database-lookup",
  "unauthorized-login-tenant-switch-denial-states",
  "auth-auditlog-persistence",
  "browser-login-logout",
  "browser-tenant-switch",
  "browser-cross-tenant-denial",
  "no-store-cache-policy",
  "ci-evidence",
  "secret-safe-artifacts",
] as const;

export const dashboardAuthGuardArtifactPaths = [
  "coverage/dashboard-auth-guard-runtime.json",
  "coverage/dashboard-auth-auth-typecheck.txt",
  "coverage/dashboard-auth-auth-test.txt",
  "coverage/dashboard-auth-dashboard-typecheck.txt",
  "coverage/dashboard-auth-dashboard-build.txt",
  "coverage/dashboard-auth-middleware-guard.json",
  "coverage/dashboard-auth-layout-guard.json",
  "coverage/dashboard-auth-api-helper-guard.json",
  "coverage/dashboard-auth-provider-session-redacted.json",
  "coverage/dashboard-auth-tenantmember-customrole-redacted.json",
  "coverage/dashboard-auth-unauthorized-states.json",
  "coverage/dashboard-auth-auditlog-redacted.json",
  "coverage/dashboard-auth-browser-login-logout.json",
  "coverage/dashboard-auth-browser-tenant-switch.json",
  "coverage/dashboard-auth-browser-cross-tenant-denial.json",
  "coverage/dashboard-auth-no-store-cache.json",
  "coverage/dashboard-auth-ci-evidence.json",
  "coverage/dashboard-auth-secret-safe-artifacts.json",
  "test-results/dashboard-auth-guard-runtime",
] as const;

export const dashboardAuthGuardRuntimeMatrix = [
  {
    id: "auth-typecheck",
    command: "pnpm --filter @inkroute/auth typecheck",
    artifact: "coverage/dashboard-auth-auth-typecheck.txt",
    status: "wired",
  },
  {
    id: "auth-tests",
    command: "pnpm --filter @inkroute/auth test",
    artifact: "coverage/dashboard-auth-auth-test.txt",
    status: "wired",
  },
  {
    id: "dashboard-typecheck-build",
    command: "pnpm --filter @inkroute/dashboard typecheck && pnpm --filter @inkroute/dashboard build",
    artifact: "coverage/dashboard-auth-dashboard-build.txt",
    status: "browser-gated",
  },
  {
    id: "middleware-guard",
    command: "dashboard middleware auth guard tests",
    artifact: "coverage/dashboard-auth-middleware-guard.json",
    status: "wired",
  },
  {
    id: "protected-layout-guard",
    command: "dashboard protected layout auth guard tests",
    artifact: "coverage/dashboard-auth-layout-guard.json",
    status: "wired",
  },
  {
    id: "api-helper-guard",
    command: "dashboard API auth guard tests",
    artifact: "coverage/dashboard-auth-api-helper-guard.json",
    status: "wired",
  },
  {
    id: "provider-session",
    command: "browser dashboard login/logout smoke",
    artifact: "coverage/dashboard-auth-provider-session-redacted.json",
    status: "provider-gated",
  },
  {
    id: "tenantmember-customrole-db",
    command: "provider-backed TenantMember and CustomRole lookup tests",
    artifact: "coverage/dashboard-auth-tenantmember-customrole-redacted.json",
    status: "database-gated",
  },
  {
    id: "unauthorized-states-audit",
    command: "auth AuditLog persistence tests",
    artifact: "coverage/dashboard-auth-auditlog-redacted.json",
    status: "audit-gated",
  },
  {
    id: "browser-denial-smokes",
    command: "browser dashboard tenant-switch smoke && browser dashboard cross-tenant denial smoke",
    artifact: "coverage/dashboard-auth-browser-cross-tenant-denial.json",
    status: "browser-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions dashboard auth guard evidence job",
    artifact: "coverage/dashboard-auth-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly DashboardAuthGuardRuntimeMatrixEntry[];

export const dashboardAuthGuardRuntimeReadiness = buildDashboardAuthGuardEvidencePlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  authTestsPassed: false,
  authTypecheckPassed: false,
  dashboardTypecheckPassed: false,
  dashboardBuildPassed: false,
  authProviderSessionsConfigured: false,
  dashboardMiddlewareEnforcesGuard: true,
  protectedLayoutEnforcesGuard: true,
  dashboardApiHelpersEnforceGuard: true,
  tenantMembershipDbLookupConfigured: false,
  customRoleDbLookupConfigured: false,
  unauthorizedStatesImplemented: true,
  authAuditLogsPersisted: false,
  browserLoginLogoutPassed: false,
  browserTenantSwitchPassed: false,
  browserCrossTenantDenialPassed: false,
  noStoreCacheVerified: true,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});
