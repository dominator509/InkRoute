# Claude Code Provider Prompt

```text
Read API_CONTRACTS.md, ENVIRONMENT_VARIABLES.md, GAP_TRACKER.md, DEPLOYMENT.md, SECURITY.md, and docs/handoff/GAP_CLOSURE_PROTOCOL.md.

Pick one provider integration from the current open gaps and implement it in sandbox/test mode end to end.

Allowed first choices:
- Stripe Checkout and webhook verification.
- Resend email send plus webhook boundary.
- Twilio SMS sandbox with STOP/HELP behavior.
- Google Calendar OAuth/freebusy/event sync in a test calendar.
- Expo Push test notification flow.
- Sentry web/dashboard/mobile setup and source-map boundary.

Add env validation, webhook signature verification where applicable, idempotency/replay tests, provider contract tests, and docs. Keep secrets outside git. Preserve 501 boundaries for anything still unwired. Update GAP_TRACKER.md with exact verification evidence.
```

## Phase 17 quality gate reminder

Before editing provider docs or closing provider gaps, run `node scripts/quality/audit-doc-links.mjs` and `node scripts/quality/audit-gap-evidence.mjs`. Keep live credential work redacted and evidence-backed.
