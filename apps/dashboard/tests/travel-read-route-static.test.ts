import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const listRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/travel/route.ts"), "utf8");
const detailRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/travel/[travelScheduleId]/route.ts"), "utf8");
const travelPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/travel/page.tsx"), "utf8");

describe("dashboard travel read route contract", () => {
  it("guards travel list and detail reads with RBAC, tenant scope, and no-store cache policy", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain('assertPermission(actor, "travel:read")');
      expect(source).toContain('code: "FORBIDDEN"');
      expect(source).toContain("tenantId !== actor.tenantId");
      expect(source).toContain('code: "TENANT_MISMATCH"');
      expect(source).toContain('"Cache-Control": "no-store"');
    }
  });

  it("uses Prisma travel reads with projection redaction and sensitive-read audit logs", () => {
    expect(listRouteSource).toContain("tx.travelSchedule.findMany");
    expect(detailRouteSource).toContain("tx.travelSchedule.findFirst");

    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("buildTenantDashboardView");
      expect(source).toContain('collection: "travel"');
      expect(source).toContain('"internalNotes"');
      expect(source).toContain('"guestSpotUrl"');
      expect(source).toContain("tx.auditLog.create");
      expect(source).toContain('redaction: "buildTenantDashboardView"');
      expect(source).toContain("redactsInternalNotes");
    }
  });

  it("redacts client names from detail request context while keeping operational counts", () => {
    expect(detailRouteSource).toContain('clientName: "[redacted-dashboard-field]"');
    expect(detailRouteSource).toContain("bookingRequestCount");
    expect(detailRouteSource).toContain("appointmentCount");
    expect(detailRouteSource).toContain("availabilityCount");
  });

  it("keeps local fallback projected and database outage states explicit", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("demoTravelStops");
      expect(source).toContain('persistence: "local-fallback"');
      expect(source).toContain('code: "DATABASE_UNAVAILABLE"');
    }
  });

  it("documents that travel reads are wired while publish/provider sync mutations remain gated", () => {
    expect(travelPageSource).toContain("Tenant-scoped redacted travel read APIs now exist");
    expect(travelPageSource).toContain("Travel reads now use redacted dashboard APIs");
    expect(travelPageSource).toContain("queue provider sync");
  });
});
