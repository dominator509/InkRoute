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
    expect(updateSource).toContain("buildMobileOtaRollbackContract");
    expect(updateSource).toContain("buildEasOtaReadinessPlan");
    expect(updateSource).toContain("buildExpoEasRuntimeEvidencePlan");
  });

  it("tracks adoption without recording device PII", () => {
    expect(updateSource).toContain("MobileUpdateAdoptionEvent");
    expect(updateSource).toContain("evaluateMobileUpdateRollout");
    expect(updateSource).toContain("MobileUpdateRolloutDecision");
    expect(updateSource).toContain("deviceIdHash");
    expect(updateSource).toContain("rawDeviceIdEchoed: false");
    expect(updateSource).toContain("Preview update id recorded without device PII.");
    expect(updateSource).toContain("redacted adoption counts only");
  });

  it("classifies production promotion and rollback blockers from redacted adoption counts", () => {
    expect(updateSource).toContain('status: "promotable" | "hold" | "rollback_required" | "rollback_blocked"');
    expect(updateSource).toContain("minimumReceipts");
    expect(updateSource).toContain("maxFailureRate");
    expect(updateSource).toContain("Preview OTA failure rate exceeds the release safety threshold.");
    expect(updateSource).toContain("Rollback is required but no previous compatible update id is available.");
  });

  it("creates rollback audit payloads without secrets", () => {
    expect(updateSource).toContain("buildReleaseAuditDraft");
    expect(updateSource).toContain('action: "publish_mobile_update"');
    expect(updateSource).toContain("previousUpdateId");
    expect(updateSource).toContain("rollbackUpdateId");
    expect(updateSource).toContain("rollbackContract");
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
    expect(screenSource).toContain("mobileUpdateRuntimePreview.rollbackContract.status");
    expect(screenSource).toContain("Phase 12 contract");
    expect(screenSource).toContain("OTA runtime contract");
    expect(screenSource).toContain("device receipt pending");
    expect(screenSource).toContain("rollback republish pending");
    expect(screenSource).not.toContain("Phase 12 scaffold");
  });
});
