import { describe, expect, it } from "vitest";
import { auditSeoRoute, buildInternalLinkPlan, buildMetadataDraft, buildSitemapPlan, createSeoRouteRecord } from "../src/index";

describe("SEO engine helpers", () => {
  const cityRoute = createSeoRouteRecord({
    path: "/cities/seattle-wa",
    kind: "city",
    title: "Seattle Tattoo Booking with Mara Vale",
    description: "Book blackwork and ornamental tattoo sessions during Mara Vale's Seattle guest spot.",
    indexMode: "index",
    priority: 0.85,
    lastModified: "2026-06-01T00:00:00.000Z"
  });

  it("builds canonical metadata drafts", () => {
    const metadata = buildMetadataDraft({ baseUrl: "https://inkroute.example", route: cityRoute });

    expect(metadata.canonicalUrl).toBe("https://inkroute.example/cities/seattle-wa");
    expect(metadata.robots.index).toBe(true);
    expect(metadata.openGraph.url).toBe(metadata.canonicalUrl);
  });

  it("generates sitemap entries only for indexable routes", () => {
    const noindexRoute = createSeoRouteRecord({
      path: "/dashboard",
      kind: "system",
      title: "Dashboard",
      description: "Private dashboard",
      indexMode: "noindex"
    });
    const sitemap = buildSitemapPlan({ baseUrl: "https://inkroute.example", routes: [cityRoute, noindexRoute] });

    expect(sitemap.entries).toHaveLength(1);
    expect(sitemap.noindexCount).toBe(1);
  });

  it("reports content-length audit signals and internal-link recommendations", () => {
    const audit = auditSeoRoute(cityRoute);
    const links = buildInternalLinkPlan([cityRoute, createSeoRouteRecord({ path: "/styles/blackwork", kind: "style", title: "Blackwork Tattoo Booking", description: "Blackwork tattoo style guide and booking page" })]);

    expect(audit.path).toBe(cityRoute.path);
    expect(links.some((link) => link.fromPath === "/cities/seattle-wa" || link.toPath === "/cities/seattle-wa")).toBe(true);
  });
});
