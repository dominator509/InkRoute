import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { testingLaunchExecutionEvidenceRequiredEvidence } from "@inkroute/testing";
import {
  buildRedactedTestingLaunchExecutionArtifact,
  buildTestingLaunchExecutionArtifactReview,
  buildTestingLaunchExecutionEvidenceDecision,
  buildTestingLaunchExecutionPlan,
  buildTestingLaunchExecutionRunData,
  testingLaunchExecutionExternalArtifacts,
  testingLaunchExecutionExternalCommands,
  testingLaunchExecutionArtifactPaths,
  testingLaunchExecutionLocalArtifacts,
  testingLaunchExecutionLocalCommands,
  testingLaunchExecutionPolicy,
  testingLaunchExecutionRequiredExternalEvidence,
  testingLaunchExecutionRunPersistenceContract,
  testingLaunchExecutionRuntimeCommands,
  testingLaunchExecutionRuntimeMatrix,
  testingLaunchExecutionRuntimeProofFiles,
  testingLaunchExecutionRuntimeReadiness,
  testingLaunchExecutionSurfaceContract,
  persistTestingLaunchExecutionRun,
} from "../lib/testingLaunchExecutionRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("testing launch execution runtime contract", () => {
  const packageJson = readRepoFile("package.json");
  const testingSource = readRepoFile("packages/testing/src/index.ts");
  const testingTests = readRepoFile("packages/testing/tests/testing-manifest.test.ts");
  const testingPlan = readRepoFile("TESTING_PLAN.md");
  const vitestWorkspace = readRepoFile("vitest.workspace.ts");
  const playwrightConfig = readRepoFile("playwright.config.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const testingLaunchExecutionMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609033600_add_testing_launch_execution_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins the full testing launch command and artifact matrix", () => {
    expect(testingLaunchExecutionRuntimeCommands).toEqual([
      "pnpm install --frozen-lockfile",
      "pnpm test:phase14:static",
      "pnpm test:manifest",
      "pnpm typecheck",
      "pnpm test:unit",
      "pnpm test:unit:coverage",
      "pnpm test:e2e",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "Prisma/database integration test suite",
      "provider sandbox test suite",
      "security test suite",
      "Expo simulator and device test suites",
      "GitHub Actions CI quality run with retained artifacts",
      "branch protection required-check proof",
    ]);
    expect(testingLaunchExecutionRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "frozen-install-static-manifest-typecheck",
      "unit-and-coverage",
      "playwright-e2e-artifacts",
      "web-dashboard-builds",
      "database-provider-security-integration",
      "mobile-simulator-device",
      "reports-artifact-retention",
      "ci-quality-run",
      "branch-protection-flaky-policy-secret-safety",
    ]);
    expect(testingLaunchExecutionSurfaceContract.map((entry) => entry.surfaceId)).toEqual([
      "frozen-install",
      "static-manifest-typecheck",
      "unit-coverage",
      "playwright-e2e",
      "web-dashboard-builds",
      "database-integration",
      "provider-sandbox",
      "mobile-simulator-device",
      "ci-quality-run",
      "branch-protection",
      "secret-safe-artifacts",
    ]);
    expect(testingLaunchExecutionArtifactPaths).toContain("coverage/testing-launch-execution-runtime.json");
    expect(testingLaunchExecutionArtifactPaths).toContain("coverage/playwright-report");
    expect(testingLaunchExecutionArtifactPaths).toContain("test-results/testing-launch-execution-runtime");
  });

  it("pins the TestingLaunchExecutionRun persistence model and migration", () => {
    const runData = buildTestingLaunchExecutionRunData({
      tenantId: "tenant_static",
      runId: "testing_static",
      commitSha: "abc123",
      status: "blocked",
      artifacts: [
        "coverage/testing-launch-execution-runtime.json",
        "coverage/testing-frozen-install-output.txt",
      ],
      lockfileInstallPassed: true,
      staticChecksPassed: false,
      manifestChecksPassed: false,
      typecheckPassed: false,
      unitTestsPassed: false,
      unitCoveragePassed: false,
      e2eTestsPassed: false,
      webBuildPassed: false,
      dashboardBuildPassed: false,
      prismaIntegrationTestsPassed: false,
      providerSandboxTestsPassed: false,
      securityTestsPassed: false,
      mobileSimulatorTestsPassed: false,
      mobileDeviceTestsPassed: false,
      coverageThresholdsMet: false,
      coverageArtifactsUploaded: false,
      playwrightArtifactsUploaded: false,
      junitJsonReportsPublished: false,
      ciRunPassed: false,
      branchProtectionRequiresCi: false,
      flakyTestPolicyDocumented: false,
      failureDebugArtifactsVerified: false,
      secretSafeArtifactsCaptured: false,
      frozenInstallArtifactPath: "coverage/testing-frozen-install-output.txt",
    });

    expect(testingLaunchExecutionRunPersistenceContract.model).toBe("TestingLaunchExecutionRun");
    expect(testingLaunchExecutionRunPersistenceContract.tenantRelation).toBe("testingLaunchExecutionRuns");
    expect(testingLaunchExecutionRunPersistenceContract.migration).toBe("20260609033600_add_testing_launch_execution_runs");
    expect(testingLaunchExecutionRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "artifactManifest",
      "coverageReportManifest",
      "playwrightReportManifest",
      "policyEvidenceManifest",
    ]);
    expect(testingLaunchExecutionRunPersistenceContract.evidenceBooleans).toContain("unitCoveragePassed");
    expect(testingLaunchExecutionRunPersistenceContract.evidenceBooleans).toContain("branchProtectionRequiresCi");
    expect(testingLaunchExecutionRunPersistenceContract.evidenceBooleans).toContain("secretSafeArtifactsCaptured");
    expect(testingLaunchExecutionRunPersistenceContract.artifactFields).toContain("playwrightReportArtifactPath");
    expect(testingLaunchExecutionRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("testingLaunchExecutionRuns TestingLaunchExecutionRun[]");
    expect(prismaSchema).toContain("model TestingLaunchExecutionRun");
    expect(prismaSchema).toContain("coverageReportManifest");
    expect(prismaSchema).toContain("failureDebugArtifactsVerified");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(testingLaunchExecutionMigration).toContain('CREATE TABLE "TestingLaunchExecutionRun"');
    expect(testingLaunchExecutionMigration).toContain('"playwrightReportManifest" JSONB NOT NULL');
    expect(testingLaunchExecutionMigration).toContain('"secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false');
    expect(testingLaunchExecutionMigration).toContain('CREATE UNIQUE INDEX "TestingLaunchExecutionRun_tenantId_runId_key"');
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "testing_static",
      commitSha: "abc123",
      status: "blocked",
      lockfileInstallPassed: true,
      typecheckPassed: false,
      frozenInstallArtifactPath: "coverage/testing-frozen-install-output.txt",
    });
    expect(runData.commandMatrix).toBe(testingLaunchExecutionRuntimeMatrix);
    expect(runData.artifactManifest).toEqual([
      "coverage/testing-launch-execution-runtime.json",
      "coverage/testing-frozen-install-output.txt",
    ]);
    expect(runData.policyEvidenceManifest.secretSafeArtifactsCaptured).toBe(false);
    expect(String(persistTestingLaunchExecutionRun)).toContain("repository.testingLaunchExecutionRun.upsert");
  });

  it("keeps root scripts, testing helpers, runner configs, and test plan wired", () => {
    for (const script of ["test:phase14:static", "test:manifest", "typecheck", "test:unit", "test:unit:coverage", "test:e2e"]) {
      expect(packageJson).toContain(`"${script}"`);
    }
    expect(testingSource).toContain("buildTestingLaunchExecutionEvidencePlan");
    expect(testingTests).toContain("buildTestingLaunchExecutionEvidencePlan");
    expect(testingPlan).toContain("Phase 14");
    expect(vitestWorkspace).toContain("apps/web/tests");
    expect(playwrightConfig).toContain("coverage/playwright-report");
    expect(playwrightConfig).toContain("coverage/playwright-results.json");
    expect(playwrightConfig).toContain("coverage/playwright-junit.xml");
  });

  it("keeps launch execution blocked until real command, provider, mobile, CI, and artifact evidence exists", () => {
    expect(testingLaunchExecutionRuntimeReadiness.status).toBe("blocked");
    expect(testingLaunchExecutionRuntimeReadiness.missingScripts).toEqual([]);
    expect(testingLaunchExecutionRuntimeReadiness.requiredCommands).toBe(testingLaunchExecutionRuntimeCommands);
    expect(testingLaunchExecutionRuntimeReadiness.requiredEvidence).toBe(testingLaunchExecutionEvidenceRequiredEvidence);
    expect(testingLaunchExecutionRuntimeReadiness.blockers).toContain(
      "pnpm install --frozen-lockfile must pass before testing launch execution is ready.",
    );
    expect(testingLaunchExecutionRuntimeReadiness.blockers).toContain(
      "Provider sandbox tests must pass or remain explicitly launch-blocking.",
    );
    expect(testingLaunchExecutionRuntimeReadiness.blockers).toContain(
      "Testing artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.",
    );
  });

  it("blocks testing launch execution completion when command, artifact, or policy evidence is missing", () => {
    const decision = buildTestingLaunchExecutionEvidenceDecision({
      commands: ["pnpm install --frozen-lockfile"],
      artifacts: ["coverage/testing-frozen-install-output.txt"],
      evidence: {
        lockfileInstallPassed: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("provider sandbox test suite");
    expect(decision.missingArtifacts).toContain("coverage/testing-secret-safe-artifacts.json");
    expect(decision.missingEvidence).toContain("providerSandboxTestsPassed");
    expect(decision.blockers).toContain("Provider sandbox tests must pass or remain explicitly launch-blocking.");
    expect(decision.blockers).toContain(
      "Testing artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.",
    );
  });

  it("completes testing launch execution only when every command, artifact, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(
      testingLaunchExecutionRunPersistenceContract.evidenceBooleans.map((flag) => [flag, true]),
    );
    const decision = buildTestingLaunchExecutionEvidenceDecision({
      commands: testingLaunchExecutionRuntimeCommands,
      artifacts: testingLaunchExecutionArtifactPaths,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(testingLaunchExecutionRunPersistenceContract.evidenceBooleans);
  });

  it("keeps testing launch execution classified, redacted, and externally gated", () => {
    const executionPlan = buildTestingLaunchExecutionPlan();
    expect(executionPlan.localCommands).toBe(testingLaunchExecutionLocalCommands);
    expect(executionPlan.externalCommands).toBe(testingLaunchExecutionExternalCommands);
    expect(executionPlan.localArtifacts).toBe(testingLaunchExecutionLocalArtifacts);
    expect(executionPlan.externalArtifacts).toBe(testingLaunchExecutionExternalArtifacts);
    expect(executionPlan.surfaceContract).toBe(testingLaunchExecutionSurfaceContract);
    expect(executionPlan.surfaceContract).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          surfaceId: "provider-sandbox",
          requiredCommand: "provider sandbox test suite",
          requiredArtifact: "coverage/testing-provider-sandbox-output-redacted.json",
          executionBoundary: "provider-sandbox",
          externalEvidenceRequired: true,
          redactedArtifactRequired: true,
        }),
        expect.objectContaining({
          surfaceId: "ci-quality-run",
          requiredCommand: "GitHub Actions CI quality run with retained artifacts",
          requiredArtifact: "coverage/testing-ci-quality-run-redacted.json",
          executionBoundary: "ci-proof",
          externalEvidenceRequired: true,
          redactedArtifactRequired: true,
        }),
        expect.objectContaining({
          surfaceId: "unit-coverage",
          requiredCommand: "pnpm test:unit:coverage",
          requiredArtifact: "coverage/testing-unit-coverage-summary.json",
          executionBoundary: "local-command",
          externalEvidenceRequired: false,
          redactedArtifactRequired: true,
        }),
      ]),
    );
    expect(executionPlan.localCommands).toContain("pnpm install --frozen-lockfile");
    expect(executionPlan.localCommands).toContain("pnpm test:e2e");
    expect(executionPlan.localCommands).toContain("security test suite");
    expect(executionPlan.externalCommands).toEqual([
      "provider sandbox test suite",
      "Expo simulator and device test suites",
      "GitHub Actions CI quality run with retained artifacts",
      "branch protection required-check proof",
    ]);
    expect(executionPlan.localArtifacts).toContain("coverage/playwright-traces");
    expect(executionPlan.localArtifacts).toContain("coverage/testing-secret-safe-artifacts.json");
    expect(executionPlan.externalArtifacts).toContain("coverage/testing-provider-sandbox-output-redacted.json");
    expect(executionPlan.externalArtifacts).toContain("test-results/testing-launch-execution-runtime");
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.providerExecutionAllowed).toBe(false);
    expect(executionPlan.mobileDeviceExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(testingLaunchExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticTestingLaunchReadiness: true,
      commandOutputRequiredForClosure: true,
      providerEvidenceRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(testingLaunchExecutionRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Provider-backed TestingLaunchExecutionRun persistence row captured through persistTestingLaunchExecutionRun.",
    );

    const artifact = {
      githubToken: "github_pat_abcdefghijklmnopqrstuvwxyz123456",
      userEmail: "client@example.com",
      clientPhone: "+1 555 222 1212",
      paymentCard: "4242 4242 4242 4242",
      nested: {
        databaseUrl: "postgres://inkroute:secret@db.example.com:5432/inkroute",
        screenshotPath: "coverage/playwright-screenshots/client@example.com.png",
        artifactId: "artifact_testing_launch_1234567890",
        commandOutput: "pnpm test failed with PRIVATE_ENV=value",
        junitXml: "<failure>client@example.com private failure</failure>",
        failureDebugLog: "stack trace for tenant_private_123",
        branchProtectionNotes: "required check run_private_123",
        flakyPolicyText: "quarantine user_private_123",
        rawProviderOutput: { token: "provider_secret_private_123" },
        mobileDeviceOutput: "device_private_123",
        neutralReportTrace: "junit_report_01HZYXZYXZYXZYXZYXZYXZYXZ stored coverage/playwright-report/private/index.html",
        neutralCiTrace: "workflow ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ failed commit_01HZYXZYXZYXZYXZYXZYXZYXZ",
        neutralProviderTrace: "provider_test_01HZYXZYXZYXZYXZYXZYXZYXZ replayed mobile_device_01HZYXZYXZYXZYXZYXZYXZYXZ",
        repositorySelector: "repo:dominator509/InkRoute",
        pullRequestSelector: "pr_testing_launch",
        reviewerHandle: "reviewer_testing_owner",
        codeownerSelector: "CODEOWNER:test-platform-team",
        publicSummary: "testing launch execution evidence captured",
      },
    };
    const redactedOnly = buildRedactedTestingLaunchExecutionArtifact(artifact);
    const review = buildTestingLaunchExecutionArtifactReview(artifact);
    const serialized = JSON.stringify(review.artifact);

    expect(JSON.stringify(redactedOnly)).not.toContain("client@example.com");
    expect(serialized).not.toContain("github_pat_abcdefghijklmnopqrstuvwxyz123456");
    expect(serialized).not.toContain("+1 555 222 1212");
    expect(serialized).not.toContain("4242 4242 4242 4242");
    expect(serialized).not.toContain("postgres://inkroute:secret@db.example.com:5432/inkroute");
    expect(serialized).not.toContain("artifact_testing_launch_1234567890");
    expect(serialized).not.toContain("PRIVATE_ENV=value");
    expect(serialized).not.toContain("private failure");
    expect(serialized).not.toContain("tenant_private_123");
    expect(serialized).not.toContain("run_private_123");
    expect(serialized).not.toContain("user_private_123");
    expect(serialized).not.toContain("provider_secret_private_123");
    expect(serialized).not.toContain("device_private_123");
    expect(serialized).not.toContain("junit_report_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("coverage/playwright-report/private/index.html");
    expect(serialized).not.toContain("ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("provider_test_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("repo:dominator509/InkRoute");
    expect(serialized).not.toContain("pr_testing_launch");
    expect(serialized).not.toContain("reviewer_testing_owner");
    expect(serialized).not.toContain("CODEOWNER:test-platform-team");
    expect(review.redactions).toEqual([
      "githubToken",
      "userEmail",
      "clientPhone",
      "paymentCard",
      "nested.databaseUrl",
      "nested.screenshotPath",
      "nested.artifactId",
      "nested.commandOutput",
      "nested.junitXml",
      "nested.failureDebugLog",
      "nested.branchProtectionNotes",
      "nested.flakyPolicyText",
      "nested.rawProviderOutput",
      "nested.mobileDeviceOutput",
      "nested.neutralReportTrace",
      "nested.neutralCiTrace",
      "nested.neutralProviderTrace",
      "nested.repositorySelector",
      "nested.pullRequestSelector",
      "nested.reviewerHandle",
      "nested.codeownerSelector",
    ]);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(testingLaunchExecutionRequiredExternalEvidence);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming testing launch execution readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 14 testing launch execution runtime contracts");
    expect(ciWorkflow).toContain("testing-launch-execution-runtime-static.test.ts");
    expect(ciWorkflow).toContain("testing-launch-execution-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/testing-launch-execution-runtime.json");
    expect(unitManifest).toContain("unit-web-testing-launch-execution-runtime-static");
    expect(unitManifest).toContain("TestingLaunchExecutionRun Prisma model and app row contract");
    expect(gapTracker).toContain("TestingLaunchExecutionRun");
    expect(gapTracker).toContain("apps/web/lib/testingLaunchExecutionRuntime.ts");
    expect(gapTracker).toContain("persistTestingLaunchExecutionRun upsert seam");
    expect(gapTracker).toContain("live frozen install, typecheck, unit coverage, E2E, web/dashboard builds, database/provider/security/mobile tests, CI run, branch protection, flaky policy, failure-debug evidence, provider-backed persistTestingLaunchExecutionRun execution, and secret-safe artifact proof remain open");
    expect(gapTracker).toContain("GAP-012 is testing-launch-execution-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("proof inventory");
    expect(gapTracker).toContain("buildTestingLaunchExecutionPlan");
    expect(gapTracker).toContain("testingLaunchExecutionLocalCommands/testingLaunchExecutionExternalCommands");
    expect(gapTracker).toContain("testingLaunchExecutionPolicy");
    expect(gapTracker).toContain("testingLaunchExecutionRequiredExternalEvidence");
    expect(gapTracker).toContain("testingLaunchExecutionSurfaceContract");
    expect(gapTracker).toContain("buildRedactedTestingLaunchExecutionArtifact");
    expect(gapTracker).toContain("buildTestingLaunchExecutionArtifactReview");
    expect(gapTracker).toContain("GAP-012 testing launch execution artifact hardening now redacts repository/branch/PR/reviewer/CODEOWNER selectors");
    expect(gapTracker).toContain("Testing launch execution identity assertions pin exported local/external commands, artifacts, required external evidence, policy, surface contract, and persistence evidence helpers");
  });

  it("pins current testing launch execution proof files for GAP-012", () => {
    expect(testingLaunchExecutionRuntimeProofFiles).toContain("apps/web/lib/testingLaunchExecutionRuntime.ts");
    expect(testingLaunchExecutionRuntimeProofFiles).toContain("apps/dashboard/package.json");
    expect(testingLaunchExecutionRuntimeProofFiles).toContain("apps/web/package.json");
    expect(testingLaunchExecutionRuntimeProofFiles).toContain("apps/web/tests/testing-launch-execution-runtime-static.test.ts");
    for (const proofFile of testingLaunchExecutionRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});

