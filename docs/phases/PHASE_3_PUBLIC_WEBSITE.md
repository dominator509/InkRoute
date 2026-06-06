# Phase 3 — Public Website

## Status

Partially implemented as a static, demo-data public website. Runtime build verification remains blocked by missing dependencies in this environment.

## Implemented in this phase

- Upgraded `apps/web` from scaffold pages to a premium, mobile-first public artist website.
- Added shared public web components:
  - `CtaBand`
  - `JsonLdScript`
  - `PortfolioCard`
  - `SectionIntro`
  - `TravelStopCard`
- Added public utility formatting under `apps/web/lib/format.ts`.
- Added a new `/about` artist story page.
- Rebuilt homepage sections for:
  - hero/conversion CTA
  - trust signals
  - featured portfolio
  - Nomad Mode travel schedule
  - Tattoo Readiness Score preview
  - client journey/process
  - testimonials
  - FAQ
  - final booking CTA
- Rebuilt `/portfolio` as a static metadata-rich gallery using demo portfolio items.
- Rebuilt `/travel` with travel cards and city page links.
- Rebuilt `/aftercare` with review-required educational copy and aftercare automation positioning.
- Rebuilt `/faq` with FAQPage JSON-LD from shared demo content.
- Rebuilt `/contact` with a disabled static form and explicit live-form boundary.
- Rebuilt `/booking` with a disabled static booking preview and explicit Phase 4 boundary.
- Added static dynamic routes:
  - `/cities/[citySlug]`
  - `/styles/[styleSlug]`
- Updated `apps/web/app/sitemap.ts` to include static, city, and style routes.
- Updated `apps/web/app/robots.ts` with additional private/API/dashboard disallow rules.
- Expanded `packages/config/src/index.ts` with public website demo content:
  - richer artist bio
  - additional travel stop
  - expanded portfolio inventory
  - public FAQ data
  - testimonials
  - city SEO page data
  - style SEO page data
  - booking intake preview
  - aftercare steps
- Expanded `packages/seo/src/index.ts` with additional structured data helper boundaries:
  - tattoo service schema
  - local tattoo business schema
  - review schema

## Implemented

- Static public site route structure.
- Static city/style landing page generation from shared demo config.
- Static sitemap route inventory.
- Public JSON-LD rendering for artist, portfolio images, travel events, and FAQ.
- Responsive dark editorial CSS for the public web app.
- Demo copy that clearly labels non-live payment, booking, upload, and legal boundaries.

## Scaffolded only

- Dynamic database-backed public content.
- Tenant/domain resolution for public sites.
- Live booking form submission.
- Reference image uploads.
- Contact form submission.
- Stripe deposit collection.
- City waitlists.
- Flash drop booking.
- Real portfolio image storage and optimization.
- Live review/testimonial CMS.
- SEO analytics/event tracking.

## Verification performed in this environment

- Reviewed all markdown files from the extracted Phase 2 ZIP before coding.
- Ran TypeScript compiler successfully for:
  - `packages/types`
  - `packages/config`
  - `packages/seo`
- Confirmed no unresolved task-placeholder markers were introduced.

## Verification blocked in this environment

- `apps/web` typecheck/build cannot be verified because `next`, `react`, and React type packages are not installed.
- `pnpm install` remains blocked by the existing dependency/runtime gap.
- No browser rendering, Lighthouse, axe, Core Web Vitals, Playwright, or production build checks were run.
- No screenshot or visual QA was possible in this environment.

## New or updated gaps

- `GAP-006` updated to reflect Phase 3 static public website implementation.
- `GAP-026` added for static public site data not being API/database-backed.
- `GAP-027` added for Phase 3 web build/runtime verification not being run.
- `GAP-028` added for placeholder portfolio imagery and missing image optimization/storage pipeline.
- `GAP-029` added for disabled/non-persistent booking and contact forms.
- `GAP-030` added for missing SEO/accessibility/performance audit evidence.

## Next phase recommendation

Inside this ChatGPT environment, the next best codeable task is Phase 4 booking flow scaffolding with a client-side multi-step form, Zod-shaped field definitions, a booking state-machine helper, and a non-submitting confirmation preview. Codex/Jules/local terminal should first verify dependency installation and the Phase 3 Next.js build before closing web runtime gaps.
