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
      expect(source).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
      expect(source).not.toContain('}, { status: 403 });');
      expect(source).not.toContain('}, { status: 500 });');
    }
    expect(detailRouteSource).not.toContain('}, { status: 404 });');
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("auditLogged: true");
      expect(source).toContain("auditIdEchoed: false");
      expect(source).toContain("internalPersistenceIdsEchoed: false");
      expect(source).not.toContain("auditId: result.audit.id");
    }
    expect(detailRouteSource).toContain("travelScheduleIdEchoed: false");
    expect(detailRouteSource).toContain("tenantIdEchoed: false");
    expect(detailRouteSource).toContain("artistIdEchoed: false");
    expect(detailRouteSource).toContain("travelCityIdEchoed: false");
    expect(detailRouteSource).toContain("availabilityWindowIdsEchoed: false");
    expect(detailRouteSource).toContain("bookingRequestIdsEchoed: false");
    expect(detailRouteSource).toContain("appointmentIdsEchoed: false");
    expect(detailRouteSource).toContain("responseProjection: buildTravelDetailResponseProjection()");
    expect(detailRouteSource).toContain("tenantScope: { actorTenantMatched: true }");
    expect(detailRouteSource).toContain("buildSafeLocalTravelStop");
    expect(detailRouteSource).not.toContain("tenantId,\n        persistence");
    expect(detailRouteSource).not.toContain("tenantId,\n          travelScheduleId");
    expect(detailRouteSource).not.toContain("travel,\n        gapIds");
    expect(listRouteSource).toContain("buildSafeTravelReadRecord");
    expect(listRouteSource).toContain("function buildTravelListResponseProjection");
    expect(listRouteSource).toContain("travelScheduleIdsEchoed: false");
    expect(listRouteSource).toContain("tenantIdEchoed: false");
    expect(listRouteSource).toContain("artistIdsEchoed: false");
    expect(listRouteSource).toContain("travelCityIdsEchoed: false");
    expect(listRouteSource).toContain("availabilityWindowIdsEchoed: false");
    expect(listRouteSource).toContain("bookingRequestIdsEchoed: false");
    expect(listRouteSource).toContain("appointmentIdsEchoed: false");
    expect(listRouteSource).toContain("tenantScope: { actorTenantMatched: true }");
    expect(listRouteSource).not.toContain("tenantId,\n          error:");
    expect(listRouteSource).not.toContain("tenantId,\n        persistence");
    expect(listRouteSource).not.toContain("id: row.id");
    expect(listRouteSource).not.toContain("tenantId: row.tenantId");
    expect(listRouteSource).not.toContain("artistId: row.artistId");
    expect(listRouteSource).not.toContain("cityId: row.travelCity.id");
    expect(listRouteSource).not.toContain("id: window.id");
    expect(detailRouteSource).not.toContain("id: result.row.id");
    expect(detailRouteSource).not.toContain("tenantId: result.row.tenantId");
    expect(detailRouteSource).not.toContain("artistId: result.row.artistId");
    expect(detailRouteSource).not.toContain("cityId: result.row.travelCity.id");
    expect(detailRouteSource).not.toContain("id: window.id");
    expect(detailRouteSource).not.toContain("id: booking.id");
    expect(detailRouteSource).not.toContain("id: appointment.id");
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
      expect(source).toContain('internalNotes: window.internalNotes ? "[redacted-dashboard-field]" : null');
      expect(source).toContain("hasInternalNotes: Boolean(window.internalNotes)");
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
      expect(source).toContain("PROVIDER_DASHBOARD_READS_NOT_CONFIGURED");
      expect(source).toContain("localDashboardReadFallbackDisabled");
      expect(source).toContain('code: "DATABASE_UNAVAILABLE"');
    }
  });

  it("documents that travel reads are wired while publish/provider sync mutations remain gated", () => {
    expect(travelPageSource).toContain("Tenant-scoped redacted travel read APIs now exist");
    expect(travelPageSource).toContain("Travel reads now use redacted dashboard APIs");
    expect(travelPageSource).toContain("queue provider sync");
  });
});
