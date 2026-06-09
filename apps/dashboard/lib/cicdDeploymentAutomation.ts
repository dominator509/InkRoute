import { buildCicdDeploymentAutomationReadinessPlan } from "@inkroute/releases";

export const cicdDeploymentAutomationArtifactPaths = [
  "coverage/cicd-deployment-automation.json",
  "coverage/cicd-protected-environments-redacted.json",
  "coverage/cicd-vercel-deploy-smoke.json",
  "coverage/cicd-prisma-migrate-dry-run.json",
  "coverage/cicd-eas-update-publish-redacted.json",
  "coverage/cicd-sentry-artifact-upload-redacted.json",
  "coverage/cicd-search-console-submission-redacted.json",
  "coverage/cicd-release-record-result-write.json",
  "coverage/cicd-live-workflow-dispatch-redacted.json",
  "test-results/cicd-deployment-automation",
] as const;

export const cicdDeploymentAutomationCommands = [
  "pnpm --filter @inkroute/releases typecheck",
  "pnpm --filter @inkroute/releases test",
  "pnpm vitest run packages/releases/tests/release-governance-workflow.test.ts apps/dashboard/tests/cicd-deployment-automation-static.test.ts",
  "release-governance workflow_dispatch dry run",
  "Vercel preview/staging/production deploy smoke",
  "Prisma migrate dry-run/deploy smoke",
  "Sentry/Search Console release step smoke",
] as const;

export function buildReleaseRecordCiResultMetadata(input: {
  workflowRunId?: string | null;
  workflowRunUrl?: string | null;
  releaseVersion?: string | null;
  releaseChannel?: string | null;
  commitSha?: string | null;
  status: "requested" | "blocked" | "dry_run" | "succeeded" | "failed";
}) {
  return {
    provider: "github-actions" as const,
    workflow: ".github/workflows/release-governance.yml",
    workflowRunId: input.workflowRunId ?? null,
    workflowRunUrl: input.workflowRunUrl ?? null,
    releaseVersion: input.releaseVersion ?? null,
    releaseChannel: input.releaseChannel ?? null,
    commitSha: input.commitSha ?? null,
    status: input.status,
    rawSecretsStored: false,
    artifactPaths: cicdDeploymentAutomationArtifactPaths,
  };
}

export function buildReleaseRecordCiResultWritePlan(input: {
  releaseRecordId?: string | null;
  workflowRunId?: string | null;
  workflowRunUrl?: string | null;
  status: "requested" | "blocked" | "dry_run" | "succeeded" | "failed";
}) {
  return {
    targetModel: "ReleaseRecord" as const,
    releaseRecordId: input.releaseRecordId ?? null,
    updateFields: {
      ciWorkflowRunId: input.workflowRunId ?? null,
      ciWorkflowRunUrl: input.workflowRunUrl ?? null,
      ciStatus: input.status,
      ciCompletedAt: input.status === "succeeded" || input.status === "failed" ? "workflow-completion-timestamp" : null,
    },
    auditAction: "release_record:ci_result:update" as const,
    idempotencyKey: input.workflowRunId ? `release-ci-result:${input.workflowRunId}` : null,
    rawSecretsStored: false,
    artifact: "coverage/cicd-release-record-result-write.json",
  };
}

export function buildDeploymentProviderGateMatrix() {
  return [
    { id: "protected-github-environments", provider: "github", required: ["preview", "staging", "production"], enabled: false },
    { id: "vercel-web-dashboard-deploy", provider: "vercel", required: ["VERCEL_TOKEN", "VERCEL_ORG_ID", "VERCEL_PROJECT_ID"], enabled: false },
    { id: "prisma-migrate-deploy", provider: "postgres", required: ["DATABASE_URL"], enabled: false },
    { id: "eas-update-publish", provider: "expo", required: ["EXPO_TOKEN", "EAS_PROJECT_ID"], enabled: false },
    { id: "sentry-artifact-upload", provider: "sentry", required: ["SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT"], enabled: false },
    { id: "search-console-submission", provider: "google", required: ["SEARCH_CONSOLE_CLIENT_EMAIL", "SEARCH_CONSOLE_PRIVATE_KEY"], enabled: false },
    { id: "release-record-ci-result-write", provider: "database", required: ["DATABASE_URL"], enabled: true },
  ] as const;
}

export function buildCicdDeploymentAutomationContract() {
  return buildCicdDeploymentAutomationReadinessPlan({
    packageScripts: ["test", "typecheck"],
    releasesTestsPassed: false,
    releasesTypecheckPassed: false,
    workflowSourceTestsPassed: false,
    protectedGithubEnvironmentsConfigured: false,
    githubSecretsConfigured: false,
    previewDeployJobEnabled: false,
    stagingDeployJobEnabled: false,
    productionDeployJobEnabled: false,
    vercelDeployConfigured: false,
    prismaDryRunConfigured: true,
    prismaMigrateDeployConfigured: false,
    easUpdatePublishConfigured: false,
    sentryArtifactUploadConfigured: false,
    searchConsoleSubmissionConfigured: false,
    ciPrerequisiteChecksRequired: true,
    releaseRecordCiResultWritesConfigured: true,
    noSecretLiteralsVerified: true,
    liveWorkflowDispatchProofCaptured: false,
  });
}

export const cicdDeploymentAutomationContract = buildCicdDeploymentAutomationContract();
