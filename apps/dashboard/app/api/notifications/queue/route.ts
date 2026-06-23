import { createHash } from "node:crypto";
import { buildDeliveryPlan, type ClientConsentSnapshot } from "@inkroute/notifications";
import { prisma } from "@inkroute/db";
import { notificationInputSchema } from "@inkroute/validators";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

export const runtime = "nodejs";

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hashQueueSubject(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function normalizeIdempotencyKey(request: NextRequest, fallback: string): string {
  const header = request.headers.get("x-idempotency-key")?.trim();
  return header && header.length <= 180 ? header : fallback;
}

function consentFromClient(client: {
  id: string;
  email: string;
  phone: string | null;
  preferredName: string;
  marketingOptIn: boolean;
  smsOptIn: boolean;
} | null): ClientConsentSnapshot {
  return {
    ...(client ? { clientId: client.id, email: client.email } : {}),
    ...(client?.phone ? { phone: client.phone } : {}),
    emailOptIn: Boolean(client?.marketingOptIn),
    smsOptIn: Boolean(client?.smsOptIn),
    pushOptIn: false,
    marketingOptIn: Boolean(client?.marketingOptIn),
    transactionalAllowed: true,
  };
}

export async function POST(request: NextRequest) {
  let actor;
  try {
    actor = resolveDashboardActor(request);
    assertPermission(actor, "settings:write");
  } catch (error) {
    const status = error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 403;
    const code = status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN";
    return NextResponse.json(
      { ok: false, error: { code, message: "Actor is not allowed to queue notifications." } },
      { status, headers: noStoreHeaders },
    );
  }

  const tenantId = new URL(request.url).searchParams.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot queue notifications for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Notification queue body must be valid JSON." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const parsed = notificationInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Notification queue payload failed validation.",
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const input = parsed.data;

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_NOTIFICATION_QUEUE_PERSISTENCE_NOT_CONFIGURED",
            message: "Production notification queueing requires DB-backed dashboard auth, tenant-scoped notification persistence, and provider-handoff rows; local fallback mutations are disabled.",
            gapIds: ["GAP-010", "GAP-038", "GAP-065", "GAP-069"],
          },
          productionBoundary: { localNotificationQueueFallbackDisabled: true },
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
          message: "Notification queueing requires database-backed dashboard auth so Notification, Delivery, Handoff, IdempotencyKey, and AuditLog rows can be persisted.",
        },
        gapIds: ["GAP-010", "GAP-038", "GAP-065", "GAP-069"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const client = input.clientId
        ? await tx.client.findFirst({
            where: { id: input.clientId, tenantId },
            select: { id: true, email: true, phone: true, preferredName: true, marketingOptIn: true, smsOptIn: true },
          })
        : null;

      if (input.clientId && !client) {
        return { status: "client_not_found" as const };
      }

      const idempotencyKey = normalizeIdempotencyKey(
        request,
        `notification-queue:${tenantId}:${input.type}:${input.clientId ?? input.userId ?? "system"}:${input.scheduledFor ?? "now"}`,
      );
      const requestHash = hashQueueSubject({ tenantId, input });
      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "notification.queue", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "notification.queue",
          key: idempotencyKey,
          requestHash,
          status: "claimed",
          metadata: {
            route: "/api/notifications/queue",
            action: "send_client_notification",
            notificationType: input.type,
            providerExecution: "deferred",
          },
        },
        update: {
          metadata: {
            route: "/api/notifications/queue",
            action: "send_client_notification",
            notificationType: input.type,
            providerExecution: "deferred",
            replayObserved: true,
          },
        },
        select: { id: true, key: true, requestHash: true, status: true, result: true },
      });
      if (idempotency.requestHash !== requestHash) {
        return { status: "idempotency_conflict" as const, idempotency };
      }
      if ((idempotency.status === "completed" || idempotency.status === "succeeded") && idempotency.result) {
        return { status: "duplicate" as const, idempotency, result: idempotency.result };
      }

      const consent = consentFromClient(client);
      const deliveryPlan = buildDeliveryPlan({
        key: input.type,
        context: {
          artistName: "InkRoute Artist",
          clientName: client?.preferredName ?? "Client",
          bookingUrl: input.bookingRequestId ? `/dashboard/bookings/${input.bookingRequestId}` : "/dashboard",
        },
        consent,
      });
      const queueableCandidates = deliveryPlan.candidates.filter((candidate) => candidate.status === "allowed" || candidate.status === "requires_provider");
      if (queueableCandidates.length === 0) {
        return { status: "not_queueable" as const, deliveryPlan };
      }

      const notification = await tx.notification.create({
        data: {
          tenantId,
          ...(input.userId !== undefined ? { userId: input.userId } : {}),
          ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
          ...(input.bookingRequestId !== undefined ? { bookingRequestId: input.bookingRequestId } : {}),
          ...(input.appointmentId !== undefined ? { appointmentId: input.appointmentId } : {}),
          type: input.type,
          title: input.title.trim(),
          body: input.body.trim(),
          status: input.status,
          ...(input.scheduledFor !== undefined ? { scheduledFor: new Date(input.scheduledFor) } : {}),
        },
        select: { id: true, type: true, status: true, scheduledFor: true, createdAt: true },
      });

      const deliveries = [];
      const handoffs = [];
      for (const candidate of queueableCandidates) {
        const delivery = await tx.notificationDelivery.create({
          data: {
            tenantId,
            notificationId: notification.id,
            channel: candidate.channel,
            status: candidate.status === "allowed" ? "queued" : "pending",
            destinationHash: candidate.destinationMasked ? hashValue(`${tenantId}:${candidate.channel}:${candidate.destinationMasked}`) : null,
            provider: candidate.provider,
          },
          select: { id: true, channel: true, provider: true, status: true },
        });
        deliveries.push(delivery);

        if (candidate.provider !== "in_app") {
          const handoff = await tx.notificationProviderHandoff.create({
            data: {
              tenantId,
              notificationId: notification.id,
              deliveryId: delivery.id,
              channel: candidate.channel,
              provider: candidate.provider,
              idempotencyKey: `${idempotencyKey}:${candidate.provider}:${candidate.channel}`,
              destinationHash: candidate.destinationMasked ? hashValue(`${tenantId}:${candidate.channel}:${candidate.destinationMasked}`) : null,
              sanitizedPayload: {
                notificationId: notification.id,
                templateKey: input.type,
                channel: candidate.channel,
                provider: candidate.provider,
                reason: candidate.reason,
                title: input.title,
                bodyPreview: input.body.slice(0, 160),
                providerExecution: "deferred",
              },
            },
            select: { id: true, channel: true, provider: true, state: true },
          });
          handoffs.push(handoff);
        }
      }

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "notification.queue",
          entityType: "Notification",
          entityId: notification.id,
          metadata: {
            source: "dashboard-api",
            idempotencyKey,
            queuedDeliveryCount: deliveries.length,
            providerHandoffCount: handoffs.length,
            providerExecution: "deferred",
          },
        },
        select: { id: true, createdAt: true },
      });

      const responsePayload = {
        notificationId: notification.id,
        deliveryIds: deliveries.map((delivery) => delivery.id),
        handoffIds: handoffs.map((handoff) => handoff.id),
        auditId: audit.id,
      };

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "notification.queue", key: idempotencyKey } },
        data: {
          status: "completed",
          result: responsePayload,
          metadata: { notificationId: notification.id, queuedDeliveryCount: deliveries.length },
        },
        select: { id: true },
      });

      return { status: "queued" as const, notification, deliveries, handoffs, audit, deliveryPlan, idempotency, idempotencyKey };
    });

    if (result.status === "client_not_found") {
      return NextResponse.json({ ok: false, error: { code: "CLIENT_NOT_FOUND", message: "Notification client was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }

    if (result.status === "duplicate") {
      return NextResponse.json(
        {
          ok: true,
          source: actor.source,
          tenantId,
          persistence: "database",
          duplicate: true,
          idempotencyKeyId: result.idempotency.id,
          idempotencyReplay: true,
          result: result.result,
          gapIds: ["GAP-010", "GAP-038", "GAP-065", "GAP-069"],
        },
        { status: 200, headers: noStoreHeaders },
      );
    }

    if (result.status === "idempotency_conflict") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: { code: "IDEMPOTENCY_CONFLICT", message: "Idempotency key was already used for a different notification queue payload." },
          idempotencyKeyId: result.idempotency.id,
          gapIds: ["GAP-010", "GAP-038", "GAP-065", "GAP-069"],
        },
        { status: 409, headers: noStoreHeaders },
      );
    }

    if (result.status === "not_queueable") {
      return NextResponse.json(
        { ok: false, error: { code: "NO_QUEUEABLE_CHANNELS", message: "No notification channels were allowed by destination and consent checks." }, deliveryPlan: result.deliveryPlan },
        { status: 409, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        notification: {
          ...result.notification,
          scheduledFor: result.notification.scheduledFor?.toISOString() ?? null,
          createdAt: result.notification.createdAt.toISOString(),
        },
        deliveries: result.deliveries,
        handoffs: result.handoffs,
        auditId: result.audit.id,
        idempotencyKey: result.idempotencyKey,
        idempotencyKeyId: result.idempotency.id,
        idempotencyReplay: false,
        deliveryPlan: result.deliveryPlan,
        gapIds: ["GAP-010", "GAP-038", "GAP-065", "GAP-069"],
        boundary: "Notification queue route persists local queue, delivery, provider-handoff, idempotency, and audit rows only; provider workers/sends, retries, dead letters, and sandbox/device evidence remain gated.",
      },
      { status: 202, headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Notification queueing requires the dashboard database connection." },
          gapIds: ["GAP-010", "GAP-038", "GAP-065", "GAP-069"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "NOTIFICATION_QUEUE_FAILED", message: "Notification could not be queued." } }, { status: 500, headers: noStoreHeaders });
  }
}
