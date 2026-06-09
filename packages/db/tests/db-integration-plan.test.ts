import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildDbIntegrationRuntimeReadinessPlan } from "../src/index";

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

    for (const model of [
      "Tenant",
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
    expect(schema).toContain("actorId");
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
    expect(plan.requiredCommands).toContain("pnpm --filter @inkroute/db test -- db-integration");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "non-production Postgres provisioning, DATABASE_URL configuration, and destructive-reset guard proof",
      "Prisma validate/generate/migrate/seed/verify command output",
      "tenant isolation, workflow persistence, and audit-log integration test output",
      "migration rollback notes, captured command transcript, and CI DB job artifact",
    ]));
    expect(plan.blockers).toContain("Tenant-isolation integration tests must deny cross-tenant reads and writes across critical models.");
    expect(plan.blockers).toContain("Audit-log integration tests must prove tenant-scoped actor, entity, action, and metadata writes.");
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
});
