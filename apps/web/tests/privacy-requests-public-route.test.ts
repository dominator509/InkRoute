import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../app/api/public/[tenantSlug]/privacy-requests/route";

describe("public privacy request route", () => {
  it("returns 400 for malformed JSON", async () => {
    const request = new NextRequest("https://local.test/api/public/demo-studio-alpha/privacy-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json",
    });

    const response = await POST(request, { params: Promise.resolve({ tenantSlug: "demo-studio-alpha" }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("INVALID_JSON");
  });

  it("returns 400 when required fields are missing", async () => {
    const request = new NextRequest("https://local.test/api/public/demo-studio-alpha/privacy-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "access" }),
    });

    const response = await POST(request, { params: Promise.resolve({ tenantSlug: "demo-studio-alpha" }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("VALIDATION_FAILED");
    expect(body.message).toContain("Expected type and email.");
  });

  it("returns 404 for unknown tenant slug", async () => {
    const request = new NextRequest("https://local.test/api/public/unknown/privacy-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "access", email: "client@example.test" }),
    });

    const response = await POST(request, { params: Promise.resolve({ tenantSlug: "unknown" }) });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("TENANT_NOT_FOUND");
  });

  it("persists demo-scope privacy requests", async () => {
    const request = new NextRequest("https://local.test/api/public/demo-studio-alpha/privacy-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "export",
        email: "client@example.test",
        details: { reason: "customer request", requestCategory: "data-export" },
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ tenantSlug: "demo-studio-alpha" }) });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.data.tenantSlug).toBe("demo-studio-alpha");
    expect(body.data.persisted.requestType).toBe("export");
    expect(body.data.persisted).toMatchObject({ requestType: "export", email: "client@example.test" });
    expect(body.data.persisted.id).toMatch(/^pr_\d{6}$/);
    expect(body.data.gapIds).toContain("GAP-098");
  });
});
