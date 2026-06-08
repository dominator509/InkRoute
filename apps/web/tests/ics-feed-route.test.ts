import { describe, expect, it } from "vitest";
import { GET as getTravelIcsFeed } from "../app/api/public/[tenantSlug]/calendar/[artistSlug]/travel.ics/route";

const routeContext = {
  params: Promise.resolve({ tenantSlug: "inkroute-demo", artistSlug: "mara-vale" }),
};

describe("signed ICS feed route", () => {
  it("returns 404 for non-demo tenant or artist route scope", async () => {
    const response = await getTravelIcsFeed(new Request("https://local.test/api/public/other/calendar/mara-vale/travel.ics"), {
      params: Promise.resolve({ tenantSlug: "other", artistSlug: "mara-vale" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "NOT_FOUND" },
    });
  });

  it("rejects missing and invalid feed tokens with private no-store cache headers", async () => {
    const missing = await getTravelIcsFeed(new Request("https://local.test/api/public/inkroute-demo/calendar/mara-vale/travel.ics"), routeContext);
    const invalid = await getTravelIcsFeed(
      new Request("https://local.test/api/public/inkroute-demo/calendar/mara-vale/travel.ics?token=wrong"),
      routeContext,
    );

    expect(missing.status).toBe(401);
    expect(missing.headers.get("Cache-Control")).toBe("private, no-store");
    expect(missing.headers.get("X-InkRoute-Status")).toBe("signed-feed-token-rejected");
    await expect(missing.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "ICS_FEED_TOKEN_REQUIRED",
        status: "missing_token",
      },
    });

    expect(invalid.status).toBe(401);
    expect(invalid.headers.get("Cache-Control")).toBe("private, no-store");
    await expect(invalid.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "ICS_FEED_TOKEN_REQUIRED",
        status: "invalid_token",
      },
    });
  });

  it("returns private signed ICS output for the local demo feed token", async () => {
    const response = await getTravelIcsFeed(
      new Request("https://local.test/api/public/inkroute-demo/calendar/mara-vale/travel.ics?token=inkroute-demo-travel-feed-token"),
      routeContext,
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/calendar");
    expect(response.headers.get("Cache-Control")).toBe("private, max-age=300, stale-while-revalidate=60");
    expect(response.headers.get("X-InkRoute-Status")).toBe("local-demo-signed-feed");
    expect(response.headers.get("X-InkRoute-Feed-Access-Logged")).toBe("true");
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("BEGIN:VEVENT");
    expect(body).toContain("END:VCALENDAR");
  });
});
