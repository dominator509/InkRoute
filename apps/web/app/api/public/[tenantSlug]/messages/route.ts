import { buildMessageThreadDraft } from "@inkroute/notifications";
import { prisma } from "@inkroute/db";
import { publicMessageInputSchema } from "@inkroute/validators";
import { createHash, randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, getClientIpFromHeaders, persistMessage, resolveTenant } from "../../../../../lib/localRuntimeState";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;
type TenantResolution = { tenantId: string; source: "database" | "local-fallback" };

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (!process.env.DATABASE_URL) return true;

  if (!(error instanceof Error)) return false;
  const code = (error as { code?: string }).code;
  if (typeof code === "string" && ["P1000", "P1001", "P1002", "P1003", "P1008"].includes(code)) return true;

  const message = error.message.toLowerCase();
  return message.includes("connect") && message.includes("database");
}

async function resolveMessageTenant(tenantSlug: string): Promise<TenantResolution | null> {
  const normalizedSlug = decodeURIComponent(tenantSlug).toLowerCase().trim();
  try {
    const prismaRuntime = prisma as unknown as {
      tenant: {
        findUnique: (options: { where: { slug: string }; select: { id: true } }) => Promise<{ id: string } | null>;
      };
    };
    const tenant = await prismaRuntime.tenant.findUnique({
      where: { slug: normalizedSlug },
      select: { id: true },
    });
    if (tenant?.id) return { tenantId: tenant.id, source: "database" };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
  }

  const local = resolveTenant(normalizedSlug);
  if (!local) return null;
  return { tenantId: local.tenantId, source: "local-fallback" };
}

function hashDestination(tenantId: string, channel: string, value: string | null | undefined): string | null {
  if (!value) return null;
  return createHash("sha256").update(`${tenantId}:${channel}:${value.trim().toLowerCase()}`).digest("hex");
}

function idempotencyStorageFingerprint(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function buildSafePublicMessageDatabaseResponse(result: {
  message: { status: string; channel: string; direction: string };
  handoff: { state: string };
  idempotencyReplayed?: boolean;
  duplicateSideEffectsCreated?: boolean;
}) {
  return {
    receipt: {
      threadPersisted: true,
      messagePersisted: true,
      messageStatus: result.message.status,
      messageChannel: result.message.channel,
      messageDirection: result.message.direction,
      notificationPersisted: true,
      deliveryPersisted: true,
      providerHandoffPersisted: true,
      providerHandoffState: result.handoff.state,
      auditPersisted: true,
      idempotencyPersisted: true,
      idempotencyReplayed: result.idempotencyReplayed === true,
      duplicateSideEffectsCreated: result.duplicateSideEffectsCreated === true,
      internalPersistenceIdsStored: false,
    },
    responseProjection: {
      threadIdEchoed: false,
      messageIdEchoed: false,
      notificationIdEchoed: false,
      deliveryIdEchoed: false,
      handoffIdEchoed: false,
      auditIdEchoed: false,
      idempotencyKeyIdEchoed: false,
      tenantIdEchoed: false,
      clientContactFieldsEchoed: false,
      clientProfileNameSelectedFromDatabase: false,
      rawDestinationEchoed: false,
      destinationHashEchoed: false,
      idempotencyKeyEchoed: false,
      rawMessageBodyEchoed: false,
      bodyPreviewEchoed: false,
      bookingRequestIdEchoed: false,
      internalPersistenceIdsEchoed: false,
      destinationHashOnly: true,
    },
  };
}

function buildSafePublicMessageDraftResponse(draft: ReturnType<typeof buildMessageThreadDraft>) {
  return {
    subject: draft.subject,
    channel: draft.channel,
    direction: draft.direction,
    status: draft.status,
    relatedBookingLinked: Boolean(draft.relatedBookingRequestId),
    relatedAppointmentLinked: Boolean(draft.relatedAppointmentId),
    piiRedactionNote: draft.piiRedactionNote,
    responseProjection: {
      rawMessageBodyEchoed: false,
      bodyPreviewEchoed: false,
      bookingRequestIdEchoed: false,
      appointmentIdEchoed: false,
      internalPersistenceIdsEchoed: false,
    },
  };
}

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } }, { status: 400, headers: noStoreHeaders });
  }

  const parsed = publicMessageInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Public message payload failed validation.", issues: parsed.error.flatten() } },
      { status: 400, headers: noStoreHeaders },
    );
  }
  const input = parsed.data;

  const resolvedTenant = await resolveMessageTenant(tenantSlug);
  if (!resolvedTenant) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_NOT_FOUND", message: "Messages endpoint is available for local demo tenant slug only." } },
      { status: 404, headers: noStoreHeaders },
    );
  }

  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = checkRateLimit("public-message", tenantSlug, `${clientIp}:${resolvedTenant.tenantId}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            gapIds: ["GAP-064", "GAP-068", "GAP-031"],
            remaining: rateLimit.remaining,
            retryAfterSeconds: rateLimit.retryAfterSeconds,
          },
        },
      },
      { status: 429, headers: { ...noStoreHeaders, "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const draft = buildMessageThreadDraft({
    subject: input.subject,
    body: input.body,
    ...(input.bookingRequestId ? { relatedBookingRequestId: input.bookingRequestId } : {}),
  });

  if (resolvedTenant.source === "database") {
    if (!draft.relatedBookingRequestId) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "PUBLIC_MESSAGE_BOOKING_CONTEXT_REQUIRED",
              message: "Production public messages require an existing booking request or authenticated client context before persistence.",
              gapIds: ["GAP-010", "GAP-064", "GAP-066"],
            },
            productionBoundary: {
              anonymousContactPersistenceDisabled: true,
              requiredBeforeEnablement: ["short-lived client reply tokens", "authenticated client identity", "tenant-scoped anonymous intake policy"],
            },
          },
          { status: 422, headers: noStoreHeaders },
        );
      }
    } else {
      try {
        const now = new Date();
        const idempotencyKey =
          request.headers.get("idempotency-key") ??
          `public-message:${randomUUID()}`;

        const result = await prisma.$transaction(async (tx) => {
          const booking = await tx.bookingRequest.findFirst({
            where: { id: draft.relatedBookingRequestId, tenantId: resolvedTenant.tenantId },
            select: {
              id: true,
              clientId: true,
              client: { select: { id: true, email: true, phone: true } },
            },
          });

          if (!booking?.clientId) return { status: "booking_context_missing" as const };

          const idempotency = await tx.idempotencyKey.upsert({
            where: { tenantId_scope_key: { tenantId: resolvedTenant.tenantId, scope: "public-message", key: idempotencyKey } },
            create: {
              tenantId: resolvedTenant.tenantId,
              scope: "public-message",
              key: idempotencyKey,
              status: "claimed",
              metadata: toJsonValue({
                route: "/api/public/[tenantSlug]/messages",
                bookingRequestId: booking.id,
                rawBodyStored: false,
              }),
            },
            update: {
              metadata: toJsonValue({
                route: "/api/public/[tenantSlug]/messages",
                bookingRequestId: booking.id,
                replayObserved: true,
                rawBodyStored: false,
              }),
            },
            select: { id: true, key: true, status: true },
          });

          if (idempotency.status === "completed") {
            return {
              status: "replayed" as const,
              message: { status: "queued", channel: "in_app", direction: "inbound" },
              handoff: { state: "queued" },
              idempotencyReplayed: true,
              duplicateSideEffectsCreated: false,
            };
          }

          const thread = await tx.messageThread.create({
            data: {
              tenantId: resolvedTenant.tenantId,
              clientId: booking.clientId,
              bookingRequestId: booking.id,
              subject: draft.subject,
              lastMessageAt: now,
            },
            select: { id: true, subject: true },
          });

          const message = await tx.message.create({
            data: {
              tenantId: resolvedTenant.tenantId,
              threadId: thread.id,
              senderClientId: booking.clientId,
              channel: "in_app",
              direction: "inbound",
              status: "queued",
              body: input.body,
            },
            select: { id: true, status: true, channel: true, direction: true },
          });

          const notification = await tx.notification.create({
            data: {
              tenantId: resolvedTenant.tenantId,
              clientId: booking.clientId,
              bookingRequestId: booking.id,
              type: "public_message_received",
              title: "New client message",
              body: "A client replied from the public booking flow.",
              status: "queued",
            },
            select: { id: true },
          });

          const delivery = await tx.notificationDelivery.create({
            data: {
              tenantId: resolvedTenant.tenantId,
              notificationId: notification.id,
              channel: "in_app",
              status: "queued",
              destinationHash: hashDestination(resolvedTenant.tenantId, "in_app", booking.client.email) ?? hashDestination(resolvedTenant.tenantId, "in_app", booking.client.phone),
              provider: "internal-dashboard",
            },
            select: { id: true },
          });

          const handoff = await tx.notificationProviderHandoff.create({
            data: {
              tenantId: resolvedTenant.tenantId,
              notificationId: notification.id,
              deliveryId: delivery.id,
              threadId: thread.id,
              messageId: message.id,
              channel: "in_app",
              provider: "internal-dashboard",
              state: "queued",
              idempotencyKey: idempotencyStorageFingerprint(idempotency.key),
              destinationHash: hashDestination(resolvedTenant.tenantId, "in_app", booking.client.email) ?? hashDestination(resolvedTenant.tenantId, "in_app", booking.client.phone),
              sanitizedPayload: toJsonValue({
                route: "/api/public/[tenantSlug]/messages",
                subject: draft.subject,
                bookingContextMatched: true,
                clientContextMatched: true,
                bodyPreview: "[redacted-message-body]",
                destinationHashOnly: true,
                rawContactFieldsStored: false,
                internalPersistenceIdsStored: false,
                rawIdempotencyKeyStored: false,
                providerDispatchDeferred: true,
              }),
            },
            select: { id: true, state: true },
          });

          const audit = await tx.auditLog.create({
            data: {
              tenantId: resolvedTenant.tenantId,
              action: "message.public_intake",
              entityType: "MessageThread",
              entityId: thread.id,
              metadata: toJsonValue({
                route: "/api/public/[tenantSlug]/messages",
                bookingContextMatched: true,
                messagePersisted: true,
                notificationPersisted: true,
                deliveryPersisted: true,
                providerHandoffPersisted: true,
                idempotencyPersisted: true,
                internalPersistenceIdsStored: false,
                redactedFields: ["message.body", "client.email", "client.phone"],
                destinationHashOnly: true,
                rawContactFieldsStored: false,
                rawPayloadStored: false,
                gapIds: ["GAP-010", "GAP-061", "GAP-064", "GAP-066"],
              }),
            },
            select: { id: true },
          });

          await tx.idempotencyKey.update({
            where: { tenantId_scope_key: { tenantId: resolvedTenant.tenantId, scope: "public-message", key: idempotency.key } },
            data: {
              status: "completed",
              result: toJsonValue({
                threadPersisted: true,
                messagePersisted: true,
                notificationPersisted: true,
                deliveryPersisted: true,
                providerHandoffPersisted: true,
                auditPersisted: Boolean(audit.id),
                internalPersistenceIdsStored: false,
                providerDispatchDeferred: true,
                rawContactFieldsStored: false,
                rawBodyStored: false,
              }),
            },
            select: { id: true },
          });

          return { status: "persisted" as const, thread, message, notification, delivery, handoff, audit, idempotency };
        });

        if (result.status === "persisted" || result.status === "replayed") {
          return NextResponse.json(
            {
              ok: true,
              data: {
                tenantScope: { routeTenantSlugReceived: true, tenantSlugEchoed: false },
                persistence: "database",
                draft: buildSafePublicMessageDraftResponse(draft),
                ...buildSafePublicMessageDatabaseResponse(result),
                providerDispatch: {
                  queued: result.status === "persisted",
                  provider: "internal-dashboard",
                  externalSendDeferred: true,
                  handoffState: result.handoff.state,
                },
                requiredNextWork: [
                  "Execute provider-backed notification workers after Resend/Twilio/Expo credentials are configured.",
                  "Add tenant-isolated public message integration tests with seeded booking/client data.",
                  "Prove provider webhook replay and suppression handling before production launch closure.",
                ],
              },
              runtimeBoundary: {
                tenantIdEchoed: false,
                messageCount: result.status === "persisted" ? 1 : 0,
                savedInLocalRuntime: false,
                savedInDatabase: result.status === "persisted",
                idempotencyReplay: result.status === "replayed",
                gapIds: ["GAP-010", "GAP-061", "GAP-064", "GAP-066"],
              },
            },
            { status: 201, headers: noStoreHeaders },
          );
        }

        if (process.env.NODE_ENV === "production") {
          return NextResponse.json(
            {
              ok: false,
              error: {
                code: "PUBLIC_MESSAGE_BOOKING_CONTEXT_NOT_FOUND",
                message: "Production public messages require a tenant-scoped booking request with a client before persistence.",
                gapIds: ["GAP-010", "GAP-064", "GAP-066"],
              },
              productionBoundary: { anonymousContactPersistenceDisabled: true },
            },
            { status: 404, headers: noStoreHeaders },
          );
        }
      } catch (error) {
        if (process.env.NODE_ENV === "production" || !isDatabaseUnavailable(error)) {
          return NextResponse.json(
            { ok: false, error: { code: "PUBLIC_MESSAGE_PERSISTENCE_FAILED", message: "Public message could not be persisted after validation." } },
            { status: isDatabaseUnavailable(error) ? 503 : 500, headers: noStoreHeaders },
          );
        }
      }
    }
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_MESSAGE_PERSISTENCE_NOT_CONFIGURED",
          message: "Production public messages require tenant-scoped database persistence and provider queue handoff; local runtime persistence is disabled.",
          gapIds: ["GAP-010", "GAP-061", "GAP-064", "GAP-066"],
        },
        productionBoundary: {
          localMessagePersistenceDisabled: true,
          requiredBeforeEnablement: [
            "tenant-scoped MessageThread and Message persistence",
            "NotificationDelivery/provider queue handoff",
            "suppression and consent checks",
            "provider webhook reconciliation",
          ],
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const persisted = persistMessage(tenantSlug, {
    subject: draft.subject,
    body: input.body,
    channel: draft.channel,
    ...(draft.relatedBookingRequestId ? { relatedBookingRequestId: draft.relatedBookingRequestId } : {}),
  });

  return NextResponse.json(
    {
      ok: true,
        data: {
          tenantScope: { routeTenantSlugReceived: true, tenantSlugEchoed: false },
          status: persisted.status,
          draft: buildSafePublicMessageDraftResponse(draft),
          responseProjection: {
            tenantIdEchoed: false,
            messageIdEchoed: false,
            bookingRequestIdEchoed: false,
            clientContactFieldsEchoed: false,
            rawDestinationEchoed: false,
            destinationHashEchoed: false,
            idempotencyKeyEchoed: false,
            rawMessageBodyEchoed: false,
            bodyPreviewEchoed: false,
            internalPersistenceIdsEchoed: false,
          },
          requiredNextWork: [
          "Resolve public tenant and client identity safely.",
          "Rate limit and spam-protect inbound public messages.",
          "Persist MessageThread and Message rows in a tenant-scoped transaction.",
          "Redact sensitive text from logs and error reports.",
          "Queue consent-aware notifications for the artist and client.",
        ],
      },
      runtimeBoundary: {
        tenantIdEchoed: false,
        messageCount: 1,
        savedInLocalRuntime: true,
        savedInDatabase: false,
        gapIds: ["GAP-009", "GAP-061", "GAP-064", "GAP-066"],
      },
    },
    { status: 201, headers: noStoreHeaders },
  );
}
