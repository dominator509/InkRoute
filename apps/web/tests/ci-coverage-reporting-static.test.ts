import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedCiCoverageArtifact,
  buildCiCoverageReportingArtifactReview,
  buildCiCoverageReportingEvidenceDecision,
  buildCiCoverageReportingExecutionPlan,
  buildCiCoverageRunData,
  buildCiCoverageRunPersistenceContract,
  ciCoverageRunPersistencePreview,
  ciCoverageReportingArtifactPaths,
  ciCoverageReportingCommands,
  ciCoverageReportingExecutionPolicy,
  ciCoverageReportingExternalArtifacts,
  ciCoverageReportingLocalArtifacts,
  ciCoverageReportingLocalCommands,
  ciCoverageReportingMatrix,
  ciCoverageReportingProofFiles,
  ciCoverageReportingRequiredExternalEvidence,
  ciCoverageReportingReadiness,
  persistCiCoverageRun
} from "../lib/ciCoverageReporting";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const packageJson = read("package.json");
const vitestWorkspace = read("vitest.workspace.ts");
const playwrightConfig = read("playwright.config.ts");
const phase14StaticCheck = read("testing/scripts/phase14-static-check.mjs");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");

describe("GAP-111 CI coverage and reporting wiring", () => {
  it("pins CI coverage/reporting commands, matrix entries, and artifact paths", () => {
    expect(ciCoverageReportingCommands).toEqual([
      "pnpm install --frozen-lockfile",
      "pnpm typecheck",
      "pnpm test:unit:coverage",
      "pnpm test:e2e",
      "gh run view <ci-run-id> --json conclusion,status,url",
      "gh api repos/:owner/:repo/actions/runs/<ci-run-id>/artifacts",
      "verify branch protection requires CI quality check"
    ]);
    expect(ciCoverageReportingMatrix.map((entry) => entry.id)).toEqual([
      "frozen-install-typecheck",
      "unit-coverage-thresholds",
      "playwright-reporters",
      "machine-readable-reports",
      "failure-debug-media",
      "test-summary-retention-flaky-policy",
      "ci-run-branch-protection"
    ]);
    expect(ciCoverageReportingArtifactPaths).toEqual(
      expect.arrayContaining([
        "coverage/ci-coverage-reporting.json",
        "coverage/unit",
        "coverage/unit/coverage-final.json",
        "coverage/unit/lcov.info",
        "coverage/playwright-report",
        "coverage/playwright-results.json",
        "coverage/playwright-junit.xml",
        "coverage/ci-test-summary.md",
        "coverage/ci-branch-protection-redacted.json",
        "coverage/ci-failed-test-debug-artifacts.json",
        "test-results/ci-coverage-reporting"
      ])
    );
  });

  it("keeps package scripts, Vitest thresholds, Playwright reporters, and static checks wired", () => {
    for (const script of ["test:unit:coverage", "test:e2e", "typecheck"]) {
      expect(packageJson).toContain(`"${script}"`);
      expect(phase14StaticCheck).toContain(script);
    }
    expect(vitestWorkspace).toContain("provider: \"v8\"");
    expect(vitestWorkspace).toContain("reporter: [\"text\", \"json\", \"html\", \"lcov\"]");
    expect(vitestWorkspace).toContain("reportsDirectory: \"coverage/unit\"");
    expect(vitestWorkspace).toContain("thresholds");
    expect(playwrightConfig).toContain("coverage/playwright-report");
    expect(playwrightConfig).toContain("coverage/playwright-results.json");
    expect(playwrightConfig).toContain("coverage/playwright-junit.xml");
    expect(playwrightConfig).toContain('trace: "retain-on-failure"');
    expect(playwrightConfig).toContain('screenshot: "only-on-failure"');
    expect(playwrightConfig).toContain('video: "retain-on-failure"');
    expect(playwrightConfig).toContain("process.env.CI ? 2 : 0");
  });

  it("keeps CI workflow gates, artifact uploads, test summary, and reporting paths wired", () => {
    expect(ciWorkflow).toContain("pnpm install --frozen-lockfile");
    expect(ciWorkflow).toContain("pnpm typecheck");
    expect(ciWorkflow).toContain("pnpm test:unit:coverage");
    expect(ciWorkflow).toContain("pnpm test:e2e");
    expect(ciWorkflow).toContain("vitest-coverage");
    expect(ciWorkflow).toContain("playwright-report");
    expect(ciWorkflow).toContain("coverage/playwright-results.json");
    expect(ciWorkflow).toContain("coverage/playwright-junit.xml");
    expect(ciWorkflow).toContain("Run Phase 14 CI coverage reporting contracts");
    expect(ciWorkflow).toContain("coverage/ci-test-summary.md");
    expect(ciWorkflow).toContain("GITHUB_STEP_SUMMARY");
  });

  it("keeps readiness blocked until passing CI, branch protection, quarantine docs, and failed-debug proof exist", () => {
    expect(ciCoverageReportingReadiness.status).toBe("blocked");
    expect(ciCoverageReportingReadiness.missingScripts).toEqual([]);
    expect(ciCoverageReportingReadiness.requiredCommands).toBe(ciCoverageReportingCommands);
    expect(ciCoverageReportingReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "Playwright report plus retained traces, screenshots, videos, and failed-test debug artifact proof",
        "passing CI run, branch protection settings, flaky-test policy, and artifact retention settings"
      ])
    );
    expect(ciCoverageReportingReadiness.blockers).toEqual(
      expect.arrayContaining([
        "A GitHub Actions CI run must pass on the PR branch.",
        "Branch protection must require the CI quality check before merge.",
        "Flaky-test quarantine/escalation policy must be documented.",
        "A failed-test artifact path must be verified for debugging traces/screenshots/videos."
      ])
    );
  });

  it("pins durable CiCoverageRun rows, coverage/report flags, branch protection, flaky policy, debug artifacts, and CI evidence", () => {
    const schema = read("packages/db/prisma/schema.prisma");
    const contract = buildCiCoverageRunPersistenceContract({
      tenantId: "tenant_demo",
      runId: "ci-coverage-demo",
      commitSha: "abc1234",
      status: "repository_gated",
      reportingMatrix: ciCoverageReportingMatrix,
      artifactManifest: ciCoverageReportingArtifactPaths,
      frozenInstallPassed: false,
      typecheckPassed: false,
      unitCoveragePassed: false,
      unitCoverageThresholdsPassed: true,
      e2ePassed: false,
      vitestReportsUploaded: true,
      playwrightReportsUploaded: true,
      tracesScreenshotsVideosRetained: true,
      testSummaryPublished: true,
      artifactRetentionVerified: true,
      failedDebugArtifactsVerified: false,
      flakyPolicyDocumented: false,
      ciRunPassed: false,
      branchProtectionRequiresCi: false,
      branchProtectionArtifactPath: "coverage/ci-branch-protection-redacted.json",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/redacted"
    });

    expect(schema).toContain("model CiCoverageRun");
    expect(schema).toContain("unitCoverageThresholdsPassed");
    expect(schema).toContain("branchProtectionRequiresCi");
    expect(schema).toContain("@@unique([tenantId, runId])");
    expect(contract.transactionWrites).toEqual(["CiCoverageRun", "AuditLog"]);
    expect(contract.requiredCiFlags).toContain("failedDebugArtifactsVerified");
    expect(contract.artifactFields).toContain("branchProtectionArtifactPath");
    expect(contract.tenantIsolationKey).toBe("tenantId");
    expect(ciCoverageRunPersistencePreview.modelName).toBe("CiCoverageRun");
    const runData = buildCiCoverageRunData(contract.row);
    expect(runData).toMatchObject({
      tenantId: "tenant_demo",
      runId: "ci-coverage-demo",
      status: "repository_gated",
      unitCoverageThresholdsPassed: true,
      branchProtectionArtifactPath: "coverage/ci-branch-protection-redacted.json",
    });
    expect(persistCiCoverageRun).toBeTypeOf("function");
    expect(String(persistCiCoverageRun)).toContain("repository.ciCoverageRun.upsert");
  });

  it("pins current CI coverage reporting proof files for GAP-111", () => {
    expect(ciCoverageReportingProofFiles).toEqual(
      expect.arrayContaining([
      "packages/testing/src/index.ts",
      "packages/testing/tests/testing-manifest.test.ts",
        "apps/web/lib/ciCoverageReporting.ts",
        "apps/web/tests/ci-coverage-reporting-static.test.ts",
        "packages/db/prisma/migrations/20260609014000_add_ci_coverage_runs/migration.sql",
        ".github/workflows/ci.yml",
        "vitest.workspace.ts",
        "playwright.config.ts",
      ]),
    );
    for (const file of ciCoverageReportingProofFiles) {
      expect(read(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps manifest registration and tracker status aligned", () => {
    expect(unitManifest).toContain("unit-web-ci-coverage-reporting-static");
    expect(unitManifest).toContain("CiCoverageRun Prisma model and app row contract are wired");
    expect(gapTracker).toContain("apps/web/lib/ciCoverageReporting.ts");
    expect(gapTracker).toContain("CI coverage evidence classifier wired and repository proof gated");
    expect(gapTracker).toContain("GAP-111 is ci-coverage-reporting-matrix wired with evidence classifier");
    expect(gapTracker).toContain("persistCiCoverageRun upsert seam");
    expect(gapTracker).toContain("ciCoverageReportingExternalArtifacts");
  });

  it("classifies GAP-111 evidence as blocked until passing CI, artifacts, flaky policy, debug paths, and branch protection are proven", () => {
    const blockedDecision = buildCiCoverageReportingEvidenceDecision({
      frozenInstallPassed: true,
      typecheckPassed: true,
      unitCoveragePassed: true,
      unitCoverageThresholdsPassed: true,
      e2ePassed: false,
      vitestReportsUploaded: true,
      playwrightReportsUploaded: false,
      tracesScreenshotsVideosRetained: false,
      testSummaryPublished: true,
      artifactRetentionVerified: true,
      failedDebugArtifactsVerified: false,
      flakyPolicyDocumented: false,
      ciRunPassed: false,
      branchProtectionRequiresCi: false,
      requiredCommandsRun: ciCoverageReportingCommands.filter(
        (command) =>
          command !== "pnpm test:e2e" &&
          command !== "gh run view <ci-run-id> --json conclusion,status,url" &&
          command !== "verify branch protection requires CI quality check",
      ),
      capturedArtifacts: [
        "coverage/ci-coverage-reporting.json",
        "coverage/unit",
        "coverage/unit/coverage-final.json",
        "coverage/unit/lcov.info",
        "coverage/ci-test-summary.md",
        "coverage/ci-artifact-retention.json",
        "test-results/ci-coverage-reporting"
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Run CI Playwright E2E.",
        "Upload Playwright HTML/JSON/JUnit reports.",
        "Retain Playwright traces, screenshots, and videos.",
        "Verify failed-test debug artifact paths.",
        "Document flaky retry/quarantine policy.",
        "Capture passing CI quality run proof.",
        "Capture branch protection required-check proof.",
        "Required command not recorded: pnpm test:e2e",
        "Required command not recorded: gh run view <ci-run-id> --json conclusion,status,url",
        "Required command not recorded: verify branch protection requires CI quality check",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/playwright-report",
        "coverage/playwright-results.json",
        "coverage/playwright-junit.xml",
        "coverage/playwright-traces",
        "coverage/ci-branch-protection-redacted.json",
        "coverage/ci-failed-test-debug-artifacts.json",
      ]),
    );
    expect(blockedDecision.ciPolicy).toEqual({
      branchProtectionRequired: true,
      failedDebugArtifactsRequired: true,
      flakyQuarantinePolicyRequired: true,
    });

    const completeDecision = buildCiCoverageReportingEvidenceDecision({
      frozenInstallPassed: true,
      typecheckPassed: true,
      unitCoveragePassed: true,
      unitCoverageThresholdsPassed: true,
      e2ePassed: true,
      vitestReportsUploaded: true,
      playwrightReportsUploaded: true,
      tracesScreenshotsVideosRetained: true,
      testSummaryPublished: true,
      artifactRetentionVerified: true,
      failedDebugArtifactsVerified: true,
      flakyPolicyDocumented: true,
      ciRunPassed: true,
      branchProtectionRequiresCi: true,
      requiredCommandsRun: ciCoverageReportingCommands,
      capturedArtifacts: ciCoverageReportingArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(ciCoverageReportingCommands);
    expect(completeDecision.requiredEvidence).toBe(ciCoverageReportingArtifactPaths);
  });

  it("keeps GAP-111 CI and repository proof execution disabled in the local plan", () => {
    const plan = buildCiCoverageReportingExecutionPlan();

    expect(plan.frozenInstallExecutionAllowed).toBe(false);
    expect(plan.typecheckExecutionAllowed).toBe(false);
    expect(plan.unitCoverageExecutionAllowed).toBe(false);
    expect(plan.e2eExecutionAllowed).toBe(false);
    expect(plan.githubRunExecutionAllowed).toBe(false);
    expect(plan.branchProtectionExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(ciCoverageReportingExecutionPolicy);
    expect(plan.externalEvidenceRequired).toBe(ciCoverageReportingRequiredExternalEvidence);
    expect(plan.localCommands).toBe(ciCoverageReportingLocalCommands);
    expect(plan.localArtifacts).toBe(ciCoverageReportingLocalArtifacts);
    expect(plan.externalArtifacts).toBe(ciCoverageReportingExternalArtifacts);
    expect(ciCoverageReportingExecutionPolicy.externalEvidenceRequired).toBe(ciCoverageReportingRequiredExternalEvidence);
    expect(ciCoverageReportingRequiredExternalEvidence).toEqual(expect.arrayContaining([
      "Passing GitHub Actions CI quality run proof",
      "Uploaded Vitest coverage and Playwright report proof",
      "Trace, screenshot, video, and failed-test debug artifact proof",
      "Branch protection required-check proof",
      "Provider-backed CiCoverageRun persistence proof",
    ]));
    expect(plan.externalCommands).toBe(ciCoverageReportingCommands);
    expect(plan.externalArtifacts).toEqual(expect.arrayContaining([
      "coverage/unit/coverage-final.json",
      "coverage/playwright-report",
      "coverage/playwright-traces",
      "coverage/ci-branch-protection-redacted.json",
      "coverage/ci-failed-test-debug-artifacts.json",
    ]));
    expect(plan.disabledReasons.join(" ")).toContain("Branch protection proof requires repository settings inspection.");
  });

  it("redacts GAP-111 CI run, artifact, branch protection, and debug media evidence before review", () => {
    const rawArtifact = {
      runId: "ci-coverage-private",
      commitSha: "privatecommitsha",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/private",
      branchProtectionArtifactPath: "coverage/private-branch-protection.json",
      artifactUrl: "https://api.github.com/repos/private/artifacts/123",
      debugArtifact: "trace for client@example.com +1 555 909 0000",
      screenshotPath: "coverage/playwright-screenshots/private.png",
      headers: ["Authorization: Bearer ci-secret-token"],
      stack: "Error: CI quality failed",
    };

    const redacted = buildRedactedCiCoverageArtifact(rawArtifact);
    const review = buildCiCoverageReportingArtifactReview(rawArtifact);
    const serialized = JSON.stringify({ redacted, review });

    expect(serialized).not.toContain("ci-coverage-private");
    expect(serialized).not.toContain("privatecommitsha");
    expect(serialized).not.toContain("/actions/runs/private");
    expect(serialized).not.toContain("coverage/private-branch-protection.json");
    expect(serialized).not.toContain("/artifacts/123");
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("+1 555 909 0000");
    expect(serialized).not.toContain("ci-secret-token");
    expect(serialized).toContain("[REDACTED]");
    expect(review.requiredArtifacts).toBe(ciCoverageReportingArtifactPaths);
    expect(review.retainedExternalGates).toEqual(expect.arrayContaining([
      "Passing GitHub Actions CI quality run proof",
      "Branch protection required-check proof",
      "Provider-backed CiCoverageRun persistence proof",
    ]));
  });
});

