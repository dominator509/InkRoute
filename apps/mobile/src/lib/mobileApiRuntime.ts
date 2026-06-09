import { buildMobileApiRuntimeReadinessPlan } from "@inkroute/mobile-support";

export type MobileApiRuntimeStatus =
  | "wired"
  | "auth-gated"
  | "screen-gated"
  | "offline-gated"
  | "device-gated"
  | "ci-gated";

export interface MobileApiRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: MobileApiRuntimeStatus;
}

export const mobileApiRuntimeCommands = [
  "pnpm --filter @inkroute/mobile-support typecheck",
  "pnpm --filter @inkroute/mobile-support test",
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "Expo iOS/Android mobile API smoke tests",
  "offline reconnect/replay mobile test",
] as const;

export const mobileApiDomains = [
  "bookings",
  "appointments",
  "clients",
  "travel",
  "portfolio",
  "notifications",
  "releases",
] as const;

export const mobileApiArtifactPaths = [
  "coverage/mobile-api-runtime.json",
  "coverage/mobile-api-support-typecheck.txt",
  "coverage/mobile-api-support-test.txt",
  "coverage/mobile-api-app-typecheck.txt",
  "coverage/mobile-api-app-test.txt",
  "coverage/mobile-api-client-contract.json",
  "coverage/mobile-api-provider-token-exchange-redacted.json",
  "coverage/mobile-api-screen-domain-matrix.json",
  "coverage/mobile-api-static-data-replacement.json",
  "coverage/mobile-api-seeded-smoke.json",
  "coverage/mobile-api-expired-auth-denial.json",
  "coverage/mobile-api-cross-tenant-denial.json",
  "coverage/mobile-api-offline-idempotency.json",
  "coverage/mobile-api-offline-replay.json",
  "coverage/mobile-api-ios-android-smoke-redacted.json",
  "coverage/mobile-api-secret-safe-artifacts.json",
  "test-results/mobile-api-runtime",
] as const;

export const mobileApiRuntimeMatrix = [
  {
    id: "mobile-support-typecheck",
    command: "pnpm --filter @inkroute/mobile-support typecheck",
    artifact: "coverage/mobile-api-support-typecheck.txt",
    status: "wired",
  },
  {
    id: "mobile-support-tests",
    command: "pnpm --filter @inkroute/mobile-support test",
    artifact: "coverage/mobile-api-support-test.txt",
    status: "wired",
  },
  {
    id: "mobile-app-typecheck-test",
    command: "pnpm --filter @inkroute/mobile typecheck && pnpm --filter @inkroute/mobile test",
    artifact: "coverage/mobile-api-app-test.txt",
    status: "device-gated",
  },
  {
    id: "typed-api-client",
    command: "verify auth, tenant, request-id, idempotency, envelope, and redaction client contract",
    artifact: "coverage/mobile-api-client-contract.json",
    status: "wired",
  },
  {
    id: "provider-token-exchange",
    command: "provider login/token exchange mobile API tests",
    artifact: "coverage/mobile-api-provider-token-exchange-redacted.json",
    status: "auth-gated",
  },
  {
    id: "screen-domain-matrix",
    command: "verify screen loaders/actions for bookings, appointments, clients, travel, portfolio, notifications, and releases",
    artifact: "coverage/mobile-api-screen-domain-matrix.json",
    status: "screen-gated",
  },
  {
    id: "static-data-replacement",
    command: "replace static demo arrays after seeded API smoke",
    artifact: "coverage/mobile-api-static-data-replacement.json",
    status: "screen-gated",
  },
  {
    id: "seeded-api-smoke",
    command: "Expo iOS/Android mobile API smoke tests",
    artifact: "coverage/mobile-api-seeded-smoke.json",
    status: "device-gated",
  },
  {
    id: "expired-cross-tenant-denial",
    command: "expired-auth denial and cross-tenant denial mobile API tests",
    artifact: "coverage/mobile-api-cross-tenant-denial.json",
    status: "auth-gated",
  },
  {
    id: "offline-idempotent-replay",
    command: "offline reconnect/replay mobile test",
    artifact: "coverage/mobile-api-offline-replay.json",
    status: "offline-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions mobile API evidence job",
    artifact: "coverage/mobile-api-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly MobileApiRuntimeMatrixEntry[];

export const mobileApiRuntimeReadiness = buildMobileApiRuntimeReadinessPlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  mobileSupportTestsPassed: false,
  mobileSupportTypecheckPassed: false,
  mobileAppTypecheckPassed: false,
  mobileAppTestsPassed: false,
  apiClientImplemented: true,
  authHeadersWired: true,
  requestIdMiddlewareConfigured: true,
  tenantScopeHeaderConfigured: true,
  responseEnvelopeValidationConfigured: true,
  safeErrorRedactionConfigured: true,
  offlineRetryQueueConfigured: false,
  idempotencyPersistenceConfigured: false,
  seededApiSmokePassed: false,
  expiredAuthFailsSafelyTested: false,
  crossTenantDenialTested: false,
  offlineReplayTested: false,
  screensUsingApiClient: [...mobileApiDomains],
});
