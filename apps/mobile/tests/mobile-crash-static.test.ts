import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile crash static contract", () => {
  const crashSource = readWorkspaceFile("apps/mobile/src/lib/mobileCrash.ts");
  const screenSource = readWorkspaceFile("apps/mobile/src/screens/SystemStatusScreen.tsx");

  it("builds sanitized mobile observability drafts before capture or persistence", () => {
    expect(crashSource).toContain("buildObservabilityReportDraft");
    expect(crashSource).toContain('source: "mobile"');
    expect(crashSource).toContain('runtime: "react-native"');
    expect(crashSource).toContain("requestId: context.requestId");
    expect(crashSource).toContain("buildMobileCrashReportDraft");
  });

  it("keeps Sentry Expo configuration gated while enabling fallback capture", () => {
    expect(crashSource).toContain("buildSentrySdkConfigurationPlan");
    expect(crashSource).toContain('surface: "mobile-expo"');
    expect(crashSource).toContain("dsnConfigured: false");
    expect(crashSource).toContain("fallbackReporterConfigured: true");
    expect(crashSource).toContain("beforeSendRedactionConfigured: true");
  });

  it("buffers offline reports and avoids external capture for blocked high-risk payloads", () => {
    expect(crashSource).toContain("bufferOfflineReport(report)");
    expect(crashSource).toContain('report.redactionLevel !== "blocked_high_risk_payload"');
    expect(crashSource).toContain("persistFallbackReport(report)");
  });

  it("uses synthetic sensitive data only as a redaction preview", () => {
    expect(crashSource).toContain("artist@example.test");
    expect(crashSource).toContain("demo-token");
    expect(crashSource).toContain("signed-upload-url-redacted");
    expect(crashSource).not.toContain("SENTRY_AUTH_TOKEN=");
  });

  it("surfaces the crash capture contract in the system status screen", () => {
    expect(screenSource).toContain("mobileCrashCapturePreview");
    expect(screenSource).toContain("Crash capture contract");
    expect(screenSource).toContain("fallback reporter");
    expect(screenSource).toContain("forced crash proof pending");
  });
});
