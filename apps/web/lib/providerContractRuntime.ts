import { buildProviderContractRuntimeReadinessPlan } from "@inkroute/testing";

export type ProviderContractRuntimeStatus =
  | "wired"
  | "fixture-gated"
  | "provider-gated"
  | "ci-gated";

export interface ProviderContractRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: ProviderContractRuntimeStatus;
}

export const providerContractRuntimeArtifactPaths = [
  "coverage/provider-contract-runtime.json",
  "coverage/provider-contract-static-suite.json",
  "coverage/provider-contract-manifest-check.json",
  "coverage/provider-raw-body-fixtures.json",
  "coverage/provider-replay-idempotency-fixtures.json",
  "coverage/provider-stripe-cli-redacted.log",
  "coverage/provider-stripe-idempotency.json",
  "coverage/provider-google-calendar-oauth-redacted.json",
  "coverage/provider-google-calendar-sync-redacted.json",
  "coverage/provider-storage-signed-url.json",
  "coverage/provider-storage-upload-download.json",
  "coverage/provider-email-sandbox-redacted.json",
  "coverage/provider-sms-sandbox-redacted.json",
  "coverage/provider-push-sandbox-redacted.json",
  "coverage/provider-sentry-capture-redacted.json",
  "coverage/provider-auth-session-fixtures.json",
  "coverage/provider-rate-limit-store.json",
  "coverage/provider-contract-ci-run-redacted.json",
  "test-results/provider-contract-runtime"
] as const;

export const providerContractRuntimeCommands = [
  "pnpm test:manifest",
  "pnpm vitest run apps/web/tests/provider-webhook-contracts.test.ts",
  "stripe listen --forward-to localhost:3000/api/webhooks/stripe",
  "stripe trigger checkout.session.completed",
  "provider sandbox contract suite for calendar/storage/email/sms/push/sentry/auth/rate-limit",
  "GitHub Actions provider-contract job"
] as const;

export const providerContractRuntimeMatrix: readonly ProviderContractRuntimeMatrixEntry[] = [
  {
    id: "static-webhook-contracts",
    command: "pnpm vitest run apps/web/tests/provider-webhook-contracts.test.ts",
    artifact: "coverage/provider-contract-static-suite.json",
    status: "wired"
  },
  {
    id: "provider-manifest-verification",
    command: "pnpm test:manifest",
    artifact: "coverage/provider-contract-manifest-check.json",
    status: "wired"
  },
  {
    id: "raw-body-replay-fixtures",
    command: "commit signed raw-body and replay/idempotency fixtures for Stripe, email, SMS, and Sentry",
    artifact: "coverage/provider-raw-body-fixtures.json",
    status: "fixture-gated"
  },
  {
    id: "stripe-cli-idempotency",
    command: "stripe listen --forward-to localhost:3000/api/webhooks/stripe && stripe trigger checkout.session.completed",
    artifact: "coverage/provider-stripe-cli-redacted.log",
    status: "provider-gated"
  },
  {
    id: "google-calendar-oauth-sync",
    command: "run Google Calendar OAuth, freebusy, sync-token, conflict, and disconnect sandbox flows",
    artifact: "coverage/provider-google-calendar-sync-redacted.json",
    status: "provider-gated"
  },
  {
    id: "storage-signed-url-upload-download",
    command: "run storage signed URL, upload/download, private-original, public-derivative, and scan-approved read contracts",
    artifact: "coverage/provider-storage-upload-download.json",
    status: "provider-gated"
  },
  {
    id: "messaging-push-sentry",
    command: "run Resend, Twilio, Expo Push, and Sentry sandbox send/capture contracts",
    artifact: "coverage/provider-sentry-capture-redacted.json",
    status: "provider-gated"
  },
  {
    id: "auth-rate-limit-fixtures",
    command: "run auth session fixture and distributed rate-limit store contract tests",
    artifact: "coverage/provider-rate-limit-store.json",
    status: "provider-gated"
  },
  {
    id: "ci-redacted-artifacts",
    command: "GitHub Actions provider-contract job",
    artifact: "coverage/provider-contract-ci-run-redacted.json",
    status: "ci-gated"
  }
];

export const providerContractRuntimeReadiness = buildProviderContractRuntimeReadinessPlan({
  rootScripts: ["test:unit", "test:manifest"],
  staticWebhookContractSuitePassed: false,
  providerManifestVerified: true,
  stripeCliWebhookPassed: false,
  stripeIdempotencyVerified: false,
  googleCalendarOauthPassed: false,
  googleCalendarSyncVerified: false,
  storageSignedUrlTestsPassed: false,
  storageUploadDownloadVerified: false,
  resendEmailSandboxPassed: false,
  twilioSmsSandboxPassed: false,
  expoPushSandboxPassed: false,
  sentryCaptureVerified: false,
  authSessionFixturesPassed: false,
  rateLimitStoreTestsPassed: false,
  rawBodySignatureFixturesCommitted: false,
  replayIdempotencyFixturesCommitted: false,
  redactedProviderArtifactsRetained: true,
  ciProviderContractJobPassed: false
});
