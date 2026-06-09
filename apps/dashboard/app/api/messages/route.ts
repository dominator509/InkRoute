import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { dashboardRedactedMessageThreadDrafts } from "../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

function redactedPreview(value: string | null | undefined): string {
  if (!value) return "[redacted-message-body]";
  return value.length > 0 ? "[redacted-message-body]" : "";
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "message:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read messages." } }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query message threads for another tenant." } }, { status: 403 });
  }

  const limit = Math.min(Math.max(Number(params.get("limit") ?? 50), 1), 100);

  if (actor.source === "local-fallback") {
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
      { headers: { "Cache-Control": "no-store" } },
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
      { headers: { "Cache-Control": "no-store" } },
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
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "MESSAGE_THREAD_LIST_READ_FAILED", message: "Message threads could not be loaded." } }, { status: 500 });
  }
}
