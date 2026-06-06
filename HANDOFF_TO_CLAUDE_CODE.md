# Handoff to Claude Code

## Context

InkRoute Suite has a broad Phase 18 scaffold and is ready for targeted integration work after dependency install is verified. Claude Code should focus on provider boundary implementation or test/build hardening, not broad redesign.

## Required read order

1. `README.md`
2. `API_CONTRACTS.md`
3. `DEPLOYMENT.md`
4. `ENVIRONMENT_VARIABLES.md`
5. `GAP_TRACKER.md`
6. `deployment/CI_CD_RUNBOOK.md`
7. `deployment/PRODUCTION_LAUNCH_CHECKLIST.md`
8. `docs/handoff/AGENT_EXECUTION_QUEUE.md`
9. `docs/handoff/GAP_CLOSURE_PROTOCOL.md`
10. `docs/handoff/CLAUDE_PROVIDER_PROMPT.md`

## Recommended Claude Code task

Wire one test-mode provider sandbox while preserving scaffold boundaries.

Candidate provider surfaces:

- Stripe deposits and verified webhooks.
- Resend/email delivery and webhook handling.
- Twilio SMS sandbox and STOP/HELP compliance behavior.
- Google Calendar OAuth/freebusy/event sync.
- Expo Push token and test delivery.
- Sentry web/dashboard/mobile setup and release source maps.

## Guardrails

- Do not use production credentials.
- Do not expose secrets in logs or commits.
- Keep PCI scope limited to Stripe-hosted surfaces.
- Preserve tenant isolation and RBAC assumptions.
- Add tests and update `GAP_TRACKER.md` with exact evidence.
- Run `pnpm handoff:audit` after changing gap rows.
- Do not claim production-ready until provider sandbox tests pass and legal/security review is complete.

## Claude Code prompt

Pick one provider integration from the current gap tracker and implement it end to end in test/sandbox mode using the existing Phase 7-16 route boundaries and helper packages. Add env validation, webhook signature verification where applicable, persistence hooks or explicit 501 boundaries, tests, and docs. Run relevant commands and update `GAP_TRACKER.md`, `API_CONTRACTS.md`, and the applicable phase closeout with exact verification evidence.

## Phase 17 quality gate update

Phase 17 adds a quality package and dependency-free quality scripts. Use them when editing docs, provider boundaries, or gap rows:

```bash
node scripts/quality/audit-doc-links.mjs
node scripts/quality/audit-gap-evidence.mjs
node scripts/quality/print-quality-gates.mjs
```

Treat `warn` output as cleanup guidance and `fail` output as a blocker for production claims. Preserve all scaffold/credential-gated labels unless you have runtime evidence.

## Phase 18 workspace/runtime readiness note

Phase 18 added `@inkroute/workspace` and static audit scripts for workspace imports, package scripts, and runtime readiness. Use `docs/workspace/WORKSPACE_AUDIT_PROTOCOL.md` and `docs/workspace/CODEX_WORKSPACE_PROMPT.md` when preparing implementation prompts. Do not rewrite a blocked readiness report into a production-ready claim.
