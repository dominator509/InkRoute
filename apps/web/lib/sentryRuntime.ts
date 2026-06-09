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
  "install @sentry/nextjs and @sentry/react-native",
  "configure Sentry DSN/auth/org/project secrets",
  "upload web/dashboard source maps and Expo source maps",
  "upload React Native debug symbols",
  "live synthetic Sentry captures with no-PII provider payload proof",
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

export const sentrySdkImplementationMatrix: readonly SentrySdkImplementationMatrixEntry[] = [
  { id: "observability-typecheck", command: "pnpm --filter @inkroute/observability typecheck", artifact: "coverage/sentry-sdk-observability-typecheck.txt", status: "wired" },
  { id: "observability-tests", command: "pnpm --filter @inkroute/observability test", artifact: "coverage/sentry-sdk-observability-test.txt", status: "wired" },
  { id: "static-contracts", command: "Sentry SDK static contract suite", artifact: "coverage/sentry-sdk-static-contract.json", status: "wired" },
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
