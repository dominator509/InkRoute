import { createHash } from "node:crypto";
import { prisma } from "@inkroute/db";
import { refundInputSchema } from "@inkroute/validators";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function normalizeOptionalText(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function hashIdempotencySubject(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function resultRefundId(result: unknown): string | null {
  if (!result || typeof result !== "object" || !("refundId" in result)) {
    return null;
  }

  const value = (result as { refundId?: unknown }).refundId;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function POST(request: NextRequest) {
  let actor;
  try {
    actor = resolveDashboardActor(request);
    assertPermission(actor, "payment:write");
  } catch (error) {
    const status = error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 403;
    const code = status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN";
    return NextResponse.json(
      { ok: false, error: { code, message: "Actor is not allowed to create refunds." } },
      { status, headers: noStoreHeaders },
    );
  }

  const tenantId = new URL(request.url).searchParams.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot create refunds for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Refund body must be valid JSON." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const parsed = refundInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Refund payload failed validation.",
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const input = parsed.data;
  const idempotencyKey =
    request.headers.get("idempotency-key") ??
    `refund-create:${tenantId}:${hashIdempotencySubject(
      `${input.paymentId}:${input.amountCents}:${input.currency}:${input.providerRefundId ?? "local"}`,
    )}`;

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_REFUND_PERSISTENCE_NOT_CONFIGURED",
            message: "Production refund creation requires DB-backed dashboard auth, tenant-scoped Refund persistence, and PaymentAuditLog rows; local fallback mutations are disabled.",
            gapIds: ["GAP-007", "GAP-038", "GAP-060"],
          },
          productionBoundary: { localRefundMutationFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        source: actor.source,
        tenantId,
        error: {
          code: "DATABASE_REQUIRED",
          message: "Refund creation requires database-backed dashboard auth so Refund and PaymentAuditLog rows can be persisted.",
        },
        gapIds: ["GAP-007", "GAP-038", "GAP-060"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  try {
    const reason = normalizeOptionalText(input.reason);
    const result = await prisma.$transaction(async (tx) => {
      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-refund-create", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-refund-create",
          key: idempotencyKey,
          status: "claimed",
          metadata: toJsonValue({
            route: "/api/refunds",
            action: "create_refund_record",
            refundHash: hashIdempotencySubject(`${input.paymentId}:${input.amountCents}:${input.currency}:${input.providerRefundId ?? "local"}`),
            rawReasonStoredInResult: false,
            stripeRefundCreated: false,
            webhookReconciled: false,
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/refunds",
            action: "create_refund_record",
            replayObserved: true,
            refundHash: hashIdempotencySubject(`${input.paymentId}:${input.amountCents}:${input.currency}:${input.providerRefundId ?? "local"}`),
            rawReasonStoredInResult: false,
            stripeRefundCreated: false,
            webhookReconciled: false,
          }),
        },
        select: { id: true, status: true, result: true },
      });
      const replayRefundId = idempotency.status === "completed" ? resultRefundId(idempotency.result) : null;
      if (replayRefundId) {
        const refund = await tx.refund.findFirst({
          where: { id: replayRefundId, tenantId },
          select: {
            id: true,
            paymentId: true,
            bookingRequestId: true,
            depositId: true,
            providerRefundId: true,
            status: true,
            amountCents: true,
            currency: true,
            reason: true,
            createdAt: true,
          },
        });

        if (refund) {
          return { status: "replayed" as const, refund, idempotency };
        }
      }

      const payment = await tx.payment.findFirst({
        where: { id: input.paymentId, tenantId },
        select: { id: true, bookingRequestId: true, depositId: true, amountCents: true, currency: true, status: true, provider: true },
      });
      if (!payment) {
        return { status: "payment_not_found" as const };
      }
      if (input.amountCents > payment.amountCents) {
        return { status: "amount_exceeds_payment" as const };
      }
      if (input.currency !== payment.currency) {
        return { status: "currency_mismatch" as const };
      }
      if (input.bookingRequestId !== undefined && input.bookingRequestId !== payment.bookingRequestId) {
        return { status: "scope_mismatch" as const };
      }
      if (input.depositId !== undefined && input.depositId !== payment.depositId) {
        return { status: "scope_mismatch" as const };
      }

      const refund = await tx.refund.create({
        data: {
          tenantId,
          paymentId: payment.id,
          ...(payment.bookingRequestId ? { bookingRequestId: payment.bookingRequestId } : {}),
          ...(payment.depositId ? { depositId: payment.depositId } : {}),
          ...(input.providerRefundId !== undefined ? { providerRefundId: input.providerRefundId } : {}),
          status: input.status,
          amountCents: input.amountCents,
          currency: input.currency,
          ...(reason !== undefined ? { reason } : {}),
        },
        select: {
          id: true,
          paymentId: true,
          bookingRequestId: true,
          depositId: true,
          providerRefundId: true,
          status: true,
          amountCents: true,
          currency: true,
          reason: true,
          createdAt: true,
        },
      });

      const audit = await tx.paymentAuditLog.create({
        data: {
          tenantId,
          paymentId: payment.id,
          depositId: payment.depositId,
          actorUserId: actor.actorUserId,
          action: "refund.create",
          provider: payment.provider,
          metadata: {
            source: "dashboard-api",
            refundId: refund.id,
            refundStatus: refund.status,
            providerExecution: "deferred",
            idempotencyKeyId: idempotency.id,
            boundary: "Local refund record only; Stripe refund execution, webhook reconciliation, provider rollback, and settlement proof remain gated.",
          },
        },
        select: { id: true, createdAt: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-refund-create", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            refundId: refund.id,
            auditId: audit.id,
            created: true,
            rawReasonStoredInResult: false,
            stripeRefundCreated: false,
            webhookReconciled: false,
          }),
        },
      });

      return { status: "created" as const, refund, audit, idempotency };
    });

    if (result.status === "payment_not_found") {
      return NextResponse.json({ ok: false, error: { code: "PAYMENT_NOT_FOUND", message: "Payment was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }
    if (result.status === "amount_exceeds_payment" || result.status === "currency_mismatch" || result.status === "scope_mismatch") {
      return NextResponse.json({ ok: false, error: { code: "REFUND_SCOPE_INVALID", message: "Refund amount, currency, booking, and deposit must match the tenant-scoped payment." } }, { status: 409, headers: noStoreHeaders });
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        refund: { ...result.refund, createdAt: result.refund.createdAt.toISOString() },
        auditId: result.status === "created" ? result.audit.id : null,
        idempotencyKeyId: result.idempotency.id,
        idempotencyReplay: result.status === "replayed",
        gapIds: ["GAP-007", "GAP-038", "GAP-060"],
        boundary: "Refund record creation is tenant-scoped, no-store, idempotency-backed, and payment-audited; Stripe refund execution and webhook reconciliation remain provider-gated.",
      },
      { status: result.status === "created" ? 201 : 200, headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Refund creation requires the dashboard database connection." },
          gapIds: ["GAP-007", "GAP-038", "GAP-060"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "REFUND_CREATE_FAILED", message: "Refund could not be persisted." } }, { status: 500, headers: noStoreHeaders });
  }
}
