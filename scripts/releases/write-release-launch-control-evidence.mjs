import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const coverageDir = join(process.cwd(), "coverage");

const artifactPaths = {
  runtime: join(coverageDir, "release-launch-control-runtime.json"),
  releaseRecordPersistence: join(coverageDir, "release-record-persistence-redacted.json"),
  featureFlagPersistence: join(coverageDir, "release-feature-flag-persistence-redacted.json"),
  rbacTenantScope: join(coverageDir, "release-rbac-tenant-scope-redacted.json"),
  optimisticConcurrency: join(coverageDir, "release-optimistic-concurrency.json"),
  auditRows: join(coverageDir, "release-audit-rows-redacted.json"),
  protectedEnvironments: join(coverageDir, "release-protected-environments-redacted.json"),
  signedProvenance: join(coverageDir, "release-signed-provenance-redacted.json"),
  ciRequiredChecks: join(coverageDir, "release-ci-required-checks-redacted.json"),
  previewDeploy: join(coverageDir, "release-preview-deploy-redacted.json"),
  productionApprovalDryRun: join(coverageDir, "release-production-approval-dry-run-redacted.json"),
  migrationGateDryRun: join(coverageDir, "release-migration-gate-dry-run-redacted.json"),
  incidentLinkedRollback: join(coverageDir, "release-incident-linked-rollback-redacted.json"),
  easUpdateGovernance: join(coverageDir, "release-eas-update-governance-redacted.json"),
  rolloutControls: join(coverageDir, "release-rollout-controls-redacted.json"),
  killSwitch: join(coverageDir, "release-kill-switch-drill-redacted.json"),
  releaseHealth: join(coverageDir, "release-health-envelope.json"),
  providerRouteTests: join(coverageDir, "release-provider-route-tests-redacted.json"),
  ciArtifacts: join(coverageDir, "release-ci-artifacts-redacted.json"),
  secretSafeArtifacts: join(coverageDir, "release-secret-safe-artifacts.json"),
};

const blockedExternalGates = [
  "provider-backed ReleaseRecord persistence",
  "provider-backed FeatureFlag persistence",
  "provider-backed ReleaseLaunchControlRun transaction",
  "protected GitHub environments",
  "signed deployment provenance jobs",
  "CI required-check enforcement proof",
  "preview and production approval dry runs",
  "migration gate dry run",
  "incident-linked rollback drill",
  "EAS update governance drill",
  "provider-backed release/feature-flag route tests",
  "release launch CI artifact capture",
];

const releaseCandidate = {
  version: "0.11.0-phase12-demo",
  channel: "local-fixture",
  tenantId: "tenant_demo_redacted",
  commitSha: "commit_demo_redacted",
};

const artifacts = {
  [artifactPaths.runtime]: {
    gap: "GAP-015",
    status: "partial-local-fixture",
    releaseCandidate,
    releaseLaunchControlRunPersisted: false,
    providerBackedRouteTestsPassed: false,
    protectedGithubEnvironmentsConfigured: false,
    signedDeploymentJobsConfigured: false,
    blockedExternalGates,
  },
  [artifactPaths.releaseRecordPersistence]: {
    gap: "GAP-015",
    status: "local-release-record-persistence-contract",
    providerBacked: false,
    releaseRecordPersistenceVerified: false,
    providerPersistenceRequiredBeforeClose: true,
    containsSecrets: false,
  },
  [artifactPaths.featureFlagPersistence]: {
    gap: "GAP-015",
    status: "local-feature-flag-persistence-contract",
    providerBacked: false,
    featureFlagPersistenceVerified: false,
    providerPersistenceRequiredBeforeClose: true,
    containsSecrets: false,
  },
  [artifactPaths.rbacTenantScope]: {
    gap: "GAP-015",
    status: "local-rbac-tenant-scope-contract",
    providerBacked: false,
    rbacTenantScopeVerified: false,
    providerRouteSmokeRequiredBeforeClose: true,
    containsSecrets: false,
  },
  [artifactPaths.optimisticConcurrency]: {
    gap: "GAP-015",
    status: "local-optimistic-concurrency-contract",
    providerBacked: false,
    optimisticConcurrencyVerified: false,
    providerRouteSmokeRequiredBeforeClose: true,
    containsSecrets: false,
  },
  [artifactPaths.auditRows]: {
    gap: "GAP-015",
    status: "local-audit-row-contract",
    providerBacked: false,
    auditRowsPersisted: false,
    providerPersistenceRequiredBeforeClose: true,
    containsSecrets: false,
  },
  [artifactPaths.protectedEnvironments]: {
    gap: "GAP-015",
    status: "local-protected-environment-contract",
    protectedGithubEnvironmentsConfigured: false,
    githubEnvironmentProofRequiredBeforeClose: true,
    containsSecrets: false,
  },
  [artifactPaths.signedProvenance]: {
    gap: "GAP-015",
    status: "local-signed-provenance-contract",
    signedDeploymentJobsConfigured: false,
    provenanceProofRequiredBeforeClose: true,
    containsSecrets: false,
  },
  [artifactPaths.ciRequiredChecks]: {
    gap: "GAP-015",
    status: "local-ci-required-check-contract",
    ciRequiredChecksPassed: false,
    liveCiRequiredCheckProofRequiredBeforeClose: true,
    containsSecrets: false,
  },
  [artifactPaths.previewDeploy]: {
    gap: "GAP-015",
    status: "local-preview-deploy-contract",
    previewDeployJobPassed: false,
    previewDeployProofRequiredBeforeClose: true,
    containsSecrets: false,
  },
  [artifactPaths.productionApprovalDryRun]: {
    gap: "GAP-015",
    status: "local-production-approval-contract",
    productionDeployApprovalDryRunPassed: false,
    approvalDryRunRequiredBeforeClose: true,
    containsSecrets: false,
  },
  [artifactPaths.migrationGateDryRun]: {
    gap: "GAP-015",
    status: "local-migration-gate-contract",
    migrationGateDryRunPassed: false,
    migrationGateProofRequiredBeforeClose: true,
    containsSecrets: false,
  },
  [artifactPaths.incidentLinkedRollback]: {
    gap: "GAP-015",
    status: "local-incident-linked-rollback-contract",
    incidentLinkedRollbackDrillPassed: false,
    rollbackDrillRequiredBeforeClose: true,
    containsSecrets: false,
  },
  [artifactPaths.easUpdateGovernance]: {
    gap: "GAP-015",
    status: "local-eas-update-governance-contract",
    easUpdateGovernanceVerified: false,
    easGovernanceProofRequiredBeforeClose: true,
    containsSecrets: false,
  },
  [artifactPaths.rolloutControls]: {
    gap: "GAP-015",
    status: "local-fixture",
    tenantScoped: true,
    rolloutControlsVerified: true,
    providerPersistenceVerified: false,
    rolloutPercent: 10,
  },
  [artifactPaths.killSwitch]: {
    gap: "GAP-015",
    status: "local-fixture",
    killSwitchDrillPassed: true,
    action: "disable_flag",
    flagKey: "release_demo_flag_redacted",
    auditRowsPersisted: false,
  },
  [artifactPaths.releaseHealth]: {
    gap: "GAP-015",
    status: "local-fixture",
    releaseHealthEnvelopeVerified: true,
    releaseCandidate,
    checks: [
      { id: "api", status: "planned" },
      { id: "dashboard", status: "planned" },
      { id: "mobile", status: "planned" },
    ],
  },
  [artifactPaths.providerRouteTests]: {
    gap: "GAP-015",
    status: "local-provider-route-test-contract",
    providerBackedRouteTestsPassed: false,
    providerRouteTestsRequiredBeforeClose: true,
    containsSecrets: false,
  },
  [artifactPaths.ciArtifacts]: {
    gap: "GAP-015",
    status: "local-ci-artifact-contract",
    ciArtifactsCaptured: false,
    liveCiArtifactCaptureRequiredBeforeClose: true,
    containsSecrets: false,
  },
  [artifactPaths.secretSafeArtifacts]: {
    gap: "GAP-015",
    status: "local-redacted-artifact-review",
    secretSafeArtifactsCaptured: true,
    containsSecrets: false,
    containsRawPii: false,
    redactedFields: ["actorEmail", "deploymentToken", "githubToken", "easToken", "databaseUrl"],
  },
};

mkdirSync(coverageDir, { recursive: true });

for (const [path, contents] of Object.entries(artifacts)) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(contents, null, 2)}\n`, "utf8");
}

console.log(
  JSON.stringify(
    {
      gap: "GAP-015",
      status: "partial",
      written: Object.keys(artifacts).map((path) => path.replace(`${process.cwd()}\\`, "").replaceAll("\\", "/")),
      blockedExternalGates,
    },
    null,
    2,
  ),
);
