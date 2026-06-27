import { buildTenantDashboardView } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { dashboardListQuerySchema } from "@inkroute/validators";
import { NextRequest, NextResponse } from "next/server";
import { dashboardProjectedBookingRows } from "../../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

function formatBudgetRange(min?: number | null, max?: number | null): string {
  if (typeof min !== "number" && typeof max !== "number") return "Not provided";
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  if (typeof min === "number" && typeof max === "number") return `${currency.format(min / 100)}-${currency.format(max / 100)}`;
  if (typeof min === "number") return `From ${currency.format(min / 100)}`;
  return `Up to ${currency.format((max ?? 0) / 100)}`;
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "booking:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read bookings." } }, { status: 403, headers: noStoreHeaders });
  }

  const query = dashboardListQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Dashboard booking list query failed validation.", issues: query.error.flatten() } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const tenantId = query.data.tenantId ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query bookings for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const limit = query.data.limit;

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_DASHBOARD_BOOKINGS_NOT_CONFIGURED",
            message: "Production dashboard booking list reads require DB-backed actor resolution and tenant-scoped BookingRequest reads; local fallback demo rows are disabled.",
            gapIds: ["GAP-007", "GAP-031", "GAP-032", "GAP-037"],
          },
          productionBoundary: { localDashboardBookingFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "local-fallback",
        count: dashboardProjectedBookingRows.length,
        bookings: dashboardProjectedBookingRows.slice(0, limit),
        gapIds: ["GAP-007", "GAP-037"],
        boundary: "Local fallback returns tenant-projected demo bookings only; database mode is required for live dashboard reads.",
      },
      { headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const rows = await tx.bookingRequest.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: limit,
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
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "booking:read:list",
          entityType: "BookingRequest",
          metadata: {
            source: "dashboard-api",
            count: rows.length,
            limit,
            redaction: "buildTenantDashboardView",
          },
        },
        select: { id: true },
      });

      return { rows, audit };
    });

    const view = buildTenantDashboardView({
      collection: "bookings",
      tenantId,
      source: "repository",
      records: result.rows.map((row: { id: string; tenantId: string; clientNameSnapshot: string; clientEmailSnapshot: string | null; clientPhoneSnapshot: string | null; preferredCity: string | null; preferredDate: Date | null; style: string | null; placement: string | null; sizeEstimate: string | null; budgetMinCents: number | null; budgetMaxCents: number | null; ideaSummary: string | null; status: string; readinessScore: number | null; createdAt: Date; portfolioAttributionId: string | null; assignedToUserId: string | null }) => ({
        id: row.id,
        tenantId: row.tenantId,
        clientName: row.clientNameSnapshot,
        clientEmail: row.clientEmailSnapshot,
        clientPhone: row.clientPhoneSnapshot,
        city: row.preferredCity,
        preferredWindow: row.preferredDate?.toISOString() ?? "Flexible",
        style: row.style,
        placement: row.placement,
        sizeEstimate: row.sizeEstimate,
        budgetRange: formatBudgetRange(row.budgetMinCents, row.budgetMaxCents),
        ideaSummary: row.ideaSummary,
        status: row.status,
        readinessScore: row.readinessScore,
        createdAt: row.createdAt.toISOString(),
        portfolioAttribution: row.portfolioAttributionId ?? "Unattributed",
        assignedToUserId: row.assignedToUserId,
      })),
      redactedFields: ["clientEmail", "clientPhone", "medicalNotes", "privateNotes", "internalNotes"],
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        count: view.records.length,
        bookings: view.records,
        auditId: result.audit.id,
        gapIds: ["GAP-007", "GAP-037"],
        boundary: "Dashboard booking list reads are tenant-scoped, redacted, no-store, and audited.",
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
          error: { code: "DATABASE_UNAVAILABLE", message: "Booking list reads require the dashboard database connection." },
          gapIds: ["GAP-007", "GAP-037"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "BOOKING_LIST_READ_FAILED", message: "Bookings could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}
