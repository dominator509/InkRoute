import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildQualityGateDecisionRequiredEvidence,
  qualityGateGeneratedManifests,
  qualityGateRootScripts,
  qualityGateRuntimeArtifactPaths,
  qualityGateRuntimeCommands,
  qualityGateRuntimeExternalArtifacts,
  qualityGateRuntimeExternalCommands,
  qualityGateRuntimeExecutionPolicy,
  qualityGateRuntimeLocalArtifacts,
  qualityGateRuntimeLocalCommands,
  qualityGateRuntimeMatrix,
  qualityGateRuntimeProofFiles,
  qualityGateRuntimeReadiness,
  qualityGateRuntimeRequiredExternalEvidence,
  qualityGateRuntimeRequiredEvidence,
  qualityGateRunPersistenceContract,
  buildQualityGateEvidenceDecision,
  buildQualityGateRuntimeArtifactReview,
  buildQualityGateRuntimeExecutionPlan,
  buildRedactedQualityGateArtifact,
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
      "capture CI quality reports/artifacts",
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
    expect(qualityGateRuntimeReadiness.requiredCommands).toBe(qualityGateRuntimeCommands);
    expect(qualityGateRuntimeReadiness.requiredEvidence).toBe(qualityGateRuntimeRequiredEvidence);
    expect(qualityGateRuntimeReadiness.blockers).toEqual([
      "@inkroute/quality typecheck must pass.",
      "@inkroute/quality tests must pass.",
      "pnpm quality:all must pass.",
      "GitHub Actions quality job must pass.",
      "CI quality reports/artifacts must be captured or explicitly documented as unavailable.",
    ]);
  });

  it("blocks quality gate closure until commands, manifests, CI, artifacts, and persistence are proven", () => {
    const decision = buildQualityGateEvidenceDecision({
      packageTypecheckPassed: false,
      packageTestsPassed: false,
      qualityDocsPassed: true,
      qualityGapsPassed: true,
      qualityPrGapFixturesPassed: true,
      qualityGovernancePassed: true,
      qualityRequiredChecksPassed: false,
      qualityGatesSummaryPassed: false,
      qualityAllPassed: false,
      ciQualityJobPassed: false,
      ciArtifactsCaptured: false,
      qualityGateRunPersisted: false,
      capturedManifests: [
        "docs/quality/manifests/markdown-link-audit.json",
        "docs/quality/manifests/documentation-consistency-audit.json",
        "docs/quality/manifests/documentation-inventory-audit.json",
      ],
      capturedArtifacts: [
        "coverage/quality-gate-runtime.json",
        "coverage/quality-docs-output.txt",
        "coverage/quality-gaps-output.txt",
      ],
      completedCommands: ["pnpm quality:docs", "pnpm quality:gaps", "pnpm quality:pr-gap-fixtures"],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingManifests).toEqual([
      "docs/quality/manifests/gap-evidence-audit.json",
      "docs/quality/manifests/pr-gap-diff-fixtures.json",
      "docs/quality/manifests/repository-governance-audit.json",
      "docs/quality/manifests/required-checks-audit.json",
      "docs/quality/manifests/quality-gates.json",
    ]);
    expect(decision.missingArtifacts).toEqual([
      "coverage/quality-package-typecheck.txt",
      "coverage/quality-package-test.txt",
      "coverage/quality-pr-gap-fixtures-output.txt",
      "coverage/quality-governance-output.txt",
      "coverage/quality-required-checks-output.txt",
      "coverage/quality-gates-output.txt",
      "coverage/quality-all-output.txt",
      "coverage/quality-ci-job.json",
      "test-results/quality-gate-runtime",
    ]);
    expect(decision.missingCommands).toEqual([
      "pnpm --filter @inkroute/quality typecheck",
      "pnpm --filter @inkroute/quality test",
      "pnpm quality:governance",
      "pnpm quality:required-checks",
      "pnpm quality:gates",
      "pnpm quality:all",
      "GitHub Actions CI quality job",
      "capture CI quality reports/artifacts",
    ]);
    expect(decision.requiredManifests).toBe(qualityGateGeneratedManifests);
    expect(decision.requiredArtifacts).toBe(qualityGateRuntimeArtifactPaths);
    expect(decision.requiredCommands).toBe(qualityGateRuntimeCommands);
    expect(decision.requiredEvidence).toEqual(
      buildQualityGateDecisionRequiredEvidence(qualityGateRuntimeReadiness.requiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(qualityGateRuntimeRequiredEvidence);
    expect(decision.blockers).toContain("@inkroute/quality typecheck must pass.");
    expect(decision.blockers).toContain("QualityGateRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Every required quality manifest must be captured.");
  });

  it("completes quality gate closure when package, scripts, manifests, CI, artifacts, and persistence are proven", () => {
    const decision = buildQualityGateEvidenceDecision({
      packageTypecheckPassed: true,
      packageTestsPassed: true,
      qualityDocsPassed: true,
      qualityGapsPassed: true,
      qualityPrGapFixturesPassed: true,
      qualityGovernancePassed: true,
      qualityRequiredChecksPassed: true,
      qualityGatesSummaryPassed: true,
      qualityAllPassed: true,
      ciQualityJobPassed: true,
      ciArtifactsCaptured: true,
      qualityGateRunPersisted: true,
      capturedManifests: qualityGateGeneratedManifests,
      capturedArtifacts: qualityGateRuntimeArtifactPaths,
      completedCommands: qualityGateRuntimeCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingManifests).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifact capture without claiming runtime quality evidence is complete", () => {
    expect(ciWorkflow).toContain("Run Phase 17 quality gate runtime contracts");
    expect(ciWorkflow).toContain("quality-gate-runtime-static.test.ts");
    expect(ciWorkflow).toContain("quality-gate-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-quality-gate-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/qualityGateRuntime.ts");
    expect(gapTracker).toContain("live package typecheck/test, quality:all, CI quality job, persisted run row, and CI artifact capture remain gated");
    expect(gapTracker).toContain("GAP-126 is quality-gate-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildQualityGateDecisionRequiredEvidence");
    expect(gapTracker).toContain("qualityGateRuntimeRequiredEvidence");
    expect(gapTracker).toContain("buildQualityGateRuntimeExecutionPlan");
    expect(gapTracker).toContain("qualityGateRuntimeExecutionPolicy");
    expect(gapTracker).toContain("qualityGateRuntimeRequiredExternalEvidence");
    expect(gapTracker).toContain("qualityGateRuntimeLocalArtifacts");
    expect(gapTracker).toContain("qualityGateRuntimeExternalArtifacts");
    expect(gapTracker).toContain("buildQualityGateRuntimeArtifactReview");
  });

  it("pins current quality gate runtime proof files for GAP-126", () => {
    expect(qualityGateRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      ".github/CODEOWNERS",
      "docs/quality/README.md",
      "scripts/quality/audit-doc-links.mjs",
      "scripts/quality/audit-gap-tracker-diff.mjs",
      "scripts/quality/print-quality-gates.mjs",
      "scripts/quality/verify-pr-gap-diff-fixtures.mjs",
      "scripts/quality/verify-repository-governance.mjs",
      "scripts/quality/verify-required-checks.mjs",
        "packages/quality/package.json",
        "packages/quality/src/index.ts",
        "packages/quality/tests/quality-gates.test.ts",
        "scripts/quality/audit-gap-evidence.mjs",
        "docs/quality/manifests/quality-gates.json",
        "apps/web/lib/qualityGateRuntime.ts",
        "apps/web/tests/quality-gate-runtime-static.test.ts",
        "packages/db/prisma/migrations/20260609029000_add_quality_gate_runs/migration.sql",
        ".github/workflows/ci.yml"
      ])
    );
    for (const file of qualityGateRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
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

  it("keeps GAP-126 execution policy non-executing while separating local and external proof", () => {
    const plan = buildQualityGateRuntimeExecutionPlan();

    expect(plan.localCommands).toBe(qualityGateRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(qualityGateRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(qualityGateRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(qualityGateRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toContain("coverage/quality-docs-output.txt");
    expect(plan.externalArtifacts).toEqual([
      "coverage/quality-gate-runtime.json",
      "coverage/quality-package-typecheck.txt",
      "coverage/quality-package-test.txt",
      "coverage/quality-all-output.txt",
      "coverage/quality-ci-job.json",
      "test-results/quality-gate-runtime",
    ]);
    expect(plan).toMatchObject({
      packageTypecheckExecutionAllowed: false,
      packageTestExecutionAllowed: false,
      qualityDocsExecutionAllowed: false,
      qualityGapsExecutionAllowed: false,
      prGapFixturesExecutionAllowed: false,
      governanceExecutionAllowed: false,
      requiredChecksExecutionAllowed: false,
      gateSummaryExecutionAllowed: false,
      qualityAllExecutionAllowed: false,
      ciQualityJobExecutionAllowed: false,
      persistenceExecutionAllowed: false,
      ciArtifactCaptureExecutionAllowed: false,
    });
    expect(plan.executionPolicy).toBe(qualityGateRuntimeExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyStaticQualityGates: true,
      packageRuntimeProofRequiredForClosure: true,
      qualityAllRequiredForClosure: true,
      ciQualityJobRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      runtimeCommandEvidenceRequired: true,
    });
    expect(plan.requiredExternalEvidence).toBe(qualityGateRuntimeRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("GitHub Actions CI quality job URL, conclusion, and artifact bundle.");
    expect(plan.requiredExternalEvidence).toContain("Durable QualityGateRun persistence row captured from the target database.");
  });

  it("redacts quality gate runtime artifacts before tracker or handoff use", () => {
    const artifact = {
      runId: "qgrun_01HZYXZYXZYXZYXZYXZYXZYXZ",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/27171288295/job/80210677823",
      packageTypecheckOutput: "completed for artist@example.com with token github_pat_1234567890ABCDEFGHIJKLMNOP",
      persistence: {
        tenantId: "tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
        databaseUrl: "postgres://inkroute:secret@example.neon.tech/inkroute",
      },
      contacts: ["+1 (555) 867-5309"],
    };

    expect(buildRedactedQualityGateArtifact(artifact)).toEqual({
      runId: "[REDACTED]",
      ciRunUrl: "[REDACTED]",
      packageTypecheckOutput: "completed for [REDACTED] with token [REDACTED]",
      persistence: {
        tenantId: "[REDACTED]",
        databaseUrl: "[REDACTED]",
      },
      contacts: ["[REDACTED]"],
    });

    const review = buildQualityGateRuntimeArtifactReview(artifact);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(qualityGateRuntimeRequiredExternalEvidence);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "runId",
        "ciRunUrl",
        "packageTypecheckOutput",
        "persistence.tenantId",
        "persistence.databaseUrl",
        "contacts[0]",
      ]),
    );
    expect(review.requiredExternalEvidence).toContain("pnpm quality:all output captured after all quality gates run together.");
  });
});



