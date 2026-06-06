# Phase 14 — Testing and QA

## Status

Partially implemented as a testing and QA scaffold. This phase adds executable test files, manifests, quality-gate helpers, CI command wiring, and manual QA checklists, but most tests are not executed here because dependencies, Playwright browsers, Next.js runtime, Expo runtime, Postgres, and live providers are unavailable in the ChatGPT sandbox.

## Source review performed before coding

Before coding, the Phase 13 ZIP was unpacked and all 39 markdown files were enumerated and read, including `README.md`, `ROADMAP.md`, `TESTING_PLAN.md`, `GAP_TRACKER.md`, `SECURITY.md`, all handoff files, and all prior phase closeouts. Phase 14 was selected because Phase 13 closeout and the roadmap identify Testing and QA as the next best codeable task.

## Implemented in this phase

### `@inkroute/testing`

Added a dependency-light testing support package with:

- Test layer, surface, priority, status, suite, case, QA checklist, route smoke, and CI quality gate types.
- `summarizeSuites` for production-blocking test summary metadata.
- `buildCiQualityGatePlan` for install/typecheck/unit/E2E/mobile gates.
- `buildManualQaChecklist` for evidence-driven operator QA.
- `buildRouteSmokeManifest` for web/dashboard/API route expectations.
- `phase14Suites` for scaffolded critical test coverage inventory.

### Unit test scaffolds

Added Vitest specs for dependency-light packages:

- `packages/booking/tests/booking-readiness.test.ts`
- `packages/payments/tests/deposit-policy.test.ts`
- `packages/calendar/tests/availability-conflicts.test.ts`
- `packages/notifications/tests/delivery-plan.test.ts`
- `packages/seo/tests/seo-engine.test.ts`
- `packages/observability/tests/redaction-report.test.ts`
- `packages/releases/tests/feature-flags.test.ts`
- `packages/security/tests/upload-policy.test.ts`
- `packages/testing/tests/testing-manifest.test.ts`

These are scaffolded and should run once `vitest` and workspace dependencies are installed.

### E2E and mobile test scaffolds

Added:

- `apps/web/tests/e2e/public-booking.spec.ts`
- `apps/dashboard/tests/e2e/dashboard-smoke.spec.ts`
- `apps/mobile/tests/mobile-static.test.ts`
- Root `playwright.config.ts`
- Root `vitest.workspace.ts`

The Playwright tests are runtime-gated because they need running Next.js apps and Playwright browser installation.

### QA manifests and scripts

Added manifest-driven QA records:

- `testing/manifests/unit-test-manifest.json`
- `testing/manifests/e2e-test-manifest.json`
- `testing/manifests/accessibility-checklist.json`
- `testing/manifests/security-checklist.json`
- `testing/manifests/mobile-device-qa-checklist.json`
- `testing/manifests/provider-test-plan.json`
- `testing/manifests/manual-qa-checklist.json`

Added dependency-free verification scripts:

- `testing/scripts/verify-test-manifest.mjs`
- `testing/scripts/phase14-static-check.mjs`
- `testing/scripts/print-qa-checklists.mjs`

### CI wiring

Updated scripts and CI scaffolding:

- Root `package.json` now includes `test:unit`, `test:e2e`, `test:manifest`, `test:phase14:static`, and `qa:checklists`.
- Root dev dependencies now list Vitest, Vitest V8 coverage, and Playwright.
- `.github/workflows/ci.yml` now includes manifest checks, typecheck, lint, unit test, Playwright browser install, and Playwright smoke-test steps.
- App/package test scripts now point to Vitest or Playwright instead of placeholder echo commands.

## Implemented

- Dependency-light testing support package compiles in this sandbox.
- Static manifest verification scripts run in this sandbox.
- Unit and E2E test files are real test skeletons, not pseudocode.
- QA manifests define evidence requirements for accessibility, security, mobile device QA, provider tests, and manual operator workflows.
- CI workflow is updated, but not executed.

## Scaffolded only

- Vitest execution is scaffolded but not run because dependencies are not installed.
- Playwright tests are scaffolded but not run because apps are not built/running and browsers are not installed.
- Mobile tests are scaffolded but not run because Expo/React Native dependencies are not installed.
- Database/provider/integration/security tests are manifest-scaffolded only until Postgres, storage, Stripe, Google Calendar, notification providers, Sentry, auth, and rate-limit infrastructure are wired.

## Verification run here

Passed:

```bash
tsc --noEmit -p packages/testing/tsconfig.json
node testing/scripts/phase14-static-check.mjs
node testing/scripts/verify-test-manifest.mjs
```

Also verified:

- Existing dependency-light package typechecks still pass.
- All JSON files parse.
- No unresolved task-marker comments were introduced.
- Repo ZIP rebuilt successfully.

## Not verified here

- `pnpm install`
- lockfile generation
- `pnpm test:unit`
- `pnpm test:e2e`
- Playwright browser installation
- Next.js web/dashboard builds
- Expo runtime/device testing
- Prisma database test runs
- Route/integration tests against live apps
- Provider sandbox tests for Stripe, Google Calendar, Resend, Twilio, Expo Push, Sentry, storage, auth, or rate limiting
- Accessibility testing with axe/screen readers
- Security testing with tenant fixtures, CSRF/rate-limit middleware, signed uploads, webhook verification, or privacy workflows

## Gaps added

- `GAP-105` — dependency/test runner execution blocked.
- `GAP-106` — app E2E runtime tests blocked.
- `GAP-107` — database/integration test harness missing.
- `GAP-108` — mobile device test harness missing.
- `GAP-109` — accessibility/visual regression tooling missing.
- `GAP-110` — provider contract tests missing.
- `GAP-111` — CI coverage/reporting and branch protection missing.
- `GAP-112` — performance/load testing missing.

## Next recommended task

Phase 15 — Deployment and Handoff scaffold. Add local setup hardening, deployment guides, environment check scripts, production launch checklist, mobile build guide, final gap tracker synthesis, and agent handoff improvements. Codex/Jules should first install dependencies and run the Phase 14 manifest, unit, and E2E commands in a real local or CI environment.
