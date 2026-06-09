import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  repositoryGovernanceExternalSettings,
  repositoryGovernanceRuntimeArtifactPaths,
  repositoryGovernanceRuntimeCommands,
  repositoryGovernanceRuntimeMatrix,
  repositoryGovernanceRuntimeReadiness,
  repositoryGovernanceRunPersistenceContract,
  repositoryGovernanceSourcePrerequisites,
} from "../lib/repositoryGovernanceRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("repository governance runtime contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const codeowners = readRepoFile(".github/CODEOWNERS");
  const prTemplate = readRepoFile(".github/PULL_REQUEST_TEMPLATE.md");
  const issueTemplate = readRepoFile(".github/ISSUE_TEMPLATE/gap_closure.md");
  const governanceContract = readRepoFile("docs/quality/manifests/repository-governance-contract.json");
  const governanceVerifier = readRepoFile("scripts/quality/verify-repository-governance.mjs");
  const qualityTests = readRepoFile("packages/quality/tests/quality-gates.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const prismaMigration = readRepoFile("packages/db/prisma/migrations/20260609028000_add_repository_governance_runs/migration.sql");

  it("pins governance commands, prerequisites, external settings, matrix rows, and artifacts", () => {
    expect(repositoryGovernanceRuntimeCommands).toEqual([
      "pnpm quality:governance",
      "pnpm quality:all",
      "gh branch protection or repository rules audit",
      "GitHub required status checks review",
      "GitHub CODEOWNERS review enforcement test PR",
      "GitHub secret scanning/security alerts settings review",
    ]);
    expect(repositoryGovernanceSourcePrerequisites).toEqual([
      "governance-audit",
      "required-files",
      "codeowners-coverage",
      "pull-request-template",
      "gap-closure-issue-template",
      "ci-governance-terms",
    ]);
    expect(repositoryGovernanceExternalSettings).toEqual([
      "branch-protection",
      "required-status-checks",
      "codeowners-review",
      "secret-scanning",
      "dependabot-or-security-alerts",
      "merge-rules",
      "enforcement-test-pr",
      "redacted-settings-evidence",
    ]);
    expect(repositoryGovernanceRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "source-governance-audit",
      "quality-all-governance-chain",
      "branch-protection-settings",
      "required-status-checks",
      "codeowners-review-enforcement",
      "security-alert-settings",
      "merge-rules-settings",
      "enforcement-test-pr",
    ]);
    expect(repositoryGovernanceRuntimeArtifactPaths).toContain("coverage/repository-governance-runtime.json");
    expect(repositoryGovernanceRuntimeArtifactPaths).toContain("test-results/repository-governance-runtime");
  });

  it("keeps source-controlled governance prerequisites wired", () => {
    expect(rootPackageJson).toContain('"quality:governance"');
    expect(rootPackageJson).toContain('"quality:all"');
    expect(codeowners).toContain("*");
    expect(prTemplate).toContain("Gap evidence");
    expect(issueTemplate).toContain("Gap");
    expect(governanceContract).toContain("branchProtection");
    expect(governanceContract).toContain("requiredStatusChecks");
    expect(governanceVerifier).toContain("buildRepositoryGovernanceRuntimeReadinessPlan");
    expect(qualityTests).toContain("buildRepositoryGovernanceRuntimeReadinessPlan");
  });

  it("keeps source prerequisites complete while external repository settings remain gated", () => {
    expect(repositoryGovernanceRuntimeReadiness.status).toBe("blocked");
    expect(repositoryGovernanceRuntimeReadiness.missingSourcePrerequisites).toEqual([]);
    expect(repositoryGovernanceRuntimeReadiness.missingExternalSettings).toEqual([
      "branch-protection",
      "required-status-checks",
      "codeowners-review",
      "secret-scanning",
      "dependabot-or-security-alerts",
      "merge-rules",
      "enforcement-test-pr",
      "redacted-settings-evidence",
    ]);
    expect(repositoryGovernanceRuntimeReadiness.requiredCommands).toEqual([...repositoryGovernanceRuntimeCommands]);
    expect(repositoryGovernanceRuntimeReadiness.requiredEvidence).toEqual([
      "Repository governance audit output with required files, CODEOWNERS, PR/issue templates, and CI terms passing.",
      "Redacted branch protection settings proving required checks and review rules are active.",
      "Required status check list including CI quality and PR gap-diff enforcement.",
      "CODEOWNERS review enforcement proof on a protected surface change.",
      "Secret scanning and Dependabot/security alert settings proof.",
      "Merge queue, required linear history, or equivalent merge-rule proof.",
      "Test PR evidence proving enforcement without exposing secrets.",
    ]);
  });

  it("wires CI, manifest, tracker, and artifact capture without claiming GitHub settings are configured", () => {
    expect(ciWorkflow).toContain("Run Phase 16 repository governance runtime contracts");
    expect(ciWorkflow).toContain("repository-governance-runtime-static.test.ts");
    expect(ciWorkflow).toContain("repository-governance-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-repository-governance-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/repositoryGovernanceRuntime.ts");
    expect(gapTracker).toContain("live GitHub branch protection, required-check, CODEOWNERS review, secret-scanning, security-alert, merge-rule, and enforcement-test evidence remain open");
  });

  it("pins durable RepositoryGovernanceRun persistence for GitHub settings enforcement proof", () => {
    expect(repositoryGovernanceRunPersistenceContract.prismaModel).toBe("RepositoryGovernanceRun");
    expect(repositoryGovernanceRunPersistenceContract.tenantRelation).toBe("repositoryGovernanceRuns");
    expect(repositoryGovernanceRunPersistenceContract.uniqueKey).toEqual(["tenantId", "runId"]);
    expect(repositoryGovernanceRunPersistenceContract.jsonFields).toEqual([
      "sourcePrerequisiteMatrix",
      "externalSettingsMatrix",
      "enforcementTestMatrix",
      "artifactManifest",
    ]);
    expect(repositoryGovernanceRunPersistenceContract.requiredBooleanProofs).toEqual(
      expect.arrayContaining([
        "governanceAuditPassed",
        "branchProtectionActive",
        "requiredStatusChecksEnforced",
        "codeownersReviewRequired",
        "secretScanningEnabled",
        "mergeRulesConfigured",
        "enforcementTestPrCaptured",
        "redactedSettingsEvidenceCaptured",
      ]),
    );
    expect(repositoryGovernanceRunPersistenceContract.redactedArtifactFields).toContain("branchProtectionArtifactPath");
    expect(prismaSchema).toContain("repositoryGovernanceRuns RepositoryGovernanceRun[]");
    expect(prismaSchema).toContain("model RepositoryGovernanceRun");
    expect(prismaSchema).toContain("externalSettingsMatrix                  Json");
    expect(prismaSchema).toContain("redactedSettingsEvidenceCaptured        Boolean  @default(false)");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(prismaMigration).toContain('CREATE TABLE "RepositoryGovernanceRun"');
    expect(prismaMigration).toContain('"enforcementTestPrArtifactPath" TEXT');
    expect(unitManifest).toContain("RepositoryGovernanceRun Prisma model and app row contract");
    expect(gapTracker).toContain("packages/db/prisma/migrations/20260609028000_add_repository_governance_runs/migration.sql");
  });
});
