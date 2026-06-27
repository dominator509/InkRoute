import { expect, test } from "@playwright/test";

test.describe("dashboard guarded operator surfaces", () => {
  test("overview links core operator surfaces", async ({ page }: { page: any }) => {
    await page.goto("/");

    await expect(page.getByText(/booking/i).first()).toBeVisible();
    await expect(page.getByText(/travel/i).first()).toBeVisible();
    await expect(page.getByText(/portfolio/i).first()).toBeVisible();
  });

  test("payments, releases, errors, and trust pages expose disabled integration boundaries", async ({ page }: { page: any }) => {
    for (const path of ["/payments", "/releases", "/errors", "/trust"]) {
      await page.goto(path);
      await expect(page.locator("body")).toContainText(/scaffolded|credential|disabled|boundary|gated/i);
    }
  });

  test("booking detail page renders demo timeline evidence", async ({ page }: { page: any }) => {
    await page.goto("/bookings/demo-booking-1");

    await expect(page.locator("body")).toContainText(/timeline|readiness|deposit/i);
  });
});
