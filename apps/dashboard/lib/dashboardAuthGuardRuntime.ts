import {
  buildDashboardAuthGuardEvidencePlan,
  dashboardAuthGuardRequiredControls,
} from "@inkroute/auth";

export { dashboardAuthGuardRequiredControls as dashboardAuthGuardRuntimeRequiredControls };

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

export const dashboardAuthGuardRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "apps/dashboard/lib/dashboardAuthGuardRuntime.ts",
  "apps/dashboard/tests/dashboard-auth-guard-runtime-static.test.ts",
  "packages/auth/package.json",
  "packages/auth/src/index.ts",
  "packages/auth/tests/authorization.test.ts",
  "apps/dashboard/app/layout.tsx",
  "apps/dashboard/app/api/dashboardAuth.ts",
  "apps/dashboard/middleware.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
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

export const dashboardAuthGuardEvidenceFlags = [
  "authTestsPassed",
  "authTypecheckPassed",
  "dashboardTypecheckPassed",
  "dashboardBuildPassed",
  "authProviderSessionsConfigured",
  "dashboardMiddlewareEnforcesGuard",
  "protectedLayoutEnforcesGuard",
  "dashboardApiHelpersEnforceGuard",
  "tenantMembershipDbLookupConfigured",
  "customRoleDbLookupConfigured",
  "unauthorizedStatesImplemented",
  "authAuditLogsPersisted",
  "browserLoginLogoutPassed",
  "browserTenantSwitchPassed",
  "browserCrossTenantDenialPassed",
  "noStoreCacheVerified",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type DashboardAuthGuardEvidenceFlag = (typeof dashboardAuthGuardEvidenceFlags)[number];

export interface DashboardAuthGuardEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly readinessAreas?: readonly string[];
  readonly evidence?: Partial<Record<DashboardAuthGuardEvidenceFlag, boolean>>;
}

export interface DashboardAuthGuardEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingReadinessAreas: readonly string[];
  readonly missingEvidence: readonly DashboardAuthGuardEvidenceFlag[];
  readonly requiredCommands: typeof dashboardAuthGuardRuntimeCommands;
  readonly requiredArtifacts: typeof dashboardAuthGuardArtifactPaths;
  readonly requiredReadinessAreas: readonly string[];
  readonly requiredEvidence: typeof dashboardAuthGuardEvidenceFlags;
  readonly blockers: readonly string[];
}

const dashboardAuthGuardEvidenceBlockers: Record<DashboardAuthGuardEvidenceFlag, string> = {
  authTestsPassed: "Auth package tests must pass.",
  authTypecheckPassed: "Auth package typecheck must pass.",
  dashboardTypecheckPassed: "Dashboard typecheck must pass.",
  dashboardBuildPassed: "Dashboard build must pass.",
  authProviderSessionsConfigured: "Real auth provider sessions must be configured for dashboard guard tests.",
  dashboardMiddlewareEnforcesGuard: "Dashboard middleware must enforce the shared route guard.",
  protectedLayoutEnforcesGuard: "Protected dashboard layout must enforce the shared route guard.",
  dashboardApiHelpersEnforceGuard: "Dashboard API helpers must enforce the shared route guard.",
  tenantMembershipDbLookupConfigured: "TenantMember lookup must resolve from persisted server state.",
  customRoleDbLookupConfigured: "CustomRole lookup must resolve from persisted server state.",
  unauthorizedStatesImplemented: "Unauthorized, login, tenant-switch, and forbidden denial state evidence must be captured before auth guard readiness.",
  authAuditLogsPersisted: "Auth AuditLog persistence tests must pass.",
  browserLoginLogoutPassed: "Browser login/logout smoke must pass.",
  browserTenantSwitchPassed: "Browser tenant-switch smoke must pass.",
  browserCrossTenantDenialPassed: "Browser cross-tenant denial evidence must prove private tenant data is not exposed.",
  noStoreCacheVerified: "Dashboard guard responses must verify no-store cache policy.",
  ciEvidenceCaptured: "CI dashboard auth guard evidence must be captured.",
  secretSafeArtifactsCaptured:
    "Dashboard auth artifacts must be redacted and free of secrets, provider tokens, raw PII, medical, payment, and private tenant data.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export const buildDashboardAuthGuardEvidenceDecision = (
  input: DashboardAuthGuardEvidenceInput,
): DashboardAuthGuardEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, dashboardAuthGuardRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, dashboardAuthGuardArtifactPaths);
  const missingReadinessAreas = missingFrom(input.readinessAreas, dashboardAuthGuardReadinessAreas);
  const missingEvidence = dashboardAuthGuardEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => dashboardAuthGuardEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 &&
      missingArtifacts.length === 0 &&
      missingReadinessAreas.length === 0 &&
      missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingReadinessAreas,
    missingEvidence,
    requiredCommands: dashboardAuthGuardRuntimeCommands,
    requiredArtifacts: dashboardAuthGuardArtifactPaths,
    requiredReadinessAreas: dashboardAuthGuardReadinessAreas,
    requiredEvidence: dashboardAuthGuardEvidenceFlags,
    blockers,
  };
};

export interface DashboardAuthGuardExecutionPolicy {
  readonly codexMayClassifyStaticAuthGuardReadiness: true;
  readonly providerSessionRequiredForClosure: true;
  readonly persistedTenantMemberAndCustomRoleRequiredForClosure: true;
  readonly browserLoginTenantSwitchAndDenialRequiredForClosure: true;
  readonly authAuditLogPersistenceRequiredForClosure: true;
  readonly noStorePolicyRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface DashboardAuthGuardExecutionPlan {
  readonly localCommands: typeof dashboardAuthGuardLocalCommands;
  readonly externalCommands: typeof dashboardAuthGuardExternalCommands;
  readonly requiredExternalEvidence: typeof dashboardAuthGuardRequiredExternalEvidence;
  readonly commandExecutionAllowed: false;
  readonly authProviderExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly browserExecutionAllowed: false;
  readonly auditPersistenceExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly executionPolicy: typeof dashboardAuthGuardExecutionPolicy;
}

export interface DashboardAuthGuardArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof dashboardAuthGuardRequiredExternalEvidence;
  readonly secretSafe: boolean;
}

export const dashboardAuthGuardRequiredExternalEvidence = [
  "provider-backed dashboard session evidence",
  "persisted TenantMember lookup evidence",
  "persisted CustomRole lookup evidence",
  "browser dashboard login/logout smoke",
  "browser dashboard tenant-switch smoke",
  "browser dashboard cross-tenant denial smoke",
  "auth AuditLog persistence evidence",
  "dashboard typecheck and build evidence",
  "fresh CI dashboard auth guard evidence",
  "secret-safe dashboard auth artifact review",
] as const;

export const dashboardAuthGuardExecutionPolicy: DashboardAuthGuardExecutionPolicy = {
  codexMayClassifyStaticAuthGuardReadiness: true,
  providerSessionRequiredForClosure: true,
  persistedTenantMemberAndCustomRoleRequiredForClosure: true,
  browserLoginTenantSwitchAndDenialRequiredForClosure: true,
  authAuditLogPersistenceRequiredForClosure: true,
  noStorePolicyRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
};

export const dashboardAuthGuardLocalCommands = [
  "pnpm --filter @inkroute/auth typecheck",
  "pnpm --filter @inkroute/auth test",
  "static dashboard middleware guard review",
  "static protected layout guard review",
  "static dashboard API helper no-store review",
] as const;

export const dashboardAuthGuardExternalCommands = [
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

export const buildDashboardAuthGuardExecutionPlan = (): DashboardAuthGuardExecutionPlan => ({
  localCommands: dashboardAuthGuardLocalCommands,
  externalCommands: dashboardAuthGuardExternalCommands,
  requiredExternalEvidence: dashboardAuthGuardRequiredExternalEvidence,
  commandExecutionAllowed: false,
  authProviderExecutionAllowed: false,
  databaseExecutionAllowed: false,
  browserExecutionAllowed: false,
  auditPersistenceExecutionAllowed: false,
  ciExecutionAllowed: false,
  executionPolicy: dashboardAuthGuardExecutionPolicy,
});

const dashboardAuthGuardSensitiveArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|cookie|email|phone|role|member|auth|audit|medical|payment|header|authorization|crossTenant|login|logout)/i;

export const buildRedactedDashboardAuthGuardArtifact = (
  artifact: unknown,
): Pick<DashboardAuthGuardArtifactReview, "artifact" | "redactions"> => {
  const redactions: string[] = [];

  const redact = (value: unknown, path: string): unknown => {
    if (Array.isArray(value)) {
      return value.map((item, index) => redact(item, `${path}[${index}]`));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
          const entryPath = path ? `${path}.${key}` : key;

          if (dashboardAuthGuardSensitiveArtifactKeyPattern.test(key)) {
            redactions.push(entryPath);
            return [key, "[REDACTED_DASHBOARD_AUTH_PRIVATE_VALUE]"];
          }

          return [key, redact(entry, entryPath)];
        }),
      );
    }

    return value;
  };

  return {
    artifact: redact(artifact, ""),
    redactions,
  };
};

export const buildDashboardAuthGuardArtifactReview = (
  artifact: unknown,
): DashboardAuthGuardArtifactReview => {
  const redacted = buildRedactedDashboardAuthGuardArtifact(artifact);
  const serialized = JSON.stringify(redacted.artifact);
  const leakedPrivateMarkers = [
    "client@example.com",
    "tenant.example.com",
    "session_",
    "provider-token",
    "authorization:",
    "sk_",
    "private-tenant",
  ].some((marker) => serialized.includes(marker));

  return {
    ...redacted,
    requiredExternalEvidence: dashboardAuthGuardRequiredExternalEvidence,
    secretSafe: !leakedPrivateMarkers,
  };
};



