# Phase 10 — SEO Engine

## Status

**Partially implemented / scaffolded / untested in app runtime.**

Phase 10 expands InkRoute from static SEO pages into a dependency-light SEO engine scaffold. It includes route records, canonical metadata drafts, sitemap planning, structured-data graph composition, internal-link recommendations, city/style content briefs, image SEO fields, Search Console setup drafts, and publish/revalidation plans. It does **not** implement live CMS/database persistence, Search Console API integration, crawl validation, Lighthouse evidence, or production publishing.

## Source review performed before coding

Before implementation, all markdown source files in the Phase 9 artifact were enumerated and read for roadmap, architecture, gap, and handoff context. Phase 10 was selected because `ROADMAP.md`, `SEO_PLAN.md`, `ARCHITECTURE.md`, `GAP_TRACKER.md`, and the Phase 9 closeout identified the SEO Engine as the next best codeable task inside this ChatGPT environment.

Reviewed markdown inventory: 35 files.

## Implemented in this phase

### `@inkroute/seo`

Expanded `packages/seo/src/index.ts` with dependency-light helpers for:

- SEO route records and publication/index state.
- Canonical URL normalization.
- Metadata draft generation for title, description, canonical, robots, and Open Graph.
- Sitemap entry and sitemap-plan generation.
- SEO audit heuristics for title length, description length, canonical format, and city context.
- Internal-link recommendations between home, booking, city pages, and style pages.
- City landing page content briefs.
- Style landing page content briefs.
- Portfolio image SEO fields and ImageObject structured data.
- Revalidation plan drafts for Next route/tag revalidation.
- Search Console property setup drafts.
- Publication checklist generation.
- Website, WebPage, BreadcrumbList, and JSON-LD graph helpers.

Existing Person, Service, TattooParlor, ImageObject, Event, Review, and FAQPage helpers were preserved.

### Web app

Added `apps/web/lib/seoEngine.ts` with a static public SEO route inventory for:

- Homepage.
- About.
- Portfolio.
- Booking.
- Travel.
- Aftercare.
- FAQ.
- Contact.
- City pages.
- Style pages.
- Noindex system pages for confirmation/deposit previews.

Updated `apps/web/app/sitemap.ts` to generate the sitemap from the SEO route records via `@inkroute/seo`.

Added static preview route boundaries:

- `GET /api/public/[tenantSlug]/seo-preview`
- `GET /api/public/[tenantSlug]/sitemap-preview`

Both return static demo data and explicitly identify production gaps.

### Dashboard

Added `apps/dashboard/lib/seoDemo.ts` and upgraded `apps/dashboard/app/seo/page.tsx` to show:

- Route inventory.
- Sitemap counts.
- SEO audit scores.
- City content briefs.
- Style content briefs.
- Internal-link opportunities.
- Portfolio image SEO queue.
- Metadata draft preview.
- Revalidation plan preview.
- Search Console boundary card.
- Disabled publishing actions.

### Docs and gap tracker

Updated `GAP_TRACKER.md`, `ROADMAP.md`, `SEO_PLAN.md`, `API_CONTRACTS.md`, `ARCHITECTURE.md`, `README.md`, `TESTING_PLAN.md`, `FILE_TREE.md`, and handoff files.

## Implemented

- Dependency-light SEO business logic in `@inkroute/seo`.
- Static web SEO route inventory.
- Static sitemap plan generation.
- Static dashboard SEO command center.
- Static public SEO preview API routes.
- Documentation and handoff updates.

## Scaffolded only

- Search Console integration draft.
- CMS/database-backed SEO publishing.
- Sitemap submission/revalidation runtime.
- Duplicate canonical detection across tenants.
- Analytics ingestion and attribution persistence.
- Schema validation and crawl auditing.

## Verification run here

Passed:

```bash
npx tsc --noEmit -p packages/types/tsconfig.json
npx tsc --noEmit -p packages/config/tsconfig.json
npx tsc --noEmit -p packages/booking/tsconfig.json
npx tsc --noEmit -p packages/payments/tsconfig.json
npx tsc --noEmit -p packages/calendar/tsconfig.json
npx tsc --noEmit -p packages/notifications/tsconfig.json
npx tsc --noEmit -p packages/mobile/tsconfig.json
npx tsc --noEmit -p packages/seo/tsconfig.json
```

Also verified:

- All JSON files parse.
- No unresolved task-marker comments were introduced.
- Markdown source files were reviewed before coding.

## Blocked or unverified in this environment

The following remain blocked because dependencies, app runtime, Postgres, browser tooling, and external provider credentials are unavailable here:

- `pnpm install`.
- Next.js web/dashboard typecheck and build.
- API route runtime tests.
- Browser route smoke tests.
- Lighthouse/Core Web Vitals.
- axe accessibility testing.
- Rich Results/structured data validation.
- Search Console property verification and sitemap submission.
- Database-backed SEO CMS mutations.
- Public cache revalidation.
- SEO analytics ingestion.
- Tenant-domain canonical host resolution.
- Real image optimization/derivative metadata.

## Gaps added or updated

- `GAP-030` — remains open; Phase 10 improves SEO scaffolding but no browser/audit evidence exists.
- `GAP-071` — database-backed SEO publishing is missing.
- `GAP-072` — canonical/domain/redirect hardening is missing.
- `GAP-073` — schema validation and crawl QA are missing.
- `GAP-074` — SEO analytics and portfolio attribution are missing.
- `GAP-075` — Search Console/sitemap submission integration is missing.
- `GAP-076` — SEO runtime/build verification is missing.
- `GAP-077` — image SEO optimization pipeline is missing.
- `GAP-078` — SEO automated tests are missing.

## Next best task

The next codeable task inside this environment is **Phase 11 — Bug/Crash Reporting System scaffold**: frontend error boundaries, backend error-report route boundaries, error redaction helpers, dashboard triage improvements, Sentry/OpenTelemetry provider boundaries, and agentic bug-fix workflow docs. Live Sentry credentials, source maps, alerts, issue creation, and runtime verification must remain externally gated.
