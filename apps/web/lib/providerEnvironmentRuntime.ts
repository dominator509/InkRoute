import { buildProviderEnvironmentRuntimeReadinessPlan } from "@inkroute/deployment";
import type { ProviderEnvironmentSurface } from "@inkroute/deployment";

export type ProviderEnvironmentRuntimeStatus =
  | "wired"
  | "provider-gated"
  | "secret-store-gated"
  | "ci-gated";

export interface ProviderEnvironmentRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: ProviderEnvironmentRuntimeStatus;
}

export interface ProviderEnvironmentRunPersistenceContract {
  readonly prismaModel: "ProviderEnvironmentRun";
  readonly tenantRelation: "providerEnvironmentRuns";
  readonly uniqueKey: readonly ["tenantId", "runId"];
  readonly jsonFields: readonly ["environmentMatrix", "surfaceMatrix", "artifactManifest"];
  readonly requiredBooleanProofs: readonly [
    "verifierPassed",
    "strictEnvCheckPassed",
    "previewProvisioned",
    "stagingProvisioned",
    "productionProvisioned",
    "webDashboardSmokePassed",
    "databaseMigrationDryRunPassed",
    "storagePrivateAclSmokePassed",
    "mobilePreviewBuildPassed",
    "observabilitySourceMapSmokePassed",
    "githubEnvironmentProtectionsConfigured",
    "secretStoreDestinationsConfigured",
    "redactedEvidenceLabelsRecorded",
    "ciProviderEnvironmentArtifactsCaptured"
  ];
  readonly redactedArtifactField: "redactedHandoffArtifactPath";
}

export const providerEnvironmentRuntimeSurfaces: readonly ProviderEnvironmentSurface[] = [
  "web",
  "dashboard",
  "database",
  "storage",
  "mobile",
  "observability",
  "ci_cd"
] as const;

export const providerEnvironmentRuntimeArtifactPaths = [
  "coverage/provider-environment-runtime.json",
  "coverage/provider-environment-verifier.json",
  "coverage/provider-web-dashboard-smoke-redacted.json",
  "coverage/provider-database-migration-dry-run-redacted.json",
  "coverage/provider-storage-private-acl-redacted.json",
  "coverage/provider-mobile-eas-preview-redacted.json",
  "coverage/provider-sentry-release-smoke-redacted.json",
  "coverage/provider-github-environment-protection-redacted.json",
  "coverage/provider-secret-store-destinations-redacted.json",
  "coverage/provider-redacted-handoff-labels.json",
  "coverage/provider-environment-ci-run-redacted.json",
  "test-results/provider-environment-runtime"
] as const;

export const providerEnvironmentRuntimeCommands = [
  "pnpm deploy:verify-provider-envs",
  "pnpm deploy:check-env:strict",
  "provider web/dashboard route smoke",
  "provider database migration dry-run",
  "provider storage private ACL smoke",
  "eas build --profile preview",
  "sentry release/source-map smoke",
  "github environment protection audit"
] as const;

export const providerEnvironmentRuntimeMatrix: readonly ProviderEnvironmentRuntimeMatrixEntry[] = [
  {
    id: "manifest-verifier",
    command: "pnpm deploy:verify-provider-envs",
    artifact: "coverage/provider-environment-verifier.json",
    status: "wired"
  },
  {
    id: "strict-env-secret-store",
    command: "pnpm deploy:check-env:strict and verify provider secret-store destinations",
    artifact: "coverage/provider-secret-store-destinations-redacted.json",
    status: "secret-store-gated"
  },
  {
    id: "web-dashboard-smoke",
    command: "provider web/dashboard route smoke",
    artifact: "coverage/provider-web-dashboard-smoke-redacted.json",
    status: "provider-gated"
  },
  {
    id: "database-storage-smoke",
    command: "provider database migration dry-run and storage private ACL smoke",
    artifact: "coverage/provider-storage-private-acl-redacted.json",
    status: "provider-gated"
  },
  {
    id: "mobile-observability-smoke",
    command: "eas build --profile preview and sentry release/source-map smoke",
    artifact: "coverage/provider-sentry-release-smoke-redacted.json",
    status: "provider-gated"
  },
  {
    id: "github-environment-protections",
    command: "github environment protection audit",
    artifact: "coverage/provider-github-environment-protection-redacted.json",
    status: "ci-gated"
  },
  {
    id: "redacted-handoff-ci",
    command: "record redacted evidence labels and CI provider environment artifact",
    artifact: "coverage/provider-environment-ci-run-redacted.json",
    status: "ci-gated"
  }
];

export const providerEnvironmentRunPersistenceContract: ProviderEnvironmentRunPersistenceContract = {
  prismaModel: "ProviderEnvironmentRun",
  tenantRelation: "providerEnvironmentRuns",
  uniqueKey: ["tenantId", "runId"],
  jsonFields: ["environmentMatrix", "surfaceMatrix", "artifactManifest"],
  requiredBooleanProofs: [
    "verifierPassed",
    "strictEnvCheckPassed",
    "previewProvisioned",
    "stagingProvisioned",
    "productionProvisioned",
    "webDashboardSmokePassed",
    "databaseMigrationDryRunPassed",
    "storagePrivateAclSmokePassed",
    "mobilePreviewBuildPassed",
    "observabilitySourceMapSmokePassed",
    "githubEnvironmentProtectionsConfigured",
    "secretStoreDestinationsConfigured",
    "redactedEvidenceLabelsRecorded",
    "ciProviderEnvironmentArtifactsCaptured"
  ],
  redactedArtifactField: "redactedHandoffArtifactPath"
};

export const providerEnvironmentRuntimeReadiness = buildProviderEnvironmentRuntimeReadinessPlan({
  environments: [
    { name: "preview", requiredBeforeProduction: true, surfaces: [] },
    { name: "staging", requiredBeforeProduction: true, surfaces: [] },
    { name: "production", requiredBeforeProduction: true, surfaces: [] }
  ],
  verifierPassed: false,
  providerSmokeChecksPassed: false,
  githubEnvironmentProtectionsConfigured: false,
  secretStoreDestinationsConfigured: false,
  redactedEvidenceLabelsRecorded: false
});
