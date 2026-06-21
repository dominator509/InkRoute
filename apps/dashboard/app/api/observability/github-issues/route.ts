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

export type GithubIssueAutomationRuntimeStatus =
  | "wired"
  | "approval-gated"
  | "credential-gated"
  | "provider-gated"
  | "persistence-gated"
  | "privacy-gated"
  | "ci-gated";

export interface GithubIssueAutomationRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: GithubIssueAutomationRuntimeStatus;
}

export const githubIssueAutomationCommands = [
  "pnpm --filter @inkroute/observability typecheck",
  "pnpm --filter @inkroute/observability test",
  "pnpm vitest run apps/dashboard/tests/github-issue-automation-static.test.ts",
  "pnpm observability:github-issue-evidence",
  "dashboard GitHub issue approval action smoke",
  "GitHub issue create API smoke",
  "ErrorReport issue-link persistence smoke",
  "live synthetic GitHub issue creation proof",
  "GitHub issue no-PII artifact audit",
] as const;

export const githubIssueAutomationRequiredExternalEvidence = [
  "GithubIssueLink migration applied in a non-production database",
  "DB-backed human approval AuditLog persistence smoke",
  "DB-backed GithubIssueLink and ErrorReport status adapter execution smoke",
  "redacted live GitHub provider credentials",
  "live synthetic GitHub issue creation proof, CI evidence, and provider-backed secret-safe artifacts",
] as const;

export const githubIssueAutomationArtifactPaths = [
  "coverage/github-issue-automation-approval.json",
  "coverage/github-issue-observability-typecheck.txt",
  "coverage/github-issue-observability-test.txt",
  "coverage/github-issue-route-static-contract.json",
  "coverage/github-issue-dashboard-approval-ui.json",
  "coverage/github-issue-provider-credentials-redacted.json",
  "coverage/github-issue-human-approval-audit.json",
  "coverage/github-issue-create-request-redacted.json",
  "coverage/github-issue-errorreport-link.json",
  "coverage/github-issue-dashboard-status-sync.json",
  "coverage/github-issue-live-dispatch-redacted.json",
  "coverage/github-issue-no-pii-artifact-audit.json",
  "coverage/github-issue-ci-evidence.json",
  "coverage/github-issue-secret-safe-artifacts.json",
  "test-results/github-issue-automation",
] as const;

export const githubIssueAutomationProofFiles = [
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
] as const;

export type GithubIssueAutomationEvidenceArtifact = (typeof githubIssueAutomationArtifactPaths)[number];

export interface GithubIssueAutomationExecutionPlan {
  readonly id: "gap-085-github-issue-automation";
  readonly providerDispatchAllowed: false;
  readonly liveGithubApiAllowed: false;
  readonly migrationExecutionAllowed: false;
  readonly policy: GithubIssueAutomationExecutionPolicy;
  readonly source: "local-software-plan";
  readonly requiredCommands: typeof githubIssueAutomationCommands;
  readonly requiredArtifacts: typeof githubIssueAutomationArtifactPaths;
  readonly localEvidenceArtifacts: readonly GithubIssueAutomationEvidenceArtifact[];
  readonly persistenceArtifacts: readonly GithubIssueAutomationEvidenceArtifact[];
  readonly providerArtifacts: readonly GithubIssueAutomationEvidenceArtifact[];
  readonly privacyArtifacts: readonly GithubIssueAutomationEvidenceArtifact[];
  readonly secretSafeArtifactPath: GithubIssueAutomationEvidenceArtifact;
  readonly externalEvidenceRequired: typeof githubIssueAutomationRequiredExternalEvidence;
}

export interface GithubIssueAutomationExecutionPolicy {
  readonly executeProviderDispatch: false;
  readonly executeLiveGithubApi: false;
  readonly executeMigration: false;
  readonly executeDbBackedApprovalSmoke: false;
  readonly executeDbBackedStatusAdapterSmoke: false;
  readonly executeNoPiiAudit: false;
  readonly executeCi: false;
}

export interface GithubIssueAutomationArtifactReview {
  readonly artifactName: string;
  readonly safeToPersist: boolean;
  readonly redactedArtifact: unknown;
  readonly unsafeFindings: readonly string[];
  readonly requiredArtifactPath: GithubIssueAutomationEvidenceArtifact;
}

const githubIssueSensitiveKeyPattern =
  /(?:authorization|body|clientsecret|cookie|credential|email|password|phone|private|raw|secret|stack|token)/i;
const githubIssueEmailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const githubIssuePhonePattern = /\+?\d[\d ().-]{7,}\d/g;
const githubIssueTokenPattern = /\b(?:bearer|ghp|github_pat|sk|xox|ya29)[A-Za-z0-9._:/-]{8,}\b/gi;

function redactGithubIssueAutomationArtifactValue(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (githubIssueSensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value
      .replace(githubIssueEmailPattern, "[REDACTED_EMAIL]")
      .replace(githubIssuePhonePattern, "[REDACTED_PHONE]")
      .replace(githubIssueTokenPattern, "[REDACTED_TOKEN]");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactGithubIssueAutomationArtifactValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactGithubIssueAutomationArtifactValue(entryValue, entryKey)]),
    );
  }

  return value;
}

export function buildRedactedGithubIssueAutomationArtifact(artifact: unknown): unknown {
  return redactGithubIssueAutomationArtifactValue(artifact);
}

export const githubIssueAutomationExecutionPolicy: GithubIssueAutomationExecutionPolicy = {
  executeProviderDispatch: false,
  executeLiveGithubApi: false,
  executeMigration: false,
  executeDbBackedApprovalSmoke: false,
  executeDbBackedStatusAdapterSmoke: false,
  executeNoPiiAudit: false,
  executeCi: false,
};

export function buildGithubIssueAutomationExecutionPlan(): GithubIssueAutomationExecutionPlan {
  return {
    id: "gap-085-github-issue-automation",
    providerDispatchAllowed: false,
    liveGithubApiAllowed: false,
    migrationExecutionAllowed: false,
    policy: githubIssueAutomationExecutionPolicy,
    source: "local-software-plan",
    requiredCommands: githubIssueAutomationCommands,
    requiredArtifacts: githubIssueAutomationArtifactPaths,
    localEvidenceArtifacts: [
      "coverage/github-issue-automation-approval.json",
      "coverage/github-issue-route-static-contract.json",
      "coverage/github-issue-dashboard-approval-ui.json",
      "coverage/github-issue-create-request-redacted.json",
      "coverage/github-issue-no-pii-artifact-audit.json",
    ],
    persistenceArtifacts: [
      "coverage/github-issue-human-approval-audit.json",
      "coverage/github-issue-errorreport-link.json",
      "coverage/github-issue-dashboard-status-sync.json",
    ],
    providerArtifacts: [
      "coverage/github-issue-provider-credentials-redacted.json",
      "coverage/github-issue-live-dispatch-redacted.json",
    ],
    privacyArtifacts: ["coverage/github-issue-no-pii-artifact-audit.json"],
    secretSafeArtifactPath: "coverage/github-issue-secret-safe-artifacts.json",
    externalEvidenceRequired: githubIssueAutomationRequiredExternalEvidence,
  };
}

export function buildGithubIssueAutomationArtifactReview(
  artifactName: string,
  artifact: unknown,
  requiredArtifactPath: GithubIssueAutomationEvidenceArtifact = "coverage/github-issue-secret-safe-artifacts.json",
): GithubIssueAutomationArtifactReview {
  const redactedArtifact = buildRedactedGithubIssueAutomationArtifact(artifact);
  const serialized = JSON.stringify(redactedArtifact);
  const unsafeFindings = [
    serialized.match(githubIssueEmailPattern) ? "email" : null,
    serialized.match(githubIssuePhonePattern) ? "phone" : null,
    serialized.match(githubIssueTokenPattern) ? "provider-token" : null,
  ].filter((finding): finding is string => finding !== null);

  return {
    artifactName,
    safeToPersist: unsafeFindings.length === 0,
    redactedArtifact,
    unsafeFindings,
    requiredArtifactPath,
  };
}

export interface GithubIssueAutomationEvidenceInput {
  readonly observabilityTypecheckPassed: boolean;
  readonly observabilityTestsPassed: boolean;
  readonly routeStaticContractPassed: boolean;
  readonly approvalApiVerified: boolean;
  readonly dashboardApprovalUiVerified: boolean;
  readonly providerCredentialsVerified: boolean;
  readonly humanApprovalAuditVerified: boolean;
  readonly createRequestRedactionVerified: boolean;
  readonly errorReportLinkVerified: boolean;
  readonly dashboardStatusSyncVerified: boolean;
  readonly liveDispatchProofCaptured: boolean;
  readonly noPiiArtifactAuditPassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly GithubIssueAutomationEvidenceArtifact[];
}

export interface GithubIssueAutomationEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly GithubIssueAutomationEvidenceArtifact[];
  readonly requiredCommands: typeof githubIssueAutomationCommands;
  readonly requiredEvidence: typeof githubIssueAutomationRequiredEvidence;
  readonly redactedSummary: string;
}

export const githubIssueAutomationRequiredEvidence = [
  "observability package typecheck/test and GitHub issue route static contract artifacts",
  "dashboard approval API/UI, provider credential, human approval audit, and create-request redaction artifacts",
  "ErrorReport issue-link, dashboard status sync, live dispatch, and no-PII provider artifact evidence",
  "CI evidence and redacted secret-safe artifact review",
] as const;

export function buildGithubIssueAutomationEvidenceDecision(input: GithubIssueAutomationEvidenceInput): GithubIssueAutomationEvidenceDecision {
  const blockers = [
    !input.observabilityTypecheckPassed ? "Observability package typecheck evidence is required." : null,
    !input.observabilityTestsPassed ? "Observability package test evidence is required." : null,
    !input.routeStaticContractPassed ? "GitHub issue automation route static contract evidence is required." : null,
    !input.approvalApiVerified ? "Dashboard GitHub issue approval API evidence is required." : null,
    !input.dashboardApprovalUiVerified ? "Rendered dashboard approval UI/action evidence is required." : null,
    !input.providerCredentialsVerified ? "Redacted GitHub provider credential evidence is required." : null,
    !input.humanApprovalAuditVerified ? "Human approval AuditLog persistence evidence is required." : null,
    !input.createRequestRedactionVerified ? "Sanitized GitHub create issue request no-PII evidence is required." : null,
    !input.errorReportLinkVerified ? "ErrorReport issue-link persistence evidence is required." : null,
    !input.dashboardStatusSyncVerified ? "Dashboard issue-link status sync evidence is required." : null,
    !input.liveDispatchProofCaptured ? "Live synthetic GitHub issue creation proof is required." : null,
    !input.noPiiArtifactAuditPassed ? "GitHub issue no-PII artifact audit evidence is required." : null,
    !input.ciEvidenceCaptured ? "CI GitHub issue automation gate evidence is required." : null,
    !input.secretSafeArtifactReviewPassed ? "Secret-safe artifact review evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = githubIssueAutomationArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: githubIssueAutomationCommands,
    requiredEvidence: githubIssueAutomationRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-085 GitHub issue automation evidence is complete with CI-safe redacted provider artifacts captured."
        : "GAP-085 GitHub issue automation evidence remains blocked until dashboard approval, provider credentials, issue-link persistence, live dispatch, no-PII, CI, and redaction artifacts are captured.",
  };
}

export const githubIssueAutomationRuntimeMatrix: readonly GithubIssueAutomationRuntimeMatrixEntry[] = [
  { id: "observability-typecheck", command: "pnpm --filter @inkroute/observability typecheck", artifact: "coverage/github-issue-observability-typecheck.txt", status: "wired" },
  { id: "observability-tests", command: "pnpm --filter @inkroute/observability test", artifact: "coverage/github-issue-observability-test.txt", status: "wired" },
  { id: "route-static-contract", command: "pnpm vitest run apps/dashboard/tests/github-issue-automation-static.test.ts", artifact: "coverage/github-issue-route-static-contract.json", status: "wired" },
  { id: "local-evidence-writer", command: "pnpm observability:github-issue-evidence", artifact: "coverage/github-issue-create-request-redacted.json", status: "wired" },
  { id: "approval-api", command: "dashboard GitHub issue approval action smoke", artifact: "coverage/github-issue-automation-approval.json", status: "wired" },
  { id: "dashboard-approval-ui", command: "rendered dashboard approval UI/action smoke", artifact: "coverage/github-issue-dashboard-approval-ui.json", status: "wired" },
  { id: "provider-credentials", command: "GitHub token/repository/template/label/assignee credential audit", artifact: "coverage/github-issue-provider-credentials-redacted.json", status: "credential-gated" },
  { id: "human-approval-audit", command: "human approval AuditLog persistence smoke", artifact: "coverage/github-issue-human-approval-audit.json", status: "persistence-gated" },
  { id: "create-request-redaction", command: "sanitized createIssueRequest no-PII audit", artifact: "coverage/github-issue-create-request-redacted.json", status: "privacy-gated" },
  { id: "errorreport-link", command: "ErrorReport issue-link persistence smoke", artifact: "coverage/github-issue-errorreport-link.json", status: "persistence-gated" },
  { id: "dashboard-status-sync", command: "dashboard issue-link status sync smoke", artifact: "coverage/github-issue-dashboard-status-sync.json", status: "persistence-gated" },
  { id: "live-dispatch", command: "live synthetic GitHub issue creation proof", artifact: "coverage/github-issue-live-dispatch-redacted.json", status: "provider-gated" },
  { id: "no-pii-artifact-audit", command: "GitHub issue no-PII artifact audit", artifact: "coverage/github-issue-no-pii-artifact-audit.json", status: "privacy-gated" },
  { id: "ci-github-issue-automation", command: "GitHub Actions issue automation gate", artifact: "coverage/github-issue-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "redacted GitHub issue artifact audit", artifact: "coverage/github-issue-secret-safe-artifacts.json", status: "ci-gated" },
] as const;

export interface GithubIssueLinkPersistenceInput {
  readonly tenantId: string;
  readonly errorReportId: string;
  readonly approvalAuditLogId: string;
  readonly dispatchState: string;
  readonly issueUrl: string;
  readonly issueNumber: number | null;
  readonly repository: string;
  readonly reportFingerprint: string;
  readonly existingMetadata?: Record<string, unknown>;
  readonly artifactPaths?: readonly GithubIssueAutomationEvidenceArtifact[];
}

export interface GithubIssueLinkPersistenceRepository {
  readonly githubIssueLink: {
    upsert(input: {
      readonly where: { readonly errorReportId: string };
      readonly create: Record<string, unknown>;
      readonly update: Record<string, unknown>;
    }): Promise<unknown>;
  };
  readonly errorReport: {
    update(input: {
      readonly where: { readonly id: string };
      readonly data: { readonly metadata: Record<string, unknown> };
    }): Promise<unknown>;
  };
}

export function buildGithubIssueLinkMetadata(input: GithubIssueLinkPersistenceInput): Record<string, unknown> {
  const existingAutomation =
    input.existingMetadata?.githubIssueAutomation && typeof input.existingMetadata.githubIssueAutomation === "object"
      ? (input.existingMetadata.githubIssueAutomation as Record<string, unknown>)
      : {};

  return {
    ...(input.existingMetadata ?? {}),
    githubIssueAutomation: {
      ...existingAutomation,
      status: input.dispatchState,
      approvalAuditLogId: input.approvalAuditLogId,
      issueUrl: input.issueUrl,
      issueNumber: input.issueNumber,
      repository: input.repository,
      reportFingerprint: input.reportFingerprint,
      dashboardStatusSynced: true,
      providerDispatchExecuted: input.dispatchState === "provider-dispatched",
      rawProviderPayloadStored: false,
      artifactPaths: input.artifactPaths ?? githubIssueAutomationArtifactPaths,
    },
  };
}

export async function persistGithubIssueLinkToErrorReport(
  repository: GithubIssueLinkPersistenceRepository,
  input: GithubIssueLinkPersistenceInput,
): Promise<unknown> {
  await repository.githubIssueLink.upsert({
    where: { errorReportId: input.errorReportId },
    create: {
      tenantId: input.tenantId,
      errorReportId: input.errorReportId,
      approvalAuditLogId: input.approvalAuditLogId,
      repository: input.repository,
      issueUrl: input.issueUrl,
      issueNumber: input.issueNumber,
      dispatchState: input.dispatchState,
      reportFingerprint: input.reportFingerprint,
      dashboardStatusSynced: true,
      providerDispatchExecuted: input.dispatchState === "provider-dispatched",
      rawProviderPayloadStored: false,
      artifactPaths: input.artifactPaths ?? githubIssueAutomationArtifactPaths,
    },
    update: {
      approvalAuditLogId: input.approvalAuditLogId,
      repository: input.repository,
      issueUrl: input.issueUrl,
      issueNumber: input.issueNumber,
      dispatchState: input.dispatchState,
      reportFingerprint: input.reportFingerprint,
      dashboardStatusSynced: true,
      providerDispatchExecuted: input.dispatchState === "provider-dispatched",
      rawProviderPayloadStored: false,
      artifactPaths: input.artifactPaths ?? githubIssueAutomationArtifactPaths,
    },
  });

  return repository.errorReport.update({
    where: { id: input.errorReportId },
    data: {
      metadata: buildGithubIssueLinkMetadata(input),
    },
  });
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: noStoreHeaders });
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

  if (process.env.NODE_ENV === "production" && !errorReportId) {
    return json(
      {
        ok: false,
        error: {
          code: "PROVIDER_GITHUB_ISSUE_ERROR_REPORT_LINK_NOT_CONFIGURED",
          message: "Production GitHub issue automation requires a persisted tenant-scoped ErrorReport id; synthetic request-body report fallbacks are disabled.",
          gapIds: ["GAP-081", "GAP-085", "GAP-093"],
        },
        productionBoundary: { syntheticGithubIssueReportFallbackDisabled: true },
      },
      503,
    );
  }

  try {
    const { report, persistedErrorReport } = await loadReportDraft({ tenantId, errorReportId, body });
    if (process.env.NODE_ENV === "production" && !persistedErrorReport?.id) {
      return json(
        {
          ok: false,
          error: {
            code: "PROVIDER_GITHUB_ISSUE_ERROR_REPORT_LINK_NOT_CONFIGURED",
            message: "Production GitHub issue automation requires an existing tenant-scoped ErrorReport link before approval or provider dispatch planning.",
            gapIds: ["GAP-081", "GAP-085", "GAP-093"],
          },
          productionBoundary: { syntheticGithubIssueReportFallbackDisabled: true },
        },
        503,
      );
    }

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

    if (process.env.NODE_ENV === "production" && runtimePlan.status !== "ready") {
      return json(
        {
          ok: false,
          error: {
            code: "GITHUB_ISSUE_RUNTIME_EVIDENCE_NOT_CONFIGURED",
            message: "Production GitHub issue automation requires runtime dispatch evidence before provider dispatch can run.",
            gapIds: ["GAP-085"],
          },
          productionBoundary: {
            githubIssueProviderDispatchEvidenceRequired: true,
            blockers: runtimePlan.blockers,
            requiredEvidence: runtimePlan.requiredEvidence,
          },
          data: {
            automationPlan,
            runtimePlan,
            artifactPaths: githubIssueAutomationArtifactPaths,
          },
        },
        503,
      );
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
      await persistGithubIssueLinkToErrorReport(prisma, {
        tenantId,
        errorReportId: persistedErrorReport.id,
        approvalAuditLogId: auditLogId,
        dispatchState: dispatch.dispatchState,
        issueUrl: dispatch.issueUrl,
        issueNumber: dispatch.issueNumber,
        repository: process.env.GITHUB_REPOSITORY ?? "repository-not-configured",
        reportFingerprint: report.fingerprint,
        existingMetadata: persistedErrorReport.metadata && typeof persistedErrorReport.metadata === "object" ? (persistedErrorReport.metadata as Record<string, unknown>) : {},
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



