import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildMobileOtaProductionContract,
  buildMobileOtaProductionArtifactReview,
  buildMobileOtaProductionEvidenceDecision,
  buildMobileOtaProductionEvidenceEnvelope,
  buildMobileOtaProductionExecutionPlan,
  buildMobileOtaAdoptionMonitoringPlan,
  buildMobileOtaReleaseHealthLink,
  buildRedactedMobileOtaProductionArtifact,
  mobileOtaProductionArtifactPaths,
  mobileOtaProductionCommands,
  mobileOtaProductionDecisionRequiredEvidence,
  mobileOtaProductionExecutionPolicy,
  mobileOtaProductionProofFiles,
  mobileOtaProductionRequiredExternalEvidence,
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
        "eas update --channel preview --message rollback-republish-drill --non-interactive",
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

  it("builds a local execution plan without EAS builds, updates, device proof, or rollback drill execution", () => {
    const plan = buildMobileOtaProductionExecutionPlan();

    expect(plan.id).toBe("gap-091-mobile-ota-production");
    expect(plan.easBuildExecutionAllowed).toBe(false);
    expect(plan.easUpdateExecutionAllowed).toBe(false);
    expect(plan.deviceAdoptionProofAllowed).toBe(false);
    expect(plan.rollbackDrillExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(mobileOtaProductionExecutionPolicy);
    expect(plan.policy).toEqual({
      executeEasBuilds: false,
      executeEasUpdates: false,
      executeDeviceAdoptionProof: false,
      executeRollbackDrill: false,
      executeMobileTypecheck: false,
      executeCi: false,
    });
    expect(plan.requiredCommands).toBe(mobileOtaProductionCommands);
    expect(plan.requiredArtifacts).toBe(mobileOtaProductionArtifactPaths);
    expect(plan.localStaticArtifacts).toEqual(
      expect.arrayContaining(["coverage/mobile-ota-production-enablement.json", "coverage/mobile-ota-adoption-monitoring.json"]),
    );
    expect(plan.easBuildArtifacts).toEqual(["coverage/mobile-ota-preview-native-build.json", "coverage/mobile-ota-production-native-build.json"]);
    expect(plan.updateArtifacts).toEqual(["coverage/mobile-ota-preview-update-id-redacted.json"]);
    expect(plan.deviceArtifacts).toEqual(["coverage/mobile-ota-device-adoption-redacted.json"]);
    expect(plan.rollbackArtifacts).toEqual(["coverage/mobile-ota-rollback-republish-redacted.json"]);
    expect(plan.externalEvidenceRequired).toBe(mobileOtaProductionRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toEqual([
      "real Expo project ID and update URL",
      "preview and production native EAS builds",
      "preview update publish/list with recorded update ID",
      "preview device adoption proof",
      "rollback republish drill proof",
      "mobile typecheck evidence and CI artifact attachment",
    ]);
  });

  it("redacts mobile OTA production artifacts before persistence", () => {
    const rawArtifact = {
      expo: {
        expoToken: "expo-live-update-token",
        projectId: "project_public_id",
      },
      device: {
        deviceId: "ios-device-123",
        email: "tester@example.com",
        phone: "+1 555 010 5555",
      },
      update: {
        updateId: "update_123",
        channel: "preview",
      },
    };

    const redacted = buildRedactedMobileOtaProductionArtifact(rawArtifact);
    const review = buildMobileOtaProductionArtifactReview("mobile-ota-device-adoption", rawArtifact);
    const serialized = JSON.stringify(review.redactedArtifact);

    expect(JSON.stringify(redacted)).not.toContain("expo-live-update-token");
    expect(serialized).not.toContain("ios-device-123");
    expect(serialized).not.toContain("tester@example.com");
    expect(serialized).not.toContain("+1 555 010 5555");
    expect(serialized).toContain("update_123");
    expect(review.safeToPersist).toBe(true);
    expect(review.unsafeFindings).toEqual([]);
    expect(review.requiredArtifactPath).toBe("coverage/mobile-ota-device-adoption-redacted.json");
  });

  it("pins current mobile OTA production proof files for GAP-091", () => {
    expect(mobileOtaProductionProofFiles).toEqual(
      expect.arrayContaining([
      "apps/mobile/package.json",
      "packages/releases/package.json",
        "packages/releases/src/index.ts",
        "packages/releases/tests/feature-flags.test.ts",
        "apps/mobile/app.json",
        "apps/mobile/eas.json",
        "apps/mobile/src/lib/mobileDemo.ts",
        "apps/mobile/src/lib/mobileUpdates.ts",
        "apps/mobile/src/lib/mobileOtaProduction.ts",
        "apps/mobile/src/screens/SystemStatusScreen.tsx",
        "apps/mobile/tests/mobile-static.test.ts",
        "apps/mobile/tests/mobile-updates-static.test.ts",
        "apps/mobile/tests/mobile-ota-production-static.test.ts",
        "RELEASE_AND_AUTO_UPDATE_PLAN.md",
        ".env.example",
        ".github/workflows/ci.yml",
        "testing/manifests/unit-test-manifest.json",
      ]),
    );
    for (const file of mobileOtaProductionProofFiles) {
      expect(readFileSync(resolve(root, file), "utf8").length).toBeGreaterThan(0);
    }
  });

  it("classifies GAP-091 mobile OTA production evidence as blocked until every EAS and device artifact is captured", () => {
    const blocked = buildMobileOtaProductionEvidenceDecision({
      releasesTypecheckPassed: true,
      releasesTestsPassed: true,
      mobileStaticTestsPassed: true,
      mobileTypecheckPassed: false,
      realExpoProjectIdConfigured: false,
      realUpdateUrlConfigured: false,
      previewNativeBuildPassed: false,
      productionNativeBuildPassed: false,
      previewUpdatePublished: false,
      previewUpdateIdRecorded: false,
      deviceAdoptionVerified: false,
      adoptionMonitoringVerified: true,
      rollbackRepublishDrillPassed: false,
      releaseHealthLinked: true,
      ciArtifactsAttached: false,
      capturedArtifacts: ["coverage/mobile-ota-production-enablement.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Real non-secret Expo project ID evidence is required.",
        "Real Expo update URL evidence is required.",
        "Preview native EAS build evidence is required.",
        "Preview device OTA adoption evidence is required.",
        "Rollback republish drill evidence is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/mobile-ota-preview-native-build.json");
    expect(blocked.requiredCommands).toBe(mobileOtaProductionCommands);
    expect(blocked.requiredEvidence).toBe(mobileOtaProductionDecisionRequiredEvidence);

    const complete = buildMobileOtaProductionEvidenceDecision({
      releasesTypecheckPassed: true,
      releasesTestsPassed: true,
      mobileStaticTestsPassed: true,
      mobileTypecheckPassed: true,
      realExpoProjectIdConfigured: true,
      realUpdateUrlConfigured: true,
      previewNativeBuildPassed: true,
      productionNativeBuildPassed: true,
      previewUpdatePublished: true,
      previewUpdateIdRecorded: true,
      deviceAdoptionVerified: true,
      adoptionMonitoringVerified: true,
      rollbackRepublishDrillPassed: true,
      releaseHealthLinked: true,
      ciArtifactsAttached: true,
      capturedArtifacts: mobileOtaProductionArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.requiredEvidence).toBe(mobileOtaProductionDecisionRequiredEvidence);
    expect(complete.redactedSummary).toContain("CI-safe redacted artifacts captured");
  });

  it("is wired into CI and GAP-091 tracker evidence", () => {
    expect(workflow).toContain("Run Phase 12 mobile OTA production enablement contracts");
    expect(workflow).toContain("apps/mobile/tests/mobile-ota-production-static.test.ts");
    expect(workflow).toContain("mobile-ota-production-artifacts");
    expect(tracker).toContain("GAP-091");
    expect(tracker).toContain("apps/mobile/src/lib/mobileOtaProduction.ts");
    expect(tracker).toContain("Mobile OTA production evidence classifier wired and live-proof gated");
    expect(tracker).toContain("live EAS build/update/device/rollback proof");
  });
});
