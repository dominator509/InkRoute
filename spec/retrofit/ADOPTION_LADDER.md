---
title: ADOPTION_LADDER.md — Gradual Trinity Adoption (4 Tiers)
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

# ADOPTION_LADDER.md

## 1. Purpose
Adopt trinity discipline GRADUALLY in an existing repo. Each tier has explicit scope, risk, and promotion criteria.

## 2. The Four Tiers
| Tier | Scope | Risk | Existing code touched? |
|------|-------|:----:|:----------------------:|
| **T1** | docs-only: add `/spec/` tree with trinity v0.1.1 + kit v0.1.0 | zero | NO |
| **T2** | markers additive: `SPEC-DERIVED-*` markers ONLY on NEW files | zero | NO |
| **T3** | new code under full trinity: any NEW file passes all P0 gates | low | NO |
| **T4** | legacy refactor: ONE existing file at a time with `DEC-*` approval | managed | YES (one file at a time) |

## 3. Tier 1 Detailed Steps
1. Create `/spec/` directory at repo root (or `/docs/spec/` if conflict).
2. Copy trinity v0.1.1: `DRIFT_CONTROL.md`, `FLOW_CONTROL.md`, `GAP_PROTOCOL.md`.
3. Copy kit v0.1.0: `MANIFEST.md`, `PROVISIONING.md`, `RUNBOOK.md`, `AGENT_HARNESS.md`, `PROJECT_STATE.md`.
4. Copy `MASTER_BOOTSTRAP.md` to repo root.
5. Author `Architecture.md`, `Roadmap.md`, `HANDOFF.md` for the existing project (in `/spec/` if conflict).
6. Run existing test suite — MUST pass.
7. Commit "T1: docs-only retrofit baseline added".

## 4. Tier 2 Detailed Steps
1. For NEW source files only, add `SPEC-DERIVED-<PHASE>-<MODULE>-<CLAUSE>` markers in docstrings.
2. Do NOT touch existing files.
3. Add `scripts/verify_markers.py` (when implemented) as CI gate for NEW files only.
4. Run existing test suite — MUST pass.
5. Commit "T2: markers added to new files".

## 5. Tier 3 Detailed Steps
1. Any NEW file MUST pass all P0 gates: marker integrity, congruence audit (new-files-only scope), gap lint.
2. Run `scripts/congruence_audit.py --scope=new-only` (when implemented) — MUST PASS.
3. Existing files remain untouched.
4. Run existing test suite — MUST pass.
5. Commit "T3: new code under full trinity".

## 6. Tier 4 Detailed Steps (most cautious)
1. Pick ONE existing file with `LEGACY-GAP-*` entries.
2. Verify full test coverage exists for that file FIRST (add tests if missing — separate commit).
3. Request `DEC-*` approval from `human:dominic` for the specific file.
4. Apply remediation per `DRIFT_REMEDIATION_PLAYBOOK.md` matching the LEGACY-GAP's drift_category.
5. Run full test suite — MUST pass. If FAIL → ROLLBACK per `ROLLBACK_PROTOCOL.md`.
6. Mark the LEGACY-GAP as RESOLVED. Append DEC-* to `DECISIONS.log`.
7. Commit "T4: <file> remediated per DEC-<id>".
8. Move to next file. ONE AT A TIME.

## 7. Tier Promotion Criteria
- **T1 → T2**: all baseline docs present + YAML parses + existing tests pass.
- **T2 → T3**: at least 1 new file under markers + verify_markers.py CI passing for new files.
- **T3 → T4**: full new-code congruence audit clean + manual readiness sign-off by `human:dominic`.
- **T4 → DONE**: all `LEGACY-GAP-*` entries either RESOLVED or explicitly DEFERRED with rationale.

## 8. Rollback at Any Tier
See `ROLLBACK_PROTOCOL.md`. Triggers: test failure, build broken, congruence audit failure, operator HALT.

## 9. Trinity Adherence
The trinity: **don't drift, don't freeze, don't fixate.**

The Adoption Ladder is the **Don't Freeze** doctrine applied to legacy debt: rather than refusing to start because the existing repo is imperfect (drift) or trying to fix everything at once (fixation), it provides explicit forward-edge steps that always advance without breaking.

## 10. Gaps for Codex / Claude Handoff
- [ ] Empirical calibration of T3 → T4 readiness signals.
- [ ] Tooling to score T4 file readiness automatically.

> **Owner of all gaps above:** `human:dominic` or `agent:codex-handoff`. NEVER the agent that logged this file.
