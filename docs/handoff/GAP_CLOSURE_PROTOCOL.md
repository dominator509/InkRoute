# Gap Closure Protocol

## Status

Implemented/scaffolded in Phase 16. This protocol makes gap closure safer for Codex, Jules, Claude Code, Cursor, Replit, and local terminal work. It does not itself close any production blocker.

## Required evidence before closing or downgrading a gap

A gap can only be closed or downgraded when the following are recorded in `GAP_TRACKER.md`:

1. Exact command or provider action performed.
2. Files changed.
3. Environment where it ran, such as local, CI, preview, staging, provider sandbox, or production.
4. Redacted proof of success, such as command output, CI URL, deployment URL, provider event ID, test report, screenshot path, or legal approval reference.
5. New residual risks or follow-up gaps if any remain.

## Gap status language

Use one of these status patterns:

- `Open — ...`
- `Partially implemented — ...`
- `Credential-gated — ...`
- `Deployment-gated — ...`
- `Externally blocked — ...`
- `Closed with evidence — ...`

Do not use vague status like `done`, `fixed`, `complete`, or `ready` without evidence.

## PR checklist for gap changes

A pull request that touches `GAP_TRACKER.md` must include:

- Gap IDs changed.
- Commands run.
- Evidence attached or linked.
- Confirmation that no secrets are present.
- Confirmation that production readiness was not overstated.

## Critical production blockers

As of Phase 16, the first critical external blockers remain:

- Dependency install and lockfile.
- Prisma validation/migrations/seed against a real database.
- Auth/session and tenant isolation enforcement.
- Private storage/uploads.
- Stripe Checkout/webhook implementation.
- Runtime builds and tests.
- Provider provisioning and secret management.
- Legal review.

## Phase 17 quality gate commands

Run these before proposing any production-blocking gap closure:

```bash
node scripts/quality/audit-doc-links.mjs
node scripts/quality/audit-gap-evidence.mjs
node scripts/quality/print-quality-gates.mjs
```

After dependencies are installed, run:

```bash
pnpm quality:all
```

A `warn` status is acceptable for scaffold-era records but must be disclosed in the PR. A `fail` status blocks production-readiness claims until fixed.
