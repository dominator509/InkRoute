import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@inkroute/db", () => ({
  prisma: {
    tenant: {
      findUnique: vi.fn(async () => {
        throw new Error("database unavailable in route contract test");
      }),
    },
    $transaction: vi.fn(),
  },
}));

import { POST as createPublicErrorReport } from "../app/api/public/[tenantSlug]/error-reports/route";
import { POST as receiveSentryWebhook } from "../app/api/webhooks/sentry/route";

function errorReportRequest(body: unknown, clientIp: string): NextRequest {
  return new NextRequest("https://local.test/api/public/inkroute-demo/error-reports", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-client-ip": clientIp,
      "user-agent": "vitest-observability-route",
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("observability route boundaries", () => {
  it("rejects malformed public error reports before tenant persistence", async () => {
    const invalidJson = await createPublicErrorReport(errorReportRequest("{", "203.0.113.80"), {
      params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
    });
    const invalidPayload = await createPublicErrorReport(errorReportRequest({ message: "" }, "203.0.113.81"), {
      params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
    });

    expect(invalidJson.status).toBe(400);
    await expect(invalidJson.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_JSON" },
    });
    expect(invalidPayload.status).toBe(400);
    await expect(invalidPayload.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "VALIDATION_FAILED" },
    });
  });

  it("persists local public error reports with redacted preview metadata", async () => {
    const response = await createPublicErrorReport(
      errorReportRequest(
        {
          source: "web",
          runtime: "browser",
          environment: "preview",
          message: "Client email avery@example.com crashed booking preview",
          route: "/booking",
          release: "phase11-route-test",
          handled: false,
          metadata: {
            clientEmail: "avery@example.com",
            bookingId: "booking_obs_route_test",
          },
        },
        "203.0.113.82",
      ),
      { params: Promise.resolve({ tenantSlug: "inkroute-demo" }) },
    );
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        persistence: string;
        preview: { report: { redactedMessage: string; redactedMetadata: Record<string, unknown>; stackHash: string }; alertRoute: { channel: string } };
        localBoundary: { rateLimitRule: string };
      };
    };

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.data.persistence).toBe("local-runtime");
    expect(payload.data.preview.report.redactedMessage).not.toContain("avery@example.com");
    expect(JSON.stringify(payload.data.preview.report.redactedMetadata)).not.toContain("avery@example.com");
    expect(payload.data.preview.report.stackHash).toHaveLength(12);
    expect(payload.data.localBoundary.rateLimitRule).toBe("fallback-error-report");
  });

  it("keeps Sentry webhook ingestion credential-gated until provider verification is wired", async () => {
    const missingSignature = await receiveSentryWebhook(
      new NextRequest("https://local.test/api/webhooks/sentry", {
        method: "POST",
        body: JSON.stringify({ action: "created" }),
      }),
    );
    const acceptedShape = await receiveSentryWebhook(
      new NextRequest("https://local.test/api/webhooks/sentry", {
        method: "POST",
        headers: { "sentry-hook-signature": "sig_test" },
        body: JSON.stringify({
          action: "created",
          data: {
            title: "Unhandled booking crash",
            culprit: "/booking",
            release: "phase11-route-test",
          },
        }),
      }),
    );
    const acceptedPayload = (await acceptedShape.json()) as {
      ok: boolean;
      error: { code: string };
      data: { receivedSignatureHeader: string; report: { route: string; release: string }; requiredNextWork: string[] };
    };

    expect(missingSignature.status).toBe(400);
    await expect(missingSignature.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "MISSING_SENTRY_SIGNATURE" },
    });
    expect(acceptedShape.status).toBe(501);
    expect(acceptedPayload.ok).toBe(false);
    expect(acceptedPayload.error.code).toBe("SENTRY_WEBHOOK_NOT_IMPLEMENTED");
    expect(acceptedPayload.data.receivedSignatureHeader).toBe("present");
    expect(acceptedPayload.data.report).toMatchObject({
      route: "/booking",
      release: "phase11-route-test",
    });
    expect(acceptedPayload.data.requiredNextWork.join(" ")).toContain("Verify provider webhook signatures");
  });
});
