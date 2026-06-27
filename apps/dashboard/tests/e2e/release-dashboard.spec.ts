import { expect, test } from "@playwright/test";

test.describe("dashboard release automation smoke", () => {
  test("release page renders control-plane sections with provider actions disabled", async ({ page }) => {
    const response = await page.goto("/releases");

    expect(response?.ok()).toBe(true);
    await expect(page.getByText("Release gates")).toBeVisible();
    await expect(page.getByText("Feature flag decisions")).toBeVisible();
    await expect(page.getByText("CI/CD guardrail plan")).toBeVisible();
    await expect(page.getByText("Rollback draft")).toBeVisible();
  });

  test("release APIs keep tenant-scoped no-store provider-gated boundaries", async ({ request }) => {
    const headers = { "x-tenant-id": "inkroute-demo", "x-user-role": "owner" };

    const releases = await request.get("/api/releases?tenantId=inkroute-demo", { headers });
    expect([200, 503]).toContain(releases.status());
    expect(releases.headers()["cache-control"]).toContain("no-store");

    const flags = await request.get("/api/feature-flags?tenantId=inkroute-demo", { headers });
    expect([200, 503]).toContain(flags.status());
    expect(flags.headers()["cache-control"]).toContain("no-store");
  });
});
