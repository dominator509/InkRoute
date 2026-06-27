import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  appE2eRuntimeArtifactPaths,
  appE2eRuntimeCommands,
  appE2eRuntimeExternalArtifacts,
  appE2eRuntimeExternalCommands,
  appE2eRuntimeExecutionPolicy,
  appE2eRuntimeLocalArtifacts,
  appE2eRuntimeLocalCommands,
  appE2eRuntimeMatrix,
  appE2eRuntimeProofFiles,
  appE2eRuntimeReadiness,
  appE2eRuntimeRequiredExternalEvidence,
  appE2eRuntimeRunPersistencePreview,
  appE2eRuntimeSurfaceContract,
  appE2eRuntimeSpecFiles,
  buildAppE2eRuntimeArtifactReview,
  buildAppE2eRuntimeRunData,
  buildAppE2eRuntimeEvidenceDecision,
  buildAppE2eRuntimeExecutionPlan,
  buildAppE2eRuntimeRunPersistenceContract,
  buildRedactedAppE2eRuntimeArtifact,
  persistAppE2eRuntimeRun
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
    expect(appE2eRuntimeSurfaceContract.map((entry) => entry.surfaceId)).toEqual([
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
    expect(appE2eRuntimeReadiness.requiredCommands).toBe(appE2eRuntimeCommands);
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

  it("pins current app E2E runtime proof files for GAP-106", () => {
    expect(appE2eRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "apps/dashboard/tests/e2e/dashboard-smoke.spec.ts",
      "apps/dashboard/tests/e2e/security-runtime.spec.ts",
      "apps/web/tests/e2e/public-seo.spec.ts",
      "apps/web/tests/e2e/security-runtime.spec.ts",
      "packages/testing/src/index.ts",
      "packages/testing/tests/testing-manifest.test.ts",
      "apps/dashboard/package.json",
      "apps/web/package.json",
        "apps/web/lib/appE2eRuntime.ts",
        "apps/web/tests/app-e2e-runtime-static.test.ts",
        "apps/web/tests/e2e/public-booking.spec.ts",
        "apps/dashboard/tests/e2e/operator-surfaces.spec.ts",
        "packages/db/prisma/migrations/20260609009000_add_app_e2e_runtime_runs/migration.sql",
        ".github/workflows/ci.yml",
      ]),
    );
    for (const file of appE2eRuntimeProofFiles) {
      expect(read(file).length).toBeGreaterThan(0);
    }
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
    const runData = buildAppE2eRuntimeRunData(contract.row);
    expect(runData).toMatchObject({
      tenantId: "tenant_demo",
      runId: "app-e2e-runtime-demo",
      status: "ci_gated",
      tracesRetained: true,
      failureHardeningArtifactPath: "coverage/app-e2e-runtime.json",
    });
    expect(persistAppE2eRuntimeRun).toBeTypeOf("function");
    expect(String(persistAppE2eRuntimeRun)).toContain("repository.appE2eRuntimeRun.upsert");
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
    expect(gapTracker).toContain("App E2E runtime evidence classifier wired and Playwright proof gated");
    expect(gapTracker).toContain("GAP-106 is app-e2e-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("persistAppE2eRuntimeRun upsert seam");
    expect(gapTracker).toContain("appE2eRuntimeSurfaceContract");
  });

  it("classifies GAP-106 evidence as blocked until Playwright runtime proof is captured", () => {
    const blockedDecision = buildAppE2eRuntimeEvidenceDecision({
      webBuildPassed: true,
      dashboardBuildPassed: false,
      webRuntimeStarted: true,
      dashboardRuntimeStarted: false,
      chromiumInstalled: false,
      publicBookingSecuritySeoPassed: false,
      dashboardSmokeSecurityOperatorPassed: false,
      e2eManifestVerified: true,
      tracesRetained: true,
      screenshotsRetained: true,
      videosRetained: true,
      ciE2ePassed: false,
      flakyRetriesConfigured: true,
      hardenedFailuresCommitted: false,
      requiredCommandsRun: appE2eRuntimeCommands.filter(
        (command) =>
          command !== "pnpm --filter @inkroute/dashboard build" &&
          command !== "pnpm exec playwright install --with-deps chromium" &&
          command !== "GitHub Actions CI E2E job",
      ),
      capturedArtifacts: [
        "coverage/app-e2e-runtime.json",
        "coverage/app-e2e-web-build.log",
        "coverage/app-e2e-web-runtime.log",
        "coverage/app-e2e-manifest-check.json",
        "coverage/playwright-report",
        "coverage/playwright-results.json",
        "coverage/playwright-junit.xml",
        "test-results/app-e2e-runtime"
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Run dashboard build for Playwright runtime.",
        "Capture dashboard Next.js runtime startup proof.",
        "Install Chromium with Playwright dependencies.",
        "Run public booking, security, and SEO Playwright specs.",
        "Run dashboard smoke, security, and operator Playwright specs.",
        "Capture passing CI E2E job proof.",
        "Commit hardening fixes from real Playwright failures.",
        "Required command not recorded: pnpm --filter @inkroute/dashboard build",
        "Required command not recorded: pnpm exec playwright install --with-deps chromium",
        "Required command not recorded: GitHub Actions CI E2E job",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/app-e2e-dashboard-build.log",
        "coverage/app-e2e-dashboard-runtime.log",
        "coverage/app-e2e-playwright-install.log",
        "coverage/app-e2e-public-booking-results.json",
        "coverage/app-e2e-dashboard-smoke-results.json",
      ]),
    );
    expect(blockedDecision.requiredCommands).toBe(appE2eRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toBe(appE2eRuntimeArtifactPaths);
    expect(blockedDecision.e2ePolicy).toEqual({
      chromiumInstallRequired: true,
      traceScreenshotVideoRetentionRequired: true,
      realFailureHardeningCommitsRequired: true,
    });

    const completeDecision = buildAppE2eRuntimeEvidenceDecision({
      webBuildPassed: true,
      dashboardBuildPassed: true,
      webRuntimeStarted: true,
      dashboardRuntimeStarted: true,
      chromiumInstalled: true,
      publicBookingSecuritySeoPassed: true,
      dashboardSmokeSecurityOperatorPassed: true,
      e2eManifestVerified: true,
      tracesRetained: true,
      screenshotsRetained: true,
      videosRetained: true,
      ciE2ePassed: true,
      flakyRetriesConfigured: true,
      hardenedFailuresCommitted: true,
      requiredCommandsRun: appE2eRuntimeCommands,
      capturedArtifacts: appE2eRuntimeArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(appE2eRuntimeCommands);
    expect(completeDecision.requiredEvidence).toBe(appE2eRuntimeArtifactPaths);
  });

  it("keeps GAP-106 Playwright runtime execution disabled in the local plan", () => {
    const plan = buildAppE2eRuntimeExecutionPlan();

    expect(plan.webBuildExecutionAllowed).toBe(false);
    expect(plan.dashboardBuildExecutionAllowed).toBe(false);
    expect(plan.playwrightInstallExecutionAllowed).toBe(false);
    expect(plan.webE2eExecutionAllowed).toBe(false);
    expect(plan.dashboardE2eExecutionAllowed).toBe(false);
    expect(plan.ciE2eExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(appE2eRuntimeExecutionPolicy);
    expect(plan.externalEvidenceRequired).toBe(appE2eRuntimeRequiredExternalEvidence);
    expect(appE2eRuntimeExecutionPolicy.externalEvidenceRequired).toBe(appE2eRuntimeRequiredExternalEvidence);
    expect(appE2eRuntimeRequiredExternalEvidence).toEqual(expect.arrayContaining([
      "Web and dashboard build/runtime proof",
      "Playwright Chromium install proof",
      "Public booking/security/SEO E2E proof",
      "Dashboard smoke/security/operator E2E proof",
      "Provider-backed AppE2eRuntimeRun persistence proof",
    ]));
    expect(plan.localCommands).toBe(appE2eRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(appE2eRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(appE2eRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(appE2eRuntimeExternalArtifacts);
    expect(plan.surfaceContract).toBe(appE2eRuntimeSurfaceContract);
    expect(plan.surfaceContract).toEqual(expect.arrayContaining([
      expect.objectContaining({
        surfaceId: "playwright-chromium-install",
        requiredCommand: "pnpm exec playwright install --with-deps chromium",
        requiredArtifact: "coverage/app-e2e-playwright-install.log",
        runtimeBoundary: "browser-install",
        browserRuntimeRequired: true,
        redactedArtifactRequired: true,
      }),
      expect.objectContaining({
        surfaceId: "dashboard-smoke-security-operator",
        requiredCommand: "pnpm test:e2e --project=dashboard-chromium",
        requiredArtifact: "coverage/app-e2e-dashboard-smoke-results.json",
        runtimeBoundary: "dashboard-e2e",
        browserRuntimeRequired: true,
        redactedArtifactRequired: true,
      }),
      expect.objectContaining({
        surfaceId: "failure-hardening",
        requiredCommand: "GitHub Actions CI E2E job",
        requiredArtifact: "test-results/app-e2e-runtime",
        runtimeBoundary: "failure-hardening",
        browserRuntimeRequired: true,
        redactedArtifactRequired: true,
      }),
    ]));
    expect(plan.externalArtifacts).toEqual(expect.arrayContaining([
      "coverage/app-e2e-web-build.log",
      "coverage/app-e2e-dashboard-runtime.log",
      "coverage/app-e2e-playwright-install.log",
      "coverage/app-e2e-public-booking-results.json",
      "coverage/app-e2e-dashboard-smoke-results.json",
    ]));
    expect(plan.disabledReasons.join(" ")).toContain("CI E2E artifact proof requires GitHub Actions execution.");
  });

  it("redacts GAP-106 runtime, Playwright, CI, and failure-hardening artifacts before review", () => {
    const rawArtifact = {
      runId: "app-e2e-runtime-private",
      commitSha: "privatecommitsha",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/private",
      failureHardeningArtifactPath: "coverage/private-hardening.md",
      tracePath: "test-results/private-trace.zip",
      videoPath: "test-results/private-video.webm",
      screenshotPath: "test-results/private-screenshot.png",
      runtimeLog: "runtime failed for client@example.com +1 555 111 2222",
      headers: ["Authorization: Bearer e2e-secret-token"],
      stack: "Error: playwright failed",
    };

    const redacted = buildRedactedAppE2eRuntimeArtifact(rawArtifact);
    const review = buildAppE2eRuntimeArtifactReview(rawArtifact);
    const serialized = JSON.stringify({ redacted, review });

    expect(serialized).not.toContain("app-e2e-runtime-private");
    expect(serialized).not.toContain("privatecommitsha");
    expect(serialized).not.toContain("/actions/runs/private");
    expect(serialized).not.toContain("coverage/private-hardening.md");
    expect(serialized).not.toContain("test-results/private-trace.zip");
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("+1 555 111 2222");
    expect(serialized).not.toContain("e2e-secret-token");
    expect(serialized).toContain("[REDACTED]");
    expect(review.requiredArtifacts).toBe(appE2eRuntimeArtifactPaths);
    expect(review.retainedExternalGates).toEqual(expect.arrayContaining([
      "Playwright Chromium install proof",
      "Dashboard smoke/security/operator E2E proof",
      "Real failure hardening commit proof",
    ]));
  });
});

