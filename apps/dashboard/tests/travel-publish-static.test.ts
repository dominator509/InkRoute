import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildDashboardTravelPublishReadiness,
  createInMemoryTravelPublishRepository,
  dashboardTravelPublishContract,
  executeTravelPublishMutation,
} from "../lib/travelPublish";

const repoRoot = resolve(__dirname, "../../..");
const pageSource = readFileSync(resolve(repoRoot, "apps/dashboard/app/travel/page.tsx"), "utf8");
const actionPanelSource = readFileSync(resolve(repoRoot, "apps/dashboard/components/TravelPublishActionPanel.tsx"), "utf8");

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

  it("executes a local travel publish repository contract for tenant scope, idempotency, waitlist effects, and transactions", async () => {
    const samplePlan = dashboardTravelPublishContract.samplePlans[0];
    const sampleStop = samplePlan.stop;
    const repository = createInMemoryTravelPublishRepository();
    repository.state.authorizedActorKeys.add(`${sampleStop.tenantId}:${sampleStop.artistId}:operator_demo:publish`);
    repository.state.waitlistClientIds.set(
      `${sampleStop.tenantId}:${sampleStop.city}:${sampleStop.region}:${sampleStop.country}`,
      ["client_waitlist_1", "client_waitlist_2"],
    );

    const input = {
      tenantId: sampleStop.tenantId,
      artistId: sampleStop.artistId,
      actorId: "operator_demo",
      action: "publish" as const,
      stop: sampleStop,
      idempotencyKey: "travel-publish-key",
      requestId: "request-1",
      changedFieldNames: ["created"],
      providerActionsSucceeded: true,
    };

    const first = await executeTravelPublishMutation(input, repository);
    const duplicate = await executeTravelPublishMutation(input, repository);

    expect(first.status).toBe("ready");
    expect(duplicate.status).toBe("duplicate");
    expect(repository.state.transactions).toHaveLength(1);
    expect(repository.state.transactions[0].revalidationTags.length).toBeGreaterThan(0);
    expect(repository.state.postCommitEffects).toHaveLength(1);
    expect(repository.state.postCommitEffects[0].notificationJobCount).toBe(2);

    await expect(
      executeTravelPublishMutation(
        {
          ...input,
          tenantId: "other_tenant",
          idempotencyKey: "other-key",
          requestId: "request-2",
        },
        repository,
      ),
    ).rejects.toThrow("TRAVEL_PUBLISH_TENANT_ARTIST_ACCESS_DENIED");
  });

  it("rolls back local travel publish mutations when post-commit effects fail", async () => {
    const samplePlan = dashboardTravelPublishContract.samplePlans[1];
    const sampleStop = samplePlan.stop;
    const repository = createInMemoryTravelPublishRepository();
    repository.state.authorizedActorKeys.add(`${sampleStop.tenantId}:${sampleStop.artistId}:operator_demo:update`);
    repository.state.previousStops.set(`${sampleStop.tenantId}:${sampleStop.artistId}:${sampleStop.id}`, sampleStop);
    repository.state.failPostCommitEffects = true;

    const result = await executeTravelPublishMutation(
      {
        tenantId: sampleStop.tenantId,
        artistId: sampleStop.artistId,
        actorId: "operator_demo",
        action: "update",
        stop: sampleStop,
        idempotencyKey: "travel-update-key",
        requestId: "request-3",
        changedFieldNames: ["bookingStatus"],
        providerActionsSucceeded: true,
      },
      repository,
    );

    expect(result.status).toBe("rolled_back");
    expect(repository.state.transactions).toHaveLength(1);
    expect(repository.state.rollbacks).toHaveLength(1);
    expect(repository.state.rollbacks[0].reason).toBe("TRAVEL_PUBLISH_POST_COMMIT_EFFECT_FAILED");
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
    expect(routeSource).toContain("{ status: 202, headers: noStoreHeaders }");
    expect(routeSource).not.toContain("{ status: 501, headers: noStoreHeaders }");
    expect(routeSource).toContain("TRAVEL_PUBLISH_REPOSITORY_NOT_CONFIGURED");
    expect(routeSource).toContain("demoTravelPublishPlanDisabled");
    expect(routeSource).toContain("requiresProviderRollbackEvidence");
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("headers: noStoreHeaders");
    expect(routeSource).not.toContain('headers: { "Cache-Control": "no-store" }');
    expect(pageSource).toContain("TravelPublishActionPanel");
    expect(actionPanelSource).toContain('fetch("/api/travel/publish"');
    expect(actionPanelSource).toContain("Submit publish draft");
    expect(actionPanelSource).toContain("Durable travel repositories, public cache revalidation, provider rollback handling, waitlist notifications, and dashboard-to-public E2E proof remain evidence-gated.");
  });
});
