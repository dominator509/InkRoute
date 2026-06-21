import { buildTenantDashboardView } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { dashboardProjectedBookingRows } from "../../../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

interface BookingDetailRouteContext {
  params: Promise<{ bookingId: string }>;
}

function formatBudgetRange(min?: number | null, max?: number | null): string {
  if (typeof min !== "number" && typeof max !== "number") return "Not provided";
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  if (typeof min === "number" && typeof max === "number") return `${currency.format(min / 100)}-${currency.format(max / 100)}`;
  if (typeof min === "number") return `From ${currency.format(min / 100)}`;
  return `Up to ${currency.format((max ?? 0) / 100)}`;
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

export async function GET(request: NextRequest, context: BookingDetailRouteContext) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "booking:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read bookings." } }, { status: 403, headers: noStoreHeaders });
  }

  const { bookingId } = await context.params;
  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query a booking for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          bookingId,
          error: {
            code: "PROVIDER_DASHBOARD_BOOKINGS_NOT_CONFIGURED",
            message: "Production dashboard booking detail reads require DB-backed actor resolution and tenant-scoped BookingRequest reads; local fallback demo rows are disabled.",
            gapIds: ["GAP-007", "GAP-031", "GAP-032", "GAP-037"],
          },
          productionBoundary: { localDashboardBookingFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    const booking = dashboardProjectedBookingRows.find((row) => row.id === bookingId);
    if (!booking) {
      return NextResponse.json({ ok: false, error: { code: "BOOKING_NOT_FOUND", message: "Booking was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "local-fallback",
        booking,
        gapIds: ["GAP-007", "GAP-037"],
        boundary: "Local fallback returns a tenant-projected demo booking only; database mode is required for live dashboard reads.",
      },
      { headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.bookingRequest.findFirst({
        where: { id: bookingId, tenantId },
        select: {
          id: true,
          tenantId: true,
          clientNameSnapshot: true,
          clientEmailSnapshot: true,
          clientPhoneSnapshot: true,
          preferredCity: true,
          preferredDate: true,
          style: true,
          placement: true,
          sizeEstimate: true,
          budgetMinCents: true,
          budgetMaxCents: true,
          ideaSummary: true,
          status: true,
          readinessScore: true,
          createdAt: true,
          portfolioAttributionId: true,
          assignedToUserId: true,
          stateEvents: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: { id: true, type: true, fromStatus: true, toStatus: true, note: true, createdAt: true },
          },
        },
      });

      if (!row) return { status: "not_found" as const };

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "booking:read:detail",
          entityType: "BookingRequest",
          entityId: row.id,
          metadata: {
            source: "dashboard-api",
            redaction: "buildTenantDashboardView",
            includedStateEvents: row.stateEvents.length,
          },
        },
        select: { id: true },
      });

      return { status: "found" as const, row, audit };
    });

    if (result.status === "not_found") {
      return NextResponse.json({ ok: false, error: { code: "BOOKING_NOT_FOUND", message: "Booking was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }

    const view = buildTenantDashboardView({
      collection: "bookings",
      tenantId,
      source: "repository",
      records: [
        {
          id: result.row.id,
          tenantId: result.row.tenantId,
          clientName: result.row.clientNameSnapshot,
          clientEmail: result.row.clientEmailSnapshot,
          clientPhone: result.row.clientPhoneSnapshot,
          city: result.row.preferredCity,
          preferredWindow: result.row.preferredDate?.toISOString() ?? "Flexible",
          style: result.row.style,
          placement: result.row.placement,
          sizeEstimate: result.row.sizeEstimate,
          budgetRange: formatBudgetRange(result.row.budgetMinCents, result.row.budgetMaxCents),
          ideaSummary: result.row.ideaSummary,
          status: result.row.status,
          readinessScore: result.row.readinessScore,
          createdAt: result.row.createdAt.toISOString(),
          portfolioAttribution: result.row.portfolioAttributionId ?? "Unattributed",
          assignedToUserId: result.row.assignedToUserId,
          stateEvents: result.row.stateEvents.map((event) => ({
            id: event.id,
            type: event.type,
            fromStatus: event.fromStatus,
            toStatus: event.toStatus,
            note: event.note ? "[redacted-dashboard-field]" : null,
            createdAt: event.createdAt.toISOString(),
          })),
        },
      ],
      redactedFields: ["clientEmail", "clientPhone", "medicalNotes", "privateNotes", "internalNotes"],
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        booking: view.records[0],
        auditId: result.audit.id,
        gapIds: ["GAP-007", "GAP-037"],
        boundary: "Dashboard booking detail reads are tenant-scoped, redacted, no-store, and audited.",
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          bookingId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Booking detail reads require the dashboard database connection." },
          gapIds: ["GAP-007", "GAP-037"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "BOOKING_DETAIL_READ_FAILED", message: "Booking could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}
