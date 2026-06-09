import { buildReleasePersistenceRbacReadinessPlan } from "@inkroute/releases";

export const releasePersistenceRbacArtifactPaths = [
  "coverage/release-persistence-rbac.json",
  "coverage/release-approval-state-machine.json",
  "coverage/release-optimistic-concurrency.json",
  "coverage/release-membership-lookup.json",
  "coverage/release-rendered-workflow-smoke.json",
  "coverage/release-orchestration-hook.json",
  "coverage/release-db-backed-route-proof.json",
  "test-results/release-persistence-rbac",
] as const;

export type ReleaseApprovalState = "draft" | "pending_approval" | "approved" | "blocked" | "orchestration_queued";

export function resolveReleaseApprovalState(input: {
  channel: string;
  requestedState?: string | null;
  productionBlocked: boolean;
  actorRole: string;
}): ReleaseApprovalState {
  if (input.productionBlocked) return "blocked";
  if (input.requestedState === "approved" && ["owner", "admin", "studio_manager"].includes(input.actorRole)) return "approved";
  if (["production", "mobile-production"].includes(input.channel)) return "pending_approval";
  if (input.requestedState === "orchestration_queued") return "orchestration_queued";
  return "draft";
}

export function buildOptimisticConcurrencyMetadata(input: {
  expectedVersion?: string | null;
  currentVersion?: string | null;
  recordId?: string | null;
}) {
  const expectedVersion = input.expectedVersion?.trim() || null;
  const currentVersion = input.currentVersion?.trim() || null;
  return {
    expectedVersion,
    currentVersion,
    recordId: input.recordId ?? null,
    conflict: Boolean(expectedVersion && currentVersion && expectedVersion !== currentVersion),
    strategy: "client-supplied expected version compared before orchestration" as const,
  };
}

export function buildTenantMembershipLookupMetadata(input: { actorSource: string; actorRole: string; tenantId: string }) {
  return {
    tenantId: input.tenantId,
    actorRole: input.actorRole,
    source: input.actorSource === "header" ? "trusted-header-with-db-audit" : "local-fallback",
    requiredNextStep: "Replace trusted dashboard headers with server-side TenantMember lookup before production auth closure.",
  };
}

export function buildReleaseWorkflowOrchestrationMetadata(input: { approvalState: ReleaseApprovalState; channel: string; recordId?: string | null }) {
  const eligible = input.approvalState === "approved" && ["production", "mobile-production"].includes(input.channel);
  return {
    state: eligible ? "ready_for_release_governance" : "not_queued",
    hook: ".github/workflows/release-governance.yml",
    recordId: input.recordId ?? null,
    requiresProtectedEnvironment: eligible,
    dispatchEnabled: process.env.RELEASE_GOVERNANCE_DISPATCH_ENABLED === "true",
  };
}

export function buildReleasePersistenceRbacContract() {
  return buildReleasePersistenceRbacReadinessPlan({
    packageScripts: ["test", "typecheck"],
    dashboardStaticRouteTestsPassed: false,
    dashboardTypecheckPassed: false,
    releaseRecordPersistenceConfigured: true,
    featureFlagPersistenceConfigured: true,
    tenantScopedRbacConfigured: true,
    tenantMismatchRejectionVerified: true,
    dbTransactionsConfigured: true,
    auditLoggingConfigured: true,
    providerCredentialGatesConfigured: true,
    previousStateMetadataConfigured: true,
    approvalStateMachineConfigured: true,
    optimisticConcurrencyConfigured: true,
    membershipLookupConfigured: false,
    renderedDashboardWorkflowTestsPassed: false,
    releaseWorkflowOrchestrationHooksConfigured: true,
    dbBackedRuntimeRouteTestsPassed: false,
  });
}

export const releasePersistenceRbacContract = buildReleasePersistenceRbacContract();
