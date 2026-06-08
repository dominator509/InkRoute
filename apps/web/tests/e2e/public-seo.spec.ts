import { expect, test } from "@playwright/test";

test.describe("public SEO city and style pages", () => {
  test("city landing pages render local booking context and trust boundaries", async ({ page }) => {
    await page.goto("/cities/seattle-wa");

    await expect(page.locator("h1")).toContainText(/Seattle/i);
    await expect(page.locator("body")).toContainText(/booking/i);
    await expect(page.locator("body")).toContainText(/travel/i);
    await expect(page.locator("body")).toContainText(/FAQ|frequently/i);
  });

  test("style landing pages render style fit, portfolio context, and booking path", async ({ page }) => {
    await page.goto("/styles/blackwork");

    await expect(page.locator("h1")).toContainText(/blackwork/i);
    await expect(page.locator("body")).toContainText(/portfolio/i);
    await expect(page.locator("body")).toContainText(/booking/i);
    await expect(page.getByRole("link", { name: /book/i }).first()).toBeVisible();
  });
});
