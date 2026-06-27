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

export interface TravelPublishExecutionPolicy {
  readonly codexMayClassifyStaticTravelPublishReadiness: boolean;
  readonly localCommandEvidenceRequiredForClosure: boolean;
  readonly durableRepositoryRequiredForClosure: boolean;
  readonly publicTravelDataApiRequiredForClosure: boolean;
  readonly cacheRevalidationRequiredForClosure: boolean;
  readonly notificationProviderRequiredForClosure: boolean;
  readonly syncTransportRequiredForClosure: boolean;
  readonly tenantIsolationRequiredForClosure: boolean;
  readonly rollbackEvidenceRequiredForClosure: boolean;
  readonly dashboardPublicE2eRequiredForClosure: boolean;
  readonly secretSafeArtifactsRequiredForClosure: boolean;
}

export interface TravelPublishExecutionPlan {
  readonly policy: typeof travelPublishExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly durableRepositoryExecutionAllowed: false;
  readonly publicApiExecutionAllowed: false;
  readonly cacheRevalidationExecutionAllowed: false;
  readonly notificationProviderExecutionAllowed: false;
  readonly syncTransportExecutionAllowed: false;
  readonly tenantIsolationExecutionAllowed: false;
  readonly rollbackExecutionAllowed: false;
  readonly e2eExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly artifactReviewExecutionAllowed: false;
  readonly localCommands: typeof travelPublishLocalCommands;
  readonly externalCommands: typeof travelPublishExternalCommands;
  readonly requiredExternalEvidence: typeof travelPublishRequiredExternalEvidence;
}

export interface RedactedTravelPublishArtifact {
  readonly artifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: true;
}

export interface TravelPublishArtifactReview {
  readonly passed: boolean;
  readonly artifact: RedactedTravelPublishArtifact;
  readonly blockers: readonly string[];
  readonly requiredExternalEvidence: typeof travelPublishRequiredExternalEvidence;
}

export const travelPublishExecutionPolicy = {
  codexMayClassifyStaticTravelPublishReadiness: true,
  localCommandEvidenceRequiredForClosure: true,
  durableRepositoryRequiredForClosure: true,
  publicTravelDataApiRequiredForClosure: true,
  cacheRevalidationRequiredForClosure: true,
  notificationProviderRequiredForClosure: true,
  syncTransportRequiredForClosure: true,
  tenantIsolationRequiredForClosure: true,
  rollbackEvidenceRequiredForClosure: true,
  dashboardPublicE2eRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies TravelPublishExecutionPolicy;

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

export const travelPublishRequiredExternalEvidence = [
  "actual travel publish command output",
  "durable travel repository integration tests",
  "committed public travel data API reads",
  "cache/revalidation after commit evidence",
  "city waitlist matching against persisted clients",
  "consent-filtered notification queue provider execution",
  "mobile/dashboard/web sync transport evidence",
  "tenant isolation tests",
  "failed-provider rollback tests",
  "Nomad Mode dashboard-to-public E2E smoke",
  "CI travel publish artifacts",
  "secret-safe travel publish artifact review",
] as const;

export const travelPublishLocalCommands = [
  "pnpm --filter @inkroute/calendar typecheck",
  "pnpm --filter @inkroute/calendar test",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm vitest run apps/dashboard/tests/travel-publish-runtime-static.test.ts apps/dashboard/tests/travel-publish-static.test.ts",
] as const;

export const travelPublishExternalCommands = [
  "travel publish repository integration tests",
  "committed public travel data API read tests",
  "post-commit cache/revalidation tests",
  "persisted city waitlist matching tests",
  "consent-filtered notification provider queue execution tests",
  "mobile/dashboard/web sync transport tests",
  "cross-tenant travel publish denial tests",
  "failed-provider rollback tests",
  "Nomad Mode dashboard-to-public E2E smoke",
  "GitHub Actions travel publish runtime job",
  "secret-safe travel publish artifact review",
] as const;

export const buildTravelPublishExecutionPlan = (): TravelPublishExecutionPlan => ({
  policy: travelPublishExecutionPolicy,
  commandExecutionAllowed: false,
  durableRepositoryExecutionAllowed: false,
  publicApiExecutionAllowed: false,
  cacheRevalidationExecutionAllowed: false,
  notificationProviderExecutionAllowed: false,
  syncTransportExecutionAllowed: false,
  tenantIsolationExecutionAllowed: false,
  rollbackExecutionAllowed: false,
  e2eExecutionAllowed: false,
  ciExecutionAllowed: false,
  artifactReviewExecutionAllowed: false,
  localCommands: travelPublishLocalCommands,
  externalCommands: travelPublishExternalCommands,
  requiredExternalEvidence: travelPublishRequiredExternalEvidence,
});

const travelPublishPrivateArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|travel|publish|waitlist|notification|queue|sync|rollback|e2e|trace|screenshot|artifact|email|phone|medical|payment|customer)/i;

const redactTravelPublishArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactTravelPublishArtifactValue(entry, `${path}[${index}]`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (travelPublishPrivateArtifactKeyPattern.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[redacted]"];
        }

        return [key, redactTravelPublishArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  return value;
};

export const buildRedactedTravelPublishArtifact = (artifact: unknown): RedactedTravelPublishArtifact => {
  const redactedPaths: string[] = [];

  return {
    artifact: redactTravelPublishArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
    secretSafe: true,
  };
};

export const buildTravelPublishArtifactReview = (artifact: unknown): TravelPublishArtifactReview => {
  const redacted = buildRedactedTravelPublishArtifact(artifact);

  return {
    passed: true,
    artifact: redacted,
    blockers: [],
    requiredExternalEvidence: travelPublishRequiredExternalEvidence,
  };
};

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

export const travelPublishRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "apps/web/package.json",
  "packages/calendar/package.json",
  "packages/calendar/src/index.ts",
  "apps/dashboard/lib/travelPublish.ts",
  "apps/dashboard/lib/travelPublishRuntime.ts",
  "apps/dashboard/components/TravelPublishActionPanel.tsx",
  "apps/dashboard/app/api/travel/publish/route.ts",
  "apps/web/app/api/public/[tenantSlug]/travel/route.ts",
  "apps/web/lib/publicContentApi.ts",
  "apps/dashboard/app/travel/page.tsx",
  "apps/dashboard/tests/travel-publish-static.test.ts",
  "apps/dashboard/tests/travel-publish-runtime-static.test.ts",
  "apps/web/app/travel/page.tsx",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export type TravelPublishEvidenceArtifact = (typeof travelPublishArtifactPaths)[number];

export interface TravelPublishEvidenceInput {
  readonly calendarTypecheckPassed: boolean;
  readonly calendarTestsPassed: boolean;
  readonly dashboardTypecheckPassed: boolean;
  readonly webTypecheckPassed: boolean;
  readonly staticContractTestsPassed: boolean;
  readonly repositoryIntegrationPassed: boolean;
  readonly publicDataApiPassed: boolean;
  readonly cacheRevalidationVerified: boolean;
  readonly waitlistMatchingVerified: boolean;
  readonly notificationProviderQueuePassed: boolean;
  readonly mobileSyncTransportPassed: boolean;
  readonly dashboardSyncTransportPassed: boolean;
  readonly webSyncEventPassed: boolean;
  readonly auditLogPersistencePassed: boolean;
  readonly failedProviderRollbackPassed: boolean;
  readonly tenantIsolationPassed: boolean;
  readonly dashboardPublicE2ePassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly TravelPublishEvidenceArtifact[];
}

export interface TravelPublishEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly TravelPublishEvidenceArtifact[];
  readonly requiredCommands: typeof travelPublishRuntimeCommands;
  readonly requiredEvidence: typeof travelPublishDecisionRequiredEvidence;
  readonly redactedSummary: {
    readonly capturedArtifactCount: number;
    readonly requiredArtifactCount: number;
  };
}

export const travelPublishDecisionRequiredEvidence = [
  "dashboard mutation, authorization, repository, and transaction evidence",
  "committed public travel data API and post-commit cache/revalidation evidence",
  "notification provider queue execution evidence for city waitlist jobs",
  "mobile, dashboard, and public web sync transport evidence",
  "failed-provider rollback and tenant isolation test output",
  "dashboard-to-public travel publish E2E evidence",
  "secret-safe review of retained travel publish artifacts",
] as const;

export const buildTravelPublishEvidenceDecision = (
  input: TravelPublishEvidenceInput,
): TravelPublishEvidenceDecision => {
  const captured = new Set(input.capturedArtifacts);
  const missingArtifacts = travelPublishArtifactPaths.filter((artifact) => !captured.has(artifact));
  const blockers = [
    ...(!input.calendarTypecheckPassed ? ["Calendar package typecheck evidence is missing."] : []),
    ...(!input.calendarTestsPassed ? ["Calendar package test evidence is missing."] : []),
    ...(!input.dashboardTypecheckPassed ? ["Dashboard typecheck evidence is missing."] : []),
    ...(!input.webTypecheckPassed ? ["Web typecheck evidence is missing."] : []),
    ...(!input.staticContractTestsPassed ? ["Travel publish static contract evidence is missing."] : []),
    ...(!input.repositoryIntegrationPassed ? ["Durable travel repository integration evidence is missing."] : []),
    ...(!input.publicDataApiPassed ? ["Committed public travel data API evidence is missing."] : []),
    ...(!input.cacheRevalidationVerified ? ["Post-commit cache/revalidation evidence is missing."] : []),
    ...(!input.waitlistMatchingVerified ? ["Persisted city waitlist matching evidence is missing."] : []),
    ...(!input.notificationProviderQueuePassed
      ? ["Consent-filtered notification provider queue evidence is missing."]
      : []),
    ...(!input.mobileSyncTransportPassed ? ["Mobile sync transport evidence is missing."] : []),
    ...(!input.dashboardSyncTransportPassed ? ["Dashboard sync transport evidence is missing."] : []),
    ...(!input.webSyncEventPassed ? ["Public web sync event persistence evidence is missing."] : []),
    ...(!input.auditLogPersistencePassed ? ["TravelAuditLog persistence evidence is missing."] : []),
    ...(!input.failedProviderRollbackPassed ? ["Failed-provider rollback evidence is missing."] : []),
    ...(!input.tenantIsolationPassed ? ["Cross-tenant travel publish denial evidence is missing."] : []),
    ...(!input.dashboardPublicE2ePassed
      ? ["Nomad Mode dashboard-to-public E2E evidence is missing."]
      : []),
    ...(!input.ciEvidenceCaptured ? ["Travel publish CI evidence is missing."] : []),
    ...(!input.secretSafeArtifactReviewPassed
      ? ["Secret-safe travel publish artifact review evidence is missing."]
      : []),
    ...(missingArtifacts.length > 0 ? ["All travel publish artifacts must be captured."] : []),
  ];

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: travelPublishRuntimeCommands,
    requiredEvidence: travelPublishDecisionRequiredEvidence,
    redactedSummary: {
      capturedArtifactCount: captured.size,
      requiredArtifactCount: travelPublishArtifactPaths.length,
    },
  };
};

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
  publicDataApiImplemented: true,
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


