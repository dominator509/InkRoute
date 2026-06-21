import {
  buildNotificationAutomatedTestReadinessPlan,
  type NotificationAutomatedTestReadinessPlan,
} from "@inkroute/notifications";

export type NotificationAutomatedTestSuiteId =
  | "notification-package-unit"
  | "notification-package-typecheck"
  | "public-notification-routes"
  | "provider-webhook-routes"
  | "notification-queue-integration"
  | "dashboard-template-smoke"
  | "dashboard-message-smoke"
  | "mobile-notification-smoke"
  | "expo-push-device-qa"
  | "provider-sandbox-email"
  | "provider-sandbox-sms"
  | "provider-sandbox-push-receipt"
  | "preference-opt-out-persistence"
  | "sms-stop-persistence"
  | "retention-export-delete"
  | "booking-deposit-aftercare-travel-e2e";

export type NotificationAutomatedTestSuite = {
  id: NotificationAutomatedTestSuiteId;
  command: string;
  artifacts: string[];
  secretPolicy: "redacted-only";
};

export type NotificationAutomatedTestExecutionPlan = {
  suites: readonly {
    id: NotificationAutomatedTestSuiteId;
    command: string;
    artifacts: readonly string[];
    requiresProviderOrDevice: boolean;
  }[];
  requiredArtifacts: readonly string[];
  blockedExternalSuites: readonly NotificationAutomatedTestSuiteId[];
};

export type NotificationArtifactReview = {
  status: "passed" | "blocked";
  redactedArtifacts: readonly unknown[];
  blockers: readonly string[];
};

export const notificationAutomatedTestSuites: NotificationAutomatedTestSuite[] = [
  {
    id: "notification-package-unit",
    command: "pnpm --filter @inkroute/notifications test",
    artifacts: ["coverage/notification-package-unit.json"],
    secretPolicy: "redacted-only",
  },
  {
    id: "notification-package-typecheck",
    command: "pnpm --filter @inkroute/notifications typecheck",
    artifacts: ["coverage/notification-package-typecheck.json"],
    secretPolicy: "redacted-only",
  },
  {
    id: "public-notification-routes",
    command: "pnpm vitest run apps/web/tests/notification-messaging-routes.test.ts",
    artifacts: ["coverage/notification-public-routes.json"],
    secretPolicy: "redacted-only",
  },
  {
    id: "provider-webhook-routes",
    command: "pnpm vitest run apps/web/tests/provider-webhook-routes.test.ts apps/web/tests/provider-webhook-contracts.test.ts",
    artifacts: ["coverage/notification-provider-webhook-routes.json"],
    secretPolicy: "redacted-only",
  },
  {
    id: "notification-queue-integration",
    command: "pnpm vitest run apps/web/tests/notification-queue-integration.test.ts",
    artifacts: ["coverage/notification-queue-integration.json", "test-results/notifications"],
    secretPolicy: "redacted-only",
  },
  {
    id: "dashboard-template-smoke",
    command: "pnpm playwright test apps/dashboard/tests/template-smoke.spec.ts",
    artifacts: ["coverage/dashboard-template-smoke.json", "test-results/messaging"],
    secretPolicy: "redacted-only",
  },
  {
    id: "dashboard-message-smoke",
    command: "pnpm playwright test apps/dashboard/tests/message-smoke.spec.ts",
    artifacts: ["coverage/dashboard-message-smoke.json", "test-results/messaging"],
    secretPolicy: "redacted-only",
  },
  {
    id: "mobile-notification-smoke",
    command: "pnpm --filter @inkroute/mobile test -- notifications",
    artifacts: ["coverage/mobile-notification-smoke.json"],
    secretPolicy: "redacted-only",
  },
  {
    id: "expo-push-device-qa",
    command: "pnpm --filter @inkroute/mobile expo:push-device-qa",
    artifacts: ["coverage/expo-push-device-qa-redacted.json"],
    secretPolicy: "redacted-only",
  },
  {
    id: "provider-sandbox-email",
    command: "pnpm vitest run apps/web/tests/provider-sandbox-email.test.ts",
    artifacts: ["coverage/provider-sandbox-email-redacted.json"],
    secretPolicy: "redacted-only",
  },
  {
    id: "provider-sandbox-sms",
    command: "pnpm vitest run apps/web/tests/provider-sandbox-sms.test.ts",
    artifacts: ["coverage/provider-sandbox-sms-redacted.json"],
    secretPolicy: "redacted-only",
  },
  {
    id: "provider-sandbox-push-receipt",
    command: "pnpm vitest run apps/web/tests/provider-sandbox-push-receipt.test.ts",
    artifacts: ["coverage/provider-sandbox-push-redacted.json"],
    secretPolicy: "redacted-only",
  },
  {
    id: "preference-opt-out-persistence",
    command: "pnpm vitest run apps/web/tests/preference-opt-out-persistence.test.ts",
    artifacts: ["coverage/preference-opt-out-persistence.json"],
    secretPolicy: "redacted-only",
  },
  {
    id: "sms-stop-persistence",
    command: "pnpm vitest run apps/web/tests/sms-stop-persistence.test.ts",
    artifacts: ["coverage/sms-stop-persistence.json"],
    secretPolicy: "redacted-only",
  },
  {
    id: "retention-export-delete",
    command: "pnpm vitest run apps/web/tests/retention-export-delete.test.ts",
    artifacts: ["coverage/retention-export-delete.json"],
    secretPolicy: "redacted-only",
  },
  {
    id: "booking-deposit-aftercare-travel-e2e",
    command: "pnpm playwright test apps/web/tests/notification-lifecycle.spec.ts",
    artifacts: ["coverage/playwright-notification-e2e-results.json", "test-results/notifications"],
    secretPolicy: "redacted-only",
  },
];

export const notificationCiArtifactPaths = [
  "coverage/notification-*.json",
  "coverage/provider-sandbox-*-redacted.json",
  "coverage/preference-opt-out-persistence.json",
  "coverage/sms-stop-persistence.json",
  "coverage/retention-export-delete.json",
  "coverage/dashboard-*-smoke.json",
  "coverage/mobile-notification-smoke.json",
  "coverage/expo-push-device-qa-redacted.json",
  "coverage/playwright-notification-e2e-results.json",
  "test-results/notifications",
  "test-results/messaging",
] as const;

export const notificationAutomatedTestRequiredArtifacts = notificationAutomatedTestSuites.flatMap(
  (suite) => suite.artifacts,
);

const externalSuiteIds = new Set<NotificationAutomatedTestSuiteId>([
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

const sensitiveArtifactKeyPattern = /(token|secret|password|authorization|cookie|provider|payload|email|phone|expo|twilio|resend|receipt|device|push|sms)/i;
const sensitiveArtifactValuePatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
  /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi,
  /\b(?:expo|twilio|resend|push|sms|receipt|device)[\w:./?=&-]*/gi,
];

export function buildRedactedNotificationAutomationArtifact(input: unknown): unknown {
  if (Array.isArray(input)) return input.map((value) => buildRedactedNotificationAutomationArtifact(value));
  if (!input || typeof input !== "object") {
    if (typeof input !== "string") return input;
    return sensitiveArtifactValuePatterns.reduce((value, pattern) => value.replace(pattern, "[redacted]"), input);
  }

  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).map(([key, value]) => [
      key,
      sensitiveArtifactKeyPattern.test(key) ? "[redacted]" : buildRedactedNotificationAutomationArtifact(value),
    ]),
  );
}

export function buildNotificationAutomatedTestExecutionPlan(
  suites: readonly NotificationAutomatedTestSuite[] = notificationAutomatedTestSuites,
): NotificationAutomatedTestExecutionPlan {
  return {
    suites: suites.map((suite) => ({
      id: suite.id,
      command: suite.command,
      artifacts: suite.artifacts,
      requiresProviderOrDevice: externalSuiteIds.has(suite.id),
    })),
    requiredArtifacts:
      suites === notificationAutomatedTestSuites
        ? notificationAutomatedTestRequiredArtifacts
        : suites.flatMap((suite) => suite.artifacts),
    blockedExternalSuites: suites.filter((suite) => externalSuiteIds.has(suite.id)).map((suite) => suite.id),
  };
}

export function buildNotificationAutomationArtifactReview(input: {
  artifacts: readonly unknown[];
  expectedArtifactPaths?: readonly string[];
}): NotificationArtifactReview {
  const redactedArtifacts = input.artifacts.map((artifact) => buildRedactedNotificationAutomationArtifact(artifact));
  const serialized = JSON.stringify(redactedArtifacts);
  const blockers = [
    ...(input.artifacts.length === 0 ? ["No notification automation artifacts were provided for review."] : []),
    ...(/\b(secret|token|authorization|cookie|ari@example|206 555|twilio|resend|expo_push_token)\b/i.test(serialized)
      ? ["Notification automation artifacts still contain provider credentials, tokens, or PII."]
      : []),
    ...((input.expectedArtifactPaths ?? []).some((path) => !serialized.includes(path))
      ? ["Notification automation artifact inventory is incomplete."]
      : []),
  ];

  return {
    status: blockers.length === 0 ? "passed" : "blocked",
    redactedArtifacts,
    blockers,
  };
}

export function buildNotificationAutomatedTestContract(): NotificationAutomatedTestReadinessPlan {
  return buildNotificationAutomatedTestReadinessPlan({
    packageScripts: ["test", "typecheck"],
    notificationUnitTestsPassed: false,
    notificationTypecheckPassed: false,
    publicRouteContractTestsPassed: false,
    providerWebhookRouteTestsPassed: false,
    queueIntegrationTestsPassed: false,
    dashboardTemplateSmokeTestsPassed: false,
    dashboardMessageSmokeTestsPassed: false,
    mobileNotificationSmokeTestsPassed: false,
    expoPushDeviceQaPassed: false,
    providerSandboxEmailTestsPassed: false,
    providerSandboxSmsTestsPassed: false,
    providerSandboxPushReceiptTestsPassed: false,
    preferenceOptOutPersistenceTestsPassed: false,
    smsStopPersistenceTestsPassed: false,
    bookingToAftercareE2ePassed: false,
    bookingToDepositNotificationE2ePassed: false,
    travelWaitlistNotificationE2ePassed: false,
    retentionExportDeleteIntegrationTestsPassed: false,
    ciPhase9NotificationJobConfigured: true,
    testArtifactsPublished: false,
  });
}

export const notificationAutomatedTestContract = buildNotificationAutomatedTestContract();
