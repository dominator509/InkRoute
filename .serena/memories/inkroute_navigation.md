# InkRoute Serena Navigation Guide

Use this memory when starting InkRoute work.

## Stable entrypoints
- `docs/ai/REPO_BRIEF.md`: concise stack, app/package inventory, constraints.
- `docs/ai/ARCHITECTURE_MAP.md`: app/package boundaries and data-flow expectations.
- `docs/ai/API_CONTRACTS.md`: route contracts, auth requirements, response envelope.
- `GAP_TRACKER.md`: production blocker ledger and verification requirements.
- `spec/PROJECT_STATE.md`: retrofit/trinity state.
- `spec/HANDOFF_QUEUE.md`: retrofit `LEGACY-GAP-*` queue.

## Search defaults
- Route the task before using tools: exact file known means skip Serena; owner unknown means one lookup; shared exported contract means one references lookup; ambiguous after one follow-up means scoped RTK fallback.
- Prefer one Serena symbol lookup or reference query for TypeScript source when the owning file is not already known.
- Skip Serena for exact-file local edits; read the smallest target slice and patch.
- If Serena is unavailable or ambiguous after one follow-up query, state the fallback once and use scoped RTK search.
- Use pattern search scoped to `apps/*`, `packages/*`, `scripts/*`, or a named doc folder.
- Prefix shell commands with `rtk`; use `rtk proxy` for PowerShell pipelines or exact raw command behavior.
- Avoid `docs/ai/repomix-summary.xml`, `spec/retrofit/**`, `node_modules`, `coverage`, generated manifests, `.claude`, `.turbo`, `.next`, and tsbuildinfo unless explicitly requested.

## Obsidian discipline
- Obsidian is project memory only; repo files and current diffs are authoritative.
- Read at most one targeted InkRoute note when prior decisions materially change the implementation or review.
- Append only concise decisions, Codex reviews, or DeepSeek handoffs after results are known.
- Keep local vault state untracked through `.obsidian/`; do not commit exported personal notes or vault settings.
- Link memory notes back to repo paths, gap IDs, or decision IDs instead of copying logs.
- Do not configure Obsidian, read the whole vault, or store secrets during gap-closure work.

## Architecture reminders
- Public routes: `apps/web/app/api/public/[tenantSlug]`.
- Dashboard routes: `apps/dashboard/app/api`.
- Shared validators: `packages/validators/src`.
- Auth/RBAC: `packages/auth/src`.
- Prisma schema/client: `packages/db/prisma/schema.prisma` and `packages/db/src`.
- Quality/workspace/handoff automation: `scripts/quality`, `scripts/workspace`, `scripts/handoff`, plus matching packages.

## Safety boundaries
- Never touch secrets, `.env`, production infra, provider dashboards, or legal/compliance copy without explicit approval.
- Preserve existing frontend style unless the task is explicitly UI/aesthetic work.
- Treat generated audit manifest changes as evidence output, not source fixes, unless the task asks to update them.
