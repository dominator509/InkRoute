import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDbIntegrationRunPersistenceContract,
  dbIntegrationRunPersistencePreview,
  dbIntegrationRuntimeArtifactPaths,
  dbIntegrationRuntimeCommands,
  dbIntegrationRuntimeMatrix,
  dbIntegrationRuntimeReadiness
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
    expect(dbIntegrationRuntimeReadiness.requiredCommands).toEqual(dbIntegrationRuntimeCommands);
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
    expect(gapTracker).toContain("live Postgres integration proof remains open");
  });
});
