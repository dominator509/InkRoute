import { dashboardMetrics } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { dashboardMetricsQuerySchema } from "@inkroute/validators";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function buildLocalMetrics() {
  return [
    ...dashboardMetrics,
    { label: "Data source", value: "Demo", detail: "Local fallback only; production requires DB-backed metrics." },
    { label: "Provider proof", value: "Gated", detail: "Runtime/CI evidence remains tracked under GAP-037 and GAP-112." },
  ];
}

function buildMetricsResponseProjection() {
  return {
    tenantIdEchoed: false,
    auditIdEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    if (actor.source !== "local-fallback") {
      assertPermission(actor, "analytics:read");
    } else {
      assertPermission(actor, "tenant:read");
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read dashboard metrics." } },
      { status: 403, headers: noStoreHeaders },
    );
  }

  const query = dashboardMetricsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Dashboard metrics query failed validation.",
          issues: query.error.flatten(),
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const tenantId = query.data.tenantId ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query metrics for another tenant." } },
      { status: 403, headers: noStoreHeaders },
    );
  }

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: {
            code: "PROVIDER_DASHBOARD_METRICS_NOT_CONFIGURED",
            message: "Production dashboard metrics require DB-backed actor resolution and tenant-scoped aggregate reads; local fallback metrics are disabled.",
            gapIds: ["GAP-007", "GAP-037", "GAP-112"],
          },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildMetricsResponseProjection(),
          productionBoundary: { localDashboardMetricsFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "local-fallback",
        metrics: buildLocalMetrics(),
        tenantScope: { actorTenantMatched: true },
        responseProjection: buildMetricsResponseProjection(),
        gapIds: ["GAP-007", "GAP-037", "GAP-112"],
        boundary: "Local fallback returns demo dashboard metrics only; database mode is required for tenant analytics readiness.",
      },
      { headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [
        openRequests,
        submittedRequests,
        scheduledAppointments,
        totalClients,
        pendingDeposits,
        paidPayments,
        analyticsEvents,
      ] = await Promise.all([
        tx.bookingRequest.count({ where: { tenantId, status: { in: ["submitted", "needs_info", "accepted", "deposit_pending"] } } }),
        tx.bookingRequest.count({ where: { tenantId, status: "submitted" } }),
        tx.appointment.count({ where: { tenantId, status: { in: ["tentative", "confirmed", "reschedule_requested"] } } }),
        tx.client.count({ where: { tenantId } }),
        tx.deposit.aggregate({ where: { tenantId, status: "pending" }, _sum: { amountCents: true }, _count: { _all: true } }),
        tx.payment.aggregate({ where: { tenantId, status: "paid" }, _sum: { amountCents: true }, _count: { _all: true } }),
        tx.analyticsEvent.count({ where: { tenantId } }),
      ]);

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "analytics:read:dashboard-metrics",
          entityType: "DashboardMetric",
          metadata: {
            source: "dashboard-api",
            route: "/api/metrics",
            redaction: "aggregate-counts-only",
          },
        },
        select: { id: true },
      });

      return {
        openRequests,
        submittedRequests,
        scheduledAppointments,
        totalClients,
        pendingDepositCount: pendingDeposits._count._all,
        pendingDepositCents: pendingDeposits._sum.amountCents ?? 0,
        paidPaymentCount: paidPayments._count._all,
        paidPaymentCents: paidPayments._sum.amountCents ?? 0,
        analyticsEvents,
        audit,
      };
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "database",
        metrics: [
          { label: "Open requests", value: String(result.openRequests), detail: `${result.submittedRequests} newly submitted` },
          { label: "Scheduled", value: String(result.scheduledAppointments), detail: "Tentative/confirmed/reschedule-requested appointments" },
          { label: "Clients", value: String(result.totalClients), detail: "Tenant-scoped client records" },
          { label: "Deposits pending", value: formatUsd(result.pendingDepositCents), detail: `${result.pendingDepositCount} pending deposit records` },
          { label: "Paid volume", value: formatUsd(result.paidPaymentCents), detail: `${result.paidPaymentCount} paid payment records` },
          { label: "Analytics events", value: String(result.analyticsEvents), detail: "Persisted public attribution events" },
        ],
        auditLogged: true,
        tenantScope: { actorTenantMatched: true },
        responseProjection: buildMetricsResponseProjection(),
        gapIds: ["GAP-007", "GAP-037", "GAP-112"],
        boundary: "Dashboard metrics are aggregate-only, tenant-scoped, no-store, and audited; runtime/CI performance evidence remains gated.",
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: { code: "DATABASE_UNAVAILABLE", message: "Dashboard metrics require the dashboard database connection." },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildMetricsResponseProjection(),
          gapIds: ["GAP-007", "GAP-037", "GAP-112"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      { ok: false, error: { code: "DASHBOARD_METRICS_READ_FAILED", message: "Dashboard metrics could not be loaded." } },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
