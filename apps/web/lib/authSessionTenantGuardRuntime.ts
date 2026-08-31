import { buildAuthSessionTenantGuardRuntimeReadinessPlan } from "@inkroute/auth";

export const authSessionTenantGuardArtifactPaths = [
  "coverage/auth-session-tenant-guard-runtime.json",
  "coverage/auth-dashboard-middleware-guard.json",
  "coverage/auth-dashboard-route-guard-matrix.json",
  "coverage/auth-mobile-session-guard.json",
  "coverage/auth-csrf-revocation-redacted.json",
  "coverage/auth-provider-session-redacted.json",
  "coverage/auth-cross-tenant-denial-redacted.json",
  "coverage/auth-session-tenant-guard-external-evidence-packet.json",
  "test-results/auth-session-tenant-guards",
  "test-results/dashboard-auth-guards",
  "test-results/mobile-auth-guards",
] as const;

export const authSessionTenantGuardProofFiles = [
  "packages/auth/package.json",
  "packages/auth/src/index.ts",
  "packages/auth/tests/authorization.test.ts",
  "apps/web/lib/authSessionTenantGuardRuntime.ts",
  "apps/web/tests/auth-session-tenant-guard-static.test.ts",
  "apps/dashboard/middleware.ts",
  "apps/dashboard/app/api/dashboardAuth.ts",
  "apps/dashboard/app/trust/page.tsx",
  "apps/dashboard/app/api/security/trust-status/route.ts",
  "apps/dashboard/app/api/security/privacy-requests/route.ts",
  "apps/dashboard/tests/security-trust-route-static.test.ts",
  "apps/dashboard/tests/security-privacy-route-static.test.ts",
  "apps/mobile/tests/mobile-security-static.test.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export const authSessionTenantGuardCommands = [
  "pnpm --filter @inkroute/auth test",
  "pnpm --filter @inkroute/auth typecheck",
  "pnpm vitest run apps/web/tests/auth-session-tenant-guard-static.test.ts apps/dashboard/tests/security-trust-route-static.test.ts apps/dashboard/tests/security-privacy-route-static.test.ts apps/mobile/tests/mobile-security-static.test.ts",
  "configure selected provider env and callbacks with redacted evidence",
  "provider-backed login callback test",
  "provider-backed logout callback test",
  "provider-backed session callback and TenantMember lookup test",
  "persist User, TenantMember, CustomRole, session, and revocation lookups",
  "verify secure dashboard cookies and mobile token storage/revocation",
  "write redacted AuditLog rows for auth lifecycle and denials",
  "dashboard/API tenant isolation smoke tests",
  "mobile session storage/revocation smoke tests",
  "provider-backed login/logout integration tests",
  "dashboard/mobile/API route guard integration tests",
  "CSRF-bound mutating route tests",
  "auth audit-log persistence tests",
  "cross-tenant route integration tests",
] as const;

export const authSessionTenantGuardLocalCommands = authSessionTenantGuardCommands.slice(0, 3);
export const authSessionTenantGuardExternalCommands = authSessionTenantGuardCommands.slice(3);

export const authSessionTenantGuardRequiredExternalEvidence = [
  "selected auth provider configuration and callback evidence",
  "provider-backed login/logout callback tests",
  "persisted TenantMember/session/revocation lookup proof",
  "provider-backed dashboard/mobile/API route guard proof",
  "CSRF-bound mutating route tests",
  "auth AuditLog persistence and cross-tenant route integration proof",
  "auth/session external evidence packet with redacted provider, session, revocation, audit, and denial proof",
] as const;

export type AuthSessionTenantGuardArtifact = (typeof authSessionTenantGuardArtifactPaths)[number];

export const authSessionTenantGuardLocalArtifacts = [
  "coverage/auth-session-tenant-guard-runtime.json",
  "coverage/auth-dashboard-middleware-guard.json",
  "coverage/auth-dashboard-route-guard-matrix.json",
  "coverage/auth-mobile-session-guard.json",
  "test-results/auth-session-tenant-guards",
  "test-results/dashboard-auth-guards",
  "test-results/mobile-auth-guards",
] as const satisfies readonly AuthSessionTenantGuardArtifact[];

export const authSessionTenantGuardExternalArtifacts = [
  "coverage/auth-csrf-revocation-redacted.json",
  "coverage/auth-provider-session-redacted.json",
  "coverage/auth-cross-tenant-denial-redacted.json",
  "coverage/auth-session-tenant-guard-external-evidence-packet.json",
] as const satisfies readonly AuthSessionTenantGuardArtifact[];

export type AuthSessionTenantGuardCommand = (typeof authSessionTenantGuardCommands)[number];

export type AuthSessionTenantGuardEvidenceInput = {
  authPackageTestsPassed: boolean;
  dashboardMiddlewareProofCaptured: boolean;
  dashboardRouteGuardProofCaptured: boolean;
  mobileGuardProofCaptured: boolean;
  providerLoginLogoutProofCaptured: boolean;
  persistedSessionRevocationProofCaptured: boolean;
  auditLogRedactionProofCaptured: boolean;
  crossTenantDenialProofCaptured: boolean;
  externalEvidencePacketCaptured: boolean;
  requiredCommandsRun: readonly AuthSessionTenantGuardCommand[];
  capturedArtifacts: readonly AuthSessionTenantGuardArtifact[];
};

export type AuthSessionTenantGuardEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: AuthSessionTenantGuardArtifact[];
  requiredCommands: typeof authSessionTenantGuardCommands;
  requiredEvidence: typeof authSessionTenantGuardArtifactPaths;
  redactedSummary: {
    storesRawSessionTokens: false;
    storesRawProviderPayloads: false;
    providerSecretsRedacted: true;
  };
};

export type AuthSessionTenantGuardExecutionPlan = {
  status: "local-plan-ready";
  providerAuthExecutionAllowed: false;
  persistedSessionExecutionAllowed: false;
  revocationLookupExecutionAllowed: false;
  routeIntegrationExecutionAllowed: false;
  crossTenantIntegrationExecutionAllowed: false;
  policy: AuthSessionTenantGuardExecutionPolicy;
  localCommands: typeof authSessionTenantGuardLocalCommands;
  externalCommands: typeof authSessionTenantGuardExternalCommands;
  localArtifacts: typeof authSessionTenantGuardLocalArtifacts;
  externalArtifacts: typeof authSessionTenantGuardExternalArtifacts;
  surfaceContract: typeof authSessionTenantGuardSurfaceContract;
  requiredExternalEvidence: typeof authSessionTenantGuardRequiredExternalEvidence;
  disabledReasons: readonly string[];
};

export type AuthSessionTenantGuardExecutionPolicy = {
  providerAuthExecutionAllowed: false;
  persistedSessionExecutionAllowed: false;
  revocationLookupExecutionAllowed: false;
  routeIntegrationExecutionAllowed: false;
  crossTenantIntegrationExecutionAllowed: false;
  csrfMutationRouteExecutionAllowed: false;
  auditLogPersistenceExecutionAllowed: false;
};

export type AuthSessionTenantGuardArtifactReview = {
  status: "redacted-review-ready";
  redactedArtifact: unknown;
  requiredArtifacts: typeof authSessionTenantGuardArtifactPaths;
  retainedExternalGates: readonly string[];
};

export type AuthSessionTenantGuardExternalEvidencePacket = {
  packetId: "gap-095-auth-session-tenant-guard-external-evidence";
  requiredArtifact: "coverage/auth-session-tenant-guard-external-evidence-packet.json";
  providerAuthExecutionAllowed: false;
  persistedSessionExecutionAllowed: false;
  routeIntegrationExecutionAllowed: false;
  providerSessionEvidenceRequired: true;
  sessionRevocationEvidenceRequired: true;
  auditPersistenceEvidenceRequired: true;
  crossTenantDenialEvidenceRequired: true;
  redactionRequired: true;
  requiredExternalEvidence: typeof authSessionTenantGuardRequiredExternalEvidence;
  surfaceContract: typeof authSessionTenantGuardSurfaceContract;
};

export type AuthSessionTenantGuardRunPersistenceContract = {
  model: "AuthSessionTenantGuardRun";
  tenantRelation: "authSessionTenantGuardRuns";
  storesCommandMatrix: true;
  storesArtifactManifest: true;
  storesProviderSessionEvidence: true;
  storesRevocationEvidence: true;
  storesAuditEvidence: true;
  storesCrossTenantEvidence: true;
  storesSecretSafeReview: true;
};

export const authSessionTenantGuardRunPersistenceContract: AuthSessionTenantGuardRunPersistenceContract = {
  model: "AuthSessionTenantGuardRun",
  tenantRelation: "authSessionTenantGuardRuns",
  storesCommandMatrix: true,
  storesArtifactManifest: true,
  storesProviderSessionEvidence: true,
  storesRevocationEvidence: true,
  storesAuditEvidence: true,
  storesCrossTenantEvidence: true,
  storesSecretSafeReview: true,
};

export type AuthSessionTenantGuardRunRecordInput = {
  tenantId: string;
  runId: string;
  commitSha?: string | null;
  status: AuthSessionTenantGuardEvidenceDecision["status"];
  providerLoginLogoutProofCaptured: boolean;
  persistedSessionRevocationProofCaptured: boolean;
  auditLogRedactionProofCaptured: boolean;
  crossTenantDenialProofCaptured: boolean;
  secretSafeReviewCaptured: boolean;
  capturedArtifacts: readonly AuthSessionTenantGuardArtifact[];
  requiredCommandsRun: readonly AuthSessionTenantGuardCommand[];
};

export type AuthSessionTenantGuardRunData = {
  tenantId: string;
  runId: string;
  commitSha: string | null;
  status: AuthSessionTenantGuardEvidenceDecision["status"];
  commandMatrix: typeof authSessionTenantGuardCommands;
  artifactManifest: readonly AuthSessionTenantGuardArtifact[];
  providerLoginLogoutProofCaptured: boolean;
  persistedSessionRevocationProofCaptured: boolean;
  auditLogRedactionProofCaptured: boolean;
  crossTenantDenialProofCaptured: boolean;
  secretSafeReviewCaptured: boolean;
  completedCommands: readonly AuthSessionTenantGuardCommand[];
  redactedSummary: AuthSessionTenantGuardEvidenceDecision["redactedSummary"];
};

export type AuthSessionTenantGuardRunRepository = {
  authSessionTenantGuardRun: {
    upsert(input: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: AuthSessionTenantGuardRunData;
      update: Omit<AuthSessionTenantGuardRunData, "tenantId" | "runId">;
    }): Promise<unknown>;
  };
};

const authSessionTenantGuardSecretPatterns = [
  /(session[_-]?token['":=\s]+)[^"',\s}]+/gi,
  /(csrf[_-]?token['":=\s]+)[^"',\s}]+/gi,
  /(provider[_-]?(?:access|refresh)?[_-]?token['":=\s]+)[^"',\s}]+/gi,
  /(authorization:\s*bearer\s+)[A-Za-z0-9._-]+/gi,
  /(cookie:\s*)[^"\n]+/gi,
  /(secret['":=\s]+)[^"',\s}]+/gi,
  /(https?:\/\/)[^\s"'<>]+/gi,
  /(postgres(?:ql)?:\/\/)[^\s"'<>]+/gi,
  /((?:coverage|artifacts|test-results|reports|docs)\/)[A-Za-z0-9_./-]{6,}/gi,
  /((?:tenant|actor|user|member|membership|role|custom|provider|account|session|revocation|audit|idempotency|auth|guard|denial|route|workflow|ci|run|commit)[-_:/]?)[A-Za-z0-9_.-]{6,}/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
] as const;

export function buildRedactedAuthSessionTenantGuardArtifact(value: unknown): unknown {
  if (typeof value === "string") {
    return authSessionTenantGuardSecretPatterns.reduce(
      (redacted, pattern) =>
        redacted.replace(pattern, (_match, prefix: string | number | undefined) => `${typeof prefix === "string" ? prefix : ""}[REDACTED]`),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => buildRedactedAuthSessionTenantGuardArtifact(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /actorUserId|auditId|authorization|credential|customRoleId|email|idempotencyKey|memberId|membershipId|password|phone|private|providerAccountId|providerPayload|providerUserId|rawBody|revocationId|secret|session|stack|tenantId|tenantMemberId|token|userId/i.test(key)
          ? "[REDACTED]"
          : buildRedactedAuthSessionTenantGuardArtifact(entry),
      ]),
    );
  }

  return value;
}

export const authSessionTenantGuardExecutionPolicy: AuthSessionTenantGuardExecutionPolicy = {
  providerAuthExecutionAllowed: false,
  persistedSessionExecutionAllowed: false,
  revocationLookupExecutionAllowed: false,
  routeIntegrationExecutionAllowed: false,
  crossTenantIntegrationExecutionAllowed: false,
  csrfMutationRouteExecutionAllowed: false,
  auditLogPersistenceExecutionAllowed: false,
};

export type AuthSessionTenantGuardSurfaceContractEntry = {
  surfaceId: string;
  requiredCommand: AuthSessionTenantGuardCommand;
  requiredArtifact: AuthSessionTenantGuardArtifact;
  guardBoundary:
    | "dashboard-middleware"
    | "dashboard-api"
    | "mobile-session"
    | "provider-callback"
    | "session-revocation"
    | "csrf-mutation"
    | "audit-log"
    | "cross-tenant";
  providerBackedEvidenceRequired: boolean;
  redactedArtifactRequired: true;
};

export const authSessionTenantGuardSurfaceContract: readonly AuthSessionTenantGuardSurfaceContractEntry[] = [
  {
    surfaceId: "dashboard-middleware-session-cookie-csrf",
    requiredCommand: "pnpm vitest run apps/web/tests/auth-session-tenant-guard-static.test.ts apps/dashboard/tests/security-trust-route-static.test.ts apps/dashboard/tests/security-privacy-route-static.test.ts apps/mobile/tests/mobile-security-static.test.ts",
    requiredArtifact: "coverage/auth-dashboard-middleware-guard.json",
    guardBoundary: "dashboard-middleware",
    providerBackedEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "dashboard-api-tenant-reader-actor",
    requiredCommand: "pnpm vitest run apps/web/tests/auth-session-tenant-guard-static.test.ts apps/dashboard/tests/security-trust-route-static.test.ts apps/dashboard/tests/security-privacy-route-static.test.ts apps/mobile/tests/mobile-security-static.test.ts",
    requiredArtifact: "coverage/auth-dashboard-route-guard-matrix.json",
    guardBoundary: "dashboard-api",
    providerBackedEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "mobile-session-tenant-guard",
    requiredCommand: "mobile session storage/revocation smoke tests",
    requiredArtifact: "coverage/auth-mobile-session-guard.json",
    guardBoundary: "mobile-session",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "provider-login-logout-callbacks",
    requiredCommand: "provider-backed login/logout integration tests",
    requiredArtifact: "coverage/auth-provider-session-redacted.json",
    guardBoundary: "provider-callback",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "persisted-session-revocation",
    requiredCommand: "persist User, TenantMember, CustomRole, session, and revocation lookups",
    requiredArtifact: "coverage/auth-csrf-revocation-redacted.json",
    guardBoundary: "session-revocation",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "csrf-bound-mutations",
    requiredCommand: "CSRF-bound mutating route tests",
    requiredArtifact: "coverage/auth-csrf-revocation-redacted.json",
    guardBoundary: "csrf-mutation",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "auth-audit-log-redaction",
    requiredCommand: "auth audit-log persistence tests",
    requiredArtifact: "coverage/auth-audit-log-redacted.json",
    guardBoundary: "audit-log",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "cross-tenant-route-denial",
    requiredCommand: "cross-tenant route integration tests",
    requiredArtifact: "coverage/auth-cross-tenant-denial-redacted.json",
    guardBoundary: "cross-tenant",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
] as const;

export function buildAuthSessionTenantGuardExecutionPlan(): AuthSessionTenantGuardExecutionPlan {
  return {
    status: "local-plan-ready",
    providerAuthExecutionAllowed: false,
    persistedSessionExecutionAllowed: false,
    revocationLookupExecutionAllowed: false,
    routeIntegrationExecutionAllowed: false,
    crossTenantIntegrationExecutionAllowed: false,
    policy: authSessionTenantGuardExecutionPolicy,
    localCommands: authSessionTenantGuardLocalCommands,
    externalCommands: authSessionTenantGuardExternalCommands,
    localArtifacts: authSessionTenantGuardLocalArtifacts,
    externalArtifacts: authSessionTenantGuardExternalArtifacts,
    surfaceContract: authSessionTenantGuardSurfaceContract,
    requiredExternalEvidence: authSessionTenantGuardRequiredExternalEvidence,
    disabledReasons: [
      "Provider auth execution requires selected provider credentials and configured callbacks.",
      "Persisted TenantMember/session/revocation proof requires a provider-backed database integration.",
      "Dashboard/mobile/API route integration proof requires runtime auth and tenant data.",
      "Cross-tenant denial proof requires integration actors, tenant memberships, and persisted sessions.",
      "Raw provider/session artifacts must be redacted before review.",
    ],
  };
}

export function buildAuthSessionTenantGuardArtifactReview(rawArtifact: unknown): AuthSessionTenantGuardArtifactReview {
  return {
    status: "redacted-review-ready",
    redactedArtifact: buildRedactedAuthSessionTenantGuardArtifact(rawArtifact),
    requiredArtifacts: authSessionTenantGuardArtifactPaths,
    retainedExternalGates: [
      "Provider login/logout callback proof",
      "Persisted TenantMember/session/revocation proof",
      "Provider-backed dashboard/mobile/API route guard proof",
      "CSRF-bound mutating route proof",
      "Auth AuditLog persistence proof",
      "Cross-tenant route integration proof",
    ],
  };
}

export function buildAuthSessionTenantGuardExternalEvidencePacket(): AuthSessionTenantGuardExternalEvidencePacket {
  return {
    packetId: "gap-095-auth-session-tenant-guard-external-evidence",
    requiredArtifact: "coverage/auth-session-tenant-guard-external-evidence-packet.json",
    providerAuthExecutionAllowed: false,
    persistedSessionExecutionAllowed: false,
    routeIntegrationExecutionAllowed: false,
    providerSessionEvidenceRequired: true,
    sessionRevocationEvidenceRequired: true,
    auditPersistenceEvidenceRequired: true,
    crossTenantDenialEvidenceRequired: true,
    redactionRequired: true,
    requiredExternalEvidence: authSessionTenantGuardRequiredExternalEvidence,
    surfaceContract: authSessionTenantGuardSurfaceContract,
  };
}

export function buildAuthSessionTenantGuardRunData(
  input: AuthSessionTenantGuardRunRecordInput,
): AuthSessionTenantGuardRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha ?? null,
    status: input.status,
    commandMatrix: authSessionTenantGuardCommands,
    artifactManifest: input.capturedArtifacts,
    providerLoginLogoutProofCaptured: input.providerLoginLogoutProofCaptured,
    persistedSessionRevocationProofCaptured: input.persistedSessionRevocationProofCaptured,
    auditLogRedactionProofCaptured: input.auditLogRedactionProofCaptured,
    crossTenantDenialProofCaptured: input.crossTenantDenialProofCaptured,
    secretSafeReviewCaptured: input.secretSafeReviewCaptured,
    completedCommands: input.requiredCommandsRun,
    redactedSummary: {
      storesRawSessionTokens: false,
      storesRawProviderPayloads: false,
      providerSecretsRedacted: true,
    },
  };
}

export async function persistAuthSessionTenantGuardRun(
  repository: AuthSessionTenantGuardRunRepository,
  input: AuthSessionTenantGuardRunRecordInput,
): Promise<unknown> {
  const data = buildAuthSessionTenantGuardRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.authSessionTenantGuardRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

export function buildAuthSessionTenantGuardEvidenceDecision(
  input: AuthSessionTenantGuardEvidenceInput,
): AuthSessionTenantGuardEvidenceDecision {
  const blockers = [
    !input.authPackageTestsPassed && "Run @inkroute/auth test/typecheck contract commands.",
    !input.dashboardMiddlewareProofCaptured && "Capture dashboard middleware session-cookie and CSRF enforcement proof.",
    !input.dashboardRouteGuardProofCaptured && "Capture dashboard tenant actor and no-store route guard proof.",
    !input.mobileGuardProofCaptured && "Capture mobile tenant-isolation and auth surface proof.",
    !input.providerLoginLogoutProofCaptured && "Capture provider-backed login/logout integration proof.",
    !input.persistedSessionRevocationProofCaptured && "Capture persisted TenantMember/session/revocation lookup proof.",
    !input.auditLogRedactionProofCaptured && "Capture redacted auth AuditLog persistence proof.",
    !input.crossTenantDenialProofCaptured && "Capture cross-tenant dashboard/API/mobile denial proof.",
    !input.externalEvidencePacketCaptured && "Capture auth/session external evidence packet.",
  ].filter(Boolean) as string[];

  const missingArtifacts = authSessionTenantGuardArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );

  const missingCommands = authSessionTenantGuardCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: authSessionTenantGuardCommands,
    requiredEvidence: authSessionTenantGuardArtifactPaths,
    redactedSummary: {
      storesRawSessionTokens: false,
      storesRawProviderPayloads: false,
      providerSecretsRedacted: true,
    },
  };
}

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

export function buildAuthGuardAuditLogPlan(input: {
  tenantId: string;
  actorUserId: string;
  routePath: string;
  decision: "allow" | "deny" | "csrf_failed" | "revoked";
  source: "dashboard" | "mobile" | "api";
}) {
  return {
    entityType: "AuthGuardDecision",
    action: `auth_guard:${input.decision}`,
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    routePath: input.routePath,
    source: input.source,
    metadata: {
      decision: input.decision,
      redactedFields: ["sessionToken", "csrfToken", "providerAccessToken", "providerRefreshToken"],
      rawSessionStored: false,
      rawProviderPayloadStored: false,
      artifact: "coverage/auth-audit-log-redacted.json",
    },
  };
}

export const authGuardAuditLogPlan = buildAuthGuardAuditLogPlan({
  tenantId: "inkroute-demo",
  actorUserId: "dashboard-demo-user",
  routePath: "/api/security/trust-status",
  decision: "allow",
  source: "dashboard",
});

export function buildAuthSessionTenantGuardCoverageContract() {
  return buildAuthSessionTenantGuardRuntimeReadinessPlan({
    packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
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
    auditLogWritesConfigured: true,
    providerBackedRouteTestsPassed: false,
    crossTenantIntegrationTestsPassed: false,
  });
}

export const authSessionTenantGuardCoverageContract = buildAuthSessionTenantGuardCoverageContract();

