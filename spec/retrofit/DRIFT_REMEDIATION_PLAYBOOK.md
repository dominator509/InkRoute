---
title: DRIFT_REMEDIATION_PLAYBOOK.md — 8-Category Drift Remediation
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

# DRIFT_REMEDIATION_PLAYBOOK.md

> **For each of 8 existing-repo drift categories: Symptom, Detect, Catalogue, Remediate, Rollback. Remediation happens ONLY after Adoption Ladder T4 approval per file.**

## Category 1 — Spec Drift
- **Symptom**: no `Architecture.md`, or `Architecture.md` references modules that don't exist.
- **Detect**: `test -f Architecture.md && grep -F "$(ls src/)" Architecture.md`.
- **Catalogue**: log `LEGACY-GAP-*` with `drift_category: 1`, `remediation_deferred_until: T1`.
- **Remediate (T1)**: author `Architecture.md` from observed source tree per `REPO_INVENTORY.md`.
- **Rollback**: docs-only; rollback is `rm Architecture.md` if needed.

## Category 2 — Context Drift
- **Symptom**: no `PROJECT_STATE.md`; agents derive context from prose docs.
- **Detect**: `test -f PROJECT_STATE.md` exits 1.
- **Catalogue**: log `LEGACY-GAP-*` with `drift_category: 2`, `remediation_deferred_until: T1`.
- **Remediate (T1)**: copy kit's `PROJECT_STATE.md` template; fill in current phase + decisions.
- **Rollback**: `rm PROJECT_STATE.md`.

## Category 3 — Convention Drift
- **Symptom**: mixed style across files (e.g., Rust `snake_case` mixed with `camelCase`).
- **Detect**: language-specific lint (e.g., `cargo clippy -- -W warnings`).
- **Catalogue**: log `LEGACY-GAP-*` with `drift_category: 3`, `remediation_deferred_until: T4` (per file).
- **Remediate (T4)**: run formatter on ONE file, run tests, commit. Repeat.
- **Rollback**: `git checkout HEAD~1 -- <file>` if tests fail.

## Category 4 — Semantic Drift
- **Symptom**: same term means different things across files (e.g., "user" = entity in module A, session in module B).
- **Detect**: `git grep -i -l "<term>"` shows multiple definitions.
- **Catalogue**: log `LEGACY-GAP-*` with `drift_category: 4`, `remediation_deferred_until: T4`.
- **Remediate (T4)**: introduce glossary in `/spec/`; rename ONE side per `DEC-*` approval.
- **Rollback**: `git revert <commit>` if rename breaks downstream.

## Category 5 — Handoff Drift
- **Symptom**: no `HANDOFF.md`; cross-agent state is implicit.
- **Detect**: `test -f HANDOFF.md` exits 1.
- **Catalogue**: log `LEGACY-GAP-*` with `drift_category: 5`, `remediation_deferred_until: T1`.
- **Remediate (T1)**: author `HANDOFF.md` capturing current state.
- **Rollback**: `rm HANDOFF.md`.

## Category 6 — Test Drift
- **Symptom**: modules without tests.
- **Detect**: ratio of `tests/*` to `src/*` < 0.5.
- **Catalogue**: log `LEGACY-GAP-*` with `drift_category: 6`, `remediation_deferred_until: T4`.
- **Remediate (T4)**: add tests for ONE module FIRST (prerequisite for T4 refactor on that module).
- **Rollback**: tests are additive; rollback rarely needed. If FLAKY → `#[ignore]` + log new LEGACY-GAP.

## Category 7 — Dependency Drift
- **Symptom**: unused or outdated dependencies.
- **Detect**: `cargo udeps` / `npm outdated` / `pip list --outdated`.
- **Catalogue**: log `LEGACY-GAP-*` with `drift_category: 7`, `remediation_deferred_until: T4`.
- **Remediate (T4)**: remove ONE unused dep, run tests, commit. Or update ONE dep, run tests, commit.
- **Rollback**: `git checkout HEAD~1 -- Cargo.toml Cargo.lock` (or equivalent).

## Category 8 — CI Drift
- **Symptom**: no CI, or CI broken.
- **Detect**: `ls .github/workflows/ 2>/dev/null` empty, or last run failing.
- **Catalogue**: log `LEGACY-GAP-*` with `drift_category: 8`, `remediation_deferred_until: T1`.
- **Remediate (T1)**: add `.github/workflows/ci.yml` running existing test suite as-is.
- **Rollback**: `rm .github/workflows/ci.yml`.

The trinity: **don't drift, don't freeze, don't fixate.**

## Gaps for Codex / Claude Handoff
- [ ] Add Category 9 (database schema migration drift) after first project.
- [ ] Per-language detect commands need expansion.

> **Owner of all gaps above:** `human:dominic` or `agent:codex-handoff`. NEVER the agent that logged this file.
