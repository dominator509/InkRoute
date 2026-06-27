---
title: GAP_PROTOCOL.md — Anti-Fixation Forward-Edge Spec
version: 0.1.1
status: "DRAFT — pending HALT approval"
owner: Dominic Sarria-Wiley
project: Shared-Brain Multi-Agent Memory
date: 2026-06-09
normative_language: RFC 2119 (MUST / SHOULD / MAY)
changelog:
  - "v0.1.1 (2026-06-09): Vocabulary promotion."
  - "v0.1.0 (2026-06-09): Initial."
---

# GAP_PROTOCOL.md

> **Prime directive:** Logging a gap IS shipping.

## 1. The Gap Fixation Failure Mode
## 2. The "Gaps Must Be Inert" Principle
## 3. Three Enforcement Mechanisms
### Mechanism A — Non-Self OWNER Transfer
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
### Mechanism B — Read-Block on Current-Phase Gaps
### Mechanism C — Mechanical Task Cursor Advance

## 4. The "One Strike" Rule
## 5. Phase-Boundary Garbage Collector
## 6. The "Gap Is Done" Reframe
## 7. Escalation Throttle
`same_topic_revisits: 0`.
## 8. The Forward Edge Doctrine
## 9. Full GAP Entry Schema
## 10. The Updated Forward-Only Loop
## 11. Integration With DRIFT_CONTROL & FLOW_CONTROL
The trinity: **don't drift, don't freeze, don't fixate.**
## 12. Honest Caveat
## 13. Gaps for Codex / Claude Handoff
- [ ] `scripts/gap_lint.py`.

> **Owner of all gaps above:** `human:dominic`. NEVER the agent that logged this file (per §3 Mechanism A).
