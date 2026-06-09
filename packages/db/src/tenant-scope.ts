export interface TenantScope {
  readonly tenantId: string;
  readonly actorUserId?: string;
}

export interface TenantScopedWhere<TWhere extends Record<string, unknown> = Record<string, unknown>> {
  readonly tenantId: string;
  readonly where: TWhere & { tenantId: string };
}

export interface TenantScopedMutation<TData extends Record<string, unknown> = Record<string, unknown>> {
  readonly tenantId: string;
  readonly data: TData & { tenantId: string };
}

export const tenantOwnedModelNames = [
  "TenantMember",
  "Studio",
  "Artist",
  "Client",
  "ClientProfile",
  "BookingRequest",
  "BookingStateEvent",
  "Appointment",
  "AvailabilityWindow",
  "Deposit",
  "Payment",
  "Refund",
  "PaymentAuditLog",
  "FileAsset",
  "ConsentForm",
  "ConsentSignature",
  "MedicalSafetyAcknowledgment",
  "MessageThread",
  "Message",
  "Notification",
  "NotificationDelivery",
  "SeoCityPage",
  "SeoStylePage",
  "Review",
  "ReleaseRecord",
  "FeatureFlag",
  "AuditLog",
] as const;

export type TenantOwnedModelName = (typeof tenantOwnedModelNames)[number];

export interface TenantIsolationIntegrationReadinessInput {
  packageScripts: readonly string[];
  prismaClientGenerated: boolean;
  databaseUrlConfigured: boolean;
  migrationsApplied: boolean;
  seedDataLoaded: boolean;
  multiTenantFixturesLoaded: boolean;
  repositoryLayerUsesHelpers: boolean;
  crossTenantReadTestsPassed: boolean;
  crossTenantWriteTestsPassed: boolean;
  auditRowsIncludeTenantAndActor: boolean;
  allTenantOwnedModelsCovered: boolean;
  destructiveFixtureCleanupVerified: boolean;
}

export interface TenantIsolationIntegrationReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
}

export interface TenantIsolationRepositoryEvidenceInput {
  packageScripts: readonly string[];
  dbTypecheckPassed: boolean;
  dbTestsPassed: boolean;
  prismaClientGenerated: boolean;
  migrationsApplied: boolean;
  seededMultiTenantFixturesLoaded: boolean;
  repositoryLayerImplemented: boolean;
  repositoryLayerUsesTenantHelpers: boolean;
  allTenantOwnedModelsCovered: boolean;
  crossTenantReadDenialPassed: boolean;
  crossTenantWriteDenialPassed: boolean;
  missingTenantWriteRejectionPassed: boolean;
  tenantScopedAuditRowsVerified: boolean;
  fixtureCleanupTenantScoped: boolean;
  databaseEvidenceCaptured: boolean;
  ciEvidenceCaptured: boolean;
  secretSafeArtifactsCaptured: boolean;
}

export interface TenantIsolationRepositoryEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

function requireTenantId(scope: TenantScope): string {
  const tenantId = scope.tenantId.trim();
  if (!tenantId) {
    throw new Error("Tenant scope requires a non-empty tenantId.");
  }
  return tenantId;
}

export function withTenantWhere<TWhere extends Record<string, unknown>>(scope: TenantScope, where: TWhere): TenantScopedWhere<TWhere> {
  const tenantId = requireTenantId(scope);
  return {
    tenantId,
    where: {
      ...where,
      tenantId,
    },
  };
}

export function withTenantData<TData extends Record<string, unknown>>(scope: TenantScope, data: TData): TenantScopedMutation<TData> {
  const tenantId = requireTenantId(scope);
  return {
    tenantId,
    data: {
      ...data,
      tenantId,
    },
  };
}

export function assertTenantScopedWhere(value: { where?: Record<string, unknown> }, expectedTenantId: string): void {
  if (!value.where || value.where.tenantId !== expectedTenantId) {
    throw new Error("Query is missing the expected tenantId scope.");
  }
}

export function assertTenantScopedData(value: { data?: Record<string, unknown> }, expectedTenantId: string): void {
  if (!value.data || value.data.tenantId !== expectedTenantId) {
    throw new Error("Mutation is missing the expected tenantId scope.");
  }
}

export function buildTenantIsolationIntegrationReadinessPlan(input: TenantIsolationIntegrationReadinessInput): TenantIsolationIntegrationReadinessPlan {
  const requiredScripts = ["test", "db:validate", "db:generate", "db:migrate", "db:seed"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/db ${script} script.`);
  if (!input.prismaClientGenerated) blockers.push("Prisma Client must be generated before repository integration tests can run.");
  if (!input.databaseUrlConfigured) blockers.push("Non-production DATABASE_URL must be configured for tenant isolation integration tests.");
  if (!input.migrationsApplied) blockers.push("Prisma migrations must be applied to the non-production test database.");
  if (!input.seedDataLoaded) blockers.push("Seed data must be loaded before tenant isolation smoke tests.");
  if (!input.multiTenantFixturesLoaded) blockers.push("At least two tenant fixtures with overlapping domain records must be loaded.");
  if (!input.repositoryLayerUsesHelpers) blockers.push("Repository/service layer must use withTenantWhere and withTenantData for tenant-owned models.");
  if (!input.crossTenantReadTestsPassed) blockers.push("Cross-tenant read tests must prove records from another tenant return no rows.");
  if (!input.crossTenantWriteTestsPassed) blockers.push("Cross-tenant write tests must prove mismatched tenantId mutations are denied.");
  if (!input.auditRowsIncludeTenantAndActor) blockers.push("Audit rows must include tenantId and actor metadata for sensitive reads/writes.");
  if (!input.allTenantOwnedModelsCovered) blockers.push("Integration tests must cover every tenant-owned model in tenantOwnedModelNames.");
  if (!input.destructiveFixtureCleanupVerified) blockers.push("Tenant isolation fixtures must clean up without touching production-like data.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/db db:validate",
      "pnpm --filter @inkroute/db db:generate",
      "pnpm --filter @inkroute/db db:migrate",
      "pnpm --filter @inkroute/db db:seed",
      "pnpm --filter @inkroute/db test",
      "tenant isolation Postgres integration suite",
    ],
    requiredEvidence: [
      "Redacted DATABASE_URL target proving tests ran against non-production Postgres.",
      "Migration and seed command output for two or more tenant fixtures.",
      "Cross-tenant read denial output for every tenant-owned model.",
      "Cross-tenant write denial output for every tenant-owned model mutation path.",
      "AuditLog rows proving tenantId, actorId, entityType, entityId, and action metadata are persisted.",
      "Fixture cleanup output proving tenant-scoped teardown only removed test records.",
    ],
    blockers,
  };
}

export function buildTenantIsolationRepositoryEvidencePlan(
  input: TenantIsolationRepositoryEvidenceInput,
): TenantIsolationRepositoryEvidencePlan {
  const requiredScripts = ["test", "typecheck", "db:validate", "db:generate", "db:migrate", "db:seed"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/db ${script} script.`);
  if (!input.dbTypecheckPassed) blockers.push("@inkroute/db typecheck must pass before tenant isolation evidence is ready.");
  if (!input.dbTestsPassed) blockers.push("@inkroute/db tests must pass before tenant isolation evidence is ready.");
  if (!input.prismaClientGenerated) blockers.push("Prisma Client must be generated before repository tenant isolation tests.");
  if (!input.migrationsApplied) blockers.push("Migrations must be applied before repository tenant isolation tests.");
  if (!input.seededMultiTenantFixturesLoaded) blockers.push("Seeded multi-tenant fixtures must be loaded before cross-tenant tests.");
  if (!input.repositoryLayerImplemented) blockers.push("Tenant-scoped repository/service layer must be implemented.");
  if (!input.repositoryLayerUsesTenantHelpers) blockers.push("Repository/service layer must use tenant scope helpers for tenant-owned models.");
  if (!input.allTenantOwnedModelsCovered) blockers.push("Tenant isolation matrix must cover every tenant-owned model.");
  if (!input.crossTenantReadDenialPassed) blockers.push("Cross-tenant read denial tests must pass for tenant-owned records.");
  if (!input.crossTenantWriteDenialPassed) blockers.push("Cross-tenant write denial tests must pass for tenant-owned mutations.");
  if (!input.missingTenantWriteRejectionPassed) blockers.push("Writes missing tenantId must be rejected before persistence.");
  if (!input.tenantScopedAuditRowsVerified) blockers.push("Audit rows must include tenantId, actorId, entityType, entityId, and action metadata.");
  if (!input.fixtureCleanupTenantScoped) blockers.push("Fixture cleanup must be tenant-scoped and limited to test records.");
  if (!input.databaseEvidenceCaptured) blockers.push("Redacted database command and query evidence must be captured.");
  if (!input.ciEvidenceCaptured) blockers.push("CI or clean-checkout tenant isolation evidence must be captured.");
  if (!input.secretSafeArtifactsCaptured) blockers.push("Tenant isolation artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.");

  if (!input.dbTypecheckPassed || !input.dbTestsPassed || !input.prismaClientGenerated || !input.migrationsApplied || !input.seededMultiTenantFixturesLoaded) {
    requiredEvidence.push("db typecheck/test, Prisma generate, migration, and seeded multi-tenant fixture evidence");
  }
  if (!input.repositoryLayerImplemented || !input.repositoryLayerUsesTenantHelpers || !input.allTenantOwnedModelsCovered) {
    requiredEvidence.push("tenant-scoped repository helper adoption and model coverage matrix evidence");
  }
  if (!input.crossTenantReadDenialPassed || !input.crossTenantWriteDenialPassed || !input.missingTenantWriteRejectionPassed) {
    requiredEvidence.push("cross-tenant read/write denial and missing-tenant rejection evidence");
  }
  if (!input.tenantScopedAuditRowsVerified || !input.fixtureCleanupTenantScoped) {
    requiredEvidence.push("tenant-scoped audit-row and fixture cleanup evidence");
  }
  if (!input.databaseEvidenceCaptured || !input.ciEvidenceCaptured || !input.secretSafeArtifactsCaptured) {
    requiredEvidence.push("redacted database, CI, and secret-safe artifact evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/db typecheck",
      "pnpm --filter @inkroute/db test",
      "pnpm --filter @inkroute/db db:generate",
      "pnpm --filter @inkroute/db db:migrate",
      "pnpm --filter @inkroute/db db:seed",
      "tenant isolation repository integration suite",
      "cross-tenant read/write denial matrix",
      "tenant-scoped fixture cleanup proof",
      "GitHub Actions tenant isolation evidence job",
    ],
    requiredEvidence,
    requiredControls: [
      "Use tenant scope helpers for every tenant-owned read and write path.",
      "Reject missing or mismatched tenantId before database mutation side effects.",
      "Persist audit rows with tenant and actor metadata for sensitive tenant-owned operations.",
      "Run fixture cleanup only against seeded test tenants and redact database URLs in artifacts.",
    ],
    blockers,
  };
}
