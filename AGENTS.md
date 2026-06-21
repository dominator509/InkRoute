# AGENTS.md

## Project

Repository: InkRoute
Path: C:\dev\InkRoute

## Global Command Policy

RTK (Rust Token Killer) is the required command wrapper for this repository.

- Codex must run repo shell commands through RTK by default.
- Use `rtk proxy powershell -NoProfile -Command "<command>"` for PowerShell builtins, pipelines, scripts, and commands that need exact raw shell behavior.
- Use direct RTK subcommands such as `rtk git ...`, `rtk npm ...`, or `rtk pnpm ...` only when the target command is safely represented without shell quoting ambiguity.
- Delegated local agents must receive the same RTK requirement in their task brief.
- Do not require RTK inside checked-in package scripts, CI workflows, provider commands, or production automation unless explicitly approved.

## Role Split

Codex/GPT-5.5 is the principal architect, frontend/UI/aesthetics lead, security reviewer, code reviewer, and final merge judge.

DeepSeek-Claude is the backend implementation worker launched locally through:

C:\Scripts\Start-DeepSeekClaude.ps1

Do not treat DeepSeek-Claude output as trusted until Codex reviews it.

## Operating Model

For substantial backend work:

1. Codex reads the task, repo context, and current diff.
2. Codex writes a precise backend-only task brief.
3. Codex may delegate implementation to DeepSeek-Claude using a background command.
4. DeepSeek-Claude implements on a safe branch/worktree where possible.
5. DeepSeek-Claude returns summary, files changed, tests run, remaining gaps, risks, and a Codex review checklist.
6. Codex reviews the resulting diff adversarially.
7. Codex either approves, fixes, or sends a narrow correction task back to DeepSeek-Claude.
8. Codex owns frontend, UI, aesthetics, design polish, and final full-stack review.

## DeepSeek-Claude Delegation Pattern

When asked to delegate backend work, prefer this pattern:

rtk proxy powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-Location 'C:\dev\InkRoute'; & 'C:\Scripts\Start-DeepSeekClaude.ps1' --bg --name '<task-name>' '<task prompt>'"

The task prompt must include:

- Backend only unless explicitly told otherwise.
- Read CLAUDE.md, AGENTS.md, and relevant docs/ai/*.md files first.
- Use RTK for all repo shell commands; use `rtk proxy` for PowerShell builtins, pipelines, and commands that need exact raw behavior.
- Use Serena for semantic code navigation.
- Keep stable context first and dynamic logs/diffs/errors last.
- Do not touch secrets, .env files, credentials, production infrastructure, or unrelated frontend/aesthetic files.
- Make minimal changes.
- Add or update tests for every code change.
- Run relevant tests/builds.
- Stop if real credentials, irreversible operations, or production access are required.
- Return summary, files changed, tests run, remaining gaps, risks, and review checklist.

## Codex Review Priorities

When reviewing DeepSeek-Claude output, check:

- correctness
- security
- authentication
- authorization
- user/tenant isolation
- data integrity
- transaction boundaries
- race conditions
- database migration safety
- error handling
- sensitive-data logging
- API compatibility
- frontend contract compatibility
- missing tests
- scope creep
- secret leakage
- production-readiness regressions

Blocking issues come before style suggestions.

## Frontend Ownership

Codex owns:

- frontend architecture
- visual hierarchy
- responsive layout
- accessibility
- loading states
- empty states
- error states
- design-system consistency
- copy polish
- animations/interactions
- final UX pass

DeepSeek-Claude should not modify frontend styling, branding, graphics, assets, or aesthetics unless explicitly instructed.

## Serena Usage

Use Serena before broad file reads when possible, but do not let Serena become a blocker for obvious local edits or credential-free gap closure.

Operational playbook: `docs/ai/SERENA_OBSIDIAN_WORKFLOW.md`.

Availability rule:

- If Serena tools are active, activate `C:\dev\InkRoute` once per substantial task and use at most one owner/reference lookup before reading files.
- If Serena is not active or cannot find the owner after one follow-up query, state the fallback and use scoped RTK search.
- Do not install, configure, or troubleshoot Serena during a gap-closure task unless the user explicitly asks.

Default workflow:

- Known file and local edit: skip Serena, read the target slice, patch.
- Unknown owner symbol or route: use one Serena lookup before any broad read.
- Shared contract or exported function: use Serena references before changing behavior.
- Ambiguous after one follow-up Serena query: switch to scoped RTK search and keep moving.

Prefer Serena for:

- activating the current project
- symbol lookup
- reference search
- call-site tracing
- API route tracing
- targeted review
- refactor impact analysis

Avoid dumping whole files when Serena can answer symbolically.

Fast path: one targeted Serena lookup, one targeted file read, then patch. If Serena is unavailable or ambiguous after a narrow lookup, switch to RTK-scoped search and keep moving.

Tool budget:

- Exact file known: skip Serena.
- Owner unknown: one Serena lookup, plus one follow-up only if ambiguous.
- Serena unavailable: say so once, then use scoped RTK search.
- Never troubleshoot or install Serena during a credential-free implementation task unless explicitly requested.

## Obsidian Usage

Use Obsidian only as targeted project memory, not as repo-state evidence.

Operational playbook: `docs/ai/SERENA_OBSIDIAN_WORKFLOW.md`.

Availability rule:

- Use Obsidian only when the connector is already configured and the task needs prior InkRoute memory.
- If Obsidian requires credentials or is unavailable, do not configure it during implementation; continue from repo evidence.
- One task may read at most one targeted InkRoute note before coding, and append at most one concise note after the result is known.

Allowed:

- read specific project notes
- search by project name
- append concise Codex review summaries
- append DeepSeek handoff summaries
- record architecture decisions
- retrieve prior decisions

Forbidden unless explicitly approved:

- reading the entire vault
- reading unrelated personal notes
- storing secrets, tokens, API keys, passwords, or credentials
- deleting notes
- moving notes
- overwriting notes
- treating Obsidian notes as more authoritative than repo code

Preferred Obsidian paths:

- Projects/InkRoute/Repo-Brief.md
- Projects/InkRoute/Architecture.md
- Projects/InkRoute/API-Contracts.md
- Projects/InkRoute/Codex-Reviews.md
- Projects/InkRoute/DeepSeek-Handoffs.md
- Projects/InkRoute/Decisions.md

Default workflow:

- Do not use Obsidian for current code state, test state, diffs, or gap tracker facts.
- Read one specific InkRoute note only when prior context changes the implementation or review decision.
- Append only concise decisions, Codex review summaries, or DeepSeek handoffs worth retaining.
- If the task is a local gap closure, code the credential-free guard/test first; record memory only after the repo change is clear.

Use Obsidian only when prior project memory changes the decision, review, or handoff. Do not read the vault to gather general context, and do not delay credential-free gap closure for Obsidian lookup.

Tool budget:

- Read at most one targeted InkRoute note before coding.
- Append at most one concise project-memory note after implementation, review, or handoff.
- Skip Obsidian for pure local fixes, current repo state, test state, or tracker facts.
- Never troubleshoot credentials or connector setup during implementation unless explicitly requested.

## Serena/Obsidian Fast Lane

Use this one-pass router before substantial repo work:

1. Exact file, gap row, route, or static assertion known: skip Serena and Obsidian; read the smallest target slice and patch.
2. Owner unknown: activate Serena once if available, run one owner/reference lookup, then patch from repo evidence.
3. Shared exported contract: use one Serena reference lookup before changing behavior.
4. Prior accepted decision changes the edit: read one specific InkRoute Obsidian note, then decide from repo evidence.
5. Durable review, DeepSeek handoff, or architecture decision completed: append one concise Obsidian note after the repo change is known.

Hard stop: if Serena or Obsidian is unavailable, credential-gated, ambiguous, or noisy after one attempt, fall back to scoped RTK search and keep moving. Do not use either tool to collect broad evidence before an obvious credential-free fix.

## RTK Usage

RTK is mandatory for shell commands in this repo when run by Codex or delegated local agents.

Default rule:

- Prefix shell commands with `rtk`.
- For shell builtins, PowerShell pipelines, or commands that need exact raw behavior, use `rtk proxy <command>`.
- Do not rewrite `package.json` scripts or CI workflow commands to require `rtk`; GitHub runners and external providers may not have it installed.
- Do not dump huge raw logs unless necessary; prefer RTK-filtered output and targeted tails.

Examples:

- rtk git status
- rtk git diff
- rtk git diff --stat
- rtk git diff --name-only
- rtk git log
- rtk npm test
- rtk npm run build
- rtk cargo test
- rtk cargo clippy
- rtk proxy powershell -NoProfile -Command "Get-Content AGENTS.md -Raw"

## Stable First / Dynamic Last

For cost and cache efficiency, process context in this order:

1. Stable instructions: AGENTS.md, CLAUDE.md
2. Stable repo docs: docs/ai/REPO_BRIEF.md, ARCHITECTURE_MAP.md, API_CONTRACTS.md
3. Current task brief
4. Current changed files
5. Current diff
6. Current test output
7. Current errors/logs

Do not put timestamps, random IDs, branch noise, temp paths, or verbose logs before stable context.

## MCP Safety

Use MCPs only when relevant.

Default to read-only inspection first.

Never modify these without explicit approval:

- production databases
- Render production services
- Neon production data
- Linear issues
- Obsidian notes outside the project area
- Docker infrastructure
- secrets
- .env files
- deployment credentials

## Completion Standard

Before calling work complete, Codex must know:

- what changed
- why it changed
- what tests ran
- what remains
- what risks exist
- whether DeepSeek-Claude stayed inside allowed scope
- whether frontend/API contracts still match
- whether secrets or production resources were untouched
