import { buildGoogleCalendarRuntimeReadinessPlan } from "@inkroute/calendar";

export type GoogleCalendarSyncRuntimeStatus =
  | "wired"
  | "sdk-gated"
  | "oauth-gated"
  | "token-gated"
  | "worker-gated"
  | "smoke-gated"
  | "push-gated"
  | "isolation-gated"
  | "ci-gated";

export interface GoogleCalendarSyncRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: GoogleCalendarSyncRuntimeStatus;
}

export const googleCalendarSyncRuntimeCommands = [
  "pnpm --filter @inkroute/calendar typecheck",
  "pnpm --filter @inkroute/calendar test",
  "Google OAuth callback smoke test",
  "Google FreeBusy test-calendar smoke",
  "Google event insert/update/delete smoke",
  "Google invalid sync-token full-resync smoke",
  "Google push channel renewal/webhook smoke",
] as const;

export const googleCalendarSyncArtifactPaths = [
  "coverage/google-calendar-sync-runtime.json",
  "coverage/google-calendar-sync-calendar-typecheck.txt",
  "coverage/google-calendar-sync-calendar-test.txt",
  "coverage/google-calendar-sync-sdk-client-redacted.json",
  "coverage/google-calendar-sync-oauth-app-redacted.json",
  "coverage/google-calendar-sync-oauth-callback-redacted.json",
  "coverage/google-calendar-sync-scopes.json",
  "coverage/google-calendar-sync-encrypted-token-repository.json",
  "coverage/google-calendar-sync-provider-worker.json",
  "coverage/google-calendar-sync-freebusy-smoke-redacted.json",
  "coverage/google-calendar-sync-event-crud-smoke-redacted.json",
  "coverage/google-calendar-sync-full-incremental-sync.json",
  "coverage/google-calendar-sync-invalid-token-recovery.json",
  "coverage/google-calendar-sync-push-renewal.json",
  "coverage/google-calendar-sync-push-webhook.json",
  "coverage/google-calendar-sync-retry-backoff.json",
  "coverage/google-calendar-sync-idempotency.json",
  "coverage/google-calendar-sync-audit-log.json",
  "coverage/google-calendar-sync-tenant-isolation.json",
  "coverage/google-calendar-sync-test-calendar-artifacts-redacted.json",
  "coverage/google-calendar-sync-run-persistence.json",
  "coverage/google-calendar-sync-secret-safe-artifacts.json",
  "test-results/google-calendar-sync-runtime",
] as const;

export const googleCalendarSyncRuntimeProofFiles = [
  "packages/calendar/package.json",
  "packages/calendar/src/index.ts",
  "packages/calendar/tests/availability-conflicts.test.ts",
  "apps/dashboard/lib/googleCalendarSync.ts",
  "apps/dashboard/lib/googleCalendarSyncRuntime.ts",
  "apps/dashboard/app/api/calendar/google-sync/route.ts",
  "apps/web/app/api/webhooks/calendar/route.ts",
  "apps/dashboard/app/api/calendar/route.ts",
  "apps/dashboard/tests/google-calendar-sync-static.test.ts",
  "apps/dashboard/tests/google-calendar-sync-runtime-static.test.ts",
  "apps/dashboard/tests/calendar-read-route-static.test.ts",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export type GoogleCalendarSyncEvidenceArtifact = (typeof googleCalendarSyncArtifactPaths)[number];

export interface GoogleCalendarSyncSurfaceContractEntry {
  readonly surfaceId: string;
  readonly requiredCommand:
    | (typeof googleCalendarSyncRuntimeCommands)[number]
    | (typeof googleCalendarSyncExternalCommands)[number]
    | "execute encrypted Google provider-token repository writes"
    | "execute real Google Calendar provider worker operations"
    | "GitHub Actions Google Calendar sync evidence job";
  readonly requiredArtifact: GoogleCalendarSyncEvidenceArtifact;
  readonly providerBoundary:
    | "sdk"
    | "oauth"
    | "encrypted-token"
    | "provider-worker"
    | "freebusy"
    | "event-crud"
    | "sync-recovery"
    | "push-webhook"
    | "tenant-isolation"
    | "ci-proof";
  readonly googleProviderEvidenceRequired: boolean;
  readonly redactedArtifactRequired: true;
}

export const googleCalendarSyncSurfaceContract: readonly GoogleCalendarSyncSurfaceContractEntry[] = [
  {
    surfaceId: "google-sdk-client",
    requiredCommand: "pnpm --filter @inkroute/calendar typecheck",
    requiredArtifact: "coverage/google-calendar-sync-sdk-client-redacted.json",
    providerBoundary: "sdk",
    googleProviderEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "oauth-callback",
    requiredCommand: "Google OAuth callback smoke test",
    requiredArtifact: "coverage/google-calendar-sync-oauth-callback-redacted.json",
    providerBoundary: "oauth",
    googleProviderEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "encrypted-token-repository",
    requiredCommand: "execute encrypted Google provider-token repository writes",
    requiredArtifact: "coverage/google-calendar-sync-encrypted-token-repository.json",
    providerBoundary: "encrypted-token",
    googleProviderEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "provider-worker",
    requiredCommand: "execute real Google Calendar provider worker operations",
    requiredArtifact: "coverage/google-calendar-sync-provider-worker.json",
    providerBoundary: "provider-worker",
    googleProviderEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "freebusy-smoke",
    requiredCommand: "Google FreeBusy test-calendar smoke",
    requiredArtifact: "coverage/google-calendar-sync-freebusy-smoke-redacted.json",
    providerBoundary: "freebusy",
    googleProviderEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "event-crud-smoke",
    requiredCommand: "Google event insert/update/delete smoke",
    requiredArtifact: "coverage/google-calendar-sync-event-crud-smoke-redacted.json",
    providerBoundary: "event-crud",
    googleProviderEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "invalid-sync-token-recovery",
    requiredCommand: "Google invalid sync-token full-resync smoke",
    requiredArtifact: "coverage/google-calendar-sync-invalid-token-recovery.json",
    providerBoundary: "sync-recovery",
    googleProviderEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "push-renewal-webhook",
    requiredCommand: "Google push channel renewal/webhook smoke",
    requiredArtifact: "coverage/google-calendar-sync-push-webhook.json",
    providerBoundary: "push-webhook",
    googleProviderEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "tenant-isolation",
    requiredCommand: "tenant-isolation evidence",
    requiredArtifact: "coverage/google-calendar-sync-tenant-isolation.json",
    providerBoundary: "tenant-isolation",
    googleProviderEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "ci-secret-safe-artifacts",
    requiredCommand: "GitHub Actions Google Calendar sync evidence job",
    requiredArtifact: "coverage/google-calendar-sync-secret-safe-artifacts.json",
    providerBoundary: "ci-proof",
    googleProviderEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
] as const;

export interface GoogleCalendarSyncExecutionPolicy {
  readonly codexMayClassifyStaticGoogleCalendarSyncReadiness: true;
  readonly googleSdkClientRequiredForClosure: true;
  readonly oauthProviderRequiredForClosure: true;
  readonly encryptedTokenPersistenceRequiredForClosure: true;
  readonly providerWorkerRequiredForClosure: true;
  readonly pushWebhookRequiredForClosure: true;
  readonly googleTestCalendarRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface GoogleCalendarSyncExecutionPlan {
  readonly policy: typeof googleCalendarSyncExecutionPolicy;
  readonly surfaceContract: typeof googleCalendarSyncSurfaceContract;
  readonly commandExecutionAllowed: false;
  readonly googleProviderExecutionAllowed: false;
  readonly oauthExecutionAllowed: false;
  readonly encryptedTokenExecutionAllowed: false;
  readonly pushWebhookExecutionAllowed: false;
  readonly tenantIsolationExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly localCommands: typeof googleCalendarSyncLocalCommands;
  readonly externalCommands: typeof googleCalendarSyncExternalCommands;
  readonly requiredExternalEvidence: typeof googleCalendarSyncRequiredExternalEvidence;
}

export interface GoogleCalendarSyncArtifactReview {
  readonly artifact: unknown;
  readonly redactedArtifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: boolean;
  readonly requiredExternalEvidence: typeof googleCalendarSyncRequiredExternalEvidence;
}

export interface GoogleCalendarSyncRunPersistencePacket {
  readonly runModel: "GoogleCalendarSyncRun";
  readonly requiredArtifact: "coverage/google-calendar-sync-run-persistence.json";
  readonly providerBackedPersistenceRequired: true;
  readonly localPersistenceExecutionAllowed: false;
  readonly encryptedTokenEvidenceRequired: true;
  readonly tenantIsolationEvidenceRequired: true;
  readonly calendarAuditLogEvidenceRequired: true;
  readonly redactionRequired: true;
  readonly requiredCommands: typeof googleCalendarSyncRuntimeCommands;
  readonly requiredExternalEvidence: typeof googleCalendarSyncRequiredExternalEvidence;
}

export interface GoogleCalendarSyncEvidenceInput {
  readonly calendarTypecheckPassed: boolean;
  readonly calendarTestsPassed: boolean;
  readonly sdkClientVerified: boolean;
  readonly oauthAppVerified: boolean;
  readonly oauthCallbackSmokePassed: boolean;
  readonly requiredScopesVerified: boolean;
  readonly encryptedTokenRepositoryVerified: boolean;
  readonly providerWorkerVerified: boolean;
  readonly freebusySmokePassed: boolean;
  readonly eventCrudSmokePassed: boolean;
  readonly fullIncrementalSyncVerified: boolean;
  readonly invalidTokenRecoveryVerified: boolean;
  readonly pushRenewalVerified: boolean;
  readonly pushWebhookVerified: boolean;
  readonly retryBackoffVerified: boolean;
  readonly idempotencyStoreVerified: boolean;
  readonly calendarAuditLogVerified: boolean;
  readonly tenantIsolationVerified: boolean;
  readonly googleTestCalendarArtifactsCaptured: boolean;
  readonly googleCalendarSyncRunPersistenceVerified: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly GoogleCalendarSyncEvidenceArtifact[];
}

export interface GoogleCalendarSyncEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly GoogleCalendarSyncEvidenceArtifact[];
  readonly requiredCommands: typeof googleCalendarSyncRuntimeCommands;
  readonly requiredEvidence: typeof googleCalendarSyncDecisionRequiredEvidence;
  readonly redactedSummary: {
    readonly capturedArtifactCount: number;
    readonly requiredArtifactCount: number;
  };
}

export const googleCalendarSyncExecutionPolicy = {
  codexMayClassifyStaticGoogleCalendarSyncReadiness: true,
  googleSdkClientRequiredForClosure: true,
  oauthProviderRequiredForClosure: true,
  encryptedTokenPersistenceRequiredForClosure: true,
  providerWorkerRequiredForClosure: true,
  pushWebhookRequiredForClosure: true,
  googleTestCalendarRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies GoogleCalendarSyncExecutionPolicy;

export const googleCalendarSyncRequiredExternalEvidence = [
  "Google SDK/client dependency proof",
  "Google OAuth app/callback smoke evidence",
  "encrypted token persistence proof",
  "Google provider worker execution proof",
  "Google FreeBusy test-calendar smoke",
  "Google event insert/update/delete smoke",
  "Google invalid sync-token full-resync smoke",
  "Google push channel renewal/webhook smoke",
  "tenant-isolation evidence",
  "provider-backed GoogleCalendarSyncRun persistence packet",
  "CI Google Calendar sync evidence",
  "secret-safe Google Calendar sync artifact review",
] as const;

export const googleCalendarSyncDecisionRequiredEvidence = [
  "Google SDK/client setup plus OAuth app, scopes, and callback route evidence",
  "encrypted provider-token repository and real provider-worker execution evidence",
  "Google test calendar FreeBusy and event insert/update/delete smoke-test output",
  "full/incremental sync, invalid-token recovery, push renewal, and webhook evidence",
  "retry/idempotency, tenant-isolation, and Google test-calendar artifact evidence",
  "provider-backed GoogleCalendarSyncRun persistence packet with encrypted-token, audit-log, and tenant-isolation proof",
  "secret-safe review of retained Google Calendar sync artifacts",
] as const;

export const googleCalendarSyncLocalCommands = [
  "pnpm --filter @inkroute/calendar typecheck",
  "pnpm --filter @inkroute/calendar test",
  "pnpm vitest run apps/dashboard/tests/google-calendar-sync-static.test.ts",
  "static local Google sync repository and provider-result sanitizer review",
] as const;

export const googleCalendarSyncExternalCommands = [
  "Google OAuth callback smoke test",
  "Google FreeBusy test-calendar smoke",
  "Google event insert/update/delete smoke",
  "Google invalid sync-token full-resync smoke",
  "Google push channel renewal/webhook smoke",
  "tenant-isolation evidence",
  "GitHub Actions Google Calendar sync evidence job",
] as const;

const sensitiveGoogleCalendarSyncArtifactKey = /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|google|oauth|calendar|freebusy|event|sync|push|channel|webhook|artist|email|phone|medical|payment|customer)/i;

const redactGoogleCalendarSyncArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactGoogleCalendarSyncArtifactValue(entry, `${path}.${index}`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveGoogleCalendarSyncArtifactKey.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, redactGoogleCalendarSyncArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  return value;
};

export const buildGoogleCalendarSyncExecutionPlan = (): GoogleCalendarSyncExecutionPlan => ({
  policy: googleCalendarSyncExecutionPolicy,
  surfaceContract: googleCalendarSyncSurfaceContract,
  commandExecutionAllowed: false,
  googleProviderExecutionAllowed: false,
  oauthExecutionAllowed: false,
  encryptedTokenExecutionAllowed: false,
  pushWebhookExecutionAllowed: false,
  tenantIsolationExecutionAllowed: false,
  ciExecutionAllowed: false,
  localCommands: googleCalendarSyncLocalCommands,
  externalCommands: googleCalendarSyncExternalCommands,
  requiredExternalEvidence: googleCalendarSyncRequiredExternalEvidence,
});

export const buildRedactedGoogleCalendarSyncArtifact = (artifact: unknown): Pick<GoogleCalendarSyncArtifactReview, "redactedArtifact" | "redactedPaths"> => {
  const redactedPaths: string[] = [];
  return {
    redactedArtifact: redactGoogleCalendarSyncArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
  };
};

export const buildGoogleCalendarSyncArtifactReview = (artifact: unknown): GoogleCalendarSyncArtifactReview => {
  const redacted = buildRedactedGoogleCalendarSyncArtifact(artifact);
  return {
    artifact,
    redactedArtifact: redacted.redactedArtifact,
    redactedPaths: redacted.redactedPaths,
    secretSafe: redacted.redactedPaths.length > 0,
    requiredExternalEvidence: googleCalendarSyncRequiredExternalEvidence,
  };
};

export const buildGoogleCalendarSyncRunPersistencePacket = (): GoogleCalendarSyncRunPersistencePacket => ({
  runModel: "GoogleCalendarSyncRun",
  requiredArtifact: "coverage/google-calendar-sync-run-persistence.json",
  providerBackedPersistenceRequired: true,
  localPersistenceExecutionAllowed: false,
  encryptedTokenEvidenceRequired: true,
  tenantIsolationEvidenceRequired: true,
  calendarAuditLogEvidenceRequired: true,
  redactionRequired: true,
  requiredCommands: googleCalendarSyncRuntimeCommands,
  requiredExternalEvidence: googleCalendarSyncRequiredExternalEvidence,
});

export const buildGoogleCalendarSyncEvidenceDecision = (
  input: GoogleCalendarSyncEvidenceInput,
): GoogleCalendarSyncEvidenceDecision => {
  const captured = new Set(input.capturedArtifacts);
  const missingArtifacts = googleCalendarSyncArtifactPaths.filter((artifact) => !captured.has(artifact));
  const blockers = [
    ...(!input.calendarTypecheckPassed ? ["Calendar package typecheck evidence is missing."] : []),
    ...(!input.calendarTestsPassed ? ["Calendar package test evidence is missing."] : []),
    ...(!input.sdkClientVerified ? ["Google Calendar SDK/client evidence is missing."] : []),
    ...(!input.oauthAppVerified ? ["Google OAuth app evidence is missing."] : []),
    ...(!input.oauthCallbackSmokePassed ? ["Google OAuth callback smoke evidence is missing."] : []),
    ...(!input.requiredScopesVerified ? ["Google Calendar required-scope evidence is missing."] : []),
    ...(!input.encryptedTokenRepositoryVerified
      ? ["Encrypted Google provider-token repository evidence is missing."]
      : []),
    ...(!input.providerWorkerVerified ? ["Google provider worker execution evidence is missing."] : []),
    ...(!input.freebusySmokePassed ? ["Google FreeBusy test-calendar smoke evidence is missing."] : []),
    ...(!input.eventCrudSmokePassed ? ["Google event insert/update/delete smoke evidence is missing."] : []),
    ...(!input.fullIncrementalSyncVerified ? ["Google full/incremental sync evidence is missing."] : []),
    ...(!input.invalidTokenRecoveryVerified ? ["Google invalid sync-token recovery evidence is missing."] : []),
    ...(!input.pushRenewalVerified ? ["Google push channel renewal evidence is missing."] : []),
    ...(!input.pushWebhookVerified ? ["Google push webhook handler evidence is missing."] : []),
    ...(!input.retryBackoffVerified ? ["Google provider retry/backoff evidence is missing."] : []),
    ...(!input.idempotencyStoreVerified ? ["Google sync idempotency-store evidence is missing."] : []),
    ...(!input.calendarAuditLogVerified ? ["Google sync CalendarAuditLog evidence is missing."] : []),
    ...(!input.tenantIsolationVerified ? ["Google provider tenant-isolation evidence is missing."] : []),
    ...(!input.googleTestCalendarArtifactsCaptured
      ? ["Redacted Google test-calendar artifact bundle is missing."]
      : []),
    ...(!input.googleCalendarSyncRunPersistenceVerified
      ? ["Provider-backed GoogleCalendarSyncRun persistence packet is missing."]
      : []),
    ...(!input.secretSafeArtifactReviewPassed
      ? ["Secret-safe Google Calendar sync artifact review evidence is missing."]
      : []),
    ...(missingArtifacts.length > 0 ? ["All Google Calendar sync artifacts must be captured."] : []),
  ];

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: googleCalendarSyncRuntimeCommands,
    requiredEvidence: googleCalendarSyncDecisionRequiredEvidence,
    redactedSummary: {
      capturedArtifactCount: captured.size,
      requiredArtifactCount: googleCalendarSyncArtifactPaths.length,
    },
  };
};

export const googleCalendarSyncRuntimeMatrix = [
  {
    id: "calendar-typecheck",
    command: "pnpm --filter @inkroute/calendar typecheck",
    artifact: "coverage/google-calendar-sync-calendar-typecheck.txt",
    status: "wired",
  },
  {
    id: "calendar-tests",
    command: "pnpm --filter @inkroute/calendar test",
    artifact: "coverage/google-calendar-sync-calendar-test.txt",
    status: "wired",
  },
  {
    id: "google-sdk-client",
    command: "install and pin Google Calendar SDK/client dependency",
    artifact: "coverage/google-calendar-sync-sdk-client-redacted.json",
    status: "sdk-gated",
  },
  {
    id: "oauth-app",
    command: "configure Google OAuth app, redirect URI, and client credentials",
    artifact: "coverage/google-calendar-sync-oauth-app-redacted.json",
    status: "oauth-gated",
  },
  {
    id: "oauth-callback",
    command: "Google OAuth callback smoke test",
    artifact: "coverage/google-calendar-sync-oauth-callback-redacted.json",
    status: "oauth-gated",
  },
  {
    id: "required-scopes",
    command: "configure and consent required Google Calendar scopes",
    artifact: "coverage/google-calendar-sync-scopes.json",
    status: "wired",
  },
  {
    id: "encrypted-token-repository",
    command: "execute encrypted Google provider-token repository writes",
    artifact: "coverage/google-calendar-sync-encrypted-token-repository.json",
    status: "token-gated",
  },
  {
    id: "provider-worker",
    command: "execute real Google Calendar provider worker operations",
    artifact: "coverage/google-calendar-sync-provider-worker.json",
    status: "worker-gated",
  },
  {
    id: "freebusy-smoke",
    command: "Google FreeBusy test-calendar smoke",
    artifact: "coverage/google-calendar-sync-freebusy-smoke-redacted.json",
    status: "smoke-gated",
  },
  {
    id: "event-crud-smoke",
    command: "Google event insert/update/delete smoke",
    artifact: "coverage/google-calendar-sync-event-crud-smoke-redacted.json",
    status: "smoke-gated",
  },
  {
    id: "full-incremental-sync",
    command: "full calendar sync plus incremental sync-token persistence test",
    artifact: "coverage/google-calendar-sync-full-incremental-sync.json",
    status: "worker-gated",
  },
  {
    id: "invalid-token-recovery",
    command: "Google invalid sync-token full-resync smoke",
    artifact: "coverage/google-calendar-sync-invalid-token-recovery.json",
    status: "worker-gated",
  },
  {
    id: "push-renewal",
    command: "Google push channel renewal smoke",
    artifact: "coverage/google-calendar-sync-push-renewal.json",
    status: "push-gated",
  },
  {
    id: "push-webhook",
    command: "Google push webhook/channel handler smoke",
    artifact: "coverage/google-calendar-sync-push-webhook.json",
    status: "push-gated",
  },
  {
    id: "retry-backoff",
    command: "Google provider retry/backoff policy test",
    artifact: "coverage/google-calendar-sync-retry-backoff.json",
    status: "wired",
  },
  {
    id: "idempotency-store",
    command: "claim idempotency keys before Google provider calls",
    artifact: "coverage/google-calendar-sync-idempotency.json",
    status: "wired",
  },
  {
    id: "calendar-audit-log",
    command: "persist CalendarAuditLog for every Google provider operation",
    artifact: "coverage/google-calendar-sync-audit-log.json",
    status: "wired",
  },
  {
    id: "tenant-isolation",
    command: "Google provider tenant isolation tests",
    artifact: "coverage/google-calendar-sync-tenant-isolation.json",
    status: "isolation-gated",
  },
  {
    id: "test-calendar-artifacts",
    command: "attach redacted Google test-calendar artifacts for OAuth, freebusy, event sync, push, and recovery",
    artifact: "coverage/google-calendar-sync-test-calendar-artifacts-redacted.json",
    status: "ci-gated",
  },
  {
    id: "run-persistence-packet",
    command: "persist provider-backed GoogleCalendarSyncRun evidence packet",
    artifact: "coverage/google-calendar-sync-run-persistence.json",
    status: "ci-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions Google Calendar sync evidence job",
    artifact: "coverage/google-calendar-sync-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly GoogleCalendarSyncRuntimeMatrixEntry[];

export const googleCalendarSyncRuntimeReadiness = buildGoogleCalendarRuntimeReadinessPlan({
  packageScripts: {
    test: "vitest run",
    typecheck: "tsc --noEmit",
  },
  calendarTestsPassed: false,
  calendarTypecheckPassed: false,
  googleSdkInstalled: false,
  oauthAppConfigured: false,
  oauthCallbackRouteImplemented: true,
  requiredScopesConfigured: true,
  encryptedTokenRepositoryImplemented: true,
  providerWorkerImplemented: true,
  freebusySmokeTested: false,
  eventInsertUpdateDeleteSmokeTested: false,
  fullSyncImplemented: true,
  incrementalSyncTokenPersisted: true,
  invalidSyncTokenFullResyncTested: false,
  pushChannelRenewalImplemented: true,
  pushWebhookHandlerImplemented: true,
  retryBackoffConfigured: true,
  idempotencyStoreConfigured: true,
  calendarAuditLogPersistenceConfigured: true,
  tenantIsolationTestsPassed: false,
  googleTestCalendarEvidenceAttached: false,
});


