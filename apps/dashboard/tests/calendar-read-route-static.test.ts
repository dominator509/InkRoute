import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/calendar/route.ts"), "utf8");
const holdRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/calendar/holds/route.ts"), "utf8");
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
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).not.toContain('}, { status: 403 });');
    expect(routeSource).not.toContain('}, { status: 500 });');
  });

  it("loads calendar connections, events, and availability while omitting provider secrets", () => {
    expect(routeSource).toContain("tx.calendarConnection.findMany");
    expect(routeSource).toContain("tx.calendarEvent.findMany");
    expect(routeSource).toContain("tx.availabilityWindow.findMany");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain("auditLogged: true");
    expect(routeSource).toContain("auditIdEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsEchoed: false");
    expect(routeSource).toContain("function buildCalendarReadResponseProjection");
    expect(routeSource).toContain("function buildSafeCalendarFallbackRecord");
    expect(routeSource).toContain("tenantIdEchoed: false");
    expect(routeSource).toContain("calendarConnectionIdsEchoed: false");
    expect(routeSource).toContain("calendarEventIdsEchoed: false");
    expect(routeSource).toContain("availabilityWindowIdsEchoed: false");
    expect(routeSource).toContain("artistIdsEchoed: false");
    expect(routeSource).toContain("appointmentIdsEchoed: false");
    expect(routeSource).toContain("travelCityIdsEchoed: false");
    expect(routeSource).toContain("travelScheduleIdsEchoed: false");
    expect(routeSource).not.toContain("auditId: result.audit.id");
    expect(routeSource).not.toContain("id: connection.id");
    expect(routeSource).not.toContain("artistId: connection.artistId");
    expect(routeSource).not.toContain("id: event.id");
    expect(routeSource).not.toContain("calendarConnectionId: event.calendarConnectionId");
    expect(routeSource).not.toContain("appointmentId: event.appointmentId");
    expect(routeSource).not.toContain("id: window.id");
    expect(routeSource).not.toContain("artistId: window.artistId");
    expect(routeSource).not.toContain("travelCityId: window.travelCityId");
    expect(routeSource).not.toContain("travelScheduleId: window.travelScheduleId");
    expect(routeSource).not.toContain("encryptedAccessToken: true");
    expect(routeSource).not.toContain("encryptedRefreshToken: true");
  });

  it("redacts provider identifiers, raw payloads, and internal availability notes", () => {
    expect(routeSource).toContain("function buildProviderPayloadPreview");
    expect(routeSource).toContain("rawProviderPayloadStoredOnly: true");
    expect(routeSource).toContain("providerPayloadPreview: buildProviderPayloadPreview(event.rawPayload)");
    expect(routeSource).toContain("rawProviderPayloadFieldCount");
    expect(routeSource).not.toContain("rawPayload: redactProviderPayload(event.rawPayload)");
    expect(routeSource).toContain('providerAccountId: connection.providerAccountId ? "[redacted-dashboard-field]" : null');
    expect(routeSource).toContain('externalEventId: event.externalEventId ? "[redacted-dashboard-field]" : null');
    expect(routeSource).toContain('internalNotes: window.internalNotes ? "[redacted-dashboard-field]" : null');
    expect(routeSource).toContain("artistLinked: Boolean(connection.artistId)");
    expect(routeSource).toContain("calendarConnectionLinked: Boolean(event.calendarConnectionId)");
    expect(routeSource).toContain("appointmentLinked: Boolean(event.appointmentId)");
    expect(routeSource).toContain("travelCityLinked: Boolean(window.travelCityId)");
    expect(routeSource).toContain("travelScheduleLinked: Boolean(window.travelScheduleId)");
    expect(routeSource).toContain("rawProviderPayloadEchoed: false");
    expect(routeSource).toContain("providerIdentifiersEchoed: false");
    expect(routeSource).toContain("internalAvailabilityNotesEchoed: false");
    expect(routeSource).toContain('"encryptedAccessToken"');
    expect(routeSource).toContain('"encryptedRefreshToken"');
  });

  it("keeps local fallback and database outage states explicit", () => {
    expect(routeSource).toContain("dashboardCalendarSyncPlans");
    expect(routeSource).toContain("dashboardAppointments");
    expect(routeSource).toContain("dashboardAvailabilitySlots");
    expect(routeSource).toContain('persistence: "local-fallback"');
    expect(routeSource).toContain("PROVIDER_DASHBOARD_READS_NOT_CONFIGURED");
    expect(routeSource).toContain("localDashboardReadFallbackDisabled");
    expect(routeSource).toContain('code: "DATABASE_UNAVAILABLE"');
  });

  it("documents that calendar reads are wired while OAuth/provider writes remain gated", () => {
    expect(calendarPageSource).toContain("Tenant-scoped calendar read API now exists");
    expect(calendarPageSource).toContain("Calendar reads now have a redacted dashboard API");
    expect(calendarPageSource).toContain("Read APIs wired");
    expect(calendarPageSource).toContain("Live Google dispatch remains evidence-gated");
    expect(calendarPageSource).toContain("provider retry handling remain evidence-gated runtime contracts");
    expect(calendarPageSource).toContain("Google OAuth");
    expect(calendarPageSource).not.toContain("not sent to Google in this scaffold");
    expect(calendarPageSource).not.toContain("provider retry handling remain planned work");
  });

  it("persists calendar holds with idempotency proof and fail-closed production fallback", () => {
    expect(holdRouteSource).toContain('export const runtime = "nodejs"');
    expect(holdRouteSource).toContain('assertPermission(actor, "calendar:write")');
    expect(holdRouteSource).toContain("buildAvailabilityPersistencePlan");
    expect(holdRouteSource).toContain("tx.idempotencyKey.upsert");
    expect(holdRouteSource).toContain("requestHash: true");
    expect(holdRouteSource).toContain('idempotency.status === "completed"');
    expect(holdRouteSource).toContain('status: "idempotency_conflict"');
    expect(holdRouteSource).toContain('code: "IDEMPOTENCY_CONFLICT"');
    expect(holdRouteSource).toContain("tx.availabilityWindow.create");
    expect(holdRouteSource).toContain("tx.auditLog.create");
    expect(holdRouteSource).toContain("tx.idempotencyKey.update");
    expect(holdRouteSource).toContain("idempotencyPersisted: true");
    expect(holdRouteSource).toContain("requestHashPersisted: true");
    expect(holdRouteSource).toContain("rawIdempotencyKeyStored: false");
    expect(holdRouteSource).toContain("rawRequestHashStored: false");
    expect(holdRouteSource).toContain("internalPersistenceIdsStored: false");
    expect(holdRouteSource).toContain("tenantIdEchoed: false");
    expect(holdRouteSource).toContain("internalPersistenceIdsEchoed: false");
    expect(holdRouteSource).not.toContain("idempotencyKeyId: idempotency.id");
    expect(holdRouteSource).not.toContain('metadata: {\n              action: "create_slot_hold",\n              artistId: artist.id');
    expect(holdRouteSource).not.toContain("internalPersistenceIdsStored: \"false\",\n              requestHash,");
    expect(holdRouteSource).toContain("idempotencyReplay");
    expect(holdRouteSource).toContain("localCalendarHoldFallbackDisabled");
    expect(holdRouteSource).toContain("PROVIDER_CALENDAR_HOLD_PERSISTENCE_NOT_CONFIGURED");
  });
});
