import { buildDashboardLaunchEvidencePlan } from "@inkroute/auth";

export type DashboardLaunchRuntimeStatus =
  | "wired"
  | "build-gated"
  | "auth-gated"
  | "persistence-gated"
  | "rbac-gated"
  | "ci-gated";

export interface DashboardLaunchRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DashboardLaunchRuntimeStatus;
}

export interface DashboardLaunchRunPersistenceContract {
  readonly model: "DashboardLaunchRun";
  readonly tenantRelation: "dashboardLaunchRuns";
  readonly migration: "20260609033100_add_dashboard_launch_runs";
  readonly jsonFields: readonly [
    "commandMatrix",
    "controlManifest",
    "artifactManifest",
    "tenantApiManifest",
    "launchStateManifest",
  ];
  readonly evidenceBooleans: readonly [
    "dashboardTypecheckPassed",
    "dashboardBuildPassed",
    "dashboardUnitTestsPassed",
    "dashboardPlaywrightSmokePassed",
    "seededTenantDataAvailable",
    "providerBackedAuthConfigured",
    "tenantScopedApisImplemented",
    "prismaRepositoriesImplemented",
    "realMutationsEnabled",
    "mutationAuditLogsPersisted",
    "providerActionsImplemented",
    "rbacDenialTestsPassed",
    "crossTenantDenialTestsPassed",
    "fieldRedactionVerified",
    "loadingEmptyErrorStatesVerified",
    "ciEvidenceCaptured",
    "dashboardArtifactsSecretSafe",
  ];
  readonly artifactFields: readonly [
    "dashboardTypecheckArtifactPath",
    "dashboardBuildArtifactPath",
    "dashboardTestArtifactPath",
    "playwrightSmokeArtifactPath",
    "seededTenantDataArtifactPath",
    "providerAuthSmokeArtifactPath",
    "tenantScopedApisArtifactPath",
    "prismaRepositoriesArtifactPath",
    "mutationAuditLogArtifactPath",
    "rbacCrossTenantDenialArtifactPath",
    "fieldRedactionArtifactPath",
    "launchStatesArtifactPath",
    "ciEvidenceArtifactPath",
    "secretSafeArtifactsPath",
    "ciRunUrl",
  ];
}

export const dashboardLaunchRunPersistenceContract: DashboardLaunchRunPersistenceContract = {
  model: "DashboardLaunchRun",
  tenantRelation: "dashboardLaunchRuns",
  migration: "20260609033100_add_dashboard_launch_runs",
  jsonFields: [
    "commandMatrix",
    "controlManifest",
    "artifactManifest",
    "tenantApiManifest",
    "launchStateManifest",
  ],
  evidenceBooleans: [
    "dashboardTypecheckPassed",
    "dashboardBuildPassed",
    "dashboardUnitTestsPassed",
    "dashboardPlaywrightSmokePassed",
    "seededTenantDataAvailable",
    "providerBackedAuthConfigured",
    "tenantScopedApisImplemented",
    "prismaRepositoriesImplemented",
    "realMutationsEnabled",
    "mutationAuditLogsPersisted",
    "providerActionsImplemented",
    "rbacDenialTestsPassed",
    "crossTenantDenialTestsPassed",
    "fieldRedactionVerified",
    "loadingEmptyErrorStatesVerified",
    "ciEvidenceCaptured",
    "dashboardArtifactsSecretSafe",
  ],
  artifactFields: [
    "dashboardTypecheckArtifactPath",
    "dashboardBuildArtifactPath",
    "dashboardTestArtifactPath",
    "playwrightSmokeArtifactPath",
    "seededTenantDataArtifactPath",
    "providerAuthSmokeArtifactPath",
    "tenantScopedApisArtifactPath",
    "prismaRepositoriesArtifactPath",
    "mutationAuditLogArtifactPath",
    "rbacCrossTenantDenialArtifactPath",
    "fieldRedactionArtifactPath",
    "launchStatesArtifactPath",
    "ciEvidenceArtifactPath",
    "secretSafeArtifactsPath",
    "ciRunUrl",
  ],
};

export const dashboardLaunchRuntimeCommands = [
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm --filter @inkroute/dashboard build",
  "pnpm --filter @inkroute/dashboard test",
  "pnpm test:e2e --project=dashboard-chromium",
  "dashboard provider-backed auth smoke tests",
  "dashboard RBAC and cross-tenant denial tests",
  "dashboard mutation AuditLog persistence tests",
  "GitHub Actions dashboard launch evidence job",
] as const;

export const dashboardLaunchRuntimeLocalCommands = ["pnpm --filter @inkroute/dashboard typecheck"] as const;
export const dashboardLaunchRuntimeExternalCommands = [
  "pnpm --filter @inkroute/dashboard build",
  "pnpm --filter @inkroute/dashboard test",
  "pnpm test:e2e --project=dashboard-chromium",
  "dashboard provider-backed auth smoke tests",
  "dashboard RBAC and cross-tenant denial tests",
  "dashboard mutation AuditLog persistence tests",
  "GitHub Actions dashboard launch evidence job",
] as const;

export const dashboardLaunchRuntimeControls = [
  "provider-backed-session-and-tenant-membership",
  "tenant-scoped-repositories-or-authenticated-apis",
  "tenant-scoped-mutation-transactions-with-auditlog",
  "rbac-and-cross-tenant-denial",
  "private-field-redaction-before-serialization",
  "secret-safe-build-smoke-ci-artifacts",
] as const;

export const dashboardLaunchArtifactPaths = [
  "coverage/dashboard-launch-runtime.json",
  "coverage/dashboard-typecheck.txt",
  "coverage/dashboard-build.txt",
  "coverage/dashboard-test.txt",
  "coverage/dashboard-playwright-smoke.json",
  "coverage/dashboard-seeded-tenant-data.json",
  "coverage/dashboard-provider-auth-smoke.json",
  "coverage/dashboard-tenant-scoped-apis.json",
  "coverage/dashboard-prisma-repositories.json",
  "coverage/dashboard-mutation-auditlog.json",
  "coverage/dashboard-rbac-cross-tenant-denial.json",
  "coverage/dashboard-field-redaction.json",
  "coverage/dashboard-loading-empty-error-states.json",
  "coverage/dashboard-ci-evidence.json",
  "coverage/dashboard-secret-safe-artifacts.json",
  "test-results/dashboard-launch-runtime",
] as const;

export const dashboardLaunchRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "packages/auth/src/index.ts",
  "packages/auth/tests/authorization.test.ts",
  "apps/dashboard/middleware.ts",
  "apps/dashboard/app/api/bookings/[bookingId]/state/route.ts",
  "apps/dashboard/tests/payment-read-route-static.test.ts",
  "apps/web/lib/dashboardLaunchRuntime.ts",
  "apps/web/tests/dashboard-launch-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609033100_add_dashboard_launch_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export type DashboardLaunchRuntimeCommand = (typeof dashboardLaunchRuntimeCommands)[number];
export type DashboardLaunchRuntimeControl = (typeof dashboardLaunchRuntimeControls)[number];
export type DashboardLaunchArtifact = (typeof dashboardLaunchArtifactPaths)[number];

export interface DashboardLaunchSurfaceContractEntry {
  readonly surfaceId: string;
  readonly requiredControl: DashboardLaunchRuntimeControl;
  readonly requiredCommand: DashboardLaunchRuntimeCommand;
  readonly requiredArtifact: DashboardLaunchArtifact;
  readonly launchBoundary: "seeded-data" | "provider-auth" | "tenant-api" | "mutation-audit" | "rbac-denial" | "ui-state" | "ci-proof";
  readonly providerBackedEvidenceRequired: boolean;
  readonly redactedArtifactRequired: true;
}

export const dashboardLaunchSurfaceContract: readonly DashboardLaunchSurfaceContractEntry[] = [
  {
    surfaceId: "seeded-tenant-launch-data",
    requiredControl: "tenant-scoped-repositories-or-authenticated-apis",
    requiredCommand: "pnpm test:e2e --project=dashboard-chromium",
    requiredArtifact: "coverage/dashboard-seeded-tenant-data.json",
    launchBoundary: "seeded-data",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "provider-auth-session",
    requiredControl: "provider-backed-session-and-tenant-membership",
    requiredCommand: "dashboard provider-backed auth smoke tests",
    requiredArtifact: "coverage/dashboard-provider-auth-smoke.json",
    launchBoundary: "provider-auth",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "tenant-read-route-contracts",
    requiredControl: "tenant-scoped-repositories-or-authenticated-apis",
    requiredCommand: "pnpm --filter @inkroute/dashboard test",
    requiredArtifact: "coverage/dashboard-tenant-scoped-apis.json",
    launchBoundary: "tenant-api",
    providerBackedEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "mutation-auditlog-persistence",
    requiredControl: "tenant-scoped-mutation-transactions-with-auditlog",
    requiredCommand: "dashboard mutation AuditLog persistence tests",
    requiredArtifact: "coverage/dashboard-mutation-auditlog.json",
    launchBoundary: "mutation-audit",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "rbac-cross-tenant-denial",
    requiredControl: "rbac-and-cross-tenant-denial",
    requiredCommand: "dashboard RBAC and cross-tenant denial tests",
    requiredArtifact: "coverage/dashboard-rbac-cross-tenant-denial.json",
    launchBoundary: "rbac-denial",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "loading-empty-error-states",
    requiredControl: "private-field-redaction-before-serialization",
    requiredCommand: "pnpm --filter @inkroute/dashboard test",
    requiredArtifact: "coverage/dashboard-loading-empty-error-states.json",
    launchBoundary: "ui-state",
    providerBackedEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "ci-launch-artifact-retention",
    requiredControl: "secret-safe-build-smoke-ci-artifacts",
    requiredCommand: "GitHub Actions dashboard launch evidence job",
    requiredArtifact: "coverage/dashboard-ci-evidence.json",
    launchBoundary: "ci-proof",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
] as const;

export interface DashboardLaunchEvidenceInput {
  readonly dashboardTypecheckPassed: boolean;
  readonly dashboardBuildPassed: boolean;
  readonly dashboardUnitTestsPassed: boolean;
  readonly dashboardPlaywrightSmokePassed: boolean;
  readonly seededTenantDataAvailable: boolean;
  readonly providerBackedAuthConfigured: boolean;
  readonly tenantScopedApisImplemented: boolean;
  readonly prismaRepositoriesImplemented: boolean;
  readonly realMutationsEnabled: boolean;
  readonly mutationAuditLogsPersisted: boolean;
  readonly providerActionsImplemented: boolean;
  readonly rbacDenialTestsPassed: boolean;
  readonly crossTenantDenialTestsPassed: boolean;
  readonly fieldRedactionVerified: boolean;
  readonly loadingEmptyErrorStatesVerified: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly dashboardArtifactsSecretSafe: boolean;
  readonly dashboardLaunchRunPersisted: boolean;
  readonly coveredControls: readonly DashboardLaunchRuntimeControl[];
  readonly capturedArtifacts: readonly DashboardLaunchArtifact[];
  readonly completedCommands: readonly DashboardLaunchRuntimeCommand[];
}

export interface DashboardLaunchRunRecordInput extends DashboardLaunchEvidenceInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha?: string | null;
  readonly status: "complete" | "blocked";
  readonly dashboardTypecheckArtifactPath?: string | null;
  readonly dashboardBuildArtifactPath?: string | null;
  readonly dashboardTestArtifactPath?: string | null;
  readonly playwrightSmokeArtifactPath?: string | null;
  readonly seededTenantDataArtifactPath?: string | null;
  readonly providerAuthSmokeArtifactPath?: string | null;
  readonly tenantScopedApisArtifactPath?: string | null;
  readonly prismaRepositoriesArtifactPath?: string | null;
  readonly mutationAuditLogArtifactPath?: string | null;
  readonly rbacCrossTenantDenialArtifactPath?: string | null;
  readonly fieldRedactionArtifactPath?: string | null;
  readonly launchStatesArtifactPath?: string | null;
  readonly ciEvidenceArtifactPath?: string | null;
  readonly secretSafeArtifactsPath?: string | null;
  readonly ciRunUrl?: string | null;
}

export interface DashboardLaunchRunData
  extends Omit<
    DashboardLaunchRunRecordInput,
    "coveredControls" | "capturedArtifacts" | "completedCommands" | "dashboardLaunchRunPersisted"
  > {
  readonly commandMatrix: typeof dashboardLaunchRuntimeMatrix;
  readonly controlManifest: readonly DashboardLaunchRuntimeControl[];
  readonly artifactManifest: readonly DashboardLaunchArtifact[];
  readonly tenantApiManifest: {
    readonly tenantScopedApisImplemented: boolean;
    readonly prismaRepositoriesImplemented: boolean;
    readonly realMutationsEnabled: boolean;
    readonly mutationAuditLogsPersisted: boolean;
  };
  readonly launchStateManifest: {
    readonly seededTenantDataAvailable: boolean;
    readonly providerBackedAuthConfigured: boolean;
    readonly loadingEmptyErrorStatesVerified: boolean;
    readonly dashboardArtifactsSecretSafe: boolean;
  };
}

export interface DashboardLaunchRunRepository {
  readonly dashboardLaunchRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: DashboardLaunchRunData;
      update: Omit<DashboardLaunchRunData, "tenantId" | "runId">;
    }): Promise<unknown>;
  };
}

export interface DashboardLaunchEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingControls: readonly DashboardLaunchRuntimeControl[];
  readonly missingArtifacts: readonly DashboardLaunchArtifact[];
  readonly missingCommands: readonly DashboardLaunchRuntimeCommand[];
  readonly requiredControls: readonly DashboardLaunchRuntimeControl[];
  readonly requiredArtifacts: typeof dashboardLaunchArtifactPaths;
  readonly requiredCommands: typeof dashboardLaunchRuntimeCommands;
  readonly requiredEvidence: typeof dashboardLaunchRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface DashboardLaunchExecutionPlan {
  readonly localCommands: typeof dashboardLaunchRuntimeLocalCommands;
  readonly externalCommands: typeof dashboardLaunchRuntimeExternalCommands;
  readonly localArtifacts: typeof dashboardLaunchRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof dashboardLaunchRuntimeExternalArtifacts;
  readonly surfaceContract: typeof dashboardLaunchSurfaceContract;
  readonly dashboardTypecheckExecutionAllowed: false;
  readonly dashboardBuildExecutionAllowed: false;
  readonly dashboardTestExecutionAllowed: false;
  readonly playwrightSmokeExecutionAllowed: false;
  readonly providerAuthSmokeExecutionAllowed: false;
  readonly rbacTenantDenialExecutionAllowed: false;
  readonly mutationAuditLogExecutionAllowed: false;
  readonly ciLaunchEvidenceExecutionAllowed: false;
  readonly providerBackedPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof dashboardLaunchExecutionPolicy;
  readonly requiredExternalEvidence: typeof dashboardLaunchRequiredExternalEvidence;
}

export interface DashboardLaunchArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof dashboardLaunchRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export function buildDashboardLaunchRunData(input: DashboardLaunchRunRecordInput): DashboardLaunchRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha ?? null,
    status: input.status,
    commandMatrix: dashboardLaunchRuntimeMatrix,
    controlManifest: input.coveredControls,
    artifactManifest: input.capturedArtifacts,
    tenantApiManifest: {
      tenantScopedApisImplemented: input.tenantScopedApisImplemented,
      prismaRepositoriesImplemented: input.prismaRepositoriesImplemented,
      realMutationsEnabled: input.realMutationsEnabled,
      mutationAuditLogsPersisted: input.mutationAuditLogsPersisted,
    },
    launchStateManifest: {
      seededTenantDataAvailable: input.seededTenantDataAvailable,
      providerBackedAuthConfigured: input.providerBackedAuthConfigured,
      loadingEmptyErrorStatesVerified: input.loadingEmptyErrorStatesVerified,
      dashboardArtifactsSecretSafe: input.dashboardArtifactsSecretSafe,
    },
    dashboardTypecheckPassed: input.dashboardTypecheckPassed,
    dashboardBuildPassed: input.dashboardBuildPassed,
    dashboardUnitTestsPassed: input.dashboardUnitTestsPassed,
    dashboardPlaywrightSmokePassed: input.dashboardPlaywrightSmokePassed,
    seededTenantDataAvailable: input.seededTenantDataAvailable,
    providerBackedAuthConfigured: input.providerBackedAuthConfigured,
    tenantScopedApisImplemented: input.tenantScopedApisImplemented,
    prismaRepositoriesImplemented: input.prismaRepositoriesImplemented,
    realMutationsEnabled: input.realMutationsEnabled,
    mutationAuditLogsPersisted: input.mutationAuditLogsPersisted,
    providerActionsImplemented: input.providerActionsImplemented,
    rbacDenialTestsPassed: input.rbacDenialTestsPassed,
    crossTenantDenialTestsPassed: input.crossTenantDenialTestsPassed,
    fieldRedactionVerified: input.fieldRedactionVerified,
    loadingEmptyErrorStatesVerified: input.loadingEmptyErrorStatesVerified,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    dashboardArtifactsSecretSafe: input.dashboardArtifactsSecretSafe,
    dashboardTypecheckArtifactPath: input.dashboardTypecheckArtifactPath ?? null,
    dashboardBuildArtifactPath: input.dashboardBuildArtifactPath ?? null,
    dashboardTestArtifactPath: input.dashboardTestArtifactPath ?? null,
    playwrightSmokeArtifactPath: input.playwrightSmokeArtifactPath ?? null,
    seededTenantDataArtifactPath: input.seededTenantDataArtifactPath ?? null,
    providerAuthSmokeArtifactPath: input.providerAuthSmokeArtifactPath ?? null,
    tenantScopedApisArtifactPath: input.tenantScopedApisArtifactPath ?? null,
    prismaRepositoriesArtifactPath: input.prismaRepositoriesArtifactPath ?? null,
    mutationAuditLogArtifactPath: input.mutationAuditLogArtifactPath ?? null,
    rbacCrossTenantDenialArtifactPath: input.rbacCrossTenantDenialArtifactPath ?? null,
    fieldRedactionArtifactPath: input.fieldRedactionArtifactPath ?? null,
    launchStatesArtifactPath: input.launchStatesArtifactPath ?? null,
    ciEvidenceArtifactPath: input.ciEvidenceArtifactPath ?? null,
    secretSafeArtifactsPath: input.secretSafeArtifactsPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export async function persistDashboardLaunchRun(
  repository: DashboardLaunchRunRepository,
  input: DashboardLaunchRunRecordInput,
): Promise<unknown> {
  const data = buildDashboardLaunchRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.dashboardLaunchRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

export const dashboardLaunchRuntimeMatrix = [
  {
    id: "dashboard-typecheck",
    command: "pnpm --filter @inkroute/dashboard typecheck",
    artifact: "coverage/dashboard-typecheck.txt",
    status: "build-gated",
  },
  {
    id: "dashboard-build",
    command: "pnpm --filter @inkroute/dashboard build",
    artifact: "coverage/dashboard-build.txt",
    status: "build-gated",
  },
  {
    id: "dashboard-tests",
    command: "pnpm --filter @inkroute/dashboard test",
    artifact: "coverage/dashboard-test.txt",
    status: "wired",
  },
  {
    id: "dashboard-playwright-smoke",
    command: "pnpm test:e2e --project=dashboard-chromium",
    artifact: "coverage/dashboard-playwright-smoke.json",
    status: "ci-gated",
  },
  {
    id: "seeded-tenant-data",
    command: "verify seeded tenant data for dashboard smoke and mutation tests",
    artifact: "coverage/dashboard-seeded-tenant-data.json",
    status: "persistence-gated",
  },
  {
    id: "provider-backed-auth",
    command: "dashboard provider-backed auth smoke tests",
    artifact: "coverage/dashboard-provider-auth-smoke.json",
    status: "auth-gated",
  },
  {
    id: "tenant-scoped-apis-repositories",
    command: "verify tenant-scoped dashboard APIs and Prisma repositories",
    artifact: "coverage/dashboard-tenant-scoped-apis.json",
    status: "persistence-gated",
  },
  {
    id: "real-mutations-auditlog",
    command: "dashboard mutation AuditLog persistence tests",
    artifact: "coverage/dashboard-mutation-auditlog.json",
    status: "persistence-gated",
  },
  {
    id: "rbac-cross-tenant-denial",
    command: "dashboard RBAC and cross-tenant denial tests",
    artifact: "coverage/dashboard-rbac-cross-tenant-denial.json",
    status: "rbac-gated",
  },
  {
    id: "field-redaction",
    command: "verify dashboard private field redaction before serialization",
    artifact: "coverage/dashboard-field-redaction.json",
    status: "rbac-gated",
  },
  {
    id: "loading-empty-error-states",
    command: "verify loading, empty, and error states for launch-critical surfaces",
    artifact: "coverage/dashboard-loading-empty-error-states.json",
    status: "wired",
  },
  {
    id: "ci-secret-safe-artifacts",
    command: "GitHub Actions dashboard launch evidence job",
    artifact: "coverage/dashboard-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly DashboardLaunchRuntimeMatrixEntry[];

export const dashboardLaunchRuntimeReadiness = buildDashboardLaunchEvidencePlan({
  packageScripts: {
    typecheck: "next typegen && tsc --noEmit",
    build: "next build",
    test: "vitest run",
  },
  dashboardTypecheckPassed: false,
  dashboardBuildPassed: false,
  dashboardUnitTestsPassed: false,
  dashboardPlaywrightSmokePassed: false,
  seededTenantDataAvailable: false,
  providerBackedAuthConfigured: false,
  tenantScopedApisImplemented: false,
  prismaRepositoriesImplemented: false,
  realMutationsEnabled: false,
  mutationAuditLogsPersisted: false,
  providerActionsImplemented: false,
  rbacDenialTestsPassed: false,
  crossTenantDenialTestsPassed: false,
  fieldRedactionVerified: false,
  loadingEmptyErrorStatesVerified: false,
  ciEvidenceCaptured: false,
  dashboardArtifactsSecretSafe: false,
});

export function buildDashboardLaunchDecisionRequiredEvidence(
  readinessEvidence: typeof dashboardLaunchRuntimeReadiness.requiredEvidence,
): DashboardLaunchRequiredEvidence {
  return [
    ...readinessEvidence,
    "DashboardLaunchRun row with command, control, artifact, tenant API, and launch state matrices.",
    "Artifact bundle proving dashboard typecheck/build/tests, Playwright smoke, seeded tenant data, provider auth, tenant-scoped APIs, Prisma repositories, real mutations, AuditLog persistence, provider actions, RBAC/cross-tenant denial, field redaction, launch states, CI evidence, and secret-safe artifacts.",
  ];
}

export type DashboardLaunchRequiredEvidence = readonly [
  ...typeof dashboardLaunchRuntimeReadiness.requiredEvidence,
  "DashboardLaunchRun row with command, control, artifact, tenant API, and launch state matrices.",
  "Artifact bundle proving dashboard typecheck/build/tests, Playwright smoke, seeded tenant data, provider auth, tenant-scoped APIs, Prisma repositories, real mutations, AuditLog persistence, provider actions, RBAC/cross-tenant denial, field redaction, launch states, CI evidence, and secret-safe artifacts.",
];

export const dashboardLaunchRequiredEvidence = buildDashboardLaunchDecisionRequiredEvidence(
  dashboardLaunchRuntimeReadiness.requiredEvidence,
);

export function buildDashboardLaunchEvidenceDecision(
  input: DashboardLaunchEvidenceInput,
): DashboardLaunchEvidenceDecision {
  const coveredControls = new Set(input.coveredControls);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingControls = dashboardLaunchRuntimeControls.filter((control) => !coveredControls.has(control));
  const missingArtifacts = dashboardLaunchArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = dashboardLaunchRuntimeCommands.filter((command) => !completedCommands.has(command));
  const readinessPlan = buildDashboardLaunchEvidencePlan({
    packageScripts: {
      typecheck: "next typegen && tsc --noEmit",
      build: "next build",
      test: "vitest run",
    },
    dashboardTypecheckPassed: input.dashboardTypecheckPassed,
    dashboardBuildPassed: input.dashboardBuildPassed,
    dashboardUnitTestsPassed: input.dashboardUnitTestsPassed,
    dashboardPlaywrightSmokePassed: input.dashboardPlaywrightSmokePassed,
    seededTenantDataAvailable: input.seededTenantDataAvailable,
    providerBackedAuthConfigured: input.providerBackedAuthConfigured,
    tenantScopedApisImplemented: input.tenantScopedApisImplemented,
    prismaRepositoriesImplemented: input.prismaRepositoriesImplemented,
    realMutationsEnabled: input.realMutationsEnabled,
    mutationAuditLogsPersisted: input.mutationAuditLogsPersisted,
    providerActionsImplemented: input.providerActionsImplemented,
    rbacDenialTestsPassed: input.rbacDenialTestsPassed,
    crossTenantDenialTestsPassed: input.crossTenantDenialTestsPassed,
    fieldRedactionVerified: input.fieldRedactionVerified,
    loadingEmptyErrorStatesVerified: input.loadingEmptyErrorStatesVerified,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    dashboardArtifactsSecretSafe: input.dashboardArtifactsSecretSafe,
  });
  const blockers = [...readinessPlan.blockers];

  if (!input.dashboardLaunchRunPersisted) {
    blockers.push("DashboardLaunchRun persistence row must be captured for durable auditability.");
  }
  if (missingControls.length > 0) {
    blockers.push("Every required dashboard launch control must be covered.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required dashboard launch artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required dashboard launch command must be completed.");
  }

  return {
    status: blockers.length === 0 && missingControls.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    missingControls,
    missingArtifacts,
    missingCommands,
    requiredControls: dashboardLaunchRuntimeControls,
    requiredArtifacts: dashboardLaunchArtifactPaths,
    requiredCommands: dashboardLaunchRuntimeCommands,
    requiredEvidence: dashboardLaunchRequiredEvidence,
    blockers,
  };
}

const sensitiveDashboardLaunchKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|tenant|user|account|database|url|uri|dsn|key|id|client|customer|payment|medical|consent|provider|repository|branch)$/iu;
const sensitiveDashboardLaunchValuePattern =
  /(https?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|[A-Za-z0-9_-]{24,})/giu;

const redactDashboardLaunchString = (value: string): string =>
  value.replace(sensitiveDashboardLaunchValuePattern, "[REDACTED]");

const buildRedactedDashboardLaunchValue = (
  value: unknown,
  path: string,
  redactions: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item, index) => buildRedactedDashboardLaunchValue(item, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveDashboardLaunchKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedDashboardLaunchValue(nestedValue, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redactedValue = redactDashboardLaunchString(value);
    if (redactedValue !== value) {
      redactions.push(path || "value");
    }
    return redactedValue;
  }

  return value;
};

export const dashboardLaunchExecutionPolicy = {
  codexMayClassifyStaticDashboardReadiness: true,
  dashboardRuntimeEvidenceRequiredForClosure: true,
  providerAuthEvidenceRequiredForClosure: true,
  tenantScopedPersistenceRequiredForClosure: true,
  rbacCrossTenantProofRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const;

export const dashboardLaunchRequiredExternalEvidence = [
  "Dashboard build, test, and Playwright smoke output captured from the target runtime.",
  "Seeded tenant data and provider-backed auth/session smoke evidence.",
  "Tenant-scoped API, Prisma repository, real mutation, mutation AuditLog, RBAC, and cross-tenant denial evidence.",
  "Private field redaction plus loading, empty, and error state evidence.",
  "GitHub Actions dashboard launch evidence job URL and conclusion.",
  "Provider-backed DashboardLaunchRun persistence row captured from the target database.",
  "Secret-safe dashboard launch artifacts with no credentials, private client data, payment data, consent data, or raw tenant identifiers.",
] as const;

export const dashboardLaunchRuntimeLocalArtifacts = [
  "coverage/dashboard-launch-runtime.json",
  "coverage/dashboard-typecheck.txt",
] as const satisfies readonly DashboardLaunchArtifact[];

export const dashboardLaunchRuntimeExternalArtifacts = [
  "coverage/dashboard-build.txt",
  "coverage/dashboard-test.txt",
  "coverage/dashboard-playwright-smoke.json",
  "coverage/dashboard-seeded-tenant-data.json",
  "coverage/dashboard-provider-auth-smoke.json",
  "coverage/dashboard-tenant-scoped-apis.json",
  "coverage/dashboard-prisma-repositories.json",
  "coverage/dashboard-mutation-auditlog.json",
  "coverage/dashboard-rbac-cross-tenant-denial.json",
  "coverage/dashboard-field-redaction.json",
  "coverage/dashboard-loading-empty-error-states.json",
  "coverage/dashboard-ci-evidence.json",
  "coverage/dashboard-secret-safe-artifacts.json",
  "test-results/dashboard-launch-runtime",
] as const satisfies readonly DashboardLaunchArtifact[];

export function buildDashboardLaunchExecutionPlan(): DashboardLaunchExecutionPlan {
  return {
    localCommands: dashboardLaunchRuntimeLocalCommands,
    externalCommands: dashboardLaunchRuntimeExternalCommands,
    localArtifacts: dashboardLaunchRuntimeLocalArtifacts,
    externalArtifacts: dashboardLaunchRuntimeExternalArtifacts,
    surfaceContract: dashboardLaunchSurfaceContract,
    dashboardTypecheckExecutionAllowed: false,
    dashboardBuildExecutionAllowed: false,
    dashboardTestExecutionAllowed: false,
    playwrightSmokeExecutionAllowed: false,
    providerAuthSmokeExecutionAllowed: false,
    rbacTenantDenialExecutionAllowed: false,
    mutationAuditLogExecutionAllowed: false,
    ciLaunchEvidenceExecutionAllowed: false,
    providerBackedPersistenceExecutionAllowed: false,
    executionPolicy: dashboardLaunchExecutionPolicy,
    requiredExternalEvidence: dashboardLaunchRequiredExternalEvidence,
  };
}

export function buildRedactedDashboardLaunchArtifact(artifact: unknown): unknown {
  return buildRedactedDashboardLaunchValue(artifact, "", []);
}

export function buildDashboardLaunchArtifactReview(artifact: unknown): DashboardLaunchArtifactReview {
  const redactions: string[] = [];

  return {
    artifact: buildRedactedDashboardLaunchValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: dashboardLaunchRequiredExternalEvidence,
    safeForTracker: true,
  };
}

