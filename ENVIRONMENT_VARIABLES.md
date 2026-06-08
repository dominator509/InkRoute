# Environment Variables

See `.env.example` for the canonical starter list.

## Core

| Variable | Purpose | Required for local demo | Production status |
| --- | --- | --- | --- |
| `NODE_ENV` | Runtime mode | Yes | Required |
| `NEXT_PUBLIC_APP_URL` | Public website URL | Yes | Required |
| `NEXT_PUBLIC_DASHBOARD_URL` | Dashboard URL | Yes | Required |
| `NEXT_PUBLIC_BRAND_NAME` | Public brand label | No | Optional |

## Database/Auth

| Variable | Purpose | Status |
| --- | --- | --- |
| `DATABASE_URL` | Prisma pooled Postgres connection | Credential-gated |
| `DIRECT_URL` | Direct Postgres migration connection | Credential-gated |
| `AUTH_SECRET` | Session/signing secret | Credential-gated |
| `NEXTAUTH_URL` | Dashboard auth base URL if Auth.js is selected | Credential-gated |

## Storage

| Variable | Purpose | Status |
| --- | --- | --- |
| `S3_ENDPOINT` | S3-compatible endpoint | Credential-gated |
| `S3_REGION` | Bucket region | Credential-gated |
| `S3_BUCKET` | Bucket name | Credential-gated |
| `S3_ACCESS_KEY_ID` | S3 access key | Credential-gated |
| `S3_SECRET_ACCESS_KEY` | S3 secret | Credential-gated |
| `SUPABASE_URL` | Supabase project URL | Credential-gated |
| `SUPABASE_ANON_KEY` | Browser-safe anon key | Credential-gated |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only storage/admin key | Credential-gated |

## Payments

| Variable | Purpose | Status |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Server-side Stripe API key for Checkout Sessions or Payment Intents | Credential-gated; Phase 7 route boundaries do not use it yet |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature secret for verifying raw Stripe webhook bodies | Credential-gated; Phase 7 webhook boundary requires signature header but does not verify yet |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Browser publishable key if embedded/client Stripe UI is selected | Credential-gated; not needed for hosted Checkout redirect |

## Calendar

| Variable | Purpose | Status |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | Google OAuth client | Credential-gated |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Credential-gated |
| `GOOGLE_REDIRECT_URI` | OAuth callback | Credential-gated |

## Notifications

| Variable | Purpose | Status |
| --- | --- | --- |
| `RESEND_API_KEY` | Email provider key | Credential-gated |
| `EMAIL_FROM` | Verified transactional sender address | Credential-gated |
| `EMAIL_WEBHOOK_SECRET` | Email provider webhook signature secret | Credential-gated |
| `TWILIO_ACCOUNT_SID` | SMS provider account | Credential-gated |
| `TWILIO_AUTH_TOKEN` | SMS provider secret | Credential-gated |
| `TWILIO_MESSAGING_SERVICE_SID` | SMS messaging service | Credential-gated |
| `SMS_WEBHOOK_SECRET` | SMS webhook/signature verification support where provider requires it | Credential-gated |
| `EXPO_ACCESS_TOKEN` | Expo push provider token for server-side push sends | Credential-gated |

## Observability

| Variable | Purpose | Status |
| --- | --- | --- |
| `SENTRY_DSN` | Web/dashboard/backend Sentry DSN | Credential-gated |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry collector endpoint | Credential-gated |

## Mobile

| Variable | Purpose | Status |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | Mobile API base URL | Deployment-gated |
| `EXPO_PUBLIC_SENTRY_DSN` | Mobile Sentry DSN | Credential-gated |
| `EAS_PROJECT_ID` | Expo Application Services project | Deployment-gated |


## Phase 5 dashboard environment note

The Phase 5 dashboard remains static. Production dashboard work will require auth/session secrets, database URLs, storage credentials, Stripe keys, email/SMS/push provider keys, calendar OAuth credentials, Sentry DSNs, and release/feature flag environment values before actions can be enabled.

## Phase 6 mobile environment note

The Phase 6 Expo scaffold still requires production mobile variables and secrets outside this repository, including API base URLs, auth client IDs, secure redirect schemes, Expo project ID, EAS Update URL, Sentry mobile DSN, push notification configuration, and storage upload endpoints. Do not hardcode mobile secrets in `apps/mobile/app.json` or committed source.

## Phase 7 payment environment notes

The Phase 7 payment code intentionally avoids importing the Stripe SDK or reading Stripe secrets. Before enabling live payment routes, configure test-mode credentials first, pin a Stripe API version through SDK configuration or account settings, run Stripe CLI webhook tests, and confirm no secret values are exposed to the browser.

## Phase 8 calendar/travel environment notes

Phase 8 added static calendar/travel route boundaries and helper payload drafts. Production calendar work will require:

| Variable | Required for | Status |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Google Calendar OAuth connect/callback | Not configured |
| `GOOGLE_CLIENT_SECRET` | Google Calendar OAuth token exchange | Not configured |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | Not configured |
| `GOOGLE_CALENDAR_SCOPES` | Calendar event/freebusy permissions | Not configured |
| `CALENDAR_ENCRYPTION_KEY` | Encrypting provider refresh/access tokens | Not configured |
| `ICS_FEED_SIGNING_SECRET` | Signing private tenant/artist feed URLs | Not configured |
| `PUBLIC_REVALIDATION_SECRET` | Triggering safe public route/cache revalidation after travel edits | Not configured |

Do not enable live Google Calendar sync until encrypted token storage, tenant membership checks, provider retry/idempotency, and audit logging are implemented.


## Phase 9 notifications environment notes

Phase 9 does not read notification secrets at runtime. Before enabling live delivery, configure provider sandbox accounts first, verify sender domains and phone compliance, and keep provider credentials server-only. Production notification work also needs queue/worker settings, suppression/preference storage, delivery webhook secrets, Expo push project values, and safe local/staging test credentials.


## Phase 10 SEO/Search Console variables

| Variable | Purpose | Status |
| --- | --- | --- |
| `GOOGLE_SEARCH_CONSOLE_CLIENT_ID` | Optional Search Console OAuth client for sitemap/query import workflows | Credential-gated |
| `GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET` | Optional Search Console OAuth secret | Credential-gated |
| `GOOGLE_SEARCH_CONSOLE_REDIRECT_URI` | OAuth callback for SEO provider integration | Credential-gated |
| `SEO_DEFAULT_CANONICAL_HOST` | Fallback canonical host when tenant domain is not configured | Scaffolded only |
| `SEO_REVALIDATION_SECRET` | Secret for future CMS/provider revalidation webhooks | Not implemented |

## Phase 11 observability variables

| Variable | Purpose | Status |
| --- | --- | --- |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser/client Sentry DSN for web and dashboard once SDKs are installed | Credential-gated |
| `SENTRY_DSN` | Server-side Sentry DSN if separated from public DSN | Credential-gated |
| `SENTRY_AUTH_TOKEN` | CI-only token for source-map/debug-symbol upload; never expose to browser | Credential-gated / secret |
| `SENTRY_ORG` | Sentry organization slug for source-map upload | Credential-gated |
| `SENTRY_PROJECT` | Sentry project slug for source-map upload | Credential-gated |
| `SENTRY_WEBHOOK_SECRET` | Secret used to verify provider webhook callbacks | Credential-gated |
| `ERROR_REPORT_INGEST_SECRET` | Optional fallback ingest secret for server/mobile reports | Credential-gated |
| `OTEL_SERVICE_NAME` | OpenTelemetry service name per app/deployment | Deployment-gated |
| `OTEL_EXPORTER_OTLP_HEADERS` | OTLP exporter auth headers, stored only in server secrets | Credential-gated / secret |
| `GITHUB_TOKEN` | Optional issue creation token for sanitized agentic bug workflow | Credential-gated / secret |
| `GITHUB_REPOSITORY` | Repository target for approved issue automation | Deployment-gated |
| `ALERT_WEBHOOK_URL` | Slack/Pager/email bridge for high/critical sanitized alerts | Credential-gated / secret |

Phase 11 does not consume these in production code yet. They are documented for Codex/Jules/local setup when wiring Sentry, OpenTelemetry, fallback persistence, alerts, and GitHub issue automation.

## Phase 12 release/deployment variables

These are scaffolded placeholders only and must not be treated as configured secrets until created in the relevant provider dashboards and GitHub environments.

| Variable | Purpose | Status |
| --- | --- | --- |
| `RELEASE_ENVIRONMENT` | App-visible release environment label such as development, preview, staging, or production. | Scaffolded |
| `RELEASE_CHANNEL` | Release channel used by release helpers and deployment metadata. | Scaffolded |
| `RELEASE_RECORD_WRITE_TOKEN` | Future internal token for release automation to write ReleaseRecord results. | Not implemented |
| `FEATURE_FLAG_ADMIN_TOKEN` | Future internal token for trusted flag automation. | Not implemented |
| `VERCEL_TOKEN` | Vercel deployment token for web/dashboard deploy automation. | Credential-gated |
| `VERCEL_ORG_ID` | Vercel organization/team id. | Credential-gated |
| `VERCEL_WEB_PROJECT_ID` | Public web Vercel project id. | Credential-gated |
| `VERCEL_DASHBOARD_PROJECT_ID` | Dashboard Vercel project id. | Credential-gated |
| `EAS_UPDATE_CHANNEL_PREVIEW` | Preview EAS Update channel name. | Deployment-gated |
| `EAS_UPDATE_CHANNEL_PRODUCTION` | Production EAS Update channel name. | Deployment-gated |
| `RELEASE_APPROVAL_WEBHOOK_URL` | Future internal release approval/notification webhook. | Not implemented |

Phase 12 added these variables to `.env.example`, but no code reads live values yet except static helper previews. Codex must wire them through CI/CD and server-side runtime configuration with secret redaction and audit logging.

## Phase 13 security/privacy/trust variables

These variables are placeholders for the Phase 13 security scaffold. Do not treat them as configured until provisioned in the relevant secret manager/provider and tested in staging.

| Variable | Purpose | Status |
| --- | --- | --- |
| `SECURITY_ENCRYPTION_PRIMARY_KEY` | Future application-level encryption key or key reference for sensitive fields and private provider tokens. Prefer managed KMS/Vault references over raw keys when possible. | Credential-gated / not implemented |
| `SECURITY_KEY_VERSION` | Key version label for encrypted fields and rotation planning. | Scaffolded |
| `RATE_LIMIT_REDIS_URL` | Redis/Upstash-compatible rate-limit store URL for public and dashboard abuse controls. | Credential-gated / not implemented |
| `RATE_LIMIT_REDIS_TOKEN` | Rate-limit store credential. Server-only secret. | Credential-gated / not implemented |
| `CSRF_SECRET` | HMAC/signing secret for signed double-submit CSRF token strategy where needed. | Credential-gated / not implemented |
| `UPLOAD_SIGNING_SECRET` | Optional signing secret for upload intent tokens if not handled entirely by storage provider SDK. | Credential-gated / not implemented |
| `UPLOAD_SCAN_PROVIDER_API_KEY` | Malware/file scanning provider credential. Must not receive private client data until privacy review is complete. | Credential-gated / not implemented |
| `UPLOAD_QUARANTINE_BUCKET` | Separate bucket/location for files awaiting scan/review. | Deployment-gated / not implemented |
| `PRIVACY_REQUEST_INTAKE_SECRET` | Internal secret for privacy request workflow automation and spam-resistant intake. | Credential-gated / not implemented |
| `LEGAL_REVIEW_STATUS` | Non-secret marker showing whether legal documents are still scaffolded or reviewed. | Scaffolded only |

Phase 13 code does not read these values yet for production behavior. Codex/Jules must wire them through server-only configuration, tests, secret redaction, and audit logs before enabling live security workflows.

## Phase 15 deployment/handoff variables

These variables are scaffolded in `.env.example` for deployment planning only. They are not configured in this sandbox.

| Variable | Purpose | Status |
| --- | --- | --- |
| `DEPLOYMENT_TARGET` | Local/preview/staging/production marker for deployment scripts and runbooks. | Scaffolded |
| `PREVIEW_WEB_URL` | Provider-generated preview URL for the public web app. | Deployment-gated |
| `PREVIEW_DASHBOARD_URL` | Provider-generated preview URL for the dashboard app. | Deployment-gated |
| `PRODUCTION_WEB_URL` | Final production public website URL. | Deployment-gated |
| `PRODUCTION_DASHBOARD_URL` | Final production dashboard URL. | Deployment-gated |
| `DATABASE_MIGRATION_APPROVAL_STATUS` | Manual/release marker for migration readiness. | Scaffolded only |
| `PRODUCTION_LAUNCH_APPROVAL_STATUS` | Manual marker indicating whether launch is still blocked. | Scaffolded only |
| `INCIDENT_RESPONSE_OWNER` | Human owner for launch incident response. | Not configured |
| `SUPPORT_ESCALATION_EMAIL` | Support escalation inbox/address. | Not configured |

The Phase 15 environment contract lives at `deployment/manifests/environment-contract.json`. Use `pnpm deploy:check-env` for a safe presence check and `pnpm deploy:check-env:strict` only against a real secret-backed environment.
