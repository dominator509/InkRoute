import { smsProviderContract } from "./smsProvider";

export type SmsProviderRuntimeStatus =
  | "wired"
  | "sdk-gated"
  | "compliance-gated"
  | "signature-gated"
  | "persistence-gated"
  | "sandbox-gated"
  | "ci-gated";

export interface SmsProviderRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: SmsProviderRuntimeStatus;
}

export interface SmsProviderRuntimeReadiness {
  readonly status: "ready" | "blocked";
  readonly requiredCommands: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly requiredControls: readonly string[];
  readonly blockers: readonly string[];
}

export const smsProviderRuntimeCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm vitest run apps/web/tests/sms-provider-static.test.ts",
  "Twilio sandbox sent event test",
  "Twilio sandbox delivered event test",
  "Twilio sandbox failed event test",
  "Twilio STOP suppression test",
  "Twilio HELP inbound-thread test",
  "invalid SMS webhook signature route test",
] as const;

export const smsProviderArtifactPaths = [
  "coverage/sms-provider-runtime.json",
  "coverage/sms-provider-notifications-typecheck.txt",
  "coverage/sms-provider-notifications-test.txt",
  "coverage/sms-provider-static-contract.json",
  "coverage/sms-provider-twilio-sdk.json",
  "coverage/sms-provider-messaging-service-redacted.json",
  "coverage/sms-provider-consent-copy-approval.json",
  "coverage/sms-provider-consent-proof.json",
  "coverage/sms-provider-quiet-hours.json",
  "coverage/sms-provider-raw-body-signature.json",
  "coverage/sms-provider-request-url-validation.json",
  "coverage/sms-provider-delivery-persistence.json",
  "coverage/sms-provider-provider-event-persistence.json",
  "coverage/sms-provider-suppression-persistence.json",
  "coverage/sms-provider-inbound-thread-persistence.json",
  "coverage/sms-provider-sandbox-sent-redacted.json",
  "coverage/sms-provider-sandbox-delivered-redacted.json",
  "coverage/sms-provider-sandbox-failed-redacted.json",
  "coverage/sms-provider-stop-suppression.json",
  "coverage/sms-provider-help-inbound-thread.json",
  "coverage/sms-provider-invalid-signature-route.json",
  "coverage/sms-provider-ci-evidence.json",
  "coverage/sms-provider-secret-safe-artifacts.json",
  "test-results/sms-provider-runtime",
] as const;

export const smsProviderRuntimeMatrix = [
  { id: "notifications-typecheck", command: "pnpm --filter @inkroute/notifications typecheck", artifact: "coverage/sms-provider-notifications-typecheck.txt", status: "wired" },
  { id: "notifications-tests", command: "pnpm --filter @inkroute/notifications test", artifact: "coverage/sms-provider-notifications-test.txt", status: "wired" },
  { id: "static-contract", command: "pnpm vitest run apps/web/tests/sms-provider-static.test.ts", artifact: "coverage/sms-provider-static-contract.json", status: "wired" },
  { id: "twilio-sdk-credentials", command: "install/configure Twilio SDK, Account SID, and auth token", artifact: "coverage/sms-provider-twilio-sdk.json", status: "sdk-gated" },
  { id: "messaging-service", command: "prove Twilio messaging service configuration", artifact: "coverage/sms-provider-messaging-service-redacted.json", status: "sdk-gated" },
  { id: "legal-consent-copy", command: "legal-approved SMS consent and STOP/HELP copy review", artifact: "coverage/sms-provider-consent-copy-approval.json", status: "compliance-gated" },
  { id: "consent-proof", command: "stored SMS consent proof tests", artifact: "coverage/sms-provider-consent-proof.json", status: "compliance-gated" },
  { id: "quiet-hours", command: "quiet-hours policy tests", artifact: "coverage/sms-provider-quiet-hours.json", status: "compliance-gated" },
  { id: "raw-body-signature", command: "verify Twilio signature against raw bodies", artifact: "coverage/sms-provider-raw-body-signature.json", status: "signature-gated" },
  { id: "request-url-validation", command: "validate Twilio request URL in webhook signature base string", artifact: "coverage/sms-provider-request-url-validation.json", status: "signature-gated" },
  { id: "delivery-persistence", command: "durable NotificationDelivery transaction tests", artifact: "coverage/sms-provider-delivery-persistence.json", status: "persistence-gated" },
  { id: "provider-event-persistence", command: "durable ProviderEvent replay/idempotency tests", artifact: "coverage/sms-provider-provider-event-persistence.json", status: "persistence-gated" },
  { id: "suppression-persistence", command: "durable STOP suppression persistence tests", artifact: "coverage/sms-provider-suppression-persistence.json", status: "persistence-gated" },
  { id: "inbound-thread-persistence", command: "durable HELP/client reply inbound-thread persistence tests", artifact: "coverage/sms-provider-inbound-thread-persistence.json", status: "persistence-gated" },
  { id: "sandbox-sent", command: "Twilio sandbox sent event test", artifact: "coverage/sms-provider-sandbox-sent-redacted.json", status: "sandbox-gated" },
  { id: "sandbox-delivered", command: "Twilio sandbox delivered event test", artifact: "coverage/sms-provider-sandbox-delivered-redacted.json", status: "sandbox-gated" },
  { id: "sandbox-failed", command: "Twilio sandbox failed event test", artifact: "coverage/sms-provider-sandbox-failed-redacted.json", status: "sandbox-gated" },
  { id: "stop-suppression", command: "Twilio STOP suppression test", artifact: "coverage/sms-provider-stop-suppression.json", status: "sandbox-gated" },
  { id: "help-inbound-thread", command: "Twilio HELP inbound-thread test", artifact: "coverage/sms-provider-help-inbound-thread.json", status: "sandbox-gated" },
  { id: "invalid-signature-route", command: "invalid SMS webhook signature route test", artifact: "coverage/sms-provider-invalid-signature-route.json", status: "signature-gated" },
  { id: "ci-sms-provider-job", command: "GitHub Actions SMS provider runtime job", artifact: "coverage/sms-provider-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "review SMS artifacts for Twilio secrets, signatures, raw payloads, phone numbers, and tenant data", artifact: "coverage/sms-provider-secret-safe-artifacts.json", status: "ci-gated" },
] as const satisfies readonly SmsProviderRuntimeMatrixEntry[];

export const smsProviderRuntimeReadiness: SmsProviderRuntimeReadiness = {
  status: "blocked",
  requiredCommands: smsProviderRuntimeCommands,
  requiredEvidence: [
    "Twilio SDK credentials and messaging service evidence",
    "legal-approved consent/STOP/HELP copy, stored consent proof, and quiet-hours evidence",
    "raw-body Twilio signature verification, request URL validation, and invalid-signature route evidence",
    "durable NotificationDelivery, ProviderEvent, SuppressionListEntry, MessageThread, and idempotency evidence",
    "sandbox sent, delivered, failed, STOP, and HELP transcripts",
    "CI SMS provider runtime evidence with secret-safe artifacts",
  ],
  requiredControls: [
    ...smsProviderContract.sendPlan.requiredControls,
    ...smsProviderContract.stopWebhookReadiness.requiredControls,
    ...smsProviderContract.helpWebhookReadiness.requiredControls,
  ],
  blockers: [
    "Real Twilio SDK credentials and messaging service must be configured in a secret store.",
    "Legal-approved SMS consent, STOP, and HELP copy must be finalized before provider-backed sends.",
    "SMS webhook route must verify Twilio signatures cryptographically against raw bodies and request URLs.",
    "NotificationDelivery, ProviderEvent, suppression, inbound thread, and idempotency persistence must be durable and transactional.",
    "Sent, delivered, failed, STOP, and HELP provider flows must be tested against the sandbox.",
    "SMS provider CI evidence and secret-safe artifact review must be captured.",
  ],
};
