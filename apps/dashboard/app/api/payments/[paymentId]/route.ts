import { buildTenantDashboardView } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { dashboardProjectedPayments } from "../../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

interface PaymentDetailRouteContext {
  params: Promise<{ paymentId: string }>;
}

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

export async function GET(request: NextRequest, context: PaymentDetailRouteContext) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "payment:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read payments." } }, { status: 403 });
  }

  const { paymentId } = await context.params;
  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query a payment for another tenant." } }, { status: 403 });
  }

  if (actor.source === "local-fallback") {
    const payment = dashboardProjectedPayments.find((row) => row.id === paymentId);
    if (!payment) {
      return NextResponse.json({ ok: false, error: { code: "PAYMENT_NOT_FOUND", message: "Payment was not found for this tenant." } }, { status: 404 });
    }
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "local-fallback",
        payment,
        gapIds: ["GAP-004", "GAP-007", "GAP-037", "GAP-040"],
        boundary: "Local fallback returns a tenant-projected demo payment only; database mode is required for live payment reads.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.payment.findFirst({
        where: { id: paymentId, tenantId },
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
          bookingRequest: { select: { clientNameSnapshot: true, status: true } },
          refunds: { select: { id: true, status: true, amountCents: true, reason: true, createdAt: true } },
        },
      });

      if (!row) return { status: "not_found" as const };

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "payment:read:detail",
          entityType: "Payment",
          entityId: row.id,
          metadata: {
            source: "dashboard-api",
            redaction: "buildTenantDashboardView",
            includedRefunds: row.refunds.length,
          },
        },
        select: { id: true },
      });

      const paymentAudit = await tx.paymentAuditLog.create({
        data: {
          tenantId,
          paymentId: row.id,
          depositId: row.depositId,
          actorUserId: actor.actorUserId,
          action: "payment.dashboard_read",
          provider: row.provider,
          metadata: {
            source: "dashboard-api",
            scope: "detail",
            auditId: audit.id,
            redactedFields: ["providerPaymentId", "providerSessionId", "receiptUrl", "metadata", "refund.reason"],
          },
        },
        select: { id: true },
      });

      return { status: "found" as const, row, audit, paymentAudit };
    });

    if (result.status === "not_found") {
      return NextResponse.json({ ok: false, error: { code: "PAYMENT_NOT_FOUND", message: "Payment was not found for this tenant." } }, { status: 404 });
    }

    const view = buildTenantDashboardView({
      collection: "payments",
      tenantId,
      source: "repository",
      records: [
        {
          id: result.row.id,
          tenantId: result.row.tenantId,
          clientName: result.row.bookingRequest?.clientNameSnapshot ?? "Unassigned client",
          bookingId: result.row.bookingRequestId,
          bookingStatus: result.row.bookingRequest?.status ?? null,
          depositId: result.row.depositId,
          amountCents: result.row.amountCents,
          status: result.row.status,
          provider: result.row.provider,
          currency: result.row.currency,
          description: result.row.description,
          paidAt: result.row.paidAt?.toISOString() ?? null,
          failedAt: result.row.failedAt?.toISOString() ?? null,
          createdAt: result.row.createdAt.toISOString(),
          providerPaymentId: result.row.providerPaymentId,
          providerSessionId: result.row.providerSessionId,
          receiptUrl: result.row.receiptUrl,
          metadata: redactPaymentMetadata(result.row.metadata),
          refunds: result.row.refunds.map((refund) => ({
            id: refund.id,
            status: refund.status,
            amountCents: refund.amountCents,
            reason: refund.reason ? "[redacted-dashboard-field]" : null,
            createdAt: refund.createdAt.toISOString(),
          })),
        },
      ],
      redactedFields: ["providerPaymentId", "providerSessionId", "receiptUrl", "metadata", "checkoutClientReferenceId", "checkoutIdempotencyKey"],
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        payment: view.records[0],
        auditId: result.audit.id,
        paymentAuditId: result.paymentAudit.id,
        gapIds: ["GAP-004", "GAP-007", "GAP-037", "GAP-040"],
        boundary: "Dashboard payment detail reads are tenant-scoped, redacted, no-store, and audited in AuditLog plus PaymentAuditLog.",
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
          paymentId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Payment detail reads require the dashboard database connection." },
          gapIds: ["GAP-004", "GAP-007", "GAP-037", "GAP-040"],
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "PAYMENT_DETAIL_READ_FAILED", message: "Payment could not be loaded." } }, { status: 500 });
  }
}
