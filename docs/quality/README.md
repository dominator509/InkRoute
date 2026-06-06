# Quality Gate Folder

## Status

Implemented as Phase 17 scaffolded quality-gate automation. These files help Codex, Jules, Claude Code, local terminal users, and future CI runs prove that documentation links, gap evidence, and quality command lists remain usable.

This folder does not make the product production-ready. It adds guardrails around handoff and repository honesty.

## Commands

```bash
node scripts/quality/audit-doc-links.mjs
node scripts/quality/audit-gap-evidence.mjs
node scripts/quality/print-quality-gates.mjs
```

After dependencies are installed, equivalent package scripts are:

```bash
pnpm quality:docs
pnpm quality:gaps
pnpm quality:gates
pnpm quality:all
```

## Manifests

- `docs/quality/manifests/markdown-link-audit.json` — generated Markdown link audit.
- `docs/quality/manifests/gap-evidence-audit.json` — generated gap evidence audit.
- `docs/quality/manifests/quality-gates.json` — generated quality gate catalog.

## Guardrail

Warnings are expected while the repo is scaffolded. Failures should block gap closure or production-claim changes until fixed with evidence.
