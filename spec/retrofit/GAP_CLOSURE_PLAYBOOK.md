---
title: GAP_CLOSURE_PLAYBOOK.md — Codex Gap-Closure Procedures
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

# GAP_CLOSURE_PLAYBOOK.md

> **Note: For INHERITED-GAPs (`LEGACY-GAP-*` prefix), use `DRIFT_REMEDIATION_PLAYBOOK.md` instead. This playbook is for new GAPs (`GAP-*` prefix) logged during or after retrofit.**

## Category 1 — Credential Gaps
- **Symptom**: `doctor.sh` FAIL on `C*` row.
- **Detect**: `bash -c "echo $<ENV_VAR>"` empty.
- **Close**: `export <ENV_VAR>="$(op read 'op://Agentic/<item>/credential')"`.
- **Verify**: re-run row's Verify Command.
- **DEC template**: scope `PROVISIONING.md C<N>`.

## Category 2 — MCP Install Gaps
- **Symptom**: FAIL on `M*` row.
- **Detect**: `claude mcp list | grep <name>` empty.
- **Close**: row's Install Command.
- **Verify**: row's Verify Command.
- **DEC template**: scope `PROVISIONING.md M<N>`.

## Category 3 — Binary Toolchain Gaps
- **Symptom**: FAIL on `B*` row.
- **Detect**: `which <binary>` empty.
- **Close**: row's Install Command.
- **Verify**: `<binary> --version`.
- **DEC template**: scope `PROVISIONING.md B<N>`.

## Category 4 — Build Execution Gaps
- **Symptom**: source authored, never compiled.
- **Detect**: no `target/` directory.
- **Close**: `cargo build --release`.
- **Verify**: binary in `target/release/`.
- **DEC template**: scope `<phase>/build`.

## Category 5 — Test Execution Gaps
- **Symptom**: unit tests authored, never run.
- **Detect**: no `cargo test` artifact.
- **Close**: `cargo test --all -- --nocapture`.
- **Verify**: all tests pass.
- **DEC template**: scope `<phase>/test`.

## Category 6 — Integration Test Gaps
- **Symptom**: tests gated on credentials.
- **Detect**: `#[ignore]` + GAP-id comment.
- **Close**: close Category 1 first, then `cargo test --all -- --ignored`.
- **Verify**: integration tests pass.
- **DEC template**: scope `<phase>/integration`.

## Category 7 — Deployment Gaps
- **Symptom**: artifact built but not deployed.
- **Detect**: no `docker push` log.
- **Close**: `docker build -t <repo>:<tag> . && docker push <repo>:<tag>`.
- **Verify**: `docker manifest inspect <repo>:<tag>`.
- **DEC template**: scope `<phase>/deploy`.

## Category 8 — Network Egress Gaps
- **Symptom**: required domain unreachable.
- **Detect**: `curl -sS -o /dev/null -w "%{http_code}" https://<domain>` non-2xx/3xx.
- **Close**: firewall allow-list.
- **Verify**: re-run curl.
- **DEC template**: scope `PROVISIONING.md §5`.

## Gaps for Codex / Claude Handoff
- [ ] Add Category 9 (DB schema migration) after first project.

> **Owner of all gaps above:** `human:dominic`. NEVER the agent that logged this file.
