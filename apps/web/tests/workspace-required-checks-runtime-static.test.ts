import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  workspaceRequiredBranchProtectionChecks,
  workspaceRequiredChecksArtifactPaths,
  workspaceRequiredChecksCommands,
  workspaceRequiredChecksExternalArtifacts,
  workspaceRequiredChecksExternalCommands,
  workspaceRequiredChecksExecutionPolicy,
  workspaceRequiredChecksLocalArtifacts,
  workspaceRequiredChecksLocalCommands,
  workspaceRequiredChecksProofFiles,
  workspaceRequiredChecksReadiness,
  workspaceRequiredChecksReadinessRequiredEvidence,
  workspaceRequiredChecksRequiredExternalEvidence,
  workspaceRequiredChecksRequiredEvidence,
  workspaceRequiredChecksRunPersistenceContract,
  workspaceRequiredChecksRuntimeMatrix,
  buildRedactedWorkspaceRequiredChecksArtifact,
  buildWorkspaceRequiredChecksArtifactReview,
  buildWorkspaceRequiredChecksDecisionRequiredEvidence,
  buildWorkspaceRequiredChecksEvidenceDecision,
  buildWorkspaceRequiredChecksExecutionPlan,
  buildWorkspaceRequiredChecksRedactedEvidenceBundle,
} from "../lib/workspaceRequiredChecksRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("workspace required checks runtime contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const requiredChecksContract = readRepoFile("docs/workspace/manifests/workspace-required-checks-contract.json");
  const requiredChecksVerifier = readRepoFile("scripts/workspace/verify-workspace-required-checks.mjs");
  const workspaceTests = readRepoFile("packages/workspace/tests/workspace-audit.test.ts");
  const qualityRequiredChecksContract = readRepoFile("docs/quality/manifests/required-checks-contract.json");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const workspaceRequiredChecksMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609032400_add_workspace_required_checks_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins required commands, branch-protection checks, matrix rows, and artifact paths", () => {
    expect(workspaceRequiredChecksCommands).toEqual([
      "pnpm workspace:required-checks",
      "pnpm workspace:all",
      "pnpm quality:required-checks",
      "GitHub Actions CI / quality",
      "GitHub branch protection required-check review",
      "Failing workspace-audit PR merge-block proof",
      "PR GAP tracker diff evidence merge-block proof",
      "required-check evidence logs redacted and secret-free",
    ]);
    expect(workspaceRequiredBranchProtectionChecks).toContain("CI / workspace required checks");
    expect(workspaceRequiredBranchProtectionChecks).toContain("CI / PR GAP tracker diff evidence");
    expect(workspaceRequiredChecksRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "workspace-required-checks-audit",
      "workspace-all-required-checks-chain",
      "quality-required-checks",
      "ci-quality-job",
      "branch-protection-required-checks",
      "failing-workspace-audit-pr",
      "failing-pr-gap-diff-pr",
      "redacted-evidence-logs",
      "redacted-evidence-bundle",
    ]);
    expect(workspaceRequiredChecksArtifactPaths).toContain("coverage/workspace-required-checks-runtime.json");
    expect(workspaceRequiredChecksArtifactPaths).toContain(
      "coverage/workspace-required-checks-redacted-evidence-bundle.json",
    );
    expect(workspaceRequiredChecksArtifactPaths).toContain("test-results/workspace-required-checks-runtime");
  });

  it("pins the WorkspaceRequiredChecksRun persistence model and migration", () => {
    expect(workspaceRequiredChecksRunPersistenceContract.model).toBe("WorkspaceRequiredChecksRun");
    expect(workspaceRequiredChecksRunPersistenceContract.tenantRelation).toBe("workspaceRequiredChecksRuns");
    expect(workspaceRequiredChecksRunPersistenceContract.migration).toBe(
      "20260609032400_add_workspace_required_checks_runs",
    );
    expect(workspaceRequiredChecksRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "branchProtectionCheckMatrix",
      "artifactManifest",
      "mergeBlockProofManifest",
      "redactedLogManifest",
    ]);
    expect(workspaceRequiredChecksRunPersistenceContract.evidenceBooleans).toContain("workspaceRequiredChecksPassed");
    expect(workspaceRequiredChecksRunPersistenceContract.evidenceBooleans).toContain("prGapDiffCheckBlocksMerge");
    expect(workspaceRequiredChecksRunPersistenceContract.evidenceBooleans).toContain("logsRedacted");
    expect(workspaceRequiredChecksRunPersistenceContract.artifactFields).toContain("branchProtectionArtifactPath");
    expect(workspaceRequiredChecksRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("workspaceRequiredChecksRuns WorkspaceRequiredChecksRun[]");
    expect(prismaSchema).toContain("model WorkspaceRequiredChecksRun");
    expect(prismaSchema).toContain("mergeBlockProofManifest");
    expect(prismaSchema).toContain("prGapDiffCheckBlocksMerge");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(workspaceRequiredChecksMigration).toContain('CREATE TABLE "WorkspaceRequiredChecksRun"');
    expect(workspaceRequiredChecksMigration).toContain('"branchProtectionCheckMatrix" JSONB NOT NULL');
    expect(workspaceRequiredChecksMigration).toContain('"logsRedacted" BOOLEAN NOT NULL DEFAULT false');
    expect(workspaceRequiredChecksMigration).toContain(
      'CREATE UNIQUE INDEX "WorkspaceRequiredChecksRun_tenantId_runId_key"',
    );
  });

  it("keeps workspace and quality required-check contracts wired", () => {
    expect(rootPackageJson).toContain('"workspace:required-checks"');
    expect(rootPackageJson).toContain('"workspace:all"');
    expect(rootPackageJson).toContain('"quality:required-checks"');
    expect(requiredChecksContract).toContain("workspace:required-checks");
    expect(requiredChecksContract).toContain("requiredBranchProtectionChecks");
    expect(requiredChecksVerifier).toContain("buildWorkspaceRequiredChecksReadinessPlan");
    expect(workspaceTests).toContain("buildWorkspaceRequiredChecksReadinessPlan");
    expect(qualityRequiredChecksContract).toContain("required-checks");
  });

  it("keeps branch protection and merge-block evidence explicit until GitHub proof exists", () => {
    expect(workspaceRequiredChecksReadiness.status).toBe("blocked");
    expect(workspaceRequiredChecksReadiness.missingBranchProtectionChecks).toEqual([...workspaceRequiredBranchProtectionChecks]);
    expect(workspaceRequiredChecksReadiness.requiredCommands).toBe(workspaceRequiredChecksCommands);
    expect(workspaceRequiredChecksReadiness.requiredEvidence).toBe(workspaceRequiredChecksReadinessRequiredEvidence);
    expect(workspaceRequiredChecksReadiness.blockers).toContain("Workspace required-check contract audit must pass.");
    expect(workspaceRequiredChecksReadiness.blockers).toContain("GitHub branch protection must require every workspace and PR gap-diff check before merge.");
  });

  it("blocks workspace required checks closure until commands, branch protection, merge-blocks, logs, persistence, and artifacts are proven", () => {
    const decision = buildWorkspaceRequiredChecksEvidenceDecision({
      requiredChecksAuditPassed: true,
      workspaceRequiredChecksPassed: true,
      workspaceAllPassed: false,
      qualityRequiredChecksPassed: false,
      ciQualityJobPassed: false,
      branchProtectionEvidenceCaptured: false,
      failingWorkspaceAuditBlocksMerge: false,
      prGapDiffCheckBlocksMerge: false,
      evidenceCaptured: false,
      logsRedacted: false,
      workspaceRequiredChecksRunPersisted: false,
      redactedEvidenceBundleCaptured: false,
      protectedBranchRequiredChecks: ["CI / quality"],
      capturedArtifacts: [
        "coverage/workspace-required-checks-runtime.json",
        "coverage/workspace-required-checks-output.txt",
      ],
      completedCommands: ["pnpm workspace:required-checks"],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingBranchProtectionChecks).toEqual([
      "CI / workspace required checks",
      "CI / workspace runtime readiness",
      "CI / PR GAP tracker diff evidence",
      "CI / required quality checks",
    ]);
    expect(decision.missingArtifacts).toEqual([
      "coverage/workspace-required-checks-all-output.txt",
      "coverage/workspace-required-checks-quality-output.txt",
      "coverage/workspace-required-checks-ci-quality.json",
      "coverage/workspace-required-checks-branch-protection-redacted.json",
      "coverage/workspace-required-checks-failing-workspace-pr-redacted.json",
      "coverage/workspace-required-checks-failing-gap-diff-pr-redacted.json",
      "coverage/workspace-required-checks-redacted-logs.json",
      "coverage/workspace-required-checks-redacted-evidence-bundle.json",
      "test-results/workspace-required-checks-runtime",
    ]);
    expect(decision.missingCommands).toEqual([
      "pnpm workspace:all",
      "pnpm quality:required-checks",
      "GitHub Actions CI / quality",
      "GitHub branch protection required-check review",
      "Failing workspace-audit PR merge-block proof",
      "PR GAP tracker diff evidence merge-block proof",
      "required-check evidence logs redacted and secret-free",
    ]);
    expect(decision.requiredBranchProtectionChecks).toBe(workspaceRequiredBranchProtectionChecks);
    expect(decision.requiredArtifacts).toBe(workspaceRequiredChecksArtifactPaths);
    expect(decision.requiredCommands).toBe(workspaceRequiredChecksCommands);
    expect(decision.requiredEvidence).toEqual(
      buildWorkspaceRequiredChecksDecisionRequiredEvidence(workspaceRequiredChecksReadinessRequiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(workspaceRequiredChecksRequiredEvidence);
    expect(decision.blockers).toContain("Every required workspace checks command must be completed.");
    expect(decision.blockers).toContain("WorkspaceRequiredChecksRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Redacted workspace required-checks evidence bundle must be captured.");
    expect(decision.blockers).toContain("Every required workspace checks artifact must be captured.");
  });

  it("completes workspace required checks closure when commands, branch protection, merge-blocks, logs, persistence, and artifacts are proven", () => {
    const decision = buildWorkspaceRequiredChecksEvidenceDecision({
      requiredChecksAuditPassed: true,
      workspaceRequiredChecksPassed: true,
      workspaceAllPassed: true,
      qualityRequiredChecksPassed: true,
      ciQualityJobPassed: true,
      branchProtectionEvidenceCaptured: true,
      failingWorkspaceAuditBlocksMerge: true,
      prGapDiffCheckBlocksMerge: true,
      evidenceCaptured: true,
      logsRedacted: true,
      workspaceRequiredChecksRunPersisted: true,
      redactedEvidenceBundleCaptured: true,
      protectedBranchRequiredChecks: workspaceRequiredBranchProtectionChecks,
      capturedArtifacts: workspaceRequiredChecksArtifactPaths,
      completedCommands: workspaceRequiredChecksCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingBranchProtectionChecks).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming merge-block enforcement is live", () => {
    expect(ciWorkflow).toContain("Run Phase 18 workspace required checks runtime contracts");
    expect(ciWorkflow).toContain("workspace-required-checks-runtime-static.test.ts");
    expect(ciWorkflow).toContain("workspace-required-checks-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-workspace-required-checks-runtime-static");
    expect(unitManifest).toContain("WorkspaceRequiredChecksRun Prisma model and app row contract");
    expect(gapTracker).toContain("WorkspaceRequiredChecksRun");
    expect(gapTracker).toContain("apps/web/lib/workspaceRequiredChecksRuntime.ts");
    expect(gapTracker).toContain(
      "live command, CI, branch-protection, failing-PR merge-block, PR gap-diff merge-block, redacted-log, persisted run, and artifact evidence remain gated",
    );
    expect(gapTracker).toContain("GAP-133 workspace required-checks artifact hardening");
    expect(gapTracker).toContain("buildWorkspaceRequiredChecksExecutionPlan");
    expect(gapTracker).toContain("workspaceRequiredChecksExecutionPolicy");
    expect(gapTracker).toContain("workspaceRequiredChecksReadinessRequiredEvidence");
    expect(gapTracker).toContain("workspaceRequiredChecksRequiredEvidence");
    expect(gapTracker).toContain("workspaceRequiredChecksRequiredExternalEvidence");
    expect(gapTracker).toContain("buildWorkspaceRequiredChecksArtifactReview");
    expect(gapTracker).toContain("buildWorkspaceRequiredChecksRedactedEvidenceBundle");
  });

  it("pins current workspace required checks runtime proof files for GAP-133", () => {
    expect(workspaceRequiredChecksProofFiles).toEqual(
      expect.arrayContaining([
      "docs/workspace/WORKSPACE_AUDIT_PROTOCOL.md",
      "docs/workspace/manifests/workspace-required-checks-audit.json",
      "packages/quality/src/index.ts",
      "packages/quality/tests/quality-gates.test.ts",
      "packages/workspace/src/index.ts",
      "scripts/quality/print-quality-gates.mjs",
        ".github/workflows/ci.yml",
        "package.json",
        "docs/workspace/manifests/workspace-required-checks-contract.json",
        "scripts/workspace/verify-workspace-required-checks.mjs",
        "apps/web/lib/workspaceRequiredChecksRuntime.ts",
        "apps/web/tests/workspace-required-checks-runtime-static.test.ts",
        "packages/db/prisma/migrations/20260609032400_add_workspace_required_checks_runs/migration.sql"
      ])
    );
    for (const file of workspaceRequiredChecksProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps GAP-133 execution policy non-executing while separating GitHub merge-block proof", () => {
    const plan = buildWorkspaceRequiredChecksExecutionPlan();

    expect(plan.localCommands).toBe(workspaceRequiredChecksLocalCommands);
    expect(plan.externalCommands).toBe(workspaceRequiredChecksExternalCommands);
    expect(plan.localArtifacts).toBe(workspaceRequiredChecksLocalArtifacts);
    expect(plan.externalArtifacts).toBe(workspaceRequiredChecksExternalArtifacts);
    expect(plan.localArtifacts).toContain("coverage/workspace-required-checks-output.txt");
    expect(plan.externalArtifacts).toEqual([
      "coverage/workspace-required-checks-ci-quality.json",
      "coverage/workspace-required-checks-branch-protection-redacted.json",
      "coverage/workspace-required-checks-failing-workspace-pr-redacted.json",
      "coverage/workspace-required-checks-failing-gap-diff-pr-redacted.json",
      "coverage/workspace-required-checks-redacted-logs.json",
      "coverage/workspace-required-checks-redacted-evidence-bundle.json",
      "test-results/workspace-required-checks-runtime",
    ]);
    expect(plan).toMatchObject({
      workspaceRequiredChecksExecutionAllowed: false,
      workspaceAllExecutionAllowed: false,
      qualityRequiredChecksExecutionAllowed: false,
      ciQualityJobExecutionAllowed: false,
      branchProtectionReviewExecutionAllowed: false,
      failingWorkspacePrMergeBlockExecutionAllowed: false,
      prGapDiffMergeBlockExecutionAllowed: false,
      redactedLogReviewExecutionAllowed: false,
      persistenceExecutionAllowed: false,
    });
    expect(plan.executionPolicy).toBe(workspaceRequiredChecksExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyStaticWorkspaceRequiredChecks: true,
      commandEvidenceRequiredForClosure: true,
      ciQualityEvidenceRequiredForClosure: true,
      branchProtectionEvidenceRequiredForClosure: true,
      mergeBlockEvidenceRequiredForClosure: true,
      redactedLogsRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
    });
    expect(plan.requiredExternalEvidence).toBe(workspaceRequiredChecksRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain(
      "Redacted GitHub branch-protection settings proving every workspace and PR gap-diff check is required before merge.",
    );
    expect(plan.requiredExternalEvidence).toContain("Durable WorkspaceRequiredChecksRun persistence row captured from the target database.");
    expect(plan.requiredExternalEvidence).toContain(
      "Redacted workspace required-checks evidence bundle captured without raw GitHub settings, merge-block logs, tokens, URLs, or actor identifiers.",
    );
  });

  it("redacts workspace required-check artifacts before tracker or handoff use", () => {
    const artifact = {
      runId: "workspace_required_checks_01HZYXZYXZYXZYXZYXZYXZYXZ",
      repositoryUrl: "https://github.com/dominator509/InkRoute/settings/branches",
      branchProtectionSettings: {
        tenantId: "tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
      },
      mergeBlockLog: "blocked owner@example.com with token github_pat_1234567890ABCDEFGHIJKLMNOP",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/27171288295",
      workspaceAuditOutput: "workspace audit failed for user_private_123",
      prGapDiffPayload: { branchName: "feature/private-gap" },
      failingPrMergeBlockProof: "merge blocked run_private_123",
      codeownersReviewBody: "review from owner_private_123",
      rawGitHubPayload: { repository: "private/repo" },
      neutralWorkspaceTrace: "workspace_audit_01HZYXZYXZYXZYXZYXZYXZYXZ blocked gap_diff_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralCheckTrace: "required_check_01HZYXZYXZYXZYXZYXZYXZYXZ failed workflow ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralReviewerTrace: "reviewer_private_01HZYXZYXZYXZYXZYXZYXZYXZ approved codeowner_private_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralArtifactTrace: "workspace diff stored reports/workspace/private-gap-diff.patch",
    };

    expect(buildRedactedWorkspaceRequiredChecksArtifact(artifact)).toEqual({
      runId: "[REDACTED]",
      repositoryUrl: "[REDACTED]",
      branchProtectionSettings: "[REDACTED]",
      mergeBlockLog: "[REDACTED]",
      ciRunUrl: "[REDACTED]",
      workspaceAuditOutput: "[REDACTED]",
      prGapDiffPayload: "[REDACTED]",
      failingPrMergeBlockProof: "[REDACTED]",
      codeownersReviewBody: "[REDACTED]",
      rawGitHubPayload: "[REDACTED]",
      neutralWorkspaceTrace: "[REDACTED]",
      neutralCheckTrace: "[REDACTED]",
      neutralReviewerTrace: "[REDACTED]",
      neutralArtifactTrace: "[REDACTED]",
    });

    const review = buildWorkspaceRequiredChecksArtifactReview(artifact);
    const bundle = buildWorkspaceRequiredChecksRedactedEvidenceBundle(artifact);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(workspaceRequiredChecksRequiredExternalEvidence);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "runId",
        "repositoryUrl",
        "branchProtectionSettings",
        "mergeBlockLog",
        "ciRunUrl",
        "workspaceAuditOutput",
        "prGapDiffPayload",
        "failingPrMergeBlockProof",
        "codeownersReviewBody",
        "rawGitHubPayload",
        "neutralWorkspaceTrace",
        "neutralCheckTrace",
        "neutralReviewerTrace",
        "neutralArtifactTrace",
      ]),
    );
    expect(JSON.stringify(review.artifact)).not.toContain("workspace_audit_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(review.artifact)).not.toContain("gap_diff_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(review.artifact)).not.toContain("ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(review.artifact)).not.toContain("reviewer_private_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(review.artifact)).not.toContain("codeowner_private_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(review.artifact)).not.toContain("reports/workspace/private-gap-diff.patch");
    expect(review.requiredExternalEvidence).toContain("Required-check evidence logs reviewed as redacted and secret-free.");
    expect(bundle.status).toBe("redacted-evidence-bundle-ready");
    expect(bundle.artifactPath).toBe("coverage/workspace-required-checks-redacted-evidence-bundle.json");
    expect(bundle.review.safeForTracker).toBe(true);
    expect(bundle.requiredArtifacts).toBe(workspaceRequiredChecksArtifactPaths);
    expect(bundle.requiredExternalEvidence).toBe(workspaceRequiredChecksRequiredExternalEvidence);
    expect(bundle.providerExecutionAllowed).toBe(false);
  });
});


