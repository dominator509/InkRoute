import { buildTenantDashboardView } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { dashboardProjectedPayments } from "../../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

function redactPaymentMetadataValue(key: string, value: unknown): unknown {
  if (/secret|token|intent|session|customer|email|phone|receipt|url/i.test(key)) return "[redacted-dashboard-field]";
  if (Array.isArray(value)) return value.map((entry, index) => redactPaymentMetadataValue(String(index), entry));
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([nestedKey, nestedValue]) => [
        nestedKey,
        redactPaymentMetadataValue(nestedKey, nestedValue),
      ]),
    );
  }
  return value;
}

function redactPaymentMetadata(metadata: unknown): Record<string, unknown> {
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) return {};
  return redactPaymentMetadataValue("metadata", metadata) as Record<string, unknown>;
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

type PaymentListBookingRequestRow = {
  clientNameSnapshot: string | null;
};

type PaymentListRefundRow = {
  id: string;
  status: string;
  amountCents: number;
};

type PaymentListRow = {
  id: string;
  tenantId: string;
  bookingRequestId: string | null;
  depositId: string | null;
  provider: string;
  providerPaymentId: string | null;
  providerSessionId: string | null;
  status: string;
  amountCents: number;
  currency: string;
  description: string | null;
  receiptUrl: string | null;
  paidAt: Date | null;
  failedAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  bookingRequest: PaymentListBookingRequestRow | null;
  refunds: PaymentListRefundRow[];
};

function buildPaymentListResponseProjection() {
  return {
    paymentIdEchoed: false,
    paymentIdsEchoed: false,
    tenantIdEchoed: false,
    bookingRequestIdsEchoed: false,
    depositIdsEchoed: false,
    refundIdsEchoed: false,
    auditIdEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildSafePaymentListRecord(record: Record<string, unknown>) {
  const {
    id: _id,
    paymentId: _paymentId,
    tenantId: _tenantId,
    bookingId: _bookingId,
    bookingRequestId: _bookingRequestId,
    depositId: _depositId,
    refundId: _refundId,
    refundIds: _refundIds,
    refunds: _refunds,
    providerPaymentId,
    providerSessionId,
    receiptUrl,
    ...safeRecord
  } = record;
  const refunds = Array.isArray(_refunds)
    ? _refunds.map((refund) => {
        if (typeof refund !== "object" || refund === null) return refund;
        const { id: _refundRowId, refundId: _refundIdValue, ...safeRefund } = refund as Record<string, unknown>;
        return { ...safeRefund, refundIdEchoed: false };
      })
    : undefined;

  return {
    ...safeRecord,
    providerPaymentId: providerPaymentId ? "[redacted-dashboard-field]" : null,
    providerSessionId: providerSessionId ? "[redacted-dashboard-field]" : null,
    receiptUrl: receiptUrl ? "[redacted-dashboard-field]" : null,
    hasProviderPaymentId: Boolean(safeRecord.hasProviderPaymentId ?? providerPaymentId),
    hasProviderSessionId: Boolean(safeRecord.hasProviderSessionId ?? providerSessionId),
    hasReceiptUrl: Boolean(safeRecord.hasReceiptUrl ?? receiptUrl),
    bookingLinked: Boolean(safeRecord.bookingLinked ?? _bookingId ?? _bookingRequestId),
    depositLinked: Boolean(safeRecord.depositLinked ?? _depositId),
    ...(refunds ? { refunds } : {}),
    responseProjection: buildPaymentListResponseProjection(),
  };
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "payment:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read payments." } }, { status: 403, headers: noStoreHeaders });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query payments for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const limit = Math.min(Math.max(Number(params.get("limit") ?? 50), 1), 100);

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: {
            code: "PROVIDER_DASHBOARD_READS_NOT_CONFIGURED",
            message: "Production dashboard payment reads require DB-backed actor resolution and tenant-scoped repository data; local fallback demo payloads are disabled.",
            gapIds: ["GAP-004", "GAP-007", "GAP-037", "GAP-040"],
          },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildPaymentListResponseProjection(),
          productionBoundary: { localDashboardReadFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    const safePayments = dashboardProjectedPayments.slice(0, limit).map((payment) => buildSafePaymentListRecord(payment as Record<string, unknown>));

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "local-fallback",
        count: safePayments.length,
        payments: safePayments,
        tenantScope: { actorTenantMatched: true },
        responseProjection: buildPaymentListResponseProjection(),
        gapIds: ["GAP-004", "GAP-007", "GAP-037", "GAP-040"],
        boundary: "Local fallback returns tenant-projected demo payments only; database mode is required for live payment reads.",
      },
      { headers: noStoreHeaders },
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
        rows.map((row: PaymentListRow) =>
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
                auditLogged: true,
                internalPersistenceIdsStored: false,
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
      records: result.rows.map((row: PaymentListRow) => ({
        clientName: row.bookingRequest?.clientNameSnapshot ?? "Unassigned client",
        amountCents: row.amountCents,
        status: row.status,
        provider: row.provider,
        currency: row.currency,
        description: row.description,
        paidAt: row.paidAt?.toISOString() ?? null,
        failedAt: row.failedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        providerPaymentId: row.providerPaymentId ? "[redacted-dashboard-field]" : null,
        providerSessionId: row.providerSessionId ? "[redacted-dashboard-field]" : null,
        receiptUrl: row.receiptUrl ? "[redacted-dashboard-field]" : null,
        hasProviderPaymentId: Boolean(row.providerPaymentId),
        hasProviderSessionId: Boolean(row.providerSessionId),
        hasReceiptUrl: Boolean(row.receiptUrl),
        metadata: redactPaymentMetadata(row.metadata),
        bookingLinked: Boolean(row.bookingRequestId),
        depositLinked: Boolean(row.depositId),
        refundCount: row.refunds.length,
        refundedAmountCents: row.refunds.reduce((sum: number, refund: PaymentListRefundRow) => sum + refund.amountCents, 0),
      })),
      redactedFields: ["providerPaymentId", "providerSessionId", "receiptUrl", "metadata", "checkoutClientReferenceId", "checkoutIdempotencyKey"],
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "database",
        count: view.records.length,
        payments: view.records.map((payment) => buildSafePaymentListRecord(payment as Record<string, unknown>)),
        auditLogged: true,
        tenantScope: { actorTenantMatched: true },
        responseProjection: buildPaymentListResponseProjection(),
        gapIds: ["GAP-004", "GAP-007", "GAP-037", "GAP-040"],
        boundary: "Dashboard payment list reads are tenant-scoped, redacted, no-store, and audited in AuditLog plus PaymentAuditLog.",
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: { code: "DATABASE_UNAVAILABLE", message: "Payment list reads require the dashboard database connection." },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildPaymentListResponseProjection(),
          gapIds: ["GAP-004", "GAP-007", "GAP-037", "GAP-040"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "PAYMENT_LIST_READ_FAILED", message: "Payments could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}
