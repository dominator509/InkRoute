import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const dbMocks = vi.hoisted(() => ({
  tenantFindUnique: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@inkroute/db", () => ({
  prisma: {
    tenant: {
      findUnique: dbMocks.tenantFindUnique,
    },
    $transaction: dbMocks.transaction,
  },
}));

import { POST as createPublicErrorReport } from "../app/api/public/[tenantSlug]/error-reports/route";
import { POST as receiveSentryWebhook } from "../app/api/webhooks/sentry/route";

beforeEach(() => {
  dbMocks.tenantFindUnique.mockReset();
  dbMocks.transaction.mockReset();
  dbMocks.tenantFindUnique.mockRejectedValue(new Error("database unavailable in route contract test"));
});

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

  it("persists database-backed public error reports as redacted tenant rows with audit metadata", async () => {
    const createdReport = {
      id: "err_db_route_test",
      tenantId: "tenant_db_route_test",
      severity: "critical",
      status: "open",
      source: "web",
      message: "[redacted:email] crashed payment preview",
      stackHash: "abc123def456",
      release: "phase11-db-route-test",
      route: "/booking",
      createdAt: new Date("2026-06-08T18:45:00.000Z"),
    };
    const createdAudit = { id: "audit_db_route_test" };
    const errorReportCreate = vi.fn(async ({ data }) => ({ ...createdReport, ...data, id: createdReport.id, createdAt: createdReport.createdAt }));
    const auditLogCreate = vi.fn(async ({ data }) => ({ ...createdAudit, ...data }));

    dbMocks.tenantFindUnique.mockResolvedValue({ id: "tenant_db_route_test" });
    dbMocks.transaction.mockImplementation(async (callback) =>
      callback({
        errorReport: { create: errorReportCreate },
        auditLog: { create: auditLogCreate },
      }),
    );

    const response = await createPublicErrorReport(
      errorReportRequest(
        {
          source: "web",
          runtime: "browser",
          environment: "preview",
          message: "Client avery@example.com hit a payment crash",
          route: "/booking",
          release: "phase11-db-route-test",
          handled: false,
          metadata: {
            clientEmail: "avery@example.com",
            card: "4242 4242 4242 4242",
            bookingId: "booking_db_route_test",
          },
        },
        "203.0.113.83",
      ),
      { params: Promise.resolve({ tenantSlug: "inkroute-demo" }) },
    );
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        persistence: string;
        report: { redactedMessage: string; stackHash: string; auditId: string };
      };
    };

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.data.persistence).toBe("database");
    expect(payload.data.report.auditId).toBe("audit_db_route_test");
    expect(payload.data.report.redactedMessage).not.toContain("avery@example.com");
    expect(errorReportCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: "tenant_db_route_test",
        message: expect.not.stringContaining("avery@example.com"),
      }),
    });
    const persistedMetadata = JSON.stringify(errorReportCreate.mock.calls[0]?.[0].data.metadata ?? {});
    expect(persistedMetadata).not.toContain("avery@example.com");
    expect(persistedMetadata).not.toContain("4242 4242 4242 4242");
    expect(auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: "tenant_db_route_test",
        action: "observability:error_report.persist",
        entityType: "ErrorReport",
        entityId: "err_db_route_test",
      }),
    });
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
