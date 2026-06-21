import {
  buildObservabilityRuntimeVerificationPlan,
  type ObservabilityRuntimeVerificationPlan,
} from "@inkroute/observability";

export type ObservabilityRuntimeSurfaceId =
  | "web-global-error"
  | "dashboard-global-error"
  | "public-error-report-api"
  | "sentry-webhook-api"
  | "dashboard-error-triage"
  | "mobile-system-status"
  | "sanitized-log-capture"
  | "local-fallback-persistence"
  | "sentry-provider-proof"
  | "runtime-closeout-artifacts";

export type ObservabilityRuntimeSurface = {
  id: ObservabilityRuntimeSurfaceId;
  command: string;
  artifacts: string[];
  syntheticOnly: true;
  piiPolicy: "redacted-only";
};

export type ObservabilityRuntimeVerificationStatus =
  | "wired"
  | "browser-gated"
  | "api-gated"
  | "mobile-gated"
  | "provider-gated"
  | "privacy-gated"
  | "ci-gated";

export interface ObservabilityRuntimeVerificationMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: ObservabilityRuntimeVerificationStatus;
}

export const observabilityRuntimeSurfaces: ObservabilityRuntimeSurface[] = [
  {
    id: "web-global-error",
    command: "pnpm playwright test apps/web/tests/e2e/observability-global-error.spec.ts",
    artifacts: ["coverage/observability-web-error-screenshot.png", "test-results/observability/web"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
  {
    id: "dashboard-global-error",
    command: "pnpm playwright test apps/dashboard/tests/e2e/observability-dashboard-error.spec.ts",
    artifacts: ["coverage/observability-dashboard-error-screenshot.png", "test-results/observability/dashboard"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
  {
    id: "public-error-report-api",
    command: "pnpm vitest run apps/web/tests/observability-routes.test.ts",
    artifacts: ["coverage/observability-public-api-forced-error.json"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
  {
    id: "sentry-webhook-api",
    command: "pnpm vitest run apps/web/tests/observability-routes.test.ts",
    artifacts: ["coverage/observability-sentry-webhook-forced-error.json"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
  {
    id: "dashboard-error-triage",
    command: "pnpm playwright test apps/dashboard/tests/e2e/observability-triage.spec.ts",
    artifacts: ["coverage/observability-dashboard-triage.png", "test-results/observability/dashboard"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
  {
    id: "mobile-system-status",
    command: "pnpm --filter @inkroute/mobile test -- SystemStatusScreen",
    artifacts: ["coverage/observability-mobile-system-status.png", "test-results/observability/mobile"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
  {
    id: "sanitized-log-capture",
    command: "capture sanitized forced-error logs from web, dashboard, API, webhook, and mobile surfaces",
    artifacts: ["coverage/observability-sanitized-logs.json"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
  {
    id: "local-fallback-persistence",
    command: "pnpm vitest run apps/web/tests/observability-routes.test.ts apps/dashboard/tests/error-report-route-static.test.ts",
    artifacts: ["coverage/observability-local-fallback-persistence.json"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
  {
    id: "sentry-provider-proof",
    command: "Sentry/provider live runtime proof after SDK and credentials are configured",
    artifacts: ["coverage/observability-sentry-provider-proof-redacted.json"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
  {
    id: "runtime-closeout-artifacts",
    command: "attach runtime screenshots, sanitized logs, provider proof, and no-PII checklist to closeout",
    artifacts: ["coverage/observability-runtime-closeout.md"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
];

export const observabilityRuntimeVerificationCommands = [
  "pnpm --filter @inkroute/observability typecheck",
  "pnpm --filter @inkroute/observability test",
  "pnpm vitest run apps/web/tests/observability-runtime-verification-static.test.ts apps/web/tests/observability-routes.test.ts apps/dashboard/tests/error-report-route-static.test.ts",
  "pnpm playwright test apps/web/tests/e2e/observability-global-error.spec.ts",
  "pnpm playwright test apps/dashboard/tests/e2e/observability-dashboard-error.spec.ts",
  "pnpm playwright test apps/dashboard/tests/e2e/observability-triage.spec.ts",
  "pnpm --filter @inkroute/mobile test -- SystemStatusScreen",
  "Sentry/provider live runtime proof with redacted synthetic payloads",
  "no-PII observability artifact audit",
] as const;

export const observabilityRuntimeRequiredExternalEvidence = [
  "web/dashboard forced-error screenshots",
  "API/webhook forced-error smoke artifacts",
  "mobile SystemStatusScreen forced-error screenshot",
  "sanitized log capture and local fallback persistence proof",
  "redacted Sentry/provider and provider webhook proof",
  "no-PII artifact audit, CI evidence, and closeout attachment",
] as const;

export const observabilityRuntimeArtifactPaths = [
  "coverage/observability-package-typecheck.txt",
  "coverage/observability-package-test.txt",
  "coverage/observability-runtime-static-contract.json",
  "coverage/observability-web-error-screenshot.png",
  "coverage/observability-dashboard-error-screenshot.png",
  "coverage/observability-public-api-forced-error.json",
  "coverage/observability-sentry-webhook-forced-error.json",
  "coverage/observability-dashboard-triage.png",
  "coverage/observability-mobile-system-status.png",
  "coverage/observability-sanitized-logs.json",
  "coverage/observability-local-fallback-persistence.json",
  "coverage/observability-sentry-provider-proof-redacted.json",
  "coverage/observability-provider-webhook-proof-redacted.json",
  "coverage/observability-no-pii-artifact-audit.json",
  "coverage/observability-ci-evidence.json",
  "coverage/observability-runtime-closeout.md",
  "test-results/observability/web",
  "test-results/observability/dashboard",
  "test-results/observability/mobile",
] as const;

export const observabilityRuntimeProofFiles = [
  "apps/mobile/package.json",
  "packages/observability/package.json",
  "packages/observability/src/index.ts",
  "packages/observability/tests/redaction-report.test.ts",
  "apps/web/lib/observabilityRuntimeVerification.ts",
  "apps/web/tests/observability-runtime-verification-static.test.ts",
  "apps/web/app/global-error.tsx",
  "apps/dashboard/app/global-error.tsx",
  "apps/dashboard/app/errors/page.tsx",
  "apps/mobile/src/screens/SystemStatusScreen.tsx",
  "apps/web/app/api/public/[tenantSlug]/error-reports/route.ts",
  "apps/web/app/api/webhooks/sentry/route.ts",
  "apps/web/tests/observability-routes.test.ts",
  "apps/dashboard/tests/error-report-route-static.test.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type ObservabilityRuntimeEvidenceArtifact = (typeof observabilityRuntimeArtifactPaths)[number];

export interface ObservabilityRuntimeExecutionPlan {
  readonly id: "gap-079-observability-runtime-verification";
  readonly providerExecutionAllowed: false;
  readonly syntheticOnly: true;
  readonly piiPolicy: "redacted-only";
  readonly policy: ObservabilityRuntimeExecutionPolicy;
  readonly source: "local-software-plan";
  readonly requiredCommands: typeof observabilityRuntimeVerificationCommands;
  readonly requiredArtifacts: typeof observabilityRuntimeArtifactPaths;
  readonly localContractArtifacts: readonly ObservabilityRuntimeEvidenceArtifact[];
  readonly runtimeProofArtifacts: readonly ObservabilityRuntimeEvidenceArtifact[];
  readonly providerArtifacts: readonly ObservabilityRuntimeEvidenceArtifact[];
  readonly privacyArtifacts: readonly ObservabilityRuntimeEvidenceArtifact[];
  readonly closeoutArtifacts: readonly ObservabilityRuntimeEvidenceArtifact[];
  readonly externalEvidenceRequired: typeof observabilityRuntimeRequiredExternalEvidence;
}

export interface ObservabilityRuntimeExecutionPolicy {
  readonly executeBrowserForcedErrorChecks: false;
  readonly executeApiWebhookForcedErrorSmoke: false;
  readonly executeMobileForcedErrorCheck: false;
  readonly executeSentryProviderProof: false;
  readonly executeNoPiiArtifactAudit: false;
  readonly executeCi: false;
}

export interface ObservabilityRuntimeArtifactReview {
  readonly artifactName: string;
  readonly safeToPersist: boolean;
  readonly redactedArtifact: unknown;
  readonly unsafeFindings: readonly string[];
  readonly requiredArtifactPath: ObservabilityRuntimeEvidenceArtifact;
}

const observabilitySensitiveKeyPattern =
  /(?:authorization|breadcrumb|clientsecret|cookie|credential|email|eventid|ip|password|phone|private|raw|secret|session|stack|token|userid)/i;
const observabilityEmailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const observabilityPhonePattern = /\+?\d[\d ().-]{7,}\d/g;
const observabilityTokenPattern = /\b(?:bearer|dsn|sentry|sk|xox|ya29)[A-Za-z0-9._:/-]{8,}\b/gi;
const observabilityIpPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

function redactObservabilityRuntimeValue(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (observabilitySensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value
      .replace(observabilityEmailPattern, "[REDACTED_EMAIL]")
      .replace(observabilityPhonePattern, "[REDACTED_PHONE]")
      .replace(observabilityTokenPattern, "[REDACTED_TOKEN]")
      .replace(observabilityIpPattern, "[REDACTED_IP]");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactObservabilityRuntimeValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactObservabilityRuntimeValue(entryValue, entryKey)]),
    );
  }

  return value;
}

export function buildRedactedObservabilityRuntimeArtifact(artifact: unknown): unknown {
  return redactObservabilityRuntimeValue(artifact);
}

export const observabilityRuntimeExecutionPolicy: ObservabilityRuntimeExecutionPolicy = {
  executeBrowserForcedErrorChecks: false,
  executeApiWebhookForcedErrorSmoke: false,
  executeMobileForcedErrorCheck: false,
  executeSentryProviderProof: false,
  executeNoPiiArtifactAudit: false,
  executeCi: false,
};

export function buildObservabilityRuntimeExecutionPlan(): ObservabilityRuntimeExecutionPlan {
  return {
    id: "gap-079-observability-runtime-verification",
    providerExecutionAllowed: false,
    syntheticOnly: true,
    piiPolicy: "redacted-only",
    policy: observabilityRuntimeExecutionPolicy,
    source: "local-software-plan",
    requiredCommands: observabilityRuntimeVerificationCommands,
    requiredArtifacts: observabilityRuntimeArtifactPaths,
    localContractArtifacts: [
      "coverage/observability-package-typecheck.txt",
      "coverage/observability-package-test.txt",
      "coverage/observability-runtime-static-contract.json",
    ],
    runtimeProofArtifacts: [
      "coverage/observability-web-error-screenshot.png",
      "coverage/observability-dashboard-error-screenshot.png",
      "coverage/observability-public-api-forced-error.json",
      "coverage/observability-sentry-webhook-forced-error.json",
      "coverage/observability-dashboard-triage.png",
      "coverage/observability-mobile-system-status.png",
      "coverage/observability-sanitized-logs.json",
      "coverage/observability-local-fallback-persistence.json",
    ],
    providerArtifacts: [
      "coverage/observability-sentry-provider-proof-redacted.json",
      "coverage/observability-provider-webhook-proof-redacted.json",
    ],
    privacyArtifacts: ["coverage/observability-no-pii-artifact-audit.json"],
    closeoutArtifacts: ["coverage/observability-ci-evidence.json", "coverage/observability-runtime-closeout.md"],
    externalEvidenceRequired: observabilityRuntimeRequiredExternalEvidence,
  };
}

export function buildObservabilityRuntimeArtifactReview(
  artifactName: string,
  artifact: unknown,
  requiredArtifactPath: ObservabilityRuntimeEvidenceArtifact = "coverage/observability-no-pii-artifact-audit.json",
): ObservabilityRuntimeArtifactReview {
  const redactedArtifact = buildRedactedObservabilityRuntimeArtifact(artifact);
  const serialized = JSON.stringify(redactedArtifact);
  const unsafeFindings = [
    observabilityEmailPattern.test(serialized) ? "email" : null,
    observabilityPhonePattern.test(serialized) ? "phone" : null,
    observabilityTokenPattern.test(serialized) ? "provider-token" : null,
    observabilityIpPattern.test(serialized) ? "ip-address" : null,
  ].filter((finding): finding is string => finding !== null);

  return {
    artifactName,
    safeToPersist: unsafeFindings.length === 0,
    redactedArtifact,
    unsafeFindings,
    requiredArtifactPath,
  };
}

export interface ObservabilityRuntimeEvidenceInput {
  readonly packageTypecheckPassed: boolean;
  readonly packageTestsPassed: boolean;
  readonly staticContractsPassed: boolean;
  readonly webGlobalErrorVerified: boolean;
  readonly dashboardGlobalErrorVerified: boolean;
  readonly publicErrorReportApiVerified: boolean;
  readonly sentryWebhookApiVerified: boolean;
  readonly dashboardTriageVerified: boolean;
  readonly mobileSystemStatusVerified: boolean;
  readonly sanitizedLogsCaptured: boolean;
  readonly localFallbackPersistenceVerified: boolean;
  readonly sentryProviderProofCaptured: boolean;
  readonly providerWebhookProofCaptured: boolean;
  readonly noPiiArtifactAuditPassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly runtimeCloseoutAttached: boolean;
  readonly capturedArtifacts: readonly ObservabilityRuntimeEvidenceArtifact[];
}

export interface ObservabilityRuntimeEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly ObservabilityRuntimeEvidenceArtifact[];
  readonly requiredCommands: typeof observabilityRuntimeVerificationCommands;
  readonly requiredEvidence: typeof observabilityRuntimeDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export const observabilityRuntimeDecisionRequiredEvidence = [
  "observability package typecheck/test and static contract artifacts",
  "web, dashboard, API, webhook, mobile, sanitized log, and fallback persistence artifacts",
  "dashboard triage, redacted Sentry/provider, provider webhook, and no-PII audit artifacts",
  "CI evidence and runtime closeout attachment",
] as const;

export function buildObservabilityRuntimeEvidenceDecision(input: ObservabilityRuntimeEvidenceInput): ObservabilityRuntimeEvidenceDecision {
  const blockers = [
    !input.packageTypecheckPassed ? "Observability package typecheck evidence is required." : null,
    !input.packageTestsPassed ? "Observability package test evidence is required." : null,
    !input.staticContractsPassed ? "Observability runtime static contract evidence is required." : null,
    !input.webGlobalErrorVerified ? "Web global-error forced-error screenshot evidence is required." : null,
    !input.dashboardGlobalErrorVerified ? "Dashboard global-error forced-error screenshot evidence is required." : null,
    !input.publicErrorReportApiVerified ? "Public error-report API forced-error evidence is required." : null,
    !input.sentryWebhookApiVerified ? "Sentry webhook API forced-error evidence is required." : null,
    !input.dashboardTriageVerified ? "Dashboard triage runtime evidence is required." : null,
    !input.mobileSystemStatusVerified ? "Mobile SystemStatusScreen forced-error evidence is required." : null,
    !input.sanitizedLogsCaptured ? "Sanitized forced-error log capture evidence is required." : null,
    !input.localFallbackPersistenceVerified ? "Local fallback persistence evidence is required." : null,
    !input.sentryProviderProofCaptured ? "Redacted Sentry/provider runtime proof is required." : null,
    !input.providerWebhookProofCaptured ? "Redacted provider webhook reconciliation proof is required." : null,
    !input.noPiiArtifactAuditPassed ? "No-PII observability artifact audit evidence is required." : null,
    !input.ciEvidenceCaptured ? "CI observability runtime verification evidence is required." : null,
    !input.runtimeCloseoutAttached ? "Observability runtime closeout evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = observabilityRuntimeArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: observabilityRuntimeVerificationCommands,
    requiredEvidence: observabilityRuntimeDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-079 observability runtime verification evidence is complete with CI-safe redacted artifacts captured."
        : "GAP-079 observability runtime verification evidence remains blocked until synthetic forced-error, provider, no-PII, CI, and closeout artifacts are captured.",
  };
}

export const observabilityRuntimeVerificationMatrix: readonly ObservabilityRuntimeVerificationMatrixEntry[] = [
  { id: "observability-typecheck", command: "pnpm --filter @inkroute/observability typecheck", artifact: "coverage/observability-package-typecheck.txt", status: "wired" },
  { id: "observability-tests", command: "pnpm --filter @inkroute/observability test", artifact: "coverage/observability-package-test.txt", status: "wired" },
  { id: "static-contracts", command: "observability runtime static contract suite", artifact: "coverage/observability-runtime-static-contract.json", status: "wired" },
  { id: "web-global-error", command: "pnpm playwright test apps/web/tests/e2e/observability-global-error.spec.ts", artifact: "coverage/observability-web-error-screenshot.png", status: "browser-gated" },
  { id: "dashboard-global-error", command: "pnpm playwright test apps/dashboard/tests/e2e/observability-dashboard-error.spec.ts", artifact: "coverage/observability-dashboard-error-screenshot.png", status: "browser-gated" },
  { id: "public-error-report-api", command: "pnpm vitest run apps/web/tests/observability-routes.test.ts", artifact: "coverage/observability-public-api-forced-error.json", status: "api-gated" },
  { id: "sentry-webhook-api", command: "pnpm vitest run apps/web/tests/observability-routes.test.ts", artifact: "coverage/observability-sentry-webhook-forced-error.json", status: "api-gated" },
  { id: "dashboard-triage", command: "pnpm playwright test apps/dashboard/tests/e2e/observability-triage.spec.ts", artifact: "coverage/observability-dashboard-triage.png", status: "browser-gated" },
  { id: "mobile-system-status", command: "pnpm --filter @inkroute/mobile test -- SystemStatusScreen", artifact: "coverage/observability-mobile-system-status.png", status: "mobile-gated" },
  { id: "sanitized-logs", command: "capture sanitized forced-error logs", artifact: "coverage/observability-sanitized-logs.json", status: "privacy-gated" },
  { id: "local-fallback-persistence", command: "local fallback persistence smoke", artifact: "coverage/observability-local-fallback-persistence.json", status: "api-gated" },
  { id: "sentry-provider-proof", command: "Sentry/provider live runtime proof", artifact: "coverage/observability-sentry-provider-proof-redacted.json", status: "provider-gated" },
  { id: "provider-webhook-proof", command: "provider webhook reconciliation proof", artifact: "coverage/observability-provider-webhook-proof-redacted.json", status: "provider-gated" },
  { id: "no-pii-artifact-audit", command: "no-PII observability artifact audit", artifact: "coverage/observability-no-pii-artifact-audit.json", status: "privacy-gated" },
  { id: "ci-observability-runtime-gate", command: "GitHub Actions observability runtime verification gate", artifact: "coverage/observability-ci-evidence.json", status: "ci-gated" },
  { id: "runtime-closeout", command: "attach runtime closeout evidence", artifact: "coverage/observability-runtime-closeout.md", status: "ci-gated" },
] as const;

export const safeSyntheticErrorPayload = {
  message: "Synthetic observability verification error [redacted:test-only]",
  route: "/__observability/synthetic-error",
  release: "phase11-runtime-verification",
  metadata: {
    synthetic: true,
    pii: "none",
    medicalNotes: "[redacted:test-only]",
    payment: "[redacted:test-only]",
    token: "[redacted:test-only]",
  },
} as const;

export function buildObservabilityRuntimeVerificationContract(): ObservabilityRuntimeVerificationPlan {
  return buildObservabilityRuntimeVerificationPlan({
    packageScripts: ["test", "typecheck"],
    packageTestsPassed: false,
    packageTypecheckPassed: false,
    webBuildPassed: false,
    dashboardBuildPassed: false,
    mobileTypecheckPassed: false,
    routeSmokeTestsPassed: false,
    forcedWebErrorUxVerified: false,
    forcedDashboardErrorUxVerified: false,
    forcedApiErrorVerified: false,
    forcedWebhookErrorVerified: false,
    forcedMobileErrorUxVerified: false,
    browserScreenshotsCaptured: false,
    simulatorOrDeviceScreenshotsCaptured: false,
    sanitizedLogOutputCaptured: false,
    localFallbackPersistenceVerified: false,
    dashboardTriageDisplayVerified: false,
    sentrySdkConfigured: false,
    liveSentryProviderProofCaptured: false,
    providerWebhookProofCaptured: false,
    noPiiLeakageVerified: false,
    runtimeEvidenceAttached: false,
  });
}

export const observabilityRuntimeVerificationContract = buildObservabilityRuntimeVerificationContract();


