import {
  buildSentrySdkConfigurationPlan,
  redactMetadata,
  redactSensitiveText,
  type SentrySdkConfigurationPlan,
} from "@inkroute/observability";

export const dashboardSentryRuntimeConfig = buildSentrySdkConfigurationPlan({
  surface: "dashboard-nextjs",
  dsnConfigured: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),
  authTokenConfigured: Boolean(process.env.SENTRY_AUTH_TOKEN),
  orgConfigured: Boolean(process.env.SENTRY_ORG),
  projectConfigured: Boolean(process.env.SENTRY_PROJECT),
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || "phase11-dashboard-local",
  environment: process.env.VERCEL_ENV === "production" ? "production" : process.env.VERCEL_ENV === "preview" ? "preview" : "development",
  sourceMapsEnabled: Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT),
  beforeSendRedactionEnabled: true,
  tenantTaggingEnabled: true,
});

export function sanitizeDashboardSentryEvent(event: { message?: string; extra?: Record<string, unknown>; tags?: Record<string, string> }) {
  return {
    ...event,
    ...(event.message ? { message: redactSensitiveText(event.message).text } : {}),
    extra: redactMetadata(event.extra ?? {}).metadata,
    tags: {
      ...(event.tags ?? {}),
      surface: "dashboard-nextjs",
      pii: "redacted-only",
    },
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
  };
}
