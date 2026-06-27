---
title: DRIFT_CONTROL.md — Anti-Drift Enforcement Spec
version: 0.1.1
status: "DRAFT — pending HALT approval"
owner: Dominic Sarria-Wiley
project: Shared-Brain Multi-Agent Memory
date: 2026-06-09
normative_language: RFC 2119 (MUST / SHOULD / MAY)
changelog:
  - "v0.1.1 (2026-06-09): Parity bump."
  - "v0.1.0 (2026-06-09): Initial."
---

# DRIFT_CONTROL.md

> **Prime directive:** Drift is a systems problem.

## 1. Scope & Non-Goals
In scope: multi-agent coding. Out: PIPS/HIPAA.

## 2. The Five Drift Types
Spec, context, convention, semantic, handoff.

## 3. The Six-Layer Anti-Drift Stack
### Layer 1 — Bidirectional Spec Anchoring (SPEC-DERIVED-PHASE1A-ROUTER-3)
### Layer 2 — Deterministic Context Reconstruction
### Layer 3 — Machine-Verifiable Contracts
### Layer 4 — Append-Only Decision Ledger (`DECISIONS.log`)
### Layer 5 — Congruence Audit Gate (`scripts/congruence_audit.py`)
### Layer 6 — Bounded Agent Authority

## 4. The Enforcement Loop
CI gates.

## 5. CI Gate Definitions
`ci_gates:` marker_integrity, congruence_matrix.

## 6. Marker Grammar
`SPEC-DERIVED-<PHASE>-<MODULE>-<CLAUSE>`

## 7. Decision Ledger Schema
Append-only at `DECISIONS.log`.

## 8. Congruence Matrix Spec
Uses `accepted_deltas.yaml`. Inputs include `HANDOFF.md`, `PROJECT_STATE.md`.

## 9. Residual Drift — Honest Caveats
Spec/human approval drift.

## 10. Integration With FLOW_CONTROL & GAP_PROTOCOL
The trinity: **don't drift, don't freeze, don't fixate.**

## 11. Gaps for Codex / Claude Handoff
- [ ] `scripts/verify_markers.py`.

> **Owner of all gaps above:** `agent:next-phase`. NEVER the agent that logged this file.
