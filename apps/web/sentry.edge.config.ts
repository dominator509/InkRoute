import { webSentryRuntimeConfig } from "./lib/sentryRuntime";

export const sentryEdgeConfig = {
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  release: webSentryRuntimeConfig.releaseTags.release,
  environment: webSentryRuntimeConfig.releaseTags.environment,
  sampleRate: webSentryRuntimeConfig.sampleRate,
  beforeSendPipeline: webSentryRuntimeConfig.beforeSendPipeline,
};
