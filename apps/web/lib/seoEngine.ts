import {
  buildCitySeoBrief,
  buildInternalLinkPlan,
  buildMetadataDraft,
  buildRevalidationPlan,
  buildSearchConsolePropertyDraft,
  buildSitemapPlan,
  buildStyleSeoBrief,
  createSeoRouteRecord,
  deriveImageSeoFields,
  auditSeoRoute,
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

const lastModified = "2026-06-03T00:00:00.000Z";

export const staticSeoRoutes: SeoRouteRecord[] = [
  createSeoRouteRecord({
    path: "/",
    kind: "static",
    title: "Mara Vale Tattoo | Nomadic Blackwork and Ornamental Booking",
    description: "Book high-end blackwork, ornamental, fine-line, and flash tattoo work with Mara Vale during West Coast travel weeks.",
    priority: 1,
    changeFrequency: "weekly",
    lastModified,
    tenantSlug: inkrouteDemoTenant.slug,
  }),
  createSeoRouteRecord({
    path: "/about",
    kind: "static",
    title: "About Mara Vale | Nomadic Tattoo Artist",
    description: "Learn Mara Vale's tattoo approach, specialties, private-session workflow, and travel-first artist story.",
    priority: 0.7,
    lastModified,
    tenantSlug: inkrouteDemoTenant.slug,
  }),
  createSeoRouteRecord({
    path: "/portfolio",
    kind: "portfolio",
    title: "Tattoo Portfolio | Blackwork, Ornamental, Fine Line and Flash",
    description: "Browse tattoo portfolio examples by style, city, placement, freshness label, and booking attribution intent.",
    priority: 0.9,
    changeFrequency: "weekly",
    lastModified,
    tenantSlug: inkrouteDemoTenant.slug,
    relatedPortfolioIds: demoPortfolioItems.map((item) => item.id),
  }),
  createSeoRouteRecord({
    path: "/booking",
    kind: "booking",
    title: "Request a Tattoo Appointment | Mara Vale Booking Intake",
    description: "Start a tattoo booking request with preferred city, style, placement, budget, references, and policy acknowledgements.",
    priority: 0.9,
    changeFrequency: "weekly",
    lastModified,
    tenantSlug: inkrouteDemoTenant.slug,
  }),
  createSeoRouteRecord({
    path: "/booking/confirmation",
    kind: "system",
    title: "Booking Request Confirmation Preview | InkRoute Suite",
    description: "Static confirmation preview for the booking flow scaffold. Not intended for search indexing.",
    priority: 0,
    indexMode: "noindex",
    lastModified,
    tenantSlug: inkrouteDemoTenant.slug,
  }),
  createSeoRouteRecord({
    path: "/booking/deposit-preview",
    kind: "system",
    title: "Deposit Preview | InkRoute Suite Payment Boundary",
    description: "Static deposit preview for Stripe boundary planning. Not intended for search indexing.",
    priority: 0,
    indexMode: "noindex",
    lastModified,
    tenantSlug: inkrouteDemoTenant.slug,
  }),
  createSeoRouteRecord({
    path: "/travel",
    kind: "travel",
    title: "Tattoo Travel Schedule | Mara Vale Nomad Mode",
    description: "View upcoming tattoo travel weeks, guest spots, city booking status, waitlist openings, and flash availability.",
    priority: 0.9,
    changeFrequency: "weekly",
    lastModified,
    tenantSlug: inkrouteDemoTenant.slug,
  }),
  createSeoRouteRecord({
    path: "/aftercare",
    kind: "aftercare",
    title: "Tattoo Aftercare Guide | Mara Vale",
    description: "Read tattoo aftercare guidance, healing expectations, and healed-photo follow-up planning for Mara Vale clients.",
    priority: 0.6,
    lastModified,
    tenantSlug: inkrouteDemoTenant.slug,
  }),
  createSeoRouteRecord({
    path: "/faq",
    kind: "static",
    title: "Tattoo Booking FAQ | Deposits, Travel, Prep and Safety",
    description: "Answers for tattoo booking, deposits, travel weeks, prep, aftercare, and safety notes in the InkRoute demo site.",
    priority: 0.7,
    lastModified,
    tenantSlug: inkrouteDemoTenant.slug,
  }),
  createSeoRouteRecord({
    path: "/contact",
    kind: "static",
    title: "Contact Mara Vale Tattoo | Booking and Guest Spot Questions",
    description: "Contact the artist for tattoo booking questions, guest spot inquiries, portfolio context, and travel availability.",
    priority: 0.6,
    lastModified,
    tenantSlug: inkrouteDemoTenant.slug,
  }),
];

export const citySeoRoutes: SeoRouteRecord[] = demoSeoCityPages.map((page) =>
  createSeoRouteRecord({
    path: page.canonicalPath,
    kind: "city",
    title: page.title,
    description: page.metaDescription,
    city: page.city,
    region: page.region,
    priority: 0.82,
    changeFrequency: "weekly",
    lastModified,
    tenantSlug: inkrouteDemoTenant.slug,
    relatedPortfolioIds: demoPortfolioItems.filter((item) => item.city === page.city).map((item) => item.id),
    revalidationTags: [`seo:city:${page.slug}`, `tenant:${inkrouteDemoTenant.slug}`],
  }),
);

export const styleSeoRoutes: SeoRouteRecord[] = demoSeoStylePages.map((page) =>
  createSeoRouteRecord({
    path: page.canonicalPath,
    kind: "style",
    title: page.title,
    description: page.metaDescription,
    style: page.label,
    priority: 0.8,
    changeFrequency: "monthly",
    lastModified,
    tenantSlug: inkrouteDemoTenant.slug,
    relatedPortfolioIds: demoPortfolioItems.filter((item) => item.styles.includes(page.style)).map((item) => item.id),
    revalidationTags: [`seo:style:${page.slug}`, `tenant:${inkrouteDemoTenant.slug}`],
  }),
);

export const allPublicSeoRoutes: SeoRouteRecord[] = [...staticSeoRoutes, ...citySeoRoutes, ...styleSeoRoutes];

export function buildPublicSeoEnginePreview(baseUrl: string) {
  const sitemap = buildSitemapPlan({ baseUrl, routes: allPublicSeoRoutes });
  const audits = allPublicSeoRoutes.map(auditSeoRoute);
  const internalLinks = buildInternalLinkPlan(allPublicSeoRoutes);
  const revalidationPlan = buildRevalidationPlan({
    reason: "Static Phase 10 SEO content preview updated",
    routes: [...citySeoRoutes, ...styleSeoRoutes],
    contentIds: [...demoSeoCityPages.map((page) => page.slug), ...demoSeoStylePages.map((page) => page.slug)],
  });
  return {
    tenantSlug: inkrouteDemoTenant.slug,
    artistSlug: inkrouteDemoArtist.slug,
    sitemap,
    routeCount: allPublicSeoRoutes.length,
    audits,
    internalLinks,
    revalidationPlan,
    searchConsole: buildSearchConsolePropertyDraft(baseUrl),
    cityBriefs: demoSeoCityPages.map((cityPage) => buildCitySeoBrief({ cityPage, artist: inkrouteDemoArtist, travelStops: demoTravelStops, portfolioItems: demoPortfolioItems })),
    styleBriefs: demoSeoStylePages.map((stylePage) => buildStyleSeoBrief({ stylePage: { ...stylePage, styleName: stylePage.label }, artist: inkrouteDemoArtist, portfolioItems: demoPortfolioItems, cityRoutes: citySeoRoutes })),
    imageSeo: demoPortfolioItems.map(deriveImageSeoFields),
    homepageMetadata: buildMetadataDraft({ route: allPublicSeoRoutes[0]!, baseUrl }),
  };
}
