# Production Launch Checklist

## Status

Scaffolded only. The current repo is not production-ready.

## Blocking launch items

- Dependency install and lockfile verified.
- Typecheck, unit tests, E2E smoke tests, manifest checks, and app builds pass.
- Database provisioned, migrations generated, seed/dev data verified, backups configured.
- Auth/session/RBAC/tenant isolation implemented and tested.
- Private storage, signed uploads, malware scanning, EXIF/GPS stripping, and ACLs verified.
- Booking persistence, reference uploads, Stripe deposits, notifications, calendar holds, and confirmation flows implemented.
- Web/dashboard/mobile provider sandboxes verified.
- Legal review complete for privacy, terms, consent, medical, SMS, aftercare, deposit, no-show, refund, and tax language.
- Sentry/OpenTelemetry/error redaction/alerting wired.
- CI/CD preview and production approval gates configured.
- Mobile preview builds and OTA compatibility/rollback verified.
- Accessibility, SEO, Lighthouse/Core Web Vitals, performance, and security evidence attached.

## Dependency-free helper commands

```bash
pnpm deploy:check-env
pnpm deploy:verify-provider-envs
pnpm deploy:verify-secrets
pnpm deploy:verify-mobile
pnpm deploy:verify-database-ops
pnpm deploy:verify-launch-evidence
pnpm deploy:verify-ops
pnpm deploy:checklist
pnpm deploy:gaps
```

## Launch evidence bundle

Production launch evidence is tracked in `deployment/manifests/production-launch-evidence.json` and verified with:

```bash
pnpm deploy:verify-launch-evidence
```

This bundle is a redacted index of required proof across CI/build/test, database operations, providers/secrets, security/privacy, accessibility/SEO/performance, mobile release, legal approval, and rollback drills. It must not contain provider secrets, database URLs, private console links, client PII, medical notes, or payment payloads.

## Launch operations evidence

Incident response, support, privacy, monitoring, on-call, communications, and rollback operations are tracked in `deployment/manifests/launch-operations-evidence.json` and verified with:

```bash
pnpm deploy:verify-ops
```

The manifest must use role/team labels and redacted artifact labels only. Do not commit private phone numbers, personal emails, alert webhook URLs, raw support transcripts, client PII, medical notes, or payment payloads.

## Approval rule

Do not launch a tenant publicly until every production-blocking gap in `GAP_TRACKER.md` is closed with evidence.
