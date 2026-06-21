import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedPhase14RunnerArtifact,
  buildPhase14RunnerArtifactReview,
  buildPhase14RunnerEvidenceDecision,
  buildPhase14RunnerExecutionPlan,
  buildPhase14RunnerRunData,
  buildPhase14RunnerRunPersistenceContract,
  persistPhase14RunnerRun,
  phase14RunnerArtifactPaths,
  phase14RunnerCommands,
  phase14RunnerExternalArtifacts,
  phase14RunnerExternalCommands,
  phase14RunnerExecutionMatrix,
  phase14RunnerExecutionPolicy,
  phase14RunnerExecutionReadiness,
  phase14RunnerLocalArtifacts,
  phase14RunnerLocalCommands,
  phase14RunnerProofFiles,
  phase14RunnerRequiredExternalEvidence,
  phase14RunnerRunPersistencePreview
} from "../lib/phase14RunnerExecution";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const packageJson = read("package.json");
const vitestWorkspace = read("vitest.workspace.ts");
const playwrightConfig = read("playwright.config.ts");
const manifestVerifier = read("testing/scripts/verify-test-manifest.mjs");
const phase14StaticCheck = read("testing/scripts/phase14-static-check.mjs");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const e2eManifest = read("testing/manifests/e2e-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");

describe("GAP-105 Phase 14 runner execution wiring", () => {
  it("pins the full runner command and artifact matrix", () => {
    expect(phase14RunnerCommands).toContain("pnpm install --frozen-lockfile");
    expect(phase14RunnerCommands).toContain("pnpm test:phase14:static");
    expect(phase14RunnerCommands).toContain("pnpm test:manifest");
    expect(phase14RunnerCommands).toContain("pnpm typecheck");
    expect(phase14RunnerCommands).toContain("pnpm test:unit");
    expect(phase14RunnerCommands).toContain("pnpm exec playwright install --with-deps");
    expect(phase14RunnerCommands).toContain("pnpm test:e2e");
    expect(phase14RunnerArtifactPaths).toContain("coverage/phase14-flaky-policy.md");
    expect(phase14RunnerExecutionMatrix.map((entry) => entry.id)).toEqual([
      "frozen-install",
      "static-manifest-checks",
      "workspace-typecheck-unit",
      "playwright-browser-install",
      "web-dashboard-e2e",
      "ci-artifacts",
      "runner-failure-triage",
      "scaffold-flaky-policy"
    ]);
  });

  it("keeps root scripts, Vitest workspace, and Playwright projects wired", () => {
    for (const script of ["test:phase14:static", "test:manifest", "test:unit", "test:e2e", "typecheck"]) {
      expect(packageJson).toContain(`"${script}"`);
    }

    expect(vitestWorkspace).toContain("defineWorkspace");
    expect(vitestWorkspace).toContain("apps/web/tests");
    expect(vitestWorkspace).toContain("packages/*/tests");
    expect(playwrightConfig).toContain("webServer");
    expect(playwrightConfig).toContain("chromium");
  });

  it("keeps the expanded manifest verifier and static checker tied to Phase 13/14 scaffold", () => {
    for (const required of [
      "security-runtime-middleware.test.ts",
      "security-next-config-static.test.ts",
      "mobile-security-static.test.ts",
      "e2e-test-manifest.json"
    ]) {
      expect(manifestVerifier).toContain(required);
    }

    expect(phase14StaticCheck).toContain("vitest.workspace.ts");
    expect(unitManifest).toContain("unit-web-phase14-runner-execution-static");
    expect(e2eManifest).toContain("web-public-booking-flow");
  });

  it("keeps execution readiness blocked until real runner evidence exists", () => {
    expect(phase14RunnerExecutionReadiness.status).toBe("blocked");
    expect(phase14RunnerExecutionReadiness.requiredCommands).toBe(phase14RunnerCommands);
    expect(phase14RunnerExecutionReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "Playwright browser install and web/dashboard E2E execution output",
        "triaged runner failure log, committed fixes, preserved scaffold coverage diff, and flaky-test policy"
      ])
    );
    expect(phase14RunnerExecutionReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Playwright browsers must install before web/dashboard E2E execution.",
        "Flaky retry/quarantine policy must be documented before CI runner evidence is trusted."
      ])
    );
  });

  it("pins current Phase 14 runner proof files for GAP-105", () => {
    expect(phase14RunnerProofFiles).toEqual(
      expect.arrayContaining([
      "packages/testing/src/index.ts",
      "packages/testing/tests/testing-manifest.test.ts",
        "package.json",
        "pnpm-lock.yaml",
        "apps/web/lib/phase14RunnerExecution.ts",
        "apps/web/tests/phase14-runner-execution-static.test.ts",
        "packages/db/prisma/migrations/20260609008000_add_phase14_runner_runs/migration.sql",
        ".github/workflows/ci.yml",
      ]),
    );
    for (const file of phase14RunnerProofFiles) {
      expect(read(file).length).toBeGreaterThan(0);
    }
  });

  it("pins durable Phase14RunnerRun rows, command matrix, artifact manifest, triage, scaffold, and flaky policy fields", () => {
    const schema = read("packages/db/prisma/schema.prisma");
    const contract = buildPhase14RunnerRunPersistenceContract({
      tenantId: "tenant_demo",
      runId: "phase14-runner-demo",
      commitSha: "abc1234",
      status: "ci_gated",
      commandMatrix: phase14RunnerExecutionMatrix,
      artifactManifest: phase14RunnerArtifactPaths,
      frozenInstallPassed: false,
      lockfileReproducible: true,
      staticChecksPassed: false,
      manifestChecksPassed: false,
      typecheckPassed: false,
      unitPassed: false,
      playwrightBrowsersInstalled: false,
      e2ePassed: false,
      ciPassed: false,
      runnerFailuresTriaged: false,
      runnerFixesCommitted: false,
      scaffoldCoveragePreserved: true,
      flakyPolicyDocumented: false,
      triageArtifactPath: "coverage/phase14-runner-failure-triage.md",
      scaffoldDiffArtifactPath: "coverage/phase14-scaffold-coverage-diff.json",
      flakyPolicyArtifactPath: "coverage/phase14-flaky-policy.md",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/redacted"
    });

    expect(schema).toContain("model Phase14RunnerRun");
    expect(schema).toContain("commandMatrix");
    expect(schema).toContain("flakyPolicyDocumented");
    expect(schema).toContain("@@unique([tenantId, runId])");
    expect(contract.transactionWrites).toEqual(["Phase14RunnerRun", "AuditLog"]);
    expect(contract.requiredRunnerFlags).toContain("playwrightBrowsersInstalled");
    expect(contract.artifactFields).toContain("flakyPolicyArtifactPath");
    expect(contract.tenantIsolationKey).toBe("tenantId");
    expect(phase14RunnerRunPersistencePreview.modelName).toBe("Phase14RunnerRun");
    const runData = buildPhase14RunnerRunData(contract.row);
    expect(runData).toMatchObject({
      tenantId: "tenant_demo",
      runId: "phase14-runner-demo",
      status: "ci_gated",
      lockfileReproducible: true,
      flakyPolicyArtifactPath: "coverage/phase14-flaky-policy.md",
    });
    expect(persistPhase14RunnerRun).toBeTypeOf("function");
    expect(String(persistPhase14RunnerRun)).toContain("repository.phase14RunnerRun.upsert");
  });

  it("keeps CI artifacts, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 14 runner execution contracts");
    expect(ciWorkflow).toContain("apps/web/tests/phase14-runner-execution-static.test.ts");
    expect(ciWorkflow).toContain("phase14-runner-execution-artifacts");
    expect(ciWorkflow).toContain("coverage/phase14-manifest-check.json");
    expect(ciWorkflow).toContain("coverage/phase14-unit-results.json");
    expect(unitManifest).toContain("unit-web-phase14-runner-execution-static");
    expect(unitManifest).toContain("Phase14RunnerRun Prisma model and app row contract are wired");
    expect(gapTracker).toContain("apps/web/lib/phase14RunnerExecution.ts");
    expect(gapTracker).toContain("Phase 14 runner evidence classifier wired and execution proof gated");
    expect(gapTracker).toContain("GAP-105 is phase14-runner-execution-matrix wired with evidence classifier");
    expect(gapTracker).toContain("phase14RunnerLocalArtifacts");
    expect(gapTracker).toContain("phase14RunnerExternalArtifacts");
    expect(gapTracker).toContain("persistPhase14RunnerRun upsert seam");
  });

  it("classifies GAP-105 evidence as blocked until the runner executes end to end", () => {
    const blockedDecision = buildPhase14RunnerEvidenceDecision({
      frozenInstallPassed: false,
      lockfileReproducible: true,
      staticChecksPassed: true,
      manifestChecksPassed: true,
      typecheckPassed: false,
      unitPassed: false,
      playwrightBrowsersInstalled: false,
      e2ePassed: false,
      ciPassed: false,
      runnerFailuresTriaged: false,
      runnerFixesCommitted: false,
      scaffoldCoveragePreserved: true,
      flakyPolicyDocumented: false,
      requiredCommandsRun: phase14RunnerCommands.filter(
        (command) =>
          command !== "pnpm install --frozen-lockfile" &&
          command !== "pnpm exec playwright install --with-deps" &&
          command !== "GitHub Actions CI quality workflow",
      ),
      capturedArtifacts: [
        "coverage/phase14-runner-execution.json",
        "coverage/phase14-static-check.json",
        "coverage/phase14-manifest-check.json",
        "coverage/phase14-scaffold-coverage-diff.json",
        "test-results/phase14-runner"
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Run frozen dependency install.",
        "Run workspace typecheck.",
        "Run workspace unit tests.",
        "Install Playwright browsers with dependencies.",
        "Run web/dashboard E2E tests.",
        "Capture passing CI quality workflow proof.",
        "Triage real runner failures.",
        "Commit fixes for real runner failures.",
        "Document flaky retry/quarantine policy.",
        "Required command not recorded: pnpm install --frozen-lockfile",
        "Required command not recorded: pnpm exec playwright install --with-deps",
        "Required command not recorded: GitHub Actions CI quality workflow",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/phase14-frozen-install.log",
        "coverage/phase14-typecheck.log",
        "coverage/phase14-unit-results.json",
        "coverage/phase14-playwright-install.log",
        "coverage/phase14-e2e-results.json",
        "coverage/phase14-ci-run-redacted.json",
        "coverage/phase14-flaky-policy.md",
      ]),
    );
    expect(blockedDecision.runnerPolicy).toEqual({
      frozenInstallRequired: true,
      scaffoldCoverageMustBePreserved: true,
      flakyQuarantinePolicyRequired: true,
    });

    const completeDecision = buildPhase14RunnerEvidenceDecision({
      frozenInstallPassed: true,
      lockfileReproducible: true,
      staticChecksPassed: true,
      manifestChecksPassed: true,
      typecheckPassed: true,
      unitPassed: true,
      playwrightBrowsersInstalled: true,
      e2ePassed: true,
      ciPassed: true,
      runnerFailuresTriaged: true,
      runnerFixesCommitted: true,
      scaffoldCoveragePreserved: true,
      flakyPolicyDocumented: true,
      requiredCommandsRun: phase14RunnerCommands,
      capturedArtifacts: phase14RunnerArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(phase14RunnerCommands);
    expect(completeDecision.requiredEvidence).toBe(phase14RunnerArtifactPaths);
  });

  it("keeps GAP-105 runner execution disabled in the local plan", () => {
    const plan = buildPhase14RunnerExecutionPlan();

    expect(plan.frozenInstallExecutionAllowed).toBe(false);
    expect(plan.typecheckUnitExecutionAllowed).toBe(false);
    expect(plan.playwrightInstallExecutionAllowed).toBe(false);
    expect(plan.e2eExecutionAllowed).toBe(false);
    expect(plan.ciWorkflowExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(phase14RunnerExecutionPolicy);
    expect(plan.externalEvidenceRequired).toBe(phase14RunnerRequiredExternalEvidence);
    expect(phase14RunnerExecutionPolicy.externalEvidenceRequired).toBe(phase14RunnerRequiredExternalEvidence);
    expect(phase14RunnerRequiredExternalEvidence).toEqual(expect.arrayContaining([
      "Frozen dependency install proof",
      "Workspace typecheck and unit runner proof",
      "Playwright browser install proof",
      "GitHub Actions CI quality workflow proof",
      "Provider-backed Phase14RunnerRun persistence proof",
    ]));
    expect(plan.localCommands).toBe(phase14RunnerLocalCommands);
    expect(plan.externalCommands).toBe(phase14RunnerExternalCommands);
    expect(plan.localArtifacts).toBe(phase14RunnerLocalArtifacts);
    expect(plan.externalArtifacts).toBe(phase14RunnerExternalArtifacts);
    expect(plan.externalArtifacts).toEqual(expect.arrayContaining([
      "coverage/phase14-frozen-install.log",
      "coverage/phase14-typecheck.log",
      "coverage/phase14-playwright-install.log",
      "coverage/phase14-e2e-results.json",
      "coverage/phase14-ci-run-redacted.json",
    ]));
    expect(plan.disabledReasons.join(" ")).toContain("CI quality proof requires GitHub Actions execution.");
  });

  it("redacts GAP-105 runner, CI, install, and triage artifacts before review", () => {
    const rawArtifact = {
      runId: "phase14-run-private",
      commitSha: "privatecommitsha",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/private",
      triageArtifactPath: "coverage/private-triage.md",
      scaffoldDiffArtifactPath: "coverage/private-scaffold.json",
      flakyPolicyArtifactPath: "coverage/private-flaky.md",
      installLog: "install failed for client@example.com +1 555 717 8181",
      testOutput: "Authorization: Bearer runner-secret-token",
      stack: "Error: runner failed",
    };

    const redacted = buildRedactedPhase14RunnerArtifact(rawArtifact);
    const review = buildPhase14RunnerArtifactReview(rawArtifact);
    const serialized = JSON.stringify({ redacted, review });

    expect(serialized).not.toContain("phase14-run-private");
    expect(serialized).not.toContain("privatecommitsha");
    expect(serialized).not.toContain("/actions/runs/private");
    expect(serialized).not.toContain("coverage/private-triage.md");
    expect(serialized).not.toContain("coverage/private-scaffold.json");
    expect(serialized).not.toContain("coverage/private-flaky.md");
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("+1 555 717 8181");
    expect(serialized).not.toContain("runner-secret-token");
    expect(serialized).toContain("[REDACTED]");
    expect(review.requiredArtifacts).toBe(phase14RunnerArtifactPaths);
    expect(review.retainedExternalGates).toEqual(expect.arrayContaining([
      "Frozen dependency install proof",
      "GitHub Actions CI quality workflow proof",
      "Runner failure triage and committed fixes proof",
    ]));
  });
});

