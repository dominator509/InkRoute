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
  commitSha?: string | null;
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
  triageArtifactPath?: string | null;
  ciRunUrl?: string | null;
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

export type AccessibilityVisualRunData = AccessibilityVisualRunPersistenceInput & {
  commitSha: string | null;
  triageArtifactPath: string | null;
  ciRunUrl: string | null;
};

export interface AccessibilityVisualRunRepository {
  readonly accessibilityVisualRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: AccessibilityVisualRunData;
      update: AccessibilityVisualRunData;
    }): unknown;
  };
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

export const accessibilityVisualRuntimeProofFiles = [
  "apps/web/lib/accessibilityVisualRuntime.ts",
  "apps/web/tests/accessibility-visual-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609012000_add_accessibility_visual_runs/migration.sql",
  "testing/manifests/accessibility-checklist.json",
  "testing/manifests/e2e-test-manifest.json",
  "testing/manifests/unit-test-manifest.json",
  "testing/scripts/verify-test-manifest.mjs",
  "packages/testing/src/index.ts",
  "packages/testing/tests/testing-manifest.test.ts",
  "apps/web/tests/e2e/public-a11y.spec.ts",
  "apps/dashboard/tests/e2e/dashboard-a11y.spec.ts",
  ".github/workflows/ci.yml",
] as const;

export const accessibilityVisualRuntimeCommands = [
  "pnpm test:e2e --project=web-chromium --grep @a11y",
  "pnpm test:e2e --project=dashboard-chromium --grep @a11y",
  "collect axe reports for public web and dashboard accessibility runs",
  "Lighthouse accessibility budget run for public and dashboard routes",
  "contrast audit for public web, dashboard, and mobile high-risk surfaces",
  "responsive layout audit for mobile, tablet, and desktop breakpoints",
  "visual regression baseline and diff review",
  "manual screen-reader and mobile accessibility QA pass",
  "GitHub Actions accessibility/visual job"
] as const;

export const accessibilityVisualRuntimeRequiredExternalEvidence = [
  "Web and dashboard Playwright @a11y proof",
  "Axe, Lighthouse, contrast, and responsive audit proof",
  "Manual screen-reader and mobile accessibility QA proof",
  "Visual baseline and diff review proof",
  "CI accessibility/visual job proof",
  "Regression triage and fix evidence",
  "Provider-backed AccessibilityVisualRun persistence proof",
] as const;

export type AccessibilityVisualRuntimeArtifact = (typeof accessibilityVisualRuntimeArtifactPaths)[number];

export type AccessibilityVisualRuntimeCommand = (typeof accessibilityVisualRuntimeCommands)[number];

export interface AccessibilityVisualSurfaceContractEntry {
  readonly surfaceId: string;
  readonly requiredCommand: AccessibilityVisualRuntimeCommand;
  readonly requiredArtifact: AccessibilityVisualRuntimeArtifact;
  readonly proofBoundary:
    | "web-a11y"
    | "dashboard-a11y"
    | "axe"
    | "lighthouse"
    | "contrast"
    | "responsive"
    | "manual-qa"
    | "visual-regression"
    | "ci-proof";
  readonly browserOrDeviceEvidenceRequired: boolean;
  readonly redactedArtifactRequired: true;
}

export const accessibilityVisualSurfaceContract: readonly AccessibilityVisualSurfaceContractEntry[] = [
  {
    surfaceId: "web-playwright-a11y",
    requiredCommand: "pnpm test:e2e --project=web-chromium --grep @a11y",
    requiredArtifact: "coverage/accessibility-web-a11y-results.json",
    proofBoundary: "web-a11y",
    browserOrDeviceEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "dashboard-playwright-a11y",
    requiredCommand: "pnpm test:e2e --project=dashboard-chromium --grep @a11y",
    requiredArtifact: "coverage/accessibility-dashboard-a11y-results.json",
    proofBoundary: "dashboard-a11y",
    browserOrDeviceEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "axe-reports",
    requiredCommand: "collect axe reports for public web and dashboard accessibility runs",
    requiredArtifact: "coverage/accessibility-web-axe-report.json",
    proofBoundary: "axe",
    browserOrDeviceEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "lighthouse-budgets",
    requiredCommand: "Lighthouse accessibility budget run for public and dashboard routes",
    requiredArtifact: "coverage/accessibility-lighthouse-budgets.json",
    proofBoundary: "lighthouse",
    browserOrDeviceEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "contrast-audit",
    requiredCommand: "contrast audit for public web, dashboard, and mobile high-risk surfaces",
    requiredArtifact: "coverage/accessibility-contrast-audit.json",
    proofBoundary: "contrast",
    browserOrDeviceEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "responsive-layout",
    requiredCommand: "responsive layout audit for mobile, tablet, and desktop breakpoints",
    requiredArtifact: "coverage/accessibility-responsive-layout.json",
    proofBoundary: "responsive",
    browserOrDeviceEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "screen-reader-mobile-qa",
    requiredCommand: "manual screen-reader and mobile accessibility QA pass",
    requiredArtifact: "coverage/accessibility-screen-reader-notes.md",
    proofBoundary: "manual-qa",
    browserOrDeviceEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "visual-baselines-diffs",
    requiredCommand: "visual regression baseline and diff review",
    requiredArtifact: "coverage/visual-diffs",
    proofBoundary: "visual-regression",
    browserOrDeviceEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "ci-regression-triage",
    requiredCommand: "GitHub Actions accessibility/visual job",
    requiredArtifact: "coverage/accessibility-visual-ci-run-redacted.json",
    proofBoundary: "ci-proof",
    browserOrDeviceEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
] as const;

export type AccessibilityVisualRuntimeExecutionPolicy = {
  localMatrixOnly: true;
  webDashboardA11yRequiresExternalEvidence: true;
  runtimeAuditsRequireExternalEvidence: true;
  manualQaRequiresExternalEvidence: true;
  visualDiffRequiresExternalEvidence: true;
  ciRequiresExternalEvidence: true;
  persistenceRequiresExternalEvidence: true;
  externalEvidenceRequired: typeof accessibilityVisualRuntimeRequiredExternalEvidence;
};

export type AccessibilityVisualRuntimeEvidenceInput = {
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
  requiredCommandsRun: readonly AccessibilityVisualRuntimeCommand[];
  capturedArtifacts: readonly AccessibilityVisualRuntimeArtifact[];
};

export type AccessibilityVisualRuntimeEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: AccessibilityVisualRuntimeArtifact[];
  requiredCommands: typeof accessibilityVisualRuntimeCommands;
  requiredEvidence: typeof accessibilityVisualRuntimeArtifactPaths;
  qaPolicy: {
    automatedAndManualProofRequired: true;
    visualDiffsMustBeReviewed: true;
    acceptedRegressionsMustBeDocumented: true;
  };
};

export type AccessibilityVisualRuntimeExecutionPlan = {
  status: "local-plan-ready";
  policy: AccessibilityVisualRuntimeExecutionPolicy;
  externalEvidenceRequired: typeof accessibilityVisualRuntimeRequiredExternalEvidence;
  webA11yExecutionAllowed: false;
  dashboardA11yExecutionAllowed: false;
  auditExecutionAllowed: false;
  manualQaExecutionAllowed: false;
  visualDiffExecutionAllowed: false;
  ciExecutionAllowed: false;
  persistenceExecutionAllowed: false;
  localCommands: typeof accessibilityVisualRuntimeLocalCommands;
  externalCommands: typeof accessibilityVisualRuntimeCommands;
  localArtifacts: typeof accessibilityVisualRuntimeLocalArtifacts;
  externalArtifacts: typeof accessibilityVisualRuntimeExternalArtifacts;
  surfaceContract: typeof accessibilityVisualSurfaceContract;
  disabledReasons: readonly string[];
};

export const accessibilityVisualRuntimeExecutionPolicy: AccessibilityVisualRuntimeExecutionPolicy = {
  localMatrixOnly: true,
  webDashboardA11yRequiresExternalEvidence: true,
  runtimeAuditsRequireExternalEvidence: true,
  manualQaRequiresExternalEvidence: true,
  visualDiffRequiresExternalEvidence: true,
  ciRequiresExternalEvidence: true,
  persistenceRequiresExternalEvidence: true,
  externalEvidenceRequired: accessibilityVisualRuntimeRequiredExternalEvidence,
};

export type AccessibilityVisualRuntimeArtifactReview = {
  status: "redacted-review-ready";
  redactedArtifact: unknown;
  requiredArtifacts: typeof accessibilityVisualRuntimeArtifactPaths;
  retainedExternalGates: readonly string[];
};

const accessibilityVisualSensitivePatterns = [
  /(run[_-]?id['":=\s]+)[^"',\s}]+/gi,
  /(commit[_-]?sha['":=\s]+)[^"',\s}]+/gi,
  /(ci[_-]?run[_-]?url['":=\s]+)[^"',\s}]+/gi,
  /(triage[_-]?artifact[_-]?path['":=\s]+)[^"',\s}]+/gi,
  /(screenshot[_-]?path['":=\s]+)[^"',\s}]+/gi,
  /(diff[_-]?path['":=\s]+)[^"',\s}]+/gi,
  /(authorization:\s*bearer\s+)[A-Za-z0-9._-]+/gi,
  /(token['":=\s]+)[^"',\s}]+/gi,
  /(secret['":=\s]+)[^"',\s}]+/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
] as const;

export function buildRedactedAccessibilityVisualArtifact(value: unknown): unknown {
  if (typeof value === "string") {
    return accessibilityVisualSensitivePatterns.reduce(
      (redacted, pattern) => redacted.replace(pattern, (_match, prefix: string | undefined) => `${prefix ?? ""}[REDACTED]`),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => buildRedactedAccessibilityVisualArtifact(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /email|phone|token|secret|authorization|credential|password|rawBody|stack|ciRunUrl|commitSha|runId|triageArtifactPath|screenshot|diff|screenReaderNotes|mobileQaTranscript/i.test(key)
          ? "[REDACTED]"
          : buildRedactedAccessibilityVisualArtifact(entry),
      ]),
    );
  }

  return value;
}

export const accessibilityVisualRuntimeLocalCommands = [] as const satisfies readonly AccessibilityVisualRuntimeCommand[];

export const accessibilityVisualRuntimeLocalArtifacts = ["coverage/accessibility-visual-runtime.json"] as const;

export const accessibilityVisualRuntimeExternalArtifacts = accessibilityVisualRuntimeArtifactPaths.filter(
  (artifact) => artifact !== "coverage/accessibility-visual-runtime.json",
) as readonly AccessibilityVisualRuntimeArtifact[];

export function buildAccessibilityVisualRuntimeExecutionPlan(): AccessibilityVisualRuntimeExecutionPlan {
  return {
    status: "local-plan-ready",
    policy: accessibilityVisualRuntimeExecutionPolicy,
    externalEvidenceRequired: accessibilityVisualRuntimeRequiredExternalEvidence,
    webA11yExecutionAllowed: false,
    dashboardA11yExecutionAllowed: false,
    auditExecutionAllowed: false,
    manualQaExecutionAllowed: false,
    visualDiffExecutionAllowed: false,
    ciExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    localCommands: accessibilityVisualRuntimeLocalCommands,
    externalCommands: accessibilityVisualRuntimeCommands,
    localArtifacts: accessibilityVisualRuntimeLocalArtifacts,
    externalArtifacts: accessibilityVisualRuntimeExternalArtifacts,
    surfaceContract: accessibilityVisualSurfaceContract,
    disabledReasons: [
      "Web and dashboard @a11y proof requires Playwright/browser execution.",
      "Axe, Lighthouse, contrast, and responsive audit proof requires runtime audit execution.",
      "Manual screen-reader and mobile accessibility QA require human/device review.",
      "Visual baseline and diff proof requires captured screenshots and review.",
      "CI accessibility/visual proof requires GitHub Actions execution.",
      "AccessibilityVisualRun persistence proof requires provider-backed database execution.",
    ],
  };
}

export function buildAccessibilityVisualRuntimeArtifactReview(rawArtifact: unknown): AccessibilityVisualRuntimeArtifactReview {
  return {
    status: "redacted-review-ready",
    redactedArtifact: buildRedactedAccessibilityVisualArtifact(rawArtifact),
    requiredArtifacts: accessibilityVisualRuntimeArtifactPaths,
    retainedExternalGates: [
      "Web and dashboard Playwright @a11y proof",
      "Axe, Lighthouse, contrast, and responsive audit proof",
      "Manual screen-reader and mobile accessibility QA proof",
      "Visual baseline and diff review proof",
      "CI accessibility/visual job proof",
      "Regression triage and fix evidence",
      "Provider-backed AccessibilityVisualRun persistence proof",
    ],
  };
}

export function buildAccessibilityVisualRuntimeEvidenceDecision(
  input: AccessibilityVisualRuntimeEvidenceInput,
): AccessibilityVisualRuntimeEvidenceDecision {
  const blockers = [
    !input.webA11ySpecPassed && "Run web Playwright @a11y spec.",
    !input.dashboardA11ySpecPassed && "Run dashboard Playwright @a11y spec.",
    !input.axeReportsCollected && "Collect public and dashboard axe reports.",
    !input.lighthouseBudgetsPassed && "Run Lighthouse accessibility budget checks.",
    !input.contrastAuditPassed && "Run contrast audit.",
    !input.responsiveChecksPassed && "Run responsive layout checks.",
    !input.screenReaderPassCompleted && "Complete manual screen-reader pass.",
    !input.mobileAccessibilityQaPassed && "Complete mobile accessibility QA.",
    !input.visualBaselinesCaptured && "Capture visual baselines.",
    !input.visualDiffsReviewed && "Review visual diffs.",
    !input.artifactsRetained && "Retain accessibility and visual artifacts.",
    !input.ciAccessibilityVisualPassed && "Capture CI accessibility/visual job proof.",
    !input.regressionsTriagedAndFixed && "Triage and fix or document accessibility/visual regressions.",
  ].filter(Boolean) as string[];

  const missingArtifacts = accessibilityVisualRuntimeArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = accessibilityVisualRuntimeCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: accessibilityVisualRuntimeCommands,
    requiredEvidence: accessibilityVisualRuntimeArtifactPaths,
    qaPolicy: {
      automatedAndManualProofRequired: true,
      visualDiffsMustBeReviewed: true,
      acceptedRegressionsMustBeDocumented: true,
    },
  };
}

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
    id: "lighthouse-budgets",
    command: "Lighthouse accessibility budget run for public and dashboard routes",
    artifact: "coverage/accessibility-lighthouse-budgets.json",
    status: "runtime-gated"
  },
  {
    id: "contrast-audit",
    command: "contrast audit for public web, dashboard, and mobile high-risk surfaces",
    artifact: "coverage/accessibility-contrast-audit.json",
    status: "runtime-gated"
  },
  {
    id: "responsive-layout",
    command: "responsive layout audit for mobile, tablet, and desktop breakpoints",
    artifact: "coverage/accessibility-responsive-layout.json",
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

export function buildAccessibilityVisualRunData(input: AccessibilityVisualRunPersistenceInput): AccessibilityVisualRunData {
  return {
    ...input,
    commitSha: input.commitSha ?? null,
    triageArtifactPath: input.triageArtifactPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export function persistAccessibilityVisualRun(
  repository: AccessibilityVisualRunRepository,
  input: AccessibilityVisualRunPersistenceInput,
): unknown {
  const data = buildAccessibilityVisualRunData(input);

  return repository.accessibilityVisualRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update: data,
  });
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

