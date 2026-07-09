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
    expect(routeSource).toContain("buildSafeBookingTransitionPlanResponse");
    expect(routeSource).toContain("plan: buildSafeBookingTransitionPlanResponse(result.plan)");
    expect(routeSource).toContain("rawTransitionEchoed: false");
    expect(routeSource).toContain("rawWritePayloadsEchoed: false");
    expect(routeSource).toContain("rawTenantIdEchoed: false");
    expect(routeSource).toContain("rawBookingRequestIdEchoed: false");
    expect(routeSource).toContain("rawActorIdEchoed: false");
    expect(routeSource).toContain("rawIdempotencyKeyEchoed: false");
  });

  it("persists booking status, idempotency, state event, and audit log in one tenant-scoped transaction", () => {
    const transactionIndex = routeSource.indexOf("prisma.$transaction");
    const idempotencyClaimIndex = routeSource.indexOf("tx.idempotencyKey.upsert");
    const bookingUpdateIndex = routeSource.indexOf("tx.bookingRequest.update");
    const eventCreateIndex = routeSource.indexOf("tx.bookingStateEvent.create");
    const auditCreateIndex = routeSource.indexOf("tx.auditLog.create");
    const idempotencyResultIndex = routeSource.indexOf("tx.idempotencyKey.update");

    expect(transactionIndex).toBeGreaterThan(-1);
    expect(idempotencyClaimIndex).toBeGreaterThan(transactionIndex);
    expect(bookingUpdateIndex).toBeGreaterThan(idempotencyClaimIndex);
    expect(eventCreateIndex).toBeGreaterThan(bookingUpdateIndex);
    expect(auditCreateIndex).toBeGreaterThan(eventCreateIndex);
    expect(idempotencyResultIndex).toBeGreaterThan(auditCreateIndex);
    expect(routeSource).toContain("where: { id: bookingId, tenantId }");
    expect(routeSource).toContain("existingIdempotency?.status === \"completed\"");
    expect(routeSource).toContain("summarizeBookingStateReplayResult");
    expect(routeSource).toContain("rawIdempotencyResultEchoed: false");
    expect(routeSource).toContain("bookingStateEventPersisted: record.bookingStateEventPersisted === true");
    expect(routeSource).toContain("auditLogged: record.auditLogged === true");
    expect(routeSource).toContain("internalPersistenceIdsStored: record.internalPersistenceIdsStored === false ? false : null");
    expect(routeSource).toContain("Booking lifecycle mutation replay returned an allowlisted idempotency summary");
    expect(routeSource).toContain("buildSafeDashboardMutationPlanResponse");
    expect(routeSource).toContain("dashboardMutationPlan: buildSafeDashboardMutationPlanResponse(result.dashboardMutationPlan)");
    expect(routeSource).toContain("rawDashboardMutationPlanEchoed: false");
    expect(routeSource).toContain("buildSafeBookingLifecycleReceipt");
    expect(routeSource).toContain("buildSafeBookingStateEventReceipt");
    expect(routeSource).toContain("buildSafeBookingTransitionReceipt");
    expect(routeSource).toContain("booking: buildSafeBookingLifecycleReceipt(result.booking)");
    expect(routeSource).toContain("event: buildSafeBookingStateEventReceipt(result.event)");
    expect(routeSource).toContain("transition: buildSafeBookingTransitionReceipt(result.plan)");
    expect(routeSource).toContain("eventIdEchoed: false");
    expect(routeSource).not.toContain("booking: result.booking");
    expect(routeSource).not.toContain("event: result.event");
    expect(routeSource).not.toContain("transition: result.plan.transition");
    expect(routeSource).not.toContain("result: result.idempotency.result");
    expect(routeSource).not.toContain('eventId: replayResultString(record, "eventId")');
    expect(routeSource).not.toContain('auditId: replayResultString(record, "auditId")');
    expect(routeSource).not.toContain("eventId: event.id,\n            auditId: audit.id");
    expect(routeSource).toContain("idempotencyPersisted: true");
    expect(routeSource).toContain("rawIdempotencyKeyStored: false");
    expect(routeSource).toContain("bookingStateEventPersisted: true");
    expect(routeSource).not.toContain("idempotencyKeyId: idempotency.id");
    expect(routeSource).not.toContain("idempotencyKey,\n            idempotencyKeyId");
    expect(routeSource).not.toContain("eventId: event.id");
    expect(routeSource).toContain("idempotencyRecorded: true");
    expect(routeSource).toContain("idempotencyKeyIdEchoed: false");
    expect(routeSource).toContain("auditIdEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsEchoed: false");
    expect(routeSource).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(routeSource).not.toContain("auditId: result.audit.id");
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
      expect(source).toContain(".safeParse(Object.fromEntries(new URL(request.url).searchParams))");
      expect(source).toContain('code: "VALIDATION_FAILED"');
      expect(source).toContain("tenantId !== actor.tenantId");
      expect(source).toContain('code: "TENANT_MISMATCH"');
      expect(source).toContain('"Cache-Control": "no-store"');
    }

    expect(listRouteSource).toContain("dashboardListQuerySchema");
    expect(listRouteSource).toContain("query.data.limit");
    expect(detailRouteSource).toContain("dashboardTenantQuerySchema");
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
      expect(source).toContain("auditIdEchoed: false");
      expect(source).toContain("internalPersistenceIdsEchoed: false");
      expect(source).not.toContain("auditId: result.audit.id");
    }
    expect(detailRouteSource).toContain("function buildBookingDetailResponseProjection");
    expect(detailRouteSource).toContain("function buildSafeBookingDetailRecord");
    expect(detailRouteSource).toContain("bookingRequestIdEchoed: false");
    expect(detailRouteSource).toContain("tenantIdEchoed: false");
    expect(detailRouteSource).toContain("portfolioAttributionIdEchoed: false");
    expect(detailRouteSource).toContain("assignedToUserIdEchoed: false");
    expect(detailRouteSource).toContain("stateEventIdsEchoed: false");
    expect(detailRouteSource).toContain("tenantScope: { actorTenantMatched: true");
    expect(detailRouteSource).toContain("bookingTenantMatched: true");
    expect(listRouteSource).toContain("buildSafeBookingListRecord");
    expect(listRouteSource).toContain("function buildBookingListResponseProjection");
    expect(listRouteSource).toContain("bookingRequestIdsEchoed: false");
    expect(listRouteSource).toContain("tenantIdEchoed: false");
    expect(listRouteSource).toContain("portfolioAttributionIdsEchoed: false");
    expect(listRouteSource).toContain("assignedToUserIdsEchoed: false");
    expect(listRouteSource).toContain("auditIdEchoed: false");
    expect(listRouteSource).toContain("tenantScope: { actorTenantMatched: true }");
    expect(listRouteSource).toContain("portfolioAttributed: Boolean");
    expect(listRouteSource).toContain("assignedToUserPresent: Boolean");
    expect(listRouteSource).not.toContain("tenantId,\n          error:");
    expect(listRouteSource).not.toContain("id: row.id");
    expect(listRouteSource).not.toContain("tenantId: row.tenantId");
    expect(listRouteSource).not.toContain("portfolioAttribution: row.portfolioAttributionId");
    expect(listRouteSource).not.toContain("assignedToUserId: row.assignedToUserId");
    expect(detailRouteSource).toContain("portfolioAttributed: Boolean(result.row.portfolioAttributionId)");
    expect(detailRouteSource).toContain("assignedToUserPresent: Boolean(result.row.assignedToUserId)");
    expect(detailRouteSource).not.toContain("id: result.row.id");
    expect(detailRouteSource).not.toContain("tenantId: result.row.tenantId");
    expect(detailRouteSource).not.toContain("portfolioAttribution: result.row.portfolioAttributionId");
    expect(detailRouteSource).not.toContain("assignedToUserId: result.row.assignedToUserId");
    expect(detailRouteSource).not.toContain("id: event.id");
    expect(detailRouteSource).not.toContain("tenantId,\n          bookingId");
    expect(detailRouteSource).not.toContain("tenantId,\n        persistence");
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
