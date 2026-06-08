# Mobile Build Guide

## Status

Scaffolded only. `apps/mobile/eas.json` exists, but no EAS project, credentials, preview build, device test, push token, or OTA update has been verified.

## Preview build sequence

```bash
pnpm install
pnpm --filter @inkroute/mobile typecheck
cd apps/mobile
eas login
eas build:configure
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

## Device QA evidence

- Login/auth screen behavior.
- Booking request triage screen.
- Appointment preview.
- Client timeline preview.
- Travel update/Nomad Mode screen.
- Portfolio metadata flow.
- Offline notes queue behavior.
- Notification permission/token handling once implemented.
- Crash capture once Sentry is wired.
- OTA compatibility note for runtime version.

## OTA update guardrail

Only publish EAS Update when no native capability, permission, or runtime-incompatible change is included. Native changes require a new store/preview build.

## Evidence contract

Mobile deployment evidence is tracked in `deployment/manifests/mobile-deployment-evidence.json` and verified with:

```bash
pnpm deploy:verify-mobile
```

Keep EAS project IDs, access tokens, App Store credentials, Google Play service-account JSON, push credentials, private build URLs, and Sentry tokens outside git. The manifest may record redacted build labels, profile/channel names, required proof categories, and QA status only.
