import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildDashboardAvailabilityReadiness,
  dashboardAvailabilityPersistenceContract,
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
    expect(routeSource).toContain("repository-required");
  });
});
