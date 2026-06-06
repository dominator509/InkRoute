# Agent Operating Guide

## Prime directive

Build real, modular, production-leaning code. Do not describe imaginary integrations as complete. Every placeholder, mock, untested integration, missing credential, runtime limit, or environment gap must be logged in `GAP_TRACKER.md`.

## Rust Token Killer (RTK) protocol

Rust Token Killer (RTK) is active for this repository on every chat. Before responding, parse and compress all repository outputs (commands, file reads, script results) through an automatic reduction pass that keeps only:

1. actionable decisions
2. concrete file/line deltas
3. blocking risks
4. required next actions

Avoid returning raw or redundant verbose output. Favor compact summaries and concise diff-level evidence.

## Read order before coding

1. `PRODUCT_REQUIREMENTS.md`
2. `ARCHITECTURE.md`
3. `ROADMAP.md`
4. `DATABASE_SCHEMA.md`
5. `API_CONTRACTS.md`
6. `GAP_TRACKER.md`
7. Relevant package/app files

## Status labels

Use these labels in summaries and commit messages:
- Implemented
- Scaffolded
- Mocked
- Placeholder
- Untested
- Credential-gated
- Deployment-gated
- Externally dependent

## Coding standards

- TypeScript everywhere.
- Keep files small and named by responsibility.
- Prefer shared types and validators.
- Add comments only where they clarify non-obvious decisions.
- Do not add unchecked `any` except at provider boundaries with a follow-up gap.
- Do not introduce a placeholder without a matching gap ID.
- Do not add public routes that expose tenant/private data without auth and tenant checks.

## App boundaries

- `apps/web` must stay public/SEO/conversion focused.
- `apps/dashboard` must stay authenticated/admin focused.
- `apps/mobile` must stay artist mobility focused.
- Shared business contracts belong in `packages/*`, not duplicated in app folders.

## Database rule

Every tenant-owned model must include `tenantId` and be tested for tenant isolation before production.

## Security rule

Reference images, client PII, medical notes, consent signatures, and payment records are sensitive. Do not expose them in public routes or demo logs.

## Handoff protocol

When finishing a phase:
1. Update `GAP_TRACKER.md`.
2. Update docs impacted by the phase.
3. Summarize files changed.
4. State what works, what is scaffolded, and what remains untested.
5. Add a concrete next-agent prompt.

## Phase 12 release guardrail

Do not enable release, feature flag, deployment, rollback, or mobile OTA mutations unless the relevant gap verification is satisfied. In this repo state, `@inkroute/releases` is dependency-light scaffold logic, dashboard/API actions are non-persistent, and `.github/workflows/release-governance.yml` is dry-run only. Any Codex/Jules/Claude Code handoff that touches releases must preserve audit logging, RBAC, tenant isolation, protected environments, and rollback evidence.

## Phase 14 testing guardrail

Do not claim a test, build, Playwright flow, mobile run, provider contract, accessibility audit, or CI workflow passes unless it was executed in the current environment with evidence. Scaffolded tests must stay mapped to `GAP_TRACKER.md` until dependency/runtime/provider blockers are resolved. Keep testing files meaningful to tattoo-specific workflows: booking readiness, deposits/no-shows, Nomad Mode, tenant isolation, consent/privacy, provider boundaries, SEO, and public conversion paths.

## Phase 15 deployment/handoff rule

Before attempting deployment work, read:

1. `DEPLOYMENT.md`
2. `deployment/LOCAL_SETUP.md`
3. `deployment/CI_CD_RUNBOOK.md`
4. `deployment/PRODUCTION_LAUNCH_CHECKLIST.md`
5. `GAP_TRACKER.md`

Use `pnpm deploy:check-env`, `pnpm deploy:checklist`, and `pnpm deploy:gaps` as safe dependency-free checks. Do not mark deployment, launch, or production readiness complete without real provider evidence, CI logs, tests, and rollback proof.

## Phase 16 agent execution rule

Before running external-agent or provider work, read:

1. `docs/handoff/AGENT_EXECUTION_QUEUE.md`
2. `docs/handoff/GAP_CLOSURE_PROTOCOL.md`
3. `HANDOFF_TO_CODEX.md`
4. `HANDOFF_TO_JULES.md`
5. `HANDOFF_TO_CLAUDE_CODE.md`
6. `GAP_TRACKER.md`

Use `pnpm handoff:verify-docs`, `pnpm handoff:audit`, and `pnpm handoff:next` after dependencies are installed. In this ChatGPT environment, use the direct Node scripts under `scripts/handoff/`. Do not close or downgrade gaps without command/provider evidence and secret-safe documentation.

## Phase 17 quality gate rule

Before an agent closes, downgrades, or rewords a production-blocking gap, run the Phase 17 quality checks:

```bash
node scripts/quality/audit-doc-links.mjs
node scripts/quality/audit-gap-evidence.mjs
node scripts/quality/print-quality-gates.mjs
```

After dependency installation, run `pnpm quality:all`. Warnings are allowed only when disclosed; failures block production-readiness claims.

## Phase 18 workspace audit rule

Before an agent modifies package manifests, closes dependency/tooling gaps, or starts provider setup, run the Phase 18 workspace scripts and preserve generated reports:

```bash
node scripts/workspace/audit-workspace-imports.mjs
node scripts/workspace/audit-package-scripts.mjs
node scripts/workspace/print-runtime-readiness.mjs
```

If dependency installation is available, run `pnpm workspace:all` as well. Runtime readiness can report blocked while the command succeeds; that is evidence, not a release approval.
