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

export interface ProviderContractRunPersistenceInput {
  tenantId: string;
  runId: string;
  commitSha?: string | null;
  status: "blocked" | "running" | "passed" | "failed" | "provider_gated";
  runtimeMatrix: readonly ProviderContractRuntimeMatrixEntry[];
  artifactManifest: readonly string[];
  staticWebhookContractsPassed: boolean;
  providerManifestVerified: boolean;
  rawBodyFixturesCommitted: boolean;
  replayIdempotencyFixturesCommitted: boolean;
  stripeCliWebhookPassed: boolean;
  stripeIdempotencyVerified: boolean;
  googleCalendarOauthPassed: boolean;
  googleCalendarSyncVerified: boolean;
  storageSignedUrlPassed: boolean;
  storageUploadDownloadPassed: boolean;
  resendSandboxPassed: boolean;
  twilioSandboxPassed: boolean;
  expoPushSandboxPassed: boolean;
  sentryCaptureVerified: boolean;
  authSessionFixturesPassed: boolean;
  rateLimitStorePassed: boolean;
  redactedArtifactsRetained: boolean;
  ciProviderContractPassed: boolean;
  ciRunUrl?: string | null;
}

export interface ProviderContractRunPersistenceContract {
  modelName: "ProviderContractRun";
  row: ProviderContractRunPersistenceInput;
  transactionWrites: readonly ["ProviderContractRun", "AuditLog"];
  requiredProviderFlags: readonly [
    "staticWebhookContractsPassed",
    "providerManifestVerified",
    "rawBodyFixturesCommitted",
    "replayIdempotencyFixturesCommitted",
    "stripeCliWebhookPassed",
    "stripeIdempotencyVerified",
    "googleCalendarOauthPassed",
    "googleCalendarSyncVerified",
    "storageSignedUrlPassed",
    "storageUploadDownloadPassed",
    "resendSandboxPassed",
    "twilioSandboxPassed",
    "expoPushSandboxPassed",
    "sentryCaptureVerified",
    "authSessionFixturesPassed",
    "rateLimitStorePassed",
    "redactedArtifactsRetained",
    "ciProviderContractPassed",
  ];
  artifactFields: readonly ["runtimeMatrix", "artifactManifest"];
  tenantIsolationKey: "tenantId";
}

export type ProviderContractRunData = ProviderContractRunPersistenceInput & {
  commitSha: string | null;
  ciRunUrl: string | null;
};

export interface ProviderContractRunRepository {
  readonly providerContractRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: ProviderContractRunData;
      update: ProviderContractRunData;
    }): unknown;
  };
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

export const providerContractRuntimeProofFiles = [
  "apps/web/lib/providerContractRuntime.ts",
  "apps/web/tests/provider-contract-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609013000_add_provider_contract_runs/migration.sql",
  "testing/manifests/provider-test-plan.json",
  "apps/web/tests/provider-webhook-contracts.test.ts",
  "packages/testing/src/index.ts",
  "packages/testing/tests/testing-manifest.test.ts",
  "testing/manifests/unit-test-manifest.json",
  "testing/scripts/verify-test-manifest.mjs",
  ".github/workflows/ci.yml",
] as const;

export const providerContractRuntimeCommands = [
  "pnpm vitest run apps/web/tests/provider-webhook-contracts.test.ts",
  "pnpm test:manifest",
  "commit signed raw-body and replay/idempotency fixtures for Stripe, email, SMS, and Sentry",
  "stripe listen --forward-to localhost:3000/api/webhooks/stripe && stripe trigger checkout.session.completed",
  "run Google Calendar OAuth, freebusy, sync-token, conflict, and disconnect sandbox flows",
  "run storage signed URL, upload/download, private-original, public-derivative, and scan-approved read contracts",
  "run Resend, Twilio, Expo Push, and Sentry sandbox send/capture contracts",
  "run auth session fixture and distributed rate-limit store contract tests",
  "GitHub Actions provider-contract job"
] as const;

export const providerContractRuntimeLocalCommands = providerContractRuntimeCommands.slice(0, 2);
export const providerContractRuntimeExternalCommands = providerContractRuntimeCommands.slice(2);

export const providerContractRuntimeRequiredExternalEvidence = [
  "Signed raw-body and replay/idempotency fixture proof",
  "Stripe CLI webhook/idempotency proof",
  "Google Calendar OAuth/sync proof",
  "Storage signed URL/upload/download proof",
  "Resend, Twilio, Expo Push, and Sentry sandbox proof",
  "Auth session and distributed rate-limit store proof",
  "CI provider-contract proof",
  "Provider-backed ProviderContractRun persistence proof",
] as const;

export type ProviderContractRuntimeArtifact = (typeof providerContractRuntimeArtifactPaths)[number];

export type ProviderContractRuntimeCommand = (typeof providerContractRuntimeCommands)[number];

export const providerContractRuntimeLocalArtifacts = [
  "coverage/provider-contract-runtime.json",
  "coverage/provider-contract-static-suite.json",
  "coverage/provider-contract-manifest-check.json",
  "test-results/provider-contract-runtime",
] as const satisfies readonly ProviderContractRuntimeArtifact[];

export const providerContractRuntimeExternalArtifacts = [
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
] as const satisfies readonly ProviderContractRuntimeArtifact[];

export type ProviderContractRuntimeExecutionPolicy = {
  localStaticManifestOnly: true;
  fixtureCommitRequiresExternalEvidence: true;
  stripeCliRequiresExternalEvidence: true;
  calendarSandboxRequiresExternalEvidence: true;
  storageSandboxRequiresExternalEvidence: true;
  messagingSandboxRequiresExternalEvidence: true;
  authRateLimitSandboxRequiresExternalEvidence: true;
  ciProviderRequiresExternalEvidence: true;
  persistenceRequiresExternalEvidence: true;
  externalEvidenceRequired: typeof providerContractRuntimeRequiredExternalEvidence;
};

export type ProviderContractRuntimeEvidenceInput = {
  staticWebhookContractsPassed: boolean;
  providerManifestVerified: boolean;
  rawBodyFixturesCommitted: boolean;
  replayIdempotencyFixturesCommitted: boolean;
  stripeCliWebhookPassed: boolean;
  stripeIdempotencyVerified: boolean;
  googleCalendarOauthPassed: boolean;
  googleCalendarSyncVerified: boolean;
  storageSignedUrlPassed: boolean;
  storageUploadDownloadPassed: boolean;
  resendSandboxPassed: boolean;
  twilioSandboxPassed: boolean;
  expoPushSandboxPassed: boolean;
  sentryCaptureVerified: boolean;
  authSessionFixturesPassed: boolean;
  rateLimitStorePassed: boolean;
  redactedArtifactsRetained: boolean;
  ciProviderContractPassed: boolean;
  requiredCommandsRun: readonly ProviderContractRuntimeCommand[];
  capturedArtifacts: readonly ProviderContractRuntimeArtifact[];
};

export type ProviderContractRuntimeEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: ProviderContractRuntimeArtifact[];
  requiredCommands: typeof providerContractRuntimeCommands;
  requiredEvidence: typeof providerContractRuntimeArtifactPaths;
  providerPolicy: {
    rawSecretsForbidden: true;
    signedRawBodyFixturesRequired: true;
    sandboxArtifactsRedacted: true;
  };
};

export type ProviderContractRuntimeExecutionPlan = {
  status: "local-plan-ready";
  policy: ProviderContractRuntimeExecutionPolicy;
  externalEvidenceRequired: typeof providerContractRuntimeRequiredExternalEvidence;
  fixtureCommitExecutionAllowed: false;
  stripeCliExecutionAllowed: false;
  calendarSandboxExecutionAllowed: false;
  storageSandboxExecutionAllowed: false;
  messagingSandboxExecutionAllowed: false;
  authRateLimitSandboxExecutionAllowed: false;
  ciProviderExecutionAllowed: false;
  persistenceExecutionAllowed: false;
  localCommands: typeof providerContractRuntimeLocalCommands;
  externalCommands: typeof providerContractRuntimeExternalCommands;
  localArtifacts: typeof providerContractRuntimeLocalArtifacts;
  externalArtifacts: typeof providerContractRuntimeExternalArtifacts;
  disabledReasons: readonly string[];
};

export const providerContractRuntimeExecutionPolicy: ProviderContractRuntimeExecutionPolicy = {
  localStaticManifestOnly: true,
  fixtureCommitRequiresExternalEvidence: true,
  stripeCliRequiresExternalEvidence: true,
  calendarSandboxRequiresExternalEvidence: true,
  storageSandboxRequiresExternalEvidence: true,
  messagingSandboxRequiresExternalEvidence: true,
  authRateLimitSandboxRequiresExternalEvidence: true,
  ciProviderRequiresExternalEvidence: true,
  persistenceRequiresExternalEvidence: true,
  externalEvidenceRequired: providerContractRuntimeRequiredExternalEvidence,
};

export type ProviderContractRuntimeArtifactReview = {
  status: "redacted-review-ready";
  redactedArtifact: unknown;
  requiredArtifacts: typeof providerContractRuntimeArtifactPaths;
  retainedExternalGates: readonly string[];
};

const providerContractSensitivePatterns = [
  /(run[_-]?id['":=\s]+)[^"',\s}]+/gi,
  /(commit[_-]?sha['":=\s]+)[^"',\s}]+/gi,
  /(ci[_-]?run[_-]?url['":=\s]+)[^"',\s}]+/gi,
  /(stripe[_-]?(?:secret|signature|webhook|token)['":=\s]+)[^"',\s}]+/gi,
  /(google[_-]?(?:access|refresh)?[_-]?token['":=\s]+)[^"',\s}]+/gi,
  /(twilio[_-]?(?:auth|token|sid)['":=\s]+)[^"',\s}]+/gi,
  /(expo[_-]?push[_-]?token['":=\s]+)[^"',\s}]+/gi,
  /(sentry[_-]?(?:dsn|event[_-]?id)['":=\s]+)[^"',\s}]+/gi,
  /(authorization:\s*bearer\s+)[A-Za-z0-9._-]+/gi,
  /(token['":=\s]+)[^"',\s}]+/gi,
  /(secret['":=\s]+)[^"',\s}]+/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
] as const;

export function buildRedactedProviderContractArtifact(value: unknown): unknown {
  if (typeof value === "string") {
    return providerContractSensitivePatterns.reduce(
      (redacted, pattern) => redacted.replace(pattern, (_match, prefix: string | undefined) => `${prefix ?? ""}[REDACTED]`),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => buildRedactedProviderContractArtifact(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /email|phone|token|secret|authorization|credential|password|rawBody|rawPayload|signature|webhook|providerPayload|sandboxTranscript|ciRunUrl|commitSha|runId|stripe|google|twilio|expo|sentry/i.test(key)
          ? "[REDACTED]"
          : buildRedactedProviderContractArtifact(entry),
      ]),
    );
  }

  return value;
}

export function buildProviderContractRuntimeExecutionPlan(): ProviderContractRuntimeExecutionPlan {
  return {
    status: "local-plan-ready",
    policy: providerContractRuntimeExecutionPolicy,
    externalEvidenceRequired: providerContractRuntimeRequiredExternalEvidence,
    fixtureCommitExecutionAllowed: false,
    stripeCliExecutionAllowed: false,
    calendarSandboxExecutionAllowed: false,
    storageSandboxExecutionAllowed: false,
    messagingSandboxExecutionAllowed: false,
    authRateLimitSandboxExecutionAllowed: false,
    ciProviderExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    localCommands: providerContractRuntimeLocalCommands,
    externalCommands: providerContractRuntimeExternalCommands,
    localArtifacts: providerContractRuntimeLocalArtifacts,
    externalArtifacts: providerContractRuntimeExternalArtifacts,
    disabledReasons: [
      "Signed raw-body and replay/idempotency fixture proof requires committed sanitized fixtures.",
      "Stripe CLI webhook/idempotency proof requires Stripe sandbox execution.",
      "Google Calendar OAuth/sync proof requires Google sandbox credentials.",
      "Storage signed URL/upload/download proof requires storage sandbox credentials.",
      "Resend, Twilio, Expo Push, and Sentry proof requires provider sandbox execution.",
      "Auth session and distributed rate-limit store proof requires provider-backed fixtures.",
      "ProviderContractRun persistence proof requires provider-backed database execution.",
    ],
  };
}

export function buildProviderContractRuntimeArtifactReview(rawArtifact: unknown): ProviderContractRuntimeArtifactReview {
  return {
    status: "redacted-review-ready",
    redactedArtifact: buildRedactedProviderContractArtifact(rawArtifact),
    requiredArtifacts: providerContractRuntimeArtifactPaths,
    retainedExternalGates: [
      "Signed raw-body and replay/idempotency fixture proof",
      "Stripe CLI webhook/idempotency proof",
      "Google Calendar OAuth/sync sandbox proof",
      "Storage signed URL/upload/download proof",
      "Email/SMS/Expo Push/Sentry sandbox proof",
      "Auth session and distributed rate-limit store proof",
      "CI provider-contract job proof",
      "Provider-backed ProviderContractRun persistence proof",
    ],
  };
}

export function buildProviderContractRuntimeEvidenceDecision(
  input: ProviderContractRuntimeEvidenceInput,
): ProviderContractRuntimeEvidenceDecision {
  const blockers = [
    !input.rawBodyFixturesCommitted && "Commit signed raw-body fixtures.",
    !input.replayIdempotencyFixturesCommitted && "Commit replay/idempotency fixtures.",
    !input.stripeCliWebhookPassed && "Run Stripe CLI webhook proof.",
    !input.stripeIdempotencyVerified && "Verify Stripe idempotency behavior.",
    !input.googleCalendarOauthPassed && "Run Google Calendar OAuth sandbox proof.",
    !input.storageSignedUrlPassed && "Run storage signed URL proof.",
    !input.resendSandboxPassed && "Run Resend sandbox send proof.",
    !input.twilioSandboxPassed && "Run Twilio sandbox send proof.",
    !input.sentryCaptureVerified && "Verify Sentry capture proof.",
    !input.ciProviderContractPassed && "Capture CI provider-contract job proof.",
  ].filter(Boolean) as string[];

  const missingArtifacts = providerContractRuntimeArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const requiredCommandChecks = [
    {
      command: "stripe listen --forward-to localhost:3000/api/webhooks/stripe",
      required:
        !input.stripeCliWebhookPassed ||
        !input.stripeIdempotencyVerified,
    },
    {
      command: "provider sandbox contract suite for calendar/storage/email/sms/push/sentry/auth/rate-limit",
      required:
        !input.googleCalendarOauthPassed ||
        !input.storageSignedUrlPassed ||
        !input.resendSandboxPassed ||
        !input.twilioSandboxPassed ||
        !input.expoPushSandboxPassed ||
        !input.sentryCaptureVerified ||
        !input.authSessionFixturesPassed ||
        !input.rateLimitStorePassed,
    },
  ];
  const missingCommands = providerContractRuntimeCommands.filter((command) => !input.requiredCommandsRun.includes(command));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
      ...requiredCommandChecks
        .filter((entry) => entry.required)
        .map((entry) => `Required command not recorded: ${entry.command}`),
    ],
    missingArtifacts,
    requiredCommands: providerContractRuntimeCommands,
    requiredEvidence: providerContractRuntimeArtifactPaths,
    providerPolicy: {
      rawSecretsForbidden: true,
      signedRawBodyFixturesRequired: true,
      sandboxArtifactsRedacted: true,
    },
  };
}

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

export function buildProviderContractRunPersistenceContract(
  input: ProviderContractRunPersistenceInput,
): ProviderContractRunPersistenceContract {
  return {
    modelName: "ProviderContractRun",
    row: input,
    transactionWrites: ["ProviderContractRun", "AuditLog"],
    requiredProviderFlags: [
      "staticWebhookContractsPassed",
      "providerManifestVerified",
      "rawBodyFixturesCommitted",
      "replayIdempotencyFixturesCommitted",
      "stripeCliWebhookPassed",
      "stripeIdempotencyVerified",
      "googleCalendarOauthPassed",
      "googleCalendarSyncVerified",
      "storageSignedUrlPassed",
      "storageUploadDownloadPassed",
      "resendSandboxPassed",
      "twilioSandboxPassed",
      "expoPushSandboxPassed",
      "sentryCaptureVerified",
      "authSessionFixturesPassed",
      "rateLimitStorePassed",
      "redactedArtifactsRetained",
      "ciProviderContractPassed",
    ],
    artifactFields: ["runtimeMatrix", "artifactManifest"],
    tenantIsolationKey: "tenantId",
  };
}

export function buildProviderContractRunData(input: ProviderContractRunPersistenceInput): ProviderContractRunData {
  return {
    ...input,
    commitSha: input.commitSha ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export function persistProviderContractRun(
  repository: ProviderContractRunRepository,
  input: ProviderContractRunPersistenceInput,
): unknown {
  const data = buildProviderContractRunData(input);

  return repository.providerContractRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update: data,
  });
}

const providerContractRuntimeReadinessBlockers = [
  "Stripe CLI signed webhook replay must pass against the local or preview webhook route.",
  "Google Calendar freebusy, sync-token, conflict, insert/update/delete, and disconnect flows must be verified.",
  "Signed raw-body fixtures must be committed for Stripe, email, SMS, and Sentry webhook verification.",
  "CI provider-contract job must pass or publish credential-gated skip evidence and retained artifacts.",
  "Required command not recorded: stripe listen --forward-to localhost:3000/api/webhooks/stripe",
  "Required command not recorded: provider sandbox contract suite for calendar/storage/email/sms/push/sentry/auth/rate-limit",
  "Required command not recorded: GitHub Actions provider-contract job",
];

export const providerContractRuntimeReadiness = {
  status: "blocked",
  missingScripts: [],
  requiredCommands: providerContractRuntimeCommands,
  requiredEvidence: [
    "static provider contract suite, manifest verification, signed raw-body fixtures, and replay/idempotency fixtures",
    "Stripe CLI webhook/idempotency and Google Calendar OAuth/sync sandbox transcripts",
    "storage signed URL/upload/download, rate-limit store, and auth session fixture contract output",
    "email, SMS, push, and Sentry sandbox send/capture artifacts",
    "redacted provider artifact bundle and CI provider-contract job evidence",
  ] as const,
  blockers: providerContractRuntimeReadinessBlockers,
};

export const providerContractRunPersistencePreview = buildProviderContractRunPersistenceContract({
  tenantId: "tenant_demo",
  runId: "provider-contract-demo",
  status: "provider_gated",
  runtimeMatrix: providerContractRuntimeMatrix,
  artifactManifest: providerContractRuntimeArtifactPaths,
  staticWebhookContractsPassed: false,
  providerManifestVerified: true,
  rawBodyFixturesCommitted: false,
  replayIdempotencyFixturesCommitted: false,
  stripeCliWebhookPassed: false,
  stripeIdempotencyVerified: false,
  googleCalendarOauthPassed: false,
  googleCalendarSyncVerified: false,
  storageSignedUrlPassed: false,
  storageUploadDownloadPassed: false,
  resendSandboxPassed: false,
  twilioSandboxPassed: false,
  expoPushSandboxPassed: false,
  sentryCaptureVerified: false,
  authSessionFixturesPassed: false,
  rateLimitStorePassed: false,
  redactedArtifactsRetained: true,
  ciProviderContractPassed: false,
});

