import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildDestructiveSqlScanPolicy,
  buildMigrationRuntimeContract,
  buildMigrationRuntimeEvidenceEnvelope,
  buildMigrationRollbackRehearsalEvidence,
  migrationRuntimeArtifactPaths,
  migrationRuntimeCommands,
} from "../lib/migrationRuntimeDryRun";

const root = join(__dirname, "..", "..");
const workflow = readFileSync(join(root, ".github/workflows/release-governance.yml"), "utf8");
const ci = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const tracker = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");
const schemaExists = existsSync(join(root, "packages/db/prisma/schema.prisma"));
const migrationsDirectoryExists = existsSync(join(root, "packages/db/prisma/migrations"));

describe("migration runtime dry-run compatibility contract", () => {
  it("pins Prisma validate, diff, deploy, and GitHub dry-run commands", () => {
    expect(schemaExists).toBe(true);
    expect(migrationRuntimeCommands).toEqual(
      expect.arrayContaining([
        "pnpm --filter @inkroute/db prisma validate --schema packages/db/prisma/schema.prisma",
        "pnpm --filter @inkroute/db prisma migrate diff --from-url \"$DATABASE_URL\" --to-schema-datamodel packages/db/prisma/schema.prisma --script",
        "pnpm --filter @inkroute/db prisma migrate deploy",
        "release-governance migration dry run with staging DATABASE_URL",
      ]),
    );
  });

  it("requires destructive SQL scan evidence before migration approval", () => {
    const scan = buildDestructiveSqlScanPolicy();

    expect(scan.destructivePatterns).toEqual(expect.arrayContaining(["DROP TABLE", "DROP COLUMN", "ALTER TABLE .* DROP", "TRUNCATE"]));
    expect(scan.blockWithoutApproval).toBe(true);
    expect(scan.requiredEvidence).toEqual(expect.arrayContaining(["backup snapshot", "expand/contract sequencing plan", "rollback or forward-fix rehearsal evidence"]));
  });

  it("builds a migration evidence envelope without storing database URLs", () => {
    const envelope = buildMigrationRuntimeEvidenceEnvelope({ migrationsDirectoryExists, stagingDatabaseUrlConfigured: false });
    const rehearsal = buildMigrationRollbackRehearsalEvidence({ releaseId: "rel_1", migrationLabel: "migration_1", destructiveSqlDetected: true });

    expect(envelope.schemaPath).toBe("packages/db/prisma/schema.prisma");
    expect(envelope.migrationDirectory).toBe("packages/db/prisma/migrations");
    expect(envelope.ci.rawDatabaseUrlStored).toBe(false);
    expect(envelope.rollbackPolicy.strategy).toBe("forward-fix-first");
    expect(envelope.rollbackRehearsal).toMatchObject({ rehearsalRecorded: true, rawDatabaseUrlStored: false });
    expect(rehearsal).toMatchObject({
      strategy: "forward-fix-first",
      dataLossAssessmentRequired: true,
      restoreRequiresIncidentApproval: true,
      artifact: "coverage/migration-rollback-evidence.json",
    });
  });

  it("keeps readiness blocked when real migrations and staging DATABASE_URL are missing", () => {
    const contract = buildMigrationRuntimeContract({ migrationsDirectoryExists, stagingDatabaseUrlConfigured: false });

    expect(contract.status).toBe("blocked");
    expect(contract.blockers).toEqual(
      expect.arrayContaining([
        "Real Prisma migrations must be generated and committed before dry-run proof.",
        "Staging DATABASE_URL must be provisioned in GitHub Actions secrets.",
      ]),
    );
    expect(contract.blockers).not.toContain("Rollback or forward-fix rehearsal evidence must be recorded.");
    expect(migrationRuntimeArtifactPaths).toContain("coverage/migration-github-actions-dry-run.json");
  });

  it("wires workflow and CI artifacts without claiming staging execution", () => {
    expect(workflow).toContain("Prisma migration compatibility dry run");
    expect(workflow).toContain("DATABASE_URL is required for Prisma migration compatibility dry run");
    expect(workflow).toContain("DROP TABLE|DROP COLUMN|ALTER TABLE .* DROP|TRUNCATE");
    expect(ci).toContain("Run Phase 12 migration runtime dry-run contracts");
    expect(ci).toContain("apps/dashboard/tests/migration-runtime-dry-run-static.test.ts");
    expect(tracker).toContain("GAP-092");
    expect(tracker).toContain("apps/dashboard/lib/migrationRuntimeDryRun.ts");
    expect(tracker).toContain("staging database dry-run proof remains open");
  });
});
