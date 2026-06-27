import { readFileSync } from "node:fs";
import { notificationAutomatedTestReadinessRequiredEvidence } from "@inkroute/notifications";
import { describe, expect, it } from "vitest";

import {
  buildNotificationAutomatedTestExecutionPlan,
  buildNotificationAutomationArtifactReview,
  notificationAutomatedTestContract,
  notificationAutomatedTestRequiredArtifacts,
  notificationAutomatedTestSuites,
  notificationCiArtifactPaths,
} from "../lib/notificationAutomatedTests";

const ciWorkflow = readFileSync(".github/workflows/ci.yml", "utf8");

describe("GAP-069 notification automation contract", () => {
  it("enumerates every required Phase 9 notification and messaging suite", () => {
    expect(notificationAutomatedTestSuites.map((suite) => suite.id)).toEqual([
      "notification-package-unit",
      "notification-package-typecheck",
      "public-notification-routes",
      "provider-webhook-routes",
      "notification-queue-integration",
      "dashboard-template-smoke",
      "dashboard-message-smoke",
      "mobile-notification-smoke",
      "expo-push-device-qa",
      "provider-sandbox-email",
      "provider-sandbox-sms",
      "provider-sandbox-push-receipt",
      "preference-opt-out-persistence",
      "sms-stop-persistence",
      "retention-export-delete",
      "booking-deposit-aftercare-travel-e2e",
    ]);
  });

  it("keeps provider/device artifacts redacted and publishable by CI", () => {
    expect(notificationAutomatedTestSuites.every((suite) => suite.secretPolicy === "redacted-only")).toBe(true);
    expect(notificationCiArtifactPaths).toContain("coverage/provider-sandbox-*-redacted.json");
    expect(notificationCiArtifactPaths).toContain("coverage/expo-push-device-qa-redacted.json");
    expect(notificationCiArtifactPaths).toContain("test-results/notifications");
    expect(notificationCiArtifactPaths).toContain("test-results/messaging");
  });

  it("builds a local execution plan with commands, artifacts, and external suite boundaries", () => {
    const plan = buildNotificationAutomatedTestExecutionPlan();

    expect(plan.suites).toHaveLength(notificationAutomatedTestSuites.length);
    expect(plan.requiredArtifacts).toBe(notificationAutomatedTestRequiredArtifacts);
    expect(plan.requiredArtifacts).toContain("coverage/notification-package-unit.json");
    expect(plan.requiredArtifacts).toContain("coverage/playwright-notification-e2e-results.json");
    expect(plan.blockedExternalSuites).toEqual(expect.arrayContaining([
      "notification-queue-integration",
      "provider-sandbox-email",
      "expo-push-device-qa",
      "booking-deposit-aftercare-travel-e2e",
    ]));
    expect(plan.suites.find((suite) => suite.id === "notification-package-unit")).toMatchObject({
      requiresProviderOrDevice: false,
    });
    expect(plan.suites.find((suite) => suite.id === "provider-sandbox-sms")).toMatchObject({
      requiresProviderOrDevice: true,
    });
  });

  it("reviews retained automation artifacts with recursive provider token and PII redaction", () => {
    const review = buildNotificationAutomationArtifactReview({
      expectedArtifactPaths: ["coverage/provider-sandbox-email-redacted.json"],
      artifacts: [
        {
          path: "coverage/provider-sandbox-email-redacted.json",
          providerPayload: {
            authorization: "Bearer provider-token",
            to: "ari@example.test",
            phone: "+1 206 555 0142",
            receipt: "twilio-message-receipt",
          },
          nested: [{ expoPushToken: "expo_push_token_secret" }],
        },
      ],
    });

    expect(review.status).toBe("passed");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("provider-token");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("ari@example.test");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("206 555 0142");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("expo_push_token_secret");
    expect(review.blockers).toEqual([]);
  });

  it("reports real execution blockers instead of claiming unrun evidence", () => {
    expect(notificationAutomatedTestContract.ready).toBe(false);
    expect(notificationAutomatedTestContract.requiredSuites).toEqual(
      expect.arrayContaining([
        "notification queue integration tests",
        "provider sandbox email tests",
        "provider sandbox SMS tests",
        "provider sandbox push receipt tests",
        "retention/export/delete integration tests",
      ]),
    );
    expect(notificationAutomatedTestContract.requiredEvidence).toBe(notificationAutomatedTestReadinessRequiredEvidence);
  });

  it("wires the Phase 9 notification lifecycle into CI", () => {
    expect(ciWorkflow).toContain("Run Phase 9 notification and messaging lifecycle contracts");
    expect(ciWorkflow).toContain("apps/web/tests/notification-automation-static.test.ts");
    expect(ciWorkflow).toContain("apps/web/tests/provider-webhook-contracts.test.ts");
    expect(ciWorkflow).toContain("apps/dashboard/tests/messaging-privacy-static.test.ts");
    expect(ciWorkflow).toContain("Upload notification messaging lifecycle artifacts");
    expect(ciWorkflow).toContain("notification-messaging-lifecycle-artifacts");
  });
});
