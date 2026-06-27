import { sentryConfigSummary, webSentryRuntimeConfig } from "./lib/sentryRuntime";

export async function register() {
  const runtime = process.env.NEXT_RUNTIME ?? "nodejs";
  const summary = sentryConfigSummary(webSentryRuntimeConfig);
  (globalThis as typeof globalThis & { __INKROUTE_WEB_SENTRY__?: unknown }).__INKROUTE_WEB_SENTRY__ = {
    runtime,
    summary,
    provider: "sentry",
    boundary: "credential-gated-sdk-instrumentation",
  };
}
