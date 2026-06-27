import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedDbIntegrationRuntimeArtifact,
  buildDbIntegrationRuntimeArtifactReview,
  buildDbIntegrationRuntimeEvidenceDecision,
  buildDbIntegrationRuntimeExecutionPlan,
  buildDbIntegrationRunData,
  buildDbIntegrationRunPersistenceContract,
  dbIntegrationRunPersistencePreview,
  dbIntegrationRuntimeArtifactPaths,
  dbIntegrationRuntimeCommands,
  dbIntegrationRuntimeExternalArtifacts,
  dbIntegrationRuntimeExternalCommands,
  dbIntegrationRuntimeExecutionPolicy,
  dbIntegrationRuntimeLocalArtifacts,
  dbIntegrationRuntimeLocalCommands,
  dbIntegrationRuntimeMatrix,
  dbIntegrationRuntimeProofFiles,
  dbIntegrationRuntimeRequiredExternalEvidence,
  dbIntegrationRuntimeReadiness,
  persistDbIntegrationRun
} from "../src/db-integration-runtime";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const packageJson = read("packages/db/package.json");
const dbManifest = read("testing/manifests/db-integration-test-manifest.json");
const manifestVerifier = read("testing/scripts/verify-test-manifest.mjs");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");

describe("GAP-107 DB integration runtime wiring", () => {
  it("pins Prisma lifecycle, seed, integration, guard, transcript, and CI artifacts", () => {
    expect(dbIntegrationRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/db db:validate",
      "pnpm --filter @inkroute/db db:generate",
      "pnpm --filter @inkroute/db db:migrate",
      "pnpm --filter @inkroute/db db:seed",
      "pnpm --filter @inkroute/db db:verify-seed",
      "pnpm --filter @inkroute/db test -- db-integration"
    ]);
    expect(dbIntegrationRuntimeArtifactPaths).toEqual(
      expect.arrayContaining([
        "coverage/db-integration-runtime.json",
        "coverage/db-postgres-provisioning-redacted.json",
        "coverage/db-prisma-validate.log",
        "coverage/db-prisma-generate.log",
        "coverage/db-prisma-migrate.log",
        "coverage/db-seed-execution.log",
        "coverage/db-seed-verification.json",
        "coverage/db-tenant-isolation-results.json",
        "coverage/db-workflow-persistence-results.json",
        "coverage/db-audit-log-integration-results.json",
        "coverage/db-destructive-reset-guard.json",
        "coverage/db-migration-rollback.md",
        "coverage/db-command-transcript-redacted.log",
        "coverage/db-ci-run-redacted.json",
        "test-results/db-integration-runtime"
      ])
    );
    expect(dbIntegrationRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "non-production-postgres",
      "prisma-validate-generate",
      "prisma-migrate-seed",
      "seed-verification",
      "tenant-isolation",
      "workflow-persistence",
      "audit-log-integration",
      "destructive-reset-guard",
      "rollback-transcript-ci"
    ]);
  });

  it("keeps package scripts and DB manifest lifecycle coverage wired", () => {
    for (const script of ["db:validate", "db:generate", "db:migrate", "db:seed", "db:verify-seed"]) {
      expect(packageJson).toContain(`"${script}"`);
    }
    for (const command of dbIntegrationRuntimeCommands.slice(0, 5)) {
      expect(dbManifest).toContain(command);
    }
    expect(dbManifest).toContain("db-prisma-schema-lifecycle");
    expect(dbManifest).toContain("db-tenant-isolation");
    expect(dbManifest).toContain("db-workflow-audit");
    expect(dbManifest).toContain("packages/db/prisma/tenant-isolation-contract.json");
    expect(manifestVerifier).toContain("testing/manifests/db-integration-test-manifest.json");
    expect(manifestVerifier).toContain("packages/db/tests/db-integration-plan.test.ts");
  });

  it("keeps runtime readiness blocked until real database evidence exists", () => {
    expect(dbIntegrationRuntimeReadiness.status).toBe("blocked");
    expect(dbIntegrationRuntimeReadiness.missingScripts).toEqual([]);
    expect(dbIntegrationRuntimeReadiness.requiredCommands).toBe(dbIntegrationRuntimeCommands);
    expect(dbIntegrationRuntimeReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "non-production Postgres provisioning, DATABASE_URL configuration, and destructive-reset guard proof",
        "Prisma validate/generate/migrate/seed/verify command output",
        "tenant isolation, workflow persistence, and audit-log integration test output",
        "migration rollback notes, captured command transcript, and CI DB job artifact"
      ])
    );
    expect(dbIntegrationRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "A non-production Postgres database must be provisioned for integration tests.",
        "Tenant-isolation integration tests must deny cross-tenant reads and writes across critical models.",
        "Audit-log integration tests must prove tenant-scoped actor, entity, action, and metadata writes.",
        "CI database integration job must pass or publish an explicit non-production DB evidence artifact."
      ])
    );
  });

  it("pins current DB integration runtime proof files for GAP-107", () => {
    expect(dbIntegrationRuntimeProofFiles).toEqual(
      expect.arrayContaining([
        "packages/db/src/db-integration-runtime.ts",
        "packages/db/tests/db-integration-runtime-static.test.ts",
        "packages/db/prisma/migrations/20260609010000_add_db_integration_runs/migration.sql",
        "testing/manifests/db-integration-test-manifest.json",
        ".github/workflows/ci.yml",
      ]),
    );
    for (const file of dbIntegrationRuntimeProofFiles) {
      expect(read(file).length).toBeGreaterThan(0);
    }
  });

  it("pins durable DbIntegrationRun rows, lifecycle flags, tenant isolation, transcript, rollback, and CI artifacts", () => {
    const schema = read("packages/db/prisma/schema.prisma");
    const contract = buildDbIntegrationRunPersistenceContract({
      tenantId: "tenant_demo",
      runId: "db-integration-demo",
      commitSha: "abc1234",
      status: "database_gated",
      runtimeMatrix: dbIntegrationRuntimeMatrix,
      artifactManifest: dbIntegrationRuntimeArtifactPaths,
      nonProductionPostgresProvisioned: false,
      databaseUrlConfigured: false,
      directUrlConfigured: false,
      prismaValidatePassed: false,
      prismaGeneratePassed: false,
      prismaMigratePassed: false,
      prismaSeedPassed: false,
      seedVerificationPassed: false,
      tenantIsolationPassed: false,
      workflowPersistencePassed: false,
      auditLogIntegrationPassed: false,
      destructiveResetGuarded: false,
      rollbackDocumented: false,
      redactedTranscriptPath: "coverage/db-command-transcript-redacted.log",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/redacted"
    });

    expect(schema).toContain("model DbIntegrationRun");
    expect(schema).toContain("nonProductionPostgresProvisioned");
    expect(schema).toContain("redactedTranscriptPath");
    expect(schema).toContain("@@unique([tenantId, runId])");
    expect(contract.transactionWrites).toEqual(["DbIntegrationRun", "AuditLog"]);
    expect(contract.requiredDbFlags).toContain("tenantIsolationPassed");
    expect(contract.artifactFields).toContain("redactedTranscriptPath");
    expect(contract.tenantIsolationKey).toBe("tenantId");
    expect(dbIntegrationRunPersistencePreview.modelName).toBe("DbIntegrationRun");
    const runData = buildDbIntegrationRunData(contract.row);
    expect(runData).toMatchObject({
      tenantId: "tenant_demo",
      runId: "db-integration-demo",
      status: "database_gated",
      redactedTranscriptPath: "coverage/db-command-transcript-redacted.log",
    });
    expect(persistDbIntegrationRun).toBeTypeOf("function");
    expect(String(persistDbIntegrationRun)).toContain("repository.dbIntegrationRun.upsert");
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 14 DB integration runtime contracts");
    expect(ciWorkflow).toContain("packages/db/tests/db-integration-runtime-static.test.ts");
    expect(ciWorkflow).toContain("db-integration-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/db-command-transcript-redacted.log");
    expect(ciWorkflow).toContain("test-results/db-integration-runtime");
    expect(unitManifest).toContain("unit-db-integration-runtime-static");
    expect(unitManifest).toContain("DbIntegrationRun Prisma model and app row contract are wired");
    expect(gapTracker).toContain("packages/db/src/db-integration-runtime.ts");
    expect(gapTracker).toContain("DB integration evidence classifier wired and Postgres proof gated");
    expect(gapTracker).toContain("GAP-107 is db-integration-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("dbIntegrationRuntimeLocalCommands");
    expect(gapTracker).toContain("dbIntegrationRuntimeExternalCommands");
    expect(gapTracker).toContain("dbIntegrationRuntimeLocalArtifacts");
    expect(gapTracker).toContain("dbIntegrationRuntimeExternalArtifacts");
    expect(gapTracker).toContain("persistDbIntegrationRun upsert seam");
  });

  it("classifies GAP-107 evidence as blocked until non-production Postgres integration proof is captured", () => {
    const blockedDecision = buildDbIntegrationRuntimeEvidenceDecision({
      nonProductionPostgresProvisioned: false,
      databaseUrlConfigured: false,
      directUrlConfigured: false,
      prismaValidatePassed: true,
      prismaGeneratePassed: true,
      prismaMigratePassed: false,
      prismaSeedPassed: false,
      seedVerificationPassed: false,
      tenantIsolationPassed: false,
      workflowPersistencePassed: false,
      auditLogIntegrationPassed: false,
      destructiveResetGuarded: true,
      rollbackDocumented: false,
      commandTranscriptCaptured: true,
      ciDbArtifactCaptured: false,
      requiredCommandsRun: dbIntegrationRuntimeCommands.filter(
        (command) =>
          command !== "pnpm --filter @inkroute/db db:migrate" &&
          command !== "pnpm --filter @inkroute/db db:seed" &&
          command !== "pnpm --filter @inkroute/db test -- db-integration",
      ),
      capturedArtifacts: [
        "coverage/db-integration-runtime.json",
        "coverage/db-prisma-validate.log",
        "coverage/db-prisma-generate.log",
        "coverage/db-destructive-reset-guard.json",
        "coverage/db-command-transcript-redacted.log",
        "test-results/db-integration-runtime"
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Provision non-production Postgres.",
        "Configure non-production DATABASE_URL.",
        "Configure non-production DIRECT_URL.",
        "Run Prisma migrations against non-production Postgres.",
        "Run tenant-isolation integration tests.",
        "Run audit-log integration tests.",
        "Document migration rollback notes.",
        "Capture CI DB artifact proof.",
        "Required command not recorded: pnpm --filter @inkroute/db db:migrate",
        "Required command not recorded: pnpm --filter @inkroute/db db:seed",
        "Required command not recorded: pnpm --filter @inkroute/db test -- db-integration",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/db-postgres-provisioning-redacted.json",
        "coverage/db-prisma-migrate.log",
        "coverage/db-seed-execution.log",
        "coverage/db-tenant-isolation-results.json",
        "coverage/db-ci-run-redacted.json",
      ]),
    );
    expect(blockedDecision.databasePolicy).toEqual({
      productionDataForbidden: true,
      destructiveResetGuardRequired: true,
      commandTranscriptsRedacted: true,
    });

    const completeDecision = buildDbIntegrationRuntimeEvidenceDecision({
      nonProductionPostgresProvisioned: true,
      databaseUrlConfigured: true,
      directUrlConfigured: true,
      prismaValidatePassed: true,
      prismaGeneratePassed: true,
      prismaMigratePassed: true,
      prismaSeedPassed: true,
      seedVerificationPassed: true,
      tenantIsolationPassed: true,
      workflowPersistencePassed: true,
      auditLogIntegrationPassed: true,
      destructiveResetGuarded: true,
      rollbackDocumented: true,
      commandTranscriptCaptured: true,
      ciDbArtifactCaptured: true,
      requiredCommandsRun: dbIntegrationRuntimeCommands,
      capturedArtifacts: dbIntegrationRuntimeArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(dbIntegrationRuntimeCommands);
    expect(completeDecision.requiredEvidence).toBe(dbIntegrationRuntimeArtifactPaths);
  });

  it("keeps GAP-107 Postgres integration execution disabled in the local plan", () => {
    const plan = buildDbIntegrationRuntimeExecutionPlan();

    expect(plan.postgresProvisioningExecutionAllowed).toBe(false);
    expect(plan.databaseUrlExecutionAllowed).toBe(false);
    expect(plan.prismaMigrationExecutionAllowed).toBe(false);
    expect(plan.seedExecutionAllowed).toBe(false);
    expect(plan.integrationTestExecutionAllowed).toBe(false);
    expect(plan.ciDbExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(dbIntegrationRuntimeExecutionPolicy);
    expect(plan.externalEvidenceRequired).toBe(dbIntegrationRuntimeRequiredExternalEvidence);
    expect(dbIntegrationRuntimeExecutionPolicy.externalEvidenceRequired).toBe(dbIntegrationRuntimeRequiredExternalEvidence);
    expect(dbIntegrationRuntimeRequiredExternalEvidence).toEqual(expect.arrayContaining([
      "Non-production Postgres provisioning proof",
      "DATABASE_URL and DIRECT_URL configuration proof",
      "Prisma migrate/seed/verify execution proof",
      "Tenant-isolation/workflow/audit-log integration proof",
      "Provider-backed DbIntegrationRun persistence proof",
    ]));
    expect(plan.localCommands).toBe(dbIntegrationRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(dbIntegrationRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(dbIntegrationRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(dbIntegrationRuntimeExternalArtifacts);
    expect(plan.externalArtifacts).toEqual(expect.arrayContaining([
      "coverage/db-postgres-provisioning-redacted.json",
      "coverage/db-prisma-migrate.log",
      "coverage/db-seed-execution.log",
      "coverage/db-tenant-isolation-results.json",
      "coverage/db-ci-run-redacted.json",
    ]));
    expect(plan.disabledReasons.join(" ")).toContain("Non-production Postgres proof requires provisioned database infrastructure.");
  });

  it("redacts GAP-107 database URLs, command transcripts, and CI artifacts before review", () => {
    const rawArtifact = {
      runId: "db-integration-private",
      commitSha: "privatecommitsha",
      databaseUrl: "postgresql://user:password@example.com:5432/inkroute",
      directUrl: "postgresql://direct:password@example.com:5432/inkroute",
      redactedTranscriptPath: "coverage/private-db-transcript.log",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/private",
      commandTranscript: "DATABASE_URL=postgresql://secret run migrate",
      headers: ["Authorization: Bearer db-secret-token"],
      stack: "Error: db integration failed",
    };

    const redacted = buildRedactedDbIntegrationRuntimeArtifact(rawArtifact);
    const review = buildDbIntegrationRuntimeArtifactReview(rawArtifact);
    const serialized = JSON.stringify({ redacted, review });

    expect(serialized).not.toContain("postgresql://user:password@example.com");
    expect(serialized).not.toContain("postgresql://direct:password@example.com");
    expect(serialized).not.toContain("db-integration-private");
    expect(serialized).not.toContain("privatecommitsha");
    expect(serialized).not.toContain("coverage/private-db-transcript.log");
    expect(serialized).not.toContain("/actions/runs/private");
    expect(serialized).not.toContain("db-secret-token");
    expect(serialized).toContain("[REDACTED]");
    expect(review.requiredArtifacts).toBe(dbIntegrationRuntimeArtifactPaths);
    expect(review.retainedExternalGates).toEqual(expect.arrayContaining([
      "Non-production Postgres provisioning proof",
      "Tenant-isolation/workflow/audit-log integration proof",
      "CI DB artifact proof",
    ]));
  });
});

