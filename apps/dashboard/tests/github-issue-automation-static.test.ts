import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");
const routeSource = readFileSync(join(root, "apps/dashboard/app/api/observability/github-issues/route.ts"), "utf8");
const workflowSource = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const trackerSource = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");

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
    expect(routeSource).toContain("githubIssueAutomation");
    expect(routeSource).toContain("dashboardStatusSynced: true");
  });

  it("wires GitHub API dispatch behind provider credentials and an explicit enable flag", () => {
    expect(routeSource).toContain("GITHUB_ISSUE_TOKEN");
    expect(routeSource).toContain("GITHUB_TOKEN");
    expect(routeSource).toContain("GITHUB_REPOSITORY");
    expect(routeSource).toContain("GITHUB_ISSUE_DISPATCH_ENABLED");
    expect(routeSource).toContain("https://api.github.com/repos/");
    expect(routeSource).toContain("liveSyntheticIssueCreationVerified: false");
  });

  it("is wired into CI and the tracker without claiming live repo proof", () => {
    expect(routeSource).toContain("coverage/github-issue-live-dispatch-redacted.json");
    expect(workflowSource).toContain("Run Phase 11 GitHub issue automation contracts");
    expect(workflowSource).toContain("apps/dashboard/tests/github-issue-automation-static.test.ts");
    expect(trackerSource).toContain("GAP-085");
    expect(trackerSource).toContain("apps/dashboard/app/api/observability/github-issues/route.ts");
    expect(trackerSource).toContain("live synthetic GitHub issue creation proof remains open");
  });
});
