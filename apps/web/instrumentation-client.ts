import { sentryConfigSummary, webSentryRuntimeConfig } from "./lib/sentryRuntime";

(globalThis as typeof globalThis & { __INKROUTE_WEB_SENTRY_CLIENT__?: unknown }).__INKROUTE_WEB_SENTRY_CLIENT__ = {
  summary: sentryConfigSummary(webSentryRuntimeConfig),
  boundary: "browser-client-config-ready-for-sentry-init",
};
