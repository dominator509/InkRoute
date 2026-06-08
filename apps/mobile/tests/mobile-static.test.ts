import { describe, expect, it } from "vitest";
import { mobileScreenRegistry, phase6MobileBoundaries } from "@inkroute/mobile-support";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile app scaffold registry", () => {
  it("registers core artist workflow screens", () => {
    const ids = mobileScreenRegistry.map((screen) => screen.id);

    expect(ids).toEqual(expect.arrayContaining(["auth", "home", "bookings", "appointments", "clients", "travel", "portfolio", "notifications", "offline", "system"]));
  });

  it("keeps mobile integrations explicitly gated", () => {
    expect(phase6MobileBoundaries.some((boundary) => boundary.status === "credential-gated" || boundary.status === "deployment-gated" || boundary.status === "externally-dependent")).toBe(true);
  });

  it("keeps Expo/EAS OTA configuration explicit and deployment gated", () => {
    const appConfig = JSON.parse(readWorkspaceFile("apps/mobile/app.json")) as {
      expo: {
        runtimeVersion: { policy: string };
        updates: { url: string };
        extra: { eas: { projectId: string } };
      };
    };
    const easConfig = JSON.parse(readWorkspaceFile("apps/mobile/eas.json")) as {
      build: Record<string, { channel: string; distribution?: string }>;
    };

    expect(appConfig.expo.runtimeVersion.policy).toBe("appVersion");
    expect(appConfig.expo.updates.url).toContain("deployment-gated");
    expect(appConfig.expo.extra.eas.projectId).toContain("deployment-gated");
    expect(easConfig.build.preview).toMatchObject({ channel: "preview", distribution: "internal" });
    expect(easConfig.build.production).toMatchObject({ channel: "production" });
  });

  it("surfaces EAS OTA readiness gates in the mobile system status screen", () => {
    const demo = readWorkspaceFile("apps/mobile/src/lib/mobileDemo.ts");
    const screen = readWorkspaceFile("apps/mobile/src/screens/SystemStatusScreen.tsx");

    expect(demo).toContain("demoEasOtaReadinessPlan");
    expect(demo).toContain("mobileEasOtaReadinessPlan");
    expect(screen).toContain("EAS OTA readiness");
    expect(screen).toContain("mobileEasOtaReadinessPlan.productionReady");
    expect(screen).toContain("rollbackRequirement");
  });
});
