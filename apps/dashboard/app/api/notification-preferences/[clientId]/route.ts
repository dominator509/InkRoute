import { createHash } from "node:crypto";
import { prisma } from "@inkroute/db";
import { notificationConsentInputSchema } from "@inkroute/validators";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

interface NotificationPreferenceRouteContext {
  params: Promise<{ clientId: string }>;
}

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function hashDestination(tenantId: string, channel: string, destination: string): string {
  return createHash("sha256").update(`${tenantId}:${channel}:${destination.trim().toLowerCase()}`).digest("hex");
}

function hashIdempotencySubject(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

export async function PATCH(request: NextRequest, context: NotificationPreferenceRouteContext) {
  let actor;
  try {
    actor = resolveDashboardActor(request);
    assertPermission(actor, "client:write");
  } catch (error) {
    const status = error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 403;
    const code = status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN";
    return NextResponse.json(
      { ok: false, error: { code, message: "Actor is not allowed to update notification preferences." } },
      { status, headers: noStoreHeaders },
    );
  }

  const { clientId } = await context.params;
  const tenantId = new URL(request.url).searchParams.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot update notification preferences for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Notification preference body must be valid JSON." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const parsed = notificationConsentInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Notification preference payload failed validation.",
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const input = parsed.data;
  const idempotencyKey =
    request.headers.get("idempotency-key") ??
    `notification-preference-update:${tenantId}:${clientId}:${hashIdempotencySubject(JSON.stringify(input))}`;
  if (input.clientId !== undefined && input.clientId !== clientId) {
    return NextResponse.json(
      { ok: false, error: { code: "CLIENT_ID_MISMATCH", message: "Notification preference body must match the route client id." } },
      { status: 409, headers: noStoreHeaders },
    );
  }

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          clientId,
          error: {
            code: "PROVIDER_NOTIFICATION_PREFERENCE_PERSISTENCE_NOT_CONFIGURED",
            message: "Production notification preference updates require DB-backed dashboard auth, tenant-scoped preferences/suppressions, and AuditLog rows; local fallback mutations are disabled.",
            gapIds: ["GAP-010", "GAP-038", "GAP-040", "GAP-065", "GAP-069"],
          },
          productionBoundary: { localNotificationPreferenceFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        source: actor.source,
        tenantId,
        clientId,
        error: {
          code: "DATABASE_REQUIRED",
          message: "Notification preference updates require database-backed dashboard auth so preference, suppression, client, and AuditLog rows can be persisted.",
        },
        gapIds: ["GAP-010", "GAP-038", "GAP-040", "GAP-065", "GAP-069"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-notification-preference-update", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-notification-preference-update",
          key: idempotencyKey,
          status: "claimed",
          metadata: toJsonValue({
            route: "/api/notification-preferences/[clientId]",
            action: "update_notification_preferences",
            clientId,
            preferenceHash: hashIdempotencySubject(JSON.stringify(input)),
            rawDestinationStoredInResult: false,
            providerWebhookReplayed: false,
            liveStopEnforced: false,
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/notification-preferences/[clientId]",
            action: "update_notification_preferences",
            clientId,
            replayObserved: true,
            preferenceHash: hashIdempotencySubject(JSON.stringify(input)),
            rawDestinationStoredInResult: false,
            providerWebhookReplayed: false,
            liveStopEnforced: false,
          }),
        },
        select: { id: true, status: true },
      });
      const client = await tx.client.findFirst({
        where: { id: clientId, tenantId },
        select: { id: true, email: true, phone: true },
      });
      if (!client) {
        return { status: "client_not_found" as const };
      }

      if (idempotency.status === "completed") {
        const replayClient = await tx.client.findFirst({
          where: { id: client.id, tenantId },
          select: { id: true, marketingOptIn: true, smsOptIn: true, updatedAt: true },
        });
        const preferences = await tx.notificationChannelPreference.findMany({
          where: { tenantId, subjectType: "client", subjectId: client.id },
          select: { id: true, channel: true, optedIn: true },
        });
        const suppressionInputs = [
          ...(input.unsubscribedAt && input.email ? [{ channel: "email" as const, destination: input.email, reason: "unsubscribe" }] : []),
          ...(input.smsStoppedAt && (input.phone ?? client.phone) ? [{ channel: "sms" as const, destination: input.phone ?? client.phone ?? "", reason: "STOP" }] : []),
          ...(input.pushDisabledAt && input.pushToken ? [{ channel: "push" as const, destination: input.pushToken, reason: "push_disabled" }] : []),
        ];
        const suppressions = suppressionInputs.length > 0
          ? await tx.notificationSuppression.findMany({
              where: {
                tenantId,
                OR: suppressionInputs.map((suppression) => ({
                  channel: suppression.channel,
                  destinationHash: hashDestination(tenantId, suppression.channel, suppression.destination),
                  reason: suppression.reason,
                })),
              },
              select: { id: true, channel: true, reason: true, active: true },
            })
          : [];

        if (replayClient) {
          return { status: "replayed" as const, client: replayClient, preferences, suppressions, idempotency };
        }
      }

      const updatedClient = await tx.client.update({
        where: { id: client.id },
        data: {
          marketingOptIn: input.marketingOptIn,
          smsOptIn: input.smsOptIn,
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
        },
        select: { id: true, marketingOptIn: true, smsOptIn: true, updatedAt: true },
      });

      const preferenceInputs = [
        { channel: "email" as const, optedIn: input.emailOptIn, destination: input.email ?? client.email },
        { channel: "sms" as const, optedIn: input.smsOptIn, destination: input.phone ?? client.phone ?? undefined },
        { channel: "push" as const, optedIn: input.pushOptIn, destination: input.pushToken },
        { channel: "in_app" as const, optedIn: input.transactionalAllowed, destination: input.inAppUserId ?? client.id },
      ];

      const preferences = [];
      for (const preference of preferenceInputs) {
        const row = await tx.notificationChannelPreference.upsert({
          where: {
            tenantId_subjectType_subjectId_channel: {
              tenantId,
              subjectType: "client",
              subjectId: client.id,
              channel: preference.channel,
            },
          },
          create: {
            tenantId,
            subjectType: "client",
            subjectId: client.id,
            channel: preference.channel,
            optedIn: preference.optedIn,
            source: "dashboard-api",
            metadata: { destinationStored: Boolean(preference.destination), actorUserId: actor.actorUserId },
          },
          update: {
            optedIn: preference.optedIn,
            source: "dashboard-api",
            metadata: { destinationStored: Boolean(preference.destination), actorUserId: actor.actorUserId },
          },
          select: { id: true, channel: true, optedIn: true },
        });
        preferences.push(row);
      }

      const suppressions = [];
      const suppressionInputs = [
        ...(input.unsubscribedAt && input.email ? [{ channel: "email" as const, destination: input.email, reason: "unsubscribe" }] : []),
        ...(input.smsStoppedAt && (input.phone ?? client.phone) ? [{ channel: "sms" as const, destination: input.phone ?? client.phone ?? "", reason: "STOP" }] : []),
        ...(input.pushDisabledAt && input.pushToken ? [{ channel: "push" as const, destination: input.pushToken, reason: "push_disabled" }] : []),
      ];
      for (const suppression of suppressionInputs) {
        const row = await tx.notificationSuppression.upsert({
          where: {
            tenantId_channel_destinationHash_reason: {
              tenantId,
              channel: suppression.channel,
              destinationHash: hashDestination(tenantId, suppression.channel, suppression.destination),
              reason: suppression.reason,
            },
          },
          create: {
            tenantId,
            channel: suppression.channel,
            destinationHash: hashDestination(tenantId, suppression.channel, suppression.destination),
            reason: suppression.reason,
            source: "dashboard-api",
            active: true,
            rawPayloadStored: false,
            metadata: { clientId: client.id, actorUserId: actor.actorUserId },
          },
          update: {
            active: true,
            source: "dashboard-api",
            rawPayloadStored: false,
            metadata: { clientId: client.id, actorUserId: actor.actorUserId },
          },
          select: { id: true, channel: true, reason: true, active: true },
        });
        suppressions.push(row);
      }

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "notification.preferences.update",
          entityType: "Client",
          entityId: client.id,
          metadata: {
            source: "dashboard-api",
            preferenceCount: preferences.length,
            suppressionCount: suppressions.length,
            rawPayloadStored: false,
            idempotencyKeyId: idempotency.id,
            boundary: "Dashboard preference update only; provider webhook STOP/unsubscribe replay proof and live suppression enforcement remain gated.",
          },
        },
        select: { id: true, createdAt: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-notification-preference-update", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            clientId: client.id,
            auditId: audit.id,
            preferenceCount: preferences.length,
            suppressionCount: suppressions.length,
            rawDestinationStoredInResult: false,
            providerWebhookReplayed: false,
            liveStopEnforced: false,
          }),
        },
      });

      return { status: "updated" as const, client: updatedClient, preferences, suppressions, audit, idempotency };
    });

    if (result.status === "client_not_found") {
      return NextResponse.json({ ok: false, error: { code: "CLIENT_NOT_FOUND", message: "Client was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        clientId,
        persistence: "database",
        client: { ...result.client, updatedAt: result.client.updatedAt.toISOString() },
        preferences: result.preferences,
        suppressions: result.suppressions,
        auditId: result.status === "updated" ? result.audit.id : null,
        idempotencyKeyId: result.idempotency.id,
        idempotencyReplay: result.status === "replayed",
        gapIds: ["GAP-010", "GAP-038", "GAP-040", "GAP-065", "GAP-069"],
        boundary: "Notification preferences and suppression markers are tenant-scoped, no-store, idempotency-backed, and audited; provider webhook replay, live STOP enforcement, and integration evidence remain gated.",
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
          clientId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Notification preference updates require the dashboard database connection." },
          gapIds: ["GAP-010", "GAP-038", "GAP-040", "GAP-065", "GAP-069"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "NOTIFICATION_PREFERENCE_UPDATE_FAILED", message: "Notification preferences could not be updated." } }, { status: 500, headers: noStoreHeaders });
  }
}
