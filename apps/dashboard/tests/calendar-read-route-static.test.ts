import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/calendar/route.ts"), "utf8");
const calendarPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/calendar/page.tsx"), "utf8");
const authSource = readFileSync(join(process.cwd(), "packages/auth/src/index.ts"), "utf8");
const typesSource = readFileSync(join(process.cwd(), "packages/types/src/index.ts"), "utf8");

describe("dashboard calendar read route contract", () => {
  it("adds explicit calendar permissions to the shared RBAC vocabulary", () => {
    expect(typesSource).toContain('"calendar:read"');
    expect(typesSource).toContain('"calendar:write"');
    expect(authSource).toContain('"calendar:read"');
    expect(authSource).toContain('"calendar:write"');
  });

  it("guards calendar reads with RBAC, tenant scope, and no-store cache policy", () => {
    expect(routeSource).toContain('assertPermission(actor, "calendar:read")');
    expect(routeSource).toContain('code: "FORBIDDEN"');
    expect(routeSource).toContain("tenantId !== actor.tenantId");
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain('"Cache-Control": "no-store"');
  });

  it("loads calendar connections, events, and availability while omitting provider secrets", () => {
    expect(routeSource).toContain("tx.calendarConnection.findMany");
    expect(routeSource).toContain("tx.calendarEvent.findMany");
    expect(routeSource).toContain("tx.availabilityWindow.findMany");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).not.toContain("encryptedAccessToken: true");
    expect(routeSource).not.toContain("encryptedRefreshToken: true");
  });

  it("redacts provider identifiers, raw payloads, and internal availability notes", () => {
    expect(routeSource).toContain("redactProviderPayload");
    expect(routeSource).toContain('providerAccountId: connection.providerAccountId ? "[redacted-dashboard-field]" : null');
    expect(routeSource).toContain('externalEventId: event.externalEventId ? "[redacted-dashboard-field]" : null');
    expect(routeSource).toContain('internalNotes: window.internalNotes ? "[redacted-dashboard-field]" : null');
    expect(routeSource).toContain('"encryptedAccessToken"');
    expect(routeSource).toContain('"encryptedRefreshToken"');
  });

  it("keeps local fallback and database outage states explicit", () => {
    expect(routeSource).toContain("dashboardCalendarSyncPlans");
    expect(routeSource).toContain("dashboardAppointments");
    expect(routeSource).toContain("dashboardAvailabilitySlots");
    expect(routeSource).toContain('persistence: "local-fallback"');
    expect(routeSource).toContain('code: "DATABASE_UNAVAILABLE"');
  });

  it("documents that calendar reads are wired while OAuth/provider writes remain gated", () => {
    expect(calendarPageSource).toContain("Tenant-scoped calendar read API now exists");
    expect(calendarPageSource).toContain("Calendar reads now have a redacted dashboard API");
    expect(calendarPageSource).toContain("Read APIs wired");
    expect(calendarPageSource).toContain("Google OAuth");
  });
});
