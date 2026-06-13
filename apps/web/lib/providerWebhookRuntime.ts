import { providerWebhookContract } from "./providerWebhookReconciliation";

export type ProviderWebhookRuntimeStatus =
  | "wired"
  | "signature-gated"
  | "persistence-gated"
  | "reconciliation-gated"
  | "sandbox-gated"
  | "concurrency-gated"
  | "alert-gated"
  | "ci-gated";

export interface ProviderWebhookRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: ProviderWebhookRuntimeStatus;
}

export const providerWebhookRuntimeCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm vitest run apps/web/tests/provider-webhook-routes.test.ts",
  "pnpm vitest run apps/web/tests/provider-webhook-contracts.test.ts",
  "email provider sandbox webhook replay and invalid-signature tests",
  "Twilio sandbox callback replay and invalid-signature tests",
  "Expo receipt polling invalid-token integration test",
  "concurrent provider callback exactly-once delivery-log test",
] as const;

export const providerWebhookArtifactPaths = [
  "coverage/provider-webhook-runtime.json",
  "coverage/provider-webhook-notifications-typecheck.txt",
  "coverage/provider-webhook-notifications-test.txt",
  "coverage/provider-webhook-route-tests.json",
  "coverage/provider-webhook-contract-tests.json",
  "coverage/provider-webhook-email-signature.json",
  "coverage/provider-webhook-sms-signature.json",
  "coverage/provider-webhook-push-receipt-source.json",
  "coverage/provider-webhook-provider-event-persistence.json",
  "coverage/provider-webhook-exactly-once-delivery.json",
  "coverage/provider-webhook-suppression-persistence.json",
  "coverage/provider-webhook-inbound-routing.json",
  "coverage/provider-webhook-invalid-push-token.json",
  "coverage/provider-webhook-failed-alerting.json",
  "coverage/provider-webhook-sandbox-replay.json",
  "coverage/provider-webhook-concurrent-callbacks.json",
  "coverage/provider-webhook-ci-evidence.json",
  "coverage/provider-webhook-secret-safe-artifacts.json",
  "test-results/provider-webhook-runtime",
] as const;

export const providerWebhookRuntimeProofFiles = [
  "packages/notifications/package.json",
  "packages/notifications/src/index.ts",
  "packages/notifications/tests/delivery-plan.test.ts",
  "apps/web/lib/providerWebhookReconciliation.ts",
  "apps/web/lib/providerWebhookRuntime.ts",
  "apps/web/app/api/webhooks/email/route.ts",
  "apps/web/app/api/webhooks/sms/route.ts",
  "apps/web/tests/provider-webhook-contracts.test.ts",
  "apps/web/tests/provider-webhook-routes.test.ts",
  "apps/web/tests/provider-webhook-runtime-static.test.ts",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export type ProviderWebhookEvidenceArtifact = (typeof providerWebhookArtifactPaths)[number];

export interface ProviderWebhookEvidenceInput {
  readonly notificationsTypecheckPassed: boolean;
  readonly notificationsTestsPassed: boolean;
  readonly routeTestsPassed: boolean;
  readonly contractTestsPassed: boolean;
  readonly emailSignatureVerified: boolean;
  readonly smsSignatureVerified: boolean;
  readonly pushReceiptSourceVerified: boolean;
  readonly providerEventPersistenceVerified: boolean;
  readonly exactlyOnceDeliveryVerified: boolean;
  readonly suppressionPersistenceVerified: boolean;
  readonly inboundRoutingVerified: boolean;
  readonly invalidPushTokenVerified: boolean;
  readonly failedAlertingVerified: boolean;
  readonly sandboxReplayVerified: boolean;
  readonly concurrentCallbacksVerified: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly ProviderWebhookEvidenceArtifact[];
}

export interface ProviderWebhookEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly ProviderWebhookEvidenceArtifact[];
  readonly requiredCommands: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly redactedSummary: {
    readonly capturedArtifactCount: number;
    readonly requiredArtifactCount: number;
  };
}

export const buildProviderWebhookEvidenceDecision = (
  input: ProviderWebhookEvidenceInput,
): ProviderWebhookEvidenceDecision => {
  const captured = new Set(input.capturedArtifacts);
  const missingArtifacts = providerWebhookArtifactPaths.filter((artifact) => !captured.has(artifact));
  const blockers = [
    ...(!input.notificationsTypecheckPassed ? ["Notifications package typecheck evidence is missing."] : []),
    ...(!input.notificationsTestsPassed ? ["Notifications package test evidence is missing."] : []),
    ...(!input.routeTestsPassed ? ["Provider webhook route test evidence is missing."] : []),
    ...(!input.contractTestsPassed ? ["Provider webhook contract test evidence is missing."] : []),
    ...(!input.emailSignatureVerified ? ["Email provider cryptographic signature evidence is missing."] : []),
    ...(!input.smsSignatureVerified ? ["SMS provider cryptographic signature evidence is missing."] : []),
    ...(!input.pushReceiptSourceVerified ? ["Trusted push receipt source evidence is missing."] : []),
    ...(!input.providerEventPersistenceVerified ? ["ProviderEvent/idempotency persistence evidence is missing."] : []),
    ...(!input.exactlyOnceDeliveryVerified ? ["Exactly-once delivery-log reconciliation evidence is missing."] : []),
    ...(!input.suppressionPersistenceVerified ? ["Suppression persistence evidence is missing."] : []),
    ...(!input.inboundRoutingVerified ? ["Inbound routing persistence evidence is missing."] : []),
    ...(!input.invalidPushTokenVerified ? ["Invalid push-token persistence evidence is missing."] : []),
    ...(!input.failedAlertingVerified ? ["Failed-webhook alerting evidence is missing."] : []),
    ...(!input.sandboxReplayVerified ? ["Provider sandbox replay/invalid-signature evidence is missing."] : []),
    ...(!input.concurrentCallbacksVerified ? ["Concurrent callback exactly-once evidence is missing."] : []),
    ...(!input.ciEvidenceCaptured ? ["Provider webhook CI evidence is missing."] : []),
    ...(!input.secretSafeArtifactReviewPassed
      ? ["Secret-safe provider webhook artifact review evidence is missing."]
      : []),
    ...(missingArtifacts.length > 0 ? ["All provider webhook artifacts must be captured."] : []),
  ];

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: [...providerWebhookRuntimeCommands],
    requiredEvidence: [
      "provider signature verification and raw-body route evidence",
      "durable replay protection and exactly-once ProviderEvent evidence",
      "delivery, suppression, inbound routing, and invalid-token persistence evidence",
      "provider sandbox, invalid-signature, and failed-webhook alerting evidence",
      "concurrent callback exactly-once delivery-log evidence",
      "secret-safe review of retained provider webhook artifacts",
    ],
    redactedSummary: {
      capturedArtifactCount: captured.size,
      requiredArtifactCount: providerWebhookArtifactPaths.length,
    },
  };
};

export const providerWebhookRuntimeMatrix = [
  { id: "notifications-typecheck", command: "pnpm --filter @inkroute/notifications typecheck", artifact: "coverage/provider-webhook-notifications-typecheck.txt", status: "wired" },
  { id: "notifications-tests", command: "pnpm --filter @inkroute/notifications test", artifact: "coverage/provider-webhook-notifications-test.txt", status: "wired" },
  { id: "route-tests", command: "pnpm vitest run apps/web/tests/provider-webhook-routes.test.ts", artifact: "coverage/provider-webhook-route-tests.json", status: "wired" },
  { id: "contract-tests", command: "pnpm vitest run apps/web/tests/provider-webhook-contracts.test.ts", artifact: "coverage/provider-webhook-contract-tests.json", status: "wired" },
  { id: "email-signature", command: "email provider sandbox webhook replay and invalid-signature tests", artifact: "coverage/provider-webhook-email-signature.json", status: "signature-gated" },
  { id: "sms-signature", command: "Twilio sandbox callback replay and invalid-signature tests", artifact: "coverage/provider-webhook-sms-signature.json", status: "signature-gated" },
  { id: "push-receipt-source", command: "Expo receipt polling invalid-token integration test", artifact: "coverage/provider-webhook-push-receipt-source.json", status: "signature-gated" },
  { id: "provider-event-persistence", command: "durable ProviderEvent/idempotency repository tests", artifact: "coverage/provider-webhook-provider-event-persistence.json", status: "persistence-gated" },
  { id: "exactly-once-delivery", command: "exactly-once delivery-log reconciliation tests", artifact: "coverage/provider-webhook-exactly-once-delivery.json", status: "reconciliation-gated" },
  { id: "suppression-persistence", command: "suppression persistence tests", artifact: "coverage/provider-webhook-suppression-persistence.json", status: "persistence-gated" },
  { id: "inbound-routing", command: "inbound routing persistence tests", artifact: "coverage/provider-webhook-inbound-routing.json", status: "persistence-gated" },
  { id: "invalid-push-token", command: "invalid push-token persistence tests", artifact: "coverage/provider-webhook-invalid-push-token.json", status: "persistence-gated" },
  { id: "failed-alerting", command: "failed-webhook alert integration tests", artifact: "coverage/provider-webhook-failed-alerting.json", status: "alert-gated" },
  { id: "sandbox-replay", command: "provider sandbox webhook replay tests", artifact: "coverage/provider-webhook-sandbox-replay.json", status: "sandbox-gated" },
  { id: "concurrent-callbacks", command: "concurrent provider callback exactly-once delivery-log test", artifact: "coverage/provider-webhook-concurrent-callbacks.json", status: "concurrency-gated" },
  { id: "ci-provider-webhook-job", command: "GitHub Actions provider webhook runtime job", artifact: "coverage/provider-webhook-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "review provider webhook artifacts for signatures, tokens, payloads, destinations, message bodies, and secrets", artifact: "coverage/provider-webhook-secret-safe-artifacts.json", status: "ci-gated" },
] as const satisfies readonly ProviderWebhookRuntimeMatrixEntry[];

export const providerWebhookRuntimeReadiness = providerWebhookContract.runtimeReadiness;
