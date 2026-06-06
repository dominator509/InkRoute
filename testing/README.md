# Testing Folder

Phase 14 adds manifest-driven QA scaffolding here.

## Dependency-free checks

```bash
node testing/scripts/phase14-static-check.mjs
node testing/scripts/verify-test-manifest.mjs
node testing/scripts/print-qa-checklists.mjs
```

## Manifests

- `manifests/unit-test-manifest.json` — package unit-test coverage inventory.
- `manifests/e2e-test-manifest.json` — web/dashboard Playwright smoke coverage inventory.
- `manifests/accessibility-checklist.json` — accessibility evidence checklist.
- `manifests/security-checklist.json` — security evidence checklist.
- `manifests/mobile-device-qa-checklist.json` — Expo/device QA checklist.
- `manifests/provider-test-plan.json` — credential-gated provider contract test plan.
- `manifests/manual-qa-checklist.json` — human operator QA evidence plan.

Full test execution requires dependencies, app runtimes, browsers, devices, Postgres, and provider sandboxes. See `../TESTING_PLAN.md` and `../GAP_TRACKER.md`.
