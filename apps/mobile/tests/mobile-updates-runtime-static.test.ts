import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  mobileUpdatesArtifactPaths,
  mobileUpdatesRuntimeCommands,
  mobileUpdatesRuntimeEvidence,
  mobileUpdatesRuntimeMatrix,
} from "../src/lib/mobileUpdatesRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile OTA updates runtime contract", () => {
  const releasesPackageJson = readWorkspaceFile("packages/releases/package.json");
  const releasesSource = readWorkspaceFile("packages/releases/src/index.ts");
  const updateSource = readWorkspaceFile("apps/mobile/src/lib/mobileUpdates.ts");
  const updatesStaticTest = readWorkspaceFile("apps/mobile/tests/mobile-updates-static.test.ts");
  const systemStatusScreen = readWorkspaceFile("apps/mobile/src/screens/SystemStatusScreen.tsx");
  const easJson = readWorkspaceFile("apps/mobile/eas.json");
  const appJson = readWorkspaceFile("apps/mobile/app.json");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-047 commands, matrix rows, and artifacts", () => {
    expect(mobileUpdatesRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/releases typecheck",
      "pnpm --filter @inkroute/releases test",
      "pnpm --filter @inkroute/mobile typecheck",
      "eas build --profile preview --platform all",
      "eas update --channel preview",
      "eas update:list --channel preview",
      "rollback republish drill on preview channel",
    ]);
    expect(mobileUpdatesRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "releases-typecheck",
      "releases-tests",
      "mobile-typecheck",
      "app-config-project",
      "eas-json-channels",
      "eas-credentials",
      "preview-native-build",
      "production-native-build",
      "preview-ota-publish",
      "device-receipt",
      "rollback-republish",
      "compatibility-check",
      "adoption-monitoring",
      "release-health-monitoring",
      "ci-secret-safe-evidence",
    ]);
    expect(mobileUpdatesArtifactPaths).toContain("coverage/mobile-updates-runtime.json");
    expect(mobileUpdatesArtifactPaths).toContain("test-results/mobile-updates-runtime");
  });

  it("keeps release helpers, app governance contract, and System screen surfacing wired", () => {
    expect(releasesPackageJson).toContain('"typecheck"');
    expect(releasesPackageJson).toContain('"test"');
    expect(releasesSource).toContain("buildMobileUpdatePlan");
    expect(releasesSource).toContain("buildEasOtaReadinessPlan");
    expect(releasesSource).toContain("buildExpoEasRuntimeEvidencePlan");
    expect(updateSource).toContain("buildMobileUpdateRuntimeContract");
    expect(updateSource).toContain("MobileUpdateAdoptionEvent");
    expect(updateSource).toContain("device-redacted");
    expect(updateSource).toContain("buildReleaseAuditDraft");
    expect(updatesStaticTest).toContain("rollback audit payloads without secrets");
    expect(systemStatusScreen).toContain("OTA runtime contract");
    expect(systemStatusScreen).toContain("rollback republish pending");
    expect(easJson).toContain("preview");
    expect(appJson).toContain("runtimeVersion");
  });

  it("keeps EAS project, credential, build, OTA, rollback, and monitoring blockers explicit", () => {
    expect(mobileUpdatesRuntimeEvidence.status).toBe("blocked");
    expect(mobileUpdatesRuntimeEvidence.missingScripts).toEqual([]);
    expect(mobileUpdatesRuntimeEvidence.requiredCommands).toEqual([...mobileUpdatesRuntimeCommands]);
    expect(mobileUpdatesRuntimeEvidence.requiredEvidence).toEqual(expect.arrayContaining([
      "apps/mobile app config contains the real non-secret EAS project id, update URL, runtimeVersion policy, and preview/production channel mapping.",
      "EAS credentials are configured outside source control and preview/prod native builds are linked to release evidence.",
      "Preview OTA update id is recorded and a device running the preview binary receives the update.",
      "Rollback republish drill confirms the previous compatible update can be restored on the preview channel.",
      "Update adoption, error, and release-health monitoring are wired before production OTA.",
    ]));
    expect(mobileUpdatesRuntimeEvidence.blockers).toContain("Run eas build --profile preview --platform all.");
    expect(mobileUpdatesRuntimeEvidence.blockers).toContain("Run eas update --channel preview and attach the update id.");
    expect(mobileUpdatesRuntimeEvidence.blockers).toContain("Republish the previous compatible update to preview and verify device receipt.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider/device readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 6 mobile OTA updates runtime contracts");
    expect(ciWorkflow).toContain("mobile-updates-runtime-static.test.ts");
    expect(ciWorkflow).toContain("mobile-updates-runtime-artifacts");
    expect(unitManifest).toContain("unit-mobile-updates-runtime-static");
    expect(gapTracker).toContain("apps/mobile/src/lib/mobileUpdatesRuntime.ts");
    expect(gapTracker).toContain("GAP-047 is mobile-updates-runtime-matrix wired");
    expect(mobileUpdatesArtifactPaths).toContain("coverage/mobile-updates-secret-safe-artifacts.json");
  });
});
