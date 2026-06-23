# CI/CD Runbook

## Status

Source-controlled workflow contracts exist in `.github/workflows/ci.yml` and `.github/workflows/release-governance.yml`, with local runtime/evidence matrices tracked in the GAP docs. Fresh GitHub Actions execution, protected-environment approvals, provider secrets, deployment artifacts, and redacted CI evidence remain external gates.

## Required stages

1. Install dependencies and verify lockfile.
2. Typecheck all dependency-light packages and app projects.
3. Run unit tests.
4. Run manifest/static checks.
5. Build public web and dashboard.
6. Run Playwright route smoke tests against preview deployments.
7. Run Prisma generate/migration dry-run against staging database.
8. Upload Sentry release/source maps once Sentry is configured.
9. Deploy preview web/dashboard.
10. Require protected approval before production deploy.
11. Record release evidence and rollback target.

## Commands to wire

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test:unit
pnpm test:manifest
pnpm deploy:check-env
pnpm --filter @inkroute/web build
pnpm --filter @inkroute/dashboard build
pnpm test:e2e
```

## Required secrets

See `ENVIRONMENT_VARIABLES.md` and `deployment/manifests/environment-contract.json`. Secrets must live in GitHub/Vercel/EAS/Sentry/provider secret stores, not in the repository.

## Rollback gates

- Web/dashboard rollback target captured before production deploy.
- Database migration marked expand-only or manually approved.
- Feature flag kill switches ready for risky features.
- EAS Update only used when runtime compatibility is safe.
- Incident channel and owner assigned.
