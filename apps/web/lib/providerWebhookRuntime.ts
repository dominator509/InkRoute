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
