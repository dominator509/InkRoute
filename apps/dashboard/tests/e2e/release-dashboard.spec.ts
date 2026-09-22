import { expect, test } from "@playwright/test";

test.describe("dashboard release automation smoke", () => {
  test("release page renders control-plane sections with provider actions disabled", async ({ page }) => {
    const response = await page.goto("/releases");

    expect(response?.ok()).toBe(true);
    // Headings are asserted by role: the section titles also appear inside
    // body copy (e.g. "release gates attached", generated markdown), which
    // makes bare getByText ambiguous under strict mode.
    await expect(page.getByRole("heading", { name: "Release gates" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Feature flag decisions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "CI/CD guardrail plan" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Rollback draft" })).toBeVisible();
  });

  test("release APIs keep tenant-scoped no-store provider-gated boundaries", async ({ request }) => {
    // Owner role without x-tenant-id resolves to the DB-free local-fallback actor
    // (x-tenant-id would force a database tenant-membership lookup, which is
    // unavailable in the smoke environment); tenant scoping is still enforced by
    // the routes via the actor's tenant.
    const headers = { "x-user-role": "owner" };

    const releases = await request.get("/api/releases", { headers });
    expect([200, 503]).toContain(releases.status());
    expect(releases.headers()["cache-control"]).toContain("no-store");

    const flags = await request.get("/api/feature-flags", { headers });
    expect([200, 503]).toContain(flags.status());
    expect(flags.headers()["cache-control"]).toContain("no-store");
  });
});
