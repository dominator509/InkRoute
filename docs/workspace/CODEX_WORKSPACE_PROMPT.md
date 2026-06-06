# Codex Workspace Runtime Prompt

Read `README.md`, `ROADMAP.md`, `GAP_TRACKER.md`, `docs/workspace/WORKSPACE_AUDIT_PROTOCOL.md`, and `docs/handoff/GAP_CLOSURE_PROTOCOL.md` first.

Run:

```bash
corepack enable
pnpm install
pnpm workspace:all
pnpm handoff:all
pnpm quality:all
pnpm typecheck
pnpm test:unit
pnpm test:manifest
pnpm --filter @inkroute/web build
pnpm --filter @inkroute/dashboard build
```

Fix only real install/build/type/test issues. Preserve all scaffolded architecture and do not remove gaps without evidence. Commit `pnpm-lock.yaml` if generated. Update `GAP_TRACKER.md`, `TESTING_PLAN.md`, `docs/workspace/manifests/*.json`, and `docs/phases/PHASE_18_WORKSPACE_RUNTIME_READINESS.md` with exact command output, files changed, and remaining blockers.
