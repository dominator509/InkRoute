import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  dashboardMutationActions,
  dashboardMutationArtifactPaths,
  dashboardMutationRuntimeCommands,
  dashboardMutationRuntimeMatrix,
  dashboardMutationRuntimeReadiness,
} from "../lib/dashboardMutationRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("dashboard mutation runtime contract", () => {
  const bookingPackageJson = readRepoFile("packages/booking/package.json");
  const bookingSource = readRepoFile("packages/booking/src/index.ts");
  const bookingTests = readRepoFile("packages/booking/tests/booking-readiness.test.ts");
  const bookingStateRoute = readRepoFile("apps/dashboard/app/api/bookings/[bookingId]/state/route.ts");
  const bookingStateRouteTest = readRepoFile("apps/dashboard/tests/booking-state-route-static.test.ts");
  const disabledActionPanel = readRepoFile("apps/dashboard/components/DisabledActionPanel.tsx");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-038 actions, commands, matrix rows, and artifacts", () => {
    expect(dashboardMutationActions).toEqual([
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
    ]);
    expect(dashboardMutationRuntimeCommands).toEqual([
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
    ]);
    expect(dashboardMutationRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "booking-typecheck",
      "booking-tests",
      "dashboard-typecheck-build",
      "booking-state-api-route",
      "all-action-route-matrix",
      "prisma-transaction-idempotency-audit",
      "tenant-rbac-denial",
      "provider-rollback-retry",
      "gated-ui-feedback",
      "ci-secret-safe-evidence",
    ]);
    expect(dashboardMutationArtifactPaths).toContain("coverage/dashboard-mutation-runtime.json");
    expect(dashboardMutationArtifactPaths).toContain("test-results/dashboard-mutation-runtime");
  });

  it("keeps package mutation helpers and booking lifecycle API route wired", () => {
    expect(bookingPackageJson).toContain('"typecheck"');
    expect(bookingPackageJson).toContain('"test"');
    expect(bookingSource).toContain("buildDashboardMutationPlan");
    expect(bookingSource).toContain("buildDashboardMutationExecutionEvidencePlan");
    expect(bookingTests).toContain("buildDashboardMutationExecutionEvidencePlan");
    expect(bookingStateRoute).toContain("buildDashboardMutationPlan");
    expect(bookingStateRoute).toContain("dashboardMutationPlan");
    expect(bookingStateRoute).toContain("prisma.$transaction");
    expect(bookingStateRoute).toContain("tx.bookingStateEvent.create");
    expect(bookingStateRoute).toContain("tx.auditLog.create");
    expect(bookingStateRouteTest).toContain("persists booking status, state event, and audit log");
  });

  it("keeps provider/UI blockers explicit until every dashboard mutation is executable and tested", () => {
    expect(dashboardMutationRuntimeReadiness.status).toBe("blocked");
    expect(dashboardMutationRuntimeReadiness.missingScripts).toEqual([]);
    expect(dashboardMutationRuntimeReadiness.missingApiRoutes).toContain("create_deposit_session");
    expect(dashboardMutationRuntimeReadiness.missingServerActions).toContain("publish_portfolio_item");
    expect(dashboardMutationRuntimeReadiness.missingRouteTests).toContain("update_settings");
    expect(dashboardMutationRuntimeReadiness.requiredCommands).toEqual([...dashboardMutationRuntimeCommands]);
    expect(dashboardMutationRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "server action, API route, and route-test matrix for every dashboard mutation",
      "Prisma transaction, idempotency, and AuditLog persistence evidence",
      "provider rollback/retry evidence for storage, Stripe, notification, calendar, release, and settings actions",
      "gated mutation UI replacement plus loading/success/denial/failure/retry state evidence",
    ]));
    expect(dashboardMutationRuntimeReadiness.blockers).toContain("Disabled dashboard placeholders must be replaced with gated mutation UI.");
    expect(disabledActionPanel).toContain("disabled");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider mutation readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 5 dashboard mutation runtime contracts");
    expect(ciWorkflow).toContain("dashboard-mutation-runtime-static.test.ts");
    expect(ciWorkflow).toContain("dashboard-mutation-runtime-artifacts");
    expect(unitManifest).toContain("unit-dashboard-mutation-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/dashboardMutationRuntime.ts");
    expect(gapTracker).toContain("GAP-038 is booking-lifecycle-route wired");
    expect(dashboardMutationArtifactPaths).toContain("coverage/dashboard-mutation-secret-safe-artifacts.json");
  });
});
