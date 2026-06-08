# Repo Brief

Truth-pass date: 2026-06-08. Keep this concise and stable. Do not duplicate `docs/ai/repomix-summary.xml`.

## Purpose

InkRoute Suite is a multi-tenant tattoo artist SaaS platform:

- Public artist websites for SEO, portfolio/travel discovery, booking intake, and public-safe status.
- Dashboard workspace for authenticated tenant/admin operations.
- Expo mobile companion for artist mobility, travel work, notifications, and offline-adjacent flows.

## Stack

| Layer | Choice |
| --- | --- |
| Runtime | Node.js >= 20.11.0 |
| Package manager | pnpm >= 9.0.0 workspaces |
| Language | TypeScript 5.5+ |
| Web/dashboard | Next.js App Router |
| Mobile | Expo / React Native |
| ORM / DB | Prisma + PostgreSQL |
| Monorepo | Turborepo |
| Validation | Zod in `@inkroute/validators` |
| Tests | Vitest and Playwright scaffolds |
| Planned providers | Stripe, Sentry/OpenTelemetry, Google Calendar, email/SMS/push, S3 or Supabase Storage |

## Main Apps

| App | Path | Role | Current state |
| --- | --- | --- | --- |
| `@inkroute/web` | `apps/web` | Public site, booking intake, public API boundaries | Static/demo pages plus partial API persistence for selected routes |
| `@inkroute/dashboard` | `apps/dashboard` | Tenant/admin workspace | Static dashboard UI plus header-based API auth/RBAC shim on several API routes |
| `@inkroute/mobile` | `apps/mobile` | Artist mobile companion | Expo scaffold; no real auth/API/push runtime |

## Main Packages

| Package | Domain |
| --- | --- |
| `auth` | RBAC matrix, role-permission helpers, tenant-access helper |
| `types` | Shared domain types, enums, interfaces |
| `validators` | Zod schemas for API/input boundaries |
| `db` | Prisma schema, seed script, client export |
| `booking` | Readiness scoring and booking lifecycle helpers |
| `payments` | Deposit policy, Stripe session drafts, refund/no-show policy helpers |
| `calendar` | ICS, availability, buffer/conflict, Google draft payload helpers |
| `seo` | JSON-LD, sitemap, SEO audit/content helpers |
| `notifications` | Template catalog, delivery plans, webhook interpretation helpers |
| `security` | Upload policies, rate-limit drafts, encryption/key readiness, privacy/trust helpers |
| `observability` | Redaction, severity, fingerprint, alert/issue drafts |
| `releases` | Release candidates, feature flags, rollback/update contracts |
| `deployment` | Environment/readiness/launch/handoff helpers |
| `testing`, `handoff`, `quality`, `workspace` | QA, handoff, quality, and workspace audit scaffolds |
| `config`, `ui`, `analytics`, `mobile` | Demo config, shared UI primitives, analytics contracts, mobile support helpers |

## Main Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | `turbo dev` |
| `pnpm build` | `turbo build` |
| `pnpm lint` | `turbo lint` |
| `pnpm typecheck` | `turbo typecheck` |
| `pnpm test` | `turbo test` |
| `pnpm test:unit` | `vitest run` |
| `pnpm test:e2e` | `playwright test` |
| `pnpm db:generate` | Prisma client generation |
| `pnpm db:migrate` | Prisma migration |
| `pnpm db:seed` | Seed dev database |
| `pnpm deploy:check-env` | Safe env readiness audit |
| `pnpm handoff:all` | Handoff verification pipeline |
| `pnpm quality:all` | Quality audit pipeline |
| `pnpm workspace:all` | Workspace audit pipeline |

## Current Constraints

- Dependencies are not installed in this environment; there is no verified lockfile/runtime install.
- PostgreSQL is not provisioned for production, migrations are not generated/applied, and seed execution is unverified.
- Real session auth is not wired. Dashboard API routes currently use a header-based actor/RBAC shim where implemented.
- Several public/dashboard API routes have partial DB/local fallback behavior, but provider workers and full tenant-isolated integration tests remain open.
- Stripe, Sentry/OpenTelemetry, Google Calendar, storage, email/SMS, push, and CI/provider deployments remain credential- or provider-gated.
- Legal/compliance language remains placeholder until reviewed by qualified counsel.

## Do Not Touch Without Approval

- Secrets, `.env` files, provider credentials, production infrastructure, and CI secret settings.
- Legal/compliance language for consent, privacy, terms, medical/safety, deposits, SMS, or aftercare.
- Unrelated app code, UI branding, assets, and design-system styling.
- Deployment/provider mutations, release enablement, rollback/OTA changes, or production launch claims without evidence.
- `AGENTS.md` and `CLAUDE.md` unless the task explicitly authorizes agent-policy edits.
