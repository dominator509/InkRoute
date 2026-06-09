import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  appE2eRuntimeArtifactPaths,
  appE2eRuntimeCommands,
  appE2eRuntimeMatrix,
  appE2eRuntimeReadiness,
  appE2eRuntimeRunPersistencePreview,
  appE2eRuntimeSpecFiles,
  buildAppE2eRuntimeRunPersistenceContract
} from "../lib/appE2eRuntime";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const packageJson = read("package.json");
const playwrightConfig = read("playwright.config.ts");
const e2eManifest = read("testing/manifests/e2e-test-manifest.json");
const manifestVerifier = read("testing/scripts/verify-test-manifest.mjs");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");

describe("GAP-106 app E2E runtime wiring", () => {
  it("pins the app E2E runtime command and artifact matrix", () => {
    expect(appE2eRuntimeCommands).toEqual(
      expect.arrayContaining([
        "pnpm --filter @inkroute/web build",
        "pnpm --filter @inkroute/dashboard build",
        "pnpm exec playwright install --with-deps chromium",
        "pnpm test:e2e --project=web-chromium",
        "pnpm test:e2e --project=dashboard-chromium",
        "pnpm test:manifest",
        "GitHub Actions CI E2E job"
      ])
    );
    expect(appE2eRuntimeArtifactPaths).toEqual(
      expect.arrayContaining([
        "coverage/app-e2e-runtime.json",
        "coverage/app-e2e-web-runtime.log",
        "coverage/app-e2e-dashboard-runtime.log",
        "coverage/playwright-report",
        "coverage/playwright-results.json",
        "coverage/playwright-junit.xml",
        "test-results/app-e2e-runtime"
      ])
    );
    expect(appE2eRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "web-build-runtime",
      "dashboard-build-runtime",
      "playwright-chromium-install",
      "public-booking-security-seo",
      "dashboard-smoke-security-operator",
      "e2e-manifest-verification",
      "trace-media-retention",
      "ci-e2e-artifacts",
      "failure-hardening"
    ]);
  });

  it("keeps Playwright projects, reporters, retries, traces, screenshots, videos, and app runtimes wired", () => {
    expect(packageJson).toContain('"test:e2e"');
    expect(playwrightConfig).toContain('name: "web-chromium"');
    expect(playwrightConfig).toContain('name: "dashboard-chromium"');
    expect(playwrightConfig).toContain('command: "pnpm --filter @inkroute/web dev"');
    expect(playwrightConfig).toContain('command: "pnpm --filter @inkroute/dashboard dev"');
    expect(playwrightConfig).toContain('trace: "retain-on-failure"');
    expect(playwrightConfig).toContain('screenshot: "only-on-failure"');
    expect(playwrightConfig).toContain('video: "retain-on-failure"');
    expect(playwrightConfig).toContain('coverage/playwright-report');
    expect(playwrightConfig).toContain('coverage/playwright-results.json');
    expect(playwrightConfig).toContain('coverage/playwright-junit.xml');
    expect(playwrightConfig).toContain('process.env.CI ? 2 : 0');
  });

  it("keeps the required public and dashboard E2E specs manifest-verified", () => {
    for (const specFile of appE2eRuntimeSpecFiles) {
      expect(e2eManifest).toContain(specFile);
      expect(manifestVerifier).toContain(specFile);
    }
    expect(e2eManifest).toContain("e2e-public-booking");
    expect(e2eManifest).toContain("e2e-web-security-runtime");
    expect(e2eManifest).toContain("e2e-public-seo-pages");
    expect(e2eManifest).toContain("e2e-dashboard-smoke");
    expect(e2eManifest).toContain("e2e-dashboard-security-runtime");
    expect(e2eManifest).toContain("e2e-dashboard-operator-surfaces");
  });

  it("keeps readiness blocked until real builds, runtimes, Playwright execution, CI, and hardened fixes exist", () => {
    expect(appE2eRuntimeReadiness.status).toBe("blocked");
    expect(appE2eRuntimeReadiness.requiredCommands).toEqual([
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm exec playwright install --with-deps chromium",
      "pnpm test:e2e",
      "pnpm test:manifest"
    ]);
    expect(appE2eRuntimeReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "web/dashboard build output and running Next.js runtime logs",
        "Playwright browser install plus public booking/security/SEO spec output",
        "dashboard smoke/security/operator E2E output and manifest verification",
        "retained Playwright report, traces, screenshots, videos, and CI E2E artifact bundle",
        "documented E2E retry policy and committed fixes from real Playwright failures"
      ])
    );
    expect(appE2eRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Web Next.js runtime must start for Playwright public booking, security, and SEO specs.",
        "Dashboard operator surfaces Playwright spec must pass for payments, releases, errors, messages, templates, SEO, and trust.",
        "CI E2E job must pass with retained artifacts."
      ])
    );
  });

  it("pins durable AppE2eRuntimeRun rows, specs, retained media, CI evidence, and hardening commits", () => {
    const schema = read("packages/db/prisma/schema.prisma");
    const contract = buildAppE2eRuntimeRunPersistenceContract({
      tenantId: "tenant_demo",
      runId: "app-e2e-runtime-demo",
      commitSha: "abc1234",
      status: "ci_gated",
      runtimeMatrix: appE2eRuntimeMatrix,
      specFiles: appE2eRuntimeSpecFiles,
      artifactManifest: appE2eRuntimeArtifactPaths,
      webBuildPassed: false,
      dashboardBuildPassed: false,
      webRuntimeStarted: false,
      dashboardRuntimeStarted: false,
      chromiumInstalled: false,
      publicSpecsPassed: false,
      dashboardSpecsPassed: false,
      e2eManifestVerified: false,
      tracesRetained: true,
      screenshotsRetained: true,
      videosRetained: true,
      ciE2ePassed: false,
      flakyRetriesConfigured: true,
      hardenedFailuresCommitted: false,
      failureHardeningArtifactPath: "coverage/app-e2e-runtime.json",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/redacted"
    });

    expect(schema).toContain("model AppE2eRuntimeRun");
    expect(schema).toContain("runtimeMatrix");
    expect(schema).toContain("hardenedFailuresCommitted");
    expect(schema).toContain("@@unique([tenantId, runId])");
    expect(contract.transactionWrites).toEqual(["AppE2eRuntimeRun", "AuditLog"]);
    expect(contract.requiredRuntimeFlags).toContain("chromiumInstalled");
    expect(contract.artifactFields).toContain("failureHardeningArtifactPath");
    expect(contract.tenantIsolationKey).toBe("tenantId");
    expect(appE2eRuntimeRunPersistencePreview.modelName).toBe("AppE2eRuntimeRun");
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 14 app E2E runtime contracts");
    expect(ciWorkflow).toContain("apps/web/tests/app-e2e-runtime-static.test.ts");
    expect(ciWorkflow).toContain("app-e2e-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/app-e2e-runtime.json");
    expect(ciWorkflow).toContain("test-results/app-e2e-runtime");
    expect(unitManifest).toContain("unit-web-app-e2e-runtime-static");
    expect(unitManifest).toContain("AppE2eRuntimeRun Prisma model and app row contract are wired");
    expect(gapTracker).toContain("apps/web/lib/appE2eRuntime.ts");
    expect(gapTracker).toContain("live Playwright runtime execution proof remains open");
  });
});
