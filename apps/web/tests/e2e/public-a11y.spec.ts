import { expect, test } from "@playwright/test";

test.describe("public accessibility smoke", () => {
  test("@a11y booking flow supports keyboard navigation with visible focus targets", async ({ page }) => {
    await page.goto("/booking");

    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();

    const progress = page.getByLabel("Booking request progress");
    await expect(progress).toBeVisible();
    await expect(page.getByLabel(/Readiness score/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /continue/i })).toBeVisible();
  });

  test("@a11y public layout exposes navigation, landmarks, and labelled visual regions", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("navigation", { name: /public navigation/i })).toBeVisible();
    await expect(page.getByLabel(/artist highlights/i)).toBeVisible();
    await expect(page.getByLabel(/editorial tattoo portfolio preview/i)).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
  });
});
