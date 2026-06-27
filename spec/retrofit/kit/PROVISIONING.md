---
title: PROVISIONING.md — Master Credential & Setup Manifest
version: 0.1.0
status: "DRAFT — pending HALT approval"
owner: Dominic Sarria-Wiley
project: Shared-Brain Multi-Agent Memory
date: 2026-06-09
kit: Phase 0 Bootstrap Kit
trinity_required: 0.1.1
normative_language: RFC 2119 (MUST / SHOULD / MAY)
---

# PROVISIONING.md

## 1. Credentials
| ID | Name | Scope | Storage | Env Var | Verify Command | Required | Fallback |
|----|------|-------|---------|---------|----------------|----------|----------|
| C1 | OPENAI_API_KEY | LLM | 1Password | OPENAI_API_KEY | `curl -sS https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"` | YES | HARD BLOCK |
| C2 | ANTHROPIC_API_KEY | Claude | 1Password | ANTHROPIC_API_KEY | `curl -sS https://api.anthropic.com/v1/messages -H "x-api-key: $ANTHROPIC_API_KEY"` | YES | HARD BLOCK |
| C3 | GITHUB_PAT | repo | 1Password | GH_TOKEN | `gh auth status` | YES | HARD BLOCK |

## 2. MCP Servers
| ID | MCP | Purpose | Install | Verify | Required |
|----|-----|---------|---------|--------|----------|
| M1 | filesystem | repo r/w | `claude mcp add filesystem npx @mcp/filesystem` | `echo ping` | YES |
| M2 | github | issue/PR | `claude mcp add github npx @mcp/github` | `gh repo view` | YES |

## 3. Local Binaries
| ID | Binary | Min | Install | Verify | Required |
|----|--------|-----|---------|--------|----------|
| B1 | rustc | 1.78+ | `rustup default stable` | `rustc --version` | YES |
| B2 | jq | 1.6+ | `brew install jq` | `jq --version` | YES |

## 4. Accounts
| ID | Service | Type | Setup | Verify | Required |
|----|---------|------|-------|--------|----------|
| A1 | crates.io | publish | `cargo login <token>` | `cargo owner --list dummy` | NO |

## 5. Network / Egress
| Domain | Purpose | Required |
|--------|---------|----------|
| api.openai.com | LLM | YES |
| api.github.com | source | YES |

## 6. Resource Quotas
- Disk: ≥ 20 GB
- RAM: ≥ 16 GB

## 7. The doctor.sh Contract
`scripts/doctor.sh` MUST return exit 0.

## 8. Tripwire Pattern
NEVER block.

## 9. Canonical Agent Vocabulary (trinity v0.1.1)
```yaml
agent_vocabulary:
  handoff_stage:
    - human:dominic
    - agent:next-phase
    - agent:codex-handoff
    - agent:claude-handoff
    - agent:triage
  build_stage_regex: '^agent:[a-z]+-phase[0-9]+[a-z]?$'
  forbidden_as_owner:
    - agent:current
    - agent:self
```

## 10. Gaps for Codex / Claude Handoff
- [ ] credential audit.

> **Owner of all gaps above:** `human:dominic`. NEVER the agent that logged this file.
