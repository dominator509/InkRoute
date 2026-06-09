import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  notificationAutomationArtifactPaths,
  notificationAutomationRuntimeCommands,
  notificationAutomationRuntimeMatrix,
  notificationAutomationRuntimeReadiness,
  notificationAutomationRuntimeSuiteIds,
} from "../lib/notificationAutomatedTestsRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("notification automated test runtime contract", () => {
  const notificationsSource = readRepoFile("packages/notifications/src/index.ts");
  const automationSource = readRepoFile("apps/web/lib/notificationAutomatedTests.ts");
  const automationStaticTest = readRepoFile("apps/web/tests/notification-automation-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-069 commands, suite ids, matrix rows, and artifacts", () => {
    expect(notificationAutomationRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm vitest run apps/web/tests/notification-messaging-routes.test.ts",
      "pnpm vitest run apps/web/tests/provider-webhook-routes.test.ts apps/web/tests/provider-webhook-contracts.test.ts",
      "notification queue integration test command",
      "Playwright dashboard templates/messages smoke tests",
      "Expo iOS/Android push device QA",
      "provider sandbox email/SMS/push receipt tests",
      "booking-to-deposit/aftercare/travel notification E2E tests",
    ]);
    expect(notificationAutomationRuntimeSuiteIds).toContain("booking-deposit-aftercare-travel-e2e");
    expect(notificationAutomationRuntimeMatrix.map((entry) => entry.id)).toContain("travel-waitlist-e2e");
    expect(notificationAutomationArtifactPaths).toContain("coverage/notification-automation-runtime.json");
    expect(notificationAutomationArtifactPaths).toContain("test-results/notification-automation-runtime");
  });

  it("keeps package helper, suite matrix, CI artifact paths, and static guard wired", () => {
    expect(notificationsSource).toContain("buildNotificationAutomatedTestReadinessPlan");
    expect(automationSource).toContain("notificationAutomatedTestSuites");
    expect(automationSource).toContain("booking-deposit-aftercare-travel-e2e");
    expect(automationSource).toContain("notificationCiArtifactPaths");
    expect(automationStaticTest).toContain("enumerates every required Phase 9 notification and messaging suite");
  });

  it("keeps queue, provider, Playwright, mobile, persistence, E2E, CI, and artifact blockers explicit", () => {
    expect(notificationAutomationRuntimeReadiness.ready).toBe(false);
    expect(notificationAutomationRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "queue, opt-out, STOP, and retention/export/delete integration test evidence",
      "dashboard/mobile smoke and Expo device QA evidence",
      "email, SMS, and push provider sandbox evidence",
      "booking, deposit, aftercare, and travel notification E2E evidence",
      "CI Phase 9 notification job and published artifact evidence",
    ]));
    expect(notificationAutomationRuntimeReadiness.blockers).toContain("Notification queue integration tests must pass.");
    expect(notificationAutomationRuntimeReadiness.blockers).toContain("Email provider sandbox tests must pass.");
    expect(notificationAutomationRuntimeReadiness.blockers).toContain("Travel waitlist notification E2E flow must pass.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming executed provider/device/E2E proof", () => {
    expect(ciWorkflow).toContain("Run Phase 9 notification automation runtime contracts");
    expect(ciWorkflow).toContain("notification-automation-runtime-static.test.ts");
    expect(ciWorkflow).toContain("notification-automation-runtime-artifacts");
    expect(unitManifest).toContain("unit-notification-automation-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/notificationAutomatedTestsRuntime.ts");
    expect(gapTracker).toContain("GAP-069 is notification-automation-runtime-matrix wired");
    expect(notificationAutomationArtifactPaths).toContain("coverage/notification-automation-secret-safe-artifacts.json");
  });
});
