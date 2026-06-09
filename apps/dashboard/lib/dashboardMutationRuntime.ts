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
  serverActionsImplemented: ["accept", "decline", "complete"],
  apiRoutesImplemented: ["accept", "decline", "complete"],
  routeTestsPassed: ["accept", "decline", "complete"],
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
