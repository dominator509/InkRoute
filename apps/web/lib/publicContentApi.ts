import { prisma } from "@inkroute/db";
import {
  buildPublicContentBundle,
  getPortfolioImageDerivative,
  inkrouteDemoTenant,
  normalizeTenantSlug,
  type PublicContentBundle,
  type PublicFaqItem,
  type PublicPortfolioItem,
  type PublicTestimonial,
  type PublicTravelStop,
  type SeoCityLandingPage,
  type SeoStyleLandingPage,
} from "@inkroute/config";

export const publicContentNoStoreHeaders = { "Cache-Control": "no-store" } as const;

export type PublicTenantResolution = { tenantId: string; source: "database" | "local-fallback" };

export function isPublicContentDatabaseUnavailable(error: unknown): boolean {
  if (!process.env.DATABASE_URL) {
    return true;
  }

  if (!(error instanceof Error)) return false;
  const code = (error as { code?: string }).code;
  if (typeof code === "string" && ["P1000", "P1001", "P1002", "P1003", "P1008"].includes(code)) return true;

  const message = error.message.toLowerCase();
  return message.includes("connect") && message.includes("database");
}

export async function resolvePublicTenantScope(tenantSlug: string): Promise<PublicTenantResolution | null> {
  const normalizedSlug = normalizeTenantSlug(tenantSlug);

  try {
    const prismaRuntime = prisma as unknown as {
      tenant: {
        findUnique: (options: { where: { slug: string }; select: { id: true } }) => Promise<{ id: string } | null>;
      };
    };
    const tenant = await prismaRuntime.tenant.findUnique({
      where: { slug: normalizedSlug },
      select: { id: true },
    });
    if (tenant?.id) return { tenantId: tenant.id, source: "database" };
  } catch (error) {
    if (!isPublicContentDatabaseUnavailable(error)) {
      throw error;
    }
  }

  if (normalizedSlug === inkrouteDemoTenant.slug) {
    return { tenantId: inkrouteDemoTenant.id, source: "local-fallback" };
  }

  return null;
}

export function getLocalPublicContentBundle(tenantSlug: string): PublicContentBundle | null {
  return buildPublicContentBundle(tenantSlug);
}

export function buildPublicContentProductionBoundary(collection: "portfolio" | "travel" | "reviews" | "faq" | "seo-city" | "seo-style") {
  return {
    localPublicContentFallbackDisabled: true,
    collection,
    requiredBeforeEnablement: [
      "database-backed tenant resolution",
      "tenant-scoped public content repository reads",
      "private/PII/provider-field redaction proof",
      "public content route smoke and cache evidence",
    ],
    gapIds: ["GAP-027", "GAP-028", "GAP-029", "GAP-076"],
  };
}

export function buildLocalPublicContentResponse<TCollection extends "portfolioItems" | "travelStops" | "testimonials" | "faqs" | "cityPages" | "stylePages">(
  tenantSlug: string,
  tenant: PublicTenantResolution,
  collection: TCollection,
  filter?: (item: PublicContentBundle[TCollection][number]) => boolean,
) {
  const bundle = getLocalPublicContentBundle(tenantSlug);
  if (!bundle) return null;
  const data = filter ? bundle[collection].filter(filter) : bundle[collection];

  return {
    tenantSlug: normalizeTenantSlug(tenantSlug),
    tenantId: tenant.tenantId,
    source: tenant.source,
    persistence: "local-fallback",
    collection,
    data,
    redactedFields: bundle.redactedFields,
    cachePolicy: bundle.cachePolicy,
    boundary: "Local fallback serves demo-safe public content only; production disables this path until tenant-scoped database reads are available.",
    gapIds: ["GAP-027", "GAP-028", "GAP-029", "GAP-076"],
  };
}

function parsePublicFaq(value: unknown): PublicFaqItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      question: typeof item.question === "string" ? item.question : "",
      answer: typeof item.answer === "string" ? item.answer : "",
      category:
        item.category === "booking" || item.category === "travel" || item.category === "prep" || item.category === "aftercare" || item.category === "safety"
          ? item.category
          : "booking",
    }))
    .filter((item) => item.question.trim() && item.answer.trim());
}

function parsePublicStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export async function readPublicPortfolioItems(tenantId: string): Promise<PublicPortfolioItem[]> {
  const prismaRuntime = prisma as unknown as {
    portfolioItem: {
      findMany: (options: Record<string, unknown>) => Promise<
        Array<{
          slug: string;
          title: string;
          caption: string;
          placement: PublicPortfolioItem["placement"];
          freshness: PublicPortfolioItem["freshness"];
          city: string | null;
          isFeatured: boolean;
          styles: Array<{ slug: string }>;
          images: Array<{ imageUrl: string; altText: string; width: number | null; height: number | null }>;
        }>
      >;
    };
  };

  const rows = await prismaRuntime.portfolioItem.findMany({
    where: { tenantId, isPublic: true },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: 60,
    select: {
      slug: true,
      title: true,
      caption: true,
      placement: true,
      freshness: true,
      city: true,
      isFeatured: true,
      styles: { select: { slug: true } },
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: { imageUrl: true, altText: true, width: true, height: true },
      },
    },
  });

  return rows.map((row) => {
    const image = row.images[0];
    const imageUrl = image?.imageUrl ?? "/demo/portfolio/placeholder.svg";
    const altText = image?.altText ?? row.title;
    const derivative = getPortfolioImageDerivative({ slug: row.slug, title: row.title, imageUrl, altText });
    const width = image?.width ?? derivative.width;
    const height = image?.height ?? derivative.height;

    return {
      slug: row.slug,
      title: row.title,
      caption: row.caption,
      styles: row.styles.map((style) => style.slug) as PublicPortfolioItem["styles"],
      placement: row.placement,
      freshness: row.freshness,
      imageUrl,
      altText,
      isFeatured: row.isFeatured,
      image: {
        ...derivative,
        src: imageUrl,
        width,
        height,
        aspectRatio: `${width}:${height}`,
        altText,
      },
      ...(row.city ? { city: row.city } : {}),
    };
  });
}

export async function readPublicTravelStops(tenantId: string): Promise<PublicTravelStop[]> {
  const prismaRuntime = prisma as unknown as {
    travelSchedule: {
      findMany: (options: Record<string, unknown>) => Promise<
        Array<{
          startsAt: Date;
          endsAt: Date;
          timezone: string;
          bookingStatus: PublicTravelStop["bookingStatus"];
          publicNotes: string | null;
          travelCity: { city: string; region: string; country: string; timezone: string };
          studio: { name: string } | null;
        }>
      >;
    };
  };

  const rows = await prismaRuntime.travelSchedule.findMany({
    where: { tenantId },
    orderBy: { startsAt: "asc" },
    take: 40,
    select: {
      startsAt: true,
      endsAt: true,
      timezone: true,
      bookingStatus: true,
      publicNotes: true,
      travelCity: { select: { city: true, region: true, country: true, timezone: true } },
      studio: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    city: row.travelCity.city,
    region: row.travelCity.region,
    country: row.travelCity.country,
    timezone: row.timezone || row.travelCity.timezone,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    bookingStatus: row.bookingStatus,
    ...(row.studio?.name ? { studioName: row.studio.name } : {}),
    ...(row.publicNotes ? { publicNotes: row.publicNotes } : {}),
  }));
}

export async function readPublicTestimonials(tenantId: string): Promise<PublicTestimonial[]> {
  const prismaRuntime = prisma as unknown as {
    review: {
      findMany: (options: Record<string, unknown>) => Promise<
        Array<{
          id: string;
          rating: number;
          body: string;
          publicDisplayName: string | null;
          publishedAt: Date | null;
          artist: { homeBaseCity: string | null } | null;
        }>
      >;
    };
  };

  const rows = await prismaRuntime.review.findMany({
    where: { tenantId, status: "approved" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 24,
    select: {
      id: true,
      rating: true,
      body: true,
      publicDisplayName: true,
      publishedAt: true,
      artist: { select: { homeBaseCity: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    displayName: row.publicDisplayName ?? "Verified client",
    city: row.artist?.homeBaseCity ?? "Recent guest spot",
    rating: row.rating,
    quote: row.body,
    context: row.publishedAt ? `Published ${row.publishedAt.toISOString().slice(0, 10)}` : "Approved public testimonial",
  }));
}

export async function readPublicSeoCityPage(tenantId: string, citySlug: string): Promise<SeoCityLandingPage | null> {
  const prismaRuntime = prisma as unknown as {
    seoCityPage: {
      findFirst: (options: Record<string, unknown>) => Promise<{
        slug: string;
        city: string;
        region: string;
        country: string;
        title: string;
        metaDescription: string;
        canonicalPath: string;
        heroCopy: string | null;
        faq: unknown;
        internalLinks: unknown;
      } | null>;
    };
  };

  const row = await prismaRuntime.seoCityPage.findFirst({
    where: { tenantId, slug: citySlug, status: "published" },
    select: {
      slug: true,
      city: true,
      region: true,
      country: true,
      title: true,
      metaDescription: true,
      canonicalPath: true,
      heroCopy: true,
      faq: true,
      internalLinks: true,
    },
  });
  if (!row) return null;

  return {
    slug: row.slug,
    city: row.city,
    region: row.region,
    country: row.country,
    title: row.title,
    metaDescription: row.metaDescription,
    heroSummary: row.heroCopy ?? row.metaDescription,
    bestFor: parsePublicStringList(row.internalLinks).slice(0, 8),
    canonicalPath: row.canonicalPath,
    ...(parsePublicFaq(row.faq).length ? { faq: parsePublicFaq(row.faq) } : {}),
  } as SeoCityLandingPage & { faq?: PublicFaqItem[] };
}

export async function readPublicSeoStylePage(tenantId: string, styleSlug: string): Promise<SeoStyleLandingPage | null> {
  const prismaRuntime = prisma as unknown as {
    seoStylePage: {
      findFirst: (options: Record<string, unknown>) => Promise<{
        slug: string;
        styleName: string;
        title: string;
        metaDescription: string;
        canonicalPath: string;
        bodyCopy: string | null;
        faq: unknown;
        internalLinks: unknown;
      } | null>;
    };
  };

  const row = await prismaRuntime.seoStylePage.findFirst({
    where: { tenantId, slug: styleSlug, status: "published" },
    select: {
      slug: true,
      styleName: true,
      title: true,
      metaDescription: true,
      canonicalPath: true,
      bodyCopy: true,
      faq: true,
      internalLinks: true,
    },
  });
  if (!row) return null;

  return {
    slug: row.slug,
    style: "custom",
    label: row.styleName,
    title: row.title,
    metaDescription: row.metaDescription,
    heroSummary: row.bodyCopy ?? row.metaDescription,
    sessionFit: parsePublicStringList(row.internalLinks).slice(0, 8),
    canonicalPath: row.canonicalPath,
    ...(parsePublicFaq(row.faq).length ? { faq: parsePublicFaq(row.faq) } : {}),
  } as SeoStyleLandingPage & { faq?: PublicFaqItem[] };
}
