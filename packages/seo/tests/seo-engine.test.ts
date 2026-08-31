import { describe, expect, it } from "vitest";
import type { ArtistProfile, PortfolioItem, SeoCityPage, SeoStylePage, TravelStop } from "@inkroute/types";
import {
  auditSeoRoute,
  auditSeoTechnicalReadiness,
  auditJsonLdRichResultCompatibility,
  buildCitySeoBrief,
  buildCanonicalDomainRuntimeReadinessPlan,
  buildFaqSchema,
  buildInternalLinkPlan,
  buildMetadataDraft,
  buildPublicWebReadinessPlan,
  buildPublicWebLaunchEvidencePlan,
  buildArtistPersonSchema,
  buildPortfolioImageSchema,
  buildTravelEventSchema,
  buildSearchConsoleOperationPlan,
  buildSearchConsoleRuntimeReadinessPlan,
  buildSeoAutomatedTestReadinessPlan,
  buildSeoA11yPerformanceAuditEvidencePlan,
  buildSeoPublicationRuntimeReadinessPlan,
  buildSeoImagePipelinePlan,
  buildSeoImagePipelineRuntimeReadinessPlan,
  buildSeoPublicationMutationPlan,
  buildSeoRedirectDecision,
  buildSitemapPlan,
  buildStyleSeoBrief,
  buildStructuredDataCrawlQaReadinessPlan,
  buildWebPageSchema,
  buildWebsiteSchema,
  composeJsonLdGraph,
  canonicalDomainRuntimeRequiredCommands,
  canonicalDomainRuntimeRequiredControls,
  canonicalDomainRuntimeRequiredEvidence,
  createCanonicalUrl,
  createSeoRouteRecord,
  extractRenderedJsonLdScriptsFromHtml,
  publicWebLaunchEvidenceRequiredCommands,
  publicWebLaunchEvidenceRequiredEvidence,
  publicWebReadinessRequiredCommands,
  publicWebReadinessRequiredControls,
  resolveTenantCanonicalPolicy,
  searchConsoleRuntimeRequiredCommands,
  searchConsoleRuntimeRequiredControls,
  searchConsoleRuntimeRequiredEvidence,
  seoA11yPerformanceAuditRequiredCommands,
  seoA11yPerformanceAuditRequiredControls,
  seoA11yPerformanceAuditRequiredEvidence,
  seoAutomatedTestReadinessRequiredCommands,
  seoAutomatedTestReadinessRequiredEvidence,
  seoImagePipelineRequiredCommands,
  seoImagePipelineRequiredControls,
  seoImagePipelineRequiredEvidence,
  seoPublicationRuntimeRequiredCommands,
  seoPublicationRuntimeRequiredControls,
  seoPublicationRuntimeRequiredEvidence,
  structuredDataCrawlQaRequiredCommands,
  structuredDataCrawlQaRequiredControls,
  structuredDataCrawlQaRequiredEvidence,
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
  it("extracts rendered JSON-LD scripts from HTML as shared package evidence", () => {
    const extraction = extractRenderedJsonLdScriptsFromHtml(
      '<html><head><script type="application/ld+json">[{&quot;@type&quot;:&quot;FAQPage&quot;},{"@type":"ImageObject"}]</script></head></html>',
    );

    expect(extraction.status).toBe("ready");
    expect(extraction.scriptCount).toBe(1);
    expect(extraction.graphs.map((graph) => graph["@type"])).toEqual(["FAQPage", "ImageObject"]);

    const invalid = extractRenderedJsonLdScriptsFromHtml('<script type="application/ld+json">not-json</script>');
    expect(invalid.status).toBe("blocked");
    expect(invalid.blockers).toContain("One or more rendered JSON-LD scripts could not be parsed into object graph entries.");
  });
  it("summarizes structured-data crawl QA readiness across rendered JSON-LD extraction, rich-result checks, sitemap/canonical crawl, artifacts, and closeout evidence", () => {
    const plan = buildStructuredDataCrawlQaReadinessPlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      seoPackageTestsPassed: true,
      seoPackageTypecheckPassed: true,
      webBuildPassed: true,
      renderedPageCrawlerConfigured: true,
      renderedJsonLdExtractionImplemented: true,
      publicPageInventoryConfigured: true,
      googleRichResultsCompatibleChecksPassed: true,
      structuredDataCriticalErrorsAbsent: true,
      unsupportedSchemaWarningsReviewed: true,
      demoContentReplacedOrDocumented: true,
      sitemapCanonicalCrawlPassed: true,
      canonicalUrlConsistencyVerified: true,
      robotsNoindexCrawlVerified: true,
      crawlArtifactsCaptured: true,
      closeoutEvidenceAttached: true,
    });
    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredCommands).toBe(structuredDataCrawlQaRequiredCommands);
    expect(plan.requiredControls).toBe(structuredDataCrawlQaRequiredControls);
  });
  it("blocks structured-data crawl QA readiness until rendered-page crawl, rich-result validation, unsupported-schema review, sitemap/canonical crawl, artifacts, and closeout evidence exist", () => {
    const plan = buildStructuredDataCrawlQaReadinessPlan({
      packageScripts: { test: "vitest run" },
      seoPackageTestsPassed: true,
      seoPackageTypecheckPassed: false,
      webBuildPassed: false,
      renderedPageCrawlerConfigured: false,
      renderedJsonLdExtractionImplemented: false,
      publicPageInventoryConfigured: false,
      googleRichResultsCompatibleChecksPassed: false,
      structuredDataCriticalErrorsAbsent: false,
      unsupportedSchemaWarningsReviewed: false,
      demoContentReplacedOrDocumented: false,
      sitemapCanonicalCrawlPassed: false,
      canonicalUrlConsistencyVerified: false,
      robotsNoindexCrawlVerified: false,
      crawlArtifactsCaptured: false,
      closeoutEvidenceAttached: false,
    });
    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(structuredDataCrawlQaRequiredCommands);
    expect(plan.requiredControls).toBe(structuredDataCrawlQaRequiredControls);
    expect(plan.requiredEvidence).toBe(structuredDataCrawlQaRequiredEvidence);
    expect(plan.blockers).toContain("Rendered-page crawler tooling must be configured.");
    expect(plan.blockers).toContain("Google Rich Results-compatible structured-data checks must pass.");
    expect(plan.blockers).toContain("Demo schema content must be replaced with production content or documented as intentional.");
    expect(plan.blockers).toContain("Structured-data crawl and rich-results evidence must be attached to closeout.");
  });
  it("plans public web launch readiness across static, local-runtime, provider, and asset blockers", () => {
    const plan = buildPublicWebReadinessPlan({
      packageScripts: {
        typecheck: "tsc --noEmit",
        build: "next build",
        test: "playwright test --project=web-chromium --project=web-mobile",
      },
      buildVerified: false,
      typecheckVerified: false,
      accessibilityAuditVerified: false,
      performanceAuditVerified: false,
      runtimePersistenceConfigured: false,
      realPortfolioAssetsConfigured: false,
      surfaces: [
        {
          id: "home",
          path: "/",
          kind: "page",
          backingMode: "static_demo",
          hasRouteTest: true,
          requiresDatabase: false,
          requiresProvider: false,
          placeholderAssetsPresent: true,
        },
        {
          id: "booking-request-api",
          path: "/api/public/[tenantSlug]/booking-requests",
          kind: "api",
          backingMode: "local_runtime",
          hasRouteTest: true,
          requiresDatabase: true,
          requiresProvider: false,
        },
        {
          id: "stripe-webhook",
          path: "/api/webhooks/stripe",
          kind: "webhook",
          backingMode: "local_runtime",
          hasRouteTest: true,
          requiresDatabase: true,
          requiresProvider: true,
        },
        {
          id: "robots",
          path: "/robots.txt",
          kind: "metadata",
          backingMode: "static_demo",
          hasRouteTest: false,
          requiresDatabase: false,
          requiresProvider: false,
        },
      ],
    });
    expect(plan.status).toBe("blocked");
    expect(plan.surfaceCount).toBe(4);
    expect(plan.staticDemoSurfaceCount).toBe(2);
    expect(plan.localRuntimeSurfaceCount).toBe(2);
    expect(plan.untestedSurfaces).toEqual(["robots"]);
    expect(plan.placeholderAssetSurfaces).toEqual(["home"]);
    expect(plan.requiredCommands).toBe(publicWebReadinessRequiredCommands);
    expect(plan.requiredControls).toBe(publicWebReadinessRequiredControls);
    expect(plan.blockers).toEqual(expect.arrayContaining([
      "Next.js web build has not been verified in the installed workspace.",
      "Public routes that require persistence are still static-demo or local-runtime backed.",
      "Provider-backed public routes still use local runtime or static provider boundaries.",
      "Public portfolio/media surfaces still depend on placeholder or demo assets.",
    ]));
  });
  it("blocks public web launch evidence until build, smoke, accessibility, performance, persistence, media, SEO runtime, CI, and artifacts are proven", () => {
    const plan = buildPublicWebLaunchEvidencePlan({
      packageScripts: {
        typecheck: "tsc --noEmit",
        build: "next build",
      },
      webTypecheckPassed: true,
      webBuildPassed: false,
      webRouteSmokePassed: false,
      webPlaywrightDesktopPassed: false,
      webPlaywrightMobilePassed: false,
      accessibilityAuditPassed: false,
      lighthousePerformancePassed: false,
      apiRoutesUseTenantScopedPersistence: false,
      providerBackedRoutesVerified: false,
      localRuntimeFallbackDisabledForProduction: true,
      realPortfolioDerivativesConfigured: false,
      placeholderAssetsRemovedOrDocumented: false,
      sitemapRuntimeVerified: true,
      robotsRuntimeVerified: false,
      jsonLdRuntimeVerified: false,
      canonicalRuntimeVerified: false,
      privacyAndLegalRoutesReviewed: false,
      ciEvidenceCaptured: false,
      launchArtifactsSecretSafe: false,
    });
    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["test"]);
    expect(plan.requiredCommands).toBe(publicWebLaunchEvidenceRequiredCommands);
    expect(plan.requiredEvidence).toBe(publicWebLaunchEvidenceRequiredEvidence);
    expect(plan.blockers).toContain("@inkroute/web build must pass.");
    expect(plan.blockers).toContain("Public API routes must use tenant-scoped persistence instead of local runtime state in production.");
    expect(plan.blockers).not.toContain("Local runtime fallback must be disabled or fail-closed for production.");
    expect(plan.blockers).toContain("Public web launch artifacts must be redacted and free of secrets or client-private data.");
  });
  it("marks public web launch evidence ready when build, smoke, accessibility, performance, persistence, media, SEO runtime, CI, and artifacts align", () => {
    const plan = buildPublicWebLaunchEvidencePlan({
      packageScripts: {
        typecheck: "tsc --noEmit",
        build: "next build",
        test: "vitest run",
      },
      webTypecheckPassed: true,
      webBuildPassed: true,
      webRouteSmokePassed: true,
      webPlaywrightDesktopPassed: true,
      webPlaywrightMobilePassed: true,
      accessibilityAuditPassed: true,
      lighthousePerformancePassed: true,
      apiRoutesUseTenantScopedPersistence: true,
      providerBackedRoutesVerified: true,
      localRuntimeFallbackDisabledForProduction: true,
      realPortfolioDerivativesConfigured: true,
      placeholderAssetsRemovedOrDocumented: true,
      sitemapRuntimeVerified: true,
      robotsRuntimeVerified: true,
      jsonLdRuntimeVerified: true,
      canonicalRuntimeVerified: true,
      privacyAndLegalRoutesReviewed: true,
      ciEvidenceCaptured: true,
      launchArtifactsSecretSafe: true,
    });
    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
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
    expect(plan.idempotencyKey).toMatch(/^seo:[a-f0-9]{64}$/);
    expect(plan.idempotencyKey).not.toContain("tenant_001");
    expect(plan.idempotencyKey).not.toContain("/cities/seattle-wa");
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
  it("summarizes SEO publication runtime readiness across dashboard CRUD, Prisma repositories, tenant transactions, audit logs, revalidation, and integration tests", () => {
    const plan = buildSeoPublicationRuntimeReadinessPlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      seoPackageTestsPassed: true,
      seoPackageTypecheckPassed: true,
      dashboardBuildPassed: true,
      prismaModelsMigrated: true,
      dashboardCrudRoutesImplemented: true,
      authenticatedDashboardApiImplemented: true,
      rbacEnforced: true,
      tenantIsolationEnforced: true,
      prismaTransactionsConfigured: true,
      seoCityPageRepositoryImplemented: true,
      seoStylePageRepositoryImplemented: true,
      seoRedirectRepositoryImplemented: true,
      faqReviewImageAssociationPersistenceAvailable: true,
      publishStatePersistenceAvailable: true,
      auditLogPersistenceAvailable: true,
      revalidationJobPersistenceAvailable: true,
      idempotencyStoreAvailable: true,
      previewToPublishFlowImplemented: true,
      archiveRedirectFlowImplemented: true,
      prismaIntegrationTestsPassed: true,
      tenantIsolationTestsPassed: true,
      dashboardPublishFlowTestsPassed: true,
    });
    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredControls).toBe(seoPublicationRuntimeRequiredControls);
    expect(plan.requiredCommands).toBe(seoPublicationRuntimeRequiredCommands);
  });
  it("blocks SEO publication runtime readiness until dashboard APIs, Prisma repositories, transactions, audit logs, revalidation jobs, and tests exist", () => {
    const plan = buildSeoPublicationRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      seoPackageTestsPassed: true,
      seoPackageTypecheckPassed: false,
      dashboardBuildPassed: false,
      prismaModelsMigrated: false,
      dashboardCrudRoutesImplemented: false,
      authenticatedDashboardApiImplemented: false,
      rbacEnforced: false,
      tenantIsolationEnforced: false,
      prismaTransactionsConfigured: false,
      seoCityPageRepositoryImplemented: false,
      seoStylePageRepositoryImplemented: false,
      seoRedirectRepositoryImplemented: false,
      faqReviewImageAssociationPersistenceAvailable: false,
      publishStatePersistenceAvailable: false,
      auditLogPersistenceAvailable: false,
      revalidationJobPersistenceAvailable: false,
      idempotencyStoreAvailable: false,
      previewToPublishFlowImplemented: false,
      archiveRedirectFlowImplemented: false,
      prismaIntegrationTestsPassed: false,
      tenantIsolationTestsPassed: false,
      dashboardPublishFlowTestsPassed: false,
    });
    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toBe(seoPublicationRuntimeRequiredEvidence);
    expect(plan.blockers).toContain("Dashboard SEO CRUD mutation route evidence must be captured before SEO publication readiness.");
    expect(plan.blockers).toContain("Dashboard SEO preview-to-publish flow evidence must be captured before SEO publication readiness.");
    expect(plan.blockers).toContain("Dashboard SEO archive and redirect flow evidence must be captured before SEO publication readiness.");
    expect(plan.blockers).not.toContain("Dashboard SEO CRUD mutation routes must be implemented.");
    expect(plan.blockers).not.toContain("Dashboard SEO preview-to-publish flow must be implemented.");
    expect(plan.blockers).not.toContain("Dashboard SEO archive and redirect flow must be implemented.");
    expect(plan.blockers).toContain("SEO publication mutations must run inside Prisma transactions.");
    expect(plan.blockers).toContain("SEO revalidation jobs must persist after publication commits.");
    expect(plan.blockers).toContain("Dashboard SEO publish/edit/archive flow tests must pass.");
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
  it("summarizes canonical/domain runtime readiness across middleware, repositories, redirects, sitemap exclusion, noindex, custom domains, and deployment proof", () => {
    const plan = buildCanonicalDomainRuntimeReadinessPlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      seoPackageTestsPassed: true,
      seoPackageTypecheckPassed: true,
      webBuildPassed: true,
      middlewareImplemented: true,
      tenantDomainRepositoryImplemented: true,
      seoRedirectRepositoryImplemented: true,
      canonicalPolicyWiredToPublicRoutes: true,
      allowedHostValidationEnforced: true,
      httpsRedirectEnforced: true,
      canonicalHostRedirectEnforced: true,
      persistedRedirectsExecuted: true,
      redirectStatusCodesPreserved: true,
      draftArchiveNoindexSitemapExclusionRuntimeVerified: true,
      noindexHeadersOrMetaRuntimeVerified: true,
      canonicalTagsUseTenantPrimaryHost: true,
      customDomainRouteTestsPassed: true,
      duplicateCanonicalRuntimeTestsPassed: true,
      deploymentDomainProofAvailable: true,
    });
    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredControls).toBe(canonicalDomainRuntimeRequiredControls);
    expect(plan.requiredCommands).toBe(canonicalDomainRuntimeRequiredCommands);
  });
  it("blocks canonical/domain runtime readiness until middleware, repositories, redirects, sitemap/noindex assertions, custom-domain tests, and deployment proof exist", () => {
    const plan = buildCanonicalDomainRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      seoPackageTestsPassed: true,
      seoPackageTypecheckPassed: false,
      webBuildPassed: false,
      middlewareImplemented: false,
      tenantDomainRepositoryImplemented: false,
      seoRedirectRepositoryImplemented: false,
      canonicalPolicyWiredToPublicRoutes: false,
      allowedHostValidationEnforced: false,
      httpsRedirectEnforced: false,
      canonicalHostRedirectEnforced: false,
      persistedRedirectsExecuted: false,
      redirectStatusCodesPreserved: false,
      draftArchiveNoindexSitemapExclusionRuntimeVerified: false,
      noindexHeadersOrMetaRuntimeVerified: false,
      canonicalTagsUseTenantPrimaryHost: false,
      customDomainRouteTestsPassed: false,
      duplicateCanonicalRuntimeTestsPassed: false,
      deploymentDomainProofAvailable: false,
    });
    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toBe(canonicalDomainRuntimeRequiredEvidence);
    expect(plan.blockers).toContain("Public canonical/domain middleware or route handler evidence must be captured before canonical-domain readiness.");
    expect(plan.blockers).not.toContain("Public canonical/domain middleware or route handler must be implemented.");
    expect(plan.blockers).toContain("TenantDomain repository runtime evidence must be captured before canonical-domain readiness.");
    expect(plan.blockers).toContain("SeoRedirect repository runtime evidence must be captured before canonical-domain readiness.");
    expect(plan.blockers).not.toContain("Tenant domain repository must be implemented.");
    expect(plan.blockers).not.toContain("SeoRedirect repository must be implemented.");
    expect(plan.blockers).toContain("Persisted SeoRedirect records must execute at runtime.");
    expect(plan.blockers).toContain("Runtime sitemap must exclude draft, archived, private, and noindex content.");
    expect(plan.blockers).toContain("Deployment-domain proof must show configured tenant primary and allowed hosts.");
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
  it("blocks Search Console provider operations without credentials or tenant ownership", () => {
    const missingCredentials = buildSearchConsoleOperationPlan({
      operation: "submit_sitemap",
      tenantId: "tenant_001",
      tenantSlug: "inkroute-demo",
      siteUrl: "https://inkroute.example",
      sitemapUrl: "https://inkroute.example/sitemap.xml",
      credentialsConfigured: false,
      propertyOwnerTenantId: "tenant_001",
    });
    const tenantMismatch = buildSearchConsoleOperationPlan({
      operation: "verify_property",
      tenantId: "tenant_001",
      tenantSlug: "inkroute-demo",
      siteUrl: "inkroute.example",
      credentialsConfigured: true,
      propertyOwnerTenantId: "tenant_other",
    });
    expect(missingCredentials.status).toBe("blocked");
    expect(missingCredentials.canExecuteProviderCall).toBe(false);
    expect(missingCredentials.blockers.join(" ")).toContain("credentials");
    expect(missingCredentials.requiredEnv).toContain("GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY");
    expect(tenantMismatch.dashboardStatus).toBe("tenant_mismatch");
    expect(tenantMismatch.blockers.join(" ")).toContain("different tenant");
    expect(tenantMismatch.propertyType).toBe("domain");
    expect(tenantMismatch.verificationMethod).toBe("dns_txt");
  });
  it("plans Search Console sitemap submission and query/page imports as credential-gated tenant writes", () => {
    const sitemap = buildSearchConsoleOperationPlan({
      operation: "submit_sitemap",
      tenantId: "tenant_001",
      tenantSlug: "inkroute-demo",
      siteUrl: "https://inkroute.example",
      sitemapUrl: "https://inkroute.example/sitemap.xml",
      credentialsConfigured: true,
      propertyOwnerTenantId: "tenant_001",
    });
    const importPlan = buildSearchConsoleOperationPlan({
      operation: "import_query_pages",
      tenantId: "tenant_001",
      tenantSlug: "inkroute-demo",
      siteUrl: "https://inkroute.example",
      credentialsConfigured: true,
      propertyOwnerTenantId: "tenant_001",
      dateRangeDays: 28,
    });
    expect(sitemap.status).toBe("ready");
    expect(sitemap.canExecuteProviderCall).toBe(true);
    expect(sitemap.steps[0]).toMatchObject({
      id: "submit-sitemap",
      providerEndpoint: "searchconsole.sitemaps.submit",
      writesTenantData: true,
    });
    expect(importPlan.status).toBe("ready");
    expect(importPlan.shouldStoreImportedRows).toBe(true);
    expect(importPlan.steps[0]?.providerEndpoint).toBe("searchconsole.searchanalytics.query");
    expect(importPlan.dashboardStatus).toBe("ready_for_provider");
  });
  it("summarizes Search Console runtime readiness across provider execution, verified properties, sitemap submission, imports, indexing monitoring, dashboard status, audit, and idempotency", () => {
    const plan = buildSearchConsoleRuntimeReadinessPlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      seoPackageTestsPassed: true,
      seoPackageTypecheckPassed: true,
      providerRoutesImplemented: true,
      backgroundJobsImplemented: true,
      credentialsConfigured: true,
      OAuthOrServiceAccountFlowImplemented: true,
      tenantOwnershipPersistenceAvailable: true,
      tenantOwnershipChecksEnforced: true,
      verifiedPropertyProofAvailable: true,
      sitemapSubmissionImplemented: true,
      sitemapSubmittedForVerifiedProperty: true,
      queryPageImportImplemented: true,
      importedRowsPersisted: true,
      indexingMonitoringImplemented: true,
      dashboardStatusImplemented: true,
      approvedFixtureTestsPassed: true,
      providerSandboxOrTestPropertyPassed: true,
      auditLogPersistenceAvailable: true,
      idempotencyStoreAvailable: true,
    });
    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredControls).toBe(searchConsoleRuntimeRequiredControls);
    expect(plan.requiredCommands).toBe(searchConsoleRuntimeRequiredCommands);
  });
  it("blocks Search Console runtime readiness until credentialed provider routes, tenant ownership proof, sitemap submission, imports, dashboard status, audit, and idempotency exist", () => {
    const plan = buildSearchConsoleRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      seoPackageTestsPassed: true,
      seoPackageTypecheckPassed: false,
      providerRoutesImplemented: false,
      backgroundJobsImplemented: false,
      credentialsConfigured: false,
      OAuthOrServiceAccountFlowImplemented: false,
      tenantOwnershipPersistenceAvailable: false,
      tenantOwnershipChecksEnforced: false,
      verifiedPropertyProofAvailable: false,
      sitemapSubmissionImplemented: false,
      sitemapSubmittedForVerifiedProperty: false,
      queryPageImportImplemented: false,
      importedRowsPersisted: false,
      indexingMonitoringImplemented: false,
      dashboardStatusImplemented: false,
      approvedFixtureTestsPassed: false,
      providerSandboxOrTestPropertyPassed: false,
      auditLogPersistenceAvailable: false,
      idempotencyStoreAvailable: false,
    });
    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toBe(searchConsoleRuntimeRequiredEvidence);
    expect(plan.blockers).toContain("Search Console provider route evidence must be captured before Search Console readiness.");
    expect(plan.blockers).toContain("Search Console background job evidence must be captured before Search Console readiness.");
    expect(plan.blockers).toContain("Google Search Console credentials must be configured in a secret store.");
    expect(plan.blockers).toContain("Sitemap must be submitted for a verified test property.");
    expect(plan.blockers).toContain("Dashboard Search Console import/monitoring status evidence must be captured before Search Console readiness.");
    expect(plan.blockers).not.toContain("Search Console provider routes must be implemented.");
    expect(plan.blockers).not.toContain("Search Console background jobs must be implemented.");
    expect(plan.blockers).not.toContain("Dashboard Search Console import/monitoring status must be implemented.");
    expect(plan.blockers).toContain("Search Console operation idempotency store must be available.");
  });
  it("plans public image SEO derivatives while keeping source uploads private", () => {
    const item: PortfolioItem = {
      id: "portfolio_image_001",
      tenantId: "tenant_001",
      artistId: "artist_001",
      title: "Seattle blackwork sleeve",
      slug: "seattle-blackwork-sleeve",
      caption: "Healed blackwork sleeve photographed after a Seattle guest spot.",
      styles: ["blackwork"],
      placement: "arm",
      freshness: "healed",
      city: "Seattle",
      imageUrl: "storage://tenant_001/private/originals/seattle-blackwork-sleeve.jpg",
      altText: "Healed blackwork sleeve tattoo",
      isFeatured: true,
    };
    const plan = buildSeoImagePipelinePlan({
      item,
      tenantSlug: "inkroute-demo",
      sourceObjectKey: "tenant_001/private/originals/seattle-blackwork-sleeve.jpg",
      sourceAcl: "private",
      cdnBaseUrl: "https://cdn.inkroute.example",
      widths: [320, 768],
      formats: ["webp", "avif"],
      now: "2026-06-08T00:00:00.000Z",
    });
    expect(plan.blockers).toHaveLength(0);
    expect(plan.sourceRemainsPrivate).toBe(true);
    expect(plan.requiresExifStrip).toBe(true);
    expect(plan.requiresDimensionProbe).toBe(true);
    expect(plan.requiresBlurPlaceholder).toBe(true);
    expect(plan.derivatives).toHaveLength(4);
    expect(plan.derivatives.every((derivative) => derivative.acl === "public")).toBe(true);
    expect(plan.derivatives.every((derivative) => derivative.blurDataUrl.startsWith("data:image/svg+xml;utf8,"))).toBe(true);
    expect(plan.derivatives[0]).toMatchObject({
      label: "thumbnail",
      width: 320,
      format: "webp",
      blurDataUrl: expect.stringContaining("svg"),
      cacheControl: "public, max-age=31536000, immutable",
    });
    expect(plan.derivatives[0]?.publicUrl).toContain("https://cdn.inkroute.example/inkroute-demo/portfolio/portfolio_image_001");
  });
  it("blocks image SEO publication when originals are public or review text is missing", () => {
    const item: PortfolioItem = {
      id: "portfolio_image_002",
      tenantId: "tenant_001",
      artistId: "artist_001",
      title: "Untitled flash",
      slug: "untitled-flash",
      caption: "",
      styles: ["flash"],
      placement: "leg",
      freshness: "fresh",
      imageUrl: "https://public.example/original.jpg",
      altText: "",
      isFeatured: false,
    };
    const plan = buildSeoImagePipelinePlan({
      item,
      tenantSlug: "inkroute-demo",
      sourceObjectKey: "tenant_001/public/originals/untitled-flash.jpg",
      sourceAcl: "public",
    });
    expect(plan.sourceRemainsPrivate).toBe(false);
    expect(plan.blockers.join(" ")).toContain("Original portfolio uploads must remain private");
    expect(plan.blockers.join(" ")).toContain("Reviewed alt text");
    expect(plan.blockers.join(" ")).toContain("Reviewed caption");
  });
  it("summarizes image SEO pipeline runtime readiness across processing workers, storage metadata, ACLs, CDN headers, and Lighthouse audits", () => {
    const plan = buildSeoImagePipelineRuntimeReadinessPlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      seoPackageTestsPassed: true,
      seoPackageTypecheckPassed: true,
      imageProcessingWorkerImplemented: true,
      storageProviderConfigured: true,
      sourceDimensionProbeImplemented: true,
      exifStrippingImplemented: true,
      responsiveDerivativeGenerationImplemented: true,
      blurPlaceholderGenerationImplemented: true,
      fileAssetPersistenceAvailable: true,
      portfolioImagePersistenceAvailable: true,
      derivativeMetadataPersistenceAvailable: true,
      privateOriginalAclEnforced: true,
      publicDerivativeAclEnforced: true,
      cdnCacheHeadersConfigured: true,
      immutableDerivativeUrlsConfigured: true,
      uploadImageProcessingTestsPassed: true,
      privateOriginalAccessTestsPassed: true,
      publicDerivativeLoadTestsPassed: true,
      cdnHeaderTestsPassed: true,
      lighthouseImageAuditPassed: true,
    });
    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredCommands).toBe(seoImagePipelineRequiredCommands);
    expect(plan.requiredControls).toBe(seoImagePipelineRequiredControls);
  });
  it("blocks image SEO pipeline runtime readiness until processing, persistence, ACL, CDN, and Lighthouse evidence exist", () => {
    const plan = buildSeoImagePipelineRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      seoPackageTestsPassed: true,
      seoPackageTypecheckPassed: false,
      imageProcessingWorkerImplemented: false,
      storageProviderConfigured: false,
      sourceDimensionProbeImplemented: false,
      exifStrippingImplemented: false,
      responsiveDerivativeGenerationImplemented: false,
      blurPlaceholderGenerationImplemented: false,
      fileAssetPersistenceAvailable: false,
      portfolioImagePersistenceAvailable: false,
      derivativeMetadataPersistenceAvailable: false,
      privateOriginalAclEnforced: false,
      publicDerivativeAclEnforced: false,
      cdnCacheHeadersConfigured: false,
      immutableDerivativeUrlsConfigured: false,
      uploadImageProcessingTestsPassed: false,
      privateOriginalAccessTestsPassed: false,
      publicDerivativeLoadTestsPassed: false,
      cdnHeaderTestsPassed: false,
      lighthouseImageAuditPassed: false,
    });
    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(seoImagePipelineRequiredCommands);
    expect(plan.requiredControls).toBe(seoImagePipelineRequiredControls);
    expect(plan.requiredEvidence).toBe(seoImagePipelineRequiredEvidence);
    expect(plan.blockers).toContain("Image processing worker evidence must be captured before image pipeline readiness.");
    expect(plan.blockers).toContain("Source image dimension probing evidence must be captured before image pipeline readiness.");
    expect(plan.blockers).toContain("EXIF stripping evidence must be captured before public derivative creation readiness.");
    expect(plan.blockers).toContain("Responsive WebP/AVIF/JPEG derivative generation evidence must be captured before image pipeline readiness.");
    expect(plan.blockers).not.toContain("Image processing worker must be implemented.");
    expect(plan.blockers).not.toContain("Source image dimension probing must be implemented.");
    expect(plan.blockers).not.toContain("EXIF stripping must be implemented before public derivative creation.");
    expect(plan.blockers).not.toContain("Responsive WebP/AVIF/JPEG derivative generation must be implemented.");
    expect(plan.blockers).toContain("Blur placeholder generation proof must be captured for storage-backed derivatives.");
    expect(plan.blockers).not.toContain("Blur placeholder generation must be implemented.");
    expect(plan.blockers).toContain("Private original ACL enforcement must be verified.");
    expect(plan.blockers).toContain("CDN cache header tests must pass.");
    expect(plan.blockers).toContain("Lighthouse image optimization audit must pass.");
  });
  it("summarizes SEO automated test readiness across helpers, snapshots, preview routes, linked runtime evidence, and CI gates", () => {
    const plan = buildSeoAutomatedTestReadinessPlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      seoPackageTestsPassed: true,
      seoPackageTypecheckPassed: true,
      routeRecordTestsPassed: true,
      sitemapGenerationTestsPassed: true,
      metadataDraftTestsPassed: true,
      auditTestsPassed: true,
      contentBriefTestsPassed: true,
      internalLinkTestsPassed: true,
      jsonLdGraphTestsPassed: true,
      imagePipelineTestsPassed: true,
      canonicalRedirectTestsPassed: true,
      searchConsolePlanTestsPassed: true,
      webSitemapRouteTestsPassed: true,
      seoPreviewRouteTestsPassed: true,
      sitemapPreviewRouteTestsPassed: true,
      structuredDataSnapshotTestsPassed: true,
      runtimeBuildEvidenceCoveredByGap076: true,
      crawlEvidenceCoveredByGap073: true,
      ciRunsSeoTestGate: true,
    });
    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredSuites).toEqual(expect.arrayContaining(["JSON-LD graph and structured-data snapshot tests"]));
    expect(plan.requiredCommands).toBe(seoAutomatedTestReadinessRequiredCommands);
  });
  it("blocks SEO automated test readiness until helper, preview route, linked runtime, crawl, and CI evidence exist", () => {
    const plan = buildSeoAutomatedTestReadinessPlan({
      packageScripts: { test: "vitest run" },
      seoPackageTestsPassed: true,
      seoPackageTypecheckPassed: false,
      routeRecordTestsPassed: false,
      sitemapGenerationTestsPassed: false,
      metadataDraftTestsPassed: false,
      auditTestsPassed: false,
      contentBriefTestsPassed: false,
      internalLinkTestsPassed: false,
      jsonLdGraphTestsPassed: false,
      imagePipelineTestsPassed: false,
      canonicalRedirectTestsPassed: false,
      searchConsolePlanTestsPassed: false,
      webSitemapRouteTestsPassed: true,
      seoPreviewRouteTestsPassed: false,
      sitemapPreviewRouteTestsPassed: false,
      structuredDataSnapshotTestsPassed: false,
      runtimeBuildEvidenceCoveredByGap076: false,
      crawlEvidenceCoveredByGap073: false,
      ciRunsSeoTestGate: false,
    });
    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toBe(seoAutomatedTestReadinessRequiredEvidence);
    expect(plan.requiredCommands).toBe(seoAutomatedTestReadinessRequiredCommands);
    expect(plan.blockers).toContain("City/style content brief tests must pass.");
    expect(plan.blockers).toContain("SEO preview route tests must pass.");
    expect(plan.blockers).toContain("Runtime/build evidence must be covered by GAP-076.");
    expect(plan.blockers).toContain("CI must run the SEO package and preview route test gate.");
  });
  it("blocks SEO accessibility and performance audit evidence until browser, schema, axe, Lighthouse, mobile, CI, and safe artifacts exist", () => {
    const plan = buildSeoA11yPerformanceAuditEvidencePlan({
      packageScripts: { test: "vitest run" },
      seoTestsPassed: true,
      seoTypecheckPassed: false,
      webTypecheckPassed: false,
      webBuildPassed: false,
      browserCrawlPassed: false,
      schemaValidatorPassed: false,
      sitemapCanonicalChecksPassed: false,
      axeAuditPassed: false,
      lighthouseAuditPassed: false,
      coreWebVitalsCaptured: false,
      mobileVisualQaPassed: false,
      headingFocusContrastIssuesFixed: false,
      structuredDataSnapshotsCaptured: false,
      ciArtifactsCaptured: false,
      secretSafeArtifactsCaptured: false,
    });
    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(seoA11yPerformanceAuditRequiredCommands);
    expect(plan.requiredControls).toBe(seoA11yPerformanceAuditRequiredControls);
    expect(plan.requiredCommands).toEqual(seoA11yPerformanceAuditRequiredCommands);
    expect(plan.requiredEvidence).toBe(seoA11yPerformanceAuditRequiredEvidence);
    expect(plan.blockers).toContain("Browser crawl must cover public home, portfolio, booking, travel, FAQ, city, style, privacy, and legal routes.");
    expect(plan.blockers).toContain("axe accessibility audit must pass for launch-critical public routes.");
    expect(plan.blockers).toContain("SEO/accessibility/performance artifacts must be redacted and free of secrets, client-private data, raw medical notes, private file URLs, and provider tokens.");
  });
  it("marks SEO accessibility and performance audit evidence ready when rendered-route audits and artifacts align", () => {
    const plan = buildSeoA11yPerformanceAuditEvidencePlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      seoTestsPassed: true,
      seoTypecheckPassed: true,
      webTypecheckPassed: true,
      webBuildPassed: true,
      browserCrawlPassed: true,
      schemaValidatorPassed: true,
      sitemapCanonicalChecksPassed: true,
      axeAuditPassed: true,
      lighthouseAuditPassed: true,
      coreWebVitalsCaptured: true,
      mobileVisualQaPassed: true,
      headingFocusContrastIssuesFixed: true,
      structuredDataSnapshotsCaptured: true,
      ciArtifactsCaptured: true,
      secretSafeArtifactsCaptured: true,
    });
    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredCommands).toBe(seoA11yPerformanceAuditRequiredCommands);
    expect(plan.requiredControls).toBe(seoA11yPerformanceAuditRequiredControls);
  });
});
