import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildDashboardAvailabilityReadiness,
  createInMemoryAvailabilityRepository,
  dashboardAvailabilityPersistenceContract,
  executeAvailabilityMutation,
} from "../lib/availabilityPersistence";

const repoRoot = resolve(__dirname, "../../..");

describe("dashboard availability persistence contract", () => {
  it("covers every persisted availability mutation action", () => {
    expect(dashboardAvailabilityPersistenceContract.supportedActions).toEqual([
      "create_availability_window",
      "create_slot_hold",
      "confirm_appointment",
      "release_slot_hold",
    ]);
    expect(dashboardAvailabilityPersistenceContract.samplePlans.every((plan) => plan.requiresTransaction)).toBe(true);
  });

  it("requires tenant scope, idempotency, concurrent hold protection, and audit logs", () => {
    const controls = dashboardAvailabilityPersistenceContract.samplePlans.flatMap((plan) => plan.requiredControls).join("\n");

    expect(controls).toContain("tenant-scoped database transaction");
    expect(controls).toContain("Claim the idempotency key");
    expect(controls).toContain("Reject cross-tenant booking");
    expect(controls).toContain("Lock the tenant/artist/time range");
    expect(controls).toContain("Write CalendarAuditLog");
  });

  it("executes a local availability repository contract for tenant scope, idempotency, conflicts, and transaction writes", async () => {
    const repository = createInMemoryAvailabilityRepository();
    repository.state.authorizedActorKeys.add(
      "tenant_demo:artist_demo:operator_demo:create_availability_window",
    );

    const input = {
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      startsAt: "2026-06-10T16:00:00.000Z",
      endsAt: "2026-06-10T18:00:00.000Z",
      timezone: "America/Los_Angeles",
      actorId: "operator_demo",
      action: "create_availability_window" as const,
      idempotencyKey: "availability-window-key",
      requestId: "request-1",
      bookingRequestId: "booking_demo",
      availabilityWindowId: "availability_window_demo",
      holdId: "availability_hold_demo",
      appointmentId: "appointment_demo",
      conflictIds: [],
      existingHoldIds: [],
    };

    const first = await executeAvailabilityMutation(input, repository);
    const duplicate = await executeAvailabilityMutation(input, repository);

    expect(first.status).toBe("ready");
    expect(duplicate.status).toBe("duplicate");
    expect(repository.state.transactions).toHaveLength(1);
    expect(repository.state.transactions[0]).toMatchObject({
      tenantId: "tenant_demo",
      action: "create_availability_window",
    });
    expect(repository.state.transactions[0].writes.length).toBeGreaterThan(0);

    await expect(
      executeAvailabilityMutation(
        {
          ...input,
          tenantId: "other_tenant",
          idempotencyKey: "other-key",
          requestId: "request-2",
        },
        repository,
      ),
    ).rejects.toThrow("AVAILABILITY_TENANT_ARTIST_ACCESS_DENIED");
  });

  it("blocks slot holds when local persisted conflict and existing hold lookups find rows", async () => {
    const repository = createInMemoryAvailabilityRepository();
    repository.state.authorizedActorKeys.add("tenant_demo:artist_demo:operator_demo:create_slot_hold");
    repository.state.persistedConflictIds.set(
      "tenant_demo:artist_demo:2026-06-10T16:00:00.000Z:2026-06-10T18:00:00.000Z",
      ["appointment_conflict"],
    );
    repository.state.existingHoldIds.set(
      "tenant_demo:artist_demo:2026-06-10T16:00:00.000Z:2026-06-10T18:00:00.000Z",
      ["hold_conflict"],
    );

    const result = await executeAvailabilityMutation(
      {
        tenantId: "tenant_demo",
        artistId: "artist_demo",
        startsAt: "2026-06-10T16:00:00.000Z",
        endsAt: "2026-06-10T18:00:00.000Z",
        timezone: "America/Los_Angeles",
        actorId: "operator_demo",
        action: "create_slot_hold",
        idempotencyKey: "slot-hold-key",
        requestId: "request-3",
        bookingRequestId: "booking_demo",
        availabilityWindowId: "availability_window_demo",
        holdId: "availability_hold_demo",
        appointmentId: "appointment_demo",
        conflictIds: [],
        existingHoldIds: [],
      },
      repository,
    );

    expect(result.status).toBe("blocked");
    expect(repository.state.transactions).toHaveLength(0);
  });

  it("keeps runtime readiness blocked until DB rejection, tenant isolation, and seeded Postgres proof exist", () => {
    const readiness = buildDashboardAvailabilityReadiness();

    expect(readiness.status).toBe("blocked");
    expect(readiness.blockers).toContain("@inkroute/calendar availability tests must pass.");
    expect(readiness.blockers).toContain("Overlapping slot persistence rejection must be tested against DB rows.");
    expect(readiness.blockers).toContain("Cross-tenant availability reads and mutations must be denied by tests.");
    expect(readiness.blockers).toContain("Seeded Postgres integration tests must prove availability persistence lifecycle.");
  });

  it("wires dashboard API slot holds through the availability persistence contract", () => {
    const routeSource = readFileSync(resolve(repoRoot, "apps/dashboard/app/api/calendar/holds/route.ts"), "utf8");

    expect(routeSource).toContain("buildAvailabilityPersistencePlan");
    expect(routeSource).toContain("calendar:write");
    expect(routeSource).toContain("AVAILABILITY_HOLD_BLOCKED");
    expect(routeSource).toContain("tx.availabilityWindow.findFirst");
    expect(routeSource).toContain("repository-required");
    expect(routeSource).toContain("{ status: 202, headers: noStoreHeaders }");
    expect(routeSource).not.toContain("{ status: 501, headers: noStoreHeaders }");
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("headers: noStoreHeaders");
    expect(routeSource).not.toContain('headers: { "Cache-Control": "no-store" }');
  });
});
