import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  mobileLaunchArtifactPaths,
  mobileLaunchReadinessAreas,
  mobileLaunchRunPersistenceContract,
  mobileLaunchRuntimeCommands,
  mobileLaunchRuntimeMatrix,
  mobileLaunchRuntimeReadiness,
} from "../lib/mobileLaunchRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("mobile launch runtime contract", () => {
  const mobilePackageJson = readRepoFile("apps/mobile/package.json");
  const appJson = readRepoFile("apps/mobile/app.json");
  const easJson = readRepoFile("apps/mobile/eas.json");
  const mobileSource = readRepoFile("packages/mobile/src/index.ts");
  const mobileTests = readRepoFile("packages/mobile/tests/mobile-support.test.ts");
  const qaChecklist = readRepoFile("testing/manifests/mobile-device-qa-checklist.json");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const mobileLaunchMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609033200_add_mobile_launch_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins mobile launch commands, readiness areas, matrix rows, and artifacts", () => {
    expect(mobileLaunchRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/mobile-support typecheck",
      "pnpm --filter @inkroute/mobile-support test",
      "pnpm --filter @inkroute/mobile typecheck",
      "pnpm --filter @inkroute/mobile test",
      "pnpm --filter @inkroute/mobile ios",
      "pnpm --filter @inkroute/mobile android",
      "eas build --profile preview --platform all",
      "eas update --channel preview",
      "manual physical-device QA for auth/api/offline/push/upload/crash/OTA/accessibility",
      "GitHub Actions mobile launch evidence job",
    ]);
    expect(mobileLaunchReadinessAreas).toContain("encrypted-offline-store-qa");
    expect(mobileLaunchReadinessAreas).toContain("secret-safe-artifacts");
    expect(mobileLaunchRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "mobile-support-typecheck",
      "mobile-support-tests",
      "mobile-app-typecheck",
      "mobile-app-tests",
      "expo-runtime",
      "ios-android-smoke",
      "eas-preview-build-update",
      "auth-api-push-offline-qa",
      "upload-crash-ota-qa",
      "physical-device-accessibility-qa",
      "ci-secret-safe-artifacts",
    ]);
    expect(mobileLaunchArtifactPaths).toContain("coverage/mobile-launch-runtime.json");
    expect(mobileLaunchArtifactPaths).toContain("test-results/mobile-launch-runtime");
  });

  it("pins the MobileLaunchRun persistence model and migration", () => {
    expect(mobileLaunchRunPersistenceContract.model).toBe("MobileLaunchRun");
    expect(mobileLaunchRunPersistenceContract.tenantRelation).toBe("mobileLaunchRuns");
    expect(mobileLaunchRunPersistenceContract.migration).toBe("20260609033200_add_mobile_launch_runs");
    expect(mobileLaunchRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "readinessAreaManifest",
      "artifactManifest",
      "deviceQaManifest",
      "providerQaManifest",
      "easRuntimeManifest",
    ]);
    expect(mobileLaunchRunPersistenceContract.evidenceBooleans).toContain("expoRuntimeStarted");
    expect(mobileLaunchRunPersistenceContract.evidenceBooleans).toContain("physicalDeviceQaCompleted");
    expect(mobileLaunchRunPersistenceContract.evidenceBooleans).toContain("launchArtifactsSecretSafe");
    expect(mobileLaunchRunPersistenceContract.artifactFields).toContain("easPreviewBuildArtifactPath");
    expect(mobileLaunchRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("mobileLaunchRuns MobileLaunchRun[]");
    expect(prismaSchema).toContain("model MobileLaunchRun");
    expect(prismaSchema).toContain("deviceQaManifest");
    expect(prismaSchema).toContain("encryptedOfflineStoreQaPassed");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(mobileLaunchMigration).toContain('CREATE TABLE "MobileLaunchRun"');
    expect(mobileLaunchMigration).toContain('"deviceQaManifest" JSONB NOT NULL');
    expect(mobileLaunchMigration).toContain('"launchArtifactsSecretSafe" BOOLEAN NOT NULL DEFAULT false');
    expect(mobileLaunchMigration).toContain('CREATE UNIQUE INDEX "MobileLaunchRun_tenantId_runId_key"');
  });

  it("keeps mobile package scripts, Expo config, EAS config, helper tests, and QA checklist wired", () => {
    expect(mobilePackageJson).toContain('"typecheck"');
    expect(mobilePackageJson).toContain('"test"');
    expect(mobilePackageJson).toContain('"ios"');
    expect(mobilePackageJson).toContain('"android"');
    expect(appJson).toContain("expo");
    expect(easJson).toContain("preview");
    expect(mobileSource).toContain("buildMobileLaunchEvidencePlan");
    expect(mobileTests).toContain("buildMobileLaunchEvidencePlan");
    expect(qaChecklist).toContain("physical");
  });

  it("keeps mobile launch blockers explicit until Expo/device/provider evidence exists", () => {
    expect(mobileLaunchRuntimeReadiness.status).toBe("blocked");
    expect(mobileLaunchRuntimeReadiness.missingScripts).toEqual([]);
    expect(mobileLaunchRuntimeReadiness.requiredCommands).toEqual([...mobileLaunchRuntimeCommands]);
    expect(mobileLaunchRuntimeReadiness.requiredEvidence).toContain(
      "Expo runtime, iOS simulator, Android emulator, and EAS preview build evidence",
    );
    expect(mobileLaunchRuntimeReadiness.requiredEvidence).toContain(
      "upload, crash, OTA rollback, physical device, and accessibility QA evidence",
    );
    expect(mobileLaunchRuntimeReadiness.blockers).toContain("Expo runtime must start locally or from a preview build.");
    expect(mobileLaunchRuntimeReadiness.blockers).toContain("Physical device QA checklist must be completed.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming mobile launch readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 6 mobile launch runtime contracts");
    expect(ciWorkflow).toContain("mobile-launch-runtime-static.test.ts");
    expect(ciWorkflow).toContain("mobile-launch-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-mobile-launch-runtime-static");
    expect(unitManifest).toContain("MobileLaunchRun Prisma model and app row contract");
    expect(gapTracker).toContain("MobileLaunchRun");
    expect(gapTracker).toContain("apps/web/lib/mobileLaunchRuntime.ts");
    expect(gapTracker).toContain("live mobile-support/app typecheck/tests, Expo runtime, iOS/Android smoke, EAS preview/update, auth/API/push/offline/upload/crash/OTA/accessibility QA, physical-device QA, CI evidence, and secret-safe artifacts remain open");
  });
});
