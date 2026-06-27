import { webSentryRuntimeConfig } from "./lib/sentryRuntime";

export const sentryServerConfig = {
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  release: webSentryRuntimeConfig.releaseTags.release,
  environment: webSentryRuntimeConfig.releaseTags.environment,
  tracesSampleRate: webSentryRuntimeConfig.tracesSampleRate,
  beforeSendPipeline: webSentryRuntimeConfig.beforeSendPipeline,
};
