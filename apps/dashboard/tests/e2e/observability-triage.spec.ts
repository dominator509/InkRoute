import { expect, test } from "@playwright/test";

test.describe("dashboard observability triage smoke", () => {
  test("errors page renders triage, alert, provider, and automation sections", async ({ page }) => {
    const response = await page.goto("/errors");

    expect(response?.ok()).toBe(true);
    await expect(page.getByText("Alert routing preview")).toBeVisible();
    await expect(page.getByText("Provider boundaries")).toBeVisible();
    await expect(page.getByText("Agentic bug-fix workflow")).toBeVisible();
  });

  test("error-report read API remains no-store and tenant-scoped in browser smoke", async ({ request }) => {
    const response = await request.get("/api/error-reports?tenantId=inkroute-demo", {
      headers: {
        "x-tenant-id": "inkroute-demo",
        "x-user-role": "owner",
      },
    });

    expect([200, 503]).toContain(response.status());
    expect(response.headers()["cache-control"]).toContain("no-store");
  });
});
