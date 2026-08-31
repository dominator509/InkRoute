import { notificationTemplateCatalog, type NotificationTemplateKey } from "@inkroute/notifications";
import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import {
  dashboardNotificationAutomationSequence,
  dashboardNotificationPlans,
  dashboardProviderBoundaryMatrix,
  dashboardRedactedProviderSendDrafts,
  dashboardTemplates,
} from "../../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

function catalogRows() {
  return Object.entries(notificationTemplateCatalog).map(([key, template]) => ({
    key: key as NotificationTemplateKey,
    purpose: template.purpose,
    defaultChannels: template.defaultChannels,
    requiresHumanReview: template.requiresHumanReview ?? false,
    containsSensitiveContent: template.sensitive ?? false,
    source: "coded-template-catalog",
  }));
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function buildTemplateReadResponseProjection() {
  return {
    tenantIdEchoed: false,
    notificationIdsEchoed: false,
    deliveryIdsEchoed: false,
    clientIdsEchoed: false,
    bookingRequestIdsEchoed: false,
    appointmentIdsEchoed: false,
    auditIdEchoed: false,
    internalPersistenceIdsEchoed: false,
    rawNotificationBodyEchoed: false,
    destinationHashEchoed: false,
    providerMessageIdEchoed: false,
    providerErrorEchoed: false,
  };
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "notification:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read notification templates." } }, { status: 403, headers: noStoreHeaders });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query notification templates for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const limit = Math.min(Math.max(Number(params.get("limit") ?? 50), 1), 100);
  const templates = catalogRows();

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: {
            code: "PROVIDER_DASHBOARD_READS_NOT_CONFIGURED",
            message: "Production dashboard template reads require DB-backed actor resolution and tenant-scoped repository data; local fallback demo payloads are disabled.",
            gapIds: ["GAP-007", "GAP-037", "GAP-040"],
          },
          responseProjection: buildTemplateReadResponseProjection(),
          productionBoundary: { localDashboardReadFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "local-fallback",
        templates,
        dashboardPreviews: dashboardTemplates,
        deliveryPlans: dashboardNotificationPlans,
        automationSequence: dashboardNotificationAutomationSequence.slice(0, limit),
        providerBoundaryMatrix: dashboardProviderBoundaryMatrix,
        redactedProviderSendDrafts: dashboardRedactedProviderSendDrafts,
        responseProjection: buildTemplateReadResponseProjection(),
        gapIds: ["GAP-010", "GAP-064", "GAP-065", "GAP-066"],
        boundary: "Local fallback returns coded template previews and redacted provider-send drafts only; provider delivery remains credential-gated.",
      },
      { headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [notifications, deliveries] = await Promise.all([
        tx.notification.findMany({
          where: { tenantId },
          orderBy: [{ scheduledFor: "asc" }, { updatedAt: "desc" }],
          take: limit,
          select: {
            id: true,
            type: true,
            title: true,
            status: true,
            scheduledFor: true,
            clientId: true,
            bookingRequestId: true,
            appointmentId: true,
            updatedAt: true,
            _count: { select: { deliveries: true } },
          },
        }),
        tx.notificationDelivery.findMany({
          where: { tenantId },
          orderBy: [{ attemptedAt: "desc" }, { updatedAt: "desc" }],
          take: limit,
          select: {
            id: true,
            notificationId: true,
            channel: true,
            status: true,
            provider: true,
            attemptedAt: true,
            deliveredAt: true,
            updatedAt: true,
          },
        }),
      ]);

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "notification:read:templates",
          entityType: "NotificationTemplate",
          metadata: {
            source: "dashboard-api",
            templateCount: templates.length,
            notificationCount: notifications.length,
            deliveryCount: deliveries.length,
            redactedFields: ["notification.body", "destinationHash", "providerMessageId", "errorMessage"],
          },
        },
        select: { id: true },
      });

      return { notifications, deliveries, audit };
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "database",
        templates,
        automationSequence: dashboardNotificationAutomationSequence.slice(0, limit),
        providerBoundaryMatrix: dashboardProviderBoundaryMatrix,
        queuedNotifications: result.notifications.map((notification) => ({
          type: notification.type,
          title: notification.title,
          bodyPreview: "[redacted-notification-body]",
          bodySelectedFromDatabase: false,
          status: notification.status,
          scheduledFor: notification.scheduledFor?.toISOString() ?? null,
          clientLinked: Boolean(notification.clientId),
          bookingRequestLinked: Boolean(notification.bookingRequestId),
          appointmentLinked: Boolean(notification.appointmentId),
          deliveryCount: notification._count.deliveries,
          updatedAt: notification.updatedAt.toISOString(),
          responseProjection: buildTemplateReadResponseProjection(),
        })),
        deliverySummaries: result.deliveries.map((delivery) => ({
          channel: delivery.channel,
          status: delivery.status,
          notificationLinked: Boolean(delivery.notificationId),
          destinationHash: "[redacted-dashboard-field]",
          destinationHashSelectedFromDatabase: false,
          provider: delivery.provider,
          providerMessageId: "[redacted-dashboard-field]",
          providerMessageIdSelectedFromDatabase: false,
          errorMessage: "[redacted-dashboard-field]",
          errorMessageSelectedFromDatabase: false,
          attemptedAt: delivery.attemptedAt?.toISOString() ?? null,
          deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
          updatedAt: delivery.updatedAt.toISOString(),
          responseProjection: buildTemplateReadResponseProjection(),
        })),
        auditLogged: true,
        responseProjection: buildTemplateReadResponseProjection(),
        gapIds: ["GAP-010", "GAP-064", "GAP-065", "GAP-066"],
        boundary: "Dashboard notification template reads expose coded template metadata plus tenant-scoped queue/delivery summaries only; message bodies, destination hashes, provider message IDs, and provider errors are redacted, and provider sends remain gated.",
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: { code: "DATABASE_UNAVAILABLE", message: "Notification template reads require the dashboard database connection." },
          responseProjection: buildTemplateReadResponseProjection(),
          gapIds: ["GAP-010", "GAP-064", "GAP-065", "GAP-066"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "NOTIFICATION_TEMPLATE_READ_FAILED", message: "Notification templates could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}
