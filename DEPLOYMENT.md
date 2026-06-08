# Deployment Plan

## Current status

Deployment is not configured. This document is a plan for Phase 15 and earlier preview deployments.

## Recommended environments

| Environment | Purpose | Suggested stack |
| --- | --- | --- |
| Local | Development | pnpm, local/managed Postgres |
| Preview | PR review | Vercel preview + Neon/Supabase branch |
| Staging | Pre-production QA | Vercel staging + managed Postgres + test Stripe |
| Production | Live SaaS | Vercel + managed Postgres + storage + Stripe live |

## Web/dashboard deployment

Recommended first path:
- Vercel monorepo projects for `apps/web` and `apps/dashboard`.
- Separate environment variables for preview/staging/production.
- Protected dashboard domain.
- Preview deployments for pull requests.

## Database deployment

Options:
- Neon: strong branching workflow.
- Supabase: integrated auth/storage/RLS option.
- Railway/Render/Fly: simpler full-stack deploy options, more ops burden.

## Storage deployment

Options:
- Supabase Storage if Supabase Auth/RLS is selected.
- S3-compatible storage if portability is preferred.

## Mobile deployment

Recommended path:
- Expo EAS Build for iOS/Android.
- Internal preview builds first.
- Optional EAS Update after runtime version policy is configured.
- App Store/Play Store readiness after authentication, privacy policy, crash reporting, and account deletion flows exist.

## CI/CD plan

Current `.github/workflows/ci.yml` is still a scaffold, but Phase 14 expanded it with test-manifest checks, unit-test execution, and Playwright smoke-test steps. It has not run in a real CI environment because dependency installation and lockfile generation are still blocked.

Target CI steps:
1. Install pnpm.
2. Install dependencies with a committed lockfile.
3. Run `pnpm test:phase14:static` and `pnpm test:manifest`.
4. Typecheck.
5. Lint.
6. Run Vitest unit tests with coverage artifacts.
7. Build web/dashboard.
8. Install Playwright browsers and run smoke tests against web/dashboard.
9. Generate Prisma migration check against a preview database.
10. Run provider contract tests in sandbox environments before production deploys.

## Rollback plan

- Web/dashboard: redeploy previous Vercel build.
- Database: avoid destructive migrations; test migrations in staging; maintain backup restore playbook.
- Mobile: EAS Update rollback for JS-only compatible updates; native changes require store release rollback strategy.

## Production launch checklist

- Auth implemented and tested.
- Tenant isolation tests pass.
- Payment webhook tests pass.
- Secure uploads implemented.
- Legal review complete.
- Privacy/TOS published.
- Sentry/alerts configured.
- Backups verified.
- Accessibility smoke pass.
- Core Web Vitals pass.
- SEO crawl verified.


## Phase 5 dashboard deployment note

The dashboard route tree expanded in Phase 5, but it has not been built or deployed. A production dashboard deployment must run dependency installation, Next.js typecheck/build, route smoke tests, auth secret configuration, environment-specific provider secrets, and preview/prod separation before any private tenant/client data is connected.

## Phase 6 mobile deployment note

`apps/mobile/eas.json` is scaffolded for development, preview, and production channels, but no EAS project, credentials, native build, store submission, OTA update channel, or rollback verification exists. Mobile deployment remains blocked until dependencies install, Expo runtime tests pass, and EAS credentials are configured outside this environment.

## Phase 7 payment deployment gate

Payments must not be enabled in preview, staging, or production until these gates pass:

1. Stripe test-mode account configured with `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and dashboard webhook endpoint.
2. Web/dashboard builds pass with the Stripe SDK installed only server-side.
3. Public deposit-session route is protected by signed deposit token or authenticated dashboard action.
4. Webhook route verifies signatures from the raw request body and rejects invalid signatures.
5. Database migrations for Deposit/Payment/Refund/PaymentAuditLog are verified and backed up.
6. Stripe CLI replay tests pass for success, failure, expiration, refund, and dispute events.
7. Legal/tax review approves deposit, no-show, cancellation, refund, receipt, and tax export copy.
8. Production secrets are stored only in deployment secret manager, never in source control.

## Phase 8 calendar/travel deployment gate

Do not deploy live calendar sync until Google Cloud OAuth credentials, redirect URLs, encrypted token storage, provider webhook/channel endpoints, signed ICS feed secrets, public revalidation secrets, and Postgres-backed calendar services are configured and tested. The current `.ics` and availability routes are safe as demo/static boundaries only and must not expose private appointment/client data.

## Phase 9 notifications deployment notes

Phase 9 adds route boundaries and helper code only. Before production deployment enables notifications:

- Configure server-only provider credentials for email, SMS, and push workers.
- Use verified sender domains and provider sandbox/test environments before live mode.
- Deploy webhook routes over HTTPS and verify provider signatures before reconciliation.
- Add queue/worker infrastructure for retries, dead letters, and scheduled aftercare/healed-photo messages.
- Configure suppression/preference storage before any marketing, waitlist, flash-drop, or SMS campaign sends.
- Run provider sandbox tests and update `GAP_TRACKER.md` with evidence.


## Phase 10 SEO deployment gate

Do not launch the SEO engine as production-ready until public canonical domains are configured, `sitemap.xml` is generated from tenant-published records, noindex/draft/archive exclusions are verified, structured data passes rendered-page validation, Search Console ownership is verified, and Lighthouse/Core Web Vitals/axe evidence is attached to a deployment closeout.

## Phase 11 observability deployment gates

Do not enable production observability until these gates are complete:

1. Sentry projects exist for web/dashboard/mobile or a deliberate shared-project strategy is approved.
2. `SENTRY_AUTH_TOKEN`, org/project slugs, DSNs, webhook secrets, and alert webhooks are configured in deployment secrets.
3. Next.js source-map upload succeeds in CI without leaking tokens.
4. Expo/EAS source-map and debug-symbol upload succeeds for preview builds.
5. Synthetic error verification proves source maps, release tags, environment tags, and redaction.
6. Public fallback ingest is rate-limited and persists only redacted metadata.
7. Dashboard error-report views are protected by auth, tenant membership, and RBAC.
8. Alert routing has human ownership and an escalation runbook.

## Phase 12 release/deployment scaffold

Phase 12 adds `.github/workflows/release-governance.yml` as a manual dry-run scaffold and `@inkroute/releases` as release-domain helper code.

Current state:

- The workflow checks that release scaffold files exist.
- Preview and production deployment jobs are intentionally disabled.
- No Vercel, EAS, Sentry, Search Console, or database deployment secret is configured.
- Dashboard release controls are non-mutating previews or `501` boundaries.

Before enabling deployment jobs:

1. Create GitHub environments for preview, staging, and production.
2. Add required secrets only to the least-privileged environment.
3. Configure Vercel projects for web and dashboard.
4. Configure managed Postgres and migration deploy policy.
5. Configure EAS project, preview/prod channels, runtimeVersion, and update URL.
6. Configure Sentry release/source-map upload credentials.
7. Add deployment result write-back to `ReleaseRecord` with audit logs.
8. Rehearse rollback for web/dashboard and mobile OTA in preview before production.

Production release jobs must remain disabled until the above steps are verified.

## Phase 15 deployment/handoff scaffold

**Status:** Scaffolded and unverified in live infrastructure.

Phase 15 adds concrete deployment planning artifacts without claiming deployment success:

- `@inkroute/deployment` shared helper package for env readiness, provider matrix, deployment plans, launch checklists, and handoff tasks.
- Deployment runbooks under `deployment/`.
- Deployment manifests under `deployment/manifests/`.
- Dependency-free scripts under `deployment/scripts/`.
- Dashboard deployment control-room preview at `/deployment`.
- Dashboard API readiness preview at `GET /api/deployment/readiness`.

Dependency-free commands available now:

```bash
pnpm deploy:check-env
pnpm deploy:check-env:strict
pnpm deploy:verify-provider-envs
pnpm deploy:verify-secrets
pnpm deploy:verify-mobile
pnpm deploy:verify-database-ops
pnpm deploy:verify-launch-evidence
pnpm deploy:verify-ops
pnpm deploy:checklist
pnpm deploy:gaps
```

In this sandbox, the non-strict environment check and checklist scripts passed against `.env.example`. Strict production checks require a real `.env.local` or provider-injected runtime environment and are expected to fail until secrets are configured.

Provider environment evidence must be recorded through `deployment/manifests/provider-environment-evidence.json` using redacted labels only. Do not commit provider project IDs, database URLs, bucket names, webhook secrets, access tokens, or private console URLs; store those in provider secret managers and GitHub/EAS/Vercel/Sentry environments, then keep only proof categories and safe evidence labels in git.

Secret-management readiness is tracked in `deployment/manifests/secret-management-audit.json` and verified with `pnpm deploy:verify-secrets`. The manifest is an audit contract, not a secret store: it may list secret names, destinations, rotation cadence, owners/evidence categories, and redacted proof labels, but it must never contain secret values.

Mobile deployment readiness is tracked in `deployment/manifests/mobile-deployment-evidence.json` and verified with `pnpm deploy:verify-mobile`. It verifies that the committed EAS/app config remains deployment-gated until real EAS projects, builds, push, crash, and OTA rollback evidence exist.

Database operations readiness is tracked in `deployment/manifests/database-operations-evidence.json` and verified with `pnpm deploy:verify-database-ops`. It checks the required migration/seed/backup/restore/tenant-isolation evidence contract without requiring or exposing live database URLs.

Production launch evidence is tracked in `deployment/manifests/production-launch-evidence.json` and verified with `pnpm deploy:verify-launch-evidence`. It keeps launch approval blocked until all redacted evidence bundles are verified.

Launch operations readiness is tracked in `deployment/manifests/launch-operations-evidence.json` and verified with `pnpm deploy:verify-ops`. It keeps incident, support, privacy, monitoring, on-call, communications, and rollback operations blocked until owners and drills are proven with redacted evidence.

### Phase 15 runbook index

- `deployment/LOCAL_SETUP.md`
- `deployment/PROVIDER_OPTIONS.md`
- `deployment/CI_CD_RUNBOOK.md`
- `deployment/MOBILE_BUILD_GUIDE.md`
- `deployment/DATABASE_MIGRATION_GUIDE.md`
- `deployment/PRODUCTION_LAUNCH_CHECKLIST.md`

### Production deployment blockers

The project is still blocked from production until at least these items are verified externally:

- Dependencies installed and lockfile committed.
- Prisma schema validated and migrated against a real Postgres environment.
- Auth/session/RBAC and tenant isolation implemented.
- Private object storage and signed uploads implemented.
- Stripe test-mode deposit flow and webhook reconciliation implemented.
- Web/dashboard Next.js builds pass.
- Expo preview builds and device QA pass.
- Provider sandboxes for email, SMS, push, calendar, storage, and Sentry are verified.
- CI/CD preview and protected production deployment jobs execute successfully.
- Legal review is complete.
- Launch operations are staffed and tested.

## Phase 16 handoff readiness note

Phase 16 adds post-roadmap handoff hardening. Before a real deployment attempt, run the Phase 16 handoff checks alongside the Phase 15 deployment checks:

```bash
pnpm handoff:verify-docs
pnpm handoff:audit
pnpm handoff:next
pnpm deploy:check-env
pnpm deploy:checklist
pnpm deploy:gaps
```

These scripts are readiness aids only. They do not provision providers, verify secrets, execute CI, run builds, prove tenant isolation, or satisfy legal/security review. Production remains blocked until the gap tracker has evidence-backed closure for all production-blocking rows.
