import { buildProviderSessionStoreReadinessPlan } from "@inkroute/auth";

export type ProviderSessionRuntimeStatus =
  | "wired"
  | "provider-gated"
  | "persistence-gated"
  | "security-gated"
  | "smoke-gated";

export interface ProviderSessionRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: ProviderSessionRuntimeStatus;
}

export interface ProviderSessionRunPersistenceContract {
  readonly model: "ProviderSessionRun";
  readonly tenantRelation: "providerSessionRuns";
  readonly migration: "20260609032700_add_provider_session_runs";
  readonly jsonFields: readonly [
    "commandMatrix",
    "controlManifest",
    "artifactManifest",
    "providerConfigurationManifest",
    "tenantIsolationManifest",
  ];
  readonly evidenceBooleans: readonly [
    "authPackageTypecheckPassed",
    "authPackageTestsPassed",
    "providerSelected",
    "providerEnvConfigured",
    "loginCallbackWired",
    "logoutCallbackWired",
    "sessionCallbackWired",
    "userProvisioningConfigured",
    "tenantMembershipLookupPersisted",
    "customRoleLookupPersisted",
    "databaseSessionStoreConfigured",
    "sessionRevocationPersisted",
    "secureDashboardCookiesConfigured",
    "mobileTokenStorageConfigured",
    "auditLogWritesConfigured",
    "providerBackedTestsPassed",
    "crossTenantSmokeTestsPassed",
    "commandEvidenceCaptured",
  ];
  readonly artifactFields: readonly [
    "authTypecheckArtifactPath",
    "authTestArtifactPath",
    "providerEnvArtifactPath",
    "loginCallbackArtifactPath",
    "logoutCallbackArtifactPath",
    "sessionCallbackArtifactPath",
    "persistenceArtifactPath",
    "securityControlsArtifactPath",
    "auditLogArtifactPath",
    "tenantIsolationSmokeArtifactPath",
    "mobileRevocationSmokeArtifactPath",
    "ciRunUrl",
  ];
}

export const providerSessionRunPersistenceContract: ProviderSessionRunPersistenceContract = {
  model: "ProviderSessionRun",
  tenantRelation: "providerSessionRuns",
  migration: "20260609032700_add_provider_session_runs",
  jsonFields: [
    "commandMatrix",
    "controlManifest",
    "artifactManifest",
    "providerConfigurationManifest",
    "tenantIsolationManifest",
  ],
  evidenceBooleans: [
    "authPackageTypecheckPassed",
    "authPackageTestsPassed",
    "providerSelected",
    "providerEnvConfigured",
    "loginCallbackWired",
    "logoutCallbackWired",
    "sessionCallbackWired",
    "userProvisioningConfigured",
    "tenantMembershipLookupPersisted",
    "customRoleLookupPersisted",
    "databaseSessionStoreConfigured",
    "sessionRevocationPersisted",
    "secureDashboardCookiesConfigured",
    "mobileTokenStorageConfigured",
    "auditLogWritesConfigured",
    "providerBackedTestsPassed",
    "crossTenantSmokeTestsPassed",
    "commandEvidenceCaptured",
  ],
  artifactFields: [
    "authTypecheckArtifactPath",
    "authTestArtifactPath",
    "providerEnvArtifactPath",
    "loginCallbackArtifactPath",
    "logoutCallbackArtifactPath",
    "sessionCallbackArtifactPath",
    "persistenceArtifactPath",
    "securityControlsArtifactPath",
    "auditLogArtifactPath",
    "tenantIsolationSmokeArtifactPath",
    "mobileRevocationSmokeArtifactPath",
    "ciRunUrl",
  ],
};

export const providerSessionRuntimeCommands = [
  "pnpm --filter @inkroute/auth typecheck",
  "pnpm --filter @inkroute/auth test",
  "provider-backed login callback test",
  "provider-backed logout callback test",
  "provider-backed session callback and TenantMember lookup test",
  "dashboard/API tenant isolation smoke tests",
  "mobile session storage/revocation smoke tests",
] as const;

export const providerSessionRuntimeControls = [
  "provider-identity-to-user-mapping",
  "server-side-tenant-member-lookup",
  "server-side-custom-role-lookup",
  "database-session-store",
  "persisted-session-revocation",
  "secure-dashboard-cookies",
  "secure-mobile-token-storage",
  "auth-audit-log-writes",
  "cross-tenant-session-denial",
] as const;

export const providerSessionRuntimeArtifactPaths = [
  "coverage/provider-session-runtime.json",
  "coverage/provider-session-auth-typecheck.txt",
  "coverage/provider-session-auth-test.txt",
  "coverage/provider-session-provider-env-redacted.json",
  "coverage/provider-session-login-callback.json",
  "coverage/provider-session-logout-callback.json",
  "coverage/provider-session-callback-tenant-lookup.json",
  "coverage/provider-session-persistence.json",
  "coverage/provider-session-security-controls.json",
  "coverage/provider-session-audit-log.json",
  "coverage/provider-session-tenant-isolation-smoke.json",
  "coverage/provider-session-mobile-revocation-smoke.json",
  "test-results/provider-session-runtime",
] as const;

export const providerSessionRuntimeMatrix = [
  {
    id: "auth-package-typecheck",
    command: "pnpm --filter @inkroute/auth typecheck",
    artifact: "coverage/provider-session-auth-typecheck.txt",
    status: "wired",
  },
  {
    id: "auth-package-tests",
    command: "pnpm --filter @inkroute/auth test",
    artifact: "coverage/provider-session-auth-test.txt",
    status: "wired",
  },
  {
    id: "provider-selection-env",
    command: "configure selected provider env and callbacks with redacted evidence",
    artifact: "coverage/provider-session-provider-env-redacted.json",
    status: "provider-gated",
  },
  {
    id: "login-callback",
    command: "provider-backed login callback test",
    artifact: "coverage/provider-session-login-callback.json",
    status: "provider-gated",
  },
  {
    id: "logout-callback",
    command: "provider-backed logout callback test",
    artifact: "coverage/provider-session-logout-callback.json",
    status: "provider-gated",
  },
  {
    id: "session-callback-tenant-lookup",
    command: "provider-backed session callback and TenantMember lookup test",
    artifact: "coverage/provider-session-callback-tenant-lookup.json",
    status: "persistence-gated",
  },
  {
    id: "session-role-persistence",
    command: "persist User, TenantMember, CustomRole, session, and revocation lookups",
    artifact: "coverage/provider-session-persistence.json",
    status: "persistence-gated",
  },
  {
    id: "cookie-mobile-security",
    command: "verify secure dashboard cookies and mobile token storage/revocation",
    artifact: "coverage/provider-session-security-controls.json",
    status: "security-gated",
  },
  {
    id: "auth-audit-log",
    command: "write redacted AuditLog rows for auth lifecycle and denials",
    artifact: "coverage/provider-session-audit-log.json",
    status: "persistence-gated",
  },
  {
    id: "tenant-isolation-smoke",
    command: "dashboard/API tenant isolation smoke tests",
    artifact: "coverage/provider-session-tenant-isolation-smoke.json",
    status: "smoke-gated",
  },
  {
    id: "mobile-revocation-smoke",
    command: "mobile session storage/revocation smoke tests",
    artifact: "coverage/provider-session-mobile-revocation-smoke.json",
    status: "smoke-gated",
  },
] as const satisfies readonly ProviderSessionRuntimeMatrixEntry[];

export const providerSessionRuntimeReadiness = buildProviderSessionStoreReadinessPlan({
  packageScripts: {
    typecheck: "tsc --noEmit",
    test: "vitest run --passWithNoTests",
  },
  providerSelected: false,
  providerEnvConfigured: false,
  loginCallbackWired: false,
  logoutCallbackWired: false,
  sessionCallbackWired: false,
  userProvisioningConfigured: false,
  tenantMembershipLookupPersisted: false,
  customRoleLookupPersisted: false,
  databaseSessionStoreConfigured: false,
  sessionRevocationPersisted: false,
  secureDashboardCookiesConfigured: false,
  mobileTokenStorageConfigured: false,
  auditLogWritesConfigured: false,
  providerBackedTestsPassed: false,
  crossTenantSmokeTestsPassed: false,
  commandEvidenceCaptured: false,
});
