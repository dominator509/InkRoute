import {
  buildObservabilityAutomatedCoverageReadinessPlan,
  observabilityAutomatedCoverageRequiredEvidence as packageObservabilityAutomatedCoverageRequiredEvidence,
} from "@inkroute/observability";

export const observabilityAutomatedCoverageRequiredEvidence = packageObservabilityAutomatedCoverageRequiredEvidence;

export const observabilityAutomatedCoverageArtifactPaths = [
  "coverage/observability-automated-coverage.json",
  "coverage/observability-automated-package-test.txt",
  "coverage/observability-automated-web-typecheck.txt",
  "coverage/observability-automated-route-static.json",
  "coverage/observability-automated-ui-static.json",
  "coverage/observability-global-error-rendered.json",
  "coverage/observability-dashboard-triage-smoke.json",
  "coverage/observability-playwright-triage-results.json",
  "coverage/observability-mobile-simulator-crash-ui.json",
  "coverage/observability-mobile-device-crash-proof-redacted.json",
  "coverage/observability-webhook-ingest-coverage.json",
  "coverage/observability-ci-evidence.json",
  "coverage/observability-secret-safe-artifacts.json",
  "coverage/observability-automated-closeout.md",
  "test-results/observability-automated",
  "test-results/observability-browser",
  "test-results/observability-mobile",
] as const;

export const observabilityAutomatedCoverageProofFiles = [
  "packages/observability/package.json",
  "apps/web/package.json",
  "packages/observability/src/index.ts",
  "packages/observability/tests/redaction-report.test.ts",
  "apps/web/lib/observabilityAutomatedCoverage.ts",
  "apps/web/tests/observability-routes.test.ts",
  "apps/web/tests/observability-ui-static.test.ts",
  "apps/web/tests/observability-automated-coverage-static.test.ts",
  "apps/web/tests/e2e/observability-global-error.spec.ts",
  "apps/dashboard/tests/e2e/observability-triage.spec.ts",
  "apps/mobile/tests/mobile-crash-static.test.ts",
  "apps/mobile/tests/mobile-crash-proof-static.test.ts",
  "apps/web/app/global-error.tsx",
  "apps/dashboard/app/global-error.tsx",
  "apps/mobile/src/screens/SystemStatusScreen.tsx",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type ObservabilityAutomatedCoverageEvidenceArtifact = (typeof observabilityAutomatedCoverageArtifactPaths)[number];

export const observabilityAutomatedCoverageRequiredExternalEvidence = [
  "rendered web global-error Playwright proof",
  "dashboard triage browser smoke",
  "mobile simulator crash-report UI smoke",
  "mobile physical-device crash-report proof",
  "CI evidence, closeout evidence, and produced secret-safe artifacts",
] as const;

export interface ObservabilityAutomatedCoverageExecutionPlan {
  readonly id: "gap-086-observability-automated-coverage";
  readonly browserExecutionAllowed: false;
  readonly mobileDeviceExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly policy: ObservabilityAutomatedCoverageExecutionPolicy;
  readonly source: "local-software-plan";
  readonly requiredCommands: typeof observabilityAutomatedCoverageCommands;
  readonly requiredArtifacts: typeof observabilityAutomatedCoverageArtifactPaths;
  readonly localStaticArtifacts: readonly ObservabilityAutomatedCoverageEvidenceArtifact[];
  readonly browserArtifacts: readonly ObservabilityAutomatedCoverageEvidenceArtifact[];
  readonly mobileArtifacts: readonly ObservabilityAutomatedCoverageEvidenceArtifact[];
  readonly ciArtifacts: readonly ObservabilityAutomatedCoverageEvidenceArtifact[];
  readonly closeoutArtifacts: readonly ObservabilityAutomatedCoverageEvidenceArtifact[];
  readonly secretSafeArtifactPath: ObservabilityAutomatedCoverageEvidenceArtifact;
  readonly externalEvidenceRequired: typeof observabilityAutomatedCoverageRequiredExternalEvidence;
}

export interface ObservabilityAutomatedCoverageExecutionPolicy {
  readonly executeBrowserCoverage: false;
  readonly executeMobileSimulator: false;
  readonly executeMobilePhysicalDevice: false;
  readonly executeWebhookIngestCoverage: false;
  readonly executeCi: false;
  readonly executeCloseoutEvidenceCapture: false;
}

export interface ObservabilityAutomatedCoverageArtifactReview {
  readonly artifactName: string;
  readonly safeToPersist: boolean;
  readonly redactedArtifact: unknown;
  readonly unsafeFindings: readonly string[];
  readonly requiredArtifactPath: ObservabilityAutomatedCoverageEvidenceArtifact;
}

const observabilityCoverageSensitiveKeyPattern =
  /(?:authorization|body|clientsecret|cookie|credential|email|password|phone|private|raw|secret|stack|token|url)/i;
const observabilityCoverageEmailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const observabilityCoveragePhonePattern = /\+?\d[\d ().-]{7,}\d/g;
const observabilityCoverageTokenPattern = /\b(?:bearer|sentry|sk|xox|ya29)[A-Za-z0-9._:/-]{8,}\b/gi;

function redactObservabilityCoverageArtifactValue(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (observabilityCoverageSensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value
      .replace(observabilityCoverageEmailPattern, "[REDACTED_EMAIL]")
      .replace(observabilityCoveragePhonePattern, "[REDACTED_PHONE]")
      .replace(observabilityCoverageTokenPattern, "[REDACTED_TOKEN]");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactObservabilityCoverageArtifactValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactObservabilityCoverageArtifactValue(entryValue, entryKey)]),
    );
  }

  return value;
}

export function buildRedactedObservabilityAutomatedCoverageArtifact(artifact: unknown): unknown {
  return redactObservabilityCoverageArtifactValue(artifact);
}

export const observabilityAutomatedCoverageExecutionPolicy: ObservabilityAutomatedCoverageExecutionPolicy = {
  executeBrowserCoverage: false,
  executeMobileSimulator: false,
  executeMobilePhysicalDevice: false,
  executeWebhookIngestCoverage: false,
  executeCi: false,
  executeCloseoutEvidenceCapture: false,
};

export function buildObservabilityAutomatedCoverageExecutionPlan(): ObservabilityAutomatedCoverageExecutionPlan {
  return {
    id: "gap-086-observability-automated-coverage",
    browserExecutionAllowed: false,
    mobileDeviceExecutionAllowed: false,
    ciExecutionAllowed: false,
    policy: observabilityAutomatedCoverageExecutionPolicy,
    source: "local-software-plan",
    requiredCommands: observabilityAutomatedCoverageCommands,
    requiredArtifacts: observabilityAutomatedCoverageArtifactPaths,
    localStaticArtifacts: [
      "coverage/observability-automated-coverage.json",
      "coverage/observability-automated-package-test.txt",
      "coverage/observability-automated-web-typecheck.txt",
      "coverage/observability-automated-route-static.json",
      "coverage/observability-automated-ui-static.json",
      "coverage/observability-webhook-ingest-coverage.json",
    ],
    browserArtifacts: [
      "coverage/observability-global-error-rendered.json",
      "coverage/observability-dashboard-triage-smoke.json",
      "coverage/observability-playwright-triage-results.json",
    ],
    mobileArtifacts: [
      "coverage/observability-mobile-simulator-crash-ui.json",
      "coverage/observability-mobile-device-crash-proof-redacted.json",
    ],
    ciArtifacts: ["coverage/observability-ci-evidence.json"],
    closeoutArtifacts: ["coverage/observability-automated-closeout.md"],
    secretSafeArtifactPath: "coverage/observability-secret-safe-artifacts.json",
    externalEvidenceRequired: observabilityAutomatedCoverageRequiredExternalEvidence,
  };
}

export function buildObservabilityAutomatedCoverageArtifactReview(
  artifactName: string,
  artifact: unknown,
  requiredArtifactPath: ObservabilityAutomatedCoverageEvidenceArtifact = "coverage/observability-secret-safe-artifacts.json",
): ObservabilityAutomatedCoverageArtifactReview {
  const redactedArtifact = buildRedactedObservabilityAutomatedCoverageArtifact(artifact);
  const serialized = JSON.stringify(redactedArtifact);
  const unsafeFindings = [
    serialized.match(observabilityCoverageEmailPattern) ? "email" : null,
    serialized.match(observabilityCoveragePhonePattern) ? "phone" : null,
    serialized.match(observabilityCoverageTokenPattern) ? "provider-token" : null,
  ].filter((finding): finding is string => finding !== null);

  return {
    artifactName,
    safeToPersist: unsafeFindings.length === 0,
    redactedArtifact,
    unsafeFindings,
    requiredArtifactPath,
  };
}

export interface ObservabilityAutomatedCoverageEvidenceInput {
  readonly observabilityPackageTestsPassed: boolean;
  readonly webTypecheckPassed: boolean;
  readonly routeStaticTestsPassed: boolean;
  readonly uiStaticTestsPassed: boolean;
  readonly renderedGlobalErrorBrowserPassed: boolean;
  readonly dashboardTriageBrowserPassed: boolean;
  readonly mobileSimulatorCrashUiPassed: boolean;
  readonly mobileDeviceCrashProofCaptured: boolean;
  readonly webhookIngestCoveragePassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly closeoutEvidenceAttached: boolean;
  readonly capturedArtifacts: readonly ObservabilityAutomatedCoverageEvidenceArtifact[];
}

export interface ObservabilityAutomatedCoverageEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly ObservabilityAutomatedCoverageEvidenceArtifact[];
  readonly requiredCommands: typeof observabilityAutomatedCoverageCommands;
  readonly requiredEvidence: typeof observabilityAutomatedCoverageDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export const observabilityAutomatedCoverageDecisionRequiredEvidence = [
  "observability package, web typecheck, route/static, UI static, mobile static, and webhook/ingest coverage artifacts",
  "rendered web global-error, dashboard triage browser, mobile simulator, and physical-device crash proof artifacts",
  "CI evidence, redacted secret-safe artifact review, and closeout attachment",
] as const;

export function buildObservabilityAutomatedCoverageEvidenceDecision(
  input: ObservabilityAutomatedCoverageEvidenceInput,
): ObservabilityAutomatedCoverageEvidenceDecision {
  const blockers = [
    !input.observabilityPackageTestsPassed ? "@inkroute/observability package test evidence is required." : null,
    !input.webTypecheckPassed ? "Web typecheck evidence is required." : null,
    !input.routeStaticTestsPassed ? "Observability route/static test evidence is required." : null,
    !input.uiStaticTestsPassed ? "Observability UI static evidence is required." : null,
    !input.renderedGlobalErrorBrowserPassed ? "Rendered web global-error browser evidence is required." : null,
    !input.dashboardTriageBrowserPassed ? "Dashboard triage browser smoke evidence is required." : null,
    !input.mobileSimulatorCrashUiPassed ? "Mobile simulator crash-report UI evidence is required." : null,
    !input.mobileDeviceCrashProofCaptured ? "Mobile physical-device crash-report proof is required." : null,
    !input.webhookIngestCoveragePassed ? "Webhook/ingest coverage evidence is required." : null,
    !input.ciEvidenceCaptured ? "CI observability automated coverage evidence is required." : null,
    !input.secretSafeArtifactReviewPassed ? "Secret-safe artifact review evidence is required." : null,
    !input.closeoutEvidenceAttached ? "Observability automated coverage closeout evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = observabilityAutomatedCoverageArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: observabilityAutomatedCoverageCommands,
    requiredEvidence: observabilityAutomatedCoverageDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-086 observability automated coverage evidence is complete with CI-safe redacted artifacts captured."
        : "GAP-086 observability automated coverage evidence remains blocked until browser, mobile, CI, closeout, and redaction artifacts are captured.",
  };
}

export const observabilityAutomatedCoverageCommands = [
  "pnpm --filter @inkroute/observability test",
  "pnpm vitest run apps/web/tests/observability-routes.test.ts apps/web/tests/observability-ui-static.test.ts apps/mobile/tests/mobile-crash-static.test.ts apps/mobile/tests/mobile-crash-proof-static.test.ts",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm exec playwright test apps/web/tests/e2e/observability-global-error.spec.ts apps/dashboard/tests/e2e/observability-triage.spec.ts",
  "mobile simulator crash-report UI smoke",
  "mobile physical-device crash-report proof",
  "GitHub Actions observability automated coverage evidence",
  "redacted observability coverage artifact audit",
] as const;

export const observabilityAutomatedCoverageMatrix = [
  {
    id: "package-observability-helpers",
    command: "pnpm --filter @inkroute/observability test",
    artifact: "coverage/observability-automated-coverage.json",
    status: "implemented-command-target",
  },
  {
    id: "web-observability-routes",
    command: "pnpm vitest run apps/web/tests/observability-routes.test.ts",
    artifact: "coverage/observability-webhook-ingest-coverage.json",
    status: "implemented-command-target",
  },
  {
    id: "web-ui-static",
    command: "pnpm vitest run apps/web/tests/observability-ui-static.test.ts",
    artifact: "coverage/observability-automated-ui-static.json",
    status: "implemented-command-target",
  },
  {
    id: "rendered-global-error-boundaries",
    command: "pnpm exec playwright test apps/web/tests/e2e/observability-global-error.spec.ts",
    artifact: "coverage/observability-global-error-rendered.json",
    status: "playwright-target-added",
  },
  {
    id: "dashboard-triage-browser-smoke",
    command: "pnpm exec playwright test apps/dashboard/tests/e2e/observability-triage.spec.ts",
    artifact: "coverage/observability-dashboard-triage-smoke.json",
    status: "playwright-target-added",
  },
  {
    id: "mobile-crash-simulator-ui",
    command: "mobile simulator crash-report UI smoke",
    artifact: "coverage/observability-mobile-simulator-crash-ui.json",
    status: "static-proof-target-added",
  },
  {
    id: "mobile-crash-device-proof",
    command: "mobile physical-device crash-report proof",
    artifact: "coverage/observability-mobile-device-crash-proof-redacted.json",
    status: "device-proof-gated",
  },
  {
    id: "ci-observability-coverage",
    command: "GitHub Actions observability automated coverage evidence",
    artifact: "coverage/observability-ci-evidence.json",
    status: "ci-gated",
  },
  {
    id: "secret-safe-artifacts",
    command: "redacted observability coverage artifact audit",
    artifact: "coverage/observability-secret-safe-artifacts.json",
    status: "artifact-gated",
  },
  {
    id: "closeout-evidence",
    command: "attach observability automated coverage closeout evidence",
    artifact: "coverage/observability-automated-closeout.md",
    status: "artifact-gated",
  },
] as const;

export function buildObservabilityAutomatedCoverageContract() {
  return buildObservabilityAutomatedCoverageReadinessPlan({
    packageScripts: ["test", "typecheck"],
    observabilityPackageTestsPassed: false,
    webRouteTestsPassed: false,
    webUiStaticTestsPassed: false,
    webTypecheckPassed: false,
    globalErrorRenderedComponentTestsAdded: true,
    dashboardErrorsPageSmokePassed: false,
    playwrightDashboardTriageCovered: true,
    mobileSimulatorCrashReportUiTested: true,
    mobileDeviceCrashReportUiTested: false,
    sentryWebhookSignatureTestsCovered: true,
    publicIngestPersistenceTestsCovered: true,
    ciArtifactsCaptured: true,
  });
}

export const observabilityAutomatedCoverageContract = buildObservabilityAutomatedCoverageContract();



