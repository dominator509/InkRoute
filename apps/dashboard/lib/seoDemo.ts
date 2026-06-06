import {
  auditSeoRoute,
  buildCitySeoBrief,
  buildInternalLinkPlan,
  buildMetadataDraft,
  buildRevalidationPlan,
  buildSearchConsolePropertyDraft,
  buildSitemapPlan,
  buildStyleSeoBrief,
  createSeoRouteRecord,
  deriveImageSeoFields,
  type SeoRouteRecord,
} from "@inkroute/seo";
import {
  demoPortfolioItems,
  demoSeoCityPages,
  demoSeoStylePages,
  demoTravelStops,
  inkrouteDemoArtist,
  inkrouteDemoTenant,
} from "@inkroute/config";

const baseUrl = "https://demo.inkroute.example";
const lastModified = "2026-06-03T00:00:00.000Z";

export const dashboardSeoRouteRecords: SeoRouteRecord[] = [
  createSeoRouteRecord({
    path: "/",
    kind: "static",
    title: "Mara Vale Tattoo | Nomadic Blackwork and Ornamental Booking",
    description: "Book high-end blackwork, ornamental, fine-line, and flash tattoo work with Mara Vale during West Coast travel weeks.",
    priority: 1,
    changeFrequency: "weekly",
    tenantSlug: inkrouteDemoTenant.slug,
    lastModified,
  }),
  createSeoRouteRecord({
    path: "/portfolio",
    kind: "portfolio",
    title: "Tattoo Portfolio | Blackwork, Ornamental, Fine Line and Flash",
    description: "Browse tattoo portfolio examples by style, city, placement, freshness label, and booking attribution intent.",
    priority: 0.9,
    changeFrequency: "weekly",
    tenantSlug: inkrouteDemoTenant.slug,
    lastModified,
    relatedPortfolioIds: demoPortfolioItems.map((item) => item.id),
  }),
  createSeoRouteRecord({
    path: "/booking",
    kind: "booking",
    title: "Request a Tattoo Appointment | Mara Vale Booking Intake",
    description: "Start a tattoo booking request with preferred city, style, placement, budget, references, and policy acknowledgements.",
    priority: 0.9,
    changeFrequency: "weekly",
    tenantSlug: inkrouteDemoTenant.slug,
    lastModified,
  }),
  ...demoSeoCityPages.map((page) =>
    createSeoRouteRecord({
      path: page.canonicalPath,
      kind: "city",
      title: page.title,
      description: page.metaDescription,
      city: page.city,
      region: page.region,
      priority: 0.82,
      changeFrequency: "weekly",
      tenantSlug: inkrouteDemoTenant.slug,
      lastModified,
      relatedPortfolioIds: demoPortfolioItems.filter((item) => item.city === page.city).map((item) => item.id),
      revalidationTags: [`seo:city:${page.slug}`, `tenant:${inkrouteDemoTenant.slug}`],
    }),
  ),
  ...demoSeoStylePages.map((page) =>
    createSeoRouteRecord({
      path: page.canonicalPath,
      kind: "style",
      title: page.title,
      description: page.metaDescription,
      style: page.label,
      priority: 0.8,
      changeFrequency: "monthly",
      tenantSlug: inkrouteDemoTenant.slug,
      lastModified,
      relatedPortfolioIds: demoPortfolioItems.filter((item) => item.styles.includes(page.style)).map((item) => item.id),
      revalidationTags: [`seo:style:${page.slug}`, `tenant:${inkrouteDemoTenant.slug}`],
    }),
  ),
];

export const dashboardSeoEnginePreview = {
  baseUrl,
  sitemap: buildSitemapPlan({ baseUrl, routes: dashboardSeoRouteRecords }),
  audits: dashboardSeoRouteRecords.map(auditSeoRoute),
  internalLinks: buildInternalLinkPlan(dashboardSeoRouteRecords),
  searchConsole: buildSearchConsolePropertyDraft(baseUrl),
  revalidationPlan: buildRevalidationPlan({
    reason: "Phase 10 SEO dashboard static preview",
    routes: dashboardSeoRouteRecords,
    contentIds: [...demoSeoCityPages.map((page) => page.slug), ...demoSeoStylePages.map((page) => page.slug)],
  }),
  cityBriefs: demoSeoCityPages.map((cityPage) => buildCitySeoBrief({ cityPage, artist: inkrouteDemoArtist, travelStops: demoTravelStops, portfolioItems: demoPortfolioItems })),
  styleBriefs: demoSeoStylePages.map((stylePage) => buildStyleSeoBrief({ stylePage: { ...stylePage, styleName: stylePage.label }, artist: inkrouteDemoArtist, portfolioItems: demoPortfolioItems, cityRoutes: dashboardSeoRouteRecords.filter((route) => route.kind === "city") })),
  imageSeo: demoPortfolioItems.map(deriveImageSeoFields),
  homepageMetadata: buildMetadataDraft({ route: dashboardSeoRouteRecords[0]!, baseUrl }),
};
