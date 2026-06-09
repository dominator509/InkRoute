import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildCicdDeploymentAutomationContract,
  buildDeploymentProviderGateMatrix,
  buildReleaseRecordCiResultMetadata,
  buildReleaseRecordCiResultWritePlan,
  cicdDeploymentAutomationArtifactPaths,
  cicdDeploymentAutomationCommands,
} from "../lib/cicdDeploymentAutomation";

const root = join(__dirname, "..", "..");
const workflow = readFileSync(join(root, ".github/workflows/release-governance.yml"), "utf8");
const ci = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
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

  it("is wired into CI and GAP-089 tracker evidence", () => {
    expect(ci).toContain("Run Phase 12 CI/CD deployment automation contracts");
    expect(ci).toContain("apps/dashboard/tests/cicd-deployment-automation-static.test.ts");
    expect(ci).toContain("cicd-deployment-automation-artifacts");
    expect(tracker).toContain("GAP-089");
    expect(tracker).toContain("apps/dashboard/lib/cicdDeploymentAutomation.ts");
    expect(tracker).toContain("ReleaseRecord CI-result fields");
    expect(tracker).toContain("live workflow dispatch proof remains open");
  });
});
