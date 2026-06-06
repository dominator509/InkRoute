# Bug and Crash Reporting Plan

## Current status

**Phase 11 is partially implemented / scaffolded / untested in app runtime.**

InkRoute Suite now has a dependency-light observability package, static dashboard/mobile previews, web/dashboard global error fallback components, and route/webhook boundaries. No live Sentry SDK, OpenTelemetry exporter, alert provider, database persistence, issue creation, or runtime verification is complete.

## Phase 11 implemented pieces

### Shared package

`packages/observability/src/index.ts` implements:

- Redaction helpers for emails, phone numbers, provider tokens, card-like strings, and high-risk metadata keys.
- Error severity classification for web, dashboard, mobile, API, worker, and webhook surfaces.
- Stable stack/fingerprint hashing without Node-only dependencies.
- Sanitized `ObservabilityReportDraft` creation.
- Sentry, OpenTelemetry, self-hosted fallback, GitHub, and alert provider boundary records.
- Alert-routing draft logic.
- Sanitized GitHub issue draft generation.
- Agentic bug-fix workflow steps: classify, reproduce, create issue, patch, verify, and update gaps.
- Sentry setup checklists for Next.js and React Native/Expo.

### App boundaries

Implemented scaffold files:

- `apps/web/app/global-error.tsx`
- `apps/dashboard/app/global-error.tsx`
- `apps/web/app/api/public/[tenantSlug]/error-reports/route.ts`
- `apps/dashboard/app/api/error-reports/route.ts`
- `apps/web/app/api/webhooks/sentry/route.ts`
- `apps/dashboard/lib/errorDemo.ts`
- `apps/dashboard/app/errors/page.tsx`
- `apps/mobile/src/screens/SystemStatusScreen.tsx`

These files are **not production-ready**. The API routes intentionally return `501` after building redacted drafts because persistence, rate limiting, tenant resolution, provider verification, alerts, and issue sync are not wired.

## Intended production architecture

```text
Browser / Next server / Expo app / API route / webhook
  -> SDK or fallback reporter
  -> redaction + fingerprinting
  -> Sentry and/or OpenTelemetry provider
  -> tenant-scoped ErrorReport row
  -> dashboard triage queue
  -> severity alert route
  -> sanitized GitHub issue draft
  -> agentic handoff
  -> verified fix + regression test
```

## Redaction policy

Never log or send raw values for:

- Client email addresses or phone numbers.
- Medical notes, allergies, medication, diagnosis, or pain/safety details.
- Consent signatures or identity documents.
- Stripe/payment/card data.
- Cookies, authorization headers, provider signatures, access tokens, refresh tokens, API keys, or Sentry/Twilio/Stripe secrets.
- Private reference image URLs or object keys.

Before production, SDK `beforeSend`/event processors must use equivalent redaction rules to the Phase 11 helpers and must be verified with synthetic sensitive payloads.

## Sentry plan

Sentry is the preferred first production provider because it covers web, dashboard, API/server, and React Native/Expo crash capture. Phase 11 only documents and scaffolds this boundary.

Production implementation requirements:

1. Install `@sentry/nextjs` in `apps/web` and `apps/dashboard`.
2. Add client, server, and edge initialization files for both Next.js apps.
3. Add `instrumentation.ts` and `onRequestError` capture in each Next.js app.
4. Configure source-map uploads through CI only, never committing tokens.
5. Configure `beforeSend` redaction and tenant/release/environment tags.
6. Install/configure `@sentry/react-native` for Expo mobile.
7. Configure Metro/app plugin integration and EAS source-map/debug-symbol upload.
8. Trigger safe synthetic errors in web, dashboard, API, and mobile.
9. Confirm stack traces, releases, source maps, and redaction behavior.

Sentry’s current Next.js docs describe separate client/server/edge initialization files, request-error capture, source-map upload with `SENTRY_AUTH_TOKEN`, and App Router `global-error.tsx` capture. Sentry’s React Native docs describe using the wizard/manual setup, Expo plugin/Metro integration, wrapping the root component, and source-map/debug-symbol upload for production builds.

## OpenTelemetry plan

OpenTelemetry is optional for richer trace/log correlation after the core crash pipeline works.

Production implementation requirements:

- Define `OTEL_SERVICE_NAME` per app.
- Configure OTLP endpoint/headers in secrets.
- Add request ID propagation to API routes.
- Emit structured logs without PII.
- Correlate traces/logs with `ErrorReport.stackHash` or request ID.
- Document sampling and retention.

## Fallback self-hosted plan

The fallback route is useful if Sentry is not enabled or as a backup incident queue, but it must be hardened before production.

Required before enabling fallback ingest:

- Public tenant/domain resolver.
- Rate limiting and bot protection.
- Request ID and abuse monitoring.
- Auth/RBAC for dashboard query/action endpoints.
- Prisma repository writing redacted `ErrorReport` rows only.
- Alert suppression for sensitive redaction levels.
- Automated tests for invalid JSON, sensitive payloads, and tenant isolation.

## Agentic bug-fix workflow

1. Capture sanitized report.
2. Classify severity and blast radius.
3. Reproduce with seeded/synthetic data only.
4. Draft a privacy-safe GitHub issue.
5. Require human approval before issue creation or provider alert expansion.
6. Assign Codex/Jules/Claude Code with a scoped prompt.
7. Patch smallest affected boundary.
8. Add regression tests.
9. Run typecheck/build/test commands.
10. Summarize root cause, files changed, verification, and remaining gaps.
11. Update `GAP_TRACKER.md`.

## Phase 11 verification status

Verified in this ChatGPT environment:

- Dependency-light TypeScript package can be typechecked after implementation.
- JSON files parse.
- Source markdown files were reviewed before coding.

Not verified here:

- Next.js builds.
- Browser rendering.
- Expo runtime/device crashes.
- Sentry SDK setup.
- Source-map upload.
- Webhook signature verification.
- Database persistence.
- Alert delivery.
- GitHub issue creation.
- Automated tests.

## Active gaps

Phase 11 gaps are `GAP-079` through `GAP-086`. Earlier related gaps remain active: `GAP-011`, `GAP-012`, `GAP-014`, `GAP-036`, `GAP-039`, `GAP-046`, `GAP-047`, and provider/runtime gaps from Phases 7–10.

## Phase 12 release linkage note

Phase 12 adds release candidate, release health, and rollback helper code in `@inkroute/releases`, but observability is not yet linked to deployed release records. Production bug/crash workflows must tag Sentry/ErrorReport records with release version, channel, environment, commit SHA, and deployment artifact IDs. Critical regressions should link back to the active ReleaseRecord and rollback plan. This linkage is tracked in `GAP-093`.
