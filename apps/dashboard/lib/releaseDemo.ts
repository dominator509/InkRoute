import {
  buildReleaseAuditDraft,
  defaultFeatureFlags,
  demoFeatureFlagDecisions,
  demoGithubWorkflowPlan,
  demoMobileUpdatePlan,
  demoReleaseCandidate,
  demoReleaseHealthChecks,
  demoReleaseNotesMarkdown,
  demoRollbackPlan,
  buildProviderRuntimeGates,
  evaluateFeatureFlags,
} from "@inkroute/releases";
import { inkrouteDemoTenant } from "@inkroute/config";

export const releaseCandidatePreview = demoReleaseCandidate;
export const releaseNotesPreview = demoReleaseNotesMarkdown;
export const featureFlagDefinitions = defaultFeatureFlags;
export const featureFlagPreview = demoFeatureFlagDecisions;
export const productionFlagPreview = evaluateFeatureFlags(defaultFeatureFlags, {
  tenantId: inkrouteDemoTenant.id,
  role: "owner",
  environment: "production",
  stableIdentifier: `${inkrouteDemoTenant.id}:owner`,
});
export const providerRuntimeGatePreview = buildProviderRuntimeGates(productionFlagPreview);
export const mobileOtaPlanPreview = demoMobileUpdatePlan;
export const rollbackPlanPreview = demoRollbackPlan;
export const releaseWorkflowPlan = demoGithubWorkflowPlan;
export const releaseHealthChecks = demoReleaseHealthChecks;

export const releaseAuditDrafts = [
  buildReleaseAuditDraft({
    actorId: "user_mara_demo",
    releaseId: releaseCandidatePreview.id,
    action: "create_release",
    tenantId: inkrouteDemoTenant.id,
    redactedPayload: {
      version: releaseCandidatePreview.version,
      channel: releaseCandidatePreview.channel,
      surfaces: releaseCandidatePreview.surfaces,
      productionBlocked: releaseCandidatePreview.productionBlocked,
    },
    createdAt: "2026-06-03T09:15:00-07:00",
  }),
  buildReleaseAuditDraft({
    actorId: "user_mara_demo",
    releaseId: releaseCandidatePreview.id,
    action: "toggle_feature_flag",
    tenantId: inkrouteDemoTenant.id,
    redactedPayload: {
      key: "mobile.ota_updates.enabled",
      enabled: false,
      reason: "No real EAS project or rollback evidence exists yet.",
    },
    createdAt: "2026-06-03T09:20:00-07:00",
  }),
];

export const releaseBoundaryCards = [
  {
    title: "Release persistence",
    status: "control-plane",
    detail: "ReleaseRecord and FeatureFlag models exist, Phase 12 helpers produce candidates, gates, audits, and rollbacks, and dashboard actions expose gated route contracts. Provider-backed persistence, protected environments, and CI/CD execution remain evidence-gated.",
  },
  {
    title: "CI/CD automation",
    status: "deployment-gated",
    detail: "Workflow plan is generated, but Vercel, EAS, Postgres migration deploy, Sentry source maps, and environment protections require real GitHub secrets and deployment targets.",
  },
  {
    title: "Mobile OTA",
    status: "externally dependent",
    detail: "EAS config placeholders exist. A real Expo project ID, update URL, channel mapping, native build, runtime policy, and rollback drill are required before OTA updates are enabled.",
  },
];
