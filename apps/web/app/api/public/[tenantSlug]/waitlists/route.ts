import { NextResponse } from "next/server";
import { prisma } from "@inkroute/db";
import { waitlistSignupInputSchema, type WaitlistSignupInput } from "@inkroute/validators";
import { createHash } from "crypto";
import {
  buildPublicContentProductionBoundary,
  isPublicContentDatabaseUnavailable,
  publicContentNoStoreHeaders,
  resolvePublicTenantScope,
} from "../../../../../lib/publicContentApi";
import { checkRateLimit, getClientIp, persistWaitlistSignupMessage } from "../../../../../lib/localRuntimeState";

export const runtime = "nodejs";

type DbWaitlistResult = {
  client: { id: string; email: string; preferredName: string };
  travelCity: { id: string; slug: string; city: string; region: string; waitlistEnabled: boolean };
  idempotency: { id: string; key: string };
  thread: { id: string; subject: string };
  message: { id: string; status: string };
  notification: { id: string; status: string; type: string };
  delivery: { id: string; status: string };
  handoff: { id: string; state: string };
  audit: { id: string };
};

function normalizeTenantSlug(value: string): string {
  return decodeURIComponent(value).toLowerCase().trim();
}

function buildWaitlistBoundary() {
  return {
    ...buildPublicContentProductionBoundary("travel"),
    collection: "waitlist",
    requiredBeforeEnablement: [
      "database-backed tenant resolution",
      "waitlist-enabled TravelCity lookup",
      "Client, MessageThread, Message, Notification, NotificationDelivery, NotificationProviderHandoff, AuditLog, and IdempotencyKey persistence",
      "notification provider worker and preference/suppression proof",
    ],
    gapIds: ["GAP-010", "GAP-026", "GAP-061", "GAP-064"],
  };
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function destinationHash(value: string) {
  return createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

function buildWaitlistBody(input: WaitlistSignupInput): string {
  return [
    `${input.clientName} joined the ${input.citySlug} travel waitlist.`,
    input.preferredStyle ? `Preferred style: ${input.preferredStyle}` : undefined,
    input.placement ? `Placement: ${input.placement}` : undefined,
    input.sizeEstimate ? `Size estimate: ${input.sizeEstimate}` : undefined,
    input.notes ? `Notes: ${input.notes}` : undefined,
    `Marketing opt-in: ${input.marketingOptIn ? "yes" : "no"}`,
    `SMS opt-in: ${input.smsOptIn ? "yes" : "no"}`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

async function persistWaitlistSignupToDatabase(tenantId: string, input: WaitlistSignupInput, idempotencyKey: string): Promise<DbWaitlistResult> {
  const prismaRuntime = prisma as unknown as {
    $transaction: <T>(callback: (tx: {
      travelCity: { findFirst: (options: Record<string, unknown>) => Promise<DbWaitlistResult["travelCity"] | null> };
      client: {
        upsert: (options: Record<string, unknown>) => Promise<DbWaitlistResult["client"]>;
      };
      idempotencyKey: {
        upsert: (options: Record<string, unknown>) => Promise<DbWaitlistResult["idempotency"]>;
        update: (options: Record<string, unknown>) => Promise<DbWaitlistResult["idempotency"]>;
      };
      messageThread: { create: (options: Record<string, unknown>) => Promise<DbWaitlistResult["thread"]> };
      message: { create: (options: Record<string, unknown>) => Promise<DbWaitlistResult["message"]> };
      notification: { create: (options: Record<string, unknown>) => Promise<DbWaitlistResult["notification"]> };
      notificationDelivery: { create: (options: Record<string, unknown>) => Promise<DbWaitlistResult["delivery"]> };
      notificationProviderHandoff: { create: (options: Record<string, unknown>) => Promise<DbWaitlistResult["handoff"]> };
      auditLog: { create: (options: Record<string, unknown>) => Promise<DbWaitlistResult["audit"]> };
    }) => Promise<T>) => Promise<T>;
  };

  return prismaRuntime.$transaction(async (tx) => {
    const normalizedEmail = input.clientEmail.toLowerCase().trim();
    const emailHash = destinationHash(normalizedEmail);
    const travelCity = await tx.travelCity.findFirst({
      where: { tenantId, slug: input.citySlug, waitlistEnabled: true },
      select: { id: true, slug: true, city: true, region: true, waitlistEnabled: true },
    });
    if (!travelCity) {
      throw new Error("WAITLIST_CITY_NOT_FOUND");
    }

    const client = await tx.client.upsert({
      where: { tenantId_email: { tenantId, email: normalizedEmail } },
      update: {
        preferredName: input.clientName,
        phone: input.phone ?? undefined,
        city: travelCity.city,
        region: travelCity.region,
        marketingOptIn: input.marketingOptIn,
        smsOptIn: input.smsOptIn,
      },
      create: {
        tenantId,
        email: normalizedEmail,
        phone: input.phone ?? undefined,
        preferredName: input.clientName,
        city: travelCity.city,
        region: travelCity.region,
        marketingOptIn: input.marketingOptIn,
        smsOptIn: input.smsOptIn,
      },
      select: { id: true, email: true, preferredName: true },
    });

    const idempotency = await tx.idempotencyKey.upsert({
      where: { tenantId_scope_key: { tenantId, scope: "public-waitlist", key: idempotencyKey } },
      create: {
        tenantId,
        scope: "public-waitlist",
        key: idempotencyKey,
        status: "claimed",
        metadata: toJsonValue({
          route: "/api/public/[tenantSlug]/waitlists",
          citySlug: input.citySlug,
          emailHash,
          rawPayloadStored: false,
        }),
      },
      update: {
        metadata: toJsonValue({
          route: "/api/public/[tenantSlug]/waitlists",
          citySlug: input.citySlug,
          emailHash,
          replayObserved: true,
          rawPayloadStored: false,
        }),
      },
      select: { id: true, key: true },
    });

    const thread = await tx.messageThread.create({
      data: {
        tenantId,
        clientId: client.id,
        subject: `Waitlist signup: ${travelCity.city}`,
        lastMessageAt: new Date(),
      },
      select: { id: true, subject: true },
    });

    const message = await tx.message.create({
      data: {
        tenantId,
        threadId: thread.id,
        senderClientId: client.id,
        channel: "email",
        direction: "inbound",
        status: "queued",
        body: buildWaitlistBody(input),
      },
      select: { id: true, status: true },
    });

    const notification = await tx.notification.create({
      data: {
        tenantId,
        clientId: client.id,
        type: "city_waitlist_opening",
        title: `${travelCity.city} waitlist signup`,
        body: "A public travel waitlist signup is ready for dashboard review.",
        status: "queued",
      },
      select: { id: true, status: true, type: true },
    });

    const delivery = await tx.notificationDelivery.create({
      data: {
        tenantId,
        notificationId: notification.id,
        channel: "in_app",
        status: "queued",
        destinationHash: emailHash,
        provider: "internal-dashboard",
      },
      select: { id: true, status: true },
    });

    const handoff = await tx.notificationProviderHandoff.create({
      data: {
        tenantId,
        notificationId: notification.id,
        deliveryId: delivery.id,
        threadId: thread.id,
        messageId: message.id,
        channel: "in_app",
        provider: "internal-dashboard",
        state: "queued",
        idempotencyKey: idempotency.key,
        destinationHash: emailHash,
        sanitizedPayload: toJsonValue({
          route: "/api/public/[tenantSlug]/waitlists",
          citySlug: input.citySlug,
          clientId: client.id,
          messageId: message.id,
          bodyPreview: "[redacted-waitlist-body]",
          emailHash,
          providerDispatchDeferred: true,
        }),
      },
      select: { id: true, state: true },
    });

    const audit = await tx.auditLog.create({
      data: {
        tenantId,
        action: "waitlist.public_intake",
        entityType: "MessageThread",
        entityId: thread.id,
        metadata: toJsonValue({
          route: "/api/public/[tenantSlug]/waitlists",
          citySlug: input.citySlug,
          clientId: client.id,
          messageId: message.id,
          notificationId: notification.id,
          deliveryId: delivery.id,
          handoffId: handoff.id,
          idempotencyKeyId: idempotency.id,
          redactedFields: ["client.email", "message.body", "destinationHash"],
          rawPayloadStored: false,
          gapIds: ["GAP-010", "GAP-026", "GAP-061", "GAP-064"],
        }),
      },
      select: { id: true },
    });

    await tx.idempotencyKey.update({
      where: { tenantId_scope_key: { tenantId, scope: "public-waitlist", key: idempotencyKey } },
      data: {
        status: "completed",
        result: toJsonValue({
          clientId: client.id,
          threadId: thread.id,
          messageId: message.id,
          notificationId: notification.id,
          deliveryId: delivery.id,
          handoffId: handoff.id,
          auditId: audit.id,
          rawPayloadStored: false,
        }),
      },
      select: { id: true, key: true },
    });

    return { client, travelCity, idempotency, thread, message, notification, delivery, handoff, audit };
  });
}

export async function POST(request: Request, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  const normalizedTenantSlug = normalizeTenantSlug(tenantSlug);
  const tenant = await resolvePublicTenantScope(normalizedTenantSlug);

  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_NOT_FOUND", message: "Public waitlist signup is unavailable for unknown tenant slug." } },
      { status: 404, headers: publicContentNoStoreHeaders },
    );
  }

  const rawBody = (await request.json().catch(() => null)) as unknown;
  const parsed = waitlistSignupInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Waitlist signup input did not pass shared schema validation.",
          issues: parsed.error.flatten(),
        },
      },
      { status: 400, headers: publicContentNoStoreHeaders },
    );
  }

  const clientIp = getClientIp(Object.fromEntries(request.headers.entries()));
  const rateLimit = checkRateLimit("public-message-submit", normalizedTenantSlug, `${clientIp}:${tenant.tenantId}:waitlist`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Waitlist signup is temporarily limited by anti-abuse rule.",
          details: {
            maxRequests: rateLimit.maxRequests,
            windowSeconds: rateLimit.windowSeconds,
            remaining: rateLimit.remaining,
            retryAfterSeconds: rateLimit.retryAfterSeconds,
            gapIds: ["GAP-031", "GAP-095"],
          },
        },
      },
      { status: 429, headers: { ...publicContentNoStoreHeaders, "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  if (process.env.NODE_ENV === "production" && tenant.source === "local-fallback") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_WAITLIST_NOT_CONFIGURED",
          message: "Production waitlist signup requires database-backed tenant scope and durable client/message/notification persistence.",
        },
        productionBoundary: buildWaitlistBoundary(),
      },
      { status: 503, headers: publicContentNoStoreHeaders },
    );
  }

  try {
    if (tenant.source === "database") {
      const normalizedEmail = parsed.data.clientEmail.toLowerCase().trim();
      const idempotencyKey =
        request.headers.get("idempotency-key") ??
        `public-waitlist:${tenant.tenantId}:${parsed.data.citySlug}:${destinationHash(normalizedEmail)}:${parsed.data.policyAccepted}`;
      const persisted = await persistWaitlistSignupToDatabase(tenant.tenantId, parsed.data, idempotencyKey);
      return NextResponse.json(
        {
          ok: true,
          data: {
            tenantSlug: normalizedTenantSlug,
            tenantId: tenant.tenantId,
            source: tenant.source,
            persistence: "database",
            waitlist: {
              citySlug: persisted.travelCity.slug,
              city: persisted.travelCity.city,
              region: persisted.travelCity.region,
              waitlistEnabled: persisted.travelCity.waitlistEnabled,
            },
            client: {
              id: persisted.client.id,
              emailMasked: persisted.client.email.replace(/^(.).+(@.+)$/, "$1***$2"),
              preferredName: persisted.client.preferredName,
            },
            thread: persisted.thread,
            message: persisted.message,
            notification: persisted.notification,
            delivery: persisted.delivery,
            providerHandoff: persisted.handoff,
            auditId: persisted.audit.id,
            idempotencyKeyId: persisted.idempotency.id,
            boundary: "Waitlist signup persisted tenant-scoped client, message-thread, message, notification, delivery, provider-handoff, idempotency, and audit intent rows; live provider delivery remains gated.",
            gapIds: ["GAP-010", "GAP-026", "GAP-061", "GAP-064"],
          },
        },
        { status: 201, headers: publicContentNoStoreHeaders },
      );
    }

    const local = persistWaitlistSignupMessage(normalizedTenantSlug, parsed.data);
    return NextResponse.json(
      {
        ok: true,
        data: {
          tenantSlug: normalizedTenantSlug,
          tenantId: tenant.tenantId,
          source: tenant.source,
          persistence: "local-fallback",
          message: { id: local.id, status: local.status, channel: local.channel, redactedPayload: local.redactedPayload },
          boundary: "Local fallback stores a redacted waitlist message intent only; production requires DB-backed client/message/notification persistence.",
          productionBoundary: buildWaitlistBoundary(),
          gapIds: ["GAP-010", "GAP-026", "GAP-061", "GAP-064"],
        },
      },
      { status: 202, headers: publicContentNoStoreHeaders },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "WAITLIST_CITY_NOT_FOUND") {
      return NextResponse.json(
        { ok: false, error: { code: "WAITLIST_CITY_NOT_FOUND", message: "Selected city is not available for public waitlist signup." } },
        { status: 404, headers: publicContentNoStoreHeaders },
      );
    }

    if (!isPublicContentDatabaseUnavailable(error)) throw error;

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PROVIDER_WAITLIST_NOT_CONFIGURED",
            message: "Production waitlist signup requires the dashboard database connection; local fallback is disabled.",
          },
          productionBoundary: buildWaitlistBoundary(),
        },
        { status: 503, headers: publicContentNoStoreHeaders },
      );
    }

    const local = persistWaitlistSignupMessage(normalizedTenantSlug, parsed.data);
    return NextResponse.json(
      {
        ok: true,
        data: {
          tenantSlug: normalizedTenantSlug,
          tenantId: tenant.tenantId,
          source: "local-fallback",
          persistence: "local-fallback",
          message: { id: local.id, status: local.status, channel: local.channel, redactedPayload: local.redactedPayload },
          boundary: "Database unavailable; local fallback stores a redacted waitlist message intent only.",
          productionBoundary: buildWaitlistBoundary(),
          gapIds: ["GAP-010", "GAP-026", "GAP-061", "GAP-064"],
        },
      },
      { status: 202, headers: publicContentNoStoreHeaders },
    );
  }
}
