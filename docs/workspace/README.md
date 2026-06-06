# Workspace Runtime Readiness

Phase 18 adds pre-install workspace checks that help Codex/Jules/Claude Code verify monorepo wiring before provider setup. These checks are dependency-free Node scripts and are intended to produce evidence, not to mark the product production-ready.

## Commands

```bash
node scripts/workspace/audit-workspace-imports.mjs
node scripts/workspace/audit-package-scripts.mjs
node scripts/workspace/print-runtime-readiness.mjs
```

After dependency installation, use the package scripts:

```bash
pnpm workspace:imports
pnpm workspace:scripts
pnpm workspace:readiness
pnpm workspace:all
```

## Reports

Generated reports are written to `docs/workspace/manifests/`:

- `workspace-import-audit.json`
- `package-script-audit.json`
- `runtime-readiness.json`

The runtime readiness report can show `status: fail` while the command exits successfully. That is intentional: the report is a launch-readiness signal and currently reflects the missing lockfile plus open production blockers.
