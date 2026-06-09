import { prisma } from "@inkroute/db";
import {
  buildGithubIssueAutomationPlan,
  buildGithubIssueRuntimeDispatchPlan,
  buildObservabilityReportDraft,
  type ObservabilityReportDraft,
} from "@inkroute/observability";
import { NextResponse, type NextRequest } from "next/server";

import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

export const runtime = "nodejs";

export const githubIssueAutomationArtifactPaths = [
  "coverage/github-issue-automation-approval.json",
  "coverage/github-issue-human-approval-audit.json",
  "coverage/github-issue-create-request-redacted.json",
  "coverage/github-issue-errorreport-link.json",
  "coverage/github-issue-dashboard-status-sync.json",
  "coverage/github-issue-live-dispatch-redacted.json",
  "test-results/github-issue-automation",
] as const;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function csvEnv(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function githubTokenConfigured() {
  return Boolean(process.env.GITHUB_ISSUE_TOKEN ?? process.env.GITHUB_TOKEN);
}

function githubRepositoryConfigured() {
  return Boolean(process.env.GITHUB_REPOSITORY);
}

function githubDispatchEnabled() {
  return process.env.GITHUB_ISSUE_DISPATCH_ENABLED === "true";
}

function buildFallbackReport(body: Record<string, unknown>, tenantId: string): ObservabilityReportDraft {
  return buildObservabilityReportDraft({
    tenantId,
    source: body.source === "dashboard" || body.source === "mobile" || body.source === "api" || body.source === "worker" || body.source === "webhook" ? body.source : "web",
    message: typeof body.message === "string" ? body.message : "Dashboard-approved issue automation request",
    stack: typeof body.stack === "string" ? body.stack : undefined,
    route: typeof body.route === "string" ? body.route : "/dashboard/errors",
    release: typeof body.release === "string" ? body.release : "unknown",
    environment: body.environment === "production" || body.environment === "preview" || body.environment === "test" ? body.environment : "development",
    runtime: "server",
    statusCode: typeof body.statusCode === "number" ? body.statusCode : 500,
    handled: false,
    metadata: body.metadata && typeof body.metadata === "object" ? (body.metadata as Record<string, unknown>) : {},
    tags: { phase: "11", automation: "github-issue" },
  });
}

async function loadReportDraft(input: { tenantId: string; errorReportId?: string; body: Record<string, unknown> }) {
  if (!input.errorReportId) {
    return { report: buildFallbackReport(input.body, input.tenantId), persistedErrorReport: null };
  }

  const persistedErrorReport = await prisma.errorReport.findFirst({
    where: { id: input.errorReportId, tenantId: input.tenantId },
    select: {
      id: true,
      tenantId: true,
      severity: true,
      status: true,
      source: true,
      message: true,
      stackHash: true,
      route: true,
      release: true,
      metadata: true,
      createdAt: true,
    },
  });

  if (!persistedErrorReport) {
    return { report: buildFallbackReport(input.body, input.tenantId), persistedErrorReport: null };
  }

  const report = buildObservabilityReportDraft({
    tenantId: persistedErrorReport.tenantId ?? input.tenantId,
    source: persistedErrorReport.source === "dashboard" || persistedErrorReport.source === "mobile" || persistedErrorReport.source === "api" || persistedErrorReport.source === "worker" || persistedErrorReport.source === "webhook" ? persistedErrorReport.source : "web",
    message: persistedErrorReport.message,
    route: persistedErrorReport.route ?? "/dashboard/errors",
    release: persistedErrorReport.release ?? "unknown",
    environment: "production",
    runtime: "server",
    statusCode: persistedErrorReport.severity === "critical" ? 500 : 400,
    handled: false,
    metadata: {
      persistedErrorReportId: persistedErrorReport.id,
      stackHash: persistedErrorReport.stackHash,
      status: persistedErrorReport.status,
      createdAt: persistedErrorReport.createdAt.toISOString(),
      ...(persistedErrorReport.metadata && typeof persistedErrorReport.metadata === "object" ? (persistedErrorReport.metadata as Record<string, unknown>) : {}),
    },
    tags: { phase: "11", automation: "github-issue" },
  });

  return { report, persistedErrorReport };
}

async function persistApproval(input: {
  tenantId: string;
  actorUserId: string;
  errorReportId: string | null;
  report: ObservabilityReportDraft;
  plan: ReturnType<typeof buildGithubIssueAutomationPlan>;
  dispatchState: string;
}) {
  return prisma.$transaction(async (tx) => {
    const auditLog = await tx.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actorUserId: input.actorUserId === "dashboard-demo-user" ? undefined : input.actorUserId,
        action: "observability.github_issue.approve",
        entityType: "GithubIssueAutomation",
        entityId: input.errorReportId ?? input.report.fingerprint,
        metadata: {
          reportFingerprint: input.report.fingerprint,
          errorReportId: input.errorReportId,
          dispatchState: input.dispatchState,
          humanApproved: true,
          createIssueRequest: input.plan.createIssueRequest ?? null,
          blockers: input.plan.blockers,
          privacyChecklist: input.plan.privacyChecklist,
          rawPayloadStored: false,
          artifactPaths: githubIssueAutomationArtifactPaths,
        },
      },
      select: { id: true },
    });

    if (input.errorReportId) {
      await tx.errorReport.update({
        where: { id: input.errorReportId },
        data: {
          metadata: {
            githubIssueAutomation: {
              status: input.dispatchState,
              approvalAuditLogId: auditLog.id,
              approvedByUserId: input.actorUserId,
              reportFingerprint: input.report.fingerprint,
              issueRequestPrepared: Boolean(input.plan.createIssueRequest),
            },
          },
        },
      });
    }

    return auditLog.id;
  });
}

async function dispatchGithubIssue(createIssueRequest: NonNullable<ReturnType<typeof buildGithubIssueAutomationPlan>["createIssueRequest"]>) {
  const token = process.env.GITHUB_ISSUE_TOKEN ?? process.env.GITHUB_TOKEN;
  if (!token || !githubDispatchEnabled()) {
    return { dispatchState: "provider-dispatch-gated", issueUrl: null, issueNumber: null };
  }

  const response = await fetch(`https://api.github.com/repos/${createIssueRequest.repository}/issues`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "content-type": "application/json",
      "x-github-api-version": "2022-11-28",
    },
    body: JSON.stringify({
      title: createIssueRequest.title,
      body: createIssueRequest.body,
      labels: createIssueRequest.labels,
      assignees: createIssueRequest.assignees,
    }),
  });

  if (!response.ok) {
    return { dispatchState: "provider-dispatch-rejected", issueUrl: null, issueNumber: null };
  }

  const payload = (await response.json()) as { html_url?: string; number?: number };
  return {
    dispatchState: "provider-dispatched",
    issueUrl: payload.html_url ?? null,
    issueNumber: payload.number ?? null,
  };
}

export async function POST(request: NextRequest) {
  let actor;
  try {
    actor = resolveDashboardActor(request);
    assertPermission(actor, "error:write");
  } catch (error) {
    const code = error instanceof Error && error.message === "FORBIDDEN" ? "FORBIDDEN" : "AUTH_REQUIRED";
    return json({ ok: false, error: { code, message: "Actor is not allowed to approve GitHub issue automation." } }, code === "FORBIDDEN" ? 403 : 401);
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    body = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return json({ ok: false, error: { code: "INVALID_JSON", message: "GitHub issue approval body must be valid JSON." } }, 400);
  }

  const tenantId = typeof body.tenantId === "string" ? body.tenantId : actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot approve GitHub issue automation for another tenant." } }, 403);
  }

  const humanApproved = body.humanApproved === true;
  const configuredLabels = csvEnv("GITHUB_ISSUE_LABELS");
  const configuredAssignees = csvEnv("GITHUB_ISSUE_ASSIGNEES");
  const errorReportId = typeof body.errorReportId === "string" ? body.errorReportId : undefined;

  try {
    const { report, persistedErrorReport } = await loadReportDraft({ tenantId, errorReportId, body });
    const automationPlan = buildGithubIssueAutomationPlan({
      report,
      githubTokenConfigured: githubTokenConfigured(),
      repositoryConfigured: githubRepositoryConfigured(),
      labelsConfigured: configuredLabels,
      assigneesConfigured: configuredAssignees,
      humanApproved,
      issueTemplateConfigured: Boolean(process.env.GITHUB_ISSUE_TEMPLATE_PATH),
    });
    const runtimePlan = buildGithubIssueRuntimeDispatchPlan({
      packageScripts: ["test", "typecheck"],
      observabilityTestsPassed: false,
      observabilityTypecheckPassed: false,
      githubTokenConfigured: githubTokenConfigured(),
      repositoryConfigured: githubRepositoryConfigured(),
      labelsConfigured: configuredLabels.length > 0,
      assigneesConfigured: configuredAssignees.length > 0,
      privacyTemplateConfigured: Boolean(process.env.GITHUB_ISSUE_TEMPLATE_PATH),
      dashboardApprovalUiWired: true,
      humanApprovalAuditStored: true,
      githubApiCreateIssueWired: true,
      reportIssueLinkPersistenceConfigured: true,
      dashboardStatusSyncConfigured: true,
      highRiskDashboardOnlyBlockingVerified: true,
      sanitizedIssueBodyVerified: true,
      liveSyntheticIssueCreationVerified: false,
    });

    if (!humanApproved) {
      return json({ ok: false, error: { code: "HUMAN_APPROVAL_REQUIRED", message: "Human approval is required before GitHub issue automation." }, data: { automationPlan, runtimePlan } }, 400);
    }

    const dispatch = automationPlan.createIssueRequest ? await dispatchGithubIssue(automationPlan.createIssueRequest) : { dispatchState: "blocked", issueUrl: null, issueNumber: null };
    const auditLogId = await persistApproval({
      tenantId,
      actorUserId: actor.actorUserId,
      errorReportId: persistedErrorReport?.id ?? null,
      report,
      plan: automationPlan,
      dispatchState: dispatch.dispatchState,
    });

    if (persistedErrorReport?.id && dispatch.issueUrl) {
      await prisma.errorReport.update({
        where: { id: persistedErrorReport.id },
        data: {
          metadata: {
            githubIssueAutomation: {
              status: dispatch.dispatchState,
              approvalAuditLogId: auditLogId,
              issueUrl: dispatch.issueUrl,
              issueNumber: dispatch.issueNumber,
              reportFingerprint: report.fingerprint,
              dashboardStatusSynced: true,
            },
          },
        },
      });
    }

    return json({
      ok: automationPlan.status === "ready" && dispatch.dispatchState !== "blocked",
      data: {
        automationPlan,
        runtimePlan,
        dispatch,
        auditLogId,
        artifactPaths: githubIssueAutomationArtifactPaths,
        requiredNextWork: [
          "Configure GitHub token, repository, labels, assignees, and privacy template in secrets/config.",
          "Enable GITHUB_ISSUE_DISPATCH_ENABLED only after synthetic repo proof is approved.",
          "Capture live synthetic GitHub issue creation evidence and dashboard status sync artifacts.",
        ],
      },
    }, automationPlan.status === "ready" ? 202 : 200);
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return json({ ok: false, error: { code: "DATABASE_UNAVAILABLE", message: "GitHub issue automation approval requires dashboard database access for audit/link persistence." } }, 503);
    }
    return json({ ok: false, error: { code: "GITHUB_ISSUE_AUTOMATION_FAILED", message: "GitHub issue automation could not be prepared." } }, 500);
  }
}

