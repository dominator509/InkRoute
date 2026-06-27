# Release and Auto-Update Plan

## Current status

Release strategy is documented. Release records and feature flags are scaffolded in Prisma, but no release UI or CI/CD automation is implemented.

## Web/dashboard release strategy

- Use GitHub pull requests.
- Run CI checks.
- Deploy preview builds.
- Merge to main triggers production deployment.
- Rollback by redeploying previous Vercel build.

## Feature flags

Feature flags should support:
- Tenant-scoped rollout.
- Global defaults.
- Kill switches for risky integrations.
- Dashboard visibility.
- Audit log on changes.

Initial planned flags:
- `booking.deposit_required`
- `nomad_mode.enabled`
- `city_waitlist.enabled`
- `flash_drop.enabled`
- `sms_notifications.enabled`
- `ai_assistants.enabled`

## Release records

Track:
- Version.
- Channel: dev, preview, staging, production, mobile-preview, mobile-production.
- Commit SHA.
- Migration version.
- Release notes.
- Released by.
- Rollback reference.

## Mobile update strategy

Expo EAS Update is optional and deployment-gated.

Rules:
- Only JS/config-compatible changes can ship OTA.
- Native dependency changes require new app store build.
- Runtime version policy must prevent incompatible updates.
- Keep release notes per channel.
- Test on preview channel before production.

## Database migration compatibility

Before production migrations:
- Run migration against staging data copy.
- Ensure app version can read old and new schema during deploy window when possible.
- Avoid destructive migrations without backup and explicit approval.

## Rollback safety

- Web: rollback to previous deploy.
- Feature: disable via flag.
- Mobile: publish previous compatible EAS update when possible.
- DB: restore only if migration is catastrophic and data loss plan is approved.


## Phase 2 note

The Prisma schema now includes `ReleaseRecord` and `FeatureFlag` models, and the seed script creates a development release record plus a `nomad_mode` feature flag. No release automation, dashboard control plane, mobile EAS Update runtime policy, or CI/CD deployment has been implemented yet.


## Phase 5 note

The dashboard now includes a static `/releases` route with release records and feature flag previews. Real CI/CD deployments, rollback controls, database migration gates, EAS Update channels, and feature flag mutation APIs are not implemented and remain tracked in `GAP-015`, `GAP-038`, and `GAP-039`.

## Phase 6 mobile release note

`apps/mobile/eas.json` and `apps/mobile/app.json` now include development, preview, production channel scaffolding, `runtimeVersion` policy, and a deployment-gated EAS Update URL placeholder. This is not a configured EAS project. Before any OTA update is enabled, configure a real Expo project ID, define channel/runtime compatibility rules, verify rollback behavior, and ensure updates cannot break required native capabilities.

## Phase 9 notification release controls

Notification features must launch behind feature flags and tenant settings. Suggested flags:

- `transactional_email_enabled`
- `sms_notifications_enabled`
- `mobile_push_enabled`
- `aftercare_automation_enabled`
- `city_waitlist_notifications_enabled`
- `flash_drop_campaigns_enabled`

Rollout order should be in-app previews, transactional email, dashboard message persistence, push, then SMS/marketing only after legal and compliance review. Rollback must disable queue workers and provider sends without deleting delivery logs or suppression records.

## Phase 12 release control-plane scaffold

Phase 12 adds real code scaffolding for release operations while preserving production honesty.

Implemented:

- `packages/releases` with dependency-light release candidate, feature flag, migration compatibility, mobile OTA compatibility, release note, rollback, audit, and CI/CD guardrail helpers.
- Dashboard `/releases` preview for release gates, health checks, preview/production feature flag decisions, EAS Update compatibility, rollback plans, CI/CD guardrails, release notes, and audit drafts.
- Dashboard API boundaries:
  - `GET /api/releases`
  - `POST /api/releases` validates release creation and uses the auth/idempotency-backed persistence/audit contract where DB access is available
  - `GET /api/feature-flags`
  - `POST /api/feature-flags` validates rollout updates and uses the auth/idempotency-backed persistence/audit contract where DB access is available
- Public limited release health preview at `GET /api/public/[tenantSlug]/release-health`.
- Mobile system status preview for release candidate, OTA update plan, health checks, and feature flag snapshot.
- Manual dry-run GitHub Actions workflow at `.github/workflows/release-governance.yml`.

Not implemented:

- ReleaseRecord persistence.
- FeatureFlag persistence and runtime resolver.
- Approval workflow.
- Production deployment jobs.
- EAS project configuration or OTA publishing.
- Prisma migration deploy gates.
- Sentry release/source-map upload.
- Rollback execution.
- Incident linkage.

## Feature flag release rules

Feature flags are now modeled in `@inkroute/releases` and should follow these rules in production:

1. All risky provider actions must have a server-side kill switch.
2. Public client payloads must expose only safe flag decisions, not internal rollout notes or incident context.
3. Tenant-scoped flags must be resolved using authenticated tenant membership, not only URL slugs.
4. SMS, payments, mobile OTA, and AI assistant flags must default off until provider, legal, privacy, and test evidence is attached.
5. Every mutation must write an audit log with actor, tenant, flag key, previous value, new value, reason, and release link.

## Release gate minimums before production

Production release must be blocked until these checks are attached to the release record:

- dependency install and lockfile verified
- unit/type/lint/test suite pass
- web/dashboard Next.js builds pass
- mobile preview build or OTA compatibility checked when mobile changed
- Prisma migration dry-run passed against staging data
- destructive migration review completed when relevant
- Sentry release artifacts uploaded when source maps are available
- rollback plan generated and approved
- production environment approval completed

## EAS Update policy from Phase 12

The mobile OTA helper classifies updates as:

- `safe` when EAS is configured, runtime versions match, and no native capability or permission changes occurred.
- `requires_store_build` when native capabilities or app permissions change.
- `requires_manual_review` when runtime versions differ.
- `blocked` when no real EAS project configuration exists.

The current scaffold intentionally returns `blocked` because this repository still uses placeholder EAS project/update values. Do not enable OTA release automation until a real EAS project, preview binary, update channel, adoption monitoring, and rollback drill are verified.

Mobile build and OTA evidence is tracked in `deployment/manifests/mobile-deployment-evidence.json` and verified with `pnpm deploy:verify-mobile`. Keep the committed `apps/mobile/app.json` project/update values deployment-gated until redacted EAS project/build/update evidence is recorded outside git.

## CI/CD guardrail scaffold

`.github/workflows/release-governance.yml` currently performs only a manual dry run. The deployment jobs are intentionally disabled. Codex should convert those disabled jobs into real jobs only after GitHub environments, repository secrets, Vercel projects, database URLs, EAS token, and provider release credentials are configured.

## Phase 15 deployment handoff additions

Phase 15 connects the Phase 12 release scaffold to deployment handoff artifacts:

- `deployment/CI_CD_RUNBOOK.md` defines release/deploy quality stages.
- `deployment/PRODUCTION_LAUNCH_CHECKLIST.md` lists launch blockers and evidence requirements.
- `deployment/MOBILE_BUILD_GUIDE.md` expands EAS preview build and OTA guardrails.
- `@inkroute/deployment` produces deployment plans and launch checklists used by the dashboard `/deployment` page.
- `.github/workflows/ci.yml` now includes dependency-free deployment manifest checks, but the workflow has not been executed.

Release and deployment remain blocked until real provider projects, secrets, protected GitHub environments, release records, migration gates, Sentry source-map uploads, EAS builds, and rollback drills are verified.
