import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
  delete process.env.SENTRY_WEBHOOK_SECRET;
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

function signedSentryWebhookRequest(body: unknown, secret: string, signatureOverride?: string): NextRequest {
  const rawBody = JSON.stringify(body);
  const signature = signatureOverride ?? createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return new NextRequest("https://local.test/api/webhooks/sentry", {
    method: "POST",
    headers: { "sentry-hook-signature": signature },
    body: rawBody,
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
        persisted: { redactedRecord: Record<string, unknown>; message?: string; metadata?: Record<string, unknown> };
        preview: { report: { redactedMessage: string; redactedMetadata: Record<string, unknown>; stackHashStored: boolean; stackHashEchoed: boolean }; alertRoute: { channel: string } };
        localBoundary: { rateLimitRule: string };
        responseProjection: { rawPayloadEchoed: boolean; rawMessageEchoed: boolean; rawMetadataEchoed: boolean; rawStackEchoed: boolean; stackHashEchoed: boolean };
      };
    };

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.data.persistence).toBe("local-runtime");
    expect(payload.data.preview.report.redactedMessage).not.toContain("avery@example.com");
    expect(JSON.stringify(payload.data.preview.report.redactedMetadata)).not.toContain("avery@example.com");
    expect(JSON.stringify(payload.data.persisted.redactedRecord)).not.toContain("avery@example.com");
    expect(payload.data.persisted.message).toBeUndefined();
    expect(payload.data.persisted.metadata).toBeUndefined();
    expect(payload.data.responseProjection).toMatchObject({
      rawPayloadEchoed: false,
      rawMessageEchoed: false,
      rawMetadataEchoed: false,
      rawStackEchoed: false,
      stackHashEchoed: false,
    });
    expect(payload.data.preview.report.stackHashStored).toBe(true);
    expect(payload.data.preview.report.stackHashEchoed).toBe(false);
    expect(payload.data.localBoundary.rateLimitRule).toBe("fallback-error-report");
  });

  it("fail-closes production public error reports instead of using local runtime fallback", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const response = await createPublicErrorReport(
        errorReportRequest(
          {
            source: "web",
            runtime: "browser",
            environment: "production",
            message: "Production booking crash should not persist locally",
            route: "/booking",
            release: "phase11-route-test",
            handled: false,
          },
          "203.0.113.84",
        ),
        { params: Promise.resolve({ tenantSlug: "inkroute-demo" }) },
      );
      const payload = (await response.json()) as {
        ok: boolean;
        error: { code: string; gapIds: string[] };
        productionBoundary: { localObservabilityRuntimeFallbackDisabled: boolean };
      };

      expect(response.status).toBe(503);
      expect(payload.ok).toBe(false);
      expect(payload.error.code).toBe("PROVIDER_OBSERVABILITY_PERSISTENCE_NOT_CONFIGURED");
      expect(payload.error.gapIds).toContain("GAP-011");
      expect(payload.error.gapIds).toContain("GAP-081");
      expect(payload.productionBoundary.localObservabilityRuntimeFallbackDisabled).toBe(true);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("keeps public error-report persistence responses no-store", () => {
    const routeSource = readFileSync(join(process.cwd(), "apps/web/app/api/public/[tenantSlug]/error-reports/route.ts"), "utf8");

    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain('headers: { ...noStoreHeaders, "x-request-id": correlation.requestId, "traceparent": correlation.traceparent }');
    expect(routeSource).not.toContain('headers: { "x-request-id": correlation.requestId, "traceparent": correlation.traceparent }');
    expect(routeSource).toContain("{ status: 400, headers: noStoreHeaders }");
    expect(routeSource).toContain("{ status: 404, headers: noStoreHeaders }");
    expect(routeSource).toContain('headers: { ...noStoreHeaders, "Retry-After": String(rateLimit.retryAfterSeconds) }');
    expect(routeSource).toContain("{ status: 500, headers: noStoreHeaders }");
    expect(routeSource).toContain("buildSafeErrorReportDatabaseReceipt");
    expect(routeSource).toContain("errorReportIdEchoed: false");
    expect(routeSource).toContain("auditIdEchoed: false");
    expect(routeSource).toContain("abuseEventIdEchoed: false");
    expect(routeSource).toContain("tenantIdEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsEchoed: false");
    expect(routeSource).not.toContain("tenantId: resolvedTenant.tenantId,\n          persistence");
    expect(routeSource).not.toContain("id: persisted.id");
    expect(routeSource).not.toContain("tenantId: persisted.tenantId");
    expect(routeSource).not.toContain("id: persisted.persistedReport.id");
    expect(routeSource).not.toContain("auditId: persisted.audit.id");
    expect(routeSource).not.toContain("abuseEventId: persisted.abuseEvent.id");
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
        report: { redactedMessage: string; stackHashStored: boolean; stackHashEchoed: boolean };
        persistenceReceipt: { errorReportPersisted: boolean; abuseEventPersisted: boolean; auditPersisted: boolean };
        responseProjection: { errorReportIdEchoed: boolean; auditIdEchoed: boolean; abuseEventIdEchoed: boolean; tenantIdEchoed: boolean; stackHashEchoed: boolean; internalPersistenceIdsEchoed: boolean };
      };
    };

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.data.persistence).toBe("database");
    expect(payload.data.persistenceReceipt.auditPersisted).toBe(true);
    expect(payload.data.responseProjection.auditIdEchoed).toBe(false);
    expect(payload.data.responseProjection.abuseEventIdEchoed).toBe(false);
    expect(payload.data.responseProjection.errorReportIdEchoed).toBe(false);
    expect(payload.data.responseProjection.tenantIdEchoed).toBe(false);
    expect(payload.data.responseProjection.stackHashEchoed).toBe(false);
    expect(payload.data.responseProjection.internalPersistenceIdsEchoed).toBe(false);
    expect(payload.data.report.stackHashStored).toBe(true);
    expect(payload.data.report.stackHashEchoed).toBe(false);
    expect(payload.data).not.toHaveProperty("tenantId");
    expect(payload.data).not.toHaveProperty("auditId");
    expect(payload.data.report).not.toHaveProperty("auditId");
    expect(payload.data.report).not.toHaveProperty("id");
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

  it("keeps Sentry webhook ingestion credential-gated until provider verification is configured", async () => {
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
      data: { receivedSignatureHeader: string; requiredNextWork: string[] };
    };

    expect(missingSignature.status).toBe(400);
    await expect(missingSignature.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "MISSING_SENTRY_SIGNATURE" },
    });
    expect(acceptedShape.status).toBe(503);
    expect(acceptedPayload.ok).toBe(false);
    expect(acceptedPayload.error.code).toBe("SENTRY_WEBHOOK_SECRET_NOT_CONFIGURED");
    expect(acceptedPayload.data.receivedSignatureHeader).toBe("present");
    expect(acceptedPayload.data.requiredNextWork.join(" ")).toContain("Configure SENTRY_WEBHOOK_SECRET");
  });

  it("rejects invalid Sentry webhook signatures before payload reconciliation", async () => {
    process.env.SENTRY_WEBHOOK_SECRET = "sentry_webhook_secret_test";

    const response = await receiveSentryWebhook(
      signedSentryWebhookRequest(
        {
          action: "created",
          data: { id: "issue_invalid_sig", title: "Invalid signature should not reconcile" },
        },
        process.env.SENTRY_WEBHOOK_SECRET,
        "0".repeat(64),
      ),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_SENTRY_SIGNATURE" },
    });
  });

  it("accepts valid Sentry webhook signatures with idempotency and reconciliation metadata", async () => {
    process.env.SENTRY_WEBHOOK_SECRET = "sentry_webhook_secret_test";

    const response = await receiveSentryWebhook(
      signedSentryWebhookRequest(
        {
          action: "resolved",
          data: {
            id: "issue_123",
            title: "Unhandled booking crash for avery@example.com",
            culprit: "/booking",
            release: "phase11-route-test",
          },
        },
        process.env.SENTRY_WEBHOOK_SECRET,
      ),
    );
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        providerDeliveryFingerprint: string;
        responseProjection: {
          rawIdempotencyKeyEchoed: boolean;
          rawProviderDeliveryIdEchoed: boolean;
          rawProviderPayloadEchoed: boolean;
          providerWebhookDeliveryIdEchoed: boolean;
          auditLogIdEchoed: boolean;
          matchedErrorReportIdEchoed: boolean;
          rawReportEchoed: boolean;
          rawWorkflowEchoed: boolean;
          rawIssueDraftEchoed: boolean;
          internalPersistenceIdsEchoed: boolean;
        };
        reconciliation: {
          targetErrorStatus: string;
          persistence: string;
          durablePersistence: string;
          providerWebhookDeliveryRecorded: boolean;
          auditLogged: boolean;
          matchedErrorReportResolved: boolean;
          sanitizedProviderPayload: {
            retained: boolean;
            fieldNames: string[];
            responseProjection: {
              rawProviderPayloadEchoed: boolean;
              rawSanitizedProviderPayloadEchoed: boolean;
            };
          };
        };
        report: {
          route: string;
          release: string;
          redactedMessage: string;
          responseProjection: {
            rawReportEchoed: boolean;
            rawMessageEchoed: boolean;
            rawMetadataEchoed: boolean;
            rawStackEchoed: boolean;
            fingerprintEchoed: boolean;
            stackHashEchoed: boolean;
          };
        };
        workflow: { prepared: boolean; stepCount: number; responseProjection: { rawWorkflowEchoed: boolean; rawWorkflowPayloadEchoed: boolean } };
        issueDraft: { prepared: boolean; responseProjection: { rawIssueDraftEchoed: boolean; rawIssueTitleEchoed: boolean; rawIssueBodyEchoed: boolean; rawIssueLabelsEchoed: boolean } };
        requiredNextWork: string[];
      };
    };

    expect(response.status).toBe(202);
    expect(payload.ok).toBe(true);
    expect(payload.data.providerDeliveryFingerprint).toMatch(/^sentry:resolved:sha256:[a-f0-9]{24}$/);
    expect(payload.data.providerDeliveryFingerprint).not.toContain("issue_123");
    expect(payload.data.responseProjection).toMatchObject({
      rawIdempotencyKeyEchoed: false,
      rawProviderDeliveryIdEchoed: false,
      rawProviderPayloadEchoed: false,
      providerWebhookDeliveryIdEchoed: false,
      auditLogIdEchoed: false,
      matchedErrorReportIdEchoed: false,
      rawReportEchoed: false,
      rawWorkflowEchoed: false,
      rawIssueDraftEchoed: false,
      internalPersistenceIdsEchoed: false,
    });
    expect(payload.data.reconciliation).toMatchObject({
      targetErrorStatus: "resolved",
      persistence: "durable-provider-webhook-attempt",
      durablePersistence: "database-write-rejected",
      providerWebhookDeliveryRecorded: false,
      auditLogged: false,
      matchedErrorReportResolved: false,
    });
    expect(payload.data.reconciliation.sanitizedProviderPayload).toMatchObject({
      retained: true,
      responseProjection: {
        rawProviderPayloadEchoed: false,
        rawSanitizedProviderPayloadEchoed: false,
      },
    });
    expect(payload.data.reconciliation.sanitizedProviderPayload.fieldNames).toEqual(expect.arrayContaining(["action", "data"]));
    expect(payload.data.report).toMatchObject({
      route: "/booking",
      release: "phase11-route-test",
      responseProjection: {
        rawReportEchoed: false,
        rawMessageEchoed: false,
        rawMetadataEchoed: false,
        rawStackEchoed: false,
        fingerprintEchoed: false,
        stackHashEchoed: false,
      },
    });
    expect(payload.data.report.redactedMessage).not.toContain("avery@example.com");
    expect(payload.data.workflow).toMatchObject({
      prepared: true,
      responseProjection: {
        rawWorkflowEchoed: false,
        rawWorkflowPayloadEchoed: false,
      },
    });
    expect(payload.data.issueDraft).toMatchObject({
      prepared: true,
      responseProjection: {
        rawIssueDraftEchoed: false,
        rawIssueTitleEchoed: false,
        rawIssueBodyEchoed: false,
        rawIssueLabelsEchoed: false,
      },
    });
    expect(payload.data.requiredNextWork.join(" ")).toContain("Run live Sentry webhook replay");
  });
});
