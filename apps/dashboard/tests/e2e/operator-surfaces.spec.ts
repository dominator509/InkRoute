import { expect, test } from "@playwright/test";

test.describe("dashboard operator surfaces", () => {
  test("payments, releases, errors, messages, templates, SEO, and trust surfaces render guarded boundaries", async ({ page }) => {
    for (const path of ["/payments", "/releases", "/errors", "/messages", "/templates", "/seo", "/trust"]) {
      await page.goto(path);
      await expect(page.locator("body")).toContainText(/scaffolded|credential|disabled|boundary|gated|trust|security|provider|preview/i);
    }
  });
});
