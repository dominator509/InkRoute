# Security Folder

Phase 13 added this folder as the future home for security review artifacts, threat models, penetration-test reports, legal-review evidence, and launch checklists.

Current status: scaffolded only.

Initial production blockers tracked in `GAP_TRACKER.md`:

- `GAP-095` auth/session/tenant guard implementation
- `GAP-096` upload validation/runtime scanning
- `GAP-097` private storage and signed URL access controls
- `GAP-098` privacy request workflow
- `GAP-099` retention/deletion/export enforcement
- `GAP-100` legal review pack
- `GAP-101` rate limiting and bot/spam controls
- `GAP-102` CSRF/security header runtime enforcement
- `GAP-103` security automated tests
- `GAP-104` app runtime/build verification

Do not add secret values, real client data, private provider payloads, legal advice, or unredacted incident evidence to this folder.
