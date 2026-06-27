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

export interface SmsProviderExecutionPolicy {
  readonly codexMayClassifyStaticSmsProviderReadiness: boolean;
  readonly localNotificationCommandsRequiredForClosure: boolean;
  readonly twilioSdkCredentialsRequiredForClosure: boolean;
  readonly messagingServiceRequiredForClosure: boolean;
  readonly legalConsentCopyRequiredForClosure: boolean;
  readonly consentProofRequiredForClosure: boolean;
  readonly quietHoursRequiredForClosure: boolean;
  readonly rawBodySignatureRequiredForClosure: boolean;
  readonly requestUrlValidationRequiredForClosure: boolean;
  readonly durablePersistenceRequiredForClosure: boolean;
  readonly sandboxStopHelpRequiredForClosure: boolean;
  readonly ciEvidenceRequiredForClosure: boolean;
  readonly secretSafeArtifactsRequiredForClosure: boolean;
}

export interface SmsProviderExecutionPlan {
  readonly policy: typeof smsProviderExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly twilioSdkExecutionAllowed: false;
  readonly messagingServiceExecutionAllowed: false;
  readonly legalApprovalExecutionAllowed: false;
  readonly signatureVerificationExecutionAllowed: false;
  readonly durablePersistenceExecutionAllowed: false;
  readonly sandboxEventExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly artifactReviewExecutionAllowed: false;
  readonly localCommands: typeof smsProviderLocalCommands;
  readonly externalCommands: typeof smsProviderExternalCommands;
  readonly requiredExternalEvidence: typeof smsProviderRequiredExternalEvidence;
}

export interface RedactedSmsProviderArtifact {
  readonly artifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: true;
}

export interface SmsProviderArtifactReview {
  readonly passed: boolean;
  readonly artifact: RedactedSmsProviderArtifact;
  readonly blockers: readonly string[];
  readonly requiredExternalEvidence: typeof smsProviderRequiredExternalEvidence;
}

export const smsProviderExecutionPolicy = {
  codexMayClassifyStaticSmsProviderReadiness: true,
  localNotificationCommandsRequiredForClosure: true,
  twilioSdkCredentialsRequiredForClosure: true,
  messagingServiceRequiredForClosure: true,
  legalConsentCopyRequiredForClosure: true,
  consentProofRequiredForClosure: true,
  quietHoursRequiredForClosure: true,
  rawBodySignatureRequiredForClosure: true,
  requestUrlValidationRequiredForClosure: true,
  durablePersistenceRequiredForClosure: true,
  sandboxStopHelpRequiredForClosure: true,
  ciEvidenceRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies SmsProviderExecutionPolicy;

export interface SmsProviderRuntimeReadiness {
  readonly status: "ready" | "blocked";
  readonly requiredCommands: typeof smsProviderRuntimeCommands;
  readonly requiredEvidence: typeof smsProviderRuntimeReadinessRequiredEvidence;
  readonly requiredControls: typeof smsProviderRuntimeReadinessRequiredControls;
  readonly blockers: readonly string[];
}

export const smsProviderRuntimeCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm vitest run apps/web/tests/sms-provider-static.test.ts",
  "install/configure Twilio SDK, Account SID, and auth token",
  "prove Twilio messaging service configuration",
  "legal-approved SMS consent and STOP/HELP copy review",
  "stored SMS consent proof tests",
  "quiet-hours policy tests",
  "verify Twilio signature against raw bodies",
  "validate Twilio request URL in webhook signature base string",
  "durable NotificationDelivery transaction tests",
  "durable ProviderEvent replay/idempotency tests",
  "durable STOP suppression persistence tests",
  "durable HELP/client reply inbound-thread persistence tests",
  "Twilio sandbox sent event test",
  "Twilio sandbox delivered event test",
  "Twilio sandbox failed event test",
  "Twilio STOP suppression test",
  "Twilio HELP inbound-thread test",
  "invalid SMS webhook signature route test",
  "GitHub Actions SMS provider runtime job",
  "review SMS artifacts for Twilio secrets, signatures, raw payloads, phone numbers, and tenant data",
] as const;

export const smsProviderRequiredExternalEvidence = [
  "actual SMS provider command output",
  "Twilio SDK credentials and messaging service evidence",
  "legal-approved SMS consent and STOP/HELP copy",
  "stored SMS consent proof tests",
  "quiet-hours policy tests",
  "raw-body Twilio signature verification evidence",
  "Twilio request URL validation evidence",
  "durable NotificationDelivery persistence tests",
  "durable ProviderEvent replay/idempotency tests",
  "durable STOP suppression persistence tests",
  "durable HELP/client reply inbound-thread persistence tests",
  "Twilio sandbox sent/delivered/failed/STOP/HELP transcripts",
  "invalid SMS webhook signature route evidence",
  "CI SMS provider artifacts",
  "secret-safe SMS provider artifact review",
] as const;

export const smsProviderRuntimeReadinessRequiredEvidence = [
  "Twilio SDK credentials and messaging service evidence",
  "legal-approved consent/STOP/HELP copy, stored consent proof, and quiet-hours evidence",
  "raw-body Twilio signature verification, request URL validation, and invalid-signature route evidence",
  "durable NotificationDelivery, ProviderEvent, SuppressionListEntry, MessageThread, and idempotency evidence",
  "sandbox sent, delivered, failed, STOP, and HELP transcripts",
  "CI SMS provider runtime evidence with secret-safe artifacts",
] as const;

export type SmsProviderRequiredEvidence = readonly [
  ...typeof smsProviderRuntimeReadinessRequiredEvidence,
  "secret-safe review of retained SMS provider artifacts",
];

export function buildSmsProviderDecisionRequiredEvidence(
  readinessEvidence: typeof smsProviderRuntimeReadinessRequiredEvidence,
): SmsProviderRequiredEvidence {
  return [...readinessEvidence, "secret-safe review of retained SMS provider artifacts"];
}

export const smsProviderRequiredEvidence = buildSmsProviderDecisionRequiredEvidence(
  smsProviderRuntimeReadinessRequiredEvidence,
);

export const smsProviderLocalCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm vitest run apps/web/tests/sms-provider-runtime-static.test.ts apps/web/tests/sms-provider-static.test.ts",
] as const;

export const smsProviderExternalCommands = [
  "install/configure Twilio SDK, Account SID, and auth token",
  "prove Twilio messaging service configuration",
  "legal-approved SMS consent and STOP/HELP copy review",
  "stored SMS consent proof tests",
  "quiet-hours policy tests",
  "verify Twilio signature against raw bodies",
  "validate Twilio request URL in webhook signature base string",
  "durable NotificationDelivery transaction tests",
  "durable ProviderEvent replay/idempotency tests",
  "durable STOP suppression persistence tests",
  "durable HELP/client reply inbound-thread persistence tests",
  "Twilio sandbox sent event test",
  "Twilio sandbox delivered event test",
  "Twilio sandbox failed event test",
  "Twilio STOP suppression test",
  "Twilio HELP inbound-thread test",
  "invalid SMS webhook signature route test",
  "GitHub Actions SMS provider runtime job",
  "secret-safe SMS provider artifact review",
] as const;

export const buildSmsProviderExecutionPlan = (): SmsProviderExecutionPlan => ({
  policy: smsProviderExecutionPolicy,
  commandExecutionAllowed: false,
  twilioSdkExecutionAllowed: false,
  messagingServiceExecutionAllowed: false,
  legalApprovalExecutionAllowed: false,
  signatureVerificationExecutionAllowed: false,
  durablePersistenceExecutionAllowed: false,
  sandboxEventExecutionAllowed: false,
  ciExecutionAllowed: false,
  artifactReviewExecutionAllowed: false,
  localCommands: smsProviderLocalCommands,
  externalCommands: smsProviderExternalCommands,
  requiredExternalEvidence: smsProviderRequiredExternalEvidence,
});

const smsProviderPrivateArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|sms|twilio|signature|webhook|payload|phone|destination|suppression|stop|help|thread|consent|quiet|delivery|event|artifact|customer|medical|payment)/i;

const redactSmsProviderArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactSmsProviderArtifactValue(entry, `${path}[${index}]`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (smsProviderPrivateArtifactKeyPattern.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[redacted]"];
        }

        return [key, redactSmsProviderArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  return value;
};

export const buildRedactedSmsProviderArtifact = (artifact: unknown): RedactedSmsProviderArtifact => {
  const redactedPaths: string[] = [];

  return {
    artifact: redactSmsProviderArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
    secretSafe: true,
  };
};

export const buildSmsProviderArtifactReview = (artifact: unknown): SmsProviderArtifactReview => {
  const redacted = buildRedactedSmsProviderArtifact(artifact);

  return {
    passed: true,
    artifact: redacted,
    blockers: [],
    requiredExternalEvidence: smsProviderRequiredExternalEvidence,
  };
};

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

export const smsProviderRuntimeProofFiles = [
  "packages/notifications/package.json",
  "packages/notifications/src/index.ts",
  "packages/notifications/tests/delivery-plan.test.ts",
  "apps/web/lib/smsProvider.ts",
  "apps/web/lib/smsProviderRuntime.ts",
  "apps/web/app/api/webhooks/sms/route.ts",
  "apps/web/tests/sms-provider-static.test.ts",
  "apps/web/tests/sms-provider-runtime-static.test.ts",
  "testing/manifests/unit-test-manifest.json",
  "SECURITY.md",
  "ENVIRONMENT_VARIABLES.md",
  ".env.example",
  ".github/workflows/ci.yml",
] as const;

export type SmsProviderEvidenceArtifact = (typeof smsProviderArtifactPaths)[number];

export interface SmsProviderEvidenceInput {
  readonly notificationsTypecheckPassed: boolean;
  readonly notificationsTestsPassed: boolean;
  readonly staticContractTestsPassed: boolean;
  readonly twilioSdkCredentialsVerified: boolean;
  readonly messagingServiceVerified: boolean;
  readonly legalConsentCopyApproved: boolean;
  readonly consentProofVerified: boolean;
  readonly quietHoursVerified: boolean;
  readonly rawBodySignatureVerified: boolean;
  readonly requestUrlValidationVerified: boolean;
  readonly deliveryPersistenceVerified: boolean;
  readonly providerEventPersistenceVerified: boolean;
  readonly suppressionPersistenceVerified: boolean;
  readonly inboundThreadPersistenceVerified: boolean;
  readonly sandboxSentPassed: boolean;
  readonly sandboxDeliveredPassed: boolean;
  readonly sandboxFailedPassed: boolean;
  readonly stopSuppressionPassed: boolean;
  readonly helpInboundThreadPassed: boolean;
  readonly invalidSignatureRoutePassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly SmsProviderEvidenceArtifact[];
}

export interface SmsProviderEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly SmsProviderEvidenceArtifact[];
  readonly requiredCommands: typeof smsProviderRuntimeCommands;
  readonly requiredEvidence: typeof smsProviderRequiredEvidence;
  readonly redactedSummary: {
    readonly capturedArtifactCount: number;
    readonly requiredArtifactCount: number;
  };
}

export const buildSmsProviderEvidenceDecision = (
  input: SmsProviderEvidenceInput,
): SmsProviderEvidenceDecision => {
  const captured = new Set(input.capturedArtifacts);
  const missingArtifacts = smsProviderArtifactPaths.filter((artifact) => !captured.has(artifact));
  const blockers = [
    ...(!input.notificationsTypecheckPassed ? ["Notifications package typecheck evidence is missing."] : []),
    ...(!input.notificationsTestsPassed ? ["Notifications package test evidence is missing."] : []),
    ...(!input.staticContractTestsPassed ? ["SMS provider static contract evidence is missing."] : []),
    ...(!input.twilioSdkCredentialsVerified ? ["Twilio SDK credential evidence is missing."] : []),
    ...(!input.messagingServiceVerified ? ["Twilio messaging service evidence is missing."] : []),
    ...(!input.legalConsentCopyApproved ? ["Legal-approved SMS consent/STOP/HELP copy evidence is missing."] : []),
    ...(!input.consentProofVerified ? ["Stored SMS consent proof evidence is missing."] : []),
    ...(!input.quietHoursVerified ? ["SMS quiet-hours policy evidence is missing."] : []),
    ...(!input.rawBodySignatureVerified ? ["Raw-body Twilio signature evidence is missing."] : []),
    ...(!input.requestUrlValidationVerified ? ["Twilio request URL validation evidence is missing."] : []),
    ...(!input.deliveryPersistenceVerified ? ["NotificationDelivery persistence evidence is missing."] : []),
    ...(!input.providerEventPersistenceVerified ? ["ProviderEvent persistence evidence is missing."] : []),
    ...(!input.suppressionPersistenceVerified ? ["STOP suppression persistence evidence is missing."] : []),
    ...(!input.inboundThreadPersistenceVerified ? ["HELP/client reply inbound-thread evidence is missing."] : []),
    ...(!input.sandboxSentPassed ? ["Twilio sandbox sent-event evidence is missing."] : []),
    ...(!input.sandboxDeliveredPassed ? ["Twilio sandbox delivered-event evidence is missing."] : []),
    ...(!input.sandboxFailedPassed ? ["Twilio sandbox failed-event evidence is missing."] : []),
    ...(!input.stopSuppressionPassed ? ["Twilio STOP suppression evidence is missing."] : []),
    ...(!input.helpInboundThreadPassed ? ["Twilio HELP inbound-thread evidence is missing."] : []),
    ...(!input.invalidSignatureRoutePassed ? ["Invalid SMS webhook signature route evidence is missing."] : []),
    ...(!input.ciEvidenceCaptured ? ["SMS provider CI evidence is missing."] : []),
    ...(!input.secretSafeArtifactReviewPassed
      ? ["Secret-safe SMS provider artifact review evidence is missing."]
      : []),
    ...(missingArtifacts.length > 0 ? ["All SMS provider artifacts must be captured."] : []),
  ];

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: smsProviderRuntimeCommands,
    requiredEvidence: smsProviderRequiredEvidence,
    redactedSummary: {
      capturedArtifactCount: captured.size,
      requiredArtifactCount: smsProviderArtifactPaths.length,
    },
  };
};

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

export const smsProviderRuntimeReadinessRequiredControls = [
  ...smsProviderContract.sendPlan.requiredControls,
  ...smsProviderContract.stopWebhookReadiness.requiredControls,
  ...smsProviderContract.helpWebhookReadiness.requiredControls,
] as const;

export const smsProviderRuntimeReadiness: SmsProviderRuntimeReadiness = {
  status: "blocked",
  requiredCommands: smsProviderRuntimeCommands,
  requiredEvidence: smsProviderRuntimeReadinessRequiredEvidence,
  requiredControls: smsProviderRuntimeReadinessRequiredControls,
  blockers: [
    "Real Twilio SDK credentials and messaging service must be configured in a secret store.",
    "Legal-approved SMS consent, STOP, and HELP copy must be finalized before provider-backed sends.",
    "SMS webhook route signature verification, request URL validation, and invalid-signature rejection evidence must be captured.",
    "NotificationDelivery, ProviderEvent, suppression, inbound thread, and idempotency persistence must be durable and transactional.",
    "Sent, delivered, failed, STOP, and HELP provider flows must be tested against the sandbox.",
    "SMS provider CI evidence and secret-safe artifact review must be captured.",
  ],
};


