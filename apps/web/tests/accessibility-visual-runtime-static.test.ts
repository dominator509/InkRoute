import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  accessibilityVisualRunPersistencePreview,
  accessibilityVisualRuntimeArtifactPaths,
  accessibilityVisualRuntimeCommands,
  accessibilityVisualRuntimeExecutionPolicy,
  accessibilityVisualRuntimeExternalArtifacts,
  accessibilityVisualRuntimeLocalArtifacts,
  accessibilityVisualRuntimeLocalCommands,
  accessibilityVisualRuntimeMatrix,
  accessibilityVisualRuntimeProofFiles,
  accessibilityVisualRuntimeReadiness,
  accessibilityVisualRuntimeRequiredExternalEvidence,
  accessibilityVisualSurfaceContract,
  accessibilityVisualRuntimeSpecFiles,
  buildRedactedAccessibilityVisualArtifact,
  buildAccessibilityVisualRuntimeArtifactReview,
  buildAccessibilityVisualRunData,
  buildAccessibilityVisualRuntimeEvidenceDecision,
  buildAccessibilityVisualRuntimeExecutionPlan,
  buildAccessibilityVisualRunPersistenceContract,
  persistAccessibilityVisualRun
} from "../lib/accessibilityVisualRuntime";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const packageJson = read("package.json");
const accessibilityChecklist = read("testing/manifests/accessibility-checklist.json");
const e2eManifest = read("testing/manifests/e2e-test-manifest.json");
const manifestVerifier = read("testing/scripts/verify-test-manifest.mjs");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");

describe("GAP-109 accessibility and visual runtime wiring", () => {
  it("pins accessibility, visual, manual QA, CI commands, and artifact paths", () => {
    expect(accessibilityVisualRuntimeCommands).toEqual([
      "pnpm test:e2e --project=web-chromium --grep @a11y",
      "pnpm test:e2e --project=dashboard-chromium --grep @a11y",
      "collect axe reports for public web and dashboard accessibility runs",
      "Lighthouse accessibility budget run for public and dashboard routes",
      "contrast audit for public web, dashboard, and mobile high-risk surfaces",
      "responsive layout audit for mobile, tablet, and desktop breakpoints",
      "visual regression baseline and diff review",
      "manual screen-reader and mobile accessibility QA pass",
      "GitHub Actions accessibility/visual job"
    ]);
    expect(accessibilityVisualRuntimeArtifactPaths).toEqual(
      expect.arrayContaining([
        "coverage/accessibility-visual-runtime.json",
        "coverage/accessibility-web-a11y-results.json",
        "coverage/accessibility-dashboard-a11y-results.json",
        "coverage/accessibility-web-axe-report.json",
        "coverage/accessibility-dashboard-axe-report.json",
        "coverage/accessibility-lighthouse-budgets.json",
        "coverage/accessibility-contrast-audit.json",
        "coverage/accessibility-responsive-layout.json",
        "coverage/accessibility-screen-reader-notes.md",
        "coverage/accessibility-mobile-qa.json",
        "coverage/visual-baselines",
        "coverage/visual-diffs",
        "coverage/accessibility-visual-regression-triage.md",
        "coverage/accessibility-visual-ci-run-redacted.json",
        "test-results/accessibility-visual-runtime"
      ])
    );
    expect(accessibilityVisualRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "web-playwright-a11y",
      "dashboard-playwright-a11y",
      "axe-reports",
      "lighthouse-budgets",
      "contrast-audit",
      "responsive-layout",
      "screen-reader-mobile-qa",
      "visual-baselines-diffs",
      "ci-regression-triage"
    ]);
    expect(accessibilityVisualSurfaceContract.map((entry) => entry.surfaceId)).toEqual([
      "web-playwright-a11y",
      "dashboard-playwright-a11y",
      "axe-reports",
      "lighthouse-budgets",
      "contrast-audit",
      "responsive-layout",
      "screen-reader-mobile-qa",
      "visual-baselines-diffs",
      "ci-regression-triage"
    ]);
  });

  it("keeps public and dashboard @a11y specs manifest-verified", () => {
    expect(packageJson).toContain('"test:e2e"');
    for (const specFile of accessibilityVisualRuntimeSpecFiles) {
      expect(accessibilityChecklist).toContain(specFile);
      expect(e2eManifest).toContain(specFile);
      expect(manifestVerifier).toContain(specFile);
    }
    expect(accessibilityChecklist).toContain("pnpm test:e2e --project=web-chromium --grep @a11y");
    expect(accessibilityChecklist).toContain("pnpm test:e2e --project=dashboard-chromium --grep @a11y");
    expect(accessibilityChecklist).toContain("axe");
    expect(accessibilityChecklist).toContain("Device screenshots and scanner report");
  });

  it("keeps runtime readiness blocked until real a11y, visual, manual, CI, and triage evidence exists", () => {
    expect(accessibilityVisualRuntimeReadiness.status).toBe("blocked");
    expect(accessibilityVisualRuntimeReadiness.missingScripts).toEqual([]);
    expect(accessibilityVisualRuntimeReadiness.requiredCommands).toBe(accessibilityVisualRuntimeCommands);
    expect(accessibilityVisualRuntimeReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "web/dashboard Playwright @a11y output and axe reports",
        "Lighthouse, contrast, and responsive layout audit reports",
        "manual screen-reader and mobile accessibility QA notes",
        "visual regression baselines, reviewed diffs, screenshots, and retained artifacts",
        "manifest verification, CI accessibility/visual job output, and triaged regression log"
      ])
    );
    expect(accessibilityVisualRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Web Playwright @a11y spec must pass for public booking, navigation, labels, focus, and landmarks.",
        "Dashboard Playwright @a11y spec must pass for navigation, tenant context, request regions, and labelled controls.",
        "Axe reports must be collected for public web and dashboard accessibility runs.",
        "Accessibility and visual regressions found during execution must be triaged and fixed or documented as accepted exceptions."
      ])
    );
  });

  it("pins current accessibility visual runtime proof files for GAP-109", () => {
    expect(accessibilityVisualRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "packages/testing/src/index.ts",
      "packages/testing/tests/testing-manifest.test.ts",
        "apps/web/lib/accessibilityVisualRuntime.ts",
        "apps/web/tests/accessibility-visual-runtime-static.test.ts",
        "testing/manifests/accessibility-checklist.json",
        "apps/web/tests/e2e/public-a11y.spec.ts",
        "apps/dashboard/tests/e2e/dashboard-a11y.spec.ts",
        "packages/db/prisma/migrations/20260609012000_add_accessibility_visual_runs/migration.sql",
        ".github/workflows/ci.yml",
      ]),
    );
    for (const file of accessibilityVisualRuntimeProofFiles) {
      expect(read(file).length).toBeGreaterThan(0);
    }
  });

  it("pins durable AccessibilityVisualRun rows, a11y/visual/manual flags, artifacts, CI, and triage evidence", () => {
    const schema = read("packages/db/prisma/schema.prisma");
    const contract = buildAccessibilityVisualRunPersistenceContract({
      tenantId: "tenant_demo",
      runId: "accessibility-visual-demo",
      commitSha: "abc1234",
      status: "manual_gated",
      runtimeMatrix: accessibilityVisualRuntimeMatrix,
      specFiles: accessibilityVisualRuntimeSpecFiles,
      artifactManifest: accessibilityVisualRuntimeArtifactPaths,
      webA11ySpecPassed: false,
      dashboardA11ySpecPassed: false,
      axeReportsCollected: false,
      lighthouseBudgetsPassed: false,
      contrastAuditPassed: false,
      responsiveChecksPassed: false,
      screenReaderPassCompleted: false,
      mobileAccessibilityQaPassed: false,
      visualBaselinesCaptured: false,
      visualDiffsReviewed: false,
      artifactsRetained: true,
      ciAccessibilityVisualPassed: false,
      regressionsTriagedAndFixed: false,
      triageArtifactPath: "coverage/accessibility-visual-regression-triage.md",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/redacted"
    });

    expect(schema).toContain("model AccessibilityVisualRun");
    expect(schema).toContain("axeReportsCollected");
    expect(schema).toContain("visualDiffsReviewed");
    expect(schema).toContain("@@unique([tenantId, runId])");
    expect(contract.transactionWrites).toEqual(["AccessibilityVisualRun", "AuditLog"]);
    expect(contract.requiredA11yVisualFlags).toContain("screenReaderPassCompleted");
    expect(contract.artifactFields).toContain("triageArtifactPath");
    expect(contract.tenantIsolationKey).toBe("tenantId");
    expect(accessibilityVisualRunPersistencePreview.modelName).toBe("AccessibilityVisualRun");
    const runData = buildAccessibilityVisualRunData(contract.row);
    expect(runData).toMatchObject({
      tenantId: "tenant_demo",
      runId: "accessibility-visual-demo",
      status: "manual_gated",
      artifactsRetained: true,
      triageArtifactPath: "coverage/accessibility-visual-regression-triage.md",
    });
    expect(persistAccessibilityVisualRun).toBeTypeOf("function");
    expect(String(persistAccessibilityVisualRun)).toContain("repository.accessibilityVisualRun.upsert");
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 14 accessibility visual runtime contracts");
    expect(ciWorkflow).toContain("apps/web/tests/accessibility-visual-runtime-static.test.ts");
    expect(ciWorkflow).toContain("accessibility-visual-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/accessibility-visual-runtime.json");
    expect(ciWorkflow).toContain("test-results/accessibility-visual-runtime");
    expect(unitManifest).toContain("unit-web-accessibility-visual-runtime-static");
    expect(unitManifest).toContain("AccessibilityVisualRun Prisma model and app row contract are wired");
    expect(gapTracker).toContain("apps/web/lib/accessibilityVisualRuntime.ts");
    expect(gapTracker).toContain("Accessibility visual evidence classifier wired and runtime/manual proof gated");
    expect(gapTracker).toContain("GAP-109 is accessibility-visual-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("persistAccessibilityVisualRun upsert seam");
    expect(gapTracker).toContain("accessibilityVisualRuntimeExternalArtifacts");
    expect(gapTracker).toContain("accessibilityVisualSurfaceContract");
  });

  it("classifies GAP-109 evidence as blocked until automated, manual, visual, and CI proof is captured", () => {
    const blockedDecision = buildAccessibilityVisualRuntimeEvidenceDecision({
      webA11ySpecPassed: true,
      dashboardA11ySpecPassed: false,
      axeReportsCollected: false,
      lighthouseBudgetsPassed: false,
      contrastAuditPassed: true,
      responsiveChecksPassed: true,
      screenReaderPassCompleted: false,
      mobileAccessibilityQaPassed: false,
      visualBaselinesCaptured: true,
      visualDiffsReviewed: false,
      artifactsRetained: true,
      ciAccessibilityVisualPassed: false,
      regressionsTriagedAndFixed: false,
      requiredCommandsRun: accessibilityVisualRuntimeCommands.filter(
        (command) =>
          command !== "pnpm test:e2e --project=dashboard-chromium --grep @a11y" &&
          command !== "collect axe reports for public web and dashboard accessibility runs" &&
          command !== "manual screen-reader and mobile accessibility QA pass" &&
          command !== "GitHub Actions accessibility/visual job",
      ),
      capturedArtifacts: [
        "coverage/accessibility-visual-runtime.json",
        "coverage/accessibility-web-a11y-results.json",
        "coverage/accessibility-contrast-audit.json",
        "coverage/accessibility-responsive-layout.json",
        "coverage/visual-baselines",
        "test-results/accessibility-visual-runtime"
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Run dashboard Playwright @a11y spec.",
        "Collect public and dashboard axe reports.",
        "Run Lighthouse accessibility budget checks.",
        "Required command not recorded: collect axe reports for public web and dashboard accessibility runs",
        "Complete manual screen-reader pass.",
        "Complete mobile accessibility QA.",
        "Review visual diffs.",
        "Capture CI accessibility/visual job proof.",
        "Triage and fix or document accessibility/visual regressions.",
        "Required command not recorded: pnpm test:e2e --project=dashboard-chromium --grep @a11y",
        "Required command not recorded: manual screen-reader and mobile accessibility QA pass",
        "Required command not recorded: GitHub Actions accessibility/visual job",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/accessibility-dashboard-a11y-results.json",
        "coverage/accessibility-web-axe-report.json",
        "coverage/accessibility-lighthouse-budgets.json",
        "coverage/accessibility-screen-reader-notes.md",
        "coverage/visual-diffs",
        "coverage/accessibility-visual-ci-run-redacted.json",
      ]),
    );
    expect(blockedDecision.requiredCommands).toBe(accessibilityVisualRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toBe(accessibilityVisualRuntimeArtifactPaths);
    expect(blockedDecision.qaPolicy).toEqual({
      automatedAndManualProofRequired: true,
      visualDiffsMustBeReviewed: true,
      acceptedRegressionsMustBeDocumented: true,
    });

    const completeDecision = buildAccessibilityVisualRuntimeEvidenceDecision({
      webA11ySpecPassed: true,
      dashboardA11ySpecPassed: true,
      axeReportsCollected: true,
      lighthouseBudgetsPassed: true,
      contrastAuditPassed: true,
      responsiveChecksPassed: true,
      screenReaderPassCompleted: true,
      mobileAccessibilityQaPassed: true,
      visualBaselinesCaptured: true,
      visualDiffsReviewed: true,
      artifactsRetained: true,
      ciAccessibilityVisualPassed: true,
      regressionsTriagedAndFixed: true,
      requiredCommandsRun: accessibilityVisualRuntimeCommands,
      capturedArtifacts: accessibilityVisualRuntimeArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(accessibilityVisualRuntimeCommands);
    expect(completeDecision.requiredEvidence).toBe(accessibilityVisualRuntimeArtifactPaths);
  });

  it("keeps GAP-109 accessibility and visual runtime execution disabled in the local plan", () => {
    const plan = buildAccessibilityVisualRuntimeExecutionPlan();

    expect(plan.webA11yExecutionAllowed).toBe(false);
    expect(plan.dashboardA11yExecutionAllowed).toBe(false);
    expect(plan.auditExecutionAllowed).toBe(false);
    expect(plan.manualQaExecutionAllowed).toBe(false);
    expect(plan.visualDiffExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(accessibilityVisualRuntimeExecutionPolicy);
    expect(plan.externalEvidenceRequired).toBe(accessibilityVisualRuntimeRequiredExternalEvidence);
    expect(plan.localCommands).toBe(accessibilityVisualRuntimeLocalCommands);
    expect(plan.localArtifacts).toBe(accessibilityVisualRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(accessibilityVisualRuntimeExternalArtifacts);
    expect(plan.surfaceContract).toBe(accessibilityVisualSurfaceContract);
    expect(plan.surfaceContract).toEqual(expect.arrayContaining([
      expect.objectContaining({
        surfaceId: "dashboard-playwright-a11y",
        requiredCommand: "pnpm test:e2e --project=dashboard-chromium --grep @a11y",
        requiredArtifact: "coverage/accessibility-dashboard-a11y-results.json",
        proofBoundary: "dashboard-a11y",
        browserOrDeviceEvidenceRequired: true,
        redactedArtifactRequired: true,
      }),
      expect.objectContaining({
        surfaceId: "screen-reader-mobile-qa",
        requiredCommand: "manual screen-reader and mobile accessibility QA pass",
        requiredArtifact: "coverage/accessibility-screen-reader-notes.md",
        proofBoundary: "manual-qa",
        browserOrDeviceEvidenceRequired: true,
        redactedArtifactRequired: true,
      }),
      expect.objectContaining({
        surfaceId: "ci-regression-triage",
        requiredCommand: "GitHub Actions accessibility/visual job",
        requiredArtifact: "coverage/accessibility-visual-ci-run-redacted.json",
        proofBoundary: "ci-proof",
        browserOrDeviceEvidenceRequired: true,
        redactedArtifactRequired: true,
      }),
    ]));
    expect(accessibilityVisualRuntimeExecutionPolicy.externalEvidenceRequired).toBe(accessibilityVisualRuntimeRequiredExternalEvidence);
    expect(accessibilityVisualRuntimeRequiredExternalEvidence).toEqual(expect.arrayContaining([
      "Web and dashboard Playwright @a11y proof",
      "Axe, Lighthouse, contrast, and responsive audit proof",
      "Manual screen-reader and mobile accessibility QA proof",
      "Visual baseline and diff review proof",
      "Provider-backed AccessibilityVisualRun persistence proof",
    ]));
    expect(plan.externalCommands).toBe(accessibilityVisualRuntimeCommands);
    expect(plan.externalArtifacts).toEqual(expect.arrayContaining([
      "coverage/accessibility-web-a11y-results.json",
      "coverage/accessibility-dashboard-a11y-results.json",
      "coverage/accessibility-lighthouse-budgets.json",
      "coverage/accessibility-screen-reader-notes.md",
      "coverage/visual-diffs",
      "coverage/accessibility-visual-ci-run-redacted.json",
    ]));
    expect(plan.disabledReasons.join(" ")).toContain("Manual screen-reader and mobile accessibility QA require human/device review.");
  });

  it("redacts GAP-109 accessibility, visual, manual QA, CI, and triage artifacts before review", () => {
    const rawArtifact = {
      runId: "accessibility-visual-private",
      commitSha: "privatecommitsha",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/private",
      triageArtifactPath: "coverage/private-a11y-triage.md",
      screenshotPath: "coverage/visual-diffs/client@example.com.png",
      visualBaselinePath: "coverage/baselines/private-client-home.png",
      diffPath: "coverage/visual-diffs/private-diff.png",
      routeUrl: "https://inkroute.example/tenant-demo/booking",
      domSnapshot: "<button aria-label=\"client@example.com private booking\">Book</button>",
      axeNodeTarget: "#private-client-booking-form",
      lighthouseTraceUrl: "https://storage.example/private/lighthouse-trace.json",
      screenReaderNotes: "Reader announced client@example.com +1 555 505 6060",
      mobileQaTranscript: "Authorization: Bearer accessibility-secret-token",
      stack: "Error: visual regression failed",
    };

    const redacted = buildRedactedAccessibilityVisualArtifact(rawArtifact);
    const review = buildAccessibilityVisualRuntimeArtifactReview(rawArtifact);
    const serialized = JSON.stringify({ redacted, review });

    expect(serialized).not.toContain("accessibility-visual-private");
    expect(serialized).not.toContain("privatecommitsha");
    expect(serialized).not.toContain("/actions/runs/private");
    expect(serialized).not.toContain("coverage/private-a11y-triage.md");
    expect(serialized).not.toContain("coverage/baselines/private-client-home.png");
    expect(serialized).not.toContain("https://inkroute.example/tenant-demo/booking");
    expect(serialized).not.toContain("private booking");
    expect(serialized).not.toContain("#private-client-booking-form");
    expect(serialized).not.toContain("https://storage.example/private/lighthouse-trace.json");
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("+1 555 505 6060");
    expect(serialized).not.toContain("accessibility-secret-token");
    expect(serialized).toContain("[REDACTED]");
    expect(review.requiredArtifacts).toBe(accessibilityVisualRuntimeArtifactPaths);
    expect(review.retainedExternalGates).toEqual(expect.arrayContaining([
      "Manual screen-reader and mobile accessibility QA proof",
      "Visual baseline and diff review proof",
      "Provider-backed AccessibilityVisualRun persistence proof",
    ]));
  });
});

