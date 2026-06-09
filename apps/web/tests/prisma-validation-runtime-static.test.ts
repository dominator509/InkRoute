import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  prismaValidationArtifactPaths,
  prismaValidationRunPersistenceContract,
  prismaValidationRuntimeCommands,
  prismaValidationRuntimeMatrix,
} from "../lib/prismaValidationRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Prisma validation runtime contract", () => {
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const prismaValidationRunMigration = readRepoFile("packages/db/prisma/migrations/20260609034200_add_prisma_validation_runs/migration.sql");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins Prisma validation commands, matrix rows, and artifact paths", () => {
    expect(prismaValidationRuntimeCommands).toEqual([
      "prisma validate --schema packages/db/prisma/schema.prisma",
      "Prisma relation-name compatibility review",
      "Prisma implicit many-to-many compatibility review",
      "Prisma enum/database compatibility review",
      "Prisma generated SQL safety review",
    ]);
    expect(prismaValidationRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "prisma-cli-validate",
      "relation-names-many-to-many",
      "enum-generated-sql-safety",
    ]);
    expect(prismaValidationArtifactPaths).toContain("coverage/prisma-validation-runtime.json");
    expect(prismaValidationArtifactPaths).toContain("coverage/prisma-validate-output.txt");
    expect(prismaValidationArtifactPaths).toContain("coverage/prisma-validation-secret-safe-artifacts.json");
  });

  it("pins the PrismaValidationRun persistence model and migration", () => {
    expect(prismaValidationRunPersistenceContract).toEqual({
      prismaModel: "PrismaValidationRun",
      tenantRelation: "prismaValidationRuns",
      migration: "20260609034200_add_prisma_validation_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesSchemaPath: true,
      storesDatabaseUrlMode: true,
      storesValidationStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesRelationNameEvidence: true,
      storesManyToManyEvidence: true,
      storesEnumCompatibilityEvidence: true,
      storesGeneratedSqlEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(prismaSchema).toContain("model PrismaValidationRun");
    expect(prismaSchema).toContain("prismaValidationRuns PrismaValidationRun[]");
    expect(prismaSchema).toContain("relationNameEvidenceCaptured");
    expect(prismaSchema).toContain("generatedSqlEvidenceCaptured");
    expect(prismaValidationRunMigration).toContain('CREATE TABLE "PrismaValidationRun"');
    expect(prismaValidationRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(prismaValidationRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(prismaValidationRunMigration).toContain('"PrismaValidationRun_tenantId_runId_key"');
  });

  it("wires manifest and tracker evidence for GAP-019", () => {
    expect(unitManifest).toContain("unit-web-prisma-validation-runtime-static");
    expect(unitManifest).toContain("PrismaValidationRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/prismaValidationRuntime.ts");
    expect(gapTracker).toContain("PrismaValidationRun Prisma model and app row contract");
  });
});
