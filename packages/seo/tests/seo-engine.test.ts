import { describe, expect, it } from "vitest";
import type { ArtistProfile, PortfolioItem, SeoCityPage, SeoStylePage, TravelStop } from "@inkroute/types";
import {
  auditSeoRoute,
  auditSeoTechnicalReadiness,
  auditJsonLdRichResultCompatibility,
  buildCitySeoBrief,
  buildFaqSchema,
  buildInternalLinkPlan,
  buildMetadataDraft,
  buildArtistPersonSchema,
  buildPortfolioImageSchema,
  buildTravelEventSchema,
  buildSeoPublicationMutationPlan,
  buildSeoRedirectDecision,
  buildSitemapPlan,
  buildStyleSeoBrief,
  buildWebPageSchema,
  buildWebsiteSchema,
  composeJsonLdGraph,
  createCanonicalUrl,
  createSeoRouteRecord,
  resolveTenantCanonicalPolicy,
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

  it("validates rendered page-style JSON-LD snapshots for required rich-result fields", () => {
    const artist: ArtistProfile = {
      id: "artist_snapshot",
      tenantId: "tenant_001",
      slug: "mara-vale",
      displayName: "Mara Vale",
      bio: "Nomadic tattoo artist specializing in blackwork and ornamental guest spots.",
      specialties: ["blackwork", "ornamental"],
      bookingEnabled: true,
    };
    const portfolioItem: PortfolioItem = {
      id: "portfolio_snapshot",
      tenantId: "tenant_001",
      artistId: "artist_snapshot",
      title: "Seattle ornamental shoulder piece",
      slug: "seattle-ornamental-shoulder-piece",
      caption: "Ornamental shoulder tattoo photographed in Seattle.",
      styles: ["ornamental"],
      placement: "shoulder",
      freshness: "healed",
      city: "Seattle",
      imageUrl: "https://inkroute.example/media/seattle-ornamental-shoulder-piece.jpg",
      altText: "Healed ornamental shoulder tattoo",
      isFeatured: true,
    };
    const travelStop: TravelStop = {
      id: "travel_snapshot",
      tenantId: "tenant_001",
      artistId: "artist_snapshot",
      city: "Seattle",
      region: "WA",
      country: "US",
      timezone: "America/Los_Angeles",
      startsAt: "2026-06-04T00:00:00.000Z",
      endsAt: "2026-06-08T00:00:00.000Z",
      bookingStatus: "open",
      publicNotes: "Seattle guest spot booking is open for ornamental and blackwork projects.",
    };
    const renderedHomeSchema = [
      buildArtistPersonSchema(artist),
      buildPortfolioImageSchema(portfolioItem),
      buildTravelEventSchema(travelStop, artist),
      buildFaqSchema([{ question: "Can I book Seattle?", answer: "Yes, Seattle booking is open in this demo snapshot." }]),
    ];

    const audit = auditJsonLdRichResultCompatibility({
      graph: renderedHomeSchema,
      sourcePath: "apps/web/app/page.tsx",
    });

    expect(audit.status).toBe("pass");
    expect(audit.itemCount).toBe(4);
    expect(audit.types).toEqual(["Event", "FAQPage", "ImageObject", "Person"]);
    expect(audit.findings).toHaveLength(0);
  });

  it("flags unsupported or malformed JSON-LD before external crawler validation", () => {
    const unsupported = auditJsonLdRichResultCompatibility({
      graph: composeJsonLdGraph([
        {
          "@context": "https://schema.org",
          "@type": "TattooParlor",
          name: "Mara Vale Studio",
          description: "Schema.org local business output retained for crawler QA.",
          address: { "@type": "PostalAddress", addressLocality: "Seattle" },
        },
      ]),
      sourcePath: "apps/web/app/cities/[citySlug]/page.tsx",
    });
    const malformed = auditJsonLdRichResultCompatibility({
      graph: composeJsonLdGraph([
        {
          "@context": "https://schema.org",
          "@type": "Event",
          name: "Guest spot without dates",
        },
      ]),
      sourcePath: "apps/web/app/travel/page.tsx",
    });

    expect(unsupported.status).toBe("warn");
    expect(unsupported.findings.some((finding) => finding.code === "JSON_LD_TYPE_NOT_GOOGLE_RICH_RESULT")).toBe(true);
    expect(malformed.status).toBe("fail");
    expect(malformed.findings.filter((finding) => finding.code === "JSON_LD_REQUIRED_FIELD_MISSING").map((finding) => finding.field)).toEqual(
      expect.arrayContaining(["startDate", "endDate", "location", "performer", "description"]),
    );
  });

  it("audits technical SEO readiness for sitemap, canonical, and JSON-LD invariants", () => {
    const goodRoute = createSeoRouteRecord({
      path: "/cities/portland-or",
      kind: "city",
      title: "Portland Oregon Tattoo Booking with Mara Vale",
      description: "Book blackwork and ornamental tattoo sessions during Mara Vale's Portland guest spot with clear travel availability.",
      city: "Portland",
      region: "OR",
      status: "published",
      lastModified: "2026-06-01T00:00:00.000Z",
    });
    const goodGraph = composeJsonLdGraph([
      buildWebsiteSchema({ name: "InkRoute Studio", url: "https://inkroute.example" }),
      buildWebPageSchema({
        name: "Portland Tattoo Booking",
        description: "Landing page for Portland guest spot booking.",
        url: createCanonicalUrl("https://inkroute.example", goodRoute.path),
      }),
    ]);

    const passing = auditSeoTechnicalReadiness({
      baseUrl: "https://inkroute.example",
      routes: [goodRoute],
      jsonLdGraphs: [goodGraph],
    });

    expect(passing.status).toBe("pass");
    expect(passing.sitemapEntryCount).toBe(1);
    expect(passing.findings).toHaveLength(0);

    const duplicate = createSeoRouteRecord({
      path: "/cities/portland-or/",
      kind: "city",
      title: "Portland Oregon Tattoo Booking with Mara Vale",
      description: "Duplicate canonical route used to prove sitemap duplicate detection in the technical audit helper.",
      city: "Portland",
      region: "OR",
      status: "published",
    });
    const missingRegion = createSeoRouteRecord({
      path: "/cities/missing-region",
      kind: "city",
      title: "Missing Region Tattoo Booking Page",
      description: "This city page has enough description text but lacks required region context for local SEO checks.",
      city: "Portland",
      status: "published",
    });
    const failing = auditSeoTechnicalReadiness({
      baseUrl: "https://inkroute.example",
      routes: [goodRoute, duplicate, missingRegion],
      jsonLdGraphs: [composeJsonLdGraph([{ name: "Missing type" }])],
    });

    expect(failing.status).toBe("fail");
    expect(failing.duplicateSitemapUrls).toContain("https://inkroute.example/cities/portland-or");
    expect(failing.findings.some((finding) => finding.code === "DUPLICATE_SITEMAP_URL")).toBe(true);
    expect(failing.findings.some((finding) => finding.code === "CITY_CONTEXT_MISSING")).toBe(true);
    expect(failing.findings.some((finding) => finding.code === "JSON_LD_ITEM_TYPE_MISSING")).toBe(true);
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

  it("plans tenant-scoped SEO publish mutations with audit and revalidation writes", () => {
    const route = createSeoRouteRecord({
      path: "/cities/seattle-wa",
      kind: "city",
      title: "Seattle Tattoo Booking with Mara Vale",
      description: "Book blackwork and ornamental tattoo sessions during Mara Vale's Seattle guest spot with clear travel details.",
      city: "Seattle",
      region: "WA",
      status: "draft",
    });

    const plan = buildSeoPublicationMutationPlan({
      action: "publish",
      model: "SeoCityPage",
      tenantId: "tenant_001",
      actorId: "user_owner",
      actorRole: "owner",
      route,
      existingTenantId: "tenant_001",
      now: "2026-06-08T00:00:00.000Z",
      relatedFaqIds: ["faq_001"],
      relatedReviewIds: ["review_001"],
      relatedImageIds: ["image_001"],
    });

    expect(plan.status).toBe("ready");
    expect(plan.canCommit).toBe(true);
    expect(plan.targetStatus).toBe("published");
    expect(plan.requiresTenantScope).toBe(true);
    expect(plan.requiresRbac).toBe(true);
    expect(plan.requiresAuditLog).toBe(true);
    expect(plan.writes.map((write) => write.model)).toEqual(["SeoCityPage", "SeoAssociation", "AuditLog", "RevalidationJob"]);
    expect(plan.auditAction).toBe("seo.SeoCityPage.publish");
    expect(plan.revalidation.paths).toContain("/cities/seattle-wa");
    expect(plan.idempotencyKey).toContain("tenant_001");
  });

  it("blocks SEO mutations for cross-tenant records and unauthorized dashboard roles", () => {
    const route = createSeoRouteRecord({
      path: "/styles/blackwork",
      kind: "style",
      title: "Blackwork Tattoos by Mara Vale",
      description: "Blackwork tattoo booking page with style education, healed examples, and consultation calls to action.",
      style: "Blackwork",
      status: "draft",
    });

    const plan = buildSeoPublicationMutationPlan({
      action: "update",
      model: "SeoStylePage",
      tenantId: "tenant_001",
      actorId: "user_artist",
      actorRole: "artist",
      route,
      existingTenantId: "tenant_other",
      now: "2026-06-08T00:00:00.000Z",
    });

    expect(plan.status).toBe("blocked");
    expect(plan.canCommit).toBe(false);
    expect(plan.blockers.join(" ")).toContain("owner or studio_manager");
    expect(plan.blockers.join(" ")).toContain("different tenant");
    expect(plan.writes.some((write) => write.model === "AuditLog")).toBe(true);
  });

  it("resolves tenant canonical domains while excluding draft and noindex routes from sitemap entries", () => {
    const published = createSeoRouteRecord({
      path: "/cities/seattle-wa",
      kind: "city",
      title: "Seattle Tattoo Booking with Mara Vale",
      description: "Seattle tattoo booking page with strong local search context and travel appointment intent.",
      city: "Seattle",
      region: "WA",
      status: "published",
      tenantSlug: "inkroute-demo",
    });
    const draft = createSeoRouteRecord({
      path: "/cities/draft",
      kind: "city",
      title: "Draft Tattoo City Landing Page",
      description: "Draft city landing page for private dashboard preview before public indexing.",
      city: "Tacoma",
      region: "WA",
      status: "draft",
      tenantSlug: "inkroute-demo",
    });
    const noindex = createSeoRouteRecord({
      path: "/booking/confirmation",
      kind: "system",
      title: "Booking Confirmation",
      description: "Private confirmation page not intended for search indexing.",
      indexMode: "noindex",
      tenantSlug: "inkroute-demo",
    });

    const policy = resolveTenantCanonicalPolicy({
      requestHost: "www.inkroute.example",
      requestPath: "/cities/seattle-wa",
      tenantSlug: "inkroute-demo",
      tenantId: "tenant_001",
      protocol: "http",
      domains: [
        {
          tenantId: "tenant_001",
          tenantSlug: "inkroute-demo",
          primaryHost: "inkroute.example",
          allowedHosts: ["www.inkroute.example"],
          forceHttps: true,
        },
      ],
      routes: [published, draft, noindex],
    });

    expect(policy.hostAllowed).toBe(true);
    expect(policy.shouldRedirectHost).toBe(true);
    expect(policy.shouldForceHttps).toBe(true);
    expect(policy.canonicalUrl).toBe("https://inkroute.example/cities/seattle-wa");
    expect(policy.sitemapEntries.map((entry) => entry.url)).toEqual(["https://inkroute.example/cities/seattle-wa"]);
    expect(policy.noindexPaths).toEqual(["/booking/confirmation", "/cities/draft"]);
    expect(policy.blockers).toHaveLength(0);
  });

  it("reports unregistered hosts and duplicate canonical paths before publishing", () => {
    const first = createSeoRouteRecord({
      path: "/styles/blackwork",
      kind: "style",
      title: "Blackwork Tattoo Booking with Mara Vale",
      description: "Blackwork tattoo booking page with style education, healed examples, and consultation calls to action.",
      style: "Blackwork",
      status: "published",
      tenantSlug: "inkroute-demo",
    });
    const duplicate = createSeoRouteRecord({
      path: "/styles/blackwork/",
      kind: "style",
      title: "Duplicate Blackwork Tattoo Booking",
      description: "Duplicate blackwork canonical path used to prove duplicate canonical detection before publishing.",
      style: "Blackwork",
      status: "published",
      tenantSlug: "inkroute-demo",
    });

    const policy = resolveTenantCanonicalPolicy({
      requestHost: "evil.example",
      requestPath: "/styles/blackwork",
      tenantSlug: "inkroute-demo",
      tenantId: "tenant_001",
      domains: [
        {
          tenantId: "tenant_001",
          tenantSlug: "inkroute-demo",
          primaryHost: "inkroute.example",
          allowedHosts: ["www.inkroute.example"],
        },
      ],
      routes: [first, duplicate],
    });

    expect(policy.hostAllowed).toBe(false);
    expect(policy.duplicateCanonicalPaths).toEqual(["/styles/blackwork"]);
    expect(policy.blockers.join(" ")).toContain("not registered");
    expect(policy.blockers.join(" ")).toContain("Duplicate canonical paths");
  });

  it("builds tenant-scoped redirect and noindex decisions", () => {
    const route = createSeoRouteRecord({
      path: "/cities/seattle-wa",
      kind: "city",
      title: "Seattle Tattoo Booking with Mara Vale",
      description: "Seattle tattoo booking page with strong local search context and travel appointment intent.",
      city: "Seattle",
      region: "WA",
      status: "published",
    });
    const draft = createSeoRouteRecord({
      path: "/cities/private-preview",
      kind: "city",
      title: "Private Preview Tattoo City Page",
      description: "Private preview route should not be indexed before editorial approval and publish state changes.",
      city: "Seattle",
      region: "WA",
      status: "draft",
    });

    const redirect = buildSeoRedirectDecision({
      tenantId: "tenant_001",
      path: "/old-seattle",
      rules: [{ tenantId: "tenant_001", fromPath: "/old-seattle", toPath: "/cities/seattle-wa", statusCode: 308, isActive: true }],
    });
    const allowed = buildSeoRedirectDecision({ tenantId: "tenant_001", path: "/cities/seattle-wa", route, rules: [] });
    const privateRoute = buildSeoRedirectDecision({ tenantId: "tenant_001", path: "/cities/private-preview", route: draft, rules: [] });
    const missing = buildSeoRedirectDecision({ tenantId: "tenant_001", path: "/missing", rules: [] });

    expect(redirect).toMatchObject({ action: "redirect", destinationPath: "/cities/seattle-wa", statusCode: 308, shouldIndex: false });
    expect(allowed).toMatchObject({ action: "allow", shouldIndex: true });
    expect(privateRoute).toMatchObject({ action: "noindex", shouldIndex: false });
    expect(missing).toMatchObject({ action: "not_found", shouldIndex: false });
  });
});
