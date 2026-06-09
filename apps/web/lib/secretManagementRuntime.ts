import { buildSecretManagementRuntimeReadinessPlan } from "@inkroute/deployment";

export type SecretManagementRuntimeStatus =
  | "wired"
  | "secret-store-gated"
  | "rotation-gated"
  | "scan-gated"
  | "ci-gated";

export interface SecretManagementRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: SecretManagementRuntimeStatus;
}

export const secretManagementRequiredProductionSecretNames = [
  "DATABASE_URL",
  "DIRECT_URL",
  "AUTH_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SENTRY_AUTH_TOKEN",
  "VERCEL_TOKEN",
  "VERCEL_ORG_ID",
  "VERCEL_WEB_PROJECT_ID",
  "VERCEL_DASHBOARD_PROJECT_ID",
  "CSRF_SECRET",
  "SECURITY_ENCRYPTION_PRIMARY_KEY",
  "EAS_PROJECT_ID"
] as const;

export const secretManagementRuntimeArtifactPaths = [
  "coverage/secret-management-runtime.json",
  "coverage/secret-management-verifier.json",
  "coverage/secret-strict-env-check-redacted.json",
  "coverage/secret-provider-store-destinations-redacted.json",
  "coverage/secret-masked-ci-logs-redacted.json",
  "coverage/secret-provider-audit-logs-redacted.json",
  "coverage/secret-rotation-policy.json",
  "coverage/secret-incident-rotation-tabletop.md",
  "coverage/secret-committed-scan.json",
  "coverage/secret-management-ci-run-redacted.json",
  "test-results/secret-management-runtime"
] as const;

export const secretManagementRuntimeCommands = [
  "pnpm deploy:verify-secrets",
  "pnpm deploy:check-env:strict",
  "committed secret scan",
  "provider secret-store audit",
  "masked CI log review",
  "incident rotation tabletop"
] as const;

export const secretManagementRuntimeMatrix: readonly SecretManagementRuntimeMatrixEntry[] = [
  {
    id: "secret-audit-verifier",
    command: "pnpm deploy:verify-secrets",
    artifact: "coverage/secret-management-verifier.json",
    status: "wired"
  },
  {
    id: "strict-env-real-secrets",
    command: "pnpm deploy:check-env:strict",
    artifact: "coverage/secret-strict-env-check-redacted.json",
    status: "secret-store-gated"
  },
  {
    id: "provider-secret-stores",
    command: "provider secret-store audit",
    artifact: "coverage/secret-provider-store-destinations-redacted.json",
    status: "secret-store-gated"
  },
  {
    id: "masked-ci-provider-audit",
    command: "masked CI log review and provider audit-log capture",
    artifact: "coverage/secret-masked-ci-logs-redacted.json",
    status: "ci-gated"
  },
  {
    id: "rotation-incident-process",
    command: "incident rotation tabletop",
    artifact: "coverage/secret-incident-rotation-tabletop.md",
    status: "rotation-gated"
  },
  {
    id: "committed-secret-scan",
    command: "committed secret scan",
    artifact: "coverage/secret-committed-scan.json",
    status: "scan-gated"
  },
  {
    id: "ci-secret-management-artifacts",
    command: "GitHub Actions secret-management artifact capture",
    artifact: "coverage/secret-management-ci-run-redacted.json",
    status: "ci-gated"
  }
];

export const secretManagementRuntimeReadiness = buildSecretManagementRuntimeReadinessPlan({
  requiredProductionSecretNames: secretManagementRequiredProductionSecretNames,
  auditItems: [],
  rotationPolicy: {
    defaultCadenceDays: 90,
    incidentRotationHours: 4,
    requiresDualControlForProduction: true,
    requiresMaskedCiLogProof: true,
    requiresProviderAuditLogReference: true
  },
  verifierPassed: false,
  strictEnvironmentCheckPassed: false,
  providerSecretStoresConfigured: false,
  maskedCiLogsCaptured: false,
  providerAuditLogsCaptured: false,
  committedSecretScanPassed: false,
  incidentRotationProcessDocumented: false
});
