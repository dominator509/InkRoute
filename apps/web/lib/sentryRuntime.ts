import {
  buildSentrySdkConfigurationPlan,
  buildSentrySdkRuntimeImplementationPlan,
  redactMetadata,
  redactSensitiveText,
  type SentrySdkConfigurationPlan,
} from "@inkroute/observability";

export type SentrySdkImplementationStatus =
  | "wired"
  | "package-gated"
  | "credential-gated"
  | "upload-gated"
  | "provider-gated"
  | "ci-gated";

export interface SentrySdkImplementationMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: SentrySdkImplementationStatus;
}

export const sentrySdkImplementationCommands = [
  "pnpm --filter @inkroute/observability typecheck",
  "pnpm --filter @inkroute/observability test",
  "pnpm vitest run apps/web/tests/sentry-sdk-runtime-static.test.ts apps/mobile/tests/mobile-crash-static.test.ts",
  "install @sentry/nextjs for web",
  "install @sentry/nextjs for dashboard",
  "install @sentry/react-native for mobile",
  "configure Sentry DSN/auth/org/project secrets",
  "upload web/dashboard source maps",
  "upload Expo source maps",
  "upload React Native debug symbols",
  "live synthetic web Sentry capture",
  "live synthetic dashboard Sentry capture",
  "live synthetic mobile Sentry capture",
  "no-PII provider payload proof",
  "GitHub Actions Sentry SDK implementation gate",
] as const;

export const sentrySdkImplementationRequiredExternalEvidence = [
  "@sentry package installation evidence",
  "redacted DSN/auth/org/project secret evidence",
  "web/dashboard source-map, Expo source-map, and React Native debug-symbol upload proof",
  "live synthetic web/dashboard/mobile Sentry captures",
  "provider no-PII payload proof and CI evidence",
] as const;

export const sentrySdkImplementationArtifactPaths = [
  "coverage/sentry-sdk-observability-typecheck.txt",
  "coverage/sentry-sdk-observability-test.txt",
  "coverage/sentry-sdk-static-contract.json",
  "coverage/sentry-sdk-web-nextjs-package.json",
  "coverage/sentry-sdk-dashboard-nextjs-package.json",
  "coverage/sentry-sdk-mobile-react-native-package.json",
  "coverage/sentry-sdk-env-secrets-redacted.json",
  "coverage/sentry-source-map-upload-redacted.json",
  "coverage/sentry-expo-source-map-upload-redacted.json",
  "coverage/sentry-debug-symbol-upload-redacted.json",
  "coverage/sentry-live-web-capture-redacted.json",
  "coverage/sentry-live-dashboard-capture-redacted.json",
  "coverage/sentry-live-mobile-capture-redacted.json",
  "coverage/sentry-provider-no-pii-proof-redacted.json",
  "coverage/sentry-sdk-ci-evidence.json",
  "test-results/sentry-sdk",
] as const;

export const sentrySdkImplementationProofFiles = [
  "packages/observability/package.json",
  "packages/observability/src/index.ts",
  "packages/observability/tests/redaction-report.test.ts",
  "apps/web/lib/sentryRuntime.ts",
  "apps/web/instrumentation.ts",
  "apps/web/instrumentation-client.ts",
  "apps/web/sentry.server.config.ts",
  "apps/web/sentry.edge.config.ts",
  "apps/dashboard/lib/sentryRuntime.ts",
  "apps/dashboard/instrumentation.ts",
  "apps/dashboard/instrumentation-client.ts",
  "apps/dashboard/sentry.server.config.ts",
  "apps/mobile/src/lib/sentryRuntime.ts",
  "apps/mobile/src/lib/mobileCrash.ts",
  "apps/web/tests/sentry-sdk-runtime-static.test.ts",
  "apps/mobile/tests/mobile-crash-static.test.ts",
  "BUG_CRASH_REPORTING_PLAN.md",
  ".env.example",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type SentrySdkImplementationEvidenceArtifact = (typeof sentrySdkImplementationArtifactPaths)[number];

export interface SentrySdkImplementationExecutionPlan {
  readonly id: "gap-080-sentry-sdk-implementation";
  readonly credentialAccessAllowed: false;
  readonly providerExecutionAllowed: false;
  readonly sourceMapUploadAllowed: false;
  readonly policy: typeof sentrySdkImplementationExecutionPolicy;
  readonly source: "local-software-plan";
  readonly requiredCommands: typeof sentrySdkImplementationCommands;
  readonly requiredArtifacts: typeof sentrySdkImplementationArtifactPaths;
  readonly localContractArtifacts: readonly SentrySdkImplementationEvidenceArtifact[];
  readonly packageArtifacts: readonly SentrySdkImplementationEvidenceArtifact[];
  readonly secretArtifacts: readonly SentrySdkImplementationEvidenceArtifact[];
  readonly uploadArtifacts: readonly SentrySdkImplementationEvidenceArtifact[];
  readonly liveCaptureArtifacts: readonly SentrySdkImplementationEvidenceArtifact[];
  readonly noPiiArtifactPath: SentrySdkImplementationEvidenceArtifact;
  readonly externalEvidenceRequired: typeof sentrySdkImplementationRequiredExternalEvidence;
}

export interface SentrySdkImplementationExecutionPolicy {
  readonly accessSentryCredentials: false;
  readonly executeProviderRequests: false;
  readonly uploadWebDashboardSourceMaps: false;
  readonly uploadExpoSourceMaps: false;
  readonly uploadReactNativeDebugSymbols: false;
  readonly executeLiveSyntheticCaptures: false;
  readonly executeCi: false;
}

export interface SentrySdkImplementationArtifactReview {
  readonly artifactName: string;
  readonly safeToPersist: boolean;
  readonly redactedArtifact: unknown;
  readonly unsafeFindings: readonly string[];
  readonly requiredArtifactPath: SentrySdkImplementationEvidenceArtifact;
}

const sentryArtifactTokenPattern = /\b(?:bearer|dsn|ghp|sentry|sk|xox|ya29)[A-Za-z0-9._:/-]{8,}\b/gi;
const sentryArtifactEmailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const sentryArtifactPhonePattern = /\+?\d[\d ().-]{7,}\d/g;

function redactSentrySdkArtifactValue(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (/(?:auth|clientsecret|credential|dsn|email|password|phone|private|secret|token)/i.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return redactSensitiveText(value)
      .text.replace(sentryArtifactTokenPattern, "[REDACTED_TOKEN]")
      .replace(sentryArtifactEmailPattern, "[REDACTED_EMAIL]")
      .replace(sentryArtifactPhonePattern, "[REDACTED_PHONE]");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactSentrySdkArtifactValue(entry));
  }

  if (typeof value === "object") {
    return redactMetadata(
      Object.fromEntries(Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactSentrySdkArtifactValue(entryValue, entryKey)])),
    ).metadata;
  }

  return value;
}

export function buildRedactedSentrySdkImplementationArtifact(artifact: unknown): unknown {
  return redactSentrySdkArtifactValue(artifact);
}

export const sentrySdkImplementationExecutionPolicy: SentrySdkImplementationExecutionPolicy = {
  accessSentryCredentials: false,
  executeProviderRequests: false,
  uploadWebDashboardSourceMaps: false,
  uploadExpoSourceMaps: false,
  uploadReactNativeDebugSymbols: false,
  executeLiveSyntheticCaptures: false,
  executeCi: false,
};

export function buildSentrySdkImplementationExecutionPlan(): SentrySdkImplementationExecutionPlan {
  return {
    id: "gap-080-sentry-sdk-implementation",
    credentialAccessAllowed: false,
    providerExecutionAllowed: false,
    sourceMapUploadAllowed: false,
    policy: sentrySdkImplementationExecutionPolicy,
    source: "local-software-plan",
    requiredCommands: sentrySdkImplementationCommands,
    requiredArtifacts: sentrySdkImplementationArtifactPaths,
    localContractArtifacts: [
      "coverage/sentry-sdk-observability-typecheck.txt",
      "coverage/sentry-sdk-observability-test.txt",
      "coverage/sentry-sdk-static-contract.json",
    ],
    packageArtifacts: [
      "coverage/sentry-sdk-web-nextjs-package.json",
      "coverage/sentry-sdk-dashboard-nextjs-package.json",
      "coverage/sentry-sdk-mobile-react-native-package.json",
    ],
    secretArtifacts: ["coverage/sentry-sdk-env-secrets-redacted.json"],
    uploadArtifacts: [
      "coverage/sentry-source-map-upload-redacted.json",
      "coverage/sentry-expo-source-map-upload-redacted.json",
      "coverage/sentry-debug-symbol-upload-redacted.json",
    ],
    liveCaptureArtifacts: [
      "coverage/sentry-live-web-capture-redacted.json",
      "coverage/sentry-live-dashboard-capture-redacted.json",
      "coverage/sentry-live-mobile-capture-redacted.json",
    ],
    noPiiArtifactPath: "coverage/sentry-provider-no-pii-proof-redacted.json",
    externalEvidenceRequired: sentrySdkImplementationRequiredExternalEvidence,
  };
}

export function buildSentrySdkImplementationArtifactReview(
  artifactName: string,
  artifact: unknown,
  requiredArtifactPath: SentrySdkImplementationEvidenceArtifact = "coverage/sentry-provider-no-pii-proof-redacted.json",
): SentrySdkImplementationArtifactReview {
  const redactedArtifact = buildRedactedSentrySdkImplementationArtifact(artifact);
  const serialized = JSON.stringify(redactedArtifact);
  const unsafeFindings = [
    sentryArtifactEmailPattern.test(serialized) ? "email" : null,
    sentryArtifactPhonePattern.test(serialized) ? "phone" : null,
    sentryArtifactTokenPattern.test(serialized) ? "provider-token" : null,
  ].filter((finding): finding is string => finding !== null);

  return {
    artifactName,
    safeToPersist: unsafeFindings.length === 0,
    redactedArtifact,
    unsafeFindings,
    requiredArtifactPath,
  };
}

export interface SentrySdkImplementationEvidenceInput {
  readonly observabilityTypecheckPassed: boolean;
  readonly observabilityTestsPassed: boolean;
  readonly staticContractsPassed: boolean;
  readonly webNextjsPackageInstalled: boolean;
  readonly dashboardNextjsPackageInstalled: boolean;
  readonly mobileReactNativePackageInstalled: boolean;
  readonly sentrySecretsConfigured: boolean;
  readonly webDashboardSourceMapsUploaded: boolean;
  readonly expoSourceMapsUploaded: boolean;
  readonly reactNativeDebugSymbolsUploaded: boolean;
  readonly liveWebCaptureVerified: boolean;
  readonly liveDashboardCaptureVerified: boolean;
  readonly liveMobileCaptureVerified: boolean;
  readonly providerNoPiiProofCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly capturedArtifacts: readonly SentrySdkImplementationEvidenceArtifact[];
}

export const sentrySdkImplementationDecisionRequiredEvidence = [
  "observability package typecheck/test and Sentry static contract artifacts",
  "web/dashboard/mobile package installation and redacted secret configuration artifacts",
  "web/dashboard source-map, Expo source-map, and React Native debug-symbol upload artifacts",
  "live synthetic provider captures, no-PII provider payload proof, and CI evidence",
] as const;

export interface SentrySdkImplementationEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly SentrySdkImplementationEvidenceArtifact[];
  readonly requiredCommands: typeof sentrySdkImplementationCommands;
  readonly requiredEvidence: typeof sentrySdkImplementationDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export function buildSentrySdkImplementationEvidenceDecision(input: SentrySdkImplementationEvidenceInput): SentrySdkImplementationEvidenceDecision {
  const blockers = [
    !input.observabilityTypecheckPassed ? "Observability package typecheck evidence is required." : null,
    !input.observabilityTestsPassed ? "Observability package test evidence is required." : null,
    !input.staticContractsPassed ? "Sentry SDK static contract evidence is required." : null,
    !input.webNextjsPackageInstalled ? "@sentry/nextjs web package installation evidence is required." : null,
    !input.dashboardNextjsPackageInstalled ? "@sentry/nextjs dashboard package installation evidence is required." : null,
    !input.mobileReactNativePackageInstalled ? "@sentry/react-native mobile package installation evidence is required." : null,
    !input.sentrySecretsConfigured ? "Redacted Sentry DSN/auth/org/project secret evidence is required." : null,
    !input.webDashboardSourceMapsUploaded ? "Web/dashboard source-map upload evidence is required." : null,
    !input.expoSourceMapsUploaded ? "Expo source-map upload evidence is required." : null,
    !input.reactNativeDebugSymbolsUploaded ? "React Native debug-symbol upload evidence is required." : null,
    !input.liveWebCaptureVerified ? "Live synthetic web Sentry capture evidence is required." : null,
    !input.liveDashboardCaptureVerified ? "Live synthetic dashboard Sentry capture evidence is required." : null,
    !input.liveMobileCaptureVerified ? "Live synthetic mobile Sentry capture evidence is required." : null,
    !input.providerNoPiiProofCaptured ? "No-PII provider payload proof evidence is required." : null,
    !input.ciEvidenceCaptured ? "CI Sentry SDK implementation gate evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = sentrySdkImplementationArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: sentrySdkImplementationCommands,
    requiredEvidence: sentrySdkImplementationDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-080 Sentry SDK implementation evidence is complete with CI-safe redacted provider artifacts captured."
        : "GAP-080 Sentry SDK implementation evidence remains blocked until packages, secrets, uploads, live captures, no-PII provider proof, and CI artifacts are captured.",
  };
}

export const sentrySdkImplementationMatrix: readonly SentrySdkImplementationMatrixEntry[] = [
  { id: "observability-typecheck", command: "pnpm --filter @inkroute/observability typecheck", artifact: "coverage/sentry-sdk-observability-typecheck.txt", status: "wired" },
  { id: "observability-tests", command: "pnpm --filter @inkroute/observability test", artifact: "coverage/sentry-sdk-observability-test.txt", status: "wired" },
  { id: "static-contracts", command: "pnpm vitest run apps/web/tests/sentry-sdk-runtime-static.test.ts apps/mobile/tests/mobile-crash-static.test.ts", artifact: "coverage/sentry-sdk-static-contract.json", status: "wired" },
  { id: "web-nextjs-package", command: "install @sentry/nextjs for web", artifact: "coverage/sentry-sdk-web-nextjs-package.json", status: "package-gated" },
  { id: "dashboard-nextjs-package", command: "install @sentry/nextjs for dashboard", artifact: "coverage/sentry-sdk-dashboard-nextjs-package.json", status: "package-gated" },
  { id: "mobile-react-native-package", command: "install @sentry/react-native for mobile", artifact: "coverage/sentry-sdk-mobile-react-native-package.json", status: "package-gated" },
  { id: "secret-backed-config", command: "configure Sentry DSN/auth/org/project secrets", artifact: "coverage/sentry-sdk-env-secrets-redacted.json", status: "credential-gated" },
  { id: "web-dashboard-source-maps", command: "upload web/dashboard source maps", artifact: "coverage/sentry-source-map-upload-redacted.json", status: "upload-gated" },
  { id: "expo-source-maps", command: "upload Expo source maps", artifact: "coverage/sentry-expo-source-map-upload-redacted.json", status: "upload-gated" },
  { id: "react-native-debug-symbols", command: "upload React Native debug symbols", artifact: "coverage/sentry-debug-symbol-upload-redacted.json", status: "upload-gated" },
  { id: "live-web-capture", command: "live synthetic web Sentry capture", artifact: "coverage/sentry-live-web-capture-redacted.json", status: "provider-gated" },
  { id: "live-dashboard-capture", command: "live synthetic dashboard Sentry capture", artifact: "coverage/sentry-live-dashboard-capture-redacted.json", status: "provider-gated" },
  { id: "live-mobile-capture", command: "live synthetic mobile Sentry capture", artifact: "coverage/sentry-live-mobile-capture-redacted.json", status: "provider-gated" },
  { id: "provider-no-pii-proof", command: "no-PII provider payload proof", artifact: "coverage/sentry-provider-no-pii-proof-redacted.json", status: "provider-gated" },
  { id: "ci-sentry-sdk-gate", command: "GitHub Actions Sentry SDK implementation gate", artifact: "coverage/sentry-sdk-ci-evidence.json", status: "ci-gated" },
] as const;

export const webSentryRuntimeConfig = buildSentrySdkConfigurationPlan({
  surface: "web-nextjs",
  dsnConfigured: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),
  authTokenConfigured: Boolean(process.env.SENTRY_AUTH_TOKEN),
  orgConfigured: Boolean(process.env.SENTRY_ORG),
  projectConfigured: Boolean(process.env.SENTRY_PROJECT),
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || "phase11-web-local",
  environment: process.env.VERCEL_ENV === "production" ? "production" : process.env.VERCEL_ENV === "preview" ? "preview" : "development",
  sourceMapsEnabled: Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT),
  beforeSendRedactionEnabled: true,
  tenantTaggingEnabled: true,
});

export const webSentryImplementationPlan = buildSentrySdkRuntimeImplementationPlan({
  packageScripts: ["test", "typecheck"],
  observabilityTestsPassed: false,
  observabilityTypecheckPassed: false,
  webSentryPackageInstalled: false,
  dashboardSentryPackageInstalled: false,
  mobileSentryPackageInstalled: false,
  webInstrumentationFilesImplemented: true,
  dashboardInstrumentationFilesImplemented: true,
  mobileInstrumentationFilesImplemented: true,
  sentryDsnConfigured: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || process.env.EXPO_PUBLIC_SENTRY_DSN),
  sentryAuthTokenConfigured: Boolean(process.env.SENTRY_AUTH_TOKEN),
  sentryOrgConfigured: Boolean(process.env.SENTRY_ORG),
  sentryProjectConfigured: Boolean(process.env.SENTRY_PROJECT),
  releaseTagsConfigured: true,
  beforeSendRedactionConfigured: true,
  tenantSafeTagsConfigured: true,
  nextSourceMapUploadConfigured: Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT),
  expoSourceMapUploadConfigured: Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT),
  reactNativeDebugSymbolsConfigured: false,
  ciReleaseArtifactUploadConfigured: false,
  liveWebSyntheticCaptureVerified: false,
  liveDashboardSyntheticCaptureVerified: false,
  liveMobileSyntheticCaptureVerified: false,
  providerIssueEvidenceCaptured: false,
  noPiiProviderPayloadVerified: false,
});

export function sanitizeSentryEvent(event: { message?: string; exception?: { values?: Array<{ value?: string }> }; extra?: Record<string, unknown>; tags?: Record<string, string> }) {
  const message = event.message ? redactSensitiveText(event.message).text : undefined;
  const extra = redactMetadata(event.extra ?? {}).metadata;
  return {
    ...event,
    ...(message ? { message } : {}),
    extra,
    tags: {
      ...(event.tags ?? {}),
      surface: "web-nextjs",
      pii: "redacted-only",
    },
    exception: event.exception
      ? {
          values: event.exception.values?.map((value) => ({ ...value, value: value.value ? redactSensitiveText(value.value).text : value.value })),
        }
      : undefined,
  };
}

export function sentryConfigSummary(plan: SentrySdkConfigurationPlan) {
  return {
    surface: plan.surface,
    status: plan.status,
    requiredPackages: plan.requiredPackages,
    requiredEnv: plan.requiredEnv,
    configFiles: plan.configFiles,
    beforeSendPipeline: plan.beforeSendPipeline,
    releaseTags: plan.releaseTags,
    sampleRate: plan.sampleRate,
    tracesSampleRate: plan.tracesSampleRate,
  };
}


