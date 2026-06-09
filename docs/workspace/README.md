# Workspace Runtime Readiness

Phase 18 adds pre-install workspace checks that help Codex/Jules/Claude Code verify monorepo wiring before provider setup. These checks are dependency-free Node scripts and are intended to produce evidence, not to mark the product production-ready.

The import audit checks `@inkroute/*` workspace imports, package entrypoints/exports, tsconfig aliases, and bare third-party imports declared by each owning app/package manifest. It does not replace `pnpm install`, typecheck, bundler, or peer dependency validation.

## Commands

```bash
node scripts/workspace/audit-workspace-imports.mjs
node scripts/workspace/audit-package-scripts.mjs
node scripts/workspace/print-runtime-readiness.mjs
node scripts/workspace/verify-runtime-evidence.mjs
node scripts/workspace/verify-workspace-required-checks.mjs
node scripts/workspace/verify-workspace-toolchain.mjs
```

After dependency installation, use the package scripts:

```bash
pnpm workspace:imports
pnpm workspace:scripts
pnpm workspace:runtime-evidence
pnpm workspace:readiness
pnpm workspace:required-checks
pnpm workspace:toolchain
pnpm workspace:all
```

## Reports

Generated reports are written to `docs/workspace/manifests/`:

- `docs/workspace/manifests/workspace-import-audit.json`
- `docs/workspace/manifests/package-script-audit.json`
- `docs/workspace/manifests/runtime-evidence-audit.json`
- `docs/workspace/manifests/runtime-readiness.json`
- `docs/workspace/manifests/workspace-required-checks-audit.json`
- `docs/workspace/manifests/workspace-toolchain-readiness-audit.json`

The runtime readiness report can show `status: fail` while the command exits successfully. That is intentional: the report is a launch-readiness signal and currently reflects the missing lockfile plus open production blockers.
