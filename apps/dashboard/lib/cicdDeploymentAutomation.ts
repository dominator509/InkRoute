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

export const cicdDeploymentAutomationProofFiles = [
  ".github/workflows/release-governance.yml",
  ".github/workflows/ci.yml",
  "packages/releases/package.json",
  "packages/releases/src/index.ts",
  "packages/releases/tests/release-governance-workflow.test.ts",
  "packages/db/prisma/schema.prisma",
  "apps/dashboard/lib/cicdDeploymentAutomation.ts",
  "apps/dashboard/app/deployment/page.tsx",
  "apps/dashboard/components/DeploymentReadinessActionPanel.tsx",
  "apps/dashboard/app/api/deployment/readiness/route.ts",
  "apps/dashboard/tests/deployment-readiness-route-static.test.ts",
  "apps/dashboard/tests/cicd-deployment-automation-static.test.ts",
  "DEPLOYMENT.md",
  "RELEASE_AND_AUTO_UPDATE_PLAN.md",
  ".env.example",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type CicdDeploymentAutomationEvidenceArtifact = (typeof cicdDeploymentAutomationArtifactPaths)[number];

export const cicdDeploymentAutomationRequiredExternalEvidence = [
  "protected GitHub environments and secrets",
  "enabled preview/staging/production deploy jobs",
  "Vercel deployments and Prisma migrate deploy smoke",
  "EAS update, Sentry artifact upload, and Search Console release step smoke",
  "ReleaseRecord CI-result live write proof",
  "live workflow dispatch proof and CI artifact attachment",
] as const;

export interface CicdDeploymentAutomationExecutionPlan {
  readonly id: "gap-089-cicd-deployment-automation";
  readonly protectedEnvironmentMutationAllowed: false;
  readonly providerDeploymentAllowed: false;
  readonly liveWorkflowDispatchAllowed: false;
  readonly policy: CicdDeploymentAutomationExecutionPolicy;
  readonly source: "local-software-plan";
  readonly requiredCommands: typeof cicdDeploymentAutomationCommands;
  readonly requiredArtifacts: typeof cicdDeploymentAutomationArtifactPaths;
  readonly localContractArtifacts: readonly CicdDeploymentAutomationEvidenceArtifact[];
  readonly providerArtifacts: readonly CicdDeploymentAutomationEvidenceArtifact[];
  readonly databaseArtifacts: readonly CicdDeploymentAutomationEvidenceArtifact[];
  readonly workflowArtifacts: readonly CicdDeploymentAutomationEvidenceArtifact[];
  readonly externalEvidenceRequired: typeof cicdDeploymentAutomationRequiredExternalEvidence;
}

export interface CicdDeploymentAutomationExecutionPolicy {
  readonly mutateProtectedEnvironments: false;
  readonly executeProviderDeployments: false;
  readonly dispatchLiveWorkflow: false;
  readonly executePrismaMigrateDeploy: false;
  readonly executeReleaseRecordWrite: false;
  readonly executeCi: false;
}

export interface CicdDeploymentAutomationArtifactReview {
  readonly artifactName: string;
  readonly safeToPersist: boolean;
  readonly redactedArtifact: unknown;
  readonly unsafeFindings: readonly string[];
  readonly requiredArtifactPath: CicdDeploymentAutomationEvidenceArtifact;
}

const cicdSensitiveKeyPattern =
  /(?:authorization|clientemail|clientsecret|cookie|credential|databaseurl|email|password|privatekey|secret|token)/i;
const cicdEmailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const cicdTokenPattern = /\b(?:bearer|eas|ghp|github_pat|sentry|sk|vercel|ya29)[A-Za-z0-9._:/-]{8,}\b/gi;

function redactCicdDeploymentArtifactValue(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (cicdSensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value.replace(cicdEmailPattern, "[REDACTED_EMAIL]").replace(cicdTokenPattern, "[REDACTED_TOKEN]");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactCicdDeploymentArtifactValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactCicdDeploymentArtifactValue(entryValue, entryKey)]),
    );
  }

  return value;
}

export function buildRedactedCicdDeploymentAutomationArtifact(artifact: unknown): unknown {
  return redactCicdDeploymentArtifactValue(artifact);
}

export const cicdDeploymentAutomationExecutionPolicy: CicdDeploymentAutomationExecutionPolicy = {
  mutateProtectedEnvironments: false,
  executeProviderDeployments: false,
  dispatchLiveWorkflow: false,
  executePrismaMigrateDeploy: false,
  executeReleaseRecordWrite: false,
  executeCi: false,
};

export function buildCicdDeploymentAutomationExecutionPlan(): CicdDeploymentAutomationExecutionPlan {
  return {
    id: "gap-089-cicd-deployment-automation",
    protectedEnvironmentMutationAllowed: false,
    providerDeploymentAllowed: false,
    liveWorkflowDispatchAllowed: false,
    policy: cicdDeploymentAutomationExecutionPolicy,
    source: "local-software-plan",
    requiredCommands: cicdDeploymentAutomationCommands,
    requiredArtifacts: cicdDeploymentAutomationArtifactPaths,
    localContractArtifacts: ["coverage/cicd-deployment-automation.json", "coverage/cicd-prisma-migrate-dry-run.json"],
    providerArtifacts: [
      "coverage/cicd-protected-environments-redacted.json",
      "coverage/cicd-vercel-deploy-smoke.json",
      "coverage/cicd-eas-update-publish-redacted.json",
      "coverage/cicd-sentry-artifact-upload-redacted.json",
      "coverage/cicd-search-console-submission-redacted.json",
    ],
    databaseArtifacts: ["coverage/cicd-release-record-result-write.json"],
    workflowArtifacts: ["coverage/cicd-live-workflow-dispatch-redacted.json"],
    externalEvidenceRequired: cicdDeploymentAutomationRequiredExternalEvidence,
  };
}

export function buildCicdDeploymentAutomationArtifactReview(
  artifactName: string,
  artifact: unknown,
  requiredArtifactPath: CicdDeploymentAutomationEvidenceArtifact = "coverage/cicd-live-workflow-dispatch-redacted.json",
): CicdDeploymentAutomationArtifactReview {
  const redactedArtifact = buildRedactedCicdDeploymentAutomationArtifact(artifact);
  const serialized = JSON.stringify(redactedArtifact);
  const unsafeFindings = [
    serialized.match(cicdEmailPattern) ? "email" : null,
    serialized.match(cicdTokenPattern) ? "provider-token" : null,
  ].filter((finding): finding is string => finding !== null);

  return {
    artifactName,
    safeToPersist: unsafeFindings.length === 0,
    redactedArtifact,
    unsafeFindings,
    requiredArtifactPath,
  };
}

export const cicdDeploymentAutomationCommands = [
  "pnpm --filter @inkroute/releases typecheck",
  "pnpm --filter @inkroute/releases test",
  "pnpm vitest run packages/releases/tests/release-governance-workflow.test.ts apps/dashboard/tests/cicd-deployment-automation-static.test.ts",
  "release-governance workflow_dispatch dry run",
  "Vercel preview/staging/production deploy smoke",
  "Prisma migrate dry-run/deploy smoke",
  "Sentry/Search Console release step smoke",
] as const;

export interface CicdDeploymentAutomationEvidenceInput {
  readonly releasesTypecheckPassed: boolean;
  readonly releasesTestsPassed: boolean;
  readonly workflowSourceTestsPassed: boolean;
  readonly protectedGithubEnvironmentsConfigured: boolean;
  readonly githubSecretsConfigured: boolean;
  readonly deployJobsEnabled: boolean;
  readonly vercelDeploySmokePassed: boolean;
  readonly prismaMigrateDryRunPassed: boolean;
  readonly prismaMigrateDeployPassed: boolean;
  readonly easUpdatePublishPassed: boolean;
  readonly sentryArtifactUploadPassed: boolean;
  readonly searchConsoleSubmissionPassed: boolean;
  readonly releaseRecordCiResultWriteVerified: boolean;
  readonly liveWorkflowDispatchProofCaptured: boolean;
  readonly ciArtifactsAttached: boolean;
  readonly capturedArtifacts: readonly CicdDeploymentAutomationEvidenceArtifact[];
}

export interface CicdDeploymentAutomationEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly CicdDeploymentAutomationEvidenceArtifact[];
  readonly requiredCommands: typeof cicdDeploymentAutomationCommands;
  readonly requiredEvidence: typeof cicdDeploymentAutomationDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export const cicdDeploymentAutomationDecisionRequiredEvidence = [
  "release package and release-governance workflow source test artifacts",
  "protected GitHub environment, redacted secret, and enabled deploy job evidence",
  "Vercel, Prisma, EAS, Sentry, Search Console, and ReleaseRecord CI-result write artifacts",
  "live workflow dispatch proof and CI artifact attachment evidence",
] as const;

export function buildCicdDeploymentAutomationEvidenceDecision(input: CicdDeploymentAutomationEvidenceInput): CicdDeploymentAutomationEvidenceDecision {
  const blockers = [
    !input.releasesTypecheckPassed ? "@inkroute/releases typecheck evidence is required." : null,
    !input.releasesTestsPassed ? "@inkroute/releases test evidence is required." : null,
    !input.workflowSourceTestsPassed ? "Release-governance workflow source test evidence is required." : null,
    !input.protectedGithubEnvironmentsConfigured ? "Protected GitHub environment evidence is required." : null,
    !input.githubSecretsConfigured ? "Redacted GitHub environment/repository secret evidence is required." : null,
    !input.deployJobsEnabled ? "Preview/staging/production deploy job enablement evidence is required." : null,
    !input.vercelDeploySmokePassed ? "Vercel preview/staging/production deploy smoke evidence is required." : null,
    !input.prismaMigrateDryRunPassed ? "Prisma migration dry-run evidence is required." : null,
    !input.prismaMigrateDeployPassed ? "Prisma migrate deploy safety-gated evidence is required." : null,
    !input.easUpdatePublishPassed ? "EAS update publish evidence is required." : null,
    !input.sentryArtifactUploadPassed ? "Sentry source-map/artifact upload evidence is required." : null,
    !input.searchConsoleSubmissionPassed ? "Search Console sitemap submission evidence is required." : null,
    !input.releaseRecordCiResultWriteVerified ? "ReleaseRecord CI-result write evidence is required." : null,
    !input.liveWorkflowDispatchProofCaptured ? "Live release-governance workflow dispatch proof is required." : null,
    !input.ciArtifactsAttached ? "CI/CD deployment automation artifact attachment evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = cicdDeploymentAutomationArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: cicdDeploymentAutomationCommands,
    requiredEvidence: cicdDeploymentAutomationDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-089 CI/CD deployment automation evidence is complete with CI-safe redacted provider artifacts captured."
        : "GAP-089 CI/CD deployment automation evidence remains blocked until protected environments, secrets, enabled deploy jobs, provider execution, ReleaseRecord writes, live dispatch, and CI artifacts are captured.",
  };
}

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


