# InkRoute

SaaS Tattoo Booking Management System

Multi-tenant tattoo artist platform covering public artist websites with SEO and booking intake, a dashboard workspace for tenant/admin operations, and an Expo mobile companion for artist mobility.

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js >= 20.11.0 |
| Package manager | pnpm >= 9.0.0 workspaces |
| Language | TypeScript 5.5+ |
| Web/dashboard | Next.js App Router |
| Mobile | Expo / React Native |
| ORM / DB | Prisma + PostgreSQL |
| Monorepo | Turborepo |
| Validation | Zod (`@inkroute/validators`) |
| Tests | Vitest and Playwright |

## Prerequisites

- Node.js >= 20.11.0
- pnpm >= 9.0.0
- PostgreSQL (local or remote)

## Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Seed development database
pnpm db:seed
```

## Available Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start Turborepo dev servers |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Run linters across the repo |
| `pnpm typecheck` | Type-check all TypeScript |
| `pnpm test` | Run all tests |
| `pnpm test:unit` | Run Vitest unit tests |
| `pnpm test:e2e` | Run Playwright e2e tests |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm db:seed` | Seed dev database |
| `pnpm deploy:check-env` | Environment readiness audit |
| `pnpm handoff:all` | Handoff verification pipeline |
| `pnpm quality:all` | Quality audit pipeline |

## Project Structure

```
inkroute/
├── apps/
│   ├── web/          # Public site, booking intake, public API boundaries
│   ├── dashboard/    # Tenant/admin workspace
│   └── mobile/       # Expo/React Native artist mobile companion
├── packages/
│   ├── auth/         # RBAC matrix, role-permission helpers
│   ├── types/        # Shared domain types, enums, interfaces
│   ├── validators/   # Zod schemas for API/input boundaries
│   ├── db/           # Prisma schema, seed script, client export
│   ├── booking/      # Readiness scoring and booking lifecycle helpers
│   ├── payments/     # Deposit policy, Stripe drafts, refund helpers
│   ├── calendar/     # ICS, availability, buffer/conflict helpers
│   ├── notifications/# Template catalog, delivery plans
│   ├── security/     # Upload policies, rate-limit drafts, encryption
│   ├── observability/# Redaction, severity, fingerprinting
│   ├── releases/     # Feature flags, rollback/update contracts
│   ├── deployment/   # Environment/readiness/launch helpers
│   └── ...           # Testing, handoff, quality, workspace scaffolds
```

## Key Documentation

- [AGENTS.md](./AGENTS.md) — Agent workflow and policy definitions
- [ARCHITECTURE_MAP.md](./docs/ai/ARCHITECTURE_MAP.md) — System architecture overview
- [GAP_TRACKER.md](./GAP_TRACKER.md) — Known gaps and open work items
- [API_CONTRACTS.md](./API_CONTRACTS.md) — API route contracts
- [REPO_BRIEF.md](./docs/ai/REPO_BRIEF.md) — Compact repo brief

## Status

This project is in **scaffold / pre-production** stage. Several features rely on credential-gated providers (Stripe, Sentry/OpenTelemetry, Google Calendar, email/SMS/push, S3/Supabase Storage) that are not yet wired for production. Real session auth is not in place; dashboard API routes use a header-based actor/RBAC shim where implemented. PostgreSQL is not provisioned for production, and migrations are not generated or applied.

Do not claim production readiness.
