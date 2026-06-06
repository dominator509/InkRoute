## InkRoute PR Checklist

### Status labels

Mark every changed area honestly:

- [ ] Implemented
- [ ] Scaffolded
- [ ] Mocked/demo-only
- [ ] Placeholder
- [ ] Untested
- [ ] Credential-gated
- [ ] Deployment-gated
- [ ] Externally dependent


### Quality gates

- [ ] I ran `node scripts/quality/audit-doc-links.mjs` or `pnpm quality:docs`.
- [ ] I ran `node scripts/quality/audit-gap-evidence.mjs` or `pnpm quality:gaps`.
- [ ] I disclosed any `warn`/`fail` output relevant to this PR.

### Gap tracker

- Gap IDs changed:
- New gap IDs added:
- Gaps closed or downgraded:
- Evidence added to `GAP_TRACKER.md`:

### Commands run

Paste exact commands and results. Do not summarize failures away.

```bash
# commands here
```

### Security/privacy

- [ ] No secrets, credentials, provider tokens, database URLs, or private keys committed.
- [ ] PII/medical/consent/payment data remains redacted in logs and docs.
- [ ] Tenant isolation assumptions are preserved.
- [ ] New uploads, webhooks, auth, payment, or notification surfaces have validation and gap coverage.

### Production honesty

- [ ] This PR does not claim production-ready unless live deployment, provider, security, legal, and test evidence exists.
- [ ] Any skipped tests, mocks, placeholders, or provider-gated logic are logged in `GAP_TRACKER.md`.
