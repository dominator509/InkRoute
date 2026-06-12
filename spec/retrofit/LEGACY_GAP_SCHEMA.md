---
title: LEGACY_GAP_SCHEMA.md — Schema for Inherited Problems
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

# LEGACY_GAP_SCHEMA.md

## 1. Schema (normative)

```yaml
- id:                          LEGACY-GAP-YYYY-MM-DD-NNN     # LEGACY- prefix MANDATORY
  discovered_during:           REPO_DISCOVERY                # MUST be set
  existing_since:              <commit_hash_or_unknown>
  drift_category:              <1-8 per DRIFT_REMEDIATION_PLAYBOOK>
  risk_tier:                   <T1|T2|T3|T4>                 # which ladder tier WILL address it
  remediation_deferred_until:  <T1|T2|T3|T4>                 # MUST be a tier the team committed to reaching
  scope:                       <file path or module>
  blocker:                     <≤1 sentence>
  owner:                       agent:codex-handoff
  logged_by:                   agent:codex-phase<N><suffix>
  logged_at:                   <UTC ISO8601>
  phase:                       RETROFIT
  status:                      OPEN                          # OPEN | RESOLVED | DEFERRED | ESCALATED | STALE
  dec_entry_template: |
    - decision_id: DEC-<DATE>-<NNN>
      scope: <auto>
      summary: "<one-line>"
```

## 2. Field Rules
- `id` MUST begin with `LEGACY-GAP-` (NOT plain `GAP-`).
- `discovered_during` MUST be set (typically `REPO_DISCOVERY`).
- `remediation_deferred_until` MUST be a tier the team has explicitly committed to reaching per `ADOPTION_LADDER.md`.
- `drift_category` MUST match one of 8 in `DRIFT_REMEDIATION_PLAYBOOK.md`.
- `owner` MUST NOT equal `logged_by` (per `GAP_PROTOCOL.md §3 Mechanism A`).

## 3. Example Entries (one per drift category)

```yaml
- id: LEGACY-GAP-2026-06-09-001
  discovered_during: REPO_DISCOVERY
  existing_since: a3f7b21
  drift_category: 1
  risk_tier: T1
  remediation_deferred_until: T1
  scope: Architecture.md
  blocker: "Architecture.md absent"
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  phase: RETROFIT
  status: OPEN

- id: LEGACY-GAP-2026-06-09-002
  discovered_during: REPO_DISCOVERY
  existing_since: unknown
  drift_category: 2
  risk_tier: T1
  remediation_deferred_until: T1
  scope: PROJECT_STATE.md
  blocker: "No deterministic context snapshot"
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  phase: RETROFIT
  status: OPEN

- id: LEGACY-GAP-2026-06-09-003
  discovered_during: REPO_DISCOVERY
  existing_since: 9c1e4ff
  drift_category: 3
  risk_tier: T4
  remediation_deferred_until: T4
  scope: src/router/
  blocker: "Mixed snake_case / camelCase across module"
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  phase: RETROFIT
  status: OPEN

- id: LEGACY-GAP-2026-06-09-004
  discovered_during: REPO_DISCOVERY
  existing_since: unknown
  drift_category: 4
  risk_tier: T4
  remediation_deferred_until: T4
  scope: glossary
  blocker: "Term 'user' redefined in 3 modules with conflicting semantics"
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  phase: RETROFIT
  status: OPEN

- id: LEGACY-GAP-2026-06-09-005
  discovered_during: REPO_DISCOVERY
  existing_since: unknown
  drift_category: 5
  risk_tier: T1
  remediation_deferred_until: T1
  scope: HANDOFF.md
  blocker: "No HANDOFF.md exists"
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  phase: RETROFIT
  status: OPEN

- id: LEGACY-GAP-2026-06-09-006
  discovered_during: REPO_DISCOVERY
  existing_since: 5b2d8aa
  drift_category: 6
  risk_tier: T4
  remediation_deferred_until: T4
  scope: src/payments/
  blocker: "Module has zero test coverage"
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  phase: RETROFIT
  status: OPEN

- id: LEGACY-GAP-2026-06-09-007
  discovered_during: REPO_DISCOVERY
  existing_since: unknown
  drift_category: 7
  risk_tier: T4
  remediation_deferred_until: T4
  scope: Cargo.toml
  blocker: "12 dependencies marked unused by cargo udeps"
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  phase: RETROFIT
  status: OPEN

- id: LEGACY-GAP-2026-06-09-008
  discovered_during: REPO_DISCOVERY
  existing_since: unknown
  drift_category: 8
  risk_tier: T1
  remediation_deferred_until: T1
  scope: .github/workflows/
  blocker: "No CI workflow present"
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  phase: RETROFIT
  status: OPEN
```

## 4. Gaps for Codex / Claude Handoff
- [ ] Detect and annotate `existing_since` automatically via `git blame` heuristic.

> **Owner of all gaps above:** `human:dominic` or `agent:codex-handoff`. NEVER the agent that logged this file.
