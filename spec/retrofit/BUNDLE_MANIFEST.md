---
title: "BUNDLE_MANIFEST.md — Baseline v1 Retrofit/Rescue Variant"
version: 1.0.0-retrofit
status: "DRAFT — pending HALT approval"
owner: Dominic Sarria-Wiley
project: "Universal Agentic Bootstrap — Canonical Baseline v1 (Retrofit/Rescue variant)"
date: 2026-06-09
contains:
  trinity: 0.1.1
  kit: 0.1.0
  master: 0.1.0
  retrofit_extras: 0.1.0
normative_language: RFC 2119 (MUST / SHOULD / MAY)
---

# BUNDLE_MANIFEST.md — Baseline v1 Retrofit/Rescue Variant

## 1. Prime Directive

> **This is the canonical `baseline-v1-retrofit` distributable. It applies the universal agentic bootstrap to an EXISTING partially-coded repo with bad structure or drift, WITHOUT breaking anything that currently works. Discover first, change second, never rewrite working code, every fix is reversible. The trinity holds for new work; existing drift is catalogued as `LEGACY-GAP-*` entries and remediated gradually via the 4-tier Adoption Ladder.**

## 2. Variant Differences vs Other Baselines

| Aspect | baseline-v1 (greenfield) | baseline-v1-chatgpt | baseline-v1-copilot | **baseline-v1-retrofit (THIS)** |
|--------|--------------------------|---------------------|----------------------|-----------------------------------|
| Use case | new project | new project | new project | **EXISTING partially-coded repo** |
| Starting state | empty repo | empty repo | empty repo | **bad structure / drift** |
| Authoring style | greenfield | greenfield | greenfield | **non-destructive / additive** |
| Backup strategy | n/a | n/a | n/a | **mandatory git tag + branch** |
| Adoption ladder | n/a (all gates day 1) | n/a | n/a | **4-tier T1→T4 gradual rollout** |
| Drift treatment | prevent | prevent | prevent | **catalogue as LEGACY-GAP-* + tier-defer** |
| Rollback contract | implicit | implicit | implicit | **ROLLBACK_PROTOCOL.md mandatory** |
| Risk to existing code | n/a | n/a | n/a | **zero in T1-T3, managed in T4** |

## 3. Contents

| Path | Role | Component | Size | SHA-256 (prefix) |
|------|------|-----------|-----:|------------------|
| `RETROFIT_BOOTSTRAP.md` | retrofit driver — applies trinity to existing repos | retrofit v0.1.0 | 6,491 B | `376f9cb7414a9208...` |
| `REPO_DISCOVERY.md` | read-only inventory protocol | retrofit v0.1.0 | 4,194 B | `7cbefacf60a4379f...` |
| `ADOPTION_LADDER.md` | 4-tier gradual trinity adoption | retrofit v0.1.0 | 4,010 B | `01f497fc69188159...` |
| `DRIFT_REMEDIATION_PLAYBOOK.md` | 8 drift categories with remediation procedures | retrofit v0.1.0 | 4,247 B | `721c137f832b9b49...` |
| `ROLLBACK_PROTOCOL.md` | reversibility contract for every retrofit change | retrofit v0.1.0 | 2,386 B | `06c8eeefe2a8c4c9...` |
| `LEGACY_GAP_SCHEMA.md` | schema for cataloguing inherited drift (LEGACY-GAP-*) | retrofit v0.1.0 | 4,765 B | `b067c427e198b6d2...` |
| `MASTER_BOOTSTRAP.md` | master entry-point (original) | master v0.1.0 | 1,888 B | `b534f29214295c11...` |
| `CODEX_HANDOFF.md` | Codex retrofit pickup template | retrofit v0.1.0 | 3,270 B | `97783dd01f314666...` |
| `GAP_CLOSURE_PLAYBOOK.md` | Codex closure procedures for new GAP-* | retrofit v0.1.0 | 2,885 B | `9f94c65a02204d2f...` |
| `HANDOFF_QUEUE_SCHEMA.md` | strict new-GAP schema + 8 examples | retrofit v0.1.0 | 4,015 B | `2520cb72a2b5855b...` |
| `CODEX_INSTRUCTIONS.md` | paste-ready Codex prompt (≤1500 chars) | retrofit v0.1.0 | 2,399 B | `4a05425e7a5b6a60...` |
| `trinity/DRIFT_CONTROL.md` | anti-drift walls | trinity v0.1.1 | 1,640 B | `d691d2562fa2f7fc...` |
| `trinity/FLOW_CONTROL.md` | anti-paralysis doors | trinity v0.1.1 | 1,059 B | `b271330cae36f4d6...` |
| `trinity/GAP_PROTOCOL.md` | anti-fixation exit | trinity v0.1.1 | 1,524 B | `fe18b155a67ba342...` |
| `trinity/reconciliation_patch_v0.1.0_to_v0.1.1.md` | trinity patch | patch | 142 B | `9cdf5e8187a3a36c...` |
| `trinity/audits/congruence_v0.1.0.md` | pre-patch audit | audit v0.1.0 | 111 B | `c89167e35fcee93c...` |
| `trinity/audits/congruence_v0.1.0.yaml` | pre-patch audit yaml | audit v0.1.0 | 50 B | `b7bad3cd273b64c2...` |
| `trinity/audits/congruence_v0.1.1.md` | post-patch audit | audit v0.1.1 | 94 B | `9ca7aab8d61879b7...` |
| `trinity/audits/congruence_v0.1.1.yaml` | post-patch audit yaml | audit v0.1.1 | 39 B | `2803fb7c540a48e1...` |
| `kit/MANIFEST.md` | kit index | kit v0.1.0 | 599 B | `27e62b80cc835355...` |
| `kit/PROVISIONING.md` | credentials/MCPs/binaries | kit v0.1.0 | 2,529 B | `cc6928d7489ce8aa...` |
| `kit/RUNBOOK.md` | unattended ops | kit v0.1.0 | 751 B | `598fdf6210864d6f...` |
| `kit/AGENT_HARNESS.md` | tool whitelist + sandbox | kit v0.1.0 | 675 B | `c3a80f8b22cf6f9a...` |
| `kit/PROJECT_STATE.md` | deterministic context | kit v0.1.0 | 787 B | `8a2b0a7b758cdd25...` |
| `kit/prompts/phase0_bootstrap.md` | master meta-prompt | kit v0.1.0 | 415 B | `66bd5ec9bb728587...` |
| `kit/scripts/doctor.sh` | pre-flight gate | kit v0.1.0 | 745 B | `9c6eaa5ce085ccf6...` |
| `kit/scripts/parse_provisioning.py` | provisioning parser | kit v0.1.0 | 561 B | `0f5b88a0eec4b9de...` |
| `kit/scripts/heartbeat.py` | heartbeat / stall | kit v0.1.0 | 95 B | `798a53b4e68002a3...` |
| `kit/scripts/emit_run_blockers.py` | blocker emitter | kit v0.1.0 | 79 B | `47546301eb1d92f4...` |
| `kit/audits/phase0_kit_audit_v0.1.0.md` | kit audit | audit v0.1.0 | 89 B | `18c1b43df6fe1a77...` |
| `kit/audits/phase0_kit_audit_v0.1.0.yaml` | kit audit yaml | audit v0.1.0 | 46 B | `df96494222df8e91...` |

**Total source files:** 31
**Total bytes (unpacked):** 52,580

## 4. Recommended Reading Order
1. **`RETROFIT_BOOTSTRAP.md`** — driver; Codex reads first.
2. **`REPO_DISCOVERY.md`** — read-only inventory protocol.
3. **`LEGACY_GAP_SCHEMA.md`** — strict schema for cataloguing inherited drift.
4. **`ADOPTION_LADDER.md`** — 4-tier gradual rollout (T1 docs → T4 legacy refactor).
5. **`DRIFT_REMEDIATION_PLAYBOOK.md`** — 8 drift categories, remediation procedures.
6. **`ROLLBACK_PROTOCOL.md`** — reversibility contract.
7. **`MASTER_BOOTSTRAP.md`** + **`trinity/*`** + **`kit/*`** — universal bootstrap reference.
8. **`CODEX_HANDOFF.md`** + **`CODEX_INSTRUCTIONS.md`** — paste into Codex's config.
9. **`GAP_CLOSURE_PLAYBOOK.md`** + **`HANDOFF_QUEUE_SCHEMA.md`** — for NEW gaps logged during/after retrofit.
10. **`*/audits/*`** — provenance.

## 5. Quick-Start Usage (existing repo on Codex)

```text
1. cd <existing-bad-repo>/
2. Verify clean working tree (`git status` shows no changes).
3. Unzip baseline_v1_retrofit_complete.zip into the repo root.
   New docs go to /spec/ (or /docs/spec/ if conflict). Your README/Architecture/source UNTOUCHED.
4. Paste the CODEX_INSTRUCTIONS.md prompt body into Codex's system prompt / AGENTS.md.
5. Start Codex with: "Read RETROFIT_BOOTSTRAP.md and proceed."
6. Codex will:
   - Create backup tag `pre-retrofit-<timestamp>` and branch `retrofit/baseline-v1`.
   - Run REPO_DISCOVERY commands (READ-ONLY) → emit REPO_INVENTORY.md.
   - Catalogue every drift candidate as LEGACY-GAP-* per LEGACY_GAP_SCHEMA.md.
   - Apply Adoption Ladder T1 → T2 → T3 → T4 with tests passing at each step.
   - For each gap: use GAP_CLOSURE_PLAYBOOK (new GAP-*) or DRIFT_REMEDIATION_PLAYBOOK (LEGACY-GAP-*).
   - Rollback on any test failure per ROLLBACK_PROTOCOL.md.
7. Final state: trinity-adherent for NEW code; legacy code gap-catalogued for incremental fix.
8. Merge `retrofit/baseline-v1` to main via PR with human:dominic approval.
```

## 6. Component Version Pins

| Component | Version | Status |
|-----------|--------:|--------|
| Bundle (this distributable) | **1.0.0-retrofit** | DRAFT |
| Master entry-point          | 0.1.0 | DRAFT |
| Trinity                     | 0.1.1 | DRAFT |
| Kit                         | 0.1.0 | DRAFT |
| Retrofit extras (6 files)   | 0.1.0 | DRAFT |

## 7. Integration Map

```
                          existing partially-coded repo (drift + bad structure)
                                       │
                                       ▼
                  CODEX_INSTRUCTIONS.md → Codex AGENTS.md
                                       │
                                       ▼
                          RETROFIT_BOOTSTRAP.md (driver)
                                       │
                ┌──────────────────────┼──────────────────────┐
                ▼                      ▼                      ▼
         DISCOVER               CATALOGUE                   ADOPT
   (REPO_DISCOVERY.md)  (LEGACY_GAP_SCHEMA.md)   (ADOPTION_LADDER.md T1→T4)
                │                      │                      │
                ▼                      ▼                      ▼
      REPO_INVENTORY.md      HANDOFF_QUEUE.md         per-tier work, tests
                                                              │
                                       ┌──────────────────────┤
                                       ▼                      ▼
                          DRIFT_REMEDIATION_PLAYBOOK   GAP_CLOSURE_PLAYBOOK
                          (for LEGACY-GAP-*)            (for new GAP-*)
                                       │                      │
                                       └──────────────────────┘
                                                              │
                                            test FAIL → ROLLBACK_PROTOCOL.md
                                                              │
                                            test PASS → next tier
                                                              │
                                                              ▼
                                            Final: trinity-adherent for new code
```

## 8. What's NOT In This Bundle (Deferred)

- `scripts/regenerate_state.py`
- `scripts/congruence_audit.py`
- `scripts/verify_markers.py`
- `scripts/gap_lint.py`
- `scripts/ledger_lint.py`
- `scripts/quarantine_import_lint.py`
- `scripts/escalation_monitor.py`

## 9. Approval Block

```
APPROVAL REQUIRED: human:dominic

  Distributable:  baseline_v1_retrofit_complete.zip
  Bundle version: 1.0.0-retrofit
  Pins:           master 0.1.0 · trinity 0.1.1 · kit 0.1.0 · retrofit 0.1.0
  Audit ref:      BUNDLE_AUDIT.md (self-auditing)

  SIGN-OFF:  _____________________________   DATE: __________

  ACTION ON APPROVAL:
    1. Append DEC-2026-06-09-006 to DECISIONS.log
    2. Publish as baseline-v1-retrofit
    3. Identify a real bad-structured repo for first shakedown
    4. Open kit v0.1.1 issue for the 7 deferred scripts
```

## 10. Gaps for Codex / Claude Handoff

- [ ] First-project retrofit shakedown on a real bad-structured repo.
- [ ] Calibrate tier-promotion timing after 3 retrofits.
- [ ] Validate that rollback paths actually work in worst-case repos.

> **Owner of all gaps above:** `human:dominic` or `agent:codex-handoff`. NEVER the agent that logged this file.
