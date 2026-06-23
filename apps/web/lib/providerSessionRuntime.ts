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
  "configure selected provider env and callbacks with redacted evidence",
  "provider-backed login callback test",
  "provider-backed logout callback test",
  "provider-backed session callback and TenantMember lookup test",
  "persist User, TenantMember, CustomRole, session, and revocation lookups",
  "verify secure dashboard cookies and mobile token storage/revocation",
  "write redacted AuditLog rows for auth lifecycle and denials",
  "dashboard/API tenant isolation smoke tests",
  "mobile session storage/revocation smoke tests",
] as const;

export const providerSessionRuntimeControls = [
  "provider-callback-contract-map",
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
  "coverage/provider-session-callback-contract.json",
  "coverage/provider-session-login-callback.json",
  "coverage/provider-session-logout-callback.json",
  "coverage/provider-session-callback-tenant-lookup.json",
  "coverage/provider-session-persistence.json",
  "coverage/provider-session-security-controls.json",
  "coverage/provider-session-audit-log.json",
  "coverage/provider-session-tenant-isolation-smoke.json",
  "coverage/provider-session-mobile-revocation-smoke.json",
  "coverage/provider-session-redacted-evidence-bundle.json",
  "test-results/provider-session-runtime",
] as const;

export const providerSessionRuntimeProofFiles = [
  "apps/web/lib/providerSessionRuntime.ts",
  "apps/web/tests/provider-session-runtime-static.test.ts",
  "packages/auth/package.json",
  "packages/auth/src/index.ts",
  "packages/auth/tests/authorization.test.ts",
  "apps/dashboard/middleware.ts",
  "apps/dashboard/tests/dashboard-auth-middleware-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609032700_add_provider_session_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type ProviderSessionRuntimeCommand = (typeof providerSessionRuntimeCommands)[number];
export type ProviderSessionRuntimeControl = (typeof providerSessionRuntimeControls)[number];
export type ProviderSessionRuntimeArtifact = (typeof providerSessionRuntimeArtifactPaths)[number];

export interface ProviderSessionRedactedEvidenceBundle {
  readonly status: "redacted-evidence-bundle-ready";
  readonly artifactPath: "coverage/provider-session-redacted-evidence-bundle.json";
  readonly redactedArtifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredArtifacts: typeof providerSessionRuntimeArtifactPaths;
  readonly requiredExternalEvidence: typeof providerSessionRequiredExternalEvidence;
  readonly providerExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
}

export interface ProviderSessionSurfaceContractEntry {
  readonly surfaceId: string;
  readonly requiredControl: ProviderSessionRuntimeControl;
  readonly requiredCommand: ProviderSessionRuntimeCommand;
  readonly requiredArtifact: ProviderSessionRuntimeArtifact;
  readonly sessionBoundary:
    | "provider-config"
    | "callback"
    | "tenant-lookup"
    | "session-store"
    | "revocation"
    | "security-controls"
    | "audit-log"
    | "tenant-isolation"
    | "mobile-revocation"
    | "persistence";
  readonly providerBackedEvidenceRequired: boolean;
  readonly redactedArtifactRequired: true;
}

export const providerSessionSurfaceContract: readonly ProviderSessionSurfaceContractEntry[] = [
  {
    surfaceId: "provider-selection-env",
    requiredControl: "provider-callback-contract-map",
    requiredCommand: "configure selected provider env and callbacks with redacted evidence",
    requiredArtifact: "coverage/provider-session-provider-env-redacted.json",
    sessionBoundary: "provider-config",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "login-callback",
    requiredControl: "provider-identity-to-user-mapping",
    requiredCommand: "provider-backed login callback test",
    requiredArtifact: "coverage/provider-session-login-callback.json",
    sessionBoundary: "callback",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "logout-callback",
    requiredControl: "persisted-session-revocation",
    requiredCommand: "provider-backed logout callback test",
    requiredArtifact: "coverage/provider-session-logout-callback.json",
    sessionBoundary: "revocation",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "session-callback-tenant-lookup",
    requiredControl: "server-side-tenant-member-lookup",
    requiredCommand: "provider-backed session callback and TenantMember lookup test",
    requiredArtifact: "coverage/provider-session-callback-tenant-lookup.json",
    sessionBoundary: "tenant-lookup",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "session-role-persistence",
    requiredControl: "database-session-store",
    requiredCommand: "persist User, TenantMember, CustomRole, session, and revocation lookups",
    requiredArtifact: "coverage/provider-session-persistence.json",
    sessionBoundary: "session-store",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "cookie-mobile-security",
    requiredControl: "secure-dashboard-cookies",
    requiredCommand: "verify secure dashboard cookies and mobile token storage/revocation",
    requiredArtifact: "coverage/provider-session-security-controls.json",
    sessionBoundary: "security-controls",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "auth-audit-log",
    requiredControl: "auth-audit-log-writes",
    requiredCommand: "write redacted AuditLog rows for auth lifecycle and denials",
    requiredArtifact: "coverage/provider-session-audit-log.json",
    sessionBoundary: "audit-log",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "tenant-isolation-smoke",
    requiredControl: "cross-tenant-session-denial",
    requiredCommand: "dashboard/API tenant isolation smoke tests",
    requiredArtifact: "coverage/provider-session-tenant-isolation-smoke.json",
    sessionBoundary: "tenant-isolation",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "mobile-revocation-smoke",
    requiredControl: "secure-mobile-token-storage",
    requiredCommand: "mobile session storage/revocation smoke tests",
    requiredArtifact: "coverage/provider-session-mobile-revocation-smoke.json",
    sessionBoundary: "mobile-revocation",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
] as const;

export interface ProviderSessionEvidenceInput {
  readonly authPackageTypecheckPassed: boolean;
  readonly authPackageTestsPassed: boolean;
  readonly providerSelected: boolean;
  readonly providerEnvConfigured: boolean;
  readonly loginCallbackWired: boolean;
  readonly logoutCallbackWired: boolean;
  readonly sessionCallbackWired: boolean;
  readonly userProvisioningConfigured: boolean;
  readonly tenantMembershipLookupPersisted: boolean;
  readonly customRoleLookupPersisted: boolean;
  readonly databaseSessionStoreConfigured: boolean;
  readonly sessionRevocationPersisted: boolean;
  readonly secureDashboardCookiesConfigured: boolean;
  readonly mobileTokenStorageConfigured: boolean;
  readonly auditLogWritesConfigured: boolean;
  readonly providerBackedTestsPassed: boolean;
  readonly crossTenantSmokeTestsPassed: boolean;
  readonly commandEvidenceCaptured: boolean;
  readonly providerSessionRunPersisted: boolean;
  readonly coveredControls: readonly ProviderSessionRuntimeControl[];
  readonly capturedArtifacts: readonly ProviderSessionRuntimeArtifact[];
  readonly completedCommands: readonly ProviderSessionRuntimeCommand[];
}

export interface ProviderSessionRunRecordInput extends ProviderSessionEvidenceInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha?: string | null;
  readonly status: "complete" | "blocked";
  readonly providerConfigurationManifest?: readonly string[];
  readonly tenantIsolationManifest?: readonly string[];
  readonly authTypecheckArtifactPath?: string | null;
  readonly authTestArtifactPath?: string | null;
  readonly providerEnvArtifactPath?: string | null;
  readonly loginCallbackArtifactPath?: string | null;
  readonly logoutCallbackArtifactPath?: string | null;
  readonly sessionCallbackArtifactPath?: string | null;
  readonly persistenceArtifactPath?: string | null;
  readonly securityControlsArtifactPath?: string | null;
  readonly auditLogArtifactPath?: string | null;
  readonly tenantIsolationSmokeArtifactPath?: string | null;
  readonly mobileRevocationSmokeArtifactPath?: string | null;
  readonly ciRunUrl?: string | null;
}

export interface ProviderSessionRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string | null;
  readonly status: string;
  readonly commandMatrix: readonly ProviderSessionRuntimeMatrixEntry[];
  readonly controlManifest: readonly ProviderSessionRuntimeControl[];
  readonly artifactManifest: readonly ProviderSessionRuntimeArtifact[];
  readonly providerConfigurationManifest: readonly string[];
  readonly tenantIsolationManifest: readonly string[];
  readonly authPackageTypecheckPassed: boolean;
  readonly authPackageTestsPassed: boolean;
  readonly providerSelected: boolean;
  readonly providerEnvConfigured: boolean;
  readonly loginCallbackWired: boolean;
  readonly logoutCallbackWired: boolean;
  readonly sessionCallbackWired: boolean;
  readonly userProvisioningConfigured: boolean;
  readonly tenantMembershipLookupPersisted: boolean;
  readonly customRoleLookupPersisted: boolean;
  readonly databaseSessionStoreConfigured: boolean;
  readonly sessionRevocationPersisted: boolean;
  readonly secureDashboardCookiesConfigured: boolean;
  readonly mobileTokenStorageConfigured: boolean;
  readonly auditLogWritesConfigured: boolean;
  readonly providerBackedTestsPassed: boolean;
  readonly crossTenantSmokeTestsPassed: boolean;
  readonly commandEvidenceCaptured: boolean;
  readonly authTypecheckArtifactPath: string | null;
  readonly authTestArtifactPath: string | null;
  readonly providerEnvArtifactPath: string | null;
  readonly loginCallbackArtifactPath: string | null;
  readonly logoutCallbackArtifactPath: string | null;
  readonly sessionCallbackArtifactPath: string | null;
  readonly persistenceArtifactPath: string | null;
  readonly securityControlsArtifactPath: string | null;
  readonly auditLogArtifactPath: string | null;
  readonly tenantIsolationSmokeArtifactPath: string | null;
  readonly mobileRevocationSmokeArtifactPath: string | null;
  readonly ciRunUrl: string | null;
}

export interface ProviderSessionRunRepository {
  readonly providerSessionRun: {
    upsert(input: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: ProviderSessionRunData;
      readonly update: Omit<ProviderSessionRunData, "tenantId" | "runId">;
    }): Promise<unknown>;
  };
}

export interface ProviderSessionEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingControls: readonly ProviderSessionRuntimeControl[];
  readonly missingArtifacts: readonly ProviderSessionRuntimeArtifact[];
  readonly missingCommands: readonly ProviderSessionRuntimeCommand[];
  readonly requiredControls: readonly ProviderSessionRuntimeControl[];
  readonly requiredArtifacts: typeof providerSessionRuntimeArtifactPaths;
  readonly requiredCommands: typeof providerSessionRuntimeCommands;
  readonly requiredEvidence: typeof providerSessionRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface ProviderSessionExecutionPolicy {
  readonly codexMayClassifyStaticProviderSessionReadiness: true;
  readonly providerSelectionRequiredForClosure: true;
  readonly providerCallbacksRequiredForClosure: true;
  readonly persistedSessionStoreRequiredForClosure: true;
  readonly auditLogEvidenceRequiredForClosure: true;
  readonly tenantIsolationSmokeRequiredForClosure: true;
  readonly mobileRevocationSmokeRequiredForClosure: true;
  readonly providerPersistenceRequiredForClosure: true;
}

export interface ProviderSessionExecutionPlan {
  readonly localCommands: typeof providerSessionRuntimeCommands;
  readonly controls: typeof providerSessionRuntimeControls;
  readonly callbackContract: typeof providerSessionCallbackContract;
  readonly surfaceContract: typeof providerSessionSurfaceContract;
  readonly artifactPaths: typeof providerSessionRuntimeArtifactPaths;
  readonly proofFiles: typeof providerSessionRuntimeProofFiles;
  readonly commandExecutionAllowed: false;
  readonly providerExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly providerPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof providerSessionExecutionPolicy;
  readonly requiredExternalEvidence: typeof providerSessionRequiredExternalEvidence;
}

export const providerSessionExecutionPolicy: ProviderSessionExecutionPolicy = {
  codexMayClassifyStaticProviderSessionReadiness: true,
  providerSelectionRequiredForClosure: true,
  providerCallbacksRequiredForClosure: true,
  persistedSessionStoreRequiredForClosure: true,
  auditLogEvidenceRequiredForClosure: true,
  tenantIsolationSmokeRequiredForClosure: true,
  mobileRevocationSmokeRequiredForClosure: true,
  providerPersistenceRequiredForClosure: true,
};

export const providerSessionRequiredExternalEvidence = [
  "Redacted provider selection, environment, and callback configuration evidence.",
  "Provider-backed login, logout, session callback, and TenantMember lookup evidence.",
  "Persisted User, TenantMember, CustomRole, session, and revocation lookup evidence.",
  "Redacted auth AuditLog rows and tenant-isolation smoke evidence.",
  "Mobile session storage and revocation smoke evidence.",
  "Provider-backed persistProviderSessionRun execution evidence.",
  "Redacted provider auth/session evidence bundle captured without raw provider IDs, tokens, cookies, emails, URLs, tenant IDs, session IDs, or actor identifiers.",
] as const;

export function buildProviderSessionExecutionPlan(): ProviderSessionExecutionPlan {
  return {
    localCommands: providerSessionRuntimeCommands,
    controls: providerSessionRuntimeControls,
    callbackContract: providerSessionCallbackContract,
    surfaceContract: providerSessionSurfaceContract,
    artifactPaths: providerSessionRuntimeArtifactPaths,
    proofFiles: providerSessionRuntimeProofFiles,
    commandExecutionAllowed: false,
    providerExecutionAllowed: false,
    databaseExecutionAllowed: false,
    providerPersistenceExecutionAllowed: false,
    executionPolicy: providerSessionExecutionPolicy,
    requiredExternalEvidence: providerSessionRequiredExternalEvidence,
  };
}

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
    id: "redacted-evidence-bundle",
    command: "retain redacted provider auth/session evidence bundle",
    artifact: "coverage/provider-session-redacted-evidence-bundle.json",
    status: "provider-gated",
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

export function buildProviderSessionDecisionRequiredEvidence(
  readinessEvidence: typeof providerSessionRuntimeReadiness.requiredEvidence,
): ProviderSessionRequiredEvidence {
  return [
    ...readinessEvidence,
    "ProviderSessionRun row with command, control, artifact, provider configuration, and tenant isolation matrices.",
    "Artifact bundle proving auth typecheck/tests, provider env/callbacks, persisted session lookups, revocation, security controls, audit logs, tenant isolation, mobile revocation, and command evidence.",
  ];
}

export type ProviderSessionRequiredEvidence = readonly [
  ...typeof providerSessionRuntimeReadiness.requiredEvidence,
  "ProviderSessionRun row with command, control, artifact, provider configuration, and tenant isolation matrices.",
  "Artifact bundle proving auth typecheck/tests, provider env/callbacks, persisted session lookups, revocation, security controls, audit logs, tenant isolation, mobile revocation, and command evidence.",
];

export const providerSessionRequiredEvidence = buildProviderSessionDecisionRequiredEvidence(
  providerSessionRuntimeReadiness.requiredEvidence,
);

export function buildProviderSessionEvidenceDecision(
  input: ProviderSessionEvidenceInput,
): ProviderSessionEvidenceDecision {
  const coveredControls = new Set(input.coveredControls);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingControls = providerSessionRuntimeControls.filter((control) => !coveredControls.has(control));
  const missingArtifacts = providerSessionRuntimeArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = providerSessionRuntimeCommands.filter((command) => !completedCommands.has(command));
  const readinessPlan = buildProviderSessionStoreReadinessPlan({
    packageScripts: {
      typecheck: "tsc --noEmit",
      test: "vitest run --passWithNoTests",
    },
    providerSelected: input.providerSelected,
    providerEnvConfigured: input.providerEnvConfigured,
    loginCallbackWired: input.loginCallbackWired,
    logoutCallbackWired: input.logoutCallbackWired,
    sessionCallbackWired: input.sessionCallbackWired,
    userProvisioningConfigured: input.userProvisioningConfigured,
    tenantMembershipLookupPersisted: input.tenantMembershipLookupPersisted,
    customRoleLookupPersisted: input.customRoleLookupPersisted,
    databaseSessionStoreConfigured: input.databaseSessionStoreConfigured,
    sessionRevocationPersisted: input.sessionRevocationPersisted,
    secureDashboardCookiesConfigured: input.secureDashboardCookiesConfigured,
    mobileTokenStorageConfigured: input.mobileTokenStorageConfigured,
    auditLogWritesConfigured: input.auditLogWritesConfigured,
    providerBackedTestsPassed: input.providerBackedTestsPassed,
    crossTenantSmokeTestsPassed: input.crossTenantSmokeTestsPassed,
    commandEvidenceCaptured: input.commandEvidenceCaptured,
  });
  const blockers = [...readinessPlan.blockers];

  if (!input.authPackageTypecheckPassed) {
    blockers.push("@inkroute/auth typecheck must pass.");
  }
  if (!input.authPackageTestsPassed) {
    blockers.push("@inkroute/auth tests must pass.");
  }
  if (!input.providerSessionRunPersisted) {
    blockers.push("ProviderSessionRun persistence row must be captured for durable auditability.");
  }
  if (missingControls.length > 0) {
    blockers.push("Every required provider session control must be covered.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required provider session artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required provider session command must be completed.");
  }

  return {
    status:
      blockers.length === 0 && missingControls.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0
        ? "complete"
        : "blocked",
    missingControls,
    missingArtifacts,
    missingCommands,
    requiredControls: providerSessionRuntimeControls,
    requiredArtifacts: providerSessionRuntimeArtifactPaths,
    requiredCommands: providerSessionRuntimeCommands,
    requiredEvidence: providerSessionRequiredEvidence,
    blockers,
  };
}

export function buildProviderSessionRunData(input: ProviderSessionRunRecordInput): ProviderSessionRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha ?? null,
    status: input.status,
    commandMatrix: providerSessionRuntimeMatrix,
    controlManifest: input.coveredControls,
    artifactManifest: input.capturedArtifacts,
    providerConfigurationManifest: input.providerConfigurationManifest ?? [
      "Provider configuration evidence must stay redacted and command-backed.",
    ],
    tenantIsolationManifest: input.tenantIsolationManifest ?? [
      "Tenant isolation smoke evidence is required before provider session closure.",
    ],
    authPackageTypecheckPassed: input.authPackageTypecheckPassed,
    authPackageTestsPassed: input.authPackageTestsPassed,
    providerSelected: input.providerSelected,
    providerEnvConfigured: input.providerEnvConfigured,
    loginCallbackWired: input.loginCallbackWired,
    logoutCallbackWired: input.logoutCallbackWired,
    sessionCallbackWired: input.sessionCallbackWired,
    userProvisioningConfigured: input.userProvisioningConfigured,
    tenantMembershipLookupPersisted: input.tenantMembershipLookupPersisted,
    customRoleLookupPersisted: input.customRoleLookupPersisted,
    databaseSessionStoreConfigured: input.databaseSessionStoreConfigured,
    sessionRevocationPersisted: input.sessionRevocationPersisted,
    secureDashboardCookiesConfigured: input.secureDashboardCookiesConfigured,
    mobileTokenStorageConfigured: input.mobileTokenStorageConfigured,
    auditLogWritesConfigured: input.auditLogWritesConfigured,
    providerBackedTestsPassed: input.providerBackedTestsPassed,
    crossTenantSmokeTestsPassed: input.crossTenantSmokeTestsPassed,
    commandEvidenceCaptured: input.commandEvidenceCaptured,
    authTypecheckArtifactPath: input.authTypecheckArtifactPath ?? null,
    authTestArtifactPath: input.authTestArtifactPath ?? null,
    providerEnvArtifactPath: input.providerEnvArtifactPath ?? null,
    loginCallbackArtifactPath: input.loginCallbackArtifactPath ?? null,
    logoutCallbackArtifactPath: input.logoutCallbackArtifactPath ?? null,
    sessionCallbackArtifactPath: input.sessionCallbackArtifactPath ?? null,
    persistenceArtifactPath: input.persistenceArtifactPath ?? null,
    securityControlsArtifactPath: input.securityControlsArtifactPath ?? null,
    auditLogArtifactPath: input.auditLogArtifactPath ?? null,
    tenantIsolationSmokeArtifactPath: input.tenantIsolationSmokeArtifactPath ?? null,
    mobileRevocationSmokeArtifactPath: input.mobileRevocationSmokeArtifactPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export async function persistProviderSessionRun(
  repository: ProviderSessionRunRepository,
  input: ProviderSessionRunRecordInput,
): Promise<unknown> {
  const data = buildProviderSessionRunData(input);
  const update = {
    commitSha: data.commitSha,
    status: data.status,
    commandMatrix: data.commandMatrix,
    controlManifest: data.controlManifest,
    artifactManifest: data.artifactManifest,
    providerConfigurationManifest: data.providerConfigurationManifest,
    tenantIsolationManifest: data.tenantIsolationManifest,
    authPackageTypecheckPassed: data.authPackageTypecheckPassed,
    authPackageTestsPassed: data.authPackageTestsPassed,
    providerSelected: data.providerSelected,
    providerEnvConfigured: data.providerEnvConfigured,
    loginCallbackWired: data.loginCallbackWired,
    logoutCallbackWired: data.logoutCallbackWired,
    sessionCallbackWired: data.sessionCallbackWired,
    userProvisioningConfigured: data.userProvisioningConfigured,
    tenantMembershipLookupPersisted: data.tenantMembershipLookupPersisted,
    customRoleLookupPersisted: data.customRoleLookupPersisted,
    databaseSessionStoreConfigured: data.databaseSessionStoreConfigured,
    sessionRevocationPersisted: data.sessionRevocationPersisted,
    secureDashboardCookiesConfigured: data.secureDashboardCookiesConfigured,
    mobileTokenStorageConfigured: data.mobileTokenStorageConfigured,
    auditLogWritesConfigured: data.auditLogWritesConfigured,
    providerBackedTestsPassed: data.providerBackedTestsPassed,
    crossTenantSmokeTestsPassed: data.crossTenantSmokeTestsPassed,
    commandEvidenceCaptured: data.commandEvidenceCaptured,
    authTypecheckArtifactPath: data.authTypecheckArtifactPath,
    authTestArtifactPath: data.authTestArtifactPath,
    providerEnvArtifactPath: data.providerEnvArtifactPath,
    loginCallbackArtifactPath: data.loginCallbackArtifactPath,
    logoutCallbackArtifactPath: data.logoutCallbackArtifactPath,
    sessionCallbackArtifactPath: data.sessionCallbackArtifactPath,
    persistenceArtifactPath: data.persistenceArtifactPath,
    securityControlsArtifactPath: data.securityControlsArtifactPath,
    auditLogArtifactPath: data.auditLogArtifactPath,
    tenantIsolationSmokeArtifactPath: data.tenantIsolationSmokeArtifactPath,
    mobileRevocationSmokeArtifactPath: data.mobileRevocationSmokeArtifactPath,
    ciRunUrl: data.ciRunUrl,
  };

  return repository.providerSessionRun.upsert({
    where: { tenantId_runId: { tenantId: input.tenantId, runId: input.runId } },
    create: data,
    update,
  });
}


function redactProviderSessionEvidenceArtifact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactProviderSessionEvidenceArtifact(entry));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        if (/(provider|token|cookie|session|tenant|user|role|email|actor|url|secret|password|authorization|auth|audit|log|output)/i.test(key)) {
          return [key, "[REDACTED]"];
        }
        return [key, redactProviderSessionEvidenceArtifact(entry)];
      }),
    );
  }
  if (typeof value === "string") {
    return value
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED]")
      .replace(/https?:\/\/\S+/gi, "[REDACTED]")
      .replace(/\b(?:github_pat|ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]+\b/g, "[REDACTED]");
  }
  return value;
}

export function buildProviderSessionRedactedEvidenceBundle(
  artifact: unknown,
): ProviderSessionRedactedEvidenceBundle {
  return {
    status: "redacted-evidence-bundle-ready",
    artifactPath: "coverage/provider-session-redacted-evidence-bundle.json",
    redactedArtifact: redactProviderSessionEvidenceArtifact(artifact),
    redactions: ["provider", "token", "cookie", "session", "tenant", "user", "role", "email", "actor", "url", "secret", "authorization", "audit", "log"],
    requiredArtifacts: providerSessionRuntimeArtifactPaths,
    requiredExternalEvidence: providerSessionRequiredExternalEvidence,
    providerExecutionAllowed: false,
    databaseExecutionAllowed: false,
  };
}
