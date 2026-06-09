import { dashboardSentryRuntimeConfig } from "./lib/sentryRuntime";

export const sentryServerConfig = {
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  release: dashboardSentryRuntimeConfig.releaseTags.release,
  environment: dashboardSentryRuntimeConfig.releaseTags.environment,
  tracesSampleRate: dashboardSentryRuntimeConfig.tracesSampleRate,
  beforeSendPipeline: dashboardSentryRuntimeConfig.beforeSendPipeline,
};
