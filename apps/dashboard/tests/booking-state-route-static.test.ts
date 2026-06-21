import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/bookings/[bookingId]/state/route.ts"), "utf8");
const listRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/bookings/route.ts"), "utf8");
const detailRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/bookings/[bookingId]/route.ts"), "utf8");
const inboxSource = readFileSync(join(process.cwd(), "apps/dashboard/app/bookings/page.tsx"), "utf8");
const detailSource = readFileSync(join(process.cwd(), "apps/dashboard/app/bookings/[bookingId]/page.tsx"), "utf8");
const lifecyclePanelSource = readFileSync(join(process.cwd(), "apps/dashboard/components/BookingLifecycleActionPanel.tsx"), "utf8");

describe("dashboard booking state mutation route contract", () => {
  it("guards booking mutations with dashboard RBAC and tenant mismatch denial", () => {
    expect(routeSource).toContain('assertPermission(actor, "booking:write")');
    expect(routeSource).toContain('code: "FORBIDDEN"');
    expect(routeSource).toContain("tenantId !== actor.tenantId");
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain('"Cache-Control": "no-store"');
  });

  it("uses the shared booking transition plan before writing status changes", () => {
    expect(routeSource).toContain("createBookingTransitionPlan");
    expect(routeSource).toContain("from: booking.status as BookingStatus");
    expect(routeSource).toContain("action");
    expect(routeSource).toContain("!plan.canCommit || !plan.transition");
    expect(routeSource).toContain('code: "INVALID_TRANSITION"');
  });

  it("persists booking status, state event, and audit log in one tenant-scoped transaction", () => {
    const transactionIndex = routeSource.indexOf("prisma.$transaction");
    const bookingUpdateIndex = routeSource.indexOf("tx.bookingRequest.update");
    const eventCreateIndex = routeSource.indexOf("tx.bookingStateEvent.create");
    const auditCreateIndex = routeSource.indexOf("tx.auditLog.create");

    expect(transactionIndex).toBeGreaterThan(-1);
    expect(bookingUpdateIndex).toBeGreaterThan(transactionIndex);
    expect(eventCreateIndex).toBeGreaterThan(bookingUpdateIndex);
    expect(auditCreateIndex).toBeGreaterThan(eventCreateIndex);
    expect(routeSource).toContain("where: { id: bookingId, tenantId }");
    expect(routeSource).toContain('action: `booking.${action}`');
  });

  it("keeps local fallback honest instead of pretending mutations persisted", () => {
    expect(routeSource).toContain('actor.source === "local-fallback"');
    expect(routeSource).toContain("PROVIDER_BOOKING_STATE_PERSISTENCE_NOT_CONFIGURED");
    expect(routeSource).toContain("localBookingStateMutationFallbackDisabled");
    expect(routeSource).toContain('code: "DATABASE_REQUIRED"');
    expect(routeSource).toContain('code: "DATABASE_UNAVAILABLE"');
  });

  it("documents the live API seam from booking list and detail pages", () => {
    expect(inboxSource).toContain("POST /api/bookings/{booking.id}/state");
    expect(detailSource).toContain("BookingLifecycleActionPanel");
    expect(detailSource).toContain("provider proof gated");
    expect(detailSource).not.toContain("not wired");
    expect(lifecyclePanelSource).toContain("POST /api/bookings/{bookingId}/state");
    expect(lifecyclePanelSource).toContain("BookingStateEvent writes");
    expect(lifecyclePanelSource).toContain("AuditLog persistence");
    expect(lifecyclePanelSource).toContain("fetch(`/api/bookings/${bookingId}/state`");
    expect(lifecyclePanelSource).toContain("idempotencyKey");
  });
});

describe("dashboard booking read route contract", () => {
  it("guards list and detail reads with RBAC, tenant scope, and no-store cache policy", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain('assertPermission(actor, "booking:read")');
      expect(source).toContain('code: "FORBIDDEN"');
      expect(source).toContain("tenantId !== actor.tenantId");
      expect(source).toContain('code: "TENANT_MISMATCH"');
      expect(source).toContain('"Cache-Control": "no-store"');
    }

    expect(listRouteSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(listRouteSource).not.toContain('}, { status: 403 });');
    expect(listRouteSource).not.toContain('}, { status: 500 });');
    expect(detailRouteSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(detailRouteSource).not.toContain('}, { status: 403 });');
    expect(detailRouteSource).not.toContain('}, { status: 404 });');
    expect(detailRouteSource).not.toContain('}, { status: 500 });');
  });

  it("uses repository mode with dashboard projection redaction and sensitive-read audit logs", () => {
    expect(listRouteSource).toContain("tx.bookingRequest.findMany");
    expect(detailRouteSource).toContain("tx.bookingRequest.findFirst");

    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("buildTenantDashboardView");
      expect(source).toContain('"clientEmail"');
      expect(source).toContain('"clientPhone"');
      expect(source).toContain("tx.auditLog.create");
      expect(source).toContain('redaction: "buildTenantDashboardView"');
      expect(source).toContain('persistence: "database"');
    }
  });

  it("keeps local read fallback projected and database outage states explicit", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("dashboardProjectedBookingRows");
      expect(source).toContain('persistence: "local-fallback"');
      expect(source).toContain("PROVIDER_DASHBOARD_BOOKINGS_NOT_CONFIGURED");
      expect(source).toContain("localDashboardBookingFallbackDisabled");
      expect(source).toContain('code: "DATABASE_UNAVAILABLE"');
    }
  });
});
