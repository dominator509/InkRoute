import { buildTenantDashboardView } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { dashboardProjectedPayments } from "../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

function redactPaymentMetadata(metadata: unknown): Record<string, unknown> {
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) return {};
  const record = metadata as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      /secret|token|intent|session|customer|email|phone|receipt|url/i.test(key) ? "[redacted-dashboard-field]" : value,
    ]),
  );
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "payment:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read payments." } }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query payments for another tenant." } }, { status: 403 });
  }

  const limit = Math.min(Math.max(Number(params.get("limit") ?? 50), 1), 100);

  if (actor.source === "local-fallback") {
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "local-fallback",
        count: dashboardProjectedPayments.length,
        payments: dashboardProjectedPayments.slice(0, limit),
        gapIds: ["GAP-004", "GAP-007", "GAP-037", "GAP-040"],
        boundary: "Local fallback returns tenant-projected demo payments only; database mode is required for live payment reads.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const rows = await tx.payment.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          tenantId: true,
          bookingRequestId: true,
          depositId: true,
          provider: true,
          providerPaymentId: true,
          providerSessionId: true,
          status: true,
          amountCents: true,
          currency: true,
          description: true,
          receiptUrl: true,
          paidAt: true,
          failedAt: true,
          metadata: true,
          createdAt: true,
          bookingRequest: { select: { clientNameSnapshot: true } },
          refunds: { select: { id: true, status: true, amountCents: true } },
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "payment:read:list",
          entityType: "Payment",
          metadata: {
            source: "dashboard-api",
            count: rows.length,
            limit,
            redaction: "buildTenantDashboardView",
            paymentAuditRows: rows.length,
          },
        },
        select: { id: true },
      });

      await Promise.all(
        rows.map((row) =>
          tx.paymentAuditLog.create({
            data: {
              tenantId,
              paymentId: row.id,
              depositId: row.depositId,
              actorUserId: actor.actorUserId,
              action: "payment.dashboard_read",
              provider: row.provider,
              metadata: {
                source: "dashboard-api",
                scope: "list",
                auditId: audit.id,
                redactedFields: ["providerPaymentId", "providerSessionId", "receiptUrl", "metadata"],
              },
            },
          }),
        ),
      );

      return { rows, audit };
    });

    const view = buildTenantDashboardView({
      collection: "payments",
      tenantId,
      source: "repository",
      records: result.rows.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        clientName: row.bookingRequest?.clientNameSnapshot ?? "Unassigned client",
        bookingId: row.bookingRequestId,
        depositId: row.depositId,
        amountCents: row.amountCents,
        status: row.status,
        provider: row.provider,
        currency: row.currency,
        description: row.description,
        paidAt: row.paidAt?.toISOString() ?? null,
        failedAt: row.failedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        providerPaymentId: row.providerPaymentId,
        providerSessionId: row.providerSessionId,
        receiptUrl: row.receiptUrl,
        metadata: redactPaymentMetadata(row.metadata),
        refundCount: row.refunds.length,
        refundedAmountCents: row.refunds.reduce((sum, refund) => sum + refund.amountCents, 0),
      })),
      redactedFields: ["providerPaymentId", "providerSessionId", "receiptUrl", "metadata", "checkoutClientReferenceId", "checkoutIdempotencyKey"],
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        count: view.records.length,
        payments: view.records,
        auditId: result.audit.id,
        gapIds: ["GAP-004", "GAP-007", "GAP-037", "GAP-040"],
        boundary: "Dashboard payment list reads are tenant-scoped, redacted, no-store, and audited in AuditLog plus PaymentAuditLog.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Payment list reads require the dashboard database connection." },
          gapIds: ["GAP-004", "GAP-007", "GAP-037", "GAP-040"],
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "PAYMENT_LIST_READ_FAILED", message: "Payments could not be loaded." } }, { status: 500 });
  }
}
