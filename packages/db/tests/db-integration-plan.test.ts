import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildDbIntegrationRuntimeReadinessPlan,
  buildPrismaSchemaLifecycleReadinessPlan,
  buildSeedRuntimeExecutionEvidencePlan,
  dbIntegrationRuntimeReadinessCommands,
  dbIntegrationRuntimeReadinessEvidence,
  prismaSchemaLifecycleReadinessCommands,
  prismaSchemaLifecycleReadinessEvidence,
  seedRuntimeExecutionEvidenceCommands,
  seedRuntimeExecutionRequiredEvidence,
} from "../src/index";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("database integration test plan", () => {
  it("keeps Prisma lifecycle commands wired for the future Postgres integration suite", () => {
    const packageJson = JSON.parse(readWorkspaceFile("packages/db/package.json")) as { scripts: Record<string, string> };
    const manifest = JSON.parse(readWorkspaceFile("testing/manifests/db-integration-test-manifest.json")) as {
      suites: Array<{ id: string; commands?: string[] }>;
    };

    expect(packageJson.scripts["db:validate"]).toContain("prisma validate");
    expect(packageJson.scripts["db:generate"]).toContain("prisma generate");
    expect(packageJson.scripts["db:migrate"]).toContain("prisma migrate dev");
    expect(packageJson.scripts["db:seed"]).toContain("tsx prisma/seed.ts");
    expect(packageJson.scripts["db:verify-seed"]).toContain("verify-seed-readiness");
    expect(manifest.suites.find((suite) => suite.id === "db-prisma-schema-lifecycle")?.commands).toEqual(
      expect.arrayContaining([
        "pnpm --filter @inkroute/db db:validate",
        "pnpm --filter @inkroute/db db:generate",
        "pnpm --filter @inkroute/db db:migrate",
        "pnpm db:verify-seed",
        "pnpm --filter @inkroute/db db:seed",
      ]),
    );
  });

  it("pins tenant-scoped schema models and audit log prerequisites", () => {
    const schema = readWorkspaceFile("packages/db/prisma/schema.prisma");
    const contract = JSON.parse(readWorkspaceFile("packages/db/prisma/tenant-isolation-contract.json")) as {
      tenantOwnedModels: string[];
      requiredHelpers: string[];
    };
    const helpers = readWorkspaceFile("packages/db/src/tenant-scope.ts");

    expect(schema).toContain("model Tenant " );

    for (const model of [
      "TenantMember",
      "BookingRequest",
      "Appointment",
      "Payment",
      "FileAsset",
      "MessageThread",
      "Message",
      "Notification",
      "SeoCityPage",
      "ReleaseRecord",
      "FeatureFlag",
      "AuditLog",
    ]) {
      expect(schema).toContain(`model ${model} `);
      expect(contract.tenantOwnedModels).toContain(model);
    }

    for (const helper of contract.requiredHelpers) {
      expect(helpers).toContain(helper);
    }

    expect(schema).toContain("@@unique([tenantId, userId])");
    expect(schema).toContain("@@index([tenantId, status, createdAt])");
    expect(schema).toContain("model AuditLog");
    expect(schema).toContain("actorUserId");
    expect(schema).toContain("entityType");
    expect(schema).toContain("entityId");
  });

  it("keeps seed data tenant-scoped across core launch workflows", () => {
    const seed = readWorkspaceFile("packages/db/prisma/seed.ts");

    for (const requiredSeed of [
      "prisma.tenant.upsert",
      "prisma.tenantMember.upsert",
      "prisma.bookingRequest.upsert",
      "prisma.appointment.upsert",
      "prisma.payment.upsert",
      "prisma.fileAsset.upsert",
      "prisma.message.upsert",
      "prisma.notification.upsert",
      "prisma.seoCityPage.upsert",
      "prisma.featureFlag.upsert",
      "prisma.releaseRecord.upsert",
      "prisma.auditLog.create",
    ]) {
      expect(seed).toContain(requiredSeed);
    }

    expect(seed).toContain("tenantId: tenant.id");
    expect(seed).toContain("Demo consent text for development only");
    expect(seed).toContain("Use fake data only");
  });

  it("blocks DB integration runtime readiness until Postgres lifecycle, tenant isolation, workflows, audit logs, and CI evidence exist", () => {
    const plan = buildDbIntegrationRuntimeReadinessPlan({
      packageScripts: {
        "db:validate": "prisma validate",
        "db:generate": "prisma generate",
        "db:migrate": "prisma migrate dev",
      },
      postgresProvisioned: false,
      databaseUrlConfigured: false,
      prismaValidatePassed: true,
      prismaGeneratePassed: false,
      prismaMigratePassed: false,
      prismaSeedPassed: false,
      seedVerificationPassed: false,
      tenantIsolationTestsPassed: false,
      workflowPersistenceTestsPassed: false,
      auditLogIntegrationTestsPassed: false,
      destructiveResetGuarded: false,
      migrationRollbackDocumented: false,
      commandOutputCaptured: false,
      ciDbJobPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["db:seed", "db:verify-seed"]);
    expect(plan.requiredCommands).toBe(dbIntegrationRuntimeReadinessCommands);
    expect(plan.requiredEvidence).toBe(dbIntegrationRuntimeReadinessEvidence);
    expect(plan.blockers).toContain("Tenant-isolation integration tests must deny cross-tenant reads and writes across critical models.");
    expect(plan.blockers).toContain("Audit-log integration tests must prove tenant-scoped actor, entity, action, and metadata writes.");
  });

  it("blocks Prisma schema lifecycle readiness until provisioning, migration, SQL review, seed, drift, and CI evidence exist", () => {
    const plan = buildPrismaSchemaLifecycleReadinessPlan({
      packageScripts: {
        "db:validate": "prisma validate",
        "db:generate": "prisma generate",
        "db:migrate": "prisma migrate dev",
      },
      schemaModelsCount: 44,
      schemaEnumsCount: 36,
      minimumExpectedModels: 44,
      minimumExpectedEnums: 36,
      postgresProvisioned: false,
      databaseUrlConfigured: false,
      directUrlConfigured: false,
      prismaValidatePassed: true,
      prismaGeneratePassed: false,
      migrationGenerated: false,
      migrationSqlReviewed: false,
      migrationAppliedToDevDb: false,
      seedScriptPassed: false,
      seedReadinessVerified: false,
      destructiveProductionUrlGuarded: false,
      migrationDriftChecked: false,
      commandEvidenceCaptured: false,
      ciEvidenceCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["db:seed", "db:verify-seed"]);
    expect(plan.schemaCoverageStatus).toBe("pass");
    expect(plan.requiredCommands).toBe(prismaSchemaLifecycleReadinessCommands);
    expect(plan.requiredEvidence).toBe(prismaSchemaLifecycleReadinessEvidence);
    expect(plan.blockers).toContain("A non-production Postgres database must be provisioned.");
    expect(plan.blockers).toContain("DIRECT_URL must be configured for Prisma migrations when required by the provider.");
    expect(plan.blockers).toContain("Generated migration SQL must be reviewed before applying to shared environments.");
    expect(plan.blockers).toContain("Migration drift must be checked after applying migrations.");
  });

  it("marks Prisma schema lifecycle ready when schema coverage, migration, seed, drift, guards, and CI evidence exist", () => {
    const plan = buildPrismaSchemaLifecycleReadinessPlan({
      packageScripts: {
        "db:validate": "prisma validate",
        "db:generate": "prisma generate",
        "db:migrate": "prisma migrate dev",
        "db:seed": "tsx prisma/seed.ts",
        "db:verify-seed": "node ../../scripts/db/verify-seed-readiness.mjs",
      },
      schemaModelsCount: 44,
      schemaEnumsCount: 36,
      minimumExpectedModels: 44,
      minimumExpectedEnums: 36,
      postgresProvisioned: true,
      databaseUrlConfigured: true,
      directUrlConfigured: true,
      prismaValidatePassed: true,
      prismaGeneratePassed: true,
      migrationGenerated: true,
      migrationSqlReviewed: true,
      migrationAppliedToDevDb: true,
      seedScriptPassed: true,
      seedReadinessVerified: true,
      destructiveProductionUrlGuarded: true,
      migrationDriftChecked: true,
      commandEvidenceCaptured: true,
      ciEvidenceCaptured: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.schemaCoverageStatus).toBe("pass");
    expect(plan.blockers).toEqual([]);
  });

  it("marks DB integration runtime ready only after lifecycle, seeded tenant, isolation, audit, transcript, and CI evidence exist", () => {
    const plan = buildDbIntegrationRuntimeReadinessPlan({
      packageScripts: {
        "db:validate": "prisma validate",
        "db:generate": "prisma generate",
        "db:migrate": "prisma migrate dev",
        "db:seed": "tsx prisma/seed.ts",
        "db:verify-seed": "tsx scripts/verify-seed-readiness.ts",
      },
      postgresProvisioned: true,
      databaseUrlConfigured: true,
      prismaValidatePassed: true,
      prismaGeneratePassed: true,
      prismaMigratePassed: true,
      prismaSeedPassed: true,
      seedVerificationPassed: true,
      tenantIsolationTestsPassed: true,
      workflowPersistenceTestsPassed: true,
      auditLogIntegrationTestsPassed: true,
      destructiveResetGuarded: true,
      migrationRollbackDocumented: true,
      commandOutputCaptured: true,
      ciDbJobPassed: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });

  it("blocks seed runtime execution evidence until a real dev database is generated, migrated, seeded, queried, smoked, and captured safely", () => {
    const plan = buildSeedRuntimeExecutionEvidencePlan({
      packageScripts: {
        "db:validate": "prisma validate",
        "db:generate": "prisma generate",
        "db:migrate": "prisma migrate dev",
        "db:verify-seed": "node ../../scripts/db/verify-seed-readiness.mjs",
      },
      seedReadinessVerifierPassed: true,
      postgresProvisioned: false,
      databaseUrlConfigured: false,
      prismaClientGenerated: false,
      migrationApplied: false,
      seedCommandPassed: false,
      seededTenantFound: false,
      seededTenantMembersFound: false,
      seededBookingWorkflowFound: false,
      seededPaymentsFilesMessagesFound: false,
      seededSeoReleaseFlagsFound: false,
      auditLogsCreated: false,
      fakeDataOnlyVerified: false,
      noProductionProviderCredentialsUsed: false,
      webApiSeededDataSmokePassed: false,
      dashboardSeededDataSmokePassed: false,
      commandEvidenceCaptured: false,
      ciOrCleanCheckoutEvidenceCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["db:seed"]);
    expect(plan.requiredCommands).toBe(seedRuntimeExecutionEvidenceCommands);
    expect(plan.requiredEvidence).toBe(seedRuntimeExecutionRequiredEvidence);
    expect(plan.blockers).toContain("A non-production Postgres database must be provisioned for seed execution.");
    expect(plan.blockers).toContain("Seeded demo tenant must be readable after seed execution.");
    expect(plan.blockers).toContain("Seed execution must not use production provider credentials or live provider endpoints.");
  });

  it("marks seed runtime execution evidence ready when fake seeded data is generated, migrated, queried, smoked, and captured safely", () => {
    const plan = buildSeedRuntimeExecutionEvidencePlan({
      packageScripts: {
        "db:validate": "prisma validate",
        "db:generate": "prisma generate",
        "db:migrate": "prisma migrate dev",
        "db:seed": "tsx prisma/seed.ts",
        "db:verify-seed": "node ../../scripts/db/verify-seed-readiness.mjs",
      },
      seedReadinessVerifierPassed: true,
      postgresProvisioned: true,
      databaseUrlConfigured: true,
      prismaClientGenerated: true,
      migrationApplied: true,
      seedCommandPassed: true,
      seededTenantFound: true,
      seededTenantMembersFound: true,
      seededBookingWorkflowFound: true,
      seededPaymentsFilesMessagesFound: true,
      seededSeoReleaseFlagsFound: true,
      auditLogsCreated: true,
      fakeDataOnlyVerified: true,
      noProductionProviderCredentialsUsed: true,
      webApiSeededDataSmokePassed: true,
      dashboardSeededDataSmokePassed: true,
      commandEvidenceCaptured: true,
      ciOrCleanCheckoutEvidenceCaptured: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });
});
