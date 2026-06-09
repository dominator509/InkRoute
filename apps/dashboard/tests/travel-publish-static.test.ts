import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildDashboardTravelPublishReadiness,
  dashboardTravelPublishContract,
} from "../lib/travelPublish";

const repoRoot = resolve(__dirname, "../../..");

describe("dashboard travel publish contract", () => {
  it("covers publish, update, unpublish, and rollback actions", () => {
    expect(dashboardTravelPublishContract.supportedActions).toEqual([
      "publish",
      "update",
      "unpublish",
      "rollback",
    ]);
    expect(dashboardTravelPublishContract.samplePlans).toHaveLength(4);
    expect(dashboardTravelPublishContract.samplePlans.every((plan) => plan.requiresTransaction)).toBe(true);
  });

  it("plans revalidation, waitlist notifications, sync events, audit logs, idempotency, and rollback", () => {
    const writes = dashboardTravelPublishContract.samplePlans.flatMap((plan) => plan.writes.map((write) => write.model));
    const controls = dashboardTravelPublishContract.samplePlans.flatMap((plan) => plan.requiredControls).join("\n");
    const rollbackSteps = dashboardTravelPublishContract.samplePlans.flatMap((plan) => plan.rollbackPlan).join("\n");

    expect(writes).toContain("WebRevalidationEvent");
    expect(writes).toContain("NotificationJob");
    expect(writes).toContain("MobileSyncEvent");
    expect(writes).toContain("DashboardSyncEvent");
    expect(writes).toContain("TravelAuditLog");
    expect(writes).toContain("IdempotencyKey");
    expect(controls).toContain("tenant-scoped transaction");
    expect(rollbackSteps).toContain("Restore previous TravelStop snapshot");
  });

  it("keeps runtime readiness blocked until public API, provider queue, rollback tests, tenant isolation, and E2E proof exist", () => {
    const readiness = buildDashboardTravelPublishReadiness();

    expect(readiness.status).toBe("blocked");
    expect(readiness.blockers).toContain("@inkroute/calendar travel publish tests must pass.");
    expect(readiness.blockers).toContain("Public travel data API must read committed travel publish state.");
    expect(readiness.blockers).toContain("Notification provider queue execution must be tested for travel publish jobs.");
    expect(readiness.blockers).toContain("Failed provider action rollback tests must pass.");
    expect(readiness.blockers).toContain("Cross-tenant travel publish mutation tests must be denied.");
    expect(readiness.blockers).toContain("End-to-end travel publish flow must prove dashboard edits update public site and waitlist jobs.");
  });

  it("wires the dashboard travel publish API through the mutation plan", () => {
    const routeSource = readFileSync(resolve(repoRoot, "apps/dashboard/app/api/travel/publish/route.ts"), "utf8");

    expect(routeSource).toContain("buildTravelPublishMutationPlan");
    expect(routeSource).toContain("travel:write");
    expect(routeSource).toContain("TRAVEL_PUBLISH_BLOCKED");
    expect(routeSource).toContain("repository-required");
  });
});
