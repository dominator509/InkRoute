import { buildDomainAuthorizationRouteEvidencePlan } from "@inkroute/auth";

export type DomainAuthorizationRuntimeStatus =
  | "wired"
  | "session-gated"
  | "route-guard-gated"
  | "role-matrix-gated"
  | "audit-gated"
  | "csrf-revocation-gated"
  | "ci-gated";

export interface DomainAuthorizationRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DomainAuthorizationRuntimeStatus;
}


export interface DomainAuthorizationRunPersistenceContract {
  readonly prismaModel: "DomainAuthorizationRun";
  readonly tenantRelation: "domainAuthorizationRuns";
  readonly migration: "20260609034500_add_domain_authorization_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesReadinessStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesProviderSessionEvidence: true;
  readonly storesCustomRoleEvidence: true;
  readonly storesRouteGuardEvidence: true;
  readonly storesRoleMatrixEvidence: true;
  readonly storesFieldRedactionEvidence: true;
  readonly storesAuditLogEvidence: true;
  readonly storesCsrfRevocationEvidence: true;
  readonly storesCiEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export const domainAuthorizationRunPersistenceContract = {
  prismaModel: "DomainAuthorizationRun",
  tenantRelation: "domainAuthorizationRuns",
  migration: "20260609034500_add_domain_authorization_runs",
  storesRunId: true,
  storesCommitSha: true,
  storesReadinessStatus: true,
  storesCommandMatrix: true,
  storesArtifactManifest: true,
  storesProviderSessionEvidence: true,
  storesCustomRoleEvidence: true,
  storesRouteGuardEvidence: true,
  storesRoleMatrixEvidence: true,
  storesFieldRedactionEvidence: true,
  storesAuditLogEvidence: true,
  storesCsrfRevocationEvidence: true,
  storesCiEvidence: true,
  storesSecretSafeArtifacts: true,
} as const satisfies DomainAuthorizationRunPersistenceContract;

export const domainAuthorizationRuntimeCommands = [
  "pnpm --filter @inkroute/auth typecheck",
  "pnpm --filter @inkroute/auth test",
  "dashboard middleware route-guard contract tests",
  "dashboard/API/server-action role matrix tests",
  "CustomRole database loading route tests",
  "cross-tenant route denial tests",
  "field redaction route serialization tests",
  "authorization AuditLog persistence tests",
  "CSRF-bound mutating route tests",
  "session revocation route tests",
  "GitHub Actions domain authorization evidence job",
] as const;

export const domainAuthorizationArtifactPaths = [
  "coverage/domain-authorization-runtime.json",
  "coverage/domain-authorization-auth-typecheck.txt",
  "coverage/domain-authorization-auth-test.txt",
  "coverage/domain-authorization-provider-session-redacted.json",
  "coverage/domain-authorization-custom-role-db-redacted.json",
  "coverage/domain-authorization-dashboard-middleware.json",
  "coverage/domain-authorization-api-route-guards.json",
  "coverage/domain-authorization-server-action-guards.json",
  "coverage/domain-authorization-role-matrix.json",
  "coverage/domain-authorization-custom-role-routes.json",
  "coverage/domain-authorization-cross-tenant-denial.json",
  "coverage/domain-authorization-field-redaction.json",
  "coverage/domain-authorization-audit-rows-redacted.json",
  "coverage/domain-authorization-csrf-session-binding.json",
  "coverage/domain-authorization-session-revocation.json",
  "coverage/domain-authorization-ci-evidence.json",
  "coverage/domain-authorization-secret-safe-artifacts.json",
  "test-results/domain-authorization-runtime",
] as const;

export const domainAuthorizationRuntimeMatrix = [
  {
    id: "auth-package-gates",
    command: "pnpm --filter @inkroute/auth typecheck && pnpm --filter @inkroute/auth test",
    artifact: "coverage/domain-authorization-auth-test.txt",
    status: "wired",
  },
  {
    id: "provider-backed-session-context",
    command: "provider-backed session tests for guarded route context",
    artifact: "coverage/domain-authorization-provider-session-redacted.json",
    status: "session-gated",
  },
  {
    id: "custom-role-db-loading",
    command: "CustomRole database loading route tests",
    artifact: "coverage/domain-authorization-custom-role-db-redacted.json",
    status: "route-guard-gated",
  },
  {
    id: "dashboard-api-server-action-guards",
    command: "dashboard middleware route-guard contract tests && dashboard/API/server-action role matrix tests",
    artifact: "coverage/domain-authorization-dashboard-middleware.json",
    status: "route-guard-gated",
  },
  {
    id: "role-matrix-custom-role-cross-tenant",
    command: "built-in role matrix, custom-role, and cross-tenant route denial tests",
    artifact: "coverage/domain-authorization-role-matrix.json",
    status: "role-matrix-gated",
  },
  {
    id: "field-redaction-audit-rows",
    command: "field redaction route serialization tests && authorization AuditLog persistence tests",
    artifact: "coverage/domain-authorization-field-redaction.json",
    status: "audit-gated",
  },
  {
    id: "csrf-session-revocation",
    command: "CSRF-bound mutating route tests && session revocation route tests",
    artifact: "coverage/domain-authorization-csrf-session-binding.json",
    status: "csrf-revocation-gated",
  },
  {
    id: "ci-secret-safe-artifacts",
    command: "GitHub Actions domain authorization evidence job",
    artifact: "coverage/domain-authorization-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly DomainAuthorizationRuntimeMatrixEntry[];

export const domainAuthorizationRuntimeReadiness = buildDomainAuthorizationRouteEvidencePlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  authTestsPassed: false,
  authTypecheckPassed: false,
  customRolesLoadedFromDatabase: false,
  dashboardMiddlewareUsesRouteGuard: false,
  apiMiddlewareUsesRouteGuard: false,
  serverActionsUseRouteGuard: false,
  routeRoleMatrixTestsPassed: false,
  customRoleRouteTestsPassed: false,
  crossTenantDenialTestsPassed: false,
  fieldRedactionRouteTestsPassed: false,
  authorizationAuditRowsPersisted: false,
  csrfSessionBindingTestsPassed: false,
  sessionRevocationTestsPassed: false,
  providerBackedSessionTestsPassed: false,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});
