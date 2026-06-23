import { buildDashboardMutationExecutionEvidencePlan, type DashboardMutationAction } from "@inkroute/booking";

export type DashboardMutationRuntimeStatus =
  | "wired"
  | "transaction-gated"
  | "provider-gated"
  | "ui-gated"
  | "ci-gated";

export interface DashboardMutationRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DashboardMutationRuntimeStatus;
}

export const dashboardMutationActions = [
  "accept",
  "decline",
  "request_changes",
  "mark_deposit_paid",
  "confirm_appointment",
  "complete",
  "create_reference_upload_intent",
  "create_deposit_session",
  "send_client_notification",
  "create_calendar_hold",
  "publish_travel_stop",
  "publish_portfolio_item",
  "toggle_feature_flag",
  "rollback_release",
  "update_settings",
] as const satisfies readonly DashboardMutationAction[];

export const dashboardMutationRuntimeCommands = [
  "pnpm --filter @inkroute/booking typecheck",
  "pnpm --filter @inkroute/booking test",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm --filter @inkroute/dashboard build",
  "dashboard mutation server-action/API route tests",
  "dashboard mutation Prisma transaction tests",
  "dashboard mutation tenant-isolation and RBAC tests",
  "provider mutation rollback/retry tests",
  "dashboard mutation UI feedback-state tests",
  "GitHub Actions dashboard mutation execution evidence job",
] as const;

export const dashboardMutationArtifactPaths = [
  "coverage/dashboard-mutation-runtime.json",
  "coverage/dashboard-mutation-booking-typecheck.txt",
  "coverage/dashboard-mutation-booking-test.txt",
  "coverage/dashboard-mutation-dashboard-typecheck.txt",
  "coverage/dashboard-mutation-dashboard-build.txt",
  "coverage/dashboard-mutation-action-route-matrix.json",
  "coverage/dashboard-mutation-server-action-matrix.json",
  "coverage/dashboard-mutation-booking-state-route.json",
  "coverage/dashboard-mutation-prisma-transactions.json",
  "coverage/dashboard-mutation-idempotency.json",
  "coverage/dashboard-mutation-auditlog.json",
  "coverage/dashboard-mutation-tenant-rbac-denial.json",
  "coverage/dashboard-mutation-provider-rollback-retry.json",
  "coverage/dashboard-mutation-gated-ui-feedback.json",
  "coverage/dashboard-mutation-ci-evidence.json",
  "coverage/dashboard-mutation-secret-safe-artifacts.json",
  "test-results/dashboard-mutation-runtime",
] as const;

export const dashboardMutationRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "apps/dashboard/lib/dashboardMutationRuntime.ts",
  "apps/dashboard/tests/dashboard-mutation-runtime-static.test.ts",
  "packages/booking/package.json",
  "packages/booking/src/index.ts",
  "packages/booking/tests/booking-readiness.test.ts",
  "apps/dashboard/app/api/bookings/[bookingId]/state/route.ts",
  "apps/dashboard/tests/booking-state-route-static.test.ts",
  "apps/dashboard/app/payments/page.tsx",
  "apps/dashboard/components/PaymentActionPanel.tsx",
  "apps/dashboard/tests/payment-read-route-static.test.ts",
  "apps/dashboard/app/api/messages/route.ts",
  "apps/dashboard/components/MessageActionPanel.tsx",
  "apps/dashboard/tests/notification-persistence-static.test.ts",
  "apps/dashboard/app/api/calendar/holds/route.ts",
  "apps/dashboard/tests/availability-persistence-static.test.ts",
  "apps/dashboard/app/api/files/signed-upload/route.ts",
  "apps/dashboard/app/api/travel/publish/route.ts",
  "apps/dashboard/components/TravelPublishActionPanel.tsx",
  "apps/dashboard/tests/travel-publish-static.test.ts",
  "apps/dashboard/app/api/portfolio/image-seo-pipeline/route.ts",
  "apps/dashboard/app/api/portfolio/route.ts",
  "apps/dashboard/components/ImageSeoActionPanel.tsx",
  "apps/dashboard/tests/image-seo-pipeline-static.test.ts",
  "apps/dashboard/tests/portfolio-read-route-static.test.ts",
  "apps/dashboard/app/api/settings/route.ts",
  "apps/dashboard/components/SettingsActionPanel.tsx",
  "apps/dashboard/tests/settings-read-route-static.test.ts",
  "apps/dashboard/app/api/clients/[clientId]/route.ts",
  "apps/dashboard/components/ClientDetailActionPanel.tsx",
  "apps/dashboard/tests/client-read-route-static.test.ts",
  "apps/dashboard/app/api/forms/[formId]/route.ts",
  "apps/dashboard/components/FormActionPanel.tsx",
  "apps/dashboard/tests/form-read-route-static.test.ts",
  "apps/dashboard/app/api/feature-flags/route.ts",
  "apps/dashboard/tests/feature-flag-route-static.test.ts",
  "apps/dashboard/app/api/releases/route.ts",
  "apps/dashboard/tests/release-route-static.test.ts",
  "apps/dashboard/components/BookingLifecycleActionPanel.tsx",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export const dashboardMutationRuntimeMatrix = [
  {
    id: "booking-typecheck",
    command: "pnpm --filter @inkroute/booking typecheck",
    artifact: "coverage/dashboard-mutation-booking-typecheck.txt",
    status: "wired",
  },
  {
    id: "booking-tests",
    command: "pnpm --filter @inkroute/booking test",
    artifact: "coverage/dashboard-mutation-booking-test.txt",
    status: "wired",
  },
  {
    id: "dashboard-typecheck-build",
    command: "pnpm --filter @inkroute/dashboard typecheck && pnpm --filter @inkroute/dashboard build",
    artifact: "coverage/dashboard-mutation-dashboard-build.txt",
    status: "ui-gated",
  },
  {
    id: "booking-state-api-route",
    command: "dashboard mutation server-action/API route tests",
    artifact: "coverage/dashboard-mutation-booking-state-route.json",
    status: "wired",
  },
  {
    id: "all-action-route-matrix",
    command: "dashboard mutation server-action/API route tests",
    artifact: "coverage/dashboard-mutation-action-route-matrix.json",
    status: "provider-gated",
  },
  {
    id: "prisma-transaction-idempotency-audit",
    command: "dashboard mutation Prisma transaction tests",
    artifact: "coverage/dashboard-mutation-prisma-transactions.json",
    status: "transaction-gated",
  },
  {
    id: "tenant-rbac-denial",
    command: "dashboard mutation tenant-isolation and RBAC tests",
    artifact: "coverage/dashboard-mutation-tenant-rbac-denial.json",
    status: "transaction-gated",
  },
  {
    id: "provider-rollback-retry",
    command: "provider mutation rollback/retry tests",
    artifact: "coverage/dashboard-mutation-provider-rollback-retry.json",
    status: "provider-gated",
  },
  {
    id: "gated-ui-feedback",
    command: "dashboard mutation UI feedback-state tests",
    artifact: "coverage/dashboard-mutation-gated-ui-feedback.json",
    status: "ui-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions dashboard mutation execution evidence job",
    artifact: "coverage/dashboard-mutation-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly DashboardMutationRuntimeMatrixEntry[];

export const dashboardMutationRuntimeReadiness = buildDashboardMutationExecutionEvidencePlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  bookingTestsPassed: false,
  bookingTypecheckPassed: false,
  dashboardTypecheckPassed: false,
  dashboardBuildPassed: false,
  serverActionsImplemented: [
    "accept",
    "decline",
    "request_changes",
    "mark_deposit_paid",
    "confirm_appointment",
    "complete",
    "create_reference_upload_intent",
    "create_deposit_session",
    "send_client_notification",
    "create_calendar_hold",
    "publish_travel_stop",
    "publish_portfolio_item",
    "toggle_feature_flag",
    "rollback_release",
    "update_settings",
  ],
  apiRoutesImplemented: [
    "accept",
    "decline",
    "request_changes",
    "mark_deposit_paid",
    "confirm_appointment",
    "complete",
    "create_reference_upload_intent",
    "create_deposit_session",
    "send_client_notification",
    "create_calendar_hold",
    "publish_travel_stop",
    "publish_portfolio_item",
    "toggle_feature_flag",
    "rollback_release",
    "update_settings",
  ],
  routeTestsPassed: [
    "accept",
    "decline",
    "request_changes",
    "mark_deposit_paid",
    "confirm_appointment",
    "complete",
    "create_reference_upload_intent",
    "create_deposit_session",
    "send_client_notification",
    "create_calendar_hold",
    "publish_travel_stop",
    "publish_portfolio_item",
    "toggle_feature_flag",
    "rollback_release",
    "update_settings",
  ],
  prismaTransactionsPassed: true,
  idempotencyPersistencePassed: false,
  auditLogPersistencePassed: true,
  tenantIsolationTestsPassed: false,
  rbacDenialTestsPassed: false,
  providerRollbackTestsPassed: false,
  disabledPlaceholdersRemoved: false,
  uiFeedbackStatesPassed: false,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});

export const dashboardMutationEvidenceFlags = [
  "bookingTestsPassed",
  "bookingTypecheckPassed",
  "dashboardTypecheckPassed",
  "dashboardBuildPassed",
  "prismaTransactionsPassed",
  "idempotencyPersistencePassed",
  "auditLogPersistencePassed",
  "tenantIsolationTestsPassed",
  "rbacDenialTestsPassed",
  "providerRollbackTestsPassed",
  "disabledPlaceholdersRemoved",
  "uiFeedbackStatesPassed",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type DashboardMutationEvidenceFlag = (typeof dashboardMutationEvidenceFlags)[number];

export interface DashboardMutationEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly serverActionsImplemented?: readonly string[];
  readonly apiRoutesImplemented?: readonly string[];
  readonly routeTestsPassed?: readonly string[];
  readonly evidence?: Partial<Record<DashboardMutationEvidenceFlag, boolean>>;
}

export interface DashboardMutationEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingServerActions: readonly string[];
  readonly missingApiRoutes: readonly string[];
  readonly missingRouteTests: readonly string[];
  readonly missingEvidence: readonly DashboardMutationEvidenceFlag[];
  readonly requiredCommands: typeof dashboardMutationRuntimeCommands;
  readonly requiredArtifacts: typeof dashboardMutationArtifactPaths;
  readonly requiredActions: readonly DashboardMutationAction[];
  readonly requiredEvidence: typeof dashboardMutationEvidenceFlags;
  readonly blockers: readonly string[];
}

const dashboardMutationEvidenceBlockers: Record<DashboardMutationEvidenceFlag, string> = {
  bookingTestsPassed: "Booking package tests must pass.",
  bookingTypecheckPassed: "Booking package typecheck must pass.",
  dashboardTypecheckPassed: "Dashboard typecheck must pass.",
  dashboardBuildPassed: "Dashboard build must pass.",
  prismaTransactionsPassed: "Dashboard mutation Prisma transaction tests must pass.",
  idempotencyPersistencePassed: "Dashboard mutation idempotency persistence must be enforced before provider side effects.",
  auditLogPersistencePassed: "Dashboard mutation AuditLog persistence tests must pass.",
  tenantIsolationTestsPassed: "Dashboard mutation tenant-isolation tests must pass.",
  rbacDenialTestsPassed: "Dashboard mutation RBAC denial tests must pass.",
  providerRollbackTestsPassed: "Provider rollback/retry tests must pass.",
  disabledPlaceholdersRemoved: "Dashboard mutation surfaces must expose gated action UI and explicit feedback states before runtime readiness.",
  uiFeedbackStatesPassed: "Loading, success, denial, failure, retry, and operator-review UI states must be tested.",
  ciEvidenceCaptured: "CI dashboard mutation execution evidence must be captured.",
  secretSafeArtifactsCaptured:
    "Dashboard mutation artifacts must be redacted and free of secrets, provider tokens, payment data, raw PII, medical, and private file data.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export const buildDashboardMutationEvidenceDecision = (
  input: DashboardMutationEvidenceInput,
): DashboardMutationEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, dashboardMutationRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, dashboardMutationArtifactPaths);
  const missingServerActions = missingFrom(input.serverActionsImplemented, dashboardMutationActions);
  const missingApiRoutes = missingFrom(input.apiRoutesImplemented, dashboardMutationActions);
  const missingRouteTests = missingFrom(input.routeTestsPassed, dashboardMutationActions);
  const missingEvidence = dashboardMutationEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => dashboardMutationEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 &&
      missingArtifacts.length === 0 &&
      missingServerActions.length === 0 &&
      missingApiRoutes.length === 0 &&
      missingRouteTests.length === 0 &&
      missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingServerActions,
    missingApiRoutes,
    missingRouteTests,
    missingEvidence,
    requiredCommands: dashboardMutationRuntimeCommands,
    requiredArtifacts: dashboardMutationArtifactPaths,
    requiredActions: dashboardMutationActions,
    requiredEvidence: dashboardMutationEvidenceFlags,
    blockers,
  };
};

export interface DashboardMutationExecutionPolicy {
  readonly codexMayClassifyStaticMutationReadiness: true;
  readonly allMutationRoutesRequiredForClosure: true;
  readonly idempotencyPersistenceRequiredBeforeProviderEffects: true;
  readonly tenantIsolationRbacAuditRequiredForClosure: true;
  readonly providerRollbackRetryRequiredForClosure: true;
  readonly gatedUiFeedbackRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface DashboardMutationExecutionPlan {
  readonly localCommands: typeof dashboardMutationLocalCommands;
  readonly externalCommands: typeof dashboardMutationExternalCommands;
  readonly requiredExternalEvidence: typeof dashboardMutationRequiredExternalEvidence;
  readonly commandExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly providerExecutionAllowed: false;
  readonly rollbackExecutionAllowed: false;
  readonly uiExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly executionPolicy: typeof dashboardMutationExecutionPolicy;
}

export interface DashboardMutationArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof dashboardMutationRequiredExternalEvidence;
  readonly secretSafe: boolean;
}

export const dashboardMutationRequiredExternalEvidence = [
  "dashboard mutation server-action and API route matrix evidence",
  "dashboard mutation Prisma transaction test output",
  "idempotency persistence proof before provider side effects",
  "tenant-isolation and RBAC denial test output",
  "AuditLog persistence evidence",
  "provider rollback and retry integration evidence",
  "gated UI loading success denial failure retry operator-review state evidence",
  "dashboard typecheck and build evidence",
  "fresh CI dashboard mutation artifacts",
  "secret-safe dashboard mutation artifact review",
] as const;

export const dashboardMutationExecutionPolicy: DashboardMutationExecutionPolicy = {
  codexMayClassifyStaticMutationReadiness: true,
  allMutationRoutesRequiredForClosure: true,
  idempotencyPersistenceRequiredBeforeProviderEffects: true,
  tenantIsolationRbacAuditRequiredForClosure: true,
  providerRollbackRetryRequiredForClosure: true,
  gatedUiFeedbackRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
};

export const dashboardMutationLocalCommands = [
  "pnpm --filter @inkroute/booking typecheck",
  "pnpm --filter @inkroute/booking test",
  "static booking lifecycle mutation route review",
  "static gated mutation UI inventory review",
] as const;

export const dashboardMutationExternalCommands = [
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm --filter @inkroute/dashboard build",
  "dashboard mutation server-action/API route tests",
  "dashboard mutation Prisma transaction tests",
  "dashboard mutation tenant-isolation and RBAC tests",
  "provider mutation rollback/retry tests",
  "dashboard mutation UI feedback-state tests",
  "GitHub Actions dashboard mutation execution evidence job",
] as const;

export const buildDashboardMutationExecutionPlan = (): DashboardMutationExecutionPlan => ({
  localCommands: dashboardMutationLocalCommands,
  externalCommands: dashboardMutationExternalCommands,
  requiredExternalEvidence: dashboardMutationRequiredExternalEvidence,
  commandExecutionAllowed: false,
  databaseExecutionAllowed: false,
  providerExecutionAllowed: false,
  rollbackExecutionAllowed: false,
  uiExecutionAllowed: false,
  ciExecutionAllowed: false,
  executionPolicy: dashboardMutationExecutionPolicy,
});

const dashboardMutationSensitiveArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|stripe|payment|deposit|medical|note|email|phone|calendar|notification|upload|reference|booking|session|cookie|webhook|idempotency|audit|rollback|operator|settings|feature|message|form|portfolio|travel)/i;

export const buildRedactedDashboardMutationArtifact = (
  artifact: unknown,
): Pick<DashboardMutationArtifactReview, "artifact" | "redactions"> => {
  const redactions: string[] = [];

  const redact = (value: unknown, path: string): unknown => {
    if (Array.isArray(value)) {
      return value.map((item, index) => redact(item, `${path}[${index}]`));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
          const entryPath = path ? `${path}.${key}` : key;

          if (dashboardMutationSensitiveArtifactKeyPattern.test(key)) {
            redactions.push(entryPath);
            return [key, "[REDACTED_DASHBOARD_MUTATION_PRIVATE_VALUE]"];
          }

          return [key, redact(entry, entryPath)];
        }),
      );
    }

    return value;
  };

  return {
    artifact: redact(artifact, ""),
    redactions,
  };
};

export const buildDashboardMutationArtifactReview = (artifact: unknown): DashboardMutationArtifactReview => {
  const redacted = buildRedactedDashboardMutationArtifact(artifact);
  const serialized = JSON.stringify(redacted.artifact);
  const leakedPrivateMarkers = [
    "postgres://",
    "client@example.com",
    "tenant.example.com",
    "stripe_",
    "provider-token",
    "webhook_secret",
    "medical:",
    "private-file",
  ].some((marker) => serialized.includes(marker));

  return {
    ...redacted,
    requiredExternalEvidence: dashboardMutationRequiredExternalEvidence,
    secretSafe: !leakedPrivateMarkers,
  };
};



