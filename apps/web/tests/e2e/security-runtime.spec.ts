import { expect, test } from "@playwright/test";

test.describe("web security runtime", () => {
  test("public pages include shared security headers from middleware", async ({ page }) => {
    const response = await page.goto("/privacy");

    expect(response?.ok()).toBe(true);
    expect(response?.headers()["x-inkroute-security-runtime"]).toBe("ready");
    expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(response?.headers()["content-security-policy"]).toContain("https://sentry.io");
    expect(response?.headers()["content-security-policy"]).toContain("https://api.stripe.com");
    expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response?.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("cookie-authenticated public mutations require CSRF proof before route handlers", async ({ request }) => {
    const blocked = await request.post("/api/public/inkroute-demo/secure-upload-intents", {
      headers: {
        cookie: "inkroute_session=session_e2e; inkroute_csrf=csrf_e2e",
      },
      data: {
        kind: "reference_private",
        filename: "placement-reference.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 512_000,
      },
    });

    expect(blocked.status()).toBe(403);
    expect(blocked.headers()["x-inkroute-security-runtime"]).toBe("blocked");
    await expect(blocked.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "CSRF_TOKEN_REQUIRED" },
    });
  });
});
