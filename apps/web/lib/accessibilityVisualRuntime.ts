import { buildAccessibilityVisualRuntimeReadinessPlan } from "@inkroute/testing";

export type AccessibilityVisualRuntimeStatus =
  | "wired"
  | "runtime-gated"
  | "manual-gated"
  | "ci-gated";

export interface AccessibilityVisualRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: AccessibilityVisualRuntimeStatus;
}

export interface AccessibilityVisualRunPersistenceInput {
  tenantId: string;
  runId: string;
  commitSha?: string;
  status: "blocked" | "running" | "passed" | "failed" | "manual_gated";
  runtimeMatrix: readonly AccessibilityVisualRuntimeMatrixEntry[];
  specFiles: readonly string[];
  artifactManifest: readonly string[];
  webA11ySpecPassed: boolean;
  dashboardA11ySpecPassed: boolean;
  axeReportsCollected: boolean;
  lighthouseBudgetsPassed: boolean;
  contrastAuditPassed: boolean;
  responsiveChecksPassed: boolean;
  screenReaderPassCompleted: boolean;
  mobileAccessibilityQaPassed: boolean;
  visualBaselinesCaptured: boolean;
  visualDiffsReviewed: boolean;
  artifactsRetained: boolean;
  ciAccessibilityVisualPassed: boolean;
  regressionsTriagedAndFixed: boolean;
  triageArtifactPath?: string;
  ciRunUrl?: string;
}

export interface AccessibilityVisualRunPersistenceContract {
  modelName: "AccessibilityVisualRun";
  row: AccessibilityVisualRunPersistenceInput;
  transactionWrites: readonly ["AccessibilityVisualRun", "AuditLog"];
  requiredA11yVisualFlags: readonly [
    "webA11ySpecPassed",
    "dashboardA11ySpecPassed",
    "axeReportsCollected",
    "lighthouseBudgetsPassed",
    "contrastAuditPassed",
    "responsiveChecksPassed",
    "screenReaderPassCompleted",
    "mobileAccessibilityQaPassed",
    "visualBaselinesCaptured",
    "visualDiffsReviewed",
    "artifactsRetained",
    "ciAccessibilityVisualPassed",
    "regressionsTriagedAndFixed",
  ];
  artifactFields: readonly ["runtimeMatrix", "specFiles", "artifactManifest", "triageArtifactPath"];
  tenantIsolationKey: "tenantId";
}

export const accessibilityVisualRuntimeArtifactPaths = [
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
] as const;

export const accessibilityVisualRuntimeCommands = [
  "pnpm test:e2e --project=web-chromium --grep @a11y",
  "pnpm test:e2e --project=dashboard-chromium --grep @a11y",
  "Lighthouse accessibility budget run for public and dashboard routes",
  "contrast and responsive layout audit",
  "visual regression baseline and diff review",
  "manual screen-reader and mobile accessibility QA pass",
  "GitHub Actions accessibility/visual job"
] as const;

export const accessibilityVisualRuntimeSpecFiles = [
  "apps/web/tests/e2e/public-a11y.spec.ts",
  "apps/dashboard/tests/e2e/dashboard-a11y.spec.ts"
] as const;

export const accessibilityVisualRuntimeMatrix: readonly AccessibilityVisualRuntimeMatrixEntry[] = [
  {
    id: "web-playwright-a11y",
    command: "pnpm test:e2e --project=web-chromium --grep @a11y",
    artifact: "coverage/accessibility-web-a11y-results.json",
    status: "runtime-gated"
  },
  {
    id: "dashboard-playwright-a11y",
    command: "pnpm test:e2e --project=dashboard-chromium --grep @a11y",
    artifact: "coverage/accessibility-dashboard-a11y-results.json",
    status: "runtime-gated"
  },
  {
    id: "axe-reports",
    command: "collect axe reports for public web and dashboard accessibility runs",
    artifact: "coverage/accessibility-web-axe-report.json",
    status: "runtime-gated"
  },
  {
    id: "lighthouse-contrast-responsive",
    command: "Lighthouse accessibility budget run plus contrast and responsive layout audit",
    artifact: "coverage/accessibility-lighthouse-budgets.json",
    status: "runtime-gated"
  },
  {
    id: "screen-reader-mobile-qa",
    command: "manual screen-reader and mobile accessibility QA pass",
    artifact: "coverage/accessibility-screen-reader-notes.md",
    status: "manual-gated"
  },
  {
    id: "visual-baselines-diffs",
    command: "visual regression baseline and diff review",
    artifact: "coverage/visual-diffs",
    status: "manual-gated"
  },
  {
    id: "ci-regression-triage",
    command: "GitHub Actions accessibility/visual job and regression triage",
    artifact: "coverage/accessibility-visual-ci-run-redacted.json",
    status: "ci-gated"
  }
];

export function buildAccessibilityVisualRunPersistenceContract(
  input: AccessibilityVisualRunPersistenceInput,
): AccessibilityVisualRunPersistenceContract {
  return {
    modelName: "AccessibilityVisualRun",
    row: input,
    transactionWrites: ["AccessibilityVisualRun", "AuditLog"],
    requiredA11yVisualFlags: [
      "webA11ySpecPassed",
      "dashboardA11ySpecPassed",
      "axeReportsCollected",
      "lighthouseBudgetsPassed",
      "contrastAuditPassed",
      "responsiveChecksPassed",
      "screenReaderPassCompleted",
      "mobileAccessibilityQaPassed",
      "visualBaselinesCaptured",
      "visualDiffsReviewed",
      "artifactsRetained",
      "ciAccessibilityVisualPassed",
      "regressionsTriagedAndFixed",
    ],
    artifactFields: ["runtimeMatrix", "specFiles", "artifactManifest", "triageArtifactPath"],
    tenantIsolationKey: "tenantId",
  };
}

export const accessibilityVisualRuntimeReadiness = buildAccessibilityVisualRuntimeReadinessPlan({
  rootScripts: ["test:e2e"],
  webA11ySpecPassed: false,
  dashboardA11ySpecPassed: false,
  axeReportsCollected: false,
  lighthouseBudgetsPassed: false,
  manualScreenReaderPassCompleted: false,
  contrastAuditPassed: false,
  responsiveLayoutChecksPassed: false,
  visualBaselinesCaptured: false,
  visualDiffsReviewed: false,
  mobileAccessibilityQaPassed: false,
  accessibilityManifestVerified: true,
  artifactsRetained: true,
  ciA11yVisualJobPassed: false,
  regressionsTriagedAndFixed: false
});

export const accessibilityVisualRunPersistencePreview = buildAccessibilityVisualRunPersistenceContract({
  tenantId: "tenant_demo",
  runId: "accessibility-visual-demo",
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
});
