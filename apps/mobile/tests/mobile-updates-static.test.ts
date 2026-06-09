import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile OTA update static contract", () => {
  const updateSource = readWorkspaceFile("apps/mobile/src/lib/mobileUpdates.ts");
  const screenSource = readWorkspaceFile("apps/mobile/src/screens/SystemStatusScreen.tsx");

  it("uses release package EAS and OTA readiness primitives", () => {
    expect(updateSource).toContain("buildMobileUpdatePlan");
    expect(updateSource).toContain("buildEasOtaReadinessPlan");
    expect(updateSource).toContain("buildExpoEasRuntimeEvidencePlan");
  });

  it("tracks adoption without recording device PII", () => {
    expect(updateSource).toContain("MobileUpdateAdoptionEvent");
    expect(updateSource).toContain('deviceId: "device-redacted"');
    expect(updateSource).toContain("Preview update id recorded without device PII.");
  });

  it("creates rollback audit payloads without secrets", () => {
    expect(updateSource).toContain("buildReleaseAuditDraft");
    expect(updateSource).toContain('action: "publish_mobile_update"');
    expect(updateSource).toContain("previousUpdateId");
    expect(updateSource).not.toContain("EXPO_TOKEN=");
  });

  it("keeps real EAS proof gated instead of claiming readiness", () => {
    expect(updateSource).toContain("credentialsConfigured: false");
    expect(updateSource).toContain("previewNativeBuildPassed: false");
    expect(updateSource).toContain("deviceReceivedPreviewUpdate: false");
    expect(updateSource).toContain("releaseHealthMonitoringConfigured: false");
  });

  it("surfaces the OTA runtime contract in the system status screen", () => {
    expect(screenSource).toContain("mobileUpdateRuntimePreview");
    expect(screenSource).toContain("OTA runtime contract");
    expect(screenSource).toContain("device receipt pending");
    expect(screenSource).toContain("rollback republish pending");
  });
});
