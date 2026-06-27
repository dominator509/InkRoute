# Provider Options

## Status

Scaffolded provider decision matrix. No provider is configured in this repository yet.

## Recommended MVP path

| Surface | Recommended option | Why | Current status |
| --- | --- | --- | --- |
| Public web | Vercel | Monorepo-friendly Next.js deployment and preview URLs. | Deployment-gated |
| Dashboard | Vercel | Same build/runtime model as public web; keep separate project/env. | Deployment-gated |
| Database | Neon or Supabase Postgres | Managed Postgres with branches/backups. | Deployment-gated |
| Storage | Supabase Storage or S3-compatible bucket | Supports private originals and public derivatives. | Deployment-gated |
| Auth | Supabase Auth, Auth.js, Clerk, or custom provider decision | Must enforce tenant membership and RBAC. | Blocked |
| Payments | Stripe Checkout | Lowest PCI burden for deposits. | Credential-gated |
| Calendar | Google Calendar API plus ICS export | Best initial sync target for working artists. | Credential-gated |
| Email | Resend or equivalent | Transactional booking/prep/aftercare emails. | Credential-gated |
| SMS | Twilio or equivalent | Consent-gated SMS reminders and waitlist messages. | Credential-gated |
| Push | Expo Push | Mobile app notification path. | Credential-gated |
| Observability | Sentry | Web/dashboard/mobile errors and source maps. | Credential-gated |
| CI/CD | GitHub Actions | Quality gates, preview deploy, release governance. | Deployment-gated |

## Decision rule

Use managed providers until product-market fit is proven. Avoid self-hosting auth, object storage, payment, SMS, or crash infrastructure before tenant isolation, security, and launch QA are verified.

## Evidence contract

Provider provisioning evidence is tracked in `deployment/manifests/provider-environment-evidence.json` and verified with:

```bash
pnpm deploy:verify-provider-envs
```

Keep the manifest redacted. It may name provider type, environment, required proof category, secret-store destination, and status, but must not contain raw provider project IDs, database URLs, bucket names, tokens, webhook secrets, or private console links.
