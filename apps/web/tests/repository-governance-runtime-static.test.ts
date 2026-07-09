import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRepositoryGovernanceDecisionRequiredEvidence,
  repositoryGovernanceExternalSettings,
  repositoryGovernanceRuntimeExternalArtifacts,
  repositoryGovernanceRuntimeArtifactPaths,
  repositoryGovernanceRuntimeCommands,
  repositoryGovernanceRuntimeExternalCommands,
  repositoryGovernanceRuntimeExecutionPolicy,
  repositoryGovernanceRuntimeLocalArtifacts,
  repositoryGovernanceRuntimeLocalCommands,
  repositoryGovernanceRuntimeMatrix,
  repositoryGovernanceRuntimeProofFiles,
  repositoryGovernanceRuntimeReadiness,
  repositoryGovernanceRuntimeRequiredExternalEvidence,
  repositoryGovernanceRuntimeRequiredEvidence,
  repositoryGovernanceRunPersistenceContract,
  repositoryGovernanceSourcePrerequisites,
  buildRepositoryGovernanceEvidenceDecision,
  buildRepositoryGovernanceRuntimeArtifactReview,
  buildRepositoryGovernanceRuntimeExecutionPlan,
  buildRepositoryGovernanceRuntimeRedactedEvidenceBundle,
  buildRedactedRepositoryGovernanceArtifact,
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
      "GitHub secret scanning settings review",
      "GitHub Dependabot/security alerts settings review",
      "GitHub merge rules settings review",
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
      "secret-scanning-settings",
      "merge-rules-settings",
      "enforcement-test-pr",
      "redacted-evidence-bundle",
    ]);
    expect(repositoryGovernanceRuntimeArtifactPaths).toContain("coverage/repository-governance-runtime.json");
    expect(repositoryGovernanceRuntimeArtifactPaths).toContain("coverage/repository-governance-redacted-evidence-bundle.json");
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
    expect(repositoryGovernanceRuntimeReadiness.requiredCommands).toBe(repositoryGovernanceRuntimeCommands);
    expect(repositoryGovernanceRuntimeReadiness.requiredEvidence).toBe(repositoryGovernanceRuntimeRequiredEvidence);
  });

  it("blocks repository governance closure until GitHub settings, enforcement, persistence, artifact, and command proof exist", () => {
    const decision = buildRepositoryGovernanceEvidenceDecision({
      governanceAuditPassed: true,
      qualityAllGovernancePassed: true,
      requiredFilesPresent: true,
      codeownersCoveragePassed: true,
      prTemplateEvidenceTermsPresent: true,
      issueTemplateEvidenceTermsPresent: true,
      ciGovernanceTermsPresent: true,
      branchProtectionActive: false,
      requiredStatusChecksEnforced: false,
      codeownersReviewRequired: false,
      secretScanningEnabled: false,
      dependabotOrSecurityAlertsEnabled: false,
      mergeRulesConfigured: false,
      enforcementTestPrCaptured: false,
      redactedSettingsEvidenceCaptured: false,
      repositoryGovernanceRunPersisted: false,
      capturedArtifacts: [
        "coverage/repository-governance-runtime.json",
        "coverage/repository-governance-audit-output.txt",
        "coverage/repository-governance-quality-all-output.txt",
      ],
      completedCommands: ["pnpm quality:governance", "pnpm quality:all"],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingArtifacts).toEqual([
      "coverage/repository-branch-protection-redacted.json",
      "coverage/repository-required-checks-redacted.json",
      "coverage/repository-codeowners-review-redacted.json",
      "coverage/repository-security-settings-redacted.json",
      "coverage/repository-merge-rules-redacted.json",
      "coverage/repository-enforcement-test-pr-redacted.json",
      "coverage/repository-governance-redacted-evidence-bundle.json",
      "test-results/repository-governance-runtime",
    ]);
    expect(decision.missingCommands).toEqual([
      "gh branch protection or repository rules audit",
      "GitHub required status checks review",
      "GitHub CODEOWNERS review enforcement test PR",
      "GitHub secret scanning settings review",
      "GitHub Dependabot/security alerts settings review",
      "GitHub merge rules settings review",
    ]);
    expect(decision.requiredArtifacts).toBe(repositoryGovernanceRuntimeArtifactPaths);
    expect(decision.requiredCommands).toBe(repositoryGovernanceRuntimeCommands);
    expect(decision.requiredEvidence).toEqual(
      buildRepositoryGovernanceDecisionRequiredEvidence(repositoryGovernanceRuntimeReadiness.requiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(repositoryGovernanceRuntimeRequiredEvidence);
    expect(decision.blockers).toContain("GitHub branch protection must be active for the protected branch.");
    expect(decision.blockers).toContain("RepositoryGovernanceRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Every required repository governance artifact must be captured.");
  });

  it("completes repository governance closure when source, GitHub settings, enforcement, persistence, artifacts, and commands are proven", () => {
    const decision = buildRepositoryGovernanceEvidenceDecision({
      governanceAuditPassed: true,
      qualityAllGovernancePassed: true,
      requiredFilesPresent: true,
      codeownersCoveragePassed: true,
      prTemplateEvidenceTermsPresent: true,
      issueTemplateEvidenceTermsPresent: true,
      ciGovernanceTermsPresent: true,
      branchProtectionActive: true,
      requiredStatusChecksEnforced: true,
      codeownersReviewRequired: true,
      secretScanningEnabled: true,
      dependabotOrSecurityAlertsEnabled: true,
      mergeRulesConfigured: true,
      enforcementTestPrCaptured: true,
      redactedSettingsEvidenceCaptured: true,
      repositoryGovernanceRunPersisted: true,
      capturedArtifacts: repositoryGovernanceRuntimeArtifactPaths,
      completedCommands: repositoryGovernanceRuntimeCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifact capture without claiming GitHub settings are configured", () => {
    expect(ciWorkflow).toContain("Run Phase 16 repository governance runtime contracts");
    expect(ciWorkflow).toContain("repository-governance-runtime-static.test.ts");
    expect(ciWorkflow).toContain("repository-governance-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-repository-governance-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/repositoryGovernanceRuntime.ts");
    expect(gapTracker).toContain("live GitHub branch protection, required-check, CODEOWNERS review, secret-scanning, security-alert, merge-rule, and enforcement-test evidence remain open");
    expect(gapTracker).toContain("GAP-125 is repository-governance-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildRepositoryGovernanceDecisionRequiredEvidence");
    expect(gapTracker).toContain("repositoryGovernanceRuntimeRequiredEvidence");
    expect(gapTracker).toContain("buildRepositoryGovernanceRuntimeExecutionPlan");
    expect(gapTracker).toContain("repositoryGovernanceRuntimeExecutionPolicy");
    expect(gapTracker).toContain("repositoryGovernanceRuntimeRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRepositoryGovernanceRuntimeArtifactReview");
    expect(gapTracker).toContain("buildRepositoryGovernanceRuntimeRedactedEvidenceBundle");
  });

  it("pins current repository governance runtime proof files for GAP-125", () => {
    expect(repositoryGovernanceRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      ".github/workflows/release-governance.yml",
      "docs/quality/QUALITY_GATE_PROTOCOL.md",
      "docs/quality/README.md",
      "docs/quality/manifests/repository-governance-audit.json",
      "packages/quality/src/index.ts",
        ".github/CODEOWNERS",
        ".github/PULL_REQUEST_TEMPLATE.md",
        "scripts/quality/verify-repository-governance.mjs",
        "apps/web/lib/repositoryGovernanceRuntime.ts",
        "apps/web/tests/repository-governance-runtime-static.test.ts",
        "packages/db/prisma/migrations/20260609028000_add_repository_governance_runs/migration.sql",
        ".github/workflows/ci.yml"
      ])
    );
    for (const file of repositoryGovernanceRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
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

  it("keeps external repository settings execution disabled while splitting source governance from GitHub proof", () => {
    const plan = buildRepositoryGovernanceRuntimeExecutionPlan();

    expect(plan.localCommands).toBe(repositoryGovernanceRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(repositoryGovernanceRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(repositoryGovernanceRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(repositoryGovernanceRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toEqual([
      "coverage/repository-governance-runtime.json",
      "coverage/repository-governance-audit-output.txt",
      "coverage/repository-governance-quality-all-output.txt",
      "test-results/repository-governance-runtime",
    ]);
    expect(plan.externalArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/repository-branch-protection-redacted.json",
        "coverage/repository-required-checks-redacted.json",
        "coverage/repository-codeowners-review-redacted.json",
        "coverage/repository-security-settings-redacted.json",
        "coverage/repository-merge-rules-redacted.json",
        "coverage/repository-enforcement-test-pr-redacted.json",
        "coverage/repository-governance-redacted-evidence-bundle.json",
      ]),
    );
    expect(plan.governanceAuditExecutionAllowed).toBe(false);
    expect(plan.qualityAllExecutionAllowed).toBe(false);
    expect(plan.branchProtectionAuditExecutionAllowed).toBe(false);
    expect(plan.requiredChecksReviewExecutionAllowed).toBe(false);
    expect(plan.codeownersReviewTestExecutionAllowed).toBe(false);
    expect(plan.secretScanningReviewExecutionAllowed).toBe(false);
    expect(plan.securityAlertsReviewExecutionAllowed).toBe(false);
    expect(plan.mergeRulesReviewExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.executionPolicy).toBe(repositoryGovernanceRuntimeExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifySourceGovernance: true,
      githubSettingsRequiredForClosure: true,
      branchProtectionEvidenceRequired: true,
      securitySettingsEvidenceRequired: true,
      enforcementTestPrRequired: true,
      providerDatabaseRequiredForPersistence: true,
    });
    expect(plan.externalEvidenceRequired).toBe(repositoryGovernanceRuntimeRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toContain(
      "Redacted repository governance evidence bundle must omit raw repository settings payloads, PR URLs, check-run URLs, tokens, actors, reviewer details, and provider identifiers.",
    );
  });

  it("redacts repository governance artifacts before settings proof retention", () => {
    const rawArtifact = {
      branchProtectionPayload: { requiredReviewers: ["owner@example.com"], token: "ghp_secret" },
      requiredChecksUrl: "https://github.com/dominator509/InkRoute/settings/branches",
      enforcementPrUrl: "https://github.com/dominator509/InkRoute/pull/123",
      securitySettings: { secretScanningActor: "security@example.com", phone: "+1 555 123 7777" },
      mergeRulesPayload: { bypassActor: "user_admin_123" },
      repositorySettingsResponse: { reviewerLogin: "dominator509", checkRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/123/checks" },
      commandOutput: "gh api repos/dominator509/InkRoute/branches/main/protection",
      stackTrace: "Error: branch protection audit failed for repo InkRoute",
      artifactPath: "coverage/repository-governance/raw-settings.json",
      neutralGovernanceTrace: "codeowners_review_01HZYXZYXZYXZYXZYXZYXZYXZ approved branch_rule_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralSecurityTrace: "security_alert_01HZYXZYXZYXZYXZYXZYXZYXZ linked dependabot_alert_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralCiTrace: "workflow ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ checked commit_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralArtifactTrace: "raw settings stored reports/repository-governance/private-settings.json",
      nested: {
        authorization: "Bearer repository-governance-token",
        runId: "run_repo_123",
      },
    };
    const redacted = buildRedactedRepositoryGovernanceArtifact(rawArtifact);
    const review = buildRepositoryGovernanceRuntimeArtifactReview("coverage/repository-branch-protection-redacted.json", rawArtifact);
    const bundle = buildRepositoryGovernanceRuntimeRedactedEvidenceBundle("coverage/repository-branch-protection-redacted.json", rawArtifact);
    const serialized = JSON.stringify(bundle);

    expect(JSON.stringify(redacted)).not.toContain("owner@example.com");
    expect(serialized).not.toContain("ghp_secret");
    expect(serialized).not.toContain("github.com/dominator509");
    expect(serialized).not.toContain("security@example.com");
    expect(serialized).not.toContain("+1 555 123 7777");
    expect(serialized).not.toContain("user_admin_123");
    expect(serialized).not.toContain("dominator509");
    expect(serialized).not.toContain("branches/main/protection");
    expect(serialized).not.toContain("branch protection audit failed");
    expect(serialized).not.toContain("raw-settings.json");
    expect(serialized).not.toContain("codeowners_review_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("branch_rule_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("security_alert_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("reports/repository-governance/private-settings.json");
    expect(serialized).not.toContain("Bearer repository-governance-token");
    expect(serialized).not.toContain("run_repo_123");
    expect(review.containsUnredactedSensitiveValues).toBe(false);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "authorization",
        "branchProtectionPayload",
        "enforcementPrUrl",
        "mergeRulesPayload",
        "repositorySettingsResponse",
        "requiredChecksUrl",
        "runId",
        "securitySettings",
        "commandOutput",
        "stackTrace",
        "artifactPath",
        "neutralArtifactTrace",
        "neutralCiTrace",
        "neutralGovernanceTrace",
        "neutralSecurityTrace",
      ]),
    );
    expect(review.externalEvidenceRequired).toBe(repositoryGovernanceRuntimeRequiredExternalEvidence);
    expect(review.externalEvidenceRequired).toEqual(
      expect.arrayContaining([
        "GitHub branch protection, required checks, CODEOWNERS review, security settings, and merge-rule evidence must be captured from repository settings with tokens and actors redacted.",
        "Enforcement-test PR evidence must prove settings block unsafe merges without exposing PR URLs, check-run URLs, or private reviewer details.",
        "Secret scanning and security alert proof must redact provider identifiers and repository settings payloads.",
        "RepositoryGovernanceRun persistence must execute only against an approved provider-backed database.",
        "Redacted repository governance evidence bundle must omit raw repository settings payloads, PR URLs, check-run URLs, tokens, actors, reviewer details, and provider identifiers.",
      ]),
    );
    expect(bundle.status).toBe("redacted-evidence-bundle-ready");
    expect(bundle.sourceArtifactPath).toBe("coverage/repository-branch-protection-redacted.json");
    expect(bundle.artifactPath).toBe("coverage/repository-governance-redacted-evidence-bundle.json");
    expect(bundle.review.containsUnredactedSensitiveValues).toBe(false);
    expect(bundle.requiredArtifacts).toBe(repositoryGovernanceRuntimeArtifactPaths);
    expect(bundle.externalEvidenceRequired).toBe(repositoryGovernanceRuntimeRequiredExternalEvidence);
    expect(bundle.branchProtectionAuditExecutionAllowed).toBe(false);
    expect(bundle.requiredChecksReviewExecutionAllowed).toBe(false);
    expect(bundle.codeownersReviewTestExecutionAllowed).toBe(false);
    expect(bundle.secretScanningReviewExecutionAllowed).toBe(false);
    expect(bundle.securityAlertsReviewExecutionAllowed).toBe(false);
    expect(bundle.mergeRulesReviewExecutionAllowed).toBe(false);
    expect(bundle.persistenceExecutionAllowed).toBe(false);
  });
});



