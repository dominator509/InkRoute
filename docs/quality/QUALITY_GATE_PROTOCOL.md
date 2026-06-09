# Quality Gate Protocol

## Status

Implemented as a Phase 17 scaffold. The protocol is enforceable locally through dependency-free Node scripts and is wired into the CI scaffold, but it has not run in GitHub Actions or a fully installed pnpm monorepo.

## Required checks before an agent changes production status

Run these commands and paste redacted output into the PR or handoff summary:

```bash
node scripts/handoff/verify-phase-docs.mjs
node scripts/handoff/audit-gap-tracker.mjs
node scripts/quality/audit-doc-links.mjs
node scripts/quality/verify-documentation-consistency.mjs
node scripts/quality/verify-documentation-inventory.mjs
node scripts/quality/audit-gap-evidence.mjs
node scripts/quality/audit-gap-tracker-diff.mjs
node scripts/quality/verify-pr-gap-diff-fixtures.mjs
node scripts/quality/verify-repository-governance.mjs
node scripts/quality/verify-required-checks.mjs
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

## Documentation consistency rule

`pnpm quality:docs` runs the Markdown link/path audit, the documentation consistency audit, and the documentation inventory audit. The consistency audit checks backticked API route references against actual web/dashboard `route.ts` handlers and rejects provider or legal readiness claims that do not remain blocked, gated, sandboxed, placeholder, or evidence-scoped. The inventory audit compares documented app/package roots with actual `apps/*` and `packages/*` workspace members.

## Repository governance rule

`pnpm quality:governance` verifies the source-controlled branch-protection prerequisites: `CODEOWNERS`, PR evidence prompts, gap-closure issue prompts, CI quality gates, PR gap-diff enforcement, handoff checks, workspace checks, and secret-management verification. It does not prove GitHub repository settings; branch protection, required status checks, CODEOWNERS review enforcement, secret scanning, and merge rules still require external GitHub settings evidence.

## Required checks rule

`pnpm quality:required-checks` verifies the source-controlled required-check contract for `main`: required package scripts exist, the CI workflow includes quality, handoff, workspace, deployment, typecheck, lint, unit coverage, and Playwright gates, and the exact branch-protection check names are documented for external GitHub settings. It does not prove those checks are required in GitHub until branch protection evidence is captured.

## Remaining external enforcement

GitHub branch protection, required checks, PR diff validation, CODEOWNERS, and secret scanning still require repository settings outside this sandbox.
