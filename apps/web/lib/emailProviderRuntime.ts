import { emailProviderContract } from "./emailProvider";

export type EmailProviderRuntimeStatus =
  | "wired"
  | "sdk-gated"
  | "domain-gated"
  | "signature-gated"
  | "persistence-gated"
  | "sandbox-gated"
  | "ci-gated";

export interface EmailProviderRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: EmailProviderRuntimeStatus;
}

export interface EmailProviderRuntimeReadiness {
  readonly status: "ready" | "blocked";
  readonly requiredCommands: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly requiredControls: readonly string[];
  readonly blockers: readonly string[];
}

export const emailProviderRuntimeCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm vitest run apps/web/tests/email-provider-static.test.ts",
  "Resend sandbox delivered event test",
  "Resend sandbox bounced event test",
  "Resend sandbox complained event test",
  "Resend unsubscribe suppression test",
  "invalid email webhook signature route test",
] as const;

export const emailProviderArtifactPaths = [
  "coverage/email-provider-runtime.json",
  "coverage/email-provider-notifications-typecheck.txt",
  "coverage/email-provider-notifications-test.txt",
  "coverage/email-provider-static-contract.json",
  "coverage/email-provider-resend-sdk.json",
  "coverage/email-provider-domain-verification-redacted.json",
  "coverage/email-provider-raw-body-signature.json",
  "coverage/email-provider-delivery-persistence.json",
  "coverage/email-provider-provider-event-persistence.json",
  "coverage/email-provider-suppression-persistence.json",
  "coverage/email-provider-sandbox-delivered-redacted.json",
  "coverage/email-provider-sandbox-bounced-redacted.json",
  "coverage/email-provider-sandbox-complained-redacted.json",
  "coverage/email-provider-unsubscribe-suppression.json",
  "coverage/email-provider-invalid-signature-route.json",
  "coverage/email-provider-ci-evidence.json",
  "coverage/email-provider-secret-safe-artifacts.json",
  "test-results/email-provider-runtime",
] as const;

export const emailProviderRuntimeMatrix = [
  { id: "notifications-typecheck", command: "pnpm --filter @inkroute/notifications typecheck", artifact: "coverage/email-provider-notifications-typecheck.txt", status: "wired" },
  { id: "notifications-tests", command: "pnpm --filter @inkroute/notifications test", artifact: "coverage/email-provider-notifications-test.txt", status: "wired" },
  { id: "static-contract", command: "pnpm vitest run apps/web/tests/email-provider-static.test.ts", artifact: "coverage/email-provider-static-contract.json", status: "wired" },
  { id: "resend-sdk-api-key", command: "install/configure Resend SDK and sandbox API key", artifact: "coverage/email-provider-resend-sdk.json", status: "sdk-gated" },
  { id: "verified-sender-domain", command: "prove verified sender/domain without exposing DNS secrets", artifact: "coverage/email-provider-domain-verification-redacted.json", status: "domain-gated" },
  { id: "raw-body-signature", command: "verify Resend/Svix signature against raw webhook bodies", artifact: "coverage/email-provider-raw-body-signature.json", status: "signature-gated" },
  { id: "delivery-persistence", command: "durable NotificationDelivery transaction tests", artifact: "coverage/email-provider-delivery-persistence.json", status: "persistence-gated" },
  { id: "provider-event-persistence", command: "durable ProviderEvent replay/idempotency tests", artifact: "coverage/email-provider-provider-event-persistence.json", status: "persistence-gated" },
  { id: "suppression-persistence", command: "durable bounce/complaint/unsubscribe suppression tests", artifact: "coverage/email-provider-suppression-persistence.json", status: "persistence-gated" },
  { id: "sandbox-delivered", command: "Resend sandbox delivered event test", artifact: "coverage/email-provider-sandbox-delivered-redacted.json", status: "sandbox-gated" },
  { id: "sandbox-bounced", command: "Resend sandbox bounced event test", artifact: "coverage/email-provider-sandbox-bounced-redacted.json", status: "sandbox-gated" },
  { id: "sandbox-complained", command: "Resend sandbox complained event test", artifact: "coverage/email-provider-sandbox-complained-redacted.json", status: "sandbox-gated" },
  { id: "unsubscribe-suppression", command: "Resend unsubscribe suppression test", artifact: "coverage/email-provider-unsubscribe-suppression.json", status: "sandbox-gated" },
  { id: "invalid-signature-route", command: "invalid email webhook signature route test", artifact: "coverage/email-provider-invalid-signature-route.json", status: "signature-gated" },
  { id: "ci-email-provider-job", command: "GitHub Actions email provider runtime job", artifact: "coverage/email-provider-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "review email artifacts for API keys, signatures, raw payloads, destinations, and tenant data", artifact: "coverage/email-provider-secret-safe-artifacts.json", status: "ci-gated" },
] as const satisfies readonly EmailProviderRuntimeMatrixEntry[];

export const emailProviderRuntimeReadiness: EmailProviderRuntimeReadiness = {
  status: "blocked",
  requiredCommands: emailProviderRuntimeCommands,
  requiredEvidence: [
    "Resend SDK/API key and verified sender/domain evidence",
    "raw-body Resend/Svix signature verification and invalid-signature route evidence",
    "durable NotificationDelivery, ProviderEvent, and suppression persistence evidence",
    "sandbox delivered, bounced, complained, and unsubscribe event transcripts",
    "CI email provider runtime evidence with secret-safe artifacts",
  ],
  requiredControls: [
    ...emailProviderContract.sendPlan.requiredControls,
    ...emailProviderContract.webhookReadiness.requiredControls,
  ],
  blockers: [
    "Real Resend SDK/API key must be configured in a secret store before provider-backed sends.",
    "Verified sender/domain evidence must be captured before production email delivery.",
    "Email webhook route must verify Resend/Svix signatures cryptographically against raw bodies.",
    "NotificationDelivery, ProviderEvent, and suppression persistence must be durable and transactional.",
    "Delivered, bounced, complained, and unsubscribe provider events must be tested against the sandbox.",
    "Email provider CI evidence and secret-safe artifact review must be captured.",
  ],
};
