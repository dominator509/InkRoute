# Workspace Audit Protocol

Use this protocol before installing providers, wiring credentials, or closing any runtime gap.

## What Phase 18 checks

1. Workspace imports from `@inkroute/*` are declared in the owning app/package manifest.
2. Declared workspace dependencies point to real workspace packages.
3. Package-style workspace packages are represented in `tsconfig.base.json` path aliases.
4. Bare third-party imports are declared by the owning app/package manifest.
5. Root and project package scripts expose the minimum command contract expected by CI and external agents.
6. Runtime readiness is summarized with lockfile, environment-template, and open-blocker evidence.
7. Runtime command evidence is tracked separately from static readiness and must remain missing/blocked until commands actually run.
8. Required workspace checks are present in root scripts, chained through `workspace:all`, present in CI, and named for future GitHub branch protection.
9. Workspace toolchain readiness checks the helper package, scripts, generated report placeholders, root command chain, and CI wiring stay aligned.

## What Phase 18 does not prove

- It does not install dependencies.
- It does not generate `pnpm-lock.yaml`.
- It does not execute Next.js, Expo, Vitest, Playwright, Prisma, Stripe, Sentry, or Google Calendar flows.
- It does not prove provider credentials, production deployments, mobile builds, legal review, or runtime security controls.
- It does not prove peer dependency compatibility, lockfile resolution, bundler behavior, generated imports, or transitive dependency versions.

## Required external evidence before closing related gaps

- `pnpm install` output and committed `pnpm-lock.yaml`.
- `pnpm workspace:all` output.
- `pnpm workspace:runtime-evidence` output.
- `pnpm workspace:required-checks` output.
- `pnpm workspace:toolchain` output.
- `pnpm handoff:all` output.
- `pnpm quality:all` output.
- `pnpm typecheck` output.
- App build/test outputs for the specific area being changed.
- Provider-console or deployment evidence where the gap mentions live services.
