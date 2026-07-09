import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildCicdDeploymentAutomationArtifactReview,
  buildCicdDeploymentAutomationEvidenceDecision,
  buildCicdDeploymentAutomationContract,
  buildCicdDeploymentAutomationExecutionPlan,
  buildDeploymentProviderGateMatrix,
  buildRedactedCicdDeploymentAutomationArtifact,
  buildReleaseRecordCiResultMetadata,
  buildReleaseRecordCiResultWritePlan,
  cicdDeploymentAutomationArtifactPaths,
  cicdDeploymentAutomationCommands,
  cicdDeploymentAutomationDecisionRequiredEvidence,
  cicdDeploymentAutomationExecutionPolicy,
  cicdDeploymentAutomationProofFiles,
  cicdDeploymentAutomationRequiredExternalEvidence,
} from "../lib/cicdDeploymentAutomation";

const root = join(__dirname, "..", "..");
const workflow = readFileSync(join(root, ".github/workflows/release-governance.yml"), "utf8");
const ci = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const deploymentPage = readFileSync(join(root, "apps/dashboard/app/deployment/page.tsx"), "utf8");
const deploymentActionPanel = readFileSync(join(root, "apps/dashboard/components/DeploymentReadinessActionPanel.tsx"), "utf8");
const route = readFileSync(join(root, "apps/dashboard/app/api/deployment/readiness/route.ts"), "utf8");
const schema = readFileSync(join(root, "packages/db/prisma/schema.prisma"), "utf8");
const tracker = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");

describe("CI/CD deployment automation contract", () => {
  it("tracks deployment provider gates and redacted artifacts", () => {
    expect(buildDeploymentProviderGateMatrix().map((gate) => gate.id)).toEqual(
      expect.arrayContaining([
        "protected-github-environments",
        "vercel-web-dashboard-deploy",
        "prisma-migrate-deploy",
        "eas-update-publish",
        "sentry-artifact-upload",
        "search-console-submission",
        "release-record-ci-result-write",
      ]),
    );
    expect(cicdDeploymentAutomationArtifactPaths).toContain("coverage/cicd-release-record-result-write.json");
    expect(cicdDeploymentAutomationArtifactPaths).toContain("coverage/cicd-live-workflow-dispatch-redacted.json");
  });

  it("builds ReleaseRecord CI-result metadata without storing secrets", () => {
    expect(buildReleaseRecordCiResultMetadata({ workflowRunId: "123", releaseVersion: "1.2.3", releaseChannel: "preview", status: "dry_run" })).toMatchObject({
      provider: "github-actions",
      workflow: ".github/workflows/release-governance.yml",
      workflowRunId: "123",
      releaseVersion: "1.2.3",
      releaseChannel: "preview",
      status: "dry_run",
      rawSecretsStored: false,
    });
    expect(buildReleaseRecordCiResultWritePlan({ releaseRecordId: "rel_1", workflowRunId: "123", workflowRunUrl: "https://github.example/run/123", status: "succeeded" })).toMatchObject({
      targetModel: "ReleaseRecord",
      releaseRecordId: "rel_1",
      updateFields: {
        ciWorkflowRunId: "123",
        ciWorkflowRunUrl: "https://github.example/run/123",
        ciStatus: "succeeded",
        ciCompletedAt: "workflow-completion-timestamp",
      },
      auditAction: "release_record:ci_result:update",
      idempotencyKey: "release-ci-result:123",
      rawSecretsStored: false,
    });
    expect(schema).toContain("ciWorkflowRunId  String?");
    expect(schema).toContain("ciWorkflowRunUrl String?");
    expect(schema).toContain("ciStatus        String?");
    expect(schema).toContain("@@index([ciWorkflowRunId])");
  });

  it("keeps workflow dispatchable but provider deploy jobs disabled and environment-gated", () => {
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("environment: preview");
    expect(workflow).toContain("environment: staging");
    expect(workflow).toContain("environment: production");
    expect(workflow).toContain("if: ${{ false }}");
    expect(workflow).toContain("ReleaseRecord CI result write contract");
    expect(workflow).toContain("ciWorkflowRunId");
    expect(workflow).toContain("ciWorkflowRunUrl");
    expect(workflow).toContain("ciStatus");
    expect(workflow).toContain("Sentry release artifacts");
    expect(workflow).toContain("Search Console submission");
    expect(workflow).not.toMatch(/sk_live_|ghp_|gho_|vercel_[A-Za-z0-9]/);
  });

  it("wires dashboard deployment readiness audit metadata to CI/CD result persistence", () => {
    expect(route).toContain("buildReleaseRecordCiResultMetadata");
    expect(route).toContain("buildReleaseRecordCiResultWritePlan");
    expect(route).toContain("buildCicdDeploymentAutomationContract");
    expect(route).toContain("buildDeploymentProviderGateMatrix");
    expect(route).toContain("cicdDeploymentAutomationArtifactPaths");
    expect(route).toContain('action: `deployment:${input.operation}`');
    expect(route).toContain("Cache-Control");
    expect(route).toContain("PROVIDER_DEPLOYMENT_READINESS_NOT_CONFIGURED");
    expect(route).toContain("localDeploymentReadinessFallbackDisabled");
    expect(deploymentPage).toContain("DeploymentReadinessActionPanel");
    expect(deploymentActionPanel).toContain('fetch("/api/deployment/readiness"');
    expect(deploymentActionPanel).toContain('"readiness-review"');
  });

  it("pins current CI/CD deployment automation proof files for GAP-089", () => {
    expect(cicdDeploymentAutomationProofFiles).toEqual(
      expect.arrayContaining([
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
      ]),
    );
    for (const file of cicdDeploymentAutomationProofFiles) {
      expect(readFileSync(join(root, file), "utf8").length).toBeGreaterThan(0);
    }
  });

  it("keeps readiness blocked until real environments/secrets/live dispatch proof exist", () => {
    const contract = buildCicdDeploymentAutomationContract();

    expect(contract.status).toBe("blocked");
    expect(contract.blockers).toEqual(
      expect.arrayContaining([
        "GitHub preview, staging, and production protected environments must be configured.",
        "Required GitHub environment/repository secrets must be configured outside source control.",
        "Preview deployment job must be enabled after secrets and protected environments exist.",
        "Live release-governance workflow dispatch proof is required before closing GAP-089.",
      ]),
    );
    expect(cicdDeploymentAutomationCommands).toContain("release-governance workflow_dispatch dry run");
  });

  it("builds a local CI/CD execution plan without protected environment mutation, provider deployment, or live workflow dispatch", () => {
    const plan = buildCicdDeploymentAutomationExecutionPlan();

    expect(plan.id).toBe("gap-089-cicd-deployment-automation");
    expect(plan.protectedEnvironmentMutationAllowed).toBe(false);
    expect(plan.providerDeploymentAllowed).toBe(false);
    expect(plan.liveWorkflowDispatchAllowed).toBe(false);
    expect(plan.policy).toBe(cicdDeploymentAutomationExecutionPolicy);
    expect(plan.policy).toEqual({
      mutateProtectedEnvironments: false,
      executeProviderDeployments: false,
      dispatchLiveWorkflow: false,
      executePrismaMigrateDeploy: false,
      executeReleaseRecordWrite: false,
      executeCi: false,
    });
    expect(plan.requiredCommands).toBe(cicdDeploymentAutomationCommands);
    expect(plan.requiredArtifacts).toBe(cicdDeploymentAutomationArtifactPaths);
    expect(plan.localContractArtifacts).toEqual(["coverage/cicd-deployment-automation.json", "coverage/cicd-prisma-migrate-dry-run.json"]);
    expect(plan.providerArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/cicd-protected-environments-redacted.json",
        "coverage/cicd-vercel-deploy-smoke.json",
        "coverage/cicd-sentry-artifact-upload-redacted.json",
      ]),
    );
    expect(plan.databaseArtifacts).toEqual(["coverage/cicd-release-record-result-write.json"]);
    expect(plan.workflowArtifacts).toEqual(["coverage/cicd-live-workflow-dispatch-redacted.json"]);
    expect(plan.externalEvidenceRequired).toBe(cicdDeploymentAutomationRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toEqual([
      "protected GitHub environments and secrets",
      "enabled preview/staging/production deploy jobs",
      "Vercel deployments and Prisma migrate deploy smoke",
      "EAS update, Sentry artifact upload, and Search Console release step smoke",
      "ReleaseRecord CI-result live write proof",
      "live workflow dispatch proof and CI artifact attachment",
    ]);
  });

  it("redacts CI/CD provider artifacts before persistence", () => {
    const rawArtifact = {
      github: {
        token: "ghp_liveWorkflowDispatchToken",
        repository: "owner/private-release-repo",
        workflowRunId: "workflow_run_cicd_private",
        workflowRunUrl: "https://github.com/owner/private-release-repo/actions/runs/private",
        workflowDispatchId: "workflow_dispatch_private",
        commitSha: "abcdef0123456789abcdef0123456789abcdef01",
        actorEmail: "release@example.com",
      },
      vercel: {
        authorization: "Bearer vercel_deploy_secret",
        deploymentId: "vercel_deployment_private",
        deploymentUrl: "https://deployment-private.vercel.app",
      },
      release: {
        tenantId: "tenant_cicd_private",
        releaseRecordId: "release_record_cicd_private",
        releaseCandidateId: "release_candidate_cicd_private",
        auditId: "audit_cicd_private",
        idempotencyKey: "idem_cicd_private",
      },
      searchConsole: {
        clientEmail: "search-console@example.iam.gserviceaccount.com",
        privateKey: "-----BEGIN PRIVATE KEY-----secret-----END PRIVATE KEY-----",
      },
      status: "blocked",
    };

    const redacted = buildRedactedCicdDeploymentAutomationArtifact(rawArtifact);
    const review = buildCicdDeploymentAutomationArtifactReview("cicd-live-workflow-dispatch", rawArtifact);
    const serialized = JSON.stringify(review.redactedArtifact);

    expect(JSON.stringify(redacted)).not.toContain("ghp_liveWorkflowDispatchToken");
    expect(serialized).not.toContain("owner/private-release-repo");
    expect(serialized).not.toContain("workflow_run_cicd_private");
    expect(serialized).not.toContain("https://github.com/owner/private-release-repo/actions/runs/private");
    expect(serialized).not.toContain("workflow_dispatch_private");
    expect(serialized).not.toContain("abcdef0123456789abcdef0123456789abcdef01");
    expect(serialized).not.toContain("vercel_deployment_private");
    expect(serialized).not.toContain("https://deployment-private.vercel.app");
    expect(serialized).not.toContain("tenant_cicd_private");
    expect(serialized).not.toContain("release_record_cicd_private");
    expect(serialized).not.toContain("release_candidate_cicd_private");
    expect(serialized).not.toContain("audit_cicd_private");
    expect(serialized).not.toContain("idem_cicd_private");
    expect(serialized).not.toContain("release@example.com");
    expect(serialized).not.toContain("vercel_deploy_secret");
    expect(serialized).not.toContain("search-console@example.iam.gserviceaccount.com");
    expect(serialized).not.toContain("BEGIN PRIVATE KEY");
    expect(serialized).toContain("blocked");
    expect(review.safeToPersist).toBe(true);
    expect(review.unsafeFindings).toEqual([]);
    expect(review.requiredArtifactPath).toBe("coverage/cicd-live-workflow-dispatch-redacted.json");
  });

  it("classifies GAP-089 CI/CD deployment automation evidence as blocked until every provider proof is captured", () => {
    const blocked = buildCicdDeploymentAutomationEvidenceDecision({
      releasesTypecheckPassed: true,
      releasesTestsPassed: true,
      workflowSourceTestsPassed: true,
      protectedGithubEnvironmentsConfigured: false,
      githubSecretsConfigured: false,
      deployJobsEnabled: false,
      vercelDeploySmokePassed: false,
      prismaMigrateDryRunPassed: true,
      prismaMigrateDeployPassed: false,
      easUpdatePublishPassed: false,
      sentryArtifactUploadPassed: false,
      searchConsoleSubmissionPassed: false,
      releaseRecordCiResultWriteVerified: false,
      liveWorkflowDispatchProofCaptured: false,
      ciArtifactsAttached: false,
      capturedArtifacts: ["coverage/cicd-deployment-automation.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Protected GitHub environment evidence is required.",
        "Redacted GitHub environment/repository secret evidence is required.",
        "Preview/staging/production deploy job enablement evidence is required.",
        "Vercel preview/staging/production deploy smoke evidence is required.",
        "Live release-governance workflow dispatch proof is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/cicd-protected-environments-redacted.json");
    expect(blocked.requiredCommands).toBe(cicdDeploymentAutomationCommands);
    expect(blocked.requiredEvidence).toBe(cicdDeploymentAutomationDecisionRequiredEvidence);

    const complete = buildCicdDeploymentAutomationEvidenceDecision({
      releasesTypecheckPassed: true,
      releasesTestsPassed: true,
      workflowSourceTestsPassed: true,
      protectedGithubEnvironmentsConfigured: true,
      githubSecretsConfigured: true,
      deployJobsEnabled: true,
      vercelDeploySmokePassed: true,
      prismaMigrateDryRunPassed: true,
      prismaMigrateDeployPassed: true,
      easUpdatePublishPassed: true,
      sentryArtifactUploadPassed: true,
      searchConsoleSubmissionPassed: true,
      releaseRecordCiResultWriteVerified: true,
      liveWorkflowDispatchProofCaptured: true,
      ciArtifactsAttached: true,
      capturedArtifacts: cicdDeploymentAutomationArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.redactedSummary).toContain("CI-safe redacted provider artifacts captured");
  });

  it("is wired into CI and GAP-089 tracker evidence", () => {
    expect(ci).toContain("Run Phase 12 CI/CD deployment automation contracts");
    expect(ci).toContain("apps/dashboard/tests/cicd-deployment-automation-static.test.ts");
    expect(ci).toContain("cicd-deployment-automation-artifacts");
    expect(tracker).toContain("GAP-089");
    expect(tracker).toContain("apps/dashboard/lib/cicdDeploymentAutomation.ts");
    expect(tracker).toContain("ReleaseRecord CI-result fields");
    expect(tracker).toContain("CI/CD deployment automation evidence classifier wired and provider-gated");
    expect(tracker).toContain("live workflow dispatch proof");
  });
});
