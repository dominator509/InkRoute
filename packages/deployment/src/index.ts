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

export interface DeploymentPipelineReadinessInput {
  providerProjectsConfigured: boolean;
  githubEnvironmentsConfigured: boolean;
  githubSecretsConfigured: boolean;
  vercelWebProjectConfigured: boolean;
  vercelDashboardProjectConfigured: boolean;
  previewDeploySucceeded: boolean;
  productionDryRunSucceeded: boolean;
  productionApprovalGateConfigured: boolean;
  databaseProviderConfigured: boolean;
  migrationDryRunSucceeded: boolean;
  backupRestoreDrillCompleted: boolean;
  storageProviderConfigured: boolean;
  mobileEasProjectConfigured: boolean;
  easPreviewBuildSucceeded: boolean;
  easNativeCredentialsConfigured: boolean;
  otaRollbackDrillCompleted: boolean;
  ciQualityGatesRequired: boolean;
  sentryReleaseUploadConfigured: boolean;
  environmentStrictCheckPassed: boolean;
  rollbackRunbookReviewed: boolean;
  launchEvidenceCollected: boolean;
}

export interface DeploymentPipelineReadinessPlan {
  readonly status: "ready" | "blocked";
  readonly requiredCommands: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly approvalGates: readonly string[];
  readonly blockers: readonly string[];
}

export interface DeploymentToolingVerificationInput {
  readonly packageScripts: Readonly<Record<string, string>>;
  readonly dependenciesInstalled: boolean;
  readonly deploymentPackageTestsPassed: boolean;
  readonly deploymentPackageTypecheckPassed: boolean;
  readonly unitRouteContractTestsPassed: boolean;
  readonly deployCheckEnvPassed: boolean;
  readonly deployChecklistPassed: boolean;
  readonly deployGapsPassed: boolean;
  readonly webBuildPassed: boolean;
  readonly dashboardBuildPassed: boolean;
  readonly dashboardReadinessApiSmokePassed: boolean;
  readonly dashboardDeploymentPageSmokePassed: boolean;
  readonly rollbackPreflightVerified: boolean;
  readonly blockedProductionApprovalVerified: boolean;
  readonly ciCapturedDeploymentReports: boolean;
  readonly documentedBlockersPublished: boolean;
}

export interface DeploymentToolingVerificationPlan {
  readonly status: "ready" | "blocked";
  readonly missingScripts: readonly string[];
  readonly requiredCommands: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly blockers: readonly string[];
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

export function buildDeploymentPipelineReadinessPlan(input: DeploymentPipelineReadinessInput): DeploymentPipelineReadinessPlan {
  const blockers: string[] = [];

  if (!input.providerProjectsConfigured) blockers.push("Provider projects must be created for web, dashboard, database, storage, mobile, observability, and CI.");
  if (!input.githubEnvironmentsConfigured) blockers.push("GitHub preview and production environments must be configured.");
  if (!input.githubSecretsConfigured) blockers.push("GitHub environment secrets must be configured without placeholder values.");
  if (!input.vercelWebProjectConfigured) blockers.push("Vercel public web project must be configured.");
  if (!input.vercelDashboardProjectConfigured) blockers.push("Vercel dashboard project must be configured.");
  if (!input.previewDeploySucceeded) blockers.push("Preview deployment must complete for web and dashboard.");
  if (!input.productionDryRunSucceeded) blockers.push("Production dry run must complete without mutating production data.");
  if (!input.productionApprovalGateConfigured) blockers.push("Production deployment approval gate must be configured.");
  if (!input.databaseProviderConfigured) blockers.push("Managed Postgres provider must be configured before deployment readiness.");
  if (!input.migrationDryRunSucceeded) blockers.push("Migration dry run must succeed against a non-production database.");
  if (!input.backupRestoreDrillCompleted) blockers.push("Database backup/restore drill must be completed and documented.");
  if (!input.storageProviderConfigured) blockers.push("Private storage provider and bucket policies must be configured.");
  if (!input.mobileEasProjectConfigured) blockers.push("Expo/EAS project must be configured with project id and update URL.");
  if (!input.easPreviewBuildSucceeded) blockers.push("EAS preview build must succeed for mobile.");
  if (!input.easNativeCredentialsConfigured) blockers.push("EAS native signing credentials must be configured outside the repo.");
  if (!input.otaRollbackDrillCompleted) blockers.push("OTA rollback drill must be completed before mobile update readiness.");
  if (!input.ciQualityGatesRequired) blockers.push("CI quality gates must be required before preview or production deployment.");
  if (!input.sentryReleaseUploadConfigured) blockers.push("Sentry release/source-map upload must be configured in deployment pipeline.");
  if (!input.environmentStrictCheckPassed) blockers.push("Strict environment check must pass with non-placeholder preview/production values.");
  if (!input.rollbackRunbookReviewed) blockers.push("Rollback runbook must be reviewed with owners before launch.");
  if (!input.launchEvidenceCollected) blockers.push("Launch evidence packet must include URLs, command logs, provider screenshots, redacted secrets proof, and rollback evidence.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    requiredCommands: [
      "pnpm deploy:check-env:strict",
      "pnpm deploy:verify-provider-envs",
      "pnpm deploy:verify-secrets",
      "pnpm deploy:verify-mobile",
      "pnpm deploy:verify-database-ops",
      "pnpm deploy:verify-launch-evidence",
      "pnpm deploy:verify-ops",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm db:generate && pnpm db:migrate",
      "eas build --profile preview",
    ],
    requiredEvidence: [
      "Preview web and dashboard deployment URLs with route smoke output.",
      "Production dry-run log and explicit approval-gate screenshot or settings export.",
      "Managed Postgres connection, migration dry-run, backup, and restore evidence.",
      "Private storage bucket ACL proof and signed upload/download smoke output.",
      "EAS preview build URL, device smoke notes, native credential status, update channel, and OTA rollback transcript.",
      "GitHub Actions CI run URL proving required quality gates before deploy jobs.",
      "Sentry release/source-map upload output linked to deployment version.",
      "Redacted environment strict-check output proving no placeholders or secrets are committed.",
      "Rollback runbook owner review and launch evidence packet.",
    ],
    approvalGates: [
      "Production GitHub environment requires human approval.",
      "Database migrations require dry-run review before production deploy.",
      "Mobile OTA updates require runtime-version compatibility and rollback approval.",
      "Provider secret changes require redacted two-person review.",
      "Legal/payment/privacy launch gates remain blocked until approved evidence exists.",
    ],
    blockers,
  };
}

export function buildDeploymentToolingVerificationPlan(
  input: DeploymentToolingVerificationInput,
): DeploymentToolingVerificationPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/deployment package script is missing ${script}.`);
  if (!input.dependenciesInstalled) blockers.push("Workspace dependencies must install before deployment tooling verification is meaningful.");
  if (!input.deploymentPackageTestsPassed) blockers.push("@inkroute/deployment tests must pass.");
  if (!input.deploymentPackageTypecheckPassed) blockers.push("@inkroute/deployment typecheck must pass.");
  if (!input.unitRouteContractTestsPassed) blockers.push("Dashboard deployment readiness route contract tests must pass.");
  if (!input.deployCheckEnvPassed) blockers.push("deploy:check-env script must pass or emit documented blockers.");
  if (!input.deployChecklistPassed) blockers.push("deploy:checklist script must pass or emit documented launch blockers.");
  if (!input.deployGapsPassed) blockers.push("deploy:gaps script must pass and summarize production gap blockers.");
  if (!input.webBuildPassed) blockers.push("@inkroute/web build must pass before deployment route smoke evidence is meaningful.");
  if (!input.dashboardBuildPassed) blockers.push("@inkroute/dashboard build must pass before deployment dashboard smoke evidence is meaningful.");
  if (!input.dashboardReadinessApiSmokePassed) blockers.push("Dashboard deployment readiness API smoke must prove local fallback, RBAC denial, rollback preflight, and blocked approval boundaries.");
  if (!input.dashboardDeploymentPageSmokePassed) blockers.push("Dashboard deployment page smoke must prove the deployment readiness UI renders current blocker data.");
  if (!input.rollbackPreflightVerified) blockers.push("Rollback preflight boundaries must be verified before production deployment readiness.");
  if (!input.blockedProductionApprovalVerified) blockers.push("Blocked production approval boundaries must prevent launch while required evidence is missing.");
  if (!input.ciCapturedDeploymentReports) blockers.push("GitHub Actions must capture deployment check-env, checklist, gaps, route, and build reports.");
  if (!input.documentedBlockersPublished) blockers.push("Deployment blockers must be published in a human-readable report for handoff.");

  if (!input.dependenciesInstalled || !input.deploymentPackageTestsPassed || !input.deploymentPackageTypecheckPassed || !input.unitRouteContractTestsPassed) {
    requiredEvidence.push("dependency install plus deployment package test/typecheck and dashboard route contract output");
  }
  if (!input.deployCheckEnvPassed || !input.deployChecklistPassed || !input.deployGapsPassed) {
    requiredEvidence.push("deploy:check-env, deploy:checklist, and deploy:gaps script transcripts");
  }
  if (!input.webBuildPassed || !input.dashboardBuildPassed || !input.dashboardReadinessApiSmokePassed || !input.dashboardDeploymentPageSmokePassed) {
    requiredEvidence.push("web/dashboard build output and deployment dashboard API/page smoke evidence");
  }
  if (!input.rollbackPreflightVerified || !input.blockedProductionApprovalVerified) {
    requiredEvidence.push("rollback preflight and blocked production approval boundary evidence");
  }
  if (!input.ciCapturedDeploymentReports || !input.documentedBlockersPublished) {
    requiredEvidence.push("CI deployment report artifacts and published blocker report");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm install --frozen-lockfile",
      "pnpm --filter @inkroute/deployment typecheck",
      "pnpm --filter @inkroute/deployment test",
      "pnpm test:unit -- apps/web/tests/dashboard-deployment-readiness-route.test.ts",
      "pnpm deploy:check-env",
      "pnpm deploy:checklist",
      "pnpm deploy:gaps",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
    ],
    requiredEvidence,
    blockers,
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

export interface DeploymentToolingRuntimeVerificationInput {
  readonly packageScripts: Readonly<Record<string, string>>;
  readonly rootScripts: readonly string[];
  readonly dependenciesInstalled: boolean;
  readonly deploymentPackageTestsPassed: boolean;
  readonly deploymentPackageTypecheckPassed: boolean;
  readonly deploymentScriptsExecuted: boolean;
  readonly deployCheckEnvPassed: boolean;
  readonly deployChecklistPassed: boolean;
  readonly deployGapsPassed: boolean;
  readonly routeContractTestsPassed: boolean;
  readonly dashboardBuildPassed: boolean;
  readonly dashboardDeploymentPageSmokePassed: boolean;
  readonly dashboardReadinessApiSmokePassed: boolean;
  readonly rollbackPreflightVerified: boolean;
  readonly productionApprovalBoundaryVerified: boolean;
  readonly ciDeploymentReportsCaptured: boolean;
  readonly blockersDocumented: boolean;
}

export interface DeploymentToolingRuntimeVerificationPlan {
  readonly status: "ready" | "blocked";
  readonly missingPackageScripts: readonly string[];
  readonly missingRootScripts: readonly string[];
  readonly requiredCommands: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly blockers: readonly string[];
}

const requiredDeploymentPackageScripts = ["test", "typecheck"] as const;
const requiredDeploymentRootScripts = [
  "deploy:check-env",
  "deploy:checklist",
  "deploy:gaps",
  "test:unit",
] as const;

export function buildDeploymentToolingRuntimeVerificationPlan(
  input: DeploymentToolingRuntimeVerificationInput,
): DeploymentToolingRuntimeVerificationPlan {
  const packageScriptNames = new Set(Object.keys(input.packageScripts));
  const rootScriptNames = new Set(input.rootScripts);
  const missingPackageScripts = requiredDeploymentPackageScripts.filter((script) => !packageScriptNames.has(script));
  const missingRootScripts = requiredDeploymentRootScripts.filter((script) => !rootScriptNames.has(script));

  const requiredCommands = [
    "pnpm install --frozen-lockfile",
    "pnpm --filter @inkroute/deployment typecheck",
    "pnpm --filter @inkroute/deployment test",
    "pnpm test:unit -- apps/web/tests/dashboard-deployment-readiness-route.test.ts",
    "pnpm deploy:check-env",
    "pnpm deploy:checklist",
    "pnpm deploy:gaps",
    "pnpm --filter @inkroute/dashboard build",
    "dashboard deployment page/API route smoke",
  ];

  const requiredEvidence = [
    "Dependency install output plus @inkroute/deployment typecheck and test output.",
    "Deployment script outputs for deploy:check-env, deploy:checklist, and deploy:gaps.",
    "Dashboard build output plus deployment page and readiness API smoke output.",
    "Rollback preflight and production approval boundary proof.",
    "CI deployment report artifacts and documented blocker owner list.",
  ];

  const blockers: string[] = [];
  if (missingPackageScripts.length > 0) {
    blockers.push("Deployment package must expose test and typecheck scripts.");
  }
  if (missingRootScripts.length > 0) {
    blockers.push("Root deployment and unit-test scripts must be wired.");
  }
  if (!input.dependenciesInstalled) {
    blockers.push("Workspace dependencies must install before deployment scripts are meaningful.");
  }
  if (!input.deploymentPackageTestsPassed || !input.deploymentPackageTypecheckPassed) {
    blockers.push("@inkroute/deployment tests and typecheck must pass.");
  }
  if (!input.deploymentScriptsExecuted) {
    blockers.push("Deployment scripts must execute through package/root scripts.");
  }
  if (!input.deployCheckEnvPassed || !input.deployChecklistPassed || !input.deployGapsPassed) {
    blockers.push("Deploy check-env, checklist, and gaps scripts must pass or emit documented blockers.");
  }
  if (!input.routeContractTestsPassed) {
    blockers.push("Dashboard deployment readiness route contract tests must pass.");
  }
  if (!input.dashboardBuildPassed) {
    blockers.push("Dashboard build must pass before route smoke is meaningful.");
  }
  if (!input.dashboardDeploymentPageSmokePassed) {
    blockers.push("Dashboard deployment page smoke must pass.");
  }
  if (!input.dashboardReadinessApiSmokePassed) {
    blockers.push("Dashboard readiness API smoke must pass.");
  }
  if (!input.rollbackPreflightVerified) {
    blockers.push("Rollback preflight boundaries must be verified.");
  }
  if (!input.productionApprovalBoundaryVerified) {
    blockers.push("Production approval boundary must be verified.");
  }
  if (!input.ciDeploymentReportsCaptured) {
    blockers.push("CI must capture deployment reports/artifacts.");
  }
  if (!input.blockersDocumented) {
    blockers.push("Any remaining deployment blockers must be documented with owners.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingPackageScripts,
    missingRootScripts,
    requiredCommands,
    requiredEvidence,
    blockers,
  };
}

export type ProviderEnvironmentEvidenceStatus = "not_provisioned" | "provisioned_redacted" | "verified_redacted";
export type ProviderEnvironmentName = "preview" | "staging" | "production";
export type ProviderEnvironmentSurface = "web" | "dashboard" | "database" | "storage" | "mobile" | "observability" | "ci_cd";

export interface ProviderEnvironmentSurfaceEvidence {
  readonly surface: ProviderEnvironmentSurface;
  readonly provider: string;
  readonly status: ProviderEnvironmentEvidenceStatus;
  readonly secretStore: string;
  readonly requiredEvidence: readonly string[];
}

export interface ProviderEnvironmentEvidence {
  readonly name: ProviderEnvironmentName;
  readonly requiredBeforeProduction: boolean;
  readonly surfaces: readonly ProviderEnvironmentSurfaceEvidence[];
}

export interface ProviderEnvironmentRuntimeReadinessInput {
  readonly environments: readonly ProviderEnvironmentEvidence[];
  readonly verifierPassed: boolean;
  readonly providerSmokeChecksPassed: boolean;
  readonly githubEnvironmentProtectionsConfigured: boolean;
  readonly secretStoreDestinationsConfigured: boolean;
  readonly redactedEvidenceLabelsRecorded: boolean;
}

export interface ProviderEnvironmentRuntimeReadinessPlan {
  readonly status: "ready" | "blocked";
  readonly missingEnvironmentSurfacePairs: readonly string[];
  readonly unverifiedEnvironmentSurfacePairs: readonly string[];
  readonly unsafeEvidenceFields: readonly string[];
  readonly requiredCommands: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly blockers: readonly string[];
}

const requiredProviderEnvironmentNames: readonly ProviderEnvironmentName[] = ["preview", "staging", "production"];
const requiredProviderEnvironmentSurfaces: readonly ProviderEnvironmentSurface[] = [
  "web",
  "dashboard",
  "database",
  "storage",
  "mobile",
  "observability",
  "ci_cd",
];

const unsafeProviderEvidencePatterns = [
  /sk_live_[A-Za-z0-9]+/,
  /sk_test_[A-Za-z0-9]+/,
  /postgres(?:ql)?:\/\/[^"<>\s]+/i,
  /ghp_[A-Za-z0-9_]+/,
  /vercel_[A-Za-z0-9_]+/,
  /SENTRY_AUTH_TOKEN\s*[:=]\s*["']?[A-Za-z0-9_-]+/i,
];

function containsUnsafeProviderEvidence(value: string): boolean {
  return unsafeProviderEvidencePatterns.some((pattern) => pattern.test(value));
}

export function buildProviderEnvironmentRuntimeReadinessPlan(
  input: ProviderEnvironmentRuntimeReadinessInput,
): ProviderEnvironmentRuntimeReadinessPlan {
  const environmentByName = new Map(input.environments.map((environment) => [environment.name, environment]));
  const missingEnvironmentSurfacePairs: string[] = [];
  const unverifiedEnvironmentSurfacePairs: string[] = [];
  const unsafeEvidenceFields: string[] = [];

  for (const environmentName of requiredProviderEnvironmentNames) {
    const environment = environmentByName.get(environmentName);
    if (!environment) {
      for (const surface of requiredProviderEnvironmentSurfaces) {
        missingEnvironmentSurfacePairs.push(`${environmentName}/${surface}`);
      }
      continue;
    }

    const surfaceByName = new Map(environment.surfaces.map((surface) => [surface.surface, surface]));
    for (const surfaceName of requiredProviderEnvironmentSurfaces) {
      const surface = surfaceByName.get(surfaceName);
      if (!surface) {
        missingEnvironmentSurfacePairs.push(`${environmentName}/${surfaceName}`);
        continue;
      }

      if (surface.status !== "verified_redacted") {
        unverifiedEnvironmentSurfacePairs.push(`${environmentName}/${surfaceName}`);
      }
      if (!surface.provider.trim()) {
        unverifiedEnvironmentSurfacePairs.push(`${environmentName}/${surfaceName}:provider`);
      }
      if (!surface.secretStore.trim()) {
        unverifiedEnvironmentSurfacePairs.push(`${environmentName}/${surfaceName}:secretStore`);
      }
      if (surface.requiredEvidence.length < 2) {
        unverifiedEnvironmentSurfacePairs.push(`${environmentName}/${surfaceName}:requiredEvidence`);
      }

      const evidenceValues = [surface.provider, surface.secretStore, ...surface.requiredEvidence];
      evidenceValues.forEach((value, index) => {
        if (containsUnsafeProviderEvidence(value)) {
          unsafeEvidenceFields.push(`${environmentName}/${surfaceName}:${index}`);
        }
      });
    }
  }

  const blockers: string[] = [];
  if (missingEnvironmentSurfacePairs.length > 0) {
    blockers.push("Provider evidence manifest must cover preview, staging, and production for every required surface.");
  }
  if (unverifiedEnvironmentSurfacePairs.length > 0) {
    blockers.push("Every provider environment surface must be provisioned and recorded as verified_redacted before launch.");
  }
  if (unsafeEvidenceFields.length > 0) {
    blockers.push("Provider environment evidence must not include raw secrets, project ids, tokens, or connection strings.");
  }
  if (!input.verifierPassed) {
    blockers.push("pnpm deploy:verify-provider-envs must pass.");
  }
  if (!input.providerSmokeChecksPassed) {
    blockers.push("Provider smoke checks must pass for web, dashboard, database, storage, mobile, observability, and CI/CD.");
  }
  if (!input.githubEnvironmentProtectionsConfigured) {
    blockers.push("GitHub preview, staging, and production environment protections must be configured.");
  }
  if (!input.secretStoreDestinationsConfigured) {
    blockers.push("Provider secret-store destinations must be configured without committing secret values.");
  }
  if (!input.redactedEvidenceLabelsRecorded) {
    blockers.push("Redacted provider evidence labels must be recorded for handoff without exposing identifiers.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingEnvironmentSurfacePairs,
    unverifiedEnvironmentSurfacePairs,
    unsafeEvidenceFields,
    requiredCommands: [
      "pnpm deploy:verify-provider-envs",
      "pnpm deploy:check-env:strict",
      "provider web/dashboard route smoke",
      "provider database migration dry-run",
      "provider storage private ACL smoke",
      "eas build --profile preview",
      "sentry release/source-map smoke",
      "github environment protection audit",
    ],
    requiredEvidence: [
      "Redacted preview, staging, and production web/dashboard URL labels with smoke output.",
      "Managed Postgres branch/project label, migration dry-run log, and backup/restore proof.",
      "Private storage bucket ACL proof and signed upload/download smoke evidence.",
      "EAS project/channel labels, preview build artifact, and device QA proof.",
      "Sentry project label, sample issue label, and source-map upload artifact.",
      "GitHub Actions environment protection, required checks, secret-store destination, and artifact-retention proof.",
    ],
    blockers,
  };
}

export type SecretManagementAuditStatus = "not_configured" | "configured_redacted" | "rotated_redacted" | "incident_rotated_redacted";

export interface SecretManagementAuditItem {
  readonly name: string;
  readonly group: string;
  readonly requiredForProduction: boolean;
  readonly destinations: readonly string[];
  readonly rotationCadenceDays: number;
  readonly status: SecretManagementAuditStatus;
  readonly requiredEvidence: readonly string[];
}

export interface SecretManagementRotationPolicy {
  readonly defaultCadenceDays: number;
  readonly incidentRotationHours: number;
  readonly requiresDualControlForProduction: boolean;
  readonly requiresMaskedCiLogProof: boolean;
  readonly requiresProviderAuditLogReference: boolean;
}

export interface SecretManagementRuntimeReadinessInput {
  readonly requiredProductionSecretNames: readonly string[];
  readonly auditItems: readonly SecretManagementAuditItem[];
  readonly rotationPolicy: SecretManagementRotationPolicy;
  readonly verifierPassed: boolean;
  readonly strictEnvironmentCheckPassed: boolean;
  readonly providerSecretStoresConfigured: boolean;
  readonly maskedCiLogsCaptured: boolean;
  readonly providerAuditLogsCaptured: boolean;
  readonly committedSecretScanPassed: boolean;
  readonly incidentRotationProcessDocumented: boolean;
}

export interface SecretManagementRuntimeReadinessPlan {
  readonly status: "ready" | "blocked";
  readonly missingProductionSecrets: readonly string[];
  readonly unconfiguredProductionSecrets: readonly string[];
  readonly unsafeEvidenceFields: readonly string[];
  readonly requiredCommands: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly blockers: readonly string[];
}

const unsafeSecretManagementEvidencePatterns = [
  /sk_live_[A-Za-z0-9]+/,
  /sk_test_[A-Za-z0-9]+/,
  /rk_live_[A-Za-z0-9]+/,
  /postgres(?:ql)?:\/\/(?!USER:PASSWORD@HOST)[^"<>\s]+/i,
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /vercel_[A-Za-z0-9_]{20,}/i,
  /xox[baprs]-[A-Za-z0-9-]+/,
  /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/,
];

function containsUnsafeSecretManagementEvidence(value: string): boolean {
  return unsafeSecretManagementEvidencePatterns.some((pattern) => pattern.test(value));
}

export function buildSecretManagementRuntimeReadinessPlan(
  input: SecretManagementRuntimeReadinessInput,
): SecretManagementRuntimeReadinessPlan {
  const auditByName = new Map(input.auditItems.map((item) => [item.name, item]));
  const missingProductionSecrets = input.requiredProductionSecretNames.filter((name) => !auditByName.has(name));
  const unconfiguredProductionSecrets: string[] = [];
  const unsafeEvidenceFields: string[] = [];

  for (const name of input.requiredProductionSecretNames) {
    const item = auditByName.get(name);
    if (!item) continue;

    if (item.status === "not_configured") {
      unconfiguredProductionSecrets.push(name);
    }
    if (item.destinations.length === 0) {
      unconfiguredProductionSecrets.push(`${name}:destinations`);
    }
    if (item.requiredEvidence.length < 2) {
      unconfiguredProductionSecrets.push(`${name}:requiredEvidence`);
    }
    if (!Number.isFinite(item.rotationCadenceDays) || item.rotationCadenceDays <= 0 || item.rotationCadenceDays > 365) {
      unconfiguredProductionSecrets.push(`${name}:rotationCadenceDays`);
    }

    const evidenceValues = [item.name, item.group, ...item.destinations, ...item.requiredEvidence];
    evidenceValues.forEach((value, index) => {
      if (containsUnsafeSecretManagementEvidence(value)) {
        unsafeEvidenceFields.push(`${name}:${index}`);
      }
    });
  }

  const blockers: string[] = [];
  if (missingProductionSecrets.length > 0) {
    blockers.push("Every production secret from the environment contract must be represented in the secret-management audit.");
  }
  if (unconfiguredProductionSecrets.length > 0) {
    blockers.push("Production secrets must be configured or rotated with redacted evidence, destinations, and valid rotation cadence.");
  }
  if (unsafeEvidenceFields.length > 0) {
    blockers.push("Secret-management evidence must not contain raw secret values, tokens, connection strings, or private keys.");
  }
  if (!input.rotationPolicy.requiresDualControlForProduction) {
    blockers.push("Production secret rotation must require dual control.");
  }
  if (!input.rotationPolicy.requiresMaskedCiLogProof) {
    blockers.push("Secret rotation policy must require masked CI log proof.");
  }
  if (!input.rotationPolicy.requiresProviderAuditLogReference) {
    blockers.push("Secret rotation policy must require provider audit-log references.");
  }
  if (!Number.isFinite(input.rotationPolicy.defaultCadenceDays) || input.rotationPolicy.defaultCadenceDays <= 0 || input.rotationPolicy.defaultCadenceDays > 365) {
    blockers.push("Default secret rotation cadence must be between 1 and 365 days.");
  }
  if (!Number.isFinite(input.rotationPolicy.incidentRotationHours) || input.rotationPolicy.incidentRotationHours <= 0 || input.rotationPolicy.incidentRotationHours > 24) {
    blockers.push("Incident secret rotation target must be between 1 and 24 hours.");
  }
  if (!input.verifierPassed) {
    blockers.push("pnpm deploy:verify-secrets must pass.");
  }
  if (!input.strictEnvironmentCheckPassed) {
    blockers.push("pnpm deploy:check-env:strict must pass against a real secret-backed environment.");
  }
  if (!input.providerSecretStoresConfigured) {
    blockers.push("Provider secret stores must be configured without committing secret material.");
  }
  if (!input.maskedCiLogsCaptured) {
    blockers.push("CI logs must prove secret values are masked.");
  }
  if (!input.providerAuditLogsCaptured) {
    blockers.push("Provider audit logs must prove secret creation/rotation events.");
  }
  if (!input.committedSecretScanPassed) {
    blockers.push("Committed-secret scanning must pass for env examples and deployment manifests.");
  }
  if (!input.incidentRotationProcessDocumented) {
    blockers.push("Incident secret rotation process must be documented with owners.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingProductionSecrets,
    unconfiguredProductionSecrets,
    unsafeEvidenceFields,
    requiredCommands: [
      "pnpm deploy:verify-secrets",
      "pnpm deploy:check-env:strict",
      "committed secret scan",
      "provider secret-store audit",
      "masked CI log review",
      "incident rotation tabletop",
    ],
    requiredEvidence: [
      "Secret-management audit manifest with configured_redacted or rotated_redacted status for every production secret.",
      "Strict environment check output from a real secret-backed preview/staging/production environment.",
      "Provider secret-store destination labels and audit-log references without secret values.",
      "Masked CI log artifacts proving secrets are not printed.",
      "Rotation cadence, dual-control review, and incident rotation owner evidence.",
      "Committed-secret scan output for .env.example, deployment manifests, and CI workflows.",
    ],
    blockers,
  };
}

export type MobileDeploymentProfileStatus = "not_built" | "configured_redacted" | "built_redacted" | "verified_redacted";
export type MobileDeploymentQaStatus = "not_run" | "configured_redacted" | "built_redacted" | "verified_redacted";
export type MobileDeploymentPlatform = "ios" | "android";
export type MobileDeploymentProfileName = "development" | "preview" | "production";
export type MobileDeploymentQaId = "device-qa" | "push-token" | "crash-capture" | "ota-rollback" | "store-readiness";

export interface MobileDeploymentPlatformEvidence {
  readonly platform: MobileDeploymentPlatform;
  readonly status: MobileDeploymentProfileStatus;
  readonly evidenceRequired: readonly string[];
}

export interface MobileDeploymentProfileEvidence {
  readonly profile: MobileDeploymentProfileName;
  readonly distribution: "internal" | "store";
  readonly channel: string;
  readonly required: boolean;
  readonly status: MobileDeploymentProfileStatus;
  readonly evidenceRequired?: readonly string[];
  readonly platforms?: readonly MobileDeploymentPlatformEvidence[];
}

export interface MobileDeploymentQaEvidence {
  readonly id: MobileDeploymentQaId;
  readonly status: MobileDeploymentQaStatus;
  readonly requiredEvidence: readonly string[];
}

export interface MobileRuntimePolicyEvidence {
  readonly expoRuntimeVersionPolicy: string;
  readonly requiresStoreBuildWhen: readonly string[];
  readonly otaAllowedWhen: readonly string[];
}

export interface MobileDeploymentRuntimeReadinessInput {
  readonly buildProfiles: readonly MobileDeploymentProfileEvidence[];
  readonly qaEvidence: readonly MobileDeploymentQaEvidence[];
  readonly runtimePolicy: MobileRuntimePolicyEvidence;
  readonly appRuntimeVersionPolicy: string;
  readonly easChannelsConfigured: boolean;
  readonly nativeCredentialsConfigured: boolean;
  readonly pushCredentialsConfigured: boolean;
  readonly sentryMobileConfigured: boolean;
  readonly verifierPassed: boolean;
  readonly redactedBuildArtifactsRecorded: boolean;
  readonly storeReadinessReviewed: boolean;
}

export interface MobileDeploymentRuntimeReadinessPlan {
  readonly status: "ready" | "blocked";
  readonly missingProfiles: readonly string[];
  readonly incompleteProfiles: readonly string[];
  readonly missingQaEvidence: readonly string[];
  readonly incompleteQaEvidence: readonly string[];
  readonly requiredCommands: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly blockers: readonly string[];
}

const requiredMobileProfiles: readonly MobileDeploymentProfileName[] = ["development", "preview", "production"];
const requiredMobileQaEvidence: readonly MobileDeploymentQaId[] = ["device-qa", "push-token", "crash-capture", "ota-rollback", "store-readiness"];
const requiredMobileRuntimeStoreBuildReasons = ["native dependencies change", "permissions change", "runtime version changes", "app config changes affect native capabilities"];
const requiredMobileOtaConditions = ["preview binary is installed", "runtime versions match", "no native capability or permission changed", "rollback update has been rehearsed on preview channel"];

export function buildMobileDeploymentRuntimeReadinessPlan(
  input: MobileDeploymentRuntimeReadinessInput,
): MobileDeploymentRuntimeReadinessPlan {
  const profilesByName = new Map(input.buildProfiles.map((profile) => [profile.profile, profile]));
  const qaById = new Map(input.qaEvidence.map((item) => [item.id, item]));
  const missingProfiles = requiredMobileProfiles.filter((profile) => !profilesByName.has(profile));
  const incompleteProfiles: string[] = [];
  const missingQaEvidence = requiredMobileQaEvidence.filter((id) => !qaById.has(id));
  const incompleteQaEvidence: string[] = [];

  for (const profileName of requiredMobileProfiles) {
    const profile = profilesByName.get(profileName);
    if (!profile) continue;

    if (profile.status !== "verified_redacted" && profile.status !== "built_redacted") {
      incompleteProfiles.push(profileName);
    }
    const profileEvidenceCount = profile.evidenceRequired?.length ?? 0;
    const platforms = profile.platforms ?? [];
    if (profileEvidenceCount < 2 && platforms.length === 0) {
      incompleteProfiles.push(`${profileName}:evidenceRequired`);
    }
    if ((profileName === "preview" || profileName === "production") && platforms.length < 2) {
      incompleteProfiles.push(`${profileName}:platforms`);
    }
    for (const platform of platforms) {
      if (platform.status !== "verified_redacted" && platform.status !== "built_redacted") {
        incompleteProfiles.push(`${profileName}/${platform.platform}`);
      }
      if (platform.evidenceRequired.length < 2) {
        incompleteProfiles.push(`${profileName}/${platform.platform}:evidenceRequired`);
      }
    }
  }

  for (const qaId of requiredMobileQaEvidence) {
    const item = qaById.get(qaId);
    if (!item) continue;
    if (item.status !== "verified_redacted") {
      incompleteQaEvidence.push(qaId);
    }
    if (item.requiredEvidence.length < 2) {
      incompleteQaEvidence.push(`${qaId}:requiredEvidence`);
    }
  }

  const missingStoreBuildReasons = requiredMobileRuntimeStoreBuildReasons.filter(
    (reason) => !input.runtimePolicy.requiresStoreBuildWhen.includes(reason),
  );
  const missingOtaConditions = requiredMobileOtaConditions.filter(
    (condition) => !input.runtimePolicy.otaAllowedWhen.includes(condition),
  );
  const blockers: string[] = [];

  if (missingProfiles.length > 0) {
    blockers.push("Mobile deployment evidence must include development, preview, and production EAS profiles.");
  }
  if (incompleteProfiles.length > 0) {
    blockers.push("Mobile development, preview, and production profiles must have redacted build evidence for required platforms.");
  }
  if (missingQaEvidence.length > 0) {
    blockers.push("Mobile deployment evidence must include device QA, push token, crash capture, OTA rollback, and store-readiness items.");
  }
  if (incompleteQaEvidence.length > 0) {
    blockers.push("Mobile QA, push, crash, OTA rollback, and store-readiness evidence must be verified_redacted.");
  }
  if (input.runtimePolicy.expoRuntimeVersionPolicy !== input.appRuntimeVersionPolicy) {
    blockers.push("Mobile app runtimeVersion policy must match deployment runtime policy.");
  }
  if (missingStoreBuildReasons.length > 0) {
    blockers.push("Mobile runtime policy must require store builds for native dependency, permission, runtime, and native app-config changes.");
  }
  if (missingOtaConditions.length > 0) {
    blockers.push("Mobile OTA policy must require preview binary, matching runtime, no native capability change, and rehearsed rollback.");
  }
  if (!input.easChannelsConfigured) {
    blockers.push("EAS development, preview, and production channels must be configured.");
  }
  if (!input.nativeCredentialsConfigured) {
    blockers.push("iOS and Android native signing credentials must be configured outside the repo.");
  }
  if (!input.pushCredentialsConfigured) {
    blockers.push("Mobile push credentials and token registration proof must be configured.");
  }
  if (!input.sentryMobileConfigured) {
    blockers.push("Sentry mobile project, source maps, and crash capture proof must be configured.");
  }
  if (!input.verifierPassed) {
    blockers.push("pnpm deploy:verify-mobile must pass.");
  }
  if (!input.redactedBuildArtifactsRecorded) {
    blockers.push("Redacted EAS build artifact labels must be recorded for handoff.");
  }
  if (!input.storeReadinessReviewed) {
    blockers.push("App Store and Google Play readiness must be reviewed before production mobile launch.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingProfiles,
    incompleteProfiles,
    missingQaEvidence,
    incompleteQaEvidence,
    requiredCommands: [
      "pnpm deploy:verify-mobile",
      "eas build --profile development",
      "eas build --profile preview --platform all",
      "eas build --profile production --platform all",
      "eas update --channel preview",
      "mobile device QA checklist",
      "mobile push token smoke",
      "mobile synthetic crash capture",
      "OTA rollback rehearsal",
    ],
    requiredEvidence: [
      "Development, preview, and production EAS build artifact labels for iOS and Android where required.",
      "Device QA checklist covering auth, booking triage, offline notes, travel updates, and reconnect behavior.",
      "Push token registration and receipt proof.",
      "Sentry mobile crash capture, source-map, and redaction proof.",
      "Runtime policy decision showing when store builds are required versus OTA updates allowed.",
      "OTA publish and rollback rehearsal evidence on preview channel.",
      "App Store Connect and Google Play credential/readiness review labels.",
    ],
    blockers,
  };
}

export type DatabaseOperationEvidenceStatus = "not_run" | "configured_redacted" | "passed_redacted" | "blocked_redacted";
export type DatabaseOperationCheckId =
  | "staging-branch-provisioned"
  | "migration-dry-run"
  | "destructive-change-scan"
  | "staging-migration-apply"
  | "seed-policy"
  | "backup-restore-drill"
  | "tenant-isolation-smoke"
  | "branch-promotion";

export interface DatabaseOperationCheckEvidence {
  readonly id: DatabaseOperationCheckId;
  readonly status: DatabaseOperationEvidenceStatus;
  readonly requiredBeforeProduction: boolean;
  readonly evidenceRequired: readonly string[];
  readonly blockedSqlPatterns?: readonly string[];
}

export interface DatabaseOperationsRuntimeReadinessInput {
  readonly providerStatus: "not_provisioned" | "configured_redacted" | "verified_redacted";
  readonly requiredCommands: readonly string[];
  readonly dbPackageScripts: Readonly<Record<string, string>>;
  readonly operationChecks: readonly DatabaseOperationCheckEvidence[];
  readonly verifierPassed: boolean;
  readonly prismaGeneratePassed: boolean;
  readonly prismaValidatePassed: boolean;
  readonly migrationDryRunPassed: boolean;
  readonly stagingMigrationApplied: boolean;
  readonly backupRestoreDrillPassed: boolean;
  readonly tenantIsolationSmokePassed: boolean;
  readonly branchPromotionApproved: boolean;
  readonly productionDataSafetyReviewed: boolean;
}

export interface DatabaseOperationsRuntimeReadinessPlan {
  readonly status: "ready" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingScripts: readonly string[];
  readonly missingChecks: readonly string[];
  readonly incompleteChecks: readonly string[];
  readonly requiredCommands: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly blockers: readonly string[];
}

const requiredDatabaseOperationCommands = [
  "pnpm db:generate",
  "pnpm --filter @inkroute/db db:validate",
  "pnpm db:migrate",
  "pnpm db:seed",
] as const;
const requiredDatabaseOperationScripts: Readonly<Record<string, string>> = {
  "db:validate": "prisma validate",
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:seed": "tsx prisma/seed.ts",
};
const requiredDatabaseOperationCheckIds: readonly DatabaseOperationCheckId[] = [
  "staging-branch-provisioned",
  "migration-dry-run",
  "destructive-change-scan",
  "staging-migration-apply",
  "seed-policy",
  "backup-restore-drill",
  "tenant-isolation-smoke",
  "branch-promotion",
];
const requiredDatabaseBlockedSqlPatterns = ["DROP TABLE", "DROP COLUMN", "ALTER TABLE DROP", "TRUNCATE"] as const;

export function buildDatabaseOperationsRuntimeReadinessPlan(
  input: DatabaseOperationsRuntimeReadinessInput,
): DatabaseOperationsRuntimeReadinessPlan {
  const missingCommands = requiredDatabaseOperationCommands.filter((command) => !input.requiredCommands.includes(command));
  const missingScripts = Object.entries(requiredDatabaseOperationScripts)
    .filter(([script, expectedFragment]) => !String(input.dbPackageScripts[script] ?? "").includes(expectedFragment))
    .map(([script]) => script);
  const checkById = new Map(input.operationChecks.map((check) => [check.id, check]));
  const missingChecks = requiredDatabaseOperationCheckIds.filter((checkId) => !checkById.has(checkId));
  const incompleteChecks: string[] = [];

  for (const checkId of requiredDatabaseOperationCheckIds) {
    const check = checkById.get(checkId);
    if (!check) continue;
    if (check.requiredBeforeProduction !== true) {
      incompleteChecks.push(`${checkId}:requiredBeforeProduction`);
    }
    if (check.status !== "passed_redacted") {
      incompleteChecks.push(checkId);
    }
    if (check.evidenceRequired.length < 2) {
      incompleteChecks.push(`${checkId}:evidenceRequired`);
    }
  }

  const destructiveScan = checkById.get("destructive-change-scan");
  for (const pattern of requiredDatabaseBlockedSqlPatterns) {
    if (!destructiveScan?.blockedSqlPatterns?.includes(pattern)) {
      incompleteChecks.push(`destructive-change-scan:${pattern}`);
    }
  }

  const blockers: string[] = [];
  if (input.providerStatus !== "verified_redacted") {
    blockers.push("Database provider branch/project must be provisioned and verified with redacted evidence.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Database operations contract must list generate, validate, migrate, and seed commands.");
  }
  if (missingScripts.length > 0) {
    blockers.push("@inkroute/db package scripts must expose Prisma validate, generate, migrate, and seed commands.");
  }
  if (missingChecks.length > 0) {
    blockers.push("Database operations evidence must include every required operation check.");
  }
  if (incompleteChecks.length > 0) {
    blockers.push("Database operation checks must pass with redacted evidence before production.");
  }
  if (!input.verifierPassed) {
    blockers.push("pnpm deploy:verify-database-ops must pass.");
  }
  if (!input.prismaGeneratePassed || !input.prismaValidatePassed) {
    blockers.push("Prisma generate and validate commands must pass.");
  }
  if (!input.migrationDryRunPassed) {
    blockers.push("Migration dry-run and generated SQL review must pass before staging apply.");
  }
  if (!input.stagingMigrationApplied) {
    blockers.push("Staging migration apply must pass against a production-like branch.");
  }
  if (!input.backupRestoreDrillPassed) {
    blockers.push("Backup/restore drill must pass with RTO/RPO evidence.");
  }
  if (!input.tenantIsolationSmokePassed) {
    blockers.push("Tenant-isolation smoke must pass after migration and seed.");
  }
  if (!input.branchPromotionApproved) {
    blockers.push("Branch promotion must have approval and rollback evidence.");
  }
  if (!input.productionDataSafetyReviewed) {
    blockers.push("Production data safety, seed policy, and destructive SQL gates must be reviewed.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingCommands,
    missingScripts,
    missingChecks,
    incompleteChecks,
    requiredCommands: [
      "pnpm deploy:verify-database-ops",
      "pnpm db:generate",
      "pnpm --filter @inkroute/db db:validate",
      "pnpm db:migrate",
      "pnpm db:seed",
      "database destructive SQL scan",
      "database backup/restore drill",
      "database tenant-isolation smoke",
      "database branch promotion approval",
    ],
    requiredEvidence: [
      "Redacted staging database branch/provider label and secret-store reference.",
      "Prisma validate, generate, migration dry-run, and generated SQL review output.",
      "Destructive SQL scan output covering DROP TABLE, DROP COLUMN, ALTER TABLE DROP, and TRUNCATE.",
      "Staging migration apply log, migration id, seed output, and app compatibility smoke.",
      "Backup snapshot, restore drill log, and RTO/RPO note.",
      "Tenant-isolation smoke output and tenant-scoped query audit label.",
      "Branch promotion approval, production branch label, and rollback branch/restore evidence.",
    ],
    blockers,
  };
}

export type ProductionLaunchEvidenceStatus = "missing" | "partial_redacted" | "verified_redacted" | "blocked_redacted";
export type ProductionLaunchApprovalStatus = "blocked" | "approved_redacted";
export type ProductionLaunchEvidenceBundleId =
  | "ci-build-test"
  | "database-ops"
  | "provider-and-secret-readiness"
  | "security-privacy-trust"
  | "accessibility-seo-performance"
  | "mobile-release"
  | "legal-approval"
  | "rollback-and-operations";

export interface ProductionLaunchEvidenceBundle {
  readonly id: ProductionLaunchEvidenceBundleId;
  readonly area: string;
  readonly status: ProductionLaunchEvidenceStatus;
  readonly requiredEvidence: readonly string[];
  readonly sourceArtifacts: readonly string[];
  readonly gapIds: readonly string[];
}

export interface ProductionLaunchEvidenceRuntimeReadinessInput {
  readonly approvalStatus: ProductionLaunchApprovalStatus;
  readonly requiredBundles: readonly ProductionLaunchEvidenceBundle[];
  readonly productionChecklistBlockerCount: number;
  readonly verifierPassed: boolean;
  readonly ciBuildTestEvidenceVerified: boolean;
  readonly providerEvidenceVerified: boolean;
  readonly legalApprovalVerified: boolean;
  readonly rollbackEvidenceVerified: boolean;
  readonly explicitProductionApprovalCaptured: boolean;
}

export interface ProductionLaunchEvidenceRuntimeReadinessPlan {
  readonly status: "ready" | "blocked";
  readonly missingBundles: readonly string[];
  readonly incompleteBundles: readonly string[];
  readonly unsafeEvidenceFields: readonly string[];
  readonly requiredCommands: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly blockers: readonly string[];
}

const requiredProductionLaunchBundleIds: readonly ProductionLaunchEvidenceBundleId[] = [
  "ci-build-test",
  "database-ops",
  "provider-and-secret-readiness",
  "security-privacy-trust",
  "accessibility-seo-performance",
  "mobile-release",
  "legal-approval",
  "rollback-and-operations",
];

const unsafeProductionLaunchEvidencePatterns = [
  /postgres(?:ql)?:\/\/[^"<>\s]+/i,
  /sk_live_[A-Za-z0-9]+/,
  /sk_test_[A-Za-z0-9]+/,
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/,
  /\b\d{3}-\d{2}-\d{4}\b/,
];

function containsUnsafeProductionLaunchEvidence(value: string): boolean {
  return unsafeProductionLaunchEvidencePatterns.some((pattern) => pattern.test(value));
}

export function buildProductionLaunchEvidenceRuntimeReadinessPlan(
  input: ProductionLaunchEvidenceRuntimeReadinessInput,
): ProductionLaunchEvidenceRuntimeReadinessPlan {
  const bundleById = new Map(input.requiredBundles.map((bundle) => [bundle.id, bundle]));
  const missingBundles = requiredProductionLaunchBundleIds.filter((bundleId) => !bundleById.has(bundleId));
  const incompleteBundles: string[] = [];
  const unsafeEvidenceFields: string[] = [];

  for (const bundleId of requiredProductionLaunchBundleIds) {
    const bundle = bundleById.get(bundleId);
    if (!bundle) continue;

    if (bundle.status !== "verified_redacted") {
      incompleteBundles.push(bundleId);
    }
    if (bundle.requiredEvidence.length < 3) {
      incompleteBundles.push(`${bundleId}:requiredEvidence`);
    }
    if (bundle.sourceArtifacts.length < 1) {
      incompleteBundles.push(`${bundleId}:sourceArtifacts`);
    }
    if (bundle.gapIds.length < 1) {
      incompleteBundles.push(`${bundleId}:gapIds`);
    }

    const evidenceValues = [bundle.area, ...bundle.requiredEvidence, ...bundle.sourceArtifacts, ...bundle.gapIds];
    evidenceValues.forEach((value, index) => {
      if (containsUnsafeProductionLaunchEvidence(value)) {
        unsafeEvidenceFields.push(`${bundleId}:${index}`);
      }
    });
  }

  const allBundlesVerified = missingBundles.length === 0 && incompleteBundles.length === 0 && unsafeEvidenceFields.length === 0;
  const blockers: string[] = [];
  if (missingBundles.length > 0) {
    blockers.push("Production launch evidence must include all required launch bundles.");
  }
  if (incompleteBundles.length > 0) {
    blockers.push("Every production launch evidence bundle must be verified_redacted with required evidence, source artifacts, and gap ids.");
  }
  if (unsafeEvidenceFields.length > 0) {
    blockers.push("Production launch evidence must not contain secrets, private keys, database URLs, PII, or payment payloads.");
  }
  if (input.approvalStatus !== "blocked" && !allBundlesVerified) {
    blockers.push("Production launch approval must remain blocked until every evidence bundle is verified.");
  }
  if (input.productionChecklistBlockerCount < 8) {
    blockers.push("Production launch checklist must retain all production-blocking launch categories.");
  }
  if (!input.verifierPassed) {
    blockers.push("pnpm deploy:verify-launch-evidence must pass.");
  }
  if (!input.ciBuildTestEvidenceVerified) {
    blockers.push("CI, build, test, and smoke evidence must be verified.");
  }
  if (!input.providerEvidenceVerified) {
    blockers.push("Provider, secret, database, mobile, and sandbox evidence must be verified.");
  }
  if (!input.legalApprovalVerified) {
    blockers.push("Legal approval evidence must be verified before production approval.");
  }
  if (!input.rollbackEvidenceVerified) {
    blockers.push("Rollback and operations evidence must be verified before production approval.");
  }
  if (allBundlesVerified && input.approvalStatus !== "approved_redacted") {
    blockers.push("Explicit production approval must be captured after all evidence bundles are verified.");
  }
  if (!input.explicitProductionApprovalCaptured) {
    blockers.push("Explicit production approval record must be captured as a redacted label.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingBundles,
    incompleteBundles,
    unsafeEvidenceFields,
    requiredCommands: [
      "pnpm deploy:verify-launch-evidence",
      "pnpm quality:all",
      "pnpm test:unit",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm deploy:verify-database-ops",
      "pnpm deploy:verify-provider-envs",
      "pnpm deploy:verify-secrets",
      "pnpm deploy:verify-mobile",
      "production rollback drill",
    ],
    requiredEvidence: [
      "CI install, typecheck, lint, unit, E2E/smoke, web build, and dashboard build artifacts.",
      "Database migration, seed, backup/restore, tenant-isolation, provider, and secret evidence.",
      "Security/privacy, accessibility, SEO, performance, and provider sandbox evidence.",
      "Mobile build, device QA, push, crash, OTA rollback, and store-readiness evidence.",
      "Legal approval labels for privacy, terms, consent, SMS, deposit, refund, and medical copy.",
      "Rollback drill evidence for web, dashboard, mobile OTA, database restore, and incident owner coverage.",
      "Explicit redacted production approval record after every bundle is verified.",
    ],
    blockers,
  };
}

export type LaunchOperationEvidenceStatus = "not_configured" | "not_run" | "configured_redacted" | "passed_redacted" | "blocked_redacted";
export type LaunchOperationCheckId =
  | "on-call-coverage"
  | "alert-routing"
  | "support-escalation"
  | "privacy-request-drill"
  | "incident-drill"
  | "rollback-drill"
  | "production-monitoring"
  | "communications-templates";

export interface LaunchOperationsOwnerModel {
  readonly incidentCommander: string;
  readonly privacyOwner: string;
  readonly supportOwner: string;
  readonly releaseOwner: string;
  readonly securityOwner: string;
  readonly requiresNamedPrimaryAndBackup: boolean;
}

export interface LaunchOperationCheckEvidence {
  readonly id: LaunchOperationCheckId;
  readonly area: string;
  readonly status: LaunchOperationEvidenceStatus;
  readonly requiredBeforeProduction: boolean;
  readonly sla: string;
  readonly requiredEvidence: readonly string[];
}

export interface LaunchOperationsRuntimeReadinessInput {
  readonly approvalStatus: "blocked" | "approved_redacted";
  readonly ownerModel: LaunchOperationsOwnerModel;
  readonly operationChecks: readonly LaunchOperationCheckEvidence[];
  readonly verifierPassed: boolean;
  readonly alertTestPassed: boolean;
  readonly incidentDrillPassed: boolean;
  readonly rollbackDrillPassed: boolean;
  readonly privacyRequestDrillPassed: boolean;
  readonly supportEscalationDrillPassed: boolean;
  readonly monitoringDashboardVerified: boolean;
  readonly communicationsTemplatesApproved: boolean;
}

export interface LaunchOperationsRuntimeReadinessPlan {
  readonly status: "ready" | "blocked";
  readonly missingChecks: readonly string[];
  readonly incompleteChecks: readonly string[];
  readonly unassignedOwnerFields: readonly string[];
  readonly unsafeEvidenceFields: readonly string[];
  readonly requiredCommands: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly blockers: readonly string[];
}

const requiredLaunchOperationCheckIds: readonly LaunchOperationCheckId[] = [
  "on-call-coverage",
  "alert-routing",
  "support-escalation",
  "privacy-request-drill",
  "incident-drill",
  "rollback-drill",
  "production-monitoring",
  "communications-templates",
];
const launchOperationsOwnerFields = [
  "incidentCommander",
  "privacyOwner",
  "supportOwner",
  "releaseOwner",
  "securityOwner",
] as const;
const unsafeLaunchOperationsEvidencePatterns = [
  /https:\/\/hooks\.slack\.com\/services\//i,
  /xox[baprs]-[A-Za-z0-9-]+/,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b\d{3}[-.) ]?\d{3}[-. ]?\d{4}\b/,
  /\b\d{3}-\d{2}-\d{4}\b/,
];

function containsUnsafeLaunchOperationsEvidence(value: string): boolean {
  return unsafeLaunchOperationsEvidencePatterns.some((pattern) => pattern.test(value));
}

export function buildLaunchOperationsRuntimeReadinessPlan(
  input: LaunchOperationsRuntimeReadinessInput,
): LaunchOperationsRuntimeReadinessPlan {
  const checkById = new Map(input.operationChecks.map((check) => [check.id, check]));
  const missingChecks = requiredLaunchOperationCheckIds.filter((id) => !checkById.has(id));
  const incompleteChecks: string[] = [];
  const unsafeEvidenceFields: string[] = [];
  const unassignedOwnerFields = launchOperationsOwnerFields.filter((field) => {
    const value = input.ownerModel[field].trim().toLowerCase();
    return value.length === 0 || value === "unassigned";
  });

  for (const checkId of requiredLaunchOperationCheckIds) {
    const check = checkById.get(checkId);
    if (!check) continue;

    if (check.requiredBeforeProduction !== true) {
      incompleteChecks.push(`${checkId}:requiredBeforeProduction`);
    }
    if (check.status !== "configured_redacted" && check.status !== "passed_redacted") {
      incompleteChecks.push(checkId);
    }
    if (check.sla.trim().length < 12) {
      incompleteChecks.push(`${checkId}:sla`);
    }
    if (check.requiredEvidence.length < 2) {
      incompleteChecks.push(`${checkId}:requiredEvidence`);
    }

    const evidenceValues = [check.area, check.sla, ...check.requiredEvidence];
    evidenceValues.forEach((value, index) => {
      if (containsUnsafeLaunchOperationsEvidence(value)) {
        unsafeEvidenceFields.push(`${checkId}:${index}`);
      }
    });
  }

  const ownerValues = launchOperationsOwnerFields.map((field) => input.ownerModel[field]);
  ownerValues.forEach((value, index) => {
    if (containsUnsafeLaunchOperationsEvidence(value)) {
      unsafeEvidenceFields.push(`ownerModel:${index}`);
    }
  });

  const allChecksReady = missingChecks.length === 0 && incompleteChecks.length === 0 && unsafeEvidenceFields.length === 0 && unassignedOwnerFields.length === 0;
  const blockers: string[] = [];
  if (missingChecks.length > 0) {
    blockers.push("Launch operations evidence must include every required operations check.");
  }
  if (incompleteChecks.length > 0) {
    blockers.push("Launch operations checks must be configured or passed with redacted evidence, SLAs, and production-required flags.");
  }
  if (unassignedOwnerFields.length > 0 || !input.ownerModel.requiresNamedPrimaryAndBackup) {
    blockers.push("Launch operations must have named primary and backup ownership for incident, privacy, support, release, and security.");
  }
  if (unsafeEvidenceFields.length > 0) {
    blockers.push("Launch operations evidence must not contain private contact details, alert webhooks, PII, medical notes, or raw support transcripts.");
  }
  if (input.approvalStatus !== "blocked" && !allChecksReady) {
    blockers.push("Launch operations approval must remain blocked until all checks and owners are ready.");
  }
  if (!input.verifierPassed) {
    blockers.push("pnpm deploy:verify-ops must pass.");
  }
  if (!input.alertTestPassed) {
    blockers.push("Alert routing test must prove critical alerts reach the on-call owner.");
  }
  if (!input.incidentDrillPassed) {
    blockers.push("Incident drill must prove severity classification, communications, and postmortem workflow.");
  }
  if (!input.rollbackDrillPassed) {
    blockers.push("Rollback drill must cover web, dashboard, mobile OTA, and database restore or forward-fix.");
  }
  if (!input.privacyRequestDrillPassed) {
    blockers.push("Privacy export/delete drill must prove identity verification, audit log, and SLA handling.");
  }
  if (!input.supportEscalationDrillPassed) {
    blockers.push("Support escalation drill must prove acknowledgement SLA and privacy-safe escalation template.");
  }
  if (!input.monitoringDashboardVerified) {
    blockers.push("Production monitoring dashboard, uptime, Sentry, and release-health evidence must be verified.");
  }
  if (!input.communicationsTemplatesApproved) {
    blockers.push("Incident, maintenance, and privacy response templates must be approved before launch.");
  }
  if (allChecksReady && input.approvalStatus !== "approved_redacted") {
    blockers.push("Launch operations approval must be captured after all operations checks are ready.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingChecks,
    incompleteChecks,
    unassignedOwnerFields,
    unsafeEvidenceFields,
    requiredCommands: [
      "pnpm deploy:verify-ops",
      "alert routing test",
      "incident drill",
      "rollback drill",
      "privacy export/delete drill",
      "support escalation drill",
      "production monitoring dashboard review",
      "communications template approval",
    ],
    requiredEvidence: [
      "Named primary and backup owners for incident, privacy, support, release, and security operations.",
      "Alert routing test proving critical alerts reach the on-call owner within SLA.",
      "Incident drill notes with severity classification, tenant-safe communications, and postmortem template.",
      "Rollback drill labels for web, dashboard, mobile OTA, and database restore or forward-fix.",
      "Privacy request export/delete drill with identity verification and audit log labels.",
      "Support escalation transcript label with privacy-safe redaction and acknowledgement SLA.",
      "Production monitoring dashboard, uptime check, Sentry alert, and release-health proof.",
      "Approved incident, maintenance, and privacy communications templates.",
    ],
    blockers,
  };
}

export interface DeploymentLaunchEvidenceInput {
  readonly packageScripts: Readonly<Record<string, string>>;
  readonly deploymentTestsPassed: boolean;
  readonly deploymentTypecheckPassed: boolean;
  readonly vercelProjectsConfigured: boolean;
  readonly githubEnvironmentsConfigured: boolean;
  readonly secretsConfiguredAndRedacted: boolean;
  readonly previewDeploymentPassed: boolean;
  readonly productionDryRunPassed: boolean;
  readonly productionApprovalGateVerified: boolean;
  readonly strictEnvironmentCheckPassed: boolean;
  readonly databaseMigrationDryRunPassed: boolean;
  readonly backupRestoreDrillPassed: boolean;
  readonly storageProviderConfigured: boolean;
  readonly easProjectConfigured: boolean;
  readonly easPreviewBuildPassed: boolean;
  readonly nativeCredentialsConfigured: boolean;
  readonly otaRollbackTestPassed: boolean;
  readonly ciDeploymentGatePassed: boolean;
  readonly sentryReleaseUploadVerified: boolean;
  readonly deploymentRollbackTestPassed: boolean;
  readonly launchEvidencePacketCaptured: boolean;
  readonly providerArtifactsSecretSafe: boolean;
}

export interface DeploymentLaunchEvidencePlan {
  readonly status: "ready" | "blocked";
  readonly missingScripts: readonly string[];
  readonly requiredCommands: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly blockers: readonly string[];
}

export function buildDeploymentLaunchEvidencePlan(input: DeploymentLaunchEvidenceInput): DeploymentLaunchEvidencePlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/deployment package script is missing ${script}.`);
  if (!input.deploymentTestsPassed) blockers.push("@inkroute/deployment tests must pass before deployment launch evidence is ready.");
  if (!input.deploymentTypecheckPassed) blockers.push("@inkroute/deployment typecheck must pass before deployment launch evidence is ready.");
  if (!input.vercelProjectsConfigured) blockers.push("Vercel web and dashboard projects must be configured with redacted project evidence.");
  if (!input.githubEnvironmentsConfigured) blockers.push("GitHub preview, staging, and production environments must be configured.");
  if (!input.secretsConfiguredAndRedacted) blockers.push("Deployment secrets must be configured and proven redacted in evidence.");
  if (!input.previewDeploymentPassed) blockers.push("Preview deployment must pass for web and dashboard.");
  if (!input.productionDryRunPassed) blockers.push("Production deployment dry run must pass without mutating production.");
  if (!input.productionApprovalGateVerified) blockers.push("Production deployment must be protected by verified approval gates.");
  if (!input.strictEnvironmentCheckPassed) blockers.push("Strict environment verification must pass for preview and production.");
  if (!input.databaseMigrationDryRunPassed) blockers.push("Database migration dry run must pass against the managed provider.");
  if (!input.backupRestoreDrillPassed) blockers.push("Backup/restore drill must pass before launch.");
  if (!input.storageProviderConfigured) blockers.push("Storage provider and bucket policies must be configured with redacted evidence.");
  if (!input.easProjectConfigured) blockers.push("EAS mobile project must be configured.");
  if (!input.easPreviewBuildPassed) blockers.push("EAS preview build must pass.");
  if (!input.nativeCredentialsConfigured) blockers.push("Mobile native credentials must be configured with redacted evidence.");
  if (!input.otaRollbackTestPassed) blockers.push("Mobile OTA rollback test must pass.");
  if (!input.ciDeploymentGatePassed) blockers.push("CI deployment gate must pass before deployment launch evidence is ready.");
  if (!input.sentryReleaseUploadVerified) blockers.push("Sentry release/source-map upload must be verified.");
  if (!input.deploymentRollbackTestPassed) blockers.push("Deployment rollback test must pass for web, dashboard, mobile OTA, and database recovery path.");
  if (!input.launchEvidencePacketCaptured) blockers.push("Launch evidence packet must be captured.");
  if (!input.providerArtifactsSecretSafe) blockers.push("Provider artifacts must be redacted and free of secrets, tokens, raw PII, medical, or payment data.");

  if (!input.vercelProjectsConfigured || !input.previewDeploymentPassed || !input.productionDryRunPassed) {
    requiredEvidence.push("Vercel web/dashboard project, preview deployment, and production dry-run evidence");
  }
  if (!input.githubEnvironmentsConfigured || !input.productionApprovalGateVerified || !input.ciDeploymentGatePassed) {
    requiredEvidence.push("GitHub protected environment, approval gate, and CI deployment gate evidence");
  }
  if (!input.secretsConfiguredAndRedacted || !input.strictEnvironmentCheckPassed || !input.providerArtifactsSecretSafe) {
    requiredEvidence.push("strict environment, secret redaction, and provider artifact safety evidence");
  }
  if (!input.databaseMigrationDryRunPassed || !input.backupRestoreDrillPassed || !input.storageProviderConfigured) {
    requiredEvidence.push("managed database migration dry-run, backup/restore, and storage provider evidence");
  }
  if (!input.easProjectConfigured || !input.easPreviewBuildPassed || !input.nativeCredentialsConfigured || !input.otaRollbackTestPassed) {
    requiredEvidence.push("EAS project, preview build, native credential, and OTA rollback evidence");
  }
  if (!input.sentryReleaseUploadVerified || !input.deploymentRollbackTestPassed || !input.launchEvidencePacketCaptured) {
    requiredEvidence.push("Sentry release upload, rollback test, and launch evidence packet");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/deployment typecheck",
      "pnpm --filter @inkroute/deployment test",
      "pnpm deploy:verify-provider-envs",
      "pnpm deploy:verify-secrets",
      "pnpm deploy:verify-database-ops",
      "pnpm deploy:verify-mobile",
      "Vercel preview deployment smoke",
      "production deployment dry run",
      "EAS preview build",
      "mobile OTA rollback test",
      "deployment rollback drill",
      "GitHub protected environment approval proof",
      "Sentry release/source-map upload proof",
      "pnpm deploy:verify-launch-evidence",
    ],
    requiredEvidence,
    blockers,
  };
}
