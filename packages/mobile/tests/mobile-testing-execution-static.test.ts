import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildMobileTestingRunPersistenceContract,
  mobileTestingExecutionArtifactPaths,
  mobileTestingExecutionChecklistIds,
  mobileTestingExecutionCommands,
  mobileTestingExecutionMatrix,
  mobileTestingExecutionReadiness,
  mobileTestingRunPersistencePreview
} from "../src/mobile-testing-execution";

const root = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const mobilePackage = read("apps/mobile/package.json");
const mobileSupportPackage = read("packages/mobile/package.json");
const qaChecklist = read("testing/manifests/mobile-device-qa-checklist.json");
const manifestVerifier = read("testing/scripts/verify-test-manifest.mjs");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");

describe("GAP-108 mobile testing execution wiring", () => {
  it("pins mobile execution commands, checklist ids, matrix entries, and artifact paths", () => {
    expect(mobileTestingExecutionCommands).toEqual([
      "pnpm --filter @inkroute/mobile-support typecheck",
      "pnpm --filter @inkroute/mobile-support test",
      "pnpm --filter @inkroute/mobile typecheck",
      "pnpm --filter @inkroute/mobile test",
      "pnpm --filter @inkroute/mobile ios",
      "pnpm --filter @inkroute/mobile android",
      "eas build --profile preview --platform all",
      "eas update --channel preview",
      "manual physical-device QA for auth/api/offline/push/crash/OTA/accessibility",
      "GitHub Actions mobile testing execution job"
    ]);
    expect(mobileTestingExecutionChecklistIds).toEqual([
      "mobile-static-screen-registry",
      "ios-screen-smoke",
      "android-screen-smoke",
      "biometric-lock-unlock",
      "tenant-api-sync",
      "offline-reconnect-sync",
      "push-token-delivery",
      "mobile-crash-capture",
      "ota-preview-rollback",
      "mobile-accessibility-pass"
    ]);
    expect(mobileTestingExecutionMatrix.map((entry) => entry.id)).toEqual([
      "support-package-static",
      "mobile-app-static",
      "expo-runtime",
      "ios-simulator-smoke",
      "android-emulator-smoke",
      "physical-device-checklist",
      "provider-device-qa",
      "eas-preview-update-rollback",
      "ci-mobile-artifacts"
    ]);
    expect(mobileTestingExecutionArtifactPaths).toContain("coverage/mobile-eas-update-rollback-redacted.json");
    expect(mobileTestingExecutionArtifactPaths).toContain("test-results/mobile-testing-execution");
  });

  it("keeps package scripts and manifest verifier wired for mobile support and app tests", () => {
    for (const script of ["typecheck", "test"]) {
      expect(mobileSupportPackage).toContain(`"${script}"`);
    }
    for (const script of ["typecheck", "test", "ios", "android"]) {
      expect(mobilePackage).toContain(`"${script}"`);
    }
    expect(manifestVerifier).toContain("testing/manifests/mobile-device-qa-checklist.json");
    expect(manifestVerifier).toContain("apps/mobile/tests/mobile-static.test.ts");
    expect(manifestVerifier).toContain("apps/mobile/tests/mobile-security-static.test.ts");
    expect(manifestVerifier).toContain("packages/mobile/tests/mobile-support.test.ts");
  });

  it("keeps the generated mobile device QA checklist aligned to GAP-108 execution requirements", () => {
    for (const checklistId of mobileTestingExecutionChecklistIds) {
      expect(qaChecklist).toContain(checklistId);
    }
    expect(qaChecklist).toContain("GAP-108");
    expect(qaChecklist).toContain("pnpm --filter @inkroute/mobile ios");
    expect(qaChecklist).toContain("pnpm --filter @inkroute/mobile android");
    expect(qaChecklist).toContain("manual airplane-mode queue/reconnect QA");
    expect(qaChecklist).toContain("eas update --channel preview and rollback republish");
  });

  it("keeps execution readiness blocked until real Expo, device, provider, OTA, artifact, and CI evidence exists", () => {
    expect(mobileTestingExecutionReadiness.status).toBe("blocked");
    expect(mobileTestingExecutionReadiness.missingScripts).toEqual([]);
    expect(mobileTestingExecutionReadiness.requiredCommands).toEqual(
      expect.arrayContaining([
        "pnpm --filter @inkroute/mobile-support typecheck",
        "pnpm --filter @inkroute/mobile-support test",
        "pnpm --filter @inkroute/mobile typecheck",
        "pnpm --filter @inkroute/mobile test",
        "pnpm --filter @inkroute/mobile ios",
        "pnpm --filter @inkroute/mobile android",
        "eas build --profile preview --platform all",
        "eas update --channel preview"
      ])
    );
    expect(mobileTestingExecutionReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "Expo dependency install, runtime start, mobile typecheck, and static/security test output",
        "iOS simulator, Android emulator, and physical device screen-smoke evidence",
        "biometric, tenant API sync, offline reconnect, and push QA transcripts",
        "crash capture, EAS preview/update rollback, and accessibility QA evidence",
        "synced mobile QA checklist, retained artifacts, and CI/mobile check evidence"
      ])
    );
    expect(mobileTestingExecutionReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Expo dependencies must install before mobile runtime testing.",
        "Expo runtime must start for simulator and device QA.",
        "Offline reconnect QA must prove encrypted queue persistence, idempotent replay, retry, and conflict handling.",
        "EAS update rollback QA must prove preview adoption and rollback republish on the same runtime."
      ])
    );
  });

  it("pins durable MobileTestingRun rows, checklist ids, device/provider QA flags, EAS rollback, artifacts, and CI evidence", () => {
    const schema = read("packages/db/prisma/schema.prisma");
    const contract = buildMobileTestingRunPersistenceContract({
      tenantId: "tenant_demo",
      runId: "mobile-testing-demo",
      commitSha: "abc1234",
      status: "device_gated",
      executionMatrix: mobileTestingExecutionMatrix,
      checklistIds: mobileTestingExecutionChecklistIds,
      artifactManifest: mobileTestingExecutionArtifactPaths,
      mobileSupportTypecheckPassed: false,
      mobileSupportTestsPassed: false,
      mobileAppTypecheckPassed: false,
      mobileStaticTestsPassed: false,
      expoDependenciesInstalled: false,
      expoRuntimeStarted: false,
      iosSimulatorSmokePassed: false,
      androidEmulatorSmokePassed: false,
      physicalDeviceChecklistCompleted: false,
      biometricQaPassed: false,
      tenantApiSyncQaPassed: false,
      offlineReconnectQaPassed: false,
      pushDeliveryQaPassed: false,
      crashCaptureQaPassed: false,
      easPreviewBuildPassed: false,
      easUpdateRollbackPassed: false,
      accessibilityQaPassed: false,
      ciMobileChecksPassed: false,
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/redacted"
    });

    expect(schema).toContain("model MobileTestingRun");
    expect(schema).toContain("executionMatrix");
    expect(schema).toContain("easUpdateRollbackPassed");
    expect(schema).toContain("@@unique([tenantId, runId])");
    expect(contract.transactionWrites).toEqual(["MobileTestingRun", "AuditLog"]);
    expect(contract.requiredMobileFlags).toContain("offlineReconnectQaPassed");
    expect(contract.artifactFields).toContain("checklistIds");
    expect(contract.tenantIsolationKey).toBe("tenantId");
    expect(mobileTestingRunPersistencePreview.modelName).toBe("MobileTestingRun");
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 14 mobile testing execution contracts");
    expect(ciWorkflow).toContain("packages/mobile/tests/mobile-testing-execution-static.test.ts");
    expect(ciWorkflow).toContain("mobile-testing-execution-artifacts");
    expect(ciWorkflow).toContain("coverage/mobile-testing-execution.json");
    expect(ciWorkflow).toContain("test-results/mobile-testing-execution");
    expect(unitManifest).toContain("unit-mobile-testing-execution-static");
    expect(unitManifest).toContain("MobileTestingRun Prisma model and app row contract are wired");
    expect(gapTracker).toContain("packages/mobile/src/mobile-testing-execution.ts");
    expect(gapTracker).toContain("live Expo/device testing proof remains open");
  });
});
