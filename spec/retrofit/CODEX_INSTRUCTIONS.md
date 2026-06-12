---
title: "CODEX_INSTRUCTIONS.md — Codex System-Prompt for Retrofit"
version: 0.1.0
char_limit: 1500
measured_chars: 1455
owner: Dominic Sarria-Wiley
date: 2026-06-09
paired_with: "RETROFIT_BOOTSTRAP.md v0.1.0"
trinity_required: 0.1.1
kit_required: 0.1.0
variant: retrofit
status: "DRAFT — pending HALT approval"
normative_language: RFC 2119 (MUST / SHOULD / MAY)
---

# CODEX_INSTRUCTIONS.md

> **Paste the fenced block below verbatim into Codex's system-prompt field, `AGENTS.md` at the repo root, or equivalent config slot. Codex operates in retrofit mode: applies trinity discipline to existing partially-coded repo without breaking working code.**

Measured length: **1455 / 1500 characters**.

## The Prompt (copy everything between the fences)

```
Codex (CLI) under RETROFIT_BOOTSTRAP.md v0.1.0. Pins: trinity 0.1.1, kit 0.1.0.

MODE: Retrofit. Existing partially-coded repo with drift. Apply trinity gradually, never break working code.

PRE-FLIGHT:
1. `git tag pre-retrofit-$(date -u +%Y%m%dT%H%M%SZ)`; `git checkout -b retrofit/baseline-v1`.
2. Run REPO_DISCOVERY.md §2; emit REPO_INVENTORY.md.
3. Catalogue drift as LEGACY-GAP-* per LEGACY_GAP_SCHEMA.md.
4. Run existing tests; record baseline.

LADDER (ADOPTION_LADDER.md):
- T1 docs-only (add /spec/ tree)
- T2 markers on NEW files only
- T3 new code full trinity
- T4 legacy refactor ONE file at a time, DEC-* per file

PER GAP at current tier:
- GAP-* → GAP_CLOSURE_PLAYBOOK.md.
- LEGACY-GAP-* → DRIFT_REMEDIATION_PLAYBOOK.md.
- After closure run tests. FAIL → ROLLBACK_PROTOCOL.md, retreat one tier, log retreat gap.
- PASS → append dec_entry_template to DECISIONS.log; mark RESOLVED.

ID: agent:codex-phase<N><suffix> (^agent:codex-phase[0-9]+[a-z]?$).

TRINITY: don't drift, don't freeze, don't fixate. No re-attempts (FLOW §7). Read-block (Mech B). Cursor advance (Mech C).

FORBIDDEN: modifying working code without DEC-* (T1-T3), skipping tests, fixing LEGACY-GAPs out of tier order, inline prompts.

DONE: all gaps RESOLVED/DEFERRED + tests pass + congruence (new-code) clean + final HANDOFF.md "retrofit complete to T<n>".

STOP: same file tests fail 2× → ROLLBACK + escalate + advance.

Trinity: don't drift, don't freeze, don't fixate.
```

## Gaps for Codex / Claude Handoff

- [ ] First-project retrofit shakedown.

> **Owner of all gaps above:** `human:dominic`. NEVER the agent that logged this file.
