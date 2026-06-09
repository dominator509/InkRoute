import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  testingLaunchExecutionArtifactPaths,
  testingLaunchExecutionRuntimeCommands,
  testingLaunchExecutionRuntimeMatrix,
  testingLaunchExecutionRuntimeReadiness,
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
    expect(testingLaunchExecutionArtifactPaths).toContain("coverage/testing-launch-execution-runtime.json");
    expect(testingLaunchExecutionArtifactPaths).toContain("coverage/playwright-report");
    expect(testingLaunchExecutionArtifactPaths).toContain("test-results/testing-launch-execution-runtime");
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
    expect(testingLaunchExecutionRuntimeReadiness.requiredCommands).toEqual([...testingLaunchExecutionRuntimeCommands]);
    expect(testingLaunchExecutionRuntimeReadiness.requiredEvidence).toEqual([
      "install, static, manifest, and typecheck command evidence",
      "unit test, coverage threshold, and coverage artifact evidence",
      "Playwright E2E report, traces, screenshots, videos, and failure-debug artifact evidence",
      "app build, database integration, provider sandbox, and security test evidence",
      "mobile simulator and device test evidence",
      "CI reports, branch protection, flaky policy, and secret-safe artifact evidence",
    ]);
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

  it("wires CI, manifest, tracker, and artifacts without claiming testing launch execution readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 14 testing launch execution runtime contracts");
    expect(ciWorkflow).toContain("testing-launch-execution-runtime-static.test.ts");
    expect(ciWorkflow).toContain("testing-launch-execution-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/testing-launch-execution-runtime.json");
    expect(unitManifest).toContain("unit-web-testing-launch-execution-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/testingLaunchExecutionRuntime.ts");
    expect(gapTracker).toContain("live frozen install, typecheck, unit coverage, E2E, web/dashboard builds, database/provider/security/mobile tests, CI run, branch protection, flaky policy, failure-debug evidence, and secret-safe artifact proof remain open");
  });
});
