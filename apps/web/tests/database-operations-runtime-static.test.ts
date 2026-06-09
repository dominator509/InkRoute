import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  databaseOperationsRuntimeArtifactPaths,
  databaseOperationsRuntimeCommands,
  databaseOperationsRuntimeMatrix,
  databaseOperationsRuntimeReadiness
} from "../lib/databaseOperationsRuntime";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const dbEvidence = read("deployment/manifests/database-operations-evidence.json");
const dbVerifier = read("deployment/scripts/verify-database-operations.mjs");
const dbPackage = read("packages/db/package.json");
const deploymentTests = read("packages/deployment/tests/deployment-readiness.test.ts");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");

describe("GAP-117 database operations runtime wiring", () => {
  it("pins database operations commands, matrix entries, and redacted artifact paths", () => {
    expect(databaseOperationsRuntimeCommands).toEqual([
      "pnpm deploy:verify-database-ops",
      "pnpm db:generate",
      "pnpm --filter @inkroute/db db:validate",
      "pnpm db:migrate",
      "pnpm db:seed",
      "database destructive SQL scan",
      "database backup/restore drill",
      "database tenant-isolation smoke",
      "database branch promotion approval"
    ]);
    expect(databaseOperationsRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "operations-verifier",
      "provider-branch-secret-store",
      "prisma-generate-validate",
      "migration-dry-run-destructive-scan",
      "staging-apply-seed-policy",
      "backup-restore-tenant-isolation",
      "branch-promotion-data-safety",
      "ci-database-operations-artifacts"
    ]);
    expect(databaseOperationsRuntimeArtifactPaths).toContain("coverage/database-destructive-sql-scan.json");
    expect(databaseOperationsRuntimeArtifactPaths).toContain("test-results/database-operations-runtime");
  });

  it("keeps DB operations manifest, verifier, package scripts, and blocked SQL gates wired", () => {
    for (const command of ["pnpm db:generate", "pnpm --filter @inkroute/db db:validate", "pnpm db:migrate", "pnpm db:seed"]) {
      expect(dbEvidence).toContain(command);
    }
    for (const checkId of [
      "staging-branch-provisioned",
      "migration-dry-run",
      "destructive-change-scan",
      "staging-migration-apply",
      "seed-policy",
      "backup-restore-drill",
      "tenant-isolation-smoke",
      "branch-promotion"
    ]) {
      expect(dbEvidence).toContain(checkId);
    }
    for (const pattern of ["DROP TABLE", "DROP COLUMN", "ALTER TABLE DROP", "TRUNCATE"]) {
      expect(dbEvidence).toContain(pattern);
    }
    expect(dbVerifier).toContain("database-operations-evidence.json");
    expect(dbPackage).toContain('"db:validate"');
    expect(dbPackage).toContain('"db:generate"');
    expect(dbPackage).toContain('"db:migrate"');
    expect(dbPackage).toContain('"db:seed"');
    expect(deploymentTests).toContain("buildDatabaseOperationsRuntimeReadinessPlan");
  });

  it("keeps readiness blocked until provider DB, Prisma lifecycle, migration, backup, tenant isolation, branch promotion, and safety proof exists", () => {
    expect(databaseOperationsRuntimeReadiness.status).toBe("blocked");
    expect(databaseOperationsRuntimeReadiness.missingCommands).toEqual([]);
    expect(databaseOperationsRuntimeReadiness.missingScripts).toEqual([]);
    expect(databaseOperationsRuntimeReadiness.missingChecks).toEqual(
      expect.arrayContaining(["staging-branch-provisioned", "migration-dry-run", "backup-restore-drill", "branch-promotion"])
    );
    expect(databaseOperationsRuntimeReadiness.requiredCommands).toEqual(databaseOperationsRuntimeCommands);
    expect(databaseOperationsRuntimeReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "Redacted staging database branch/provider label and secret-store reference.",
        "Prisma validate, generate, migration dry-run, and generated SQL review output.",
        "Destructive SQL scan output covering DROP TABLE, DROP COLUMN, ALTER TABLE DROP, and TRUNCATE.",
        "Staging migration apply log, migration id, seed output, and app compatibility smoke.",
        "Backup snapshot, restore drill log, and RTO/RPO note.",
        "Tenant-isolation smoke output and tenant-scoped query audit label.",
        "Branch promotion approval, production branch label, and rollback branch/restore evidence."
      ])
    );
    expect(databaseOperationsRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Database provider branch/project must be provisioned and verified with redacted evidence.",
        "Database operations evidence must include every required operation check.",
        "pnpm deploy:verify-database-ops must pass.",
        "Backup/restore drill must pass with RTO/RPO evidence.",
        "Production data safety, seed policy, and destructive SQL gates must be reviewed."
      ])
    );
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 15 database operations runtime contracts");
    expect(ciWorkflow).toContain("apps/web/tests/database-operations-runtime-static.test.ts");
    expect(ciWorkflow).toContain("database-operations-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/database-operations-runtime.json");
    expect(ciWorkflow).toContain("test-results/database-operations-runtime");
    expect(unitManifest).toContain("unit-web-database-operations-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/databaseOperationsRuntime.ts");
    expect(gapTracker).toContain("live provider database operations proof remains open");
  });
});
