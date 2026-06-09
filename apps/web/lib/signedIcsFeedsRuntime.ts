import { buildSignedIcsFeedRuntimeReadinessPlan } from "@inkroute/calendar";

export type SignedIcsFeedRuntimeStatus =
  | "wired"
  | "repository-gated"
  | "revocation-gated"
  | "route-gated"
  | "logging-gated"
  | "client-gated"
  | "ci-gated";

export interface SignedIcsFeedRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: SignedIcsFeedRuntimeStatus;
}

export const signedIcsFeedRuntimeCommands = [
  "pnpm --filter @inkroute/calendar typecheck",
  "pnpm --filter @inkroute/calendar test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm vitest run apps/web/tests/ics-feed-route.test.ts",
  "signed ICS token DB integration tests",
  "Apple/Google/Outlook ICS import smoke tests",
] as const;

export const signedIcsFeedArtifactPaths = [
  "coverage/signed-ics-feed-runtime.json",
  "coverage/signed-ics-feed-calendar-typecheck.txt",
  "coverage/signed-ics-feed-calendar-test.txt",
  "coverage/signed-ics-feed-web-typecheck.txt",
  "coverage/signed-ics-feed-route-tests.json",
  "coverage/signed-ics-feed-token-create-hash.json",
  "coverage/signed-ics-feed-token-persistence.json",
  "coverage/signed-ics-feed-expiry-rotation.json",
  "coverage/signed-ics-feed-revocation-ui.json",
  "coverage/signed-ics-feed-revocation-api.json",
  "coverage/signed-ics-feed-revoked-route-rejection.json",
  "coverage/signed-ics-feed-tenant-artist-scope.json",
  "coverage/signed-ics-feed-access-log-persistence.json",
  "coverage/signed-ics-feed-cache-headers.json",
  "coverage/signed-ics-feed-apple-import-redacted.json",
  "coverage/signed-ics-feed-google-import-redacted.json",
  "coverage/signed-ics-feed-outlook-import-redacted.json",
  "coverage/signed-ics-feed-secret-safe-artifacts.json",
  "test-results/signed-ics-feed-runtime",
] as const;

export const signedIcsFeedRuntimeMatrix = [
  {
    id: "calendar-typecheck",
    command: "pnpm --filter @inkroute/calendar typecheck",
    artifact: "coverage/signed-ics-feed-calendar-typecheck.txt",
    status: "wired",
  },
  {
    id: "calendar-tests",
    command: "pnpm --filter @inkroute/calendar test",
    artifact: "coverage/signed-ics-feed-calendar-test.txt",
    status: "wired",
  },
  {
    id: "web-typecheck",
    command: "pnpm --filter @inkroute/web typecheck",
    artifact: "coverage/signed-ics-feed-web-typecheck.txt",
    status: "ci-gated",
  },
  {
    id: "route-tests",
    command: "pnpm vitest run apps/web/tests/ics-feed-route.test.ts",
    artifact: "coverage/signed-ics-feed-route-tests.json",
    status: "route-gated",
  },
  {
    id: "token-create-hash",
    command: "create signed feed tokens and store only hashes",
    artifact: "coverage/signed-ics-feed-token-create-hash.json",
    status: "wired",
  },
  {
    id: "token-persistence",
    command: "signed ICS token DB integration tests",
    artifact: "coverage/signed-ics-feed-token-persistence.json",
    status: "repository-gated",
  },
  {
    id: "expiry-rotation",
    command: "persist token expiry and rotation records",
    artifact: "coverage/signed-ics-feed-expiry-rotation.json",
    status: "repository-gated",
  },
  {
    id: "revocation-ui",
    command: "dashboard feed-token revocation UI smoke",
    artifact: "coverage/signed-ics-feed-revocation-ui.json",
    status: "revocation-gated",
  },
  {
    id: "revocation-api",
    command: "feed-token revocation API route tests",
    artifact: "coverage/signed-ics-feed-revocation-api.json",
    status: "wired",
  },
  {
    id: "revoked-route-rejection",
    command: "route rejects revoked tokens loaded from durable storage",
    artifact: "coverage/signed-ics-feed-revoked-route-rejection.json",
    status: "route-gated",
  },
  {
    id: "tenant-artist-scope",
    command: "tenant/artist-scoped token lookup and route denial tests",
    artifact: "coverage/signed-ics-feed-tenant-artist-scope.json",
    status: "wired",
  },
  {
    id: "access-log-persistence",
    command: "persist signed feed access logs durably",
    artifact: "coverage/signed-ics-feed-access-log-persistence.json",
    status: "logging-gated",
  },
  {
    id: "private-cache-headers",
    command: "verify private/no-store rejection and private short-cache success headers",
    artifact: "coverage/signed-ics-feed-cache-headers.json",
    status: "wired",
  },
  {
    id: "apple-import-smoke",
    command: "Apple Calendar ICS import smoke test",
    artifact: "coverage/signed-ics-feed-apple-import-redacted.json",
    status: "client-gated",
  },
  {
    id: "google-import-smoke",
    command: "Google Calendar ICS import smoke test",
    artifact: "coverage/signed-ics-feed-google-import-redacted.json",
    status: "client-gated",
  },
  {
    id: "outlook-import-smoke",
    command: "Outlook Calendar ICS import smoke test",
    artifact: "coverage/signed-ics-feed-outlook-import-redacted.json",
    status: "client-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions signed ICS feed evidence job",
    artifact: "coverage/signed-ics-feed-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly SignedIcsFeedRuntimeMatrixEntry[];

export const signedIcsFeedRuntimeReadiness = buildSignedIcsFeedRuntimeReadinessPlan({
  packageScripts: {
    test: "vitest run",
    typecheck: "tsc --noEmit",
  },
  calendarTestsPassed: false,
  calendarTypecheckPassed: false,
  webRouteTestsPassed: false,
  webTypecheckPassed: false,
  tokenCreationImplemented: true,
  hashedTokenPersistenceConfigured: true,
  expiryRotationPersistenceConfigured: true,
  revocationUiImplemented: false,
  revocationApiImplemented: true,
  revokedTokenRouteRejectionTested: false,
  tenantArtistScopeEnforced: true,
  durableAccessLogPersistenceConfigured: true,
  privateCacheHeadersVerified: true,
  appleCalendarImportTested: false,
  googleCalendarImportTested: false,
  outlookCalendarImportTested: false,
});
