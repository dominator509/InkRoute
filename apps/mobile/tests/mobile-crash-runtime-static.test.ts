import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  mobileCrashArtifactPaths,
  mobileCrashRuntimeCommands,
  mobileCrashRuntimeMatrix,
  mobileCrashRuntimeReadiness,
} from "../src/lib/mobileCrashRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile crash runtime contract", () => {
  const observabilityPackageJson = readWorkspaceFile("packages/observability/package.json");
  const observabilitySource = readWorkspaceFile("packages/observability/src/index.ts");
  const observabilityTests = readWorkspaceFile("packages/observability/tests/redaction-report.test.ts");
  const crashSource = readWorkspaceFile("apps/mobile/src/lib/mobileCrash.ts");
  const crashStaticTest = readWorkspaceFile("apps/mobile/tests/mobile-crash-static.test.ts");
  const systemStatusScreen = readWorkspaceFile("apps/mobile/src/screens/SystemStatusScreen.tsx");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-046 commands, matrix rows, and artifacts", () => {
    expect(mobileCrashRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/observability typecheck",
      "pnpm --filter @inkroute/observability test",
      "pnpm --filter @inkroute/mobile typecheck",
      "Expo simulator forced crash smoke test",
      "Expo physical-device forced crash smoke test",
      "Sentry source-map/debug-symbol resolution check",
    ]);
    expect(mobileCrashRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "observability-typecheck",
      "observability-tests",
      "mobile-typecheck",
      "sentry-expo-credentials",
      "fallback-reporter",
      "release-eas-tags",
      "before-send-redaction",
      "source-map-upload",
      "debug-symbol-upload",
      "simulator-forced-crash",
      "device-forced-crash",
      "error-report-persistence",
      "dashboard-triage-sync",
      "offline-buffering",
      "no-pii-provider-payload",
      "ci-secret-safe-evidence",
    ]);
    expect(mobileCrashArtifactPaths).toContain("coverage/mobile-crash-runtime.json");
    expect(mobileCrashArtifactPaths).toContain("test-results/mobile-crash-runtime");
  });

  it("keeps package helper, sanitized fallback capture, and System screen contract wired", () => {
    expect(observabilityPackageJson).toContain('"typecheck"');
    expect(observabilityPackageJson).toContain('"test"');
    expect(observabilitySource).toContain("buildMobileCrashRuntimeReadinessPlan");
    expect(observabilitySource).toContain("buildSentrySdkConfigurationPlan");
    expect(observabilityTests).toContain("buildMobileCrashRuntimeReadinessPlan");
    expect(crashSource).toContain("buildMobileCrashReportDraft");
    expect(crashSource).toContain("MobileCrashReporterAdapter");
    expect(crashSource).toContain("bufferOfflineReport(report)");
    expect(crashSource).toContain("persistFallbackReport(report)");
    expect(crashStaticTest).toContain("persistFallbackReport(report)");
    expect(systemStatusScreen).toContain("Crash capture contract");
    expect(systemStatusScreen).toContain("forced crash proof pending");
  });

  it("keeps provider, symbolication, device, persistence, and privacy blockers explicit", () => {
    expect(mobileCrashRuntimeReadiness.status).toBe("blocked");
    expect(mobileCrashRuntimeReadiness.missingScripts).toEqual([]);
    expect(mobileCrashRuntimeReadiness.requiredCommands).toEqual([...mobileCrashRuntimeCommands]);
    expect(mobileCrashRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "Expo source-map and React Native debug-symbol upload evidence",
      "forced simulator and device crash capture evidence",
      "sanitized ErrorReport persistence and dashboard triage evidence",
      "mobile crash privacy redaction and offline buffering evidence",
    ]));
    expect(mobileCrashRuntimeReadiness.blockers).toContain("Mobile Sentry DSN must be configured in environment/secret settings.");
    expect(mobileCrashRuntimeReadiness.blockers).toContain("Expo JavaScript source maps must upload for mobile releases.");
    expect(mobileCrashRuntimeReadiness.blockers).toContain("Provider payloads and dashboard summaries must be proven free of raw PII, medical, payment, token, and private URL values.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider/device readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 11 mobile crash runtime contracts");
    expect(ciWorkflow).toContain("mobile-crash-runtime-static.test.ts");
    expect(ciWorkflow).toContain("mobile-crash-runtime-artifacts");
    expect(unitManifest).toContain("unit-mobile-crash-runtime-static");
    expect(gapTracker).toContain("apps/mobile/src/lib/mobileCrashRuntime.ts");
    expect(gapTracker).toContain("GAP-046 is mobile-crash-runtime-matrix wired");
    expect(mobileCrashArtifactPaths).toContain("coverage/mobile-crash-secret-safe-artifacts.json");
  });
});
