import { buildAvailabilityRuntimeReadinessPlan } from "@inkroute/calendar";

export type AvailabilityPersistenceRuntimeStatus =
  | "wired"
  | "db-gated"
  | "transaction-gated"
  | "conflict-gated"
  | "race-gated"
  | "audit-gated"
  | "isolation-gated"
  | "ci-gated";

export interface AvailabilityPersistenceRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: AvailabilityPersistenceRuntimeStatus;
}

export const availabilityPersistenceRuntimeCommands = [
  "pnpm --filter @inkroute/calendar typecheck",
  "pnpm --filter @inkroute/calendar test",
  "pnpm --filter @inkroute/db prisma validate",
  "availability persistence seeded Postgres integration tests",
  "concurrent slot hold race-condition tests",
  "dashboard/API availability repository tests",
] as const;

export const availabilityPersistenceArtifactPaths = [
  "coverage/availability-persistence-runtime.json",
  "coverage/availability-persistence-calendar-typecheck.txt",
  "coverage/availability-persistence-calendar-test.txt",
  "coverage/availability-persistence-prisma-validate.txt",
  "coverage/availability-persistence-schema-models.json",
  "coverage/availability-persistence-repository-contract.json",
  "coverage/availability-persistence-tenant-scope.json",
  "coverage/availability-persistence-window-transaction.json",
  "coverage/availability-persistence-slot-hold-transaction.json",
  "coverage/availability-persistence-appointment-confirmation.json",
  "coverage/availability-persistence-hold-release.json",
  "coverage/availability-persistence-audit-log.json",
  "coverage/availability-persistence-idempotency.json",
  "coverage/availability-persistence-conflict-rows.json",
  "coverage/availability-persistence-concurrent-hold.json",
  "coverage/availability-persistence-overlap-rejection.json",
  "coverage/availability-persistence-cross-tenant-denial.json",
  "coverage/availability-persistence-seeded-postgres.json",
  "coverage/availability-persistence-dashboard-api-repository.json",
  "coverage/availability-persistence-secret-safe-artifacts.json",
  "test-results/availability-persistence-runtime",
] as const;

export const availabilityPersistenceRuntimeProofFiles = [
  "packages/db/package.json",
  "packages/calendar/package.json",
  "packages/calendar/src/index.ts",
  "packages/calendar/tests/availability-conflicts.test.ts",
  "apps/dashboard/lib/availabilityPersistence.ts",
  "apps/dashboard/lib/availabilityPersistenceRuntime.ts",
  "apps/dashboard/app/api/calendar/holds/route.ts",
  "apps/dashboard/app/api/calendar/route.ts",
  "apps/dashboard/tests/availability-persistence-static.test.ts",
  "apps/dashboard/tests/availability-persistence-runtime-static.test.ts",
  "apps/dashboard/tests/calendar-read-route-static.test.ts",
  "apps/web/app/api/public/[tenantSlug]/availability-preview/route.ts",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export type AvailabilityPersistenceEvidenceArtifact = (typeof availabilityPersistenceArtifactPaths)[number];

export interface AvailabilityPersistenceExecutionPolicy {
  readonly codexMayClassifyStaticAvailabilityPersistenceReadiness: true;
  readonly durablePrismaRepositoryRequiredForClosure: true;
  readonly seededPostgresRequiredForClosure: true;
  readonly overlapRejectionRequiredForClosure: true;
  readonly concurrentHoldRaceRequiredForClosure: true;
  readonly crossTenantMutationRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface AvailabilityPersistenceExecutionPlan {
  readonly policy: typeof availabilityPersistenceExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly prismaExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly concurrentRaceExecutionAllowed: false;
  readonly crossTenantExecutionAllowed: false;
  readonly dashboardApiExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly localCommands: typeof availabilityPersistenceLocalCommands;
  readonly externalCommands: typeof availabilityPersistenceExternalCommands;
  readonly requiredExternalEvidence: typeof availabilityPersistenceRequiredExternalEvidence;
}

export interface AvailabilityPersistenceArtifactReview {
  readonly artifact: unknown;
  readonly redactedArtifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: boolean;
  readonly requiredExternalEvidence: typeof availabilityPersistenceRequiredExternalEvidence;
}

export interface AvailabilityPersistenceEvidenceInput {
  readonly calendarTypecheckPassed: boolean;
  readonly calendarTestsPassed: boolean;
  readonly prismaValidatePassed: boolean;
  readonly schemaModelsVerified: boolean;
  readonly repositoryContractVerified: boolean;
  readonly tenantScopeVerified: boolean;
  readonly windowTransactionVerified: boolean;
  readonly slotHoldTransactionVerified: boolean;
  readonly appointmentConfirmationVerified: boolean;
  readonly holdReleaseVerified: boolean;
  readonly auditLogVerified: boolean;
  readonly idempotencyStoreVerified: boolean;
  readonly persistedConflictRowsVerified: boolean;
  readonly concurrentHoldProtectionVerified: boolean;
  readonly overlapRejectionVerified: boolean;
  readonly crossTenantDenialVerified: boolean;
  readonly seededPostgresVerified: boolean;
  readonly dashboardApiRepositoryVerified: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly AvailabilityPersistenceEvidenceArtifact[];
}

export interface AvailabilityPersistenceEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly AvailabilityPersistenceEvidenceArtifact[];
  readonly requiredCommands: typeof availabilityPersistenceRuntimeCommands;
  readonly requiredEvidence: typeof availabilityPersistenceDecisionRequiredEvidence;
  readonly redactedSummary: {
    readonly capturedArtifactCount: number;
    readonly requiredArtifactCount: number;
  };
}

export const availabilityPersistenceExecutionPolicy = {
  codexMayClassifyStaticAvailabilityPersistenceReadiness: true,
  durablePrismaRepositoryRequiredForClosure: true,
  seededPostgresRequiredForClosure: true,
  overlapRejectionRequiredForClosure: true,
  concurrentHoldRaceRequiredForClosure: true,
  crossTenantMutationRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies AvailabilityPersistenceExecutionPolicy;

export const availabilityPersistenceRequiredExternalEvidence = [
  "durable Prisma availability repository execution proof",
  "seeded Postgres lifecycle tests",
  "overlapping DB rejection tests",
  "concurrent slot hold race-condition tests",
  "cross-tenant mutation tests",
  "dashboard/API availability repository tests",
  "CI availability persistence evidence",
  "secret-safe availability persistence artifact review",
] as const;

export const availabilityPersistenceDecisionRequiredEvidence = [
  "calendar command output and Prisma validation output",
  "schema model, repository contract, tenant scope, and transaction evidence",
  "persisted conflict detection and concurrent hold rejection evidence",
  "seeded Postgres tenant isolation and availability lifecycle integration test output",
  "dashboard/API repository execution evidence",
  "secret-safe review of retained availability persistence artifacts",
] as const;

const sensitiveAvailabilityPersistenceArtifactKey = /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|availability|calendar|artist|appointment|hold|booking|idempotency|audit|postgres|prisma|email|phone|medical|payment|customer|artifact|path|ci|workflow|run|evidence|id|key)/i;
const sensitiveAvailabilityPersistenceArtifactValue =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:sk|pk|gh[psuor]|github_pat|provider-token)[A-Za-z0-9_-]*|(?:tenant|client|user|member|session|refresh|availability|calendar|artist|appointment|hold|booking|idempotency|audit|postgres|prisma|provider|artifact|workflow|ci|run|evidence|dashboard)[-_:/]?[A-Za-z0-9_.-]{6,}|(?:coverage|artifacts|test-results|reports|docs)\/[A-Za-z0-9_./-]{6,}|[A-Za-z0-9_-]{24,})/giu;

const redactAvailabilityPersistenceArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactAvailabilityPersistenceArtifactValue(entry, `${path}.${index}`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveAvailabilityPersistenceArtifactKey.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, redactAvailabilityPersistenceArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  if (typeof value === "string" && sensitiveAvailabilityPersistenceArtifactValue.test(value)) {
    sensitiveAvailabilityPersistenceArtifactValue.lastIndex = 0;
    redactedPaths.push(path);
    return value.replace(sensitiveAvailabilityPersistenceArtifactValue, "[REDACTED]");
  }

  sensitiveAvailabilityPersistenceArtifactValue.lastIndex = 0;
  return value;
};

export const availabilityPersistenceLocalCommands = [
  "pnpm --filter @inkroute/calendar typecheck",
  "pnpm --filter @inkroute/calendar test",
  "static local in-memory availability repository contract review",
  "static production availability preview fail-closed guard review",
] as const;

export const availabilityPersistenceExternalCommands = [
  "pnpm --filter @inkroute/db prisma validate",
  "availability persistence seeded Postgres integration tests",
  "concurrent slot hold race-condition tests",
  "dashboard/API availability repository tests",
  "cross-tenant availability mutation tests",
  "GitHub Actions availability persistence evidence job",
] as const;

export const buildAvailabilityPersistenceExecutionPlan = (): AvailabilityPersistenceExecutionPlan => ({
  policy: availabilityPersistenceExecutionPolicy,
  commandExecutionAllowed: false,
  prismaExecutionAllowed: false,
  databaseExecutionAllowed: false,
  concurrentRaceExecutionAllowed: false,
  crossTenantExecutionAllowed: false,
  dashboardApiExecutionAllowed: false,
  ciExecutionAllowed: false,
  localCommands: availabilityPersistenceLocalCommands,
  externalCommands: availabilityPersistenceExternalCommands,
  requiredExternalEvidence: availabilityPersistenceRequiredExternalEvidence,
});

export const buildRedactedAvailabilityPersistenceArtifact = (artifact: unknown): Pick<AvailabilityPersistenceArtifactReview, "redactedArtifact" | "redactedPaths"> => {
  const redactedPaths: string[] = [];
  return {
    redactedArtifact: redactAvailabilityPersistenceArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
  };
};

export const buildAvailabilityPersistenceArtifactReview = (artifact: unknown): AvailabilityPersistenceArtifactReview => {
  const redacted = buildRedactedAvailabilityPersistenceArtifact(artifact);
  return {
    artifact,
    redactedArtifact: redacted.redactedArtifact,
    redactedPaths: redacted.redactedPaths,
    secretSafe: redacted.redactedPaths.length > 0,
    requiredExternalEvidence: availabilityPersistenceRequiredExternalEvidence,
  };
};

export const buildAvailabilityPersistenceEvidenceDecision = (
  input: AvailabilityPersistenceEvidenceInput,
): AvailabilityPersistenceEvidenceDecision => {
  const captured = new Set(input.capturedArtifacts);
  const missingArtifacts = availabilityPersistenceArtifactPaths.filter((artifact) => !captured.has(artifact));
  const blockers = [
    ...(!input.calendarTypecheckPassed ? ["Calendar package typecheck evidence is missing."] : []),
    ...(!input.calendarTestsPassed ? ["Calendar package test evidence is missing."] : []),
    ...(!input.prismaValidatePassed ? ["Prisma validation evidence is missing."] : []),
    ...(!input.schemaModelsVerified ? ["Availability persistence schema-model evidence is missing."] : []),
    ...(!input.repositoryContractVerified ? ["Availability repository contract evidence is missing."] : []),
    ...(!input.tenantScopeVerified ? ["Tenant/artist scoped availability query evidence is missing."] : []),
    ...(!input.windowTransactionVerified ? ["Availability window transaction evidence is missing."] : []),
    ...(!input.slotHoldTransactionVerified ? ["Slot hold transaction evidence is missing."] : []),
    ...(!input.appointmentConfirmationVerified ? ["Appointment confirmation persistence evidence is missing."] : []),
    ...(!input.holdReleaseVerified ? ["Hold release persistence evidence is missing."] : []),
    ...(!input.auditLogVerified ? ["CalendarAuditLog persistence evidence is missing."] : []),
    ...(!input.idempotencyStoreVerified ? ["IdempotencyKey persistence evidence is missing."] : []),
    ...(!input.persistedConflictRowsVerified ? ["Persisted conflict-row lookup evidence is missing."] : []),
    ...(!input.concurrentHoldProtectionVerified ? ["Concurrent slot hold protection evidence is missing."] : []),
    ...(!input.overlapRejectionVerified ? ["Overlapping slot DB rejection evidence is missing."] : []),
    ...(!input.crossTenantDenialVerified ? ["Cross-tenant availability denial evidence is missing."] : []),
    ...(!input.seededPostgresVerified ? ["Seeded Postgres availability lifecycle evidence is missing."] : []),
    ...(!input.dashboardApiRepositoryVerified ? ["Dashboard/API repository execution evidence is missing."] : []),
    ...(!input.secretSafeArtifactReviewPassed
      ? ["Secret-safe availability persistence artifact review evidence is missing."]
      : []),
    ...(missingArtifacts.length > 0 ? ["All availability persistence artifacts must be captured."] : []),
  ];

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: availabilityPersistenceRuntimeCommands,
    requiredEvidence: availabilityPersistenceDecisionRequiredEvidence,
    redactedSummary: {
      capturedArtifactCount: captured.size,
      requiredArtifactCount: availabilityPersistenceArtifactPaths.length,
    },
  };
};

export const availabilityPersistenceRuntimeMatrix = [
  {
    id: "calendar-typecheck",
    command: "pnpm --filter @inkroute/calendar typecheck",
    artifact: "coverage/availability-persistence-calendar-typecheck.txt",
    status: "wired",
  },
  {
    id: "calendar-tests",
    command: "pnpm --filter @inkroute/calendar test",
    artifact: "coverage/availability-persistence-calendar-test.txt",
    status: "wired",
  },
  {
    id: "prisma-validate",
    command: "pnpm --filter @inkroute/db prisma validate",
    artifact: "coverage/availability-persistence-prisma-validate.txt",
    status: "db-gated",
  },
  {
    id: "schema-models",
    command: "validate AvailabilityWindow, AvailabilityHold, Appointment, CalendarAuditLog, and IdempotencyKey models",
    artifact: "coverage/availability-persistence-schema-models.json",
    status: "wired",
  },
  {
    id: "repository-contract",
    command: "implement tenant-scoped AvailabilityRepository methods",
    artifact: "coverage/availability-persistence-repository-contract.json",
    status: "wired",
  },
  {
    id: "tenant-scope",
    command: "enforce tenant/artist scope on availability reads and writes",
    artifact: "coverage/availability-persistence-tenant-scope.json",
    status: "wired",
  },
  {
    id: "window-transaction",
    command: "run availability window creation in a tenant-scoped transaction",
    artifact: "coverage/availability-persistence-window-transaction.json",
    status: "transaction-gated",
  },
  {
    id: "slot-hold-transaction",
    command: "run slot hold creation in a tenant-scoped transaction",
    artifact: "coverage/availability-persistence-slot-hold-transaction.json",
    status: "transaction-gated",
  },
  {
    id: "appointment-confirmation",
    command: "persist Appointment, hold, booking, CalendarAuditLog, and IdempotencyKey writes",
    artifact: "coverage/availability-persistence-appointment-confirmation.json",
    status: "transaction-gated",
  },
  {
    id: "hold-release",
    command: "persist hold release state, CalendarAuditLog, and IdempotencyKey writes",
    artifact: "coverage/availability-persistence-hold-release.json",
    status: "transaction-gated",
  },
  {
    id: "calendar-audit-log",
    command: "persist CalendarAuditLog for every availability mutation",
    artifact: "coverage/availability-persistence-audit-log.json",
    status: "audit-gated",
  },
  {
    id: "idempotency-store",
    command: "claim IdempotencyKey records before availability mutations",
    artifact: "coverage/availability-persistence-idempotency.json",
    status: "audit-gated",
  },
  {
    id: "persisted-conflict-rows",
    command: "query persisted appointments, holds, windows, and travel blocks for conflicts",
    artifact: "coverage/availability-persistence-conflict-rows.json",
    status: "conflict-gated",
  },
  {
    id: "concurrent-hold-protection",
    command: "concurrent slot hold race-condition tests",
    artifact: "coverage/availability-persistence-concurrent-hold.json",
    status: "race-gated",
  },
  {
    id: "overlap-rejection",
    command: "test overlapping slot persistence rejection against DB rows",
    artifact: "coverage/availability-persistence-overlap-rejection.json",
    status: "conflict-gated",
  },
  {
    id: "cross-tenant-denial",
    command: "cross-tenant availability reads and mutations denied by tests",
    artifact: "coverage/availability-persistence-cross-tenant-denial.json",
    status: "isolation-gated",
  },
  {
    id: "seeded-postgres",
    command: "availability persistence seeded Postgres integration tests",
    artifact: "coverage/availability-persistence-seeded-postgres.json",
    status: "db-gated",
  },
  {
    id: "dashboard-api-repository",
    command: "dashboard/API availability repository tests",
    artifact: "coverage/availability-persistence-dashboard-api-repository.json",
    status: "ci-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions availability persistence evidence job",
    artifact: "coverage/availability-persistence-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly AvailabilityPersistenceRuntimeMatrixEntry[];

export const availabilityPersistenceRuntimeReadiness = buildAvailabilityRuntimeReadinessPlan({
  packageScripts: {
    test: "vitest run",
    typecheck: "tsc --noEmit",
  },
  calendarTestsPassed: false,
  calendarTypecheckPassed: false,
  dbSchemaIncludesAvailabilityModels: true,
  repositoriesImplemented: true,
  tenantScopedQueriesEnforced: true,
  transactionalWindowCreationImplemented: true,
  transactionalSlotHoldImplemented: true,
  appointmentConfirmationImplemented: true,
  holdReleaseImplemented: true,
  auditLogPersistenceConfigured: true,
  idempotencyStoreConfigured: true,
  conflictDetectionAgainstPersistedRows: true,
  concurrentHoldProtectionConfigured: true,
  overlappingSlotDbRejectionTested: false,
  crossTenantIsolationTestsPassed: false,
  seededPostgresIntegrationTestsPassed: false,
  dashboardAndApiUseRepository: true,
});


