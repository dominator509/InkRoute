import { expect, test } from "@playwright/test";

test.describe("public artist website", () => {
  test("homepage exposes portfolio-led conversion path", async ({ page }: { page: any }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: /book/i }).first()).toBeVisible();
    await expect(page.getByText(/portfolio/i).first()).toBeVisible();
    await expect(page.getByText(/travel/i).first()).toBeVisible();
  });

  test("booking preview presents intake and deposit boundaries", async ({ page }: { page: any }) => {
    await page.goto("/booking");

    await expect(page.getByText(/city/i).first()).toBeVisible();
    await expect(page.getByText(/Tattoo Readiness/i)).toBeVisible();
    await expect(page.getByText(/deposit/i).first()).toBeVisible();
  });

  test("trust and privacy placeholders are publicly reachable", async ({ page }: { page: any }) => {
    await page.goto("/trust");
    await expect(page.getByText(/trust/i).first()).toBeVisible();

    await page.goto("/privacy");
    await expect(page.getByText(/privacy/i).first()).toBeVisible();
  });
});
