import {
  buildSentrySdkConfigurationPlan,
  buildSentrySdkRuntimeImplementationPlan,
  redactMetadata,
  redactSensitiveText,
  type SentrySdkConfigurationPlan,
} from "@inkroute/observability";

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
