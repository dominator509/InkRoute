import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware as webMiddleware } from "../middleware";
import { middleware as dashboardMiddleware } from "../../dashboard/middleware";

function request(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(url, init);
}

describe("security runtime middleware", () => {
  it("blocks cookie-authenticated web mutations without a valid CSRF token", async () => {
    const response = webMiddleware(
      request("https://local.test/api/public/inkroute-demo/messages", {
        method: "POST",
        headers: { cookie: "inkroute_session=session_123; inkroute_csrf=csrf_123" },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "CSRF_TOKEN_REQUIRED" },
    });
    expect(response.headers.get("X-InkRoute-Security-Runtime")).toBe("blocked");
    expect(response.headers.get("Content-Security-Policy")).toContain("https://sentry.io");
    expect(response.headers.get("Content-Security-Policy")).toContain("https://api.stripe.com");
  });

  it("allows web mutations with matching CSRF header and cookie while applying security headers", () => {
    const response = webMiddleware(
      request("https://local.test/api/public/inkroute-demo/messages", {
        method: "POST",
        headers: {
          cookie: "inkroute_session=session_123; inkroute_csrf=csrf_123",
          "x-csrf-token": "csrf_123",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("X-InkRoute-Security-Runtime")).toBe("ready");
    expect(response.headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("blocks cookie-authenticated dashboard mutations without a valid dashboard CSRF token", async () => {
    const response = dashboardMiddleware(
      request("https://dashboard.local.test/api/security/privacy-requests", {
        method: "POST",
        headers: {
          cookie: "inkroute_dashboard_session=session_123; inkroute_dashboard_csrf=csrf_123",
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "CSRF_TOKEN_REQUIRED" },
    });
    expect(response.headers.get("X-InkRoute-Security-Runtime")).toBe("blocked");
    expect(response.headers.get("Content-Security-Policy")).toContain("https://sentry.io");
  });

  it("allows dashboard mutations with matching CSRF header and cookie", () => {
    const response = dashboardMiddleware(
      request("https://dashboard.local.test/api/security/privacy-requests", {
        method: "POST",
        headers: {
          cookie: "inkroute_dashboard_session=session_123; inkroute_dashboard_csrf=csrf_123",
          "x-csrf-token": "csrf_123",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("X-InkRoute-Security-Runtime")).toBe("ready");
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("Permissions-Policy")).toContain("camera=()");
  });
});
