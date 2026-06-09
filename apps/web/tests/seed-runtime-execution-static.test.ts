import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  seedRuntimeExecutionArtifactPaths,
  seedRuntimeExecutionCommands,
  seedRuntimeExecutionMatrix,
  seedRuntimeExecutionReadiness,
  seedRuntimeExecutionRunPersistenceContract,
} from "../lib/seedRuntimeExecution";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("seed runtime execution contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const dbPackageJson = readRepoFile("packages/db/package.json");
  const seed = readRepoFile("packages/db/prisma/seed.ts");
  const seedReadiness = readRepoFile("packages/db/prisma/seed-readiness.json");
  const seedVerifier = readRepoFile("scripts/db/verify-seed-readiness.mjs");
  const seedDocs = readRepoFile("docs/db/SEED_READINESS.md");
  const integrationReadiness = readRepoFile("packages/db/src/integration-readiness.ts");
  const dbTests = readRepoFile("packages/db/tests/db-integration-plan.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const seedRuntimeExecutionRunMigration = readRepoFile("packages/db/prisma/migrations/20260609034100_add_seed_runtime_execution_runs/migration.sql");

  it("pins seed runtime commands, matrix rows, and artifact paths", () => {
    expect(seedRuntimeExecutionCommands).toEqual([
      "pnpm db:verify-seed",
      "pnpm --filter @inkroute/db db:validate",
      "pnpm --filter @inkroute/db db:generate",
      "pnpm --filter @inkroute/db db:migrate",
      "pnpm --filter @inkroute/db db:seed",
      "seeded demo tenant query smoke",
      "web/API seeded-data smoke",
      "dashboard seeded-data smoke",
      "GitHub Actions seed execution evidence job",
    ]);
    expect(seedRuntimeExecutionMatrix.map((entry) => entry.id)).toEqual([
      "seed-readiness-safety",
      "non-production-postgres-url",
      "prisma-generate-migrate",
      "seed-command",
      "seeded-core-domain-queries",
      "seeded-workflow-payment-message-seo-release-queries",
      "web-dashboard-seeded-data-smoke",
      "command-ci-clean-checkout-evidence",
    ]);
    expect(seedRuntimeExecutionArtifactPaths).toContain("coverage/seed-runtime-execution.json");
    expect(seedRuntimeExecutionArtifactPaths).toContain("coverage/seed-ci-clean-checkout-evidence.json");
    expect(seedRuntimeExecutionArtifactPaths).toContain("test-results/seed-runtime-execution");
  });

  it("keeps seed scripts, fake-data contract, verifier, docs, helper, and tests wired", () => {
    expect(rootPackageJson).toContain('"db:verify-seed"');
    for (const scriptName of ["db:validate", "db:generate", "db:migrate", "db:seed", "db:verify-seed"]) {
      expect(dbPackageJson).toContain(`"${scriptName}"`);
    }
    for (const requiredSeed of [
      "prisma.tenant.upsert",
      "prisma.tenantMember.upsert",
      "prisma.bookingRequest.upsert",
      "prisma.payment.upsert",
      "prisma.message.upsert",
      "prisma.notification.upsert",
      "prisma.seoCityPage.upsert",
      "prisma.featureFlag.upsert",
      "prisma.releaseRecord.upsert",
      "prisma.auditLog.create",
    ]) {
      expect(seed).toContain(requiredSeed);
    }
    expect(seed).toContain("Use fake data only");
    expect(seedReadiness).toContain("fake");
    expect(seedVerifier).toContain("seed-readiness.json");
    expect(seedDocs).toContain("Seed readiness");
    expect(integrationReadiness).toContain("buildSeedRuntimeExecutionEvidencePlan");
    expect(dbTests).toContain("buildSeedRuntimeExecutionEvidencePlan");
  });

  it("keeps seed execution blocked until dev database, migrations, seed run, queries, smokes, and evidence exist", () => {
    expect(seedRuntimeExecutionReadiness.status).toBe("blocked");
    expect(seedRuntimeExecutionReadiness.missingScripts).toEqual([]);
    expect(seedRuntimeExecutionReadiness.requiredCommands).toEqual([...seedRuntimeExecutionCommands]);
    expect(seedRuntimeExecutionReadiness.requiredEvidence).toEqual([
      "seed readiness, fake-data, legal-placeholder, and production-provider ban evidence",
      "non-production Postgres, DATABASE_URL, Prisma generate, migration, and seed command evidence",
      "seeded tenant, membership, workflow, payment/file/message, SEO/release/flag, and audit-log query evidence",
      "web/API and dashboard seeded-data smoke evidence",
      "captured command transcript and CI or clean-checkout seed evidence",
    ]);
    expect(seedRuntimeExecutionReadiness.blockers).toContain(
      "A non-production Postgres database must be provisioned for seed execution.",
    );
    expect(seedRuntimeExecutionReadiness.blockers).toContain(
      "Seeded demo tenant must be readable after seed execution.",
    );
    expect(seedRuntimeExecutionReadiness.blockers).toContain(
      "Seed execution must not use production provider credentials or live provider endpoints.",
    );
  });

  it("pins the SeedRuntimeExecutionRun persistence model and migration", () => {
    expect(seedRuntimeExecutionRunPersistenceContract).toEqual({
      prismaModel: "SeedRuntimeExecutionRun",
      tenantRelation: "seedRuntimeExecutionRuns",
      migration: "20260609034100_add_seed_runtime_execution_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesReadinessStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesDatabaseProvisioningEvidence: true,
      storesPrismaLifecycleEvidence: true,
      storesSeedCommandEvidence: true,
      storesSeededDomainQueryEvidence: true,
      storesAppSmokeEvidence: true,
      storesCommandTranscriptEvidence: true,
      storesCiCleanCheckoutEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(prismaSchema).toContain("model SeedRuntimeExecutionRun");
    expect(prismaSchema).toContain("seedRuntimeExecutionRuns SeedRuntimeExecutionRun[]");
    expect(prismaSchema).toContain("databaseProvisioningEvidenceCaptured");
    expect(prismaSchema).toContain("seededDomainQueryEvidenceCaptured");
    expect(prismaSchema).toContain("secretSafeArtifactsCaptured");
    expect(seedRuntimeExecutionRunMigration).toContain('CREATE TABLE "SeedRuntimeExecutionRun"');
    expect(seedRuntimeExecutionRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(seedRuntimeExecutionRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(seedRuntimeExecutionRunMigration).toContain('"SeedRuntimeExecutionRun_tenantId_runId_key"');
  });

  it("wires CI, manifest, tracker, and artifacts without claiming live seed execution readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 2 seed runtime execution contracts");
    expect(ciWorkflow).toContain("seed-runtime-execution-static.test.ts");
    expect(ciWorkflow).toContain("seed-runtime-execution-artifacts");
    expect(ciWorkflow).toContain("coverage/seed-runtime-execution.json");
    expect(unitManifest).toContain("unit-web-seed-runtime-execution-static");
    expect(unitManifest).toContain("SeedRuntimeExecutionRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/seedRuntimeExecution.ts");
    expect(gapTracker).toContain("SeedRuntimeExecutionRun Prisma model and app row contract");
    expect(gapTracker).toContain("live non-production Postgres provisioning, DATABASE_URL, Prisma generate/migrate, seed command, seeded-domain queries, web/API and dashboard smokes, command transcript, and CI or clean-checkout evidence remain open");
  });
});
