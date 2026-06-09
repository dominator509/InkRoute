import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  travelPublishArtifactPaths,
  travelPublishRuntimeCommands,
  travelPublishRuntimeMatrix,
  travelPublishRuntimeReadiness,
} from "../lib/travelPublishRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("travel publish runtime contract", () => {
  const calendarPackageJson = readWorkspaceFile("packages/calendar/package.json");
  const calendarSource = readWorkspaceFile("packages/calendar/src/index.ts");
  const dashboardTravelPublishSource = readWorkspaceFile("apps/dashboard/lib/travelPublish.ts");
  const routeSource = readWorkspaceFile("apps/dashboard/app/api/travel/publish/route.ts");
  const staticTest = readWorkspaceFile("apps/dashboard/tests/travel-publish-static.test.ts");
  const publicTravelPage = readWorkspaceFile("apps/web/app/travel/page.tsx");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-060 commands, matrix rows, and artifacts", () => {
    expect(travelPublishRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/calendar typecheck",
      "pnpm --filter @inkroute/calendar test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm vitest run apps/dashboard/tests/travel-publish-static.test.ts",
      "travel publish repository integration tests",
      "Nomad Mode dashboard-to-public E2E smoke",
      "failed-provider rollback tests",
    ]);
    expect(travelPublishRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "calendar-typecheck",
      "calendar-tests",
      "dashboard-typecheck",
      "web-typecheck",
      "static-contract",
      "durable-repository",
      "public-data-api",
      "cache-revalidation",
      "city-waitlist-matching",
      "notification-provider-queue",
      "mobile-sync-transport",
      "dashboard-sync-transport",
      "web-sync-event",
      "audit-log",
      "failed-provider-rollback",
      "tenant-isolation",
      "dashboard-public-e2e",
      "ci-travel-publish-job",
      "secret-safe-artifacts",
    ]);
    expect(travelPublishArtifactPaths).toContain("coverage/travel-publish-runtime.json");
    expect(travelPublishArtifactPaths).toContain("test-results/travel-publish-runtime");
  });

  it("keeps package helper, dashboard mutation contract, route boundary, static guard, and public surface wired", () => {
    expect(calendarPackageJson).toContain('"typecheck"');
    expect(calendarPackageJson).toContain('"test"');
    expect(calendarSource).toContain("buildTravelPublishMutationPlan");
    expect(calendarSource).toContain("buildTravelPublishRuntimeReadinessPlan");
    expect(dashboardTravelPublishSource).toContain("executeTravelPublishMutation");
    expect(dashboardTravelPublishSource).toContain("enqueuePostCommitEffects");
    expect(dashboardTravelPublishSource).toContain("rollbackFailedPublish");
    expect(routeSource).toContain("buildTravelPublishMutationPlan");
    expect(routeSource).toContain("travel:write");
    expect(staticTest).toContain("plans revalidation, waitlist notifications, sync events, audit logs, idempotency, and rollback");
    expect(publicTravelPage).toContain("Travel");
  });

  it("keeps repository, public API, provider queue, rollback, tenant, E2E, CI, and artifact blockers explicit", () => {
    expect(travelPublishRuntimeReadiness.status).toBe("blocked");
    expect(travelPublishRuntimeReadiness.missingScripts).toEqual([]);
    expect(travelPublishRuntimeReadiness.requiredCommands).toEqual([
      "pnpm --filter @inkroute/calendar test",
      "pnpm --filter @inkroute/calendar typecheck",
    ]);
    expect(travelPublishRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "dashboard-to-public travel publish E2E evidence",
      "notification provider queue execution evidence for city waitlist jobs",
      "failed-provider rollback and tenant isolation test output",
    ]));
    expect(travelPublishRuntimeReadiness.blockers).toContain("Public travel data API must read committed travel publish state.");
    expect(travelPublishRuntimeReadiness.blockers).toContain("Notification provider queue execution must be tested for travel publish jobs.");
    expect(travelPublishRuntimeReadiness.blockers).toContain("Failed provider action rollback tests must pass.");
    expect(travelPublishRuntimeReadiness.blockers).toContain("Cross-tenant travel publish mutation tests must be denied.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider/public/E2E evidence", () => {
    expect(ciWorkflow).toContain("Run Phase 8 travel publish runtime contracts");
    expect(ciWorkflow).toContain("travel-publish-runtime-static.test.ts");
    expect(ciWorkflow).toContain("travel-publish-runtime-artifacts");
    expect(unitManifest).toContain("unit-travel-publish-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/travelPublishRuntime.ts");
    expect(gapTracker).toContain("GAP-060 is travel-publish-runtime-matrix wired");
    expect(travelPublishArtifactPaths).toContain("coverage/travel-publish-secret-safe-artifacts.json");
  });
});
