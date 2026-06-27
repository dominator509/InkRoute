import { expect, test } from "@playwright/test";

test.describe("observability global-error rendered coverage", () => {
  test("web runtime exposes telemetry and observability-safe headers on rendered pages", async ({ page }) => {
    const response = await page.goto("/");

    expect(response?.ok()).toBe(true);
    expect(response?.headers()["x-request-id"]).toBeTruthy();
    expect(response?.headers()["traceparent"]).toContain("00-");
    expect(response?.headers()["x-inkroute-telemetry-status"]).toBeTruthy();
  });

  test("public ingest rejects malformed reports without leaking raw payloads", async ({ request }) => {
    const response = await request.post("/api/public/inkroute-demo/error-reports", {
      data: { message: "client@example.test token=demo-token" },
    });

    expect([400, 422]).toContain(response.status());
    const body = await response.text();
    expect(body).not.toContain("demo-token");
  });
});
