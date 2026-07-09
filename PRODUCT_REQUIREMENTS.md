# Product Requirements — InkRoute Suite

## Product vision

InkRoute Suite is a tattoo-specific operating system for artists whose bookings are driven by portfolio trust, tattoo-specific intake quality, city availability, guest spots, deposits, and aftercare—not generic appointment scheduling.

## Target users

### Solo tattoo artist
- Needs a polished website, portfolio, client intake, deposits, reminders, and simple calendar management.
- Values affordability, speed, visual polish, and fewer admin messages.

### Nomadic tattoo artist
- Needs city-by-city availability, travel schedule publishing, guest spot campaigns, city waitlists, time zone handling, and mobile management.
- Values mobility, fast updates, and booking demand before arriving in a city.

### Guest-spot artist
- Needs temporary location pages, flash availability, deposit collection, and studio-specific instructions.
- Values quick campaign pages and precise client prep.

### Private studio
- Needs selective booking intake, consent storage, client CRM, portfolio trust, policies, and limited public availability.
- Values privacy, client quality, and premium brand control.

### Multi-artist parlor
- Needs multi-tenant/multi-role architecture, artist pages, shared studio calendar, assistants, deposits, client timeline, and analytics.
- Values admin visibility, brand consistency, and operational control.

## Positioning

**InkRoute Suite helps tattoo artists convert portfolio interest into qualified, deposit-backed appointments across cities, studios, and travel schedules.**

Competitive positioning:
- More tattoo-specific than Calendly or Acuity.
- More conversion-focused than a generic portfolio site.
- More mobile/travel-aware than salon booking tools.
- More operationally complete than link-in-bio intake forms.

## Unique differentiators

| Differentiator | Description | MVP | v1 | v2 |
| --- | --- | --- | --- | --- |
| Nomad Mode | Push upcoming cities, guest spots, and flash availability to site/app | Yes | Yes | Yes |
| City Waitlists | Clients join city-specific waitlists and get notified when dates open | Scaffold | Yes | Yes |
| Flash Drop Booking | Limited flash designs with bookable windows | No | Yes | Yes |
| Style Match Intake | Intake maps concept/style references to session type | Scaffold | Yes | Yes |
| Tattoo Readiness Score | Flags incomplete/misaligned requests before review | Phase 4 local scoring scaffold | Yes | AI-assisted optional |
| Aftercare Automation | Scheduled aftercare messages and check-ins | Scaffold | Yes | Yes |
| Healed Photo Follow-Up | Requests healed photos after configurable delay | No | Yes | Yes |
| Client Timeline | Intake, consent, payment, photo, note, and message history | Scaffold | Yes | Yes |
| Travel Revenue Forecast | Estimates demand/deposits by city | No | Scaffold | Yes |
| Portfolio Attribution | Tracks which portfolio pieces drive requests | Scaffold | Yes | Yes |
| Guest Spot Campaign Builder | Creates city landing page and announcement from travel plan | Scaffold | Yes | Yes |
| Deposit Policy Engine | Rules by city, session, client history, appointment type | Scaffold | Yes | Yes |

## MVP scope

MVP must prove:
1. A client can understand the artist, trust the work, view travel/city availability, and submit a strong booking request.
2. The artist can review requests, manage travel schedule, and update portfolio content.
3. The architecture can support multiple tenants later.

MVP includes:
- Public website shell
- Portfolio gallery model and demo UI
- Booking request form scaffold with Phase 4 client-side multi-step preview, readiness scoring, and non-persistent API validation boundary
- Travel schedule display
- Dashboard shell
- Mobile app shell
- Shared types/validators
- Prisma/Postgres schema foundation
- SEO technical plan and structured data utilities
- Gap tracker and handoff docs

MVP excludes until credentialed implementation:
- Live Stripe charges [blocked]
- Live auth sessions
- Live file upload/storage
- Live email/SMS
- Live calendar sync
- Native app builds
- Production deployment

## v1 scope

- Implement full booking lifecycle from request to accepted appointment.
- Stripe deposit sessions and webhook reconciliation.
- Real tenant/auth/RBAC.
- Portfolio CMS with image upload.
- Travel schedule manager and public city pages.
- Email notifications.
- Sentry error capture.
- Playwright booking flow tests.
- Initial production deployment.

## v2 scope

- Multi-artist studio management.
- SMS automation.
- Flash drops.
- City waitlists.
- Client portal.
- Healed photo follow-up.
- Revenue forecasting.
- AI-assisted captions, alt text, summaries, and aftercare drafts with explicit opt-in.

## Conversion funnel

1. Discovery: search, Instagram, referral, guest spot announcement, city landing page.
2. Trust: homepage, portfolio, healed/fresh labels, testimonials, bio/story, FAQs.
3. Intent: city availability, styles, budget guidance, guest spot schedule.
4. Intake: guided request form with reference image metadata, placement, size, medical/policy acknowledgments, and explicit upload/payment boundaries.
5. Qualification: Tattoo Readiness Score and artist review.
6. Commitment: deposit request and appointment confirmation.
7. Preparation: prep instructions and reminders.
8. Retention: aftercare, healed photo request, testimonial, repeat booking.

## Phase 4 booking flow requirement status

Implemented as scaffolded code:
- `/booking` contains a client-side guided request preview.
- `/booking/confirmation` contains a static confirmation preview.
- `@inkroute/booking` contains booking flow steps, local readiness score logic, travel CTA helper, and lifecycle transitions.
- `POST /api/public/[tenantSlug]/booking-requests` validates input shape and returns `501` because persistence and provider integrations are not live.

Still required before production:
- Persist tenant-scoped booking requests and booking state events.
- Add rate limiting, bot protection, and abuse monitoring.
- Implement signed private reference uploads.
- Queue transactional notifications.
- Hand off to Stripe only when deposit policy is configured [gated].
- Add dashboard/mobile request review surfaces.
- Replace demo legal/policy copy after attorney review.

## SaaS pricing ideas

| Plan | Audience | Draft price hypothesis | Included |
| --- | --- | --- | --- |
| Solo | Independent local artist | $29-$49/mo | Website, booking intake, portfolio, deposits |
| Nomad | Traveling/guest spot artist | $59-$89/mo | Solo + Nomad Mode, city pages, waitlists |
| Studio | Private studio or small parlor | $129-$249/mo | Multi-artist, roles, shared calendar, CRM |
| Growth | High-volume studios | $299+/mo | Analytics, automation, campaign tools, priority support |

Pricing is unvalidated and must be tested with real artists before launch.

## Core risks and assumptions

| Risk | Assumption | Validation plan |
| --- | --- | --- |
| Artists resist new workflow | Tattoo-specific intake saves enough admin time | Interview 10 artists; compare request quality |
| Clients abandon long intake | Guided mobile UX reduces friction | Track form completion and drop-off |
| SEO takes time | City/style pages compound over months | Publish demo pages, monitor rankings |
| Payments increase liability | Stripe-hosted flows reduce PCI scope | Use Stripe Checkout/Payment Links first |
| Medical/consent language has legal risk | Templates need legal review | Mark legal review as launch blocker |
| Multi-tenant complexity slows MVP | Tenant-first schema avoids rewrite later | Keep MVP single tenant in UI but tenant-scoped in data |


## Phase 5 dashboard requirement status

The dashboard requirement set is now represented by static demo routes: overview metrics, booking inbox/detail, appointment calendar, travel schedule manager, portfolio manager, client CRM/detail, deposits/payments, intake/consent forms, SEO page manager, notification templates, error reports, release/feature flag settings, and tenant settings. This is a UX/code scaffold only. Live authentication, database-backed content, mutations, provider integrations, privacy controls, and tests remain tracked in `GAP-036` through `GAP-041`.

## Phase 6 mobile app requirement status

Phase 6 partially implements the artist mobile app as a static Expo scaffold. The app now demonstrates the intended mobile workflow across auth posture, daily command center, booking request review, appointment schedule, client profiles, Nomad Mode city updates, portfolio upload metadata, notification templates, offline notes queue, and crash/update system status. It is not production-ready: real auth, biometric unlock, API sync, push notifications, offline encrypted persistence, secure uploads, crash reporting, mobile releases, and device QA remain open in `GAP-042` through `GAP-048`.


## Phase 9 notifications/messaging implementation note

Phase 9 partially implements the planned notification and messaging layer as static/helper code. The product now demonstrates booking, deposit, prep, reschedule, cancellation, aftercare, healed-photo, city waitlist, flash-drop, and review messaging across shared templates, dashboard previews, mobile previews, and route boundaries. This does not satisfy production notification requirements: live email/SMS/push providers, message persistence, queueing, delivery logs, preference center, STOP/unsubscribe compliance, provider webhooks, and legal review remain open in `GAP-010` and `GAP-061` through `GAP-069`.

## Phase 11 bug/crash reporting requirement status

Phase 11 partially implements bug/crash reporting as a scaffold: redaction helpers, severity/fingerprint logic, Sentry/OpenTelemetry/GitHub boundary records, global error fallback components, fallback API route boundaries, dashboard triage previews, and mobile crash-report previews now exist. It does not satisfy production observability requirements: live SDKs, source maps, crash capture, provider webhook verification, database persistence, alert routing, GitHub issue automation, and test evidence remain open in `GAP-079` through `GAP-086`.

## Phase 12 release/auto-update requirement status

Implemented/scaffolded:

- release candidate and release gate helper logic
- feature flag decision helper logic
- dashboard release control preview
- mobile OTA/update status preview
- dry-run GitHub Actions release governance workflow

Not implemented:

- live SaaS release control plane
- persisted feature flags
- production deploy automation
- mobile OTA publishing
- rollback execution
- release-linked incident workflows

This is enough to keep future SaaS launch operations visible to agents, but it is not a production release system.
