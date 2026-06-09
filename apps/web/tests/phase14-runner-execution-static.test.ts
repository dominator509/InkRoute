import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPhase14RunnerRunPersistenceContract,
  phase14RunnerArtifactPaths,
  phase14RunnerCommands,
  phase14RunnerExecutionMatrix,
  phase14RunnerExecutionReadiness,
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
    expect(phase14RunnerExecutionReadiness.requiredCommands).toEqual(
      expect.arrayContaining([
        "pnpm install --frozen-lockfile",
        "pnpm test:phase14:static",
        "pnpm test:manifest",
        "pnpm typecheck",
        "pnpm test:unit",
        "pnpm exec playwright install --with-deps",
        "pnpm test:e2e",
        "GitHub Actions CI quality workflow"
      ])
    );
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
    expect(gapTracker).toContain("live runner execution proof remains open");
  });
});
