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
