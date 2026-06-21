import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@inkroute/db";
import { dashboardRedactedMessageThreadDrafts } from "../../../lib/demo";
import { buildDashboardMessagePersistencePlan, dashboardNotificationPersistenceContract } from "../../../lib/notificationPersistence";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

function redactedPreview(value: string | null | undefined): string {
  if (!value) return "[redacted-message-body]";
  return value.length > 0 ? "[redacted-message-body]" : "";
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2002";
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "message:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read messages." } }, { status: 403, headers: noStoreHeaders });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query message threads for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const limit = Math.min(Math.max(Number(params.get("limit") ?? 50), 1), 100);

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_DASHBOARD_READS_NOT_CONFIGURED",
            message: "Production dashboard message reads require DB-backed actor resolution and tenant-scoped repository data; local fallback demo payloads are disabled.",
            gapIds: ["GAP-007", "GAP-010", "GAP-037", "GAP-061", "GAP-064", "GAP-066"],
          },
          productionBoundary: { localDashboardReadFallbackDisabled: true },
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
        count: dashboardRedactedMessageThreadDrafts.length,
        threads: dashboardRedactedMessageThreadDrafts.slice(0, limit),
        gapIds: ["GAP-010", "GAP-064", "GAP-068"],
        boundary: "Local fallback returns redacted demo message threads only; database mode is required for live message reads.",
      },
      { headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const rows = await tx.messageThread.findMany({
        where: { tenantId },
        orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
        take: limit,
        select: {
          id: true,
          tenantId: true,
          clientId: true,
          bookingRequestId: true,
          appointmentId: true,
          subject: true,
          isArchived: true,
          lastMessageAt: true,
          updatedAt: true,
          client: { select: { preferredName: true, email: true, phone: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              channel: true,
              direction: true,
              status: true,
              body: true,
              providerMessageId: true,
              sentAt: true,
              readAt: true,
              createdAt: true,
            },
          },
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "message:read:list",
          entityType: "MessageThread",
          metadata: {
            source: "dashboard-api",
            count: rows.length,
            limit,
            redactedFields: ["client.email", "client.phone", "message.body", "providerMessageId"],
          },
        },
        select: { id: true },
      });

      return { rows, audit };
    });

    const threads = result.rows.map((row) => {
      const latest = row.messages[0];
      return {
        id: row.id,
        tenantId: row.tenantId,
        clientId: row.clientId,
        bookingRequestId: row.bookingRequestId,
        appointmentId: row.appointmentId,
        subject: row.subject,
        isArchived: row.isArchived,
        lastMessageAt: row.lastMessageAt?.toISOString() ?? row.updatedAt.toISOString(),
        clientName: row.client.preferredName,
        clientEmail: "[redacted-dashboard-field]",
        clientPhone: row.client.phone ? "[redacted-dashboard-field]" : null,
        latestMessage: latest
          ? {
              id: latest.id,
              channel: latest.channel,
              direction: latest.direction,
              status: latest.status,
              bodyPreview: redactedPreview(latest.body),
              providerMessageId: latest.providerMessageId ? "[redacted-dashboard-field]" : null,
              sentAt: latest.sentAt?.toISOString() ?? null,
              readAt: latest.readAt?.toISOString() ?? null,
              createdAt: latest.createdAt.toISOString(),
            }
          : null,
      };
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        count: threads.length,
        threads,
        auditId: result.audit.id,
        gapIds: ["GAP-010", "GAP-064", "GAP-068"],
        boundary: "Dashboard message thread list reads are tenant-scoped, body/provider redacted, no-store, and audited.",
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
          error: { code: "DATABASE_UNAVAILABLE", message: "Message thread reads require the dashboard database connection." },
          gapIds: ["GAP-010", "GAP-064", "GAP-068"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "MESSAGE_THREAD_LIST_READ_FAILED", message: "Message threads could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "message:write");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to write messages." } }, { status: 403, headers: noStoreHeaders });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_MESSAGE_WRITE_JSON", message: "Message write body must be valid JSON." } }, { status: 400, headers: noStoreHeaders });
  }

  const tenantId = typeof body.tenantId === "string" ? body.tenantId : actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot write message persistence rows for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const clientId = typeof body.clientId === "string" ? body.clientId : "";
  const subject = typeof body.subject === "string" ? body.subject : "Dashboard message";
  const messageBody = typeof body.body === "string" ? body.body : "";
  const requestId = typeof body.requestId === "string" ? body.requestId : crypto.randomUUID();
  const plan = buildDashboardMessagePersistencePlan("create_thread_message", {
    tenantId,
    actorUserId: actor.actorUserId,
    clientId,
    subject,
    body: messageBody,
    channel: "in_app",
    direction: "outbound",
    status: "queued",
    requestId,
    notificationType: typeof body.notificationType === "string" ? body.notificationType : "dashboard_message",
    deliveryChannel: "in_app",
    ...(typeof body.bookingRequestId === "string" ? { bookingRequestId: body.bookingRequestId } : {}),
    ...(typeof body.appointmentId === "string" ? { appointmentId: body.appointmentId } : {}),
  });

  if (plan.status === "blocked") {
    return NextResponse.json({ ok: false, error: { code: "MESSAGE_WRITE_BLOCKED", message: "Message persistence plan is blocked.", blockers: plan.blockers }, plan }, { status: 400, headers: noStoreHeaders });
  }

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_DASHBOARD_WRITES_NOT_CONFIGURED",
            message: "Production dashboard message writes require DB-backed actor resolution and tenant-scoped persistence; local fallback write plans are disabled.",
            gapIds: ["GAP-064", "GAP-066"],
          },
          productionBoundary: { localDashboardWriteFallbackDisabled: true },
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
        plan,
        providerBoundary: dashboardNotificationPersistenceContract.runtimeReadiness,
        gapIds: ["GAP-064", "GAP-066"],
        boundary: "Local fallback builds the tenant-scoped message write contract with redacted provider handoff planning; database mode is required for live message, notification, delivery, and audit writes.",
      },
      { status: 202, headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.idempotencyKey.create({
        data: {
          tenantId,
          scope: "dashboard-message-write",
          key: plan.idempotencyKey,
          status: "claimed",
          metadata: {
            action: plan.action,
            actorUserId: actor.actorUserId,
            requestId,
            redactedFields: ["message.body", "Notification.body", "destinationHash"],
          },
        },
        select: { id: true },
      });

      const thread = await tx.messageThread.create({
        data: {
          tenantId,
          clientId,
          subject,
          lastMessageAt: new Date(),
          ...(typeof body.bookingRequestId === "string" ? { bookingRequestId: body.bookingRequestId } : {}),
          ...(typeof body.appointmentId === "string" ? { appointmentId: body.appointmentId } : {}),
        },
        select: { id: true },
      });

      const message = await tx.message.create({
        data: {
          tenantId,
          threadId: thread.id,
          senderUserId: actor.actorUserId,
          channel: "in_app",
          direction: "outbound",
          status: "queued",
          body: messageBody,
        },
        select: { id: true },
      });

      const readState = await tx.notificationReadState.upsert({
        where: {
          tenantId_threadId_actorUserId_clientId: {
            tenantId,
            threadId: thread.id,
            actorUserId: actor.actorUserId,
            clientId,
          },
        },
        create: {
          tenantId,
          threadId: thread.id,
          messageId: message.id,
          actorUserId: actor.actorUserId,
          clientId,
          metadata: {
            action: "message:write:create_thread_message",
            source: "dashboard-api",
          },
        },
        update: {
          messageId: message.id,
          readAt: new Date(),
          metadata: {
            action: "message:write:create_thread_message",
            source: "dashboard-api",
          },
        },
        select: { id: true },
      });

      const notification = await tx.notification.create({
        data: {
          tenantId,
          clientId,
          type: typeof body.notificationType === "string" ? body.notificationType : "dashboard_message",
          title: subject,
          body: plan.redactedBodyPreview,
          status: "queued",
        },
        select: { id: true },
      });

      const delivery = await tx.notificationDelivery.create({
        data: {
          tenantId,
          notificationId: notification.id,
          channel: "in_app",
          status: "queued",
          destinationHash: plan.destinationHash,
          provider: "in_app",
        },
        select: { id: true },
      });

      const deliveryStatusTransition = await tx.notificationDeliveryStatusTransition.create({
        data: {
          tenantId,
          deliveryId: delivery.id,
          fromStatus: null,
          toStatus: "queued",
          actorUserId: actor.actorUserId,
          reason: "dashboard_message_created",
          metadata: {
            action: "message:write:create_thread_message",
            source: "dashboard-api",
            notificationId: notification.id,
            redactedFields: ["message.body", "Notification.body", "destinationHash"],
          },
        },
        select: { id: true },
      });

      const providerHandoff = await tx.notificationProviderHandoff.create({
        data: {
          tenantId,
          notificationId: notification.id,
          deliveryId: delivery.id,
          threadId: thread.id,
          messageId: message.id,
          channel: "in_app",
          provider: "in_app",
          state: "queued",
          idempotencyKey: plan.idempotencyKey,
          destinationHash: plan.destinationHash,
          sanitizedPayload: {
            action: "message:write:create_thread_message",
            source: "dashboard-api",
            threadId: thread.id,
            messageId: message.id,
            notificationId: notification.id,
            deliveryId: delivery.id,
            redactedBodyPreview: plan.redactedBodyPreview,
            redactedFields: ["message.body", "Notification.body", "destinationHash"],
          },
        },
        select: { id: true },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "message:write:create_thread_message",
          entityType: "MessageThread",
          entityId: thread.id,
          metadata: {
            messageId: message.id,
            notificationId: notification.id,
            deliveryId: delivery.id,
            readStateId: readState.id,
            deliveryStatusTransitionId: deliveryStatusTransition.id,
            providerHandoffId: providerHandoff.id,
            idempotencyKey: plan.idempotencyKey,
            redactedFields: ["message.body", "Notification.body", "destinationHash"],
          },
        },
        select: { id: true },
      });

      await tx.idempotencyKey.update({
        where: {
          tenantId_scope_key: {
            tenantId,
            scope: "dashboard-message-write",
            key: plan.idempotencyKey,
          },
        },
        data: {
          status: "committed",
          result: {
            threadId: thread.id,
            messageId: message.id,
            notificationId: notification.id,
            deliveryId: delivery.id,
            readStateId: readState.id,
            deliveryStatusTransitionId: deliveryStatusTransition.id,
            providerHandoffId: providerHandoff.id,
            auditId: audit.id,
          },
        },
      });

      return { thread, message, notification, delivery, readState, deliveryStatusTransition, providerHandoff, audit };
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        ids: {
          threadId: result.thread.id,
          messageId: result.message.id,
          notificationId: result.notification.id,
          deliveryId: result.delivery.id,
          readStateId: result.readState.id,
          deliveryStatusTransitionId: result.deliveryStatusTransition.id,
          providerHandoffId: result.providerHandoff.id,
          auditId: result.audit.id,
        },
        plan,
        gapIds: ["GAP-064", "GAP-066"],
        boundary: "Dashboard message writes claim IdempotencyKey before side effects, create tenant-scoped MessageThread, Message, Notification, NotificationDelivery, NotificationReadState, NotificationDeliveryStatusTransition, NotificationProviderHandoff, and AuditLog rows transactionally, and store redacted idempotency results.",
      },
      { status: 201, headers: noStoreHeaders },
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: { code: "DUPLICATE_MESSAGE_WRITE", message: "Message write idempotency key has already been claimed." },
          gapIds: ["GAP-064", "GAP-066"],
        },
        { status: 409, headers: noStoreHeaders },
      );
    }

    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Message writes require the dashboard database connection." },
          gapIds: ["GAP-064", "GAP-066"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "MESSAGE_WRITE_FAILED", message: "Message persistence rows could not be written." } }, { status: 500, headers: noStoreHeaders });
  }
}

