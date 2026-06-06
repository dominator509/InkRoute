# Testing Plan

## Current status

Dependencies are now installed in this environment, and the workspace verification chain has been executed with partial failures.

### Verification status (2026-06-06)

Executed command chain from `docs/workspace/CODEX_WORKSPACE_PROMPT.md` (rerun at `2026-06-06T07:55:35Z`):

- `corepack enable` PASS (exit `0`)
- `pnpm install` PASS (exit `0`; `pnpm-lock.yaml` present)
- `pnpm workspace:all` PASS (exit `0`)
  - `docs/workspace/manifests/workspace-import-audit.json` (`generatedAt=2026-06-06T14:55:44.361Z`)
  - `docs/workspace/manifests/package-script-audit.json` (`generatedAt=2026-06-06T14:55:44.943Z`)
  - `docs/workspace/manifests/runtime-readiness.json` (`generatedAt=2026-06-06T14:55:45.536Z`, fail)
- `pnpm handoff:all` PASS (exit `0`)
- `pnpm quality:all` PASS (exit `0`)
- `pnpm typecheck` FAIL (`exit 2`)
  - `@inkroute/ui#typecheck` fails with missing `react` types and JSX intrinsic typings in `packages/ui/src/button.tsx` and `packages/ui/src/card.tsx`.
- `pnpm test:unit` FAIL (`exit 1`; 4 of 14 tests failed)
  - `packages/booking/tests/booking-readiness.test.ts` (`Invalid booking lifecycle action complete from status draft`)
  - `packages/releases/tests/feature-flags.test.ts` (`expected 'critical' to be 'high'`)
  - `packages/payments/tests/deposit-policy.test.ts` (`expected 'MARAVALE-2026-00012' to contain 'MARA-VALE'`)
  - `packages/observability/tests/redaction-report.test.ts` (`expected 'high' to be 'critical'`)
- `pnpm test:manifest` PASS (`{"ok":true,"manifestCount":7,"requiredFileCount":15,"declaredSuites":28}`)
- `pnpm --filter @inkroute/web build` FAIL (`exit 1`; unresolved `../../../../lib/seoEngine` imports in public seo preview and sitemap preview routes).
- `pnpm --filter @inkroute/dashboard build` FAIL (`exit 1`; `destination` exact-optional-type mismatch in `apps/dashboard/lib/demo.ts`).

Current test posture after this run: not production-verified; unit and app build failures are scoped and evidence-backed.

### Verification status (2026-06-06 rerun at 08:02:09Z)

Executed command chain from `docs/workspace/CODEX_WORKSPACE_PROMPT.md`:

- `corepack enable` PASS (`exit 0`)
- `pnpm install` PASS (`exit 0`)
- `pnpm workspace:all` PASS (`exit 0`)
- `pnpm handoff:all` PASS (`exit 0`)
- `pnpm quality:all` PASS (`exit 0`)
- `pnpm typecheck` FAIL (`exit 2`)
  - `@inkroute/ui` blocked on `Could not find a declaration file for module 'react'` in `packages/ui/src/button.tsx` and `packages/ui/src/card.tsx`.
- `pnpm test:unit` FAIL (`exit 1`)
  - `packages/booking/tests/booking-readiness.test.ts` — `Invalid booking lifecycle action complete from status draft`
  - `packages/releases/tests/feature-flags.test.ts` — `expected 'critical' to be 'high'`
  - `packages/payments/tests/deposit-policy.test.ts` — `expected 'MARAVALE-2026-00012' to contain 'MARA-VALE'`
  - `packages/observability/tests/redaction-report.test.ts` — `expected 'high' to be 'critical'`
- `pnpm test:manifest` PASS (`exit 0`)
- `pnpm --filter @inkroute/web build` FAIL (`exit 1`)
  - unresolved `../../../../lib/seoEngine` imports in:
    - `app/api/public/[tenantSlug]/seo-preview/route.ts`
    - `app/api/public/[tenantSlug]/sitemap-preview/route.ts`
- `pnpm --filter @inkroute/dashboard build` FAIL (`exit 1`)
  - `apps/dashboard/lib/demo.ts:605:27` exact-optional-property-types mismatch on `destination`.

Current status after this rerun:

- Evidence artifacts captured from the rerun command stream and embedded in `GAP_TRACKER.md`.
- `pnpm-lock.yaml` remains present and tracked.
- Active open blockers remain: `GAP-001`, `GAP-121`, `GAP-122`, `GAP-124`, `GAP-126`, `GAP-130`, `GAP-132`, `GAP-133`.
## Phase 14 implemented testing files

### Configs and scripts

- `vitest.workspace.ts`
- `playwright.config.ts`
- `testing/scripts/phase14-static-check.mjs`
- `testing/scripts/verify-test-manifest.mjs`
- `testing/scripts/print-qa-checklists.mjs`

### Unit test scaffolds

- `packages/booking/tests/booking-readiness.test.ts`
- `packages/payments/tests/deposit-policy.test.ts`
- `packages/calendar/tests/availability-conflicts.test.ts`
- `packages/notifications/tests/delivery-plan.test.ts`
- `packages/seo/tests/seo-engine.test.ts`
- `packages/observability/tests/redaction-report.test.ts`
- `packages/releases/tests/feature-flags.test.ts`
- `packages/security/tests/upload-policy.test.ts`
- `packages/testing/tests/testing-manifest.test.ts`

### E2E and mobile test scaffolds

- `apps/web/tests/e2e/public-booking.spec.ts`
- `apps/dashboard/tests/e2e/dashboard-smoke.spec.ts`
- `apps/mobile/tests/mobile-static.test.ts`

### QA manifests

- `testing/manifests/unit-test-manifest.json`
- `testing/manifests/e2e-test-manifest.json`
- `testing/manifests/accessibility-checklist.json`
- `testing/manifests/security-checklist.json`
- `testing/manifests/mobile-device-qa-checklist.json`
- `testing/manifests/provider-test-plan.json`
- `testing/manifests/manual-qa-checklist.json`

## Commands

Dependency-free checks that can run before package installation:

```bash
node testing/scripts/phase14-static-check.mjs
node testing/scripts/verify-test-manifest.mjs
node testing/scripts/print-qa-checklists.mjs
```

Full commands once dependencies are available:

```bash
pnpm install
pnpm test:phase14:static
pnpm test:manifest
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:e2e
pnpm --filter @inkroute/web build
pnpm --filter @inkroute/dashboard build
pnpm --filter @inkroute/mobile typecheck
```

## Unit test strategy

Use Vitest for dependency-light packages first because these can provide high confidence without live providers.

| Package | Status | Critical coverage |
| --- | --- | --- |
| `@inkroute/booking` | Scaffolded | Readiness score thresholds, missing-field checks, lifecycle transitions |
| `@inkroute/payments` | Scaffolded | Deposit policy, risk scoring, refund/no-show decisions, Stripe session draft metadata |
| `@inkroute/calendar` | Scaffolded | Availability slot generation, buffer conflict detection, signed ICS feed draft metadata |
| `@inkroute/notifications` | Scaffolded | Template rendering, consent gates, provider boundary decisions, STOP handling |
| `@inkroute/seo` | Scaffolded | Metadata drafts, sitemap exclusion, internal-link recommendations |
| `@inkroute/observability` | Scaffolded | PII/secret redaction, severity classification, issue workflow generation |
| `@inkroute/releases` | Scaffolded | Feature flag evaluation, migration gates, mobile OTA compatibility, release risk |
| `@inkroute/security` | Scaffolded | Upload validation, redaction, rate-limit drafts, tenant isolation fixtures |
| `@inkroute/testing` | Scaffolded | Manifest summaries, CI gates, manual QA and route smoke manifests |

## Integration test strategy

Integration tests are not yet implemented because the repo lacks dependency installation, generated Prisma Client, a provisioned Postgres database, auth provider, storage provider, and live route runtime. Required integration suites:

1. Prisma validation, migration, and seed execution.
2. Tenant isolation tests across tenants, users, roles, booking requests, appointments, clients, private files, payments, messages, SEO pages, and error reports.
3. Public booking route tests for invalid JSON, invalid schema, valid non-persistent shape, rate-limit rejection, and secure upload intent behavior.
4. Dashboard route/action tests for auth denial, RBAC denial, tenant mismatch denial, and audit log creation.
5. Calendar conflict tests against persisted appointments, holds, travel blackouts, timezone/DST boundaries, and Google external busy blocks.
6. Notification queue tests for consent, unsubscribe, STOP/HELP, idempotency, delivery logs, and provider webhooks.
7. Payment webhook tests for Stripe signature verification, idempotent reconciliation, refund/dispute flows, and audit logs.
8. Privacy workflow tests for identity verification, export generation, deletion/retention holds, and notification of request status.

## E2E test strategy

Use Playwright after web and dashboard can build/run.

Implemented smoke scaffolds:

1. Public site homepage exposes booking/portfolio/travel conversion path.
2. Public booking page exposes intake and deposit boundaries.
3. Public trust/privacy pages are reachable.
4. Dashboard overview surfaces core operator areas.
5. Dashboard payments/releases/errors/trust pages expose disabled integration boundaries.
6. Dashboard booking detail renders timeline/readiness/deposit evidence.

Future E2E flows:

1. Client completes booking request and sees confirmation preview.
2. Client uploads reference image through signed upload and booking submission persists.
3. Client pays Stripe test deposit and webhook reconciles booking/payment state.
4. Artist accepts/declines/reschedules booking from dashboard.
5. Artist updates travel city from dashboard/mobile and public site reflects cache revalidation.
6. Artist sends prep/aftercare messages through provider queues.
7. SEO city/style pages render metadata, canonical, sitemap entries, JSON-LD, and internal links.
8. Dashboard auth guard and role-specific access controls are enforced.

## Mobile QA plan

Use Expo local runtime first, then physical devices.

Required checks:

1. App launches on iOS simulator and Android emulator.
2. App launches on at least one iOS physical device and one Android physical device before production claims.
3. Auth screen covers signed-out, signed-in, expired, and biometric-locked states after auth is wired.
4. Booking request list renders and lifecycle actions remain disabled until API mutations are wired.
5. Travel update screen handles Nomad Mode draft status and offline/online state.
6. Portfolio upload screen validates metadata and moves files through signed upload boundaries once storage is wired.
7. Notifications screen respects consent and provider gate decisions.
8. Offline notes persist encrypted locally and reconcile without duplicate events once sync is wired.
9. System status screen reports release, crash, privacy, and security posture accurately.
10. OTA updates are tested in preview channels before any production EAS update.

## Accessibility checklist

Current status: manifest scaffolded in `testing/manifests/accessibility-checklist.json`; runtime/tool evidence missing.

Required evidence:

- Keyboard-only booking flow.
- Visible focus states on web and dashboard.
- Semantic headings and landmarks.
- Form labels and errors associated with inputs.
- Color contrast checks across dark editorial design.
- Portfolio image alt text workflow.
- Reduced-motion checks.
- Screen-reader smoke pass for booking, dashboard navigation, and legal/trust pages.
- Mobile touch target and dynamic type checks.

Recommended tooling once dependencies are available:

- Playwright accessibility assertions.
- axe integration.
- Lighthouse.
- Manual VoiceOver/NVDA/TalkBack pass.

## Security test checklist

Current status: manifest scaffolded in `testing/manifests/security-checklist.json`; runtime/tool/provider evidence missing.

Required security tests:

1. Auth protects dashboard and sensitive APIs.
2. Tenant isolation denies cross-tenant access for every loader/mutation.
3. RBAC denies unauthorized roles for owner, artist, assistant, studio manager, and admin boundaries.
4. Public booking, message, upload, privacy, and fallback error-report routes are rate-limited.
5. CSRF/session controls reject forged cookie-authenticated mutations.
6. Upload pipeline rejects dangerous names, MIME spoofing, disallowed extensions, oversize files, private file leaks, and malware fixtures.
7. Private reference/consent/healed-photo files are not publicly fetchable.
8. Stripe, Sentry, email, SMS, and provider webhooks verify signatures before processing.
9. Logs/error reports redact PII, medical notes, payment identifiers, tokens, cookies, and signed URLs.
10. Privacy request export/delete/retention workflows are audited and legally reviewed.

## Provider test plan

Provider tests are credential-gated and documented in `testing/manifests/provider-test-plan.json`.

Provider suites:

- Stripe Checkout and webhook reconciliation.
- Google Calendar OAuth, FreeBusy, event insert/update/delete, sync-token handling.
- S3/Supabase signed uploads, private ACLs, scanning, and derivative generation.
- Resend/email, Twilio/SMS STOP/HELP, Expo Push receipts.
- Sentry web/dashboard/mobile event capture and source-map mapping.
- Auth/session provider and tenant membership claims.
- Redis/edge rate-limit behavior.

## Performance and load testing

Not implemented yet. Required before production launch:

- Lighthouse/Core Web Vitals for public site and city/style pages.
- Dashboard interaction latency budget for booking inbox, calendar, and client profile pages.
- Image optimization budget for portfolio gallery and city pages.
- Public booking submission abuse/load tests with rate limiting enabled.
- Webhook burst/idempotency tests for Stripe, notifications, and Sentry.
- Database query explain-plan review for tenant-scoped dashboard routes.

## CI target

`.github/workflows/ci.yml` now includes:

1. Dependency install.
2. Phase 14 manifest/static checks.
3. Typecheck.
4. Lint.
5. Unit tests.
6. Playwright browser install.
7. Playwright smoke tests.

CI is still unverified because dependency installation and lockfile generation were blocked in this sandbox.

## Exit criteria before production launch

Production launch remains blocked until:

- `pnpm install` PASS (`pnpm-lock.yaml` created)
- Web/dashboard/mobile builds pass.
- Prisma migration and seed pass against preview Postgres.
- Critical E2E booking, dashboard, payment, calendar, notification, upload, and privacy flows pass.
- Accessibility and security evidence is attached.
- Provider sandbox tests pass.
- Legal placeholders are replaced by attorney-reviewed content and consent/version acceptance tests pass.
- GAP_TRACKER production blockers are either closed with evidence or explicitly accepted as non-production limitations.

## Phase 15 deployment checks

Phase 15 adds dependency-free deployment/handoff checks that can run before the full monorepo install is working:

```bash
pnpm deploy:check-env
pnpm deploy:checklist
pnpm deploy:gaps
```

Implemented script files:

- `deployment/scripts/check-env.mjs`
- `deployment/scripts/print-launch-checklist.mjs`
- `deployment/scripts/final-gap-summary.mjs`

Implemented package scaffold:

- `packages/deployment/src/index.ts`
- `packages/deployment/tests/deployment-readiness.test.ts`

The deployment test file is scaffolded for Vitest and was not executed as a real test in this sandbox because dependencies are not installed. The `@inkroute/deployment` package typecheck and the dependency-free scripts were executed successfully here.

## Phase 16 handoff and gap-audit checks

Phase 16 adds dependency-free checks that are safe to run before dependencies are installed:

```bash
node scripts/handoff/verify-phase-docs.mjs
node scripts/handoff/audit-gap-tracker.mjs
node scripts/handoff/print-next-agent-tasks.mjs
```

After dependency installation, run:

```bash
pnpm handoff:verify-docs
pnpm handoff:audit
pnpm handoff:next
pnpm handoff:all
```

These checks verify documentation presence, gap table structure, and agent task queue readability. They do not replace Vitest, Playwright, Prisma, provider sandbox, mobile device, accessibility, security, or deployment tests. Any failure must be logged in `GAP_TRACKER.md`.


## 2026-06-06 verification status (rerun at 08:23:41Z)

Executed full `docs/workspace/CODEX_WORKSPACE_PROMPT.md` chain successfully.

- `corepack enable` PASS (`0`)
- `pnpm install` PASS (`0`)
- `pnpm workspace:all` PASS (`0`)
- `pnpm handoff:all` PASS (`0`)
- `pnpm quality:all` PASS (`0`)
- `pnpm typecheck` PASS (`0`)
- `pnpm test:unit` PASS (`0`) � 14 files, 43 tests passed
- `pnpm test:manifest` PASS (`0`)
- `pnpm --filter @inkroute/web build` PASS (`0`)
- `pnpm --filter @inkroute/dashboard build` PASS (`0`)

Evidence artifact: `docs/workspace/manifests/workspace-prompt-run-2026-06-06-4.log`.

Current verification status: command chain now green under the same existing production-blocking landscape reported by runtime readiness (`126` production blockers across `133` gap rows).
### Verification status (2026-06-06 rerun at 15:27:54Z)

- Full command chain was re-executed from `docs/workspace/CODEX_WORKSPACE_PROMPT.md`:
  - `corepack enable` PASS (`0`)
  - `pnpm install` PASS (`0`)
  - `pnpm workspace:all` PASS (`0`)
  - `pnpm handoff:all` PASS (`0`)
  - `pnpm quality:all` PASS (`0`)
  - `pnpm typecheck` PASS (`0`)
  - `pnpm test:unit` PASS (`14 passed, 0 failed`, `0` failed)
  - `pnpm test:manifest` PASS (`{"ok":true,"manifestCount":7,"requiredFileCount":15,"declaredSuites":28}`)
  - `pnpm --filter @inkroute/web build` PASS (`0`)
  - `pnpm --filter @inkroute/dashboard build` PASS (`0`)
- Exact command output captured in `docs/workspace/manifests/workspace-prompt-run-2026-06-06-plan.log`.
- Lockfile status: `pnpm-lock.yaml` exists and is tracked.
- Remaining production blockers: still tracked in `GAP_TRACKER.md` (`GAP-132` and other Phase 17/18 gaps).
