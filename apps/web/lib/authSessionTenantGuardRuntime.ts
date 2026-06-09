import { buildAuthSessionTenantGuardRuntimeReadinessPlan } from "@inkroute/auth";

export const authSessionTenantGuardArtifactPaths = [
  "coverage/auth-session-tenant-guard-runtime.json",
  "coverage/auth-dashboard-middleware-guard.json",
  "coverage/auth-dashboard-route-guard-matrix.json",
  "coverage/auth-mobile-session-guard.json",
  "coverage/auth-csrf-revocation-redacted.json",
  "coverage/auth-provider-session-redacted.json",
  "coverage/auth-cross-tenant-denial-redacted.json",
  "test-results/auth-session-tenant-guards",
  "test-results/dashboard-auth-guards",
  "test-results/mobile-auth-guards",
] as const;

export const authSessionTenantGuardCommands = [
  "pnpm --filter @inkroute/auth test",
  "pnpm --filter @inkroute/auth typecheck",
  "pnpm vitest run apps/web/tests/auth-session-tenant-guard-static.test.ts apps/dashboard/tests/security-trust-route-static.test.ts apps/dashboard/tests/security-privacy-route-static.test.ts apps/mobile/tests/mobile-security-static.test.ts",
  "provider-backed login/logout integration tests",
  "dashboard/mobile/API route guard integration tests",
  "CSRF-bound mutating route tests",
  "auth audit-log persistence tests",
  "cross-tenant route integration tests",
] as const;

export const authSessionTenantGuardSurfaceMatrix = [
  {
    id: "dashboard-middleware-session-cookie-csrf",
    surface: "apps/dashboard/middleware.ts",
    guard: "production session cookie plus cookie-authenticated CSRF denial",
    artifact: "coverage/auth-dashboard-middleware-guard.json",
    status: "static-target-wired",
  },
  {
    id: "dashboard-api-tenant-reader-actor",
    surface: "apps/dashboard/app/api/dashboardAuth.ts",
    guard: "tenant actor resolution and production AUTH_REQUIRED fallback denial",
    artifact: "coverage/auth-dashboard-route-guard-matrix.json",
    status: "static-target-wired",
  },
  {
    id: "dashboard-trust-privacy-routes",
    surface: "apps/dashboard/app/api/security/*",
    guard: "tenant/role scoped no-store trust reads and privacy mutations",
    artifact: "coverage/auth-dashboard-route-guard-matrix.json",
    status: "route-contract-wired",
  },
  {
    id: "mobile-session-tenant-guard",
    surface: "apps/mobile/tests/mobile-security-static.test.ts",
    guard: "mobile security posture and tenant-isolation surfaces stay provider-gated",
    artifact: "coverage/auth-mobile-session-guard.json",
    status: "mobile-contract-wired",
  },
  {
    id: "provider-backed-cross-tenant-proof",
    surface: "provider auth plus persisted TenantMember/CustomRole/session rows",
    guard: "provider login/logout, revocation, audit, and cross-tenant denial proof",
    artifact: "coverage/auth-provider-session-redacted.json",
    status: "provider-proof-gated",
  },
] as const;

export function buildAuthSessionTenantGuardCoverageContract() {
  return buildAuthSessionTenantGuardRuntimeReadinessPlan({
    packageScripts: ["test", "typecheck"],
    authTestsPassed: false,
    authTypecheckPassed: false,
    authProviderSelected: false,
    providerLoginLogoutWired: false,
    secureDashboardCookiesConfigured: true,
    mobileTokenStorageConfigured: false,
    serverTenantMembershipPersistenceConfigured: false,
    routeMiddlewareAdaptersConfigured: true,
    dashboardRoutesIntegrated: true,
    mobileApiRoutesIntegrated: true,
    sensitiveServerRoutesIntegrated: true,
    fieldAuthorizationIntegratedInRoutes: true,
    sessionRevocationPersistenceConfigured: false,
    csrfTokenBindingConfigured: true,
    auditLogWritesConfigured: false,
    providerBackedRouteTestsPassed: false,
    crossTenantIntegrationTestsPassed: false,
  });
}

export const authSessionTenantGuardCoverageContract = buildAuthSessionTenantGuardCoverageContract();
