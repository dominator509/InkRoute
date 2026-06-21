import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  requiredChecksBranchProtectionChecks,
  requiredChecksPackageScripts,
  requiredChecksRepositorySettings,
  requiredChecksRuntimeArtifactPaths,
  requiredChecksRuntimeCommands,
  requiredChecksRuntimeExternalArtifacts,
  requiredChecksRuntimeExternalCommands,
  requiredChecksRuntimeExecutionPolicy,
  requiredChecksRuntimeLocalArtifacts,
  requiredChecksRuntimeLocalCommands,
  requiredChecksRuntimeMatrix,
  requiredChecksRuntimeProofFiles,
  requiredChecksRuntimeReadiness,
  requiredChecksRuntimeReadinessRequiredEvidence,
  requiredChecksRuntimeRequiredExternalEvidence,
  requiredChecksRuntimeRequiredEvidence,
  requiredChecksRunPersistenceContract,
  requiredChecksWorkflowTerms,
  buildRequiredChecksDecisionRequiredEvidence,
  buildRequiredChecksEvidenceDecision,
  buildRequiredChecksRuntimeArtifactReview,
  buildRequiredChecksRuntimeExecutionPlan,
  buildRedactedRequiredChecksArtifact,
} from "../lib/requiredChecksRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("required checks runtime contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const requiredChecksContract = readRepoFile("docs/quality/manifests/required-checks-contract.json");
  const requiredChecksVerifier = readRepoFile("scripts/quality/verify-required-checks.mjs");
  const qualityTests = readRepoFile("packages/quality/tests/quality-gates.test.ts");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const requiredChecksMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609032000_add_required_checks_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins package scripts, workflow terms, branch checks, repository settings, commands, and artifacts", () => {
    expect(requiredChecksPackageScripts).toEqual([
      "quality:required-checks",
      "quality:all",
      "handoff:all",
      "workspace:all",
      "typecheck",
      "lint",
      "test:unit",
      "test:e2e",
    ]);
    expect(requiredChecksWorkflowTerms).toContain("playwright");
    expect(requiredChecksBranchProtectionChecks).toContain("CI / quality");
    expect(requiredChecksRepositorySettings).toContain("secret-scanning");
    expect(requiredChecksRuntimeCommands).toEqual([
      "pnpm quality:required-checks",
      "pnpm quality:all",
      "GitHub branch protection required-check audit",
      "GitHub repository settings audit",
      "failing quality-gate PR merge-block proof",
      "CODEOWNERS review enforcement proof",
    ]);
    expect(requiredChecksRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "required-checks-audit",
      "quality-all-chain",
      "branch-protection-required-checks",
      "repository-settings-audit",
      "failing-quality-pr-block",
      "codeowners-review-active",
    ]);
    expect(requiredChecksRuntimeArtifactPaths).toContain("coverage/required-checks-runtime.json");
    expect(requiredChecksRuntimeArtifactPaths).toContain("test-results/required-checks-runtime");
  });

  it("pins the RequiredChecksRun persistence model and migration", () => {
    expect(requiredChecksRunPersistenceContract.model).toBe("RequiredChecksRun");
    expect(requiredChecksRunPersistenceContract.tenantRelation).toBe("requiredChecksRuns");
    expect(requiredChecksRunPersistenceContract.migration).toBe("20260609032000_add_required_checks_runs");
    expect(requiredChecksRunPersistenceContract.jsonFields).toEqual([
      "packageScriptMatrix",
      "ciWorkflowTermMatrix",
      "branchProtectionCheckMatrix",
      "repositorySettingsMatrix",
      "artifactManifest",
    ]);
    expect(requiredChecksRunPersistenceContract.evidenceBooleans).toContain("requiredChecksAuditPassed");
    expect(requiredChecksRunPersistenceContract.evidenceBooleans).toContain("qualityAllChainsRequiredChecks");
    expect(requiredChecksRunPersistenceContract.evidenceBooleans).toContain("redactedSettingsEvidenceCaptured");
    expect(requiredChecksRunPersistenceContract.artifactFields).toContain("branchProtectionArtifactPath");
    expect(requiredChecksRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("requiredChecksRuns RequiredChecksRun[]");
    expect(prismaSchema).toContain("model RequiredChecksRun");
    expect(prismaSchema).toContain("packageScriptMatrix");
    expect(prismaSchema).toContain("branchProtectionChecksConfigured");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(requiredChecksMigration).toContain('CREATE TABLE "RequiredChecksRun"');
    expect(requiredChecksMigration).toContain('"packageScriptMatrix" JSONB NOT NULL');
    expect(requiredChecksMigration).toContain('"redactedSettingsEvidenceCaptured" BOOLEAN NOT NULL DEFAULT false');
    expect(requiredChecksMigration).toContain('CREATE UNIQUE INDEX "RequiredChecksRun_tenantId_runId_key"');
  });

  it("keeps local required-check source contracts wired", () => {
    for (const scriptName of requiredChecksPackageScripts) {
      expect(rootPackageJson).toContain(`"${scriptName}"`);
    }
    expect(rootPackageJson).toContain("quality:required-checks");
    expect(rootPackageJson).toContain("quality:all");
    expect(ciWorkflow).toContain("quality:required-checks");
    expect(ciWorkflow).toContain("quality:all");
    expect(requiredChecksContract).toContain("branchProtection");
    expect(requiredChecksContract).toContain("repositorySettings");
    expect(requiredChecksVerifier).toContain("buildRequiredChecksRuntimeReadinessPlan");
    expect(qualityTests).toContain("buildRequiredChecksRuntimeReadinessPlan");
  });

  it("keeps local wiring complete while branch protection and merge-block proof remain gated", () => {
    expect(requiredChecksRuntimeReadiness.status).toBe("blocked");
    expect(requiredChecksRuntimeReadiness.missingPackageScripts).toEqual([]);
    expect(requiredChecksRuntimeReadiness.missingWorkflowTerms).toEqual([]);
    expect(requiredChecksRuntimeReadiness.missingBranchProtectionChecks).toEqual([...requiredChecksBranchProtectionChecks]);
    expect(requiredChecksRuntimeReadiness.missingRepositorySettings).toEqual([...requiredChecksRepositorySettings]);
    expect(requiredChecksRuntimeReadiness.requiredCommands).toBe(requiredChecksRuntimeCommands);
    expect(requiredChecksRuntimeReadiness.requiredEvidence).toBe(requiredChecksRuntimeReadinessRequiredEvidence);
  });

  it("blocks required checks closure until branch protection, repository settings, CI, persistence, artifacts, and commands are proven", () => {
    const decision = buildRequiredChecksEvidenceDecision({
      requiredChecksAuditPassed: true,
      qualityAllChainsRequiredChecks: true,
      branchProtectionEvidenceCaptured: false,
      failingQualityPrBlocked: false,
      codeownersReviewActive: false,
      ciQualityJobPassed: false,
      redactedSettingsEvidenceCaptured: false,
      requiredChecksRunPersisted: false,
      configuredBranchProtectionChecks: ["CI / quality"],
      configuredRepositorySettings: ["branch-protection"],
      capturedArtifacts: [
        "coverage/required-checks-runtime.json",
        "coverage/required-checks-audit-output.txt",
        "coverage/required-checks-quality-all-output.txt",
      ],
      completedCommands: ["pnpm quality:required-checks", "pnpm quality:all"],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingBranchProtectionChecks).toEqual([
      "CI / typecheck",
      "CI / lint",
      "CI / unit",
      "CI / playwright",
      "CI / handoff",
      "CI / workspace",
      "CI / pr-gap-evidence",
    ]);
    expect(decision.missingRepositorySettings).toEqual([
      "require-pull-request",
      "require-up-to-date-branch",
      "require-codeowners-review",
      "require-conversation-resolution",
      "restrict-force-pushes",
      "restrict-deletions",
      "secret-scanning",
    ]);
    expect(decision.missingArtifacts).toEqual([
      "coverage/required-checks-branch-protection-redacted.json",
      "coverage/required-checks-repository-settings-redacted.json",
      "coverage/required-checks-failing-pr-redacted.json",
      "coverage/required-checks-codeowners-review-redacted.json",
      "test-results/required-checks-runtime",
    ]);
    expect(decision.missingCommands).toEqual([
      "GitHub branch protection required-check audit",
      "GitHub repository settings audit",
      "failing quality-gate PR merge-block proof",
      "CODEOWNERS review enforcement proof",
    ]);
    expect(decision.requiredArtifacts).toBe(requiredChecksRuntimeArtifactPaths);
    expect(decision.requiredCommands).toBe(requiredChecksRuntimeCommands);
    expect(decision.requiredEvidence).toEqual(
      buildRequiredChecksDecisionRequiredEvidence(requiredChecksRuntimeReadinessRequiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(requiredChecksRuntimeRequiredEvidence);
    expect(decision.blockers).toContain("GitHub branch protection must require every documented quality status check.");
    expect(decision.blockers).toContain("RequiredChecksRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Every required checks artifact must be captured.");
  });

  it("completes required checks closure when branch protection, repository settings, CI, persistence, artifacts, and commands are proven", () => {
    const decision = buildRequiredChecksEvidenceDecision({
      requiredChecksAuditPassed: true,
      qualityAllChainsRequiredChecks: true,
      branchProtectionEvidenceCaptured: true,
      failingQualityPrBlocked: true,
      codeownersReviewActive: true,
      ciQualityJobPassed: true,
      redactedSettingsEvidenceCaptured: true,
      requiredChecksRunPersisted: true,
      configuredBranchProtectionChecks: requiredChecksBranchProtectionChecks,
      configuredRepositorySettings: requiredChecksRepositorySettings,
      capturedArtifacts: requiredChecksRuntimeArtifactPaths,
      completedCommands: requiredChecksRuntimeCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingBranchProtectionChecks).toEqual([]);
    expect(decision.missingRepositorySettings).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming branch protection is enforced", () => {
    expect(ciWorkflow).toContain("Run Phase 17 required checks runtime contracts");
    expect(ciWorkflow).toContain("required-checks-runtime-static.test.ts");
    expect(ciWorkflow).toContain("required-checks-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-required-checks-runtime-static");
    expect(unitManifest).toContain("RequiredChecksRun Prisma model and app row contract");
    expect(gapTracker).toContain("RequiredChecksRun");
    expect(gapTracker).toContain("apps/web/lib/requiredChecksRuntime.ts");
    expect(gapTracker).toContain("live branch-protection required-check, repository-settings, failing-PR merge-block, and CODEOWNERS review proof remain open");
    expect(gapTracker).toContain("GAP-129 is required-checks-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildRequiredChecksRuntimeExecutionPlan");
    expect(gapTracker).toContain("requiredChecksRuntimeExecutionPolicy");
    expect(gapTracker).toContain("requiredChecksRuntimeReadinessRequiredEvidence");
    expect(gapTracker).toContain("requiredChecksRuntimeRequiredEvidence");
    expect(gapTracker).toContain("requiredChecksRuntimeRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRequiredChecksRuntimeArtifactReview");
  });

  it("pins current required checks runtime proof files for GAP-129", () => {
    expect(requiredChecksRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "docs/quality/QUALITY_GATE_PROTOCOL.md",
      "docs/quality/README.md",
      "docs/quality/manifests/required-checks-audit.json",
      "packages/quality/src/index.ts",
      "scripts/quality/print-quality-gates.mjs",
      "apps/web/package.json",
        ".github/workflows/ci.yml",
        "package.json",
        "scripts/quality/verify-required-checks.mjs",
        "apps/web/lib/requiredChecksRuntime.ts",
        "apps/web/tests/required-checks-runtime-static.test.ts",
        "packages/db/prisma/migrations/20260609032000_add_required_checks_runs/migration.sql",
        "testing/manifests/unit-test-manifest.json"
      ])
    );
    for (const file of requiredChecksRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps GAP-129 execution policy non-executing while separating GitHub enforcement proof", () => {
    const plan = buildRequiredChecksRuntimeExecutionPlan();

    expect(plan.localCommands).toBe(requiredChecksRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(requiredChecksRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(requiredChecksRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(requiredChecksRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toEqual([
      "coverage/required-checks-runtime.json",
      "coverage/required-checks-audit-output.txt",
      "coverage/required-checks-quality-all-output.txt",
    ]);
    expect(plan.externalArtifacts).toEqual([
      "coverage/required-checks-branch-protection-redacted.json",
      "coverage/required-checks-repository-settings-redacted.json",
      "coverage/required-checks-failing-pr-redacted.json",
      "coverage/required-checks-codeowners-review-redacted.json",
      "test-results/required-checks-runtime",
    ]);
    expect(plan).toMatchObject({
      requiredChecksAuditExecutionAllowed: false,
      qualityAllExecutionAllowed: false,
      branchProtectionAuditExecutionAllowed: false,
      repositorySettingsAuditExecutionAllowed: false,
      failingPrMergeBlockExecutionAllowed: false,
      codeownersReviewProofExecutionAllowed: false,
      ciQualityJobExecutionAllowed: false,
      persistenceExecutionAllowed: false,
    });
    expect(plan.executionPolicy).toBe(requiredChecksRuntimeExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyStaticRequiredChecks: true,
      githubBranchProtectionEvidenceRequiredForClosure: true,
      repositorySettingsEvidenceRequiredForClosure: true,
      failingPrMergeBlockEvidenceRequiredForClosure: true,
      codeownersReviewEvidenceRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
    });
    expect(plan.requiredExternalEvidence).toBe(requiredChecksRuntimeRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain(
      "Redacted GitHub branch-protection settings showing every required check is enforced.",
    );
    expect(plan.requiredExternalEvidence).toContain("Durable RequiredChecksRun persistence row captured from the target database.");
  });

  it("redacts required-checks runtime artifacts before tracker or handoff use", () => {
    const artifact = {
      runId: "req_checks_01HZYXZYXZYXZYXZYXZYXZYXZ",
      repositoryUrl: "https://github.com/dominator509/InkRoute/settings/branches",
      branchProtectionSettings: {
        tenantId: "tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
        requiredChecks: ["CI / quality", "CI / unit"],
      },
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/27171288295",
      logOutput: "review requested from owner@example.com with token github_pat_1234567890ABCDEFGHIJKLMNOP",
    };

    expect(buildRedactedRequiredChecksArtifact(artifact)).toEqual({
      runId: "[REDACTED]",
      repositoryUrl: "[REDACTED]",
      branchProtectionSettings: "[REDACTED]",
      ciRunUrl: "[REDACTED]",
      logOutput: "review requested from [REDACTED] with token [REDACTED]",
    });

    const review = buildRequiredChecksRuntimeArtifactReview(artifact);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(requiredChecksRuntimeRequiredExternalEvidence);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "runId",
        "repositoryUrl",
        "branchProtectionSettings",
        "ciRunUrl",
        "logOutput",
      ]),
    );
    expect(review.requiredExternalEvidence).toContain("Failing quality-gate PR merge-block evidence captured from GitHub.");
  });
});


