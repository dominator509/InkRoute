import { describe, expect, it } from "vitest";
import { buildPublicContentBundle, demoPortfolioItems, getPortfolioImageDerivative, inkrouteDemoTenant, normalizeTenantSlug } from "../src/index";

describe("public content bundle", () => {
  it("normalizes tenant slugs and rejects unknown tenants", () => {
    expect(normalizeTenantSlug(" InkRoute-Demo ")).toBe("inkroute-demo");
    expect(buildPublicContentBundle("unknown-studio")).toBeNull();
  });

  it("projects tenant-scoped public content without internal identifiers", () => {
    const bundle = buildPublicContentBundle(inkrouteDemoTenant.slug);

    expect(bundle).not.toBeNull();
    expect(bundle?.tenant).toEqual({
      slug: "inkroute-demo",
      name: "InkRoute Demo Studio",
      publicSiteName: "Mara Vale Tattoo",
      defaultTimezone: "America/Los_Angeles",
    });
    expect(JSON.stringify(bundle)).not.toContain("tenant_demo_nomad");
    expect(JSON.stringify(bundle)).not.toContain("artist_mara_vale");
    expect(JSON.stringify(bundle)).not.toContain("pf_orbital_serpent");
    expect(bundle?.redactedFields).toContain("portfolio.attributionKey");
  });

  it("includes only public portfolio projections with required image fields", () => {
    const bundle = buildPublicContentBundle(inkrouteDemoTenant.slug);

    expect(bundle?.portfolioItems).toHaveLength(demoPortfolioItems.filter((item) => item.isPublic !== false).length);
    expect(bundle?.portfolioItems.every((item) => item.slug && item.imageUrl && item.altText)).toBe(true);
    expect(bundle?.portfolioItems.every((item) => item.image.width > 0 && item.image.height > 0)).toBe(true);
    expect(bundle?.portfolioItems.every((item) => item.image.storageVisibility === "public_derivative")).toBe(true);
    expect(bundle?.portfolioItems.every((item) => item.image.privateOriginalAvailable === false)).toBe(true);
    expect(bundle?.portfolioItems[0]).not.toHaveProperty("id");
    expect(bundle?.portfolioItems[0]).not.toHaveProperty("tenantId");
    expect(bundle?.portfolioItems[0]).not.toHaveProperty("artistId");
    expect(bundle?.portfolioItems[0]).not.toHaveProperty("attributionKey");
  });

  it("derives public portfolio image metadata without exposing private originals", () => {
    const item = demoPortfolioItems[0];
    const derivative = getPortfolioImageDerivative(item);

    expect(derivative).toMatchObject({
      src: item.imageUrl,
      width: 1200,
      height: 1500,
      aspectRatio: "4:5",
      altText: item.altText,
      storageVisibility: "public_derivative",
      privateOriginalAvailable: false,
    });
    expect(derivative.cacheControl).toContain("stale-while-revalidate");
    expect(JSON.stringify(derivative)).not.toContain("tenant_private");
    expect(JSON.stringify(derivative)).not.toContain("client_private");
  });

  it("provides public travel and SEO collections with a cache policy", () => {
    const bundle = buildPublicContentBundle("inkroute-demo");

    expect(bundle?.travelStops.length).toBeGreaterThan(0);
    expect(bundle?.cityPages.length).toBeGreaterThan(0);
    expect(bundle?.stylePages.length).toBeGreaterThan(0);
    expect(bundle?.cachePolicy).toEqual({
      strategy: "static-demo",
      revalidateSeconds: 300,
    });
  });
});
