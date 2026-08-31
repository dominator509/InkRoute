import { inkrouteDemoTenant } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { createHash } from "node:crypto";
import type { NotificationChannel, NotificationStatus } from "@inkroute/types";

type ProviderNotificationWebhookPersistenceInput = {
  tenantSlug: string;
  provider: "resend" | "twilio";
  channel: NotificationChannel;
  eventId: string;
  eventType: string;
  providerMessageId?: string;
  normalizedStatus?: string;
  payloadSummary: Record<string, unknown>;
  rawPayloadStored: boolean;
  signatureHeaderPresent: boolean;
  suppressionDestination?: string;
  suppressionReason?: string;
  inboundBodyProvided?: boolean;
};

type ProviderNotificationWebhookPersistenceResult = {
  persistence: "database-provider-event-transaction" | "duplicate-provider-event" | "tenant-unresolved" | "database-unavailable" | "database-write-rejected";
  providerEventPersisted: boolean;
  idempotencyKeyEchoed: false;
  auditLogged: boolean;
  deliveryMatched: boolean;
  deliveryStatusTransitionPersisted: boolean;
  deliveryStatusMutated: boolean;
  suppressionPersisted: boolean;
  suppressionWritten: boolean;
  inboundThreadCreated: boolean;
  inboundThreadBoundary: string | null;
  replayDetected: boolean;
  internalPersistenceIdsEchoed: false;
};

const notificationStatuses = new Set<NotificationStatus>(["pending", "queued", "sent", "delivered", "failed", "cancelled"]);

function resolveTenantId(tenantSlug: string): string | null {
  if (tenantSlug === inkrouteDemoTenant.slug || tenantSlug === inkrouteDemoTenant.id) return inkrouteDemoTenant.id;
  return null;
}

function normalizeStatus(status?: string): NotificationStatus | null {
  const normalized = status?.trim().toLowerCase();
  return normalized && notificationStatuses.has(normalized as NotificationStatus) ? (normalized as NotificationStatus) : null;
}

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function storageFingerprint(value: string): string {
  return `sha256:${hashValue(value)}`;
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (!process.env.DATABASE_URL) return true;
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: string }).code;
  if (typeof code === "string" && ["P1000", "P1001", "P1002", "P1003", "P1008"].includes(code)) return true;
  const message = error.message.toLowerCase();
  return message.includes("connect") && message.includes("database");
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "P2002");
}

export async function persistProviderNotificationWebhookEvent(
  input: ProviderNotificationWebhookPersistenceInput,
): Promise<ProviderNotificationWebhookPersistenceResult> {
  const tenantId = resolveTenantId(input.tenantSlug);
  const normalizedStatus = normalizeStatus(input.normalizedStatus);
  const rawEventId = input.eventId.trim() || "missing-event-id";
  const eventId = storageFingerprint(rawEventId);
  const providerMessageId = input.providerMessageId ? storageFingerprint(input.providerMessageId) : null;
  const idempotencyKey = `notification-webhook:${hashValue(JSON.stringify([tenantId ?? input.tenantSlug, input.provider, eventId]))}`;

  if (!tenantId) {
    return {
      persistence: "tenant-unresolved",
      providerEventPersisted: false,
      idempotencyKeyEchoed: false,
      auditLogged: false,
      deliveryMatched: false,
      deliveryStatusTransitionPersisted: false,
      deliveryStatusMutated: false,
      suppressionPersisted: false,
      suppressionWritten: false,
      inboundThreadCreated: false,
      inboundThreadBoundary: null,
      replayDetected: false,
      internalPersistenceIdsEchoed: false,
    };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.idempotencyKey.create({
        data: {
          tenantId,
          scope: "notification.webhook",
          key: idempotencyKey,
          status: "claimed",
          metadata: {
            provider: input.provider,
            channel: input.channel,
            eventType: input.eventType,
            eventId,
            providerMessageId,
            signatureHeaderPresent: input.signatureHeaderPresent,
            rawPayloadStored: input.rawPayloadStored,
            rawProviderEventIdStored: false,
            rawProviderMessageIdStored: false,
          },
        },
      });

      const delivery = input.providerMessageId
        ? await tx.notificationDelivery.findFirst({
            where: { tenantId, providerMessageId: { in: [input.providerMessageId, providerMessageId].filter((value): value is string => Boolean(value)) } },
            select: { id: true, status: true },
          })
        : null;

      const providerEvent = await tx.providerEvent.create({
        data: {
          tenantId,
          deliveryId: delivery?.id ?? null,
          provider: input.provider,
          eventId,
          eventType: input.eventType,
          providerMessageId,
          normalizedStatus,
          idempotencyKey,
          payloadSummary: {
            provider: input.provider,
            channel: input.channel,
            eventType: input.eventType,
            eventIdHash: hashValue(rawEventId),
            providerMessageIdHash: input.providerMessageId ? hashValue(input.providerMessageId) : null,
            rawProviderEventIdStored: false,
            rawProviderMessageIdStored: false,
            rawPayloadStored: input.rawPayloadStored,
            signatureHeaderPresent: input.signatureHeaderPresent,
            summary: input.payloadSummary,
          },
          replayDetected: false,
          rawPayloadStored: input.rawPayloadStored,
          processedAt: new Date(),
        },
        select: { id: true },
      });

      const shouldMutateDelivery = Boolean(delivery && normalizedStatus && delivery.status !== normalizedStatus);
      const updatedDelivery = shouldMutateDelivery
        ? await tx.notificationDelivery.update({
            where: { id: delivery!.id },
            data: {
              status: normalizedStatus!,
              provider: input.provider,
              providerMessageId,
              ...(normalizedStatus === "delivered" ? { deliveredAt: new Date() } : {}),
              ...(normalizedStatus === "failed" ? { errorMessage: "Provider webhook reported delivery failure." } : {}),
            },
            select: { id: true },
          })
        : null;

      const transition = shouldMutateDelivery
        ? await tx.notificationDeliveryStatusTransition.create({
            data: {
              tenantId,
              deliveryId: updatedDelivery!.id,
              fromStatus: delivery!.status,
              toStatus: normalizedStatus!,
              reason: `${input.provider}.webhook.${input.eventType}`,
              metadata: {
                providerEventPersisted: true,
                idempotencyPersisted: true,
                rawIdempotencyKeyStored: false,
                internalPersistenceIdsStored: false,
                providerMessageIdHash: input.providerMessageId ? hashValue(input.providerMessageId) : null,
              },
            },
            select: { id: true },
          })
        : null;
      const suppressionDestinationHash = input.suppressionDestination ? hashValue(input.suppressionDestination.trim().toLowerCase()) : null;
      const suppression = suppressionDestinationHash && input.suppressionReason
        ? await tx.notificationSuppression.upsert({
            where: {
              tenantId_channel_destinationHash_reason: {
                tenantId,
                channel: input.channel,
                destinationHash: suppressionDestinationHash,
                reason: input.suppressionReason,
              },
            },
            create: {
              tenantId,
              channel: input.channel,
              provider: input.provider,
              destinationHash: suppressionDestinationHash,
              reason: input.suppressionReason,
              source: `${input.provider}.webhook`,
              providerEventId: providerEvent.id,
              active: true,
              rawPayloadStored: input.rawPayloadStored,
              metadata: {
                eventType: input.eventType,
                eventIdHash: hashValue(eventId),
                providerMessageIdHash: input.providerMessageId ? hashValue(input.providerMessageId) : null,
                providerSignatureVerified: false,
                productionEnablementGate: "cryptographic provider signature verification and live replay proof remain required",
              },
            },
            update: {
              active: true,
              providerEventId: providerEvent.id,
              rawPayloadStored: input.rawPayloadStored,
              metadata: {
                eventType: input.eventType,
                eventIdHash: hashValue(eventId),
                providerMessageIdHash: input.providerMessageId ? hashValue(input.providerMessageId) : null,
                providerSignatureVerified: false,
                replayRefresh: true,
              },
            },
            select: { id: true },
          })
        : null;
      const inboundThreadBoundary = input.inboundBodyProvided && !suppression
        ? "Inbound message thread persistence requires a tenant-scoped client match; local webhook intake records ProviderEvent only."
        : null;

      const auditLog = await tx.auditLog.create({
        data: {
          tenantId,
          action: "notification.webhook.provider_event.persist",
          entityType: "ProviderEvent",
          entityId: providerEvent.id,
          metadata: {
            provider: input.provider,
            channel: input.channel,
            eventType: input.eventType,
            idempotencyPersisted: true,
            rawIdempotencyKeyStored: false,
            providerEventPersisted: true,
            deliveryMatched: Boolean(delivery),
            deliveryStatusMutated: shouldMutateDelivery,
            suppressionPersisted: Boolean(suppression),
            suppressionWritten: Boolean(suppression),
            inboundThreadCreated: false,
            inboundThreadBoundary,
            internalPersistenceIdsStored: false,
            rawPayloadStored: input.rawPayloadStored,
            signatureHeaderPresent: input.signatureHeaderPresent,
            providerMessageIdHash: input.providerMessageId ? hashValue(input.providerMessageId) : null,
            providerSignatureVerified: false,
            productionEnablementGate: "cryptographic provider signature verification and live replay proof remain required",
          },
        },
        select: { id: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "notification.webhook", key: idempotencyKey } },
        data: {
          status: "completed",
          result: {
            providerEventPersisted: true,
            deliveryMatched: Boolean(delivery),
            deliveryStatusTransitionPersisted: Boolean(transition),
            deliveryStatusMutated: shouldMutateDelivery,
            suppressionPersisted: Boolean(suppression),
            suppressionWritten: Boolean(suppression),
            inboundThreadCreated: false,
            inboundThreadBoundary,
            internalPersistenceIdsStored: false,
          },
        },
      });

      return {
        persistence: "database-provider-event-transaction",
        providerEventPersisted: true,
        idempotencyKeyEchoed: false,
        auditLogged: true,
        deliveryMatched: Boolean(delivery),
        deliveryStatusTransitionPersisted: Boolean(transition),
        deliveryStatusMutated: shouldMutateDelivery,
        suppressionPersisted: Boolean(suppression),
        suppressionWritten: Boolean(suppression),
        inboundThreadCreated: false,
        inboundThreadBoundary,
        replayDetected: false,
        internalPersistenceIdsEchoed: false,
      };
    });
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      return {
        persistence: "duplicate-provider-event",
        providerEventPersisted: false,
        idempotencyKeyEchoed: false,
        auditLogged: false,
        deliveryMatched: false,
        deliveryStatusTransitionPersisted: false,
        deliveryStatusMutated: false,
        suppressionPersisted: false,
        suppressionWritten: false,
        inboundThreadCreated: false,
        inboundThreadBoundary: null,
        replayDetected: true,
        internalPersistenceIdsEchoed: false,
      };
    }

    return {
      persistence: isDatabaseUnavailable(error) ? "database-unavailable" : "database-write-rejected",
      providerEventPersisted: false,
      idempotencyKeyEchoed: false,
      auditLogged: false,
      deliveryMatched: false,
      deliveryStatusTransitionPersisted: false,
      deliveryStatusMutated: false,
      suppressionPersisted: false,
      suppressionWritten: false,
      inboundThreadCreated: false,
      inboundThreadBoundary: null,
      replayDetected: false,
      internalPersistenceIdsEchoed: false,
    };
  }
}
