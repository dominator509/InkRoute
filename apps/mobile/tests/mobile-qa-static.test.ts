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
  const mobileDemoSource = readWorkspaceFile("apps/mobile/src/lib/mobileDemo.ts");
  const bookingScreen = readWorkspaceFile("apps/mobile/src/screens/BookingRequestsScreen.tsx");
  const travelUpdateScreen = readWorkspaceFile("apps/mobile/src/screens/TravelUpdateScreen.tsx");
  const portfolioUploadScreen = readWorkspaceFile("apps/mobile/src/screens/PortfolioUploadScreen.tsx");
  const renderContractTest = readWorkspaceFile("apps/mobile/tests/mobile-render-contract.test.ts");

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
    expect(qaSource).toContain("Booking API sync and lifecycle action contract render smoke.");
    expect(qaSource).toContain("Push registration/delivery/tap contract render smoke.");
    expect(qaSource).toContain("Offline queue/reconnect contract render smoke.");
    expect(qaSource).toContain("Crash and OTA contract render smoke.");
  });

  it("surfaces mobile booking lifecycle actions as a local contract, not disabled actions", () => {
    expect(mobileDemoSource).toContain("buildMobileBookingLifecycleActionContract");
    expect(mobileDemoSource).toContain("mobileBookingLifecycleActionContract");
    expect(bookingScreen).toContain("lifecycle contract ready");
    expect(bookingScreen).toContain("provider execution gated");
    expect(bookingScreen).toContain("state events, calendar checks, notification handoff, audit logs");
    expect(bookingScreen).not.toContain("Actions disabled");
  });

  it("surfaces mobile portfolio upload as a provider-gated contract, not an absent implementation", () => {
    expect(portfolioUploadScreen).toContain("metadata and upload-intent contract are wired");
    expect(portfolioUploadScreen).toContain("Mobile upload contract flow");
    expect(portfolioUploadScreen).toContain("object keys");
    expect(portfolioUploadScreen).toContain("signed provider storage remains runtime-gated");
    expect(portfolioUploadScreen).toContain("Object key contract");
    expect(mobileDemoSource).toContain("buildMobileUploadIntentContract");
    expect(mobileDemoSource).toContain("mobilePortfolioUploadContract.objectKey");
    expect(mobileDemoSource).toContain("Metadata and upload-intent contracts are wired");
    expect(portfolioUploadScreen).not.toContain("Static mobile upload flow");
    expect(mobileDemoSource).not.toContain("signed uploads are not wired");
    expect(portfolioUploadScreen).not.toContain("Storage remains scaffolded only");
  });

  it("surfaces mobile travel publishing as a local contract, not a disabled implementation", () => {
    expect(mobileDemoSource).toContain("buildMobileTravelPublishContract");
    expect(mobileDemoSource).toContain("mobileTravelPublishContract");
    expect(travelUpdateScreen).toContain("Travel publish contract");
    expect(travelUpdateScreen).toContain("local contract ready");
    expect(travelUpdateScreen).toContain("provider execution gated");
    expect(travelUpdateScreen).toContain("request-id and idempotency headers");
    expect(travelUpdateScreen).not.toContain("Publishing disabled");
  });

  it("enforces secret-safe mobile QA artifacts", () => {
    expect(qaSource).toContain("MobileQaArtifactBundle");
    expect(qaSource).toContain("buildMobileQaArtifactBundles");
    expect(qaSource).toContain("coverage/mobile-qa-artifacts/${checklistId}.redacted.json");
    expect(qaSource).toContain('"provider-receipt"');
    expect(qaSource).toContain('"redaction-review-required"');
    expect(qaSource).toContain("free of secrets, PII, medical details, payment data, and raw push tokens");
    expect(qaSource).toContain("Keep apps/mobile/tests/mobile-render-contract.test.ts aligned with every registered screen");
    expect(qaSource).toContain("Retain each checklist bundle");
    expect(qaSource).toContain("Do not mark mobile runtime QA ready");
  });

  it("pins dependency-light executable screen element smoke coverage before simulator/device QA", () => {
    expect(renderContractTest).toContain("createElement");
    expect(renderContractTest).toContain("mobileScreenRenderContracts");
    expect(renderContractTest).toContain("without simulator or device services");
    for (const screen of mobileScreenRegistry) {
      expect(renderContractTest).toContain(`screenId: "${screen.id}"`);
    }
  });

  it("keeps App.tsx switch coverage aligned with the screen registry", () => {
    for (const screen of mobileScreenRegistry) {
      expect(appSource).toContain(`case "${screen.id}"`);
    }
  });
});
