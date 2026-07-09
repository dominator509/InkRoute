import { buildExpoPushProviderRuntimeReadinessPlan } from "@inkroute/notifications";

export type MobilePushRuntimeStatus =
  | "wired"
  | "credential-gated"
  | "persistence-gated"
  | "worker-gated"
  | "device-gated"
  | "ci-gated";

export interface MobilePushRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: MobilePushRuntimeStatus;
}

export const mobilePushRuntimeCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm --filter @inkroute/mobile typecheck",
  "configure Expo project id, access token, APNs, and FCM credentials",
  "persist tenant/user/device push tokens and opt-out state",
  "Expo push send smoke test against a real device token",
  "persist Expo ProviderEvent receipt reconciliation records",
  "persist NotificationInteraction tap/open records",
  "persist mobile push audit log records",
  "Expo receipt polling smoke test",
  "mobile push tap deep-link routing smoke",
  "iOS foreground/background/tap push QA",
  "Android foreground/background/tap push QA",
  "GitHub Actions mobile push evidence job",
] as const;

export const mobilePushArtifactPaths = [
  "coverage/mobile-push-runtime.json",
  "coverage/mobile-push-notifications-typecheck.txt",
  "coverage/mobile-push-notifications-test.txt",
  "coverage/mobile-push-app-typecheck.txt",
  "coverage/mobile-push-expo-project-redacted.json",
  "coverage/mobile-push-native-credentials-redacted.json",
  "coverage/mobile-push-token-persistence.json",
  "coverage/mobile-push-opt-out-persistence.json",
  "coverage/mobile-push-delivery-worker.json",
  "coverage/mobile-push-delivery-log-persistence.json",
  "coverage/mobile-push-provider-event-persistence.json",
  "coverage/mobile-push-notification-interaction.json",
  "coverage/mobile-push-audit-log.json",
  "coverage/mobile-push-receipt-worker.json",
  "coverage/mobile-push-invalid-token-suppression.json",
  "coverage/mobile-push-tap-routing.json",
  "coverage/mobile-push-ios-device-qa-redacted.json",
  "coverage/mobile-push-android-device-qa-redacted.json",
  "coverage/mobile-push-secret-safe-artifacts.json",
  "test-results/mobile-push-runtime",
] as const;

export const mobilePushRuntimeProofFiles = [
  "apps/mobile/package.json",
  "packages/notifications/package.json",
  "packages/notifications/src/index.ts",
  "packages/notifications/tests/delivery-plan.test.ts",
  "packages/mobile/package.json",
  "apps/mobile/src/lib/mobilePush.ts",
  "apps/mobile/src/lib/mobilePushRuntime.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260622193000_add_mobile_push_tokens_interactions/migration.sql",
  "apps/mobile/src/lib/mobileDemo.ts",
  "apps/mobile/src/screens/NotificationsScreen.tsx",
  "apps/mobile/tests/mobile-push-static.test.ts",
  "apps/mobile/tests/mobile-push-runtime-static.test.ts",
  "testing/manifests/unit-test-manifest.json",
  ".env.example",
  ".github/workflows/ci.yml",
] as const;

export type MobilePushEvidenceArtifact = (typeof mobilePushArtifactPaths)[number];

export interface MobilePushExecutionPolicy {
  readonly codexMayClassifyStaticMobilePushReadiness: true;
  readonly expoCredentialsRequiredForClosure: true;
  readonly tokenPersistenceRequiredForClosure: true;
  readonly receiptWorkerRequiredForClosure: true;
  readonly invalidTokenSuppressionRequiredForClosure: true;
  readonly devicePushSmokeRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface MobilePushExecutionPlan {
  readonly policy: typeof mobilePushExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly expoCredentialExecutionAllowed: false;
  readonly nativeCredentialExecutionAllowed: false;
  readonly pushDeliveryExecutionAllowed: false;
  readonly receiptWorkerExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly deviceExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly artifactReviewExecutionAllowed: false;
  readonly localCommands: typeof mobilePushLocalCommands;
  readonly externalCommands: typeof mobilePushExternalCommands;
  readonly requiredExternalEvidence: typeof mobilePushRequiredExternalEvidence;
}

export interface MobilePushArtifactReview {
  readonly artifact: unknown;
  readonly redactedArtifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: boolean;
  readonly requiredExternalEvidence: typeof mobilePushRequiredExternalEvidence;
}

export interface MobilePushEvidenceInput {
  readonly notificationsTypecheckPassed: boolean;
  readonly notificationsTestsPassed: boolean;
  readonly mobileTypecheckPassed: boolean;
  readonly expoProjectCredentialsVerified: boolean;
  readonly nativeCredentialsVerified: boolean;
  readonly pushTokenPersistenceVerified: boolean;
  readonly optOutPersistenceVerified: boolean;
  readonly deliveryWorkerVerified: boolean;
  readonly deliveryLogPersistenceVerified: boolean;
  readonly providerEventPersistenceVerified: boolean;
  readonly notificationInteractionVerified: boolean;
  readonly auditLogPersistenceVerified: boolean;
  readonly receiptWorkerVerified: boolean;
  readonly invalidTokenSuppressionVerified: boolean;
  readonly tapRoutingVerified: boolean;
  readonly iosDeviceQaPassed: boolean;
  readonly androidDeviceQaPassed: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly MobilePushEvidenceArtifact[];
}

export interface MobilePushEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly MobilePushEvidenceArtifact[];
  readonly requiredCommands: typeof mobilePushRuntimeCommands;
  readonly requiredEvidence: typeof mobilePushDecisionRequiredEvidence;
  readonly redactedSummary: {
    readonly capturedArtifactCount: number;
    readonly requiredArtifactCount: number;
  };
}

export const mobilePushExecutionPolicy = {
  codexMayClassifyStaticMobilePushReadiness: true,
  expoCredentialsRequiredForClosure: true,
  tokenPersistenceRequiredForClosure: true,
  receiptWorkerRequiredForClosure: true,
  invalidTokenSuppressionRequiredForClosure: true,
  devicePushSmokeRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies MobilePushExecutionPolicy;

export const mobilePushRequiredExternalEvidence = [
  "Expo project/access token/APNs/FCM credential evidence",
  "tenant/user/device push token persistence proof",
  "opt-out persistence proof",
  "delivery worker and delivery-log persistence proof",
  "Expo receipt worker reconciliation proof",
  "invalid-token suppression persistence proof",
  "notification tap deep-link routing proof",
  "iOS foreground/background/tap push QA evidence",
  "Android foreground/background/tap push QA evidence",
  "mobile push typecheck output",
  "CI mobile push evidence",
  "secret-safe mobile push artifact review",
] as const;

export const mobilePushDecisionRequiredEvidence = [
  "Expo project, secret, APNs, and FCM configuration evidence",
  "tenant/user/device push token and opt-out persistence evidence",
  "Expo ProviderEvent, NotificationDelivery, NotificationInteraction, and audit persistence evidence",
  "Expo delivery worker, receipt polling, and invalid-token suppression evidence",
  "foreground/background/tap-navigation iOS and Android device QA evidence",
  "secret-safe review of retained mobile push artifacts",
] as const;

export const mobilePushLocalCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "static mobile push registration and tap-routing contract review",
  "static Expo push payload sanitizer review",
] as const;

export const mobilePushExternalCommands = [
  "pnpm --filter @inkroute/mobile typecheck",
  "configure Expo project id, access token, APNs, and FCM credentials",
  "persist tenant/user/device push tokens and opt-out state",
  "Expo push send smoke test against a real device token",
  "Expo receipt polling smoke test",
  "invalid-token suppression persistence test",
  "mobile push tap deep-link routing smoke",
  "iOS foreground/background/tap push QA",
  "Android foreground/background/tap push QA",
  "GitHub Actions mobile push evidence job",
] as const;

const sensitiveMobilePushArtifactKey = /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|expo|apns|fcm|credential|device|push|notification|receipt|delivery|audit|interaction|deep.?link|route|email|phone|medical|payment|artifact|path|ci|workflow|run|evidence|id|key)/i;
const sensitiveMobilePushArtifactValue =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:sk|pk|gh[psuor]|github_pat|provider-token|expo|apns|fcm)[A-Za-z0-9_-]*|(?:tenant|client|user|member|session|refresh|expo|apns|fcm|credential|device|push|notification|receipt|delivery|audit|interaction|route|provider|artifact|workflow|ci|run|evidence|mobile)[-_:/]?[A-Za-z0-9_.-]{6,}|(?:coverage|artifacts|test-results|reports|docs)\/[A-Za-z0-9_./-]{6,}|[A-Za-z0-9_-]{24,})/giu;

const redactMobilePushArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactMobilePushArtifactValue(entry, `${path}.${index}`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveMobilePushArtifactKey.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, redactMobilePushArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  if (typeof value === "string" && sensitiveMobilePushArtifactValue.test(value)) {
    sensitiveMobilePushArtifactValue.lastIndex = 0;
    redactedPaths.push(path);
    return value.replace(sensitiveMobilePushArtifactValue, "[REDACTED]");
  }

  sensitiveMobilePushArtifactValue.lastIndex = 0;
  return value;
};

export const buildMobilePushExecutionPlan = (): MobilePushExecutionPlan => ({
  policy: mobilePushExecutionPolicy,
  commandExecutionAllowed: false,
  expoCredentialExecutionAllowed: false,
  nativeCredentialExecutionAllowed: false,
  pushDeliveryExecutionAllowed: false,
  receiptWorkerExecutionAllowed: false,
  persistenceExecutionAllowed: false,
  deviceExecutionAllowed: false,
  ciExecutionAllowed: false,
  artifactReviewExecutionAllowed: false,
  localCommands: mobilePushLocalCommands,
  externalCommands: mobilePushExternalCommands,
  requiredExternalEvidence: mobilePushRequiredExternalEvidence,
});

export const buildRedactedMobilePushArtifact = (artifact: unknown): Pick<MobilePushArtifactReview, "redactedArtifact" | "redactedPaths"> => {
  const redactedPaths: string[] = [];
  return {
    redactedArtifact: redactMobilePushArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
  };
};

export const buildMobilePushArtifactReview = (artifact: unknown): MobilePushArtifactReview => {
  const redacted = buildRedactedMobilePushArtifact(artifact);
  return {
    artifact,
    redactedArtifact: redacted.redactedArtifact,
    redactedPaths: redacted.redactedPaths,
    secretSafe: redacted.redactedPaths.length > 0,
    requiredExternalEvidence: mobilePushRequiredExternalEvidence,
  };
};

export const buildMobilePushEvidenceDecision = (
  input: MobilePushEvidenceInput,
): MobilePushEvidenceDecision => {
  const captured = new Set(input.capturedArtifacts);
  const missingArtifacts = mobilePushArtifactPaths.filter((artifact) => !captured.has(artifact));
  const blockers = [
    ...(!input.notificationsTypecheckPassed ? ["Notifications package typecheck evidence is missing."] : []),
    ...(!input.notificationsTestsPassed ? ["Notifications package test evidence is missing."] : []),
    ...(!input.mobileTypecheckPassed ? ["Mobile app typecheck evidence is missing."] : []),
    ...(!input.expoProjectCredentialsVerified ? ["Expo project/access token evidence is missing."] : []),
    ...(!input.nativeCredentialsVerified ? ["Native APNs/FCM credential evidence is missing."] : []),
    ...(!input.pushTokenPersistenceVerified ? ["PushToken persistence evidence is missing."] : []),
    ...(!input.optOutPersistenceVerified ? ["Push opt-out persistence evidence is missing."] : []),
    ...(!input.deliveryWorkerVerified ? ["Expo push delivery worker evidence is missing."] : []),
    ...(!input.deliveryLogPersistenceVerified ? ["NotificationDelivery persistence evidence is missing."] : []),
    ...(!input.providerEventPersistenceVerified ? ["Expo ProviderEvent persistence evidence is missing."] : []),
    ...(!input.notificationInteractionVerified
      ? ["NotificationInteraction persistence evidence is missing."]
      : []),
    ...(!input.auditLogPersistenceVerified ? ["Mobile push audit-log evidence is missing."] : []),
    ...(!input.receiptWorkerVerified ? ["Expo receipt polling worker evidence is missing."] : []),
    ...(!input.invalidTokenSuppressionVerified
      ? ["Invalid-token suppression persistence evidence is missing."]
      : []),
    ...(!input.tapRoutingVerified ? ["Safe push tap-routing evidence is missing."] : []),
    ...(!input.iosDeviceQaPassed ? ["iOS foreground/background/tap device QA evidence is missing."] : []),
    ...(!input.androidDeviceQaPassed ? ["Android foreground/background/tap device QA evidence is missing."] : []),
    ...(!input.secretSafeArtifactReviewPassed
      ? ["Secret-safe mobile push artifact review evidence is missing."]
      : []),
    ...(missingArtifacts.length > 0 ? ["All mobile push artifacts must be captured."] : []),
  ];

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: mobilePushRuntimeCommands,
    requiredEvidence: mobilePushDecisionRequiredEvidence,
    redactedSummary: {
      capturedArtifactCount: captured.size,
      requiredArtifactCount: mobilePushArtifactPaths.length,
    },
  };
};

export const mobilePushRuntimeMatrix = [
  {
    id: "notifications-typecheck",
    command: "pnpm --filter @inkroute/notifications typecheck",
    artifact: "coverage/mobile-push-notifications-typecheck.txt",
    status: "wired",
  },
  {
    id: "notifications-tests",
    command: "pnpm --filter @inkroute/notifications test",
    artifact: "coverage/mobile-push-notifications-test.txt",
    status: "wired",
  },
  {
    id: "mobile-typecheck",
    command: "pnpm --filter @inkroute/mobile typecheck",
    artifact: "coverage/mobile-push-app-typecheck.txt",
    status: "device-gated",
  },
  {
    id: "expo-project-credentials",
    command: "configure Expo project id, access token, APNs, and FCM credentials",
    artifact: "coverage/mobile-push-expo-project-redacted.json",
    status: "credential-gated",
  },
  {
    id: "token-optout-persistence",
    command: "persist tenant/user/device push tokens and opt-out state",
    artifact: "coverage/mobile-push-token-persistence.json",
    status: "persistence-gated",
  },
  {
    id: "delivery-worker-log",
    command: "Expo push send smoke test against a real device token",
    artifact: "coverage/mobile-push-delivery-worker.json",
    status: "worker-gated",
  },
  {
    id: "provider-event-persistence",
    command: "persist Expo ProviderEvent receipt reconciliation records",
    artifact: "coverage/mobile-push-provider-event-persistence.json",
    status: "persistence-gated",
  },
  {
    id: "notification-interaction-persistence",
    command: "persist NotificationInteraction tap/open records",
    artifact: "coverage/mobile-push-notification-interaction.json",
    status: "persistence-gated",
  },
  {
    id: "audit-log-persistence",
    command: "persist mobile push audit log records",
    artifact: "coverage/mobile-push-audit-log.json",
    status: "persistence-gated",
  },
  {
    id: "receipt-worker-invalid-token",
    command: "Expo receipt polling smoke test",
    artifact: "coverage/mobile-push-invalid-token-suppression.json",
    status: "worker-gated",
  },
  {
    id: "safe-tap-routing",
    command: "mobile push tap deep-link routing smoke",
    artifact: "coverage/mobile-push-tap-routing.json",
    status: "wired",
  },
  {
    id: "ios-device-qa",
    command: "iOS foreground/background/tap push QA",
    artifact: "coverage/mobile-push-ios-device-qa-redacted.json",
    status: "device-gated",
  },
  {
    id: "android-device-qa",
    command: "Android foreground/background/tap push QA",
    artifact: "coverage/mobile-push-android-device-qa-redacted.json",
    status: "device-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions mobile push evidence job",
    artifact: "coverage/mobile-push-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly MobilePushRuntimeMatrixEntry[];

export const mobilePushRuntimeReadiness = buildExpoPushProviderRuntimeReadinessPlan({
  packageScripts: ["test", "typecheck"],
  notificationTestsPassed: false,
  notificationTypecheckPassed: false,
  mobileTypecheckPassed: false,
  expoProjectIdConfigured: false,
  expoAccessTokenConfigured: false,
  nativePushCredentialsConfigured: false,
  permissionRuntimeImplemented: true,
  tokenRegistrationRuntimeImplemented: true,
  pushTokenPersistenceAvailable: true,
  optOutPersistenceAvailable: true,
  deliveryWorkerConfigured: false,
  deliveryLogPersistenceAvailable: true,
  auditLogPersistenceAvailable: true,
  expoSendSmokePassed: false,
  receiptWorkerConfigured: false,
  receiptReplayProtectionAvailable: true,
  invalidTokenSuppressionPersistenceAvailable: true,
  deepLinkHandlerImplemented: true,
  foregroundDeviceQaPassed: false,
  backgroundDeviceQaPassed: false,
  tapNavigationDeviceQaPassed: false,
});
