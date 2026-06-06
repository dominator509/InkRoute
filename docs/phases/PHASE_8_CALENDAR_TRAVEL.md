# Phase 8 — Calendar and Location/Travel Schedule

## Status

**Partially implemented / scaffolded / untested in app runtime.**

Phase 8 expanded the calendar/travel scheduling layer as dependency-light TypeScript helpers plus static web/dashboard API/UI boundaries. It does not connect to Google Calendar, persist availability holds, perform live cache revalidation, or write to Postgres.

## Source review performed before coding

Before implementation, all markdown source files in the Phase 7 artifact were enumerated and reviewed for roadmap, architecture, gap, and handoff context. Phase 8 was selected because `ROADMAP.md`, `ARCHITECTURE.md`, `GAP_TRACKER.md`, and the Phase 7 closeout identified calendar/location/travel scheduling as the next best codeable phase.

## Implemented in this phase

### `@inkroute/calendar`

Expanded `packages/calendar/src/index.ts` with:

- Calendar provider/status/direction types.
- `CalendarTimeBlock` and buffered block helpers.
- Buffer-aware conflict detection.
- Availability slot generation from `AvailabilityWindow` records.
- Appointment/travel-to-calendar block helpers.
- Google Calendar event draft payloads.
- Google FreeBusy request draft payloads.
- Calendar sync-plan metadata for internal, ICS, and Google providers.
- Travel publish-plan generation for Nomad Mode.
- Signed ICS feed draft metadata.
- Improved travel ICS output with `CALSCALE:GREGORIAN`, `METHOD:PUBLISH`, `STATUS:CONFIRMED`, and `TRANSP:OPAQUE`.

### Web app

Added static/demo public calendar boundaries:

- `GET /api/public/[tenantSlug]/calendar/[artistSlug]/travel.ics`
  - Returns static demo travel schedule ICS.
  - Marks the feed as static and unsigned with response headers.
  - Does not require or verify signed feed tokens.
- `GET /api/public/[tenantSlug]/availability-preview`
  - Returns static demo availability slots and conflict previews.
  - Does not persist holds or reserve slots.
- Updated `/travel` with a demo ICS feed link and signed-feed draft path.

### Dashboard

Expanded dashboard calendar/travel surfaces:

- `/calendar` now shows sync-plan cards, appointments, generated slots, conflict preview, buffered blocks, ICS preview, signed-feed draft, Google event draft, and FreeBusy draft.
- `/travel` now shows publish-path/revalidation-tag previews, waitlist-notification candidates, and the intended real-time Nomad Mode publish workflow.
- `apps/dashboard/lib/demo.ts` now exports Phase 8 demo calendar slots, conflicts, sync plans, travel publish plans, and provider payload drafts.

## Scaffolded only

- Google Calendar OAuth.
- Google FreeBusy execution.
- Google event insert/update/delete.
- Incremental sync-token storage and refresh.
- Push channel/webhook verification.
- Signed private ICS feed tokens.
- Persisted availability windows, holds, and appointments.
- Transactional conflict prevention.
- Real-time public site revalidation.
- City waitlist matching and notifications.
- Timezone/DST/recurrence hardening.
- Calendar route/app runtime tests.

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
```

Also verified:

- All JSON files parse.
- No unresolved task-marker comments were introduced.
- Phase 8 ZIP artifact was rebuilt successfully.

## Blocked or unverified in this environment

The following remain blocked because dependencies, app runtime, live credentials, and Postgres are unavailable here:

- `pnpm install`.
- `pnpm --filter @inkroute/web typecheck`.
- `pnpm --filter @inkroute/web build`.
- `pnpm --filter @inkroute/dashboard typecheck`.
- `pnpm --filter @inkroute/dashboard build`.
- Browser smoke tests for `/travel`, `/calendar`, and `/travel.ics` route behavior.
- Google Calendar OAuth and provider sync.
- ICS import tests in Google/Apple/Outlook calendars.
- Postgres persistence and migrations.
- Timezone/DST test matrix.
- Availability hold concurrency tests.

## Files changed

- `packages/calendar/src/index.ts`
- `apps/dashboard/lib/demo.ts`
- `apps/dashboard/app/calendar/page.tsx`
- `apps/dashboard/app/travel/page.tsx`
- `apps/dashboard/app/globals.css`
- `apps/web/app/travel/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/app/api/public/[tenantSlug]/calendar/[artistSlug]/travel.ics/route.ts`
- `apps/web/app/api/public/[tenantSlug]/availability-preview/route.ts`
- `apps/web/package.json`
- `README.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `API_CONTRACTS.md`
- `ENVIRONMENT_VARIABLES.md`
- `TESTING_PLAN.md`
- `DEPLOYMENT.md`
- `GAP_TRACKER.md`
- `HANDOFF_TO_CODEX.md`
- `HANDOFF_TO_JULES.md`
- `HANDOFF_TO_CLAUDE_CODE.md`
- `FILE_TREE.md`

## New or updated gaps

- `GAP-009` updated for Phase 8 partial calendar implementation.
- `GAP-055` added for unsigned/unsecured ICS feed production work.
- `GAP-056` added for missing persisted availability and conflict guard service.
- `GAP-057` added for missing Google Calendar OAuth/sync/webhook implementation.
- `GAP-058` added for timezone/DST/recurrence QA.
- `GAP-059` added for missing calendar/travel automated tests.
- `GAP-060` added for missing real-time Nomad Mode publishing pipeline.

## Next phase

Phase 9 should expand notifications and messaging: email/SMS/push template lifecycle, queue/delivery log helpers, booking/deposit/prep/cancellation/aftercare/healed-photo sequences, consent-gated routing, provider boundaries, and dashboard/mobile/web surfaces.
