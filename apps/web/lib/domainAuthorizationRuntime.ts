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

export interface DomainAuthorizationAuditSignatureContract {
  readonly algorithm: "HMAC-SHA256-or-provider-KMS-signature";
  readonly signatureInput: readonly [
    "tenantId",
    "actorIdHash",
    "routePath",
    "permission",
    "decision",
    "requestId",
    "createdAt",
  ];
  readonly signatureOutput: "auditSignature";
  readonly keyPolicy: "SIGNING_KEY_ID required; missing or invalid signing keys fail closed before closure.";
  readonly redactionPolicy: "Hash actor/client identifiers, omit raw provider tokens, and redact PII before signing artifacts.";
  readonly rawProviderTokenLoggingAllowed: false;
}

export const domainAuthorizationAuditSignatureContract = {
  algorithm: "HMAC-SHA256-or-provider-KMS-signature",
  signatureInput: ["tenantId", "actorIdHash", "routePath", "permission", "decision", "requestId", "createdAt"],
  signatureOutput: "auditSignature",
  keyPolicy: "SIGNING_KEY_ID required; missing or invalid signing keys fail closed before closure.",
  redactionPolicy: "Hash actor/client identifiers, omit raw provider tokens, and redact PII before signing artifacts.",
  rawProviderTokenLoggingAllowed: false,
} as const satisfies DomainAuthorizationAuditSignatureContract;

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

export interface DomainAuthorizationRunRecordInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: DomainAuthorizationEvidenceDecision["status"];
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly providerSessionEvidenceCaptured: boolean;
  readonly customRoleEvidenceCaptured: boolean;
  readonly routeGuardEvidenceCaptured: boolean;
  readonly roleMatrixEvidenceCaptured: boolean;
  readonly fieldRedactionEvidenceCaptured: boolean;
  readonly auditLogEvidenceCaptured: boolean;
  readonly csrfRevocationEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly routeGuardReportPath?: string | null;
  readonly auditLogReportPath?: string | null;
}

export interface DomainAuthorizationRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: DomainAuthorizationEvidenceDecision["status"];
  readonly commandMatrix: readonly string[];
  readonly artifactManifest: readonly string[];
  readonly providerSessionEvidenceCaptured: boolean;
  readonly customRoleEvidenceCaptured: boolean;
  readonly routeGuardEvidenceCaptured: boolean;
  readonly roleMatrixEvidenceCaptured: boolean;
  readonly fieldRedactionEvidenceCaptured: boolean;
  readonly auditLogEvidenceCaptured: boolean;
  readonly csrfRevocationEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly routeGuardReportPath: string | null;
  readonly auditLogReportPath: string | null;
}

export interface DomainAuthorizationRunRepository {
  readonly domainAuthorizationRun: {
    readonly upsert: (args: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: DomainAuthorizationRunData;
      readonly update: Omit<DomainAuthorizationRunData, "tenantId" | "runId">;
    }) => Promise<unknown>;
  };
}

export function buildDomainAuthorizationRunData(
  input: DomainAuthorizationRunRecordInput,
): DomainAuthorizationRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha,
    status: input.status,
    commandMatrix: input.commands ?? domainAuthorizationRuntimeCommands,
    artifactManifest: input.artifacts ?? domainAuthorizationArtifactPaths,
    providerSessionEvidenceCaptured: input.providerSessionEvidenceCaptured,
    customRoleEvidenceCaptured: input.customRoleEvidenceCaptured,
    routeGuardEvidenceCaptured: input.routeGuardEvidenceCaptured,
    roleMatrixEvidenceCaptured: input.roleMatrixEvidenceCaptured,
    fieldRedactionEvidenceCaptured: input.fieldRedactionEvidenceCaptured,
    auditLogEvidenceCaptured: input.auditLogEvidenceCaptured,
    csrfRevocationEvidenceCaptured: input.csrfRevocationEvidenceCaptured,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    routeGuardReportPath: input.routeGuardReportPath ?? null,
    auditLogReportPath: input.auditLogReportPath ?? null,
  };
}

export async function persistDomainAuthorizationRun(
  repository: DomainAuthorizationRunRepository,
  input: DomainAuthorizationRunRecordInput,
): Promise<unknown> {
  const data = buildDomainAuthorizationRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.domainAuthorizationRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

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
  "coverage/domain-authorization-audit-signature-contract.json",
  "coverage/domain-authorization-csrf-session-binding.json",
  "coverage/domain-authorization-session-revocation.json",
  "coverage/domain-authorization-ci-evidence.json",
  "coverage/domain-authorization-secret-safe-artifacts.json",
  "coverage/domain-authorization-redacted-evidence-bundle.json",
  "test-results/domain-authorization-runtime",
] as const;

export const domainAuthorizationLocalArtifacts = [
  "coverage/domain-authorization-runtime.json",
  "coverage/domain-authorization-auth-typecheck.txt",
  "coverage/domain-authorization-auth-test.txt",
  "coverage/domain-authorization-dashboard-middleware.json",
] as const;

export const domainAuthorizationExternalArtifacts = [
  "coverage/domain-authorization-provider-session-redacted.json",
  "coverage/domain-authorization-custom-role-db-redacted.json",
  "coverage/domain-authorization-api-route-guards.json",
  "coverage/domain-authorization-server-action-guards.json",
  "coverage/domain-authorization-role-matrix.json",
  "coverage/domain-authorization-custom-role-routes.json",
  "coverage/domain-authorization-cross-tenant-denial.json",
  "coverage/domain-authorization-field-redaction.json",
  "coverage/domain-authorization-audit-rows-redacted.json",
  "coverage/domain-authorization-audit-signature-contract.json",
  "coverage/domain-authorization-csrf-session-binding.json",
  "coverage/domain-authorization-session-revocation.json",
  "coverage/domain-authorization-ci-evidence.json",
  "coverage/domain-authorization-secret-safe-artifacts.json",
  "coverage/domain-authorization-redacted-evidence-bundle.json",
  "test-results/domain-authorization-runtime",
  "provider-backed DomainAuthorizationRun persistence proof",
] as const;

export const domainAuthorizationRuntimeProofFiles = [
  "packages/auth/package.json",
  "packages/auth/src/index.ts",
  "packages/auth/tests/authorization.test.ts",
  "apps/dashboard/middleware.ts",
  "apps/dashboard/app/api/settings/route.ts",
  "apps/web/lib/domainAuthorizationRuntime.ts",
  "apps/web/tests/domain-authorization-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609034500_add_domain_authorization_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
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
  {
    id: "redacted-evidence-bundle",
    command: "retain redacted domain authorization evidence bundle",
    artifact: "coverage/domain-authorization-redacted-evidence-bundle.json",
    status: "ci-gated",
  },
] as const satisfies readonly DomainAuthorizationRuntimeMatrixEntry[];

export interface DomainAuthorizationSurfaceContractEntry {
  readonly surfaceId: string;
  readonly command: string;
  readonly artifact: string;
  readonly proofBoundary:
    | "provider-session"
    | "database-role"
    | "route-guard"
    | "role-matrix"
    | "field-redaction"
    | "signed-audit"
    | "csrf-revocation"
    | "ci-proof";
  readonly providerBackedEvidenceRequired: boolean;
  readonly redactedArtifactRequired: boolean;
}

export const domainAuthorizationSurfaceContract = [
  {
    surfaceId: "provider-backed-session-context",
    command: "provider-backed session tests for guarded route context",
    artifact: "coverage/domain-authorization-provider-session-redacted.json",
    proofBoundary: "provider-session",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "custom-role-db-loading",
    command: "CustomRole database loading route tests",
    artifact: "coverage/domain-authorization-custom-role-db-redacted.json",
    proofBoundary: "database-role",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "dashboard-api-server-action-guards",
    command: "dashboard middleware route-guard contract tests && dashboard/API/server-action role matrix tests",
    artifact: "coverage/domain-authorization-api-route-guards.json",
    proofBoundary: "route-guard",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: false,
  },
  {
    surfaceId: "role-matrix-custom-role-cross-tenant",
    command: "built-in role matrix, custom-role, and cross-tenant route denial tests",
    artifact: "coverage/domain-authorization-cross-tenant-denial.json",
    proofBoundary: "role-matrix",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: false,
  },
  {
    surfaceId: "field-redaction-audit-rows",
    command: "field redaction route serialization tests && authorization AuditLog persistence tests",
    artifact: "coverage/domain-authorization-audit-rows-redacted.json",
    proofBoundary: "field-redaction",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "signed-audit-log-rows",
    command: "authorization AuditLog persistence tests",
    artifact: "coverage/domain-authorization-audit-signature-contract.json",
    proofBoundary: "signed-audit",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "csrf-session-revocation",
    command: "CSRF-bound mutating route tests && session revocation route tests",
    artifact: "coverage/domain-authorization-csrf-session-binding.json",
    proofBoundary: "csrf-revocation",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: false,
  },
  {
    surfaceId: "ci-secret-safe-artifacts",
    command: "GitHub Actions domain authorization evidence job",
    artifact: "coverage/domain-authorization-secret-safe-artifacts.json",
    proofBoundary: "ci-proof",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
] as const satisfies readonly DomainAuthorizationSurfaceContractEntry[];

export const domainAuthorizationRuntimeControls = [
  "resolve-provider-session-tenant-member-custom-role-server-side-before-authorization",
  "apply-route-guards-before-dashboard-api-server-action-side-effects",
  "reject-invalid-permissions-inactive-roles-cross-tenant-roles-revoked-sessions-csrf-mismatches",
  "persist-redacted-audit-log-rows-for-allow-deny-decisions",
  "sign-redacted-audit-log-rows-before-persistence",
  "apply-field-authorization-before-private-data-serialization",
] as const;

export const domainAuthorizationEvidenceFlags = [
  "authTestsPassed",
  "authTypecheckPassed",
  "customRolesLoadedFromDatabase",
  "dashboardMiddlewareUsesRouteGuard",
  "apiMiddlewareUsesRouteGuard",
  "serverActionsUseRouteGuard",
  "routeRoleMatrixTestsPassed",
  "customRoleRouteTestsPassed",
  "crossTenantDenialTestsPassed",
  "fieldRedactionRouteTestsPassed",
  "authorizationAuditRowsPersisted",
  "authorizationAuditRowsSigned",
  "csrfSessionBindingTestsPassed",
  "sessionRevocationTestsPassed",
  "providerBackedSessionTestsPassed",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type DomainAuthorizationEvidenceFlag = (typeof domainAuthorizationEvidenceFlags)[number];

export interface DomainAuthorizationEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly controls?: readonly string[];
  readonly evidence?: Partial<Record<DomainAuthorizationEvidenceFlag, boolean>>;
}

export interface DomainAuthorizationEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingControls: readonly string[];
  readonly missingEvidence: readonly DomainAuthorizationEvidenceFlag[];
  readonly requiredCommands: typeof domainAuthorizationRuntimeCommands;
  readonly requiredArtifacts: typeof domainAuthorizationArtifactPaths;
  readonly requiredControls: typeof domainAuthorizationRuntimeControls;
  readonly requiredEvidence: typeof domainAuthorizationEvidenceFlags;
  readonly blockers: readonly string[];
}

export interface DomainAuthorizationExecutionPlan {
  readonly localCommands: typeof domainAuthorizationLocalCommands;
  readonly externalCommands: typeof domainAuthorizationExternalCommands;
  readonly localArtifacts: typeof domainAuthorizationLocalArtifacts;
  readonly externalArtifacts: typeof domainAuthorizationExternalArtifacts;
  readonly surfaceContract: typeof domainAuthorizationSurfaceContract;
  readonly commandExecutionAllowed: false;
  readonly providerSessionExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly routeWideExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly executionPolicy: typeof domainAuthorizationExecutionPolicy;
  readonly requiredExternalEvidence: typeof domainAuthorizationRequiredExternalEvidence;
  readonly auditSignatureContract: typeof domainAuthorizationAuditSignatureContract;
}

export interface DomainAuthorizationArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof domainAuthorizationRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export interface DomainAuthorizationRedactedEvidenceBundle {
  readonly status: "redacted-evidence-bundle-ready";
  readonly artifactPath: "coverage/domain-authorization-redacted-evidence-bundle.json";
  readonly review: DomainAuthorizationArtifactReview;
  readonly requiredArtifacts: typeof domainAuthorizationArtifactPaths;
  readonly requiredExternalEvidence: typeof domainAuthorizationRequiredExternalEvidence;
  readonly auditSignatureContract: typeof domainAuthorizationAuditSignatureContract;
  readonly providerExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
}

export const domainAuthorizationLocalCommands = [
  "pnpm --filter @inkroute/auth typecheck",
  "pnpm --filter @inkroute/auth test",
  "dashboard middleware route-guard contract tests",
] as const;

export const domainAuthorizationExternalCommands = [
  "dashboard/API/server-action role matrix tests",
  "CustomRole database loading route tests",
  "cross-tenant route denial tests",
  "field redaction route serialization tests",
  "authorization AuditLog persistence tests",
  "CSRF-bound mutating route tests",
  "session revocation route tests",
  "GitHub Actions domain authorization evidence job",
  "provider-backed persistDomainAuthorizationRun execution proof",
] as const;

const domainAuthorizationEvidenceBlockers: Record<DomainAuthorizationEvidenceFlag, string> = {
  authTestsPassed: "Auth package tests must pass.",
  authTypecheckPassed: "Auth package typecheck must pass.",
  customRolesLoadedFromDatabase: "CustomRole rows must be loaded from tenant-scoped database storage in guarded route tests.",
  dashboardMiddlewareUsesRouteGuard: "Dashboard middleware must use route guards before data loading.",
  apiMiddlewareUsesRouteGuard: "API routes must use route guards before side effects.",
  serverActionsUseRouteGuard: "Server actions must use route guards before side effects.",
  routeRoleMatrixTestsPassed: "Built-in role matrix route tests must pass.",
  customRoleRouteTestsPassed: "Custom-role route tests must pass.",
  crossTenantDenialTestsPassed: "Cross-tenant dashboard/API/server-action denial tests must pass.",
  fieldRedactionRouteTestsPassed: "Field-redaction serialization tests must pass.",
  authorizationAuditRowsPersisted: "Authorization AuditLog allow/deny rows must be persisted with redaction.",
  authorizationAuditRowsSigned: "Authorization AuditLog allow/deny rows must include signed redacted audit payload evidence.",
  csrfSessionBindingTestsPassed: "CSRF-bound mutating route tests must pass.",
  sessionRevocationTestsPassed: "Session revocation route tests must pass.",
  providerBackedSessionTestsPassed: "Provider-backed session route-context tests must pass.",
  ciEvidenceCaptured: "CI domain authorization route evidence must be captured.",
  secretSafeArtifactsCaptured: "Authorization route artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.",
};

export const domainAuthorizationExecutionPolicy = {
  codexMayClassifyStaticDomainAuthorizationReadiness: true,
  providerSessionEvidenceRequiredForClosure: true,
  databaseRoleEvidenceRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const;

export const domainAuthorizationRequiredExternalEvidence = [
  "Provider-backed session context evidence for guarded routes.",
  "Tenant-scoped TenantMember and CustomRole database loading evidence.",
  "Dashboard, API, and server-action route-guard adoption evidence before side effects.",
  "Built-in role, custom-role, cross-tenant denial, CSRF binding, and session revocation route tests.",
  "Field-redaction serialization and redacted authorization AuditLog persistence evidence.",
  "Signed redacted authorization AuditLog payload evidence with signing-key readiness metadata.",
  "Provider-backed DomainAuthorizationRun persistence row captured through persistDomainAuthorizationRun.",
  "CI evidence and secret-safe authorization route artifacts.",
  "Redacted domain authorization evidence bundle captured with signed-audit contract metadata and without raw provider tokens, tenant identifiers, role IDs, route payloads, URLs, or actor identifiers.",
] as const;

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

const sensitiveDomainAuthorizationKeyPattern =
  /(token|secret|password|authorization|cookie|csrf|session|email|phone|name|address|medical|payment|tenant|member|role|permission|user|actor|client|database|url|uri|dsn|key|id|payload|artifact|audit|repository|repo|branch|pull|pr|reviewer|codeowner)/iu;
const sensitiveDomainAuthorizationValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|repo:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|branch:[A-Za-z0-9_./-]+|pr[_:#-]?[A-Za-z0-9_.-]+|reviewer[_:@-]?[A-Za-z0-9_.-]+|CODEOWNER:[A-Za-z0-9_.@/-]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|[A-Za-z0-9_-]{24,})/giu;

const buildRedactedDomainAuthorizationValue = (value: unknown, path: string, redactions: string[]): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => buildRedactedDomainAuthorizationValue(entry, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveDomainAuthorizationKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedDomainAuthorizationValue(entry, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redacted = value.replace(sensitiveDomainAuthorizationValuePattern, "[REDACTED]");
    if (redacted !== value) {
      redactions.push(path || "$");
    }
    return redacted;
  }

  return value;
};

export function buildDomainAuthorizationExecutionPlan(): DomainAuthorizationExecutionPlan {
  return {
    localCommands: domainAuthorizationLocalCommands,
    externalCommands: domainAuthorizationExternalCommands,
    localArtifacts: domainAuthorizationLocalArtifacts,
    externalArtifacts: domainAuthorizationExternalArtifacts,
    surfaceContract: domainAuthorizationSurfaceContract,
    commandExecutionAllowed: false,
    providerSessionExecutionAllowed: false,
    databaseExecutionAllowed: false,
    routeWideExecutionAllowed: false,
    ciExecutionAllowed: false,
    executionPolicy: domainAuthorizationExecutionPolicy,
    requiredExternalEvidence: domainAuthorizationRequiredExternalEvidence,
    auditSignatureContract: domainAuthorizationAuditSignatureContract,
  };
}

export function buildRedactedDomainAuthorizationArtifact(artifact: unknown): unknown {
  return buildRedactedDomainAuthorizationValue(artifact, "", []);
}

export function buildDomainAuthorizationArtifactReview(artifact: unknown): DomainAuthorizationArtifactReview {
  const redactions: string[] = [];
  return {
    artifact: buildRedactedDomainAuthorizationValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: domainAuthorizationRequiredExternalEvidence,
    safeForTracker: true,
  };
}

export function buildDomainAuthorizationRedactedEvidenceBundle(
  artifact: unknown,
): DomainAuthorizationRedactedEvidenceBundle {
  return {
    status: "redacted-evidence-bundle-ready",
    artifactPath: "coverage/domain-authorization-redacted-evidence-bundle.json",
    review: buildDomainAuthorizationArtifactReview(artifact),
    requiredArtifacts: domainAuthorizationArtifactPaths,
    requiredExternalEvidence: domainAuthorizationRequiredExternalEvidence,
    auditSignatureContract: domainAuthorizationAuditSignatureContract,
    providerExecutionAllowed: false,
    databaseExecutionAllowed: false,
  };
}

export const buildDomainAuthorizationEvidenceDecision = (
  input: DomainAuthorizationEvidenceInput,
): DomainAuthorizationEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, domainAuthorizationRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, domainAuthorizationArtifactPaths);
  const missingControls = missingFrom(input.controls, domainAuthorizationRuntimeControls);
  const missingEvidence = domainAuthorizationEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => domainAuthorizationEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 &&
      missingArtifacts.length === 0 &&
      missingControls.length === 0 &&
      missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingControls,
    missingEvidence,
    requiredCommands: domainAuthorizationRuntimeCommands,
    requiredArtifacts: domainAuthorizationArtifactPaths,
    requiredControls: domainAuthorizationRuntimeControls,
    requiredEvidence: domainAuthorizationEvidenceFlags,
    blockers,
  };
};

const routeReadiness = buildDomainAuthorizationRouteEvidencePlan({
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
  authorizationAuditRowsSigned: false,
  csrfSessionBindingTestsPassed: false,
  sessionRevocationTestsPassed: false,
  providerBackedSessionTestsPassed: false,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});

export const domainAuthorizationRuntimeReadiness = {
  ...routeReadiness,
  missingScripts: [],
  requiredCommands: domainAuthorizationRuntimeCommands,
  requiredEvidence: domainAuthorizationEvidenceFlags,
  requiredControls: domainAuthorizationRuntimeControls,
} satisfies DomainAuthorizationEvidenceDecision & { missingScripts: readonly string[] };



