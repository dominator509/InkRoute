# Codex Quality Gate Prompt

Read `README.md`, `ROADMAP.md`, `GAP_TRACKER.md`, `docs/handoff/GAP_CLOSURE_PROTOCOL.md`, and `docs/quality/QUALITY_GATE_PROTOCOL.md` first.

Run the Phase 17 quality gates in a real installed repo:

```bash
corepack enable
pnpm install
pnpm handoff:all
pnpm quality:all
pnpm typecheck
pnpm test:unit
pnpm test:manifest
```

Fix only real quality-gate, link, gap-row, type, test, or build failures. Do not remove gaps to make checks pass. Do not mark production-ready. Update `GAP_TRACKER.md`, `docs/phases/PHASE_17_QUALITY_GATES.md`, and handoff docs with exact command output, remaining blockers, and files changed.
