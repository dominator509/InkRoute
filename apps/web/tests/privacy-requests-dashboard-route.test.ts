import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../../dashboard/app/api/security/privacy-requests/route";

describe("dashboard privacy request route", () => {
  it("returns 400 for malformed JSON", async () => {
    const request = new NextRequest("https://local.test/api/dashboard/security/privacy-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("INVALID_JSON");
  });

  it("returns 400 when required fields are missing", async () => {
    const request = new NextRequest("https://local.test/api/dashboard/security/privacy-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "access" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("VALIDATION_FAILED");
    expect(body.message).toContain("Expected valid type and email");
  });

  it("persists demo-scope privacy requests with tenant context", async () => {
    const request = new NextRequest("https://local.test/api/dashboard/security/privacy-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "access",
        email: "client@example.test",
        details: { reason: "customer request", requestCategory: "data-export" },
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.data.tenantId).toBe("demo-studio-alpha");
    expect(body.data.persisted.requestType).toBe("access");
    expect(body.data.persisted.id).toMatch(/^pr_\d{6}$/);
    expect(body.data.persisted.receivedAt).toBeDefined();
    expect(body.data.nextStep).toContain("do not yet execute export/deletion/notification workflows");
    expect(body.data.gapIds).toContain("GAP-098");
  });
});
