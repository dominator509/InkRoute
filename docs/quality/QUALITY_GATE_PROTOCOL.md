# Quality Gate Protocol

## Status

Implemented as a Phase 17 scaffold. The protocol is enforceable locally through dependency-free Node scripts and is wired into the CI scaffold, but it has not run in GitHub Actions or a fully installed pnpm monorepo.

## Required checks before an agent changes production status

Run these commands and paste redacted output into the PR or handoff summary:

```bash
node scripts/handoff/verify-phase-docs.mjs
node scripts/handoff/audit-gap-tracker.mjs
node scripts/quality/audit-doc-links.mjs
node scripts/quality/audit-gap-evidence.mjs
node scripts/quality/audit-gap-tracker-diff.mjs
node scripts/quality/print-quality-gates.mjs
```

After dependencies install successfully:

```bash
pnpm handoff:all
pnpm quality:all
pnpm typecheck
pnpm test:unit
pnpm test:manifest
```

## Evidence rule

A gap may not be closed or downgraded from production-blocking unless the row includes all of the following:

- exact files changed
- exact command or provider action performed
- result/evidence summary
- verification/test needed changed to completed evidence only when it actually passed
- no secrets or private client data pasted into docs

## Failure rule

Any `fail` status from Phase 17 quality scripts means the PR must not claim production readiness. `warn` status is allowed for scaffolded rows, but warnings should be reviewed before external handoff.

## Remaining external enforcement

GitHub branch protection, required checks, PR diff validation, CODEOWNERS, and secret scanning still require repository settings outside this sandbox.
