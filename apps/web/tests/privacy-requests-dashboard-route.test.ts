import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { rateLimitRules } from "@inkroute/security";
import { POST } from "../../dashboard/app/api/security/privacy-requests/route";

function dashboardPrivacyRequest(
  body: unknown,
  clientIp = "203.0.113.180",
  userId = "dashboard-user-1",
  tenantId: string | null = null,
  role = "studio_manager",
): NextRequest {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-client-ip": clientIp,
    "x-user-id": userId,
    "x-user-role": role,
  };
  if (tenantId) headers["x-tenant-id"] = tenantId;

  return new NextRequest("https://local.test/api/dashboard/security/privacy-requests", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validDashboardPrivacyBody = {
  type: "access",
  email: "client@example.test",
  details: { reason: "customer request", requestCategory: "data-export", phone: "555-0101" },
};

describe("dashboard privacy request route", () => {
  it("returns 400 for malformed JSON", async () => {
    const response = await POST(dashboardPrivacyRequest("not-json"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("INVALID_JSON");
  });

  it("returns 400 when required fields are missing", async () => {
    const response = await POST(dashboardPrivacyRequest({ type: "access" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("VALIDATION_FAILED");
    expect(body.message).toContain("Expected valid type and email");
  });

  it("persists demo-scope privacy requests with tenant context and redacted submission evidence", async () => {
    const response = await POST(dashboardPrivacyRequest(validDashboardPrivacyBody));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.data.tenantId).toBe("tenant_inkroute_demo");
    expect(body.data.persisted.requestType).toBe("access");
    expect(body.data.persisted.id).toMatch(/^pr_\d{6}$/);
    expect(body.data.persisted.receivedAt).toBeDefined();
    expect(body.data.persisted.email).not.toBe("client@example.test");
    expect(body.data.persisted.redactedSubmission.details.phone).not.toBe("555-0101");
    expect(body.data.actor).toMatchObject({ userId: "dashboard-user-1", role: "studio_manager" });
    expect(body.data.nextStep).toContain("do not yet execute export/deletion/notification workflows");
    expect(body.data.gapIds).toContain("GAP-098");
  });

  it("fail-closes production dashboard privacy requests before non-durable persistence", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const response = await POST(dashboardPrivacyRequest(validDashboardPrivacyBody, "203.0.113.184", "dashboard-user-production", "tenant_inkroute_demo"));
      const body = await response.json();

      expect(response.status).toBe(503);
      expect(body.ok).toBe(false);
      expect(["DATABASE_UNAVAILABLE", "DASHBOARD_PRIVACY_REQUEST_PERSISTENCE_NOT_CONFIGURED"]).toContain(body.error.code);
      expect(JSON.stringify(body)).not.toContain("555-0101");
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("denies dashboard privacy mutations for roles without tenant write permission", async () => {
    const response = await POST(dashboardPrivacyRequest(validDashboardPrivacyBody, "203.0.113.183", "dashboard-user-assistant", null, "assistant"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "FORBIDDEN" },
    });
  });

  it("throttles repeated dashboard privacy mutations per tenant, actor, and client", async () => {
    const dashboardRule = rateLimitRules.find((rule) => rule.id === "dashboard-mutation");
    expect(dashboardRule).toBeDefined();

    const responses = [];
    for (let attempt = 0; attempt <= dashboardRule!.maxRequests; attempt += 1) {
      responses.push(await POST(dashboardPrivacyRequest(validDashboardPrivacyBody, "203.0.113.181", "dashboard-user-rate-limit")));
    }

    const throttled = responses.at(-1)!;
    const body = await throttled.json();

    expect(responses.slice(0, -1).every((response) => response.status === 201)).toBe(true);
    expect(throttled.status).toBe(429);
    expect(throttled.headers.get("Retry-After")).toBeTruthy();
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        details: {
          gapIds: ["GAP-095", "GAP-098", "GAP-101"],
          remaining: 0,
        },
      },
    });
  });
});
