import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { dashboardRedactedMessageThreadDrafts } from "../../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

interface MessageThreadDetailRouteContext {
  params: Promise<{ threadId: string }>;
}

function redactedPreview(value: string | null | undefined): string {
  if (!value) return "[redacted-message-body]";
  return value.length > 0 ? "[redacted-message-body]" : "";
}

export async function GET(request: NextRequest, context: MessageThreadDetailRouteContext) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "message:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read messages." } }, { status: 403 });
  }

  const { threadId } = await context.params;
  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query a message thread for another tenant." } }, { status: 403 });
  }

  if (actor.source === "local-fallback") {
    const thread = dashboardRedactedMessageThreadDrafts.find((row) => row.subject === threadId || row.relatedBookingRequestId === threadId || row.relatedAppointmentId === threadId);
    if (!thread) {
      return NextResponse.json({ ok: false, error: { code: "MESSAGE_THREAD_NOT_FOUND", message: "Message thread was not found for this tenant." } }, { status: 404 });
    }
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "local-fallback",
        thread,
        gapIds: ["GAP-010", "GAP-064", "GAP-068"],
        boundary: "Local fallback returns a redacted demo message thread only; database mode is required for live message reads.",
      },
      { headers: { "Cache-Control": "no-store" } },
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
          client: { select: { preferredName: true, email: true, phone: true } },
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
              body: true,
              providerMessageId: true,
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
      return NextResponse.json({ ok: false, error: { code: "MESSAGE_THREAD_NOT_FOUND", message: "Message thread was not found for this tenant." } }, { status: 404 });
    }

    const thread = {
      id: result.row.id,
      tenantId: result.row.tenantId,
      clientId: result.row.clientId,
      bookingRequestId: result.row.bookingRequestId,
      appointmentId: result.row.appointmentId,
      subject: result.row.subject,
      isArchived: result.row.isArchived,
      lastMessageAt: result.row.lastMessageAt?.toISOString() ?? result.row.updatedAt.toISOString(),
      clientName: result.row.client.preferredName,
      clientEmail: "[redacted-dashboard-field]",
      clientPhone: result.row.client.phone ? "[redacted-dashboard-field]" : null,
      messages: result.row.messages.map((message) => ({
        id: message.id,
        senderUserId: message.senderUserId,
        senderClientId: message.senderClientId,
        channel: message.channel,
        direction: message.direction,
        status: message.status,
        bodyPreview: redactedPreview(message.body),
        providerMessageId: message.providerMessageId ? "[redacted-dashboard-field]" : null,
        sentAt: message.sentAt?.toISOString() ?? null,
        readAt: message.readAt?.toISOString() ?? null,
        createdAt: message.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        thread,
        auditId: result.audit.id,
        gapIds: ["GAP-010", "GAP-064", "GAP-068"],
        boundary: "Dashboard message thread detail reads are tenant-scoped, body/provider redacted, no-store, and audited.",
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
          threadId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Message thread detail reads require the dashboard database connection." },
          gapIds: ["GAP-010", "GAP-064", "GAP-068"],
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "MESSAGE_THREAD_DETAIL_READ_FAILED", message: "Message thread could not be loaded." } }, { status: 500 });
  }
}
