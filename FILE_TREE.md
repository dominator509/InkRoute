# File Tree

## Phase 15 additions

- `packages/deployment/` — deployment readiness, provider matrix, launch checklist, and handoff helper package.
- `deployment/LOCAL_SETUP.md`
- `deployment/PROVIDER_OPTIONS.md`
- `deployment/CI_CD_RUNBOOK.md`
- `deployment/MOBILE_BUILD_GUIDE.md`
- `deployment/DATABASE_MIGRATION_GUIDE.md`
- `deployment/PRODUCTION_LAUNCH_CHECKLIST.md`
- `deployment/manifests/environment-contract.json`
- `deployment/manifests/provider-matrix.json`
- `deployment/manifests/production-launch-checklist.json`
- `deployment/manifests/handoff-tasks.json`
- `deployment/scripts/check-env.mjs`
- `deployment/scripts/print-launch-checklist.mjs`
- `deployment/scripts/final-gap-summary.mjs`
- `apps/dashboard/app/deployment/page.tsx`
- `apps/dashboard/lib/deploymentDemo.ts`
- `apps/dashboard/app/api/deployment/readiness/route.ts`
- `docs/phases/PHASE_15_DEPLOYMENT_HANDOFF.md`


## Phase 16 additions

- `packages/handoff/` — gap-audit, phase-doc verification, agent task queue, and prompt-rendering helper package.
- `scripts/handoff/verify-phase-docs.mjs`
- `scripts/handoff/audit-gap-tracker.mjs`
- `scripts/handoff/print-next-agent-tasks.mjs`
- `docs/handoff/AGENT_EXECUTION_QUEUE.md`
- `docs/handoff/GAP_CLOSURE_PROTOCOL.md`
- `docs/handoff/CODEX_FIRST_RUN_PROMPT.md`
- `docs/handoff/JULES_INFRA_PROMPT.md`
- `docs/handoff/CLAUDE_PROVIDER_PROMPT.md`
- `docs/handoff/manifests/agent-execution-queue.json`
- `docs/handoff/manifests/gap-audit-report.json`
- `docs/handoff/manifests/phase-documentation-audit.json`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/gap_closure.md`
- `docs/phases/PHASE_16_AGENT_EXECUTION_READINESS.md`

```text
env.example
github/ISSUE_TEMPLATE/gap_closure.md
github/PULL_REQUEST_TEMPLATE.md
github/workflows/ci.yml
github/workflows/release-governance.yml
gitignore
AGENTS.md
API_CONTRACTS.md
ARCHITECTURE.md
BUG_CRASH_REPORTING_PLAN.md
DATABASE_SCHEMA.md
DEPLOYMENT.md
ENVIRONMENT_VARIABLES.md
FILE_TREE.md
GAP_TRACKER.md
HANDOFF_TO_CLAUDE_CODE.md
HANDOFF_TO_CODEX.md
HANDOFF_TO_JULES.md
PRODUCT_REQUIREMENTS.md
README.md
RELEASE_AND_AUTO_UPDATE_PLAN.md
ROADMAP.md
SECURITY.md
SEO_PLAN.md
TESTING_PLAN.md
apps/dashboard/app/api/deployment/readiness/route.ts
apps/dashboard/app/api/error-reports/route.ts
apps/dashboard/app/api/feature-flags/route.ts
apps/dashboard/app/api/releases/route.ts
apps/dashboard/app/api/security/privacy-requests/route.ts
apps/dashboard/app/api/security/trust-status/route.ts
apps/dashboard/app/bookings/[bookingId]/page.tsx
apps/dashboard/app/bookings/page.tsx
apps/dashboard/app/calendar/page.tsx
apps/dashboard/app/clients/[clientId]/page.tsx
apps/dashboard/app/clients/page.tsx
apps/dashboard/app/deployment/page.tsx
apps/dashboard/app/errors/page.tsx
apps/dashboard/app/forms/page.tsx
apps/dashboard/app/global-error.tsx
apps/dashboard/app/globals.css
apps/dashboard/app/layout.tsx
apps/dashboard/app/messages/page.tsx
apps/dashboard/app/page.tsx
apps/dashboard/app/payments/page.tsx
apps/dashboard/app/portfolio/page.tsx
apps/dashboard/app/releases/page.tsx
apps/dashboard/app/seo/page.tsx
apps/dashboard/app/settings/page.tsx
apps/dashboard/app/templates/page.tsx
apps/dashboard/app/travel/page.tsx
apps/dashboard/app/trust/page.tsx
apps/dashboard/components/DashboardPageHeader.tsx
apps/dashboard/components/DisabledActionPanel.tsx
apps/dashboard/components/IntegrationBoundaryCard.tsx
apps/dashboard/components/MetricCard.tsx
apps/dashboard/components/StatusPill.tsx
apps/dashboard/components/Timeline.tsx
apps/dashboard/lib/demo.ts
apps/dashboard/lib/deploymentDemo.ts
apps/dashboard/lib/errorDemo.ts
apps/dashboard/lib/releaseDemo.ts
apps/dashboard/lib/securityDemo.ts
apps/dashboard/lib/seoDemo.ts
apps/dashboard/next-env.d.ts
apps/dashboard/next.config.mjs
apps/dashboard/package.json
apps/dashboard/tests/e2e/dashboard-smoke.spec.ts
apps/dashboard/tsconfig.json
apps/dashboard/tsconfig.tsbuildinfo
apps/mobile/App.tsx
apps/mobile/app.json
apps/mobile/eas.json
apps/mobile/package.json
apps/mobile/src/components/BoundaryCard.tsx
apps/mobile/src/components/MobileCard.tsx
apps/mobile/src/components/MobilePill.tsx
apps/mobile/src/components/MobileScreen.tsx
apps/mobile/src/components/ScreenTabs.tsx
apps/mobile/src/components/StatCard.tsx
apps/mobile/src/lib/mobileDemo.ts
apps/mobile/src/screens/AppointmentsScreen.tsx
apps/mobile/src/screens/AuthScreen.tsx
apps/mobile/src/screens/BookingRequestsScreen.tsx
apps/mobile/src/screens/ClientsScreen.tsx
apps/mobile/src/screens/HomeScreen.tsx
apps/mobile/src/screens/NotificationsScreen.tsx
apps/mobile/src/screens/OfflineNotesScreen.tsx
apps/mobile/src/screens/PortfolioUploadScreen.tsx
apps/mobile/src/screens/SystemStatusScreen.tsx
apps/mobile/src/screens/TravelUpdateScreen.tsx
apps/mobile/tests/mobile-static.test.ts
apps/mobile/tsconfig.json
apps/web/app/about/page.tsx
apps/web/app/aftercare/page.tsx
apps/web/app/api/public/[tenantSlug]/availability-preview/route.ts
apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts
apps/web/app/api/public/[tenantSlug]/calendar/[artistSlug]/travel.ics/route.ts
apps/web/app/api/public/[tenantSlug]/deposit-sessions/route.ts
apps/web/app/api/public/[tenantSlug]/error-reports/route.ts
apps/web/app/api/public/[tenantSlug]/messages/route.ts
apps/web/app/api/public/[tenantSlug]/notification-previews/route.ts
apps/web/app/api/public/[tenantSlug]/privacy-requests/route.ts
apps/web/app/api/public/[tenantSlug]/release-health/route.ts
apps/web/app/api/public/[tenantSlug]/secure-upload-intents/route.ts
apps/web/app/api/public/[tenantSlug]/seo-preview/route.ts
apps/web/app/api/public/[tenantSlug]/sitemap-preview/route.ts
apps/web/app/api/public/[tenantSlug]/upload-policy/route.ts
apps/web/app/api/webhooks/email/route.ts
apps/web/app/api/webhooks/sentry/route.ts
apps/web/app/api/webhooks/sms/route.ts
apps/web/app/api/webhooks/stripe/route.ts
apps/web/app/booking/BookingFlowClient.tsx
apps/web/app/booking/confirmation/page.tsx
apps/web/app/booking/deposit-preview/page.tsx
apps/web/app/booking/page.tsx
apps/web/app/cities/[citySlug]/page.tsx
apps/web/app/consent-disclaimer/page.tsx
apps/web/app/contact/page.tsx
apps/web/app/faq/page.tsx
apps/web/app/global-error.tsx
apps/web/app/globals.css
apps/web/app/layout.tsx
apps/web/app/page.tsx
apps/web/app/portfolio/page.tsx
apps/web/app/privacy/page.tsx
apps/web/app/robots.ts
apps/web/app/sitemap.ts
apps/web/app/styles/[styleSlug]/page.tsx
apps/web/app/terms/page.tsx
apps/web/app/travel/page.tsx
apps/web/app/trust/page.tsx
apps/web/components/CtaBand.tsx
apps/web/components/JsonLdScript.tsx
apps/web/components/PortfolioCard.tsx
apps/web/components/SectionIntro.tsx
apps/web/components/TravelStopCard.tsx
apps/web/lib/errorReporting.ts
apps/web/lib/format.ts
apps/web/lib/securityDemo.ts
apps/web/lib/seoEngine.ts
apps/web/next-env.d.ts
apps/web/next.config.mjs
apps/web/package.json
apps/web/tests/e2e/public-booking.spec.ts
apps/web/tsconfig.json
apps/web/tsconfig.tsbuildinfo
deployment/CI_CD_RUNBOOK.md
deployment/DATABASE_MIGRATION_GUIDE.md
deployment/LOCAL_SETUP.md
deployment/MOBILE_BUILD_GUIDE.md
deployment/PRODUCTION_LAUNCH_CHECKLIST.md
deployment/PROVIDER_OPTIONS.md
deployment/README.md
deployment/manifests/environment-contract.json
deployment/manifests/handoff-tasks.json
deployment/manifests/production-launch-checklist.json
deployment/manifests/provider-matrix.json
deployment/scripts/check-env.mjs
deployment/scripts/final-gap-summary.mjs
deployment/scripts/print-launch-checklist.mjs
docs/handoff/AGENT_EXECUTION_QUEUE.md
docs/handoff/CLAUDE_PROVIDER_PROMPT.md
docs/handoff/CODEX_FIRST_RUN_PROMPT.md
docs/handoff/GAP_CLOSURE_PROTOCOL.md
docs/handoff/JULES_INFRA_PROMPT.md
docs/handoff/README.md
docs/handoff/manifests/agent-execution-queue.json
docs/phases/PHASE_0_PRODUCT_DEFINITION.md
docs/phases/PHASE_10_SEO_ENGINE.md
docs/phases/PHASE_11_BUG_CRASH_REPORTING.md
docs/phases/PHASE_12_RELEASE_AUTO_UPDATE.md
docs/phases/PHASE_13_SECURITY_PRIVACY_TRUST.md
docs/phases/PHASE_14_TESTING_QA.md
docs/phases/PHASE_15_DEPLOYMENT_HANDOFF.md
docs/phases/PHASE_16_AGENT_EXECUTION_READINESS.md
docs/phases/PHASE_1_CLOSEOUT.md
docs/phases/PHASE_1_MONOREPO_ARCHITECTURE.md
docs/phases/PHASE_1_VERIFICATION_NOTES.md
docs/phases/PHASE_2_DATABASE_DOMAIN_MODEL.md
docs/phases/PHASE_3_PUBLIC_WEBSITE.md
docs/phases/PHASE_4_BOOKING_FLOW.md
docs/phases/PHASE_5_DASHBOARD.md
docs/phases/PHASE_6_MOBILE_APP.md
docs/phases/PHASE_7_PAYMENTS_DEPOSITS.md
docs/phases/PHASE_8_CALENDAR_TRAVEL.md
docs/phases/PHASE_9_NOTIFICATIONS_MESSAGING.md
package.json
packages/analytics/package.json
packages/analytics/src/index.ts
packages/analytics/tsconfig.json
packages/auth/package.json
packages/auth/src/index.ts
packages/auth/tsconfig.json
packages/booking/package.json
packages/booking/src/index.ts
packages/booking/tests/booking-readiness.test.ts
packages/booking/tsconfig.json
packages/calendar/package.json
packages/calendar/src/index.ts
packages/calendar/tests/availability-conflicts.test.ts
packages/calendar/tsconfig.json
packages/config/package.json
packages/config/src/index.ts
packages/config/tsconfig.json
packages/db/package.json
packages/db/prisma/schema.prisma
packages/db/prisma/seed.ts
packages/db/src/index.ts
packages/db/src/prisma.ts
packages/db/tsconfig.json
packages/deployment/package.json
packages/deployment/src/index.ts
packages/deployment/tests/deployment-readiness.test.ts
packages/deployment/tsconfig.json
packages/handoff/package.json
packages/handoff/src/index.ts
packages/handoff/tests/handoff-plan.test.ts
packages/handoff/tsconfig.json
packages/mobile/package.json
packages/mobile/src/index.ts
packages/mobile/tsconfig.json
packages/notifications/package.json
packages/notifications/src/index.ts
packages/notifications/tests/delivery-plan.test.ts
packages/notifications/tsconfig.json
packages/observability/package.json
packages/observability/src/index.ts
packages/observability/tests/redaction-report.test.ts
packages/observability/tsconfig.json
packages/payments/package.json
packages/payments/src/index.ts
packages/payments/tests/deposit-policy.test.ts
packages/payments/tsconfig.json
packages/releases/package.json
packages/releases/src/index.ts
packages/releases/tests/feature-flags.test.ts
packages/releases/tsconfig.json
packages/security/package.json
packages/security/src/index.ts
packages/security/tests/upload-policy.test.ts
packages/security/tsconfig.json
packages/seo/package.json
packages/seo/src/index.ts
packages/seo/tests/seo-engine.test.ts
packages/seo/tsconfig.json
packages/testing/package.json
packages/testing/src/index.ts
packages/testing/tests/testing-manifest.test.ts
packages/testing/tsconfig.json
packages/types/package.json
packages/types/src/index.ts
packages/types/tsconfig.json
packages/ui/package.json
packages/ui/src/button.tsx
packages/ui/src/card.tsx
packages/ui/src/index.ts
packages/ui/tsconfig.json
packages/validators/package.json
packages/validators/src/booking.ts
packages/validators/src/common.ts
packages/validators/src/enums.ts
packages/validators/src/forms.ts
packages/validators/src/index.ts
packages/validators/src/messaging.ts
packages/validators/src/payments.ts
packages/validators/src/people.ts
packages/validators/src/portfolio.ts
packages/validators/src/seo.ts
packages/validators/src/tenancy.ts
packages/validators/src/travel.ts
packages/validators/tsconfig.json
playwright.config.ts
pnpm-workspace.yaml
scripts/handoff/audit-gap-tracker.mjs
scripts/handoff/print-next-agent-tasks.mjs
scripts/handoff/verify-phase-docs.mjs
security/README.md
testing/README.md
testing/manifests/accessibility-checklist.json
testing/manifests/e2e-test-manifest.json
testing/manifests/manual-qa-checklist.json
testing/manifests/mobile-device-qa-checklist.json
testing/manifests/provider-test-plan.json
testing/manifests/security-checklist.json
testing/manifests/unit-test-manifest.json
testing/scripts/phase14-static-check.mjs
testing/scripts/print-qa-checklists.mjs
testing/scripts/verify-test-manifest.mjs
tsconfig.base.json
turbo.json
vitest.workspace.ts
```

## Phase 17 additions

```text
docs/quality/README.md
docs/quality/QUALITY_GATE_PROTOCOL.md
docs/quality/CODEX_QUALITY_GATE_PROMPT.md
docs/quality/manifests/gap-evidence-audit.json
docs/quality/manifests/markdown-link-audit.json
docs/quality/manifests/quality-gates.json
docs/phases/PHASE_17_QUALITY_GATES.md
packages/quality/package.json
packages/quality/src/index.ts
packages/quality/tests/quality-gates.test.ts
packages/quality/tsconfig.json
scripts/quality/audit-doc-links.mjs
scripts/quality/audit-gap-evidence.mjs
scripts/quality/print-quality-gates.mjs
```

## Phase 18 additions

- `packages/workspace/` — dependency-light workspace/runtime audit helpers.
- `scripts/workspace/` — dependency-free workspace import, package script, and runtime readiness scripts.
- `docs/workspace/` — workspace audit protocol, Codex prompt, and generated manifests.
- `docs/phases/PHASE_18_WORKSPACE_RUNTIME_READINESS.md` — Phase 18 closeout.
