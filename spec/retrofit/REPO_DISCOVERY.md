---
title: REPO_DISCOVERY.md — Read-Only Repository Inventory Protocol
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

# REPO_DISCOVERY.md

## 1. Purpose
Inventory the existing repo BEFORE any change. Produces `REPO_INVENTORY.md`. Strictly read-only.

## 2. The Discovery Commands (concrete)
```bash
# History
git log --oneline -n 50
git branch -a
git tag --list

# Docs inventory
find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*"

# Code line counts
find . \( -name "*.rs" -o -name "*.py" -o -name "*.ts" -o -name "*.js" -o -name "*.go" \) -not -path "./node_modules/*" | xargs wc -l 2>/dev/null

# CI config
cat .github/workflows/*.yml 2>/dev/null || echo "no GitHub Actions"
ls .circleci/ 2>/dev/null || echo "no CircleCI"

# Build config
ls Cargo.toml package.json pyproject.toml go.mod 2>/dev/null

# TODOs / FIXMEs as drift hints
git grep -l "TODO\|FIXME\|XXX\|HACK" 2>/dev/null | head -20

# Env vars referenced in code
git grep -h "env\(\|getenv\|process.env" 2>/dev/null | head -30
```

## 3. What to Inventory
- existing docs (paths, sizes)
- source tree (modules, line counts)
- test coverage estimate (tests/ vs src/ ratio)
- CI config (present/absent, working/broken)
- build config (Cargo/npm/pip/go.mod)
- dependencies (count, age)
- env vars referenced
- secrets pattern (none should be committed)

## 4. Drift Detection Heuristics
- Modules without tests → CANDIDATE-TEST-DRIFT
- Files referencing undefined env vars → CANDIDATE-CONFIG-DRIFT
- Contracts without schemas → CANDIDATE-SEMANTIC-DRIFT
- Duplicate similar implementations → CANDIDATE-CONVENTION-DRIFT
- Dead code (uncalled functions) → CANDIDATE-DEPENDENCY-DRIFT
- Abandoned branches (>90d old) → CANDIDATE-HANDOFF-DRIFT
- TODOs/FIXMEs >30d old → CANDIDATE-SPEC-DRIFT

## 5. The `REPO_INVENTORY.md` Output Schema
```yaml
inventory:
  generated_at: <UTC ISO8601>
  generated_by: agent:codex-phase<N><suffix>
  existing_docs: [<path>, ...]
  source_tree:
    total_lines: <int>
    modules:
      - path: <dir>
        language: <rust|python|ts|...>
        line_count: <int>
        has_tests: <bool>
  test_coverage_estimate: <pct>
  ci_config_present: <bool>
  ci_config_working: <bool|unknown>
  build_config_present: <bool>
  dependencies:
    total: <int>
    outdated: <int>
  env_vars_referenced: [<NAME>, ...]
  candidate_drift_locations:
    - location: <path>
      category: <1-8 per DRIFT_REMEDIATION_PLAYBOOK>
      heuristic: <which §4 rule fired>
```

## 6. What NOT to Touch (read-only contract)
During discovery, the agent MUST NOT:
- Modify any source file.
- Modify any config file.
- Create files outside `/audit/` or the dedicated retrofit output (`REPO_INVENTORY.md` allowed).
- Run any command that mutates repo state.

Read-only verified by: `git status --porcelain` shows only the discovery output additions, nothing else.

## 7. Inherited-Gap Pre-Population
For every `candidate_drift_locations` entry, emit a `LEGACY-GAP-*` entry per `LEGACY_GAP_SCHEMA.md` with:
- `discovered_during: REPO_DISCOVERY`
- `drift_category: <category>`
- `remediation_deferred_until: T4` (default; promote to T3 if low-risk new-code-only)
- `owner: agent:codex-handoff`

## 8. Discovery Exit Criteria
- `REPO_INVENTORY.md` exists and is YAML-valid.
- Every `candidate_drift_locations` has a corresponding `LEGACY-GAP-*` entry.
- `git status --porcelain` shows only discovery-output additions.
- No source/config files modified.

## 9. Trinity Adherence
The trinity: **don't drift, don't freeze, don't fixate.**

Discovery is the **Don't Drift** doctrine applied to legacy state: catalogue everything to ground future decisions in observed reality, not assumption.

## 10. Gaps for Codex / Claude Handoff
- [ ] Calibrate drift heuristics after 3 retrofits.
- [ ] Add language-specific discovery commands as coverage grows.

> **Owner of all gaps above:** `human:dominic` or `agent:codex-handoff`. NEVER the agent that logged this file.
