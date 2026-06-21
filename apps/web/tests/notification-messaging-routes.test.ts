import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET as previewNotifications } from "../app/api/public/[tenantSlug]/notification-previews/route";
import { POST as createMessage } from "../app/api/public/[tenantSlug]/messages/route";

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
        deliveryPlans: Array<{ template: { key: string }; requiresProviderCredential: boolean }>;
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
    expect(payload.data.productionBoundary).toMatchObject({
      status: "provider-gated",
      gapIds: ["GAP-061", "GAP-062", "GAP-063", "GAP-064", "GAP-065"],
    });
    expect(payload.data.productionBoundary.note).toContain("does not queue or send");
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
      };

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(payload.ok).toBe(false);
      expect(payload.error.code).toBe("PROVIDER_NOTIFICATION_PREVIEWS_NOT_CONFIGURED");
      expect(payload.error.gapIds).toContain("GAP-010");
      expect(payload.error.gapIds).toContain("GAP-065");
      expect(payload.productionBoundary.staticNotificationPreviewDisabled).toBe(true);
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
        id: string;
        status: string;
        draft: { subject: string; relatedBookingRequestId?: string; channel: string };
        requiredNextWork: string[];
      };
      runtimeBoundary: { tenantId: string; messageCount: number; savedInLocalRuntime: boolean; gapIds: string[] };
    };

    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(payload.ok).toBe(true);
    expect(payload.data.tenantSlug).toBe("inkroute-demo");
    expect(payload.data.id).toMatch(/^message_/);
    expect(payload.data.status).toBe("queued");
    expect(payload.data.draft).toMatchObject({
      subject: "Sleeve consultation",
      relatedBookingRequestId: "booking_message_route_test",
      channel: "in_app",
    });
    expect(payload.data.requiredNextWork.join(" ")).toContain("Redact sensitive text");
    expect(payload.runtimeBoundary).toMatchObject({
      tenantId: "tenant_demo_nomad",
      messageCount: 1,
      savedInLocalRuntime: true,
      gapIds: ["GAP-009", "GAP-061", "GAP-064", "GAP-066"],
    });
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
    expect(routeSource).not.toContain('headers: { "Cache-Control": "no-store" }');
  });
});
