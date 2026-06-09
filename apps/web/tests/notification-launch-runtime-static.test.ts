import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  notificationLaunchArtifactPaths,
  notificationLaunchRuntimeCommands,
  notificationLaunchRuntimeControls,
  notificationLaunchRuntimeMatrix,
  notificationLaunchRuntimeReadiness,
} from "../lib/notificationLaunchRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("notification launch runtime contract", () => {
  const notificationsPackageJson = readRepoFile("packages/notifications/package.json");
  const notificationsSource = readRepoFile("packages/notifications/src/index.ts");
  const notificationsTests = readRepoFile("packages/notifications/tests/delivery-plan.test.ts");
  const messageReadTest = readRepoFile("apps/dashboard/tests/message-read-route-static.test.ts");
  const templateReadTest = readRepoFile("apps/dashboard/tests/template-read-route-static.test.ts");
  const emailWebhook = readRepoFile("apps/web/app/api/webhooks/email/route.ts");
  const smsWebhook = readRepoFile("apps/web/app/api/webhooks/sms/route.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins notification launch commands, controls, matrix rows, and artifacts", () => {
    expect(notificationLaunchRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "notification provider sandbox tests",
      "notification queue worker integration tests",
      "provider webhook signature/replay tests",
      "message thread/preference suppression integration tests",
      "Expo push device smoke",
      "GitHub Actions notification launch evidence job",
    ]);
    expect(notificationLaunchRuntimeControls).toContain("raw-body-provider-webhook-signature-and-replay-rejection");
    expect(notificationLaunchRuntimeControls).toContain("redacted-destinations-payloads-bodies-private-urls-secrets-in-artifacts");
    expect(notificationLaunchRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "notifications-typecheck",
      "notifications-tests",
      "provider-sandbox-sends",
      "expo-push-device-smoke",
      "queue-worker-retry-dead-letter",
      "delivery-provider-thread-persistence",
      "preference-suppression-quiet-hours",
      "webhook-signature-replay",
      "tenant-isolation-redaction",
      "ci-secret-safe-artifacts",
    ]);
    expect(notificationLaunchArtifactPaths).toContain("coverage/notification-launch-runtime.json");
    expect(notificationLaunchArtifactPaths).toContain("test-results/notification-launch-runtime");
  });

  it("keeps package scripts, launch helper, dashboard reads, and webhook boundaries wired", () => {
    expect(notificationsPackageJson).toContain('"typecheck"');
    expect(notificationsPackageJson).toContain('"test"');
    expect(notificationsSource).toContain("buildNotificationLaunchEvidencePlan");
    expect(notificationsTests).toContain("buildNotificationLaunchEvidencePlan");
    expect(messageReadTest).toContain("body/provider/contact redaction");
    expect(templateReadTest).toContain("notification template read RBAC");
    expect(emailWebhook).toContain("webhook");
    expect(smsWebhook).toContain("webhook");
  });

  it("keeps notification provider blockers explicit until provider evidence exists", () => {
    expect(notificationLaunchRuntimeReadiness.status).toBe("blocked");
    expect(notificationLaunchRuntimeReadiness.missingScripts).toEqual([]);
    expect(notificationLaunchRuntimeReadiness.requiredCommands).toEqual([...notificationLaunchRuntimeCommands]);
    expect(notificationLaunchRuntimeReadiness.requiredControls).toEqual([
      "Resolve consent, preference, suppression, quiet-hours, and rate-limit state immediately before every send.",
      "Persist NotificationDelivery, ProviderEvent, MessageThread, Message, audit, and idempotency records with tenant scope.",
      "Verify provider signatures against raw webhook bodies and reject replayed events before side effects.",
      "Process unsubscribe, STOP/HELP, bounce/complaint, invalid push token, retry, and dead-letter flows before future delivery attempts.",
      "Redact raw destinations, provider payloads, message bodies, private URLs, and secrets from CI artifacts and logs.",
    ]);
    expect(notificationLaunchRuntimeReadiness.requiredEvidence).toContain(
      "Resend, Twilio, and Expo provider sandbox/device send evidence",
    );
    expect(notificationLaunchRuntimeReadiness.blockers).toContain(
      "Resend, Twilio, and Expo provider SDK runtimes must be configured.",
    );
    expect(notificationLaunchRuntimeReadiness.blockers).toContain(
      "Provider webhook signature and replay verification tests must pass.",
    );
  });

  it("wires CI, manifest, tracker, and artifacts without claiming notification launch readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 9 notification launch runtime contracts");
    expect(ciWorkflow).toContain("notification-launch-runtime-static.test.ts");
    expect(ciWorkflow).toContain("notification-launch-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-notification-launch-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/notificationLaunchRuntime.ts");
    expect(gapTracker).toContain("live notification typecheck/tests, provider SDK configuration, sandbox/device sends, queue worker, delivery/provider/message persistence, preference/STOP/quiet-hours suppression, signed webhooks, retry/dead-letter, tenant isolation, privacy/redaction, CI evidence, and secret-safe artifacts remain open");
  });
});
