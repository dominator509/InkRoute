import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GET as previewNotifications } from "../app/api/public/[tenantSlug]/notification-previews/route";
import { POST as createMessage } from "../app/api/public/[tenantSlug]/messages/route";

const waitlistRouteSource = readFileSync(join(process.cwd(), "apps/web/app/api/public/[tenantSlug]/waitlists/route.ts"), "utf8");

function messageRequest(body: unknown, clientIp: string): NextRequest {
  return new NextRequest("https://local.test/api/public/inkroute-demo/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-client-ip": clientIp,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("notification and messaging route boundaries", () => {
  it("returns static notification previews without queueing or provider sends", async () => {
    const response = await previewNotifications(new NextRequest("https://local.test/api/public/inkroute-demo/notification-previews"), {
      params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        tenantSlug: string;
        mode: string;
        templates: Array<{ key: string; subject: string; body: string }>;
        deliveryPlans: Array<{
          template: { key: string };
          requiresProviderCredential: boolean;
          responseProjection: { rawContactFieldsEchoed: boolean; rawDestinationEchoed: boolean; destinationMaskedEchoed: boolean; rawConsentSnapshotEchoed: boolean; tenantIdEchoed: boolean; internalPersistenceIdsEchoed: boolean };
          candidates: Array<{ destinationMasked?: string; destinationMaskedEchoed: boolean }>;
        }>;
        responseProjection: { rawContactFieldsEchoed: boolean; rawDestinationEchoed: boolean; destinationMaskedEchoed: boolean; rawConsentSnapshotEchoed: boolean; tenantIdEchoed: boolean; internalPersistenceIdsEchoed: boolean };
        productionBoundary: { status: string; gapIds: string[]; note: string };
      };
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(payload.ok).toBe(true);
    expect(payload.data).toMatchObject({
      tenantSlug: "inkroute-demo",
      mode: "static_phase9_preview",
    });
    expect(payload.data.templates.map((template) => template.key)).toEqual(
      expect.arrayContaining(["deposit_request", "aftercare_day_0", "city_waitlist_opening"]),
    );
    expect(payload.data.deliveryPlans.some((plan) => plan.requiresProviderCredential)).toBe(true);
    expect(payload.data.responseProjection).toMatchObject({
      rawContactFieldsEchoed: false,
      rawDestinationEchoed: false,
      destinationMaskedEchoed: false,
      rawConsentSnapshotEchoed: false,
      tenantIdEchoed: false,
      internalPersistenceIdsEchoed: false,
    });
    expect(payload.data.deliveryPlans.every((plan) => plan.responseProjection.rawContactFieldsEchoed === false)).toBe(true);
    expect(payload.data.deliveryPlans.every((plan) => plan.responseProjection.tenantIdEchoed === false && plan.responseProjection.internalPersistenceIdsEchoed === false)).toBe(true);
    expect(payload.data.deliveryPlans.flatMap((plan) => plan.candidates).every((candidate) => candidate.destinationMasked === undefined && candidate.destinationMaskedEchoed === false)).toBe(true);
    expect(payload.data.productionBoundary).toMatchObject({
      status: "provider-gated",
      gapIds: ["GAP-061", "GAP-062", "GAP-063", "GAP-064", "GAP-065"],
    });
    expect(payload.data.productionBoundary.note).toContain("does not queue or send");
  });

  it("keeps public waitlist DB responses contact-minimized", () => {
    expect(waitlistRouteSource).toContain("buildSafeWaitlistDatabaseResponse");
    expect(waitlistRouteSource).toContain("buildWaitlistResponseProjection");
    expect(waitlistRouteSource).toContain("hashWaitlistRequest");
    expect(waitlistRouteSource).toContain("requestHash");
    expect(waitlistRouteSource).toContain("waitlistIdempotencyConflictResponseAllowlisted: true");
    expect(waitlistRouteSource).toContain("idempotencyReplayed: true");
    expect(waitlistRouteSource).toContain("duplicateSideEffectsCreated: false");
    expect(waitlistRouteSource).toContain("clientEmailSelectedFromDatabase: false");
    expect(waitlistRouteSource).toContain("clientNameSelectedFromDatabase: false");
    expect(waitlistRouteSource).toContain("rawContactFieldsEchoed: false");
    expect(waitlistRouteSource).toContain("maskedContactEchoed: false");
    expect(waitlistRouteSource).toContain("destinationHashEchoed: false");
    expect(waitlistRouteSource).toContain("rawIdempotencyKeyEchoed: false");
    expect(waitlistRouteSource).toContain("tenantIdEchoed: false");
    expect(waitlistRouteSource).toContain("internalPersistenceIdsEchoed: false");
    expect(waitlistRouteSource).toContain("internalPersistenceIdsStored: false");
    expect(waitlistRouteSource).toContain("clientPersisted: true");
    expect(waitlistRouteSource).toContain("messagePersisted: true");
    expect(waitlistRouteSource).toContain("notificationPersisted: true");
    expect(waitlistRouteSource).toContain("deliveryPersisted: true");
    expect(waitlistRouteSource).toContain("providerHandoffPersisted: true");
    expect(waitlistRouteSource).toContain("idempotencyPersisted: true");
    expect(waitlistRouteSource).toContain("redactedPayloadEchoed: false");
    expect(waitlistRouteSource).not.toContain("select: { id: true, email: true, preferredName: true }");
    expect(waitlistRouteSource).not.toContain("emailMasked:");
    expect(waitlistRouteSource).not.toContain("thread: persisted.thread");
    expect(waitlistRouteSource).not.toContain("message: persisted.message");
    expect(waitlistRouteSource).not.toContain("notification: persisted.notification");
    expect(waitlistRouteSource).not.toContain("delivery: persisted.delivery");
    expect(waitlistRouteSource).not.toContain("providerHandoff: persisted.handoff");
    expect(waitlistRouteSource).not.toContain("idempotencyKeyId: persisted.idempotency.id");
    expect(waitlistRouteSource).not.toContain("tenantId: tenant.tenantId,\n            source");
    expect(waitlistRouteSource).not.toContain("tenantId: tenant.tenantId,\n          source");
    expect(waitlistRouteSource).not.toContain("result: toJsonValue({\n          clientId: client.id");
    expect(waitlistRouteSource).not.toContain("result: toJsonValue({\n          threadId: thread.id");
    expect(waitlistRouteSource).not.toContain("result: toJsonValue({\n          messageId: message.id");
    expect(waitlistRouteSource).not.toContain("result: toJsonValue({\n          notificationId: notification.id");
    expect(waitlistRouteSource).not.toContain("result: toJsonValue({\n          deliveryId: delivery.id");
    expect(waitlistRouteSource).not.toContain("result: toJsonValue({\n          handoffId: handoff.id");
    expect(waitlistRouteSource).not.toContain("result: toJsonValue({\n          auditId: audit.id");
    expect(waitlistRouteSource).not.toContain(
      'sanitizedPayload: toJsonValue({\n          route: "/api/public/[tenantSlug]/waitlists",\n          citySlug: input.citySlug,\n          clientId: client.id',
    );
    expect(waitlistRouteSource).not.toContain(
      'sanitizedPayload: toJsonValue({\n          route: "/api/public/[tenantSlug]/waitlists",\n          citySlug: input.citySlug,\n          clientId: client.id,\n          messageId: message.id',
    );
    expect(waitlistRouteSource).not.toContain(
      'metadata: toJsonValue({\n          route: "/api/public/[tenantSlug]/waitlists",\n          citySlug: input.citySlug,\n          clientId: client.id',
    );
    expect(waitlistRouteSource).not.toContain("idempotencyKeyId: idempotency.id");
    expect(waitlistRouteSource).not.toContain("redactedPayload: local.redactedPayload");
  });

  it("fail-closes production notification previews instead of returning static render payloads", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const response = await previewNotifications(new NextRequest("https://local.test/api/public/inkroute-demo/notification-previews"), {
        params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error: { code: string; gapIds: string[] };
        productionBoundary: { staticNotificationPreviewDisabled: boolean };
        responseProjection: { rawContactFieldsEchoed: boolean; rawDestinationEchoed: boolean; destinationMaskedEchoed: boolean; rawConsentSnapshotEchoed: boolean; tenantIdEchoed: boolean; internalPersistenceIdsEchoed: boolean };
      };

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(payload.ok).toBe(false);
      expect(payload.error.code).toBe("PROVIDER_NOTIFICATION_PREVIEWS_NOT_CONFIGURED");
      expect(payload.error.gapIds).toContain("GAP-010");
      expect(payload.error.gapIds).toContain("GAP-065");
      expect(payload.productionBoundary.staticNotificationPreviewDisabled).toBe(true);
      expect(payload.responseProjection.tenantIdEchoed).toBe(false);
      expect(payload.responseProjection.internalPersistenceIdsEchoed).toBe(false);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("rejects malformed public message submissions before tenant persistence", async () => {
    const invalidJson = await createMessage(messageRequest("{", "203.0.113.69"), {
      params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
    });
    const missingFields = await createMessage(messageRequest({ subject: "Hello" }, "203.0.113.70"), {
      params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
    });

    expect(invalidJson.status).toBe(400);
    expect(invalidJson.headers.get("Cache-Control")).toBe("no-store");
    await expect(invalidJson.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_JSON" },
    });
    expect(missingFields.status).toBe(400);
    expect(missingFields.headers.get("Cache-Control")).toBe("no-store");
    await expect(missingFields.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "VALIDATION_FAILED" },
    });
  });

  it("rejects unknown tenants for public message submissions", async () => {
    const response = await createMessage(messageRequest({ subject: "Hello", body: "Can I book?" }, "203.0.113.71"), {
      params: Promise.resolve({ tenantSlug: "unknown-studio" }),
    });

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "TENANT_NOT_FOUND" },
    });
  });

  it("persists local demo messages with privacy and production handoff boundaries", async () => {
    const response = await createMessage(
      messageRequest(
        {
          subject: "Sleeve consultation",
          body: "I would like a blackwork sleeve consultation next month.",
          bookingRequestId: "booking_message_route_test",
        },
        "203.0.113.72",
      ),
      { params: Promise.resolve({ tenantSlug: "inkroute-demo" }) },
    );
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        tenantSlug: string;
        status: string;
        draft: {
          subject: string;
          relatedBookingLinked: boolean;
          channel: string;
          responseProjection: {
            rawMessageBodyEchoed: boolean;
            bodyPreviewEchoed: boolean;
            bookingRequestIdEchoed: boolean;
            internalPersistenceIdsEchoed: boolean;
          };
        };
        responseProjection: {
          messageIdEchoed: boolean;
          bookingRequestIdEchoed: boolean;
          rawMessageBodyEchoed: boolean;
          bodyPreviewEchoed: boolean;
          internalPersistenceIdsEchoed: boolean;
        };
        requiredNextWork: string[];
      };
      runtimeBoundary: { tenantIdEchoed: boolean; messageCount: number; savedInLocalRuntime: boolean; savedInDatabase: boolean; gapIds: string[] };
    };

    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(payload.ok).toBe(true);
    expect(payload.data.tenantSlug).toBe("inkroute-demo");
    expect(payload.data.status).toBe("queued");
    expect(payload.data.draft).toMatchObject({
      subject: "Sleeve consultation",
      relatedBookingLinked: true,
      channel: "in_app",
      responseProjection: {
        rawMessageBodyEchoed: false,
        bodyPreviewEchoed: false,
        bookingRequestIdEchoed: false,
        internalPersistenceIdsEchoed: false,
      },
    });
    expect(payload.data.responseProjection).toMatchObject({
      messageIdEchoed: false,
      bookingRequestIdEchoed: false,
      rawMessageBodyEchoed: false,
      bodyPreviewEchoed: false,
      internalPersistenceIdsEchoed: false,
    });
    expect(payload.data.requiredNextWork.join(" ")).toContain("Redact sensitive text");
    expect(payload.runtimeBoundary).toMatchObject({
      tenantIdEchoed: false,
      messageCount: 1,
      savedInLocalRuntime: true,
      savedInDatabase: false,
      gapIds: ["GAP-009", "GAP-061", "GAP-064", "GAP-066"],
    });
  });

  it("pins public message database persistence and provider handoff seams", async () => {
    const routeSource = await import("node:fs").then((fs) =>
      fs.readFileSync("apps/web/app/api/public/[tenantSlug]/messages/route.ts", "utf8"),
    );

    expect(routeSource).toContain("resolveMessageTenant");
    expect(routeSource).toContain("publicMessageInputSchema.safeParse");
    expect(routeSource).toContain("tx.messageThread.create");
    expect(routeSource).toContain("tx.message.create");
    expect(routeSource).toContain("tx.notification.create");
    expect(routeSource).toContain("tx.notificationDelivery.create");
    expect(routeSource).toContain("tx.notificationProviderHandoff.create");
    expect(routeSource).toContain("tx.idempotencyKey.upsert");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain("message.public_intake");
    expect(routeSource).toContain("PUBLIC_MESSAGE_BOOKING_CONTEXT_REQUIRED");
    expect(routeSource).toContain("buildSafePublicMessageDatabaseResponse");
    expect(routeSource).toContain("buildSafePublicMessageDraftResponse");
    expect(routeSource).toContain("threadPersisted: true");
    expect(routeSource).toContain("messagePersisted: true");
    expect(routeSource).toContain("notificationPersisted: true");
    expect(routeSource).toContain("providerHandoffPersisted: true");
    expect(routeSource).toContain("threadIdEchoed: false");
    expect(routeSource).toContain("messageIdEchoed: false");
    expect(routeSource).toContain("notificationIdEchoed: false");
    expect(routeSource).toContain("deliveryIdEchoed: false");
    expect(routeSource).toContain("handoffIdEchoed: false");
    expect(routeSource).toContain("auditIdEchoed: false");
    expect(routeSource).toContain("idempotencyKeyIdEchoed: false");
    expect(routeSource).toContain("tenantIdEchoed: false");
    expect(routeSource).toContain("rawMessageBodyEchoed: false");
    expect(routeSource).toContain("bodyPreviewEchoed: false");
    expect(routeSource).toContain("bookingRequestIdEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsStored: false");
    expect(routeSource).toContain("tx.idempotencyKey.update");
    expect(routeSource).toContain('idempotency.status === "completed"');
    expect(routeSource).toContain("idempotencyReplayed: true");
    expect(routeSource).toContain("duplicateSideEffectsCreated: false");
    expect(routeSource).toContain("createHash(\"sha256\")");
    expect(routeSource).toContain("bookingContextMatched: true");
    expect(routeSource).toContain("clientContextMatched: true");
    expect(routeSource).toContain("idempotencyPersisted: true");
    expect(routeSource).toContain("destinationHashOnly: true");
    expect(routeSource).toContain("rawContactFieldsStored: false");
    expect(routeSource).toContain("clientContactFieldsEchoed: false");
    expect(routeSource).toContain("clientProfileNameSelectedFromDatabase: false");
    expect(routeSource).toContain("rawDestinationEchoed: false");
    expect(routeSource).toContain("destinationHashEchoed: false");
    expect(routeSource).toContain("idempotencyKeyEchoed: false");
    expect(routeSource).toContain("client: { select: { id: true, email: true, phone: true } }");
    expect(routeSource).not.toContain("threadId: result.thread.id");
    expect(routeSource).not.toContain("messageId: result.message.id");
    expect(routeSource).not.toContain("notificationId: result.notification.id");
    expect(routeSource).not.toContain("deliveryId: result.delivery.id");
    expect(routeSource).not.toContain("handoffId: result.handoff.id");
    expect(routeSource).not.toContain("auditId: result.audit.id");
    expect(routeSource).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(routeSource).not.toContain("tenantId: resolvedTenant.tenantId,\n                persistence: \"database\"");
    expect(routeSource).not.toContain("runtimeBoundary: {\n                tenantId: resolvedTenant.tenantId");
    expect(routeSource).not.toContain("runtimeBoundary: {\n        tenantId: resolvedTenant.tenantId");
    expect(routeSource).not.toContain("id: persisted.id");
    expect(routeSource).not.toContain("draft,");
    expect(routeSource).not.toContain("relatedBookingRequestId: draft.relatedBookingRequestId");
    expect(routeSource).not.toContain(
      'sanitizedPayload: toJsonValue({\n                route: "/api/public/[tenantSlug]/messages",\n                subject: draft.subject,\n                bookingRequestId: booking.id',
    );
    expect(routeSource).not.toContain(
      'sanitizedPayload: toJsonValue({\n                route: "/api/public/[tenantSlug]/messages",\n                subject: draft.subject,\n                bookingRequestId: booking.id,\n                clientId: booking.clientId',
    );
    expect(routeSource).not.toContain(
      'metadata: toJsonValue({\n                route: "/api/public/[tenantSlug]/messages",\n                bookingRequestId: booking.id',
    );
    expect(routeSource).not.toContain("idempotencyKeyId: idempotency.id");
    expect(routeSource).not.toContain("preferredName: true");
    expect(routeSource).not.toContain("contact-length");
    expect(routeSource).toContain("externalSendDeferred");
  });

  it("fail-closes production public messages instead of saving local runtime messages", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const response = await createMessage(
        messageRequest(
          {
            subject: "Production message",
            body: "This should wait for database-backed message persistence.",
            bookingRequestId: "booking_message_route_test",
          },
          "203.0.113.73",
        ),
        { params: Promise.resolve({ tenantSlug: "inkroute-demo" }) },
      );
      const payload = (await response.json()) as {
        ok: boolean;
        error: { code: string; gapIds: string[] };
        productionBoundary: { localMessagePersistenceDisabled: boolean };
      };

      expect(response.status).toBe(503);
      expect(payload.ok).toBe(false);
      expect(payload.error.code).toBe("PROVIDER_MESSAGE_PERSISTENCE_NOT_CONFIGURED");
      expect(payload.error.gapIds).toContain("GAP-010");
      expect(payload.error.gapIds).toContain("GAP-064");
      expect(payload.productionBoundary.localMessagePersistenceDisabled).toBe(true);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("pins public message rate-limit responses as no-store with Retry-After", async () => {
    const routeSource = await import("node:fs").then((fs) =>
      fs.readFileSync("apps/web/app/api/public/[tenantSlug]/messages/route.ts", "utf8"),
    );

    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain('{ ...noStoreHeaders, "Retry-After": String(rateLimit.retryAfterSeconds) }');
  });

  it("pins notification preview responses as no-store on every branch", async () => {
    const routeSource = await import("node:fs").then((fs) =>
      fs.readFileSync("apps/web/app/api/public/[tenantSlug]/notification-previews/route.ts", "utf8"),
    );

    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("{ status: 503, headers: noStoreHeaders }");
    expect(routeSource).toContain("}, { headers: noStoreHeaders });");
    expect(routeSource).toContain("buildSafeDeliveryPlanResponse");
    expect(routeSource).toContain("rawContactFieldsEchoed: false");
    expect(routeSource).toContain("rawDestinationEchoed: false");
    expect(routeSource).toContain("destinationMaskedEchoed: false");
    expect(routeSource).toContain("rawConsentSnapshotEchoed: false");
    expect(routeSource).toContain("tenantIdEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsEchoed: false");
    expect(routeSource).not.toContain("client@example.test");
    expect(routeSource).not.toContain("+15550101010");
    expect(routeSource).not.toContain('headers: { "Cache-Control": "no-store" }');
  });
});
