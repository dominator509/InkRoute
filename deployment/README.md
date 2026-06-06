# Deployment Folder

Phase 15 adds dependency-free deployment and handoff scaffolding. Nothing here proves a live deployment has occurred.

## Runbooks

- `LOCAL_SETUP.md` — local environment and first verification commands.
- `PROVIDER_OPTIONS.md` — recommended MVP provider matrix.
- `CI_CD_RUNBOOK.md` — CI/CD stages, secrets, release gates, rollback expectations.
- `MOBILE_BUILD_GUIDE.md` — Expo/EAS preview build and device QA checklist.
- `DATABASE_MIGRATION_GUIDE.md` — Prisma migration and production safety rules.
- `PRODUCTION_LAUNCH_CHECKLIST.md` — launch blockers and required evidence.

## Manifests

- `manifests/environment-contract.json`
- `manifests/provider-matrix.json`
- `manifests/production-launch-checklist.json`
- `manifests/handoff-tasks.json`

## Scripts

```bash
node deployment/scripts/check-env.mjs
node deployment/scripts/check-env.mjs --env .env.local --target production --strict-values
node deployment/scripts/print-launch-checklist.mjs
node deployment/scripts/final-gap-summary.mjs
```
