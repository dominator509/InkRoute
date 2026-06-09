import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildMobileOtaProductionContract,
  buildMobileOtaProductionEvidenceEnvelope,
  buildMobileOtaAdoptionMonitoringPlan,
  buildMobileOtaReleaseHealthLink,
  mobileOtaProductionArtifactPaths,
  mobileOtaProductionCommands,
} from "../src/lib/mobileOtaProduction";

const root = resolve(__dirname, "../../..");
const workflow = readFileSync(resolve(root, ".github/workflows/ci.yml"), "utf8");
const tracker = readFileSync(resolve(root, "GAP_TRACKER.md"), "utf8");
const appJson = readFileSync(resolve(root, "apps/mobile/app.json"), "utf8");
const easJson = readFileSync(resolve(root, "apps/mobile/eas.json"), "utf8");

describe("mobile OTA production enablement contract", () => {
  it("tracks exact EAS build, update, adoption, and rollback commands", () => {
    expect(mobileOtaProductionCommands).toEqual(
      expect.arrayContaining([
        "eas build --profile preview --platform all",
        "eas build --profile production --platform all",
        "eas update --channel preview",
        "eas update:list --channel preview",
        "rollback republish drill on preview channel",
      ]),
    );
  });

  it("keeps Expo project metadata and update URL deployment-gated", () => {
    expect(appJson).toContain("deployment-gated-see-GAP-047");
    expect(easJson).toContain("preview");
    expect(easJson).toContain("production");
    expect(easJson).not.toContain("EXPO_TOKEN");
  });

  it("builds a redacted production evidence envelope linked to release health", () => {
    const envelope = buildMobileOtaProductionEvidenceEnvelope();
    const link = buildMobileOtaReleaseHealthLink({ releaseId: "release_1", updateId: "update_1", channel: "preview" });

    expect(envelope.releaseHealthLink.linkedToReleaseHealth).toBe(true);
    expect(envelope.productionProof.deviceAdoption).toBe("pending-redacted-device-proof");
    expect(envelope.productionProof.adoptionMonitoring).toMatchObject({
      releaseHealthLinked: true,
      redaction: {
        rawDeviceIdentifiersStored: false,
        expoAccessTokenStored: false,
        artifact: "coverage/mobile-ota-adoption-monitoring.json",
      },
    });
    expect(buildMobileOtaAdoptionMonitoringPlan({ releaseId: "release_1", updateId: "update_1", channel: "preview" }).metrics).toEqual(
      expect.arrayContaining(["preview-update-adoption-count", "preview-update-error-count", "release-health-mobile-ota-status"]),
    );
    expect(link).toMatchObject({ publicPayloadSafe: true, rawDeviceIdentifiersStored: false });
    expect(JSON.stringify(envelope)).not.toContain("EXPO_TOKEN");
  });

  it("keeps live EAS build/update/device/rollback proof blocked until captured", () => {
    const contract = buildMobileOtaProductionContract();

    expect(contract.status).toBe("blocked");
    expect(contract.blockers).toEqual(
      expect.arrayContaining([
        "Real non-secret Expo project ID must be configured.",
        "Preview native build with expo-updates must pass.",
        "A device running the preview binary must receive the preview OTA update.",
        "Rollback republish drill must restore the previous compatible update.",
      ]),
    );
    expect(contract.blockers).not.toContain("Update adoption/error monitoring must be configured.");
    expect(mobileOtaProductionArtifactPaths).toContain("coverage/mobile-ota-rollback-republish-redacted.json");
  });

  it("is wired into CI and GAP-091 tracker evidence", () => {
    expect(workflow).toContain("Run Phase 12 mobile OTA production enablement contracts");
    expect(workflow).toContain("apps/mobile/tests/mobile-ota-production-static.test.ts");
    expect(workflow).toContain("mobile-ota-production-artifacts");
    expect(tracker).toContain("GAP-091");
    expect(tracker).toContain("apps/mobile/src/lib/mobileOtaProduction.ts");
    expect(tracker).toContain("live EAS build/update/device/rollback proof remains open");
  });
});
