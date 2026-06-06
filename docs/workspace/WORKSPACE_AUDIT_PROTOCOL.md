# Workspace Audit Protocol

Use this protocol before installing providers, wiring credentials, or closing any runtime gap.

## What Phase 18 checks

1. Workspace imports from `@inkroute/*` are declared in the owning app/package manifest.
2. Declared workspace dependencies point to real workspace packages.
3. Package-style workspace packages are represented in `tsconfig.base.json` path aliases.
4. Root and project package scripts expose the minimum command contract expected by CI and external agents.
5. Runtime readiness is summarized with lockfile, environment-template, and open-blocker evidence.

## What Phase 18 does not prove

- It does not install dependencies.
- It does not generate `pnpm-lock.yaml`.
- It does not execute Next.js, Expo, Vitest, Playwright, Prisma, Stripe, Sentry, or Google Calendar flows.
- It does not prove provider credentials, production deployments, mobile builds, legal review, or runtime security controls.

## Required external evidence before closing related gaps

- `pnpm install` output and committed `pnpm-lock.yaml`.
- `pnpm workspace:all` output.
- `pnpm handoff:all` output.
- `pnpm quality:all` output.
- `pnpm typecheck` output.
- App build/test outputs for the specific area being changed.
- Provider-console or deployment evidence where the gap mentions live services.
