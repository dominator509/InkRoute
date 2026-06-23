import { createHash } from "node:crypto";
import { prisma } from "@inkroute/db";
import { depositInputSchema } from "@inkroute/validators";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function hashIdempotencySubject(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function resultDepositId(result: unknown): string | null {
  if (!result || typeof result !== "object" || !("depositId" in result)) {
    return null;
  }

  const value = (result as { depositId?: unknown }).depositId;
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
      { ok: false, error: { code, message: "Actor is not allowed to create deposit sessions." } },
      { status, headers: noStoreHeaders },
    );
  }

  const tenantId = new URL(request.url).searchParams.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot create deposits for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Deposit body must be valid JSON." } }, { status: 400, headers: noStoreHeaders });
  }

  const parsed = depositInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Deposit payload failed validation.", issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const input = parsed.data;
  const idempotencyKey =
    request.headers.get("idempotency-key") ??
    `deposit-draft:${tenantId}:${hashIdempotencySubject(
      `${input.bookingRequestId}:${input.appointmentId ?? "booking"}:${input.amountCents}:${input.currency}`,
    )}`;

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_DEPOSIT_SESSION_NOT_CONFIGURED",
            message: "Production deposit sessions require DB-backed dashboard auth, Deposit/PaymentAuditLog persistence, and Stripe checkout session creation; local fallback is disabled.",
            gapIds: ["GAP-004", "GAP-007", "GAP-038", "GAP-060"],
          },
          productionBoundary: { localDepositSessionFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      { ok: false, source: actor.source, tenantId, error: { code: "DATABASE_REQUIRED", message: "Deposit sessions require database-backed dashboard auth so Deposit and PaymentAuditLog rows can be persisted." }, gapIds: ["GAP-004", "GAP-007", "GAP-038", "GAP-060"] },
      { status: 409, headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-deposit-draft", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-deposit-draft",
          key: idempotencyKey,
          status: "claimed",
          metadata: toJsonValue({
            route: "/api/payments/deposit-session",
            action: "create_deposit_draft",
            depositHash: hashIdempotencySubject(
              `${input.bookingRequestId}:${input.appointmentId ?? "booking"}:${input.amountCents}:${input.currency}`,
            ),
            stripeCheckoutCreated: false,
            webhookReconciled: false,
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/payments/deposit-session",
            action: "create_deposit_draft",
            replayObserved: true,
            depositHash: hashIdempotencySubject(
              `${input.bookingRequestId}:${input.appointmentId ?? "booking"}:${input.amountCents}:${input.currency}`,
            ),
            stripeCheckoutCreated: false,
            webhookReconciled: false,
          }),
        },
        select: { id: true, status: true, result: true },
      });
      const replayDepositId = idempotency.status === "completed" ? resultDepositId(idempotency.result) : null;
      if (replayDepositId) {
        const deposit = await tx.deposit.findFirst({
          where: { id: replayDepositId, tenantId },
          select: { id: true, bookingRequestId: true, appointmentId: true, amountCents: true, currency: true, status: true, dueAt: true, createdAt: true },
        });

        if (deposit) {
          return { status: "replayed" as const, deposit, idempotency };
        }
      }

      const booking = await tx.bookingRequest.findFirst({
        where: { id: input.bookingRequestId, tenantId },
        select: { id: true, status: true, appointment: { select: { id: true } } },
      });
      if (!booking) return { status: "booking_not_found" as const };
      if (input.appointmentId !== undefined) {
        const appointment = await tx.appointment.findFirst({ where: { id: input.appointmentId, tenantId, bookingRequestId: booking.id }, select: { id: true } });
        if (!appointment) return { status: "appointment_not_found" as const };
      }

      const deposit = await tx.deposit.create({
        data: {
          tenantId,
          bookingRequestId: booking.id,
          ...(input.appointmentId !== undefined ? { appointmentId: input.appointmentId } : {}),
          amountCents: input.amountCents,
          currency: input.currency,
          status: input.status,
          ...(input.dueAt !== undefined ? { dueAt: new Date(input.dueAt) } : {}),
          ...(input.policySnapshot !== undefined ? { policySnapshot: input.policySnapshot } : {}),
        },
        select: { id: true, bookingRequestId: true, appointmentId: true, amountCents: true, currency: true, status: true, dueAt: true, createdAt: true },
      });

      const audit = await tx.paymentAuditLog.create({
        data: {
          tenantId,
          depositId: deposit.id,
          actorUserId: actor.actorUserId,
          action: "deposit.session.draft",
          provider: "stripe",
          metadata: {
            source: "dashboard-api",
            stripeCheckoutCreated: false,
            idempotencyKeyId: idempotency.id,
            boundary: "Deposit draft only; Stripe checkout session creation, webhook reconciliation, and provider rollback proof remain gated.",
          },
        },
        select: { id: true, createdAt: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-deposit-draft", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            depositId: deposit.id,
            auditId: audit.id,
            created: true,
            stripeCheckoutCreated: false,
            webhookReconciled: false,
          }),
        },
      });

      return { status: "created" as const, deposit, audit, idempotency };
    });

    if (result.status === "booking_not_found" || result.status === "appointment_not_found") {
      return NextResponse.json({ ok: false, error: { code: "RELATED_RECORD_NOT_FOUND", message: "Deposit booking and appointment must exist for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        deposit: {
          ...result.deposit,
          dueAt: result.deposit.dueAt?.toISOString() ?? null,
          createdAt: result.deposit.createdAt.toISOString(),
        },
        checkout: { provider: "stripe", created: false, url: null, requiredNextStep: "Stripe checkout session creation with provider credentials" },
        auditId: result.status === "created" ? result.audit.id : null,
        idempotencyKeyId: result.idempotency.id,
        idempotencyReplay: result.status === "replayed",
        gapIds: ["GAP-004", "GAP-007", "GAP-038", "GAP-060"],
        boundary: "Deposit draft persistence is tenant-scoped, no-store, idempotency-backed, and payment-audited; Stripe checkout and webhook evidence remain provider-gated.",
      },
      { status: result.status === "created" ? 202 : 200, headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { ok: false, source: actor.source, tenantId, error: { code: "DATABASE_UNAVAILABLE", message: "Deposit draft creation requires the dashboard database connection." }, gapIds: ["GAP-004", "GAP-007", "GAP-038", "GAP-060"] },
        { status: 503, headers: noStoreHeaders },
      );
    }
    return NextResponse.json({ ok: false, error: { code: "DEPOSIT_DRAFT_FAILED", message: "Deposit draft could not be persisted." } }, { status: 500, headers: noStoreHeaders });
  }
}
