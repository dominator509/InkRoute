# SEO Plan

## Current status

SEO architecture is partially implemented for the static public demo. Next.js metadata file conventions are used, `@inkroute/seo` contains structured data helpers, sitemap/robots are implemented for static routes, and static demo city/style landing pages now exist. Database-backed city/style page generation, tenant-domain canonical handling, analytics, image optimization, and crawl validation remain unimplemented.

## SEO goals

- Capture local tattoo intent by city and style.
- Convert portfolio viewers into qualified booking requests.
- Build trust through structured artist, service, review, FAQ, and portfolio metadata.
- Make nomadic travel dates discoverable.

## Site architecture

Planned public routes:
- `/`
- `/portfolio`
- `/booking`
- `/travel`
- `/aftercare`
- `/faq`
- `/contact`
- `/cities/[citySlug]` — implemented as static demo routes in Phase 3
- `/styles/[styleSlug]` — implemented as static demo routes in Phase 3
- `/guest-spots/[citySlug]/[dateSlug]`
- `/flash/[dropSlug]`

## Metadata requirements

Each public page should include:
- Unique title.
- Meta description.
- Canonical URL.
- Open Graph image.
- Twitter card metadata.
- Robots rules.

## Structured data targets

- Person for artist identity.
- LocalBusiness or TattooParlor for studio/local presence where valid.
- Service for tattoo services/styles.
- ImageObject for portfolio items.
- FAQPage for FAQs.
- Review for testimonials.
- Event for guest spot/travel dates where appropriate.

## City landing page strategy

Phase 3 now includes static demo city pages from `demoSeoCityPages`. Production city pages should be database-backed per tenant and include:
- Artist availability dates.
- Guest spot studio if public.
- Style specialties offered in that city.
- Portfolio filtered by city/style.
- Booking CTA.
- FAQ localized to travel/guest spot logistics.
- Internal links to portfolio/style/aftercare pages.

## Style landing page strategy

Phase 3 now includes static demo style pages from `demoSeoStylePages`. Production style pages should be database-backed per tenant and include:
- Description of style.
- Portfolio filtered by style.
- Placement/size guidance.
- Budget and session expectations.
- Booking CTA.
- FAQs.

## Image SEO workflow

For each portfolio image:
- Artist-approved alt text (pending legal review).
- Style tags.
- Placement.
- Fresh/healed label.
- City/studio metadata if public.
- Dimensions and optimized derivatives.
- Attribution tracking ID.

## Technical SEO checklist

- `app/sitemap.ts` includes static, city, and style demo routes.
- `app/robots.ts` permits public content and blocks private/API/dashboard paths.
- Canonical URLs use tenant public domain.
- No dashboard routes indexed.
- Semantic headings.
- Fast image loading and responsive sizes.
- Accessible form labels.
- Internal linking from home to city/style/portfolio/booking.

## Analytics plan

Track:
- Portfolio image viewed.
- Booking CTA clicked.
- Booking step completed.
- City page viewed.
- Style page viewed.
- Guest spot campaign viewed.
- Deposit completed.
- Booking accepted.

Portfolio-to-booking attribution should be stored with the booking request.


## Phase 2 note

The Prisma schema now includes `SeoCityPage`, `SeoStylePage`, `SeoRedirect`, portfolio attribution keys, tattoo styles, travel cities, reviews, and portfolio image metadata needed for the SEO engine. Static demo public routes now exist, but database-backed public routes and database-backed sitemap generation remain unimplemented.


## Phase 3 note

The public site now renders static city/style pages, homepage JSON-LD, FAQ schema, portfolio ImageObject schema, and travel Event schema from demo content. This is still not a production SEO engine because no database-backed tenant content, canonical host resolver, image derivative pipeline, analytics events, Core Web Vitals evidence, crawl validation, or Search Console verification exists.

## Phase 4 note

The booking flow now exposes a richer `/booking` experience and `/booking/confirmation` preview. Production SEO should treat `/booking` as an indexable conversion page only after form UX, accessibility, and performance are verified. `/booking/confirmation` should likely become `noindex` or only render after a real request token once persistence is implemented (provider integration blocked), because production confirmation pages may contain client-specific information. The current static confirmation preview contains no private data.


## Phase 5 dashboard SEO note

The new dashboard routes must remain private/noindex behind authentication once auth is implemented. Public SEO remains the responsibility of `apps/web`; dashboard SEO manager routes are admin tooling only and must not leak draft/local SEO content or private tenant analytics publicly.


## Phase 10 note

Phase 10 added `@inkroute/seo` as a dependency-light SEO engine scaffold plus static web/dashboard preview surfaces. It now models route records, index/noindex state, canonical URLs, metadata drafts, sitemap plans, city/style content briefs, image SEO fields, internal-link suggestions, Search Console setup drafts, and revalidation plans.

Production SEO remains blocked by database-backed publishing, tenant-domain canonical resolution, Search Console verification/submission, structured-data validation, crawl/Lighthouse/axe evidence, analytics ingestion, real image optimization, and app build/runtime verification. These are tracked in `GAP-071` through `GAP-078` plus `GAP-030`.
