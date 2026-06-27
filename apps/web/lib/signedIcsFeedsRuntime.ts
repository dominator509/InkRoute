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

export const signedIcsFeedLocalCommands = [
  "pnpm --filter @inkroute/calendar typecheck",
  "pnpm --filter @inkroute/calendar test",
  "pnpm vitest run apps/web/tests/ics-feed-route.test.ts",
  "static signed-feed repository and private cache contract review",
] as const;

export const signedIcsFeedExternalCommands = [
  "pnpm --filter @inkroute/web typecheck",
  "signed ICS token DB integration tests",
  "Apple/Google/Outlook ICS import smoke tests",
  "revocation dashboard UI smoke and API proof",
  "GitHub Actions signed ICS feed evidence job",
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

export const signedIcsFeedRuntimeProofFiles = [
  "apps/web/package.json",
  "packages/calendar/package.json",
  "packages/calendar/src/index.ts",
  "packages/calendar/tests/availability-conflicts.test.ts",
  "apps/web/lib/signedIcsFeeds.ts",
  "apps/web/lib/signedIcsFeedsRuntime.ts",
  "apps/dashboard/components/SignedIcsFeedRevocationPanel.tsx",
  "apps/dashboard/app/calendar/page.tsx",
  "apps/web/tests/signed-ics-feed-static.test.ts",
  "apps/web/tests/signed-ics-feed-runtime-static.test.ts",
  "apps/web/tests/ics-feed-route.test.ts",
  "apps/web/app/api/public/[tenantSlug]/calendar/[artistSlug]/travel.ics/route.ts",
  "packages/db/prisma/schema.prisma",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export type SignedIcsFeedEvidenceArtifact = (typeof signedIcsFeedArtifactPaths)[number];

export interface SignedIcsFeedExecutionPolicy {
  readonly codexMayClassifyStaticSignedIcsReadiness: true;
  readonly durableTokenPersistenceRequiredForClosure: true;
  readonly revocationUiApiRequiredForClosure: true;
  readonly revokedRouteRejectionRequiredForClosure: true;
  readonly accessLogPersistenceRequiredForClosure: true;
  readonly calendarClientImportRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface SignedIcsFeedExecutionPlan {
  readonly policy: typeof signedIcsFeedExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly revocationUiExecutionAllowed: false;
  readonly routeExecutionAllowed: false;
  readonly calendarClientExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly localCommands: typeof signedIcsFeedLocalCommands;
  readonly externalCommands: typeof signedIcsFeedExternalCommands;
  readonly requiredExternalEvidence: typeof signedIcsFeedRequiredExternalEvidence;
}

export interface SignedIcsFeedArtifactReview {
  readonly artifact: unknown;
  readonly redactedArtifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: boolean;
  readonly requiredExternalEvidence: typeof signedIcsFeedRequiredExternalEvidence;
}

export interface SignedIcsFeedEvidenceInput {
  readonly calendarTypecheckPassed: boolean;
  readonly calendarTestsPassed: boolean;
  readonly webTypecheckPassed: boolean;
  readonly routeTestsPassed: boolean;
  readonly tokenCreateHashVerified: boolean;
  readonly tokenPersistenceVerified: boolean;
  readonly expiryRotationVerified: boolean;
  readonly revocationUiVerified: boolean;
  readonly revocationApiVerified: boolean;
  readonly revokedRouteRejectionVerified: boolean;
  readonly tenantArtistScopeVerified: boolean;
  readonly accessLogPersistenceVerified: boolean;
  readonly privateCacheHeadersVerified: boolean;
  readonly appleImportSmokePassed: boolean;
  readonly googleImportSmokePassed: boolean;
  readonly outlookImportSmokePassed: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly SignedIcsFeedEvidenceArtifact[];
}

export interface SignedIcsFeedEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly SignedIcsFeedEvidenceArtifact[];
  readonly requiredCommands: typeof signedIcsFeedRuntimeCommands;
  readonly requiredEvidence: typeof signedIcsFeedDecisionRequiredEvidence;
  readonly redactedSummary: {
    readonly capturedArtifactCount: number;
    readonly requiredArtifactCount: number;
  };
}

export const signedIcsFeedExecutionPolicy = {
  codexMayClassifyStaticSignedIcsReadiness: true,
  durableTokenPersistenceRequiredForClosure: true,
  revocationUiApiRequiredForClosure: true,
  revokedRouteRejectionRequiredForClosure: true,
  accessLogPersistenceRequiredForClosure: true,
  calendarClientImportRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies SignedIcsFeedExecutionPolicy;

export const signedIcsFeedRequiredExternalEvidence = [
  "durable Prisma token table/repository execution proof",
  "revocation dashboard UI smoke evidence",
  "revocation API proof",
  "revoked-token DB route rejection tests",
  "signed feed access-log persistence proof",
  "Apple Calendar import smoke artifact",
  "Google Calendar import smoke artifact",
  "Outlook Calendar import smoke artifact",
  "CI signed ICS feed evidence",
  "secret-safe signed ICS feed artifact review",
] as const;

const sensitiveSignedIcsFeedArtifactKey = /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|calendar|ics|feed|artist|hash|revocation|access.?log|apple|google|outlook|import|email|phone|medical|payment|customer)/i;

const redactSignedIcsFeedArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactSignedIcsFeedArtifactValue(entry, `${path}.${index}`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveSignedIcsFeedArtifactKey.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, redactSignedIcsFeedArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  return value;
};

export const buildSignedIcsFeedExecutionPlan = (): SignedIcsFeedExecutionPlan => ({
  policy: signedIcsFeedExecutionPolicy,
  commandExecutionAllowed: false,
  databaseExecutionAllowed: false,
  revocationUiExecutionAllowed: false,
  routeExecutionAllowed: false,
  calendarClientExecutionAllowed: false,
  ciExecutionAllowed: false,
  localCommands: signedIcsFeedLocalCommands,
  externalCommands: signedIcsFeedExternalCommands,
  requiredExternalEvidence: signedIcsFeedRequiredExternalEvidence,
});

export const buildRedactedSignedIcsFeedArtifact = (artifact: unknown): Pick<SignedIcsFeedArtifactReview, "redactedArtifact" | "redactedPaths"> => {
  const redactedPaths: string[] = [];
  return {
    redactedArtifact: redactSignedIcsFeedArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
  };
};

export const buildSignedIcsFeedArtifactReview = (artifact: unknown): SignedIcsFeedArtifactReview => {
  const redacted = buildRedactedSignedIcsFeedArtifact(artifact);
  return {
    artifact,
    redactedArtifact: redacted.redactedArtifact,
    redactedPaths: redacted.redactedPaths,
    secretSafe: redacted.redactedPaths.length > 0,
    requiredExternalEvidence: signedIcsFeedRequiredExternalEvidence,
  };
};

export const signedIcsFeedDecisionRequiredEvidence = [
  "calendar/web command output and signed ICS route test output",
  "hashed token creation, durable persistence, expiry, and rotation evidence",
  "revocation UI/API evidence and revoked-token route rejection test output",
  "tenant/artist scope and durable access-log persistence evidence",
  "Apple, Google, and Outlook calendar import smoke-test artifacts",
  "secret-safe review of retained signed ICS artifacts",
] as const;

export const buildSignedIcsFeedEvidenceDecision = (
  input: SignedIcsFeedEvidenceInput,
): SignedIcsFeedEvidenceDecision => {
  const captured = new Set(input.capturedArtifacts);
  const missingArtifacts = signedIcsFeedArtifactPaths.filter((artifact) => !captured.has(artifact));
  const blockers = [
    ...(!input.calendarTypecheckPassed ? ["Calendar package typecheck evidence is missing."] : []),
    ...(!input.calendarTestsPassed ? ["Calendar package test evidence is missing."] : []),
    ...(!input.webTypecheckPassed ? ["Web package typecheck evidence is missing."] : []),
    ...(!input.routeTestsPassed ? ["Signed ICS route test evidence is missing."] : []),
    ...(!input.tokenCreateHashVerified ? ["Signed feed token creation/hash evidence is missing."] : []),
    ...(!input.tokenPersistenceVerified ? ["Durable signed feed token persistence evidence is missing."] : []),
    ...(!input.expiryRotationVerified ? ["Token expiry and rotation persistence evidence is missing."] : []),
    ...(!input.revocationUiVerified ? ["Feed-token revocation UI evidence is missing."] : []),
    ...(!input.revocationApiVerified ? ["Feed-token revocation API evidence is missing."] : []),
    ...(!input.revokedRouteRejectionVerified
      ? ["Revoked-token route rejection from durable storage evidence is missing."]
      : []),
    ...(!input.tenantArtistScopeVerified ? ["Tenant/artist scoped token lookup evidence is missing."] : []),
    ...(!input.accessLogPersistenceVerified ? ["Durable signed feed access-log evidence is missing."] : []),
    ...(!input.privateCacheHeadersVerified ? ["Signed ICS private cache-header evidence is missing."] : []),
    ...(!input.appleImportSmokePassed ? ["Apple Calendar ICS import smoke evidence is missing."] : []),
    ...(!input.googleImportSmokePassed ? ["Google Calendar ICS import smoke evidence is missing."] : []),
    ...(!input.outlookImportSmokePassed ? ["Outlook Calendar ICS import smoke evidence is missing."] : []),
    ...(!input.secretSafeArtifactReviewPassed ? ["Secret-safe signed ICS artifact review evidence is missing."] : []),
    ...(missingArtifacts.length > 0 ? ["All signed ICS feed artifacts must be captured."] : []),
  ];

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: signedIcsFeedRuntimeCommands,
    requiredEvidence: signedIcsFeedDecisionRequiredEvidence,
    redactedSummary: {
      capturedArtifactCount: captured.size,
      requiredArtifactCount: signedIcsFeedArtifactPaths.length,
    },
  };
};

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
  revocationUiImplemented: true,
  revocationApiImplemented: true,
  revokedTokenRouteRejectionTested: false,
  tenantArtistScopeEnforced: true,
  durableAccessLogPersistenceConfigured: true,
  privateCacheHeadersVerified: true,
  appleCalendarImportTested: false,
  googleCalendarImportTested: false,
  outlookCalendarImportTested: false,
});


