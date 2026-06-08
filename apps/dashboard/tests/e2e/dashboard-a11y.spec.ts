import { expect, test } from "@playwright/test";

test.describe("dashboard accessibility smoke", () => {
  test("@a11y dashboard shell exposes navigation, tenant context, and keyboard focus", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("navigation", { name: /dashboard navigation/i })).toBeVisible();
    await expect(page.getByLabel(/current tenant preview/i)).toBeVisible();

    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
  });

  test("@a11y booking dashboard exposes accessible request table/card region", async ({ page }) => {
    await page.goto("/bookings");

    await expect(page.getByLabel(/booking requests/i)).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
