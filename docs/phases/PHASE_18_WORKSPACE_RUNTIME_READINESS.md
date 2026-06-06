# Phase 18 — Workspace Runtime Readiness and Pre-Install Audit

## Status

Partially implemented as post-roadmap workspace/runtime hardening. This phase does not close production blockers and does not prove dependency installation, app builds, provider integrations, or deployment.

## Context reviewed

Before coding Phase 18, all 59 markdown source files in the Phase 17 artifact were enumerated and read. The reviewed docs showed that phases 0 through 17 were already scaffolded, production remained blocked, and the best next task inside ChatGPT was a dependency-free audit layer that helps external agents validate monorepo wiring before installing packages or touching providers.

## Implemented

- Added `@inkroute/workspace` dependency-light package.
- Added static workspace import/dependency audit helpers.
- Added package script contract audit helpers.
- Added runtime readiness summary helpers.
- Added dependency-free scripts:
  - `scripts/workspace/audit-workspace-imports.mjs`
  - `scripts/workspace/audit-package-scripts.mjs`
  - `scripts/workspace/print-runtime-readiness.mjs`
- Added generated manifests:
  - `docs/workspace/manifests/workspace-import-audit.json`
  - `docs/workspace/manifests/package-script-audit.json`
  - `docs/workspace/manifests/runtime-readiness.json`
- Added docs:
  - `docs/workspace/README.md`
  - `docs/workspace/WORKSPACE_AUDIT_PROTOCOL.md`
  - `docs/workspace/CODEX_WORKSPACE_PROMPT.md`
- Added root scripts:
  - `workspace:imports`
  - `workspace:scripts`
  - `workspace:readiness`
  - `workspace:all`
- Updated `tsconfig.base.json` with `@inkroute/workspace` path alias.
- Updated CI scaffold with a Phase 18 workspace readiness report step.
- Fixed dashboard package manifest declarations for discovered workspace imports.
- Replaced the placeholder lint script in `@inkroute/booking` with `tsc --noEmit`.

## Verification performed in this sandbox

Passed:

```bash
node scripts/workspace/audit-workspace-imports.mjs
node scripts/workspace/audit-package-scripts.mjs
node scripts/workspace/print-runtime-readiness.mjs
tsc --noEmit -p packages/workspace/tsconfig.json
```

Also passed dependency-light typechecks for helper packages already used in previous phases.

## Current Phase 18 report state

- Workspace import audit: pass.
- Package script audit: pass.
- Runtime readiness report: blocked/fail by design because `pnpm-lock.yaml` is still absent and production-blocking gaps remain open.

The readiness script exits successfully while writing the blocked report so CI and external agents can capture evidence without treating known launch blockers as script failures.

## Scaffolded only

- Vitest tests for `@inkroute/workspace` are scaffolded but not executed in this sandbox.
- CI step is scaffolded but not executed in GitHub Actions.
- Runtime readiness is static and does not replace real dependency install/build/test verification.

## Still blocked

- `pnpm install`.
- Lockfile generation.
- Installed monorepo `pnpm workspace:all` execution.
- Vitest execution for `@inkroute/workspace`.
- Full `pnpm typecheck`, app builds, and provider tests.
- Branch protection/required check enforcement.

## Gaps added

- `GAP-130` — Phase 18 workspace scripts not verified in installed monorepo/CI.
- `GAP-131` — workspace import audit is static and regex-based.
- `GAP-132` — runtime readiness report is not a deployment proof.
- `GAP-133` — workspace gates are not required by branch protection.

## Next best external task

Run the Codex workspace prompt in `docs/workspace/CODEX_WORKSPACE_PROMPT.md`, commit the generated lockfile, run the full verification chain, and update `GAP_TRACKER.md` with exact output.
