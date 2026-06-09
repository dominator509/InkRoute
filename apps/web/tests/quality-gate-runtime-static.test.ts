import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  qualityGateGeneratedManifests,
  qualityGateRootScripts,
  qualityGateRuntimeArtifactPaths,
  qualityGateRuntimeCommands,
  qualityGateRuntimeMatrix,
  qualityGateRuntimeReadiness,
  qualityGateRunPersistenceContract,
} from "../lib/qualityGateRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("quality gate runtime contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const qualityPackageJson = readRepoFile("packages/quality/package.json");
  const qualityTests = readRepoFile("packages/quality/tests/quality-gates.test.ts");
  const qualityProtocol = readRepoFile("docs/quality/QUALITY_GATE_PROTOCOL.md");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const prismaMigration = readRepoFile("packages/db/prisma/migrations/20260609029000_add_quality_gate_runs/migration.sql");

  it("pins Phase 17 quality commands, root scripts, manifests, matrix rows, and artifacts", () => {
    expect(qualityGateRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/quality typecheck",
      "pnpm --filter @inkroute/quality test",
      "pnpm quality:docs",
      "pnpm quality:gaps",
      "pnpm quality:pr-gap-fixtures",
      "pnpm quality:governance",
      "pnpm quality:required-checks",
      "pnpm quality:gates",
      "pnpm quality:all",
      "GitHub Actions CI quality job",
    ]);
    expect(qualityGateRootScripts).toContain("quality:all");
    expect(qualityGateGeneratedManifests).toContain("docs/quality/manifests/quality-gates.json");
    expect(qualityGateRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "quality-package-typecheck",
      "quality-package-test",
      "quality-docs",
      "quality-gaps",
      "quality-pr-gap-fixtures",
      "quality-governance",
      "quality-required-checks",
      "quality-gates-summary",
      "quality-all",
      "quality-ci-job",
      "quality-ci-artifacts",
    ]);
    expect(qualityGateRuntimeArtifactPaths).toContain("coverage/quality-gate-runtime.json");
    expect(qualityGateRuntimeArtifactPaths).toContain("test-results/quality-gate-runtime");
  });

  it("keeps package scripts, helper tests, quality protocol, and root script wiring aligned", () => {
    for (const scriptName of qualityGateRootScripts) {
      expect(rootPackageJson).toContain(`"${scriptName}"`);
    }
    expect(rootPackageJson).toContain("quality:required-checks");
    expect(rootPackageJson).toContain("quality:gates");
    expect(qualityPackageJson).toContain('"typecheck"');
    expect(qualityPackageJson).toContain('"test"');
    expect(qualityTests).toContain("buildQualityGateRuntimeReadinessPlan");
    expect(qualityProtocol).toContain("quality:all");
    expect(qualityProtocol).toContain("required checks");
  });

  it("keeps generated manifest coverage wired while runtime and CI proof remain gated", () => {
    expect(qualityGateRuntimeReadiness.status).toBe("blocked");
    expect(qualityGateRuntimeReadiness.missingRootScripts).toEqual([]);
    expect(qualityGateRuntimeReadiness.missingPackageScripts).toEqual([]);
    expect(qualityGateRuntimeReadiness.missingGeneratedManifests).toEqual([]);
    expect(qualityGateRuntimeReadiness.requiredCommands).toEqual([...qualityGateRuntimeCommands]);
    expect(qualityGateRuntimeReadiness.requiredEvidence).toEqual([
      "@inkroute/quality package typecheck and test output.",
      "quality:all output showing documentation, gap evidence, PR gap fixtures, governance, required checks, and gate summary passed.",
      "Generated manifests for Markdown links, documentation consistency, documentation inventory, gap evidence, repository governance, required checks, and quality gates.",
      "GitHub Actions quality job URL and status check evidence.",
      "CI report/artifact labels for quality gate outputs or documented blocker if artifact upload is unavailable.",
    ]);
    expect(qualityGateRuntimeReadiness.blockers).toEqual([
      "@inkroute/quality typecheck must pass.",
      "@inkroute/quality tests must pass.",
      "pnpm quality:all must pass.",
      "GitHub Actions quality job must pass.",
      "CI quality reports/artifacts must be captured or explicitly documented as unavailable.",
    ]);
  });

  it("wires CI, manifest, tracker, and artifact capture without claiming runtime quality evidence is complete", () => {
    expect(ciWorkflow).toContain("Run Phase 17 quality gate runtime contracts");
    expect(ciWorkflow).toContain("quality-gate-runtime-static.test.ts");
    expect(ciWorkflow).toContain("quality-gate-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-quality-gate-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/qualityGateRuntime.ts");
    expect(gapTracker).toContain("live package typecheck/test, quality:all, CI quality job, and artifact proof remain open");
  });

  it("pins durable QualityGateRun persistence for runtime quality evidence", () => {
    expect(qualityGateRunPersistenceContract.prismaModel).toBe("QualityGateRun");
    expect(qualityGateRunPersistenceContract.tenantRelation).toBe("qualityGateRuns");
    expect(qualityGateRunPersistenceContract.uniqueKey).toEqual(["tenantId", "runId"]);
    expect(qualityGateRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "generatedManifestMatrix",
      "artifactManifest",
    ]);
    expect(qualityGateRunPersistenceContract.requiredBooleanProofs).toEqual(
      expect.arrayContaining([
        "packageTypecheckPassed",
        "packageTestsPassed",
        "qualityAllPassed",
        "qualityPrGapFixturesPassed",
        "qualityRequiredChecksPassed",
        "ciQualityJobPassed",
        "ciArtifactsCaptured",
      ]),
    );
    expect(qualityGateRunPersistenceContract.artifactFields).toContain("qualityCiJobArtifactPath");
    expect(prismaSchema).toContain("qualityGateRuns QualityGateRun[]");
    expect(prismaSchema).toContain("model QualityGateRun");
    expect(prismaSchema).toContain("generatedManifestMatrix                 Json");
    expect(prismaSchema).toContain("qualityAllPassed                        Boolean  @default(false)");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(prismaMigration).toContain('CREATE TABLE "QualityGateRun"');
    expect(prismaMigration).toContain('"qualityCiJobArtifactPath" TEXT');
    expect(unitManifest).toContain("QualityGateRun Prisma model and app row contract");
    expect(gapTracker).toContain("packages/db/prisma/migrations/20260609029000_add_quality_gate_runs/migration.sql");
  });
});
