---
title: ROLLBACK_PROTOCOL.md — Reversibility Contract
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

# ROLLBACK_PROTOCOL.md

## 1. Purpose
Every retrofit change is reversible. Rollback is a first-class forward-edge action, not a failure.

## 2. The Three Rollback Triggers
1. **Tests fail** post-change.
2. **Build broken** post-change.
3. **Operator HALT** signal from `human:dominic`.

Congruence-audit failures count under #1.

## 3. The Backup Tag
Created in Step 0 of `RETROFIT_BOOTSTRAP.md`:
```bash
git tag pre-retrofit-$(date -u +%Y%m%dT%H%M%SZ)
```
This tag is the immutable known-good state.

## 4. The Retrofit Branch
All retrofit work isolated on `retrofit/baseline-v1`. Main branch untouched until explicit human PR approval.

## 5. Rollback Commands
```bash
# Trigger: tests fail after a single commit
git reset --hard HEAD~1

# Trigger: multiple bad commits, return to backup tag
git reset --hard pre-retrofit-<timestamp>

# Trigger: total abandon, return to main
git checkout main
git branch -D retrofit/baseline-v1

# Trigger: one specific file regression
git checkout HEAD~1 -- <path>
```

## 6. Post-Rollback Actions
After every rollback the agent MUST:
1. Log a fresh `LEGACY-GAP-*` entry (or upgrade existing) with `remediation_deferred_until: T<n+1>` (one tier later than the failed attempt).
2. Retreat one Adoption Ladder tier — do NOT retry the same tier without new information.
3. Update `HANDOFF_QUEUE.md` with the new gap.
4. Append a `DEC-*` entry to `DECISIONS.log` recording the rollback cause + retreat decision.
5. Do NOT mark the original gap as resolved.

## 7. Trinity Adherence
The trinity: **don't drift, don't freeze, don't fixate.**

Rollback is the **Don't Fixate** doctrine applied to retrofit attempts: a failed remediation is logged as gap + advance, never re-tried within the same session without new information.

## 8. Gaps for Codex / Claude Handoff
- [ ] Automated rollback trigger from CI failure signal.
- [ ] Validate rollback paths actually work on real bad-repo shakedown.

> **Owner of all gaps above:** `human:dominic` or `agent:codex-handoff`. NEVER the agent that logged this file.
