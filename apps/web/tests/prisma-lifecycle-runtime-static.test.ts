import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  prismaLifecycleArtifactPaths,
  prismaLifecycleCommands,
  prismaLifecyclePackageScripts,
  prismaLifecycleReadiness,
  prismaLifecycleRunPersistenceContract,
  prismaLifecycleRuntimeMatrix,
} from "../lib/prismaLifecycleRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Prisma lifecycle runtime contract", () => {
  const dbPackageJson = readRepoFile("packages/db/package.json");
  const schema = readRepoFile("packages/db/prisma/schema.prisma");
  const seed = readRepoFile("packages/db/prisma/seed.ts");
  const integrationReadiness = readRepoFile("packages/db/src/integration-readiness.ts");
  const dbTests = readRepoFile("packages/db/tests/db-integration-plan.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaLifecycleMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609032600_add_prisma_lifecycle_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins Prisma lifecycle scripts, commands, matrix rows, and artifacts", () => {
    expect(prismaLifecycleCommands).toEqual([
      "pnpm --filter @inkroute/db db:validate",
      "pnpm --filter @inkroute/db db:generate",
      "pnpm --filter @inkroute/db db:migrate",
      "pnpm db:verify-seed",
      "pnpm --filter @inkroute/db db:seed",
      "Prisma migration SQL review",
      "Prisma migration drift check",
      "GitHub Actions DB lifecycle evidence job",
    ]);
    expect(prismaLifecyclePackageScripts).toEqual([
      "db:validate",
      "db:generate",
      "db:migrate",
      "db:seed",
      "db:verify-seed",
    ]);
    expect(prismaLifecycleRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "schema-validate",
      "client-generate",
      "migration-generate-apply",
      "seed-readiness",
      "seed-execution",
      "migration-sql-review",
      "migration-drift-check",
      "production-url-guard",
      "ci-db-lifecycle",
    ]);
    expect(prismaLifecycleArtifactPaths).toContain("coverage/prisma-lifecycle-runtime.json");
    expect(prismaLifecycleArtifactPaths).toContain("test-results/prisma-lifecycle-runtime");
  });

  it("pins the PrismaLifecycleRun persistence model and migration", () => {
    expect(prismaLifecycleRunPersistenceContract.model).toBe("PrismaLifecycleRun");
    expect(prismaLifecycleRunPersistenceContract.tenantRelation).toBe("prismaLifecycleRuns");
    expect(prismaLifecycleRunPersistenceContract.migration).toBe("20260609032600_add_prisma_lifecycle_runs");
    expect(prismaLifecycleRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "packageScriptManifest",
      "artifactManifest",
      "sqlReviewManifest",
      "driftCheckManifest",
    ]);
    expect(prismaLifecycleRunPersistenceContract.evidenceBooleans).toContain("postgresProvisioned");
    expect(prismaLifecycleRunPersistenceContract.evidenceBooleans).toContain("migrationSqlReviewed");
    expect(prismaLifecycleRunPersistenceContract.evidenceBooleans).toContain("destructiveProductionUrlGuarded");
    expect(prismaLifecycleRunPersistenceContract.artifactFields).toContain("driftCheckArtifactPath");
    expect(prismaLifecycleRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(schema).toContain("prismaLifecycleRuns PrismaLifecycleRun[]");
    expect(schema).toContain("model PrismaLifecycleRun");
    expect(schema).toContain("sqlReviewManifest");
    expect(schema).toContain("migrationDriftChecked");
    expect(schema).toContain("@@unique([tenantId, runId])");
    expect(prismaLifecycleMigration).toContain('CREATE TABLE "PrismaLifecycleRun"');
    expect(prismaLifecycleMigration).toContain('"sqlReviewManifest" JSONB NOT NULL');
    expect(prismaLifecycleMigration).toContain('"migrationDriftChecked" BOOLEAN NOT NULL DEFAULT false');
    expect(prismaLifecycleMigration).toContain('CREATE UNIQUE INDEX "PrismaLifecycleRun_tenantId_runId_key"');
  });

  it("keeps Prisma schema, seed, package scripts, helper, and tests wired", () => {
    for (const scriptName of prismaLifecyclePackageScripts) {
      expect(dbPackageJson).toContain(`"${scriptName}"`);
    }
    expect(schema).toContain("model Tenant");
    expect(schema).toContain("enum");
    expect(seed).toContain("seed");
    expect(integrationReadiness).toContain("buildPrismaSchemaLifecycleReadinessPlan");
    expect(dbTests).toContain("buildPrismaSchemaLifecycleReadinessPlan");
  });

  it("keeps schema coverage wired while DB lifecycle evidence remains gated", () => {
    expect(prismaLifecycleReadiness.status).toBe("blocked");
    expect(prismaLifecycleReadiness.missingScripts).toEqual([]);
    expect(prismaLifecycleReadiness.schemaCoverageStatus).toBe("pass");
    expect(prismaLifecycleReadiness.requiredCommands).toEqual([...prismaLifecycleCommands]);
    expect(prismaLifecycleReadiness.requiredEvidence).toEqual([
      "Phase 2 schema model/enum coverage remains intact.",
      "Non-production Postgres provisioning plus DATABASE_URL and DIRECT_URL configuration proof.",
      "Prisma validate/generate/migrate command output.",
      "Generated migration SQL review notes and drift-check output.",
      "Seed readiness and seed execution output using fake/demo data only.",
      "Production URL destructive-command guard proof.",
      "CI or clean-checkout Prisma lifecycle evidence.",
    ]);
    expect(prismaLifecycleReadiness.blockers).toContain("A non-production Postgres database must be provisioned.");
    expect(prismaLifecycleReadiness.blockers).toContain("Prisma schema validation must pass.");
  });

  it("wires CI, manifest, tracker, and artifacts without touching real database state", () => {
    expect(ciWorkflow).toContain("Run Phase 2 Prisma lifecycle runtime contracts");
    expect(ciWorkflow).toContain("prisma-lifecycle-runtime-static.test.ts");
    expect(ciWorkflow).toContain("prisma-lifecycle-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-prisma-lifecycle-runtime-static");
    expect(unitManifest).toContain("PrismaLifecycleRun Prisma model and app row contract");
    expect(gapTracker).toContain("PrismaLifecycleRun");
    expect(gapTracker).toContain("apps/web/lib/prismaLifecycleRuntime.ts");
    expect(gapTracker).toContain("live non-production Postgres provisioning, Prisma validate/generate/migrate, SQL review, seed, drift, command evidence, and CI evidence remain open");
  });
});
