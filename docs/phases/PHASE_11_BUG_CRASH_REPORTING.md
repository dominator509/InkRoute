# Phase 11 — Bug/Crash Reporting System

## Status

**Partially implemented / scaffolded / untested in app runtime.**

Phase 11 adds a dependency-light observability layer, error-report route boundaries, dashboard/mobile previews, and error fallback components. It does not install or configure live Sentry SDKs, OpenTelemetry exporters, database persistence, alert delivery, GitHub issue automation, or runtime validation.

## Source review performed before coding

Before implementation, the Phase 10 ZIP artifact was unpacked and all markdown source files were enumerated and reviewed for roadmap, architecture, gap, and handoff context. Phase 11 was selected because `ROADMAP.md`, `BUG_CRASH_REPORTING_PLAN.md`, `ARCHITECTURE.md`, `GAP_TRACKER.md`, and the Phase 10 closeout identified bug/crash reporting as the next best codeable task inside this ChatGPT environment.

Reviewed markdown inventory: 36 files.

## Implemented in this phase

### `@inkroute/observability`

Added `packages/observability/src/index.ts` with:

- Redaction helpers for email, phone, card-like values, provider tokens, and high-risk metadata keys.
- Metadata redaction with depth/size protection.
- Severity classification across web, dashboard, mobile, API, worker, and webhook surfaces.
- Stable stack hashing and issue fingerprinting without Node-only dependencies.
- Sanitized `ObservabilityReportDraft` generation.
- Sentry, OpenTelemetry, fallback ingest, GitHub, and alert provider boundary records.
- Alert-route draft helper.
- Agentic bug-fix workflow helper.
- Sanitized GitHub issue draft helper.
- Sentry setup checklists for Next.js and React Native/Expo.
- Static demo report drafts.

### Web app

Added:

- `apps/web/app/global-error.tsx`
- `apps/web/lib/errorReporting.ts`
- `apps/web/app/api/public/[tenantSlug]/error-reports/route.ts`
- `apps/web/app/api/webhooks/sentry/route.ts`

The public fallback route validates JSON, redacts payloads, adds request correlation metadata, applies local bot/rate-limit decisions, persists `ErrorReport`/`AbuseEvent`/`AuditLog` rows when the DB path is available, and fails closed for production local fallback. Distributed rate-limit, provider forwarding, live Postgres tenant-isolation, CI, and no-PII proof remain gated.

The Sentry webhook route requires a provider signature, verifies `SENTRY_WEBHOOK_SECRET` when configured, records provider delivery/idempotency and audit reconciliation when tenant ownership is available, and fails closed in production without durable persistence. Live Sentry replay, no-PII, and provider proof remain gated.

### Dashboard

Added:

- `apps/dashboard/app/global-error.tsx`
- `apps/dashboard/app/api/error-reports/route.ts`
- `apps/dashboard/lib/errorDemo.ts`
- Expanded `apps/dashboard/app/errors/page.tsx`
- Minor CSS support in `apps/dashboard/app/globals.css`

The dashboard error page now shows:

- Static sanitized report queue.
- Severity/status/redaction/fingerprint data.
- Alert-route previews.
- Agentic bug-fix workflow preview.
- Sanitized GitHub issue draft preview.
- Sentry setup checklist.
- Provider boundary cards.
- Disabled operational actions.

### Mobile

Expanded:

- `apps/mobile/src/lib/mobileDemo.ts`
- `apps/mobile/src/screens/SystemStatusScreen.tsx`

The mobile system screen now shows a sanitized crash-report draft, alert route preview, React Native/Expo Sentry setup checklist, and mobile observability provider boundaries.

### Docs and configuration

Updated:

- `BUG_CRASH_REPORTING_PLAN.md`
- `API_CONTRACTS.md`
- `ENVIRONMENT_VARIABLES.md`
- `.env.example`
- `SECURITY.md`
- `TESTING_PLAN.md`
- `DEPLOYMENT.md`
- `README.md`
- `ARCHITECTURE.md`
- `PRODUCT_REQUIREMENTS.md`
- `ROADMAP.md`
- `GAP_TRACKER.md`
- `HANDOFF_TO_CODEX.md`
- `HANDOFF_TO_JULES.md`
- `HANDOFF_TO_CLAUDE_CODE.md`
- `FILE_TREE.md`

## Implemented

- Dependency-light observability helper package.
- Redaction and severity/fingerprint logic.
- Error-report and Sentry webhook route boundaries.
- Web/dashboard global error fallback components.
- Dashboard observability command center.
- Mobile crash-reporting preview.
- Environment variable documentation for Sentry, OTEL, fallback ingest, alerts, and GitHub issue automation.

## Scaffolded only

- Live Sentry SDK capture.
- Next.js source-map upload.
- React Native/Expo source-map/debug-symbol upload.
- OpenTelemetry exporter.
- ErrorReport persistence.
- Public fallback ingest hardening.
- Provider webhook verification.
- Alert delivery.
- GitHub issue creation.
- Agentic assignment workflow.

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
npx tsc --noEmit -p packages/observability/tsconfig.json
```

Also verified:

- All JSON files parse.
- No unresolved task-marker comments were introduced.
- Phase 11 ZIP artifact was rebuilt successfully.

## Blocked or unverified in this environment

The following remain blocked because dependencies, app runtime, browser/device tooling, provider credentials, and Postgres are unavailable here:

- `pnpm install`.
- Next.js web/dashboard typecheck and build.
- Expo runtime/device tests.
- Browser error-boundary smoke tests.
- API route runtime tests.
- Sentry SDK setup.
- Sentry source-map/debug-symbol upload.
- Webhook signature verification.
- ErrorReport persistence.
- Alert delivery.
- GitHub issue creation.
- OpenTelemetry export.
- Unit and route tests.

## Gaps added or updated

Added:

- `GAP-079` — observability runtime verification missing.
- `GAP-080` — Sentry SDK implementation missing.
- `GAP-081` — error persistence and ingest hardening missing.
- `GAP-082` — provider webhook verification/reconciliation missing.
- `GAP-083` — alerting and escalation missing.
- `GAP-084` — OpenTelemetry/logging pipeline missing.
- `GAP-085` — agentic issue automation missing.
- `GAP-086` — observability automated tests missing.

## Next best task

The next codeable task inside this environment is **Phase 12 — Auto-Update and Release System scaffold**: expand release/feature-flag helpers, release notes/rollback plan, migration compatibility checks, dashboard release controls, mobile OTA/EAS Update boundaries, and CI/CD deployment guardrails while keeping real deployment infrastructure externally gated.
