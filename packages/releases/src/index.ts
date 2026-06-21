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

export type ReleaseRuntimeCommand = string;

export const migrationRuntimeDryRunReadinessRequiredEvidence = [
  "Prisma schema, committed migration, and staging DATABASE_URL evidence",
  "Prisma validate, diff, migrate dry-run, and destructive SQL scan evidence",
  "backup, approval, expand/contract, forward-fix, and rollback evidence",
  "GitHub Actions migration dry-run artifact evidence",
] as const;
export type MigrationRuntimeDryRunReadinessRequiredEvidence = (typeof migrationRuntimeDryRunReadinessRequiredEvidence)[number];

export const releaseRuntimeVerificationRequiredEvidence = [
  "release package test/typecheck, web typecheck, and release-health route smoke evidence",
  "web, dashboard, and mobile build/typecheck evidence",
  "dashboard release and feature-flag route smoke evidence",
  "GitHub release-governance workflow dry-run/dispatch evidence",
  "CI artifact, log, and release evidence attachment",
] as const;
export type ReleaseRuntimeVerificationRequiredEvidence = (typeof releaseRuntimeVerificationRequiredEvidence)[number];

export const releasePersistenceRbacReadinessRequiredEvidence = [
  "dashboard static route test and dashboard typecheck evidence",
  "ReleaseRecord/FeatureFlag persistence, transaction, and audit-log evidence",
  "tenant-scoped RBAC, mismatch rejection, and membership lookup evidence",
  "provider credential gate, previous-state metadata, and optimistic concurrency evidence",
  "approval state machine, rendered dashboard workflow, orchestration hook, and DB-backed route evidence",
] as const;
export type ReleasePersistenceRbacReadinessRequiredEvidence = (typeof releasePersistenceRbacReadinessRequiredEvidence)[number];

export const cicdDeploymentAutomationReadinessRequiredEvidence = [
  "workflow source, no-secret-literal, and CI prerequisite evidence",
  "GitHub protected environment and secret configuration evidence",
  "preview, staging, production, and Vercel deployment job evidence",
  "Prisma, EAS, Sentry, and Search Console deployment gate evidence",
  "ReleaseRecord CI result write and live workflow dispatch evidence",
] as const;
export type CicdDeploymentAutomationReadinessRequiredEvidence = (typeof cicdDeploymentAutomationReadinessRequiredEvidence)[number];

export const featureFlagRuntimeIntegrationReadinessRequiredEvidence = [
  "release package, static runtime, dashboard typecheck, and mobile typecheck evidence",
  "DB-backed evaluation and dashboard/mobile/public runtime payload evidence",
  "cached resolver, real auth context, and invalidation/revalidation evidence",
  "provider kill-switch, rollout bucket, tenant-safe payload, and live rollout evidence",
] as const;
export type FeatureFlagRuntimeIntegrationReadinessRequiredEvidence = (typeof featureFlagRuntimeIntegrationReadinessRequiredEvidence)[number];

export const mobileOtaProductionEnablementRequiredEvidence = [
  "real Expo project/update URL, expo-updates, and runtimeVersion policy evidence",
  "preview/production EAS channel and native build evidence",
  "preview OTA publish, update ID, and device adoption evidence",
  "adoption monitoring, rollback republish drill, and release-health linkage evidence",
] as const;
export type MobileOtaProductionEnablementRequiredEvidence = (typeof mobileOtaProductionEnablementRequiredEvidence)[number];

export const releaseAutomatedTestReadinessRequiredEvidence = [
  "package helper, workflow, route, static surface, mobile static, and dashboard typecheck evidence",
  "Playwright dashboard release smoke and provider-backed route integration evidence",
  "Expo render and physical-device release/OTA evidence",
  "GitHub Actions workflow execution, real secrets/environments, and CI artifact evidence",
] as const;
export type ReleaseAutomatedTestReadinessRequiredEvidence = (typeof releaseAutomatedTestReadinessRequiredEvidence)[number];

export const releaseLaunchControlEvidenceRequiredEvidence = [
  "ReleaseRecord/FeatureFlag persistence, RBAC, tenant-scope, concurrency, and audit evidence",
  "protected environment, signed job, CI required-check, preview deploy, and production approval dry-run evidence",
  "migration gate and incident-linked rollback drill evidence",
  "EAS update governance, channel, runtime, adoption, and rollback evidence",
  "tenant rollout, kill-switch drill, and release-health envelope evidence",
  "provider-backed route, CI artifact, and secret-safe launch evidence",
] as const;
export type ReleaseLaunchControlEvidenceRequiredEvidence = (typeof releaseLaunchControlEvidenceRequiredEvidence)[number];

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

export interface ProviderRuntimeGate {
  readonly provider: "sms" | "payments" | "mobile-ota" | "ai-assistants";
  readonly flagKey: string;
  readonly enabled: boolean;
  readonly decisionReason: FeatureFlagEvaluationReason;
  readonly action: "allow" | "block";
  readonly runtimeBoundary: string;
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

export interface EasOtaReadinessInput {
  readonly expoProjectId?: string;
  readonly updateUrl?: string;
  readonly previewChannel?: string;
  readonly productionChannel?: string;
  readonly runtimeVersionPolicy: "appVersion" | "nativeVersion" | "fingerprint" | "unknown";
  readonly previewBuildUrl?: string;
  readonly productionBuildUrl?: string;
  readonly previewUpdateId?: string;
  readonly rollbackDrillId?: string;
  readonly adoptionMonitoringConfigured: boolean;
}

export interface EasOtaReadinessPlan {
  readonly status: "ready_for_preview" | "blocked";
  readonly productionReady: boolean;
  readonly gates: readonly ReleaseGate[];
  readonly requiredCommands: typeof easOtaReadinessRequiredCommands;
  readonly rollbackRequirement: string;
  readonly blockers: readonly string[];
}

export interface ExpoEasRuntimeEvidenceInput {
  readonly packageScripts: readonly string[];
  readonly releasesTestsPassed: boolean;
  readonly releasesTypecheckPassed: boolean;
  readonly mobileTypecheckPassed: boolean;
  readonly appJsonProjectIdMatches: boolean;
  readonly easJsonChannelsMatch: boolean;
  readonly credentialsConfigured: boolean;
  readonly easProjectIdConfigured: boolean;
  readonly updateUrlConfigured: boolean;
  readonly runtimeVersionPolicyConfigured: boolean;
  readonly previewChannelConfigured: boolean;
  readonly productionChannelConfigured: boolean;
  readonly previewNativeBuildPassed: boolean;
  readonly productionNativeBuildPassed: boolean;
  readonly previewOtaPublishVerified: boolean;
  readonly deviceReceivedPreviewUpdate: boolean;
  readonly rollbackRepublishVerified: boolean;
  readonly compatibilityCheckPassed: boolean;
  readonly adoptionMonitoringVerified: boolean;
  readonly releaseHealthMonitoringConfigured: boolean;
}

export interface ExpoEasRuntimeEvidencePlan {
  readonly status: "ready" | "blocked";
  readonly missingScripts: readonly string[];
  readonly gates: readonly ReleaseGate[];
  readonly requiredCommands: typeof expoEasRuntimeEvidenceRequiredCommands;
  readonly requiredEvidence: typeof expoEasRuntimeEvidenceRequiredEvidence;
  readonly blockers: readonly string[];
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

export interface MigrationCompatibilityEnforcementInput {
  readonly migrations: readonly MigrationChange[];
  readonly prismaSchemaPath: string;
  readonly migrationDirectory: string;
  readonly stagingDatabaseDryRun: boolean;
  readonly backupSnapshotAttached: boolean;
  readonly destructiveApprovalAttached: boolean;
  readonly expandContractPlanAttached: boolean;
  readonly forwardFixPlanAttached: boolean;
}

export interface MigrationCompatibilityEnforcementPlan {
  readonly classification: MigrationRisk;
  readonly productionBlocked: boolean;
  readonly gates: readonly ReleaseGate[];
  readonly requiredCommands: ReturnType<typeof buildMigrationCompatibilityRequiredCommands>;
  readonly policy: readonly string[];
}

export interface ReleaseControlPlaneReadinessInput {
  packageScripts: readonly string[];
  packageTestsPassed: boolean;
  packageTypecheckPassed: boolean;
  releaseRecordPersistenceConfigured: boolean;
  featureFlagPersistenceConfigured: boolean;
  rbacEnforced: boolean;
  tenantScopedReadsVerified: boolean;
  tenantScopedMutationsVerified: boolean;
  auditLogPersistenceConfigured: boolean;
  optimisticConcurrencyConfigured: boolean;
  protectedGithubEnvironmentsConfigured: boolean;
  signedDeploymentJobsConfigured: boolean;
  ciRequiredChecksConfigured: boolean;
  previewDeploymentJobConfigured: boolean;
  productionDeploymentJobConfigured: boolean;
  migrationGatesConfigured: boolean;
  rollbackWorkflowRehearsed: boolean;
  incidentLinkageConfigured: boolean;
  easUpdateGovernanceConfigured: boolean;
  rolloutControlsConfigured: boolean;
  killSwitchesVerified: boolean;
  releaseHealthRouteVerified: boolean;
}

export interface ReleaseControlPlaneReadinessPlan {
  readonly status: "ready" | "blocked";
  readonly missingScripts: readonly string[];
  readonly requiredCommands: typeof releaseControlPlaneReadinessRequiredCommands;
  readonly requiredEvidence: typeof releaseControlPlaneReadinessRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface ReleaseRuntimeVerificationInput {
  readonly packageScripts: readonly string[];
  readonly releasesTestsPassed: boolean;
  readonly releasesTypecheckPassed: boolean;
  readonly webTypecheckPassed: boolean;
  readonly releaseHealthRouteTestsPassed: boolean;
  readonly webBuildPassed: boolean;
  readonly dashboardBuildPassed: boolean;
  readonly mobileBuildOrTypecheckPassed: boolean;
  readonly dashboardReleaseRouteSmokePassed: boolean;
  readonly dashboardFeatureFlagRouteSmokePassed: boolean;
  readonly releaseGovernanceWorkflowDryRunPassed: boolean;
  readonly githubActionsWorkflowEvidenceCaptured: boolean;
  readonly ciArtifactsAttached: boolean;
}

export interface ReleaseRuntimeVerificationPlan {
  readonly status: "ready" | "blocked";
  readonly missingScripts: readonly string[];
  readonly requiredCommands: typeof releaseRuntimeVerificationRequiredCommands;
  readonly requiredEvidence: readonly ReleaseRuntimeVerificationRequiredEvidence[];
  readonly blockers: readonly string[];
}

export interface ReleasePersistenceRbacReadinessInput {
  readonly packageScripts: readonly string[];
  readonly dashboardStaticRouteTestsPassed: boolean;
  readonly dashboardTypecheckPassed: boolean;
  readonly releaseRecordPersistenceConfigured: boolean;
  readonly featureFlagPersistenceConfigured: boolean;
  readonly tenantScopedRbacConfigured: boolean;
  readonly tenantMismatchRejectionVerified: boolean;
  readonly dbTransactionsConfigured: boolean;
  readonly auditLoggingConfigured: boolean;
  readonly providerCredentialGatesConfigured: boolean;
  readonly previousStateMetadataConfigured: boolean;
  readonly approvalStateMachineConfigured: boolean;
  readonly optimisticConcurrencyConfigured: boolean;
  readonly membershipLookupConfigured: boolean;
  readonly renderedDashboardWorkflowTestsPassed: boolean;
  readonly releaseWorkflowOrchestrationHooksConfigured: boolean;
  readonly dbBackedRuntimeRouteTestsPassed: boolean;
}

export interface ReleasePersistenceRbacReadinessPlan {
  readonly status: "ready" | "blocked";
  readonly missingScripts: readonly string[];
  readonly requiredCommands: typeof releasePersistenceRbacReadinessRequiredCommands;
  readonly requiredEvidence: readonly ReleasePersistenceRbacReadinessRequiredEvidence[];
  readonly blockers: readonly string[];
}

export interface CicdDeploymentAutomationReadinessInput {
  readonly packageScripts: readonly string[];
  readonly releasesTestsPassed: boolean;
  readonly releasesTypecheckPassed: boolean;
  readonly workflowSourceTestsPassed: boolean;
  readonly protectedGithubEnvironmentsConfigured: boolean;
  readonly githubSecretsConfigured: boolean;
  readonly previewDeployJobEnabled: boolean;
  readonly stagingDeployJobEnabled: boolean;
  readonly productionDeployJobEnabled: boolean;
  readonly vercelDeployConfigured: boolean;
  readonly prismaDryRunConfigured: boolean;
  readonly prismaMigrateDeployConfigured: boolean;
  readonly easUpdatePublishConfigured: boolean;
  readonly sentryArtifactUploadConfigured: boolean;
  readonly searchConsoleSubmissionConfigured: boolean;
  readonly ciPrerequisiteChecksRequired: boolean;
  readonly releaseRecordCiResultWritesConfigured: boolean;
  readonly noSecretLiteralsVerified: boolean;
  readonly liveWorkflowDispatchProofCaptured: boolean;
}

export interface CicdDeploymentAutomationReadinessPlan {
  readonly status: "ready" | "blocked";
  readonly missingScripts: readonly string[];
  readonly requiredCommands: typeof cicdDeploymentAutomationReadinessRequiredCommands;
  readonly requiredEvidence:
    | readonly CicdDeploymentAutomationReadinessRequiredEvidence[]
    | typeof cicdDeploymentAutomationReadinessRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface FeatureFlagRuntimeIntegrationReadinessInput {
  readonly packageScripts: readonly string[];
  readonly releasesTestsPassed: boolean;
  readonly releasesTypecheckPassed: boolean;
  readonly featureFlagStaticTestsPassed: boolean;
  readonly dashboardTypecheckPassed: boolean;
  readonly mobileTypecheckPassed: boolean;
  readonly dbBackedEvaluationConfigured: boolean;
  readonly dashboardRuntimeSurfaceWired: boolean;
  readonly mobileRuntimeSurfaceWired: boolean;
  readonly publicReleaseHealthPayloadWired: boolean;
  readonly cachedServerResolversConfigured: boolean;
  readonly realAuthContextDerivationConfigured: boolean;
  readonly providerWorkerKillSwitchEnforced: boolean;
  readonly invalidationRevalidationConfigured: boolean;
  readonly rolloutBucketTestsPassed: boolean;
  readonly tenantSafePublicPayloadVerified: boolean;
  readonly liveRolloutProofCaptured: boolean;
}

export interface FeatureFlagRuntimeIntegrationReadinessPlan {
  readonly status: "ready" | "blocked";
  readonly missingScripts: readonly string[];
  readonly requiredCommands: typeof featureFlagRuntimeIntegrationReadinessRequiredCommands;
  readonly requiredEvidence: readonly FeatureFlagRuntimeIntegrationReadinessRequiredEvidence[];
  readonly blockers: readonly string[];
}

export interface MobileOtaProductionEnablementInput {
  readonly packageScripts: readonly string[];
  readonly releasesTestsPassed: boolean;
  readonly releasesTypecheckPassed: boolean;
  readonly mobileStaticTestsPassed: boolean;
  readonly mobileTypecheckPassed: boolean;
  readonly realExpoProjectIdConfigured: boolean;
  readonly realUpdateUrlConfigured: boolean;
  readonly expoUpdatesConfigured: boolean;
  readonly runtimeVersionPolicyAppVersion: boolean;
  readonly previewChannelConfigured: boolean;
  readonly productionChannelConfigured: boolean;
  readonly previewNativeBuildPassed: boolean;
  readonly productionNativeBuildPassed: boolean;
  readonly previewUpdatePublished: boolean;
  readonly previewUpdateIdRecorded: boolean;
  readonly deviceAdoptionVerified: boolean;
  readonly adoptionMonitoringConfigured: boolean;
  readonly rollbackRepublishDrillPassed: boolean;
  readonly releaseHealthLinked: boolean;
}

export interface MobileOtaProductionEnablementPlan {
  readonly status: "ready" | "blocked";
  readonly missingScripts: readonly string[];
  readonly requiredCommands: typeof mobileOtaProductionEnablementRequiredCommands;
  readonly requiredEvidence: readonly MobileOtaProductionEnablementRequiredEvidence[];
  readonly blockers: readonly string[];
}

export interface MigrationRuntimeDryRunReadinessInput {
  readonly packageScripts: readonly string[];
  readonly releasesTestsPassed: boolean;
  readonly releasesTypecheckPassed: boolean;
  readonly workflowSourceTestsPassed: boolean;
  readonly prismaSchemaPresent: boolean;
  readonly prismaMigrationsGenerated: boolean;
  readonly stagingDatabaseUrlConfigured: boolean;
  readonly prismaValidatePassed: boolean;
  readonly prismaDiffDryRunPassed: boolean;
  readonly prismaMigrateDeployDryRunPassed: boolean;
  readonly destructiveSqlScanPassed: boolean;
  readonly backupSnapshotAttached: boolean;
  readonly destructiveApprovalAttached: boolean;
  readonly expandContractPlanAttached: boolean;
  readonly forwardFixPlanAttached: boolean;
  readonly rollbackEvidenceRecorded: boolean;
  readonly githubActionsDryRunPassed: boolean;
  readonly ciArtifactCaptured: boolean;
}

export interface MigrationRuntimeDryRunReadinessPlan {
  readonly status: "ready" | "blocked";
  readonly missingScripts: readonly string[];
  readonly requiredCommands: typeof migrationRuntimeDryRunReadinessRequiredCommands;
  readonly requiredEvidence: readonly MigrationRuntimeDryRunReadinessRequiredEvidence[];
  readonly blockers: readonly string[];
}

export interface ReleaseAutomatedTestReadinessInput {
  readonly packageScripts: readonly string[];
  readonly releasePackageTestsPassed: boolean;
  readonly releaseWorkflowTestsPassed: boolean;
  readonly releaseHealthRouteTestsPassed: boolean;
  readonly releaseAutomationStaticTestsPassed: boolean;
  readonly mobileStaticTestsPassed: boolean;
  readonly dashboardTypecheckPassed: boolean;
  readonly playwrightDashboardReleaseSmokePassed: boolean;
  readonly providerBackedRouteIntegrationTestsPassed: boolean;
  readonly expoRenderTestsPassed: boolean;
  readonly expoDeviceTestsPassed: boolean;
  readonly githubActionsWorkflowExecutionEvidenceCaptured: boolean;
  readonly realSecretsAndEnvironmentsConfigured: boolean;
  readonly ciArtifactsCaptured: boolean;
}

export interface ReleaseAutomatedTestReadinessPlan {
  readonly status: "ready" | "blocked";
  readonly missingScripts: readonly string[];
  readonly requiredCommands: typeof releaseAutomatedTestReadinessRequiredCommands;
  readonly requiredEvidence: readonly ReleaseAutomatedTestReadinessRequiredEvidence[];
  readonly blockers: readonly string[];
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

export function buildMigrationCompatibilityEnforcementPlan(input: MigrationCompatibilityEnforcementInput): MigrationCompatibilityEnforcementPlan {
  const classification = input.migrations.reduce<MigrationRisk>((current, change) => {
    if (current === "destructive" || change.risk === "destructive" || change.requiresBackup || change.requiresManualApproval) return "destructive";
    if (current === "contract" || change.risk === "contract" || !change.backwardCompatible) return "contract";
    if (current === "expand_only" || change.risk === "expand_only") return "expand_only";
    return "none";
  }, "none");
  const needsBackupAndApproval = classification === "destructive";
  const needsExpandContractPlan = classification === "contract" || classification === "destructive";
  const gates: ReleaseGate[] = [
    {
      id: "prisma-schema-present",
      label: "Prisma schema selected",
      status: input.prismaSchemaPath.endsWith("schema.prisma") ? "pass" : "block",
      blocksProduction: true,
      evidence: input.prismaSchemaPath,
      nextAction: "Point the release workflow at packages/db/prisma/schema.prisma.",
    },
    {
      id: "prisma-migrations-present",
      label: "Prisma migration directory selected",
      status: input.migrationDirectory.includes("migrations") ? "pass" : "block",
      blocksProduction: true,
      evidence: input.migrationDirectory,
      nextAction: "Generate Prisma migrations and commit them with the release.",
    },
    {
      id: "staging-database-dry-run",
      label: "Staging database dry run",
      status: input.stagingDatabaseDryRun ? "pass" : "block",
      blocksProduction: true,
      evidence: input.stagingDatabaseDryRun ? "Staging migration dry-run evidence is attached." : "No staging migration dry-run evidence is attached.",
      nextAction: "Run prisma migrate diff/deploy against a staging database before production approval.",
    },
    {
      id: "destructive-change-approval",
      label: "Destructive migration approval",
      status: !needsBackupAndApproval || (input.backupSnapshotAttached && input.destructiveApprovalAttached) ? "pass" : "block",
      blocksProduction: true,
      evidence: needsBackupAndApproval
        ? `backup=${input.backupSnapshotAttached}; approval=${input.destructiveApprovalAttached}`
        : "No destructive migration changes detected.",
      nextAction: "Attach backup snapshot evidence and explicit production approval for destructive migrations.",
    },
    {
      id: "expand-contract-plan",
      label: "Expand/contract compatibility plan",
      status: !needsExpandContractPlan || input.expandContractPlanAttached ? "pass" : "block",
      blocksProduction: true,
      evidence: needsExpandContractPlan ? `expandContractPlan=${input.expandContractPlanAttached}` : "Expand-only or no-op migration.",
      nextAction: "Split incompatible changes into expand, backfill, and contract phases.",
    },
    {
      id: "database-forward-fix-plan",
      label: "Forward-fix/restore policy",
      status: input.forwardFixPlanAttached ? "pass" : "block",
      blocksProduction: true,
      evidence: input.forwardFixPlanAttached ? "Forward-fix/restore policy is attached to the release record." : "No forward-fix/restore policy is attached.",
      nextAction: "Attach forward-fix-first recovery steps and restore approval policy to the release record.",
    },
  ];

  return {
    classification,
    productionBlocked: gates.some((gate) => gate.status !== "pass"),
    gates,
    requiredCommands: buildMigrationCompatibilityRequiredCommands(input),
    policy: [
      "Expand-only migrations may proceed after staging dry-run evidence is attached.",
      "Contract/destructive migrations require expand/contract sequencing and explicit approval.",
      "Destructive migrations require backup snapshot evidence before production deploy.",
      "Database rollback defaults to forward-fix; restore requires incident approval and data-loss assessment.",
    ],
  };
}

export function buildMigrationCompatibilityRequiredCommands(
  input: Pick<MigrationCompatibilityEnforcementInput, "prismaSchemaPath">,
): readonly string[] {
  return [
    `pnpm --filter @inkroute/db prisma validate --schema ${input.prismaSchemaPath}`,
    `pnpm --filter @inkroute/db prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel ${input.prismaSchemaPath} --script`,
    "pnpm --filter @inkroute/db prisma migrate deploy",
  ];
}

export const migrationRuntimeDryRunReadinessRequiredCommands = [
      "pnpm --filter @inkroute/releases typecheck",
      "pnpm --filter @inkroute/releases test",
      "pnpm --filter @inkroute/db prisma validate --schema packages/db/prisma/schema.prisma",
      "pnpm --filter @inkroute/db prisma migrate diff --from-url \"$DATABASE_URL\" --to-schema-datamodel packages/db/prisma/schema.prisma --script",
      "pnpm --filter @inkroute/db prisma migrate deploy",
      "release-governance migration dry run with staging DATABASE_URL",
    ] as const;

export function buildMigrationRuntimeDryRunReadinessPlan(input: MigrationRuntimeDryRunReadinessInput): MigrationRuntimeDryRunReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: MigrationRuntimeDryRunReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/releases ${script} script.`);
  if (!input.releasesTestsPassed) blockers.push("@inkroute/releases tests must pass before migration runtime dry-run readiness.");
  if (!input.releasesTypecheckPassed) blockers.push("@inkroute/releases typecheck must pass before migration runtime dry-run readiness.");
  if (!input.workflowSourceTestsPassed) blockers.push("Release-governance workflow migration source tests must pass.");
  if (!input.prismaSchemaPresent) blockers.push("Prisma schema must be selected at packages/db/prisma/schema.prisma.");
  if (!input.prismaMigrationsGenerated) blockers.push("Real Prisma migrations must be generated and committed before dry-run proof.");
  if (!input.stagingDatabaseUrlConfigured) blockers.push("Staging DATABASE_URL must be provisioned in GitHub Actions secrets.");
  if (!input.prismaValidatePassed) blockers.push("Prisma validate must pass against the release schema.");
  if (!input.prismaDiffDryRunPassed) blockers.push("Prisma migrate diff dry-run must pass against staging DATABASE_URL.");
  if (!input.prismaMigrateDeployDryRunPassed) blockers.push("Prisma migrate deploy dry-run/staging execution must pass.");
  if (!input.destructiveSqlScanPassed) blockers.push("Destructive SQL scan must pass or block until approved.");
  if (!input.backupSnapshotAttached) blockers.push("Backup snapshot evidence must be attached for risky migrations.");
  if (!input.destructiveApprovalAttached) blockers.push("Destructive/contract migration approval evidence must be attached when required.");
  if (!input.expandContractPlanAttached) blockers.push("Expand/contract sequencing plan must be attached for incompatible migrations.");
  if (!input.forwardFixPlanAttached) blockers.push("Forward-fix/restore policy must be attached to the release record.");
  if (!input.rollbackEvidenceRecorded) blockers.push("Rollback or forward-fix rehearsal evidence must be recorded.");
  if (!input.githubActionsDryRunPassed) blockers.push("GitHub Actions release-governance migration dry-run must pass with staging DATABASE_URL.");
  if (!input.ciArtifactCaptured) blockers.push("CI migration dry-run logs and artifacts must be captured.");

  if (!input.prismaSchemaPresent || !input.prismaMigrationsGenerated || !input.stagingDatabaseUrlConfigured) {
    requiredEvidence.push("Prisma schema, committed migration, and staging DATABASE_URL evidence");
  }
  if (!input.prismaValidatePassed || !input.prismaDiffDryRunPassed || !input.prismaMigrateDeployDryRunPassed || !input.destructiveSqlScanPassed) {
    requiredEvidence.push("Prisma validate, diff, migrate dry-run, and destructive SQL scan evidence");
  }
  if (!input.backupSnapshotAttached || !input.destructiveApprovalAttached || !input.expandContractPlanAttached || !input.forwardFixPlanAttached || !input.rollbackEvidenceRecorded) {
    requiredEvidence.push("backup, approval, expand/contract, forward-fix, and rollback evidence");
  }
  if (!input.githubActionsDryRunPassed || !input.ciArtifactCaptured) {
    requiredEvidence.push("GitHub Actions migration dry-run artifact evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: migrationRuntimeDryRunReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === migrationRuntimeDryRunReadinessRequiredEvidence.length
        ? migrationRuntimeDryRunReadinessRequiredEvidence
        : requiredEvidence,
    blockers,
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

export function buildProviderRuntimeGates(decisions: readonly FeatureFlagDecision[]): readonly ProviderRuntimeGate[] {
  const byKey = new Map(decisions.map((decision) => [decision.key, decision]));
  const providerFlags: Array<{ provider: ProviderRuntimeGate["provider"]; flagKey: string; boundary: string }> = [
    {
      provider: "sms",
      flagKey: "sms_notifications.enabled",
      boundary: "SMS/email worker sends must remain disabled unless provider credentials, consent, STOP/HELP, and legal copy are verified.",
    },
    {
      provider: "payments",
      flagKey: "booking.deposit_required",
      boundary: "Stripe deposit collection must remain disabled unless webhook persistence, idempotency, and refund/legal paths are verified.",
    },
    {
      provider: "mobile-ota",
      flagKey: "mobile.ota_updates.enabled",
      boundary: "EAS Update publishing must remain disabled unless project, native build, update URL, and rollback drill evidence exists.",
    },
    {
      provider: "ai-assistants",
      flagKey: "ai_assistants.enabled",
      boundary: "AI assistant features must remain disabled until privacy, provider, and product review are complete.",
    },
  ];

  return providerFlags.map((entry) => {
    const decision = byKey.get(entry.flagKey);
    const enabled = decision?.enabled ?? false;
    return {
      provider: entry.provider,
      flagKey: entry.flagKey,
      enabled,
      decisionReason: decision?.reason ?? "default_value",
      action: enabled ? "allow" : "block",
      runtimeBoundary: entry.boundary,
    };
  });
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

function evidenceGate(id: string, label: string, present: boolean, evidence: string, nextAction: string): ReleaseGate {
  return {
    id,
    label,
    status: present ? "pass" : "block",
    blocksProduction: true,
    evidence,
    nextAction,
  };
}

export const easOtaReadinessRequiredCommands = [
      "eas build --profile preview",
      "eas update --channel preview",
      "eas channel:list",
      "eas update:list --channel preview",
    ] as const;

export function buildEasOtaReadinessPlan(input: EasOtaReadinessInput): EasOtaReadinessPlan {
  const gates: ReleaseGate[] = [
    evidenceGate(
      "eas-project-id",
      "EAS project id configured",
      Boolean(input.expoProjectId?.trim()),
      input.expoProjectId ? "Expo project id is present." : "No Expo project id is configured.",
      "Run eas init/update configuration and commit non-secret project metadata.",
    ),
    evidenceGate(
      "eas-update-url",
      "EAS update URL configured",
      Boolean(input.updateUrl?.trim() && !input.updateUrl.includes("placeholder")),
      input.updateUrl ? "Update URL is present." : "No EAS update URL is configured.",
      "Configure expo-updates URL for the real EAS project.",
    ),
    evidenceGate(
      "eas-channels",
      "Preview and production channels configured",
      Boolean(input.previewChannel?.trim() && input.productionChannel?.trim()),
      input.previewChannel && input.productionChannel ? `${input.previewChannel}/${input.productionChannel}` : "Missing preview or production EAS channel.",
      "Create preview and production EAS channels with explicit runtime policy.",
    ),
    evidenceGate(
      "runtime-version-policy",
      "Runtime version policy declared",
      input.runtimeVersionPolicy !== "unknown",
      `Runtime policy: ${input.runtimeVersionPolicy}.`,
      "Declare an Expo runtimeVersion policy before OTA updates are allowed.",
    ),
    evidenceGate(
      "preview-native-build",
      "Preview native build verified",
      Boolean(input.previewBuildUrl?.trim()),
      input.previewBuildUrl ? "Preview build URL is attached." : "No preview native build evidence is attached.",
      "Run eas build --profile preview and device-smoke the binary.",
    ),
    evidenceGate(
      "production-native-build",
      "Production native build configured",
      Boolean(input.productionBuildUrl?.trim()),
      input.productionBuildUrl ? "Production build URL is attached." : "No production build evidence is attached.",
      "Run or schedule production build with native credentials before launch.",
    ),
    evidenceGate(
      "preview-update-published",
      "Preview OTA update published",
      Boolean(input.previewUpdateId?.trim()),
      input.previewUpdateId ? "Preview update id is attached." : "No preview EAS Update id is attached.",
      "Publish a preview EAS Update and verify it is received by the preview binary.",
    ),
    evidenceGate(
      "rollback-drill",
      "OTA rollback drill verified",
      Boolean(input.rollbackDrillId?.trim()),
      input.rollbackDrillId ? "Rollback drill id is attached." : "No rollback drill evidence is attached.",
      "Republish a previous compatible update on preview and record the drill.",
    ),
    evidenceGate(
      "adoption-monitoring",
      "Update adoption monitoring configured",
      input.adoptionMonitoringConfigured,
      input.adoptionMonitoringConfigured ? "Adoption monitoring is configured." : "No update adoption monitoring evidence is attached.",
      "Configure update adoption/error monitoring before production OTA.",
    ),
  ];
  const blockers = gates.filter((gate) => gate.status === "block").map((gate) => gate.nextAction);
  const previewGateIds = new Set([
    "eas-project-id",
    "eas-update-url",
    "eas-channels",
    "runtime-version-policy",
    "preview-native-build",
    "preview-update-published",
  ]);
  const previewReady = gates.filter((gate) => previewGateIds.has(gate.id)).every((gate) => gate.status === "pass");

  return {
    status: previewReady ? "ready_for_preview" : "blocked",
    productionReady: blockers.length === 0,
    gates,
    requiredCommands: easOtaReadinessRequiredCommands,
    rollbackRequirement: "Republish the previous compatible EAS update on the same preview channel and confirm the device receives it.",
    blockers,
  };
}

export const expoEasRuntimeEvidenceRequiredCommands = [
      "pnpm --filter @inkroute/releases typecheck",
      "pnpm --filter @inkroute/releases test",
      "pnpm --filter @inkroute/mobile typecheck",
      "eas build --profile preview --platform all",
      "eas update --channel preview",
      "eas update:list --channel preview",
      "eas update --channel preview --message rollback-republish-drill --non-interactive",
    ] as const;

export const expoEasRuntimeEvidenceRequiredEvidence = [
  "apps/mobile app config contains the real non-secret EAS project id, update URL, runtimeVersion policy, and preview/production channel mapping.",
  "EAS credentials are configured outside source control and preview/prod native builds are linked to release evidence.",
  "Preview OTA update id is recorded and a device running the preview binary receives the update.",
  "Rollback republish drill confirms the previous compatible update can be restored on the preview channel.",
  "Update adoption, error, and release-health monitoring are wired before production OTA.",
] as const;

export function buildExpoEasRuntimeEvidencePlan(input: ExpoEasRuntimeEvidenceInput): ExpoEasRuntimeEvidencePlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const gates: ReleaseGate[] = [
    ...missingScripts.map((script): ReleaseGate => ({
      id: `releases-script-${script}`,
      label: `@inkroute/releases ${script} script`,
      status: "block",
      blocksProduction: true,
      evidence: `Missing package script: ${script}.`,
      nextAction: `Add @inkroute/releases ${script} script before trusting EAS release evidence.`,
    })),
    evidenceGate(
      "releases-tests",
      "@inkroute/releases tests passed",
      input.releasesTestsPassed,
      input.releasesTestsPassed ? "Release package tests passed." : "Release package tests have not passed for the EAS runtime gate.",
      "Run pnpm --filter @inkroute/releases test.",
    ),
    evidenceGate(
      "releases-typecheck",
      "@inkroute/releases typecheck passed",
      input.releasesTypecheckPassed,
      input.releasesTypecheckPassed ? "Release package typecheck passed." : "Release package typecheck has not passed for the EAS runtime gate.",
      "Run pnpm --filter @inkroute/releases typecheck.",
    ),
    evidenceGate(
      "mobile-typecheck",
      "@inkroute/mobile typecheck passed",
      input.mobileTypecheckPassed,
      input.mobileTypecheckPassed ? "Mobile package typecheck passed." : "Mobile package typecheck has not passed against EAS config.",
      "Run pnpm --filter @inkroute/mobile typecheck.",
    ),
    evidenceGate(
      "app-json-project-id-match",
      "app.json project id matches EAS",
      input.appJsonProjectIdMatches,
      input.appJsonProjectIdMatches ? "Expo project id in app config matches EAS." : "app.json/app.config project id has not been matched to the real EAS project.",
      "Commit non-secret Expo project metadata and confirm it matches EAS.",
    ),
    evidenceGate(
      "eas-json-channels-match",
      "eas.json channels match release policy",
      input.easJsonChannelsMatch,
      input.easJsonChannelsMatch ? "EAS channels match preview/production release policy." : "eas.json channel profiles have not been reconciled with release policy.",
      "Wire preview and production profiles to explicit EAS channels.",
    ),
    evidenceGate(
      "eas-credentials",
      "EAS credentials configured",
      input.credentialsConfigured,
      input.credentialsConfigured ? "EAS credentials are configured outside source control." : "EAS credentials have not been configured or evidenced.",
      "Configure EAS credentials without committing secrets.",
    ),
    evidenceGate(
      "eas-project-id",
      "EAS project id configured",
      input.easProjectIdConfigured,
      input.easProjectIdConfigured ? "Real EAS project id is configured." : "No real EAS project id evidence is attached.",
      "Run EAS project setup and commit only non-secret project metadata.",
    ),
    evidenceGate(
      "eas-update-url",
      "EAS update URL configured",
      input.updateUrlConfigured,
      input.updateUrlConfigured ? "EAS update URL is configured." : "No expo-updates URL evidence is attached.",
      "Configure expo-updates URL for the real EAS project.",
    ),
    evidenceGate(
      "runtime-version-policy",
      "Runtime version policy configured",
      input.runtimeVersionPolicyConfigured,
      input.runtimeVersionPolicyConfigured ? "Runtime version policy is configured." : "Runtime version policy is missing or placeholder.",
      "Declare the runtimeVersion policy used by native builds and OTA updates.",
    ),
    evidenceGate(
      "preview-channel",
      "Preview channel configured",
      input.previewChannelConfigured,
      input.previewChannelConfigured ? "Preview channel is configured." : "Preview channel is missing.",
      "Create and wire the preview EAS channel.",
    ),
    evidenceGate(
      "production-channel",
      "Production channel configured",
      input.productionChannelConfigured,
      input.productionChannelConfigured ? "Production channel is configured." : "Production channel is missing.",
      "Create and wire the production EAS channel.",
    ),
    evidenceGate(
      "preview-native-build",
      "Preview native build passed",
      input.previewNativeBuildPassed,
      input.previewNativeBuildPassed ? "Preview native build evidence is attached." : "Preview native build evidence is missing.",
      "Run eas build --profile preview --platform all.",
    ),
    evidenceGate(
      "production-native-build",
      "Production native build passed",
      input.productionNativeBuildPassed,
      input.productionNativeBuildPassed ? "Production native build evidence is attached." : "Production native build evidence is missing.",
      "Run eas build --profile production --platform all or attach scheduled production build evidence.",
    ),
    evidenceGate(
      "preview-ota-published",
      "Preview OTA publish verified",
      input.previewOtaPublishVerified,
      input.previewOtaPublishVerified ? "Preview OTA publish evidence is attached." : "Preview OTA publish evidence is missing.",
      "Run eas update --channel preview and attach the update id.",
    ),
    evidenceGate(
      "device-received-preview-update",
      "Device received preview update",
      input.deviceReceivedPreviewUpdate,
      input.deviceReceivedPreviewUpdate ? "Device receipt evidence is attached." : "No device receipt evidence is attached.",
      "Launch the preview binary on a device and confirm it receives the update.",
    ),
    evidenceGate(
      "rollback-republish",
      "Rollback republish verified",
      input.rollbackRepublishVerified,
      input.rollbackRepublishVerified ? "Rollback republish drill evidence is attached." : "Rollback republish drill evidence is missing.",
      "Republish the previous compatible update to preview and verify device receipt.",
    ),
    evidenceGate(
      "compatibility-check",
      "Runtime compatibility check passed",
      input.compatibilityCheckPassed,
      input.compatibilityCheckPassed ? "Runtime compatibility check passed." : "Runtime compatibility check evidence is missing.",
      "Confirm OTA update does not require a new native build.",
    ),
    evidenceGate(
      "adoption-monitoring",
      "Update adoption monitoring verified",
      input.adoptionMonitoringVerified,
      input.adoptionMonitoringVerified ? "Update adoption monitoring is verified." : "Update adoption monitoring verification is missing.",
      "Verify update adoption/error dashboards before production OTA.",
    ),
    evidenceGate(
      "release-health-monitoring",
      "Release health monitoring configured",
      input.releaseHealthMonitoringConfigured,
      input.releaseHealthMonitoringConfigured ? "Release health monitoring is configured." : "Release health monitoring evidence is missing.",
      "Connect EAS update status to release health monitoring and incident triage.",
    ),
  ];
  const blockers = gates.filter((gate) => gate.status !== "pass").map((gate) => gate.nextAction);

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    gates,
    requiredCommands: expoEasRuntimeEvidenceRequiredCommands,
    requiredEvidence: expoEasRuntimeEvidenceRequiredEvidence,
    blockers,
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
  const releaseWorkflowRequiredChecks = [
    "pnpm install --frozen-lockfile",
    "pnpm typecheck",
    "pnpm lint",
    "pnpm test",
    "Prisma validate",
    "Prisma migration diff",
    "Prisma migration dry run",
    "Next.js builds",
    "Expo preview build/update when mobile surface changed",
  ];

  return {
    workflowName: "Release Governance",
    triggers: ["workflow_dispatch", "push to main", "tagged release candidates"],
    requiredSecrets: ["VERCEL_TOKEN", "VERCEL_ORG_ID", "VERCEL_PROJECT_ID", "EXPO_TOKEN", "DATABASE_URL"],
    requiredChecks: releaseWorkflowRequiredChecks,
    concurrencyGroup: "release-${{ github.ref }}",
    environments: ["preview", "staging", "production"],
    deploymentGatedSteps: ["Vercel preview/prod deploy", "Prisma validate", "Prisma migrate diff destructive-change scan", "Prisma migrate deploy", "EAS Update publish", "Sentry release/source-map upload", "Search Console sitemap submission"],
  };
}

export const releaseControlPlaneReadinessRequiredCommands = [
      "pnpm --filter @inkroute/releases typecheck",
      "pnpm --filter @inkroute/releases test",
      "pnpm test:unit -- apps/web/tests/release-health-route.test.ts apps/web/tests/release-automation-static.test.ts",
      "pnpm test:unit -- apps/mobile/tests/mobile-static.test.ts",
      "release-governance workflow dry run",
      "Prisma migration compatibility dry run",
      "preview deploy and rollback rehearsal",
      "EAS preview update and rollback rehearsal",
    ] as const;

export const releaseControlPlaneReadinessRequiredEvidence = [
  "ReleaseRecord and FeatureFlag writes persisted with tenant scope, RBAC, audit rows, and version checks.",
  "Release/feature-flag API route envelopes are consistent for success, validation failure, unauthorized access, and cross-tenant denial.",
  "GitHub protected environment settings require CI checks and human approval before production deployment.",
  "Deployment jobs are tied to immutable commit SHA, release version, environment, artifact URLs, and redacted secrets evidence.",
  "Migration gate output includes Prisma validate, diff, dry-run, backup/restore or forward-fix evidence, and destructive-change approval when needed.",
  "Rollback rehearsal covers web, dashboard, mobile OTA, database forward-fix/restore policy, feature flags, and incident communication.",
  "Release health route reads persisted release/flag state and links Sentry/ErrorReport incident fingerprints.",
] as const;

export function buildReleaseControlPlaneReadinessPlan(input: ReleaseControlPlaneReadinessInput): ReleaseControlPlaneReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/releases ${script} script.`);
  if (!input.packageTestsPassed) blockers.push("Release package tests must pass before release control-plane readiness.");
  if (!input.packageTypecheckPassed) blockers.push("Release package typecheck must pass before release control-plane readiness.");
  if (!input.releaseRecordPersistenceConfigured) blockers.push("ReleaseRecord persistence must be configured for create, approve, deploy, rollback, and health states.");
  if (!input.featureFlagPersistenceConfigured) blockers.push("FeatureFlag persistence must be configured with tenant/environment scopes.");
  if (!input.rbacEnforced) blockers.push("Release and feature-flag mutations must enforce release-admin RBAC.");
  if (!input.tenantScopedReadsVerified) blockers.push("Release/feature-flag reads must be tenant-scoped and tested.");
  if (!input.tenantScopedMutationsVerified) blockers.push("Release/feature-flag mutations must be tenant-scoped and tested.");
  if (!input.auditLogPersistenceConfigured) blockers.push("Release, rollback, mobile update, and feature-flag changes must persist audit rows.");
  if (!input.optimisticConcurrencyConfigured) blockers.push("Release and feature-flag writes must use optimistic concurrency or version checks.");
  if (!input.protectedGithubEnvironmentsConfigured) blockers.push("GitHub preview/production protected environments must be configured.");
  if (!input.signedDeploymentJobsConfigured) blockers.push("Deployment jobs must be signed or otherwise tied to trusted CI identity and immutable commit SHA.");
  if (!input.ciRequiredChecksConfigured) blockers.push("Release workflow must require CI quality gates before deployment.");
  if (!input.previewDeploymentJobConfigured) blockers.push("Preview deployment job must be configured and dry-run verified.");
  if (!input.productionDeploymentJobConfigured) blockers.push("Production deployment job must be configured behind approval gates.");
  if (!input.migrationGatesConfigured) blockers.push("Migration compatibility gates must run before production deploy approval.");
  if (!input.rollbackWorkflowRehearsed) blockers.push("Rollback workflow must be rehearsed for web, dashboard, mobile OTA, database forward-fix, and feature flags.");
  if (!input.incidentLinkageConfigured) blockers.push("Release records must link incidents, Sentry/ErrorReport fingerprints, rollback decisions, and tenant communication drafts.");
  if (!input.easUpdateGovernanceConfigured) blockers.push("EAS Update governance must verify project, channels, runtime policy, native build, update id, adoption monitoring, and rollback drill.");
  if (!input.rolloutControlsConfigured) blockers.push("Tenant/environment rollout controls must be configured before SaaS release automation.");
  if (!input.killSwitchesVerified) blockers.push("Provider and risky-feature kill switches must be verified before rollout.");
  if (!input.releaseHealthRouteVerified) blockers.push("Release health route must return consistent tenant-scoped envelopes with persisted release/flag state.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: releaseControlPlaneReadinessRequiredCommands,
    requiredEvidence: releaseControlPlaneReadinessRequiredEvidence,
    blockers,
  };
}

export const releaseRuntimeVerificationRequiredCommands = [
      "pnpm --filter @inkroute/releases typecheck",
      "pnpm --filter @inkroute/releases test",
      "pnpm vitest run apps/web/tests/release-health-route.test.ts",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/mobile typecheck",
      "dashboard release/feature-flag route smoke",
      "release-governance workflow dry run",
    ] as const;

export function buildReleaseRuntimeVerificationPlan(input: ReleaseRuntimeVerificationInput): ReleaseRuntimeVerificationPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: ReleaseRuntimeVerificationRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/releases ${script} script.`);
  if (!input.releasesTestsPassed) blockers.push("@inkroute/releases tests must pass before release runtime verification.");
  if (!input.releasesTypecheckPassed) blockers.push("@inkroute/releases typecheck must pass before release runtime verification.");
  if (!input.webTypecheckPassed) blockers.push("@inkroute/web typecheck must pass with release-health and dashboard route contracts.");
  if (!input.releaseHealthRouteTestsPassed) blockers.push("Public release-health route runtime smoke tests must pass.");
  if (!input.webBuildPassed) blockers.push("Web app build must pass under release runtime dependencies.");
  if (!input.dashboardBuildPassed) blockers.push("Dashboard app build must pass under release runtime dependencies.");
  if (!input.mobileBuildOrTypecheckPassed) blockers.push("Mobile build or typecheck must pass with release SystemStatus wiring.");
  if (!input.dashboardReleaseRouteSmokePassed) blockers.push("Dashboard release route smoke tests must cover release envelopes.");
  if (!input.dashboardFeatureFlagRouteSmokePassed) blockers.push("Dashboard feature-flag route smoke tests must cover flag envelopes.");
  if (!input.releaseGovernanceWorkflowDryRunPassed) blockers.push("Release-governance GitHub Actions workflow dry-run or dispatch proof is required.");
  if (!input.githubActionsWorkflowEvidenceCaptured) blockers.push("GitHub Actions evidence must capture release-governance workflow status and logs.");
  if (!input.ciArtifactsAttached) blockers.push("CI artifacts must be attached for package tests, route tests, app builds, and workflow execution.");

  if (!input.releasesTestsPassed || !input.releasesTypecheckPassed || !input.webTypecheckPassed || !input.releaseHealthRouteTestsPassed) {
    requiredEvidence.push("release package test/typecheck, web typecheck, and release-health route smoke evidence");
  }
  if (!input.webBuildPassed || !input.dashboardBuildPassed || !input.mobileBuildOrTypecheckPassed) {
    requiredEvidence.push("web, dashboard, and mobile build/typecheck evidence");
  }
  if (!input.dashboardReleaseRouteSmokePassed || !input.dashboardFeatureFlagRouteSmokePassed) {
    requiredEvidence.push("dashboard release and feature-flag route smoke evidence");
  }
  if (!input.releaseGovernanceWorkflowDryRunPassed || !input.githubActionsWorkflowEvidenceCaptured) {
    requiredEvidence.push("GitHub release-governance workflow dry-run/dispatch evidence");
  }
  if (!input.ciArtifactsAttached) {
    requiredEvidence.push("CI artifact, log, and release evidence attachment");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: releaseRuntimeVerificationRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === releaseRuntimeVerificationRequiredEvidence.length
        ? releaseRuntimeVerificationRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export const releasePersistenceRbacReadinessRequiredCommands = [
      "pnpm vitest run apps/web/tests/dashboard-release-rbac-static.test.ts",
      "pnpm --filter @inkroute/dashboard typecheck",
      "dashboard release/feature-flag DB-backed route tests",
      "dashboard rendered release workflow smoke",
      "release approval state machine smoke",
      "release workflow orchestration hook smoke",
    ] as const;

export function buildReleasePersistenceRbacReadinessPlan(input: ReleasePersistenceRbacReadinessInput): ReleasePersistenceRbacReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: ReleasePersistenceRbacReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/releases ${script} script.`);
  if (!input.dashboardStaticRouteTestsPassed) blockers.push("Dashboard release/RBAC static route tests must pass.");
  if (!input.dashboardTypecheckPassed) blockers.push("@inkroute/dashboard typecheck must pass with release and feature-flag route contracts.");
  if (!input.releaseRecordPersistenceConfigured) blockers.push("ReleaseRecord persistence must be configured for dashboard read/write routes.");
  if (!input.featureFlagPersistenceConfigured) blockers.push("FeatureFlag persistence must be configured for dashboard read/write routes.");
  if (!input.tenantScopedRbacConfigured) blockers.push("Tenant-scoped RBAC must guard release and feature-flag mutations.");
  if (!input.tenantMismatchRejectionVerified) blockers.push("Tenant mismatch rejection must be verified for release and feature-flag routes.");
  if (!input.dbTransactionsConfigured) blockers.push("Release and feature-flag writes must run inside DB transactions.");
  if (!input.auditLoggingConfigured) blockers.push("Release and feature-flag changes must write audit-log records.");
  if (!input.providerCredentialGatesConfigured) blockers.push("Provider credential gates must block release operations that need unavailable credentials.");
  if (!input.previousStateMetadataConfigured) blockers.push("FeatureFlag updates must persist previous-state audit metadata.");
  if (!input.approvalStateMachineConfigured) blockers.push("Release approval state machine must be configured before production orchestration.");
  if (!input.optimisticConcurrencyConfigured) blockers.push("Release and feature-flag writes must enforce optimistic concurrency/version checks.");
  if (!input.membershipLookupConfigured) blockers.push("Tenant membership lookups must replace trusted-header-only authorization.");
  if (!input.renderedDashboardWorkflowTestsPassed) blockers.push("Rendered dashboard release and feature-flag workflow tests must pass.");
  if (!input.releaseWorkflowOrchestrationHooksConfigured) blockers.push("Release/workflow orchestration hooks must connect persisted state to deployment governance.");
  if (!input.dbBackedRuntimeRouteTestsPassed) blockers.push("DB-backed runtime route tests must verify persisted release/flag behavior with tenant isolation.");

  if (!input.dashboardStaticRouteTestsPassed || !input.dashboardTypecheckPassed) {
    requiredEvidence.push("dashboard static route test and dashboard typecheck evidence");
  }
  if (!input.releaseRecordPersistenceConfigured || !input.featureFlagPersistenceConfigured || !input.dbTransactionsConfigured || !input.auditLoggingConfigured) {
    requiredEvidence.push("ReleaseRecord/FeatureFlag persistence, transaction, and audit-log evidence");
  }
  if (!input.tenantScopedRbacConfigured || !input.tenantMismatchRejectionVerified || !input.membershipLookupConfigured) {
    requiredEvidence.push("tenant-scoped RBAC, mismatch rejection, and membership lookup evidence");
  }
  if (!input.providerCredentialGatesConfigured || !input.previousStateMetadataConfigured || !input.optimisticConcurrencyConfigured) {
    requiredEvidence.push("provider credential gate, previous-state metadata, and optimistic concurrency evidence");
  }
  if (!input.approvalStateMachineConfigured || !input.renderedDashboardWorkflowTestsPassed || !input.releaseWorkflowOrchestrationHooksConfigured || !input.dbBackedRuntimeRouteTestsPassed) {
    requiredEvidence.push("approval state machine, rendered dashboard workflow, orchestration hook, and DB-backed route evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: releasePersistenceRbacReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === releasePersistenceRbacReadinessRequiredEvidence.length
        ? releasePersistenceRbacReadinessRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export const cicdDeploymentAutomationReadinessRequiredCommands = [
      "pnpm --filter @inkroute/releases typecheck",
      "pnpm --filter @inkroute/releases test",
      "pnpm vitest run packages/releases/tests/release-governance-workflow.test.ts",
      "release-governance workflow_dispatch dry run",
      "Vercel preview/staging/production deploy smoke",
      "Prisma migrate dry-run/deploy smoke",
      "Sentry/Search Console release step smoke",
    ] as const;

export function buildCicdDeploymentAutomationReadinessPlan(input: CicdDeploymentAutomationReadinessInput): CicdDeploymentAutomationReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: CicdDeploymentAutomationReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/releases ${script} script.`);
  if (!input.releasesTestsPassed) blockers.push("@inkroute/releases tests must pass before CI/CD automation readiness.");
  if (!input.releasesTypecheckPassed) blockers.push("@inkroute/releases typecheck must pass before CI/CD automation readiness.");
  if (!input.workflowSourceTestsPassed) blockers.push("Release-governance workflow source tests must pass.");
  if (!input.protectedGithubEnvironmentsConfigured) blockers.push("GitHub preview, staging, and production protected environments must be configured.");
  if (!input.githubSecretsConfigured) blockers.push("Required GitHub environment/repository secrets must be configured outside source control.");
  if (!input.previewDeployJobEnabled) blockers.push("Preview deployment job must be enabled after secrets and protected environments exist.");
  if (!input.stagingDeployJobEnabled) blockers.push("Staging deployment job must be enabled after secrets and protected environments exist.");
  if (!input.productionDeployJobEnabled) blockers.push("Production deployment job must be enabled behind protected-environment approval.");
  if (!input.vercelDeployConfigured) blockers.push("Vercel deploy jobs must be configured for web and dashboard release surfaces.");
  if (!input.prismaDryRunConfigured) blockers.push("Prisma migration dry-run gate must run before deployment.");
  if (!input.prismaMigrateDeployConfigured) blockers.push("Prisma migrate deploy must be configured behind migration safety gates.");
  if (!input.easUpdatePublishConfigured) blockers.push("EAS Update publish must be configured for mobile release surfaces.");
  if (!input.sentryArtifactUploadConfigured) blockers.push("Sentry release/source-map artifact upload must be configured.");
  if (!input.searchConsoleSubmissionConfigured) blockers.push("Search Console sitemap submission must be configured for SEO release steps.");
  if (!input.ciPrerequisiteChecksRequired) blockers.push("CI prerequisite checks must be required before deployment jobs run.");
  if (!input.releaseRecordCiResultWritesConfigured) blockers.push("ReleaseRecord CI result links must be persisted after workflow execution.");
  if (!input.noSecretLiteralsVerified) blockers.push("Workflow source must be verified free of secret literals.");
  if (!input.liveWorkflowDispatchProofCaptured) blockers.push("Live release-governance workflow dispatch proof is required before closing GAP-089.");

  if (!input.workflowSourceTestsPassed || !input.noSecretLiteralsVerified || !input.ciPrerequisiteChecksRequired) {
    requiredEvidence.push("workflow source, no-secret-literal, and CI prerequisite evidence");
  }
  if (!input.protectedGithubEnvironmentsConfigured || !input.githubSecretsConfigured) {
    requiredEvidence.push("GitHub protected environment and secret configuration evidence");
  }
  if (!input.previewDeployJobEnabled || !input.stagingDeployJobEnabled || !input.productionDeployJobEnabled || !input.vercelDeployConfigured) {
    requiredEvidence.push("preview, staging, production, and Vercel deployment job evidence");
  }
  if (!input.prismaDryRunConfigured || !input.prismaMigrateDeployConfigured || !input.easUpdatePublishConfigured || !input.sentryArtifactUploadConfigured || !input.searchConsoleSubmissionConfigured) {
    requiredEvidence.push("Prisma, EAS, Sentry, and Search Console deployment gate evidence");
  }
  if (!input.releaseRecordCiResultWritesConfigured || !input.liveWorkflowDispatchProofCaptured) {
    requiredEvidence.push("ReleaseRecord CI result write and live workflow dispatch evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: cicdDeploymentAutomationReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === cicdDeploymentAutomationReadinessRequiredEvidence.length
        ? cicdDeploymentAutomationReadinessRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export const featureFlagRuntimeIntegrationReadinessRequiredCommands = [
      "pnpm --filter @inkroute/releases typecheck",
      "pnpm --filter @inkroute/releases test",
      "pnpm vitest run apps/web/tests/feature-flag-runtime-static.test.ts",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/mobile typecheck",
      "provider-worker feature-flag kill-switch smoke",
      "feature-flag invalidation/revalidation smoke",
      "live rollout bucket proof",
    ] as const;

export function buildFeatureFlagRuntimeIntegrationReadinessPlan(input: FeatureFlagRuntimeIntegrationReadinessInput): FeatureFlagRuntimeIntegrationReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: FeatureFlagRuntimeIntegrationReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/releases ${script} script.`);
  if (!input.releasesTestsPassed) blockers.push("@inkroute/releases tests must pass before feature-flag runtime integration readiness.");
  if (!input.releasesTypecheckPassed) blockers.push("@inkroute/releases typecheck must pass before feature-flag runtime integration readiness.");
  if (!input.featureFlagStaticTestsPassed) blockers.push("Feature-flag runtime static tests must pass.");
  if (!input.dashboardTypecheckPassed) blockers.push("@inkroute/dashboard typecheck must pass with feature-flag runtime surfaces.");
  if (!input.mobileTypecheckPassed) blockers.push("@inkroute/mobile typecheck must pass with feature-flag runtime surfaces.");
  if (!input.dbBackedEvaluationConfigured) blockers.push("Feature flags must be evaluated from persisted DB state in runtime paths.");
  if (!input.dashboardRuntimeSurfaceWired) blockers.push("Dashboard runtime surface must expose evaluated feature flag/provider gate state.");
  if (!input.mobileRuntimeSurfaceWired) blockers.push("Mobile runtime surface must expose evaluated feature flag/provider gate state.");
  if (!input.publicReleaseHealthPayloadWired) blockers.push("Public release-health payload must include tenant-scoped feature flag decisions.");
  if (!input.cachedServerResolversConfigured) blockers.push("Cached server-side feature flag resolvers must be configured.");
  if (!input.realAuthContextDerivationConfigured) blockers.push("Tenant/user/role flag context must derive from real auth, not trusted demo inputs.");
  if (!input.providerWorkerKillSwitchEnforced) blockers.push("Provider workers must enforce feature-flag kill switches before SMS/payments/mobile OTA/AI side effects.");
  if (!input.invalidationRevalidationConfigured) blockers.push("Feature flag invalidation and revalidation must be configured after writes.");
  if (!input.rolloutBucketTestsPassed) blockers.push("Rollout bucket tests must prove stable tenant/user percentage decisions.");
  if (!input.tenantSafePublicPayloadVerified) blockers.push("Public feature-flag payloads must be proven tenant-safe and free of sensitive targeting data.");
  if (!input.liveRolloutProofCaptured) blockers.push("Live rollout and kill-switch proof is required before closing GAP-090.");

  if (!input.releasesTestsPassed || !input.releasesTypecheckPassed || !input.featureFlagStaticTestsPassed || !input.dashboardTypecheckPassed || !input.mobileTypecheckPassed) {
    requiredEvidence.push("release package, static runtime, dashboard typecheck, and mobile typecheck evidence");
  }
  if (!input.dbBackedEvaluationConfigured || !input.dashboardRuntimeSurfaceWired || !input.mobileRuntimeSurfaceWired || !input.publicReleaseHealthPayloadWired) {
    requiredEvidence.push("DB-backed evaluation and dashboard/mobile/public runtime payload evidence");
  }
  if (!input.cachedServerResolversConfigured || !input.realAuthContextDerivationConfigured || !input.invalidationRevalidationConfigured) {
    requiredEvidence.push("cached resolver, real auth context, and invalidation/revalidation evidence");
  }
  if (!input.providerWorkerKillSwitchEnforced || !input.rolloutBucketTestsPassed || !input.tenantSafePublicPayloadVerified || !input.liveRolloutProofCaptured) {
    requiredEvidence.push("provider kill-switch, rollout bucket, tenant-safe payload, and live rollout evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: featureFlagRuntimeIntegrationReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === featureFlagRuntimeIntegrationReadinessRequiredEvidence.length
        ? featureFlagRuntimeIntegrationReadinessRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export const mobileOtaProductionEnablementRequiredCommands = [
      "pnpm --filter @inkroute/releases typecheck",
      "pnpm --filter @inkroute/releases test",
      "pnpm vitest run apps/mobile/tests/mobile-static.test.ts",
      "pnpm --filter @inkroute/mobile typecheck",
      "eas build --profile preview --platform all",
      "eas build --profile production --platform all",
      "eas update --channel preview",
      "eas update:list --channel preview",
      "eas update --channel preview --message rollback-republish-drill --non-interactive",
    ] as const;

export function buildMobileOtaProductionEnablementPlan(input: MobileOtaProductionEnablementInput): MobileOtaProductionEnablementPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: MobileOtaProductionEnablementRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/releases ${script} script.`);
  if (!input.releasesTestsPassed) blockers.push("@inkroute/releases tests must pass before mobile OTA production enablement.");
  if (!input.releasesTypecheckPassed) blockers.push("@inkroute/releases typecheck must pass before mobile OTA production enablement.");
  if (!input.mobileStaticTestsPassed) blockers.push("Mobile static EAS/OTA tests must pass.");
  if (!input.mobileTypecheckPassed) blockers.push("@inkroute/mobile typecheck must pass with SystemStatus EAS readiness wiring.");
  if (!input.realExpoProjectIdConfigured) blockers.push("Real non-secret Expo project ID must be configured.");
  if (!input.realUpdateUrlConfigured) blockers.push("Real Expo update URL must be configured.");
  if (!input.expoUpdatesConfigured) blockers.push("expo-updates must be configured in the native app runtime.");
  if (!input.runtimeVersionPolicyAppVersion) blockers.push("runtimeVersion policy must remain appVersion for compatible OTA publishing.");
  if (!input.previewChannelConfigured) blockers.push("Preview EAS channel must be configured.");
  if (!input.productionChannelConfigured) blockers.push("Production EAS channel must be configured.");
  if (!input.previewNativeBuildPassed) blockers.push("Preview native build with expo-updates must pass.");
  if (!input.productionNativeBuildPassed) blockers.push("Production native build with expo-updates must pass.");
  if (!input.previewUpdatePublished) blockers.push("Preview OTA update must be published.");
  if (!input.previewUpdateIdRecorded) blockers.push("Preview update ID must be recorded in release evidence.");
  if (!input.deviceAdoptionVerified) blockers.push("A device running the preview binary must receive the preview OTA update.");
  if (!input.adoptionMonitoringConfigured) blockers.push("Update adoption/error monitoring must be configured.");
  if (!input.rollbackRepublishDrillPassed) blockers.push("Rollback republish drill must restore the previous compatible update.");
  if (!input.releaseHealthLinked) blockers.push("EAS update status must link into release health monitoring.");

  if (!input.realExpoProjectIdConfigured || !input.realUpdateUrlConfigured || !input.expoUpdatesConfigured || !input.runtimeVersionPolicyAppVersion) {
    requiredEvidence.push("real Expo project/update URL, expo-updates, and runtimeVersion policy evidence");
  }
  if (!input.previewChannelConfigured || !input.productionChannelConfigured || !input.previewNativeBuildPassed || !input.productionNativeBuildPassed) {
    requiredEvidence.push("preview/production EAS channel and native build evidence");
  }
  if (!input.previewUpdatePublished || !input.previewUpdateIdRecorded || !input.deviceAdoptionVerified) {
    requiredEvidence.push("preview OTA publish, update ID, and device adoption evidence");
  }
  if (!input.adoptionMonitoringConfigured || !input.rollbackRepublishDrillPassed || !input.releaseHealthLinked) {
    requiredEvidence.push("adoption monitoring, rollback republish drill, and release-health linkage evidence");
  }
  const requiredEvidenceResult =
    requiredEvidence.length === mobileOtaProductionEnablementRequiredEvidence.length
      ? mobileOtaProductionEnablementRequiredEvidence
      : requiredEvidence;

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: mobileOtaProductionEnablementRequiredCommands,
    requiredEvidence: requiredEvidenceResult,
    blockers,
  };
}

export const releaseAutomatedTestReadinessRequiredCommands = [
      "pnpm --filter @inkroute/releases test",
      "pnpm vitest run apps/web/tests/release-health-route.test.ts apps/web/tests/release-automation-static.test.ts apps/mobile/tests/mobile-static.test.ts",
      "pnpm --filter @inkroute/dashboard typecheck",
      "Playwright dashboard release smoke",
      "provider-backed release route integration tests",
      "Expo release status render/device tests",
      "GitHub Actions release-governance workflow execution",
    ] as const;

export function buildReleaseAutomatedTestReadinessPlan(input: ReleaseAutomatedTestReadinessInput): ReleaseAutomatedTestReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: ReleaseAutomatedTestReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/releases ${script} script.`);
  if (!input.releasePackageTestsPassed) blockers.push("@inkroute/releases helper tests must pass.");
  if (!input.releaseWorkflowTestsPassed) blockers.push("Release-governance workflow tests must pass.");
  if (!input.releaseHealthRouteTestsPassed) blockers.push("Release-health route tests must pass.");
  if (!input.releaseAutomationStaticTestsPassed) blockers.push("Release automation static route/surface tests must pass.");
  if (!input.mobileStaticTestsPassed) blockers.push("Mobile release static tests must pass.");
  if (!input.dashboardTypecheckPassed) blockers.push("@inkroute/dashboard typecheck must pass with release surfaces.");
  if (!input.playwrightDashboardReleaseSmokePassed) blockers.push("True Playwright dashboard release smoke must pass.");
  if (!input.providerBackedRouteIntegrationTestsPassed) blockers.push("Provider-backed release and feature-flag route integration tests must pass.");
  if (!input.expoRenderTestsPassed) blockers.push("Expo/mobile release status render tests must pass.");
  if (!input.expoDeviceTestsPassed) blockers.push("Expo/mobile device release and OTA tests must pass.");
  if (!input.githubActionsWorkflowExecutionEvidenceCaptured) blockers.push("GitHub Actions release-governance workflow execution evidence must be captured.");
  if (!input.realSecretsAndEnvironmentsConfigured) blockers.push("Real CI secrets and protected environments must be configured for production-like workflow tests.");
  if (!input.ciArtifactsCaptured) blockers.push("CI artifacts must be captured for package, route, Playwright, Expo/device, provider, and workflow tests.");

  if (!input.releasePackageTestsPassed || !input.releaseWorkflowTestsPassed || !input.releaseHealthRouteTestsPassed || !input.releaseAutomationStaticTestsPassed || !input.mobileStaticTestsPassed || !input.dashboardTypecheckPassed) {
    requiredEvidence.push("package helper, workflow, route, static surface, mobile static, and dashboard typecheck evidence");
  }
  if (!input.playwrightDashboardReleaseSmokePassed || !input.providerBackedRouteIntegrationTestsPassed) {
    requiredEvidence.push("Playwright dashboard release smoke and provider-backed route integration evidence");
  }
  if (!input.expoRenderTestsPassed || !input.expoDeviceTestsPassed) {
    requiredEvidence.push("Expo render and physical-device release/OTA evidence");
  }
  if (!input.githubActionsWorkflowExecutionEvidenceCaptured || !input.realSecretsAndEnvironmentsConfigured || !input.ciArtifactsCaptured) {
    requiredEvidence.push("GitHub Actions workflow execution, real secrets/environments, and CI artifact evidence");
  }
  const requiredEvidenceResult =
    requiredEvidence.length === releaseAutomatedTestReadinessRequiredEvidence.length
      ? releaseAutomatedTestReadinessRequiredEvidence
      : requiredEvidence;

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: releaseAutomatedTestReadinessRequiredCommands,
    requiredEvidence: requiredEvidenceResult,
    blockers,
  };
}

export interface ReleaseLaunchControlEvidenceInput {
  packageScripts: readonly string[];
  releasesTestsPassed: boolean;
  releasesTypecheckPassed: boolean;
  releaseRecordPersistenceVerified: boolean;
  featureFlagPersistenceVerified: boolean;
  rbacTenantScopeVerified: boolean;
  optimisticConcurrencyVerified: boolean;
  auditRowsPersisted: boolean;
  protectedGithubEnvironmentsConfigured: boolean;
  signedDeploymentJobsConfigured: boolean;
  ciRequiredChecksPassed: boolean;
  previewDeployJobPassed: boolean;
  productionDeployApprovalDryRunPassed: boolean;
  migrationGateDryRunPassed: boolean;
  incidentLinkedRollbackDrillPassed: boolean;
  easUpdateGovernanceVerified: boolean;
  rolloutControlsVerified: boolean;
  killSwitchDrillPassed: boolean;
  releaseHealthEnvelopeVerified: boolean;
  providerBackedRouteTestsPassed: boolean;
  ciArtifactsCaptured: boolean;
  secretSafeArtifactsCaptured: boolean;
}

export interface ReleaseLaunchControlEvidencePlan {
  readonly status: "ready" | "blocked";
  readonly missingScripts: readonly string[];
  readonly requiredCommands: typeof releaseLaunchControlEvidenceRequiredCommands;
  readonly requiredEvidence: readonly ReleaseLaunchControlEvidenceRequiredEvidence[];
  readonly blockers: readonly string[];
}

export const releaseLaunchControlEvidenceRequiredCommands = [
      "pnpm --filter @inkroute/releases typecheck",
      "pnpm --filter @inkroute/releases test",
      "pnpm release:launch-control-evidence",
      "provider-backed release/feature-flag route integration tests",
      "release-governance GitHub Actions workflow execution",
      "protected environment approval dry run",
      "signed deployment provenance check",
      "migration gate dry run",
      "incident-linked rollback drill",
      "EAS update governance drill",
      "feature-flag kill-switch drill",
      "release-health envelope smoke",
    ] as const;

export function buildReleaseLaunchControlEvidencePlan(input: ReleaseLaunchControlEvidenceInput): ReleaseLaunchControlEvidencePlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: ReleaseLaunchControlEvidenceRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/releases ${script} script.`);
  if (!input.releasesTestsPassed) blockers.push("@inkroute/releases tests must pass before release launch control is ready.");
  if (!input.releasesTypecheckPassed) blockers.push("@inkroute/releases typecheck must pass before release launch control is ready.");
  if (!input.releaseRecordPersistenceVerified) blockers.push("ReleaseRecord persistence must be verified against the production data path.");
  if (!input.featureFlagPersistenceVerified) blockers.push("FeatureFlag persistence must be verified with tenant/environment scope.");
  if (!input.rbacTenantScopeVerified) blockers.push("Release and feature-flag APIs must verify RBAC and tenant scope.");
  if (!input.optimisticConcurrencyVerified) blockers.push("Release and feature-flag mutations must enforce optimistic concurrency.");
  if (!input.auditRowsPersisted) blockers.push("Release and feature-flag mutations must persist audit rows.");
  if (!input.protectedGithubEnvironmentsConfigured) blockers.push("GitHub preview, staging, and production protected environments must be configured.");
  if (!input.signedDeploymentJobsConfigured) blockers.push("Deployment jobs must be signed or otherwise provenance-verified.");
  if (!input.ciRequiredChecksPassed) blockers.push("CI required checks must pass before release promotion.");
  if (!input.previewDeployJobPassed) blockers.push("Preview deployment job must pass under release governance.");
  if (!input.productionDeployApprovalDryRunPassed) blockers.push("Production deployment approval dry run must pass without mutating production.");
  if (!input.migrationGateDryRunPassed) blockers.push("Migration gate dry run must pass before release promotion.");
  if (!input.incidentLinkedRollbackDrillPassed) blockers.push("Incident-linked rollback drill must pass for web, dashboard, mobile OTA, database, and flags.");
  if (!input.easUpdateGovernanceVerified) blockers.push("EAS update governance must verify channels, runtime versions, adoption, and rollback.");
  if (!input.rolloutControlsVerified) blockers.push("Tenant-scoped rollout controls must be verified.");
  if (!input.killSwitchDrillPassed) blockers.push("Feature-flag kill-switch drill must pass.");
  if (!input.releaseHealthEnvelopeVerified) blockers.push("Release-health envelope must report tenant-safe release, flag, deployment, and rollback state.");
  if (!input.providerBackedRouteTestsPassed) blockers.push("Provider-backed release and feature-flag route integration tests must pass.");
  if (!input.ciArtifactsCaptured) blockers.push("Release launch CI artifacts must be captured.");
  if (!input.secretSafeArtifactsCaptured) blockers.push("Release launch artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.");

  if (!input.releaseRecordPersistenceVerified || !input.featureFlagPersistenceVerified || !input.rbacTenantScopeVerified || !input.optimisticConcurrencyVerified || !input.auditRowsPersisted) {
    requiredEvidence.push("ReleaseRecord/FeatureFlag persistence, RBAC, tenant-scope, concurrency, and audit evidence");
  }
  if (!input.protectedGithubEnvironmentsConfigured || !input.signedDeploymentJobsConfigured || !input.ciRequiredChecksPassed || !input.previewDeployJobPassed || !input.productionDeployApprovalDryRunPassed) {
    requiredEvidence.push("protected environment, signed job, CI required-check, preview deploy, and production approval dry-run evidence");
  }
  if (!input.migrationGateDryRunPassed || !input.incidentLinkedRollbackDrillPassed) {
    requiredEvidence.push("migration gate and incident-linked rollback drill evidence");
  }
  if (!input.easUpdateGovernanceVerified) requiredEvidence.push("EAS update governance, channel, runtime, adoption, and rollback evidence");
  if (!input.rolloutControlsVerified || !input.killSwitchDrillPassed || !input.releaseHealthEnvelopeVerified) {
    requiredEvidence.push("tenant rollout, kill-switch drill, and release-health envelope evidence");
  }
  if (!input.providerBackedRouteTestsPassed || !input.ciArtifactsCaptured || !input.secretSafeArtifactsCaptured) {
    requiredEvidence.push("provider-backed route, CI artifact, and secret-safe launch evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: releaseLaunchControlEvidenceRequiredCommands,
    requiredEvidence,
    blockers,
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
      detail: candidate.productionBlocked ? "At least one gate blocks production." : "No release-control gate blocks production.",
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
  createdBy: "codex-phase12-release-contract",
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

export const demoEasOtaReadinessPlan = buildEasOtaReadinessPlan({
  expoProjectId: "deployment-gated-see-GAP-008",
  updateUrl: "https://u.expo.dev/deployment-gated-see-GAP-047",
  previewChannel: "preview",
  productionChannel: "production",
  runtimeVersionPolicy: "appVersion",
  adoptionMonitoringConfigured: false,
});

export const demoMigrationCompatibilityEnforcementPlan = buildMigrationCompatibilityEnforcementPlan({
  migrations: demoReleaseCandidate.migrations,
  prismaSchemaPath: "packages/db/prisma/schema.prisma",
  migrationDirectory: "packages/db/prisma/migrations",
  stagingDatabaseDryRun: false,
  backupSnapshotAttached: false,
  destructiveApprovalAttached: false,
  expandContractPlanAttached: true,
  forwardFixPlanAttached: true,
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
