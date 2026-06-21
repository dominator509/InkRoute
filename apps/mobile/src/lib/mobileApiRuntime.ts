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

export const mobileApiRuntimeProofFiles = [
  "apps/mobile/package.json",
  "packages/mobile/package.json",
  "packages/mobile/src/index.ts",
  "packages/mobile/tests/mobile-support.test.ts",
  "apps/mobile/src/lib/mobileApiClient.ts",
  "apps/mobile/src/lib/mobileApiRuntime.ts",
  "apps/mobile/src/screens/HomeScreen.tsx",
  "apps/mobile/src/screens/BookingRequestsScreen.tsx",
  "apps/mobile/tests/mobile-api-client-static.test.ts",
  "apps/mobile/tests/mobile-api-runtime-static.test.ts",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export const mobileApiEvidenceFlags = [
  "mobileSupportTypecheckPassed",
  "mobileSupportTestsPassed",
  "mobileTypecheckPassed",
  "mobileTestsPassed",
  "typedApiClientVerified",
  "providerTokenExchangeTested",
  "screenDomainApiWiringVerified",
  "staticDemoDataReplaced",
  "seededApiSmokePassed",
  "expiredAuthDenialTested",
  "crossTenantDenialTested",
  "offlineIdempotencyPersisted",
  "offlineReplayTested",
  "iosAndroidSmokeTested",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type MobileApiEvidenceFlag = (typeof mobileApiEvidenceFlags)[number];

export interface MobileApiExecutionPolicy {
  readonly codexMayClassifyStaticMobileApiReadiness: true;
  readonly providerTokenExchangeRequiredForClosure: true;
  readonly seededApiSmokeRequiredForClosure: true;
  readonly screenDataReplacementRequiredForClosure: true;
  readonly denialEvidenceRequiredForClosure: true;
  readonly offlineReplayRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface MobileApiExecutionPlan {
  readonly policy: typeof mobileApiExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly providerTokenExecutionAllowed: false;
  readonly seededApiExecutionAllowed: false;
  readonly screenReplacementExecutionAllowed: false;
  readonly denialExecutionAllowed: false;
  readonly offlineReplayExecutionAllowed: false;
  readonly deviceExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly localCommands: typeof mobileApiLocalCommands;
  readonly externalCommands: typeof mobileApiExternalCommands;
  readonly requiredExternalEvidence: typeof mobileApiRequiredExternalEvidence;
}

export interface MobileApiArtifactReview {
  readonly artifact: unknown;
  readonly redactedArtifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: boolean;
  readonly requiredExternalEvidence: typeof mobileApiRequiredExternalEvidence;
}

export interface MobileApiEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly domains?: readonly string[];
  readonly evidence?: Partial<Record<MobileApiEvidenceFlag, boolean>>;
}

export interface MobileApiEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly requiredCommands: typeof mobileApiRuntimeCommands;
  readonly missingCommands: readonly string[];
  readonly requiredArtifacts: typeof mobileApiArtifactPaths;
  readonly missingArtifacts: readonly string[];
  readonly requiredDomains: readonly string[];
  readonly missingDomains: readonly string[];
  readonly requiredEvidence: typeof mobileApiEvidenceFlags;
  readonly missingEvidence: readonly MobileApiEvidenceFlag[];
  readonly blockers: readonly string[];
}

export const mobileApiExecutionPolicy = {
  codexMayClassifyStaticMobileApiReadiness: true,
  providerTokenExchangeRequiredForClosure: true,
  seededApiSmokeRequiredForClosure: true,
  screenDataReplacementRequiredForClosure: true,
  denialEvidenceRequiredForClosure: true,
  offlineReplayRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies MobileApiExecutionPolicy;

export const mobileApiRequiredExternalEvidence = [
  "provider login/token exchange transcript",
  "seeded mobile API smoke evidence",
  "screen data replacement proof",
  "expired-auth denial proof",
  "cross-tenant denial proof",
  "offline idempotency persistence proof",
  "offline reconnect/replay evidence",
  "iOS/Android mobile API smoke evidence",
  "mobile typecheck/test output",
  "CI mobile API evidence",
  "secret-safe mobile API artifact review",
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

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) => {
  const actualSet = new Set(actual ?? []);
  return required.filter((entry) => !actualSet.has(entry));
};

const sensitiveMobileApiArtifactKey = /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|auth|authorization|idempotency|request|replay|offline|device|api|audit|role|member|email|phone|medical|payment)/i;

const redactMobileApiArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactMobileApiArtifactValue(entry, `${path}.${index}`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveMobileApiArtifactKey.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, redactMobileApiArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  return value;
};

export const mobileApiLocalCommands = [
  "pnpm --filter @inkroute/mobile-support typecheck",
  "pnpm --filter @inkroute/mobile-support test",
  "static typed mobile API client contract review",
  "static mobile screen-domain sync surfacing review",
] as const;

export const mobileApiExternalCommands = [
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "provider login/token exchange mobile API tests",
  "seeded mobile API smoke tests",
  "screen data replacement execution proof",
  "expired-auth and cross-tenant denial tests",
  "offline idempotency and reconnect/replay mobile tests",
  "iOS/Android mobile API smoke tests",
  "GitHub Actions mobile API evidence job",
] as const;

export const buildMobileApiExecutionPlan = (): MobileApiExecutionPlan => ({
  policy: mobileApiExecutionPolicy,
  commandExecutionAllowed: false,
  providerTokenExecutionAllowed: false,
  seededApiExecutionAllowed: false,
  screenReplacementExecutionAllowed: false,
  denialExecutionAllowed: false,
  offlineReplayExecutionAllowed: false,
  deviceExecutionAllowed: false,
  ciExecutionAllowed: false,
  localCommands: mobileApiLocalCommands,
  externalCommands: mobileApiExternalCommands,
  requiredExternalEvidence: mobileApiRequiredExternalEvidence,
});

export const buildRedactedMobileApiArtifact = (artifact: unknown): Pick<MobileApiArtifactReview, "redactedArtifact" | "redactedPaths"> => {
  const redactedPaths: string[] = [];
  return {
    redactedArtifact: redactMobileApiArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
  };
};

export const buildMobileApiArtifactReview = (artifact: unknown): MobileApiArtifactReview => {
  const redacted = buildRedactedMobileApiArtifact(artifact);
  return {
    artifact,
    redactedArtifact: redacted.redactedArtifact,
    redactedPaths: redacted.redactedPaths,
    secretSafe: redacted.redactedPaths.length > 0,
    requiredExternalEvidence: mobileApiRequiredExternalEvidence,
  };
};

export const buildMobileApiEvidenceDecision = (
  input: MobileApiEvidenceInput = {},
): MobileApiEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, mobileApiRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, mobileApiArtifactPaths);
  const missingDomains = missingFrom(input.domains, mobileApiDomains);
  const missingEvidence = mobileApiEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = [
    missingCommands.length > 0 ? "Pinned mobile API commands must be run and captured." : "",
    missingArtifacts.length > 0 ? "Mobile API artifacts must be retained with redacted provider, replay, device, CI, and secret-safe evidence." : "",
    missingDomains.length > 0 ? "Every mobile screen domain must use the typed tenant-scoped API client." : "",
    missingEvidence.length > 0
      ? "Provider token exchange, screen-domain API wiring, seeded smoke, denial, offline idempotency/replay, device smoke, CI, and secret-safe evidence must pass."
      : "",
  ].filter(Boolean);

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    requiredCommands: mobileApiRuntimeCommands,
    missingCommands,
    requiredArtifacts: mobileApiArtifactPaths,
    missingArtifacts,
    requiredDomains: mobileApiDomains,
    missingDomains,
    requiredEvidence: mobileApiEvidenceFlags,
    missingEvidence,
    blockers,
  };
};


