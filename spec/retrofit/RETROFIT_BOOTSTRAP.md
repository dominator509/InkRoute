---
title: RETROFIT_BOOTSTRAP.md — Retrofit/Rescue Variant Driver
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

# RETROFIT_BOOTSTRAP.md

## 1. Prime Directive

> **Apply trinity discipline to an EXISTING partially-coded repo without breaking anything that works today. Discover first, change second, never rewrite working code, every fix is reversible. The trinity holds for new work; existing drift is catalogued as INHERITED-GAPs and remediated gradually via the Adoption Ladder.**

## 2. Prerequisites
- Repo exists with `.git/` history.
- Codex CLI shell access (read/write to repo).
- May have CI, may not. May have tests, may not. May have bad structure / drift — that's why we're here.
- Operator agrees retrofit may take multiple passes (one per Adoption Ladder tier).

## 3. The Five Cardinal Rules of Retrofit (normative)
1. **NEVER** modify code that currently compiles AND passes its tests without an explicit `DEC-*` approval entry.
2. **ALWAYS** catalogue before changing (`REPO_DISCOVERY.md` → `REPO_INVENTORY.md`).
3. **ALL** existing problems are `LEGACY-GAP-*` entries (per `LEGACY_GAP_SCHEMA.md`), NOT new drift.
4. **EVERY** change MUST be reversible via `ROLLBACK_PROTOCOL.md`.
5. **ADOPTION** is GRADUAL per `ADOPTION_LADDER.md` — not all gates apply at once.

## 4. Modified Bootstrap Sequence

- **Step 0**: Create backup tag `pre-retrofit-<UTC-timestamp>` and branch `retrofit/baseline-v1`. ALL retrofit work happens on the branch.
- **Step 1**: Read `RETROFIT_BOOTSTRAP.md` + `MASTER_BOOTSTRAP.md`.
- **Step 2**: Run discovery commands per `REPO_DISCOVERY.md §2` — READ-ONLY.
- **Step 3**: Emit `REPO_INVENTORY.md` (write to repo root or `/audit/`).
- **Step 4**: Catalogue every drift candidate as `LEGACY-GAP-*` per `LEGACY_GAP_SCHEMA.md`.
- **Step 5**: Author baseline docs ADDITIVELY at `/spec/` or `/docs/spec/` — never overwrite existing README/Architecture.
- **Step 6**: Run synthetic `doctor.sh` — INFORMATIONAL ONLY; does NOT block retrofit.
- **Step 7**: Apply Adoption Ladder Tier 1 (docs-only).
- **Step 8**: Run existing test suite — MUST still pass. If FAIL → ROLLBACK + log GAP.
- **Step 9**: Promote to Tier 2 (markers additive on new files only).
- **Step 10**: Continue ladder T3 → T4 as promotion criteria met.
- **Step 11**: At each tier, verify tests pass before promotion.
- **Step 12**: Final state — trinity-adherent for new code; legacy code gap-catalogued for incremental fix.

## 5. Retrofit Forward-Edge Loop

```
[forward edge] → [attempt] → { 🟢 Comply | 🟡 Quarantine | 🟠 GAP-for-Codex | 🟣 INHERITED-GAP-cataloguing | 🔵 ROLLBACK | 🔴 single-HALT }
       ↑                                                                          │
       └────────── cursor advances per GAP_PROTOCOL §3 Mechanism C ────────────────┘
```

The 🟣 INHERITED-GAP-cataloguing door is unique to retrofit: existing drift is **logged not fixed**. The 🔵 ROLLBACK door is the safety valve.

## 6. Non-Destructive Authoring Rules
- New docs go to `/spec/` (or `/docs/spec/` if conflict). Never overwrite existing README/Architecture.
- Merge INTO existing CI config (don't replace).
- `SPEC-DERIVED-*` markers added only to NEW code in T2+; existing code untouched until T4 with `DEC-*`.
- Existing source files MUST NOT be edited in T1-T3.

## 7. The Discover-Catalogue-Adopt Pattern
- **Discover** (read-only) → produces `REPO_INVENTORY.md`.
- **Catalogue** (additive) → produces `LEGACY-GAP-*` entries in `HANDOFF_QUEUE.md`.
- **Adopt** (gradual) → walks Adoption Ladder T1 → T4 with rollback at each step.

Each phase has explicit exit criteria; no phase begins until prior phase exit is met.

## 8. Backup & Branch Strategy
```bash
# Step 0 commands (run before ANY change)
git tag pre-retrofit-$(date -u +%Y%m%dT%H%M%SZ)
git checkout -b retrofit/baseline-v1
# All retrofit work happens on this branch.
# Merge via PR with explicit human:dominic approval.
```

## 9. Adoption Ladder Summary
| Tier | Scope | Risk |
|------|-------|:----:|
| **T1** | docs-only: add `/spec/` tree with trinity v0.1.1 + kit v0.1.0 | zero |
| **T2** | markers additive: `SPEC-DERIVED-*` ONLY on NEW files | zero |
| **T3** | new code under full trinity: any new file passes all P0 gates | low |
| **T4** | legacy refactor: one existing file at a time with `DEC-*` approval | managed |

See `ADOPTION_LADDER.md` for detailed steps per tier.

## 10. Rollback Triggers
- Tests fail post-change.
- Build broken.
- Congruence audit fails on new code.
- Operator HALT signal.

See `ROLLBACK_PROTOCOL.md`.

## 11. Trinity Adherence
The trinity: **don't drift, don't freeze, don't fixate.**

Retrofit does NOT relax trinity rules. It restricts their domain to (a) new code only in T1-T3, and (b) one legacy file at a time in T4. Drift detection still applies — but existing drift becomes a catalogued artifact, not a new violation.

## 12. Cross-References
- `MASTER_BOOTSTRAP.md` — universal bootstrap.
- `REPO_DISCOVERY.md` — read-only inventory protocol.
- `ADOPTION_LADDER.md` — 4-tier gradual rollout.
- `DRIFT_REMEDIATION_PLAYBOOK.md` — 8 drift categories with remediation procedures.
- `ROLLBACK_PROTOCOL.md` — reversibility contract.
- `LEGACY_GAP_SCHEMA.md` — schema for inherited problems.
- `CODEX_HANDOFF.md` — Codex pickup for retrofit work.
- `GAP_CLOSURE_PLAYBOOK.md` — for new GAPs (not LEGACY-GAPs).
- `HANDOFF_QUEUE_SCHEMA.md` — schema for new GAPs.

## 13. Final State Definition
Retrofit is COMPLETE when:
- `REPO_INVENTORY.md` exists and is current.
- All drift catalogued as `LEGACY-GAP-*` entries with assigned tiers.
- Adoption Ladder advanced to T3 minimum (new code trinity-adherent).
- Existing test suite still passes.
- Final `HANDOFF.md` entry: "Retrofit complete to tier T<n>, <count> LEGACY-GAPs deferred to T4."

## 14. Gaps for Codex / Claude Handoff
- [ ] First-project retrofit shakedown.
- [ ] Calibrate tier-promotion timing after 3 projects.
- [ ] Validate that rollback paths actually work in real-world bad repos.

> **Owner of all gaps above:** `human:dominic` or `agent:codex-handoff`. NEVER the agent that logged this file (per `GAP_PROTOCOL.md §3 Mechanism A`).
