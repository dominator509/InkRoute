import {
  buildSentrySdkConfigurationPlan,
  buildSentrySdkRuntimeImplementationPlan,
  redactMetadata,
  redactSensitiveText,
} from "@inkroute/observability";

export const mobileSentryRuntimeConfig = buildSentrySdkConfigurationPlan({
  surface: "mobile-expo",
  dsnConfigured: Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN),
  authTokenConfigured: Boolean(process.env.SENTRY_AUTH_TOKEN),
  orgConfigured: Boolean(process.env.SENTRY_ORG),
  projectConfigured: Boolean(process.env.SENTRY_PROJECT),
  release: process.env.EXPO_PUBLIC_RUNTIME_VERSION || "phase11-mobile-local",
  environment: process.env.EXPO_PUBLIC_APP_ENV === "production" ? "production" : process.env.EXPO_PUBLIC_APP_ENV === "preview" ? "preview" : "development",
  sourceMapsEnabled: Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT),
  debugSymbolsEnabled: Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT),
  beforeSendRedactionEnabled: true,
  tenantTaggingEnabled: true,
});

export const mobileSentryImplementationPlan = buildSentrySdkRuntimeImplementationPlan({
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
  reactNativeDebugSymbolsConfigured: Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT),
  ciReleaseArtifactUploadConfigured: false,
  liveWebSyntheticCaptureVerified: false,
  liveDashboardSyntheticCaptureVerified: false,
  liveMobileSyntheticCaptureVerified: false,
  providerIssueEvidenceCaptured: false,
  noPiiProviderPayloadVerified: false,
});

export function sanitizeMobileSentryEvent(event: { message?: string; extra?: Record<string, unknown>; tags?: Record<string, string> }) {
  return {
    ...event,
    ...(event.message ? { message: redactSensitiveText(event.message).text } : {}),
    extra: redactMetadata(event.extra ?? {}).metadata,
    tags: {
      ...(event.tags ?? {}),
      surface: "mobile-expo",
      pii: "redacted-only",
    },
  };
}
