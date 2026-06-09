import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mobileScreenRegistry } from "@inkroute/mobile-support";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile QA execution static contract", () => {
  const qaSource = readWorkspaceFile("apps/mobile/src/lib/mobileQa.ts");
  const appSource = readWorkspaceFile("apps/mobile/App.tsx");

  it("maps every registered screen to an app render contract", () => {
    for (const screen of mobileScreenRegistry) {
      expect(qaSource).toContain(`screenId: "${screen.id}"`);
    }
  });

  it("requires simulator, physical-device, accessibility, and artifact evidence", () => {
    expect(qaSource).toContain("iosSimulatorSmokePassed: false");
    expect(qaSource).toContain("androidEmulatorSmokePassed: false");
    expect(qaSource).toContain("physicalDeviceSmokePassed: false");
    expect(qaSource).toContain("accessibilityChecksPassed: false");
    expect(qaSource).toContain("qaArtifactsAttached: false");
  });

  it("links new mobile runtime contracts into QA evidence slots", () => {
    expect(qaSource).toContain("Push registration/delivery/tap contract render smoke.");
    expect(qaSource).toContain("Offline queue/reconnect contract render smoke.");
    expect(qaSource).toContain("Crash and OTA contract render smoke.");
  });

  it("enforces secret-safe mobile QA artifacts", () => {
    expect(qaSource).toContain("free of secrets, PII, medical details, payment data, and raw push tokens");
    expect(qaSource).toContain("Do not mark mobile runtime QA ready");
  });

  it("keeps App.tsx switch coverage aligned with the screen registry", () => {
    for (const screen of mobileScreenRegistry) {
      expect(appSource).toContain(`case "${screen.id}"`);
    }
  });
});
