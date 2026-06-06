export type ReleaseChannel = "development" | "preview" | "staging" | "production" | "mobile-preview" | "mobile-production";
export type ReleaseSurface = "web" | "dashboard" | "mobile" | "database" | "worker" | "provider";
export type ReleaseStatus = "draft" | "candidate" | "approved" | "blocked" | "deployed" | "rolled_back";
export type ReleaseRiskLevel = "low" | "medium" | "high" | "critical";
export type ReleaseGateStatus = "pass" | "warn" | "block" | "not_run";
export type MigrationRisk = "none" | "expand_only" | "contract" | "destructive";
export type UpdateCompatibility = "safe" | "requires_store_build" | "requires_manual_review" | "blocked";
export type FeatureFlagScope = "global" | "tenant" | "artist" | "role" | "environment";
export type FeatureFlagEvaluationReason = "explicit_override" | "kill_switch" | "tenant_allowlist" | "role_allowlist" | "percentage_rollout" | "default_value" | "environment_disabled";

export interface ReleaseArtifact {
  readonly surface: ReleaseSurface;
  readonly name: string;
  readonly version: string;
  readonly commitSha: string;
  readonly buildUrl?: string;
  readonly checksum?: string;
}

export interface MigrationChange {
  readonly id: string;
  readonly description: string;
  readonly risk: MigrationRisk;
  readonly backwardCompatible: boolean;
  readonly requiresBackup: boolean;
  readonly requiresManualApproval: boolean;
}

export interface ReleaseGate {
  readonly id: string;
  readonly label: string;
  readonly status: ReleaseGateStatus;
  readonly blocksProduction: boolean;
  readonly evidence: string;
  readonly nextAction: string;
}

export interface ReleaseCandidateInput {
  readonly version: string;
  readonly channel: ReleaseChannel;
  readonly surfaces: readonly ReleaseSurface[];
  readonly commitSha: string;
  readonly releaseNotes: readonly string[];
  readonly artifacts?: readonly ReleaseArtifact[];
  readonly migrations?: readonly MigrationChange[];
  readonly gates?: readonly ReleaseGate[];
  readonly createdBy: string;
  readonly createdAt: string;
}

export interface ReleaseCandidate {
  readonly id: string;
  readonly version: string;
  readonly channel: ReleaseChannel;
  readonly status: ReleaseStatus;
  readonly surfaces: readonly ReleaseSurface[];
  readonly commitSha: string;
  readonly releaseNotes: readonly string[];
  readonly artifacts: readonly ReleaseArtifact[];
  readonly migrations: readonly MigrationChange[];
  readonly gates: readonly ReleaseGate[];
  readonly risk: ReleaseRiskLevel;
  readonly productionBlocked: boolean;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly summary: string;
}

export interface FeatureFlagDefinition {
  readonly key: string;
  readonly description: string;
  readonly scope: FeatureFlagScope;
  readonly defaultEnabled: boolean;
  readonly owner: string;
  readonly environments: readonly ReleaseChannel[];
  readonly tenantAllowlist?: readonly string[];
  readonly roleAllowlist?: readonly string[];
  readonly rolloutPercentage?: number;
  readonly killSwitch?: boolean;
  readonly expiresAt?: string;
  readonly auditNote: string;
}

export interface FeatureFlagContext {
  readonly tenantId: string;
  readonly role: string;
  readonly environment: ReleaseChannel;
  readonly stableIdentifier: string;
}

export interface FeatureFlagDecision {
  readonly key: string;
  readonly enabled: boolean;
  readonly reason: FeatureFlagEvaluationReason;
  readonly scope: FeatureFlagScope;
  readonly auditNote: string;
}

export interface MobileUpdateInput {
  readonly channel: "preview" | "production";
  readonly runtimeVersion: string;
  readonly nativeRuntimeVersion: string;
  readonly changes: readonly string[];
  readonly nativeCapabilitiesChanged: boolean;
  readonly permissionsChanged: boolean;
  readonly expoProjectConfigured: boolean;
}

export interface MobileUpdatePlan {
  readonly channel: "preview" | "production";
  readonly runtimeVersion: string;
  readonly compatibility: UpdateCompatibility;
  readonly commandPreview: string;
  readonly gates: readonly ReleaseGate[];
  readonly rollbackPlan: string;
  readonly notes: readonly string[];
}

export interface RollbackPlan {
  readonly releaseId: string;
  readonly web: string;
  readonly dashboard: string;
  readonly mobile: string;
  readonly database: string;
  readonly featureFlags: readonly string[];
  readonly communications: readonly string[];
  readonly requiresIncidentReview: boolean;
}

export interface ReleaseHealthCheck {
  readonly id: string;
  readonly label: string;
  readonly status: ReleaseGateStatus;
  readonly detail: string;
  readonly remediation: string;
}

export interface ReleaseAuditDraft {
  readonly actorId: string;
  readonly releaseId: string;
  readonly action: "create_release" | "approve_release" | "rollback_release" | "toggle_feature_flag" | "publish_mobile_update";
  readonly tenantId?: string;
  readonly redactedPayload: Record<string, string | number | boolean | readonly string[]>;
  readonly createdAt: string;
}

export interface GithubReleaseWorkflowPlan {
  readonly workflowName: string;
  readonly triggers: readonly string[];
  readonly requiredSecrets: readonly string[];
  readonly requiredChecks: readonly string[];
  readonly concurrencyGroup: string;
  readonly environments: readonly string[];
  readonly deploymentGatedSteps: readonly string[];
}

const releasePriority: Record<ReleaseRiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const riskByMigration: Record<MigrationRisk, ReleaseRiskLevel> = {
  none: "low",
  expand_only: "medium",
  contract: "high",
  destructive: "critical",
};

function highestRisk(risks: readonly ReleaseRiskLevel[]): ReleaseRiskLevel {
  return risks.reduce<ReleaseRiskLevel>((current, next) => (releasePriority[next] > releasePriority[current] ? next : current), "low");
}

function stableHash(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 10000;
  }
  return hash;
}

function normalizePercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildReleaseGate(input: ReleaseGate): ReleaseGate {
  return input;
}

export function assessMigrationCompatibility(changes: readonly MigrationChange[]): ReleaseGate {
  if (changes.length === 0) {
    return {
      id: "migration-none",
      label: "Database migration compatibility",
      status: "pass",
      blocksProduction: false,
      evidence: "No migrations included in this release candidate.",
      nextAction: "Keep release record attached to the current migration version.",
    };
  }

  const destructive = changes.filter((change) => change.risk === "destructive" || change.requiresBackup || change.requiresManualApproval);
  const incompatible = changes.filter((change) => !change.backwardCompatible);

  if (destructive.length > 0) {
    return {
      id: "migration-destructive-review",
      label: "Database migration compatibility",
      status: "block",
      blocksProduction: true,
      evidence: `${destructive.length} destructive/manual-approval migration change(s) detected.`,
      nextAction: "Run staging migration against a production-like backup, document rollback, and require explicit production approval.",
    };
  }

  if (incompatible.length > 0) {
    return {
      id: "migration-contract-review",
      label: "Database migration compatibility",
      status: "warn",
      blocksProduction: true,
      evidence: `${incompatible.length} non-backward-compatible migration change(s) detected.`,
      nextAction: "Split migration into expand/migrate/contract steps or prove blue-green compatibility before production deploy.",
    };
  }

  return {
    id: "migration-expand-only",
    label: "Database migration compatibility",
    status: "pass",
    blocksProduction: false,
    evidence: `${changes.length} backward-compatible migration change(s) detected.`,
    nextAction: "Run migration in staging and confirm old and new app versions can read the schema during deploy window.",
  };
}

export function createReleaseCandidate(input: ReleaseCandidateInput): ReleaseCandidate {
  const migrations = input.migrations ?? [];
  const suppliedGates = input.gates ?? [];
  const migrationGate = assessMigrationCompatibility(migrations);
  const gates = [...suppliedGates, migrationGate];
  const gateRisks = gates.map((gate): ReleaseRiskLevel => {
    if (gate.status === "block") return "high";
    if (gate.status === "warn") return "medium";
    if (gate.status === "not_run") return "medium";
    return "low";
  });
  const migrationRisks = migrations.map((change) => riskByMigration[change.risk]);
  const risk = highestRisk([...gateRisks, ...migrationRisks]);
  const productionBlocked = gates.some((gate) => gate.blocksProduction && gate.status !== "pass");
  const status: ReleaseStatus = productionBlocked ? "blocked" : "candidate";

  return {
    id: `rel_${input.version.replace(/[^a-zA-Z0-9]/g, "_")}_${input.channel}`,
    version: input.version,
    channel: input.channel,
    status,
    surfaces: input.surfaces,
    commitSha: input.commitSha,
    releaseNotes: input.releaseNotes,
    artifacts: input.artifacts ?? [],
    migrations,
    gates,
    risk,
    productionBlocked,
    createdBy: input.createdBy,
    createdAt: input.createdAt,
    summary: `${input.version} targets ${input.channel} for ${input.surfaces.join(", ")} with ${risk} release risk.`,
  };
}

export function evaluateFeatureFlag(flag: FeatureFlagDefinition, context: FeatureFlagContext): FeatureFlagDecision {
  if (!flag.environments.includes(context.environment)) {
    return { key: flag.key, enabled: false, reason: "environment_disabled", scope: flag.scope, auditNote: flag.auditNote };
  }
  if (flag.killSwitch) {
    return { key: flag.key, enabled: false, reason: "kill_switch", scope: flag.scope, auditNote: flag.auditNote };
  }
  if (flag.tenantAllowlist?.includes(context.tenantId)) {
    return { key: flag.key, enabled: true, reason: "tenant_allowlist", scope: flag.scope, auditNote: flag.auditNote };
  }
  if (flag.roleAllowlist?.includes(context.role)) {
    return { key: flag.key, enabled: true, reason: "role_allowlist", scope: flag.scope, auditNote: flag.auditNote };
  }
  if (typeof flag.rolloutPercentage === "number") {
    const bucket = stableHash(`${flag.key}:${context.stableIdentifier}`) % 100;
    return {
      key: flag.key,
      enabled: bucket < normalizePercentage(flag.rolloutPercentage),
      reason: "percentage_rollout",
      scope: flag.scope,
      auditNote: flag.auditNote,
    };
  }
  return { key: flag.key, enabled: flag.defaultEnabled, reason: "default_value", scope: flag.scope, auditNote: flag.auditNote };
}

export function evaluateFeatureFlags(flags: readonly FeatureFlagDefinition[], context: FeatureFlagContext): readonly FeatureFlagDecision[] {
  return flags.map((flag) => evaluateFeatureFlag(flag, context));
}

export function createReleaseNotes(candidate: ReleaseCandidate): string {
  const notes = candidate.releaseNotes.map((note) => `- ${note}`).join("\n");
  const gates = candidate.gates.map((gate) => `- ${gate.label}: ${gate.status} — ${gate.evidence}`).join("\n");
  return [`# ${candidate.version}`, "", candidate.summary, "", "## Changes", notes, "", "## Release gates", gates].join("\n");
}

export function classifyMobileUpdate(input: MobileUpdateInput): UpdateCompatibility {
  if (!input.expoProjectConfigured) return "blocked";
  if (input.nativeCapabilitiesChanged || input.permissionsChanged) return "requires_store_build";
  if (input.runtimeVersion !== input.nativeRuntimeVersion) return "requires_manual_review";
  return "safe";
}

export function buildMobileUpdatePlan(input: MobileUpdateInput): MobileUpdatePlan {
  const compatibility = classifyMobileUpdate(input);
  const gates: ReleaseGate[] = [
    {
      id: "eas-project-configured",
      label: "EAS project configured",
      status: input.expoProjectConfigured ? "pass" : "block",
      blocksProduction: true,
      evidence: input.expoProjectConfigured ? "Project id/update URL is expected to exist." : "No real EAS project configuration is present.",
      nextAction: input.expoProjectConfigured ? "Run preview update before production." : "Run eas update:configure and commit real project metadata without leaking secrets.",
    },
    {
      id: "runtime-compatible",
      label: "Runtime compatibility",
      status: compatibility === "safe" ? "pass" : compatibility === "blocked" ? "block" : "warn",
      blocksProduction: compatibility !== "safe",
      evidence: `Update classified as ${compatibility}.`,
      nextAction: compatibility === "safe" ? "Publish to preview channel and device-test before production." : "Create a new native build or complete runtime compatibility review before OTA.",
    },
  ];

  return {
    channel: input.channel,
    runtimeVersion: input.runtimeVersion,
    compatibility,
    commandPreview: `eas update --channel ${input.channel} --message \"${input.changes[0] ?? "InkRoute update"}\"`,
    gates,
    rollbackPlan: "Republish the previous compatible EAS update on the same channel after confirming runtime version compatibility.",
    notes: input.changes,
  };
}

export function createRollbackPlan(candidate: ReleaseCandidate, previousVersion: string): RollbackPlan {
  const flagActions = candidate.surfaces.includes("provider")
    ? ["Disable provider sends", "Disable risky feature flags", "Keep delivery/error logs for audit"]
    : ["Disable risky feature flags", "Record rollback audit event"];

  return {
    releaseId: candidate.id,
    web: candidate.surfaces.includes("web") ? `Redeploy previous web build ${previousVersion}.` : "No web rollback needed for this release.",
    dashboard: candidate.surfaces.includes("dashboard") ? `Redeploy previous dashboard build ${previousVersion}.` : "No dashboard rollback needed for this release.",
    mobile: candidate.surfaces.includes("mobile") ? "Republish previous compatible EAS update or submit fixed native build if runtime changed." : "No mobile rollback needed for this release.",
    database: candidate.migrations.length > 0 ? "Prefer forward-fix. Restore only from approved backup if catastrophic and data-loss plan is signed off." : "No database rollback needed for this release.",
    featureFlags: flagActions,
    communications: ["Post release status to internal channel", "Notify affected tenants if user-facing behavior changed", "Attach incident notes to release record"],
    requiresIncidentReview: candidate.risk === "high" || candidate.risk === "critical",
  };
}

export function buildGithubReleaseWorkflowPlan(): GithubReleaseWorkflowPlan {
  return {
    workflowName: "Release Governance",
    triggers: ["workflow_dispatch", "push to main", "tagged release candidates"],
    requiredSecrets: ["VERCEL_TOKEN", "VERCEL_ORG_ID", "VERCEL_PROJECT_ID", "EXPO_TOKEN", "DATABASE_URL"],
    requiredChecks: ["pnpm install --frozen-lockfile", "pnpm typecheck", "pnpm lint", "pnpm test", "Prisma migration dry run", "Next.js builds", "Expo preview build/update when mobile surface changed"],
    concurrencyGroup: "release-${{ github.ref }}",
    environments: ["preview", "staging", "production"],
    deploymentGatedSteps: ["Vercel preview/prod deploy", "Prisma migrate deploy", "EAS Update publish", "Sentry release/source-map upload", "Search Console sitemap submission"],
  };
}

export function buildReleaseHealthChecks(candidate: ReleaseCandidate): readonly ReleaseHealthCheck[] {
  return [
    {
      id: "dependencies-installed",
      label: "Dependencies installed",
      status: "not_run",
      detail: "This ChatGPT sandbox cannot run pnpm install or generate a lockfile.",
      remediation: "Run pnpm install in a real terminal and commit pnpm-lock.yaml before release automation is trusted.",
    },
    {
      id: "production-gates",
      label: "Production gates",
      status: candidate.productionBlocked ? "block" : "pass",
      detail: candidate.productionBlocked ? "At least one gate blocks production." : "No scaffolded gate blocks production.",
      remediation: candidate.productionBlocked ? "Resolve blocking gates and attach evidence to ReleaseRecord." : "Continue to preview release verification.",
    },
    {
      id: "rollback-plan",
      label: "Rollback plan",
      status: "warn",
      detail: "Rollback plans are generated as drafts only and have not been rehearsed in infrastructure.",
      remediation: "Run preview rollback drills for web/dashboard/mobile and database forward-fix scenarios.",
    },
  ];
}

export function buildReleaseAuditDraft(input: ReleaseAuditDraft): ReleaseAuditDraft {
  return input;
}

export const defaultFeatureFlags: readonly FeatureFlagDefinition[] = [
  {
    key: "booking.deposit_required",
    description: "Require approved booking requests to pay a deposit before appointment confirmation.",
    scope: "tenant",
    defaultEnabled: false,
    owner: "payments",
    environments: ["preview", "staging", "production"],
    tenantAllowlist: ["tenant_demo_nomad"],
    auditNote: "Do not enable until Stripe webhooks and legal copy are verified.",
  },
  {
    key: "nomad_mode.enabled",
    description: "Show travel schedule, city landing pages, and guest-spot availability controls.",
    scope: "tenant",
    defaultEnabled: true,
    owner: "calendar",
    environments: ["development", "preview", "staging", "production", "mobile-preview", "mobile-production"],
    auditNote: "Public changes must revalidate city pages and notify waitlists only with consent.",
  },
  {
    key: "sms_notifications.enabled",
    description: "Allow SMS notification worker to send appointment and waitlist messages.",
    scope: "tenant",
    defaultEnabled: false,
    owner: "notifications",
    environments: ["preview", "staging", "production"],
    rolloutPercentage: 5,
    auditNote: "Requires STOP/HELP handling, provider verification, and SMS legal review.",
  },
  {
    key: "mobile.ota_updates.enabled",
    description: "Allow EAS Update publishing to compatible mobile runtimes.",
    scope: "environment",
    defaultEnabled: false,
    owner: "mobile",
    environments: ["mobile-preview", "mobile-production"],
    auditNote: "Requires real EAS project configuration, native build, and rollback drill.",
  },
  {
    key: "ai_assistants.enabled",
    description: "Optional future AI-assisted captions, alt text, and intake summaries.",
    scope: "tenant",
    defaultEnabled: false,
    owner: "product",
    environments: ["development", "preview"],
    killSwitch: true,
    auditNote: "Placeholder only. Must remain off until product, privacy, and provider reviews are complete.",
  },
];

export const demoReleaseCandidate = createReleaseCandidate({
  version: "0.12.0-phase12",
  channel: "preview",
  surfaces: ["web", "dashboard", "mobile", "database"],
  commitSha: "phase12-demo-sha",
  releaseNotes: [
    "Adds release control-plane helpers and dashboard previews.",
    "Adds feature flag evaluation and kill-switch draft logic.",
    "Adds EAS Update compatibility and rollback planning boundaries.",
  ],
  migrations: [
    {
      id: "release-record-indexes",
      description: "Future index additions for release records and feature flags.",
      risk: "expand_only",
      backwardCompatible: true,
      requiresBackup: false,
      requiresManualApproval: false,
    },
  ],
  gates: [
    {
      id: "phase12-runtime-verification",
      label: "Runtime build verification",
      status: "not_run",
      blocksProduction: true,
      evidence: "ChatGPT environment cannot install dependencies or run app builds.",
      nextAction: "Run full monorepo install, typecheck, tests, and builds in local/CI environment.",
    },
  ],
  createdBy: "chatgpt-phase12-scaffold",
  createdAt: "2026-06-03T09:00:00-07:00",
});

export const demoMobileUpdatePlan = buildMobileUpdatePlan({
  channel: "preview",
  runtimeVersion: "1.0.0",
  nativeRuntimeVersion: "1.0.0",
  changes: ["Phase 12 mobile release status screen copy and update boundary preview"],
  nativeCapabilitiesChanged: false,
  permissionsChanged: false,
  expoProjectConfigured: false,
});

export const demoFeatureFlagDecisions = evaluateFeatureFlags(defaultFeatureFlags, {
  tenantId: "tenant_demo_nomad",
  role: "owner",
  environment: "preview",
  stableIdentifier: "tenant_demo_nomad:owner",
});

export const demoRollbackPlan = createRollbackPlan(demoReleaseCandidate, "0.11.0-phase11");
export const demoGithubWorkflowPlan = buildGithubReleaseWorkflowPlan();
export const demoReleaseHealthChecks = buildReleaseHealthChecks(demoReleaseCandidate);
export const demoReleaseNotesMarkdown = createReleaseNotes(demoReleaseCandidate);
