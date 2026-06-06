# Phase 18 â€” Workspace Runtime Readiness and Pre-Install Audit

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

## 2026-06-06 command-driven workspace verification run

As part of the GitHub-first + workspace startup plan, the following were executed from this environment:

On `2026-06-06T07:55:35Z`, executed in sequence:

- `corepack enable` (exit `0`)
- `pnpm install` (exit `0`; `pnpm-lock.yaml` present at repo root)
- `pnpm workspace:all` (exit `0`)
  - `docs/workspace/manifests/workspace-import-audit.json` (`generatedAt: 2026-06-06T14:55:44.361Z`, pass)
  - `docs/workspace/manifests/package-script-audit.json` (`generatedAt: 2026-06-06T14:55:44.943Z`, pass)
  - `docs/workspace/manifests/runtime-readiness.json` (`generatedAt: 2026-06-06T14:55:45.536Z`, fail; 126 blockers across 133 gaps)
- `pnpm handoff:all` (exit `0`)
- `pnpm quality:all` (exit `0`)
- `pnpm typecheck` (exit `2`; blocked by `@inkroute/ui` React JSX typing)
- `pnpm test:unit` (exit `1`; 4 failures)
- `pnpm test:manifest` (exit `0`)
- `pnpm --filter @inkroute/web build` (exit `1`; unresolved import path `../../../../lib/seoEngine`)
- `pnpm --filter @inkroute/dashboard build` (exit `1`; `exactOptionalPropertyTypes` `destination` mismatch)

Current report state update:
- `docs/workspace/manifests/runtime-readiness.json` should be interpreted as evidence-only blocked by production gaps.
- Do not treat this state as deployment-ready; it is an execution audit capture.

## 2026-06-06 command-driven workspace verification rerun (08:02:09Z)

- `corepack enable` â€” exit `0`.
- `pnpm install` â€” exit `0`.
- `pnpm workspace:all` â€” exit `0`.
  - `docs/workspace/manifests/workspace-import-audit.json` updated (`generatedAt=2026-06-06T15:02:18.610Z`, pass, 0 findings).
  - `docs/workspace/manifests/package-script-audit.json` updated (`generatedAt=2026-06-06T15:02:19.401Z`, pass, 0 findings).
  - `docs/workspace/manifests/runtime-readiness.json` updated (`generatedAt=2026-06-06T15:02:20.060Z`, fail; 126 production blockers).
- `pnpm handoff:all` â€” exit `0`.
- `pnpm quality:all` â€” exit `0`.
- `pnpm typecheck` â€” exit `2` (first blocker remains `@inkroute/ui` React JSX typings).
- `pnpm test:unit` â€” exit `1` (4 failures in booking/payments/releases/observability tests).
- `pnpm test:manifest` â€” exit `0`.
- `pnpm --filter @inkroute/web build` â€” exit `1` (`apps/web` unresolved import `../../../../lib/seoEngine` in two SEO preview routes).
- `pnpm --filter @inkroute/dashboard build` â€” exit `1` (exact optional property mismatch in `apps/dashboard/lib/demo.ts` `destination` argument).
- Evidence source: full command stream in session logs (embedded in `GAP_TRACKER.md`).
- `pnpm-lock.yaml` remains present and unchanged for this run.

## Current Phase 18 report state

- Workspace import audit: pass.
- Package script audit: pass.
- Runtime readiness report: blocked/fail by design because `pnpm-lock.yaml` is now present; `126` production-blocking gaps remain open.
- `pnpm-lock.yaml` is now present (generated and committed).
- Remaining blocker list remains tied to unresolved domain and app/package production gaps listed in `GAP_TRACKER.md`.

The readiness script exits successfully while writing the blocked report so CI and external agents can capture evidence without treating known launch blockers as script failures.

## Scaffolded only

- Vitest tests for `@inkroute/workspace` are scaffolded but not executed in this sandbox.
- CI step is scaffolded but not executed in GitHub Actions.
- Runtime readiness is static and does not replace real dependency install/build/test verification.

## Still blocked

- Vitest execution for `@inkroute/workspace`.
- Full `pnpm typecheck`, app builds, and provider tests.
- Branch protection/required check enforcement.

## Gaps added

- `GAP-130` â€” Phase 18 workspace scripts not verified in installed monorepo/CI.
- `GAP-131` â€” workspace import audit is static and regex-based.
- `GAP-132` â€” runtime readiness report is not a deployment proof.
- `GAP-133` â€” workspace gates are not required by branch protection.

## Next best external task

Run the Codex workspace prompt in `docs/workspace/CODEX_WORKSPACE_PROMPT.md`, commit the generated lockfile, run the full verification chain, and update `GAP_TRACKER.md` with exact output.


## 2026-06-06 command-driven workspace verification rerun (08:23:41Z)

Executed from this environment with full command log:
- `docs/workspace/manifests/workspace-prompt-run-2026-06-06-4.log`

Observed outcomes:
- `corepack enable` ? exit `0`
- `pnpm install` ? exit `0`
- `pnpm workspace:all` ? exit `0`
  - `docs/workspace/manifests/workspace-import-audit.json` and `docs/workspace/manifests/package-script-audit.json` generated/updated and passing
  - `docs/workspace/manifests/runtime-readiness.json` generated/updated and still blocked only by production gaps
- `pnpm handoff:all` ? exit `0`
- `pnpm quality:all` ? exit `0`
- `pnpm typecheck` ? exit `0`
- `pnpm test:unit` ? exit `0`
- `pnpm test:manifest` ? exit `0`
- `pnpm --filter @inkroute/web build` ? exit `0`
- `pnpm --filter @inkroute/dashboard build` ? exit `0`

Current phase state:
- Workspace import and package-script audits are green.
- Runtime readiness remains flagged as `needs-attention` until production blockers are resolved with evidence-backed gap reductions.
## 2026-06-06 command-driven workspace verification rerun (15:27:54Z)

- Executed from `C:\dev\InkRoute` on branch `main`.
- Full run log: `docs/workspace/manifests/workspace-prompt-run-2026-06-06-plan.log`.
- Outcomes:
  - `corepack enable` — exit `0`.
  - `pnpm install` — exit `0`.
  - `pnpm workspace:all` — exit `0`.
  - `pnpm handoff:all` — exit `0`.
  - `pnpm quality:all` — exit `0`.
  - `pnpm typecheck` — exit `0`.
  - `pnpm test:unit` — exit `0`.
  - `pnpm test:manifest` — exit `0`.
  - `pnpm --filter @inkroute/web build` — exit `0`.
  - `pnpm --filter @inkroute/dashboard build` — exit `0`.
- Manifest outputs refreshed (by command run):
  - `docs/workspace/manifests/workspace-import-audit.json`
  - `docs/workspace/manifests/package-script-audit.json`
  - `docs/workspace/manifests/runtime-readiness.json`
  - `docs/quality/manifests/markdown-link-audit.json`
  - `docs/quality/manifests/gap-evidence-audit.json`
  - `docs/quality/manifests/quality-gates.json`
  - `docs/handoff/manifests/phase-documentation-audit.json`
  - `docs/handoff/manifests/gap-audit-report.json`
- Current status:
  - Runtime build and test chain is green in this environment.
  - Runtime readiness remains blocked by `126` production blockers.
## 2026-06-06 command-driven workspace verification rerun (15:34:26Z)

- Executed from `C:\dev\InkRoute` on branch `main`.
- Full command stream: `docs/workspace/manifests/workspace-prompt-run-2026-06-06T08-34-26Z.log`.
- Outcomes:
  - `corepack enable` — exit `0`
  - `pnpm install` — exit `0`
  - `pnpm workspace:all` — exit `0`
  - `pnpm handoff:all` — exit `0`
  - `pnpm quality:all` — exit `0`
  - `pnpm typecheck` — exit `0`
  - `pnpm test:unit` — exit `0`
  - `pnpm test:manifest` — exit `0`
  - `pnpm --filter '@inkroute/web' build` — exit `0`
  - `pnpm --filter '@inkroute/dashboard' build` — exit `0`
- Manifests generated/updated:
  - `docs/workspace/manifests/workspace-import-audit.json`
  - `docs/workspace/manifests/package-script-audit.json`
  - `docs/workspace/manifests/runtime-readiness.json`
  - `docs/handoff/manifests/phase-documentation-audit.json`
  - `docs/handoff/manifests/gap-audit-report.json`
  - `docs/quality/manifests/markdown-link-audit.json`
  - `docs/quality/manifests/gap-evidence-audit.json`
  - `docs/quality/manifests/quality-gates.json`
- Initial malformed filtered-build commands without quoted package scope produced script-level `Unknown option` parse errors in `pnpm`; commands were retried with proper quoting and passed.
- Current phase status: command chain passes; runtime readiness remains `fail` due `126` production blockers in `docs/workspace/manifests/runtime-readiness.json`.

## 2026-06-06 command-driven workspace verification rerun (15:43:59Z)

- Executed `docs/workspace/CODEX_WORKSPACE_PROMPT.md` in full sequence from `C:\dev\InkRoute`.
- Log: `docs/workspace/manifests/workspace-prompt-run-2026-06-06T08-43-37.log`.
- Outcomes:
  - `corepack enable` — PASS (`0`)
  - `pnpm install` — PASS (`0`)
  - `pnpm workspace:all` — PASS (`0`)
  - `pnpm handoff:all` — PASS (`0`)
  - `pnpm quality:all` — PASS (`0`)
  - `pnpm typecheck` — PASS (`0`)
  - `pnpm test:unit` — PASS (`14 passed, 0 failed`)
  - `pnpm test:manifest` — PASS (`{"ok":true,"manifestCount":7,"requiredFileCount":15,"declaredSuites":28}`)
  - `pnpm --filter '@inkroute/web' build` — PASS (`0`)
  - `pnpm --filter '@inkroute/dashboard' build` — PASS (`0`)
- Evidence artifacts generated/updated:
  - `docs/workspace/manifests/workspace-import-audit.json`
  - `docs/workspace/manifests/package-script-audit.json`
  - `docs/workspace/manifests/runtime-readiness.json`
  - `docs/handoff/manifests/phase-documentation-audit.json`
  - `docs/handoff/manifests/gap-audit-report.json`
  - `docs/quality/manifests/markdown-link-audit.json`
  - `docs/quality/manifests/gap-evidence-audit.json`
  - `docs/quality/manifests/quality-gates.json`
- Current readiness statement:
  - Import and package script checks pass; runtime readiness remains `fail` due production blocker count (`126/133`).


