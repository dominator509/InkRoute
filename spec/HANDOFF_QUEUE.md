# Retrofit Handoff Queue

Schema source: `/spec/retrofit/LEGACY_GAP_SCHEMA.md` for `LEGACY-GAP-*` and `/spec/retrofit/HANDOFF_QUEUE_SCHEMA.md` for new `GAP-*` entries.

Existing production blockers remain in `GAP_TRACKER.md`; this queue catalogues inherited retrofit drift without claiming remediation.

```yaml
- id: LEGACY-GAP-2026-06-12-001
  discovered_during: REPO_DISCOVERY
  existing_since: unknown
  drift_category: 1
  risk_tier: T1
  remediation_deferred_until: T1
  scope: root/docs and docs/ai
  blocker: "Existing architecture/spec docs predate the trinity retrofit and must be cross-referenced rather than overwritten."
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  logged_at: 2026-06-12T09:02:24Z
  phase: RETROFIT
  status: OPEN
  dec_entry_template: |
    - decision_id: DEC-2026-06-12-NNN
      scope: root/docs and docs/ai
      summary: "Resolve LEGACY-GAP-2026-06-12-001 after tier prerequisites are satisfied."

- id: LEGACY-GAP-2026-06-12-002
  discovered_during: REPO_DISCOVERY
  existing_since: unknown
  drift_category: 2
  risk_tier: T1
  remediation_deferred_until: T1
  scope: spec/PROJECT_STATE.md
  blocker: "No trinity deterministic context snapshot existed before retrofit bootstrap."
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  logged_at: 2026-06-12T09:02:24Z
  phase: RETROFIT
  status: OPEN
  dec_entry_template: |
    - decision_id: DEC-2026-06-12-NNN
      scope: spec/PROJECT_STATE.md
      summary: "Resolve LEGACY-GAP-2026-06-12-002 after tier prerequisites are satisfied."

- id: LEGACY-GAP-2026-06-12-003
  discovered_during: REPO_DISCOVERY
  existing_since: unknown
  drift_category: 5
  risk_tier: T1
  remediation_deferred_until: T1
  scope: spec/HANDOFF.md and spec/HANDOFF_QUEUE.md
  blocker: "Retrofit handoff state was not separated from production GAP_TRACKER governance."
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  logged_at: 2026-06-12T09:02:24Z
  phase: RETROFIT
  status: OPEN
  dec_entry_template: |
    - decision_id: DEC-2026-06-12-NNN
      scope: spec/HANDOFF.md and spec/HANDOFF_QUEUE.md
      summary: "Resolve LEGACY-GAP-2026-06-12-003 after tier prerequisites are satisfied."

- id: LEGACY-GAP-2026-06-12-004
  discovered_during: REPO_DISCOVERY
  existing_since: unknown
  drift_category: 8
  risk_tier: T1
  remediation_deferred_until: T1
  scope: .github/workflows/ci.yml
  blocker: "CI exists but current quality/job evidence remains tracked as open production blockers."
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  logged_at: 2026-06-12T09:02:24Z
  phase: RETROFIT
  status: OPEN
  dec_entry_template: |
    - decision_id: DEC-2026-06-12-NNN
      scope: .github/workflows/ci.yml
      summary: "Resolve LEGACY-GAP-2026-06-12-004 after tier prerequisites are satisfied."

- id: LEGACY-GAP-2026-06-12-005
  discovered_during: REPO_DISCOVERY
  existing_since: unknown
  drift_category: 6
  risk_tier: T4
  remediation_deferred_until: T4
  scope: apps/* and packages/*
  blocker: "Inventory found 7 source modules without colocated test files."
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  logged_at: 2026-06-12T09:02:24Z
  phase: RETROFIT
  status: OPEN
  dec_entry_template: |
    - decision_id: DEC-2026-06-12-NNN
      scope: apps/* and packages/*
      summary: "Resolve LEGACY-GAP-2026-06-12-005 after tier prerequisites are satisfied."

- id: LEGACY-GAP-2026-06-12-006
  discovered_during: REPO_DISCOVERY
  existing_since: unknown
  drift_category: 7
  risk_tier: T4
  remediation_deferred_until: T4
  scope: package.json and workspace packages
  blocker: "Dependency install/runtime evidence remains tracked separately in GAP_TRACKER and must not be collapsed into retrofit docs."
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  logged_at: 2026-06-12T09:02:24Z
  phase: RETROFIT
  status: OPEN
  dec_entry_template: |
    - decision_id: DEC-2026-06-12-NNN
      scope: package.json and workspace packages
      summary: "Resolve LEGACY-GAP-2026-06-12-006 after tier prerequisites are satisfied."

- id: LEGACY-GAP-2026-06-12-007
  discovered_during: REPO_DISCOVERY
  existing_since: unknown
  drift_category: 4
  risk_tier: T4
  remediation_deferred_until: T4
  scope: API/provider readiness language
  blocker: "Provider-ready, local-runtime, and production-ready terms require continued glossary discipline across docs and gaps."
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  logged_at: 2026-06-12T09:02:24Z
  phase: RETROFIT
  status: OPEN
  dec_entry_template: |
    - decision_id: DEC-2026-06-12-NNN
      scope: API/provider readiness language
      summary: "Resolve LEGACY-GAP-2026-06-12-007 after tier prerequisites are satisfied."

- id: LEGACY-GAP-2026-06-12-008
  discovered_during: REPO_DISCOVERY
  existing_since: unknown
  drift_category: 3
  risk_tier: T4
  remediation_deferred_until: T4
  scope: legacy source tree
  blocker: "Existing files may not contain SPEC-DERIVED markers or trinity conventions and are deferred until one-file DEC approvals."
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  logged_at: 2026-06-12T09:02:24Z
  phase: RETROFIT
  status: OPEN
  dec_entry_template: |
    - decision_id: DEC-2026-06-12-NNN
      scope: legacy source tree
      summary: "Resolve LEGACY-GAP-2026-06-12-008 after tier prerequisites are satisfied."

```

## New GAP Entries From Bootstrap Checks

```yaml
- id: GAP-2026-06-12-901
  scope: bootstrap safe check: pnpm quality:docs
  blocker: "Safe bootstrap check failed during retrofit; inspect command output before retrying."
  exact_codex_commands: ["pnpm quality:docs"]
  verify_command: "pnpm quality:docs"
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  logged_at: 2026-06-12T09:02:24Z
  phase: RETROFIT
  category: 5
  status: OPEN
  dec_entry_template: |
    - decision_id: DEC-2026-06-12-NNN
      scope: bootstrap safe check: pnpm quality:docs
      summary: "Resolve failed retrofit bootstrap check with source-safe remediation."

- id: GAP-2026-06-12-902
  scope: bootstrap safe check: pnpm workspace:required-checks
  blocker: "Safe bootstrap check failed during retrofit; inspect command output before retrying."
  exact_codex_commands: ["pnpm workspace:required-checks"]
  verify_command: "pnpm workspace:required-checks"
  owner: agent:codex-handoff
  logged_by: agent:codex-phase0a
  logged_at: 2026-06-12T09:02:24Z
  phase: RETROFIT
  category: 5
  status: OPEN
  dec_entry_template: |
    - decision_id: DEC-2026-06-12-NNN
      scope: bootstrap safe check: pnpm workspace:required-checks
      summary: "Resolve failed retrofit bootstrap check with source-safe remediation."

```
