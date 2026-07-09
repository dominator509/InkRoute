import { buildTenantDashboardView } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { dashboardProjectedPayments } from "../../../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

interface PaymentDetailRouteContext {
  params: Promise<{ paymentId: string }>;
}

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

function buildPaymentDetailResponseProjection() {
  return {
    paymentIdEchoed: false,
    tenantIdEchoed: false,
    bookingRequestIdEchoed: false,
    depositIdEchoed: false,
    refundIdsEchoed: false,
    auditIdEchoed: false,
    paymentAuditIdEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildSafePaymentDetailRecord(record: Record<string, unknown>) {
  const {
    id: _id,
    tenantId: _tenantId,
    bookingRequestId,
    depositId,
    refunds,
    ...safeRecord
  } = record;

  return {
    ...safeRecord,
    bookingLinked: Boolean(bookingRequestId ?? safeRecord.bookingLinked),
    depositLinked: Boolean(depositId ?? safeRecord.depositLinked),
    refunds: Array.isArray(refunds)
      ? refunds.map((refund) => {
          if (typeof refund !== "object" || refund === null) return refund;
          const { id: _refundId, ...safeRefund } = refund as Record<string, unknown>;
          return safeRefund;
        })
      : refunds,
    responseProjection: buildPaymentDetailResponseProjection(),
  };
}

type PaymentDetailRefundRow = {
  id: string;
  status: string;
  amountCents: number;
  reason: string | null;
  createdAt: Date;
};

type PaymentDetailBookingRequestRow = {
  clientNameSnapshot: string | null;
  status: string;
};

type PaymentDetailRow = {
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
  bookingRequest: PaymentDetailBookingRequestRow | null;
  refunds: PaymentDetailRefundRow[];
};

export async function GET(request: NextRequest, context: PaymentDetailRouteContext) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "payment:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read payments." } }, { status: 403, headers: noStoreHeaders });
  }

  const { paymentId } = await context.params;
  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query a payment for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

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
          responseProjection: buildPaymentDetailResponseProjection(),
          productionBoundary: { localDashboardReadFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    const payment = dashboardProjectedPayments.find((row) => row.id === paymentId);
    if (!payment) {
      return NextResponse.json({ ok: false, error: { code: "PAYMENT_NOT_FOUND", message: "Payment was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "local-fallback",
        payment: buildSafePaymentDetailRecord(payment as Record<string, unknown>),
        tenantScope: { actorTenantMatched: true },
        responseProjection: buildPaymentDetailResponseProjection(),
        gapIds: ["GAP-004", "GAP-007", "GAP-037", "GAP-040"],
        boundary: "Local fallback returns a tenant-projected demo payment only; database mode is required for live payment reads.",
      },
      { headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const paymentModel = tx.payment as { findFirst: (args: unknown) => Promise<(PaymentDetailRow & { bookingRequest: PaymentDetailBookingRequestRow | null; refunds: PaymentDetailRefundRow[] }) | null> };
      const row = await paymentModel.findFirst({
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
            auditLogged: true,
            internalPersistenceIdsStored: false,
            redactedFields: ["providerPaymentId", "providerSessionId", "receiptUrl", "metadata", "refund.reason"],
          },
        },
        select: { id: true },
      });

      return { status: "found" as const, row, audit, paymentAudit };
    });

    if (result.status === "not_found") {
      return NextResponse.json({ ok: false, error: { code: "PAYMENT_NOT_FOUND", message: "Payment was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }

    const view = buildTenantDashboardView({
      collection: "payments",
      tenantId,
      source: "repository",
      records: [
        {
          clientName: result.row.bookingRequest?.clientNameSnapshot ?? "Unassigned client",
          bookingLinked: Boolean(result.row.bookingRequestId),
          bookingStatus: result.row.bookingRequest?.status ?? null,
          depositLinked: Boolean(result.row.depositId),
          amountCents: result.row.amountCents,
          status: result.row.status,
          provider: result.row.provider,
          currency: result.row.currency,
          description: result.row.description,
          paidAt: result.row.paidAt?.toISOString() ?? null,
          failedAt: result.row.failedAt?.toISOString() ?? null,
          createdAt: result.row.createdAt.toISOString(),
          providerPaymentId: result.row.providerPaymentId ? "[redacted-dashboard-field]" : null,
          providerSessionId: result.row.providerSessionId ? "[redacted-dashboard-field]" : null,
          receiptUrl: result.row.receiptUrl ? "[redacted-dashboard-field]" : null,
          hasProviderPaymentId: Boolean(result.row.providerPaymentId),
          hasProviderSessionId: Boolean(result.row.providerSessionId),
          hasReceiptUrl: Boolean(result.row.receiptUrl),
          metadata: redactPaymentMetadata(result.row.metadata),
          refunds: result.row.refunds.map((refund: PaymentDetailRefundRow) => ({
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
        persistence: "database",
        payment: buildSafePaymentDetailRecord(view.records[0] as Record<string, unknown>),
        auditLogged: true,
        paymentAuditLogged: true,
        tenantScope: { actorTenantMatched: true, paymentTenantMatched: true },
        responseProjection: buildPaymentDetailResponseProjection(),
        gapIds: ["GAP-004", "GAP-007", "GAP-037", "GAP-040"],
        boundary: "Dashboard payment detail reads are tenant-scoped, redacted, no-store, and audited in AuditLog plus PaymentAuditLog.",
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: { code: "DATABASE_UNAVAILABLE", message: "Payment detail reads require the dashboard database connection." },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildPaymentDetailResponseProjection(),
          gapIds: ["GAP-004", "GAP-007", "GAP-037", "GAP-040"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "PAYMENT_DETAIL_READ_FAILED", message: "Payment could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}
