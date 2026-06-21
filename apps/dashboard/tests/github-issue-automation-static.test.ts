import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildGithubIssueAutomationArtifactReview,
  buildGithubIssueAutomationEvidenceDecision,
  buildGithubIssueAutomationExecutionPlan,
  buildGithubIssueLinkMetadata,
  buildRedactedGithubIssueAutomationArtifact,
  githubIssueAutomationArtifactPaths,
  githubIssueAutomationCommands,
  githubIssueAutomationExecutionPolicy,
  githubIssueAutomationProofFiles,
  githubIssueAutomationRequiredExternalEvidence,
  githubIssueAutomationRequiredEvidence,
} from "../app/api/observability/github-issues/route";

const root = join(__dirname, "..", "..");
const routeSource = readFileSync(join(root, "apps/dashboard/app/api/observability/github-issues/route.ts"), "utf8");
const errorsPageSource = readFileSync(join(root, "apps/dashboard/app/errors/page.tsx"), "utf8");
const errorAutomationActionPanelSource = readFileSync(join(root, "apps/dashboard/components/ErrorAutomationActionPanel.tsx"), "utf8");
const workflowSource = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const trackerSource = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");
const unitManifest = readFileSync(join(root, "testing/manifests/unit-test-manifest.json"), "utf8");
const rootPackageJson = readFileSync(join(root, "package.json"), "utf8");
const evidenceWriterSource = readFileSync(join(root, "scripts/observability/write-github-issue-automation-evidence.mjs"), "utf8");
const prismaSchema = readFileSync(join(root, "packages/db/prisma/schema.prisma"), "utf8");
const githubIssueLinkMigration = readFileSync(
  join(root, "packages/db/prisma/migrations/20260613000500_add_github_issue_links/migration.sql"),
  "utf8",
);

describe("GitHub issue automation runtime contract", () => {
  it("requires dashboard RBAC, tenant matching, and explicit human approval", () => {
    expect(routeSource).toContain("resolveDashboardActor");
    expect(routeSource).toContain('assertPermission(actor, "error:write")');
    expect(routeSource).toContain("TENANT_MISMATCH");
    expect(routeSource).toContain("HUMAN_APPROVAL_REQUIRED");
    expect(routeSource).toContain("humanApproved === true");
  });

  it("builds sanitized issue automation plans and blocks high-risk payloads through package contracts", () => {
    expect(routeSource).toContain("buildGithubIssueAutomationPlan");
    expect(routeSource).toContain("buildGithubIssueRuntimeDispatchPlan");
    expect(routeSource).toContain("sanitizedIssueBodyVerified: true");
    expect(routeSource).toContain("highRiskDashboardOnlyBlockingVerified: true");
    expect(routeSource).toContain("createIssueRequest");
  });

  it("stores human approval audit metadata and ErrorReport issue-link state", () => {
    expect(routeSource).toContain("prisma.$transaction");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain('entityType: "GithubIssueAutomation"');
    expect(routeSource).toContain("tx.errorReport.update");
    expect(routeSource).toContain("persistGithubIssueLinkToErrorReport");
    expect(routeSource).toContain("buildGithubIssueLinkMetadata");
    expect(routeSource).toContain("repository.githubIssueLink.upsert");
    expect(routeSource).toContain("repository.errorReport.update");
    expect(routeSource).toContain("githubIssueAutomation");
    expect(routeSource).toContain("dashboardStatusSynced: true");
    expect(routeSource).toContain("rawProviderPayloadStored: false");
    expect(routeSource).toContain("providerDispatchExecuted");
    expect(routeSource).toContain("PROVIDER_GITHUB_ISSUE_ERROR_REPORT_LINK_NOT_CONFIGURED");
    expect(routeSource).toContain("syntheticGithubIssueReportFallbackDisabled");
    expect(routeSource).toContain('runtimePlan.status !== "ready"');
    expect(routeSource).toContain("GITHUB_ISSUE_RUNTIME_EVIDENCE_NOT_CONFIGURED");
    expect(routeSource).toContain("githubIssueProviderDispatchEvidenceRequired");
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("headers: noStoreHeaders");
    expect(routeSource).not.toContain('headers: { "Cache-Control": "no-store" }');
  });

  it("pins the GithubIssueLink durable dashboard status schema and migration", () => {
    expect(prismaSchema).toContain("model GithubIssueLink");
    expect(prismaSchema).toContain("errorReportId            String      @unique");
    expect(prismaSchema).toContain("approvalAuditLogId       String");
    expect(prismaSchema).toContain("dashboardStatusSynced    Boolean");
    expect(prismaSchema).toContain("providerDispatchExecuted Boolean");
    expect(prismaSchema).toContain("rawProviderPayloadStored Boolean");
    expect(prismaSchema).toContain("githubIssueLinks GithubIssueLink[]");
    expect(prismaSchema).toContain("githubIssueLink GithubIssueLink?");
    expect(githubIssueLinkMigration).toContain('CREATE TABLE "GithubIssueLink"');
    expect(githubIssueLinkMigration).toContain('"GithubIssueLink_errorReportId_key"');
    expect(githubIssueLinkMigration).toContain('"GithubIssueLink_provider_repository_issueNumber_key"');
    expect(githubIssueLinkMigration).toContain('FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE');
    expect(githubIssueLinkMigration).toContain('FOREIGN KEY ("errorReportId") REFERENCES "ErrorReport"("id") ON DELETE CASCADE');
  });

  it("builds redacted ErrorReport issue-link metadata while preserving existing metadata", () => {
    const metadata = buildGithubIssueLinkMetadata({
      errorReportId: "err_static",
      approvalAuditLogId: "audit_static",
      dispatchState: "provider-dispatched",
      issueUrl: "https://github.com/example/repo/issues/123",
      issueNumber: 123,
      repository: "example/repo",
      reportFingerprint: "fp_static",
      existingMetadata: {
        retained: true,
        githubIssueAutomation: {
          issueRequestPrepared: true,
        },
      },
    });

    expect(metadata).toMatchObject({
      retained: true,
      githubIssueAutomation: {
        issueRequestPrepared: true,
        status: "provider-dispatched",
        approvalAuditLogId: "audit_static",
        issueUrl: "https://github.com/example/repo/issues/123",
        issueNumber: 123,
        repository: "example/repo",
        reportFingerprint: "fp_static",
        dashboardStatusSynced: true,
        providerDispatchExecuted: true,
        rawProviderPayloadStored: false,
      },
    });
  });

  it("wires GitHub API dispatch behind provider credentials and an explicit enable flag", () => {
    expect(routeSource).toContain("GITHUB_ISSUE_TOKEN");
    expect(routeSource).toContain("GITHUB_TOKEN");
    expect(routeSource).toContain("GITHUB_REPOSITORY");
    expect(routeSource).toContain("GITHUB_ISSUE_DISPATCH_ENABLED");
    expect(routeSource).toContain("https://api.github.com/repos/");
    expect(routeSource).toContain("liveSyntheticIssueCreationVerified: false");
  });

  it("renders a dashboard approval form without enabling provider dispatch", () => {
    expect(errorsPageSource).toContain("ErrorAutomationActionPanel");
    expect(errorAutomationActionPanelSource).toContain('fetch("/api/observability/github-issues"');
    expect(errorAutomationActionPanelSource).toContain("humanApproved: true");
    expect(errorsPageSource).toContain('data-provider-dispatch="credential-gated"');
    expect(errorAutomationActionPanelSource).toContain("Create sanitized issue draft");
    expect(errorAutomationActionPanelSource).toContain("Live dispatch, Sentry links, trace replay, screenshots, and provider-backed evidence remain gated.");
    expect(errorsPageSource).toContain("GITHUB_ISSUE_DISPATCH_ENABLED");
  });

  it("pins the GitHub issue automation command and artifact matrix", () => {
    expect(routeSource).toContain("githubIssueAutomationCommands");
    expect(routeSource).toContain("githubIssueAutomationRuntimeMatrix");
    for (const id of [
      "dashboard-approval-ui",
      "local-evidence-writer",
      "provider-credentials",
      "human-approval-audit",
      "create-request-redaction",
      "errorreport-link",
      "dashboard-status-sync",
      "live-dispatch",
      "no-pii-artifact-audit",
      "ci-github-issue-automation",
      "secret-safe-artifacts",
    ]) {
      expect(routeSource).toContain(`id: "${id}"`);
    }
  });

  it("builds a local execution plan without provider dispatch, live GitHub API, or migration execution", () => {
    const plan = buildGithubIssueAutomationExecutionPlan();

    expect(plan.id).toBe("gap-085-github-issue-automation");
    expect(plan.providerDispatchAllowed).toBe(false);
    expect(plan.liveGithubApiAllowed).toBe(false);
    expect(plan.migrationExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(githubIssueAutomationExecutionPolicy);
    expect(plan.policy).toEqual({
      executeProviderDispatch: false,
      executeLiveGithubApi: false,
      executeMigration: false,
      executeDbBackedApprovalSmoke: false,
      executeDbBackedStatusAdapterSmoke: false,
      executeNoPiiAudit: false,
      executeCi: false,
    });
    expect(plan.requiredCommands).toBe(githubIssueAutomationCommands);
    expect(plan.requiredArtifacts).toBe(githubIssueAutomationArtifactPaths);
    expect(plan.requiredEvidence).toBe(githubIssueAutomationRequiredEvidence);
    expect(plan.localEvidenceArtifacts).toEqual(
      expect.arrayContaining(["coverage/github-issue-route-static-contract.json", "coverage/github-issue-create-request-redacted.json"]),
    );
    expect(plan.persistenceArtifacts).toEqual(
      expect.arrayContaining(["coverage/github-issue-human-approval-audit.json", "coverage/github-issue-errorreport-link.json"]),
    );
    expect(plan.providerArtifacts).toEqual([
      "coverage/github-issue-provider-credentials-redacted.json",
      "coverage/github-issue-live-dispatch-redacted.json",
    ]);
    expect(plan.privacyArtifacts).toEqual(["coverage/github-issue-no-pii-artifact-audit.json"]);
    expect(plan.secretSafeArtifactPath).toBe("coverage/github-issue-secret-safe-artifacts.json");
    expect(plan.externalEvidenceRequired).toBe(githubIssueAutomationRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toEqual([
      "GithubIssueLink migration applied in a non-production database",
      "DB-backed human approval AuditLog persistence smoke",
      "DB-backed GithubIssueLink and ErrorReport status adapter execution smoke",
      "redacted live GitHub provider credentials",
      "live synthetic GitHub issue creation proof, CI evidence, and provider-backed secret-safe artifacts",
    ]);
  });

  it("redacts GitHub issue automation artifacts before persistence", () => {
    const rawArtifact = {
      provider: {
        authorization: "Bearer ghp_liveGithubIssueToken",
        repository: "owner/repo",
      },
      createIssueRequest: {
        title: "Crash from artist@example.com",
        body: "Phone +1 555 010 9999 and private stack trace should never persist",
        labels: ["bug", "observability"],
      },
      response: {
        html_url: "https://github.com/owner/repo/issues/123",
        token: "github_pat_secret",
      },
    };

    const redacted = buildRedactedGithubIssueAutomationArtifact(rawArtifact);
    const review = buildGithubIssueAutomationArtifactReview("github-issue-live-dispatch", rawArtifact);
    const serialized = JSON.stringify(review.redactedArtifact);

    expect(JSON.stringify(redacted)).not.toContain("ghp_liveGithubIssueToken");
    expect(serialized).not.toContain("github_pat_secret");
    expect(serialized).not.toContain("artist@example.com");
    expect(serialized).not.toContain("+1 555 010 9999");
    expect(serialized).not.toContain("private stack trace");
    expect(serialized).toContain("https://github.com/owner/repo/issues/123");
    expect(review.safeToPersist).toBe(true);
    expect(review.unsafeFindings).toEqual([]);
    expect(review.requiredArtifactPath).toBe("coverage/github-issue-secret-safe-artifacts.json");
  });

  it("pins current GitHub issue automation proof files for GAP-085", () => {
    expect(githubIssueAutomationProofFiles).toEqual(
      expect.arrayContaining([
        "packages/observability/package.json",
        "packages/observability/src/index.ts",
        "packages/observability/tests/redaction-report.test.ts",
        "packages/db/prisma/schema.prisma",
        "packages/db/prisma/migrations/20260613000500_add_github_issue_links/migration.sql",
        "apps/dashboard/app/api/observability/github-issues/route.ts",
        "scripts/observability/write-github-issue-automation-evidence.mjs",
        "apps/dashboard/tests/github-issue-automation-static.test.ts",
        "apps/dashboard/app/errors/page.tsx",
        "apps/dashboard/components/ErrorAutomationActionPanel.tsx",
        ".github/workflows/ci.yml",
        "testing/manifests/unit-test-manifest.json",
        "HANDOFF_TO_CODEX.md",
      ]),
    );
    for (const file of githubIssueAutomationProofFiles) {
      expect(readFileSync(join(root, file), "utf8").length).toBeGreaterThan(0);
    }
  });

  it("classifies GAP-085 GitHub issue automation evidence as blocked until every approval and provider artifact is captured", () => {
    const blocked = buildGithubIssueAutomationEvidenceDecision({
      observabilityTypecheckPassed: true,
      observabilityTestsPassed: true,
      routeStaticContractPassed: true,
      approvalApiVerified: true,
      dashboardApprovalUiVerified: true,
      providerCredentialsVerified: false,
      humanApprovalAuditVerified: false,
      createRequestRedactionVerified: true,
      errorReportLinkVerified: false,
      dashboardStatusSyncVerified: false,
      liveDispatchProofCaptured: false,
      noPiiArtifactAuditPassed: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: ["coverage/github-issue-automation-approval.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Redacted GitHub provider credential evidence is required.",
        "Human approval AuditLog persistence evidence is required.",
        "ErrorReport issue-link persistence evidence is required.",
        "Live synthetic GitHub issue creation proof is required.",
      ]),
    );
    expect(blocked.blockers).not.toContain("Rendered dashboard approval UI/action evidence is required.");
    expect(blocked.blockers).not.toContain("Sanitized GitHub create issue request no-PII evidence is required.");
    expect(blocked.missingArtifacts).toContain("coverage/github-issue-dashboard-approval-ui.json");
    expect(blocked.requiredCommands).toBe(githubIssueAutomationCommands);

    const complete = buildGithubIssueAutomationEvidenceDecision({
      observabilityTypecheckPassed: true,
      observabilityTestsPassed: true,
      routeStaticContractPassed: true,
      approvalApiVerified: true,
      dashboardApprovalUiVerified: true,
      providerCredentialsVerified: true,
      humanApprovalAuditVerified: true,
      createRequestRedactionVerified: true,
      errorReportLinkVerified: true,
      dashboardStatusSyncVerified: true,
      liveDispatchProofCaptured: true,
      noPiiArtifactAuditPassed: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: githubIssueAutomationArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.redactedSummary).toContain("CI-safe redacted provider artifacts captured");
  });

  it("is wired into CI and the tracker without claiming live repo proof", () => {
    expect(routeSource).toContain("coverage/github-issue-live-dispatch-redacted.json");
    expect(routeSource).toContain("coverage/github-issue-provider-credentials-redacted.json");
    expect(routeSource).toContain("coverage/github-issue-no-pii-artifact-audit.json");
    expect(routeSource).toContain("coverage/github-issue-ci-evidence.json");
    expect(workflowSource).toContain("Run Phase 11 GitHub issue automation contracts");
    expect(workflowSource).toContain("apps/dashboard/tests/github-issue-automation-static.test.ts");
    expect(workflowSource).toContain("coverage/github-issue-ci-evidence.json");
    expect(unitManifest).toContain("githubIssueAutomationRuntimeMatrix");
    expect(trackerSource).toContain("GAP-085");
    expect(trackerSource).toContain("apps/dashboard/app/api/observability/github-issues/route.ts");
    expect(trackerSource).toContain("GitHub issue automation evidence classifier wired and runtime-matrix gated");
    expect(trackerSource).toContain("buildGithubIssueAutomationExecutionPlan");
    expect(trackerSource).toContain("githubIssueAutomationExecutionPolicy");
    expect(trackerSource).toContain("githubIssueAutomationRequiredExternalEvidence");
    expect(trackerSource).toContain("dashboard approval UI/action is source-wired");
    expect(rootPackageJson).toContain("observability:github-issue-evidence");
    expect(evidenceWriterSource).toContain("providerDispatchExecuted: false");
    expect(evidenceWriterSource).toContain("github-issue-route-static-contract.json");
    expect(evidenceWriterSource).toContain("github-issue-provider-credentials-redacted.json");
    expect(evidenceWriterSource).toContain("github-issue-human-approval-audit.json");
    expect(evidenceWriterSource).toContain("github-issue-create-request-redacted.json");
    expect(evidenceWriterSource).toContain("github-issue-errorreport-link.json");
    expect(evidenceWriterSource).toContain("github-issue-dashboard-status-sync.json");
    expect(evidenceWriterSource).toContain("github-issue-live-dispatch-redacted.json");
    expect(evidenceWriterSource).toContain("github-issue-ci-evidence.json");
    expect(evidenceWriterSource).toContain("live synthetic GitHub issue creation proof");
    expect(trackerSource).toContain("live synthetic GitHub issue creation proof");
  });
});
