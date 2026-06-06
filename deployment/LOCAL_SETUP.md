# Local Setup Runbook

## Status

Scaffolded and unverified in this ChatGPT sandbox. Dependency installation still requires a local terminal, Codex, Jules, Claude Code, or CI runner with registry access.

## Required tools

- Node.js 20.11 or newer.
- Corepack enabled.
- pnpm 9.x from the root `packageManager` field.
- Docker or a managed Postgres branch for database validation.
- Expo/EAS CLI for mobile build verification.

## First local commands

```bash
corepack enable
pnpm install
pnpm typecheck
pnpm test:manifest
pnpm deploy:check-env
```

## Database commands after provider/local Postgres exists

```bash
cp .env.example .env.local
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

## App smoke commands after install

```bash
pnpm --filter @inkroute/web build
pnpm --filter @inkroute/dashboard build
pnpm --filter @inkroute/mobile typecheck
pnpm test:unit
pnpm test:e2e
```

## Evidence to capture

- `pnpm-lock.yaml` committed.
- Full command transcript for install/typecheck/build/test.
- Any dependency conflicts documented in `GAP_TRACKER.md`.
- Database migration SQL and seed output.
- Web/dashboard route screenshots.
- Expo preview run/device notes.

## Production honesty

Do not mark local setup complete until dependency installation, typecheck, build, tests, Prisma migration, and app smoke tests pass in a real runtime.
