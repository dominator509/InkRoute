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
  "coverage/google-calendar-sync-secret-safe-artifacts.json",
  "test-results/google-calendar-sync-runtime",
] as const;

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
  pushWebhookHandlerImplemented: false,
  retryBackoffConfigured: true,
  idempotencyStoreConfigured: true,
  calendarAuditLogPersistenceConfigured: true,
  tenantIsolationTestsPassed: false,
  googleTestCalendarEvidenceAttached: false,
});
