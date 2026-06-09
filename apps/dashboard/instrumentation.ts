import { dashboardSentryRuntimeConfig, sentryConfigSummary } from "./lib/sentryRuntime";

export async function register() {
  const runtime = process.env.NEXT_RUNTIME ?? "nodejs";
  (globalThis as typeof globalThis & { __INKROUTE_DASHBOARD_SENTRY__?: unknown }).__INKROUTE_DASHBOARD_SENTRY__ = {
    runtime,
    summary: sentryConfigSummary(dashboardSentryRuntimeConfig),
    provider: "sentry",
    boundary: "credential-gated-dashboard-sdk-instrumentation",
  };
}
