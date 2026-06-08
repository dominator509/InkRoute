# Agent Execution Queue

## Status

Implemented/scaffolded in Phase 16 and hardened in Phase 17. This queue is machine-readable in `docs/handoff/manifests/agent-execution-queue.json` and human-readable here. No external agent has executed these tasks yet.

## Execution order

1. **Codex — install and runtime verification**
   - Priority: Critical
   - Gaps: `GAP-001`, `GAP-105`, `GAP-113`, `GAP-121`
   - Goal: install dependencies, commit `pnpm-lock.yaml`, run typecheck/unit/build commands, and update gap evidence.

2. **Codex/local terminal — quality gate enforcement**
   - Priority: Critical
   - Gaps: `GAP-122`, `GAP-124`, `GAP-126`, `GAP-127`, `GAP-129`
   - Goal: run Phase 17 quality gates in an installed repo/CI, fix real failures, and wire PR diff enforcement before any production blocker is closed.

3. **Jules — database/auth/storage foundation**
   - Priority: Critical
   - Gaps: `GAP-002`, `GAP-003`, `GAP-005`, `GAP-095`, `GAP-117`
   - Goal: provision non-production Postgres/auth/storage, run Prisma validation and seed, and prove tenant isolation.

4. **Claude Code — one provider sandbox**
   - Priority: High
   - Gaps: `GAP-004`, `GAP-049`, `GAP-050`, `GAP-061`, `GAP-062`, `GAP-063`, `GAP-080`, `GAP-110`
   - Goal: implement one credential-gated provider boundary end to end in sandbox mode with tests and webhook verification when applicable.

5. **Local terminal/operator — launch readiness evidence bundle**
   - Priority: High
   - Gaps: `GAP-113`, `GAP-118`, `GAP-120`, `GAP-121`, `GAP-122`
   - Goal: run deployment, handoff, and quality readiness scripts, collect redacted evidence, and assign launch owners.

## Dependency-free commands

Run from the repo root:

```bash
node scripts/handoff/verify-phase-docs.mjs
node scripts/handoff/audit-gap-tracker.mjs
node scripts/handoff/print-next-agent-tasks.mjs
node scripts/quality/audit-doc-links.mjs
node scripts/quality/audit-gap-evidence.mjs
node scripts/quality/print-quality-gates.mjs
```

After dependencies are installed, use the package scripts:

```bash
pnpm handoff:all
pnpm handoff:verify-tooling
pnpm handoff:verify-task-sync
pnpm quality:all
```

## Guardrails

- Do not mark the repo production-ready after running only these scripts.
- Treat the output as routing and quality evidence, not runtime proof.
- Every external execution result must be written back to `GAP_TRACKER.md` with exact commands, files changed, and verification evidence.
- Do not paste secrets, provider keys, database URLs, webhook secrets, or auth tokens into gap rows or handoff docs.

## Execution ledger

External agent execution results are tracked in `docs/handoff/manifests/agent-execution-ledger.json` and verified with:

```bash
pnpm handoff:verify-ledger
```

Keep each ledger entry redacted. A completed task must include commands run, files changed, evidence artifact labels, remaining gaps, and `secret_safe_redacted` status. Do not paste provider secrets, database URLs, auth tokens, private client data, medical notes, or payment payloads into the ledger.

## GitHub task tracking sync

GitHub issue/project tracking plans are mapped in `docs/handoff/manifests/agent-task-tracking-sync.json` and verified with:

```bash
pnpm handoff:verify-task-sync
```

The sync manifest defines one planned issue per queued task, with target labels, priority labels, gap IDs, and acceptance evidence fields. Keep issue and project URLs empty until the items are actually created in GitHub.

## Phase 18 addition — workspace readiness verification

**Target:** Codex/local terminal  
**Priority:** Critical  
**Gaps:** `GAP-001`, `GAP-130`, `GAP-131`, `GAP-132`, `GAP-133`

Run workspace audits before and after dependency installation. Commit the lockfile if generated, fix real package manifest issues, and update the Phase 18 closeout plus `GAP_TRACKER.md` with exact command output.
