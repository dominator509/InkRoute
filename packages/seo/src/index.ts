import type { ArtistProfile, PortfolioItem, Review, Role, SeoCityPage, SeoPageStatus, SeoStylePage, TravelStop } from "@inkroute/types";

type JsonLd = Record<string, unknown>;

export type SeoRouteKind = "static" | "city" | "style" | "portfolio" | "travel" | "aftercare" | "booking" | "system";
export type SeoIndexMode = "index" | "noindex";
export type SeoChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
export type SeoIssueSeverity = "info" | "warning" | "error";
export type SeoPublicationStatus = SeoPageStatus | "static_demo";

export interface SeoRouteRecord {
  path: string;
  kind: SeoRouteKind;
  title: string;
  description: string;
  canonicalPath: string;
  status: SeoPublicationStatus;
  indexMode: SeoIndexMode;
  priority: number;
  changeFrequency: SeoChangeFrequency;
  lastModified: string;
  tenantSlug?: string;
  city?: string;
  region?: string;
  style?: string;
  relatedPortfolioIds?: string[];
  revalidationTags: string[];
}

export interface SeoMetadataDraft {
  title: string;
  description: string;
  canonicalUrl: string;
  openGraph: {
    title: string;
    description: string;
    url: string;
    type: "website" | "article" | "profile";
    images: Array<{ url: string; alt: string }>;
  };
  robots: {
    index: boolean;
    follow: boolean;
  };
  alternates: {
    canonical: string;
  };
}

export interface SitemapEntryDraft {
  url: string;
  lastModified: string;
  changeFrequency: SeoChangeFrequency;
  priority: number;
}

export interface SitemapPlan {
  generatedAt: string;
  baseUrl: string;
  indexableCount: number;
  noindexCount: number;
  entries: SitemapEntryDraft[];
}

export interface SeoIssue {
  code: string;
  severity: SeoIssueSeverity;
  message: string;
  field?: string;
  nextAction: string;
}

export interface SeoAuditResult {
  path: string;
  score: number;
  indexMode: SeoIndexMode;
  issues: SeoIssue[];
  passedChecks: string[];
}

export interface InternalLinkSuggestion {
  fromPath: string;
  toPath: string;
  anchorText: string;
  reason: string;
  priority: "low" | "medium" | "high";
}

export interface SeoContentBrief {
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  canonicalPath: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  recommendedSections: string[];
  schemaTypes: string[];
  internalLinks: InternalLinkSuggestion[];
  analyticsEvents: SeoAnalyticsEventDraft[];
}

export interface SeoAnalyticsEventDraft {
  name:
    | "seo_page_viewed"
    | "seo_city_waitlist_clicked"
    | "seo_style_booking_clicked"
    | "seo_portfolio_attribution_clicked"
    | "seo_travel_cta_clicked";
  path: string;
  tenantSlug?: string;
  city?: string;
  style?: string;
  portfolioAttributionKey?: string;
}

export interface SeoImageFields {
  imageUrl: string;
  altText: string;
  caption: string;
  filenameHint: string;
  structuredData: JsonLd;
}

export interface SeoRevalidationPlan {
  reason: string;
  paths: string[];
  tags: string[];
  requiresRuntime: boolean;
  providerBoundary: "next_revalidate_path" | "next_revalidate_tag" | "cms_webhook" | "manual_preview";
}

export type SeoPublicationAction = "create" | "update" | "publish" | "archive" | "redirect";
export type SeoPublishableModel = "SeoCityPage" | "SeoStylePage" | "SeoRedirect";
export type SeoPublicationWriteModel = SeoPublishableModel | "AuditLog" | "RevalidationJob" | "SeoAssociation";
export type SeoPublicationPlanStatus = "ready" | "blocked" | "invalid";

export interface SeoPublicationMutationInput {
  action: SeoPublicationAction;
  model: SeoPublishableModel;
  tenantId: string;
  actorId: string;
  actorRole: Role;
  route: SeoRouteRecord;
  now: string;
  existingTenantId?: string;
  targetStatus?: SeoPageStatus;
  idempotencyKey?: string;
  relatedFaqIds?: string[];
  relatedReviewIds?: string[];
  relatedImageIds?: string[];
  redirectFromPath?: string;
  redirectToPath?: string;
}

export interface SeoPublicationWrite {
  model: SeoPublicationWriteModel;
  operation: "create" | "update" | "upsert" | "delete" | "enqueue";
  tenantId: string;
  summary: string;
  requiresTransaction: boolean;
}

export interface SeoPublicationMutationPlan {
  status: SeoPublicationPlanStatus;
  action: SeoPublicationAction;
  model: SeoPublishableModel;
  tenantId: string;
  actorId: string;
  actorRole: Role;
  targetStatus: SeoPageStatus;
  canCommit: boolean;
  requiresTenantScope: true;
  requiresRbac: true;
  requiresAuditLog: true;
  requiresTransaction: true;
  idempotencyKey: string;
  blockers: string[];
  writes: SeoPublicationWrite[];
  auditAction: string;
  revalidation: SeoRevalidationPlan;
}

export interface SearchConsolePropertyDraft {
  siteUrl: string;
  propertyType: "url_prefix" | "domain";
  verificationMethod: "html_file" | "dns_txt" | "meta_tag";
  status: "credential_gated";
  nextAction: string;
}

export interface SeoTechnicalAuditInput {
  baseUrl: string;
  routes: SeoRouteRecord[];
  jsonLdGraphs?: JsonLd[];
}

export interface SeoTechnicalAuditSummary {
  status: "pass" | "warn" | "fail";
  routeCount: number;
  sitemapEntryCount: number;
  duplicateSitemapUrls: string[];
  findings: SeoIssue[];
}

export function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (trimmed === "") return "/";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.length > 1 && withLeadingSlash.endsWith("/") ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
}

export function createCanonicalUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBase}${normalizePath(path)}`;
}

export function clampSitemapPriority(priority: number): number {
  if (priority < 0) return 0;
  if (priority > 1) return 1;
  return Number(priority.toFixed(2));
}

export function createSeoRouteRecord(input: {
  path: string;
  kind: SeoRouteKind;
  title: string;
  description: string;
  status?: SeoPublicationStatus;
  indexMode?: SeoIndexMode;
  priority?: number;
  changeFrequency?: SeoChangeFrequency;
  lastModified?: string;
  tenantSlug?: string;
  city?: string;
  region?: string;
  style?: string;
  relatedPortfolioIds?: string[];
  revalidationTags?: string[];
}): SeoRouteRecord {
  const canonicalPath = normalizePath(input.path);
  return {
    path: canonicalPath,
    kind: input.kind,
    title: input.title,
    description: input.description,
    canonicalPath,
    status: input.status ?? "static_demo",
    indexMode: input.indexMode ?? "index",
    priority: clampSitemapPriority(input.priority ?? 0.7),
    changeFrequency: input.changeFrequency ?? "monthly",
    lastModified: input.lastModified ?? new Date().toISOString(),
    ...(input.tenantSlug ? { tenantSlug: input.tenantSlug } : {}),
    ...(input.city ? { city: input.city } : {}),
    ...(input.region ? { region: input.region } : {}),
    ...(input.style ? { style: input.style } : {}),
    ...(input.relatedPortfolioIds ? { relatedPortfolioIds: input.relatedPortfolioIds } : {}),
    revalidationTags: input.revalidationTags ?? [`seo:path:${canonicalPath}`],
  };
}

export function buildMetadataDraft(input: {
  route: SeoRouteRecord;
  baseUrl: string;
  image?: { url: string; alt: string };
  type?: "website" | "article" | "profile";
}): SeoMetadataDraft {
  const canonicalUrl = createCanonicalUrl(input.baseUrl, input.route.canonicalPath);
  return {
    title: input.route.title,
    description: input.route.description,
    canonicalUrl,
    openGraph: {
      title: input.route.title,
      description: input.route.description,
      url: canonicalUrl,
      type: input.type ?? "website",
      images: input.image ? [input.image] : [],
    },
    robots: {
      index: input.route.indexMode === "index",
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export function routeToSitemapEntry(route: SeoRouteRecord, baseUrl: string): SitemapEntryDraft | undefined {
  if (route.indexMode === "noindex" || route.status === "draft" || route.status === "archived") return undefined;
  return {
    url: createCanonicalUrl(baseUrl, route.canonicalPath),
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  };
}

export function buildSitemapPlan(input: { baseUrl: string; routes: SeoRouteRecord[]; generatedAt?: string }): SitemapPlan {
  const entries = input.routes
    .map((route) => routeToSitemapEntry(route, input.baseUrl))
    .filter((entry): entry is SitemapEntryDraft => Boolean(entry));
  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    baseUrl: input.baseUrl,
    indexableCount: entries.length,
    noindexCount: input.routes.length - entries.length,
    entries,
  };
}

export function auditSeoRoute(route: SeoRouteRecord): SeoAuditResult {
  const issues: SeoIssue[] = [];
  const passedChecks: string[] = [];

  if (route.title.length < 30 || route.title.length > 65) {
    issues.push({
      code: "TITLE_LENGTH",
      severity: "warning",
      field: "title",
      message: `Title length is ${route.title.length}; target a concise, descriptive title near 30-65 characters.`,
      nextAction: "Revise the title before publishing from the SEO dashboard.",
    });
  } else {
    passedChecks.push("title_length");
  }

  if (route.description.length < 80 || route.description.length > 160) {
    issues.push({
      code: "META_DESCRIPTION_LENGTH",
      severity: "warning",
      field: "description",
      message: `Meta description length is ${route.description.length}; target roughly 80-160 characters for the snippet draft.`,
      nextAction: "Rewrite the description to mention city/style intent and booking value.",
    });
  } else {
    passedChecks.push("meta_description_length");
  }

  if (!route.canonicalPath.startsWith("/")) {
    issues.push({
      code: "CANONICAL_PATH_FORMAT",
      severity: "error",
      field: "canonicalPath",
      message: "Canonical path must start with a slash.",
      nextAction: "Normalize canonicalPath using normalizePath before saving.",
    });
  } else {
    passedChecks.push("canonical_path_format");
  }

  if (route.kind === "city" && (!route.city || !route.region)) {
    issues.push({
      code: "CITY_CONTEXT_MISSING",
      severity: "error",
      message: "City landing pages need city and region context for local SEO and schema composition.",
      nextAction: "Attach the TravelCity/SeoCityPage record before publishing.",
    });
  } else if (route.kind !== "city" || (route.city && route.region)) {
    passedChecks.push("local_context");
  }

  if (route.indexMode === "noindex" && route.priority > 0) {
    issues.push({
      code: "NOINDEX_PRIORITY",
      severity: "info",
      message: "Noindex routes should not be included in public sitemap output.",
      nextAction: "Confirm this route is intentionally omitted from sitemap generation.",
    });
  }

  const penalty = issues.reduce((total, issue) => total + (issue.severity === "error" ? 30 : issue.severity === "warning" ? 12 : 4), 0);
  return {
    path: route.path,
    score: Math.max(0, 100 - penalty),
    indexMode: route.indexMode,
    issues,
    passedChecks,
  };
}

export function buildInternalLinkPlan(routes: SeoRouteRecord[]): InternalLinkSuggestion[] {
  const home = routes.find((route) => route.path === "/");
  const booking = routes.find((route) => route.kind === "booking");
  const cityRoutes = routes.filter((route) => route.kind === "city");
  const styleRoutes = routes.filter((route) => route.kind === "style");
  const suggestions: InternalLinkSuggestion[] = [];

  for (const city of cityRoutes) {
    if (home) {
      suggestions.push({
        fromPath: home.path,
        toPath: city.path,
        anchorText: `${city.city ?? "Upcoming city"} tattoo availability`,
        reason: "Homepage should pass authority to active travel/city landing pages.",
        priority: "high",
      });
    }
    if (booking) {
      suggestions.push({
        fromPath: city.path,
        toPath: booking.path,
        anchorText: `Request a ${city.city ?? "travel"} appointment`,
        reason: "City landing pages must convert search traffic into booking requests or waitlist joins.",
        priority: "high",
      });
    }
  }

  for (const style of styleRoutes) {
    if (booking) {
      suggestions.push({
        fromPath: style.path,
        toPath: booking.path,
        anchorText: `Book a ${(style.style ?? "style").toString()} tattoo consultation`,
        reason: "Style pages should provide a direct booking call to action even before city landing pages are available.",
        priority: "high",
      });
    }
    for (const city of cityRoutes.slice(0, 3)) {
      suggestions.push({
        fromPath: style.path,
        toPath: city.path,
        anchorText: `${(style.title.split("|")[0] ?? style.title).trim()} in ${city.city ?? city.region ?? "upcoming cities"}`,
        reason: "Style pages should connect search intent to active travel availability.",
        priority: "medium",
      });
    }
  }

  return suggestions;
}

export function deriveImageSeoFields(item: PortfolioItem): SeoImageFields {
  const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const stylePart = item.styles.join("-").replace(/_/g, "-");
  return {
    imageUrl: item.imageUrl,
    altText: item.altText,
    caption: item.caption,
    filenameHint: `${normalizedTitle}-${stylePart}-${item.placement}-${item.freshness}.jpg`,
    structuredData: buildPortfolioImageSchema(item),
  };
}

export function buildCitySeoBrief(args: {
  cityPage: Pick<SeoCityPage, "slug" | "city" | "region" | "country" | "title" | "metaDescription" | "canonicalPath">;
  artist: ArtistProfile;
  travelStops: TravelStop[];
  portfolioItems: PortfolioItem[];
}): SeoContentBrief {
  const matchingStops = args.travelStops.filter((stop) => stop.city === args.cityPage.city && stop.region === args.cityPage.region);
  const matchingPortfolio = args.portfolioItems.filter((item) => item.city === args.cityPage.city);
  const route = createSeoRouteRecord({
    path: args.cityPage.canonicalPath,
    kind: "city",
    title: args.cityPage.title,
    description: args.cityPage.metaDescription,
    city: args.cityPage.city,
    region: args.cityPage.region,
    relatedPortfolioIds: matchingPortfolio.map((item) => item.id),
  });
  return {
    slug: args.cityPage.slug,
    title: args.cityPage.title,
    metaDescription: args.cityPage.metaDescription,
    h1: `${args.artist.displayName} tattoo booking in ${args.cityPage.city}`,
    canonicalPath: route.canonicalPath,
    primaryKeyword: `${args.cityPage.city} tattoo artist`,
    secondaryKeywords: [
      `${args.cityPage.city} guest spot tattoo`,
      `${args.cityPage.city} blackwork tattoo`,
      `${args.cityPage.city} ornamental tattoo`,
      `${args.cityPage.city} fine line tattoo`,
    ],
    recommendedSections: [
      "Current booking status and travel dates",
      "Best-fit tattoo styles for this city",
      "Featured portfolio pieces with city/style metadata",
      "Deposit and cancellation expectations",
      "Travel waitlist and guest spot call to action",
      matchingStops.length > 0 ? "Structured travel event details" : "Future travel interest capture",
    ],
    schemaTypes: ["Person", "TattooParlor", "Service", "Event", "FAQPage", "ImageObject"],
    internalLinks: buildInternalLinkPlan([route, createSeoRouteRecord({ path: "/booking", kind: "booking", title: "Booking request", description: "Request a tattoo appointment." })]),
    analyticsEvents: [
      { name: "seo_page_viewed", path: route.path, city: args.cityPage.city },
      { name: "seo_city_waitlist_clicked", path: route.path, city: args.cityPage.city },
    ],
  };
}

export function buildStyleSeoBrief(args: {
  stylePage: Pick<SeoStylePage, "slug" | "styleName" | "title" | "metaDescription" | "canonicalPath">;
  artist: ArtistProfile;
  portfolioItems: PortfolioItem[];
  cityRoutes?: SeoRouteRecord[];
}): SeoContentBrief {
  const styleKey = args.stylePage.styleName.toLowerCase().replace(/\s+/g, "_");
  const normalizedStyleName = args.stylePage.styleName.toLowerCase();
  const matchingPortfolio = args.portfolioItems.filter((item) => item.styles.some((style) => style === styleKey));
  const route = createSeoRouteRecord({
    path: args.stylePage.canonicalPath,
    kind: "style",
    title: args.stylePage.title,
    description: args.stylePage.metaDescription,
    style: args.stylePage.styleName,
    relatedPortfolioIds: matchingPortfolio.map((item) => item.id),
  });
  return {
    slug: args.stylePage.slug,
    title: args.stylePage.title,
    metaDescription: args.stylePage.metaDescription,
    h1: `${args.stylePage.styleName} tattoos by ${args.artist.displayName}`,
    canonicalPath: route.canonicalPath,
    primaryKeyword: `${args.stylePage.styleName} tattoo artist`,
    secondaryKeywords: [
      `${normalizedStyleName} tattoo booking`,
      `${normalizedStyleName} tattoo portfolio`,
      `healed ${normalizedStyleName} tattoo examples`,
    ],
    recommendedSections: [
      "Style overview and fit criteria",
      "Placement and sizing guidance",
      "Healed/fresh portfolio examples",
      "Best city/travel windows for this style",
      "Booking readiness checklist",
    ],
    schemaTypes: ["Person", "Service", "ImageObject", "FAQPage"],
    internalLinks: buildInternalLinkPlan([route, ...(args.cityRoutes ?? []), createSeoRouteRecord({ path: "/booking", kind: "booking", title: "Booking request", description: "Request a tattoo appointment." })]),
    analyticsEvents: [
      { name: "seo_page_viewed", path: route.path, style: args.stylePage.styleName },
      { name: "seo_style_booking_clicked", path: route.path, style: args.stylePage.styleName },
    ],
  };
}

export function buildRevalidationPlan(input: { reason: string; routes: SeoRouteRecord[]; contentIds?: string[] }): SeoRevalidationPlan {
  const paths = Array.from(new Set(input.routes.map((route) => route.path)));
  const routeTags = input.routes.flatMap((route) => route.revalidationTags);
  const contentTags = (input.contentIds ?? []).map((id) => `seo:content:${id}`);
  return {
    reason: input.reason,
    paths,
    tags: Array.from(new Set([...routeTags, ...contentTags])),
    requiresRuntime: true,
    providerBoundary: "next_revalidate_tag",
  };
}

export function buildSearchConsolePropertyDraft(siteUrl: string, propertyType: "url_prefix" | "domain" = "url_prefix"): SearchConsolePropertyDraft {
  return {
    siteUrl,
    propertyType,
    verificationMethod: propertyType === "domain" ? "dns_txt" : "html_file",
    status: "credential_gated",
    nextAction: "Verify ownership in Google Search Console, submit sitemap, and connect query/page metrics to the SEO dashboard.",
  };
}

function addTechnicalFinding(findings: SeoIssue[], input: Omit<SeoIssue, "severity" | "nextAction"> & { severity?: SeoIssueSeverity; nextAction?: string }): void {
  findings.push({
    severity: input.severity ?? "error",
    nextAction: input.nextAction ?? "Fix the SEO technical audit finding before treating the route as launch-ready.",
    code: input.code,
    message: input.message,
    ...(input.field ? { field: input.field } : {}),
  });
}

function findDuplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }
  return [...duplicates].sort();
}

function isJsonLdGraph(value: JsonLd): value is { "@graph": unknown[] } {
  return Array.isArray(value["@graph"]);
}

export function auditSeoTechnicalReadiness(input: SeoTechnicalAuditInput): SeoTechnicalAuditSummary {
  const findings: SeoIssue[] = [];
  const sitemap = buildSitemapPlan({ baseUrl: input.baseUrl, routes: input.routes });
  const duplicateSitemapUrls = findDuplicateValues(sitemap.entries.map((entry) => entry.url));

  for (const duplicate of duplicateSitemapUrls) {
    addTechnicalFinding(findings, {
      code: "DUPLICATE_SITEMAP_URL",
      field: "sitemap",
      message: `Duplicate sitemap URL detected: ${duplicate}.`,
      nextAction: "Deduplicate route canonical paths before publishing the sitemap.",
    });
  }

  for (const route of input.routes) {
    const metadata = buildMetadataDraft({ baseUrl: input.baseUrl, route });
    const expectedCanonical = createCanonicalUrl(input.baseUrl, route.canonicalPath);
    if (metadata.canonicalUrl !== expectedCanonical || metadata.alternates.canonical !== expectedCanonical || metadata.openGraph.url !== expectedCanonical) {
      addTechnicalFinding(findings, {
        code: "CANONICAL_METADATA_MISMATCH",
        field: "canonicalUrl",
        message: `Metadata canonical fields do not agree for ${route.path}.`,
        nextAction: "Regenerate metadata from the normalized route canonical path.",
      });
    }
    if (metadata.robots.index !== (route.indexMode === "index")) {
      addTechnicalFinding(findings, {
        code: "ROBOTS_INDEX_MISMATCH",
        field: "robots",
        message: `Robots index flag does not match route indexMode for ${route.path}.`,
        nextAction: "Regenerate robots metadata from route.indexMode.",
      });
    }

    const routeAudit = auditSeoRoute(route);
    for (const issue of routeAudit.issues.filter((issue) => issue.severity === "error")) {
      findings.push(issue);
    }
  }

  for (const graph of input.jsonLdGraphs ?? []) {
    if (!isJsonLdGraph(graph)) {
      addTechnicalFinding(findings, {
        code: "JSON_LD_GRAPH_MISSING",
        field: "jsonLd",
        message: "Composed JSON-LD output must use an @graph array.",
        nextAction: "Wrap structured data items with composeJsonLdGraph before rendering.",
      });
      continue;
    }
    if (graph["@graph"].length === 0) {
      addTechnicalFinding(findings, {
        code: "JSON_LD_GRAPH_EMPTY",
        field: "jsonLd",
        message: "JSON-LD graph is empty.",
        nextAction: "Include WebSite, WebPage, Person, Service, FAQ, Event, or ImageObject schema items where relevant.",
      });
    }
    for (const item of graph["@graph"]) {
      if (!item || typeof item !== "object" || !("@type" in item)) {
        addTechnicalFinding(findings, {
          code: "JSON_LD_ITEM_TYPE_MISSING",
          field: "jsonLd",
          message: "Every JSON-LD graph item must include @type.",
          nextAction: "Add a schema.org @type to each structured data object.",
        });
      }
    }
  }

  const status = findings.some((finding) => finding.severity === "error") ? "fail" : findings.some((finding) => finding.severity === "warning") ? "warn" : "pass";
  return {
    status,
    routeCount: input.routes.length,
    sitemapEntryCount: sitemap.entries.length,
    duplicateSitemapUrls,
    findings,
  };
}

export function buildPublicationChecklist(route: SeoRouteRecord): string[] {
  const checklist = [
    "Confirm tenant/artist ownership and RBAC permission before editing.",
    "Validate title, meta description, canonical path, and noindex/index mode.",
    "Preview JSON-LD graph and test structured data before production publishing.",
    "Confirm image alt text, captions, and public/private visibility.",
    "Generate internal links from homepage, city pages, style pages, portfolio, and booking CTA surfaces.",
    "Trigger sitemap update and public route revalidation after publish.",
    "Record audit log entry for the SEO content change.",
  ];
  if (route.kind === "city") checklist.push("Confirm travel dates, waitlist status, studio/guest spot details, and local legal wording.");
  if (route.kind === "style") checklist.push("Confirm style descriptions accurately represent artist scope and healed-result expectations.");
  return checklist;
}

function canMutateSeo(role: Role): boolean {
  return role === "owner" || role === "studio_manager";
}

function resolvePublicationStatus(action: SeoPublicationAction, targetStatus?: SeoPageStatus): SeoPageStatus {
  if (action === "publish") return "published";
  if (action === "archive") return "archived";
  return targetStatus ?? "draft";
}

export function buildSeoPublicationMutationPlan(input: SeoPublicationMutationInput): SeoPublicationMutationPlan {
  const targetStatus = resolvePublicationStatus(input.action, input.targetStatus);
  const blockers: string[] = [];
  const audit = auditSeoRoute({ ...input.route, status: targetStatus });

  if (!input.tenantId.trim()) blockers.push("Tenant id is required before mutating SEO content.");
  if (!input.actorId.trim()) blockers.push("Actor id is required for SEO audit logging.");
  if (!canMutateSeo(input.actorRole)) blockers.push("Actor role must be owner or studio_manager for SEO publishing mutations.");
  if (input.existingTenantId && input.existingTenantId !== input.tenantId) blockers.push("Existing SEO record belongs to a different tenant.");
  if (input.action === "publish" && audit.issues.some((issue) => issue.severity === "error")) blockers.push("SEO route has blocking audit errors and cannot be published.");
  if (input.action === "redirect" && (!input.redirectFromPath || !input.redirectToPath)) blockers.push("Redirect mutations require source and destination paths.");

  const routeWithTargetStatus = { ...input.route, status: targetStatus };
  const idempotencyKey = input.idempotencyKey ?? `seo:${input.tenantId}:${input.model}:${input.action}:${routeWithTargetStatus.canonicalPath}`;
  const associationCount = (input.relatedFaqIds?.length ?? 0) + (input.relatedReviewIds?.length ?? 0) + (input.relatedImageIds?.length ?? 0);
  const writes: SeoPublicationWrite[] = [
    {
      model: input.model,
      operation: input.action === "create" ? "create" : input.action === "redirect" ? "upsert" : "update",
      tenantId: input.tenantId,
      summary: `${input.action} ${input.model} at ${routeWithTargetStatus.canonicalPath} with status ${targetStatus}.`,
      requiresTransaction: true,
    },
  ];

  if (associationCount > 0) {
    writes.push({
      model: "SeoAssociation",
      operation: "upsert",
      tenantId: input.tenantId,
      summary: `Attach ${associationCount} FAQ/review/image association(s) within the same tenant transaction.`,
      requiresTransaction: true,
    });
  }

  writes.push(
    {
      model: "AuditLog",
      operation: "create",
      tenantId: input.tenantId,
      summary: `Record actor ${input.actorId} ${input.action} mutation for ${input.model}.`,
      requiresTransaction: true,
    },
    {
      model: "RevalidationJob",
      operation: "enqueue",
      tenantId: input.tenantId,
      summary: "Queue sitemap, canonical route, and tag revalidation after transaction commit.",
      requiresTransaction: false,
    },
  );

  return {
    status: blockers.length > 0 ? (audit.issues.some((issue) => issue.severity === "error") ? "invalid" : "blocked") : "ready",
    action: input.action,
    model: input.model,
    tenantId: input.tenantId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    targetStatus,
    canCommit: blockers.length === 0,
    requiresTenantScope: true,
    requiresRbac: true,
    requiresAuditLog: true,
    requiresTransaction: true,
    idempotencyKey,
    blockers,
    writes,
    auditAction: `seo.${input.model}.${input.action}`,
    revalidation: buildRevalidationPlan({
      reason: `SEO ${input.action} mutation for ${input.model}`,
      routes: [routeWithTargetStatus],
      contentIds: [input.model, routeWithTargetStatus.canonicalPath],
    }),
  };
}

export function buildWebsiteSchema(args: { name: string; url: string; description?: string }): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: args.name,
    url: args.url,
    description: args.description,
  };
}

export function buildWebPageSchema(args: { name: string; description: string; url: string; dateModified?: string; breadcrumb?: JsonLd }): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: args.name,
    description: args.description,
    url: args.url,
    ...(args.dateModified ? { dateModified: args.dateModified } : {}),
    ...(args.breadcrumb ? { breadcrumb: args.breadcrumb } : {}),
  };
}

export function buildBreadcrumbSchema(items: Array<{ name: string; path: string }>, baseUrl: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: createCanonicalUrl(baseUrl, item.path),
    })),
  };
}

export function composeJsonLdGraph(items: JsonLd[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": items,
  };
}

export function buildArtistPersonSchema(artist: ArtistProfile): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: artist.displayName,
    description: artist.bio,
    url: `/${artist.slug}`,
    sameAs: artist.instagramUrl ? [artist.instagramUrl] : undefined,
    knowsAbout: artist.specialties,
  };
}

export function buildTattooServiceSchema(args: {
  artist: ArtistProfile;
  name: string;
  description: string;
  areaServed?: string[];
  url?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: args.name,
    description: args.description,
    provider: {
      "@type": "Person",
      name: args.artist.displayName,
    },
    areaServed: args.areaServed,
    url: args.url,
    serviceType: "Tattoo appointment",
  };
}

export function buildLocalTattooBusinessSchema(args: {
  name: string;
  description: string;
  city: string;
  region: string;
  country: string;
  url?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "TattooParlor",
    name: args.name,
    description: args.description,
    url: args.url,
    address: {
      "@type": "PostalAddress",
      addressLocality: args.city,
      addressRegion: args.region,
      addressCountry: args.country,
    },
  };
}

export function buildPortfolioImageSchema(item: PortfolioItem): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: item.title,
    caption: item.caption,
    contentUrl: item.imageUrl,
    description: item.altText,
    keywords: item.styles.join(", "),
  };
}

export function buildTravelEventSchema(stop: TravelStop, artist: ArtistProfile): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${artist.displayName} tattoo guest spot in ${stop.city}`,
    startDate: stop.startsAt,
    endDate: stop.endsAt,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: stop.studioName ?? `${stop.city} guest spot`,
      address: {
        "@type": "PostalAddress",
        addressLocality: stop.city,
        addressRegion: stop.region,
        addressCountry: stop.country,
      },
    },
    performer: {
      "@type": "Person",
      name: artist.displayName,
    },
    description: stop.publicNotes,
  };
}

export function buildReviewSchema(review: Review): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
    },
    author: {
      "@type": "Person",
      name: review.publicDisplayName ?? "Tattoo client",
    },
    reviewBody: review.body,
    datePublished: review.publishedAt,
  };
}

export function buildFaqSchema(items: Array<{ question: string; answer: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
