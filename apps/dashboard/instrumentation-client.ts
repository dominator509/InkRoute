import { dashboardSentryRuntimeConfig, sentryConfigSummary } from "./lib/sentryRuntime";

(globalThis as typeof globalThis & { __INKROUTE_DASHBOARD_SENTRY_CLIENT__?: unknown }).__INKROUTE_DASHBOARD_SENTRY_CLIENT__ = {
  summary: sentryConfigSummary(dashboardSentryRuntimeConfig),
  boundary: "dashboard-browser-client-config-ready-for-sentry-init",
};
