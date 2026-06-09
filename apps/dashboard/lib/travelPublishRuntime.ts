import { buildTravelPublishRuntimeReadinessPlan } from "@inkroute/calendar";

export type TravelPublishRuntimeStatus =
  | "wired"
  | "repository-gated"
  | "public-api-gated"
  | "cache-gated"
  | "notification-gated"
  | "sync-gated"
  | "rollback-gated"
  | "tenant-gated"
  | "e2e-gated"
  | "ci-gated";

export interface TravelPublishRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: TravelPublishRuntimeStatus;
}

export const travelPublishRuntimeCommands = [
  "pnpm --filter @inkroute/calendar typecheck",
  "pnpm --filter @inkroute/calendar test",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm vitest run apps/dashboard/tests/travel-publish-static.test.ts",
  "travel publish repository integration tests",
  "Nomad Mode dashboard-to-public E2E smoke",
  "failed-provider rollback tests",
] as const;

export const travelPublishArtifactPaths = [
  "coverage/travel-publish-runtime.json",
  "coverage/travel-publish-calendar-typecheck.txt",
  "coverage/travel-publish-calendar-test.txt",
  "coverage/travel-publish-dashboard-typecheck.txt",
  "coverage/travel-publish-web-typecheck.txt",
  "coverage/travel-publish-static-contract.json",
  "coverage/travel-publish-repository-integration.json",
  "coverage/travel-publish-public-data-api.json",
  "coverage/travel-publish-cache-revalidation.json",
  "coverage/travel-publish-waitlist-matching.json",
  "coverage/travel-publish-notification-provider-redacted.json",
  "coverage/travel-publish-mobile-sync.json",
  "coverage/travel-publish-dashboard-sync.json",
  "coverage/travel-publish-web-sync.json",
  "coverage/travel-publish-audit-log.json",
  "coverage/travel-publish-rollback.json",
  "coverage/travel-publish-tenant-isolation.json",
  "coverage/travel-publish-dashboard-public-e2e-redacted.json",
  "coverage/travel-publish-ci-evidence.json",
  "coverage/travel-publish-secret-safe-artifacts.json",
  "test-results/travel-publish-runtime",
] as const;

export const travelPublishRuntimeMatrix = [
  { id: "calendar-typecheck", command: "pnpm --filter @inkroute/calendar typecheck", artifact: "coverage/travel-publish-calendar-typecheck.txt", status: "wired" },
  { id: "calendar-tests", command: "pnpm --filter @inkroute/calendar test", artifact: "coverage/travel-publish-calendar-test.txt", status: "wired" },
  { id: "dashboard-typecheck", command: "pnpm --filter @inkroute/dashboard typecheck", artifact: "coverage/travel-publish-dashboard-typecheck.txt", status: "wired" },
  { id: "web-typecheck", command: "pnpm --filter @inkroute/web typecheck", artifact: "coverage/travel-publish-web-typecheck.txt", status: "wired" },
  { id: "static-contract", command: "pnpm vitest run apps/dashboard/tests/travel-publish-static.test.ts", artifact: "coverage/travel-publish-static-contract.json", status: "wired" },
  { id: "durable-repository", command: "travel publish repository integration tests", artifact: "coverage/travel-publish-repository-integration.json", status: "repository-gated" },
  { id: "public-data-api", command: "committed public travel data API read tests", artifact: "coverage/travel-publish-public-data-api.json", status: "public-api-gated" },
  { id: "cache-revalidation", command: "post-commit cache/revalidation tests", artifact: "coverage/travel-publish-cache-revalidation.json", status: "cache-gated" },
  { id: "city-waitlist-matching", command: "persisted city waitlist matching tests", artifact: "coverage/travel-publish-waitlist-matching.json", status: "notification-gated" },
  { id: "notification-provider-queue", command: "consent-filtered notification provider queue execution tests", artifact: "coverage/travel-publish-notification-provider-redacted.json", status: "notification-gated" },
  { id: "mobile-sync-transport", command: "mobile sync transport tests", artifact: "coverage/travel-publish-mobile-sync.json", status: "sync-gated" },
  { id: "dashboard-sync-transport", command: "dashboard sync transport tests", artifact: "coverage/travel-publish-dashboard-sync.json", status: "sync-gated" },
  { id: "web-sync-event", command: "public web sync event persistence tests", artifact: "coverage/travel-publish-web-sync.json", status: "sync-gated" },
  { id: "audit-log", command: "TravelAuditLog persistence tests", artifact: "coverage/travel-publish-audit-log.json", status: "repository-gated" },
  { id: "failed-provider-rollback", command: "failed-provider rollback tests", artifact: "coverage/travel-publish-rollback.json", status: "rollback-gated" },
  { id: "tenant-isolation", command: "cross-tenant travel publish denial tests", artifact: "coverage/travel-publish-tenant-isolation.json", status: "tenant-gated" },
  { id: "dashboard-public-e2e", command: "Nomad Mode dashboard-to-public E2E smoke", artifact: "coverage/travel-publish-dashboard-public-e2e-redacted.json", status: "e2e-gated" },
  { id: "ci-travel-publish-job", command: "GitHub Actions travel publish runtime job", artifact: "coverage/travel-publish-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "review travel publish artifacts for provider tokens, PII, waitlist contact data, and private booking data", artifact: "coverage/travel-publish-secret-safe-artifacts.json", status: "ci-gated" },
] as const satisfies readonly TravelPublishRuntimeMatrixEntry[];

export const travelPublishRuntimeReadiness = buildTravelPublishRuntimeReadinessPlan({
  packageScripts: {
    test: "vitest run",
    typecheck: "tsc --noEmit",
  },
  calendarTestsPassed: false,
  calendarTypecheckPassed: false,
  dashboardMutationRouteImplemented: true,
  dashboardAuthorizationEnforced: true,
  persistedTravelRepositoryImplemented: true,
  publicDataApiImplemented: false,
  cacheRevalidationCalledAfterCommit: true,
  cityWaitlistMatchingImplemented: true,
  consentFilteredNotificationQueueImplemented: true,
  notificationProviderQueueTested: false,
  mobileSyncTransportImplemented: true,
  dashboardSyncTransportImplemented: true,
  webSyncEventPersistenceConfigured: true,
  auditLogPersistenceConfigured: true,
  rollbackExecutorImplemented: true,
  failedProviderRollbackTested: false,
  tenantIsolationTestsPassed: false,
  e2eTravelPublishFlowPassed: false,
});
