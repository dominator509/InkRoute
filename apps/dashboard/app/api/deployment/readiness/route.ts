import { NextRequest, NextResponse } from "next/server";
import {
  buildDeploymentPlan,
  buildHandoffTasks,
  buildProductionLaunchChecklist,
  evaluateEnvironmentReadiness,
} from "@inkroute/deployment";
import { deploymentReadinessMutationSchema, type DeploymentReadinessMutationInput } from "@inkroute/validators";
import { prisma } from "@inkroute/db";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

declare const process: { env: Record<string, string | undefined> };

type DeploymentOperationPolicy = {
  implemented: boolean;
  statusCode: number;
  status: string;
  boundary: string;
  nextActions: string[];
};

type DeploymentGetPayload = {
  ok: true;
  source: string;
  tenantId: string;
  actorRole: string;
  targetEnvironment: "production" | "preview" | "staging" | "local";
  operationMode: "read-only";
  productionBlocked: true | false;
  environment: ReturnType<typeof evaluateEnvironmentReadiness>;
  plan: ReturnType<typeof buildDeploymentPlan>;
  checklist: ReturnType<typeof buildProductionLaunchChecklist>;
  handoffTasks: ReturnType<typeof buildHandoffTasks>;
  gapIds: string[];
  boundary: string;
};

type DeploymentPostPayload = {
  ok: true;
  source: string;
  tenantId: string;
  actorRole: string;
  targetEnvironment: DeploymentReadinessMutationInput["targetEnvironment"];
  operation: DeploymentReadinessMutationInput["operation"];
  operationResult: DeploymentOperationPolicy;
  environment: ReturnType<typeof evaluateEnvironmentReadiness>;
  plan: ReturnType<typeof buildDeploymentPlan>;
  requestId?: string;
  warning?: string;
  auditId?: string;
  persistence: "database" | "local-fallback";
  gapIds: string[];
};

const deploymentGapIds = ["GAP-014", "GAP-015", "GAP-089", "GAP-114", "GAP-115"];

const operationPolicies: Record<DeploymentReadinessMutationInput["operation"], DeploymentOperationPolicy> = {
  "readiness-review": {
    implemented: true,
    statusCode: 200,
    status: "requested",
    boundary: "Readiness review request is accepted and persisted as an auditable control-plane action, but deployment execution remains external to this route.",
    nextActions: [
      "Attach signed CI/CD approval workflow before any rollout changes.",
      "Record environment credentials in the provider secret store before production actions.",
    ],
  },
  "request-release-plan": {
    implemented: false,
    statusCode: 409,
    status: "blocked",
    boundary: "Release job orchestration is intentionally blocked in this route until CI/CD provider jobs and environments are provisioned.",
    nextActions: [
      "Use the release governance workflow in GitHub Actions once deployment environments are provisioned.",
      "Attach release artifacts and tenant-scoped migration evidence to the approval record.",
    ],
  },
  "request-rollback-plan": {
    implemented: true,
    statusCode: 200,
    status: "preflight-only",
    boundary: "Rollback planning can be requested and recorded, but execution remains outside this API.",
    nextActions: [
      "Define the protected rollback window for production and publish a rehearsed rollback command list.",
      "Attach post-deploy incident evidence before approving a manual rollback.",
    ],
  },
  "request-production-approval": {
    implemented: false,
    statusCode: 409,
    status: "blocked",
    boundary: "Production approvals, migrations, and provider publishes require protected CI/CD environments and legal/ops gates.",
    nextActions: [
      "Require signed approval from the on-call approver in the deployment workflow.",
      "Store approval evidence in an immutable audit chain before production execution.",
    ],
  },
};

function buildEnvironmentSnapshot(targetEnvironment: DeploymentReadinessMutationInput["targetEnvironment"] = "production") {
  return evaluateEnvironmentReadiness(
    {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_DASHBOARD_URL: process.env.NEXT_PUBLIC_DASHBOARD_URL,
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL,
      AUTH_SECRET: process.env.AUTH_SECRET,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
      VERCEL_TOKEN: process.env.VERCEL_TOKEN,
      EAS_PROJECT_ID: process.env.EAS_PROJECT_ID,
      CSRF_SECRET: process.env.CSRF_SECRET,
      SECURITY_ENCRYPTION_PRIMARY_KEY: process.env.SECURITY_ENCRYPTION_PRIMARY_KEY,
      LEGAL_REVIEW_STATUS: process.env.LEGAL_REVIEW_STATUS,
    },
    targetEnvironment,
  );
}

function buildPayload(actor: ReturnType<typeof resolveDashboardActor>, environment: ReturnType<typeof buildEnvironmentSnapshot>): DeploymentGetPayload {
  return {
    ok: true,
    source: actor.source,
    tenantId: actor.tenantId,
    actorRole: actor.role,
    targetEnvironment: "production",
    operationMode: "read-only",
    productionBlocked: true,
    environment,
    plan: buildDeploymentPlan("production"),
    checklist: buildProductionLaunchChecklist(),
    handoffTasks: buildHandoffTasks(),
    gapIds: deploymentGapIds,
    boundary:
      "Readiness route is now auth-guarded with tenant scope and audit-ready metadata, but deployment actions remain external to this API until CI/CD environments and provider credentials are provisioned.",
  };
}

function buildPostSuccessPayload(
  actor: ReturnType<typeof resolveDashboardActor>,
  input: DeploymentReadinessMutationInput,
  auditId?: string,
  environment?: ReturnType<typeof buildEnvironmentSnapshot>,
): DeploymentPostPayload {
  const resolvedEnvironment = environment ?? buildEnvironmentSnapshot(input.targetEnvironment);
  const policy = operationPolicies[input.operation];

  return {
    ok: true,
    source: actor.source,
    tenantId: actor.tenantId,
    actorRole: actor.role,
    targetEnvironment: input.targetEnvironment,
    operation: input.operation,
    operationResult: {
      ...policy,
      statusCode: policy.statusCode,
    },
    environment: resolvedEnvironment,
    plan: buildDeploymentPlan(input.targetEnvironment),
    ...(input.requestId === undefined ? {} : { requestId: input.requestId }),
    persistence: actor.source === "local-fallback" ? "local-fallback" : "database",
    ...(auditId ? { auditId } : {}),
    gapIds: deploymentGapIds,
    ...(policy.implemented ? {} : {
      warning:
        "This response indicates blocked or staged workflow actions only; this API records request metadata for auditability but does not perform external provider calls.",
    }),
  };
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "release:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read deployment readiness." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query deployment readiness for another tenant." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const environment = buildEnvironmentSnapshot("production");
  if (actor.source === "local-fallback") {
    return NextResponse.json(buildPayload(actor, environment), { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const audit = await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: actor.actorUserId,
        action: "deployment:readiness:read",
        entityType: "DeploymentReadiness",
        metadata: {
          source: actor.source,
          targetEnvironment: "production",
          productionBlocked: environment.productionBlocked,
          missingRequiredNames: environment.missingRequiredNames,
          redactedFields: ["DATABASE_URL", "DIRECT_URL", "AUTH_SECRET", "STRIPE_SECRET_KEY", "SENTRY_AUTH_TOKEN", "VERCEL_TOKEN"],
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ ...buildPayload(actor, environment), auditId: audit.id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json({ ...buildPayload(actor, environment), warning: "Database unavailable; deployment readiness read audit was not persisted." }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ ok: false, error: { code: "DEPLOYMENT_READINESS_READ_FAILED", message: "Deployment readiness could not be loaded." } }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "release:write");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to trigger deployment operations." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Deployment readiness body must be valid JSON." } }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const parsed = deploymentReadinessMutationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Deployment readiness payload did not pass schema.",
          issues: parsed.error.flatten(),
        },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const input = parsed.data;
  const policy = operationPolicies[input.operation];
  const environment = buildEnvironmentSnapshot(input.targetEnvironment);

  if (actor.source === "local-fallback") {
    return NextResponse.json(buildPostSuccessPayload(actor, input, undefined, environment), { status: policy.statusCode, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const audit = await prisma.auditLog.create({
      data: {
        tenantId: actor.tenantId,
        actorUserId: actor.actorUserId,
        action: `deployment:${input.operation}`,
        entityType: "DeploymentReadiness",
        metadata: {
          operation: input.operation,
          targetEnvironment: input.targetEnvironment,
          reason: input.reason,
          requestId: input.requestId,
          blockerIds: input.blockerIds ?? [],
          source: actor.source,
          implemented: policy.implemented,
        },
      },
    });

    const payload = buildPostSuccessPayload(actor, input, audit.id, environment);
    return NextResponse.json(payload, { status: policy.statusCode, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(buildPostSuccessPayload(actor, input, undefined, environment), { status: 200, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ ok: false, error: { code: "DEPLOYMENT_READINESS_FAILED", message: "Could not persist deployment readiness request." } }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
