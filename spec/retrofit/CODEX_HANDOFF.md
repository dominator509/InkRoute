---
title: CODEX_HANDOFF.md — Codex Retrofit Pickup Template
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

# CODEX_HANDOFF.md

## 1. Purpose
> **Codex picks up retrofit work. Existing partially-coded repo with drift. Codex applies the Adoption Ladder, closes new GAPs via `GAP_CLOSURE_PLAYBOOK.md`, and remediates LEGACY-GAPs via `DRIFT_REMEDIATION_PLAYBOOK.md` — never breaking working code.**

## 2. State at Handoff
Codex MUST verify:
- [ ] Backup tag `pre-retrofit-<timestamp>` exists.
- [ ] Branch `retrofit/baseline-v1` is checked out.
- [ ] `REPO_INVENTORY.md` exists and is YAML-valid.
- [ ] Trinity v0.1.1 + kit v0.1.0 present at `/spec/` or repo root.
- [ ] `HANDOFF_QUEUE.md` contains LEGACY-GAPs catalogued from discovery.
- [ ] Current Adoption Ladder tier is recorded in `PROJECT_STATE.md`.
- [ ] Existing test suite passes on current HEAD.

## 3. The HANDOFF_QUEUE.md Format
Two schemas coexist:
- **GAP-*** entries → per `HANDOFF_QUEUE_SCHEMA.md` (new gaps logged during/after retrofit).
- **LEGACY-GAP-*** entries → per `LEGACY_GAP_SCHEMA.md` (inherited drift).

## 4. Codex's First Actions (ordered)
1. Load `PROJECT_STATE.md`.
2. Ingest trinity v0.1.1 + kit + `RETROFIT_BOOTSTRAP.md`.
3. Read `REPO_INVENTORY.md`. If absent → run `REPO_DISCOVERY.md §2` commands first, emit inventory, log LEGACY-GAPs.
4. Sort `HANDOFF_QUEUE.md` by: (a) current tier first, (b) LEGACY-GAPs at current tier, (c) new GAPs at current tier.
5. Run `scripts/doctor.sh` — INFORMATIONAL during retrofit.
6. For each OPEN gap at current tier:
   - If `GAP-*` → use `GAP_CLOSURE_PLAYBOOK.md` matching category.
   - If `LEGACY-GAP-*` → use `DRIFT_REMEDIATION_PLAYBOOK.md` matching `drift_category`.
   - After closure, run existing test suite — MUST pass.
   - If FAIL → ROLLBACK per `ROLLBACK_PROTOCOL.md`, log retreat gap, advance.
   - On success, append `dec_entry_template` to `DECISIONS.log`, mark RESOLVED.
7. When all gaps at current tier are resolved → check tier promotion criteria per `ADOPTION_LADDER.md §7`.
8. Promote tier if criteria met; record in `PROJECT_STATE.md`.
9. Repeat from step 4 until ladder complete (T4 or explicit deferral).
10. Run `scripts/congruence_audit.py` scoped to new code. Must PASS.
11. Append final `HANDOFF.md` entry: "Retrofit complete to T<n>, <count> LEGACY-GAPs RESOLVED, <count> DEFERRED."

## 5. Trinity Adherence
The trinity: **don't drift, don't freeze, don't fixate.**

Retrofit is the trinity applied to legacy debt: discover (don't drift further), advance ladder tiers (don't freeze), log + advance on failure (don't fixate).

## 6. Completion Criteria
- All LEGACY-GAPs either RESOLVED or DEFERRED with rationale.
- All new GAPs RESOLVED.
- Existing test suite passes.
- Congruence audit (new-code scope) clean.
- Final HANDOFF.md entry written.

## 7. Gaps for Codex / Claude Handoff
- [ ] First-project Codex retrofit shakedown.

> **Owner of all gaps above:** `human:dominic`. NEVER the agent that logged this file (per `GAP_PROTOCOL.md §3 Mechanism A`).
