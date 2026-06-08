import { describe, expect, it } from "vitest";
import type { ArtistProfile, PortfolioItem, SeoCityPage, SeoStylePage, TravelStop } from "@inkroute/types";
import {
  auditSeoRoute,
  buildCitySeoBrief,
  buildFaqSchema,
  buildInternalLinkPlan,
  buildMetadataDraft,
  buildSitemapPlan,
  buildStyleSeoBrief,
  buildWebPageSchema,
  buildWebsiteSchema,
  composeJsonLdGraph,
  createCanonicalUrl,
  createSeoRouteRecord,
} from "../src/index";

describe("SEO engine helpers", () => {
  const cityRoute = createSeoRouteRecord({
    path: "/cities/seattle-wa",
    kind: "city",
    title: "Seattle Tattoo Booking with Mara Vale",
    description: "Book blackwork and ornamental tattoo sessions during Mara Vale's Seattle guest spot.",
    city: "Seattle",
    region: "WA",
    indexMode: "index",
    priority: 0.85,
    lastModified: "2026-06-01T00:00:00.000Z",
  });

  it("builds canonical metadata drafts", () => {
    const metadata = buildMetadataDraft({ baseUrl: "https://inkroute.example", route: cityRoute });

    expect(metadata.canonicalUrl).toBe("https://inkroute.example/cities/seattle-wa");
    expect(metadata.robots.index).toBe(true);
    expect(metadata.openGraph.url).toBe(metadata.canonicalUrl);
    expect(metadata.alternates.canonical).toBe(metadata.canonicalUrl);
  });

  it("generates sitemap entries only for indexable routes", () => {
    const noindexRoute = createSeoRouteRecord({
      path: "/dashboard",
      kind: "system",
      title: "Dashboard",
      description: "Private dashboard",
      indexMode: "noindex",
    });
    const sitemap = buildSitemapPlan({ baseUrl: "https://inkroute.example", routes: [cityRoute, noindexRoute] });

    expect(sitemap.entries).toHaveLength(1);
    expect(sitemap.noindexCount).toBe(1);
    expect(sitemap.entries[0]?.url).toBe("https://inkroute.example/cities/seattle-wa");
  });

  it("reports content-length audit signals and internal-link recommendations", () => {
    const audit = auditSeoRoute(cityRoute);
    const links = buildInternalLinkPlan([
      cityRoute,
      createSeoRouteRecord({
        path: "/",
        kind: "static",
        title: "InkRoute Demo",
        description: "Default landing page for demo booking routes and travel planning content.",
      }),
      createSeoRouteRecord({
        path: "/styles/blackwork",
        kind: "style",
        title: "Blackwork Tattoo Booking",
        description: "Blackwork tattoo style guide and booking page with clear call to action.",
      }),
      createSeoRouteRecord({
        path: "/booking",
        kind: "booking",
        title: "Request an Appointment",
        description: "Start a booking request and submit preferences for consultation.",
      }),
    ]);

    expect(audit.path).toBe(cityRoute.path);
    expect(links.some((link) => link.fromPath === "/cities/seattle-wa" && link.toPath === "/booking")).toBe(true);
  });

  it("filters draft and noindex routes from sitemap generation", () => {
    const draftRoute = createSeoRouteRecord({
      path: "/city-draft",
      kind: "city",
      title: "Draft City SEO",
      description: "Draft city SEO route should be excluded from indexable output.",
      status: "draft",
    });
    const noindexRoute = createSeoRouteRecord({
      path: "/hidden",
      kind: "system",
      title: "Hidden route",
      description: "Hidden system route should never be indexed.",
      indexMode: "noindex",
    });
    const archivedRoute = createSeoRouteRecord({
      path: "/archived",
      kind: "style",
      title: "Archived style landing",
      description: "Archived style pages are excluded from sitemap.",
      status: "archived",
    });
    const visibleRoute = createSeoRouteRecord({
      path: "/visible",
      kind: "style",
      title: "Visible style landing for tattoo booking",
      description: "This is a valid and visible style landing route that should remain searchable in sitemap output.",
      status: "published",
    });

    const sitemap = buildSitemapPlan({
      baseUrl: "https://inkroute.example",
      routes: [draftRoute, noindexRoute, archivedRoute, visibleRoute],
    });

    expect(sitemap.entries).toHaveLength(1);
    expect(sitemap.entries[0]?.url).toContain("/visible");
    expect(sitemap.noindexCount).toBe(3);
  });

  it("records audit issues for SEO-critical metadata edges", () => {
    const undersized = createSeoRouteRecord({
      path: "/tiny",
      kind: "static",
      title: "Short",
      description: "brief",
      status: "published",
    });
    const cityWithNoRegion = createSeoRouteRecord({
      path: "/cities/anywhere",
      kind: "city",
      title: "City page with no region value",
      description: "City pages need valid local context and travel metadata before production publishing.",
      city: "Seattle",
      status: "published",
    });
    const cityGood = createSeoRouteRecord({
      path: "/cities/seattle-wa",
      kind: "city",
      title: "Seattle tattoo booking with proper metadata",
      description: "Seattle tattoo booking page with strong copy for local search, booking context, and travel intent included in metadata.",
      city: "Seattle",
      region: "WA",
      status: "published",
    });

    const shortAudit = auditSeoRoute(undersized);
    const missingCityAudit = auditSeoRoute(cityWithNoRegion);
    const goodAudit = auditSeoRoute(cityGood);

    expect(shortAudit.score).toBeLessThan(100);
    expect(shortAudit.issues.some((issue) => issue.code === "TITLE_LENGTH" || issue.code === "META_DESCRIPTION_LENGTH")).toBe(true);
    expect(missingCityAudit.issues.some((issue) => issue.code === "CITY_CONTEXT_MISSING")).toBe(true);
    expect(goodAudit.issues.some((issue) => issue.code === "CITY_CONTEXT_MISSING")).toBe(false);
    expect(goodAudit.passedChecks).toContain("local_context");
  });

  it("builds JSON-LD drafts for composed web schema graphs", () => {
    const graph = composeJsonLdGraph([
      buildWebsiteSchema({
        name: "InkRoute Studio",
        url: "https://inkroute.example",
        description: "Tattoo travel and booking platform for guest spots.",
      }),
      buildWebPageSchema({
        name: "Seattle Tattoo Booking",
        description: "Landing page for Seattle booking during guest spot week.",
        url: createCanonicalUrl("https://inkroute.example", "/cities/seattle-wa"),
      }),
      buildFaqSchema([
        { question: "Can I book a deposit?", answer: "Some deposits may be required in this demo." },
      ]),
    ]);

    expect(graph["@context"]).toBe("https://schema.org");
    expect(graph["@graph"]).toHaveLength(3);
    expect(graph["@graph"][1]?.["@type"]).toBe("WebPage");
    expect((graph["@graph"][1] as Record<string, unknown>).name).toBe("Seattle Tattoo Booking");
  });

  it("creates city and style SEO briefs with internal link plans", () => {
    const cityPage: SeoCityPage = {
      id: "city_001",
      tenantId: "tenant_001",
      slug: "seattle-wa",
      city: "Seattle",
      region: "WA",
      country: "US",
      title: "Seattle WA Tattoo Booking",
      metaDescription: "Book Mara Vale tattoo work in Seattle with long-form local details for Seattle sessions and guest spot availability.",
      canonicalPath: "/cities/seattle-wa",
      status: "published",
    };

    const stylePage: SeoStylePage = {
      id: "style_001",
      tenantId: "tenant_001",
      slug: "blackwork",
      styleName: "Blackwork",
      title: "Blackwork Tattoos by Mara Vale",
      metaDescription: "Fine blackwork tattoo styles and healed results in moving booking schedule windows.",
      canonicalPath: "/styles/blackwork",
      status: "published",
    };

    const travelStop: TravelStop = {
      id: "stop_001",
      tenantId: "tenant_001",
      artistId: "artist_001",
      city: "Seattle",
      region: "WA",
      country: "US",
      timezone: "America/Los_Angeles",
      startsAt: "2026-06-04T00:00:00.000Z",
      endsAt: "2026-06-04T23:59:59.000Z",
      bookingStatus: "open",
    };

    const artist: ArtistProfile = {
      id: "artist_001",
      tenantId: "tenant_001",
      slug: "mara-vale",
      displayName: "Mara Vale",
      bio: "Experienced guest-spot artist with local-city heavy travel schedule.",
      specialties: ["blackwork", "ornamental"],
      bookingEnabled: true,
    };

    const portfolioItems: PortfolioItem[] = [
      {
        id: "portfolio_001",
        tenantId: "tenant_001",
        artistId: "artist_001",
        title: "Seattle shoulder piece",
        slug: "seattle-shoulder-piece",
        caption: "Blackwork shoulder piece in Seattle.",
        styles: ["blackwork"],
        placement: "shoulder",
        freshness: "fresh",
        city: "Seattle",
        imageUrl: "/media/portfolio/seattle-shoulder-piece.jpg",
        altText: "Blackwork shoulder piece",
        isFeatured: true,
      },
    ];

    const cityBrief = buildCitySeoBrief({
      cityPage,
      artist,
      travelStops: [travelStop],
      portfolioItems,
    });

    const styleBrief = buildStyleSeoBrief({
      stylePage: { ...stylePage, styleName: stylePage.styleName },
      artist,
      portfolioItems,
    });

    expect(cityBrief.primaryKeyword).toBe("Seattle tattoo artist");
    expect(cityBrief.internalLinks.length).toBeGreaterThan(0);
    expect(cityBrief.analyticsEvents.some((event) => event.name === "seo_city_waitlist_clicked")).toBe(true);

    expect(styleBrief.primaryKeyword).toBe("Blackwork tattoo artist");
    expect(styleBrief.internalLinks.length).toBeGreaterThan(0);
    expect(styleBrief.secondaryKeywords[0]).toBe("blackwork tattoo booking");
  });
});
