import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { dashboardRedactedMessageThreadDrafts } from "../../../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

interface MessageThreadDetailRouteContext {
  params: Promise<{ threadId: string }>;
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function buildMessageThreadDetailResponseProjection() {
  return {
    threadIdEchoed: false,
    tenantIdEchoed: false,
    clientIdEchoed: false,
    bookingRequestIdEchoed: false,
    appointmentIdEchoed: false,
    messageIdsEchoed: false,
    senderIdsEchoed: false,
    auditIdEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildSafeLocalMessageThreadDetail(thread: Record<string, unknown>) {
  const {
    id: _id,
    tenantId: _tenantId,
    clientId: _clientId,
    relatedBookingRequestId,
    relatedAppointmentId,
    bookingRequestId,
    appointmentId,
    messages,
    ...safeThread
  } = thread;

  return {
    ...safeThread,
    bookingLinked: Boolean(relatedBookingRequestId ?? bookingRequestId),
    appointmentLinked: Boolean(relatedAppointmentId ?? appointmentId),
    messages: Array.isArray(messages)
      ? messages.map((message) => {
          if (typeof message !== "object" || message === null) return message;
          const { id: _messageId, senderUserId: _senderUserId, senderClientId: _senderClientId, ...safeMessage } = message as Record<string, unknown>;
          return safeMessage;
        })
      : messages,
    responseProjection: buildMessageThreadDetailResponseProjection(),
  };
}

export async function GET(request: NextRequest, context: MessageThreadDetailRouteContext) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "message:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read messages." } }, { status: 403, headers: noStoreHeaders });
  }

  const { threadId } = await context.params;
  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query a message thread for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: {
            code: "PROVIDER_DASHBOARD_READS_NOT_CONFIGURED",
            message: "Production dashboard message reads require DB-backed actor resolution and tenant-scoped repository data; local fallback demo payloads are disabled.",
            gapIds: ["GAP-007", "GAP-010", "GAP-037", "GAP-061", "GAP-064", "GAP-066"],
          },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildMessageThreadDetailResponseProjection(),
          productionBoundary: { localDashboardReadFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    const thread = dashboardRedactedMessageThreadDrafts.find((row) => row.subject === threadId || row.relatedBookingRequestId === threadId || row.relatedAppointmentId === threadId);
    if (!thread) {
      return NextResponse.json({ ok: false, error: { code: "MESSAGE_THREAD_NOT_FOUND", message: "Message thread was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "local-fallback",
        thread: buildSafeLocalMessageThreadDetail(thread as Record<string, unknown>),
        tenantScope: { actorTenantMatched: true },
        responseProjection: buildMessageThreadDetailResponseProjection(),
        gapIds: ["GAP-010", "GAP-064", "GAP-068"],
        boundary: "Local fallback returns a redacted demo message thread only; database mode is required for live message reads.",
      },
      { headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.messageThread.findFirst({
        where: { id: threadId, tenantId },
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
          client: { select: { preferredName: true } },
          messages: {
            orderBy: { createdAt: "asc" },
            take: 50,
            select: {
              id: true,
              senderUserId: true,
              senderClientId: true,
              channel: true,
              direction: true,
              status: true,
              sentAt: true,
              readAt: true,
              createdAt: true,
            },
          },
        },
      });

      if (!row) return { status: "not_found" as const };

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "message:read:detail",
          entityType: "MessageThread",
          entityId: row.id,
          metadata: {
            source: "dashboard-api",
            messageCount: row.messages.length,
            redactedFields: ["client.email", "client.phone", "message.body", "providerMessageId"],
          },
        },
        select: { id: true },
      });

      return { status: "found" as const, row, audit };
    });

    if (result.status === "not_found") {
      return NextResponse.json({ ok: false, error: { code: "MESSAGE_THREAD_NOT_FOUND", message: "Message thread was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }

    const thread = {
      clientLinked: Boolean(result.row.clientId),
      bookingLinked: Boolean(result.row.bookingRequestId),
      appointmentLinked: Boolean(result.row.appointmentId),
      subject: result.row.subject,
      isArchived: result.row.isArchived,
      lastMessageAt: result.row.lastMessageAt?.toISOString() ?? result.row.updatedAt.toISOString(),
      clientName: result.row.client.preferredName,
      clientEmail: "[redacted-dashboard-field]",
      clientPhone: "[redacted-dashboard-field]",
      clientEmailSelectedFromDatabase: false,
      clientPhoneSelectedFromDatabase: false,
      messages: result.row.messages.map((message: {
        id: string;
        senderUserId: string | null;
        senderClientId: string | null;
        channel: string;
        direction: string;
        status: string;
        sentAt: Date | null;
        readAt: Date | null;
        createdAt: Date;
      }) => ({
        senderType: message.senderUserId ? "dashboard-user" : message.senderClientId ? "client" : "system",
        channel: message.channel,
        direction: message.direction,
        status: message.status,
        bodyPreview: "[redacted-message-body]",
        bodySelectedFromDatabase: false,
        providerMessageId: "[redacted-dashboard-field]",
        providerMessageIdSelectedFromDatabase: false,
        sentAt: message.sentAt?.toISOString() ?? null,
        readAt: message.readAt?.toISOString() ?? null,
        createdAt: message.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "database",
        thread,
        auditLogged: true,
        tenantScope: { actorTenantMatched: true, threadTenantMatched: true },
        responseProjection: buildMessageThreadDetailResponseProjection(),
        gapIds: ["GAP-010", "GAP-064", "GAP-068"],
        boundary: "Dashboard message thread detail reads are tenant-scoped, body/provider redacted, no-store, and audited.",
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: { code: "DATABASE_UNAVAILABLE", message: "Message thread detail reads require the dashboard database connection." },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildMessageThreadDetailResponseProjection(),
          gapIds: ["GAP-010", "GAP-064", "GAP-068"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "MESSAGE_THREAD_DETAIL_READ_FAILED", message: "Message thread could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}
