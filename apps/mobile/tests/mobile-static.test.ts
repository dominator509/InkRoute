import { describe, expect, it } from "vitest";
import { mobileScreenRegistry, phase6MobileBoundaries } from "@inkroute/mobile-support";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile app contract registry", () => {
  it("registers core artist workflow screens", () => {
    const ids = mobileScreenRegistry.map((screen) => screen.id);

    expect(ids).toEqual(expect.arrayContaining(["auth", "home", "bookings", "appointments", "clients", "travel", "portfolio", "notifications", "offline", "system"]));
  });

  it("keeps mobile integrations explicitly gated", () => {
    expect(phase6MobileBoundaries.some((boundary) => boundary.status === "credential-gated" || boundary.status === "deployment-gated" || boundary.status === "externally-dependent")).toBe(true);
    expect(phase6MobileBoundaries.find((boundary) => boundary.id === "mobile-api")?.status).toBe("local-contract");
    expect(phase6MobileBoundaries.find((boundary) => boundary.id === "mobile-offline-store")?.status).toBe("local-contract");
    expect(phase6MobileBoundaries.find((boundary) => boundary.id === "mobile-api")?.detail).toContain(
      "typed tenant API client and screen sync contract are wired",
    );
    expect(phase6MobileBoundaries.find((boundary) => boundary.id === "mobile-api")?.detail).not.toContain(
      "It does not call dashboard/mobile APIs or persist mutations to Postgres",
    );
    expect(mobileScreenRegistry.find((screen) => screen.id === "travel")?.phase6Status).toBe("local-contract-boundary");
    expect(mobileScreenRegistry.find((screen) => screen.id === "travel")?.summary).toContain("package-backed travel publish contract");
    expect(mobileScreenRegistry.find((screen) => screen.id === "portfolio")?.summary).toContain("upload-intent contract");
    expect(mobileScreenRegistry.find((screen) => screen.id === "offline")?.summary).toContain("shared repository");
    expect(mobileScreenRegistry.find((screen) => screen.id === "offline")?.summary).not.toContain("no durable local store wired yet");
    expect(phase6MobileBoundaries.find((boundary) => boundary.id === "mobile-push")?.detail).toContain(
      "Expo push registration, opt-out, receipt suppression, tap-routing, and audit contracts are wired locally",
    );
    expect(phase6MobileBoundaries.find((boundary) => boundary.id === "mobile-push")?.detail).not.toContain(
      "Expo push token registration, notification permissions, provider delivery logs, and opt-out compliance are not wired",
    );
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
    expect(mobileScreenRegistry.find((screen) => screen.id === "ota-updates")?.detail).toContain(
      "EAS channel and runtimeVersion placeholders are wired",
    );
    expect(phase6MobileBoundaries.find((boundary) => boundary.id === "mobile-updates")?.detail).toContain(
      "EAS channels and runtimeVersion policy are wired with deployment-gated project/update placeholders",
    );
    expect(phase6MobileBoundaries.find((boundary) => boundary.id === "mobile-updates")?.detail).not.toContain(
      "No Expo project ID, channels, runtimeVersion policy, or rollback checks are configured for production",
    );
    expect(mobileScreenRegistry.find((screen) => screen.id === "ota-updates")?.detail).not.toContain(
      "EAS Update project/channel/runtimeVersion policy is not connected",
    );
  });

  it("keeps crash registry copy aligned with fallback capture wiring", () => {
    expect(mobileScreenRegistry.find((screen) => screen.id === "crash-capture")?.detail).toContain(
      "Sanitized fallback crash capture contract is wired",
    );
    expect(mobileScreenRegistry.find((screen) => screen.id === "crash-capture")?.detail).not.toContain(
      "Sentry/mobile fallback capture is documented only",
    );
  });

  it("keeps push registry copy aligned with local push contracts", () => {
    expect(mobileScreenRegistry.find((screen) => screen.id === "push-token")?.detail).toContain(
      "Expo push registration and token persistence contracts are wired",
    );
    expect(mobileScreenRegistry.find((screen) => screen.id === "push-token")?.detail).not.toContain(
      "No Expo push project, notification permission flow, or token persistence exists",
    );
  });

  it("keeps app shell and metadata on contract wording instead of scaffold wording", () => {
    const appSource = readWorkspaceFile("apps/mobile/App.tsx");
    const appJson = readWorkspaceFile("apps/mobile/app.json");

    expect(appSource).toContain("Expo Phase 6 mobile contract for artist mobility");
    expect(appSource).not.toContain("Expo Phase 6 scaffold for artist mobility");
    expect(appJson).toContain("local-contract; requires Expo/EAS project configuration");
    expect(appJson).toContain("artist mobile app contract");
    expect(appJson).not.toContain("artist mobile app scaffold");
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
