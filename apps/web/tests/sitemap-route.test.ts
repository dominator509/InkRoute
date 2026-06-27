import { describe, expect, it } from "vitest";
import sitemap from "../app/sitemap";
import { GET as getSeoPreview } from "../app/api/public/[tenantSlug]/seo-preview/route";
import { GET as getSitemapPreview } from "../app/api/public/[tenantSlug]/sitemap-preview/route";

describe("SEO app routes", () => {
  it("renders sitemap entries from public SEO routes without noindex entries", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://inkroute.example";

    const sitemapEntries = sitemap();
    const paths = sitemapEntries.map((entry) => new URL(entry.url).pathname);

    expect(sitemapEntries.length).toBeGreaterThan(0);
    expect(paths).not.toContain("/booking/confirmation");
    expect(paths).not.toContain("/booking/deposit-preview");
    expect(paths).toContain("/booking");
  });

  it("returns static demo sitemap preview metadata for PR review", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://inkroute.example";
    const tenantSlug = "inkroute-demo";

    const response = await getSitemapPreview(new Request("https://inkroute.example/api/public/inkroute-demo/sitemap-preview"), {
      params: Promise.resolve({ tenantSlug }),
    });
    const payload = (await response.json()) as {
      ok: boolean;
      status: string;
      tenantSlug: string;
      sitemap: { entries: Array<{ url: string }>; noindexCount: number; indexableCount: number };
      productionBoundary: string;
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(payload.ok).toBe(true);
    expect(payload.tenantSlug).toBe(tenantSlug);
    expect(payload.status).toBe("static_demo_not_database_backed");
    expect(payload.sitemap.indexableCount).toBeGreaterThan(0);
    expect(payload.sitemap.noindexCount).toBeGreaterThan(0);
    expect(payload.productionBoundary).toContain("tenant SEO rows");
    expect(payload.sitemap.entries.some((entry) => entry.url.includes("/booking/deposit-preview"))).toBe(false);
  });

  it("fail-closes production sitemap preview instead of returning static demo metadata", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const response = await getSitemapPreview(new Request("https://inkroute.example/api/public/inkroute-demo/sitemap-preview"), {
        params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error: { code: string };
        productionBoundary: { staticDemoPreviewDisabled: boolean; gapIds: string[] };
      };

      expect(response.status).toBe(503);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(payload.ok).toBe(false);
      expect(payload.error.code).toBe("PROVIDER_PUBLIC_CONTENT_NOT_CONFIGURED");
      expect(payload.productionBoundary.staticDemoPreviewDisabled).toBe(true);
      expect(payload.productionBoundary.gapIds).toContain("GAP-006");
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("fail-closes production SEO preview instead of returning static demo metadata", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const response = await getSeoPreview(new Request("https://inkroute.example/api/public/inkroute-demo/seo-preview"), {
        params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error: { code: string };
        productionBoundary: { staticDemoPreviewDisabled: boolean; gapIds: string[] };
      };

      expect(response.status).toBe(503);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(payload.ok).toBe(false);
      expect(payload.error.code).toBe("PROVIDER_PUBLIC_CONTENT_NOT_CONFIGURED");
      expect(payload.productionBoundary.staticDemoPreviewDisabled).toBe(true);
      expect(payload.productionBoundary.gapIds).toContain("GAP-006");
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("returns SEO preview payload with production gap hints", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://inkroute.example";
    const tenantSlug = "inkroute-demo";

    const response = await getSeoPreview(new Request("https://inkroute.example/api/public/inkroute-demo/seo-preview"), {
      params: Promise.resolve({ tenantSlug }),
    });
    const payload = (await response.json()) as {
      ok: boolean;
      status: string;
      tenantSlug: string;
      preview: { routeCount: number; searchConsole: { siteUrl: string } };
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(payload.ok).toBe(true);
    expect(payload.tenantSlug).toBe(tenantSlug);
    expect(payload.status).toBe("static_demo_not_database_backed");
    expect(payload.preview.routeCount).toBeGreaterThan(0);
    expect(payload.preview.searchConsole.siteUrl).toBe("https://inkroute.example");
  });
});
