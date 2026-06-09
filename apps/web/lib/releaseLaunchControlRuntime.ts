import { buildReleaseLaunchControlEvidencePlan } from "@inkroute/releases";

export type ReleaseLaunchControlRuntimeStatus =
  | "wired"
  | "persistence-gated"
  | "governance-gated"
  | "migration-gated"
  | "rollback-gated"
  | "mobile-gated"
  | "ci-gated";

export interface ReleaseLaunchControlRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: ReleaseLaunchControlRuntimeStatus;
}

export const releaseLaunchControlRuntimeCommands = [
  "pnpm --filter @inkroute/releases typecheck",
  "pnpm --filter @inkroute/releases test",
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

export const releaseLaunchControlArtifactPaths = [
  "coverage/release-launch-control-runtime.json",
  "coverage/release-package-typecheck.txt",
  "coverage/release-package-test.txt",
  "coverage/release-record-persistence-redacted.json",
  "coverage/release-feature-flag-persistence-redacted.json",
  "coverage/release-rbac-tenant-scope-redacted.json",
  "coverage/release-optimistic-concurrency.json",
  "coverage/release-audit-rows-redacted.json",
  "coverage/release-protected-environments-redacted.json",
  "coverage/release-signed-provenance-redacted.json",
  "coverage/release-ci-required-checks-redacted.json",
  "coverage/release-preview-deploy-redacted.json",
  "coverage/release-production-approval-dry-run-redacted.json",
  "coverage/release-migration-gate-dry-run-redacted.json",
  "coverage/release-incident-linked-rollback-redacted.json",
  "coverage/release-eas-update-governance-redacted.json",
  "coverage/release-rollout-controls-redacted.json",
  "coverage/release-kill-switch-drill-redacted.json",
  "coverage/release-health-envelope.json",
  "coverage/release-provider-route-tests-redacted.json",
  "coverage/release-ci-artifacts-redacted.json",
  "coverage/release-secret-safe-artifacts.json",
  "test-results/release-launch-control-runtime",
] as const;

export const releaseLaunchControlRuntimeMatrix = [
  {
    id: "release-package-gates",
    command: "pnpm --filter @inkroute/releases typecheck && pnpm --filter @inkroute/releases test",
    artifact: "coverage/release-package-test.txt",
    status: "wired",
  },
  {
    id: "persistence-rbac-concurrency-audit",
    command: "provider-backed release/feature-flag route integration tests",
    artifact: "coverage/release-record-persistence-redacted.json",
    status: "persistence-gated",
  },
  {
    id: "protected-environments-signed-jobs-ci",
    command: "release-governance GitHub Actions workflow execution && signed deployment provenance check",
    artifact: "coverage/release-protected-environments-redacted.json",
    status: "governance-gated",
  },
  {
    id: "preview-production-approval-dry-run",
    command: "protected environment approval dry run",
    artifact: "coverage/release-production-approval-dry-run-redacted.json",
    status: "governance-gated",
  },
  {
    id: "migration-gate-dry-run",
    command: "migration gate dry run",
    artifact: "coverage/release-migration-gate-dry-run-redacted.json",
    status: "migration-gated",
  },
  {
    id: "incident-linked-rollback",
    command: "incident-linked rollback drill",
    artifact: "coverage/release-incident-linked-rollback-redacted.json",
    status: "rollback-gated",
  },
  {
    id: "eas-update-governance",
    command: "EAS update governance drill",
    artifact: "coverage/release-eas-update-governance-redacted.json",
    status: "mobile-gated",
  },
  {
    id: "rollout-kill-switch-health",
    command: "feature-flag kill-switch drill && release-health envelope smoke",
    artifact: "coverage/release-kill-switch-drill-redacted.json",
    status: "rollback-gated",
  },
  {
    id: "ci-secret-safe-artifacts",
    command: "capture release launch CI artifacts and secret-safe evidence",
    artifact: "coverage/release-ci-artifacts-redacted.json",
    status: "ci-gated",
  },
] as const satisfies readonly ReleaseLaunchControlRuntimeMatrixEntry[];

export const releaseLaunchControlRuntimeReadiness = buildReleaseLaunchControlEvidencePlan({
  packageScripts: ["test", "typecheck"],
  releasesTestsPassed: false,
  releasesTypecheckPassed: false,
  releaseRecordPersistenceVerified: false,
  featureFlagPersistenceVerified: false,
  rbacTenantScopeVerified: false,
  optimisticConcurrencyVerified: false,
  auditRowsPersisted: false,
  protectedGithubEnvironmentsConfigured: false,
  signedDeploymentJobsConfigured: false,
  ciRequiredChecksPassed: false,
  previewDeployJobPassed: false,
  productionDeployApprovalDryRunPassed: false,
  migrationGateDryRunPassed: false,
  incidentLinkedRollbackDrillPassed: false,
  easUpdateGovernanceVerified: false,
  rolloutControlsVerified: false,
  killSwitchDrillPassed: false,
  releaseHealthEnvelopeVerified: false,
  providerBackedRouteTestsPassed: false,
  ciArtifactsCaptured: false,
  secretSafeArtifactsCaptured: false,
});
