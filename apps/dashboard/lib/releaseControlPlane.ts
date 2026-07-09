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

export const releasePersistenceRbacProofFiles = [
  "apps/dashboard/package.json",
  "packages/releases/package.json",
  "packages/releases/src/index.ts",
  "packages/releases/tests/feature-flags.test.ts",
  "apps/dashboard/lib/releaseControlPlane.ts",
  "apps/dashboard/app/api/releases/route.ts",
  "apps/dashboard/app/api/feature-flags/route.ts",
  "apps/dashboard/app/api/dashboardAuth.ts",
  "apps/web/tests/dashboard-release-rbac-static.test.ts",
  "apps/dashboard/tests/release-route-static.test.ts",
  "apps/dashboard/tests/feature-flag-route-static.test.ts",
  "apps/dashboard/tests/release-persistence-rbac-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "apps/dashboard/app/releases/page.tsx",
  "apps/dashboard/components/ReleaseActionPanel.tsx",
  ".github/workflows/release-governance.yml",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export const releasePersistenceRbacCommands = [
  "pnpm --filter @inkroute/releases typecheck",
  "pnpm --filter @inkroute/releases test",
  "pnpm vitest run apps/web/tests/dashboard-release-rbac-static.test.ts apps/dashboard/tests/release-route-static.test.ts apps/dashboard/tests/feature-flag-route-static.test.ts apps/dashboard/tests/release-persistence-rbac-static.test.ts",
  "pnpm --filter @inkroute/dashboard typecheck",
  "rendered dashboard release and feature-flag workflow smoke",
  "DB-backed release/feature-flag route concurrency and tenant-isolation integration tests",
  "release-governance protected-environment orchestration proof",
] as const;

export type ReleasePersistenceRbacEvidenceArtifact = (typeof releasePersistenceRbacArtifactPaths)[number];

export const releasePersistenceRbacRequiredExternalEvidence = [
  "rendered dashboard release and feature-flag workflow smoke",
  "DB-backed release/feature-flag route concurrency and tenant-isolation integration tests",
  "release-governance protected-environment orchestration proof",
  "dashboard typecheck evidence and CI artifact attachment",
] as const;

export const releasePersistenceRbacDecisionRequiredEvidence = [
  "release package typecheck/test, dashboard static route, and dashboard typecheck artifacts",
  "approval state machine, optimistic concurrency, and TenantMember lookup artifacts",
  "rendered dashboard workflow, protected orchestration, and DB-backed runtime route artifacts",
  "CI artifact attachment evidence",
] as const;

export interface ReleasePersistenceRbacExecutionPlan {
  readonly id: "gap-088-release-persistence-rbac";
  readonly renderedWorkflowExecutionAllowed: false;
  readonly dbBackedRuntimeExecutionAllowed: false;
  readonly protectedEnvironmentExecutionAllowed: false;
  readonly policy: ReleasePersistenceRbacExecutionPolicy;
  readonly source: "local-software-plan";
  readonly requiredCommands: typeof releasePersistenceRbacCommands;
  readonly requiredArtifacts: typeof releasePersistenceRbacArtifactPaths;
  readonly localControlPlaneArtifacts: readonly ReleasePersistenceRbacEvidenceArtifact[];
  readonly renderedWorkflowArtifacts: readonly ReleasePersistenceRbacEvidenceArtifact[];
  readonly dbBackedArtifacts: readonly ReleasePersistenceRbacEvidenceArtifact[];
  readonly orchestrationArtifacts: readonly ReleasePersistenceRbacEvidenceArtifact[];
  readonly externalEvidenceRequired: typeof releasePersistenceRbacRequiredExternalEvidence;
}

export interface ReleasePersistenceRbacExecutionPolicy {
  readonly executeRenderedWorkflow: false;
  readonly executeDbBackedRuntime: false;
  readonly executeProtectedEnvironmentOrchestration: false;
  readonly executeDashboardTypecheck: false;
  readonly executeCi: false;
}

export interface ReleasePersistenceRbacArtifactReview {
  readonly artifactName: string;
  readonly safeToPersist: boolean;
  readonly redactedArtifact: unknown;
  readonly unsafeFindings: readonly string[];
  readonly requiredArtifactPath: ReleasePersistenceRbacEvidenceArtifact;
}

const releasePersistenceSensitiveKeyPattern =
  /(?:actoruserid|auditid|authorization|clientsecret|commitsha|cookie|credential|customroleid|email|featureflagid|idempotencykey|membershipid|password|phone|private|recordid|releasecandidateid|releaserecordid|secret|sourceReleaseRecordId|tenantid|token|workflowrunid|workflowrunurl)/i;
const releasePersistenceEmailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const releasePersistencePhonePattern = /\+?\d[\d ().-]{7,}\d/g;
const releasePersistenceTokenPattern = /\b(?:bearer|ghp|github_pat|sk|xox|ya29)[A-Za-z0-9._:/-]{8,}\b/gi;

function redactReleasePersistenceArtifactValue(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (releasePersistenceSensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value
      .replace(releasePersistenceEmailPattern, "[REDACTED_EMAIL]")
      .replace(releasePersistencePhonePattern, "[REDACTED_PHONE]")
      .replace(releasePersistenceTokenPattern, "[REDACTED_TOKEN]");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactReleasePersistenceArtifactValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactReleasePersistenceArtifactValue(entryValue, entryKey)]),
    );
  }

  return value;
}

export function buildRedactedReleasePersistenceRbacArtifact(artifact: unknown): unknown {
  return redactReleasePersistenceArtifactValue(artifact);
}

export const releasePersistenceRbacExecutionPolicy: ReleasePersistenceRbacExecutionPolicy = {
  executeRenderedWorkflow: false,
  executeDbBackedRuntime: false,
  executeProtectedEnvironmentOrchestration: false,
  executeDashboardTypecheck: false,
  executeCi: false,
};

export function buildReleasePersistenceRbacExecutionPlan(): ReleasePersistenceRbacExecutionPlan {
  return {
    id: "gap-088-release-persistence-rbac",
    renderedWorkflowExecutionAllowed: false,
    dbBackedRuntimeExecutionAllowed: false,
    protectedEnvironmentExecutionAllowed: false,
    policy: releasePersistenceRbacExecutionPolicy,
    source: "local-software-plan",
    requiredCommands: releasePersistenceRbacCommands,
    requiredArtifacts: releasePersistenceRbacArtifactPaths,
    localControlPlaneArtifacts: [
      "coverage/release-persistence-rbac.json",
      "coverage/release-approval-state-machine.json",
      "coverage/release-optimistic-concurrency.json",
      "coverage/release-membership-lookup.json",
    ],
    renderedWorkflowArtifacts: ["coverage/release-rendered-workflow-smoke.json"],
    dbBackedArtifacts: ["coverage/release-db-backed-route-proof.json"],
    orchestrationArtifacts: ["coverage/release-orchestration-hook.json"],
    externalEvidenceRequired: releasePersistenceRbacRequiredExternalEvidence,
  };
}

export function buildReleasePersistenceRbacArtifactReview(
  artifactName: string,
  artifact: unknown,
  requiredArtifactPath: ReleasePersistenceRbacEvidenceArtifact = "coverage/release-db-backed-route-proof.json",
): ReleasePersistenceRbacArtifactReview {
  const redactedArtifact = buildRedactedReleasePersistenceRbacArtifact(artifact);
  const serialized = JSON.stringify(redactedArtifact);
  const unsafeFindings = [
    serialized.match(releasePersistenceEmailPattern) ? "email" : null,
    serialized.match(releasePersistencePhonePattern) ? "phone" : null,
    serialized.match(releasePersistenceTokenPattern) ? "provider-token" : null,
  ].filter((finding): finding is string => finding !== null);

  return {
    artifactName,
    safeToPersist: unsafeFindings.length === 0,
    redactedArtifact,
    unsafeFindings,
    requiredArtifactPath,
  };
}

export interface ReleasePersistenceRbacEvidenceInput {
  readonly releasesTypecheckPassed: boolean;
  readonly releasesTestsPassed: boolean;
  readonly dashboardStaticRouteTestsPassed: boolean;
  readonly dashboardTypecheckPassed: boolean;
  readonly approvalStateMachineVerified: boolean;
  readonly optimisticConcurrencyVerified: boolean;
  readonly tenantMembershipLookupVerified: boolean;
  readonly renderedDashboardWorkflowPassed: boolean;
  readonly releaseOrchestrationProofCaptured: boolean;
  readonly dbBackedRuntimeRouteTestsPassed: boolean;
  readonly ciArtifactsAttached: boolean;
  readonly capturedArtifacts: readonly ReleasePersistenceRbacEvidenceArtifact[];
}

export interface ReleasePersistenceRbacEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly ReleasePersistenceRbacEvidenceArtifact[];
  readonly requiredCommands: typeof releasePersistenceRbacCommands;
  readonly requiredEvidence: typeof releasePersistenceRbacDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export function buildReleasePersistenceRbacEvidenceDecision(input: ReleasePersistenceRbacEvidenceInput): ReleasePersistenceRbacEvidenceDecision {
  const blockers = [
    !input.releasesTypecheckPassed ? "@inkroute/releases typecheck evidence is required." : null,
    !input.releasesTestsPassed ? "@inkroute/releases test evidence is required." : null,
    !input.dashboardStaticRouteTestsPassed ? "Dashboard release/feature-flag static route evidence is required." : null,
    !input.dashboardTypecheckPassed ? "Dashboard typecheck evidence is required." : null,
    !input.approvalStateMachineVerified ? "Release approval state machine evidence is required." : null,
    !input.optimisticConcurrencyVerified ? "Release/feature-flag optimistic concurrency evidence is required." : null,
    !input.tenantMembershipLookupVerified ? "Server-side TenantMember lookup evidence is required." : null,
    !input.renderedDashboardWorkflowPassed ? "Rendered dashboard release/feature-flag workflow evidence is required." : null,
    !input.releaseOrchestrationProofCaptured ? "Protected release-governance orchestration proof is required." : null,
    !input.dbBackedRuntimeRouteTestsPassed ? "DB-backed release/feature-flag runtime route proof is required." : null,
    !input.ciArtifactsAttached ? "Release persistence RBAC CI artifact evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = releasePersistenceRbacArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: releasePersistenceRbacCommands,
    requiredEvidence: releasePersistenceRbacDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-088 release persistence/RBAC evidence is complete with CI-safe artifacts captured."
        : "GAP-088 release persistence/RBAC evidence remains blocked until rendered workflow, DB-backed runtime, protected orchestration, and CI artifacts are captured.",
  };
}

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
    recordMatched: Boolean(input.recordId),
    recordIdEchoed: false,
    conflict: Boolean(expectedVersion && currentVersion && expectedVersion !== currentVersion),
    strategy: "client-supplied expected version compared before orchestration" as const,
  };
}

export function buildTenantMembershipLookupMetadata(input: {
  actorSource: string;
  actorRole: string;
  tenantId: string;
  actorUserId?: string | null;
  membershipId?: string | null;
  customRoleId?: string | null;
  status?: string | null;
}) {
  const databaseVerified = input.actorSource === "database-tenant-member";
  return {
    tenantIdEchoed: false,
    actorUserIdEchoed: false,
    actorRole: input.actorRole,
    source: databaseVerified ? "database-tenant-member" : "local-fallback",
    status: input.status ?? (databaseVerified ? "active" : "local-fallback"),
    membershipVerified: Boolean(input.membershipId),
    customRoleLinked: Boolean(input.customRoleId),
    membershipIdEchoed: false,
    customRoleIdEchoed: false,
    requiredNextStep: null,
  };
}

export function buildReleaseWorkflowOrchestrationMetadata(input: { approvalState: ReleaseApprovalState; channel: string; recordId?: string | null }) {
  const eligible = input.approvalState === "approved" && ["production", "mobile-production"].includes(input.channel);
  return {
    state: eligible ? "ready_for_release_governance" : "not_queued",
    hook: ".github/workflows/release-governance.yml",
    recordMatched: Boolean(input.recordId),
    recordIdEchoed: false,
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
    membershipLookupConfigured: true,
    renderedDashboardWorkflowTestsPassed: false,
    releaseWorkflowOrchestrationHooksConfigured: true,
    dbBackedRuntimeRouteTestsPassed: false,
  });
}

export const releasePersistenceRbacContract = buildReleasePersistenceRbacContract();


