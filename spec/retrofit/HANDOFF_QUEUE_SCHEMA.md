---
title: HANDOFF_QUEUE_SCHEMA.md — Strict GAP-Entry Schema
version: 0.1.0
status: "DRAFT — pending HALT approval"
owner: Dominic Sarria-Wiley
project: "Universal Agentic Bootstrap — Retrofit/Rescue variant"
date: 2026-06-09
trinity_version: 0.1.1
kit_version: 0.1.0
variant: retrofit
normative_language: RFC 2119 (MUST / SHOULD / MAY)
---

# HANDOFF_QUEUE_SCHEMA.md

## 1. Schema (normative)
```yaml
- id:                   GAP-YYYY-MM-DD-NNN
  scope:                <file path or module>
  blocker:              <≤1 sentence>
  exact_codex_commands: [<cmd 1>, <cmd 2>]
  verify_command:       <bash command; exit 0 == closed>
  owner:                agent:codex-handoff
  logged_by:            agent:codex-phase<N><suffix>
  phase:                <PHASE label>
  category:             <1-8 per GAP_CLOSURE_PLAYBOOK.md>
  status:               OPEN
  dec_entry_template:   |
    - decision_id: DEC-<DATE>-<NNN>
      scope: <auto>
      summary: "<one-line>"
```

## 2. Field Rules
- `owner` ≠ `logged_by`.
- `exact_codex_commands` literal shell.
- `verify_command` idempotent, read-only.
- `category` matches one of 8 in `GAP_CLOSURE_PLAYBOOK.md`.

## 3. Example Entries (one per category)
```yaml
- id: GAP-2026-06-09-001
  scope: PROVISIONING.md C1
  blocker: "OPENAI_API_KEY not set"
  exact_codex_commands: ["export OPENAI_API_KEY=\"$(op read 'op://Agentic/openai/credential')\""]
  verify_command: "curl -sS https://api.openai.com/v1/models -H \"Authorization: Bearer $OPENAI_API_KEY\""
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  category: 1
  status: OPEN

- id: GAP-2026-06-09-002
  scope: PROVISIONING.md M3
  blocker: "postgres MCP not installed"
  exact_codex_commands: ["claude mcp add postgres npx @mcp/postgres"]
  verify_command: "psql -c \"\\dt\""
  owner: agent:codex-handoff
  logged_by: agent:codex-phase1a
  category: 2
  status: OPEN

- id: GAP-2026-06-09-003
  scope: PROVISIONING.md B1
  blocker: "rustc not present"
  exact_codex_commands: ["curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y", "source $HOME/.cargo/env"]
  verify_command: "rustc --version"
  owner: agent:codex-handoff
  logged_by: agent:codex-phase1a
  category: 3
  status: OPEN

- id: GAP-2026-06-09-004
  scope: src/router/dispatch.rs
  blocker: "release build not executed"
  exact_codex_commands: ["cargo build --release"]
  verify_command: "test -x target/release/dispatch"
  owner: agent:codex-handoff
  logged_by: agent:codex-phase2
  category: 4
  status: OPEN

- id: GAP-2026-06-09-005
  scope: tests/router_test.rs
  blocker: "unit tests never executed"
  exact_codex_commands: ["cargo test --all -- --nocapture"]
  verify_command: "cargo test --all --quiet"
  owner: agent:codex-handoff
  logged_by: agent:codex-phase2
  category: 5
  status: OPEN

- id: GAP-2026-06-09-006
  scope: tests/integration/api_test.rs
  blocker: "live OpenAI integration test requires C1 closed"
  exact_codex_commands: ["cargo test --all -- --ignored"]
  verify_command: "cargo test --all -- --ignored --quiet"
  owner: agent:codex-handoff
  logged_by: agent:codex-phase2
  category: 6
  status: OPEN

- id: GAP-2026-06-09-007
  scope: deploy/docker
  blocker: "image not pushed"
  exact_codex_commands: ["docker build -t shared-brain:0.1.0 .", "docker push shared-brain:0.1.0"]
  verify_command: "docker manifest inspect shared-brain:0.1.0"
  owner: agent:codex-handoff
  logged_by: agent:codex-phase3
  category: 7
  status: OPEN

- id: GAP-2026-06-09-008
  scope: PROVISIONING.md §5 api.stripe.com
  blocker: "egress unreachable"
  exact_codex_commands: ["# add firewall allow-rule"]
  verify_command: "curl -sS -o /dev/null -w \"%{http_code}\" https://api.stripe.com | grep -E '^(2|3)'"
  owner: agent:codex-handoff
  logged_by: agent:codex-phase3
  category: 8
  status: OPEN
```

## 4. Gaps for Codex / Claude Handoff
- [ ] New GAP category → log meta-GAP for playbook expansion.

> **Owner of all gaps above:** `human:dominic`. NEVER the agent that logged this file.
