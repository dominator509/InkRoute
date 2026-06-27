# Repo Inventory

generated_at: 2026-06-12T09:02:24Z  
generated_by: agent:codex-phase0a  
retrofit_tag: pre-retrofit-20260612T090224Z  
retrofit_branch: retrofit/baseline-v1  
source_zip: C:/Users/domin/Downloads/baseline_v1_retrofit_complete.zip

## Preflight Status Snapshot

```text
M AGENTS.md
 M apps/dashboard/tsconfig.tsbuildinfo
 M apps/web/tsconfig.tsbuildinfo
 M packages/ui/src/input.tsx
?? .claude/
?? .repomixignore
?? .serena/
?? AGENTS.md.bak-20260607-221831
?? CLAUDE.md
?? docs/ai/TASK_BRIEF_TEMPLATE.md
?? docs/ai/repomix-summary.xml
```

## Existing Docs

- Markdown files discovered outside `.git`, `node_modules`, `.claude`, `.serena`, and generated output: 99
- Primary stable docs: `README.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `API_CONTRACTS.md`, `GAP_TRACKER.md`, `docs/ai/*`, `docs/handoff/*`, `docs/quality/*`, `docs/workspace/*`

## Source Tree Summary

| Module | Language | Lines | Source files | Test files | Has tests |
| --- | --- | ---: | ---: | ---: | --- |
| `apps/dashboard` | ts | 19707 | 165 | 58 | yes |
| `apps/mobile` | ts | 4689 | 52 | 18 | yes |
| `apps/web` | ts | 40597 | 298 | 132 | yes |
| `deployment` | js | 588 | 9 | 0 | no |
| `packages/analytics` | ts | 389 | 2 | 1 | yes |
| `packages/auth` | ts | 2539 | 2 | 1 | yes |
| `packages/booking` | ts | 2146 | 2 | 1 | yes |
| `packages/calendar` | ts | 2824 | 2 | 1 | yes |
| `packages/config` | ts | 1598 | 3 | 2 | yes |
| `packages/db` | ts | 2183 | 9 | 3 | yes |
| `packages/deployment` | ts | 2991 | 2 | 1 | yes |
| `packages/handoff` | ts | 1228 | 2 | 1 | yes |
| `packages/mobile` | ts | 2297 | 4 | 2 | yes |
| `packages/notifications` | ts | 4719 | 2 | 1 | yes |
| `packages/observability` | ts | 3349 | 2 | 1 | yes |
| `packages/payments` | ts | 2434 | 2 | 1 | yes |
| `packages/quality` | ts | 2444 | 2 | 1 | yes |
| `packages/releases` | ts | 2799 | 3 | 2 | yes |
| `packages/security` | ts | 5763 | 3 | 2 | yes |
| `packages/seo` | ts | 3766 | 2 | 1 | yes |
| `packages/testing` | ts | 2305 | 2 | 1 | yes |
| `packages/types` | ts | 441 | 1 | 0 | no |
| `packages/ui` | ts | 536 | 13 | 1 | yes |
| `packages/validators` | ts | 1311 | 16 | 1 | yes |
| `packages/workspace` | ts | 1506 | 2 | 1 | yes |
| `playwright.config.ts` | ts | 53 | 1 | 0 | no |
| `scripts` | js | 2453 | 23 | 0 | no |
| `spec` | python | 23 | 3 | 0 | no |
| `testing` | js | 216 | 4 | 0 | no |
| `vitest.workspace.ts` | ts | 49 | 1 | 0 | no |

## Test Coverage Estimate

- Source files counted: 634
- Test files counted: 234
- File-ratio estimate: 36.9%

## CI and Build Config

- CI config present: yes
- Workflow files: `.github/workflows/ci.yml`, `.github/workflows/release-governance.yml`
- Build config present: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `vitest.workspace.ts`, `playwright.config.ts`
- CI working status: unknown at discovery time; live evidence remains governed by `GAP_TRACKER.md`.

## Dependencies

- Workspace `package.json` files: 25
- Declared dependency entries across workspaces: 120
- Outdated count: unknown; dependency runtime/install evidence remains a separate production blocker.

## Env Vars Referenced

- `ALERT_EMAIL_PROVIDER`
- `ALERT_ON_CALL_OWNER`
- `ALERT_WORKER_TOKEN`
- `AUTH_SECRET`
- `BOOKING_SUBMISSION_BOT_SECRET`
- `CI`
- `CSRF_SECRET`
- `DASHBOARD_BASE_URL`
- `DATABASE_URL`
- `DIRECT_URL`
- `EAS_PROJECT_ID`
- `EAS_TOKEN`
- `EXPO_PUBLIC_APP_ENV`
- `EXPO_PUBLIC_RUNTIME_VERSION`
- `EXPO_PUBLIC_SENTRY_DSN`
- `GITHUB_BASE_REF`
- `GITHUB_EVENT_NAME`
- `GITHUB_EVENT_PATH`
- `GITHUB_HEAD_SHA`
- `GITHUB_ISSUE_DISPATCH_ENABLED`
- `GITHUB_ISSUE_TEMPLATE_PATH`
- `GITHUB_ISSUE_TOKEN`
- `GITHUB_REPOSITORY`
- `GITHUB_SHA`
- `GITHUB_TOKEN`
- `INCIDENT_PROVIDER_WEBHOOK_URL`
- `LEGAL_REVIEW_STATUS`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_DASHBOARD_URL`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`
- `NEXT_RUNTIME`
- `NODE_ENV`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `OTEL_SERVICE_NAME`
- `OTEL_TRACES_SAMPLER_ARG`
- `PAGERDUTY_ROUTING_KEY`
- `PLAYWRIGHT_SKIP_WEB_SERVER`
- `RELEASE_GOVERNANCE_DISPATCH_ENABLED`
- `RELEASE_INCIDENT_OWNER`
- `SECURITY_ENCRYPTION_KEY_ID`
- `SECURITY_ENCRYPTION_PRIMARY_KEY`
- `SECURITY_ENCRYPTION_SECONDARY_KEY`
- `SECURITY_ENCRYPTION_SECONDARY_KEY_ID`
- `SENDGRID_API_KEY`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_RELEASE`
- `SENTRY_WEBHOOK_SECRET`
- `SLACK_WEBHOOK_URL`
- `SMS_PROVIDER_ENABLED`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VERCEL_ENV`
- `VERCEL_GIT_COMMIT_SHA`
- `VERCEL_TOKEN`
- `WEB_BASE_URL`

## Drift Hints

- TODO/FIXME/HACK files sampled: 1
- `packages/quality/tests/quality-gates.test.ts`
- Secret-pattern candidates: none

## Candidate Drift Locations

| Location | Category | Heuristic | Default tier |
| --- | ---: | --- | --- |
| `root/docs and docs/ai` | 1 | Existing architecture/spec docs predate the trinity retrofit and must be cross-referenced rather than overwritten. | T1 |
| `spec/PROJECT_STATE.md` | 2 | No trinity deterministic context snapshot existed before retrofit bootstrap. | T1 |
| `spec/HANDOFF.md and spec/HANDOFF_QUEUE.md` | 5 | Retrofit handoff state was not separated from production GAP_TRACKER governance. | T1 |
| `.github/workflows/ci.yml` | 8 | CI exists but current quality/job evidence remains tracked as open production blockers. | T1 |
| `apps/* and packages/*` | 6 | Inventory found 7 source modules without colocated test files. | T4 |
| `package.json and workspace packages` | 7 | Dependency install/runtime evidence remains tracked separately in GAP_TRACKER and must not be collapsed into retrofit docs. | T4 |
| `API/provider readiness language` | 4 | Provider-ready, local-runtime, and production-ready terms require continued glossary discipline across docs and gaps. | T4 |
| `legacy source tree` | 3 | Existing files may not contain SPEC-DERIVED markers or trinity conventions and are deferred until one-file DEC approvals. | T4 |

## Inventory Exit Notes

- This inventory is additive and does not modify legacy source/config files.
- Existing `GAP_TRACKER.md` remains the production honesty ledger.
- Retrofit-specific inherited drift is catalogued in `/spec/HANDOFF_QUEUE.md`.
