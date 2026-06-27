# Phase 12 — Auto-Update and Release System

## Status

Partially implemented and scaffolded. Phase 12 adds a dependency-light release control-plane package, dashboard release previews, API boundaries, mobile OTA status previews, and a dry-run GitHub Actions governance workflow. It does not deploy, mutate production state, publish EAS updates, run migrations, or persist ReleaseRecord/FeatureFlag changes.

## Source review performed before coding

Before coding, all 37 markdown source files in the Phase 11 repository were enumerated and reviewed, including `ROADMAP.md`, `RELEASE_AND_AUTO_UPDATE_PLAN.md`, `DEPLOYMENT.md`, `GAP_TRACKER.md`, `HANDOFF_TO_CODEX.md`, `HANDOFF_TO_JULES.md`, `HANDOFF_TO_CLAUDE_CODE.md`, `ARCHITECTURE.md`, `API_CONTRACTS.md`, `ENVIRONMENT_VARIABLES.md`, `TESTING_PLAN.md`, and the Phase 0–11 closeout docs. The reviewed roadmap listed Phase 12 as documentation only and identified auto-update/release systems as the next phase. `GAP-015` and `GAP-047` confirmed release automation and EAS Update were scaffolded only.

## Implemented in this phase

### `@inkroute/releases`

Added `packages/releases` with dependency-light helpers for:

- release candidate creation
- release gate modeling
- release risk classification
- migration compatibility assessment
- feature flag definitions and deterministic evaluation
- kill-switch/tenant/environment rollout decisions
- mobile OTA compatibility classification
- EAS Update command preview generation
- release note generation
- rollback plan generation
- release health checks
- GitHub Actions workflow plan metadata
- release audit draft generation
- demo release candidate, flag decisions, rollback plan, and mobile update plan

### Dashboard

Updated `/releases` from a static list into a richer release control-plane preview:

- release candidate metrics
- production-blocking gate display
- release health checks
- preview vs production feature flag decisions
- feature flag catalog
- EAS Update compatibility preview
- rollback draft
- CI/CD guardrail plan
- release notes preview
- audit draft preview
- explicit disabled action panel

Added `apps/dashboard/lib/releaseDemo.ts` to keep the page modular and agent-editable.

### API boundaries

Added dashboard route boundaries:

- `GET /api/releases` returns scaffolded release candidate, rollback, and flag data.
- `POST /api/releases` validates JSON and uses the auth/idempotency-backed release persistence/audit contract where the DB path is available.
- `GET /api/feature-flags` returns static flag definitions and decisions.
- `POST /api/feature-flags` validates updates and uses the auth/idempotency-backed feature-flag persistence/audit contract where the DB path is available.

Added public route boundary:

- `GET /api/public/[tenantSlug]/release-health` returns a limited public release-health preview and warns that production must not expose internal deployment or incident details.

### Mobile

Updated the mobile system status screen to show:

- current scaffolded release candidate
- EAS/OTA update plan
- release health checks
- feature flag snapshot

This remains static and unverified in Expo runtime.

### GitHub Actions

Added `.github/workflows/release-governance.yml` as a manual dry-run scaffold. It validates the presence of release scaffold files and contains intentionally disabled deployment-gated preview/production jobs. It does not deploy or require secrets yet.

### Environment docs

Updated `.env.example` with release/deployment variables for release environment, feature flag admin token, Vercel project IDs, EAS channels, and approval webhook placeholders.

## Implemented

- Dependency-light release helper package compiles.
- Dashboard/mobile/web release previews are authored.
- API boundaries are present and explicitly non-persistent.
- GitHub workflow dry-run scaffold is present.
- Gap tracker and handoff docs were updated with Phase 12 blockers.

## Scaffolded only

- Authenticated release control plane
- ReleaseRecord persistence
- FeatureFlag persistence and runtime resolver
- CI/CD deploy jobs
- Vercel project wiring
- Prisma migration deploy/dry-run
- EAS Update publishing
- Sentry release/source-map upload
- Search Console sitemap submission
- Rollback execution
- Release-linked incident workflows

## Verification run here

Passed:

```bash
npx tsc --noEmit -p packages/releases/tsconfig.json
npx tsc --noEmit -p packages/types/tsconfig.json
npx tsc --noEmit -p packages/config/tsconfig.json
npx tsc --noEmit -p packages/auth/tsconfig.json
npx tsc --noEmit -p packages/booking/tsconfig.json
npx tsc --noEmit -p packages/payments/tsconfig.json
npx tsc --noEmit -p packages/calendar/tsconfig.json
npx tsc --noEmit -p packages/notifications/tsconfig.json
npx tsc --noEmit -p packages/mobile/tsconfig.json
npx tsc --noEmit -p packages/seo/tsconfig.json
npx tsc --noEmit -p packages/observability/tsconfig.json
```

Also verified:

- all JSON files parse
- no unresolved task-marker comments were introduced
- repo ZIP rebuilt successfully

## Blocked or unverified in this environment

- `pnpm install`
- lockfile generation
- Next.js web/dashboard typecheck/build
- Expo runtime/device tests
- GitHub Actions workflow execution
- Vercel deployment
- EAS project configuration
- EAS update publish/rollback
- Prisma migration dry-run/deploy
- ReleaseRecord/FeatureFlag persistence
- RBAC/audit logs
- Sentry release artifact upload
- production rollback drills

## Gaps added or updated

Updated:

- `GAP-015` — releases now partially implemented through Phase 12 scaffold.

Added:

- `GAP-087` — release runtime verification missing.
- `GAP-088` — release persistence and RBAC missing.
- `GAP-089` — CI/CD deployment automation missing.
- `GAP-090` — feature flag evaluation integration missing.
- `GAP-091` — mobile OTA production enablement missing.
- `GAP-092` — migration compatibility enforcement missing.
- `GAP-093` — release observability and incident linkage missing.
- `GAP-094` — release automated tests missing.

## Next best task

Proceed to Phase 13 — Security, Privacy, Compliance, and Trust. The best codeable work in this environment is a security hardening scaffold: shared security/privacy helpers, field redaction policies, secure upload validation boundaries, rate-limit/CSRF/input-validation contracts, tenant isolation test fixtures, policy/TOS placeholders, and dashboard trust/compliance surfaces. Live auth, storage scanning, encryption, legal review, and deployment controls must remain gap-tracked.
