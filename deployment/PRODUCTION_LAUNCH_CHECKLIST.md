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
pnpm deploy:checklist
pnpm deploy:gaps
```

## Approval rule

Do not launch a tenant publicly until every production-blocking gap in `GAP_TRACKER.md` is closed with evidence.
