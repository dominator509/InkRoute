import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedSeedRuntimeExecutionArtifact,
  buildSeedRuntimeExecutionEvidenceDecision,
  buildSeedRuntimeExecutionArtifactReview,
  buildSeedRuntimeExecutionPlan,
  buildSeedRuntimeExecutionRunData,
  persistSeedRuntimeExecutionRun,
  seedRuntimeExecutionArtifactPaths,
  seedRuntimeExecutionCommands,
  seedRuntimeExecutionEvidenceFlags,
  seedRuntimeExecutionExternalArtifacts,
  seedRuntimeExecutionExternalCommands,
  seedRuntimeExecutionLocalArtifacts,
  seedRuntimeExecutionLocalCommands,
  seedRuntimeExecutionMatrix,
  seedRuntimeExecutionPolicy,
  seedRuntimeExecutionProofFiles,
  seedRuntimeExecutionReadiness,
  seedRuntimeExecutionRequiredExternalEvidence,
  seedRuntimeExecutionRunPersistenceContract,
} from "../lib/seedRuntimeExecution";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("seed runtime execution contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const dbPackageJson = readRepoFile("packages/db/package.json");
  const seed = readRepoFile("packages/db/prisma/seed.ts");
  const seedReadiness = readRepoFile("packages/db/prisma/seed-readiness.json");
  const seedVerifier = readRepoFile("scripts/db/verify-seed-readiness.mjs");
  const seedRuntimeEvidenceWriter = readRepoFile("scripts/db/write-seed-runtime-evidence.mjs");
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
      "pnpm db:seed-runtime-evidence",
      "provision non-production Postgres and configure DATABASE_URL",
      "pnpm --filter @inkroute/db db:validate",
      "pnpm --filter @inkroute/db db:generate",
      "pnpm --filter @inkroute/db db:migrate",
      "pnpm --filter @inkroute/db db:seed",
      "seeded demo tenant query smoke",
      "seeded workflow, payment, file, message, SEO, release, flag, and audit query smoke",
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
    expect(rootPackageJson).toContain('"db:seed-runtime-evidence"');
    expect(dbPackageJson).toContain('"db:seed-runtime-evidence"');
    for (const scriptName of ["db:validate", "db:generate", "db:migrate", "db:seed", "db:verify-seed", "db:seed-runtime-evidence"]) {
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
    expect(seedRuntimeEvidenceWriter).toContain("coverage/seed-runtime-execution.json");
    expect(seedRuntimeEvidenceWriter).toContain("coverage/seed-ci-clean-checkout-evidence.json");
    expect(seedRuntimeEvidenceWriter).toContain("coverage/seed-fake-data-legal-placeholder-proof.json");
    expect(seedRuntimeEvidenceWriter).toContain("coverage/seed-production-provider-ban.json");
    expect(seedRuntimeEvidenceWriter).toContain("coverage/seed-command-transcript-redacted.log");
    expect(seedRuntimeEvidenceWriter).toContain("productionProviderCredentialsUsed: false");
    expect(seedDocs).toContain("Seed readiness");
    expect(integrationReadiness).toContain("buildSeedRuntimeExecutionEvidencePlan");
    expect(dbTests).toContain("buildSeedRuntimeExecutionEvidencePlan");
  });

  it("keeps seed execution blocked until dev database, migrations, seed run, queries, smokes, and evidence exist", () => {
    expect(seedRuntimeExecutionReadiness.status).toBe("blocked");
    expect(seedRuntimeExecutionReadiness.missingScripts).toEqual([]);
    expect(seedRuntimeExecutionReadiness.requiredCommands).toBe(seedRuntimeExecutionCommands);
    expect(seedRuntimeExecutionReadiness.requiredEvidence).toBe(seedRuntimeExecutionEvidenceFlags);
    expect(seedRuntimeExecutionReadiness.missingEvidence).not.toContain("seedReadinessVerifierPassed");
    expect(seedRuntimeExecutionReadiness.missingEvidence).not.toContain("fakeDataOnlyVerified");
    expect(seedRuntimeExecutionReadiness.missingEvidence).not.toContain("noProductionProviderCredentialsUsed");
    expect(seedRuntimeExecutionReadiness.missingEvidence).not.toContain("commandEvidenceCaptured");
    expect(seedRuntimeExecutionReadiness.missingEvidence).not.toContain("ciOrCleanCheckoutEvidenceCaptured");
    expect(seedRuntimeExecutionReadiness.blockers).toContain(
      "A non-production Postgres database must be provisioned for seed execution.",
    );
    expect(seedRuntimeExecutionReadiness.blockers).toContain(
      "Seeded demo tenant must be readable after seed execution.",
    );
    expect(seedRuntimeExecutionReadiness.blockers).not.toContain(
      "Seed execution must not use production provider credentials or live provider endpoints.",
    );
    expect(seedRuntimeExecutionReadiness.blockers).not.toContain(
      "CI or clean-checkout seed execution evidence must be captured.",
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
    expect(buildSeedRuntimeExecutionRunData).toBeTypeOf("function");
    expect(persistSeedRuntimeExecutionRun).toBeTypeOf("function");
    expect(readRepoFile("apps/web/lib/seedRuntimeExecution.ts")).toContain("repository.seedRuntimeExecutionRun.upsert");
  });

  it("blocks seed runtime completion when database, seed query, smoke, or safe-evidence proof is missing", () => {
    const decision = buildSeedRuntimeExecutionEvidenceDecision({
      commands: ["pnpm db:verify-seed"],
      artifacts: ["coverage/seed-readiness-verifier-output.txt"],
      evidence: {
        seedReadinessVerifierPassed: true,
        fakeDataOnlyVerified: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("pnpm --filter @inkroute/db db:seed");
    expect(decision.missingArtifacts).toContain("coverage/seed-ci-clean-checkout-evidence.json");
    expect(decision.missingEvidence).toContain("postgresProvisioned");
    expect(decision.missingEvidence).toContain("noProductionProviderCredentialsUsed");
    expect(decision.blockers).toContain("A non-production Postgres database must be provisioned for seed execution.");
    expect(decision.blockers).toContain(
      "Seed execution must not use production provider credentials or live provider endpoints.",
    );
  });

  it("completes seed runtime execution only when every command, artifact, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(seedRuntimeExecutionEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildSeedRuntimeExecutionEvidenceDecision({
      commands: seedRuntimeExecutionCommands,
      artifacts: seedRuntimeExecutionArtifactPaths,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(seedRuntimeExecutionEvidenceFlags);
  });

  it("keeps seed runtime execution classified, redacted, and database-gated", () => {
    const executionPlan = buildSeedRuntimeExecutionPlan();
    expect(executionPlan.localCommands).toBe(seedRuntimeExecutionLocalCommands);
    expect(executionPlan.localCommands).toEqual(["pnpm db:verify-seed", "pnpm db:seed-runtime-evidence"]);
    expect(executionPlan.externalCommands).toBe(seedRuntimeExecutionExternalCommands);
    expect(executionPlan.localArtifacts).toBe(seedRuntimeExecutionLocalArtifacts);
    expect(executionPlan.externalArtifacts).toBe(seedRuntimeExecutionExternalArtifacts);
    expect(executionPlan.externalCommands).toContain("provision non-production Postgres and configure DATABASE_URL");
    expect(executionPlan.externalCommands).toContain("pnpm --filter @inkroute/db db:seed");
    expect(executionPlan.localArtifacts).toContain("coverage/seed-command-transcript-redacted.log");
    expect(executionPlan.externalArtifacts).toContain("coverage/seed-database-url-redacted.json");
    expect(executionPlan.externalArtifacts).toContain("test-results/seed-runtime-execution");
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.providerPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(seedRuntimeExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticSeedReadiness: true,
      nonProductionDatabaseRequiredForClosure: true,
      databaseUrlRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(seedRuntimeExecutionRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Provider-backed SeedRuntimeExecutionRun persistence row captured through persistSeedRuntimeExecutionRun.",
    );

    const artifact = {
      databaseUrl: "postgres://inkroute:secret@db.example.com:5432/inkroute",
      seededTenantId: "tenant_seed_1234567890abcdefghijklmnopqrstuvwxyz",
      clientEmail: "client@example.com",
      clientPhone: "+1 555 222 1212",
      commandTranscript: "DATABASE_URL=postgres://inkroute:secret@db.example.com:5432/inkroute pnpm db:seed",
      nested: {
        providerToken: "github_pat_abcdefghijklmnopqrstuvwxyz123456",
        publicSummary: "seed runtime evidence captured",
      },
    };
    const redactedOnly = buildRedactedSeedRuntimeExecutionArtifact(artifact);
    const review = buildSeedRuntimeExecutionArtifactReview(artifact);
    const serialized = JSON.stringify(review.artifact);

    expect(JSON.stringify(redactedOnly)).not.toContain("postgres://inkroute:secret@db.example.com:5432/inkroute");
    expect(serialized).not.toContain("tenant_seed_1234567890abcdefghijklmnopqrstuvwxyz");
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("+1 555 222 1212");
    expect(serialized).not.toContain("github_pat_abcdefghijklmnopqrstuvwxyz123456");
    expect(review.redactions).toEqual([
      "databaseUrl",
      "seededTenantId",
      "clientEmail",
      "clientPhone",
      "commandTranscript",
      "nested.providerToken",
    ]);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(seedRuntimeExecutionRequiredExternalEvidence);
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
    expect(gapTracker).toContain("SeedRuntimeExecutionRun upsert seam is source-wired");
    expect(gapTracker).toContain("GAP-018 is seed-runtime-execution-matrix wired with evidence classifier");
    expect(gapTracker).toContain("proof inventory");
    expect(gapTracker).toContain("buildSeedRuntimeExecutionPlan");
    expect(gapTracker).toContain("seedRuntimeExecutionLocalCommands/seedRuntimeExecutionExternalCommands");
    expect(gapTracker).toContain("seedRuntimeExecutionPolicy");
    expect(gapTracker).toContain("seedRuntimeExecutionRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedSeedRuntimeExecutionArtifact");
    expect(gapTracker).toContain("buildSeedRuntimeExecutionArtifactReview");
  });

  it("pins current seed runtime execution proof files for GAP-018", () => {
    expect(seedRuntimeExecutionProofFiles).toContain("packages/db/package.json");
    expect(seedRuntimeExecutionProofFiles).toContain("scripts/db/write-seed-runtime-evidence.mjs");
    expect(seedRuntimeExecutionProofFiles).toContain("apps/web/lib/seedRuntimeExecution.ts");
    expect(seedRuntimeExecutionProofFiles).toContain("apps/web/tests/seed-runtime-execution-static.test.ts");
    for (const proofFile of seedRuntimeExecutionProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});


