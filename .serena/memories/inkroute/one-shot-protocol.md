# InkRoute one-shot protocol

Use this card when a task starts to sprawl. The goal is one coherent file set, one read pass, and one patch pass.

## Rule

If the next edit is clear, patch it. Do not gather confirmation evidence after the done shape is reachable.
If a route packet is used, `minimumFiles` is the maximum coherent first-pass file set, not a browsing list. Read that set once, patch once, and stop when the printed `done` shape is reachable.

## Steps

1. Name the smallest coherent file set before editing.
2. Read each required file once.
3. Patch in one pass.
4. Do not re-read changed files just to inspect your own work.
5. Do not run validation unless the user asks.
6. If validation would normally be next, report `not run` and offer the next scoped command.

## Serena admission

- Exact file, gap row, route, helper, dependency, lockfile mismatch, package script, or assertion known: skip Serena.
- Owner unknown: one Serena owner lookup.
- Shared exported contract changes: one Serena references lookup.
- Still ambiguous after one follow-up: use scoped RTK search and move.

## Obsidian admission

- Prior accepted architecture/API decision changes the edit: read one specific note.
- Durable decision, Codex review, or DeepSeek handoff completed: append one concise note.
- Current source, test, branch, diff, tracker, CI, provider, and runtime state belong in repo evidence, not Obsidian.

## RTK command shape

Use `rtk proxy powershell -NoProfile -Command "<scoped command>"` for PowerShell builtins and pipelines. Escape `$` as backtick-dollar inside RTK-proxied PowerShell command strings from Codex or an outer PowerShell.
