export type DeploymentEnvironment = "local" | "preview" | "staging" | "production";
export type DeploymentSurface = "web" | "dashboard" | "mobile" | "database" | "storage" | "payments" | "calendar" | "api" | "seo" | "notifications" | "observability" | "ci";
export type DeploymentProvider = "vercel" | "neon" | "supabase" | "s3" | "stripe" | "google" | "resend" | "twilio" | "expo" | "sentry" | "github_actions" | "local";
export type DeploymentStatus = "implemented" | "scaffolded" | "credential_gated" | "deployment_gated" | "blocked" | "manual";
export type DeploymentSeverity = "critical" | "high" | "medium" | "low";
export type LaunchGateStatus = "pass" | "warn" | "block" | "not_run";

export interface EnvironmentRequirement {
  readonly name: string;
  readonly surfaces: readonly DeploymentSurface[];
  readonly environments: readonly DeploymentEnvironment[];
  readonly requiredForProduction: boolean;
  readonly secret: boolean;
  readonly exampleSafe: boolean;
  readonly description: string;
  readonly gapIds: readonly string[];
}

export interface EnvironmentCheckResult {
  readonly name: string;
  readonly present: boolean;
  readonly hasNonPlaceholderValue: boolean;
  readonly secret: boolean;
  readonly requiredForTarget: boolean;
  readonly status: LaunchGateStatus;
  readonly message: string;
  readonly gapIds: readonly string[];
}

export interface EnvironmentReadinessReport {
  readonly target: DeploymentEnvironment;
  readonly checkedAt: string;
  readonly total: number;
  readonly passing: number;
  readonly warnings: number;
  readonly blocking: number;
  readonly missingRequiredNames: readonly string[];
  readonly results: readonly EnvironmentCheckResult[];
  readonly productionBlocked: boolean;
  readonly summary: string;
}

export interface ProviderOption {
  readonly id: DeploymentProvider;
  readonly label: string;
  readonly surfaces: readonly DeploymentSurface[];
  readonly recommendedForMvp: boolean;
  readonly status: DeploymentStatus;
  readonly setupEvidenceRequired: readonly string[];
  readonly gapIds: readonly string[];
}

export interface DeploymentStep {
  readonly id: string;
  readonly surface: DeploymentSurface;
  readonly label: string;
  readonly status: DeploymentStatus;
  readonly blocksProduction: boolean;
  readonly owner: "Codex" | "Jules" | "Claude Code" | "Local terminal" | "Provider console" | "Legal reviewer";
  readonly command?: string;
  readonly evidenceRequired: string;
  readonly gapIds: readonly string[];
}

export interface DeploymentPlan {
  readonly environment: DeploymentEnvironment;
  readonly providers: readonly ProviderOption[];
  readonly steps: readonly DeploymentStep[];
  readonly productionBlockers: readonly DeploymentStep[];
  readonly summary: string;
}

export interface LaunchChecklistItem {
  readonly id: string;
  readonly phase: string;
  readonly area: DeploymentSurface | "legal" | "product" | "accessibility" | "support";
  readonly description: string;
  readonly status: DeploymentStatus;
  readonly blocksProduction: boolean;
  readonly evidenceRequired: string;
  readonly gapIds: readonly string[];
}

export interface HandoffTask {
  readonly id: string;
  readonly title: string;
  readonly target: "Codex" | "Jules" | "Claude Code" | "Local terminal" | "Provider console";
  readonly priority: DeploymentSeverity;
  readonly files: readonly string[];
  readonly prompt: string;
  readonly verification: readonly string[];
  readonly gapIds: readonly string[];
}

export const deploymentEnvironmentRequirements: readonly EnvironmentRequirement[] = [
  {
    name: "NODE_ENV",
    surfaces: ["web", "dashboard", "ci"],
    environments: ["local", "preview", "staging", "production"],
    requiredForProduction: true,
    secret: false,
    exampleSafe: true,
    description: "Runtime mode used by Next.js, scripts, and provider SDKs.",
    gapIds: ["GAP-001", "GAP-089"],
  },
  {
    name: "NEXT_PUBLIC_APP_URL",
    surfaces: ["web", "seo"],
    environments: ["local", "preview", "staging", "production"],
    requiredForProduction: true,
    secret: false,
    exampleSafe: true,
    description: "Canonical public website base URL for metadata, links, and sitemap generation.",
    gapIds: ["GAP-072", "GAP-075"],
  },
  {
    name: "NEXT_PUBLIC_DASHBOARD_URL",
    surfaces: ["dashboard"],
    environments: ["local", "preview", "staging", "production"],
    requiredForProduction: true,
    secret: false,
    exampleSafe: true,
    description: "Dashboard base URL used by notification links and admin workflows.",
    gapIds: ["GAP-036", "GAP-089"],
  },
  {
    name: "DATABASE_URL",
    surfaces: ["database"],
    environments: ["local", "preview", "staging", "production"],
    requiredForProduction: true,
    secret: true,
    exampleSafe: false,
    description: "Application database connection string.",
    gapIds: ["GAP-002", "GAP-107"],
  },
  {
    name: "DIRECT_URL",
    surfaces: ["database"],
    environments: ["preview", "staging", "production"],
    requiredForProduction: true,
    secret: true,
    exampleSafe: false,
    description: "Direct database connection for migrations when the runtime pooler is separate.",
    gapIds: ["GAP-002", "GAP-092"],
  },
  {
    name: "AUTH_SECRET",
    surfaces: ["web", "dashboard", "mobile"],
    environments: ["local", "preview", "staging", "production"],
    requiredForProduction: true,
    secret: true,
    exampleSafe: false,
    description: "Session signing/encryption secret for the selected auth provider.",
    gapIds: ["GAP-003", "GAP-095"],
  },
  {
    name: "STRIPE_SECRET_KEY",
    surfaces: ["payments"],
    environments: ["preview", "staging", "production"],
    requiredForProduction: true,
    secret: true,
    exampleSafe: false,
    description: "Stripe server key for Checkout/deposit creation.",
    gapIds: ["GAP-004", "GAP-049"],
  },
  {
    name: "STRIPE_WEBHOOK_SECRET",
    surfaces: ["payments"],
    environments: ["preview", "staging", "production"],
    requiredForProduction: true,
    secret: true,
    exampleSafe: false,
    description: "Stripe endpoint secret used to verify webhook signatures.",
    gapIds: ["GAP-004", "GAP-050"],
  },
  {
    name: "S3_BUCKET",
    surfaces: ["storage"],
    environments: ["preview", "staging", "production"],
    requiredForProduction: false,
    secret: false,
    exampleSafe: false,
    description: "S3-compatible bucket name when using S3 storage instead of Supabase Storage.",
    gapIds: ["GAP-005", "GAP-097"],
  },
  {
    name: "SUPABASE_URL",
    surfaces: ["storage", "database"],
    environments: ["preview", "staging", "production"],
    requiredForProduction: false,
    secret: false,
    exampleSafe: false,
    description: "Supabase project URL when using Supabase for auth/storage/database.",
    gapIds: ["GAP-005", "GAP-097"],
  },
  {
    name: "NEXT_PUBLIC_SENTRY_DSN",
    surfaces: ["observability"],
    environments: ["preview", "staging", "production"],
    requiredForProduction: true,
    secret: false,
    exampleSafe: false,
    description: "Client-side Sentry DSN for web and dashboard error capture.",
    gapIds: ["GAP-080", "GAP-093"],
  },
  {
    name: "SENTRY_AUTH_TOKEN",
    surfaces: ["observability", "ci"],
    environments: ["preview", "staging", "production"],
    requiredForProduction: true,
    secret: true,
    exampleSafe: false,
    description: "Sentry token for source map and release artifact upload.",
    gapIds: ["GAP-080", "GAP-089"],
  },
  {
    name: "VERCEL_TOKEN",
    surfaces: ["ci", "web", "dashboard"],
    environments: ["preview", "staging", "production"],
    requiredForProduction: true,
    secret: true,
    exampleSafe: false,
    description: "Vercel token for CI/CD deployment automation.",
    gapIds: ["GAP-014", "GAP-089"],
  },
  {
    name: "EAS_PROJECT_ID",
    surfaces: ["mobile"],
    environments: ["preview", "production"],
    requiredForProduction: true,
    secret: false,
    exampleSafe: false,
    description: "Expo project id for EAS Build and EAS Update.",
    gapIds: ["GAP-047", "GAP-091"],
  },
  {
    name: "CSRF_SECRET",
    surfaces: ["web", "dashboard", "api"],
    environments: ["preview", "staging", "production"],
    requiredForProduction: true,
    secret: true,
    exampleSafe: false,
    description: "Secret for CSRF token/signature protection once server actions and mutations are enabled.",
    gapIds: ["GAP-102"],
  },
];

export const providerOptions: readonly ProviderOption[] = [
  {
    id: "vercel",
    label: "Vercel for public web and dashboard",
    surfaces: ["web", "dashboard", "ci"],
    recommendedForMvp: true,
    status: "deployment_gated",
    setupEvidenceRequired: ["preview deployment URL", "production deployment URL", "protected environment approval", "rollback drill screenshot"],
    gapIds: ["GAP-014", "GAP-089"],
  },
  {
    id: "neon",
    label: "Neon Postgres for managed database",
    surfaces: ["database"],
    recommendedForMvp: true,
    status: "deployment_gated",
    setupEvidenceRequired: ["database branch URL", "migration deploy log", "backup/restore drill"],
    gapIds: ["GAP-002", "GAP-092", "GAP-107"],
  },
  {
    id: "supabase",
    label: "Supabase for Postgres/Auth/Storage option",
    surfaces: ["database", "storage"],
    recommendedForMvp: true,
    status: "deployment_gated",
    setupEvidenceRequired: ["project URL", "private bucket ACL proof", "RLS/tenant isolation proof"],
    gapIds: ["GAP-002", "GAP-005", "GAP-097"],
  },
  {
    id: "stripe",
    label: "Stripe Checkout for deposits",
    surfaces: ["payments"],
    recommendedForMvp: true,
    status: "credential_gated",
    setupEvidenceRequired: ["test Checkout success", "webhook replay log", "idempotent payment audit row"],
    gapIds: ["GAP-004", "GAP-049", "GAP-050", "GAP-051"],
  },
  {
    id: "expo",
    label: "Expo EAS Build and optional EAS Update",
    surfaces: ["mobile"],
    recommendedForMvp: true,
    status: "deployment_gated",
    setupEvidenceRequired: ["preview build URL", "device smoke test", "runtime compatibility note", "rollback drill"],
    gapIds: ["GAP-047", "GAP-091", "GAP-108"],
  },
  {
    id: "sentry",
    label: "Sentry for web/dashboard/mobile crash reporting",
    surfaces: ["observability"],
    recommendedForMvp: true,
    status: "credential_gated",
    setupEvidenceRequired: ["sample issue captured", "source maps uploaded", "PII redaction proof", "release link"],
    gapIds: ["GAP-080", "GAP-081", "GAP-093"],
  },
  {
    id: "github_actions",
    label: "GitHub Actions for quality gates and release governance",
    surfaces: ["ci"],
    recommendedForMvp: true,
    status: "deployment_gated",
    setupEvidenceRequired: ["CI run URL", "branch protection", "preview deployment job", "production approval"],
    gapIds: ["GAP-089", "GAP-111"],
  },
];

const placeholderFragments = ["", "replace-with", "USER:PASSWORD", "HOST", "example", "scaffolded_not_reviewed"];

function hasNonPlaceholderValue(value: string | undefined): boolean {
  if (value === undefined) return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  return !placeholderFragments.some((fragment) => fragment.length > 0 && trimmed.includes(fragment));
}

export function maskEnvValue(name: string, value: string | undefined): string {
  if (value === undefined || value.trim().length === 0) return "<missing>";
  const isSecret = deploymentEnvironmentRequirements.some((requirement) => requirement.name === name && requirement.secret);
  if (!isSecret) return value;
  if (value.length <= 6) return "******";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

export function evaluateEnvironmentReadiness(
  env: Record<string, string | undefined>,
  target: DeploymentEnvironment,
  checkedAt = new Date().toISOString(),
): EnvironmentReadinessReport {
  const results = deploymentEnvironmentRequirements.map<EnvironmentCheckResult>((requirement) => {
    const value = env[requirement.name];
    const present = value !== undefined;
    const hasValue = hasNonPlaceholderValue(value);
    const requiredForTarget = requirement.requiredForProduction && requirement.environments.includes(target);
    const status: LaunchGateStatus = requiredForTarget && !hasValue ? "block" : present && !hasValue ? "warn" : "pass";
    const message = status === "block"
      ? `${requirement.name} is required for ${target} and is missing or placeholder.`
      : status === "warn"
        ? `${requirement.name} is present but empty or placeholder; keep it out of production until configured.`
        : `${requirement.name} is present for the ${target} readiness check.`;

    return {
      name: requirement.name,
      present,
      hasNonPlaceholderValue: hasValue,
      secret: requirement.secret,
      requiredForTarget,
      status,
      message,
      gapIds: requirement.gapIds,
    };
  });

  const blocking = results.filter((result) => result.status === "block").length;
  const warnings = results.filter((result) => result.status === "warn").length;
  const passing = results.filter((result) => result.status === "pass").length;
  const missingRequiredNames = results.filter((result) => result.requiredForTarget && result.status === "block").map((result) => result.name);
  const summary = blocking > 0
    ? `${blocking} production-blocking environment requirement(s) are missing or placeholder for ${target}.`
    : `${passing} environment requirement(s) pass for ${target}; ${warnings} warning(s) remain.`;

  return {
    target,
    checkedAt,
    total: results.length,
    passing,
    warnings,
    blocking,
    missingRequiredNames,
    results,
    productionBlocked: blocking > 0,
    summary,
  };
}

export function buildDeploymentSteps(environment: DeploymentEnvironment): DeploymentStep[] {
  const steps: DeploymentStep[] = [
    {
      id: "install-lockfile",
      surface: "ci",
      label: "Install dependencies and commit lockfile",
      status: "blocked",
      blocksProduction: true,
      owner: "Local terminal",
      command: "corepack enable && pnpm install",
      evidenceRequired: "pnpm-lock.yaml committed and `pnpm typecheck` starts without missing package errors.",
      gapIds: ["GAP-001", "GAP-105"],
    },
    {
      id: "database-migrate-seed",
      surface: "database",
      label: "Provision Postgres and validate Prisma migrations",
      status: "deployment_gated",
      blocksProduction: true,
      owner: "Provider console",
      command: "pnpm db:generate && pnpm db:migrate && pnpm db:seed",
      evidenceRequired: "Migration SQL reviewed, seed data loaded in non-production, rollback/backup procedure recorded.",
      gapIds: ["GAP-002", "GAP-018", "GAP-019", "GAP-092", "GAP-107"],
    },
    {
      id: "web-dashboard-builds",
      surface: "web",
      label: "Build and smoke public web/dashboard apps",
      status: "deployment_gated",
      blocksProduction: true,
      owner: "Codex",
      command: "pnpm --filter @inkroute/web build && pnpm --filter @inkroute/dashboard build",
      evidenceRequired: "Build logs, route smoke screenshots, sitemap/robots/JSON-LD validation, noindex dashboard proof.",
      gapIds: ["GAP-027", "GAP-039", "GAP-076", "GAP-106"],
    },
    {
      id: "auth-tenant-rbac",
      surface: "dashboard",
      label: "Enable authenticated tenant-scoped access",
      status: "blocked",
      blocksProduction: true,
      owner: "Codex",
      evidenceRequired: "Unauthenticated dashboard/API access blocked and two-tenant isolation tests pass.",
      gapIds: ["GAP-003", "GAP-036", "GAP-095"],
    },
    {
      id: "storage-private-uploads",
      surface: "storage",
      label: "Configure private storage and signed uploads",
      status: "deployment_gated",
      blocksProduction: true,
      owner: "Provider console",
      evidenceRequired: "Private originals inaccessible publicly, public derivatives safe, malware/EXIF pipeline evidence attached.",
      gapIds: ["GAP-005", "GAP-033", "GAP-096", "GAP-097"],
    },
    {
      id: "stripe-test-mode",
      surface: "payments",
      label: "Wire Stripe test-mode deposits and webhooks",
      status: "credential_gated",
      blocksProduction: true,
      owner: "Codex",
      evidenceRequired: "Checkout success/failure/expired/refund/dispute webhook replay logs and idempotent audit rows.",
      gapIds: ["GAP-004", "GAP-049", "GAP-050", "GAP-051", "GAP-052"],
    },
    {
      id: "calendar-provider-sync",
      surface: "calendar",
      label: "Wire Google Calendar OAuth and sync",
      status: "credential_gated",
      blocksProduction: false,
      owner: "Codex",
      evidenceRequired: "OAuth grant, FreeBusy check, event insert/update/delete, token refresh, and timezone/DST matrix evidence.",
      gapIds: ["GAP-057", "GAP-058", "GAP-059"],
    },
    {
      id: "notifications-provider-sandbox",
      surface: "notifications",
      label: "Wire email/SMS/push sandbox delivery and preference controls",
      status: "credential_gated",
      blocksProduction: true,
      owner: "Codex",
      evidenceRequired: "Provider send logs, webhook verification, unsubscribe/STOP/HELP tests, preference-center screenshots.",
      gapIds: ["GAP-061", "GAP-062", "GAP-063", "GAP-067"],
    },
    {
      id: "sentry-release-observability",
      surface: "observability",
      label: "Wire Sentry, source maps, alerts, and release links",
      status: "credential_gated",
      blocksProduction: true,
      owner: "Codex",
      evidenceRequired: "Sample error in each app, redacted payload proof, source maps uploaded, alert route tested.",
      gapIds: ["GAP-080", "GAP-081", "GAP-083", "GAP-093"],
    },
    {
      id: "mobile-eas-build",
      surface: "mobile",
      label: "Run Expo/EAS preview build and device QA",
      status: "deployment_gated",
      blocksProduction: true,
      owner: "Local terminal",
      command: "pnpm --filter @inkroute/mobile typecheck && eas build --profile preview",
      evidenceRequired: "iOS/Android preview build URLs, device QA notes, push token proof, OTA compatibility note.",
      gapIds: ["GAP-047", "GAP-048", "GAP-091", "GAP-108"],
    },
    {
      id: "legal-launch-review",
      surface: "ci",
      label: "Complete legal/payment/privacy/consent review",
      status: "manual",
      blocksProduction: true,
      owner: "Legal reviewer",
      evidenceRequired: "Attorney-reviewed privacy, terms, consent, aftercare, SMS, deposit/no-show, and refund text.",
      gapIds: ["GAP-013", "GAP-053", "GAP-100"],
    },
  ];

  return steps.map((step) => environment === "local" && step.blocksProduction ? { ...step, status: step.status === "blocked" ? "blocked" : step.status } : step);
}

export function buildDeploymentPlan(environment: DeploymentEnvironment): DeploymentPlan {
  const steps = buildDeploymentSteps(environment);
  const productionBlockers = steps.filter((step) => step.blocksProduction && step.status !== "implemented");
  return {
    environment,
    providers: providerOptions,
    steps,
    productionBlockers,
    summary: `${productionBlockers.length} production-blocking deployment step(s) remain before ${environment} can be treated as launch-ready.`,
  };
}

export function buildProductionLaunchChecklist(): LaunchChecklistItem[] {
  return [
    {
      id: "launch-foundation-install",
      phase: "Phase 15",
      area: "ci",
      description: "Install dependencies, generate lockfile, run typecheck/lint/unit/e2e commands, and attach CI evidence.",
      status: "blocked",
      blocksProduction: true,
      evidenceRequired: "Passing CI run and committed lockfile.",
      gapIds: ["GAP-001", "GAP-105", "GAP-111"],
    },
    {
      id: "launch-tenant-isolation",
      phase: "Phase 13",
      area: "product",
      description: "Verify all dashboard/API/database queries are tenant-scoped with two-tenant fixtures.",
      status: "blocked",
      blocksProduction: true,
      evidenceRequired: "Tenant isolation test report and failing cross-tenant fixture proof.",
      gapIds: ["GAP-003", "GAP-022", "GAP-095"],
    },
    {
      id: "launch-public-conversion",
      phase: "Phase 3/4",
      area: "web",
      description: "Render public booking site on mobile and desktop with real images, accessible UI, working form persistence, and deposit boundary.",
      status: "deployment_gated",
      blocksProduction: true,
      evidenceRequired: "Route smoke, Lighthouse/axe report, booking submission, and image optimization proof.",
      gapIds: ["GAP-006", "GAP-026", "GAP-030", "GAP-032", "GAP-077"],
    },
    {
      id: "launch-provider-sandboxes",
      phase: "Phases 7-11",
      area: "payments",
      description: "Validate Stripe, email, SMS, push, calendar, storage, and observability in test/sandbox mode.",
      status: "credential_gated",
      blocksProduction: true,
      evidenceRequired: "Provider sandbox transcript with webhook signature evidence and redacted logs.",
      gapIds: ["GAP-004", "GAP-050", "GAP-057", "GAP-061", "GAP-062", "GAP-063", "GAP-080"],
    },
    {
      id: "launch-mobile-preview",
      phase: "Phase 6/12/15",
      area: "mobile",
      description: "Run preview iOS/Android EAS builds and test auth, booking triage, offline notes, travel updates, push, crash capture, and OTA compatibility.",
      status: "deployment_gated",
      blocksProduction: true,
      evidenceRequired: "Build URLs, device QA checklist, crash capture, and OTA rollback evidence.",
      gapIds: ["GAP-042", "GAP-043", "GAP-044", "GAP-045", "GAP-047", "GAP-091"],
    },
    {
      id: "launch-legal-review",
      phase: "Phase 13/15",
      area: "legal",
      description: "Replace scaffolded privacy, terms, consent, medical, SMS, aftercare, deposit, no-show, refund, and tax language with reviewed policy text.",
      status: "manual",
      blocksProduction: true,
      evidenceRequired: "Legal review memo and dated approved copy in a private legal workspace.",
      gapIds: ["GAP-013", "GAP-053", "GAP-100"],
    },
    {
      id: "launch-support-runbooks",
      phase: "Phase 15",
      area: "support",
      description: "Document incident response, rollback, privacy request handling, provider outage response, and client-support escalation paths.",
      status: "scaffolded",
      blocksProduction: false,
      evidenceRequired: "Runbook review notes and owner assignments.",
      gapIds: ["GAP-083", "GAP-098", "GAP-113"],
    },
  ];
}

export function buildHandoffTasks(): HandoffTask[] {
  return [
    {
      id: "handoff-install-verify",
      title: "Install dependencies and verify Phase 14 test scaffold",
      target: "Codex",
      priority: "critical",
      files: ["package.json", "pnpm-workspace.yaml", "vitest.workspace.ts", "playwright.config.ts", "testing/", "GAP_TRACKER.md"],
      prompt: "Install InkRoute Suite dependencies with pnpm, commit pnpm-lock.yaml, run all package typechecks and test commands, fix only real dependency/runtime issues, and update GAP_TRACKER with exact command output.",
      verification: ["pnpm install", "pnpm typecheck", "pnpm test:unit", "pnpm test:manifest"],
      gapIds: ["GAP-001", "GAP-105", "GAP-111"],
    },
    {
      id: "handoff-db-auth-storage",
      title: "Provision database, auth, and private storage foundations",
      target: "Jules",
      priority: "critical",
      files: ["packages/db/prisma/schema.prisma", "packages/auth/src/index.ts", "packages/security/src/index.ts", ".env.example", "DEPLOYMENT.md"],
      prompt: "Provision a non-production Postgres/auth/storage environment, validate Prisma schema, generate migrations, wire authenticated tenant-scoped loaders, and prove private storage access controls with tests.",
      verification: ["pnpm db:generate", "pnpm db:migrate", "tenant isolation tests", "private upload access tests"],
      gapIds: ["GAP-002", "GAP-003", "GAP-005", "GAP-095", "GAP-097"],
    },
    {
      id: "handoff-provider-sandboxes",
      title: "Wire provider sandboxes without live production credentials",
      target: "Claude Code",
      priority: "high",
      files: ["packages/payments/", "packages/notifications/", "packages/calendar/", "packages/observability/", "API_CONTRACTS.md"],
      prompt: "Implement test-mode provider integrations for Stripe, notifications, Google Calendar, and Sentry using existing boundary helpers, verify webhooks/signatures, and keep all production credentials out of the repo.",
      verification: ["Stripe CLI webhook replay", "email/SMS sandbox logs", "Google FreeBusy test", "Sentry sample event"],
      gapIds: ["GAP-004", "GAP-050", "GAP-057", "GAP-061", "GAP-062", "GAP-080"],
    },
    {
      id: "handoff-preview-deploy",
      title: "Create preview deployment pipeline",
      target: "Provider console",
      priority: "high",
      files: [".github/workflows/ci.yml", ".github/workflows/release-governance.yml", "DEPLOYMENT.md", "deployment/"],
      prompt: "Configure GitHub environments/secrets, Vercel preview projects, migration dry-run, Sentry release upload, and EAS preview build using the Phase 15 deployment manifests and scripts.",
      verification: ["CI run URL", "web preview URL", "dashboard preview URL", "migration dry-run log", "EAS preview build URL"],
      gapIds: ["GAP-014", "GAP-089", "GAP-091", "GAP-113", "GAP-114"],
    },
  ];
}

export function summarizeLaunchChecklist(items: readonly LaunchChecklistItem[]) {
  const blocking = items.filter((item) => item.blocksProduction && item.status !== "implemented");
  const byStatus = items.reduce<Record<DeploymentStatus, number>>(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    {
      implemented: 0,
      scaffolded: 0,
      credential_gated: 0,
      deployment_gated: 0,
      blocked: 0,
      manual: 0,
    },
  );

  return {
    itemCount: items.length,
    productionBlockingCount: blocking.length,
    byStatus,
    blockerIds: blocking.map((item) => item.id),
  };
}
