import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  accessibilityVisualRunPersistencePreview,
  accessibilityVisualRuntimeArtifactPaths,
  accessibilityVisualRuntimeCommands,
  accessibilityVisualRuntimeMatrix,
  accessibilityVisualRuntimeReadiness,
  accessibilityVisualRuntimeSpecFiles,
  buildAccessibilityVisualRunPersistenceContract
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
      "Lighthouse accessibility budget run for public and dashboard routes",
      "contrast and responsive layout audit",
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
      "lighthouse-contrast-responsive",
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
    expect(accessibilityVisualRuntimeReadiness.requiredCommands).toEqual([
      "pnpm test:e2e --project=web-chromium --grep @a11y",
      "pnpm test:e2e --project=dashboard-chromium --grep @a11y",
      "Lighthouse accessibility budget run for public and dashboard routes",
      "visual regression baseline and diff review",
      "manual screen-reader and mobile accessibility QA pass"
    ]);
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
    expect(gapTracker).toContain("live accessibility and visual regression proof remains open");
  });
});
