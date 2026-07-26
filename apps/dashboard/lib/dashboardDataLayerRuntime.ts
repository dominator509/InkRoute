import {
  buildDashboardRepositoryRouteEvidencePlan,
  dashboardDataCollections,
  dashboardRepositoryRouteRequiredCommands,
  dashboardRepositoryRouteRequiredEvidence,
} from "@inkroute/config";

export type DashboardDataLayerRuntimeStatus =
  | "wired"
  | "database-gated"
  | "test-gated"
  | "audit-gated"
  | "ci-gated";

export interface DashboardDataLayerRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DashboardDataLayerRuntimeStatus;
}

export const dashboardDataLayerRuntimeCommands = dashboardRepositoryRouteRequiredCommands;

export const dashboardDataLayerArtifactPaths = [
  "coverage/dashboard-data-layer-runtime.json",
  "coverage/dashboard-data-config-typecheck.txt",
  "coverage/dashboard-data-config-test.txt",
  "coverage/dashboard-data-dashboard-typecheck.txt",
  "coverage/dashboard-data-dashboard-build.txt",
  "coverage/dashboard-data-prisma-loader-matrix.json",
  "coverage/dashboard-data-route-wiring-matrix.json",
  "coverage/dashboard-data-static-demo-removal.json",
  "coverage/dashboard-data-seeded-db-smoke.json",
  "coverage/dashboard-data-tenant-isolation.json",
  "coverage/dashboard-data-rbac-redaction.json",
  "coverage/dashboard-data-sensitive-read-auditlog.json",
  "coverage/dashboard-data-no-store-cache.json",
  "coverage/dashboard-data-ci-evidence.json",
  "coverage/dashboard-data-secret-safe-artifacts.json",
  "test-results/dashboard-data-layer-runtime",
] as const;

export const dashboardDataLayerRouteTestFiles = [
  "apps/dashboard/tests/booking-state-route-static.test.ts",
  "apps/dashboard/tests/client-read-route-static.test.ts",
  "apps/dashboard/tests/payment-read-route-static.test.ts",
  "apps/dashboard/tests/portfolio-read-route-static.test.ts",
  "apps/dashboard/tests/travel-read-route-static.test.ts",
  "apps/dashboard/tests/message-read-route-static.test.ts",
  "apps/dashboard/tests/seo-read-route-static.test.ts",
  "apps/dashboard/tests/settings-read-route-static.test.ts",
  "apps/dashboard/tests/calendar-read-route-static.test.ts",
  "apps/dashboard/tests/review-read-route-static.test.ts",
] as const;

export const dashboardDataLayerRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "apps/dashboard/lib/dashboardDataLayerRuntime.ts",
  "apps/dashboard/tests/dashboard-data-layer-runtime-static.test.ts",
  "packages/config/package.json",
  "packages/config/src/index.ts",
  "packages/config/tests/dashboard-data.test.ts",
  "apps/dashboard/tests/booking-state-route-static.test.ts",
  "apps/dashboard/tests/client-read-route-static.test.ts",
  "apps/dashboard/tests/payment-read-route-static.test.ts",
  "apps/dashboard/tests/portfolio-read-route-static.test.ts",
  "apps/dashboard/tests/travel-read-route-static.test.ts",
  "apps/dashboard/tests/message-read-route-static.test.ts",
  "apps/dashboard/tests/seo-read-route-static.test.ts",
  "apps/dashboard/tests/settings-read-route-static.test.ts",
  "apps/dashboard/tests/calendar-read-route-static.test.ts",
  "apps/dashboard/tests/review-read-route-static.test.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export const dashboardDataLayerCollections = dashboardDataCollections;

export const dashboardDataLayerRuntimeMatrix = [
  {
    id: "config-typecheck",
    command: "pnpm --filter @inkroute/config typecheck",
    artifact: "coverage/dashboard-data-config-typecheck.txt",
    status: "wired",
  },
  {
    id: "config-tests",
    command: "pnpm --filter @inkroute/config test",
    artifact: "coverage/dashboard-data-config-test.txt",
    status: "wired",
  },
  {
    id: "dashboard-typecheck-build",
    command: "pnpm --filter @inkroute/dashboard typecheck && pnpm --filter @inkroute/dashboard build",
    artifact: "coverage/dashboard-data-dashboard-build.txt",
    status: "test-gated",
  },
  {
    id: "prisma-loader-matrix",
    command: "verify Prisma loaders for every dashboardDataCollections entry",
    artifact: "coverage/dashboard-data-prisma-loader-matrix.json",
    status: "wired",
  },
  {
    id: "route-wiring-matrix",
    command: "verify dashboard read/write routes use repository loaders and projections",
    artifact: "coverage/dashboard-data-route-wiring-matrix.json",
    status: "wired",
  },
  {
    id: "static-demo-removal",
    command: "verify production dashboard pages avoid raw sensitive demo arrays",
    artifact: "coverage/dashboard-data-static-demo-removal.json",
    status: "wired",
  },
  {
    id: "seeded-database-smoke",
    command: "seeded database dashboard route smoke",
    artifact: "coverage/dashboard-data-seeded-db-smoke.json",
    status: "database-gated",
  },
  {
    id: "tenant-isolation-rbac-redaction",
    command: "dashboard repository/API tenant-isolation tests && dashboard repository/API RBAC and redaction tests",
    artifact: "coverage/dashboard-data-rbac-redaction.json",
    status: "test-gated",
  },
  {
    id: "sensitive-read-auditlog",
    command: "dashboard sensitive-read AuditLog persistence tests",
    artifact: "coverage/dashboard-data-sensitive-read-auditlog.json",
    status: "audit-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions dashboard data repository evidence job",
    artifact: "coverage/dashboard-data-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly DashboardDataLayerRuntimeMatrixEntry[];

const dashboardDataLayerPackageReadiness = buildDashboardRepositoryRouteEvidencePlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  configTestsPassed: false,
  configTypecheckPassed: false,
  dashboardTypecheckPassed: false,
  dashboardBuildPassed: false,
  prismaLoadersImplemented: dashboardDataCollections,
  dashboardRoutesWired: dashboardDataCollections,
  staticDemoImportsRemoved: dashboardDataCollections,
  seededDatabaseSmokePassed: false,
  repositoryApiTestsPassed: false,
  tenantIsolationTestsPassed: false,
  rbacGuardTestsPassed: false,
  redactionTestsPassed: false,
  noStoreCacheVerified: true,
  sensitiveReadAuditLogsPersisted: false,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});

export const dashboardDataLayerRuntimeReadiness = {
  ...dashboardDataLayerPackageReadiness,
  requiredCommands: dashboardDataLayerRuntimeCommands,
  requiredEvidence: dashboardRepositoryRouteRequiredEvidence,
} as const;

export const dashboardDataLayerEvidenceFlags = [
  "configTestsPassed",
  "configTypecheckPassed",
  "dashboardTypecheckPassed",
  "dashboardBuildPassed",
  "seededDatabaseSmokePassed",
  "repositoryApiTestsPassed",
  "tenantIsolationTestsPassed",
  "rbacGuardTestsPassed",
  "redactionTestsPassed",
  "noStoreCacheVerified",
  "sensitiveReadAuditLogsPersisted",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type DashboardDataLayerEvidenceFlag = (typeof dashboardDataLayerEvidenceFlags)[number];

export interface DashboardDataLayerEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly routeTestFiles?: readonly string[];
  readonly prismaLoaders?: readonly string[];
  readonly routeWiring?: readonly string[];
  readonly staticDemoImportsRemoved?: readonly string[];
  readonly evidence?: Partial<Record<DashboardDataLayerEvidenceFlag, boolean>>;
}

export interface DashboardDataLayerEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingRouteTestFiles: readonly string[];
  readonly missingPrismaLoaders: readonly string[];
  readonly missingRouteWiring: readonly string[];
  readonly remainingStaticDemoImports: readonly string[];
  readonly missingEvidence: readonly DashboardDataLayerEvidenceFlag[];
  readonly requiredCommands: typeof dashboardDataLayerRuntimeCommands;
  readonly requiredArtifacts: typeof dashboardDataLayerArtifactPaths;
  readonly requiredRouteTestFiles: readonly string[];
  readonly requiredCollections: readonly string[];
  readonly requiredEvidence: typeof dashboardDataLayerEvidenceFlags;
  readonly blockers: readonly string[];
}

const dashboardDataLayerEvidenceBlockers: Record<DashboardDataLayerEvidenceFlag, string> = {
  configTestsPassed: "Config package dashboard data tests must pass.",
  configTypecheckPassed: "Config package typecheck must pass.",
  dashboardTypecheckPassed: "Dashboard typecheck must pass.",
  dashboardBuildPassed: "Dashboard build must pass.",
  seededDatabaseSmokePassed: "Seeded database dashboard route smoke must pass.",
  repositoryApiTestsPassed: "Dashboard repository/API tests must pass.",
  tenantIsolationTestsPassed: "Tenant-isolation tests must reject cross-tenant dashboard data reads.",
  rbacGuardTestsPassed: "RBAC guard tests must prove dashboard routes enforce permissions.",
  redactionTestsPassed: "Redaction tests must prove sensitive fields are excluded from dashboard responses.",
  noStoreCacheVerified: "No-store cache policy must be verified for dashboard data routes.",
  sensitiveReadAuditLogsPersisted: "Sensitive-read AuditLog persistence tests must pass.",
  ciEvidenceCaptured: "CI dashboard data layer evidence must be captured.",
  secretSafeArtifactsCaptured:
    "Dashboard data artifacts must be redacted and free of secrets, raw PII, medical notes, payment data, provider tokens, and private object keys.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export const buildDashboardDataLayerEvidenceDecision = (
  input: DashboardDataLayerEvidenceInput,
): DashboardDataLayerEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, dashboardDataLayerRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, dashboardDataLayerArtifactPaths);
  const missingRouteTestFiles = missingFrom(input.routeTestFiles, dashboardDataLayerRouteTestFiles);
  const missingPrismaLoaders = missingFrom(input.prismaLoaders, dashboardDataCollections);
  const missingRouteWiring = missingFrom(input.routeWiring, dashboardDataCollections);
  const remainingStaticDemoImports = missingFrom(input.staticDemoImportsRemoved, dashboardDataCollections);
  const missingEvidence = dashboardDataLayerEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => dashboardDataLayerEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 &&
      missingArtifacts.length === 0 &&
      missingRouteTestFiles.length === 0 &&
      missingPrismaLoaders.length === 0 &&
      missingRouteWiring.length === 0 &&
      remainingStaticDemoImports.length === 0 &&
      missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingRouteTestFiles,
    missingPrismaLoaders,
    missingRouteWiring,
    remainingStaticDemoImports,
    missingEvidence,
    requiredCommands: dashboardDataLayerRuntimeCommands,
    requiredArtifacts: dashboardDataLayerArtifactPaths,
    requiredRouteTestFiles: dashboardDataLayerRouteTestFiles,
    requiredCollections: dashboardDataCollections,
    requiredEvidence: dashboardDataLayerEvidenceFlags,
    blockers,
  };
};

export interface DashboardDataLayerExecutionPolicy {
  readonly codexMayClassifyStaticRepositoryRouteReadiness: true;
  readonly seededDatabaseSmokeRequiredForClosure: true;
  readonly tenantIsolationRbacAndRedactionRequiredForClosure: true;
  readonly sensitiveReadAuditLogRequiredForClosure: true;
  readonly dashboardTypecheckBuildRequiredForClosure: true;
  readonly noStorePolicyRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface DashboardDataLayerExecutionPlan {
  readonly localCommands: typeof dashboardDataLayerLocalCommands;
  readonly externalCommands: typeof dashboardDataLayerExternalCommands;
  readonly requiredExternalEvidence: typeof dashboardDataLayerRequiredExternalEvidence;
  readonly commandExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly tenantIsolationExecutionAllowed: false;
  readonly rbacExecutionAllowed: false;
  readonly auditPersistenceExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly executionPolicy: typeof dashboardDataLayerExecutionPolicy;
}

export interface DashboardDataLayerArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof dashboardDataLayerRequiredExternalEvidence;
  readonly secretSafe: boolean;
}

export const dashboardDataLayerRequiredExternalEvidence = [
  "seeded database dashboard route smoke evidence",
  "repository/API tenant-isolation test output",
  "repository/API RBAC test output",
  "dashboard response redaction test output",
  "sensitive-read AuditLog persistence evidence",
  "dashboard typecheck output",
  "dashboard build output",
  "fresh CI dashboard data layer artifacts",
  "secret-safe dashboard data artifact review",
] as const;

export const dashboardDataLayerExecutionPolicy: DashboardDataLayerExecutionPolicy = {
  codexMayClassifyStaticRepositoryRouteReadiness: true,
  seededDatabaseSmokeRequiredForClosure: true,
  tenantIsolationRbacAndRedactionRequiredForClosure: true,
  sensitiveReadAuditLogRequiredForClosure: true,
  dashboardTypecheckBuildRequiredForClosure: true,
  noStorePolicyRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
};

export const dashboardDataLayerLocalCommands = [
  "pnpm --filter @inkroute/config typecheck",
  "pnpm --filter @inkroute/config test",
  "static dashboard route wiring matrix review",
  "static no-store/read redaction route review",
] as const;

export const dashboardDataLayerExternalCommands = [
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm --filter @inkroute/dashboard build",
  "seeded database dashboard route smoke",
  "dashboard repository/API tenant-isolation tests",
  "dashboard repository/API RBAC and redaction tests",
  "dashboard sensitive-read AuditLog persistence tests",
  "GitHub Actions dashboard data repository evidence job",
] as const;

export const buildDashboardDataLayerExecutionPlan = (): DashboardDataLayerExecutionPlan => ({
  localCommands: dashboardDataLayerLocalCommands,
  externalCommands: dashboardDataLayerExternalCommands,
  requiredExternalEvidence: dashboardDataLayerRequiredExternalEvidence,
  commandExecutionAllowed: false,
  databaseExecutionAllowed: false,
  tenantIsolationExecutionAllowed: false,
  rbacExecutionAllowed: false,
  auditPersistenceExecutionAllowed: false,
  ciExecutionAllowed: false,
  executionPolicy: dashboardDataLayerExecutionPolicy,
});

const dashboardDataLayerSensitiveArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|cookie|email|phone|medical|payment|stripe|storage|object|key|booking|message|audit|rbac|role|member|note|file|portfolio|travel|appointment|availability|artist|city|schedule|seo|redirect|metrics|route|request|response|payload|body|repository|prisma|read|redaction|artifact|path|command|typecheck|build|test|output|stdout|stderr|log|ci|workflow|run|commit|id)/i;
const dashboardDataLayerSensitiveArtifactValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|s3:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:sk|pk|gh[psuor]|github_pat|provider-token|stripe)[A-Za-z0-9_-]*|(?:tenant|client|booking|message|thread|payment|portfolio|travel|appointment|availability|artist|city|schedule|seo|redirect|audit|member|role|route|repository|prisma|artifact|workflow|ci|run|commit|object|file|evidence)[-_:/]?[A-Za-z0-9_.-]{6,}|(?:coverage|artifacts|test-results|reports|docs)\/[A-Za-z0-9_./-]{6,}|medical:[^"'\n\r]+|private-object|[A-Za-z0-9_-]{24,})/giu;

export const buildRedactedDashboardDataLayerArtifact = (
  artifact: unknown,
): Pick<DashboardDataLayerArtifactReview, "artifact" | "redactions"> => {
  const redactions: string[] = [];

  const redact = (value: unknown, path: string): unknown => {
    if (Array.isArray(value)) {
      return value.map((item, index) => redact(item, `${path}[${index}]`));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
          const entryPath = path ? `${path}.${key}` : key;

          if (dashboardDataLayerSensitiveArtifactKeyPattern.test(key)) {
            redactions.push(entryPath);
            return [key, "[REDACTED_DASHBOARD_DATA_PRIVATE_VALUE]"];
          }

          return [key, redact(entry, entryPath)];
        }),
      );
    }

    if (typeof value === "string") {
      const redactedValue = value.replace(
        dashboardDataLayerSensitiveArtifactValuePattern,
        "[REDACTED_DASHBOARD_DATA_PRIVATE_VALUE]",
      );
      if (redactedValue !== value) {
        redactions.push(path || "$");
      }
      return redactedValue;
    }

    return value;
  };

  return {
    artifact: redact(artifact, ""),
    redactions,
  };
};

export const buildDashboardDataLayerArtifactReview = (
  artifact: unknown,
): DashboardDataLayerArtifactReview => {
  const redacted = buildRedactedDashboardDataLayerArtifact(artifact);
  const serialized = JSON.stringify(redacted.artifact);
  const leakedPrivateMarkers = [
    "postgres://",
    "client@example.com",
    "tenant.example.com",
    "stripe_",
    "private-object",
    "medical:",
    "provider-token",
  ].some((marker) => serialized.includes(marker));

  return {
    ...redacted,
    requiredExternalEvidence: dashboardDataLayerRequiredExternalEvidence,
    secretSafe: !leakedPrivateMarkers,
  };
};



