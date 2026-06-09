import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ciCoverageReportingArtifactPaths,
  ciCoverageReportingCommands,
  ciCoverageReportingMatrix,
  ciCoverageReportingReadiness
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
    expect(ciCoverageReportingReadiness.requiredCommands).toEqual([
      "pnpm test:unit:coverage",
      "pnpm test:e2e",
      "gh run view <ci-run-id> --json conclusion,status,url",
      "gh api repos/:owner/:repo/actions/runs/<ci-run-id>/artifacts",
      "verify branch protection requires CI quality check"
    ]);
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

  it("keeps manifest registration and tracker status aligned", () => {
    expect(unitManifest).toContain("unit-web-ci-coverage-reporting-static");
    expect(gapTracker).toContain("apps/web/lib/ciCoverageReporting.ts");
    expect(gapTracker).toContain("live passing CI and branch-protection proof remain open");
  });
});
