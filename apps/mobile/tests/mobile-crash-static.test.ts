import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile crash static contract", () => {
  const crashSource = readWorkspaceFile("apps/mobile/src/lib/mobileCrash.ts");
  const demoSource = readWorkspaceFile("apps/mobile/src/lib/mobileDemo.ts");
  const mobilePackageSource = readWorkspaceFile("packages/mobile/src/index.ts");
  const screenSource = readWorkspaceFile("apps/mobile/src/screens/SystemStatusScreen.tsx");

  it("builds sanitized mobile observability drafts before capture or persistence", () => {
    expect(crashSource).toContain("buildObservabilityReportDraft");
    expect(crashSource).toContain('source: "mobile"');
    expect(crashSource).toContain('runtime: "react-native"');
    expect(crashSource).toContain("requestId: context.requestId");
    expect(crashSource).toContain("buildMobileCrashReportDraft");
    expect(crashSource).toContain("buildMobileCrashCaptureContract");
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

  it("persists fallback crash reports even when external provider capture fails", () => {
    expect(crashSource).toContain("externalCaptureSucceeded");
    expect(crashSource).toContain("externalCaptureErrorRedacted");
    expect(crashSource).toContain("redactMobileCrashCaptureError");
    expect(crashSource).toContain("provider response, payload, and credentials redacted");
    expect(crashSource).toContain("await input.adapter.persistFallbackReport(report)");
  });

  it("uses synthetic sensitive data only as a redaction preview", () => {
    expect(crashSource).toContain("artist@example.test");
    expect(crashSource).toContain("demo-token");
    expect(crashSource).toContain("signed-upload-url-redacted");
    expect(crashSource).not.toContain("SENTRY_AUTH_TOKEN=");
  });

  it("surfaces the crash capture contract in the system status screen", () => {
    expect(screenSource).toContain("mobileCrashCapturePreview");
    expect(screenSource).toContain("mobileCrashCapturePreview.contract.localFallbackReady");
    expect(screenSource).toContain("Crash capture contract");
    expect(screenSource).toContain("Phase 11 contract");
    expect(screenSource).toContain("fallback reporter");
    expect(screenSource).toContain("forced crash proof pending");
    expect(screenSource).not.toContain("Phase 11 scaffold");
  });

  it("keeps mobile crash copy aligned with fallback wiring and provider gates", () => {
    expect(demoSource).toContain("Mobile fallback crash capture is wired; live Sentry Expo capture remains credential-gated");
    expect(mobilePackageSource).toContain("MobileCrashCaptureContract");
    expect(mobilePackageSource).toContain("package-backed sanitized fallback/offline-buffer crash reporter contract is wired");
    expect(mobilePackageSource).toContain("Sentry credentials, Expo runtime capture, and simulator/device proof remain gated");
    expect(demoSource).not.toContain("Expo mobile crash capture is scaffolded but not connected to Sentry");
    expect(mobilePackageSource).not.toContain("Sentry or fallback crash capture is documented but not wired into Expo runtime");
  });
});
