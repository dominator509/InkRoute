import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildMobileUpdatesArtifactReview,
  buildMobileUpdatesEvidenceDecision,
  buildMobileUpdatesExecutionPlan,
  buildRedactedMobileUpdatesArtifact,
  mobileUpdatesArtifactPaths,
  mobileUpdatesEvidenceFlags,
  mobileUpdatesExecutionPolicy,
  mobileUpdatesExternalCommands,
  mobileUpdatesLocalCommands,
  mobileUpdatesRequiredExternalEvidence,
  mobileUpdatesRuntimeProofFiles,
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
      "eas update --channel preview --message rollback-republish-drill --non-interactive",
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
    expect(updateSource).toContain("MobileUpdateRolloutDecision");
    expect(updateSource).toContain("evaluateMobileUpdateRollout");
    expect(updateSource).toContain("rollback_blocked");
    expect(updateSource).toContain("device-redacted");
    expect(updateSource).toContain("buildReleaseAuditDraft");
    expect(updatesStaticTest).toContain("redacted adoption counts only");
    expect(updatesStaticTest).toContain("rollback audit payloads without secrets");
    expect(systemStatusScreen).toContain("OTA runtime contract");
    expect(systemStatusScreen).toContain("rollback republish pending");
    expect(easJson).toContain("preview");
    expect(appJson).toContain("runtimeVersion");
  });

  it("keeps EAS project, credential, build, OTA, rollback, and monitoring blockers explicit", () => {
    expect(mobileUpdatesRuntimeEvidence.status).toBe("blocked");
    expect(mobileUpdatesRuntimeEvidence.missingScripts).toEqual([]);
    expect(mobileUpdatesRuntimeEvidence.requiredCommands).toBe(mobileUpdatesRuntimeCommands);
    expect(mobileUpdatesRuntimeEvidence.requiredEvidence).toBe(mobileUpdatesEvidenceFlags);
    expect(mobileUpdatesRuntimeEvidence.requiredEvidence).toEqual(mobileUpdatesEvidenceFlags);
    expect(mobileUpdatesRuntimeEvidence.blockers).toContain("Run eas build --profile preview --platform all.");
    expect(mobileUpdatesRuntimeEvidence.blockers).toContain("Run eas update --channel preview and attach the update id.");
    expect(mobileUpdatesRuntimeEvidence.blockers).toContain("Republish the previous compatible update to preview and verify device receipt.");
  });

  it("classifies GAP-047 as blocked until Expo/EAS OTA evidence is complete", () => {
    const decision = buildMobileUpdatesEvidenceDecision({
      commands: ["pnpm --filter @inkroute/releases typecheck"],
      artifacts: ["coverage/mobile-updates-runtime.json"],
      evidence: { releasesTypecheckPassed: true },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("eas update --channel preview --message rollback-republish-drill --non-interactive");
    expect(decision.missingArtifacts).toContain("coverage/mobile-updates-secret-safe-artifacts.json");
    expect(decision.missingEvidence).toContain("secretSafeArtifactsCaptured");
    expect(decision.blockers).toContain("Pinned mobile OTA commands must be run and captured.");
  });

  it("classifies GAP-047 as complete when all Expo/EAS commands, artifacts, and evidence are present", () => {
    const decision = buildMobileUpdatesEvidenceDecision({
      commands: mobileUpdatesRuntimeCommands,
      artifacts: mobileUpdatesArtifactPaths,
      evidence: Object.fromEntries(mobileUpdatesEvidenceFlags.map((flag) => [flag, true])),
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("keeps GAP-047 execution policy non-executing and external evidence explicit", () => {
    const plan = buildMobileUpdatesExecutionPlan();

    expect(plan.policy).toBe(mobileUpdatesExecutionPolicy);
    expect(plan.localCommands).toBe(mobileUpdatesLocalCommands);
    expect(plan.externalCommands).toBe(mobileUpdatesExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(mobileUpdatesRequiredExternalEvidence);
    expect(plan.policy.codexMayClassifyStaticMobileUpdatesReadiness).toBe(true);
    expect(plan.policy.easProjectRequiredForClosure).toBe(true);
    expect(plan.policy.easCredentialsRequiredForClosure).toBe(true);
    expect(plan.policy.nativeBuildRequiredForClosure).toBe(true);
    expect(plan.policy.otaPublishRequiredForClosure).toBe(true);
    expect(plan.policy.rollbackRepublishRequiredForClosure).toBe(true);
    expect(plan.policy.monitoringRequiredForClosure).toBe(true);
    expect(plan.policy.secretSafeArtifactsRequiredForClosure).toBe(true);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.easProjectExecutionAllowed).toBe(false);
    expect(plan.credentialExecutionAllowed).toBe(false);
    expect(plan.nativeBuildExecutionAllowed).toBe(false);
    expect(plan.otaPublishExecutionAllowed).toBe(false);
    expect(plan.rollbackExecutionAllowed).toBe(false);
    expect(plan.monitoringExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.localCommands).toContain("pnpm --filter @inkroute/releases typecheck");
    expect(plan.externalCommands).toContain("eas update --channel preview --message rollback-republish-drill --non-interactive");
    expect(plan.requiredExternalEvidence).toBe(mobileUpdatesRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("secret-safe mobile OTA artifact review");
  });

  it("redacts GAP-047 mobile OTA artifacts before secret-safe review", () => {
    const artifact = {
      easProjectId: "project_private",
      expoAccessToken: "expo_private",
      updateUrl: "https://u.expo.dev/private",
      deviceReceiptId: "receipt_private",
      nested: {
        rollbackUpdateId: "rollback_private",
        publicSummary: "mobile OTA evidence captured",
      },
      safeNote:
        "evidence_mobile_ota_01HZYXZYXZYXZYXZYXZYXZYXZ wrote artifacts/mobile-ota/private-proof.json",
      safeUpdatePath: "test-results/mobile-updates-runtime/private-rollback.json",
      safeEasRun: "eas_run_01HZYXZYXZYXZYXZYXZYXZYXZ",
    };

    const redacted = buildRedactedMobileUpdatesArtifact(artifact);
    expect(redacted.redactedPaths).toEqual([
      "easProjectId",
      "expoAccessToken",
      "updateUrl",
      "deviceReceiptId",
      "nested.rollbackUpdateId",
      "safeNote",
      "safeUpdatePath",
      "safeEasRun",
    ]);
    expect(redacted.redactedArtifact).toMatchObject({
      easProjectId: "[REDACTED]",
      expoAccessToken: "[REDACTED]",
      updateUrl: "[REDACTED]",
      deviceReceiptId: "[REDACTED]",
      nested: {
        rollbackUpdateId: "[REDACTED]",
        publicSummary: "mobile OTA evidence captured",
      },
      safeUpdatePath: "[REDACTED]",
      safeEasRun: "[REDACTED]",
    });
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "evidence_mobile_ota_01HZYXZYXZYXZYXZYXZYXZYXZ",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "artifacts/mobile-ota/private-proof.json",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "test-results/mobile-updates-runtime/private-rollback.json",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "eas_run_01HZYXZYXZYXZYXZYXZYXZYXZ",
    );

    const review = buildMobileUpdatesArtifactReview({
      publicSummary: "safe mobile OTA evidence",
      releaseHealthToken: "release_private",
    });
    expect(review.secretSafe).toBe(true);
    expect(review.redactedPaths).toEqual(["releaseHealthToken"]);
    expect(review.requiredExternalEvidence).toBe(mobileUpdatesRequiredExternalEvidence);
    expect(review.requiredExternalEvidence).toContain("rollback republish proof");
  });

  it("pins current mobile OTA proof files for GAP-047", () => {
    expect(mobileUpdatesRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/mobile/package.json",
      "packages/releases/package.json",
      "packages/releases/src/index.ts",
      "packages/releases/tests/feature-flags.test.ts",
      "apps/mobile/src/lib/mobileUpdates.ts",
      "apps/mobile/src/lib/mobileUpdatesRuntime.ts",
      "apps/mobile/src/screens/SystemStatusScreen.tsx",
      "apps/mobile/tests/mobile-updates-static.test.ts",
      "apps/mobile/tests/mobile-updates-runtime-static.test.ts",
      "apps/mobile/eas.json",
      "apps/mobile/app.json",
      "testing/manifests/unit-test-manifest.json",
      ".github/workflows/ci.yml",
    ]));
    for (const file of mobileUpdatesRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider/device readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 6 mobile OTA updates runtime contracts");
    expect(ciWorkflow).toContain("mobile-updates-runtime-static.test.ts");
    expect(ciWorkflow).toContain("mobile-updates-runtime-artifacts");
    expect(unitManifest).toContain("unit-mobile-updates-runtime-static");
    expect(gapTracker).toContain("apps/mobile/src/lib/mobileUpdatesRuntime.ts");
    expect(gapTracker).toContain("GAP-047 is mobile-updates-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildMobileUpdatesExecutionPlan");
    expect(gapTracker).toContain("mobileUpdatesExecutionPolicy");
    expect(gapTracker).toContain("mobileUpdatesLocalCommands/mobileUpdatesExternalCommands");
    expect(gapTracker).toContain("mobileUpdatesRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedMobileUpdatesArtifact");
    expect(gapTracker).toContain("buildMobileUpdatesArtifactReview");
    expect(mobileUpdatesArtifactPaths).toContain("coverage/mobile-updates-secret-safe-artifacts.json");
  });
});

