import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextRequest } from "next/server";
import { rateLimitRules } from "@inkroute/security";
import { POST } from "../app/api/public/[tenantSlug]/privacy-requests/route";

const routeSource = readFileSync(resolve(__dirname, "../app/api/public/[tenantSlug]/privacy-requests/route.ts"), "utf8");

function privacyRequest(body: unknown, clientIp = "203.0.113.170"): NextRequest {
  return new NextRequest("https://local.test/api/public/inkroute-demo/privacy-requests", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-client-ip": clientIp,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validPrivacyBody = {
  type: "export",
  email: "client@example.test",
  details: { reason: "customer request", requestCategory: "data-export", phone: "555-0100" },
};

describe("public privacy request route", () => {
  it("returns 400 for malformed JSON", async () => {
    const response = await POST(privacyRequest("not-json"), { params: Promise.resolve({ tenantSlug: "demo-studio-alpha" }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.error).toMatchObject({ code: "INVALID_JSON" });
  });

  it("returns 400 when required fields are missing", async () => {
    const response = await POST(privacyRequest({ type: "access" }), { params: Promise.resolve({ tenantSlug: "demo-studio-alpha" }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.error).toMatchObject({ code: "VALIDATION_FAILED", message: "Expected type and email." });
  });

  it("returns 404 for unknown tenant slug", async () => {
    const response = await POST(privacyRequest({ type: "access", email: "client@example.test" }), {
      params: Promise.resolve({ tenantSlug: "unknown" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.error.code).toBe("TENANT_NOT_FOUND");
  });

  it("persists demo-scope privacy requests with tenant context and safe receipt evidence", async () => {
    const response = await POST(privacyRequest(validPrivacyBody), { params: Promise.resolve({ tenantSlug: "inkroute-demo" }) });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.tenantSlug).toBe("inkroute-demo");
    expect(body.data.persistence).toBe("local-fallback");
    expect(body.data.receipt).toMatchObject({
      requestType: "export",
      status: "intake_received",
      identityProofRequired: true,
      tenantRelationshipProofRequired: true,
    });
    expect(body.data.responseProjection).toMatchObject({
      requesterEmailRedacted: true,
      requesterEmailSelectedFromDatabase: false,
      rawPayloadStored: false,
      rawPayloadEchoed: false,
      redactedSubmissionEchoed: false,
      requesterHashEchoed: false,
      rawIdempotencyKeyEchoed: false,
      idempotencyResultInternalIdsStored: false,
      privacyRequestIdEchoed: false,
      auditIdEchoed: false,
      tenantIdEchoed: false,
      internalPersistenceIdsEchoed: false,
    });
    expect(body.data).not.toHaveProperty("tenantId");
    expect(body.data).not.toHaveProperty("redactedSubmission");
    expect(body.data).not.toHaveProperty("persisted");
    expect(body.data).not.toHaveProperty("auditId");
    expect(body.data).not.toHaveProperty("idempotencyKeyId");
    expect(body.data.gapIds).toContain("GAP-098");
  });

  it("keeps DB-backed public privacy response projection redacted by source contract", () => {
    expect(routeSource).toContain("buildPrivacyRequestResponseProjection");
    expect(routeSource).toContain("buildSafePrivacyRequestReceipt");
    expect(routeSource).toContain("internalPersistenceIdsStored: false");
    expect(routeSource).not.toContain("requesterEmail: true");
    expect(routeSource).toContain("requesterEmailSelectedFromDatabase: false");
    expect(routeSource).toContain("requesterEmailRedacted: true");
    expect(routeSource).toContain("rawPayloadStored: false");
    expect(routeSource).toContain("rawPayloadEchoed: false");
    expect(routeSource).toContain("redactedSubmissionEchoed: false");
    expect(routeSource).toContain("requesterHashEchoed: false");
    expect(routeSource).toContain("rawIdempotencyKeyEchoed: false");
    expect(routeSource).toContain("idempotencyResultInternalIdsStored: false");
    expect(routeSource).toContain("privacyRequestIdEchoed: false");
    expect(routeSource).toContain("auditIdEchoed: false");
    expect(routeSource).toContain("tenantIdEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsEchoed: false");
    expect(routeSource).toContain("privacyRequestPersisted: true");
    expect(routeSource).toContain("auditLogged: true");
    expect(routeSource).toContain("idempotencyPersisted: true");
    expect(routeSource).not.toContain("redactedSubmission: redactedSubmission");
    expect(routeSource).not.toContain("persisted,");
    expect(routeSource).not.toContain("auditId: result.audit.id");
    expect(routeSource).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(routeSource).not.toContain("idempotencyKeyId: idempotency.id");
    expect(routeSource).not.toContain("privacyRequestId: privacyRequest.id");
    expect(routeSource).not.toContain("auditId: audit.id");
    expect(routeSource).not.toContain("tenantId: resolvedTenant.tenantId,\n            persistence");
    expect(routeSource).not.toContain("tenantId: resolvedTenant.tenantId,\n        persistence");
    expect(routeSource).not.toContain("result: toJsonValue({\n              requesterHash,");
  });

  it("fail-closes production privacy requests instead of saving local runtime drafts", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const response = await POST(privacyRequest(validPrivacyBody, "203.0.113.172"), {
        params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
      });
      const body = (await response.json()) as {
        ok: boolean;
        error: { code: string; gapIds: string[] };
        productionBoundary: { localPrivacyRequestPersistenceDisabled: boolean };
      };

      expect(response.status).toBe(503);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("PROVIDER_PRIVACY_REQUEST_PERSISTENCE_NOT_CONFIGURED");
      expect(body.error.gapIds).toContain("GAP-098");
      expect(body.error.gapIds).toContain("GAP-099");
      expect(body.productionBoundary.localPrivacyRequestPersistenceDisabled).toBe(true);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("throttles repeated privacy requests per tenant and client", async () => {
    const privacyRule = rateLimitRules.find((rule) => rule.id === "public-privacy-request");
    expect(privacyRule).toBeDefined();

    const responses = [];
    for (let attempt = 0; attempt <= privacyRule!.maxRequests; attempt += 1) {
      responses.push(
        await POST(privacyRequest(validPrivacyBody, "203.0.113.171"), {
          params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
        }),
      );
    }

    const throttled = responses.at(-1)!;
    const body = await throttled.json();

    expect(responses.slice(0, -1).every((response) => response.status === 201)).toBe(true);
    expect(throttled.status).toBe(429);
    expect(throttled.headers.get("Cache-Control")).toBe("no-store");
    expect(throttled.headers.get("Retry-After")).toBeTruthy();
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        details: {
          gapIds: ["GAP-098", "GAP-101"],
          remaining: 0,
        },
      },
    });
  });
});
